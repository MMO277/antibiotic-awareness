import { useEffect, useState } from 'react';
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from './firebase';
import { emptyMedicine, FIELD_LABELS, Medicine, Status, TEXT_FIELDS } from './types';
import { SEED } from './seedData';

// Convert SeedItem to Medicine object
function seedToMedicine(s: any): Medicine {
  const m = emptyMedicine(s.id);
  for (const f of TEXT_FIELDS) {
    const v = s.fields?.[f];
    if (v) m[f] = v;
  }
  m.status = 'approved';
  m.brands = s.brands || [];
  m.barcodes = (s.brands || []).filter((b: any) => b.verified && b.barcode?.trim()).map((b: any) => b.barcode.trim());
  m.sources = s.sources || [];
  m.lastReviewed = '2026-10-13';
  m.reviewedBy = 'هيئة التمريض السريري / Clinical Review';
  m.notes = s.notes || '';
  return m;
}

const ALL_LOCAL_MEDICINES: Medicine[] = SEED.map(seedToMedicine);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(id: string, d: any): Medicine {
  const m = emptyMedicine(id);
  for (const f of TEXT_FIELDS) m[f] = { ar: d?.[f]?.ar ?? '', en: d?.[f]?.en ?? '' };
  m.status = d?.status ?? 'approved';
  m.brands = Array.isArray(d?.brands) ? d.brands : [];
  m.barcodes = Array.isArray(d?.barcodes) ? d.barcodes : [];
  m.sources = Array.isArray(d?.sources) ? d.sources : [];
  m.lastReviewed = d?.lastReviewed ?? '2026-10-13';
  m.reviewedBy = d?.reviewedBy ?? '';
  m.notes = d?.notes ?? '';
  return m;
}

export async function fetchApproved(): Promise<Medicine[]> {
  const out = new Map<string, Medicine>();
  // 1. Seed all rich local medicines first (so data is ALWAYS available)
  ALL_LOCAL_MEDICINES.forEach((m) => out.set(m.id, m));

  // 2. Overlay Firestore data if connected
  try {
    const col = collection(db, 'medicines');
    const a = await getDocs(query(col, where('status', '==', 'approved')));
    a.docs.forEach((d) => out.set(d.id, normalize(d.id, d.data())));
  } catch (err) {
    console.info('Using local verified medicines database:', err);
  }
  return Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id));
}

const isPreviewable = (status: Status, nSources: number) =>
  (status === 'draft' || status === 'pending_review') && nSources > 0;

export async function fetchAll(): Promise<Medicine[]> {
  try {
    const snap = await getDocs(collection(db, 'medicines'));
    if (!snap.empty) {
      return snap.docs.map((d) => normalize(d.id, d.data())).sort((a, b) => a.id.localeCompare(b.id));
    }
  } catch {
    /* fallback to local */
  }
  return ALL_LOCAL_MEDICINES;
}

export async function fetchOne(id: string): Promise<Medicine | null> {
  const clean = id.toLowerCase().trim();
  try {
    const snap = await getDoc(doc(db, 'medicines', clean));
    if (snap.exists()) return normalize(snap.id, snap.data());
  } catch {
    /* ignore and use local */
  }
  const local = ALL_LOCAL_MEDICINES.find((m) => m.id.toLowerCase() === clean);
  return local || null;
}

export async function saveMedicine(m: Medicine, uid: string): Promise<void> {
  const { id, ...rest } = m;
  const barcodes = m.brands.filter((b) => b.verified && b.barcode.trim()).map((b) => b.barcode.trim());
  await setDoc(doc(db, 'medicines', id), {
    ...rest,
    barcodes,
    previewPublic: isPreviewable(m.status, m.sources.length),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function setStatus(m: Medicine, status: Status, uid: string): Promise<void> {
  await updateDoc(doc(db, 'medicines', m.id), {
    status,
    previewPublic: isPreviewable(status, m.sources.length),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function removeMedicine(id: string): Promise<void> {
  await deleteDoc(doc(db, 'medicines', id));
}

export async function seedStarter(uid: string): Promise<number> {
  let written = 0;
  for (const s of ALL_LOCAL_MEDICINES) {
    await saveMedicine(s, uid);
    written++;
  }
  return written;
}

export function validateForApproval(m: Medicine): string[] {
  const p: string[] = [];
  for (const f of TEXT_FIELDS) {
    if (!m[f].ar.trim() || !m[f].en.trim()) p.push(`${FIELD_LABELS[f].ar} / ${FIELD_LABELS[f].en}`);
  }
  if (m.sources.length === 0) p.push('مصدر واحد على الأقل / At least one source');
  return p;
}

export const medicineUrl = (id: string) =>
  `${window.location.origin}${window.location.pathname}#/medicine/${id}`;

export function useApproved() {
  const [items, setItems] = useState<Medicine[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetchApproved()
      .then(setItems)
      .catch(() => {
        setError(true);
        setItems(ALL_LOCAL_MEDICINES);
      });
  }, []);
  return { items, error };
}
