import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import {
  ACTIVE_INGREDIENTS,
  ActiveIngredientRecord,
  DOSAGE_FORM_LABELS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
  ROUTE_LABELS,
} from './egyptianDrugDatabase';

export const CATALOG_DOC_ID = '__commercial_catalog__';
const LOCAL_CACHE_KEY = 'aa_live_commercial_catalog_v1';
const CATALOG_EVENT = 'aa-live-catalog-updated';

// Snapshot of the original factory arrays at startup so we can always merge or reset cleanly
const BASE_COMMERCIAL_PRODUCTS: EgyptianCommercialProduct[] = EGYPTIAN_COMMERCIAL_PRODUCTS.map((p) => ({
  ...p,
  dosageFormLabel: { ...p.dosageFormLabel },
  routeLabel: { ...p.routeLabel },
  packDetails: { ...p.packDetails },
  unitPriceNote: { ...p.unitPriceNote },
}));

const BASE_ACTIVE_INGREDIENTS: ActiveIngredientRecord[] = ACTIVE_INGREDIENTS.map((a) => ({
  ...a,
  drugClass: { ...a.drugClass },
  components: [...a.components],
}));

export interface LiveCatalogPayload {
  overrides: Record<string, EgyptianCommercialProduct>;
  customProducts: EgyptianCommercialProduct[];
  deletedProductIds: string[];
  customIngredients: ActiveIngredientRecord[];
  updatedAtIso?: string;
  updatedBy?: string;
}

const emptyPayload = (): LiveCatalogPayload => ({
  overrides: {},
  customProducts: [],
  deletedProductIds: [],
  customIngredients: [],
});

let currentPayload: LiveCatalogPayload = emptyPayload();
let currentVersion = 1;
let listenerStarted = false;

function loadCachedPayload(): LiveCatalogPayload {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return emptyPayload();
    const parsed = JSON.parse(raw);
    return {
      overrides: parsed?.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
      customProducts: Array.isArray(parsed?.customProducts) ? parsed.customProducts : [],
      deletedProductIds: Array.isArray(parsed?.deletedProductIds) ? parsed.deletedProductIds : [],
      customIngredients: Array.isArray(parsed?.customIngredients) ? parsed.customIngredients : [],
      updatedAtIso: parsed?.updatedAtIso,
      updatedBy: parsed?.updatedBy,
    };
  } catch {
    return emptyPayload();
  }
}

function saveCachedPayload(payload: LiveCatalogPayload): void {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function computeEquivalenceKey(p: EgyptianCommercialProduct): string {
  const normStrength = (p.strength || '').toLowerCase().replace(/\s+/g, '');
  return `${p.activeIngredientId}|${normStrength}|${p.dosageForm}|${p.route}`;
}

function sanitizeProduct(raw: EgyptianCommercialProduct): EgyptianCommercialProduct {
  const dosageForm = raw.dosageForm || 'tablet';
  const route = raw.route || 'oral';
  const cleanBarcode = raw.barcode && String(raw.barcode).trim() ? String(raw.barcode).trim() : null;
  const priceNum =
    raw.priceEgp !== null && raw.priceEgp !== undefined && !Number.isNaN(Number(raw.priceEgp))
      ? Number(raw.priceEgp)
      : null;

  const product: EgyptianCommercialProduct = {
    ...raw,
    dosageForm,
    dosageFormLabel: raw.dosageFormLabel?.ar
      ? raw.dosageFormLabel
      : DOSAGE_FORM_LABELS[dosageForm] || DOSAGE_FORM_LABELS.tablet,
    route,
    routeLabel: raw.routeLabel?.ar ? raw.routeLabel : ROUTE_LABELS[route] || ROUTE_LABELS.oral,
    packDetails: {
      ar: raw.packDetails?.ar || 'عبوة قياسية',
      en: raw.packDetails?.en || raw.packDetails?.ar || 'Standard pack',
    },
    unitPriceNote: {
      ar: raw.unitPriceNote?.ar || (priceNum ? `السعر الرسمي: ${priceNum.toFixed(2)} ج.م` : 'قيد التحديث'),
      en: raw.unitPriceNote?.en || (priceNum ? `Official price: ${priceNum.toFixed(2)} EGP` : 'Pending update'),
    },
    priceEgp: priceNum,
    barcode: cleanBarcode,
    barcodeType: cleanBarcode ? 'EAN-13' : 'UNAVAILABLE',
    barcodeStatus: cleanBarcode ? 'verified' : 'unverified_pending',
    barcodeVerifiedBy: cleanBarcode
      ? raw.barcodeVerifiedBy || 'تم التحقق والتحديث بواسطة المحرر (Live Verified)'
      : 'غير متوفر بعد - قيد التحقق الميداني',
    equivalenceGroupKey: raw.equivalenceGroupKey || computeEquivalenceKey(raw),
  };
  return product;
}

function applyPayloadToGlobalArrays(payload: LiveCatalogPayload): void {
  currentPayload = payload;
  const deletedSet = new Set(payload.deletedProductIds || []);

  // 1. Merge Active Ingredients
  const ingMap = new Map<string, ActiveIngredientRecord>();
  BASE_ACTIVE_INGREDIENTS.forEach((ing) => ingMap.set(ing.id, ing));
  (payload.customIngredients || []).forEach((ing) => {
    if (ing && ing.id) ingMap.set(ing.id, ing);
  });
  const mergedIngredients = Array.from(ingMap.values());
  ACTIVE_INGREDIENTS.splice(0, ACTIVE_INGREDIENTS.length, ...mergedIngredients);

  // 2. Merge Commercial Products
  const mergedProducts: EgyptianCommercialProduct[] = [];
  for (const baseProd of BASE_COMMERCIAL_PRODUCTS) {
    if (deletedSet.has(baseProd.productId)) continue;
    const override = payload.overrides?.[baseProd.productId];
    if (override) {
      mergedProducts.push(sanitizeProduct({ ...baseProd, ...override, productId: baseProd.productId }));
    } else {
      mergedProducts.push(baseProd);
    }
  }

  for (const customProd of payload.customProducts || []) {
    if (!customProd || !customProd.productId || deletedSet.has(customProd.productId)) continue;
    // Avoid duplicate ID if already in base
    const existingIdx = mergedProducts.findIndex((p) => p.productId === customProd.productId);
    const cleanCustom = sanitizeProduct(customProd);
    if (existingIdx >= 0) {
      mergedProducts[existingIdx] = cleanCustom;
    } else {
      mergedProducts.push(cleanCustom);
    }
  }

  EGYPTIAN_COMMERCIAL_PRODUCTS.splice(0, EGYPTIAN_COMMERCIAL_PRODUCTS.length, ...mergedProducts);
  currentVersion += 1;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CATALOG_EVENT, { detail: currentVersion }));
  }
}

// Initialize immediately from localStorage cache (0ms)
if (typeof window !== 'undefined') {
  const initialCached = loadCachedPayload();
  applyPayloadToGlobalArrays(initialCached);
}

export function startLiveCatalogSync(): void {
  if (listenerStarted || typeof window === 'undefined' || !configured || !db) return;
  listenerStarted = true;

  const catalogRef = doc(db, 'medicines', CATALOG_DOC_ID);
  onSnapshot(
    catalogRef,
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const nextPayload: LiveCatalogPayload = {
        overrides: data?.overrides && typeof data.overrides === 'object' ? data.overrides : {},
        customProducts: Array.isArray(data?.customProducts) ? data.customProducts : [],
        deletedProductIds: Array.isArray(data?.deletedProductIds) ? data.deletedProductIds : [],
        customIngredients: Array.isArray(data?.customIngredients) ? data.customIngredients : [],
        updatedAtIso: data?.updatedAtIso || new Date().toISOString(),
        updatedBy: data?.updatedBy || '',
      };
      saveCachedPayload(nextPayload);
      applyPayloadToGlobalArrays(nextPayload);
    },
    (err) => {
      console.info('Live catalog sync using cached/local dataset:', err);
    }
  );
}

export function useLiveDrugCatalog(): {
  products: EgyptianCommercialProduct[];
  ingredients: ActiveIngredientRecord[];
  catalogPayload: LiveCatalogPayload;
  version: number;
  isBaseProduct: (productId: string) => boolean;
  isProductModified: (productId: string) => boolean;
} {
  const [version, setVersion] = useState<number>(currentVersion);

  useEffect(() => {
    startLiveCatalogSync();
    const onUpdate = () => setVersion(currentVersion);
    window.addEventListener(CATALOG_EVENT, onUpdate);
    return () => window.removeEventListener(CATALOG_EVENT, onUpdate);
  }, []);

  return {
    products: [...EGYPTIAN_COMMERCIAL_PRODUCTS],
    ingredients: [...ACTIVE_INGREDIENTS],
    catalogPayload: currentPayload,
    version,
    isBaseProduct: (productId: string) => BASE_COMMERCIAL_PRODUCTS.some((p) => p.productId === productId),
    isProductModified: (productId: string) => Boolean(currentPayload.overrides?.[productId]),
  };
}

async function persistCatalogPayload(nextPayload: LiveCatalogPayload, uid: string): Promise<void> {
  nextPayload.updatedAtIso = new Date().toISOString();
  nextPayload.updatedBy = uid;
  saveCachedPayload(nextPayload);
  applyPayloadToGlobalArrays(nextPayload);

  if (configured && db) {
    const catalogRef = doc(db, 'medicines', CATALOG_DOC_ID);
    await setDoc(catalogRef, {
      ...nextPayload,
      status: 'approved',
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  }
}

export async function saveCommercialProductLive(
  product: EgyptianCommercialProduct,
  uid: string
): Promise<EgyptianCommercialProduct> {
  let latest = { ...currentPayload };
  if (configured && db) {
    try {
      const snap = await getDoc(doc(db, 'medicines', CATALOG_DOC_ID));
      if (snap.exists()) {
        const d = snap.data();
        latest = {
          overrides: d?.overrides && typeof d.overrides === 'object' ? { ...d.overrides } : {},
          customProducts: Array.isArray(d?.customProducts) ? [...d.customProducts] : [],
          deletedProductIds: Array.isArray(d?.deletedProductIds) ? [...d.deletedProductIds] : [],
          customIngredients: Array.isArray(d?.customIngredients) ? [...d.customIngredients] : [],
        };
      }
    } catch {
      /* fallback to current in-memory payload */
    }
  }

  const sanitized = sanitizeProduct({
    ...product,
    priceUpdatedDate: new Date().toISOString().slice(0, 10),
  });

  // Remove from deleted list if it was previously deleted
  latest.deletedProductIds = (latest.deletedProductIds || []).filter((id) => id !== sanitized.productId);

  const isBase = BASE_COMMERCIAL_PRODUCTS.some((b) => b.productId === sanitized.productId);
  if (isBase) {
    latest.overrides = {
      ...latest.overrides,
      [sanitized.productId]: sanitized,
    };
  } else {
    const idx = latest.customProducts.findIndex((p) => p.productId === sanitized.productId);
    if (idx >= 0) {
      latest.customProducts[idx] = sanitized;
    } else {
      latest.customProducts.push(sanitized);
    }
  }

  await persistCatalogPayload(latest, uid);
  return sanitized;
}

export async function deleteCommercialProductLive(productId: string, uid: string): Promise<void> {
  const latest: LiveCatalogPayload = {
    overrides: { ...currentPayload.overrides },
    customProducts: currentPayload.customProducts.filter((p) => p.productId !== productId),
    deletedProductIds: Array.from(new Set([...currentPayload.deletedProductIds, productId])),
    customIngredients: [...currentPayload.customIngredients],
  };
  delete latest.overrides[productId];
  await persistCatalogPayload(latest, uid);
}

export async function resetCommercialProductToDefault(productId: string, uid: string): Promise<void> {
  const latest: LiveCatalogPayload = {
    overrides: { ...currentPayload.overrides },
    customProducts: [...currentPayload.customProducts],
    deletedProductIds: currentPayload.deletedProductIds.filter((id) => id !== productId),
    customIngredients: [...currentPayload.customIngredients],
  };
  delete latest.overrides[productId];
  await persistCatalogPayload(latest, uid);
}

export async function saveActiveIngredientMetaLive(
  ingredient: ActiveIngredientRecord,
  uid: string
): Promise<void> {
  const latest: LiveCatalogPayload = {
    overrides: { ...currentPayload.overrides },
    customProducts: [...currentPayload.customProducts],
    deletedProductIds: [...currentPayload.deletedProductIds],
    customIngredients: [
      ...currentPayload.customIngredients.filter((a) => a.id !== ingredient.id),
      ingredient,
    ],
  };
  await persistCatalogPayload(latest, uid);
}

export function generateNextProductId(): string {
  let maxNum = 206;
  for (const p of EGYPTIAN_COMMERCIAL_PRODUCTS) {
    const m = p.productId.match(/EG-ABX-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `EG-ABX-${String(maxNum + 1).padStart(3, '0')}`;
}
