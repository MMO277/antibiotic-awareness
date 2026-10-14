import { Bi } from './types';

export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type EvidenceStatus = 'patient_reported' | 'suspected' | 'clinically_verified';
export type MatchLevel = 'exact_match' | 'cross_reactivity' | 'no_match' | 'unverified';

export interface AllergyRecord {
  id: string;
  drugName: string;
  allergenKey: string; // e.g. "penicillin", "cephalosporin", "sulfa", "macrolide", "fluoroquinolone", "other"
  reportedSymptoms: string;
  severity: AllergySeverity;
  reactionDate?: string;
  evidenceStatus: EvidenceStatus;
  notes?: string;
  createdAt: string;
}

export interface MedicationRecord {
  id: string;
  drugName: string;
  activeIngredients: string;
  prescribedDose: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued';
  notes?: string;
}

export interface UserHealthProfile {
  displayName: string;
  age: string;
  gender: string;
  bloodType: string;
  emergencyContact: string;
  notes: string;
  allergies: AllergyRecord[];
  medications: MedicationRecord[];
}

const STORAGE_KEY = 'antibiotic_awareness_health_profile';

export const ALLERGEN_CATEGORIES: { id: string; name: Bi; examples: Bi }[] = [
  {
    id: 'penicillin',
    name: { ar: 'عائلة البنسلينات (Penicillins)', en: 'Penicillin Family' },
    examples: { ar: 'أموكسيسيلين، أوجمنتين، إي-موكس، أوسبن، أمبيسيلين', en: 'Amoxicillin, Augmentin, E-Mox, Ospen, Ampicillin' },
  },
  {
    id: 'cephalosporin',
    name: { ar: 'عائلة السيفالوسبورينات (Cephalosporins)', en: 'Cephalosporin Family' },
    examples: { ar: 'سيفالكسين (أوسبكسين)، سيفوروكسيم (زينات)، سيفترياكسون، سوبراكس', en: 'Cephalexin, Cefuroxime (Zinnat), Ceftriaxone, Suprax' },
  },
  {
    id: 'sulfa',
    name: { ar: 'عائلة مركبات السلفا (Sulfonamides)', en: 'Sulfa Drugs (Sulfonamides)' },
    examples: { ar: 'كوتريموكسازول، سبتازول، سوتريم', en: 'Co-trimoxazole, Septazole, Sutrim' },
  },
  {
    id: 'macrolide',
    name: { ar: 'عائلة الماكروليد (Macrolides)', en: 'Macrolide Family' },
    examples: { ar: 'أزيثرومايسين (زيثروماكس/زيثرون)، كلاريثرومايسين (كلاسيد)', en: 'Azithromycin, Clarithromycin (Klacid)' },
  },
  {
    id: 'fluoroquinolone',
    name: { ar: 'عائلة الفلوروكينولون (Fluoroquinolones)', en: 'Fluoroquinolones' },
    examples: { ar: 'سيبروفلوكساسين (سيبروفار)، ليفوفلوكساسين (تافانيك)', en: 'Ciprofloxacin, Levofloxacin (Tavanic)' },
  },
  {
    id: 'tetracycline',
    name: { ar: 'عائلة التتراسيكلين (Tetracyclines)', en: 'Tetracyclines' },
    examples: { ar: 'دوكسيسيكلين (تابوسين، فيبراميسين)', en: 'Doxycycline (Tabocin, Vibramycin)' },
  },
  {
    id: 'nitroimidazole',
    name: { ar: 'ميترونيدازول ومشتقاته (Nitroimidazoles)', en: 'Nitroimidazoles' },
    examples: { ar: 'فلاجيل، أمريزول', en: 'Flagyl, Amrizole' },
  },
  {
    id: 'other',
    name: { ar: 'أدوية أخرى غير مصنفة', en: 'Other Medications' },
    examples: { ar: 'أي دواء أو مادة أخرى', en: 'Other drugs or substances' },
  },
];

export function loadProfile(): UserHealthProfile {
  if (typeof window === 'undefined') {
    return { displayName: '', age: '', gender: '', bloodType: '', emergencyContact: '', notes: '', allergies: [], medications: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { displayName: '', age: '', gender: '', bloodType: '', emergencyContact: '', notes: '', allergies: [], medications: [] };
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load profile:', err);
    return { displayName: '', age: '', gender: '', bloodType: '', emergencyContact: '', notes: '', allergies: [], medications: [] };
  }
}

export function saveProfile(profile: UserHealthProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
}

export interface DrugProfileCheckResult {
  matchLevel: MatchLevel;
  matchedAllergy?: AllergyRecord;
  title: Bi;
  explanation: Bi;
  clinicalAction: Bi;
  nursingWarning: Bi;
}

// Maps medicine IDs from site catalog to allergen family and ingredients
export const DRUG_ALLERGEN_MAP: Record<string, { family: string; ingredients: string[]; nameAr: string }> = {
  'amoxicillin': { family: 'penicillin', ingredients: ['amoxicillin'], nameAr: 'أموكسيسيلين' },
  'amoxicillin-clavulanic-acid': { family: 'penicillin', ingredients: ['amoxicillin', 'clavulanic_acid'], nameAr: 'أموكسيسيلين + كلافولانات (أوجمنتين)' },
  'penicillin-v-potassium': { family: 'penicillin', ingredients: ['penicillin_v'], nameAr: 'بنسلين V (أوسبن)' },
  'cephalexin': { family: 'cephalosporin', ingredients: ['cephalexin'], nameAr: 'سيفالكسين (أوسبكسين)' },
  'cefuroxime': { family: 'cephalosporin', ingredients: ['cefuroxime'], nameAr: 'سيفوروكسيم (زينات)' },
  'ceftriaxone': { family: 'cephalosporin', ingredients: ['ceftriaxone'], nameAr: 'سيفترياكسون' },
  'cefixime': { family: 'cephalosporin', ingredients: ['cefixime'], nameAr: 'سيفيكسيم (سوبراكس)' },
  'co-trimoxazole': { family: 'sulfa', ingredients: ['sulfamethoxazole', 'trimethoprim'], nameAr: 'كوتريموكسازول (سبتازول)' },
  'azithromycin': { family: 'macrolide', ingredients: ['azithromycin'], nameAr: 'أزيثرومايسين (زيثروماكس)' },
  'clarithromycin': { family: 'macrolide', ingredients: ['clarithromycin'], nameAr: 'كلاريثرومايسين (كلاسيد)' },
  'ciprofloxacin': { family: 'fluoroquinolone', ingredients: ['ciprofloxacin'], nameAr: 'سيبروفلوكساسين (سيبروفار)' },
  'levofloxacin': { family: 'fluoroquinolone', ingredients: ['levofloxacin'], nameAr: 'ليفوفلوكساسين (تافانيك)' },
  'doxycycline': { family: 'tetracycline', ingredients: ['doxycycline'], nameAr: 'دوكسيسيكلين (تابوسين)' },
  'metronidazole': { family: 'nitroimidazole', ingredients: ['metronidazole'], nameAr: 'ميترونيدازول (فلاجيل)' },
  'nitrofurantoin': { family: 'nitrofuran', ingredients: ['nitrofurantoin'], nameAr: 'نيتروفورانتوين (ماكروفيوران)' },
  'clindamycin': { family: 'lincosamide', ingredients: ['clindamycin'], nameAr: 'كليندامايسين (دالاسين)' },
  'cefotaxime': { family: 'cephalosporin', ingredients: ['cefotaxime'], nameAr: 'سيفوتاكسيم (سيفوتاكس)' },
  'flucloxacillin': { family: 'penicillin', ingredients: ['flucloxacillin'], nameAr: 'فلوكلوكساسيللين (فلوكسامو)' },
  'amikacin': { family: 'aminoglycoside', ingredients: ['amikacin'], nameAr: 'أميكاسين (أميكين)' },
  'gentamicin': { family: 'aminoglycoside', ingredients: ['gentamicin'], nameAr: 'جنتامايسين (جاراميسين)' },
  'moxifloxacin': { family: 'fluoroquinolone', ingredients: ['moxifloxacin'], nameAr: 'موكسيفلوكساسين (أفيلوكس)' },
  'cefoperazone-sulbactam': { family: 'cephalosporin', ingredients: ['cefoperazone', 'sulbactam'], nameAr: 'سيفوبيرازون + سولباكتام (سيلبيرازون)' },
  'linezolid': { family: 'oxazolidinone', ingredients: ['linezolid'], nameAr: 'لينيزوليد (أفيروزوليد)' },
  'vancomycin': { family: 'glycopeptide', ingredients: ['vancomycin'], nameAr: 'فانكومايسين (فانكوسين)' },
  'meropenem': { family: 'carbapenem', ingredients: ['meropenem'], nameAr: 'ميروبينيم (ميرونيم)' },
  'cefepime': { family: 'cephalosporin', ingredients: ['cefepime'], nameAr: 'سيفيبيم (ماكسيبيم)' },
  'cefdinir': { family: 'cephalosporin', ingredients: ['cefdinir'], nameAr: 'سيفدينير (أومنيسيف / دينار)' },
  'cefadroxil': { family: 'cephalosporin', ingredients: ['cefadroxil'], nameAr: 'سيفادروكسيل (ديوريسيف / بيودروكسيل)' },
  'ampicillin-sulbactam': { family: 'penicillin', ingredients: ['ampicillin', 'sulbactam'], nameAr: 'أمبيسيلين + سولباكتام (يوناسين)' },
  'erythromycin': { family: 'macrolide', ingredients: ['erythromycin'], nameAr: 'إريثرومايسين (إريثروسين)' },
  'fusidic-acid': { family: 'fusidane', ingredients: ['fusidic_acid'], nameAr: 'حمض الفيوسيديك (فيوسيدين)' },
  'rifaximin': { family: 'rifamycin', ingredients: ['rifaximin'], nameAr: 'ريفاكسيمين (تراسيد / جاستروبيوتك)' },
};

/** Evaluates allergy match level and cross-reactivity for a selected drug */
export function checkDrugAllergySafety(
  drugId: string,
  userAllergies: AllergyRecord[]
): DrugProfileCheckResult {
  const drugInfo = DRUG_ALLERGEN_MAP[drugId.toLowerCase().trim()];
  if (!drugInfo) {
    return {
      matchLevel: 'unverified',
      title: { ar: 'معلومات غير مكتملة عن الدواء', en: 'Inconclusive Drug Information' },
      explanation: {
        ar: 'لم نتمكن من مطابقة المادة الفعالة لهذا الدواء في قاعدة البيانات بدقة؛ لا يمكن تأكيد أمان الدواء.',
        en: 'Unable to conclusively resolve the active ingredient against the database.',
      },
      clinicalAction: {
        ar: 'استشر الصيدلي أو الطبيب وأبلغه بتاريخ حساسيتك الدوائية قبل تناول هذا الدواء.',
        en: 'Consult a pharmacist or physician before taking this medication.',
      },
      nursingWarning: {
        ar: 'تحذير تمريضي: فحص الاسم العلمي المطبوع على علبة الدواء يدوياً قبل الإعطاء.',
        en: 'Nursing Note: Manually inspect active ingredient on drug package.',
      },
    };
  }

  // 1. Check Exact Match (Same active ingredient or exact family match)
  const exactMatch = userAllergies.find(
    (a) =>
      a.allergenKey === drugInfo.family ||
      drugInfo.ingredients.some((ing) => a.drugName.toLowerCase().includes(ing)) ||
      a.drugName.toLowerCase().includes(drugId.toLowerCase()),
  );

  if (exactMatch) {
    return {
      matchLevel: 'exact_match',
      matchedAllergy: exactMatch,
      title: { ar: 'خطر حاد! تطابق تام في مادة الحساسية المسجلة', en: 'Severe Warning: Exact Active Ingredient / Family Match' },
      explanation: {
        ar: `هذا الدواء ينتمي إلى «${exactMatch.drugName}» أو يحتوي على نفس المادة الفعالة التي سجلت لديك حساسية مسبقة منها (الأعراض المسجلة: ${exactMatch.reportedSymptoms || 'حساسية مفرطة'}). تناول هذا الدواء قد يحفز صدمة تحسسية حادة.`,
        en: `This drug contains active ingredients from the same family as your recorded allergy (${exactMatch.drugName}). Ingestion risks severe anaphylaxis.`,
      },
      clinicalAction: {
        ar: 'ممنوع تناول هذا الدواء! أبلغ طبيبك المعالج بوجود حساسية مسجلة لاستبداله بمضاد من عائلة كيميائية مختلفة تماماً.',
        en: 'Do NOT take this medication! Notify your doctor to switch to a safe alternative class.',
      },
      nursingWarning: {
        ar: 'تنبيه تمريضي حرج: وضع شريط تنبيه أحمر في ملف المريض وتجنب إعطاء الدواء، والتأكد من توفر حقن الإبينفرين (الأدرينالين).',
        en: 'Critical Nursing Alert: Red allergy band required; withhold dose and ensure epinephrine availability.',
      },
    };
  }

  // 2. Check Cross-Reactivity (e.g. Penicillin vs Cephalosporins)
  const hasPenicillinAllergy = userAllergies.some((a) => a.allergenKey === 'penicillin');
  if (hasPenicillinAllergy && drugInfo.family === 'cephalosporin') {
    const penAllergy = userAllergies.find((a) => a.allergenKey === 'penicillin')!;
    return {
      matchLevel: 'cross_reactivity',
      matchedAllergy: penAllergy,
      title: { ar: 'تحذير سريري: احتمالية حساسية متصالبة (Cross-Reactivity)', en: 'Clinical Concern: Potential Cross-Reactivity' },
      explanation: {
        ar: `لديك حساسية مسجلة من البنسلين، وهذا الدواء ينتمي لعائلة السيفالوسبورينات. توجد نسبة حساسية متصالبة سريرية (نحو 2% إلى 5%) بسبب التشابه في التركيب الحلقي لبيتا-لاكتام، خاصة إذا كانت حساسيتك السابقة شديدة.`,
        en: `You have a documented penicillin allergy, and this drug is a cephalosporin. There is a documented 2-5% cross-reactivity risk due to shared beta-lactam structures.`,
      },
      clinicalAction: {
        ar: 'يلزم تقييم طبي دقيق قبل التناول! قد ينصح الطبيب بإجراء اختبار حساسية جلدي، أو اختيار مضاد آمن من خارج عائلة بيتا-لاكتام (كالماكروليد).',
        en: 'Requires medical assessment prior to use. Skin testing or alternative non-beta-lactam class may be advised.',
      },
      nursingWarning: {
        ar: 'تقييم تمريضي سريري: التحقق من شدة الحساسية السابقة للبنسلين (هل كانت طفحاً خفيفاً أم صعوبة تنفس؟) ومراقبة المريض 30 دقيقة بعد أول جرعة.',
        en: 'Nursing Assessment: Differentiate mild cutaneous rash vs true IgE-mediated anaphylaxis history.',
      },
    };
  }

  // 3. No match found in available recorded data
  return {
    matchLevel: 'no_match',
    title: { ar: 'لم يُعثر على تطابق مع سجلات الحساسية المسجلة', en: 'No Match Found with Documented Allergies' },
    explanation: {
      ar: `هذا الدواء لا يتطابق مع أي من الأدوية أو العائلات المسجلة في سجل حساسيتك الحالي.`,
      en: `This medication does not match any drug family currently documented in your profile.`,
    },
    clinicalAction: {
      ar: 'يمكن تناوله وفق الوصفة الطبية المعتمدة. احرص دائماً على إبلاغ الطبيب والصيدلي بأي أعراض جديدة تظهر لأول مرة.',
      en: 'Take as prescribed. Always report any unexpected symptoms to your healthcare provider.',
    },
    nursingWarning: {
      ar: 'تنبيه تمريضي: عدم وجود تطابق مسجل لا يضمن عدم حدوث حساسية جديدة لأول مرة؛ راقب علامات التحسس المبكرة.',
      en: 'Nursing Note: Absence of recorded allergy does not guarantee immunity from de novo reactions.',
    },
  };
}
