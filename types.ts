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
  genericName: { ar: 'الاسم العلمي', en: 'Generic name' },
  activeIngredients: { ar: 'المواد الفعالة', en: 'Active ingredients' },
  drugClass: { ar: 'الفئة الدوائية', en: 'Drug class' },
  mechanism: { ar: 'آلية العمل', en: 'Mechanism of action' },
  strengths: { ar: 'التراكيز والأشكال المتوفرة', en: 'Strengths & dosage forms' },
  approvedUses: { ar: 'الاستخدامات الطبية المعتمدة', en: 'Approved medical uses' },
  priceEgypt: { ar: 'السعر في السوق المصري (EGP)', en: 'Price in Egyptian Market (EGP)' },
  substitutes: { ar: 'البدائل والمثائل الدوائية المتاحة في مصر', en: 'Available Substitutes in Egypt' },
  ageRestrictions: { ar: 'قيود العمر', en: 'Age restrictions' },
  dosingReference: { ar: 'مرجع الجرعات (للاطلاع فقط)', en: 'Dosing reference (information only)' },
  contraindications: { ar: 'موانع الاستعمال', en: 'Contraindications' },
  sideEffects: { ar: 'الآثار الجانبية', en: 'Side effects' },
  interactions: { ar: 'التداخلات الدوائية والغذائية', en: 'Drug & food interactions' },
  pregnancyBreastfeeding: { ar: 'الحمل والرضاعة', en: 'Pregnancy & breastfeeding' },
  renalHepatic: { ar: 'احتياطات الكلى والكبد', en: 'Renal & hepatic precautions' },
  patientEducation: { ar: 'إرشادات وتثقيف المريض', en: 'Patient education' },
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
    TEXT_FIELDS.map((f) => [f, { ar: '', en: '' }]),
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

export const pick = (b: Bi | undefined, lang: Lang): string => (b ? b[lang] || b.en || b.ar || '' : '');
