/**
 * passportService.ts
 * Smart Patient Passport — Firebase service layer
 */

import {
  doc, getDoc, setDoc, collection, addDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, configured } from './firebase';

export interface PassportShare {
  pin: string;
  expiresAt: number;
  createdAt: number;
}

export interface PassportAccessLog {
  accessedAt: number;
  note: string;
}

/** رفع صورة البطاقة لـ Firebase Storage */
export async function uploadPassportPhoto(uid: string, file: File): Promise<string> {
  if (!configured || !storage) throw new Error('STORAGE_NOT_CONFIGURED');
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const storageRef = ref(storage, `passport_photos/${uid}/photo.${ext}`);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
  const url = await getDownloadURL(storageRef);
  return url;
}

/** حفظ URL الصورة في Firestore */
export async function savePassportPhotoUrl(uid: string, url: string): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'passportShares', uid), { photoUrl: url }, { merge: true });
}

/** جيب URL الصورة */
export async function getPassportPhotoUrl(uid: string): Promise<string> {
  if (!db) return '';
  const snap = await getDoc(doc(db, 'passportShares', uid));
  return snap.exists() ? (snap.data().photoUrl || '') : '';
}

/** جيب حالة المشاركة */
export async function getPassportShare(uid: string): Promise<PassportShare | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'passportShares', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d.pin && !d.expiresAt) return null;
  return { pin: d.pin || '', expiresAt: d.expiresAt || 0, createdAt: d.createdAt || 0 };
}

/** تفعيل المشاركة */
export async function sharePassport(uid: string, pin: string, hours: number): Promise<void> {
  if (!db) return;
  const now = Date.now();
  await setDoc(doc(db, 'passportShares', uid), {
    pin,
    expiresAt: now + hours * 60 * 60 * 1000,
    createdAt: now,
  }, { merge: true });
}

/** إيقاف المشاركة */
export async function revokePassport(uid: string): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'passportShares', uid), {
    pin: '', expiresAt: 0, createdAt: 0,
  }, { merge: true });
}

/** التحقق من PIN والمدة */
export function isPassportValid(share: PassportShare | null, enteredPin: string): boolean {
  if (!share) return false;
  if (Date.now() > share.expiresAt) return false;
  return share.pin === enteredPin;
}

/** تسجيل دخول */
export async function logPassportAccess(uid: string): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, 'passportShares', uid, 'accessLogs'), {
      accessedAt: Date.now(), note: 'passport_viewed',
    });
  } catch { /* اختياري */ }
}

/** سجل الوصول */
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
