/**
 * passportService.ts
 * Smart Patient Passport — Cloudinary للصور + Firebase للبيانات
 */

import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import type { UserHealthProfile } from './allergyData';


/**
 * تحويل الصورة لـ base64 مضغوطة وحفظها في Firestore مباشرة
 * لا يحتاج أي سيرفر خارجي
 */
export async function uploadPassportPhoto(_uid: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // ضغط الصورة أولاً عبر Canvas
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX = 400; // حد أقصى للعرض أو الارتفاع
      let w = img.width;
      let h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
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
  if (!db) return;
  await setDoc(doc(db, 'passportShares', uid), { photoUrl: url }, { merge: true });
}

/** جيب URL الصورة */
export async function getPassportPhotoUrl(uid: string): Promise<string> {
  if (!db) return '';
  try {
    const snap = await getDoc(doc(db, 'passportShares', uid));
    return snap.exists() ? (snap.data().photoUrl || '') : '';
  } catch { return ''; }
}

export interface PassportShare {
  pin: string;
  expiresAt: number;
  createdAt: number;
  photoUrl?: string;
  sharedProfile?: Partial<UserHealthProfile> | null;
}

export interface PassportAccessLog {
  accessedAt: number;
  note: string;
}

export async function getPassportShare(uid: string): Promise<PassportShare | null> {
  if (!configured || !db) return null;
  try {
    const snap = await getDoc(doc(db, 'passportShares', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    const cleanPin = typeof d.pin === 'string' ? d.pin.trim() : '';
    // Ignore legacy/corrupted documents that have no PIN set
    if (!cleanPin) return null;
    return {
      pin: cleanPin,
      expiresAt: typeof d.expiresAt === 'number' ? d.expiresAt : 0,
      createdAt: typeof d.createdAt === 'number' ? d.createdAt : 0,
      photoUrl: typeof d.photoUrl === 'string' ? d.photoUrl : '',
      sharedProfile: d.sharedProfile || null,
    };
  } catch { return null; }
}

export async function sharePassport(
  uid: string,
  pin: string,
  hours: number,
  profileSnapshot?: UserHealthProfile
): Promise<void> {
  if (!configured || !db) return;
  const now = Date.now();
  const payload: Record<string, unknown> = {
    pin: pin.trim(),
    expiresAt: hours > 0 ? now + hours * 60 * 60 * 1000 : 0,
    createdAt: now,
  };
  if (profileSnapshot) {
    payload.sharedProfile = {
      displayName: profileSnapshot.displayName || '',
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
    };
  }
  await setDoc(doc(db, 'passportShares', uid), payload, { merge: true });
}

export async function revokePassport(uid: string): Promise<void> {
  if (!configured || !db) return;
  await setDoc(doc(db, 'passportShares', uid), {
    expiresAt: 0,
    sharedProfile: null,
  }, { merge: true });
}

export function isPassportValid(share: PassportShare | null, enteredPin: string): boolean {
  if (!share || !share.pin) return false;
  if (share.expiresAt <= 0 || Date.now() > share.expiresAt) return false;
  return share.pin === enteredPin.trim();
}

export async function logPassportAccess(uid: string): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, 'passportShares', uid, 'accessLogs'), {
      accessedAt: Date.now(), note: 'passport_viewed',
    });
  } catch { /* اختياري */ }
}

export async function getPassportAccessLogs(uid: string): Promise<PassportAccessLog[]> {
  if (!db) return [];
  try {
    const { getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'passportShares', uid, 'accessLogs'));
    return snap.docs
      .map((d) => d.data() as PassportAccessLog)
      .sort((a, b) => b.accessedAt - a.accessedAt)
      .slice(0, 10);
  } catch { return []; }
}
