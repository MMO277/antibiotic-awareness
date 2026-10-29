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
const LOCAL_QUESTIONS_KEY = 'aa_live_quiz_questions_v1';
const LOCAL_SURVEY_CFG_KEY = 'aa_live_survey_cfg_v1';
const CATALOG_EVENT = 'aa-live-catalog-updated';
const QUESTIONS_EVENT = 'aa-live-questions-updated';

export interface LiveSurveyConfig {
  enabled: boolean;
  ethicsApprovalRef: string;
}

// Snapshot of the original factory arrays at startup so we can always merge or reset cleanly
const BASE_COMMERCIAL_PRODUCTS: EgyptianCommercialProduct[] = EGYPTIAN_COMMERCIAL_PRODUCTS.map((p) => ({
  ...p,
  dosageFormLabel: { ...p.dosageFormLabel },
  routeLabel: p.routeLabel ? { ...p.routeLabel } : { ...(ROUTE_LABELS[p.route] || ROUTE_LABELS.oral) },
  packDetails: p.packDetails
    ? { ...p.packDetails }
    : { ar: p.packSize || 'عبوة قياسية', en: p.packSize || 'Standard pack' },
  unitPriceNote: { ...p.unitPriceNote },
}));

const BASE_ACTIVE_INGREDIENTS: ActiveIngredientRecord[] = ACTIVE_INGREDIENTS.map((a) => ({
  ...a,
  drugClass: { ...a.drugClass },
  components: [...a.components],
}));

const BASELINE_QUESTIONS: Question[] = QUESTIONS.map((q) => ({
  ...q,
  q: { ...q.q },
  options: q.options.map((o) => ({ ...o })),
  why: { ...q.why },
}));

export interface LiveCatalogPayload {
  overrides: Record<string, EgyptianCommercialProduct>;
  customProducts: EgyptianCommercialProduct[];
  deletedProductIds: string[];
  customIngredients: ActiveIngredientRecord[];
  quizQuestions?: Question[];
  surveyConfig?: LiveSurveyConfig;
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
let currentQuestions: Question[] = [...BASELINE_QUESTIONS];
let currentSurveyConfig: LiveSurveyConfig | null = null;
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

function loadCachedQuestionsAndSurvey(): void {
  if (typeof window === 'undefined') return;
  try {
    const rawQs = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    if (rawQs) {
      const parsed = JSON.parse(rawQs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        currentQuestions = parsed;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const rawCfg = localStorage.getItem(LOCAL_SURVEY_CFG_KEY);
    if (rawCfg) {
      const parsed = JSON.parse(rawCfg);
      if (parsed && typeof parsed.enabled === 'boolean') {
        currentSurveyConfig = {
          enabled: parsed.enabled,
          ethicsApprovalRef: String(parsed.ethicsApprovalRef || 'AMR-EDU-2026'),
        };
      }
    }
  } catch {
    /* ignore */
  }
}

function saveCachedPayload(payload: LiveCatalogPayload): void {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function notifyQuestionsUpdated(): void {
  currentVersion += 1;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUESTIONS_EVENT, { detail: currentVersion }));
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
      ar: raw.packDetails?.ar || raw.packSize || 'عبوة قياسية',
      en: raw.packDetails?.en || raw.packDetails?.ar || raw.packSize || 'Standard pack',
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
  currentVersion += 1;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CATALOG_EVENT, { detail: currentVersion }));
  }
}

// Initialize immediately from localStorage cache (0ms)
if (typeof window !== 'undefined') {
  const initialCached = loadCachedPayload();
  applyPayloadToGlobalArrays(initialCached);
  loadCachedQuestionsAndSurvey();
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

      if (Array.isArray(data?.quizQuestions) && data.quizQuestions.length > 0) {
        currentQuestions = data.quizQuestions as Question[];
        try {
          localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(currentQuestions));
        } catch {
          /* ignore */
        }
        notifyQuestionsUpdated();
      }

      if (data?.surveyConfig && typeof data.surveyConfig === 'object') {
        const sc = data.surveyConfig as Record<string, unknown>;
        currentSurveyConfig = {
          enabled: sc.enabled !== false,
          ethicsApprovalRef: String(sc.ethicsApprovalRef || 'AMR-EDU-2026'),
        };
        try {
          localStorage.setItem(LOCAL_SURVEY_CFG_KEY, JSON.stringify(currentSurveyConfig));
        } catch {
          /* ignore */
        }
        notifyQuestionsUpdated();
      }
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
  version: number;
} {
  const [state, setState] = useState<{
    questions: Question[];
    surveyConfig: LiveSurveyConfig | null;
    version: number;
  }>(() => {
    startLiveCatalogSync();
    return {
      questions: currentQuestions,
      surveyConfig: currentSurveyConfig,
      version: currentVersion,
    };
  });

  useEffect(() => {
    startLiveCatalogSync();
    const onUpdate = () => {
      setState({
        questions: [...currentQuestions],
        surveyConfig: currentSurveyConfig ? { ...currentSurveyConfig } : null,
        version: currentVersion,
      });
    };
    window.addEventListener(QUESTIONS_EVENT, onUpdate);
    return () => window.removeEventListener(QUESTIONS_EVENT, onUpdate);
  }, []);

  return state;
}

async function persistCatalogPayload(nextPayload: LiveCatalogPayload, uid: string): Promise<void> {
  nextPayload.updatedAtIso = new Date().toISOString();
  nextPayload.updatedBy = uid;
  saveCachedPayload(nextPayload);
  applyPayloadToGlobalArrays(nextPayload);

  if (configured && db) {
    const catalogRef = doc(db, 'medicines', CATALOG_DOC_ID);
    await setDoc(
      catalogRef,
      {
        ...nextPayload,
        status: 'approved',
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true }
    );
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

export async function upsertCommercialProductLive(
  product: EgyptianCommercialProduct,
  uid: string
): Promise<EgyptianCommercialProduct> {
  return saveCommercialProductLive(product, uid);
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

export async function resetCommercialCatalogToDefault(uid: string): Promise<void> {
  const latest: LiveCatalogPayload = emptyPayload();
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

export async function saveQuizQuestionsLive(
  nextQuestions: Question[],
  uid: string
): Promise<void> {
  currentQuestions = nextQuestions;
  try {
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(nextQuestions));
  } catch {
    /* ignore */
  }
  notifyQuestionsUpdated();
  if (configured && db) {
    try {
      const catalogRef = doc(db, 'medicines', CATALOG_DOC_ID);
      await setDoc(
        catalogRef,
        {
          quizQuestions: nextQuestions,
          status: 'approved',
          updatedAt: serverTimestamp(),
          updatedBy: uid || 'editor',
        },
        { merge: true }
      );
    } catch {
      /* ignore */
    }
  }
}

export async function resetQuizQuestionsToDefault(uid: string): Promise<void> {
  const fresh = BASELINE_QUESTIONS.map((q) => ({
    ...q,
    q: { ...q.q },
    options: q.options.map((o) => ({ ...o })),
    why: { ...q.why },
  }));
  await saveQuizQuestionsLive(fresh, uid);
}

export async function saveSurveyConfigLive(
  cfg: LiveSurveyConfig,
  uid: string
): Promise<void> {
  currentSurveyConfig = cfg;
  try {
    localStorage.setItem(LOCAL_SURVEY_CFG_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
  notifyQuestionsUpdated();
  if (configured && db) {
    try {
      await setDoc(
        doc(db, 'medicines', CATALOG_DOC_ID),
        {
          surveyConfig: cfg,
          status: 'approved',
          updatedAt: serverTimestamp(),
          updatedBy: uid || 'editor',
        },
        { merge: true }
      );
      await setDoc(doc(db, 'surveyConfig', 'main'), cfg, { merge: true });
    } catch {
      /* ignore */
    }
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
