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
  where,
} from 'firebase/firestore';
import { db, configured } from './firebase';
import { Brand, emptyMedicine, FIELD_LABELS, Medicine, Status, TEXT_FIELDS } from './types';
import { SEED } from './seedData';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import { CATALOG_DOC_ID, startLiveCatalogSync } from './liveCatalogSync';

const APPROVED_CACHE_STORAGE_KEY = 'aa_approved_medicines_cache_v2';
const APPROVED_UPDATED_EVENT = 'aa-approved-medicines-cache-updated';

// Pre-grouped commercial products by activeIngredientId for O(1) building instead of O(N*M) filtering
function buildCommercialByIngredientMap() {
  const map = new Map<string, typeof EGYPTIAN_COMMERCIAL_PRODUCTS>();
  for (const p of EGYPTIAN_COMMERCIAL_PRODUCTS) {
    const list = map.get(p.activeIngredientId);
    if (list) {
      list.push(p);
    } else {
      map.set(p.activeIngredientId, [p]);
    }
  }
  return map;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function seedToMedicine(s: any, extraProducts: typeof EGYPTIAN_COMMERCIAL_PRODUCTS): Medicine {
  const m = emptyMedicine(s.id);
  for (const f of TEXT_FIELDS) {
    const v = s.fields?.[f];
    if (v) m[f] = v;
  }
  m.status = 'approved';

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
  const grouped = buildCommercialByIngredientMap();
  return SEED.map((s) => seedToMedicine(s, grouped.get(s.id) || []));
}

export const ALL_LOCAL_MEDICINES: Medicine[] = buildAllLocalMedicines();

// Fast O(1) lookup index maps (rebuilt only when catalog actually changes)
const localByIdMap = new Map<string, Medicine>();
const localByBarcodeMap = new Map<string, Medicine>();
const localByProductIdMap = new Map<string, Medicine>();

function rebuildFastIndexMaps(): void {
  localByIdMap.clear();
  localByBarcodeMap.clear();
  localByProductIdMap.clear();

  for (const m of ALL_LOCAL_MEDICINES) {
    localByIdMap.set(m.id.toLowerCase(), m);
    for (const bc of m.barcodes) {
      if (bc) localByBarcodeMap.set(bc.toLowerCase(), m);
    }
    for (const b of m.brands) {
      if (b.barcode) localByBarcodeMap.set(b.barcode.toLowerCase(), m);
    }
  }
  for (const p of EGYPTIAN_COMMERCIAL_PRODUCTS) {
    const parent = localByIdMap.get(p.activeIngredientId.toLowerCase());
    if (parent) {
      localByProductIdMap.set(p.productId.toLowerCase(), parent);
      if (p.barcode) localByBarcodeMap.set(p.barcode.toLowerCase(), parent);
    }
  }
}

rebuildFastIndexMaps();

function refreshLocalMedicinesArray(): void {
  const rebuilt = buildAllLocalMedicines();
  ALL_LOCAL_MEDICINES.splice(0, ALL_LOCAL_MEDICINES.length, ...rebuilt);
  rebuildFastIndexMaps();
}

// In-memory + localStorage Stale-While-Revalidate cache for merged approved medicines
let cachedApprovedMedicines: Medicine[] | null = null;
let sharedFirestoreListenerStarted = false;

function loadCachedApprovedFromStorage(): Medicine[] {
  if (cachedApprovedMedicines && cachedApprovedMedicines.length > 0) {
    return cachedApprovedMedicines;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(APPROVED_CACHE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedApprovedMedicines = parsed;
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
  }
  cachedApprovedMedicines = [...ALL_LOCAL_MEDICINES].sort((x, y) => x.id.localeCompare(y.id));
  return cachedApprovedMedicines;
}

function saveCachedApprovedToStorage(list: Medicine[]): void {
  cachedApprovedMedicines = list;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(APPROVED_CACHE_STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore quota */
    }
    window.dispatchEvent(new CustomEvent(APPROVED_UPDATED_EVENT));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('aa-live-catalog-updated', () => {
    refreshLocalMedicinesArray();
    cachedApprovedMedicines = [...ALL_LOCAL_MEDICINES].sort((x, y) => x.id.localeCompare(y.id));
    window.dispatchEvent(new CustomEvent(APPROVED_UPDATED_EVENT));
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
  (local.brands || []).forEach((b) => {
    const key = b.barcode ? b.barcode.trim() : b.name;
    brandMap.set(key, b);
  });
  (remote.brands || []).forEach((b) => {
    const key = b.barcode ? b.barcode.trim() : b.name;
    brandMap.set(key, b);
  });

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
 * O(1) instant resolution of any medicine ID, commercial productId, barcode, or trade name
 * without rebuilding the entire database array on every lookup.
 */
export function findLocalMedicine(id: string): Medicine | null {
  const clean = decodeURIComponent(id || '').toLowerCase().trim();
  if (!clean || clean === CATALOG_DOC_ID) return null;

  // 1. O(1) Direct active ingredient ID match
  const direct = localByIdMap.get(clean);
  if (direct) return direct;

  // 2. O(1) Commercial productId match (e.g. EG-ABX-001)
  const byProd = localByProductIdMap.get(clean);
  if (byProd) return byProd;

  // 3. O(1) Barcode match
  const byBc = localByBarcodeMap.get(clean);
  if (byBc) return byBc;

  // 4. Fallback Generic or Brand name substring match
  const byName = ALL_LOCAL_MEDICINES.find(
    (m) =>
      m.genericName.en.toLowerCase() === clean ||
      m.genericName.ar === clean ||
      m.brands.some((b) => b.name.toLowerCase().includes(clean))
  );
  return byName || null;
}

export async function fetchApproved(): Promise<Medicine[]> {
  const out = new Map<string, Medicine>();
  ALL_LOCAL_MEDICINES.forEach((m) => out.set(m.id, m));

  if (!configured || !db) {
    const sorted = Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id));
    cachedApprovedMedicines = sorted;
    return sorted;
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
    const mergedList = Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id));
    saveCachedApprovedToStorage(mergedList);
    return mergedList;
  } catch (err) {
    console.info('Using local cached medicines database:', err);
  }
  return loadCachedApprovedFromStorage();
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
  const { id, ...rest } = m;
  const barcodes = m.brands.filter((b) => b.verified && b.barcode.trim()).map((b) => b.barcode.trim());
  await setDoc(
    doc(db, 'medicines', id),
    {
      ...rest,
      barcodes,
      status,
      previewPublic: isPreviewable(status, m.sources.length),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    },
    { merge: true }
  );
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

function ensureSharedApprovedFirestoreListener(): void {
  if (sharedFirestoreListenerStarted || typeof window === 'undefined' || !configured || !db) {
    return;
  }
  sharedFirestoreListenerStarted = true;
  try {
    const col = collection(db, 'medicines');
    onSnapshot(
      query(col, where('status', '==', 'approved')),
      (snap) => {
        const out = new Map<string, Medicine>();
        ALL_LOCAL_MEDICINES.forEach((m) => out.set(m.id, m));
        snap.docs.forEach((d) => {
          if (d.id === CATALOG_DOC_ID) return;
          const remote = normalize(d.id, d.data());
          const local = out.get(d.id);
          out.set(d.id, smartMerge(remote, local));
        });
        const merged = Array.from(out.values()).sort((x, y) => x.id.localeCompare(y.id));
        saveCachedApprovedToStorage(merged);
      },
      () => {
        /* ignore snapshot errors */
      }
    );
  } catch {
    /* ignore */
  }
}

export function useApproved() {
  const [items, setItems] = useState<Medicine[] | null>(() => loadCachedApprovedFromStorage());
  const [error] = useState(false);

  useEffect(() => {
    startLiveCatalogSync();
    ensureSharedApprovedFirestoreListener();

    const onUpdate = () => {
      setItems(loadCachedApprovedFromStorage());
    };

    window.addEventListener(APPROVED_UPDATED_EVENT, onUpdate);
    window.addEventListener('aa-live-catalog-updated', onUpdate);

    return () => {
      window.removeEventListener(APPROVED_UPDATED_EVENT, onUpdate);
      window.removeEventListener('aa-live-catalog-updated', onUpdate);
    };
  }, []);

  return { items, error };
}
