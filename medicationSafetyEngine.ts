/**
 * Centralized Medication Safety Engine (`medicationSafetyEngine.ts`)
 *
 * Unique Responsibility:
 * Provides one authoritative, deterministic medication-safety assessment entry point
 * (`evaluateMedicationSafety`) that connects and reuses:
 *   1. Egyptian Drug Database & Active Ingredient Catalog (`egyptianDrugDatabase.ts`)
 *   2. Drug Monograph Seed (`seedData.ts`) & shared text normalization (`search.ts`)
 *   3. Allergy Checker & Beta-Lactam Cross-Reactivity Engine (`allergyData.ts`)
 *   4. Drug–Drug, Supplement & Food Interaction Engine (`interactionsData.ts`)
 *   5. Patient Health Profile (`UserHealthProfile` from `allergyData.ts`)
 *
 * Clinical Decision Support Principles:
 * - Deterministic rules only; never fabricates sources, dates, interactions, or clinical facts.
 * - Never infers an active ingredient solely from a look-alike trade name.
 * - Distinguishes compositionally/clinically non-equivalent products (combination vs single ingredient, different strengths, forms, or routes).
 * - Explicitly reports `incomplete_check` / `unable_to_verify` states when identity or data sources are unavailable.
 * - "No alerts found" never implies a prescription is guaranteed safe.
 */

import { Bi, Source } from './types';
import { SEED, SeedItem } from './seedData';
import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  ActiveIngredientRecord,
  EgyptianCommercialProduct,
  AdministrationRoute,
  DosageFormType,
  getClassifiedAlternatives,
} from './egyptianDrugDatabase';
import { norm, normalizeMedToken } from './search';
import {
  UserHealthProfile,
  AllergyRecord,
  MedicationRecord,
  checkDrugAllergySafety,
  resolveCanonicalAllergenDrugId,
  DRUG_ALLERGEN_MAP,
} from './allergyData';
import {
  INTERACTION_SOURCES,
  TARGETS,
  ANTIBIOTIC_PAIR_RULES,
  resolveTargetId,
  findInteractionRule,
} from './interactionsData';

export type SafetyFindingSeverity = 'urgent' | 'warning' | 'caution' | 'info';

export type SafetyFindingType =
  | 'duplicate_ingredient'
  | 'allergy_match'
  | 'allergy_cross_reactivity'
  | 'drug_interaction'
  | 'profile_contraindication'
  | 'identity_uncertainty'
  | 'data_source_unavailable';

export type OverallSafetyStatus =
  | 'urgent_review'
  | 'warning_review'
  | 'caution_verify'
  | 'incomplete_check'
  | 'no_known_alerts';

export interface SafetyFindingSource {
  title: Bi;
  url?: string;
  updatedDate?: string;
  publisher?: string;
}

export interface SafetyFinding {
  id: string;
  type: SafetyFindingType;
  severity: SafetyFindingSeverity;
  involvedMedicines: Bi[];
  involvedIngredients: string[];
  title: Bi;
  reason: Bi;
  nextStep: Bi;
  nursingNote?: Bi;
  source: SafetyFindingSource;
  dataCompleteness: {
    isComplete: boolean;
    status: 'verified' | 'partial' | 'unable_to_verify';
    uncertaintyNote: Bi;
  };
}

export interface MedicationInputItem {
  id?: string;
  rawName?: string;
  name?: string;
  activeIngredientId?: string;
  barcode?: string;
  strength?: string;
  prescribedDose?: string;
  dosageForm?: string;
  route?: string;
  sourceType?: 'prescription' | 'profile_active' | 'manual_check' | 'co_medication';
}

export type MedicationResolutionStatus =
  | 'resolved_exact_product'
  | 'resolved_ingredient_only'
  | 'uncertain_brand_match'
  | 'unresolved';

export interface ResolvedMedicationIdentity {
  inputKey: string;
  rawInput: string;
  sourceType: 'prescription' | 'profile_active' | 'manual_check' | 'co_medication';
  matchedStatus: 'verified' | 'uncertain' | 'unrecognized';
  resolutionStatus: MedicationResolutionStatus;
  uncertaintyReason?: Bi;
  uncertaintyReasons: Bi[];
  activeIngredientId?: string;
  activeIngredient?: ActiveIngredientRecord;
  interactionTargetId?: string;
  productId?: string;
  displayName: Bi;
  genericName: Bi;
  components: string[]; // Canonical lowercase component names (e.g. ['amoxicillin', 'clavulanic acid'])
  componentsDisplay: Bi[];
  componentsDisplayText: string[];
  isCombination: boolean;
  strength: string;
  dosageForm: DosageFormType | string;
  route: AdministrationRoute | string;
  equivalenceGroupKey?: string;
  commercialProduct?: EgyptianCommercialProduct;
  ingredientRecord?: ActiveIngredientRecord;
  seedMonograph?: SeedItem;
}

export interface SafetyEngineInput {
  medications: Array<string | MedicationInputItem>;
  coMedicationIds?: string[];
  healthProfile?: Partial<UserHealthProfile> | null;
  includeProfileActiveMedications?: boolean;
  patientAgeOverride?: number | string | null;
  dataSourceFailure?: {
    sourceName: string;
    reason?: string;
  } | null;
}

export interface SafetyAssessmentResult {
  engineVersion: string;
  evaluatedAt: string;
  overallStatus: OverallSafetyStatus;
  resolvedMedications: ResolvedMedicationIdentity[];
  findings: SafetyFinding[];
  groupedFindings: {
    duplicates: SafetyFinding[];
    allergies: SafetyFinding[];
    interactions: SafetyFinding[];
    profileContraindications: SafetyFinding[];
    uncertainties: SafetyFinding[];
  };
  completeness: {
    status: 'complete' | 'partial' | 'unable_to_verify';
    summaryBanner: Bi;
    missingProfileFields: string[];
    unverifiedInteractionPairs: string[];
  };
  safetyDisclaimer: Bi;
}

export const ENGINE_VERSION = '1.0.0-deterministic';

const SOURCE_EDA: SafetyFindingSource = {
  title: {
    ar: INTERACTION_SOURCES.eda_stewardship.title,
    en: 'Egyptian Drug Authority (EDA) National Drug Database & Stewardship Guidelines',
  },
  url: INTERACTION_SOURCES.eda_stewardship.url,
  updatedDate: INTERACTION_SOURCES.eda_stewardship.updated,
  publisher: INTERACTION_SOURCES.eda_stewardship.publisher,
};

const SOURCE_MEDLINE_FDA: SafetyFindingSource = {
  title: {
    ar: 'المكتبة الوطنية للطب (NIH MedlinePlus) وإدارة الغذاء والدواء الأمريكية (FDA)',
    en: INTERACTION_SOURCES.medlineplus_fda.title,
  },
  url: INTERACTION_SOURCES.medlineplus_fda.url,
  updatedDate: INTERACTION_SOURCES.medlineplus_fda.updated,
  publisher: INTERACTION_SOURCES.medlineplus_fda.publisher,
};

const SOURCE_WHO_AWARE: SafetyFindingSource = {
  title: {
    ar: 'دليل منظمة الصحة العالمية للمضادات الحيوية (WHO AWaRe Antibiotic Book)',
    en: INTERACTION_SOURCES.who_aware.title,
  },
  url: INTERACTION_SOURCES.who_aware.url,
  updatedDate: INTERACTION_SOURCES.who_aware.updated,
  publisher: INTERACTION_SOURCES.who_aware.publisher,
};

function fromSource(src?: Source): SafetyFindingSource {
  if (!src) return SOURCE_MEDLINE_FDA;
  return {
    title: {
      ar: src.title,
      en: src.title,
    },
    url: src.url,
    updatedDate: src.updated || src.accessed,
    publisher: src.publisher,
  };
}

const CANONICAL_COMPONENT_ALIASES: Record<string, { canonical: string; display: string }> = {
  amoxicillin: { canonical: 'amoxicillin', display: 'Amoxicillin' },
  amoxycillin: { canonical: 'amoxicillin', display: 'Amoxicillin' },
  اموكسيسيلين: { canonical: 'amoxicillin', display: 'Amoxicillin' },
  أموكسيسيلين: { canonical: 'amoxicillin', display: 'Amoxicillin' },
  'clavulanic acid': { canonical: 'clavulanic acid', display: 'Clavulanic Acid' },
  clavulanic_acid: { canonical: 'clavulanic acid', display: 'Clavulanic Acid' },
  clavulanate: { canonical: 'clavulanic acid', display: 'Clavulanic Acid' },
  كلافولانيك: { canonical: 'clavulanic acid', display: 'Clavulanic Acid' },
  كلافولانات: { canonical: 'clavulanic acid', display: 'Clavulanic Acid' },
  ampicillin: { canonical: 'ampicillin', display: 'Ampicillin' },
  امبيسيلين: { canonical: 'ampicillin', display: 'Ampicillin' },
  أمبيسيلين: { canonical: 'ampicillin', display: 'Ampicillin' },
  sulbactam: { canonical: 'sulbactam', display: 'Sulbactam' },
  سولباكتام: { canonical: 'sulbactam', display: 'Sulbactam' },
  flucloxacillin: { canonical: 'flucloxacillin', display: 'Flucloxacillin' },
  فلوكلوكساسيللين: { canonical: 'flucloxacillin', display: 'Flucloxacillin' },
  phenoxymethylpenicillin: { canonical: 'phenoxymethylpenicillin', display: 'Phenoxymethylpenicillin (Penicillin V)' },
  'penicillin v': { canonical: 'phenoxymethylpenicillin', display: 'Phenoxymethylpenicillin (Penicillin V)' },
  cephalexin: { canonical: 'cephalexin', display: 'Cephalexin' },
  cefalexin: { canonical: 'cephalexin', display: 'Cephalexin' },
  سيفالكسين: { canonical: 'cephalexin', display: 'Cephalexin' },
  cefadroxil: { canonical: 'cefadroxil', display: 'Cefadroxil' },
  سيفادروكسيل: { canonical: 'cefadroxil', display: 'Cefadroxil' },
  cefuroxime: { canonical: 'cefuroxime', display: 'Cefuroxime' },
  سيفوروكسيم: { canonical: 'cefuroxime', display: 'Cefuroxime' },
  cefixime: { canonical: 'cefixime', display: 'Cefixime' },
  سيفيكسيم: { canonical: 'cefixime', display: 'Cefixime' },
  cefdinir: { canonical: 'cefdinir', display: 'Cefdinir' },
  سيفدينير: { canonical: 'cefdinir', display: 'Cefdinir' },
  ceftriaxone: { canonical: 'ceftriaxone', display: 'Ceftriaxone' },
  سيفترياكسون: { canonical: 'ceftriaxone', display: 'Ceftriaxone' },
  cefotaxime: { canonical: 'cefotaxime', display: 'Cefotaxime' },
  سيفوتاكسيم: { canonical: 'cefotaxime', display: 'Cefotaxime' },
  cefoperazone: { canonical: 'cefoperazone', display: 'Cefoperazone' },
  سيفوبيرازون: { canonical: 'cefoperazone', display: 'Cefoperazone' },
  cefepime: { canonical: 'cefepime', display: 'Cefepime' },
  سيفيبيم: { canonical: 'cefepime', display: 'Cefepime' },
  azithromycin: { canonical: 'azithromycin', display: 'Azithromycin' },
  ازيثرومايسين: { canonical: 'azithromycin', display: 'Azithromycin' },
  أزيثرومايسين: { canonical: 'azithromycin', display: 'Azithromycin' },
  clarithromycin: { canonical: 'clarithromycin', display: 'Clarithromycin' },
  كلاريثرومايسين: { canonical: 'clarithromycin', display: 'Clarithromycin' },
  كلاريثروميسين: { canonical: 'clarithromycin', display: 'Clarithromycin' },
  erythromycin: { canonical: 'erythromycin', display: 'Erythromycin' },
  إريثرومايسين: { canonical: 'erythromycin', display: 'Erythromycin' },
  اريثرومايسين: { canonical: 'erythromycin', display: 'Erythromycin' },
  ciprofloxacin: { canonical: 'ciprofloxacin', display: 'Ciprofloxacin' },
  سيبروفلوكساسين: { canonical: 'ciprofloxacin', display: 'Ciprofloxacin' },
  levofloxacin: { canonical: 'levofloxacin', display: 'Levofloxacin' },
  ليفوفلوكساسين: { canonical: 'levofloxacin', display: 'Levofloxacin' },
  moxifloxacin: { canonical: 'moxifloxacin', display: 'Moxifloxacin' },
  موكسيفلوكساسين: { canonical: 'moxifloxacin', display: 'Moxifloxacin' },
  doxycycline: { canonical: 'doxycycline', display: 'Doxycycline' },
  دوكسيسيكلين: { canonical: 'doxycycline', display: 'Doxycycline' },
  clindamycin: { canonical: 'clindamycin', display: 'Clindamycin' },
  كليندامايسين: { canonical: 'clindamycin', display: 'Clindamycin' },
  metronidazole: { canonical: 'metronidazole', display: 'Metronidazole' },
  ميترونيدازول: { canonical: 'metronidazole', display: 'Metronidazole' },
  nitrofurantoin: { canonical: 'nitrofurantoin', display: 'Nitrofurantoin' },
  نيتروفورانتوين: { canonical: 'nitrofurantoin', display: 'Nitrofurantoin' },
  sulfamethoxazole: { canonical: 'sulfamethoxazole', display: 'Sulfamethoxazole' },
  سلفاميثوكسازول: { canonical: 'sulfamethoxazole', display: 'Sulfamethoxazole' },
  trimethoprim: { canonical: 'trimethoprim', display: 'Trimethoprim' },
  تريميثوبريم: { canonical: 'trimethoprim', display: 'Trimethoprim' },
  gentamicin: { canonical: 'gentamicin', display: 'Gentamicin' },
  جنتامايسين: { canonical: 'gentamicin', display: 'Gentamicin' },
  جنتاميسين: { canonical: 'gentamicin', display: 'Gentamicin' },
  amikacin: { canonical: 'amikacin', display: 'Amikacin' },
  أميكاسين: { canonical: 'amikacin', display: 'Amikacin' },
  اميكاسين: { canonical: 'amikacin', display: 'Amikacin' },
  meropenem: { canonical: 'meropenem', display: 'Meropenem' },
  ميروبينيم: { canonical: 'meropenem', display: 'Meropenem' },
  vancomycin: { canonical: 'vancomycin', display: 'Vancomycin' },
  فانكومايسين: { canonical: 'vancomycin', display: 'Vancomycin' },
  linezolid: { canonical: 'linezolid', display: 'Linezolid' },
  لينيزوليد: { canonical: 'linezolid', display: 'Linezolid' },
  لينزوليد: { canonical: 'linezolid', display: 'Linezolid' },
  'fusidic acid': { canonical: 'fusidic acid', display: 'Fusidic Acid' },
  'حمض الفيوسيديك': { canonical: 'fusidic acid', display: 'Fusidic Acid' },
  rifaximin: { canonical: 'rifaximin', display: 'Rifaximin' },
  ريفاكسيمين: { canonical: 'rifaximin', display: 'Rifaximin' },
  warfarin: { canonical: 'warfarin', display: 'Warfarin' },
  وارفارين: { canonical: 'warfarin', display: 'Warfarin' },
  paracetamol: { canonical: 'paracetamol', display: 'Paracetamol' },
  acetaminophen: { canonical: 'paracetamol', display: 'Paracetamol' },
  باراسيتامول: { canonical: 'paracetamol', display: 'Paracetamol' },
};

/**
 * Extracts inline strength (e.g. "500 mg", "1g", "0.3%") and route/form hints from free-text input.
 */
function parseInlineStrengthAndRoute(raw: string): {
  cleanedName: string;
  strength: string;
  dosageForm: string;
  route: AdministrationRoute | '';
} {
  const text = (raw || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .trim();

  const strengthMatch = text.match(
    /\b\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*(?:mg|gm|g|mcg|iu|ml|%|مجم|جم|ملجم|مل)\b/gi
  );
  const strength = strengthMatch ? strengthMatch.join(' ') : '';

  const formRegex =
    /\b(tablets?|tabs?|caplets?|capsules?|caps?|suspension|syrup|vials?|ampoules?|injection|infusion|eye\s*drops?|ear\s*drops?|drops?|cream|ointment|gel|sachets?|أقراص|اقراص|قرص|كبسولات|كبسول|كبسولة|شراب|معلق|فيال|أمبول|امبول|حقن|قطرة|مرهم|كريم|أكياس)\b/gi;
  const formMatch = text.match(formRegex);
  const dosageForm = formMatch ? formMatch.join(' ') : '';

  let route: AdministrationRoute | '' = '';
  const fNorm = norm(dosageForm);
  if (fNorm.includes('eye') || fNorm.includes('ear') || fNorm.includes('drop') || fNorm.includes('قطره') || fNorm.includes('قطرة')) {
    route = 'ophthalmic_otic';
  } else if (fNorm.includes('cream') || fNorm.includes('ointment') || fNorm.includes('gel') || fNorm.includes('كريم') || fNorm.includes('مرهم')) {
    route = 'topical';
  } else if (fNorm.includes('vial') || fNorm.includes('ampoule') || fNorm.includes('injection') || fNorm.includes('infusion') || fNorm.includes('فيال') || fNorm.includes('امبول') || fNorm.includes('حقن')) {
    route = 'parenteral_iv_im';
  } else if (fNorm) {
    route = 'oral';
  }

  const cleanedName = text
    .replace(/\b\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*(?:mg|gm|g|mcg|iu|ml|%|مجم|جم|ملجم|مل)\b/gi, ' ')
    .replace(formRegex, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanedName: cleanedName || text,
    strength,
    dosageForm,
    route,
  };
}

/**
 * Normalizes active ingredient component names into canonical lowercase strings.
 */
const COMPONENT_AR_LABELS: Record<string, string> = {
  amoxicillin: 'أموكسيسيلين',
  'clavulanic acid': 'حمض الكلافولانيك',
  ampicillin: 'أمبيسيلين',
  sulbactam: 'سولباكتام',
  flucloxacillin: 'فلوكلوكساسيللين',
  phenoxymethylpenicillin: 'فينوكسي ميثيل بنسلين (بنسلين V)',
  cephalexin: 'سيفالكسين',
  cefadroxil: 'سيفادروكسيل',
  cefuroxime: 'سيفوروكسيم',
  cefixime: 'سيفيكسيم',
  cefdinir: 'سيفدينير',
  ceftriaxone: 'سيفترياكسون',
  cefotaxime: 'سيفوتاكسيم',
  cefoperazone: 'سيفوبيرازون',
  cefepime: 'سيفيبيم',
  azithromycin: 'أزيثرومايسين',
  clarithromycin: 'كلاريثرومايسين',
  erythromycin: 'إريثرومايسين',
  ciprofloxacin: 'سيبروفلوكساسين',
  levofloxacin: 'ليفوفلوكساسين',
  moxifloxacin: 'موكسيفلوكساسين',
  doxycycline: 'دوكسيسيكلين',
  clindamycin: 'كليندامايسين',
  metronidazole: 'ميترونيدازول',
  nitrofurantoin: 'نيتروفورانتوين',
  sulfamethoxazole: 'سلفاميثوكسازول',
  trimethoprim: 'تريميثوبريم',
  gentamicin: 'جنتامايسين',
  amikacin: 'أميكاسين',
  meropenem: 'ميروبينيم',
  vancomycin: 'فانكومايسين',
  linezolid: 'لينيزوليد',
  'fusidic acid': 'حمض الفيوسيديك',
  rifaximin: 'ريفاكسيمين',
  warfarin: 'وارفارين',
  paracetamol: 'باراسيتامول',
};

export function parseActiveIngredients(rawComposition: string): {
  components: string[];
  componentsDisplay: Bi[];
  componentsDisplayText: string[];
} {
  const cleaned = (rawComposition || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bco-amoxiclav\b/gi, 'Amoxicillin + Clavulanic Acid')
    .replace(/\bco-trimoxazole\b/gi, 'Sulfamethoxazole + Trimethoprim');

  const parts = cleaned
    .split(/\s*(?:\+|\/|&|,|،|\band\b|\bwith\b)\s*/i)
    .map((p) => p.replace(/\b\d+(?:\.\d+)?\s*(?:mg|gm|g|mcg|iu|ml|%)\b/gi, '').trim())
    .filter(Boolean);

  const components: string[] = [];
  const componentsDisplay: Bi[] = [];
  const componentsDisplayText: string[] = [];

  for (const p of parts) {
    const token = normalizeMedToken(p);
    if (!token) continue;
    const mapped = CANONICAL_COMPONENT_ALIASES[token] || CANONICAL_COMPONENT_ALIASES[norm(p)];
    const canonical = mapped ? mapped.canonical : token;
    const displayEn = mapped ? mapped.display : p;
    const displayAr = COMPONENT_AR_LABELS[canonical] || displayEn;
    if (!components.includes(canonical)) {
      components.push(canonical);
      componentsDisplay.push({ ar: displayAr, en: displayEn });
      componentsDisplayText.push(displayEn);
    }
  }

  return { components, componentsDisplay, componentsDisplayText };
}

/**
 * Resolves a single medication input into a verified, uncertain, or unrecognized `ResolvedMedicationIdentity`.
 * Never guesses an active ingredient solely from a similar-looking brand name.
 */
export function resolveMedicationIdentity(
  item: string | MedicationInputItem
): ResolvedMedicationIdentity {
  const structured: MedicationInputItem =
    typeof item === 'string' ? { rawName: item, sourceType: 'prescription' } : item;

  const rawInput = (
    structured.rawName ||
    structured.name ||
    structured.id ||
    structured.activeIngredientId ||
    structured.barcode ||
    ''
  ).trim();
  const sourceType = structured.sourceType || 'prescription';

  const { cleanedName, strength: inlineStrength, dosageForm: inlineForm, route: inlineRoute } =
    parseInlineStrengthAndRoute(rawInput);

  const effectiveStrength = (structured.strength || structured.prescribedDose || inlineStrength || '').trim();
  const effectiveForm = (structured.dosageForm || inlineForm || '').trim();
  const effectiveRoute = (structured.route || inlineRoute || '').trim();

  // 1. Direct commercial product match by productId, barcode, or exact trade name in EGYPTIAN_COMMERCIAL_PRODUCTS
  const normRaw = normalizeMedToken(rawInput);
  const normCleaned = normalizeMedToken(cleanedName);

  const exactCommercialCandidates = EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => {
    if (structured.barcode && p.barcode === structured.barcode) return true;
    if (structured.id && p.productId.toLowerCase() === structured.id.toLowerCase()) return true;
    const tEn = normalizeMedToken(p.tradeNameEn);
    const tAr = normalizeMedToken(p.tradeNameAr);
    const tEnBase = normalizeMedToken(
      p.tradeNameEn.replace(/\b\d+(?:\.\d+)?(?:\s*\/\s*\d+)?\s*(?:mg|gm|g|mcg|iu|ml|%)\b.*/i, '')
    );
    const tArBase = normalizeMedToken(
      p.tradeNameAr.replace(/\b\d+(?:\.\d+)?(?:\s*\/\s*\d+)?\s*(?:مجم|جم|ملجم|مل|%)\b.*/i, '')
    );
    return (
      tEn === normRaw ||
      tAr === normRaw ||
      (normCleaned.length >= 3 && (tEnBase === normCleaned || tArBase === normCleaned))
    );
  });

  if (exactCommercialCandidates.length > 0) {
    // Check if the trade name base maps unambiguously to a single activeIngredientId
    const distinctIngIds = Array.from(new Set(exactCommercialCandidates.map((c) => c.activeIngredientId)));
    if (distinctIngIds.length === 1) {
      let chosen = exactCommercialCandidates[0];
      if (effectiveStrength) {
        const normStr = normalizeMedToken(effectiveStrength.replace('1g', '1000 mg').replace('1 جم', '1000 mg'));
        const byStr = exactCommercialCandidates.find(
          (c) =>
            normalizeMedToken(c.strength) === normStr ||
            normalizeMedToken(c.tradeNameEn).includes(normalizeMedToken(effectiveStrength))
        );
        if (byStr) chosen = byStr;
      }
      if (effectiveRoute) {
        const byRoute = exactCommercialCandidates.find((c) => c.route === effectiveRoute);
        if (byRoute) chosen = byRoute;
      }

      const ingRec = ACTIVE_INGREDIENTS.find((a) => a.id === chosen.activeIngredientId);
      const seedMono = SEED.find((s) => s.id === chosen.activeIngredientId);
      const compParsed = ingRec
        ? parseActiveIngredients(ingRec.components.join(' + '))
        : parseActiveIngredients(chosen.scientificComposition);

      const finalStrength = effectiveStrength || chosen.strength;
      const finalForm = effectiveForm || chosen.dosageForm;
      const finalRoute = effectiveRoute || chosen.route;

      return {
        inputKey: `${chosen.productId}:${finalStrength}:${finalRoute}`,
        rawInput,
        sourceType,
        matchedStatus: 'verified',
        resolutionStatus: 'resolved_exact_product',
        uncertaintyReasons: [],
        activeIngredientId: chosen.activeIngredientId,
        activeIngredient: ingRec,
        interactionTargetId: resolveTargetId(chosen.activeIngredientId) || undefined,
        productId: chosen.productId,
        displayName: {
          ar: chosen.tradeNameAr.split(/\s+\d/)[0] || chosen.tradeNameAr,
          en: chosen.tradeNameEn.split(/\s+\d/)[0] || chosen.tradeNameEn,
        },
        genericName: {
          ar: ingRec?.nameAr || chosen.scientificComposition,
          en: ingRec?.nameEn || chosen.scientificComposition,
        },
        components: compParsed.components,
        componentsDisplay: compParsed.componentsDisplay,
        componentsDisplayText: compParsed.componentsDisplayText,
        isCombination: Boolean(ingRec?.isCombination || compParsed.components.length > 1),
        strength: finalStrength,
        dosageForm: finalForm,
        route: finalRoute,
        equivalenceGroupKey: chosen.equivalenceGroupKey,
        commercialProduct: chosen,
        ingredientRecord: ingRec,
        seedMonograph: seedMono,
      };
    }
  }

  // 2. Match via explicit activeIngredientId or canonical allergen/ingredient resolution
  const canonicalIngId =
    (structured.activeIngredientId &&
      ACTIVE_INGREDIENTS.find(
        (a) =>
          a.id === structured.activeIngredientId ||
           (structured.activeIngredientId === 'amoxicillin-clavulanate' && a.id === 'amoxicillin-clavulanic-acid') ||
          (structured.activeIngredientId === 'trimethoprim-sulfamethoxazole' && a.id === 'co-trimoxazole')
      )?.id) ||
    resolveCanonicalAllergenDrugId(cleanedName) ||
    resolveCanonicalAllergenDrugId(rawInput);

  if (canonicalIngId) {
    const normalizedId =
      canonicalIngId === 'amoxicillin-clavulanate'
        ? 'amoxicillin-clavulanic-acid'
        : canonicalIngId === 'trimethoprim-sulfamethoxazole'
          ? 'co-trimoxazole'
          : canonicalIngId;

    const ingRec = ACTIVE_INGREDIENTS.find((a) => a.id === normalizedId);
    const seedMono = SEED.find((s) => s.id === normalizedId);
    const allergenEntry = DRUG_ALLERGEN_MAP[normalizedId];

    const compParsed = ingRec
      ? parseActiveIngredients(ingRec.components.join(' + '))
      : allergenEntry
        ? parseActiveIngredients(allergenEntry.ingredients.join(' + '))
        : parseActiveIngredients(cleanedName);

    const isCustomBrandName =
      normCleaned &&
      ingRec &&
      normCleaned !== normalizeMedToken(ingRec.nameEn) &&
      normCleaned !== normalizeMedToken(ingRec.nameAr) &&
      normCleaned !== normalizeMedToken(normalizedId.replace(/-/g, ' '));

    return {
      inputKey: `${normalizedId}:${normCleaned}:${effectiveStrength}:${effectiveRoute}`,
      rawInput,
      sourceType,
      matchedStatus: 'verified',
      resolutionStatus: 'resolved_ingredient_only',
      uncertaintyReasons: [],
      activeIngredientId: normalizedId,
      activeIngredient: ingRec,
      interactionTargetId: resolveTargetId(normalizedId) || undefined,
      displayName: {
        ar: isCustomBrandName ? cleanedName : ingRec?.nameAr || allergenEntry?.nameAr || rawInput,
        en: isCustomBrandName ? cleanedName : ingRec?.nameEn || allergenEntry?.nameEn || rawInput,
      },
      genericName: {
        ar: ingRec?.nameAr || allergenEntry?.nameAr || rawInput,
        en: ingRec?.nameEn || allergenEntry?.nameEn || rawInput,
      },
      components: compParsed.components,
      componentsDisplay: compParsed.componentsDisplay,
      componentsDisplayText: compParsed.componentsDisplayText,
      isCombination: Boolean(ingRec?.isCombination || compParsed.components.length > 1),
      strength: effectiveStrength,
      dosageForm: effectiveForm,
      route: effectiveRoute,
      ingredientRecord: ingRec,
      seedMonograph: seedMono,
    };
  }

  // 3. Match in Seed Monographs (by ID, genericName, or verified brand in SEED.brands)
  for (const s of SEED) {
    const gEn = normalizeMedToken(s.fields.genericName?.en || '');
    const gAr = normalizeMedToken(s.fields.genericName?.ar || '');
    const matchedBrand = s.brands.find(
      (b) =>
        normalizeMedToken(b.name) === normCleaned ||
        normalizeMedToken(b.name) === normRaw
    );
    if (
      s.id === rawInput.toLowerCase() ||
      gEn === normCleaned ||
      (gAr && gAr === normCleaned) ||
      matchedBrand
    ) {
      const ingRec = ACTIVE_INGREDIENTS.find((a) => a.id === s.id);
      const compParsed = ingRec
        ? parseActiveIngredients(ingRec.components.join(' + '))
        : parseActiveIngredients(s.fields.genericName?.en || s.id);
      return {
        inputKey: `${s.id}:${normCleaned}:${effectiveStrength}:${effectiveRoute}`,
        rawInput,
        sourceType,
        matchedStatus: 'verified',
        resolutionStatus: 'resolved_ingredient_only',
        uncertaintyReasons: [],
        activeIngredientId: s.id,
        activeIngredient: ingRec,
        interactionTargetId: resolveTargetId(s.id) || undefined,
        displayName: matchedBrand
          ? { ar: matchedBrand.name, en: matchedBrand.name }
          : {
              ar: s.fields.genericName?.ar || s.id,
              en: s.fields.genericName?.en || s.id,
            },
        genericName: {
          ar: s.fields.genericName?.ar || s.id,
          en: s.fields.genericName?.en || s.id,
        },
        components: compParsed.components,
        componentsDisplay: compParsed.componentsDisplay,
        componentsDisplayText: compParsed.componentsDisplayText,
        isCombination: compParsed.components.length > 1,
        strength: effectiveStrength,
        dosageForm: effectiveForm,
        route: effectiveRoute,
        ingredientRecord: ingRec,
        seedMonograph: s,
      };
    }
  }

  // 4. Match in Interaction TARGETS (co-medications, supplements, or foods such as warfarin, calcium_dairy, iron_zinc, nsaids, statins)
  const targetId = resolveTargetId(structured.id || cleanedName) || resolveTargetId(rawInput);
  if (targetId) {
    const targetItem = TARGETS.find((t) => t.id === targetId);
    if (targetItem) {
      const compParsed = parseActiveIngredients(targetItem.id);
      return {
        inputKey: `target:${targetItem.id}`,
        rawInput,
        sourceType,
        matchedStatus: 'verified',
        resolutionStatus: 'resolved_ingredient_only',
        uncertaintyReasons: [],
        activeIngredientId: targetItem.id,
        interactionTargetId: targetItem.id,
        displayName: targetItem.name,
        genericName: targetItem.name,
        components: targetItem.category === 'drug' ? compParsed.components : [],
        componentsDisplay: targetItem.category === 'drug' ? compParsed.componentsDisplay : [],
        componentsDisplayText: targetItem.category === 'drug' ? compParsed.componentsDisplayText : [],
        isCombination: false,
        strength: effectiveStrength,
        dosageForm: effectiveForm,
        route: effectiveRoute,
      };
    }
  }

  // 5. Check if the input partially resembles a trade name in EGYPTIAN_COMMERCIAL_PRODUCTS -> Flag as UNCERTAIN
  // NEVER infer an active ingredient solely from a similar-looking name!
  const firstWord = normCleaned.split(/\s+/)[0] || '';
  const partialCandidates =
    firstWord.length >= 4
      ? EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => {
          const tEn = normalizeMedToken(p.tradeNameEn);
          const tAr = normalizeMedToken(p.tradeNameAr);
          const prefix4 = firstWord.slice(0, 5);
          return (
            tEn.includes(firstWord) ||
            firstWord.includes(tEn.split(/\s+/)[0]) ||
            (prefix4.length >= 5 && tEn.startsWith(prefix4)) ||
            (tAr && (tAr.includes(firstWord) || firstWord.includes(tAr.split(/\s+/)[0])))
          );
        })
      : [];

  if (partialCandidates.length > 0) {
    const suggestionsEn = Array.from(
      new Set(partialCandidates.map((c) => `${c.tradeNameEn} (${c.scientificComposition})`))
    ).slice(0, 3);
    const suggestionsAr = Array.from(
      new Set(partialCandidates.map((c) => `${c.tradeNameAr} (${c.scientificComposition})`))
    ).slice(0, 3);

    const uncReason: Bi = {
      ar: `الاسم المدخل «${rawInput}» غير مطابق بشكل قاطع في قاعدة البيانات (أقرب مسميات مسجلة: ${suggestionsAr.join(' ، ')}). لا يجوز تخمين المادة الفعالة من تشابه الأسماء التجارية دون مراجعة العبوة مع الصيدلي.`,
      en: `"${rawInput}" is an ambiguous or partial brand match (closest catalog entries: ${suggestionsEn.join('; ')}). Active ingredients are never inferred from look-alike trade names without pharmacist verification.`,
    };
    return {
      inputKey: `uncertain:${normRaw}`,
      rawInput,
      sourceType,
      matchedStatus: 'uncertain',
      resolutionStatus: 'uncertain_brand_match',
      uncertaintyReason: uncReason,
      uncertaintyReasons: [uncReason],
      displayName: { ar: rawInput, en: rawInput },
      genericName: { ar: 'مادة فعالة غير مؤكدة', en: 'Unverified Active Ingredient' },
      components: [],
      componentsDisplay: [],
      componentsDisplayText: [],
      isCombination: false,
      strength: effectiveStrength,
      dosageForm: effectiveForm,
      route: effectiveRoute,
    };
  }

  // 6. Unrecognized item
  const unrecReason: Bi = {
    ar: `الدواء «${rawInput}» غير مسجل في قاعدة البيانات المحلية المعتمدة حالياً؛ لذلك تعذر التحقق التلقائي من المادة الفعالة أو التكرار أو الحساسية أو التداخلات لهذا الصنف.`,
    en: `"${rawInput}" is not in the verified local medication catalog; automated active-ingredient, duplicate, allergy, and interaction checks could not be completed for this item.`,
  };
  return {
    inputKey: `unrecognized:${normRaw}`,
    rawInput,
    sourceType,
    matchedStatus: 'unrecognized',
    resolutionStatus: 'unresolved',
    uncertaintyReason: unrecReason,
    uncertaintyReasons: [unrecReason],
    displayName: { ar: rawInput, en: rawInput },
    genericName: { ar: 'دواء غير مدرج بقاعدة البيانات', en: 'Unrecognized Medication' },
    components: [],
    componentsDisplay: [],
    componentsDisplayText: [],
    isCombination: false,
    strength: effectiveStrength,
    dosageForm: effectiveForm,
    route: effectiveRoute,
  };
}

const SEVERITY_ORDER: Record<SafetyFindingSeverity, number> = {
  urgent: 4,
  warning: 3,
  caution: 2,
  info: 1,
};

/**
 * Authoritative Medication Safety Assessment Entry Point (`evaluateMedicationSafety`).
 */
export function evaluateMedicationSafety(input: SafetyEngineInput): SafetyAssessmentResult {
  const findingsMap = new Map<string, SafetyFinding>();
  const addFinding = (f: SafetyFinding) => {
    if (!findingsMap.has(f.id)) {
      findingsMap.set(f.id, f);
    }
  };

  // 0. Handle explicit data-source failures safely without crashing
  let hasDataSourceFailure = false;
  if (input.dataSourceFailure) {
    hasDataSourceFailure = true;
    const srcName = input.dataSourceFailure.sourceName || 'Medication Safety Data Source';
    addFinding({
      id: `data-source-unavailable:${norm(srcName)}`,
      type: 'data_source_unavailable',
      severity: 'caution',
      involvedMedicines: [],
      involvedIngredients: [],
      title: {
        ar: `فحص غير مكتمل — تعذر الوصول إلى مصدر البيانات (${srcName})`,
        en: `Incomplete Check — Data Source Unavailable (${srcName})`,
      },
      reason: {
        ar: `تعذر تحميل أو التحقق من بيانات «${srcName}»${input.dataSourceFailure.reason ? ` (${input.dataSourceFailure.reason})` : ''}. الفحص التلقائي غير مكتمل في الوقت الحالي.`,
        en: `Could not verify data from "${srcName}"${input.dataSourceFailure.reason ? ` (${input.dataSourceFailure.reason})` : ''}. Automated safety screening is currently incomplete.`,
      },
      nextStep: {
        ar: 'لا تفترض أمان الأدوية تلقائياً؛ يرجى مراجعة الصيدلي أو الطبيب لفحص الروشتة يدوياً.',
        en: 'Do not assume medication safety automatically; please have a licensed pharmacist or physician review your prescription directly.',
      },
      source: SOURCE_EDA,
      dataCompleteness: {
        isComplete: false,
        status: 'unable_to_verify',
        uncertaintyNote: {
          ar: 'تعذر الاتصال بمصدر البيانات — يلزم التحقق اليدوي',
          en: 'Data source unavailable — manual verification required',
        },
      },
    });
  }

  // 1. Collect all medication inputs (supplied medications + coMedicationIds + optional active profile medications)
  const combinedRawInputs: Array<string | MedicationInputItem> = [];
  if (Array.isArray(input.medications)) {
    for (const m of input.medications) {
      if (!m) continue;
      if (typeof m === 'string' && !m.trim()) continue;
      combinedRawInputs.push(m);
    }
  }
  if (Array.isArray(input.coMedicationIds)) {
    for (const coId of input.coMedicationIds) {
      if (!coId || !coId.trim()) continue;
      combinedRawInputs.push({
        id: coId.trim(),
        rawName: coId.trim(),
        sourceType: 'co_medication',
      });
    }
  }

  const profile = input.healthProfile;
  if (input.includeProfileActiveMedications && Array.isArray(profile?.medications)) {
    for (const pm of profile!.medications!) {
      if (pm && pm.status === 'active' && pm.drugName?.trim()) {
        combinedRawInputs.push({
          id: pm.id,
          rawName: pm.drugName,
          activeIngredientId: pm.activeIngredients || undefined,
          prescribedDose: pm.prescribedDose,
          route: pm.route,
          sourceType: 'profile_active',
        });
      }
    }
  }

  // 2. Resolve identities and detect exact duplicate entries in the input list
  const resolvedMedications: ResolvedMedicationIdentity[] = [];
  const seenEntries = new Map<string, ResolvedMedicationIdentity>();

  for (const rawItem of combinedRawInputs) {
    const resolved = resolveMedicationIdentity(rawItem);
    if (!resolved.rawInput) continue;

    // Deduplicate if an active profile med is the exact same as the currently inspected prescription med
    const dedupKey = `${norm(resolved.displayName.en)}|${resolved.activeIngredientId || ''}|${norm(resolved.strength)}|${resolved.route || ''}`;
    if (seenEntries.has(dedupKey)) {
      const prev = seenEntries.get(dedupKey)!;
      // Only flag duplicate input if both came from prescription/manual check (not self-matching the same profile item)
      if (resolved.sourceType !== 'profile_active' && prev.sourceType !== 'profile_active') {
        addFinding({
          id: `duplicate-entry:${resolved.activeIngredientId || norm(resolved.displayName.en)}`,
          type: 'duplicate_ingredient',
          severity: 'warning',
          involvedMedicines: [prev.displayName, resolved.displayName],
          involvedIngredients: resolved.componentsDisplayText,
          title: {
            ar: `تكرار إدخال نفس الدواء في القائمة: ${resolved.displayName.ar}`,
            en: `Duplicate Medication Entry Detected: ${resolved.displayName.en}`,
          },
          reason: {
            ar: `تم إدراج الدواء «${resolved.displayName.ar}» (${resolved.genericName.ar}) أكثر من مرة في نفس القائمة؛ مما قد يؤدي إلى تناول جرعة مضاعفة عن طريق الخطأ.`,
            en: `"${resolved.displayName.en}" (${resolved.genericName.en}) appears more than once in the medication list, which risks accidental double dosing.`,
          },
          nextStep: {
            ar: 'تأكد من الصيدلي أو الطبيب من عدم تكرار الصنف بالخطأ والتزم بعبوة وجدول جرعات واحد.',
            en: 'Verify with your pharmacist or physician that this medication was not listed twice by mistake.',
          },
          source: SOURCE_EDA,
          dataCompleteness: {
            isComplete: true,
            status: 'verified',
            uncertaintyNote: {
              ar: 'تم التحقق من تطابق المدخلات',
              en: 'Verified duplicate list entry',
            },
          },
        });
      }
      continue;
    }

    seenEntries.set(dedupKey, resolved);
    resolvedMedications.push(resolved);
  }

  // 3. Emit explicit findings for uncertain or unrecognized medication identities
  for (const med of resolvedMedications) {
    if (med.matchedStatus === 'uncertain' || med.matchedStatus === 'unrecognized') {
      addFinding({
        id: `identity-uncertainty:${norm(med.rawInput)}`,
        type: 'identity_uncertainty',
        severity: 'caution',
        involvedMedicines: [med.displayName],
        involvedIngredients: [],
        title: {
          ar:
            med.matchedStatus === 'uncertain'
              ? `تطابق غير مؤكد للاسم التجاري «${med.rawInput}» — يتطلب التحقق`
              : `تعذر التحقق من هوية الدواء «${med.rawInput}» في قاعدة البيانات`,
          en:
            med.matchedStatus === 'uncertain'
              ? `Uncertain Brand Mapping for "${med.rawInput}" — Verification Required`
              : `Unrecognized Medication "${med.rawInput}" — Unable to Verify`,
        },
        reason: med.uncertaintyReason || {
          ar: `لم نتمكن من التحقق المؤكد من المادة الفعالة أو التركيز للدواء «${med.rawInput}».`,
          en: `Could not verify the active ingredient or strength for "${med.rawInput}".`,
        },
        nextStep: {
          ar: 'افحص الاسم العلمي (Generic Name) والتركيز المطبوعين على العبوة مع الصيدلي قبل الاعتماد على نتائج فحص الحساسية أو التكرار أو التداخلات.',
          en: 'Verify the printed generic name and strength on the package with a licensed pharmacist before relying on automated checks.',
        },
        source: SOURCE_EDA,
        dataCompleteness: {
          isComplete: false,
          status: 'unable_to_verify',
          uncertaintyNote: {
            ar: 'هوية الدواء غير مؤكدة — الفحص التلقائي غير مكتمل لهذا الصنف',
            en: 'Unverified medication identity — automated checks incomplete for this item',
          },
        },
      });
    }
  }

  // 4. Duplicate Active Ingredient & Combination Overlap Check across verified medications
  for (let i = 0; i < resolvedMedications.length; i++) {
    for (let j = i + 1; j < resolvedMedications.length; j++) {
      const medA = resolvedMedications[i];
      const medB = resolvedMedications[j];
      if (medA.matchedStatus !== 'verified' || medB.matchedStatus !== 'verified') continue;
      if (medA.components.length === 0 || medB.components.length === 0) continue;

      const sharedCanonical = medA.components.filter((c) => medB.components.includes(c));
      if (sharedCanonical.length === 0) continue;

      const sharedDisplay = medA.componentsDisplayText.filter((_, idx) =>
        sharedCanonical.includes(medA.components[idx])
      );
      const pairKey = [norm(medA.displayName.en), norm(medB.displayName.en)].sort().join('::');
      const ingKey = sharedCanonical.slice().sort().join('+');

      const exactSameComposition =
        medA.components.length === medB.components.length &&
        sharedCanonical.length === medA.components.length;
      const involvesCombo = medA.isCombination || medB.isCombination;

      const routeDiffers =
        Boolean(medA.route) && Boolean(medB.route) && medA.route !== medB.route;
      const strengthDiffers =
        Boolean(medA.strength) &&
        Boolean(medB.strength) &&
        normalizeMedToken(medA.strength) !== normalizeMedToken(medB.strength);
      const formDiffers =
        Boolean(medA.dosageForm) &&
        Boolean(medB.dosageForm) &&
        normalizeMedToken(String(medA.dosageForm)) !== normalizeMedToken(String(medB.dosageForm));

      let nonEquivalenceNoteAr = '';
      let nonEquivalenceNoteEn = '';

      if (!exactSameComposition) {
        nonEquivalenceNoteAr = ` تنبيه سريري هام: هذان الدواءان غير متطابقين في التركيب الكامل (${medA.genericName.ar} مقابل ${medB.genericName.ar}) ولا يُعتبران بديلين متكافئين 1 إلى 1 رغم اشتراكهما في مادة (${sharedDisplay.join(' + ')}).`;
        nonEquivalenceNoteEn = ` Important Clinical Note: These products do NOT have identical composition (${medA.genericName.en} vs ${medB.genericName.en}) and are not direct 1-to-1 substitutes despite sharing ${sharedDisplay.join(' + ')}.`;
      } else if (routeDiffers || strengthDiffers || formDiffers) {
        nonEquivalenceNoteAr = ` ملاحظة التكافؤ: يوجد اختلاف في التركيز أو الشكل الصيدلي أو طريقة الإعطاء (${medA.strength || 'غير محدد'} ${medA.dosageForm || ''} مقابل ${medB.strength || 'غير محدد'} ${medB.dosageForm || ''})؛ لذا لا يُعاملان كبديلين متكافئين تلقائياً دون مراجعة الطبيب أو الصيدلي.`;
        nonEquivalenceNoteEn = ` Equivalence Note: Strength, dosage form, or administration route differs (${medA.strength || 'unspecified'} ${medA.dosageForm || ''} vs ${medB.strength || 'unspecified'} ${medB.dosageForm || ''}); they are not directly interchangeable without clinician review.`;
      }

      addFinding({
        id: `duplicate-active:${pairKey}:${ingKey}`,
        type: 'duplicate_ingredient',
        severity: 'warning',
        involvedMedicines: [medA.displayName, medB.displayName],
        involvedIngredients: sharedDisplay,
        title: {
          ar: involvesCombo
            ? `تداخل وتكرار في المادة الفعالة (${sharedDisplay.join(' + ')}) مع مستحضر مركب`
            : `تكرار نفس المادة الفعالة (${sharedDisplay.join(' + ')}) تحت اسمين تجاريين مختلفين`,
          en: involvesCombo
            ? `Duplicate Active Ingredient Overlap (${sharedDisplay.join(' + ')}) Involving Combination Product`
            : `Duplicate Active Ingredient (${sharedDisplay.join(' + ')}) Across Different Brands`,
        },
        reason: {
          ar: `يحتوي كل من «${medA.displayName.ar}» (${medA.genericName.ar}) و«${medB.displayName.ar}» (${medB.genericName.ar}) على نفس المادة الفعالة (${sharedDisplay.join(' + ')}). الجمع بينهما يؤدي إلى مضاعفة الجرعة وزيادة خطر السمية الدوائية والآثار الجانبية.${nonEquivalenceNoteAr}`,
          en: `Both "${medA.displayName.en}" (${medA.genericName.en}) and "${medB.displayName.en}" (${medB.genericName.en}) contain the active ingredient ${sharedDisplay.join(' + ')}. Taking both concurrently risks double-dosing and toxicity.${nonEquivalenceNoteEn}`,
        },
        nextStep: {
          ar: 'لا تتناول الصنفين معاً إلا إذا وصفهما الطبيب صراحةً ضمن بروتوكول محدد؛ راجع الصيدلي للتأكد مما إذا كان أحدهما بديلاً مقصوداً للآخر.',
          en: 'Do not take both products concurrently unless explicitly prescribed together by your physician; ask your pharmacist to confirm if one was intended as a substitute.',
        },
        nursingNote: {
          ar: 'إرشاد تمريضي: قارن الاسم العلمي (Generic Name) على جميع عبوات المريض لمنع ازدواجية المادة الفعالة بين الروشتة الجديدة وأدوية المنزل.',
          en: 'Nursing Check: Reconcile generic active ingredients across all patient packages to prevent duplicate therapy.',
        },
        source: SOURCE_EDA,
        dataCompleteness: {
          isComplete: Boolean(medA.strength && medB.strength),
          status: medA.strength && medB.strength ? 'verified' : 'partial',
          uncertaintyNote:
            medA.strength && medB.strength
              ? {
                  ar: 'تم التحقق من المادة الفعالة والتركيز في قاعدة البيانات',
                  en: 'Active ingredient and strength verified in catalog',
                }
              : {
                  ar: 'تم التحقق من المادة الفعالة (يرجى مراجعة التركيز والشكل الصيدلي على العبوة)',
                  en: 'Active ingredient verified (confirm exact pack strength and dosage form)',
                },
        },
      });
    }
  }

  // 5. Recorded Allergy & Cross-Reactivity Safety Evaluation (reusing `allergyData.ts`)
  const recordedAllergies: AllergyRecord[] = Array.isArray(profile?.allergies)
    ? profile!.allergies!
    : [];

  if (recordedAllergies.length > 0) {
    for (const med of resolvedMedications) {
      if (med.sourceType === 'co_medication' && !med.activeIngredientId) continue;

      if (med.matchedStatus !== 'verified') {
        addFinding({
          id: `allergy-unverified:${norm(med.rawInput)}`,
          type: 'identity_uncertainty',
          severity: 'caution',
          involvedMedicines: [med.displayName],
          involvedIngredients: [],
          title: {
            ar: `تعذر التحقق من أمان الحساسية للدواء «${med.rawInput}»`,
            en: `Unable to Verify Allergy Safety for "${med.rawInput}"`,
          },
          reason: {
            ar: `لديك سجل حساسية دوائية (${recordedAllergies.map((a) => a.drugName).join('، ')})، ولكن تعذر التحقق من المادة الفعالة للدواء «${med.rawInput}».`,
            en: `You have recorded drug allergies (${recordedAllergies.map((a) => a.drugName).join(', ')}), but the active ingredient of "${med.rawInput}" could not be verified.`,
          },
          nextStep: {
            ar: 'لا تتناول هذا الدواء حتى يتحقق الصيدلي من مادته الفعالة ويقارنها بسجل حساسيتك.',
            en: 'Do not take this medication until a pharmacist verifies its active ingredient against your recorded allergies.',
          },
          source: SOURCE_WHO_AWARE,
          dataCompleteness: {
            isComplete: false,
            status: 'unable_to_verify',
            uncertaintyNote: {
              ar: 'مادة فعالة غير مؤكدة — لا يمكن الجزم بالخلو من الحساسية',
              en: 'Unverified active ingredient — allergy safety cannot be assumed',
            },
          },
        });
        continue;
      }

      // Skip non-drug food targets like dairy/meals/alcohol for drug allergy lookup
      if (
        med.interactionTargetId &&
        ['dairy', 'alcohol', 'meals', 'probiotics'].includes(med.interactionTargetId)
      ) {
        continue;
      }

      const checkTarget = med.activeIngredientId || med.rawInput;
      const allergyRes = checkDrugAllergySafety(checkTarget, recordedAllergies);

      if (allergyRes.matchLevel === 'exact_match' || allergyRes.matchLevel === 'cross_reactivity') {
        const isExact = allergyRes.matchLevel === 'exact_match';
        addFinding({
          id: `allergy:${med.activeIngredientId || norm(med.displayName.en)}:${allergyRes.matchLevel}:${norm(allergyRes.matchedAllergy?.drugName || '')}`,
          type: isExact ? 'allergy_match' : 'allergy_cross_reactivity',
          severity: isExact ? 'urgent' : 'warning',
          involvedMedicines: [med.displayName],
          involvedIngredients: med.componentsDisplayText.length > 0 ? med.componentsDisplayText : [med.genericName.en],
          title: allergyRes.title,
          reason: allergyRes.explanation,
          nextStep: allergyRes.clinicalAction,
          nursingNote: allergyRes.nursingWarning,
          source: SOURCE_WHO_AWARE,
          dataCompleteness: {
            isComplete: true,
            status: 'verified',
            uncertaintyNote: {
              ar: isExact
                ? 'تطابق مباشر مؤكد مع سجل الحساسية المسجل'
                : 'علاقة حساسية متصالبة موثقة سريرياً (تتطلب مراجعة طبية)',
              en: isExact
                ? 'Confirmed direct match against recorded allergy'
                : 'Documented clinical cross-reactivity relationship (requires clinical review)',
            },
          },
        });
      } else if (
        allergyRes.matchLevel === 'unverified' &&
        recordedAllergies.some((a) => a.allergenKey === 'other')
      ) {
        addFinding({
          id: `allergy-unverified-other:${med.activeIngredientId || norm(med.displayName.en)}`,
          type: 'identity_uncertainty',
          severity: 'caution',
          involvedMedicines: [med.displayName],
          involvedIngredients: med.componentsDisplayText,
          title: allergyRes.title,
          reason: allergyRes.explanation,
          nextStep: allergyRes.clinicalAction,
          nursingNote: allergyRes.nursingWarning,
          source: SOURCE_WHO_AWARE,
          dataCompleteness: {
            isComplete: false,
            status: 'partial',
            uncertaintyNote: {
              ar: 'حساسية مسجلة تحت فئة «أخرى» تتطلب مطابقة صيدلانية يدوية',
              en: 'Recorded allergy in "Other" category requires manual pharmacist cross-check',
            },
          },
        });
      }
    }
  }

  // 6. Drug–Drug, Supplement, and Food Interactions (reusing `interactionsData.ts`)
  const unverifiedInteractionPairs: string[] = [];

  for (let i = 0; i < resolvedMedications.length; i++) {
    for (let j = i + 1; j < resolvedMedications.length; j++) {
      const medA = resolvedMedications[i];
      const medB = resolvedMedications[j];

      if (medA.matchedStatus !== 'verified' || medB.matchedStatus !== 'verified') {
        unverifiedInteractionPairs.push(`${medA.displayName.en} + ${medB.displayName.en}`);
        continue;
      }

      const idA = medA.activeIngredientId || medA.interactionTargetId || '';
      const idB = medB.activeIngredientId || medB.interactionTargetId || '';

      if (!idA || !idB) {
        unverifiedInteractionPairs.push(`${medA.displayName.en} + ${medB.displayName.en}`);
        continue;
      }

      // Skip self-pair if both resolve to the exact same ingredient (already handled by duplicate check)
      if (idA === idB) continue;

      // 6a. Check antibiotic + target (or target + antibiotic) via `findInteractionRule`
      const ruleAB = findInteractionRule(idA, idB);
      const ruleBA = !ruleAB ? findInteractionRule(idB, idA) : undefined;
      const rule = ruleAB || ruleBA;

      if (rule) {
        // Only emit actionable alerts or spacing cautions; skip purely neutral 'safe' paracetamol rules unless spacing is required (like probiotics/meals)
        const requiresSpacingOrCaution =
          rule.severity === 'safe' &&
          (rule.targetId === 'probiotics' ||
            rule.management.en.toLowerCase().includes('space') ||
            rule.management.en.toLowerCase().includes('hour'));

        if (rule.severity === 'safe' && !requiresSpacingOrCaution) {
          continue;
        }

        const mappedSeverity: SafetyFindingSeverity =
          rule.severity === 'severe'
            ? 'urgent'
            : rule.severity === 'moderate'
              ? 'warning'
              : 'info';

        const pairSorted = [idA, idB].sort().join('::');
        addFinding({
          id: `interaction:${pairSorted}`,
          type: 'drug_interaction',
          severity: mappedSeverity,
          involvedMedicines: [medA.displayName, medB.displayName],
          involvedIngredients: [
            ...medA.componentsDisplayText,
            ...medB.componentsDisplayText,
          ].filter(Boolean),
          title: rule.title,
          reason: rule.mechanism,
          nextStep: rule.management,
          nursingNote: rule.nursingTip,
          source: fromSource(rule.source),
          dataCompleteness: {
            isComplete: true,
            status: 'verified',
            uncertaintyNote: {
              ar: 'قاعدة تداخل دوائي/غذائي موثقة في المراجع السريرية',
              en: 'Evidence-supported interaction rule in clinical dataset',
            },
          },
        });
        continue;
      }

      // 6b. Check antibiotic–antibiotic pair rules (`ANTIBIOTIC_PAIR_RULES`)
      const abxPairRule = ANTIBIOTIC_PAIR_RULES.find((r) => r.appliesTo(idA, idB));
      if (abxPairRule) {
        const pairSorted = [idA, idB].sort().join('::');
        addFinding({
          id: `interaction-abx-pair:${pairSorted}:${abxPairRule.id}`,
          type: 'drug_interaction',
          severity: abxPairRule.severity === 'severe' ? 'urgent' : 'warning',
          involvedMedicines: [medA.displayName, medB.displayName],
          involvedIngredients: [
            ...medA.componentsDisplayText,
            ...medB.componentsDisplayText,
          ].filter(Boolean),
          title: abxPairRule.title,
          reason: abxPairRule.mechanism,
          nextStep: abxPairRule.management,
          nursingNote: abxPairRule.nursingTip,
          source: fromSource(abxPairRule.source),
          dataCompleteness: {
            isComplete: true,
            status: 'verified',
            uncertaintyNote: {
              ar: 'تداخل موثق بين عائلتين من المضادات الحيوية',
              en: 'Documented class-level antibiotic–antibiotic interaction',
            },
          },
        });
        continue;
      }

      // Neither exact rule nor antibiotic-pair rule covers this combination
      unverifiedInteractionPairs.push(`${medA.displayName.en} + ${medB.displayName.en}`);
    }
  }

  // 7. Health-Profile Contraindications & Warnings (Age, Pregnancy/Lactation, Renal, Hepatic, Notes grounded in `seedData.ts`)
  const rawAge =
    input.patientAgeOverride !== undefined && input.patientAgeOverride !== null
      ? input.patientAgeOverride
      : profile?.age;
  const parsedAge =
    typeof rawAge === 'number'
      ? rawAge
      : typeof rawAge === 'string' && rawAge.trim()
        ? parseFloat(rawAge.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)))
        : NaN;

  const isPediatric =
    rawAge === 'pediatric' || (!Number.isNaN(parsedAge) && parsedAge >= 0 && parsedAge < 18);
  const isUnder8 = !Number.isNaN(parsedAge) && parsedAge >= 0 && parsedAge < 8;
  const isElderly =
    rawAge === 'elderly' || (!Number.isNaN(parsedAge) && parsedAge >= 65);

  const notesNorm = norm(profile?.notes || '');
  const isPregnantOrBreastfeeding =
    profile?.pregnancyStatus === 'pregnant' ||
    profile?.pregnancyStatus === 'breastfeeding' ||
    notesNorm.includes('حامل') ||
    notesNorm.includes('حمل') ||
    notesNorm.includes('رضاع') ||
    notesNorm.includes('pregnan') ||
    notesNorm.includes('breastfeed');

  const hasRenalImpairment =
    profile?.renalStatus === 'impaired' ||
    notesNorm.includes('كلى') ||
    notesNorm.includes('كلوي') ||
    notesNorm.includes('renal') ||
    notesNorm.includes('kidney') ||
    notesNorm.includes('ckd');

  const hasHepaticImpairment =
    profile?.hepaticStatus === 'impaired' ||
    notesNorm.includes('كبد') ||
    notesNorm.includes('كبدي') ||
    notesNorm.includes('تليف') ||
    notesNorm.includes('hepat') ||
    notesNorm.includes('liver') ||
    notesNorm.includes('cirrhosis');

  const hasG6PD =
    notesNorm.includes('g6pd') ||
    notesNorm.includes('انيميا الفول') ||
    notesNorm.includes('أنيميا الفول');

  const hasMyasthenia =
    notesNorm.includes('myasthenia') ||
    notesNorm.includes('وهن عضلي');

  for (const med of resolvedMedications) {
    if (med.matchedStatus !== 'verified' || !med.activeIngredientId) continue;
    const ingId = med.activeIngredientId;
    const seedMono = med.seedMonograph || SEED.find((s) => s.id === ingId);
    const monoSrc = fromSource(seedMono?.sources?.[0]);

    const isQuinolone = ['ciprofloxacin', 'levofloxacin', 'moxifloxacin'].includes(ingId);
    const isTetracycline = ingId === 'doxycycline';
    const isAminoglycoside = ['gentamicin', 'amikacin'].includes(ingId);
    const isSulfa = ingId === 'co-trimoxazole';
    const isNitrofurantoin = ingId === 'nitrofurantoin';

    // 7a. Pediatric precautions
    if (isPediatric && (isTetracycline || isQuinolone)) {
      addFinding({
        id: `profile:pediatric:${ingId}`,
        type: 'profile_contraindication',
        severity: isTetracycline && (isUnder8 || Number.isNaN(parsedAge)) ? 'urgent' : 'warning',
        involvedMedicines: [med.displayName],
        involvedIngredients: med.componentsDisplayText,
        title: {
          ar: `تحذير عمري للأطفال (${med.displayName.ar}): ${isTetracycline ? 'خطر تصبغ الأسنان وتأثر العظام' : 'تقييد الاستخدام في طور النمو'}`,
          en: `Pediatric Age Precaution (${med.displayName.en}): ${isTetracycline ? 'Tooth Discoloration & Bone Growth Risk' : 'Restricted Use in Growing Children'}`,
        },
        reason: {
          ar:
            seedMono?.fields.ageRestrictions?.ar ||
            (isTetracycline
              ? 'يُمنع الدوكسيسيكلين عادةً للأطفال دون سن 8 سنوات لما يسببه من تصبغ دائم بالأسنان وتأثير على نمو العظام إلا في حالات نادرة يقررها الأخصائي.'
              : 'تُقيد عائلة الفلوروكينولونات للأطفال والمراهقين في طور النمو بسبب مخاطر التأثير على المفاصل والغضاريف، ولا تُعطى إلا لضرورة طبية قصوى.'),
          en:
            seedMono?.fields.ageRestrictions?.en ||
            (isTetracycline
              ? 'Doxycycline is generally avoided in children under 8 years due to permanent tooth discoloration and enamel hypoplasia.'
              : 'Fluoroquinolones are restricted in growing children/adolescents due to arthropathy and cartilage safety concerns unless no alternative exists.'),
        },
        nextStep: {
          ar: 'راجع طبيب الأطفال المعالج للتأكد من ملاءمة هذا الدواء لعمر الطفل ووزنه قبل إعطاء أي جرعة.',
          en: 'Confirm the indication and weight-based suitability directly with the prescribing pediatrician before administration.',
        },
        source: monoSrc,
        dataCompleteness: {
          isComplete: true,
          status: 'verified',
          uncertaintyNote: {
            ar: 'مبني على العمر المسجل والنشرات الدوائية المعتمدة',
            en: 'Based on recorded patient age and verified drug monograph',
          },
        },
      });
    }

    // 7b. Elderly precautions
    if (isElderly && (isQuinolone || isAminoglycoside || isNitrofurantoin)) {
      addFinding({
        id: `profile:elderly:${ingId}`,
        type: 'profile_contraindication',
        severity: 'warning',
        involvedMedicines: [med.displayName],
        involvedIngredients: med.componentsDisplayText,
        title: {
          ar: `تحذير خاص بكبار السن (${med.displayName.ar}): يتطلب متابعة دقيقة`,
          en: `Geriatric Safety Precaution (${med.displayName.en}): Requires Close Clinical Review`,
        },
        reason: {
          ar: isQuinolone
            ? 'كبار السن (65 عاماً فأكثر) أكثر عرضة للإصابة بالتهاب أو تمزق الأوتار (خاصة وتر أخيل) مع عائلة الفلوروكينولونات، لا سيما عند استخدام الكورتيزون أو وجود قصور كلوي.'
            : 'يتطلب هذا المضاد الحيوي لدى كبار السن تقييم وظائف الكلى (معدل الترشيح الكبيبي) لتفادي تراكم الدواء والسمية الكلوية أو العصبية.',
          en: isQuinolone
            ? 'Older adults (≥65 years) face a significantly elevated risk of fluoroquinolone-associated tendinitis and tendon rupture, especially with concurrent corticosteroids or renal decline.'
            : 'In older adults, age-related renal function decline requires creatinine clearance verification before using this antibiotic to avoid accumulation and toxicity.',
        },
        nextStep: {
          ar: 'راجع الطبيب أو الصيدلي لمطابقة الجرعة مع وظائف الكلى، وتوقف فوراً وراجع الطبيب إذا ظهر ألم في الأوتار أو المفاصل.',
          en: 'Verify renal dosing with your physician or pharmacist, and seek prompt care if tendon pain or swelling occurs.',
        },
        source: monoSrc,
        dataCompleteness: {
          isComplete: true,
          status: 'verified',
          uncertaintyNote: {
            ar: 'مبني على الفئة العمرية المسجلة (65+ سنة)',
            en: 'Based on recorded geriatric age group (≥65 years)',
          },
        },
      });
    }

    // 7c. Pregnancy & Breastfeeding precautions
    if (isPregnantOrBreastfeeding && (isTetracycline || isQuinolone || isAminoglycoside || isSulfa || ingId === 'metronidazole' || ingId === 'clarithromycin')) {
      addFinding({
        id: `profile:pregnancy:${ingId}`,
        type: 'profile_contraindication',
        severity: isTetracycline || isQuinolone || isAminoglycoside || isSulfa ? 'urgent' : 'warning',
        involvedMedicines: [med.displayName],
        involvedIngredients: med.componentsDisplayText,
        title: {
          ar: `تحذير الحمل والرضاعة (${med.displayName.ar}): ${seedMono?.fields.genericName?.ar || med.genericName.ar}`,
          en: `Pregnancy / Lactation Precaution (${med.displayName.en}): ${seedMono?.fields.genericName?.en || med.genericName.en}`,
        },
        reason: {
          ar:
            seedMono?.fields.contraindications?.ar ||
            `يرتبط دواء (${med.genericName.ar}) بموانع استعمال أو محاذير موثقة أثناء الحمل أو الرضاعة الطبيعية لما قد يسببه من مخاطر على الجنين أو الرضيع.`,
          en:
            seedMono?.fields.contraindications?.en ||
            `${med.genericName.en} carries documented contraindications or fetal/neonatal risks during pregnancy or breastfeeding.`,
        },
        nextStep: {
          ar: 'لا تتناولي هذا الدواء دون مراجعة طبيب النساء والتوليد للتأكد من أمانه التام في مرحلة الحمل أو الرضاعة الحالية.',
          en: 'Do not start this medication without explicit confirmation from your obstetrician or prescribing physician.',
        },
        source: monoSrc,
        dataCompleteness: {
          isComplete: true,
          status: 'verified',
          uncertaintyNote: {
            ar: 'مبني على حالة الحمل/الرضاعة في الملف الصحي والنشرة المعتمدة',
            en: 'Based on recorded pregnancy/lactation status and verified monograph',
          },
        },
      });
    }

    // 7d. Renal Impairment precautions
    if (hasRenalImpairment && (isNitrofurantoin || isAminoglycoside || isQuinolone || isSulfa || ingId === 'vancomycin' || ingId === 'meropenem' || ingId === 'cefepime')) {
      addFinding({
        id: `profile:renal:${ingId}`,
        type: 'profile_contraindication',
        severity: isNitrofurantoin || isAminoglycoside ? 'urgent' : 'warning',
        involvedMedicines: [med.displayName],
        involvedIngredients: med.componentsDisplayText,
        title: {
          ar: `تحذير قصور وظائف الكلى (${med.displayName.ar}): يتطلب ضبط الجرعة أو التجنب`,
          en: `Renal Impairment Warning (${med.displayName.en}): Dose Adjustment or Contraindication`,
        },
        reason: {
          ar: isNitrofurantoin
            ? 'يُمنع استخدام النيتروفورانتوين في حالات القصور الكلوي الملحوظ لعدم وصوله لتركيز علاجي في البول وارتفاع خطر السمية العصبية والجهازية.'
            : `يتم إخراج (${med.genericName.ar}) عبر الكلى أو يحمل مخاطر سمية كلوية؛ لذا يتطلب تعديل الجرعة ومباعدة الفترات الزمنية وفق معدل الترشيح الكبيبي (CrCl / eGFR).`,
          en: isNitrofurantoin
            ? 'Nitrofurantoin is contraindicated in significant renal impairment due to subtherapeutic urine concentrations and elevated systemic/neuropathic toxicity risk.'
            : `${med.genericName.en} is renally cleared or potentially nephrotoxic; impaired kidney function requires dose/interval adjustment based on CrCl/eGFR.`,
        },
        nextStep: {
          ar: 'اعرض أحدث تحليل لوظائف الكلى (Serum Creatinine / eGFR) على الطبيب أو الصيدلي الإكلينيكي قبل الاستخدام.',
          en: 'Share your latest serum creatinine / eGFR result with your physician or clinical pharmacist before taking this medication.',
        },
        source: monoSrc,
        dataCompleteness: {
          isComplete: true,
          status: 'verified',
          uncertaintyNote: {
            ar: 'مبني على حالة وظائف الكلى المسجلة في الملف الصحي',
            en: 'Based on recorded renal status in health profile',
          },
        },
      });
    }

    // 7e. Hepatic Impairment precautions
    if (hasHepaticImpairment && ['amoxicillin-clavulanic-acid', 'azithromycin', 'clarithromycin', 'erythromycin', 'metronidazole', 'doxycycline'].includes(ingId)) {
      addFinding({
        id: `profile:hepatic:${ingId}`,
        type: 'profile_contraindication',
        severity: 'warning',
        involvedMedicines: [med.displayName],
        involvedIngredients: med.componentsDisplayText,
        title: {
          ar: `تحذير وظائف الكبد (${med.displayName.ar}): احتياطات كبدية موثقة`,
          en: `Hepatic Function Precaution (${med.displayName.en}): Documented Liver Caution`,
        },
        reason: {
          ar:
            seedMono?.fields.contraindications?.ar ||
            `يُستقلب (${med.genericName.ar}) كبدياً أو يرتبط بمحاذير موثقة تخص إنزيمات الكبد واليرقان لدى مرضى الكبد.`,
          en:
            seedMono?.fields.contraindications?.en ||
            `${med.genericName.en} undergoes hepatic clearance or carries documented hepatotoxicity/cholestatic precautions in liver disease.`,
        },
        nextStep: {
          ar: 'راجع الطبيب المعالج للتأكد من ملاءمة الدواء والجرعة لحالة الكبد.',
          en: 'Confirm hepatic suitability and any required liver enzyme monitoring with your physician.',
        },
        source: monoSrc,
        dataCompleteness: {
          isComplete: true,
          status: 'verified',
          uncertaintyNote: {
            ar: 'مبني على حالة الكبد المسجلة في الملف الصحي',
            en: 'Based on recorded hepatic status in health profile',
          },
        },
      });
    }

    // 7f. G6PD deficiency & Myasthenia Gravis
    if (hasG6PD && (isSulfa || isNitrofurantoin || isQuinolone)) {
      addFinding({
        id: `profile:g6pd:${ingId}`,
        type: 'profile_contraindication',
        severity: 'urgent',
        involvedMedicines: [med.displayName],
        involvedIngredients: med.componentsDisplayText,
        title: {
          ar: `تحذير أنيميا الفول G6PD (${med.displayName.ar}): خطر انحلال الدم`,
          en: `G6PD Deficiency Alert (${med.displayName.en}): Hemolytic Anemia Risk`,
        },
        reason: {
          ar: `يرتبط (${med.genericName.ar}) بخطر حدوث تكسير (انحلال) حاد في كرات الدم الحمراء لدى مرضى نقص إنزيم G6PD (أنيميا الفول).`,
          en: `${med.genericName.en} is associated with acute hemolytic anemia risk in patients with G6PD deficiency.`,
        },
        nextStep: {
          ar: 'لا تتناول هذا الدواء وأبلغ الطبيب المعالج فوراً بوجود أنيميا الفول لوصف بديل آمن.',
          en: 'Do not take this medication; inform your prescribing physician immediately about G6PD deficiency for a safe alternative.',
        },
        source: monoSrc,
        dataCompleteness: {
          isComplete: true,
          status: 'verified',
          uncertaintyNote: {
            ar: 'مبني على تسجيل أنيميا الفول (G6PD) في الملف الصحي',
            en: 'Based on recorded G6PD deficiency in health profile',
          },
        },
      });
    }

    if (hasMyasthenia && (isQuinolone || isAminoglycoside || ingId === 'azithromycin')) {
      addFinding({
        id: `profile:myasthenia:${ingId}`,
        type: 'profile_contraindication',
        severity: 'urgent',
        involvedMedicines: [med.displayName],
        involvedIngredients: med.componentsDisplayText,
        title: {
          ar: `تحذير الوهن العضلي الوبيل (${med.displayName.ar}): خطر تفاقم ضعف العضلات`,
          en: `Myasthenia Gravis Contraindication (${med.displayName.en}): Neuromuscular Weakness Risk`,
        },
        reason: {
          ar: `قد يسبب (${med.genericName.ar}) تفاقماً خطيراً في ضعف العضلات والتنفس لدى مرضى الوهن العضلي الوبيل.`,
          en: `${med.genericName.en} may precipitate severe neuromuscular and respiratory weakness in patients with Myasthenia Gravis.`,
        },
        nextStep: {
          ar: 'راجع الطبيب المعالج فوراً قبل استخدام هذا الدواء لاختيار مضاد بديل آمن.',
          en: 'Contact your prescribing physician immediately prior to use for a safe alternative antibiotic.',
        },
        source: monoSrc,
        dataCompleteness: {
          isComplete: true,
          status: 'verified',
          uncertaintyNote: {
            ar: 'مبني على تسجيل الوهن العضلي في الملف الصحي',
            en: 'Based on recorded Myasthenia Gravis in health profile',
          },
        },
      });
    }
  }

  // 8. Compute missing profile fields & completeness metadata
  const missingProfileFields: string[] = [];
  if (Number.isNaN(parsedAge) && !input.patientAgeOverride) {
    missingProfileFields.push('Age / العمر');
  }
  if (!profile?.allergies || profile.allergies.length === 0) {
    missingProfileFields.push('Allergy History / سجل الحساسية');
  }
  if (!profile?.renalStatus || profile.renalStatus === 'unknown') {
    if (!hasRenalImpairment) missingProfileFields.push('Renal Function / وظائف الكلى');
  }
  if (!profile?.hepaticStatus || profile.hepaticStatus === 'unknown') {
    if (!hasHepaticImpairment) missingProfileFields.push('Hepatic Function / وظائف الكبد');
  }

  // Sort findings deterministically by severity (urgent -> warning -> caution -> info), then by ID
  const findings = Array.from(findingsMap.values()).sort((a, b) => {
    const diff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });

  const groupedFindings = {
    duplicates: findings.filter((f) => f.type === 'duplicate_ingredient'),
    allergies: findings.filter(
      (f) => f.type === 'allergy_match' || f.type === 'allergy_cross_reactivity'
    ),
    interactions: findings.filter((f) => f.type === 'drug_interaction'),
    profileContraindications: findings.filter((f) => f.type === 'profile_contraindication'),
    uncertainties: findings.filter(
      (f) => f.type === 'identity_uncertainty' || f.type === 'data_source_unavailable'
    ),
  };

  // Determine overall status and completeness
  const hasUnverifiedMed = resolvedMedications.some((m) => m.matchedStatus !== 'verified');
  let overallStatus: OverallSafetyStatus = 'no_known_alerts';

  if (findings.some((f) => f.severity === 'urgent')) {
    overallStatus = 'urgent_review';
  } else if (findings.some((f) => f.severity === 'warning')) {
    overallStatus = 'warning_review';
  } else if (hasDataSourceFailure || hasUnverifiedMed) {
    overallStatus = 'incomplete_check';
  } else if (findings.some((f) => f.severity === 'caution')) {
    overallStatus = 'caution_verify';
  }

  const completenessStatus: 'complete' | 'partial' | 'unable_to_verify' =
    hasDataSourceFailure || hasUnverifiedMed || resolvedMedications.length === 0
      ? 'unable_to_verify'
      : missingProfileFields.length > 0 || unverifiedInteractionPairs.length > 0
        ? 'partial'
        : 'complete';

  let summaryBanner: Bi;
  if (overallStatus === 'urgent_review') {
    summaryBanner = {
      ar: '🚨 تنبيه عاجل: تم رصد تعارض خطير (حساسية مؤكدة أو تداخل دوائي حاد أو مانع استعمال) يستدعي مراجعة الطبيب أو الصيدلي فوراً قبل الاستخدام.',
      en: '🚨 Urgent Review Required: High-risk allergy, severe drug interaction, or contraindication detected. Consult your physician or pharmacist immediately before use.',
    };
  } else if (overallStatus === 'warning_review') {
    summaryBanner = {
      ar: '⚠️ تحذير سريري: تم رصد تكرار في المادة الفعالة أو حساسية متصالبة أو تداخل دوائي متوسط يستلزم مراجعة الطبيب أو الصيدلي وتنظيم الجرعات.',
      en: '⚠️ Clinical Warning: Duplicate active ingredient, cross-reactivity risk, or moderate interaction detected. Prompt pharmacist or physician review is advised.',
    };
  } else if (overallStatus === 'incomplete_check') {
    summaryBanner = {
      ar: '🔍 فحص غير مكتمل (Unable to Verify): تعذر التأكد من المادة الفعالة لبعض الأصناف أو مصدر البيانات — لا تفترض الأمان التلقائي وراجع الصيدلي.',
      en: '🔍 Incomplete Check (Unable to Verify): One or more medications or data sources could not be verified — do not assume safety without pharmacist verification.',
    };
  } else if (overallStatus === 'caution_verify') {
    summaryBanner = {
      ar: '🟡 تنبيه يحتاج للتحقق: يرجى مراجعة الملاحظات الإرشادية أدناه مع الصيدلي.',
      en: '🟡 Verification Advised: Please review the caution notes below with your pharmacist.',
    };
  } else {
    summaryBanner = {
      ar: 'ℹ️ لم يتم رصد تعارضات مباشرة في القواعد المفحوصة حالياً — تذكر أن «عدم ظهور تحذيرات» لا يعني ضمان أمان الروشتة بنسبة 100%، التزم دائماً بمراجعة الصيدلي والطبيب.',
      en: 'ℹ️ No direct conflicts detected in the rules checked — remember that "no alerts found" never guarantees a prescription is 100% safe. Always verify with your pharmacist and physician.',
    };
  }

  return {
    engineVersion: ENGINE_VERSION,
    evaluatedAt: new Date().toISOString(),
    overallStatus,
    resolvedMedications,
    findings,
    groupedFindings,
    completeness: {
      status: completenessStatus,
      summaryBanner,
      missingProfileFields,
      unverifiedInteractionPairs,
    },
    safetyDisclaimer: {
      ar: 'هذا التقييم أداة دعم قرار سريري وتثقيفي ولا يغني عن حكم الطبيب المعالج أو الصيدلي الإكلينيكي. عدم ظهور تنبيهات لا يعني أن الروشتة مضمونة الأمان بالكامل. لا توقف أو تبدأ أو تستبدل أي دواء أو تعدل جرعته من تلقاء نفسك.',
      en: 'This assessment provides clinical decision support and does not replace a licensed physician or pharmacist. "No alerts found" never means a prescription is guaranteed safe. Never start, stop, substitute, or change a medication dose without professional medical guidance.',
    },
  };
}

/**
 * Re-exports verified alternative lookup from `egyptianDrugDatabase.ts` so callers can query
 * exact active-ingredient equivalents vs different-strength/route products from one entry point.
 */
export { getClassifiedAlternatives };
