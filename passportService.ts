/**
 * passportService.ts
 * Smart Patient Passport — Cloudinary للصور + Firebase للبيانات
 */

import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const CLOUD_NAME = 'gdcfiqr3';
const UPLOAD_PRESET = 'passport_photos';

/** رفع صورة لـ Cloudinary — مجاني 100% */
export async function uploadPassportPhoto(_uid: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary error: ${err}`);
  }
  const data = await res.json();
  return data.secure_url as string;
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
}

export interface PassportAccessLog {
  accessedAt: number;
  note: string;
}

export async function getPassportShare(uid: string): Promise<PassportShare | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'passportShares', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    if (!d.pin && !d.expiresAt) return null;
    return { pin: d.pin || '', expiresAt: d.expiresAt || 0, createdAt: d.createdAt || 0 };
  } catch { return null; }
}

export async function sharePassport(uid: string, pin: string, hours: number): Promise<void> {
  if (!db) return;
  const now = Date.now();
  await setDoc(doc(db, 'passportShares', uid), {
    pin,
    expiresAt: now + hours * 60 * 60 * 1000,
    createdAt: now,
  }, { merge: true });
}

export async function revokePassport(uid: string): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'passportShares', uid), {
    pin: '', expiresAt: 0, createdAt: 0,
  }, { merge: true });
}

export function isPassportValid(share: PassportShare | null, enteredPin: string): boolean {
  if (!share) return false;
  if (Date.now() > share.expiresAt) return false;
  return share.pin === enteredPin;
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
