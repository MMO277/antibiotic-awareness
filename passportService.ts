/**
 * passportService.ts
 * Smart Patient Passport — Firebase service layer
 * - كل مريض ليه passport_id ثابت (= uid)
 * - المريض يشارك بـ PIN + مدة
 * - بعد انتهاء المدة الصلاحية تنتهي تلقائيًا
 */

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface PassportShare {
  pin: string;           // PIN المريض (مخزنة plain — مش sensitive data طبية)
  expiresAt: number;     // timestamp بالمللي ثانية
  createdAt: number;
}

export interface PassportAccessLog {
  accessedAt: number;
  note: string;
}

/** يجيب حالة المشاركة الحالية للمريض */
export async function getPassportShare(uid: string): Promise<PassportShare | null> {
  if (!db) return null;
  const ref = doc(db, 'passportShares', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as PassportShare;
}

/** المريض يشارك البطاقة: يحدد PIN ومدة (بالساعات) */
export async function sharePassport(uid: string, pin: string, hours: number): Promise<void> {
  if (!db) return;
  const now = Date.now();
  const share: PassportShare = {
    pin,
    expiresAt: now + hours * 60 * 60 * 1000,
    createdAt: now,
  };
  await setDoc(doc(db, 'passportShares', uid), share);
}

/** المريض يوقف المشاركة فورًا */
export async function revokePassport(uid: string): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'passportShares', uid), {
    pin: '',
    expiresAt: 0,
    createdAt: 0,
  });
}

/** التحقق من PIN والمدة — بيرجع true لو صح */
export function isPassportValid(share: PassportShare | null, enteredPin: string): boolean {
  if (!share) return false;
  if (Date.now() > share.expiresAt) return false;
  if (share.pin !== enteredPin) return false;
  return true;
}

/** تسجيل دخول في سجل الوصول */
export async function logPassportAccess(uid: string): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, 'passportShares', uid, 'accessLogs'), {
      accessedAt: Date.now(),
      note: 'passport_viewed',
    });
  } catch {
    // سجل الوصول اختياري — لو فشل مش مشكلة
  }
}

/** يجيب سجل الوصول للمريض (للعرض في بطاقته) */
export async function getPassportAccessLogs(uid: string): Promise<PassportAccessLog[]> {
  if (!db) return [];
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
