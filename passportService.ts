/**
 * passportService.ts
 * Smart Patient Passport — خدمة مشاركة ومزامنة البطاقة الصحية الذكية للمريض
 */

import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import type { UserHealthProfile } from './allergyData';
import type { SavedPrescription, TreatmentSchedule } from './trackerData';

/**
 * تحويل الصورة لـ base64 مضغوطة وحفظها في Firestore مباشرة
 * لا يحتاج أي سيرفر خارجي
 */
export async function uploadPassportPhoto(_uid: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX = 400;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > MAX) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        }
      } else {
        if (h > MAX) {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.75);
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/** حفظ URL الصورة في Firestore */
export async function savePassportPhotoUrl(uid: string, url: string): Promise<void> {
  if (!configured || !db || !uid) return;
  await setDoc(doc(db, 'passportShares', uid), { photoUrl: url, updatedAt: Date.now() }, { merge: true });
}

/** جيب URL الصورة */
export async function getPassportPhotoUrl(uid: string): Promise<string> {
  if (!configured || !db || !uid) return '';
  try {
    const snap = await getDoc(doc(db, 'passportShares', uid));
    return snap.exists() ? (snap.data().photoUrl || '') : '';
  } catch {
    return '';
  }
}

export interface PassportShare {
  pin: string;
  expiresAt: number;
  createdAt: number;
  photoUrl?: string;
  authDisplayName?: string;
  authEmail?: string;
  sharedProfile?: Partial<UserHealthProfile> | null;
  sharedSchedules?: TreatmentSchedule[];
  sharedPrescriptions?: SavedPrescription[];
}

export interface PassportAccessLog {
  accessedAt: number;
  note: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

export function buildSharedProfilePayload(profileSnapshot?: UserHealthProfile | null): Record<string, unknown> | null {
  if (!profileSnapshot) return null;
  const fallbackName =
    profileSnapshot.displayName?.trim() ||
    auth?.currentUser?.displayName?.trim() ||
    auth?.currentUser?.email?.split('@')[0] ||
    '';
  return stripUndefinedDeep({
    displayName: fallbackName,
    age: profileSnapshot.age || '',
    weightKg: profileSnapshot.weightKg || '',
    gender: profileSnapshot.gender || '',
    bloodType: profileSnapshot.bloodType || '',
    emergencyContact: profileSnapshot.emergencyContact || '',
    pregnancyStatus: profileSnapshot.pregnancyStatus || 'unknown',
    renalStatus: profileSnapshot.renalStatus || 'unknown',
    hepaticStatus: profileSnapshot.hepaticStatus || 'unknown',
    notes: profileSnapshot.notes || '',
    allergies: Array.isArray(profileSnapshot.allergies) ? profileSnapshot.allergies : [],
    medications: Array.isArray(profileSnapshot.medications) ? profileSnapshot.medications : [],
    chronicConditions: Array.isArray(profileSnapshot.chronicConditions)
      ? profileSnapshot.chronicConditions
      : [],
    medicalDocuments: Array.isArray(profileSnapshot.medicalDocuments)
      ? profileSnapshot.medicalDocuments.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          fileName: d.fileName,
          mimeType: d.mimeType,
          fileSize: d.fileSize,
          extractedSummary: d.extractedSummary,
          extractedFields: d.extractedFields || {},
          unreadableFields: d.unreadableFields || [],
          verificationStatus: d.verificationStatus,
          source: d.source,
          createdAt: d.createdAt,
          ...(d.downloadUrl ? { downloadUrl: d.downloadUrl } : {}),
          ...(d.previewDataUrl ? { previewDataUrl: d.previewDataUrl } : {}),
        }))
      : [],
  });
}

/**
 * مزامنة تلقائية لبيانات المريض الصحية مع مستند البطاقة الذكية `passportShares/{uid}`
 * بحيث يرى الطبيب أو الممرض أحدث البيانات فور مسح الـ QR حتى لو عدّل المريض بياناته بعد تفعيل البطاقة.
 */
export async function syncProfileToPassportShare(
  uid: string,
  profileSnapshot: UserHealthProfile,
  extras?: {
    schedules?: TreatmentSchedule[];
    prescriptions?: SavedPrescription[];
    authDisplayName?: string;
    authEmail?: string;
  }
): Promise<void> {
  if (!configured || !db || !uid) return;
  try {
    const payload: Record<string, unknown> = {
      sharedProfile: buildSharedProfilePayload(profileSnapshot),
      authDisplayName:
        profileSnapshot.displayName?.trim() ||
        extras?.authDisplayName?.trim() ||
        auth?.currentUser?.displayName?.trim() ||
        '',
      authEmail: extras?.authEmail || auth?.currentUser?.email || '',
      updatedAt: Date.now(),
    };
    if (extras?.schedules) {
      payload.sharedSchedules = stripUndefinedDeep(extras.schedules);
    }
    if (extras?.prescriptions) {
      payload.sharedPrescriptions = stripUndefinedDeep(extras.prescriptions);
    }
    await setDoc(doc(db, 'passportShares', uid), payload, { merge: true });
  } catch {
    /* ignore offline or permission errors */
  }
}

export async function getPassportShare(uid: string): Promise<PassportShare | null> {
  if (!configured || !db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'passportShares', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    const cleanPin = typeof d.pin === 'string' ? d.pin.trim() : '';
    const expiresAt = typeof d.expiresAt === 'number' ? d.expiresAt : 0;
    if (!cleanPin && expiresAt <= 0 && !d.sharedProfile && !d.photoUrl) return null;
    return {
      pin: cleanPin,
      expiresAt,
      createdAt: typeof d.createdAt === 'number' ? d.createdAt : 0,
      photoUrl: typeof d.photoUrl === 'string' ? d.photoUrl : '',
      authDisplayName: typeof d.authDisplayName === 'string' ? d.authDisplayName : '',
      authEmail: typeof d.authEmail === 'string' ? d.authEmail : '',
      sharedProfile: d.sharedProfile || null,
      sharedSchedules: Array.isArray(d.sharedSchedules) ? (d.sharedSchedules as TreatmentSchedule[]) : [],
      sharedPrescriptions: Array.isArray(d.sharedPrescriptions)
        ? (d.sharedPrescriptions as SavedPrescription[])
        : [],
    };
  } catch {
    return null;
  }
}

export async function sharePassport(
  uid: string,
  pin: string,
  hours: number,
  profileSnapshot?: UserHealthProfile,
  extras?: {
    schedules?: TreatmentSchedule[];
    prescriptions?: SavedPrescription[];
    authDisplayName?: string;
    authEmail?: string;
  }
): Promise<void> {
  if (!configured || !db || !uid) return;
  const now = Date.now();
  const effectiveHours = hours > 0 ? hours : 24;
  const payload: Record<string, unknown> = {
    pin: pin.trim(),
    expiresAt: now + effectiveHours * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
    authDisplayName:
      profileSnapshot?.displayName?.trim() ||
      extras?.authDisplayName?.trim() ||
      auth?.currentUser?.displayName?.trim() ||
      '',
    authEmail: extras?.authEmail || auth?.currentUser?.email || '',
  };
  if (profileSnapshot) {
    payload.sharedProfile = buildSharedProfilePayload(profileSnapshot);
  }
  if (extras?.schedules) {
    payload.sharedSchedules = stripUndefinedDeep(extras.schedules);
  }
  if (extras?.prescriptions) {
    payload.sharedPrescriptions = stripUndefinedDeep(extras.prescriptions);
  }
  await setDoc(doc(db, 'passportShares', uid), payload, { merge: true });
}

export async function revokePassport(uid: string): Promise<void> {
  if (!configured || !db || !uid) return;
  await setDoc(
    doc(db, 'passportShares', uid),
    {
      expiresAt: 0,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export function isPassportValid(share: PassportShare | null, enteredPin: string): boolean {
  if (!share || !share.pin) return false;
  if (share.expiresAt <= 0 || Date.now() > share.expiresAt) return false;
  return share.pin === enteredPin.trim();
}

export async function logPassportAccess(uid: string): Promise<void> {
  if (!configured || !db || !uid) return;
  try {
    await addDoc(collection(db, 'passportShares', uid, 'accessLogs'), {
      accessedAt: Date.now(),
      note: 'passport_viewed',
    });
  } catch {
    /* اختياري */
  }
}

export async function getPassportAccessLogs(uid: string): Promise<PassportAccessLog[]> {
  if (!configured || !db || !uid) return [];
  try {
    const { getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'passportShares', uid, 'accessLogs'));
    return snap.docs
      .map((d) => d.data() as PassportAccessLog)
      .sort((a, b) => b.accessedAt - a.accessedAt)
      .slice(0, 10);
  } catch {
    return [];
  }
}
