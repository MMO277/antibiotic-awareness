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
import { QUESTIONS, Question } from './quizData';

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

export const BASE_QUIZ_QUESTIONS: Question[] = QUESTIONS.map((q) => ({
  level: q.level,
  q: { ...q.q },
  options: q.options.map((opt) => ({ ...opt })),
  answer: q.answer,
  why: { ...q.why },
}));

export interface LiveSurveyConfig {
  enabled: boolean;
  ethicsApprovalRef: string;
}

export interface LiveCatalogPayload {
  overrides: Record<string, EgyptianCommercialProduct>;
  customProducts: EgyptianCommercialProduct[];
  deletedProductIds: string[];
  customIngredients: ActiveIngredientRecord[];
  quizQuestions?: Question[] | null;
  surveyConfig?: LiveSurveyConfig | null;
  updatedAtIso?: string;
  updatedBy?: string;
}

const emptyPayload = (): LiveCatalogPayload => ({
  overrides: {},
  customProducts: [],
  deletedProductIds: [],
  customIngredients: [],
  quizQuestions: null,
  surveyConfig: null,
});

let currentPayload: LiveCatalogPayload = emptyPayload();
let currentVersion = 1;
let listenerStarted = false;

function sanitizeQuestion(raw: Question): Question {
  const validLevel = raw.level === 'hard' || raw.level === 'medium' ? raw.level : 'easy';
  const rawOpts = Array.isArray(raw.options) && raw.options.length >= 2 ? raw.options : [
    { ar: 'نعم', en: 'Yes' },
    { ar: 'لا', en: 'No' },
  ];
  const options = rawOpts.map((o) => ({
    ar: String(o?.ar || o?.en || '').trim() || 'خيار',
    en: String(o?.en || o?.ar || '').trim() || 'Option',
    ...(o?.fr ? { fr: String(o.fr) } : {}),
    ...(o?.es ? { es: String(o.es) } : {}),
  }));
  const answer =
    typeof raw.answer === 'number' && raw.answer >= 0 && raw.answer < options.length
      ? raw.answer
      : 0;
  return {
    level: validLevel,
    q: {
      ar: String(raw.q?.ar || raw.q?.en || '').trim(),
      en: String(raw.q?.en || raw.q?.ar || '').trim(),
      ...(raw.q?.fr ? { fr: String(raw.q.fr) } : {}),
      ...(raw.q?.es ? { es: String(raw.q.es) } : {}),
    },
    options,
    answer,
    why: {
      ar: String(raw.why?.ar || raw.why?.en || '').trim(),
      en: String(raw.why?.en || raw.why?.ar || '').trim(),
      ...(raw.why?.fr ? { fr: String(raw.why.fr) } : {}),
      ...(raw.why?.es ? { es: String(raw.why.es) } : {}),
    },
  };
}

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
      quizQuestions: Array.isArray(parsed?.quizQuestions)
        ? parsed.quizQuestions.map(sanitizeQuestion)
        : null,
      surveyConfig:
        parsed?.surveyConfig && typeof parsed.surveyConfig === 'object'
          ? {
              enabled: Boolean(parsed.surveyConfig.enabled),
              ethicsApprovalRef: String(parsed.surveyConfig.ethicsApprovalRef || 'AMR-EDU-2026'),
            }
          : null,
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
    const existingIdx = mergedProducts.findIndex((p) => p.productId === customProd.productId);
    const cleanCustom = sanitizeProduct(customProd);
    if (existingIdx >= 0) {
      mergedProducts[existingIdx] = cleanCustom;
    } else {
      mergedProducts.push(cleanCustom);
    }
  }

  EGYPTIAN_COMMERCIAL_PRODUCTS.splice(0, EGYPTIAN_COMMERCIAL_PRODUCTS.length, ...mergedProducts);

  // 3. Merge Quiz & Research Survey Questions in-place
  if (Array.isArray(payload.quizQuestions) && payload.quizQuestions.length > 0) {
    const cleanQs = payload.quizQuestions.map(sanitizeQuestion);
    QUESTIONS.splice(0, QUESTIONS.length, ...cleanQs);
  } else {
    QUESTIONS.splice(0, QUESTIONS.length, ...BASE_QUIZ_QUESTIONS.map((q) => ({
      level: q.level,
      q: { ...q.q },
      options: q.options.map((opt) => ({ ...opt })),
      answer: q.answer,
      why: { ...q.why },
    })));
  }

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
        quizQuestions: Array.isArray(data?.quizQuestions)
          ? data.quizQuestions.map(sanitizeQuestion)
          : null,
        surveyConfig:
          data?.surveyConfig && typeof data.surveyConfig === 'object'
            ? {
                enabled: Boolean(data.surveyConfig.enabled),
                ethicsApprovalRef: String(data.surveyConfig.ethicsApprovalRef || 'AMR-EDU-2026'),
              }
            : null,
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

export function useLiveQuizQuestions(): {
  questions: Question[];
  surveyConfig: LiveSurveyConfig | null;
  isCustomized: boolean;
  version: number;
} {
  const [version, setVersion] = useState<number>(currentVersion);

  useEffect(() => {
    startLiveCatalogSync();
    const onUpdate = () => setVersion(currentVersion);
    window.addEventListener(CATALOG_EVENT, onUpdate);
    return () => window.removeEventListener(CATALOG_EVENT, onUpdate);
  }, []);

  return {
    questions: [...QUESTIONS],
    surveyConfig: currentPayload.surveyConfig ?? null,
    isCustomized: Array.isArray(currentPayload.quizQuestions) && currentPayload.quizQuestions.length > 0,
    version,
  };
}

async function fetchLatestCloudPayload(): Promise<LiveCatalogPayload> {
  let latest: LiveCatalogPayload = {
    overrides: { ...currentPayload.overrides },
    customProducts: [...currentPayload.customProducts],
    deletedProductIds: [...currentPayload.deletedProductIds],
    customIngredients: [...currentPayload.customIngredients],
    quizQuestions: currentPayload.quizQuestions ? [...currentPayload.quizQuestions] : null,
    surveyConfig: currentPayload.surveyConfig ? { ...currentPayload.surveyConfig } : null,
  };
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
          quizQuestions: Array.isArray(d?.quizQuestions)
            ? d.quizQuestions.map(sanitizeQuestion)
            : null,
          surveyConfig:
            d?.surveyConfig && typeof d.surveyConfig === 'object'
              ? {
                  enabled: Boolean(d.surveyConfig.enabled),
                  ethicsApprovalRef: String(d.surveyConfig.ethicsApprovalRef || 'AMR-EDU-2026'),
                }
              : null,
        };
      }
    } catch {
      /* fallback to current in-memory payload */
    }
  }
  return latest;
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
  const latest = await fetchLatestCloudPayload();

  const sanitized = sanitizeProduct({
    ...product,
    priceUpdatedDate: new Date().toISOString().slice(0, 10),
  });

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
  const latest = await fetchLatestCloudPayload();
  latest.customProducts = latest.customProducts.filter((p) => p.productId !== productId);
  latest.deletedProductIds = Array.from(new Set([...latest.deletedProductIds, productId]));
  delete latest.overrides[productId];
  await persistCatalogPayload(latest, uid);
}

export async function resetCommercialProductToDefault(productId: string, uid: string): Promise<void> {
  const latest = await fetchLatestCloudPayload();
  latest.deletedProductIds = latest.deletedProductIds.filter((id) => id !== productId);
  delete latest.overrides[productId];
  await persistCatalogPayload(latest, uid);
}

export async function saveActiveIngredientMetaLive(
  ingredient: ActiveIngredientRecord,
  uid: string
): Promise<void> {
  const latest = await fetchLatestCloudPayload();
  latest.customIngredients = [
    ...latest.customIngredients.filter((a) => a.id !== ingredient.id),
    ingredient,
  ];
  await persistCatalogPayload(latest, uid);
}

export async function saveQuizQuestionsLive(
  questions: Question[],
  uid: string
): Promise<Question[]> {
  const latest = await fetchLatestCloudPayload();
  const sanitizedList = questions.map(sanitizeQuestion);
  latest.quizQuestions = sanitizedList;
  await persistCatalogPayload(latest, uid);
  return sanitizedList;
}

export async function resetQuizQuestionsToDefault(uid: string): Promise<void> {
  const latest = await fetchLatestCloudPayload();
  latest.quizQuestions = null;
  await persistCatalogPayload(latest, uid);
}

export async function saveSurveyConfigLive(
  cfg: LiveSurveyConfig,
  uid: string
): Promise<void> {
  const latest = await fetchLatestCloudPayload();
  const cleanCfg: LiveSurveyConfig = {
    enabled: Boolean(cfg.enabled),
    ethicsApprovalRef: String(cfg.ethicsApprovalRef || 'AMR-EDU-2026').trim() || 'AMR-EDU-2026',
  };
  latest.surveyConfig = cleanCfg;
  await persistCatalogPayload(latest, uid);

  // Also attempt to write to surveyConfig/main and researchConfig/main if user is admin
  if (configured && db) {
    await Promise.all([
      setDoc(doc(db, 'surveyConfig', 'main'), cleanCfg).catch(() => {}),
      setDoc(doc(db, 'researchConfig', 'main'), cleanCfg).catch(() => {}),
    ]);
  }
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
