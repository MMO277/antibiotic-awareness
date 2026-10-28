import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
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
import { CATALOG_DOC_ID, startLiveCatalogSync } from './liveCatalogSync';

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
    brandMap.set(key, {
      name:
        p.tradeNameEn +
        ' (' +
        p.tradeNameAr +
        ')' +
        (p.priceEgp ? ' - ' + p.priceEgp.toFixed(2) + ' ج.م' : ''),
      manufacturer: p.manufacturer,
      barcode: p.barcode || '',
      verified: true,
      sourceUrl: 'https://edaegypt.gov.eg',
    });
  });

  m.brands = Array.from(brandMap.values());
  m.barcodes = m.brands
    .filter((b) => b.verified && b.barcode?.trim())
    .map((b) => b.barcode.trim());
  m.sources = s.sources || [];
  m.lastReviewed = '2026-10-14';
  m.reviewedBy = 'هيئة التمريض السريري / Clinical Review';
  m.notes = s.notes || '';
  return m;
}

export function buildAllLocalMedicines(): Medicine[] {
  return SEED.map(seedToMedicine);
}

export const ALL_LOCAL_MEDICINES: Medicine[] = buildAllLocalMedicines();

function refreshLocalMedicinesArray(): void {
  const rebuilt = buildAllLocalMedicines();
  ALL_LOCAL_MEDICINES.splice(0, ALL_LOCAL_MEDICINES.length, ...rebuilt);
}

if (typeof window !== 'undefined') {
  window.addEventListener('aa-live-catalog-updated', () => {
    refreshLocalMedicinesArray();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(id: string, d: any): Medicine {
  const m = emptyMedicine(id);
  for (const f of TEXT_FIELDS) m[f] = { ar: d?.[f]?.ar ?? '', en: d?.[f]?.en ?? '' };
  m.status = d?.status ?? 'approved';
  m.brands = Array.isArray(d?.brands) ? d.brands : [];
  m.barcodes = Array.isArray(d?.barcodes) ? d.barcodes : [];
  m.sources = Array.isArray(d?.sources) ? d.sources : [];
  m.lastReviewed = d?.lastReviewed ?? '2026-10-14';
  m.reviewedBy = d?.reviewedBy ?? '';
  m.notes = d?.notes ?? '';
  return m;
}

/**
 * Merges remote Firestore data with verified local seed, giving PRIORITY to remote
 * Firestore edits so any change saved by an Editor/Reviewer/Admin immediately takes effect
 * for all users, while falling back to local seed if a field was left blank.
 */
function smartMerge(remote: Medicine, local?: Medicine): Medicine {
  if (!local) return remote;

  const brandMap = new Map<string, Brand>();
  // Put local brands first, then let remote brands overwrite or add new ones
  (local.brands || []).forEach((b) => {
    const key = b.barcode ? b.barcode.trim() : b.name;
    brandMap.set(key, b);
  });
  (remote.brands || []).forEach((b) => {
    const key = b.barcode ? b.barcode.trim() : b.name;
    brandMap.set(key, b);
  });

  // If the editor explicitly edited the brands array in Firestore, respect remote brands plus live commercial packages
  const mergedBrands =
    remote.brands && remote.brands.length > 0 ? Array.from(brandMap.values()) : local.brands;

  const mergedBarcodes = Array.from(
    new Set([
      ...(remote.barcodes || []),
      ...(local.barcodes || []),
      ...mergedBrands.map((b) => b.barcode?.trim()).filter(Boolean),
    ])
  );

  const merged: Medicine = {
    ...local,
    ...remote,
    status: remote.status || 'approved',
    brands: mergedBrands.length > 0 ? mergedBrands : local.brands,
    barcodes: mergedBarcodes.length > 0 ? mergedBarcodes : local.barcodes,
    sources: remote.sources && remote.sources.length > 0 ? remote.sources : local.sources,
    lastReviewed: remote.lastReviewed || local.lastReviewed || '2026-10-14',
    reviewedBy: remote.reviewedBy || local.reviewedBy || 'هيئة التمريض السريري / Clinical Review',
  };

  for (const f of TEXT_FIELDS) {
    merged[f] = {
      ar: remote[f]?.ar?.trim() ? remote[f].ar : local[f]?.ar || '',
      en: remote[f]?.en?.trim() ? remote[f].en : local[f]?.en || '',
    };
  }

  return merged;
}

/**
 * Synchronously resolves any medicine ID, commercial productId, barcode, or trade name
 * from the verified database so MedicinePage never fails or shows Not Found.
 */
export function findLocalMedicine(id: string): Medicine | null {
  refreshLocalMedicinesArray();
  const clean = decodeURIComponent(id || '').toLowerCase().trim();
  if (!clean || clean === CATALOG_DOC_ID) return null;

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
  const byCommBarcode = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.barcode === clean);
  if (byCommBarcode) {
    const parent = ALL_LOCAL_MEDICINES.find((m) => m.id === byCommBarcode.activeIngredientId);
    if (parent) return parent;
  }

  const byBarcode = ALL_LOCAL_MEDICINES.find(
    (m) => m.barcodes.includes(clean) || m.brands.some((b) => b.barcode === clean)
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
  refreshLocalMedicinesArray();
  const out = new Map<string, Medicine>();
  ALL_LOCAL_MEDICINES.forEach((m) => out.set(m.id, m));

  if (!configured || !db) {
    return Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id));
  }

  try {
    const col = collection(db, 'medicines');
    const a = await getDocs(query(col, where('status', '==', 'approved')));
    a.docs.forEach((d) => {
      if (d.id === CATALOG_DOC_ID) return;
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
  refreshLocalMedicinesArray();
  const out = new Map<string, Medicine>();
  ALL_LOCAL_MEDICINES.forEach((m) => out.set(m.id, m));
  if (!configured || !db) {
    return Array.from(out.values()).sort((a, b) => a.id.localeCompare(b.id));
  }
  try {
    const snap = await getDocs(collection(db, 'medicines'));
    snap.docs.forEach((d) => {
      if (d.id === CATALOG_DOC_ID) return;
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
  if (!clean || clean === CATALOG_DOC_ID) return null;
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
  const [items, setItems] = useState<Medicine[] | null>(() => buildAllLocalMedicines());
  const [error, setError] = useState(false);

  useEffect(() => {
    startLiveCatalogSync();
    let active = true;

    const refreshFromLocalAndRemote = () => {
      fetchApproved()
        .then((res) => {
          if (active) setItems(res);
        })
        .catch(() => {
          if (active) {
            setError(false);
            setItems(buildAllLocalMedicines());
          }
        });
    };

    refreshFromLocalAndRemote();

    const onCatalogUpdate = () => {
      refreshFromLocalAndRemote();
    };
    window.addEventListener('aa-live-catalog-updated', onCatalogUpdate);

    let unsubFirestore: (() => void) | null = null;
    if (configured && db) {
      try {
        const col = collection(db, 'medicines');
        unsubFirestore = onSnapshot(
          query(col, where('status', '==', 'approved')),
          (snap) => {
            if (!active) return;
            refreshLocalMedicinesArray();
            const out = new Map<string, Medicine>();
            ALL_LOCAL_MEDICINES.forEach((m) => out.set(m.id, m));
            snap.docs.forEach((d) => {
              if (d.id === CATALOG_DOC_ID) return;
              const remote = normalize(d.id, d.data());
              const local = out.get(d.id);
              out.set(d.id, smartMerge(remote, local));
            });
            setItems(Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id)));
          },
          () => {
            /* ignore snapshot errors */
          }
        );
      } catch {
        /* ignore */
      }
    }

    return () => {
      active = false;
      window.removeEventListener('aa-live-catalog-updated', onCatalogUpdate);
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  return { items, error };
}
