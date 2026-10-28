import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import {
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
} from './egyptianDrugDatabase';
import { QUESTIONS, Question } from './quizData';

export const CATALOG_DOC_ID = '__live_catalog__';

export interface LiveSurveyConfig {
  enabled: boolean;
  ethicsApprovalRef: string;
}

const LOCAL_PRODUCTS_KEY = 'aa_live_commercial_products_v1';
const LOCAL_QUESTIONS_KEY = 'aa_live_quiz_questions_v1';
const LOCAL_SURVEY_CFG_KEY = 'aa_live_survey_cfg_v1';

const BASELINE_PRODUCTS: EgyptianCommercialProduct[] = EGYPTIAN_COMMERCIAL_PRODUCTS.map((p) => ({
  ...p,
  dosageFormLabel: { ...p.dosageFormLabel },
  unitPriceNote: { ...p.unitPriceNote },
}));

const BASELINE_QUESTIONS: Question[] = QUESTIONS.map((q) => ({
  ...q,
  q: { ...q.q },
  options: q.options.map((o) => ({ ...o })),
  why: { ...q.why },
}));

let currentProducts: EgyptianCommercialProduct[] = [...BASELINE_PRODUCTS];
let currentQuestions: Question[] = [...BASELINE_QUESTIONS];
let currentSurveyConfig: LiveSurveyConfig | null = null;
let catalogVersion = 1;
let syncStarted = false;

function syncInPlaceProductArray(nextList: EgyptianCommercialProduct[]) {
  currentProducts = nextList;
  EGYPTIAN_COMMERCIAL_PRODUCTS.splice(0, EGYPTIAN_COMMERCIAL_PRODUCTS.length, ...nextList);
  catalogVersion += 1;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aa-live-catalog-updated', { detail: { version: catalogVersion } }));
  }
}

function notifyQuestionsUpdated() {
  catalogVersion += 1;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aa-live-questions-updated', { detail: { version: catalogVersion } }));
  }
}

function hydrateFromLocalStorage() {
  if (typeof window === 'undefined') return;
  try {
    const rawProds = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (rawProds) {
      const parsed = JSON.parse(rawProds);
      if (Array.isArray(parsed) && parsed.length > 0) {
        syncInPlaceProductArray(parsed);
      }
    }
  } catch {
    /* ignore */
  }

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

function applyRemoteCatalogDoc(data: Record<string, unknown> | undefined) {
  if (!data) return;

  if (Array.isArray(data.commercialProducts) && data.commercialProducts.length > 0) {
    const remoteProds = data.commercialProducts as EgyptianCommercialProduct[];
    try {
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(remoteProds));
    } catch {
      /* ignore */
    }
    syncInPlaceProductArray(remoteProds);
  }

  if (Array.isArray(data.quizQuestions) && data.quizQuestions.length > 0) {
    const remoteQs = data.quizQuestions as Question[];
    currentQuestions = remoteQs;
    try {
      localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(remoteQs));
    } catch {
      /* ignore */
    }
    notifyQuestionsUpdated();
  }

  if (data.surveyConfig && typeof data.surveyConfig === 'object') {
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
}

export function startLiveCatalogSync(): void {
  if (syncStarted) return;
  syncStarted = true;
  hydrateFromLocalStorage();

  if (!configured || !db) return;

  try {
    const ref = doc(db, 'medicines', CATALOG_DOC_ID);
    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          applyRemoteCatalogDoc(snap.data());
        }
      })
      .catch(() => {});

    onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          applyRemoteCatalogDoc(snap.data());
        }
      },
      () => {}
    );
  } catch {
    /* ignore */
  }
}

async function persistLiveCatalogDoc(patch: Record<string, unknown>, uid: string): Promise<void> {
  if (!configured || !db) return;
  const ref = doc(db, 'medicines', CATALOG_DOC_ID);
  await setDoc(
    ref,
    {
      ...patch,
      status: 'archived',
      updatedAt: serverTimestamp(),
      updatedBy: uid || 'editor',
    },
    { merge: true }
  );
}

export async function saveCommercialProductsListLive(
  nextProducts: EgyptianCommercialProduct[],
  uid: string
): Promise<void> {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(nextProducts));
  } catch {
    /* ignore */
  }
  syncInPlaceProductArray(nextProducts);
  await persistLiveCatalogDoc({ commercialProducts: nextProducts }, uid);
}

export async function upsertCommercialProductLive(
  product: EgyptianCommercialProduct,
  uid: string
): Promise<void> {
  const exists = currentProducts.some((p) => p.productId === product.productId);
  const next = exists
    ? currentProducts.map((p) => (p.productId === product.productId ? product : p))
    : [product, ...currentProducts];
  await saveCommercialProductsListLive(next, uid);
}

export async function deleteCommercialProductLive(
  productId: string,
  uid: string
): Promise<void> {
  const next = currentProducts.filter((p) => p.productId !== productId);
  await saveCommercialProductsListLive(next, uid);
}

export async function resetCommercialCatalogToDefault(uid: string): Promise<void> {
  const fresh = BASELINE_PRODUCTS.map((p) => ({ ...p }));
  await saveCommercialProductsListLive(fresh, uid);
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
  await persistLiveCatalogDoc({ quizQuestions: nextQuestions }, uid);
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
  await persistLiveCatalogDoc({ surveyConfig: cfg }, uid);
  if (configured && db) {
    try {
      await setDoc(doc(db, 'surveyConfig', 'main'), cfg, { merge: true });
    } catch {
      /* ignore if editor rather than admin */
    }
  }
}

export function useLiveDrugCatalog() {
  const [state, setState] = useState<{ products: EgyptianCommercialProduct[]; version: number }>(() => {
    startLiveCatalogSync();
    return { products: currentProducts, version: catalogVersion };
  });

  useEffect(() => {
    startLiveCatalogSync();
    const onUpdate = () => {
      setState({ products: [...currentProducts], version: catalogVersion });
    };
    window.addEventListener('aa-live-catalog-updated', onUpdate);
    return () => window.removeEventListener('aa-live-catalog-updated', onUpdate);
  }, []);

  return state;
}

export function useLiveQuizQuestions() {
  const [state, setState] = useState<{
    questions: Question[];
    surveyConfig: LiveSurveyConfig | null;
    version: number;
  }>(() => {
    startLiveCatalogSync();
    return {
      questions: currentQuestions,
      surveyConfig: currentSurveyConfig,
      version: catalogVersion,
    };
  });

  useEffect(() => {
    startLiveCatalogSync();
    const onUpdate = () => {
      setState({
        questions: [...currentQuestions],
        surveyConfig: currentSurveyConfig ? { ...currentSurveyConfig } : null,
        version: catalogVersion,
      });
    };
    window.addEventListener('aa-live-questions-updated', onUpdate);
    return () => window.removeEventListener('aa-live-questions-updated', onUpdate);
  }, []);

  return state;
}
