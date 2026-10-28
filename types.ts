export type Lang = 'ar' | 'en' | 'fr' | 'es' | 'de';
export type Bi = { ar: string; en: string; fr?: string; es?: string; de?: string };
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
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', shortLabel: 'DE', flag: '🇩🇪', dir: 'ltr', locale: 'de-DE' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', shortLabel: 'FR', flag: '🇫🇷', dir: 'ltr', locale: 'fr-FR' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', shortLabel: 'ES', flag: '🇪🇸', dir: 'ltr', locale: 'es-ES' },
];

export function isValidLang(val: string | null | undefined): val is Lang {
  return val === 'ar' || val === 'en' || val === 'fr' || val === 'es' || val === 'de';
}

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
    de: 'Internationaler Freiname (INN / Generikum)',
  },
  activeIngredients: {
    ar: 'المواد الفعالة',
    en: 'Active ingredients',
    fr: 'Principes actifs',
    es: 'Principios activos',
    de: 'Wirkstoffe',
  },
  drugClass: {
    ar: 'الفئة الدوائية',
    en: 'Drug class',
    fr: 'Classe thérapeutique',
    es: 'Clase farmacológica',
    de: 'Arzneimittelklasse (Wirkstoffgruppe)',
  },
  mechanism: {
    ar: 'آلية العمل',
    en: 'Mechanism of action',
    fr: 'Mécanisme d’action',
    es: 'Mecanismo de acción',
    de: 'Wirkmechanismus',
  },
  strengths: {
    ar: 'التراكيز والأشكال المتوفرة',
    en: 'Strengths & dosage forms',
    fr: 'Dosages et formes galéniques',
    es: 'Concentraciones y formas farmacéuticas',
    de: 'Stärken & Darreichungsformen',
  },
  approvedUses: {
    ar: 'الاستخدامات الطبية المعتمدة',
    en: 'Approved medical uses',
    fr: 'Indications médicales approuvées',
    es: 'Indicaciones médicas aprobadas',
    de: 'Zugelassene medizinische Anwendungsgebiete',
  },
  priceEgypt: {
    ar: 'السعر في السوق المصري (EGP)',
    en: 'Price in Egyptian Market (EGP)',
    fr: 'Prix sur le marché égyptien (EGP)',
    es: 'Precio en el mercado egipcio (EGP)',
    de: 'Offizieller Preis auf dem ägyptischen Markt (EGP)',
  },
  substitutes: {
    ar: 'البدائل والمثائل الدوائية المتاحة في مصر',
    en: 'Available Substitutes in Egypt',
    fr: 'Génériques et équivalents disponibles en Égypte',
    es: 'Sustitutos y genéricos disponibles en Egipto',
    de: 'Verfügbare Generika & Alternativen in Ägypten',
  },
  ageRestrictions: {
    ar: 'قيود العمر',
    en: 'Age restrictions',
    fr: 'Restrictions liées à l’âge',
    es: 'Restricciones de edad',
    de: 'Altersbeschränkungen',
  },
  dosingReference: {
    ar: 'مرجع الجرعات (للاطلاع فقط)',
    en: 'Dosing reference (information only)',
    fr: 'Référence posologique (à titre informatif)',
    es: 'Referencia de dosificación (solo informativa)',
    de: 'Dosierungsreferenz (nur zur Orientierung)',
  },
  contraindications: {
    ar: 'موانع الاستعمال',
    en: 'Contraindications',
    fr: 'Contre-indications',
    es: 'Contraindicaciones',
    de: 'Gegenanzeigen (Kontraindikationen)',
  },
  sideEffects: {
    ar: 'الآثار الجانبية',
    en: 'Side effects',
    fr: 'Effets indésirables',
    es: 'Efectos secundarios',
    de: 'Nebenwirkungen (Unerwünschte Wirkungen)',
  },
  interactions: {
    ar: 'التداخلات الدوائية والغذائية',
    en: 'Drug & food interactions',
    fr: 'Interactions médicamenteuses et alimentaires',
    es: 'Interacciones medicamentosas y alimentarias',
    de: 'Wechselwirkungen mit Medikamenten & Lebensmitteln',
  },
  pregnancyBreastfeeding: {
    ar: 'الحمل والرضاعة',
    en: 'Pregnancy & breastfeeding',
    fr: 'Grossesse et allaitement',
    es: 'Embarazo y lactancia',
    de: 'Schwangerschaft & Stillzeit',
  },
  renalHepatic: {
    ar: 'احتياطات الكلى والكبد',
    en: 'Renal & hepatic precautions',
    fr: 'Précautions rénales et hépatiques',
    es: 'Precauciones renales y hepáticas',
    de: 'Vorsichtsmaßnahmen bei Nieren- & Leberinsuffizienz',
  },
  patientEducation: {
    ar: 'إرشادات وتثقيف المريض',
    en: 'Patient education',
    fr: 'Conseils et éducation du patient',
    es: 'Educación y consejos para el paciente',
    de: 'Patientenaufklärung & Einnahmehinweise',
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
    TEXT_FIELDS.map((f) => [f, { ar: '', en: '', fr: '', es: '', de: '' }]),
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
  [/\bCommercial Packages Registry\b/gi, 'Registre des Spécialités Commerciales'],
  [/\bClinical Active Ingredients\b/gi, 'Principes Actifs Cliniques (DCI)'],
  [/\bData Audit & CSV\/JSON Importer\b/gi, 'Audit des Données & Import CSV/JSON'],
  [/\bCompare 2 Drugs\b/gi, 'Comparer 2 Médicaments'],
  [/\bAll Ingredients\b/gi, 'Tous les principes actifs'],
  [/\bAll Dosage Forms\b/gi, 'Toutes les formes galéniques'],
  [/\bAll Routes\b/gi, 'Toutes les voies d’administration'],
  [/\bRoute of Administration\b/gi, 'Voie d’administration'],
  [/\bDosage Form\b/gi, 'Forme galénique'],
  [/\bBarcode Verification\b/gi, 'Vérification du code-barres'],
  [/\bVerified Barcode Only\b/gi, 'Code-barres vérifié uniquement'],
  [/\bPending Barcode Check\b/gi, 'En attente de vérification'],
  [/\bComposition Type\b/gi, 'Type de composition'],
  [/\bAll \(Single \+ Combo\)\b/gi, 'Tous (Simple + Combiné)'],
  [/\bSingle Ingredient\b/gi, 'Principe actif unique'],
  [/\bCombination Product\b/gi, 'Association médicamenteuse'],
  [/\bActive Ingredient\b/gi, 'Principe actif'],
  [/\bActive Ingredients\b/gi, 'Principes actifs'],
  [/\bDrug Allergy & Cross-Reactivity Checker\b/gi, 'Vérificateur d’Allergies & Réactivité Croisée'],
  [/\bPediatric Dosage & Syringe Simulator\b/gi, 'Calculateur Pédiatrique & Simulateur de Seringue'],
  [/\bDrug & Food Interaction Checker\b/gi, 'Vérificateur d’Interactions Médicamenteuses & Alimentaires'],
  [/\bAntibiotic Side Effects: What Should I Do\?\b/gi, 'Effets Indésirables des Antibiotiques : Que Faire ?'],
  [/\bSafe Antibiotic Disposal & Eco-Stewardship\b/gi, 'Élimination Sûre des Antibiotiques & Éco-Santé'],
  [/\bSmart Antibiotic Course & Dose Tracker\b/gi, 'Suivi Intelligent du Traitement & Calendrier des Doses'],
  [/\bCompare Two Antibiotics Side-by-Side\b/gi, 'Comparer Deux Antibiotiques Côte à Côte'],
  [/\bMy Health & Allergy Profile\b/gi, 'Mon Profil Santé & Allergies'],
  [/\bGreen Prescription \(Non-Antibiotic Self-Care Plan\)\b/gi, 'Ordonnance Verte (Plan de Soins Sans Antibiotique)'],
  [/\bWorld AMR Awareness Week \(WAAW\)\b/gi, 'Semaine Mondiale de Sensibilisation à l’AMR (WAAW)'],
  [/\bFull Prescription Radar & 24-Hour Smart Scheduler\b/gi, 'Radar d’Ordonnance Complète & Planificateur 24h'],
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
  [/\bNext Step:\b/gi, 'Étape suivante :'],
  [/\bSource:\b/gi, 'Source :'],
  [/\bAllergy Check:\b/gi, 'Contrôle d’allergie :'],
  [/\bStorage Instruction:\b/gi, 'Consigne de conservation :'],
  [/\bPrescription Radar\b/gi, 'Radar d’Ordonnance'],
  [/\bAllergy Safety Check\b/gi, 'Vérification des Allergies'],
  [/\bInteractions Check\b/gi, 'Vérification des Interactions'],
  [/\bMy Profile\b/gi, 'Mon Profil'],
  [/\bFull Rx Check\b/gi, 'Vérifier une Ordonnance'],
];

const ES_PHRASE_MAP: [RegExp, string][] = [
  [/\bCommercial Packages Registry\b/gi, 'Registro de Presentaciones Comerciales'],
  [/\bClinical Active Ingredients\b/gi, 'Principios Activos Clínicos (DCI)'],
  [/\bData Audit & CSV\/JSON Importer\b/gi, 'Auditoría de Datos e Importador CSV/JSON'],
  [/\bCompare 2 Drugs\b/gi, 'Comparar 2 Fármacos'],
  [/\bAll Ingredients\b/gi, 'Todos los principios activos'],
  [/\bAll Dosage Forms\b/gi, 'Todas las formas farmacéuticas'],
  [/\bAll Routes\b/gi, 'Todas las vías de administración'],
  [/\bRoute of Administration\b/gi, 'Vía de administración'],
  [/\bDosage Form\b/gi, 'Forma farmacéutica'],
  [/\bBarcode Verification\b/gi, 'Verificación de código de barras'],
  [/\bVerified Barcode Only\b/gi, 'Solo código de barras verificado'],
  [/\bPending Barcode Check\b/gi, 'Pendiente de verificación'],
  [/\bComposition Type\b/gi, 'Tipo de composición'],
  [/\bAll \(Single \+ Combo\)\b/gi, 'Todos (Simple + Combinado)'],
  [/\bSingle Ingredient\b/gi, 'Principio activo único'],
  [/\bCombination Product\b/gi, 'Producto combinado'],
  [/\bActive Ingredient\b/gi, 'Principio activo'],
  [/\bActive Ingredients\b/gi, 'Principios activos'],
  [/\bDrug Allergy & Cross-Reactivity Checker\b/gi, 'Verificador de Alergias y Reactividad Cruzada'],
  [/\bPediatric Dosage & Syringe Simulator\b/gi, 'Calculadora Pediátrica y Simulador de Jeringa'],
  [/\bDrug & Food Interaction Checker\b/gi, 'Verificador de Interacciones con Fármacos y Alimentos'],
  [/\bAntibiotic Side Effects: What Should I Do\?\b/gi, 'Efectos Secundarios de los Antibióticos: ¿Qué Hacer?'],
  [/\bSafe Antibiotic Disposal & Eco-Stewardship\b/gi, 'Eliminación Segura de Antibióticos y Eco-Salud'],
  [/\bSmart Antibiotic Course & Dose Tracker\b/gi, 'Seguimiento Inteligente del Tratamiento y Dosis'],
  [/\bCompare Two Antibiotics Side-by-Side\b/gi, 'Comparar Dos Antibióticos Lado a Lado'],
  [/\bMy Health & Allergy Profile\b/gi, 'Mi Perfil de Salud y Alergias'],
  [/\bGreen Prescription \(Non-Antibiotic Self-Care Plan\)\b/gi, 'Receta Verde (Plan de Autocuidado Sin Antibióticos)'],
  [/\bWorld AMR Awareness Week \(WAAW\)\b/gi, 'Semana Mundial de Concienciación sobre la RAM (WAAW)'],
  [/\bFull Prescription Radar & 24-Hour Smart Scheduler\b/gi, 'Radar de Receta Completa y Horario Inteligente 24h'],
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
  [/\bNext Step:\b/gi, 'Siguiente paso:'],
  [/\bSource:\b/gi, 'Fuente:'],
  [/\bAllergy Check:\b/gi, 'Control de alergia:'],
  [/\bStorage Instruction:\b/gi, 'Instrucción de almacenamiento:'],
  [/\bPrescription Radar\b/gi, 'Radar de Recetas'],
  [/\bAllergy Safety Check\b/gi, 'Verificación de Alergias'],
  [/\bInteractions Check\b/gi, 'Verificación de Interacciones'],
  [/\bMy Profile\b/gi, 'Mi Perfil'],
  [/\bFull Rx Check\b/gi, 'Verificar Receta Completa'],
];

const DE_PHRASE_MAP: [RegExp, string][] = [
  [/\bComplete Egyptian Antibiotics, Alternatives & Barcode Database\b/gi, 'Umfassende Ägyptische Antibiotika-, Generika- & Barcode-Datenbank'],
  [/\bCommercial Packages Registry\b/gi, 'Register der Handelspackungen'],
  [/\bClinical Active Ingredients\b/gi, 'Klinische Wirkstoffe (INN)'],
  [/\bData Audit & CSV\/JSON Importer\b/gi, 'Datenprüfung & CSV/JSON-Import'],
  [/\bGeneric Cost Saver\b/gi, 'Generika-Preisrechner & Kostenersparnis'],
  [/\bCompare 2 Drugs\b/gi, '2 Medikamente vergleichen'],
  [/\bAll Ingredients\b/gi, 'Alle Wirkstoffe'],
  [/\bAll Dosage Forms\b/gi, 'Alle Darreichungsformen'],
  [/\bAll Routes\b/gi, 'Alle Verabreichungswege'],
  [/\bRoute of Administration\b/gi, 'Verabreichungsweg'],
  [/\bDosage Form\b/gi, 'Darreichungsform'],
  [/\bBarcode Verification\b/gi, 'Barcode-Verifizierung'],
  [/\bVerified Barcode Only\b/gi, 'Nur verifizierte Barcodes'],
  [/\bPending Barcode Check\b/gi, 'Barcode-Prüfung ausstehend'],
  [/\bComposition Type\b/gi, 'Zusammensetzungstyp'],
  [/\bAll \(Single \+ Combo\)\b/gi, 'Alle (Einzel + Kombi)'],
  [/\bSingle Active Ingredient\b/gi, 'Einzelwirkstoff'],
  [/\bCombination Antibiotic\b/gi, 'Kombinationsantibiotikum'],
  [/\bSingle Ingredient\b/gi, 'Einzelwirkstoff'],
  [/\bCombination Product\b/gi, 'Kombinationspräparat'],
  [/\bActive Ingredient\b/gi, 'Wirkstoff'],
  [/\bActive Ingredients\b/gi, 'Wirkstoffe'],
  [/\bEgyptian Market Packages\b/gi, 'Handelspackungen in Ägypten'],
  [/\bVerified EAN-13 Barcodes\b/gi, 'Verifizierte EAN-13-Barcodes'],
  [/\bPharma Manufacturers\b/gi, 'Pharmazeutische Hersteller'],
  [/\bClinical Pro Mode Active \(Physician & Pharmacist View\)\b/gi, 'Klinischer Profi-Modus aktiv (Arzt- & Apothekeransicht)'],
  [/\bClinical Pro Mode Active \(Physicians & Pharmacists View\)\b/gi, 'Klinischer Profi-Modus aktiv (Arzt- & Apothekeransicht)'],
  [/\bPatient & Public Mode \(Simplified View\)\b/gi, 'Patienten- & Publikumsmodus (Vereinfachte Ansicht)'],
  [/\bPatient & Public Mode \(Simplified Guidance & Safe Use\)\b/gi, 'Patienten- & Publikumsmodus (Einfache Einnahmehinweise)'],
  [/\bPatient Mode\b/gi, 'Patientenmodus'],
  [/\bClinical Pro Mode\b/gi, 'Klinischer Profi-Modus (Arzt)'],
  [/\bAlternatives & Details\b/gi, 'Alternativen & Details'],
  [/\bClinical Guide\b/gi, 'Klinischer Leitfaden'],
  [/\bStrength & Form:\b/gi, 'Stärke & Form:'],
  [/\bPackage:\b/gi, 'Packung:'],
  [/\bManufacturer:\b/gi, 'Hersteller:'],
  [/\bLinear Barcode:\b/gi, 'Linearer Barcode:'],
  [/\bSort By:\b/gi, 'Sortieren nach:'],
  [/\bVerified Barcodes First\b/gi, 'Verifizierte Barcodes zuerst'],
  [/\bTrade Name \(A-Z\)\b/gi, 'Handelsname (A–Z)'],
  [/\bPrice: Low to High\b/gi, 'Preis: aufsteigend'],
  [/\bPrice: High to Low\b/gi, 'Preis: absteigend'],
  [/\bReset Filters\b/gi, 'Filter zurücksetzen'],
  [/\bDrug Allergy & Cross-Reactivity Checker\b/gi, 'Arzneimittelallergie- & Kreuzreaktivitäts-Prüfer'],
  [/\bPediatric Dosage & Syringe Simulator\b/gi, 'Pädiatrischer Dosierungsrechner & Spritzensimulator'],
  [/\bDrug & Food Interaction Checker\b/gi, 'Wechselwirkungs-Prüfer (Medikamente & Lebensmittel)'],
  [/\bAntibiotic Side Effects: What Should I Do\?\b/gi, 'Nebenwirkungen von Antibiotika: Was tun?'],
  [/\bSafe Antibiotic Disposal & Eco-Stewardship\b/gi, 'Sichere Antibiotika-Entsorgung & Umweltschutz'],
  [/\bSmart Antibiotic Course & Dose Tracker\b/gi, 'Intelligenter Einnahme- & Dosis-Tracker'],
  [/\bCompare Two Antibiotics Side-by-Side\b/gi, 'Zwei Antibiotika direkt vergleichen'],
  [/\bMy Health & Allergy Profile\b/gi, 'Mein Gesundheits- & Allergieprofil'],
  [/\bGreen Prescription \(Non-Antibiotic Self-Care Plan\)\b/gi, 'Grünes Rezept (Symptomlinderung ohne Antibiotika)'],
  [/\bWorld AMR Awareness Week \(WAAW\)\b/gi, 'Weltweite AMR-Aktionswoche (WAAW)'],
  [/\bFull Prescription Radar & 24-Hour Smart Scheduler\b/gi, 'Rezept-Radar & Intelligenter 24-Stunden-Einnahmeplan'],
  [/\bFilm-coated tablets\b/gi, 'Filmtabletten'],
  [/\bExtended-release tablets\b/gi, 'Retardtabletten'],
  [/\bDouble-strength tablets\b/gi, 'Doppelstärken-Tabletten'],
  [/\bTablets\b/gi, 'Tabletten'],
  [/\bSustained-release capsules\b/gi, 'Retardkapseln'],
  [/\bCapsules\b/gi, 'Kapseln'],
  [/\bOral Suspension\b/gi, 'Suspension zum Einnehmen'],
  [/\boral suspension\b/gi, 'Suspension zum Einnehmen'],
  [/\bgranules for suspension\b/gi, 'Granulat zur Herstellung einer Suspension'],
  [/\bbottle for reconstitution\b/gi, 'Flasche zur Rekonstitution'],
  [/\bpediatric bottle\b/gi, 'Kinderflasche'],
  [/\bbottle with dropper\b/gi, 'Tropfflasche'],
  [/\bbottle with dosing syringe\b/gi, 'Flasche mit Dosierspritze'],
  [/\bsterile dropper bottle\b/gi, 'sterile Tropfflasche'],
  [/\bIV Infusion bottle\b/gi, 'IV-Infusionsflasche'],
  [/\bIV infusion bottle\b/gi, 'IV-Infusionsflasche'],
  [/\bIV bottle\b/gi, 'IV-Flasche'],
  [/\bIV bag\b/gi, 'IV-Infusionsbeutel'],
  [/\bbottle\b/gi, 'Flasche'],
  [/\bLyophilized IV Vial\b/gi, 'Lyophilisierte IV-Durchstechflasche'],
  [/\bIV Vial\b/gi, 'IV-Durchstechflasche'],
  [/\bVial \+ solvent ampoule\b/gi, 'Durchstechflasche + Lösungsmittelampulle'],
  [/\bVial \+ solvent\b/gi, 'Durchstechflasche + Lösungsmittel'],
  [/\bVial\b/gi, 'Durchstechflasche'],
  [/\bAmpoules\b/gi, 'Ampullen'],
  [/\bAmpoule\b/gi, 'Ampulle'],
  [/\bstrips\b/gi, 'Blisterstreifen'],
  [/\bstrip\b/gi, 'Blisterstreifen'],
  [/\bCream tube\b/gi, 'Cremetube'],
  [/\bOintment tube\b/gi, 'Salbentube'],
  [/\bTopical pack\b/gi, 'Topische Packung'],
  [/\btopical gel\/solution\b/gi, 'topisches Gel / Lösung'],
  [/\bOphthalmic solution\b/gi, 'Augentropfenlösung'],
  [/\bSterile ophthalmic tube\b/gi, 'Sterile Augensalbentube'],
  [/\bParenteral \(IV \/ IM\)\b/gi, 'Parenteral (IV / IM)'],
  [/\bTopical Cutaneous\b/gi, 'Topisch / Kutan (Haut)'],
  [/\bOphthalmic \/ Otic\b/gi, 'Ophthalmisch / Otisch (Auge / Ohr)'],
  [/\bOral Granules \/ Sachets\b/gi, 'Granulat zum Einnehmen / Beutel'],
  [/\bOral Drops\b/gi, 'Tropfen zum Einnehmen'],
  [/\bOral\b/gi, 'Oral (zum Einnehmen)'],
  [/\bNext Step:\b/gi, 'Nächster Schritt:'],
  [/\bSource:\b/gi, 'Quelle:'],
  [/\bAllergy Check:\b/gi, 'Allergie-Prüfung:'],
  [/\bStorage Instruction:\b/gi, 'Lagerungshinweis:'],
  [/\bPrescription Radar\b/gi, 'Rezept-Radar'],
  [/\bAllergy Safety Check\b/gi, 'Allergie-Sicherheitscheck'],
  [/\bInteractions Check\b/gi, 'Wechselwirkungs-Check'],
  [/\bMy Profile\b/gi, 'Mein Profil'],
  [/\bFull Rx Check\b/gi, 'Komplettes Rezept prüfen'],
  [/\bDose Schedule\b/gi, 'Einnahmeplan'],
  [/\bAllergy Check\b/gi, 'Allergie-Check'],
];

export function localizeFallbackText(text: string, lang: Lang): string {
  if (!text || (lang !== 'fr' && lang !== 'es' && lang !== 'de')) return text;
  const rules = lang === 'fr' ? FR_PHRASE_MAP : lang === 'es' ? ES_PHRASE_MAP : DE_PHRASE_MAP;
  let out = text;
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export const tr = (
  lang: Lang,
  ar: string,
  en: string,
  fr?: string,
  es?: string,
  de?: string
): string => {
  if (lang === 'ar') return ar;
  if (lang === 'fr') return fr || localizeFallbackText(en, 'fr');
  if (lang === 'es') return es || localizeFallbackText(en, 'es');
  if (lang === 'de') return de || localizeFallbackText(en, 'de');
  return en;
};

let emergencyTextTransform: ((text: string, lang: Lang) => string) | null = null;

export function registerEmergencyTextTransform(
  fn: (text: string, lang: Lang) => string
): void {
  emergencyTextTransform = fn;
}

export const pick = (b: Bi | undefined, lang: Lang): string => {
  if (!b) return '';
  let out: string;
  if (b[lang]) {
    out = b[lang] as string;
  } else {
    const base = b.en || b.ar || '';
    out =
      lang === 'fr' || lang === 'es' || lang === 'de'
        ? localizeFallbackText(base, lang)
        : base;
  }
  return emergencyTextTransform ? emergencyTextTransform(out, lang) : out;
};
