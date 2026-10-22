import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, configured } from './firebase';
import { Brand, emptyMedicine, FIELD_LABELS, Medicine, Status, TEXT_FIELDS } from './types';
import { SEED } from './seedData';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function seedToMedicine(s: any): Medicine {
  const m = emptyMedicine(s.id);
  for (const f of TEXT_FIELDS) {
    const v = s.fields?.[f];
    if (v) m[f] = v;
  }
  m.status = 'approved';

  const extraProducts = EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => p.activeIngredientId === s.id);
  const brandMap = new Map<string, Brand>();

  (s.brands || []).forEach((b: Brand) => {
    const key = b.barcode ? b.barcode.trim() : b.name;
    brandMap.set(key, b);
  });

  extraProducts.forEach((p) => {
    const key = p.barcode ? p.barcode.trim() : p.tradeNameEn;
    if (!brandMap.has(key)) {
      brandMap.set(key, {
        name:
          p.tradeNameEn +
          ' (' +
          p.tradeNameAr +
          ')' +
          (p.priceEgp ? ' - ' + p.priceEgp.toFixed(2) + ' ج.م' : ''),
        manufacturer: p.manufacturer,
        barcode: p.barcode || '',
        // Never mark a missing or pending barcode as verified.
        verified: p.barcodeStatus === 'verified' && Boolean(p.barcode),
        sourceUrl: p.barcodeStatus === 'verified' && p.barcode ? 'https://edaegypt.gov.eg' : '',
      });
    }
  });

  m.brands = Array.from(brandMap.values());
  m.barcodes = m.brands
    .filter((b) => b.verified && b.barcode?.trim())
    .map((b) => b.barcode.trim());
  m.sources = s.sources || [];
  // Do not invent a review date or reviewer for seed records; populate only after documented review.
  m.lastReviewed = '';
  m.reviewedBy = '';
  m.notes = s.notes || '';
  return m;
}

export const ALL_LOCAL_MEDICINES: Medicine[] = SEED.map(seedToMedicine);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(id: string, d: any): Medicine {
  const m = emptyMedicine(id);
  for (const f of TEXT_FIELDS) m[f] = { ar: d?.[f]?.ar ?? '', en: d?.[f]?.en ?? '' };
  // Missing review status is not evidence of approval; keep legacy records out of the approved state.
  m.status = d?.status ?? 'pending_review';
  m.brands = Array.isArray(d?.brands) ? d.brands : [];
  // A barcode is searchable only when its brand record explicitly marks it verified.
  const verifiedBrandBarcodes = m.brands
    .filter((b) => b?.verified === true && typeof b.barcode === 'string' && b.barcode.trim())
    .map((b) => b.barcode.trim());
  const storedBarcodes = Array.isArray(d?.barcodes) ? d.barcodes : [];
  m.barcodes = Array.from(new Set(storedBarcodes.filter((code: unknown) =>
    typeof code === 'string' && verifiedBrandBarcodes.includes(code.trim())
  )));
  m.sources = Array.isArray(d?.sources) ? d.sources : [];
  m.lastReviewed = typeof d?.lastReviewed === 'string' ? d.lastReviewed : '';
  m.reviewedBy = d?.reviewedBy ?? '';
  m.notes = d?.notes ?? '';
  return m;
}

/**
 * Merges remote Firestore data with rich verified local seed so no clinical field,
 * Egyptian price, substitute, or verified barcode is ever blanked out.
 */
function smartMerge(remote: Medicine, local?: Medicine): Medicine {
  if (!local) return remote;

  const brandMap = new Map<string, Brand>();
  (local.brands || []).forEach((b) => {
    if (b.barcode) brandMap.set(b.barcode.trim(), b);
    else brandMap.set(b.name, b);
  });
  (remote.brands || []).forEach((b) => {
    if (b.barcode) {
      if (!brandMap.has(b.barcode.trim())) brandMap.set(b.barcode.trim(), b);
    } else if (!brandMap.has(b.name)) {
      brandMap.set(b.name, b);
    }
  });
  const mergedBrands = Array.from(brandMap.values());
  // Never promote an unverified remote brand/barcode by merging it with local data.
  const mergedBarcodes = Array.from(new Set(
    mergedBrands
      .filter((b) => b.verified === true && typeof b.barcode === 'string' && b.barcode.trim())
      .map((b) => b.barcode.trim())
  ));

  const merged: Medicine = {
    ...local,
    ...remote,
    // Preserve the actual review state; merging must never promote a draft to approved.
    status: remote.status || local.status,
    brands: mergedBrands.length > 0 ? mergedBrands : local.brands,
    barcodes: mergedBarcodes.length > 0 ? mergedBarcodes : local.barcodes,
    sources: local.sources && local.sources.length > 0 ? local.sources : remote.sources,
    lastReviewed: remote.lastReviewed || local.lastReviewed || '',
    reviewedBy: remote.reviewedBy || local.reviewedBy || '',
  };

  for (const f of TEXT_FIELDS) {
    merged[f] = {
      ar: local[f]?.ar?.trim() ? local[f].ar : remote[f]?.ar || '',
      en: local[f]?.en?.trim() ? local[f].en : remote[f]?.en || '',
    };
  }

  return merged;
}

/**
 * Synchronously resolves any medicine ID, commercial productId, barcode, or trade name
 * from the local verified database so MedicinePage never fails or shows Not Found.
 */
export function findLocalMedicine(id: string): Medicine | null {
  const clean = decodeURIComponent(id || '').toLowerCase().trim();
  if (!clean) return null;

  // 1. Direct active ingredient ID match
  const direct = ALL_LOCAL_MEDICINES.find((m) => m.id.toLowerCase() === clean);
  if (direct) return direct;

  // 2. Commercial productId match (e.g. EG-ABX-001)
  const comm = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.productId.toLowerCase() === clean);
  if (comm) {
    const parent = ALL_LOCAL_MEDICINES.find((m) => m.id === comm.activeIngredientId);
    if (parent) return parent;
  }

  // 3. Barcode match
  const byBarcode = ALL_LOCAL_MEDICINES.find(
    (m) => m.barcodes.includes(clean) || m.brands.some((b) => b.verified === true && b.barcode?.trim() === clean)
  );
  if (byBarcode) return byBarcode;

  // 4. Generic or Brand name match
  const byName = ALL_LOCAL_MEDICINES.find(
    (m) =>
      m.genericName.en.toLowerCase() === clean ||
      m.genericName.ar === clean ||
      m.brands.some((b) => b.name.toLowerCase().includes(clean))
  );
  if (byName) return byName;

  return null;
}

export async function fetchApproved(): Promise<Medicine[]> {
  const out = new Map<string, Medicine>();
  ALL_LOCAL_MEDICINES.forEach((m) => out.set(m.id, m));

  if (!configured || !db) {
    return Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id));
  }

  try {
    const col = collection(db, 'medicines');
    const a = await getDocs(query(col, where('status', '==', 'approved')));
    a.docs.forEach((d) => {
      const remote = normalize(d.id, d.data());
      const local = out.get(d.id);
      out.set(d.id, smartMerge(remote, local));
    });
  } catch (err) {
    console.info('Using local verified medicines database:', err);
  }
  return Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id));
}

const isPreviewable = (status: Status, nSources: number) =>
  (status === 'draft' || status === 'pending_review') && nSources > 0;

export async function fetchAll(): Promise<Medicine[]> {
  const out = new Map<string, Medicine>();
  ALL_LOCAL_MEDICINES.forEach((m) => out.set(m.id, m));
  if (!configured || !db) {
    return Array.from(out.values()).sort((a, b) => a.id.localeCompare(b.id));
  }
  try {
    const snap = await getDocs(collection(db, 'medicines'));
    snap.docs.forEach((d) => {
      const remote = normalize(d.id, d.data());
      const local = out.get(d.id);
      out.set(d.id, smartMerge(remote, local));
    });
  } catch {
    /* fallback to local */
  }
  return Array.from(out.values()).sort((a, b) => a.id.localeCompare(b.id));
}

export async function fetchOne(id: string): Promise<Medicine | null> {
  const clean = decodeURIComponent(id || '').toLowerCase().trim();
  const local = findLocalMedicine(clean);
  if (!configured || !db) return local;
  try {
    const snap = await getDoc(doc(db, 'medicines', clean));
    if (snap.exists()) {
      const remote = normalize(snap.id, snap.data());
      return smartMerge(remote, local ?? undefined);
    }
  } catch {
    /* Firestore permission-denied for non-approved docs or offline: return local */
  }
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
  if (!m.lastReviewed.trim()) p.push('تاريخ آخر مراجعة / Last reviewed date');
  if (!m.reviewedBy.trim()) p.push('اسم المراجع / Reviewed by');
  return p;
}

export const medicineUrl = (id: string) =>
  `${window.location.origin}${window.location.pathname}#/medicine/${id}`;

export function useApproved() {
  const [items, setItems] = useState<Medicine[] | null>(ALL_LOCAL_MEDICINES);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetchApproved()
      .then(setItems)
      .catch(() => {
        setError(false);
        setItems(ALL_LOCAL_MEDICINES);
      });
  }, []);
  return { items, error };
}
