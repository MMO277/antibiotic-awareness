export type Lang = 'ar' | 'en';
export type Bi = { ar: string; en: string };
export type Status = 'draft' | 'pending_review' | 'approved' | 'archived';
export const STATUSES: Status[] = ['draft', 'pending_review', 'approved', 'archived'];

export const TEXT_FIELDS = [
  'genericName',
  'activeIngredients',
  'drugClass',
  'mechanism',
  'strengths',
  'approvedUses',
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
  genericName: { ar: 'الاسم العلمي', en: 'Generic name' },
  activeIngredients: { ar: 'المواد الفعالة', en: 'Active ingredients' },
  drugClass: { ar: 'الفئة الدوائية', en: 'Drug class' },
  mechanism: { ar: 'آلية العمل', en: 'Mechanism of action' },
  strengths: { ar: 'التراكيز المتوفرة', en: 'Strengths' },
  approvedUses: { ar: 'الاستخدامات المعتمدة', en: 'Approved uses' },
  ageRestrictions: { ar: 'قيود العمر', en: 'Age restrictions' },
  dosingReference: { ar: 'مرجع الجرعات (للاطلاع فقط)', en: 'Dosing reference (information only)' },
  contraindications: { ar: 'موانع الاستعمال', en: 'Contraindications' },
  sideEffects: { ar: 'الآثار الجانبية', en: 'Side effects' },
  interactions: { ar: 'التداخلات الدوائية', en: 'Interactions' },
  pregnancyBreastfeeding: { ar: 'الحمل والرضاعة', en: 'Pregnancy & breastfeeding' },
  renalHepatic: { ar: 'احتياطات الكلى والكبد', en: 'Renal & hepatic precautions' },
  patientEducation: { ar: 'تثقيف المريض', en: 'Patient education' },
};

export interface Brand {
  name: string;
  manufacturer: string;
  barcode: string;
  verified: boolean; // true only after checking an official source
  sourceUrl: string; // page that proves this brand/barcode
}

export interface Source {
  title: string;
  url: string;
  publisher?: string; // organisation that published the page
  updated?: string; // YYYY-MM-DD, last update date shown on the source (if any)
  accessed?: string; // YYYY-MM-DD, the day a person actually read the page
}

export type Medicine = Record<TextField, Bi> & {
  id: string;
  status: Status;
  brands: Brand[];
  barcodes: string[]; // computed on save from VERIFIED brands only
  sources: Source[];
  lastReviewed: string; // YYYY-MM-DD
  reviewedBy: string;
  notes: string; // internal notes for staff
};

export function emptyMedicine(id = ''): Medicine {
  const texts = Object.fromEntries(
    TEXT_FIELDS.map((f) => [f, { ar: '', en: '' }]),
  ) as Record<TextField, Bi>;
  return {
    ...texts,
    id,
    status: 'draft',
    brands: [],
    barcodes: [],
    sources: [],
    lastReviewed: '',
    reviewedBy: '',
    notes: '',
  };
}

export const pick = (b: Bi | undefined, lang: Lang): string =>
  (b && (b[lang] || b[lang === 'ar' ? 'en' : 'ar'])) || '';
