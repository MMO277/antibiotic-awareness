import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import { useAuth } from './authContext';
import { AllergyRecord, checkDrugAllergySafety } from './allergyData';

export type DoseStatus = 'upcoming' | 'taken' | 'missed' | 'unconfirmed';

export type DoseDocumentedOutcome =
  | 'taken_on_time'
  | 'taken_late'
  | 'missed_confirmed'
  | 'held_for_clarification'
  | 'skipped_clinician_advice';

export type PrescriptionCaptureMethod =
  | 'manual_entry'
  | 'ocr_upload'
  | 'camera_capture'
  | 'scanner_import';

export type PrescriptionVerificationStatus =
  | 'unverified_ocr'
  | 'needs_clarification'
  | 'verified_by_patient';

export type ClarificationFlagCode =
  | 'missing_medicine'
  | 'missing_dose'
  | 'missing_route'
  | 'missing_frequency'
  | 'missing_duration'
  | 'contradictory_frequency'
  | 'contradictory_route_form'
  | 'contradictory_duration'
  | 'duplicate_dose_times'
  | 'allergy_conflict'
  | 'cross_allergy_risk'
  | 'severe_drug_interaction'
  | 'duplicate_active_course';

export interface ClarificationFlag {
  code: ClarificationFlagCode;
  severity: 'blocking' | 'warning';
  messageAr: string;
  messageEn: string;
}

export type CloudSyncStatus =
  | 'loading'
  | 'synced'
  | 'saving'
  | 'offline_pending'
  | 'local_only'
  | 'error';

export type RadarFrequency = 'q24h' | 'q12h' | 'q8h' | 'q6h';

export interface ScheduledDose {
  id: string;
  scheduleId: string;
  dayNumber: number;
  doseNumberInDay: number;
  scheduledTime: string; // Local ISO string "YYYY-MM-DDTHH:mm:ss"
  status: DoseStatus;
  takenAt?: string;
  missedAt?: string;
  statusUpdatedAt?: string;
  documentedOutcome?: DoseDocumentedOutcome;
  note?: string;
}

export interface SavedPrescription {
  id: string;
  antibioticId?: string;
  medicineName: string;
  prescribedDose: string;
  route: string; // '' when unverified/missing from OCR
  frequency: string; // '' when unverified/missing from OCR
  firstDoseTime?: string;
  doseTimes?: string[];
  startDate?: string;
  durationDays: number | null; // null when unverified/missing from OCR
  notes?: string;
  coMedications?: string[];
  captureMethod: PrescriptionCaptureMethod;
  rawExtractedText?: string;
  imageFileName?: string;
  isOcrUnverified: boolean;
  verificationStatus: PrescriptionVerificationStatus;
  verifiedAt?: string;
  verifiedByPatient?: boolean;
  clarificationFlags: ClarificationFlag[];
  linkedScheduleId?: string;
  createdAt: string;
  updatedAt: string;
}

export type TreatmentJourneyEventType =
  | 'prescription_captured'
  | 'ocr_extracted_unverified'
  | 'clarification_flagged'
  | 'prescription_verified'
  | 'schedule_created'
  | 'schedule_updated'
  | 'schedule_deleted'
  | 'dose_taken'
  | 'dose_missed'
  | 'dose_documented'
  | 'dose_undone'
  | 'duplicate_dose_blocked';

export interface TreatmentJourneyEvent {
  id: string;
  type: TreatmentJourneyEventType;
  timestamp: string;
  prescriptionId?: string;
  scheduleId?: string;
  doseId?: string;
  medicineName?: string;
  scheduledTime?: string;
  actualTime?: string;
  summaryAr: string;
  summaryEn: string;
}

export interface TreatmentSchedule {
  id: string;
  prescriptionId?: string;
  antibioticId?: string;
  medicineName: string;
  prescribedDose: string;
  route: string;
  frequency: string;
  firstDoseTime?: string; // e.g. "09:00"
  doseTimes: string[]; // e.g. ["09:00", "21:00"]
  startDate: string; // "YYYY-MM-DD"
  durationDays: number;
  endDate: string; // "YYYY-MM-DD"
  notes?: string;
  coMedications?: string[];
  coMedNotes?: string;
  captureMethod?: PrescriptionCaptureMethod;
  verificationStatus?: PrescriptionVerificationStatus;
  verifiedAt?: string;
  verifiedByPatient?: boolean;
  clarificationFlags?: ClarificationFlag[];
  rawExtractedText?: string;
  createdAt: string;
  updatedAt: string;
  doses: ScheduledDose[];
}

export interface RadarWorkspaceState {
  selectedAbx: string;
  frequency: RadarFrequency;
  firstDoseTime: string; // "HH:mm"
  selectedCoMeds: string[];
  updatedAt: string;
}

export interface DoseUpdateResult {
  updated: boolean;
  reason?: 'already_recorded' | 'rapid_duplicate_taken_warning' | 'not_found';
  messageAr?: string;
  messageEn?: string;
}

export const STORAGE_KEY = 'antibiotic_treatment_tracker_schedules';
export const DELETED_SCHEDULES_KEY = 'antibiotic_treatment_tracker_deleted';
export const PRESCRIPTIONS_STORAGE_KEY = 'aa_patient_saved_prescriptions';
export const DELETED_PRESCRIPTIONS_KEY = 'aa_patient_deleted_prescriptions';
export const TREATMENT_EVENTS_STORAGE_KEY = 'aa_patient_treatment_events';
export const RADAR_WORKSPACE_KEY = 'aa_prescription_radar_workspace';
export const NOTIF_FIRED_STORAGE_KEY = 'aa_fired_dose_notifications';
const MIGRATED_LEGACY_SCHEDULES_PREFIX = 'aa_migrated_legacy_schedules_';
const SCHEDULES_EVENT = 'aa-tracker-schedules-updated';
const MAX_TREATMENT_EVENTS = 250;

export const DEFAULT_RADAR_WORKSPACE: RadarWorkspaceState = {
  selectedAbx: 'ciprofloxacin',
  frequency: 'q12h',
  firstDoseTime: '08:00',
  selectedCoMeds: ['calcium_dairy', 'iron_zinc', 'probiotics', 'paracetamol'],
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export function formatTimestampReadable(iso?: string, isAr = true): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.replace('T', ' ').slice(0, 16);
  }
}

export function formatRouteLabel(route: string, isAr = true): string {
  switch (route) {
    case 'oral':
      return isAr ? 'أقراص / كبسول فموي' : 'Oral Tablet/Capsule';
    case 'suspension':
      return isAr ? 'شراب معلق' : 'Oral Suspension';
    case 'injection':
      return isAr ? 'حقن (وريد/عضل)' : 'Injection';
    case 'topical':
      return isAr ? 'موضعي (كريم/مرهم)' : 'Topical';
    case '':
      return isAr ? 'غير محدد (يحتاج توضيح)' : 'Unspecified (Needs Clarification)';
    default:
      return route;
  }
}

export function formatFrequencyLabel(freq: string, isAr = true): string {
  switch (freq) {
    case 'once_daily':
    case 'q24h':
      return isAr ? 'مرة واحدة يومياً (كل 24 ساعة)' : 'Once daily (every 24h)';
    case 'twice_daily':
    case 'q12h':
      return isAr ? 'مرتين يومياً (كل 12 ساعة)' : 'Twice daily (every 12h)';
    case 'thrice_daily':
    case 'q8h':
      return isAr ? '3 مرات يومياً (كل 8 ساعات)' : '3 times daily (every 8h)';
    case 'four_times_daily':
    case 'q6h':
      return isAr ? '4 مرات يومياً (كل 6 ساعات)' : '4 times daily (every 6h)';
    case '':
      return isAr ? 'غير محدد (يحتاج توضيح)' : 'Unspecified (Needs Clarification)';
    default:
      return freq;
  }
}

export function formatVerificationStatusLabel(
  status?: PrescriptionVerificationStatus,
  isAr = true
): string {
  switch (status) {
    case 'verified_by_patient':
      return isAr
        ? '✅ موثّقة ومؤكدة من الروشتة الورقية'
        : '✅ Verified Against Physical Prescription';
    case 'unverified_ocr':
      return isAr
        ? '⚠️ مستخرجة بالـ OCR — غير موثّقة (تتطلب المراجعة)'
        : '⚠️ Unverified OCR Extraction — Requires Review';
    case 'needs_clarification':
      return isAr
        ? '🚨 تحتاج توضيحاً مهنياً من الطبيب أو الصيدلي'
        : '🚨 Flagged for Doctor / Pharmacist Clarification';
    default:
      return isAr
        ? '✅ مدخلة ومؤكدة بواسطة المريض'
        : '✅ Patient-Entered & Confirmed';
  }
}

export function formatCaptureMethodLabel(
  method?: PrescriptionCaptureMethod,
  isAr = true
): string {
  switch (method) {
    case 'ocr_upload':
      return isAr ? 'رفع صورة روشتة (OCR)' : 'Prescription Image Upload (OCR)';
    case 'camera_capture':
      return isAr ? 'التقاط بالكاميرا (OCR)' : 'Camera Capture (OCR)';
    case 'scanner_import':
      return isAr ? 'استيراد من الماسح الذكي' : 'Imported from Smart Scanner';
    case 'manual_entry':
    default:
      return isAr ? 'إدخال يدوي مباشر' : 'Direct Manual Entry';
  }
}

export function formatDocumentedOutcomeLabel(
  outcome?: DoseDocumentedOutcome,
  isAr = true
): string {
  switch (outcome) {
    case 'taken_on_time':
      return isAr ? 'أُخذت في موعدها' : 'Taken on schedule';
    case 'taken_late':
      return isAr ? 'أُخذت متأخرة' : 'Taken late';
    case 'missed_confirmed':
      return isAr ? 'جرعة فائتة مؤكدة' : 'Confirmed missed dose';
    case 'held_for_clarification':
      return isAr ? 'مؤجلة لحين استشارة الطبيب/الصيدلي' : 'Held pending clinician clarification';
    case 'skipped_clinician_advice':
      return isAr ? 'تم إيقافها/تخطيها بتوجيه الطبيب' : 'Skipped per clinician advice';
    default:
      return '';
  }
}

/**
 * Adds minutes to an "HH:mm" time string and wraps around 24 hours.
 */
export function addMinutesToTime(hhmm: string, minutesToAdd: number): string {
  const parts = (hhmm || '08:00').split(':').map(Number);
  const baseH = !isNaN(parts[0]) ? parts[0] : 8;
  const baseM = !isNaN(parts[1]) ? parts[1] : 0;
  const totalMinutes = (((baseH * 60 + baseM + minutesToAdd) % 1440) + 1440) % 1440;
  const outH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const outM = String(totalMinutes % 60).padStart(2, '0');
  return `${outH}:${outM}`;
}

export function getExpectedDosesPerDay(freq: string): number | null {
  switch (freq) {
    case 'once_daily':
    case 'q24h':
      return 1;
    case 'twice_daily':
    case 'q12h':
      return 2;
    case 'thrice_daily':
    case 'q8h':
      return 3;
    case 'four_times_daily':
    case 'q6h':
      return 4;
    default:
      return null;
  }
}

/**
 * Automatically calculates all daily dose times starting from `firstDoseTime`
 * divided evenly across 24 hours based on `dosesPerDay` (1, 2, 3, or 4) or frequency key.
 */
export function calculateAutoDoseTimes(
  firstDoseTime: string,
  dosesCountOrFreq: number | string
): string[] {
  const cleanStart = /^\d{2}:\d{2}$/.test(firstDoseTime) ? firstDoseTime : '08:00';
  let count = 2;
  if (typeof dosesCountOrFreq === 'number') {
    count = Math.max(1, Math.min(6, Math.round(dosesCountOrFreq)));
  } else {
    if (dosesCountOrFreq === 'once_daily' || dosesCountOrFreq === 'q24h') count = 1;
    else if (dosesCountOrFreq === 'twice_daily' || dosesCountOrFreq === 'q12h') count = 2;
    else if (dosesCountOrFreq === 'thrice_daily' || dosesCountOrFreq === 'q8h') count = 3;
    else if (dosesCountOrFreq === 'four_times_daily' || dosesCountOrFreq === 'q6h') count = 4;
  }

  const intervalMinutes = Math.round((24 * 60) / count);
  const times: string[] = [];
  for (let i = 0; i < count; i++) {
    times.push(addMinutesToTime(cleanStart, i * intervalMinutes));
  }
  return times;
}

/**
 * Formats an "HH:mm" 24-hour string into a friendly 12-hour Arabic or English time string.
 */
export function formatTime12Hour(hhmm: string, isAr = true): string {
  const parts = (hhmm || '08:00').split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return hhmm;
  const h24 = parts[0];
  const m = String(parts[1]).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const hStr = String(h12).padStart(2, '0');

  if (isAr) {
    let periodAr = 'صباحاً';
    if (h24 === 0 && parts[1] === 0) periodAr = 'منتصف الليل';
    else if (h24 === 12) periodAr = 'ظهراً';
    else if (h24 > 12 && h24 < 17) periodAr = 'عصراً';
    else if (h24 >= 17) periodAr = 'مساءً';
    return `${hStr}:${m} ${periodAr}`;
  } else {
    const periodEn = h24 >= 12 ? 'PM' : 'AM';
    return `${hStr}:${m} ${periodEn}`;
  }
}

export function formatLocalDateYYYYMMDD(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeEndDate(startDateStr: string, durationDays: number): string {
  const parts = startDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return formatLocalDateYYYYMMDD();
  }
  const [startYear, startMonth, startDay] = parts;
  const endObj = new Date(startYear, startMonth - 1, startDay + Math.max(1, durationDays) - 1);
  return formatLocalDateYYYYMMDD(endObj);
}

export interface PrescriptionValidationInput {
  antibioticId?: string;
  medicineName: string;
  prescribedDose: string;
  route: string;
  frequency: string;
  doseTimes?: string[];
  durationDays: number | null | undefined;
  notes?: string;
  coMedications?: string[];
  rawExtractedText?: string;
  isOcrUnverified?: boolean;
  verifiedByPatient?: boolean;
  editingScheduleId?: string | null;
}

export interface PrescriptionValidationResult {
  flags: ClarificationFlag[];
  blockingFlags: ClarificationFlag[];
  warningFlags: ClarificationFlag[];
  hasBlockingFlags: boolean;
  canCreateSchedule: boolean;
  verificationStatus: PrescriptionVerificationStatus;
}

function isPlaceholderOrUnreadable(value?: string | null): boolean {
  const v = (value || '').trim().toLowerCase();
  if (!v) return true;
  return (
    v === '?' ||
    v === '??' ||
    v === 'unknown' ||
    v === 'unreadable' ||
    v === 'missing' ||
    v === 'n/a' ||
    v === 'none' ||
    v === 'غير واضح' ||
    v === 'غير مقروء' ||
    v === 'غير محدد' ||
    v === 'غير مذكور'
  );
}

/**
 * Prescription Verification & Contradiction Detection Engine:
 * - Never invents a medication dose, frequency, duration, or administration route.
 * - Flags missing or contradictory instructions for professional clarification.
 * - Integrates with the patient's allergy profile and co-medication safety rules.
 * - Allows treatment scheduling ONLY after instructions are complete, non-contradictory,
 *   and explicitly verified by the patient.
 */
export function validatePrescriptionInstructions(
  input: PrescriptionValidationInput,
  existingSchedules: TreatmentSchedule[] = [],
  patientAllergies: AllergyRecord[] = []
): PrescriptionValidationResult {
  const flags: ClarificationFlag[] = [];

  const medName = (input.medicineName || '').trim();
  const dose = (input.prescribedDose || '').trim();
  const route = (input.route || '').trim();
  const freq = (input.frequency || '').trim();
  const notes = (input.notes || '').trim();
  const combinedText = `${dose} ${notes} ${input.rawExtractedText || ''}`.trim();

  // 1. Missing required fields (never invent defaults)
  if (isPlaceholderOrUnreadable(medName)) {
    flags.push({
      code: 'missing_medicine',
      severity: 'blocking',
      messageAr: 'اسم المضاد الحيوي مفقود أو غير مقروء في الروشتة — يجب التأكد منه من الطبيب أو الصيدلي.',
      messageEn: 'Prescribed antibiotic name is missing or unreadable — clarify with your doctor or pharmacist.',
    });
  }

  if (isPlaceholderOrUnreadable(dose) || !/\d/.test(dose)) {
    flags.push({
      code: 'missing_dose',
      severity: 'blocking',
      messageAr:
        'الجرعة الموصوفة أو التركيز غير مكتوب بوضوح (يجب أن تتضمن كمية/تركيزاً محدداً مثل 500 مجم أو 5 مل). التطبيق لا يفترض جرعات تلقائياً.',
      messageEn:
        'Prescribed dose/strength is missing or incomplete (must include an explicit strength/amount such as 500 mg or 5 mL). Never guess a dose.',
    });
  }

  if (
    isPlaceholderOrUnreadable(route) ||
    !['oral', 'suspension', 'injection', 'topical'].includes(route)
  ) {
    flags.push({
      code: 'missing_route',
      severity: 'blocking',
      messageAr: 'طريقة الاستعمال (أقراص / شراب / حقن / موضعي) غير محددة — يرجى مراجعة الروشتة أو الصيدلي.',
      messageEn: 'Administration route (oral, suspension, injection, or topical) is missing — please clarify.',
    });
  }

  const expectedDosesPerDay = getExpectedDosesPerDay(freq);
  if (isPlaceholderOrUnreadable(freq) || expectedDosesPerDay === null) {
    flags.push({
      code: 'missing_frequency',
      severity: 'blocking',
      messageAr: 'عدد الجرعات اليومية (التكرار الزمني) غير محدد — لا يمكن جدولة الجرعات بدون تكرار واضح.',
      messageEn: 'Dosing frequency is missing or unrecognized — cannot schedule doses without verified frequency.',
    });
  }

  const dur = input.durationDays;
  if (dur === null || dur === undefined || Number.isNaN(Number(dur))) {
    flags.push({
      code: 'missing_duration',
      severity: 'blocking',
      messageAr: 'مدة الكورس العلاجي بالأيام غير محددة في الروشتة — يرجى استشارة الطبيب أو الصيدلي لتأكيد المدة.',
      messageEn: 'Course duration in days is missing — please clarify the prescribed duration with your clinician.',
    });
  } else if (dur < 1 || dur > 60 || !Number.isInteger(Number(dur))) {
    flags.push({
      code: 'contradictory_duration',
      severity: 'blocking',
      messageAr: 'مدة الكورس المدخلة غير منطقية سريرياً (يجب أن تكون عدداً صحيحاً بين 1 و 60 يوماً حسب الروشتة).',
      messageEn: 'Course duration is outside valid clinical bounds (must be an integer between 1 and 60 days).',
    });
  }

  // 2. Contradictory Route vs Dosage Form checks
  const doseAndNotes = `${dose} ${notes}`;
  if (route === 'oral') {
    if (/(\bvial\b|ampoule|\bamp\b|injection|\biv\b|\bim\b|حقن|حقنة|أمبول|امبول|فيال|وريد|عضل)/i.test(doseAndNotes)) {
      flags.push({
        code: 'contradictory_route_form',
        severity: 'blocking',
        messageAr:
          'تعارض في التعليمات: تم اختيار طريقة الاستعمال «أقراص/كبسول فموي» بينما تذكر الجرعة أو الملاحظات «حقن/فيال/أمبول». يرجى مراجعة الطبيب أو الصيدلي.',
        messageEn:
          'Contradictory instructions: Route is set to "Oral Tablet/Capsule" while the dose/notes specify an injection/vial/ampoule. Please clarify with a professional.',
      });
    } else if (/(\bcream\b|ointment|topical|كريم|مرهم|دهان)/i.test(doseAndNotes)) {
      flags.push({
        code: 'contradictory_route_form',
        severity: 'blocking',
        messageAr:
          'تعارض في التعليمات: تم اختيار «فموي» بينما تذكر الجرعة أو الملاحظات «كريم/مرهم موضعي».',
        messageEn:
          'Contradictory instructions: Route is set to "Oral" while dose/notes specify a topical cream/ointment.',
      });
    }
  } else if (route === 'injection') {
    if (/(tablet|tablets|capsule|capsules|\bsyrup\b|suspension|قرص|أقراص|اقراص|كبسول|كبسولة|شراب|معلق)/i.test(doseAndNotes)) {
      flags.push({
        code: 'contradictory_route_form',
        severity: 'blocking',
        messageAr:
          'تعارض في التعليمات: تم اختيار طريقة الاستعمال «حقن» بينما تذكر الجرعة أو الملاحظات «أقراص/كبسول/شراب فموي».',
        messageEn:
          'Contradictory instructions: Route is set to "Injection" while dose/notes specify oral tablets, capsules, or syrup.',
      });
    }
  } else if (route === 'topical') {
    if (/(tablet|capsule|\bvial\b|ampoule|injection|قرص|أقراص|كبسول|حقن|أمبول|فيال)/i.test(doseAndNotes)) {
      flags.push({
        code: 'contradictory_route_form',
        severity: 'blocking',
        messageAr:
          'تعارض في التعليمات: تم اختيار طريقة الاستعمال «موضعي» بينما تذكر الجرعة أو الملاحظات «أقراص/كبسول/حقن».',
        messageEn:
          'Contradictory instructions: Route is set to "Topical" while dose/notes specify tablets, capsules, or injections.',
      });
    }
  } else if (route === 'suspension') {
    if (/(tablet|capsule|\bvial\b|ampoule|\bcream\b|ointment|قرص|أقراص|كبسول|حقن|فيال|كريم|مرهم)/i.test(doseAndNotes)) {
      flags.push({
        code: 'contradictory_route_form',
        severity: 'blocking',
        messageAr:
          'تعارض في التعليمات: تم اختيار «شراب معلق» بينما تذكر الجرعة أو الملاحظات شكلاً دوائياً مختلفاً (أقراص/حقن/مرهم).',
        messageEn:
          'Contradictory instructions: Route is set to "Oral Suspension" while dose/notes specify tablets, injections, or ointment.',
      });
    }
  }

  // 3. Contradictory Frequency vs Dose Times / Written Text checks
  if (expectedDosesPerDay !== null) {
    if (Array.isArray(input.doseTimes) && input.doseTimes.length > 0) {
      if (input.doseTimes.length !== expectedDosesPerDay) {
        flags.push({
          code: 'contradictory_frequency',
          severity: 'blocking',
          messageAr: `تعارض في عدد المواعيد اليومية: التكرار المحدد (${expectedDosesPerDay} مرات يومياً) لا يطابق عدد مواعيد الجرعات المدخلة (${input.doseTimes.length}).`,
          messageEn: `Contradictory schedule: Selected frequency (${expectedDosesPerDay}/day) does not match the number of dose times (${input.doseTimes.length}).`,
        });
      }
      const uniqueTimes = new Set(input.doseTimes.map((t) => t.trim()));
      if (uniqueTimes.size !== input.doseTimes.length) {
        flags.push({
          code: 'duplicate_dose_times',
          severity: 'blocking',
          messageAr: 'يوجد تكرار لنفس التوقيت مرتين في مواعيد الجرعات اليومية — يمنع النظام جدولة جرعتين في نفس اللحظة.',
          messageEn: 'Duplicate daily dose times detected — two doses cannot be scheduled at the exact same clock time.',
        });
      }
    }

    const mentionsOnce = /(once\s*daily|every\s*24\s*(?:h|hr|hours)|\bq24h\b|مرة\s*واحدة\s*يوميا|كل\s*24\s*ساع)/i.test(combinedText);
    const mentionsTwice = /(twice\s*daily|every\s*12\s*(?:h|hr|hours)|\bq12h\b|\bbid\b|مرتين\s*يوميا|كل\s*12\s*ساع)/i.test(combinedText);
    const mentionsThrice = /(thrice\s*daily|three\s*times\s*daily|every\s*8\s*(?:h|hr|hours)|\bq8h\b|\btid\b|3\s*مرات\s*يوميا|ثلاث\s*مرات|كل\s*8\s*ساع)/i.test(combinedText);
    const mentionsFour = /(four\s*times\s*daily|every\s*6\s*(?:h|hr|hours)|\bq6h\b|\bqid\b|4\s*مرات\s*يوميا|أربع\s*مرات|كل\s*6\s*ساع)/i.test(combinedText);

    const textCounts: number[] = [];
    if (mentionsOnce) textCounts.push(1);
    if (mentionsTwice) textCounts.push(2);
    if (mentionsThrice) textCounts.push(3);
    if (mentionsFour) textCounts.push(4);

    if (textCounts.length > 1 || (textCounts.length === 1 && textCounts[0] !== expectedDosesPerDay)) {
      flags.push({
        code: 'contradictory_frequency',
        severity: 'blocking',
        messageAr:
          'تعارض في تكرار الجرعة: النص المكتوب في الجرعة أو الملاحظات يذكر تكراراً زمنياً مختلفاً عن عدد الجرعات اليومية المحدد. يرجى التأكد من الصيدلي أو الطبيب.',
        messageEn:
          'Contradictory dosing frequency: The written dose/notes mention a different daily interval than the selected frequency. Please clarify with your doctor or pharmacist.',
      });
    }
  }

  // 4. Contradictory Duration in written notes vs durationDays field
  if (typeof dur === 'number' && dur >= 1 && dur <= 60) {
    const durMatch = combinedText.match(/(?:for|لمدة|لمده)\s*(\d{1,2})\s*(?:days?|أيام|ايام|يوم)/i);
    if (durMatch) {
      const writtenDays = parseInt(durMatch[1], 10);
      if (!isNaN(writtenDays) && writtenDays !== dur) {
        flags.push({
          code: 'contradictory_duration',
          severity: 'blocking',
          messageAr: `تعارض في مدة العلاج: الملاحظات تذكر (${writtenDays} أيام) بينما حقل المدة مضبوط على (${dur} أيام). يرجى توحيد المدة حسب الروشتة.`,
          messageEn: `Contradictory duration: Written instructions state ${writtenDays} days while the duration field is set to ${dur} days. Please clarify.`,
        });
      }
    }
  }

  // 5. Patient Allergy Safety Engine check
  if (input.antibioticId && patientAllergies.length > 0) {
    const allergyRes = checkDrugAllergySafety(input.antibioticId, patientAllergies);
    if (allergyRes.matchLevel === 'exact_match') {
      flags.push({
        code: 'allergy_conflict',
        severity: 'blocking',
        messageAr: `🚨 خطر حساسية دوائية مسجلة: هذا الدواء يتطابق مع سجل حساسيتك (${allergyRes.matchedAllergy?.drugName || ''}). لا تبدأ الجدول العلاجي وراجع الطبيب فوراً!`,
        messageEn: `🚨 Documented Allergy Conflict: This antibiotic matches your recorded allergy (${allergyRes.matchedAllergy?.drugName || ''}). Do not start this schedule; contact your physician immediately!`,
      });
    } else if (allergyRes.matchLevel === 'cross_reactivity') {
      flags.push({
        code: 'cross_allergy_risk',
        severity: 'warning',
        messageAr: `⚠️ تنبيه حساسية متصالبة (بيتا-لاكتام): لديك حساسية مسجلة من (${allergyRes.matchedAllergy?.drugName || ''}). تأكد من موافقة الطبيب قبل الاستخدام.`,
        messageEn: `⚠️ Beta-Lactam Cross-Reactivity Warning: You have a recorded allergy to (${allergyRes.matchedAllergy?.drugName || ''}). Verify safety with your physician.`,
      });
    }
  }

  // 6. Severe Co-Medication Interaction check
  const coMeds = input.coMedications || [];
  const abxId = (input.antibioticId || '').toLowerCase();
  if (
    coMeds.includes('warfarin') &&
    ['metronidazole', 'clarithromycin', 'erythromycin', 'ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'co-trimoxazole'].includes(abxId)
  ) {
    flags.push({
      code: 'severe_drug_interaction',
      severity: 'warning',
      messageAr: '🚨 تداخل دوائي عالي الخطورة مع الوارفارين (أدوية السيولة): يرفع خطر النزيف ويتطلب مراجعة الطبيب لمتابعة تحليل INR.',
      messageEn: '🚨 High-risk interaction with Warfarin: Increases bleeding risk and requires physician INR monitoring.',
    });
  }
  if (coMeds.includes('statins') && ['clarithromycin', 'erythromycin'].includes(abxId)) {
    flags.push({
      code: 'severe_drug_interaction',
      severity: 'warning',
      messageAr: '🚨 تداخل خطير مع أدوية الكوليسترول (Statins): كلاريثرومايسين/إريثرومايسين يثبطان تكسير الدواء ويرفعان خطر انحلال العضلات — استشر الطبيب أو الصيدلي.',
      messageEn: '🚨 Severe CYP3A4 interaction with Statins: Clarithromycin/Erythromycin increase myopathy risk — consult your doctor or pharmacist.',
    });
  }
  if (coMeds.includes('nsaids') && ['ciprofloxacin', 'levofloxacin', 'moxifloxacin'].includes(abxId)) {
    flags.push({
      code: 'severe_drug_interaction',
      severity: 'warning',
      messageAr: '⚠️ تحذير تداخل: الجمع بين الفلوروكينولونات والمسكنات القوية (NSAIDs) يزيد إجهاد الكلى والجهاز العصبي — استشر الطبيب.',
      messageEn: '⚠️ Interaction warning: Combining fluoroquinolones with NSAIDs increases renal and CNS risk — consult your doctor.',
    });
  }

  // 7. Duplicate active course check
  if (medName || abxId) {
    const duplicateCourse = existingSchedules.find((s) => {
      if (input.editingScheduleId && s.id === input.editingScheduleId) return false;
      const sameAbx = abxId && s.antibioticId && s.antibioticId.toLowerCase() === abxId;
      const sameName =
        medName &&
        s.medicineName.trim().toLowerCase() === medName.toLowerCase();
      return Boolean(sameAbx || sameName);
    });
    if (duplicateCourse) {
      flags.push({
        code: 'duplicate_active_course',
        severity: 'warning',
        messageAr: `⚠️ يوجد جدول علاجي آخر محفوظ لنفس الدواء (${duplicateCourse.medicineName}) — تأكد من عدم تكرار نفس المضاد الحيوي لتجنب الجرعة الزائدة.`,
        messageEn: `⚠️ Another schedule is already saved for (${duplicateCourse.medicineName}) — verify you are not duplicating therapy.`,
      });
    }
  }

  const blockingFlags = flags.filter((f) => f.severity === 'blocking');
  const warningFlags = flags.filter((f) => f.severity === 'warning');
  const hasBlockingFlags = blockingFlags.length > 0;
  const canCreateSchedule = !hasBlockingFlags && Boolean(input.verifiedByPatient);

  let verificationStatus: PrescriptionVerificationStatus = 'needs_clarification';
  if (hasBlockingFlags) {
    verificationStatus = 'needs_clarification';
  } else if (input.verifiedByPatient) {
    verificationStatus = 'verified_by_patient';
  } else if (input.isOcrUnverified) {
    verificationStatus = 'unverified_ocr';
  }

  return {
    flags,
    blockingFlags,
    warningFlags,
    hasBlockingFlags,
    canCreateSchedule,
    verificationStatus,
  };
}

export function getSchedulesStorageKey(uid?: string | null): string {
  return uid ? `${STORAGE_KEY}_${uid}` : STORAGE_KEY;
}

export function getDeletedSchedulesStorageKey(uid?: string | null): string {
  return uid ? `${DELETED_SCHEDULES_KEY}_${uid}` : DELETED_SCHEDULES_KEY;
}

export function getPrescriptionsStorageKey(uid?: string | null): string {
  return uid ? `${PRESCRIPTIONS_STORAGE_KEY}_${uid}` : PRESCRIPTIONS_STORAGE_KEY;
}

export function getDeletedPrescriptionsStorageKey(uid?: string | null): string {
  return uid ? `${DELETED_PRESCRIPTIONS_KEY}_${uid}` : DELETED_PRESCRIPTIONS_KEY;
}

export function getTreatmentEventsStorageKey(uid?: string | null): string {
  return uid ? `${TREATMENT_EVENTS_STORAGE_KEY}_${uid}` : TREATMENT_EVENTS_STORAGE_KEY;
}

export function getRadarWorkspaceStorageKey(uid?: string | null): string {
  return uid ? `${RADAR_WORKSPACE_KEY}_${uid}` : RADAR_WORKSPACE_KEY;
}

/** Strips undefined properties recursively so Firestore setDoc never throws on optional fields */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeRadarWorkspace(raw: any): RadarWorkspaceState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_RADAR_WORKSPACE };
  }
  const selectedAbx =
    typeof raw.selectedAbx === 'string' && raw.selectedAbx.trim()
      ? raw.selectedAbx.trim()
      : DEFAULT_RADAR_WORKSPACE.selectedAbx;
  const frequency: RadarFrequency = ['q24h', 'q12h', 'q8h', 'q6h'].includes(raw.frequency)
    ? raw.frequency
    : DEFAULT_RADAR_WORKSPACE.frequency;
  const firstDoseTime =
    typeof raw.firstDoseTime === 'string' && /^\d{2}:\d{2}$/.test(raw.firstDoseTime)
      ? raw.firstDoseTime
      : DEFAULT_RADAR_WORKSPACE.firstDoseTime;
  const selectedCoMeds = Array.isArray(raw.selectedCoMeds)
    ? raw.selectedCoMeds.filter((x: unknown): x is string => typeof x === 'string')
    : [...DEFAULT_RADAR_WORKSPACE.selectedCoMeds];
  const updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt
      ? raw.updatedAt
      : DEFAULT_RADAR_WORKSPACE.updatedAt;
  return { selectedAbx, frequency, firstDoseTime, selectedCoMeds, updatedAt };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeDeletedMap(raw: any): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k && typeof v === 'string' && v) {
      out[k] = v;
    }
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeClarificationFlags(raw: any): ClarificationFlag[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f) => f !== null && typeof f === 'object')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((f: any) => ({
      code: (typeof f.code === 'string' ? f.code : 'missing_dose') as ClarificationFlagCode,
      severity: (f.severity === 'blocking' ? 'blocking' : 'warning') as 'blocking' | 'warning',
      messageAr: typeof f.messageAr === 'string' ? f.messageAr : '',
      messageEn: typeof f.messageEn === 'string' ? f.messageEn : '',
    }))
    .filter((f) => Boolean(f.messageAr || f.messageEn));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePrescriptions(raw: any): SavedPrescription[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p !== null && typeof p === 'object')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any, idx: number) => {
      const createdAt =
        typeof p.createdAt === 'string' && p.createdAt ? p.createdAt : new Date().toISOString();
      const updatedAt =
        typeof p.updatedAt === 'string' && p.updatedAt ? p.updatedAt : createdAt;
      const id =
        typeof p.id === 'string' && p.id.trim()
          ? p.id.trim()
          : `rx-${Date.parse(createdAt) || Date.now()}-${idx}`;
      const captureMethod: PrescriptionCaptureMethod = [
        'manual_entry',
        'ocr_upload',
        'camera_capture',
        'scanner_import',
      ].includes(p.captureMethod)
        ? p.captureMethod
        : 'manual_entry';
      const isOcrUnverified =
        typeof p.isOcrUnverified === 'boolean'
          ? p.isOcrUnverified
          : captureMethod === 'ocr_upload' || captureMethod === 'camera_capture';
      const verificationStatus: PrescriptionVerificationStatus = [
        'unverified_ocr',
        'needs_clarification',
        'verified_by_patient',
      ].includes(p.verificationStatus)
        ? p.verificationStatus
        : isOcrUnverified
          ? 'unverified_ocr'
          : 'verified_by_patient';
      const durationDays =
        typeof p.durationDays === 'number' && !isNaN(p.durationDays) && p.durationDays >= 1
          ? Math.round(p.durationDays)
          : null;

      return {
        id,
        ...(typeof p.antibioticId === 'string' && p.antibioticId.trim()
          ? { antibioticId: p.antibioticId.trim() }
          : {}),
        medicineName: typeof p.medicineName === 'string' ? p.medicineName.trim() : '',
        prescribedDose: typeof p.prescribedDose === 'string' ? p.prescribedDose.trim() : '',
        route: typeof p.route === 'string' ? p.route : '',
        frequency: typeof p.frequency === 'string' ? p.frequency : '',
        ...(typeof p.firstDoseTime === 'string' && p.firstDoseTime
          ? { firstDoseTime: p.firstDoseTime }
          : {}),
        ...(Array.isArray(p.doseTimes) ? { doseTimes: p.doseTimes.map(String) } : {}),
        ...(typeof p.startDate === 'string' && p.startDate ? { startDate: p.startDate } : {}),
        durationDays,
        ...(typeof p.notes === 'string' && p.notes.trim() ? { notes: p.notes.trim() } : {}),
        ...(Array.isArray(p.coMedications)
          ? {
              coMedications: p.coMedications.filter(
                (c: unknown): c is string => typeof c === 'string' && Boolean(c)
              ),
            }
          : {}),
        captureMethod,
        ...(typeof p.rawExtractedText === 'string' && p.rawExtractedText.trim()
          ? { rawExtractedText: p.rawExtractedText.trim() }
          : {}),
        ...(typeof p.imageFileName === 'string' && p.imageFileName.trim()
          ? { imageFileName: p.imageFileName.trim() }
          : {}),
        isOcrUnverified,
        verificationStatus,
        ...(typeof p.verifiedAt === 'string' && p.verifiedAt ? { verifiedAt: p.verifiedAt } : {}),
        ...(typeof p.verifiedByPatient === 'boolean'
          ? { verifiedByPatient: p.verifiedByPatient }
          : {}),
        clarificationFlags: normalizeClarificationFlags(p.clarificationFlags),
        ...(typeof p.linkedScheduleId === 'string' && p.linkedScheduleId
          ? { linkedScheduleId: p.linkedScheduleId }
          : {}),
        createdAt,
        updatedAt,
      };
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTreatmentEvents(raw: any): TreatmentJourneyEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((ev) => ev !== null && typeof ev === 'object')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((ev: any, idx: number) => {
      const timestamp =
        typeof ev.timestamp === 'string' && ev.timestamp
          ? ev.timestamp
          : new Date().toISOString();
      const id =
        typeof ev.id === 'string' && ev.id.trim()
          ? ev.id.trim()
          : `ev-${Date.parse(timestamp) || Date.now()}-${idx}`;
      return {
        id,
        type: (typeof ev.type === 'string'
          ? ev.type
          : 'prescription_captured') as TreatmentJourneyEventType,
        timestamp,
        ...(typeof ev.prescriptionId === 'string' && ev.prescriptionId
          ? { prescriptionId: ev.prescriptionId }
          : {}),
        ...(typeof ev.scheduleId === 'string' && ev.scheduleId
          ? { scheduleId: ev.scheduleId }
          : {}),
        ...(typeof ev.doseId === 'string' && ev.doseId ? { doseId: ev.doseId } : {}),
        ...(typeof ev.medicineName === 'string' && ev.medicineName
          ? { medicineName: ev.medicineName }
          : {}),
        ...(typeof ev.scheduledTime === 'string' && ev.scheduledTime
          ? { scheduledTime: ev.scheduledTime }
          : {}),
        ...(typeof ev.actualTime === 'string' && ev.actualTime
          ? { actualTime: ev.actualTime }
          : {}),
        summaryAr: typeof ev.summaryAr === 'string' ? ev.summaryAr : '',
        summaryEn: typeof ev.summaryEn === 'string' ? ev.summaryEn : '',
      };
    })
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, MAX_TREATMENT_EVENTS);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSchedules(raw: any): TreatmentSchedule[] {
  if (!Array.isArray(raw)) return [];
  const todayStr = formatLocalDateYYYYMMDD();
  return raw
    .filter((s) => s !== null && typeof s === 'object')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any, idx: number) => {
      const createdAt =
        typeof s.createdAt === 'string' && s.createdAt ? s.createdAt : new Date().toISOString();
      const updatedAt =
        typeof s.updatedAt === 'string' && s.updatedAt ? s.updatedAt : createdAt;
      const id =
        typeof s.id === 'string' && s.id.trim()
          ? s.id.trim()
          : `sch-${Date.parse(createdAt) || Date.now()}-${idx}`;
      const startDate =
        typeof s.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.startDate)
          ? s.startDate
          : todayStr;
      const durationDays =
        typeof s.durationDays === 'number' && s.durationDays >= 1 && s.durationDays <= 60
          ? Math.round(s.durationDays)
          : 7;
      const endDate =
        typeof s.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.endDate)
          ? s.endDate
          : computeEndDate(startDate, durationDays);
      const doseTimes =
        Array.isArray(s.doseTimes) && s.doseTimes.length > 0
          ? s.doseTimes.map(String)
          : ['08:00', '20:00'];
      const firstDoseTime =
        typeof s.firstDoseTime === 'string' && /^\d{2}:\d{2}$/.test(s.firstDoseTime)
          ? s.firstDoseTime
          : doseTimes[0] || '08:00';

      const doses: ScheduledDose[] = Array.isArray(s.doses)
        ? s.doses
            .filter((d: unknown) => d !== null && typeof d === 'object')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((d: any, dIdx: number) => {
              const dayNumber = typeof d.dayNumber === 'number' && d.dayNumber >= 1 ? d.dayNumber : 1;
              const doseNumberInDay =
                typeof d.doseNumberInDay === 'number' && d.doseNumberInDay >= 1
                  ? d.doseNumberInDay
                  : dIdx + 1;
              const doseId =
                typeof d.id === 'string' && d.id.trim()
                  ? d.id.trim()
                  : `${id}-d${dayNumber}-${doseNumberInDay}`;
              const status: DoseStatus = ['upcoming', 'taken', 'missed', 'unconfirmed'].includes(d.status)
                ? d.status
                : 'upcoming';
              const takenAt = typeof d.takenAt === 'string' && d.takenAt ? d.takenAt : undefined;
              const missedAt = typeof d.missedAt === 'string' && d.missedAt ? d.missedAt : undefined;
              const statusUpdatedAt =
                typeof d.statusUpdatedAt === 'string' && d.statusUpdatedAt
                  ? d.statusUpdatedAt
                  : takenAt || missedAt || undefined;
              const documentedOutcome: DoseDocumentedOutcome | undefined = [
                'taken_on_time',
                'taken_late',
                'missed_confirmed',
                'held_for_clarification',
                'skipped_clinician_advice',
              ].includes(d.documentedOutcome)
                ? d.documentedOutcome
                : undefined;

              return {
                id: doseId,
                scheduleId: id,
                dayNumber,
                doseNumberInDay,
                scheduledTime: typeof d.scheduledTime === 'string' ? d.scheduledTime : '',
                status,
                ...(takenAt ? { takenAt } : {}),
                ...(missedAt ? { missedAt } : {}),
                ...(statusUpdatedAt ? { statusUpdatedAt } : {}),
                ...(documentedOutcome ? { documentedOutcome } : {}),
                ...(typeof d.note === 'string' && d.note.trim() ? { note: d.note.trim() } : {}),
              };
            })
        : generateScheduleDoses(id, startDate, doseTimes, durationDays);

      const captureMethod: PrescriptionCaptureMethod | undefined = [
        'manual_entry',
        'ocr_upload',
        'camera_capture',
        'scanner_import',
      ].includes(s.captureMethod)
        ? s.captureMethod
        : undefined;
      const verificationStatus: PrescriptionVerificationStatus | undefined = [
        'unverified_ocr',
        'needs_clarification',
        'verified_by_patient',
      ].includes(s.verificationStatus)
        ? s.verificationStatus
        : 'verified_by_patient';

      return {
        id,
        ...(typeof s.prescriptionId === 'string' && s.prescriptionId.trim()
          ? { prescriptionId: s.prescriptionId.trim() }
          : {}),
        ...(typeof s.antibioticId === 'string' && s.antibioticId.trim()
          ? { antibioticId: s.antibioticId.trim() }
          : {}),
        medicineName: typeof s.medicineName === 'string' ? s.medicineName.trim() : '',
        prescribedDose: typeof s.prescribedDose === 'string' ? s.prescribedDose.trim() : '',
        route: typeof s.route === 'string' && s.route ? s.route : 'oral',
        frequency: typeof s.frequency === 'string' && s.frequency ? s.frequency : 'twice_daily',
        firstDoseTime,
        doseTimes,
        startDate,
        durationDays,
        endDate,
        ...(typeof s.notes === 'string' && s.notes.trim() ? { notes: s.notes.trim() } : {}),
        ...(Array.isArray(s.coMedications)
          ? {
              coMedications: s.coMedications.filter(
                (c: unknown): c is string => typeof c === 'string' && Boolean(c)
              ),
            }
          : {}),
        ...(typeof s.coMedNotes === 'string' && s.coMedNotes.trim()
          ? { coMedNotes: s.coMedNotes.trim() }
          : {}),
        ...(captureMethod ? { captureMethod } : {}),
        verificationStatus,
        ...(typeof s.verifiedAt === 'string' && s.verifiedAt ? { verifiedAt: s.verifiedAt } : {}),
        ...(typeof s.verifiedByPatient === 'boolean'
          ? { verifiedByPatient: s.verifiedByPatient }
          : {}),
        ...(Array.isArray(s.clarificationFlags)
          ? { clarificationFlags: normalizeClarificationFlags(s.clarificationFlags) }
          : {}),
        ...(typeof s.rawExtractedText === 'string' && s.rawExtractedText.trim()
          ? { rawExtractedText: s.rawExtractedText.trim() }
          : {}),
        createdAt,
        updatedAt,
        doses,
      };
    });
}

/**
 * Computes a normalized content signature for deduplicating identical prescriptions
 * created during guest-to-account migration.
 */
export function getScheduleSignature(
  s: Pick<TreatmentSchedule, 'medicineName' | 'prescribedDose' | 'startDate' | 'frequency'>
): string {
  return [
    (s.medicineName || '').trim().toLowerCase(),
    (s.prescribedDose || '').trim().toLowerCase(),
    (s.startDate || '').trim(),
    (s.frequency || '').trim().toLowerCase(),
  ].join('|');
}

/**
 * Conflict-safe dose merge using `statusUpdatedAt` (and `takenAt`/`missedAt` fallback).
 */
export function mergeDoseRecords(primary: ScheduledDose, secondary: ScheduledDose): ScheduledDose {
  const pTime = primary.statusUpdatedAt || primary.takenAt || primary.missedAt || '';
  const sTime = secondary.statusUpdatedAt || secondary.takenAt || secondary.missedAt || '';

  if (pTime && sTime) {
    return sTime > pTime ? { ...secondary, id: primary.id, scheduleId: primary.scheduleId } : primary;
  }
  if (sTime && !pTime) {
    return { ...secondary, id: primary.id, scheduleId: primary.scheduleId };
  }
  if (pTime && !sTime) {
    return primary;
  }

  const isExplicit = (st: DoseStatus) => st === 'taken' || st === 'missed';
  if (!isExplicit(primary.status) && isExplicit(secondary.status)) {
    return { ...secondary, id: primary.id, scheduleId: primary.scheduleId };
  }
  return primary;
}

export function mergeDeletedMaps(
  a?: Record<string, string>,
  b?: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = { ...(a || {}) };
  for (const [id, ts] of Object.entries(b || {})) {
    if (!out[id] || ts > out[id]) {
      out[id] = ts;
    }
  }
  return out;
}

export function mergePrescriptions(
  primary: SavedPrescription[],
  secondary: SavedPrescription[],
  deletedMap: Record<string, string> = {}
): SavedPrescription[] {
  const isDeleted = (p: SavedPrescription) => {
    const delTs = deletedMap[p.id];
    if (!delTs) return false;
    const modTs = p.updatedAt || p.createdAt || '';
    return !modTs || delTs >= modTs;
  };

  const map = new Map<string, SavedPrescription>();
  for (const p of normalizePrescriptions(primary)) {
    if (!isDeleted(p)) {
      map.set(p.id, p);
    }
  }

  for (const p of normalizePrescriptions(secondary)) {
    if (isDeleted(p)) continue;
    const existing = map.get(p.id);
    if (!existing) {
      map.set(p.id, p);
    } else {
      const existingTs = existing.updatedAt || existing.createdAt || '';
      const incomingTs = p.updatedAt || p.createdAt || '';
      map.set(p.id, incomingTs > existingTs ? p : existing);
    }
  }

  return normalizePrescriptions(Array.from(map.values())).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

export function mergeTreatmentEvents(
  primary: TreatmentJourneyEvent[],
  secondary: TreatmentJourneyEvent[]
): TreatmentJourneyEvent[] {
  const map = new Map<string, TreatmentJourneyEvent>();
  for (const ev of normalizeTreatmentEvents(secondary)) {
    map.set(ev.id, ev);
  }
  for (const ev of normalizeTreatmentEvents(primary)) {
    map.set(ev.id, ev);
  }
  return normalizeTreatmentEvents(Array.from(map.values()));
}

/**
 * Non-destructively and deterministically merges two schedule lists while respecting tombstones
 * (`deletedMap`) and per-schedule / per-dose timestamps.
 */
export function mergeSchedules(
  primary: TreatmentSchedule[],
  secondary: TreatmentSchedule[],
  deletedMap: Record<string, string> = {}
): TreatmentSchedule[] {
  const isDeleted = (s: TreatmentSchedule) => {
    const delTs = deletedMap[s.id];
    if (!delTs) return false;
    const modTs = s.updatedAt || s.createdAt || '';
    return !modTs || delTs >= modTs;
  };

  const map = new Map<string, TreatmentSchedule>();
  for (const s of normalizeSchedules(primary)) {
    if (!isDeleted(s)) {
      map.set(s.id, s);
    }
  }

  for (const s of normalizeSchedules(secondary)) {
    if (isDeleted(s)) continue;
    const existing = map.get(s.id);
    if (!existing) {
      map.set(s.id, s);
    } else {
      const existingTs = existing.updatedAt || existing.createdAt || '';
      const incomingTs = s.updatedAt || s.createdAt || '';
      const base = incomingTs > existingTs ? s : existing;
      const other = incomingTs > existingTs ? existing : s;

      const mergedDoses = base.doses.map((bd) => {
        const match = other.doses.find(
          (od) =>
            od.id === bd.id ||
            (od.dayNumber === bd.dayNumber && od.doseNumberInDay === bd.doseNumberInDay)
        );
        return match ? mergeDoseRecords(bd, match) : bd;
      });

      const latestDoseTs = mergedDoses.reduce((acc, d) => {
        const t = d.statusUpdatedAt || d.takenAt || d.missedAt || '';
        return t > acc ? t : acc;
      }, '');
      const bestUpdatedAt = [existingTs, incomingTs, latestDoseTs].sort().pop() || base.updatedAt;

      map.set(s.id, {
        ...base,
        updatedAt: bestUpdatedAt,
        doses: mergedDoses,
      });
    }
  }

  return normalizeSchedules(Array.from(map.values())).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

/**
 * Safely merges local Guest records into an authenticated user's Cloud records on sign-in.
 */
export function safeMergeGuestIntoCloud(
  cloudSchedules: TreatmentSchedule[],
  guestSchedules: TreatmentSchedule[],
  cloudDeletedMap: Record<string, string> = {}
): { merged: TreatmentSchedule[]; changed: boolean } {
  const cleanCloud = normalizeSchedules(cloudSchedules).filter((s) => !cloudDeletedMap[s.id]);
  const cleanGuest = normalizeSchedules(guestSchedules).filter((s) => !cloudDeletedMap[s.id]);

  if (cleanGuest.length === 0) {
    return { merged: cleanCloud, changed: false };
  }

  const result = cleanCloud.map((c) => ({ ...c, doses: [...c.doses] }));
  let changed = false;

  for (const guestSch of cleanGuest) {
    const sig = getScheduleSignature(guestSch);
    const matchIdx = result.findIndex(
      (c) => c.id === guestSch.id || getScheduleSignature(c) === sig
    );

    if (matchIdx === -1) {
      result.push(guestSch);
      changed = true;
    } else {
      const cloudSch = result[matchIdx];
      let doseChanged = false;
      const mergedDoses = cloudSch.doses.map((cd) => {
        const gd = guestSch.doses.find(
          (d) =>
            d.id === cd.id ||
            (d.dayNumber === cd.dayNumber && d.doseNumberInDay === cd.doseNumberInDay)
        );
        if (!gd) return cd;
        if (cd.status === 'upcoming' && (gd.status === 'taken' || gd.status === 'missed')) {
          doseChanged = true;
          return {
            ...cd,
            status: gd.status,
            ...(gd.takenAt ? { takenAt: gd.takenAt } : {}),
            ...(gd.missedAt ? { missedAt: gd.missedAt } : {}),
            ...(gd.documentedOutcome ? { documentedOutcome: gd.documentedOutcome } : {}),
            ...(gd.note ? { note: gd.note } : {}),
            statusUpdatedAt: gd.statusUpdatedAt || gd.takenAt || gd.missedAt || new Date().toISOString(),
          };
        }
        return cd;
      });

      if (doseChanged) {
        changed = true;
        result[matchIdx] = {
          ...cloudSch,
          updatedAt: new Date().toISOString(),
          doses: mergedDoses,
        };
      }
    }
  }

  const finalMerged = normalizeSchedules(result);
  return { merged: finalMerged, changed };
}

export function loadDeletedMap(uid?: string | null): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const raw = localStorage.getItem(getDeletedSchedulesStorageKey(effectiveUid));
    return raw ? normalizeDeletedMap(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function loadDeletedPrescriptionsMap(uid?: string | null): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const raw = localStorage.getItem(getDeletedPrescriptionsStorageKey(effectiveUid));
    return raw ? normalizeDeletedMap(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function loadPrescriptions(uid?: string | null): SavedPrescription[] {
  if (typeof window === 'undefined') return [];
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const raw = localStorage.getItem(getPrescriptionsStorageKey(effectiveUid));
    return raw ? normalizePrescriptions(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function loadTreatmentEvents(uid?: string | null): TreatmentJourneyEvent[] {
  if (typeof window === 'undefined') return [];
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const raw = localStorage.getItem(getTreatmentEventsStorageKey(effectiveUid));
    return raw ? normalizeTreatmentEvents(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function loadRadarWorkspace(uid?: string | null): RadarWorkspaceState {
  if (typeof window === 'undefined') return { ...DEFAULT_RADAR_WORKSPACE };
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const raw = localStorage.getItem(getRadarWorkspaceStorageKey(effectiveUid));
    if (raw) {
      return normalizeRadarWorkspace(JSON.parse(raw));
    }
    return { ...DEFAULT_RADAR_WORKSPACE };
  } catch {
    return { ...DEFAULT_RADAR_WORKSPACE };
  }
}

export function loadSchedules(uid?: string | null): TreatmentSchedule[] {
  if (typeof window === 'undefined') return [];
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const scopedRaw = localStorage.getItem(getSchedulesStorageKey(effectiveUid));
    if (scopedRaw) {
      return normalizeSchedules(JSON.parse(scopedRaw));
    }
    return [];
  } catch (err) {
    console.error('Failed to load treatment schedules:', err);
    return [];
  }
}

export function saveSchedules(schedules: TreatmentSchedule[], uid?: string | null): void {
  if (typeof window === 'undefined') return;
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  const clean = stripUndefined(normalizeSchedules(schedules));
  try {
    localStorage.setItem(getSchedulesStorageKey(effectiveUid), JSON.stringify(clean));
    window.dispatchEvent(
      new CustomEvent(SCHEDULES_EVENT, { detail: { uid: effectiveUid, schedules: clean } })
    );
  } catch (err) {
    console.error('Failed to save treatment schedules locally:', err);
  }
  if (effectiveUid && configured && db) {
    setDoc(
      doc(db, 'users', effectiveUid),
      {
        schedules: clean,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => {
      console.error('Failed to sync treatment schedules to Cloud Firestore:', err);
    });
  }
}

/**
 * Generates an iCalendar (.ics) file string for a treatment schedule so the patient can
 * add native phone/calendar alarms that work even when the browser is closed.
 */
export function buildScheduleIcsContent(sch: TreatmentSchedule, isAr = true): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Antibiotic Awareness//Prescription Radar//EN',
    'CALSCALE:GREGORIAN',
  ];

  sch.doses.forEach((d) => {
    const cleanIso = d.scheduledTime.replace(/[-:]/g, '');
    const dtStart = cleanIso.length === 13 ? `${cleanIso}00` : cleanIso.slice(0, 15);
    const summary = isAr
      ? `💊 موعد جرعة: ${sch.medicineName} (${sch.prescribedDose})`
      : `💊 Dose Reminder: ${sch.medicineName} (${sch.prescribedDose})`;
    const desc = isAr
      ? `اليوم ${d.dayNumber} - الجرعة ${d.doseNumberInDay}. ${sch.notes || ''}`
      : `Day ${d.dayNumber} - Dose ${d.doseNumberInDay}. ${sch.notes || ''}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${d.id}@antibiotic-awareness`,
      `DTSTART:${dtStart}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${summary}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadScheduleIcs(sch: TreatmentSchedule, isAr = true): void {
  const icsContent = buildScheduleIcsContent(sch, isAr);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dose-alarms-${sch.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Fires a browser/system notification safely on both desktop and mobile Android browsers.
 * On mobile Android Chrome, `new Notification()` on the window thread throws `Illegal constructor`
 * and requires `ServiceWorkerRegistration.showNotification()`.
 */
export async function fireSystemNotificationSafely(
  title: string,
  body: string
): Promise<{ delivered: boolean; error?: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { delivered: false, error: 'Notifications API not supported in this browser.' };
  }
  if (Notification.permission !== 'granted') {
    return { delivered: false, error: 'Notification permission is not granted.' };
  }

  try {
    new Notification(title, { body });
    return { delivered: true };
  } catch (directErr) {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, { body });
          return { delivered: true };
        }
      }
    } catch (swErr) {
      return {
        delivered: false,
        error: swErr instanceof Error ? swErr.message : String(directErr),
      };
    }
    return {
      delivered: false,
      error: directErr instanceof Error ? directErr.message : 'Notification constructor failed.',
    };
  }
}

/**
 * Shared hook for browser notification permission and active in-tab dose reminders
 * across both Standalone Tracker (/tracker) and Prescription Radar (/prescription-radar).
 * Gracefully handles permission denial, unsupported browsers, and mobile Android service worker fallbacks.
 */
export function useDoseReminderNotifications(schedules: TreatmentSchedule[], isAr: boolean) {
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [notifError, setNotifError] = useState<string | null>(null);
  const [activeDueBanner, setActiveDueBanner] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifSupported(true);
      setNotifPermission(Notification.permission);
    } else {
      setNotifSupported(false);
      setNotifPermission('unsupported');
    }
  }, []);

  useEffect(() => {
    if (schedules.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentYYYYMMDD = formatLocalDateYYYYMMDD(now);
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      let firedMap: Record<string, boolean> = {};
      try {
        const raw = localStorage.getItem(NOTIF_FIRED_STORAGE_KEY);
        if (raw) firedMap = JSON.parse(raw);
      } catch {}

      let updated = false;
      schedules.forEach((sch) => {
        sch.doses.forEach((d) => {
          if (d.status !== 'upcoming') return;
          const [dDate, dTimeFull] = d.scheduledTime.split('T');
          const dHHMM = (dTimeFull || '').slice(0, 5);
          if (dDate === currentYYYYMMDD && dHHMM === currentHHMM && !firedMap[d.id]) {
            firedMap[d.id] = true;
            updated = true;
            const alertText = isAr
              ? `⏰ حان الآن موعد جرعة: ${sch.medicineName} (${sch.prescribedDose}) — الساعة ${formatTime12Hour(dHHMM, true)}`
              : `⏰ Time for your dose: ${sch.medicineName} (${sch.prescribedDose}) — ${formatTime12Hour(dHHMM, false)}`;
            setActiveDueBanner(alertText);
            if (notifSupported && notifPermission === 'granted') {
              void fireSystemNotificationSafely(
                isAr ? `⏰ موعد جرعة الدواء: ${sch.medicineName}` : `⏰ Dose Reminder: ${sch.medicineName}`,
                isAr
                  ? `الجرعة الموصوفة: ${sch.prescribedDose} (${formatTime12Hour(dHHMM, true)}). يرجى تأكيد الجرعة في المتابع العلاجي.`
                  : `Prescribed dose: ${sch.prescribedDose} (${formatTime12Hour(dHHMM, false)}). Please confirm in your tracker.`
              );
            }
          }
        });
      });

      if (updated) {
        try {
          localStorage.setItem(NOTIF_FIRED_STORAGE_KEY, JSON.stringify(firedMap));
        } catch {}
      }
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 25000);
    return () => window.clearInterval(timer);
  }, [notifSupported, notifPermission, schedules, isAr]);

  const requestNotifPermission = useCallback(async () => {
    setNotifError(null);
    if (!notifSupported || typeof window === 'undefined' || !('Notification' in window)) {
      setNotifError(
        isAr
          ? 'هذا المتصفح لا يدعم إشعارات الويب. استخدم زر «منبهات الموبايل (.ics)» لإضافة مواعيد الجرعات لتقويم الهاتف.'
          : 'This browser does not support Web Notifications. Please use the "Phone Alarms (.ics)" button to add dose alarms to your phone calendar.'
      );
      return;
    }

    if (Notification.permission === 'denied') {
      setNotifPermission('denied');
      setNotifError(
        isAr
          ? 'تم حظر الإشعارات مسبقاً من إعدادات المتصفح. يرجى السماح بالإشعارات من قفل شريط العنوان في المتصفح، أو استخدام «منبهات الموبايل (.ics)».'
          : 'Notifications are blocked in your browser settings. Please allow notifications in your browser address bar, or use "Phone Alarms (.ics)".'
      );
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        const res = await fireSystemNotificationSafely(
          isAr ? 'تم تفعيل تنبيهات المتصفح 🔔' : 'Browser Reminders Enabled 🔔',
          isAr
            ? 'سيظهر لك إشعار منبثق على الشاشة عند حلول موعد الجرعة طالما أن الموقع أو المتصفح مفتوح.'
            : 'A system notification will pop up at scheduled dose times while this browser remains open.'
        );
        if (!res.delivered) {
          setActiveDueBanner(
            isAr
              ? '🔔 تم تفعيل التنبيهات داخل الصفحة بنجاح (إشعارات النظام مقيدة على هذا الجهاز، لذا ستظهر التنبيهات داخل الصفحة أو عبر ملف .ics).'
              : '🔔 In-app reminders enabled (system popups are restricted on this device; use .ics alarms for native phone alerts).'
          );
        }
      } else if (perm === 'denied') {
        setNotifError(
          isAr
            ? 'لم يتم منح إذن الإشعارات. يمكنك الاعتماد على التنبيهات داخل الصفحة أو تحميل ملف «منبهات الموبايل (.ics)».'
            : 'Notification permission was declined. You can still use in-page alerts or download "Phone Alarms (.ics)".'
        );
      }
    } catch (err) {
      console.error('Notification error:', err);
      setNotifError(
        isAr
          ? 'تعذر تفعيل إشعارات المتصفح على هذا الجهاز. يرجى استخدام «منبهات الموبايل (.ics)».'
          : 'Could not enable browser notifications on this device. Please use "Phone Alarms (.ics)".'
      );
    }
  }, [notifSupported, isAr]);

  const sendTestNotification = useCallback(async () => {
    setNotifError(null);
    const sampleMsg = isAr
      ? '🔔 اختبار تنبيه الجرعة: التنبيهات داخل التطبيق تعمل بنجاح بينما الصفحة مفتوحة.'
      : '🔔 Test Dose Reminder: In-app dose alerts are working while this page is open.';
    setActiveDueBanner(sampleMsg);
    if (notifSupported && notifPermission === 'granted') {
      await fireSystemNotificationSafely(
        isAr ? '🔔 اختبار تنبيه الجرعة' : '🔔 Dose Reminder Test',
        sampleMsg
      );
    }
  }, [notifSupported, notifPermission, isAr]);

  return {
    notifSupported,
    notifPermission,
    notifError,
    activeDueBanner,
    setActiveDueBanner,
    requestNotifPermission,
    sendTestNotification,
  };
}

export function useSyncedSchedules() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;

  const [schedules, setSchedulesState] = useState<TreatmentSchedule[]>(() => loadSchedules(uid));
  const [prescriptions, setPrescriptionsState] = useState<SavedPrescription[]>(() =>
    loadPrescriptions(uid)
  );
  const [treatmentEvents, setTreatmentEventsState] = useState<TreatmentJourneyEvent[]>(() =>
    loadTreatmentEvents(uid)
  );
  const [radarWorkspace, setRadarWorkspaceState] = useState<RadarWorkspaceState>(() =>
    loadRadarWorkspace(uid)
  );
  const [initialLoading, setInitialLoading] = useState<boolean>(() => Boolean(authLoading || uid));
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(() => {
    if (authLoading) return 'loading';
    if (!uid) return 'local_only';
    return 'loading';
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const hydratedUidRef = useRef<string | null>(null);
  const schedulesRef = useRef<TreatmentSchedule[]>(schedules);
  schedulesRef.current = schedules;
  const deletedMapRef = useRef<Record<string, string>>(loadDeletedMap(uid));

  const prescriptionsRef = useRef<SavedPrescription[]>(prescriptions);
  prescriptionsRef.current = prescriptions;
  const deletedPrescriptionsMapRef = useRef<Record<string, string>>(
    loadDeletedPrescriptionsMap(uid)
  );

  const treatmentEventsRef = useRef<TreatmentJourneyEvent[]>(treatmentEvents);
  treatmentEventsRef.current = treatmentEvents;

  const radarWorkspaceRef = useRef<RadarWorkspaceState>(radarWorkspace);
  radarWorkspaceRef.current = radarWorkspace;
  const hasPendingLocalWriteRef = useRef<boolean>(false);

  const pushStateToCloud = useCallback(
    async (
      targetUid: string,
      nextSchedules: TreatmentSchedule[],
      nextDeletedMap: Record<string, string>,
      nextRadarWorkspace?: RadarWorkspaceState,
      nextPrescriptions?: SavedPrescription[],
      nextDeletedPrescriptions?: Record<string, string>,
      nextTreatmentEvents?: TreatmentJourneyEvent[]
    ): Promise<boolean> => {
      if (!targetUid || !configured || !db) {
        setSyncStatus('local_only');
        return false;
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        hasPendingLocalWriteRef.current = true;
        setSyncStatus('offline_pending');
        return false;
      }

      setSyncStatus('saving');
      setSyncError(null);
      const userDocRef = doc(db, 'users', targetUid);

      try {
        let resolvedSchedules = nextSchedules;
        let resolvedDeleted = nextDeletedMap;
        let resolvedRadar = nextRadarWorkspace || radarWorkspaceRef.current;
        let resolvedPrescriptions = nextPrescriptions || prescriptionsRef.current;
        let resolvedDeletedPrescriptions =
          nextDeletedPrescriptions || deletedPrescriptionsMapRef.current;
        let resolvedEvents = nextTreatmentEvents || treatmentEventsRef.current;

        try {
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(userDocRef);
            const data = snap.exists() ? snap.data() : {};
            const remoteDeleted = normalizeDeletedMap(data?.deletedScheduleIds);
            resolvedDeleted = mergeDeletedMaps(remoteDeleted, nextDeletedMap);

            const remoteSchedules = Array.isArray(data?.schedules)
              ? normalizeSchedules(data?.schedules)
              : [];
            resolvedSchedules = mergeSchedules(nextSchedules, remoteSchedules, resolvedDeleted);

            const remoteDelRx = normalizeDeletedMap(data?.deletedPrescriptionIds);
            resolvedDeletedPrescriptions = mergeDeletedMaps(
              remoteDelRx,
              resolvedDeletedPrescriptions
            );

            const remotePrescriptions = Array.isArray(data?.prescriptions)
              ? normalizePrescriptions(data?.prescriptions)
              : [];
            resolvedPrescriptions = mergePrescriptions(
              resolvedPrescriptions,
              remotePrescriptions,
              resolvedDeletedPrescriptions
            );

            const remoteEvents = Array.isArray(data?.treatmentEvents)
              ? normalizeTreatmentEvents(data?.treatmentEvents)
              : [];
            resolvedEvents = mergeTreatmentEvents(resolvedEvents, remoteEvents);

            if (data?.radarWorkspace) {
              const remoteRadar = normalizeRadarWorkspace(data.radarWorkspace);
              if (remoteRadar.updatedAt > resolvedRadar.updatedAt) {
                resolvedRadar = remoteRadar;
              }
            }

            tx.set(
              userDocRef,
              {
                schedules: stripUndefined(resolvedSchedules),
                deletedScheduleIds: stripUndefined(resolvedDeleted),
                prescriptions: stripUndefined(resolvedPrescriptions),
                deletedPrescriptionIds: stripUndefined(resolvedDeletedPrescriptions),
                treatmentEvents: stripUndefined(resolvedEvents),
                radarWorkspace: stripUndefined(resolvedRadar),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          });
        } catch (txErr) {
          await setDoc(
            userDocRef,
            {
              schedules: stripUndefined(resolvedSchedules),
              deletedScheduleIds: stripUndefined(resolvedDeleted),
              prescriptions: stripUndefined(resolvedPrescriptions),
              deletedPrescriptionIds: stripUndefined(resolvedDeletedPrescriptions),
              treatmentEvents: stripUndefined(resolvedEvents),
              radarWorkspace: stripUndefined(resolvedRadar),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            throw txErr;
          }
        }

        try {
          localStorage.setItem(
            getSchedulesStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedSchedules))
          );
          localStorage.setItem(
            getDeletedSchedulesStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedDeleted))
          );
          localStorage.setItem(
            getPrescriptionsStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedPrescriptions))
          );
          localStorage.setItem(
            getDeletedPrescriptionsStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedDeletedPrescriptions))
          );
          localStorage.setItem(
            getTreatmentEventsStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedEvents))
          );
          localStorage.setItem(
            getRadarWorkspaceStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedRadar))
          );
        } catch {}

        deletedMapRef.current = resolvedDeleted;
        schedulesRef.current = resolvedSchedules;
        deletedPrescriptionsMapRef.current = resolvedDeletedPrescriptions;
        prescriptionsRef.current = resolvedPrescriptions;
        treatmentEventsRef.current = resolvedEvents;

        setSchedulesState((prev) =>
          JSON.stringify(prev) === JSON.stringify(resolvedSchedules) ? prev : resolvedSchedules
        );
        setPrescriptionsState((prev) =>
          JSON.stringify(prev) === JSON.stringify(resolvedPrescriptions)
            ? prev
            : resolvedPrescriptions
        );
        setTreatmentEventsState((prev) =>
          JSON.stringify(prev) === JSON.stringify(resolvedEvents) ? prev : resolvedEvents
        );

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          hasPendingLocalWriteRef.current = true;
          setSyncStatus('offline_pending');
          return false;
        }

        hasPendingLocalWriteRef.current = false;
        const nowIso = new Date().toISOString();
        setLastSyncedAt(nowIso);
        setSyncStatus('synced');
        return true;
      } catch (err: unknown) {
        console.error('Failed to synchronize treatment journey to Cloud Firestore:', err);
        hasPendingLocalWriteRef.current = true;
        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        setSyncStatus(isOffline ? 'offline_pending' : 'error');
        setSyncError(
          err instanceof Error ? err.message : 'Cloud synchronization failed'
        );
        return false;
      }
    },
    []
  );

  useEffect(() => {
    if (authLoading) {
      setInitialLoading(true);
      setSyncStatus('loading');
      return;
    }

    if (!uid) {
      hydratedUidRef.current = null;
      hasPendingLocalWriteRef.current = false;
      deletedMapRef.current = loadDeletedMap(null);
      deletedPrescriptionsMapRef.current = loadDeletedPrescriptionsMap(null);
      const guestSchedules = loadSchedules(null);
      const guestPrescriptions = loadPrescriptions(null);
      const guestEvents = loadTreatmentEvents(null);
      const guestRadar = loadRadarWorkspace(null);
      schedulesRef.current = guestSchedules;
      prescriptionsRef.current = guestPrescriptions;
      treatmentEventsRef.current = guestEvents;
      radarWorkspaceRef.current = guestRadar;
      setSchedulesState(guestSchedules);
      setPrescriptionsState(guestPrescriptions);
      setTreatmentEventsState(guestEvents);
      setRadarWorkspaceState(guestRadar);
      setInitialLoading(false);
      setSyncStatus('local_only');
      setSyncError(null);
      return;
    }

    const cachedDeleted = loadDeletedMap(uid);
    deletedMapRef.current = cachedDeleted;
    const cachedDelRx = loadDeletedPrescriptionsMap(uid);
    deletedPrescriptionsMapRef.current = cachedDelRx;

    let cachedScoped: TreatmentSchedule[] | null = null;
    try {
      const cachedScopedRaw = localStorage.getItem(getSchedulesStorageKey(uid));
      if (cachedScopedRaw !== null) {
        cachedScoped = normalizeSchedules(JSON.parse(cachedScopedRaw));
      }
    } catch {}

    const cachedRx = loadPrescriptions(uid);
    prescriptionsRef.current = cachedRx;
    setPrescriptionsState(cachedRx);

    const cachedEvents = loadTreatmentEvents(uid);
    treatmentEventsRef.current = cachedEvents;
    setTreatmentEventsState(cachedEvents);

    const cachedRadar = loadRadarWorkspace(uid);
    radarWorkspaceRef.current = cachedRadar;
    setRadarWorkspaceState(cachedRadar);

    if (cachedScoped && cachedScoped.length > 0) {
      schedulesRef.current = cachedScoped;
      setSchedulesState(cachedScoped);
      setInitialLoading(false);
    } else {
      setInitialLoading(true);
    }

    if (!configured || !db) {
      hydratedUidRef.current = uid;
      setInitialLoading(false);
      setSyncStatus('local_only');
      return;
    }

    let cancelled = false;
    setSyncStatus('loading');
    setSyncError(null);
    const userDocRef = doc(db, 'users', uid);

    getDoc(userDocRef)
      .then(async (snap) => {
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : undefined;
        const cloudRaw = data?.schedules;
        const hasCloudSchedules = Array.isArray(cloudRaw);
        const cloudSchedules = hasCloudSchedules ? normalizeSchedules(cloudRaw) : [];
        const cloudDeleted = normalizeDeletedMap(data?.deletedScheduleIds);
        const mergedDeleted = mergeDeletedMaps(cloudDeleted, cachedDeleted);
        deletedMapRef.current = mergedDeleted;

        const cloudDelRx = normalizeDeletedMap(data?.deletedPrescriptionIds);
        const mergedDelRx = mergeDeletedMaps(cloudDelRx, cachedDelRx);
        deletedPrescriptionsMapRef.current = mergedDelRx;

        const cloudRx = Array.isArray(data?.prescriptions)
          ? normalizePrescriptions(data?.prescriptions)
          : [];
        const cloudEvents = Array.isArray(data?.treatmentEvents)
          ? normalizeTreatmentEvents(data?.treatmentEvents)
          : [];

        const migrationKey = `${MIGRATED_LEGACY_SCHEDULES_PREFIX}${uid}`;
        const alreadyMigrated = localStorage.getItem(migrationKey) === '1';
        let guestSchedules: TreatmentSchedule[] = [];
        let guestPrescriptions: SavedPrescription[] = [];
        let guestEvents: TreatmentJourneyEvent[] = [];
        if (!alreadyMigrated) {
          try {
            const rawGuest = localStorage.getItem(STORAGE_KEY);
            if (rawGuest) {
              guestSchedules = normalizeSchedules(JSON.parse(rawGuest));
            }
            const rawGuestRx = localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
            if (rawGuestRx) {
              guestPrescriptions = normalizePrescriptions(JSON.parse(rawGuestRx));
            }
            const rawGuestEv = localStorage.getItem(TREATMENT_EVENTS_STORAGE_KEY);
            if (rawGuestEv) {
              guestEvents = normalizeTreatmentEvents(JSON.parse(rawGuestEv));
            }
          } catch {}
        }

        const cloudPlusUidCache = cachedScoped
          ? mergeSchedules(cloudSchedules, cachedScoped, mergedDeleted)
          : cloudSchedules.filter((s) => !mergedDeleted[s.id]);

        let resolved = cloudPlusUidCache;
        let shouldWriteToCloud = false;

        if (!alreadyMigrated && guestSchedules.length > 0) {
          const guestMerge = safeMergeGuestIntoCloud(cloudPlusUidCache, guestSchedules, mergedDeleted);
          resolved = guestMerge.merged;
          if (guestMerge.changed) {
            shouldWriteToCloud = true;
          }
        } else if (
          hasCloudSchedules &&
          JSON.stringify(cloudPlusUidCache) !== JSON.stringify(cloudSchedules)
        ) {
          shouldWriteToCloud = true;
        } else if (!hasCloudSchedules && resolved.length > 0) {
          shouldWriteToCloud = true;
        }

        let resolvedPrescriptions = mergePrescriptions(cloudRx, cachedRx, mergedDelRx);
        if (!alreadyMigrated && guestPrescriptions.length > 0) {
          resolvedPrescriptions = mergePrescriptions(
            resolvedPrescriptions,
            guestPrescriptions,
            mergedDelRx
          );
          shouldWriteToCloud = true;
        } else if (JSON.stringify(resolvedPrescriptions) !== JSON.stringify(cloudRx)) {
          shouldWriteToCloud = true;
        }

        let resolvedEvents = mergeTreatmentEvents(cloudEvents, cachedEvents);
        if (!alreadyMigrated && guestEvents.length > 0) {
          resolvedEvents = mergeTreatmentEvents(resolvedEvents, guestEvents);
          shouldWriteToCloud = true;
        } else if (JSON.stringify(resolvedEvents) !== JSON.stringify(cloudEvents)) {
          shouldWriteToCloud = true;
        }

        let resolvedRadar = cachedRadar;
        if (data?.radarWorkspace) {
          const cloudRadar = normalizeRadarWorkspace(data.radarWorkspace);
          if (cloudRadar.updatedAt >= cachedRadar.updatedAt) {
            resolvedRadar = cloudRadar;
          } else {
            shouldWriteToCloud = true;
          }
        }

        try {
          localStorage.setItem(
            getSchedulesStorageKey(uid),
            JSON.stringify(stripUndefined(resolved))
          );
          localStorage.setItem(
            getDeletedSchedulesStorageKey(uid),
            JSON.stringify(stripUndefined(mergedDeleted))
          );
          localStorage.setItem(
            getPrescriptionsStorageKey(uid),
            JSON.stringify(stripUndefined(resolvedPrescriptions))
          );
          localStorage.setItem(
            getDeletedPrescriptionsStorageKey(uid),
            JSON.stringify(stripUndefined(mergedDelRx))
          );
          localStorage.setItem(
            getTreatmentEventsStorageKey(uid),
            JSON.stringify(stripUndefined(resolvedEvents))
          );
          localStorage.setItem(
            getRadarWorkspaceStorageKey(uid),
            JSON.stringify(stripUndefined(resolvedRadar))
          );
          if (
            !alreadyMigrated &&
            (guestSchedules.length > 0 || guestPrescriptions.length > 0 || guestEvents.length > 0)
          ) {
            localStorage.setItem(migrationKey, '1');
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(PRESCRIPTIONS_STORAGE_KEY);
            localStorage.removeItem(TREATMENT_EVENTS_STORAGE_KEY);
          }
        } catch {}

        hydratedUidRef.current = uid;
        schedulesRef.current = resolved;
        prescriptionsRef.current = resolvedPrescriptions;
        treatmentEventsRef.current = resolvedEvents;
        radarWorkspaceRef.current = resolvedRadar;
        setSchedulesState(resolved);
        setPrescriptionsState(resolvedPrescriptions);
        setTreatmentEventsState(resolvedEvents);
        setRadarWorkspaceState(resolvedRadar);
        setInitialLoading(false);

        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        if (shouldWriteToCloud) {
          await pushStateToCloud(
            uid,
            resolved,
            mergedDeleted,
            resolvedRadar,
            resolvedPrescriptions,
            mergedDelRx,
            resolvedEvents
          );
        } else if (isOffline || snap.metadata.fromCache) {
          setSyncStatus(isOffline ? 'offline_pending' : 'synced');
          if (!isOffline) setLastSyncedAt(new Date().toISOString());
        } else {
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toISOString());
        }
      })
      .catch((err) => {
        console.error('Error hydrating treatment schedules from Firestore:', err);
        if (!cancelled) {
          hydratedUidRef.current = uid;
          setInitialLoading(false);
          const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
          setSyncStatus(isOffline ? 'offline_pending' : 'error');
          setSyncError(
            err instanceof Error ? err.message : 'Unable to load cloud records'
          );
        }
      });

    const unsubscribe = onSnapshot(
      userDocRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (cancelled || hydratedUidRef.current !== uid) return;
        if (!snap.exists()) return;
        const data = snap.data();

        const remoteDeleted = normalizeDeletedMap(data?.deletedScheduleIds);
        const mergedDeleted = mergeDeletedMaps(deletedMapRef.current, remoteDeleted);
        deletedMapRef.current = mergedDeleted;

        const remoteDelRx = normalizeDeletedMap(data?.deletedPrescriptionIds);
        const mergedDelRx = mergeDeletedMaps(deletedPrescriptionsMapRef.current, remoteDelRx);
        deletedPrescriptionsMapRef.current = mergedDelRx;

        if (Array.isArray(data?.schedules)) {
          const remoteSchedules = normalizeSchedules(data?.schedules);
          const mergedSchedules = hasPendingLocalWriteRef.current
            ? mergeSchedules(schedulesRef.current, remoteSchedules, mergedDeleted)
            : mergeSchedules(remoteSchedules, schedulesRef.current, mergedDeleted);

          try {
            localStorage.setItem(
              getSchedulesStorageKey(uid),
              JSON.stringify(stripUndefined(mergedSchedules))
            );
            localStorage.setItem(
              getDeletedSchedulesStorageKey(uid),
              JSON.stringify(stripUndefined(mergedDeleted))
            );
          } catch {}

          schedulesRef.current = mergedSchedules;
          setSchedulesState((prev) =>
            JSON.stringify(prev) === JSON.stringify(mergedSchedules) ? prev : mergedSchedules
          );
        }

        if (Array.isArray(data?.prescriptions)) {
          const remoteRx = normalizePrescriptions(data?.prescriptions);
          const mergedRx = hasPendingLocalWriteRef.current
            ? mergePrescriptions(prescriptionsRef.current, remoteRx, mergedDelRx)
            : mergePrescriptions(remoteRx, prescriptionsRef.current, mergedDelRx);

          try {
            localStorage.setItem(
              getPrescriptionsStorageKey(uid),
              JSON.stringify(stripUndefined(mergedRx))
            );
            localStorage.setItem(
              getDeletedPrescriptionsStorageKey(uid),
              JSON.stringify(stripUndefined(mergedDelRx))
            );
          } catch {}

          prescriptionsRef.current = mergedRx;
          setPrescriptionsState((prev) =>
            JSON.stringify(prev) === JSON.stringify(mergedRx) ? prev : mergedRx
          );
        }

        if (Array.isArray(data?.treatmentEvents)) {
          const remoteEv = normalizeTreatmentEvents(data?.treatmentEvents);
          const mergedEv = mergeTreatmentEvents(treatmentEventsRef.current, remoteEv);
          try {
            localStorage.setItem(
              getTreatmentEventsStorageKey(uid),
              JSON.stringify(stripUndefined(mergedEv))
            );
          } catch {}
          treatmentEventsRef.current = mergedEv;
          setTreatmentEventsState((prev) =>
            JSON.stringify(prev) === JSON.stringify(mergedEv) ? prev : mergedEv
          );
        }

        if (data?.radarWorkspace) {
          const remoteRadar = normalizeRadarWorkspace(data.radarWorkspace);
          if (remoteRadar.updatedAt > radarWorkspaceRef.current.updatedAt) {
            radarWorkspaceRef.current = remoteRadar;
            try {
              localStorage.setItem(
                getRadarWorkspaceStorageKey(uid),
                JSON.stringify(stripUndefined(remoteRadar))
              );
            } catch {}
            setRadarWorkspaceState(remoteRadar);
          }
        }

        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        if (snap.metadata.hasPendingWrites || isOffline) {
          setSyncStatus(isOffline ? 'offline_pending' : 'saving');
        } else if (!hasPendingLocalWriteRef.current) {
          setSyncStatus('synced');
          setSyncError(null);
          setLastSyncedAt(new Date().toISOString());
        }
      },
      (err) => {
        console.warn('Firestore schedules listener warning:', err);
        if (!cancelled) {
          const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
          setSyncStatus(isOffline ? 'offline_pending' : 'error');
          setSyncError(err.message);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid, authLoading, pushStateToCloud]);

  useEffect(() => {
    if (typeof window === 'undefined' || !uid) return;
    const handleOnline = () => {
      if (hasPendingLocalWriteRef.current) {
        void pushStateToCloud(
          uid,
          schedulesRef.current,
          deletedMapRef.current,
          radarWorkspaceRef.current,
          prescriptionsRef.current,
          deletedPrescriptionsMapRef.current,
          treatmentEventsRef.current
        );
      } else {
        setSyncStatus('synced');
      }
    };
    const handleOffline = () => {
      setSyncStatus('offline_pending');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [uid, pushStateToCloud]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.uid !== uid) return;
      if (Array.isArray(detail.schedules)) {
        schedulesRef.current = detail.schedules;
        setSchedulesState((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.schedules) ? prev : detail.schedules
        );
      }
      if (Array.isArray(detail.prescriptions)) {
        prescriptionsRef.current = detail.prescriptions;
        setPrescriptionsState((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.prescriptions)
            ? prev
            : detail.prescriptions
        );
      }
      if (Array.isArray(detail.treatmentEvents)) {
        treatmentEventsRef.current = detail.treatmentEvents;
        setTreatmentEventsState((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.treatmentEvents)
            ? prev
            : detail.treatmentEvents
        );
      }
      if (detail.radarWorkspace) {
        radarWorkspaceRef.current = detail.radarWorkspace;
        setRadarWorkspaceState((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.radarWorkspace)
            ? prev
            : detail.radarWorkspace
        );
      }
    };
    window.addEventListener(SCHEDULES_EVENT, handler);
    return () => window.removeEventListener(SCHEDULES_EVENT, handler);
  }, [uid]);

  const appendTreatmentEvents = useCallback(
    (newEvents: Omit<TreatmentJourneyEvent, 'id' | 'timestamp'>[], customNowIso?: string) => {
      if (newEvents.length === 0) return treatmentEventsRef.current;
      const nowIso = customNowIso || new Date().toISOString();
      const stamped: TreatmentJourneyEvent[] = newEvents.map((ev, idx) => ({
        ...ev,
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${idx}`,
        timestamp: nowIso,
      }));
      const merged = stripUndefined(
        mergeTreatmentEvents([...stamped, ...treatmentEventsRef.current], [])
      );
      treatmentEventsRef.current = merged;
      setTreatmentEventsState(merged);
      try {
        localStorage.setItem(getTreatmentEventsStorageKey(uid), JSON.stringify(merged));
        window.dispatchEvent(
          new CustomEvent(SCHEDULES_EVENT, { detail: { uid, treatmentEvents: merged } })
        );
      } catch {}
      return merged;
    },
    [uid]
  );

  const updatePrescriptions = useCallback(
    (
      updater: SavedPrescription[] | ((prev: SavedPrescription[]) => SavedPrescription[]),
      eventToRecord?: Omit<TreatmentJourneyEvent, 'id' | 'timestamp'>
    ) => {
      const prev = prescriptionsRef.current;
      const nextRaw = typeof updater === 'function' ? updater(prev) : updater;
      const nowIso = new Date().toISOString();

      const nextIds = new Set(nextRaw.map((p) => p.id));
      const updatedDeletedRx = { ...deletedPrescriptionsMapRef.current };
      for (const oldRx of prev) {
        if (!nextIds.has(oldRx.id)) {
          updatedDeletedRx[oldRx.id] = nowIso;
        }
      }

      const stampedRaw = nextRaw.map((p) => {
        const oldMatch = prev.find((old) => old.id === p.id);
        if (!oldMatch || JSON.stringify(oldMatch) !== JSON.stringify(p)) {
          return { ...p, updatedAt: nowIso };
        }
        return p;
      });

      const next = stripUndefined(normalizePrescriptions(stampedRaw));
      deletedPrescriptionsMapRef.current = updatedDeletedRx;
      prescriptionsRef.current = next;
      setPrescriptionsState(next);

      const nextEvents = eventToRecord
        ? appendTreatmentEvents([eventToRecord], nowIso)
        : treatmentEventsRef.current;

      try {
        localStorage.setItem(getPrescriptionsStorageKey(uid), JSON.stringify(next));
        localStorage.setItem(
          getDeletedPrescriptionsStorageKey(uid),
          JSON.stringify(stripUndefined(updatedDeletedRx))
        );
        window.dispatchEvent(
          new CustomEvent(SCHEDULES_EVENT, {
            detail: { uid, prescriptions: next, treatmentEvents: nextEvents },
          })
        );
      } catch (err) {
        console.error('Failed to save prescriptions locally:', err);
      }

      if (uid && configured && db) {
        void pushStateToCloud(
          uid,
          schedulesRef.current,
          deletedMapRef.current,
          radarWorkspaceRef.current,
          next,
          updatedDeletedRx,
          nextEvents
        );
      } else {
        setSyncStatus('local_only');
      }
    },
    [uid, appendTreatmentEvents, pushStateToCloud]
  );

  const deletePrescriptionById = useCallback(
    (prescriptionId: string) => {
      updatePrescriptions((prev) => prev.filter((p) => p.id !== prescriptionId));
    },
    [updatePrescriptions]
  );

  const updateSchedules = useCallback(
    (
      updater: TreatmentSchedule[] | ((prev: TreatmentSchedule[]) => TreatmentSchedule[]),
      eventsToRecord?: Omit<TreatmentJourneyEvent, 'id' | 'timestamp'>[]
    ) => {
      const prev = schedulesRef.current;
      const nextRaw = typeof updater === 'function' ? updater(prev) : updater;
      const nowIso = new Date().toISOString();

      const nextIds = new Set(nextRaw.map((s) => s.id));
      const updatedDeleted = { ...deletedMapRef.current };
      for (const oldSch of prev) {
        if (!nextIds.has(oldSch.id)) {
          updatedDeleted[oldSch.id] = nowIso;
        }
      }

      const stampedRaw = nextRaw.map((s) => {
        const oldMatch = prev.find((p) => p.id === s.id);
        if (!oldMatch || JSON.stringify(oldMatch) !== JSON.stringify(s)) {
          return { ...s, updatedAt: nowIso };
        }
        return s;
      });

      const next = stripUndefined(normalizeSchedules(stampedRaw));
      deletedMapRef.current = updatedDeleted;
      schedulesRef.current = next;
      setSchedulesState(next);

      const nextEvents =
        eventsToRecord && eventsToRecord.length > 0
          ? appendTreatmentEvents(eventsToRecord, nowIso)
          : treatmentEventsRef.current;

      try {
        localStorage.setItem(getSchedulesStorageKey(uid), JSON.stringify(next));
        localStorage.setItem(
          getDeletedSchedulesStorageKey(uid),
          JSON.stringify(stripUndefined(updatedDeleted))
        );
        window.dispatchEvent(
          new CustomEvent(SCHEDULES_EVENT, {
            detail: { uid, schedules: next, treatmentEvents: nextEvents },
          })
        );
      } catch (err) {
        console.error('Failed to save schedules locally:', err);
      }

      if (uid && configured && db) {
        void pushStateToCloud(
          uid,
          next,
          updatedDeleted,
          radarWorkspaceRef.current,
          prescriptionsRef.current,
          deletedPrescriptionsMapRef.current,
          nextEvents
        );
      } else {
        setSyncStatus('local_only');
      }
    },
    [uid, appendTreatmentEvents, pushStateToCloud]
  );

  const deleteScheduleById = useCallback(
    (scheduleId: string) => {
      const target = schedulesRef.current.find((s) => s.id === scheduleId);
      updateSchedules(
        (prev) => prev.filter((s) => s.id !== scheduleId),
        target
          ? [
              {
                type: 'schedule_deleted',
                scheduleId,
                medicineName: target.medicineName,
                summaryAr: `تم حذف جدول العلاج للدواء: ${target.medicineName}`,
                summaryEn: `Deleted treatment schedule for: ${target.medicineName}`,
              },
            ]
          : undefined
      );
    },
    [updateSchedules]
  );

  /**
   * Records a dose status transition ('taken', 'missed', or 'upcoming' undo) with:
   * - Strict duplicate dose event prevention (blocks recording the same status twice on the same dose)
   * - Safety warning if another dose of the same medication was just marked taken within 30 minutes
   * - Recording of both scheduledTime and actual timestamp (`takenAt` / `missedAt`)
   * - Optional patient documentation note & outcome (`documentedOutcome`)
   */
  const updateDoseStatus = useCallback(
    (
      scheduleId: string,
      doseId: string,
      newStatus: DoseStatus,
      options?: {
        note?: string;
        documentedOutcome?: DoseDocumentedOutcome;
        actualTimeIso?: string;
        allowRapidConsecutiveTaken?: boolean;
      }
    ): DoseUpdateResult => {
      const nowIso = options?.actualTimeIso || new Date().toISOString();
      const targetSch = schedulesRef.current.find((s) => s.id === scheduleId);
      if (!targetSch) {
        return { updated: false, reason: 'not_found' };
      }
      const targetDose = targetSch.doses.find((d) => d.id === doseId);
      if (!targetDose) {
        return { updated: false, reason: 'not_found' };
      }

      const nextNote = options?.note !== undefined ? options.note.trim() : targetDose.note || '';
      const nextOutcome = options?.documentedOutcome ?? targetDose.documentedOutcome;

      // 1. Prevent duplicate dose event on the exact same dose slot
      if (
        targetDose.status === newStatus &&
        (targetDose.note || '') === nextNote &&
        targetDose.documentedOutcome === nextOutcome
      ) {
        appendTreatmentEvents(
          [
            {
              type: 'duplicate_dose_blocked',
              scheduleId,
              doseId,
              medicineName: targetSch.medicineName,
              scheduledTime: targetDose.scheduledTime,
              actualTime: nowIso,
              summaryAr: `تم منع تسجيل مكرر لنفس الجرعة (اليوم ${targetDose.dayNumber} - الجرعة ${targetDose.doseNumberInDay}) من ${targetSch.medicineName}.`,
              summaryEn: `Blocked duplicate dose event for Day ${targetDose.dayNumber} Dose #${targetDose.doseNumberInDay} (${targetSch.medicineName}).`,
            },
          ],
          nowIso
        );
        return {
          updated: false,
          reason: 'already_recorded',
          messageAr: 'تم تسجيل هذه الجرعة بالفعل بنفس الحالة — تم منع التكرار لحماية دقة سجل الجرعات.',
          messageEn: 'This dose is already recorded with the same status — duplicate dose event prevented.',
        };
      }

      // 2. Warn/prevent accidental double dose within 30 minutes on the same schedule
      if (newStatus === 'taken' && !options?.allowRapidConsecutiveTaken) {
        const nowMs = Date.parse(nowIso) || Date.now();
        const recentOtherTaken = targetSch.doses.find((d) => {
          if (d.id === doseId || d.status !== 'taken' || !d.takenAt) return false;
          const takenMs = Date.parse(d.takenAt);
          return !isNaN(takenMs) && Math.abs(nowMs - takenMs) < 30 * 60 * 1000;
        });

        if (recentOtherTaken) {
          // Still allow recording if it is a past day's retrospective log, but if both are today/adjacent, warn if scheduled times differ
          const sameScheduledDate =
            recentOtherTaken.scheduledTime.slice(0, 10) === targetDose.scheduledTime.slice(0, 10);
          if (sameScheduledDate && recentOtherTaken.dayNumber === targetDose.dayNumber) {
            // Record the dose if user explicitly clicked it, OR return safety warning?
            //Wait: let's check if we should record it only when confirmed or if we should block unconfirmed rapid double-dosing within 2 minutes!
            const takenMs = Date.parse(recentOtherTaken.takenAt!);
            if (Math.abs(nowMs - takenMs) < 60 * 1000) {
              appendTreatmentEvents(
                [
                  {
                    type: 'duplicate_dose_blocked',
                    scheduleId,
                    doseId,
                    medicineName: targetSch.medicineName,
                    scheduledTime: targetDose.scheduledTime,
                    actualTime: nowIso,
                    summaryAr: `تنبيه أمان: تم رصد محاولة تسجيل جرعتين متتاليتين خلال أقل من دقيقة للدواء ${targetSch.medicineName} — لا تضاعف الجرعة أبداً.`,
                    summaryEn: `Safety guard: Prevented logging two consecutive doses within 1 minute for ${targetSch.medicineName} — never double a dose.`,
                  },
                ],
                nowIso
              );
              return {
                updated: false,
                reason: 'rapid_duplicate_taken_warning',
                messageAr:
                  '⚠️ تنبيه سلامة دوائية: لقد سجلت جرعة أخرى من نفس المضاد الحيوي منذ لحظات! لا تضاعف الجرعة أبداً ولا تأخذ جرعة تعويضية. إذا كنت توثق جرعة سابقة أخذتها في موعدها الفعلي، استخدم خيار «توثيق متقدم للجرعة».',
                messageEn:
                  '⚠️ Medication Safety Alert: You just logged another dose of this antibiotic moments ago! Never double a dose or take a replacement dose. To log a past dose retrospectively, use "Document Dose Details".',
              };
            }
          }
        }
      }

      let eventItem: Omit<TreatmentJourneyEvent, 'id' | 'timestamp'>;
      if (newStatus === 'taken') {
        const outcome: DoseDocumentedOutcome =
          options?.documentedOutcome ||
          (new Date(nowIso) > new Date(new Date(targetDose.scheduledTime).getTime() + 60 * 60 * 1000)
            ? 'taken_late'
            : 'taken_on_time');
        eventItem = {
          type: 'dose_taken',
          scheduleId,
          doseId,
          medicineName: targetSch.medicineName,
          scheduledTime: targetDose.scheduledTime,
          actualTime: nowIso,
          summaryAr: `✅ تم تسجيل أخذ الجرعة ${targetDose.doseNumberInDay} (اليوم ${targetDose.dayNumber}) من ${targetSch.medicineName} (${formatDocumentedOutcomeLabel(outcome, true)})${nextNote ? ` — ملاحظة: ${nextNote}` : ''}`,
          summaryEn: `✅ Recorded Dose #${targetDose.doseNumberInDay} (Day ${targetDose.dayNumber}) of ${targetSch.medicineName} as Taken (${formatDocumentedOutcomeLabel(outcome, false)})${nextNote ? ` — Note: ${nextNote}` : ''}`,
        };
      } else if (newStatus === 'missed') {
        const outcome: DoseDocumentedOutcome =
          options?.documentedOutcome || 'missed_confirmed';
        eventItem = {
          type:
            outcome === 'held_for_clarification' || outcome === 'skipped_clinician_advice'
              ? 'dose_documented'
              : 'dose_missed',
          scheduleId,
          doseId,
          medicineName: targetSch.medicineName,
          scheduledTime: targetDose.scheduledTime,
          actualTime: nowIso,
          summaryAr: `❌ تم توثيق الجرعة ${targetDose.doseNumberInDay} (اليوم ${targetDose.dayNumber}) من ${targetSch.medicineName}: ${formatDocumentedOutcomeLabel(outcome, true)}${nextNote ? ` — ملاحظة: ${nextNote}` : ''}`,
          summaryEn: `❌ Documented Dose #${targetDose.doseNumberInDay} (Day ${targetDose.dayNumber}) of ${targetSch.medicineName}: ${formatDocumentedOutcomeLabel(outcome, false)}${nextNote ? ` — Note: ${nextNote}` : ''}`,
        };
      } else {
        eventItem = {
          type: 'dose_undone',
          scheduleId,
          doseId,
          medicineName: targetSch.medicineName,
          scheduledTime: targetDose.scheduledTime,
          actualTime: nowIso,
          summaryAr: `↩ تم التراجع عن حالة الجرعة ${targetDose.doseNumberInDay} (اليوم ${targetDose.dayNumber}) من ${targetSch.medicineName} وإعادتها إلى غير مسجلة.`,
          summaryEn: `↩ Reset status for Dose #${targetDose.doseNumberInDay} (Day ${targetDose.dayNumber}) of ${targetSch.medicineName}.`,
        };
      }

      updateSchedules(
        (prev) =>
          prev.map((sch) => {
            if (sch.id !== scheduleId) return sch;
            const updatedDoses = sch.doses.map((d) => {
              if (d.id !== doseId) return d;
              const {
                takenAt: _oldTaken,
                missedAt: _oldMissed,
                documentedOutcome: _oldOutcome,
                note: _oldNote,
                ...rest
              } = d;
              if (newStatus === 'taken') {
                const outcome: DoseDocumentedOutcome =
                  options?.documentedOutcome ||
                  (new Date(nowIso) >
                  new Date(new Date(d.scheduledTime).getTime() + 60 * 60 * 1000)
                    ? 'taken_late'
                    : 'taken_on_time');
                return {
                  ...rest,
                  status: 'taken' as const,
                  takenAt: nowIso,
                  statusUpdatedAt: nowIso,
                  documentedOutcome: outcome,
                  ...(nextNote ? { note: nextNote } : {}),
                };
              }
              if (newStatus === 'missed') {
                const outcome: DoseDocumentedOutcome =
                  options?.documentedOutcome || 'missed_confirmed';
                return {
                  ...rest,
                  status: 'missed' as const,
                  missedAt: nowIso,
                  statusUpdatedAt: nowIso,
                  documentedOutcome: outcome,
                  ...(nextNote ? { note: nextNote } : {}),
                };
              }
              return {
                ...rest,
                status: 'upcoming' as const,
                statusUpdatedAt: nowIso,
              };
            });
            return {
              ...sch,
              updatedAt: nowIso,
              doses: updatedDoses,
            };
          }),
        [eventItem]
      );

      return { updated: true };
    },
    [updateSchedules, appendTreatmentEvents]
  );

  const updateRadarWorkspace = useCallback(
    (partial: Partial<Omit<RadarWorkspaceState, 'updatedAt'>>) => {
      const nowIso = new Date().toISOString();
      const next: RadarWorkspaceState = normalizeRadarWorkspace({
        ...radarWorkspaceRef.current,
        ...partial,
        updatedAt: nowIso,
      });
      radarWorkspaceRef.current = next;
      setRadarWorkspaceState(next);

      try {
        localStorage.setItem(getRadarWorkspaceStorageKey(uid), JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent(SCHEDULES_EVENT, { detail: { uid, radarWorkspace: next } })
        );
      } catch {}

      if (uid && configured && db) {
        void pushStateToCloud(
          uid,
          schedulesRef.current,
          deletedMapRef.current,
          next,
          prescriptionsRef.current,
          deletedPrescriptionsMapRef.current,
          treatmentEventsRef.current
        );
      }
    },
    [uid, pushStateToCloud]
  );

  const retrySync = useCallback(() => {
    if (!uid) return;
    void pushStateToCloud(
      uid,
      schedulesRef.current,
      deletedMapRef.current,
      radarWorkspaceRef.current,
      prescriptionsRef.current,
      deletedPrescriptionsMapRef.current,
      treatmentEventsRef.current
    );
  }, [uid, pushStateToCloud]);

  const syncing = syncStatus === 'loading' || syncStatus === 'saving';

  return {
    schedules,
    setSchedules: updateSchedules,
    deleteScheduleById,
    updateDoseStatus,
    prescriptions,
    setPrescriptions: updatePrescriptions,
    deletePrescriptionById,
    treatmentEvents,
    recordTreatmentEvents: appendTreatmentEvents,
    radarWorkspace,
    updateRadarWorkspace,
    syncing,
    initialLoading,
    syncStatus,
    syncError,
    lastSyncedAt,
    retrySync,
    isAuthenticated: Boolean(uid),
  };
}

export function getDoseStatus(dose: ScheduledDose, now = new Date()): DoseStatus {
  if (dose.status === 'taken') return 'taken';
  if (dose.status === 'missed') return 'missed';
  const scheduled = new Date(dose.scheduledTime);
  if (!isNaN(scheduled.getTime()) && now > scheduled) return 'unconfirmed';
  return 'upcoming';
}

export function calculateScheduleProgress(sch: TreatmentSchedule, now = new Date()) {
  const totalDoses = sch.doses.length;
  let takenCount = 0;
  let missedCount = 0;
  let unconfirmedCount = 0;
  let upcomingCount = 0;

  for (const d of sch.doses) {
    const st = getDoseStatus(d, now);
    if (st === 'taken') takenCount++;
    else if (st === 'missed') missedCount++;
    else if (st === 'unconfirmed') unconfirmedCount++;
    else upcomingCount++;
  }

  const progressPercent = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;
  return {
    totalDoses,
    takenCount,
    missedCount,
    unconfirmedCount,
    upcomingCount,
    progressPercent,
  };
}

export function generateScheduleDoses(
  scheduleId: string,
  startDateStr: string,
  doseTimes: string[],
  durationDays: number,
  existingDoses?: ScheduledDose[]
): ScheduledDose[] {
  const doses: ScheduledDose[] = [];
  const parts = startDateStr.split('-').map(Number);
  const now = new Date();
  const [startYear, startMonth, startDay] =
    parts.length === 3 && !parts.some(isNaN)
      ? parts
      : [now.getFullYear(), now.getMonth() + 1, now.getDate()];

  for (let day = 0; day < durationDays; day++) {
    const currentDate = new Date(startYear, startMonth - 1, startDay + day);
    const dateStr = formatLocalDateYYYYMMDD(currentDate);

    doseTimes.forEach((timeStr, idx) => {
      const cleanTime = /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : '08:00';
      const scheduledIso = `${dateStr}T${cleanTime}:00`;
      const dayNum = day + 1;
      const doseNum = idx + 1;
      const doseId = `${scheduleId}-d${dayNum}-${doseNum}`;

      const prevMatch = existingDoses?.find(
        (ed) =>
          ed.id === doseId ||
          (ed.dayNumber === dayNum && ed.doseNumberInDay === doseNum)
      );

      if (prevMatch && (prevMatch.status === 'taken' || prevMatch.status === 'missed')) {
        doses.push({
          ...prevMatch,
          id: doseId,
          scheduleId,
          dayNumber: dayNum,
          doseNumberInDay: doseNum,
          scheduledTime: scheduledIso,
        });
      } else {
        doses.push({
          id: doseId,
          scheduleId,
          dayNumber: dayNum,
          doseNumberInDay: doseNum,
          scheduledTime: scheduledIso,
          status: 'upcoming',
        });
      }
    });
  }

  return doses;
}

/**
 * Builds a complete, structured Patient Treatment Journey Report object for export or printing.
 * Explicitly separates Missing Records (Overdue Unconfirmed) from Confirmed Missed Doses.
 */
export function buildPatientTreatmentReportPayload(params: {
  patientName?: string;
  userEmail?: string | null;
  syncStatus: CloudSyncStatus;
  prescriptions: SavedPrescription[];
  schedules: TreatmentSchedule[];
  treatmentEvents: TreatmentJourneyEvent[];
  generatedAt?: string;
  now?: Date;
}) {
  const generatedAt = params.generatedAt || new Date().toISOString();
  const now = params.now || new Date();

  const scheduleSummaries = params.schedules.map((sch) => {
    const stats = calculateScheduleProgress(sch, now);
    return {
      id: sch.id,
      prescriptionId: sch.prescriptionId || null,
      medicineName: sch.medicineName,
      prescribedDose: sch.prescribedDose,
      route: sch.route,
      frequency: sch.frequency,
      doseTimes: sch.doseTimes,
      startDate: sch.startDate,
      endDate: sch.endDate,
      durationDays: sch.durationDays,
      verificationStatus: sch.verificationStatus || 'verified_by_patient',
      verifiedAt: sch.verifiedAt || sch.createdAt,
      captureMethod: sch.captureMethod || 'manual_entry',
      clarificationFlags: sch.clarificationFlags || [],
      notes: sch.notes || '',
      adherenceSummary: {
        totalScheduledDoses: stats.totalDoses,
        recordedTakenDoses: stats.takenCount,
        confirmedMissedDoses: stats.missedCount,
        missingRecordsOverdueUnconfirmed: stats.unconfirmedCount,
        upcomingFutureDoses: stats.upcomingCount,
        recordedAdherencePercent: stats.progressPercent,
      },
      doseRecords: sch.doses.map((d) => {
        const computedStatus = getDoseStatus(d, now);
        return {
          doseId: d.id,
          dayNumber: d.dayNumber,
          doseNumberInDay: d.doseNumberInDay,
          scheduledTimestamp: d.scheduledTime,
          status: computedStatus,
          statusCategory:
            computedStatus === 'taken'
              ? 'CONFIRMED_TAKEN'
              : computedStatus === 'missed'
                ? 'CONFIRMED_MISSED'
                : computedStatus === 'unconfirmed'
                  ? 'MISSING_RECORD_OVERDUE_UNCONFIRMED'
                  : 'UPCOMING_SCHEDULED',
          actualRecordedTimestamp:
            d.status === 'taken' ? d.takenAt || null : d.status === 'missed' ? d.missedAt || null : null,
          documentedOutcome: d.documentedOutcome || null,
          patientNote: d.note || null,
        };
      }),
    };
  });

  return {
    reportTitle: 'Patient Antibiotic Treatment Journey & Dose History Report',
    generatedAt,
    patientName: params.patientName || 'Patient',
    accountEmail: params.userEmail || 'Guest / Local Session',
    cloudSyncStatus: params.syncStatus,
    clinicalSafetyDisclaimer:
      'Self-maintained patient tracking report. Not a substitute for professional medical advice. Missing records (Overdue Unconfirmed) indicate unrecorded past dose slots and are distinct from Confirmed Missed Doses. Never double a dose or take an unprescribed replacement dose.',
    prescriptions: params.prescriptions,
    treatmentSchedules: scheduleSummaries,
    treatmentJourneyEvents: params.treatmentEvents.slice(0, 100),
  };
}

export function downloadTreatmentReportJson(params: {
  patientName?: string;
  userEmail?: string | null;
  syncStatus: CloudSyncStatus;
  prescriptions: SavedPrescription[];
  schedules: TreatmentSchedule[];
  treatmentEvents: TreatmentJourneyEvent[];
}): void {
  const payload = buildPatientTreatmentReportPayload(params);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const datePart = formatLocalDateYYYYMMDD();
  a.download = `patient-treatment-journey-report-${datePart}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
