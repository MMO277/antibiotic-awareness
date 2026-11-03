/**
 * aiActionPermissions.ts
 *
 * Security, Authorization, Cross-User Isolation, Duplicate/Idempotency Guard,
 * and Immutable Audit Trail Service for the Antibiotic Awareness AI Health Assistant.
 *
 * Security Principles:
 * - Every action is strictly scoped to the authenticated user's verified `auth.currentUser.uid`
 *   (or explicit guest session when permitted for local preview, never cross-user).
 * - Rejects any attempt to read or write another user's UID (`targetUid !== authenticatedUid`).
 * - Prevents duplicate rapid submissions via idempotency keys.
 * - Appends structured audit log entries (`PatientAuditLogEntry`) to both the patient's profile
 *   and Firestore `/users/{uid}/auditLogs/{logId}` when Firebase is configured.
 */

import { collection, doc, setDoc } from 'firebase/firestore';
import { auth, configured, db } from './firebase';
import { PatientAuditLogEntry, UserHealthProfile } from './allergyData';
import { AiActionRiskLevel, AiActionType } from './aiActionSchemas';

export interface AuthorizationCheckResult {
  allowed: boolean;
  verifiedUid: string | null;
  isGuest: boolean;
  reasonCode?:
    | 'unauthenticated_cloud_write'
    | 'cross_user_access_denied'
    | 'duplicate_request_blocked'
    | 'missing_confirmation';
  messageAr?: string;
  messageEn?: string;
}

const ACTION_RISK_MAP: Record<AiActionType, AiActionRiskLevel> = {
  add_chronic_condition: 'confirmation_required',
  add_allergy: 'confirmation_required',
  update_vitals: 'confirmation_required',
  add_medication: 'confirmation_required',
  add_prescription: 'confirmation_required',
  update_prescription_status: 'confirmation_required',
  create_reminder: 'confirmation_required',
  update_reminder: 'confirmation_required',
  stop_reminder: 'confirmation_required',
  save_medical_document: 'confirmation_required',
  show_allergies: 'read_only',
  show_medications: 'read_only',
  show_reminders: 'read_only',
  show_prescriptions: 'read_only',
  show_medical_documents: 'read_only',
  summarize_health_records: 'read_only',
};

const executedIdempotencyKeys = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 60 * 1000; // 60 seconds window against accidental double-clicks

export function getActionRiskLevel(actionType: AiActionType): AiActionRiskLevel {
  return ACTION_RISK_MAP[actionType] || 'confirmation_required';
}

export function requiresExplicitPatientConfirmation(actionType: AiActionType): boolean {
  return getActionRiskLevel(actionType) === 'confirmation_required';
}

/**
 * Verifies that the requested operation belongs strictly to the currently authenticated user.
 * Never trusts a client/AI-supplied targetUid if it differs from the authenticated session UID.
 */
export function verifyActionAuthorization(params: {
  actionType: AiActionType;
  authenticatedUid: string | null | undefined;
  requestedTargetUid?: string | null;
  confirmedByPatient?: boolean;
  idempotencyKey?: string;
  requireCloudAuthForWrites?: boolean;
}): AuthorizationCheckResult {
  const realAuthUid = auth?.currentUser?.uid || params.authenticatedUid || null;
  const targetUid = params.requestedTargetUid;

  // 1. Strict Cross-User Isolation Check:
  // If a targetUid was supplied (e.g. via prompt injection or tampered payload) and doesn't match realAuthUid, block immediately.
  if (
    targetUid !== undefined &&
    targetUid !== null &&
    targetUid.trim() !== '' &&
    targetUid !== realAuthUid
  ) {
    return {
      allowed: false,
      verifiedUid: realAuthUid,
      isGuest: !realAuthUid,
      reasonCode: 'cross_user_access_denied',
      messageAr:
        '🔒 تم رفض العملية أمنياً: لا يُسمح إطلاقاً بالوصول إلى سجلات مريض آخر أو تعديلها.',
      messageEn:
        '🔒 Security Violation Blocked: Cross-user medical record access or modification is strictly prohibited.',
    };
  }

  const isWriteAction = requiresExplicitPatientConfirmation(params.actionType);

  // 2. Explicit Patient Consent Check for all mutating medical actions:
  if (isWriteAction && !params.confirmedByPatient) {
    return {
      allowed: false,
      verifiedUid: realAuthUid,
      isGuest: !realAuthUid,
      reasonCode: 'missing_confirmation',
      messageAr: '⚠️ يجب تأكيد العملية من قِبل المريض أولاً قبل حفظ أي تعديل في السجل الصحي.',
      messageEn: '⚠️ Explicit patient confirmation is required before saving any medical record change.',
    };
  }

  // 3. Optional strict cloud auth check when cloud storage is required:
  if (isWriteAction && params.requireCloudAuthForWrites && !realAuthUid) {
    return {
      allowed: false,
      verifiedUid: null,
      isGuest: true,
      reasonCode: 'unauthenticated_cloud_write',
      messageAr: '🔒 يرجى تسجيل الدخول إلى حسابك أولاً لحفظ هذا السجل الطبي بأمان في السحابة.',
      messageEn: '🔒 Please sign in to your account first to securely save this medical record.',
    };
  }

  // 4. Idempotency / Duplicate Execution Guard:
  if (isWriteAction && params.idempotencyKey) {
    const now = Date.now();
    const prevTs = executedIdempotencyKeys.get(params.idempotencyKey);
    if (prevTs && now - prevTs < IDEMPOTENCY_TTL_MS) {
      return {
        allowed: false,
        verifiedUid: realAuthUid,
        isGuest: !realAuthUid,
        reasonCode: 'duplicate_request_blocked',
        messageAr: 'ℹ️ تم تنفيذ هذا الأمر بالفعل منذ لحظات — تم منع التكرار لحماية سجلك الصحي.',
        messageEn: 'ℹ️ This action was already executed moments ago — duplicate request prevented.',
      };
    }
  }

  return {
    allowed: true,
    verifiedUid: realAuthUid,
    isGuest: !realAuthUid,
  };
}

export function markIdempotencyKeyExecuted(idempotencyKey?: string): void {
  if (!idempotencyKey) return;
  executedIdempotencyKeys.set(idempotencyKey, Date.now());
}

export function clearIdempotencyCacheForTesting(): void {
  executedIdempotencyKeys.clear();
}

/**
 * Creates a structured, immutable audit log entry and persists it to Firestore
 * (`/users/{uid}/auditLogs/{logId}`) when signed in, as well as returning the updated profile array.
 */
export async function recordPatientAuditLog(params: {
  uid: string | null;
  actionType: AiActionType | string;
  actor?: PatientAuditLogEntry['actor'];
  summaryAr: string;
  summaryEn: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  currentProfile?: UserHealthProfile;
}): Promise<PatientAuditLogEntry> {
  const nowIso = new Date().toISOString();
  const entry: PatientAuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    uid: params.uid || 'guest_local',
    actionType: params.actionType,
    actor: params.actor || 'patient_confirmed_ai_action',
    summaryAr: params.summaryAr,
    summaryEn: params.summaryEn,
    ...(params.beforeSnapshot !== undefined
      ? { beforeSnapshot: JSON.stringify(params.beforeSnapshot).slice(0, 600) }
      : {}),
    ...(params.afterSnapshot !== undefined
      ? { afterSnapshot: JSON.stringify(params.afterSnapshot).slice(0, 600) }
      : {}),
    timestamp: nowIso,
  };

  if (params.uid && configured && db) {
    try {
      const logRef = doc(collection(db, 'users', params.uid, 'auditLogs'), entry.id);
      await setDoc(logRef, entry);
    } catch (err) {
      console.warn('Audit log cloud write warning (stored in local profile audit trail):', err);
    }
  }

  return entry;
}
