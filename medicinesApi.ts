import { useEffect, useState } from 'react';
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from './firebase';
import { emptyMedicine, FIELD_LABELS, Medicine, Status, TEXT_FIELDS } from './types';
import { SEED } from './seedData';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(id: string, d: any): Medicine {
  const m = emptyMedicine(id);
  for (const f of TEXT_FIELDS) m[f] = { ar: d?.[f]?.ar ?? '', en: d?.[f]?.en ?? '' };
  m.status = d?.status ?? 'draft';
  m.brands = Array.isArray(d?.brands) ? d.brands : [];
  m.barcodes = Array.isArray(d?.barcodes) ? d.barcodes : [];
  m.sources = Array.isArray(d?.sources) ? d.sources : [];
  m.lastReviewed = d?.lastReviewed ?? '';
  m.reviewedBy = d?.reviewedBy ?? '';
  m.notes = d?.notes ?? '';
  return m;
}

/**
 * Public list: approved records, PLUS source-based records that are not clinically reviewed yet
 * (previewPublic = true) while the admin keeps "show unreviewed records" switched on.
 * The Firestore rules enforce both conditions.
 */
export async function fetchApproved(): Promise<Medicine[]> {
  const col = collection(db, 'medicines');
  const out = new Map<string, Medicine>();
  const a = await getDocs(query(col, where('status', '==', 'approved')));
  a.docs.forEach((d) => out.set(d.id, normalize(d.id, d.data())));
  try {
    const p = await getDocs(query(col, where('previewPublic', '==', true)));
    p.docs.forEach((d) => out.set(d.id, normalize(d.id, d.data())));
  } catch {
    /* unreviewed preview is switched off: only approved records are shown */
  }
  return Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id));
}

/** A not-yet-approved record is shown publicly (with a warning) only if it has at least one source. */
const isPreviewable = (status: Status, nSources: number) =>
  (status === 'draft' || status === 'pending_review') && nSources > 0;

/** Staff: every record. */
export async function fetchAll(): Promise<Medicine[]> {
  const snap = await getDocs(collection(db, 'medicines'));
  return snap.docs.map((d) => normalize(d.id, d.data())).sort((a, b) => a.id.localeCompare(b.id));
}

/** Returns null if missing OR not allowed (the public cannot read non-approved records). */
export async function fetchOne(id: string): Promise<Medicine | null> {
  try {
    const snap = await getDoc(doc(db, 'medicines', id));
    return snap.exists() ? normalize(snap.id, snap.data()) : null;
  } catch {
    return null;
  }
}

export async function saveMedicine(m: Medicine, uid: string): Promise<void> {
  const { id, ...rest } = m;
  // Only VERIFIED brands with a barcode can ever be matched by the scanner.
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

/**
 * Creates the starter DRAFT records. It never overwrites a record that a person has worked on:
 * an existing record is only upgraded when it is still a bare starter (draft, no sources, starter note).
 */
export async function seedStarter(uid: string): Promise<number> {
  let written = 0;
  for (const s of SEED) {
    const existing = await getDoc(doc(db, 'medicines', s.id));
    if (existing.exists()) {
      const ex = normalize(s.id, existing.data());
      const bareStarter = ex.status === 'draft' && ex.sources.length === 0 && /^(Starter record|\[STARTER\])/.test(ex.notes);
      if (!bareStarter) continue;
    }
    const m = emptyMedicine(s.id);
    for (const f of TEXT_FIELDS) {
      const v = s.fields[f];
      if (v) m[f] = v;
    }
    m.brands = s.brands;
    m.sources = s.sources;
    m.notes = s.notes;
    await saveMedicine(m, uid);
    written++;
  }
  // make sure older records also carry the visibility flag the new rules expect
  for (const m of await fetchAll()) {
    await updateDoc(doc(db, 'medicines', m.id), { previewPublic: isPreviewable(m.status, m.sources.length) });
  }
  return written;
}

/** Problems that block approval. Empty array = OK. */
export function validateForApproval(m: Medicine): string[] {
  const p: string[] = [];
  for (const f of TEXT_FIELDS) {
    if (!m[f].ar.trim() || !m[f].en.trim()) p.push(`${FIELD_LABELS[f].ar} / ${FIELD_LABELS[f].en}`);
  }
  if (m.sources.length === 0) p.push('مصدر واحد على الأقل / At least one source');
  for (const s of m.sources) {
    if (!/^https:\/\/\S+$/i.test(s.url.trim()) || !s.title.trim()) {
      p.push('كل مصدر يحتاج عنوانًا ورابط https / Each source needs a title and an https URL');
      break;
    }
  }
  if (!m.lastReviewed) p.push('تاريخ المراجعة / Review date');
  if (!m.reviewedBy.trim()) p.push('اسم المراجع / Reviewer name');
  for (const b of m.brands) {
    if (b.verified && !/^https:\/\/\S+$/i.test(b.sourceUrl.trim())) {
      p.push(`رابط مصدر للاسم التجاري الموثّق / Source URL for verified brand: ${b.name || '?'}`);
    }
  }
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
        setItems([]);
      });
  }, []);
  return { items, error };
}
