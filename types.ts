export type Lang = 'ar' | 'en' | 'fr' | 'es';
export type Bi = { ar: string; en: string; fr?: string; es?: string };
export type Bilingual = Bi;
export type Status = 'draft' | 'pending_review' | 'approved' | 'archived';
export const STATUSES: Status[] = ['draft', 'pending_review', 'approved', 'archived'];

export interface LangMeta {
  code: Lang;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  flag: string;
  dir: 'rtl' | 'ltr';
  locale: string;
}

export const SUPPORTED_LANGS: LangMeta[] = [
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', shortLabel: 'عربي', flag: '🇪🇬', dir: 'rtl', locale: 'ar-EG' },
  { code: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'EN', flag: '🇬🇧', dir: 'ltr', locale: 'en-US' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', shortLabel: 'FR', flag: '🇫🇷', dir: 'ltr', locale: 'fr-FR' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', shortLabel: 'ES', flag: '🇪🇸', dir: 'ltr', locale: 'es-ES' },
];

export function isValidLang(val: string | null | undefined): val is Lang {
  return val === 'ar' || val === 'en' || val === 'fr' || val === 'es';
}

export const tr = (
  lang: Lang,
  ar: string,
  en: string,
  fr?: string,
  es?: string
): string => {
  if (lang === 'ar') return ar;
  if (lang === 'fr') return fr || en;
  if (lang === 'es') return es || en;
  return en;
};

export const TEXT_FIELDS = [
  'genericName',
  'activeIngredients',
  'drugClass',
  'mechanism',
  'strengths',
  'approvedUses',
  'priceEgypt',
  'substitutes',
  'ageRestrictions',
  'dosingReference',
  'contraindications',
  'sideEffects',
  'interactions',
  'pregnancyBreastfeeding',
  'renalHepatic',
  'patientEducation',
] as const;
export type TextField = (typeof TEXT_FIELDS)[number];

export const FIELD_LABELS: Record<TextField, Bi> = {
  genericName: {
    ar: 'الاسم العلمي',
    en: 'Generic name',
    fr: 'Dénomination commune internationale (DCI)',
    es: 'Nombre genérico (DCI)',
  },
  activeIngredients: {
    ar: 'المواد الفعالة',
    en: 'Active ingredients',
    fr: 'Principes actifs',
    es: 'Principios activos',
  },
  drugClass: {
    ar: 'الفئة الدوائية',
    en: 'Drug class',
    fr: 'Classe thérapeutique',
    es: 'Clase farmacológica',
  },
  mechanism: {
    ar: 'آلية العمل',
    en: 'Mechanism of action',
    fr: 'Mécanisme d’action',
    es: 'Mecanismo de acción',
  },
  strengths: {
    ar: 'التراكيز والأشكال المتوفرة',
    en: 'Strengths & dosage forms',
    fr: 'Dosages et formes galéniques',
    es: 'Concentraciones y formas farmacéuticas',
  },
  approvedUses: {
    ar: 'الاستخدامات الطبية المعتمدة',
    en: 'Approved medical uses',
    fr: 'Indications médicales approuvées',
    es: 'Indicaciones médicas aprobadas',
  },
  priceEgypt: {
    ar: 'السعر في السوق المصري (EGP)',
    en: 'Price in Egyptian Market (EGP)',
    fr: 'Prix sur le marché égyptien (EGP)',
    es: 'Precio en el mercado egipcio (EGP)',
  },
  substitutes: {
    ar: 'البدائل والمثائل الدوائية المتاحة في مصر',
    en: 'Available Substitutes in Egypt',
    fr: 'Génériques et équivalents disponibles en Égypte',
    es: 'Sustitutos y genéricos disponibles en Egipto',
  },
  ageRestrictions: {
    ar: 'قيود العمر',
    en: 'Age restrictions',
    fr: 'Restrictions liées à l’âge',
    es: 'Restricciones de edad',
  },
  dosingReference: {
    ar: 'مرجع الجرعات (للاطلاع فقط)',
    en: 'Dosing reference (information only)',
    fr: 'Référence posologique (à titre informatif)',
    es: 'Referencia de dosificación (solo informativa)',
  },
  contraindications: {
    ar: 'موانع الاستعمال',
    en: 'Contraindications',
    fr: 'Contre-indications',
    es: 'Contraindicaciones',
  },
  sideEffects: {
    ar: 'الآثار الجانبية',
    en: 'Side effects',
    fr: 'Effets indésirables',
    es: 'Efectos secundarios',
  },
  interactions: {
    ar: 'التداخلات الدوائية والغذائية',
    en: 'Drug & food interactions',
    fr: 'Interactions médicamenteuses et alimentaires',
    es: 'Interacciones medicamentosas y alimentarias',
  },
  pregnancyBreastfeeding: {
    ar: 'الحمل والرضاعة',
    en: 'Pregnancy & breastfeeding',
    fr: 'Grossesse et allaitement',
    es: 'Embarazo y lactancia',
  },
  renalHepatic: {
    ar: 'احتياطات الكلى والكبد',
    en: 'Renal & hepatic precautions',
    fr: 'Précautions rénales et hépatiques',
    es: 'Precauciones renales y hepáticas',
  },
  patientEducation: {
    ar: 'إرشادات وتثقيف المريض',
    en: 'Patient education',
    fr: 'Conseils et éducation du patient',
    es: 'Educación y consejos para el paciente',
  },
};

export interface Brand {
  name: string;
  manufacturer: string;
  barcode: string;
  verified: boolean;
  sourceUrl: string;
}

export interface Source {
  title: string;
  url: string;
  publisher?: string;
  updated?: string;
  accessed?: string;
}

export type Medicine = Record<TextField, Bi> & {
  id: string;
  status: Status;
  brands: Brand[];
  barcodes: string[];
  sources: Source[];
  lastReviewed: string;
  reviewedBy: string;
  notes: string;
};

export function emptyMedicine(id = ''): Medicine {
  const texts = Object.fromEntries(
    TEXT_FIELDS.map((f) => [f, { ar: '', en: '', fr: '', es: '' }]),
  ) as Record<TextField, Bi>;
  return {
    id,
    status: 'approved',
    ...texts,
    brands: [],
    barcodes: [],
    sources: [],
    lastReviewed: '2026-10-13',
    reviewedBy: '',
    notes: '',
  };
}

const FR_PHRASE_MAP: [RegExp, string][] = [
  [/\bFilm-coated tablets\b/gi, 'Comprimés pelliculés'],
  [/\bExtended-release tablets\b/gi, 'Comprimés à libération prolongée'],
  [/\bDouble-strength tablets\b/gi, 'Comprimés fort dosage'],
  [/\bTablets\b/gi, 'Comprimés'],
  [/\bSustained-release capsules\b/gi, 'Gélules à libération prolongée'],
  [/\bCapsules\b/gi, 'Gélules'],
  [/\bOral Suspension\b/gi, 'Suspension buvable'],
  [/\boral suspension\b/gi, 'suspension buvable'],
  [/\bgranules for suspension\b/gi, 'granulés pour suspension'],
  [/\bbottle for reconstitution\b/gi, 'flacon à reconstituer'],
  [/\bpediatric bottle\b/gi, 'flacon pédiatrique'],
  [/\bbottle with dropper\b/gi, 'flacon compte-gouttes'],
  [/\bbottle with dosing syringe\b/gi, 'flacon avec seringue doseuse'],
  [/\bsterile dropper bottle\b/gi, 'flacon compte-gouttes stérile'],
  [/\bIV Infusion bottle\b/gi, 'Flacon pour perfusion IV'],
  [/\bIV infusion bottle\b/gi, 'flacon pour perfusion IV'],
  [/\bIV bottle\b/gi, 'flacon IV'],
  [/\bIV bag\b/gi, 'poche pour perfusion IV'],
  [/\bbottle\b/gi, 'flacon'],
  [/\bLyophilized IV Vial\b/gi, 'Flacon IV lyophilisé'],
  [/\bIV Vial\b/gi, 'Flacon IV'],
  [/\bVial \+ solvent ampoule\b/gi, 'Flacon + ampoule de solvant'],
  [/\bVial \+ solvent\b/gi, 'Flacon + solvant'],
  [/\bVial\b/gi, 'Flacon'],
  [/\bAmpoules\b/gi, 'Ampoules'],
  [/\bAmpoule\b/gi, 'Ampoule'],
  [/\bstrips\b/gi, 'plaquettes'],
  [/\bstrip\b/gi, 'plaquette'],
  [/\bCream tube\b/gi, 'Tube de crème'],
  [/\bOintment tube\b/gi, 'Tube de pommade'],
  [/\bTopical pack\b/gi, 'Flacon/tube topique'],
  [/\btopical gel\/solution\b/gi, 'gel/solution topique'],
  [/\bOphthalmic solution\b/gi, 'Collyre en solution'],
  [/\bSterile ophthalmic tube\b/gi, 'Tube ophtalmique stérile'],
  [/\bParenteral \(IV \/ IM\)\b/gi, 'Parentérale (IV / IM)'],
  [/\bTopical Cutaneous\b/gi, 'Voie cutanée / topique'],
  [/\bOphthalmic \/ Otic\b/gi, 'Ophtalmique / Auriculaire'],
  [/\bOral Granules \/ Sachets\b/gi, 'Granulés buvables / Sachets'],
  [/\bOral Drops\b/gi, 'Gouttes buvables'],
];

const ES_PHRASE_MAP: [RegExp, string][] = [
  [/\bFilm-coated tablets\b/gi, 'Comprimidos recubiertos'],
  [/\bExtended-release tablets\b/gi, 'Comprimidos de liberación prolongada'],
  [/\bDouble-strength tablets\b/gi, 'Comprimidos de doble concentración'],
  [/\bTablets\b/gi, 'Comprimidos'],
  [/\bSustained-release capsules\b/gi, 'Cápsulas de liberación prolongada'],
  [/\bCapsules\b/gi, 'Cápsulas'],
  [/\bOral Suspension\b/gi, 'Suspensión oral'],
  [/\boral suspension\b/gi, 'suspensión oral'],
  [/\bgranules for suspension\b/gi, 'gránulos para suspensión'],
  [/\bbottle for reconstitution\b/gi, 'frasco para reconstitución'],
  [/\bpediatric bottle\b/gi, 'frasco pediátrico'],
  [/\bbottle with dropper\b/gi, 'frasco con gotero'],
  [/\bbottle with dosing syringe\b/gi, 'frasco con jeringa dosificadora'],
  [/\bsterile dropper bottle\b/gi, 'frasco gotero estéril'],
  [/\bIV Infusion bottle\b/gi, 'Frasco para perfusión IV'],
  [/\bIV infusion bottle\b/gi, 'frasco para perfusión IV'],
  [/\bIV bottle\b/gi, 'frasco IV'],
  [/\bIV bag\b/gi, 'bolsa para perfusión IV'],
  [/\bbottle\b/gi, 'frasco'],
  [/\bLyophilized IV Vial\b/gi, 'Vial IV liofilizado'],
  [/\bIV Vial\b/gi, 'Vial IV'],
  [/\bVial \+ solvent ampoule\b/gi, 'Vial + ampolla de disolvente'],
  [/\bVial \+ solvent\b/gi, 'Vial + disolvente'],
  [/\bVial\b/gi, 'Vial'],
  [/\bAmpoules\b/gi, 'Ampollas'],
  [/\bAmpoule\b/gi, 'Ampolla'],
  [/\bstrips\b/gi, 'blísters'],
  [/\bstrip\b/gi, 'blíster'],
  [/\bCream tube\b/gi, 'Tubo de crema'],
  [/\bOintment tube\b/gi, 'Tubo de pomada'],
  [/\bTopical pack\b/gi, 'Envase tópico'],
  [/\btopical gel\/solution\b/gi, 'gel/solución tópica'],
  [/\bOphthalmic solution\b/gi, 'Solución oftálmica'],
  [/\bSterile ophthalmic tube\b/gi, 'Tubo oftálmico estéril'],
  [/\bParenteral \(IV \/ IM\)\b/gi, 'Parenteral (IV / IM)'],
  [/\bTopical Cutaneous\b/gi, 'Vía tópica / cutánea'],
  [/\bOphthalmic \/ Otic\b/gi, 'Oftálmica / Ótica'],
  [/\bOral Granules \/ Sachets\b/gi, 'Gránulos orales / Sobres'],
  [/\bOral Drops\b/gi, 'Gotas orales'],
];

function localizeFallbackText(text: string, lang: Lang): string {
  if (!text || (lang !== 'fr' && lang !== 'es')) return text;
  const rules = lang === 'fr' ? FR_PHRASE_MAP : ES_PHRASE_MAP;
  let out = text;
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export const pick = (b: Bi | undefined, lang: Lang): string => {
  if (!b) return '';
  if (b[lang]) return b[lang] as string;
  const base = b.en || b.ar || '';
  if (lang === 'fr' || lang === 'es') {
    return localizeFallbackText(base, lang);
  }
  return base;
};
