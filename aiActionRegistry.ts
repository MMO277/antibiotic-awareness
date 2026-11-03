/**
 * aiActionRegistry.ts
 *
 * Structured Action & Tool-Calling Registry for the Antibiotic Awareness
 * Personal Health Assistant — with full Egyptian Colloquial Arabic (مصري عامي)
 * and English NLU + AI Tool-Calling parser.
 */

import { Lang } from './types';
import {
  DRUG_ALLERGEN_MAP,
  resolveCanonicalAllergenDrugId,
} from './allergyData';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import { norm } from './search';
import { parsePrescriptionTextDeterministically } from './geminiApi';
import { extractMultiplePrescriptionItemsFromText } from './aiDocumentProcessor';
import {
  AddAllergyArgs,
  AddChronicConditionArgs,
  AddMedicationArgs,
  AddPrescriptionArgs,
  AiActionPayloadMap,
  AiActionRiskLevel,
  AiActionType,
  CreateReminderArgs,
  RemoveAllergyArgs,
  RemoveChronicConditionArgs,
  RemoveMedicationArgs,
  StopReminderArgs,
  UpdatePrescriptionStatusArgs,
  UpdateReminderArgs,
  UpdateVitalsArgs,
  validateActionArguments,
} from './aiActionSchemas';
import { getActionRiskLevel } from './aiActionPermissions';

export interface AiActionDefinition<K extends AiActionType = AiActionType> {
  type: K;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  riskLevel: AiActionRiskLevel;
  icon: string;
}

export const AI_ACTION_REGISTRY: Record<AiActionType, AiActionDefinition> = {
  add_chronic_condition: {
    type: 'add_chronic_condition',
    titleAr: 'إضافة مرض مزمن أو حالة صحية لملفك',
    titleEn: 'Add Medical Condition to Health Profile',
    descriptionAr: 'بيسجل الحالة الصحية في ملفك الشخصي بعد ما تأكد عليها.',
    descriptionEn: 'Records a patient-reported medical condition in the Health Profile after confirmation.',
    riskLevel: 'confirmation_required',
    icon: '🏥',
  },
  remove_chronic_condition: {
    type: 'remove_chronic_condition',
    titleAr: 'حذف حالة صحية من ملفك',
    titleEn: 'Remove Condition from Health Profile',
    descriptionAr: 'بيشيل المرض المزمن أو الحالة الصحية من ملفك بعد تأكيدك.',
    descriptionEn: 'Removes a medical condition from your Health Profile after confirmation.',
    riskLevel: 'confirmation_required',
    icon: '🗑️',
  },
  add_allergy: {
    type: 'add_allergy',
    titleAr: 'تسجيل حساسية من دوا في ملفك',
    titleEn: 'Add Drug Allergy to Health Profile',
    descriptionAr: 'بيضيف الدوا أو العيلة الدوائية لسجل حساسيتك عشان نحذرك من أي تعارض.',
    descriptionEn: 'Adds a medication or drug class allergy to the patient profile for safety checks.',
    riskLevel: 'confirmation_required',
    icon: '🚨',
  },
  remove_allergy: {
    type: 'remove_allergy',
    titleAr: 'حذف حساسية دوا من ملفك',
    titleEn: 'Remove Drug Allergy from Health Profile',
    descriptionAr: 'بيمسح حساسية الدوا دي من سجل حساسيتك بعد تأكيدك.',
    descriptionEn: 'Removes a drug allergy record from your Health Profile after confirmation.',
    riskLevel: 'confirmation_required',
    icon: '🗑️',
  },
  update_vitals: {
    type: 'update_vitals',
    titleAr: 'تحديث بياناتك الشخصية والحيوية',
    titleEn: 'Update Health Profile Vitals & Details',
    descriptionAr: 'بيحدث الوزن أو السن أو الاسم أو فصيلة الدم أو حالة الكلى/الكبد/الحمل في ملفك.',
    descriptionEn: 'Updates weight, age, blood type, or organ/pregnancy status in the Health Profile.',
    riskLevel: 'confirmation_required',
    icon: '⚖️',
  },
  add_medication: {
    type: 'add_medication',
    titleAr: 'إضافة دوا لقايمة أدويتك الحالية',
    titleEn: 'Add Medicine to Current Medication List',
    descriptionAr: 'بيضيف الدوا لأدويتك اللي ماشي عليها دلوقتي مع فحص الحساسية والتداخلات.',
    descriptionEn: 'Adds a medication to the active medication list with allergy and interaction checks.',
    riskLevel: 'confirmation_required',
    icon: '💊',
  },
  remove_medication: {
    type: 'remove_medication',
    titleAr: 'إيقاف أو حذف دوا من قايمة أدويتك',
    titleEn: 'Remove / Discontinue Medicine from List',
    descriptionAr: 'بيشيل الدوا أو يوقفه من قايمة أدويتك الحالية بعد تأكيدك.',
    descriptionEn: 'Removes or discontinues a medication from your current medication list.',
    riskLevel: 'confirmation_required',
    icon: '🗑️',
  },
  add_prescription: {
    type: 'add_prescription',
    titleAr: 'إضافة روشتة لحسابك (رادار الروشتة)',
    titleEn: 'Add Prescription to My Account (Prescription Radar)',
    descriptionAr: 'بيحفظ الروشتة وأدويتها في رادار الروشتة مع فحص الأمان الدوائي.',
    descriptionEn: 'Saves a prescription and its medications into Prescription Radar with safety verification.',
    riskLevel: 'confirmation_required',
    icon: '📋',
  },
  update_prescription_status: {
    type: 'update_prescription_status',
    titleAr: 'تحديث حالة الروشتة',
    titleEn: 'Update Prescription Status',
    descriptionAr: 'بيحدث حالة توثيق الروشتة في حسابك.',
    descriptionEn: 'Updates the verification status of a saved prescription.',
    riskLevel: 'confirmation_required',
    icon: '✅',
  },
  create_reminder: {
    type: 'create_reminder',
    titleAr: 'تظبيط منبه وجدول مواعيد الدوا',
    titleEn: 'Create Medication Dose Reminder Schedule',
    descriptionAr: 'بيعملك جدول مواعيد وتنبيهات للجرعات في المتابع العلاجي.',
    descriptionEn: 'Creates a recurring medication dose reminder schedule in the tracker.',
    riskLevel: 'confirmation_required',
    icon: '⏰',
  },
  update_reminder: {
    type: 'update_reminder',
    titleAr: 'تعديل مواعيد منبه الدوا',
    titleEn: 'Modify Medication Reminder Schedule',
    descriptionAr: 'بيعدل مواعيد الجرعات اليومية أو مدة التذكير لجدول شغال عندك.',
    descriptionEn: 'Modifies daily dose times or duration for an existing reminder schedule.',
    riskLevel: 'confirmation_required',
    icon: '🕒',
  },
  stop_reminder: {
    type: 'stop_reminder',
    titleAr: 'إيقاف / مسح منبه الدوا',
    titleEn: 'Stop / Remove Medication Reminder',
    descriptionAr: 'بيوقف ويمسح جدول التذكير ده بعد تأكيدك.',
    descriptionEn: 'Stops and removes the specified medication reminder schedule after confirmation.',
    riskLevel: 'confirmation_required',
    icon: '🔕',
  },
  save_medical_document: {
    type: 'save_medical_document',
    titleAr: 'حفظ صورة روشتة أو تحليل في حسابك',
    titleEn: 'Save Medical Image / Document to Account',
    descriptionAr: 'بيحفظ الصورة أو التقرير الطبي في حسابك مع البيانات اللي استخرجناها.',
    descriptionEn: 'Saves the uploaded medical image/report and extracted metadata to the patient account.',
    riskLevel: 'confirmation_required',
    icon: '📄',
  },
  show_allergies: {
    type: 'show_allergies',
    titleAr: 'عرض سجل الحساسية الدوائية',
    titleEn: 'Show Current Drug Allergies',
    descriptionAr: 'بيعرض كل الحساسيات المتسجلة في ملفك.',
    descriptionEn: 'Displays the patient’s documented drug allergies.',
    riskLevel: 'read_only',
    icon: '🛡️',
  },
  show_medications: {
    type: 'show_medications',
    titleAr: 'عرض قايمة أدويتك الحالية',
    titleEn: 'Show Current Medications',
    descriptionAr: 'بيعرض الأدوية اللي بتاخدها ومتسجلة في ملفك الصحي.',
    descriptionEn: 'Displays active and past medications in the patient’s Health Profile.',
    riskLevel: 'read_only',
    icon: '💊',
  },
  show_reminders: {
    type: 'show_reminders',
    titleAr: 'عرض منبهات ومواعيد الجرعات',
    titleEn: 'Show Medication Reminders & Schedules',
    descriptionAr: 'بيعرض جداول التذكير الشغالة ومواعيد جرعاتك الجاية.',
    descriptionEn: 'Displays active medication reminders and upcoming dose times.',
    riskLevel: 'read_only',
    icon: '⏰',
  },
  show_prescriptions: {
    type: 'show_prescriptions',
    titleAr: 'عرض الروشتات المحفوظة',
    titleEn: 'Show Saved Prescriptions',
    descriptionAr: 'بيعرض الروشتات المتسجلة وحالتها في رادار الروشتة.',
    descriptionEn: 'Displays saved prescriptions and their verification status.',
    riskLevel: 'read_only',
    icon: '📋',
  },
  show_medical_documents: {
    type: 'show_medical_documents',
    titleAr: 'عرض التقارير والتحاليل الطبية',
    titleEn: 'Show Medical Reports & Documents',
    descriptionAr: 'بيعرض آخر التقارير والتحاليل المرفوعة في حسابك.',
    descriptionEn: 'Displays uploaded medical reports, lab results, and documents.',
    riskLevel: 'read_only',
    icon: '📂',
  },
  summarize_health_records: {
    type: 'summarize_health_records',
    titleAr: 'ملخص كامل لملفك الصحي',
    titleEn: 'Summarize Complete Patient Health Records',
    descriptionAr: 'بيلخص بياناتك، حساسيتك، الأمراض المزمنة، أدويتك، ومواعيد جرعاتك.',
    descriptionEn: 'Summarizes vitals, allergies, chronic conditions, medications, reminders, and documents.',
    riskLevel: 'read_only',
    icon: '📊',
  },
};

export interface DetectedActionIntent<K extends AiActionType = AiActionType> {
  matched: boolean;
  actionType?: K;
  riskLevel?: AiActionRiskLevel;
  args?: AiActionPayloadMap[K];
  conversationalLeadAr?: string;
  conversationalLeadEn?: string;
  needsClarification?: boolean;
  clarificationQuestionAr?: string;
  clarificationQuestionEn?: string;
  missingFields?: string[];
  safetyRefusal?: {
    refused: true;
    reasonCode: 'no_double_dose' | 'no_diagnosis' | 'no_unprescribed_antibiotic';
    messageAr: string;
    messageEn: string;
  };
}

const KNOWN_CONDITIONS_MAP: Array<{ pattern: RegExp; nameAr: string; nameEn: string }> = [
  { pattern: /(type\s*1\s*diabetes|سكري?\s*النوع\s*(الأول|الاول|1))/i, nameAr: 'السكري من النوع الأول (Type 1 Diabetes)', nameEn: 'Type 1 Diabetes' },
  { pattern: /(type\s*2\s*diabetes|سكري?\s*النوع\s*(الثاني|التاني|2))/i, nameAr: 'السكري من النوع الثاني (Type 2 Diabetes)', nameEn: 'Type 2 Diabetes' },
  { pattern: /(diabetes|diabetic|السكري|مرض السكر|سكر\b|السكر\b)/i, nameAr: 'مرض السكري (Diabetes Mellitus)', nameEn: 'Diabetes Mellitus' },
  { pattern: /(hypertension|high blood pressure|ضغط الدم المرتفع|ارتفاع ضغط الدم|الضغط العالي|مرض الضغط|ضغط عالي|الضغط\b|\bضغط\b)/i, nameAr: 'ارتفاع ضغط الدم (Hypertension)', nameEn: 'Hypertension' },
  { pattern: /(asthma|ربو|الربو|حساسية صدر|حساسيه صدر|صدر حساس)/i, nameAr: 'الربو وحساسية الصدر (Asthma)', nameEn: 'Asthma' },
  { pattern: /(chronic kidney|renal failure|kidney disease|قصور الكلى|ضعف الكلى|مرض الكلى|فشل كلوي|تعب في الكلى|كلى)/i, nameAr: 'قصور وظائف الكلى (Chronic Kidney Disease)', nameEn: 'Chronic Kidney Disease' },
  { pattern: /(liver disease|hepatic impairment|cirrhosis|قصور الكبد|تليف الكبد|مرض الكبد|تعب في الكبد|كبد)/i, nameAr: 'اعتلال وظائف الكبد (Hepatic Condition)', nameEn: 'Hepatic Condition' },
  { pattern: /(heart failure|coronary|cardiac|قصور القلب|مرض القلب|القلب|ضعف عضلة القلب)/i, nameAr: 'أمراض القلب (Cardiac Condition)', nameEn: 'Cardiac Condition' },
  { pattern: /(g6pd|favism|أنيميا الفول|انيميا الفول|انيميا)/i, nameAr: 'أنيميا الفول (G6PD Deficiency)', nameEn: 'G6PD Deficiency (Favism)' },
  { pattern: /(peptic ulcer|stomach ulcer|قرحة المعدة|قرحه المعده|التهاب المعدة|التهاب معده)/i, nameAr: 'قرحة والتهاب المعدة (Peptic Ulcer)', nameEn: 'Peptic Ulcer Disease' },
  { pattern: /(hypothyroidism|hyperthyroidism|thyroid|الغدة الدرقية|الغده الدرقيه|خمول الغدة|نشاط الغدة|الغدة)/i, nameAr: 'اضطراب الغدة الدرقية (Thyroid Disorder)', nameEn: 'Thyroid Disorder' },
  { pattern: /(cholesterol|hyperlipidemia|دهون الدم|كوليسترول|الكوليسترول)/i, nameAr: 'ارتفاع الكوليسترول ودهون الدم (Hyperlipidemia)', nameEn: 'Hyperlipidemia' },
];

/**
 * Resolves any known medicine or antibiotic mentioned in a natural-language sentence.
 */
export function extractMedicationFromSentence(text: string): {
  drugName: string;
  antibioticId?: string;
  activeIngredients?: string;
  allergenFamily?: string;
} | null {
  const clean = text.trim();
  const normText = norm(clean);

  // 1. Check Egyptian Commercial Products first
  for (const prod of EGYPTIAN_COMMERCIAL_PRODUCTS) {
    const tAr = norm(prod.tradeNameAr);
    const tEn = norm(prod.tradeNameEn);
    const firstAr = tAr.split(/\s+/)[0] || '';
    const firstEn = tEn.split(/\s+/)[0] || '';
    if (
      (firstEn.length >= 4 && normText.includes(firstEn)) ||
      (firstAr.length >= 3 && normText.includes(firstAr))
    ) {
      const ing = ACTIVE_INGREDIENTS.find((i) => i.id === prod.activeIngredientId);
      const mapEntry = DRUG_ALLERGEN_MAP[prod.activeIngredientId];
      return {
        drugName: /[\u0600-\u06FF]/.test(clean) ? prod.tradeNameAr : prod.tradeNameEn,
        antibioticId: prod.activeIngredientId,
        activeIngredients: ing ? `${ing.nameEn} (${ing.nameAr})` : prod.activeIngredientId,
        allergenFamily: mapEntry?.family || 'other',
      };
    }
  }

  // 2. Check Active Ingredients
  for (const ing of ACTIVE_INGREDIENTS) {
    const nAr = norm(ing.nameAr);
    const nEn = norm(ing.nameEn);
    const firstAr = nAr.split(/\s+/)[0] || '';
    const firstEn = nEn.split(/\s+/)[0] || '';
    if (
      (firstEn.length >= 4 && normText.includes(firstEn)) ||
      (firstAr.length >= 3 && normText.includes(firstAr))
    ) {
      const mapEntry = DRUG_ALLERGEN_MAP[ing.id];
      return {
        drugName: /[\u0600-\u06FF]/.test(clean) ? ing.nameAr : ing.nameEn,
        antibioticId: ing.id,
        activeIngredients: `${ing.nameEn} (${ing.nameAr})`,
        allergenFamily: mapEntry?.family || 'other',
      };
    }
  }

  // 3. Check general allergen categories & common Egyptian phonetic spellings
  if (/(penicillin|بنسلين|بنسيلين|البنسلين|البنسيلين)/i.test(clean)) {
    return {
      drugName: /[\u0600-\u06FF]/.test(clean) ? 'عائلة البنسلين (Penicillin)' : 'Penicillin',
      antibioticId: 'penicillin-v-potassium',
      activeIngredients: 'Penicillin / Beta-Lactam',
      allergenFamily: 'penicillin',
    };
  }
  if (/(sulfa|sulfonamide|سلفا|السلفا|سالفا)/i.test(clean)) {
    return {
      drugName: /[\u0600-\u06FF]/.test(clean) ? 'مركبات السلفا (Sulfa)' : 'Sulfa (Sulfonamides)',
      antibioticId: 'co-trimoxazole',
      activeIngredients: 'Sulfonamides',
      allergenFamily: 'sulfa',
    };
  }
  if (/(cephalosporin|سيفالوسبورين|كيبوركس|زينات|روسيثين|سوبراكس)/i.test(clean)) {
    return {
      drugName: /[\u0600-\u06FF]/.test(clean) ? 'عائلة السيفالوسبورين (Cephalosporins)' : 'Cephalosporins',
      antibioticId: 'cephalexin',
      activeIngredients: 'Cephalosporins',
      allergenFamily: 'cephalosporin',
    };
  }
  if (/(macrolide|ماكروليد)/i.test(clean)) {
    return {
      drugName: /[\u0600-\u06FF]/.test(clean) ? 'عائلة الماكروليد (Macrolides)' : 'Macrolides',
      antibioticId: 'azithromycin',
      activeIngredients: 'Macrolides',
      allergenFamily: 'macrolide',
    };
  }
  if (/(fluoroquinolone|فلوروكينولون)/i.test(clean)) {
    return {
      drugName: /[\u0600-\u06FF]/.test(clean) ? 'عائلة الفلوروكينولون (Fluoroquinolones)' : 'Fluoroquinolones',
      antibioticId: 'ciprofloxacin',
      activeIngredients: 'Fluoroquinolones',
      allergenFamily: 'fluoroquinolone',
    };
  }
  if (/(tetracycline|تتراسيكلين)/i.test(clean)) {
    return {
      drugName: /[\u0600-\u06FF]/.test(clean) ? 'عائلة التتراسيكلين (Tetracyclines)' : 'Tetracyclines',
      antibioticId: 'doxycycline',
      activeIngredients: 'Tetracyclines',
      allergenFamily: 'tetracycline',
    };
  }

  // 4. Common co-medications & chronic medications in Egypt
  const commonMeds: Array<{ re: RegExp; en: string; ar: string }> = [
    { re: /(panadol|paracetamol|بانادول|بنادول|باراسيتامول|سيتال|أبيمول|ابيمول|ادول)/i, en: 'Paracetamol (Panadol)', ar: 'باراسيتامول (بانادول)' },
    { re: /(brufen|ibuprofen|بروفين|إيبوبروفين|ايبوبروفين)/i, en: 'Ibuprofen (Brufen)', ar: 'بروفين (إيبوبروفين)' },
    { re: /(cataflam|voltaren|diclofenac|كتافلام|فولتارين|كيتوفان)/i, en: 'Diclofenac (Cataflam)', ar: 'كتافلام / فولتارين' },
    { re: /(warfarin|marevan|وارفارين|ماريفان)/i, en: 'Warfarin (Marevan)', ar: 'ماريفان (وارفارين للسيولة)' },
    { re: /(metformin|glucophage|ميتفورمين|جلوكوفاج|سيدوفاج)/i, en: 'Metformin (Glucophage)', ar: 'جلوكوفاج / سيدوفاج (ميتفورمين)' },
    { re: /(concor|bisoprolol|كونكور)/i, en: 'Concor (Bisoprolol)', ar: 'كونكور (لعلاج الضغط)' },
    { re: /(omeprazole|antodine|controloc|أوميبرازول|اوميبرازول|أنتودين|انتودين|كونترولوك)/i, en: 'Omeprazole / Controloc', ar: 'أوميبرازول / كونترولوك (للمعدة)' },
    { re: /(aspirin|jusprin|أسبرين|اسبرين|جوسبرين)/i, en: 'Aspirin', ar: 'أسبرين / جوسبرين' },
  ];
  for (const cm of commonMeds) {
    if (cm.re.test(clean)) {
      return {
        drugName: /[\u0600-\u06FF]/.test(clean) ? cm.ar : cm.en,
        activeIngredients: cm.en,
        allergenFamily: 'other',
      };
    }
  }

  return null;
}

/**
 * Extracts explicit clock times or interval times from natural language in Egyptian Arabic or English
 * (e.g., "at 8 AM and 8 PM", "الساعة 8 الصبح و 8 بالليل", "كل 12 ساعة", "كل 8 ساعات").
 */
export function extractClockTimesFromText(raw: string): string[] {
  const normalizedDigits = raw.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const times: string[] = [];

  const regexFull =
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|صباحا|صباحاً|الصبح|ص|مساء|مساءً|بالليل|بليل|ليلا|ليلاً|م|ظهرا|ظهراً|الضهر|الظهر|عصرا|عصراً|العصر|الفجر)\b/gi;
  for (const m of normalizedDigits.matchAll(regexFull)) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const period = (m[3] || '').toLowerCase().replace(/\./g, '');
    if (h < 0 || h > 23 || min < 0 || min > 59) continue;

    const isPm =
      period === 'pm' ||
      period === 'م' ||
      period.includes('مساء') ||
      period.includes('ليل') ||
      period.includes('عصر') ||
      period.includes('ظهر') ||
      period.includes('ضهر');
    const isAm =
      period === 'am' ||
      period === 'ص' ||
      period.includes('صباح') ||
      period.includes('صبح') ||
      period.includes('فجر');

    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;

    const formatted = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    if (!times.includes(formatted)) times.push(formatted);
  }

  const regex24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;
  for (const m of normalizedDigits.matchAll(regex24)) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const formatted = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    if (!times.includes(formatted)) times.push(formatted);
  }

  if (times.length === 0) {
    const bareHourMatches = Array.from(
      normalizedDigits.matchAll(/(?:\bat\b|الساعة|الساعه)\s*(\d{1,2})(?:\s*(?:و|and)\s*(\d{1,2}))?/gi)
    );
    for (const bm of bareHourMatches) {
      const h1 = parseInt(bm[1], 10);
      if (!isNaN(h1) && h1 >= 0 && h1 <= 23) {
        const t1 = `${String(h1).padStart(2, '0')}:00`;
        if (!times.includes(t1)) times.push(t1);
      }
      if (bm[2]) {
        let h2 = parseInt(bm[2], 10);
        if (!isNaN(h2) && h2 >= 1 && h2 <= 12 && h1 <= 12) {
          h2 = (h2 + 12) % 24;
        }
        if (!isNaN(h2) && h2 >= 0 && h2 <= 23) {
          const t2 = `${String(h2).padStart(2, '0')}:00`;
          if (!times.includes(t2)) times.push(t2);
        }
      }
    }
  }

  // If patient says "كل 12 ساعة" / "مرتين في اليوم" / "every 12 hours" without a specific hour, default to 09:00 and 21:00
  if (times.length === 0) {
    if (/(كل\s*12\s*ساع|مرتين\s*(?:في\s*)?اليوم|مرتين\s*يوميا|every\s*12\s*h|twice\s*daily)/i.test(normalizedDigits)) {
      times.push('09:00', '21:00');
    } else if (/(كل\s*8\s*ساع|3\s*مرات|ثلاث\s*مرات|تلات\s*مرات|every\s*8\s*h|three\s*times)/i.test(normalizedDigits)) {
      times.push('08:00', '16:00', '00:00');
    } else if (/(كل\s*6\s*ساع|4\s*مرات|اربع\s*مرات|أربع\s*مرات|every\s*6\s*h|four\s*times)/i.test(normalizedDigits)) {
      times.push('06:00', '12:00', '18:00', '00:00');
    } else if (/(كل\s*24\s*ساع|مرة\s*(?:واحدة\s*)?(?:في\s*)?اليوم|مره\s*في\s*اليوم|once\s*daily|every\s*24\s*h)/i.test(normalizedDigits)) {
      times.push('09:00');
    }
  }

  return times;
}

/**
 * Primary NLU & Tool-Calling Intent Detector supporting Egyptian Colloquial Arabic (مصري عامي) and English.
 */
export function detectPatientActionIntent(
  rawText: string,
  lang: Lang,
  contextMedName?: string
): DetectedActionIntent {
  const text = (rawText || '').trim();
  if (!text) return { matched: false };

  const normalizedDigits = text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const lower = normalizedDigits.toLowerCase();

  // ── 0. MANDATORY MEDICAL SAFETY GUARDRAILS ──────────────────────────────────
  if (
    /(double\s*(?:my|the|a)?\s*(?:missed\s*)?dose|take\s*(?:two|2|double)\s*doses\s*(?:at\s*once|together)|أضاعف\s*الجرعة|اضاعف\s*الجرعه|آخد\s*جرعتين\s*مع\s*بعض|اخد\s*جرعتين|اخد\s*حبايتين\s*عشان\s*نسيت|اخد\s*قرصين\s*عشان\s*نسيت|مضاعفة\s*الجرعة)/i.test(
      normalizedDigits
    )
  ) {
    return {
      matched: true,
      safetyRefusal: {
        refused: true,
        reasonCode: 'no_double_dose',
        messageAr:
          '⚠️ خلي بالك يا فندم، أوعى تضاعف الجرعة أبداً أو تاخد حبايتين مع بعض عشان تعوض الجرعة اللي نسيتها! مضاعفة جرعة المضاد الحيوي خطر وممكن تعمل تسمم دوائي أو آثار جانبية شديدة.\n\nالصح إيه؟ لو افتكرت الجرعة قريب من ميعادها خدها عادي، لكن لو ميعاد الجرعة اللي بعدها قرب خلاص، فوّت الجرعة اللي نسيتها وكمل في مواعيدك الطبيعية، وراجع الصيدلي أو الدكتور لو محتار.',
        messageEn:
          '⚠️ Mandatory Medication Safety Rule: NEVER double a dose to make up for a missed dose! Doubling an antibiotic dose increases toxicity and severe side-effect risks. Take the missed dose only if remembered soon, or skip it if the next scheduled dose is near, and consult your pharmacist or physician.',
      },
    };
  }

  // ── 1. READ-ONLY PATIENT RECORD QUERIES ─────────────────────────────────────
  if (
    /(show\s*(?:me\s*)?(?:my\s*)?(?:current\s*)?allerg|what\s*allergies\s*do\s*i\s*have|list\s*my\s*allerg|(?:اعرض|وريني|قولي|شوفلي|هات)\s*(?:لي\s*)?(?:سجل\s*)?حساسي|ايه\s*الحساسي(?:ة|ه)\s*اللي\s*عندي|ما\s*هي\s*حساسياتي|انا\s*عندي\s*حساسية\s*من\s*ايه)/i.test(
      normalizedDigits
    )
  ) {
    return {
      matched: true,
      actionType: 'show_allergies',
      riskLevel: 'read_only',
      args: {},
    };
  }

  if (
    /(show\s*(?:me\s*)?(?:my\s*)?(?:current\s*)?medications?|what\s*medications?\s*(?:am\s*i\s*taking|do\s*i\s*take)|list\s*my\s*medicines?|show\s*my\s*drugs|(?:اعرض|وريني|قولي|شوفلي|هات)\s*(?:لي\s*)?(?:قايمة\s*|قائمة\s*)?(?:أدويتي|ادويتي|علاجي)|ايه\s*(?:الأدوية|الادويه|العلاج)\s*اللي\s*(?:باخدها|ماشي\s*عليها|عندي)|ما\s*هي\s*أدويتي)/i.test(
      normalizedDigits
    )
  ) {
    return {
      matched: true,
      actionType: 'show_medications',
      riskLevel: 'read_only',
      args: {},
    };
  }

  if (
    /(show\s*(?:me\s*)?(?:my\s*)?(?:medication\s*)?reminders?|list\s*(?:my\s*)?reminders?|what\s*are\s*my\s*(?:dose\s*)?reminders?|(?:اعرض|وريني|قولي|شوفلي|هات)\s*(?:لي\s*)?(?:تذكيراتي|مواعيد\s*جرعاتي|مواعيد\s*الدوا|منبهات\s*الأدوية|المنبهات)|مواعيد\s*أدويتي\s*امتى|عندي\s*جرعات\s*امتى)/i.test(
      normalizedDigits
    )
  ) {
    return {
      matched: true,
      actionType: 'show_reminders',
      riskLevel: 'read_only',
      args: {},
    };
  }

  if (
    /(find\s*my\s*last\s*prescription|show\s*(?:me\s*)?(?:my\s*)?(?:last|latest|saved)?\s*prescriptions?|(?:اعرض|وريني|قولي|هات|فين)\s*(?:لي\s*)?(?:آخر\s*|اخر\s*)?(?:روشتة|روشته|روشتاتي)|ابحث\s*عن\s*آخر\s*روشتة)/i.test(
      normalizedDigits
    )
  ) {
    return {
      matched: true,
      actionType: 'show_prescriptions',
      riskLevel: 'read_only',
      args: {},
    };
  }

  if (
    /(show\s*(?:me\s*)?(?:my\s*)?(?:latest|last)?\s*(?:medical\s*report|lab\s*report|laboratory\s*result|documents?)|(?:اعرض|وريني|قولي|هات|فين)\s*(?:لي\s*)?(?:آخر\s*|اخر\s*|أحدث\s*)?(?:تقرير\s*طبي|تحليل|نتيجة\s*تحليل|تحاليلي|تقاريري|مستنداتي\s*الطبية))/i.test(
      normalizedDigits
    )
  ) {
    return {
      matched: true,
      actionType: 'show_medical_documents',
      riskLevel: 'read_only',
      args: {},
    };
  }

  if (
    /(summarize\s*my\s*(?:health\s*)?(?:records?|profile|history)|health\s*profile\s*summary|give\s*me\s*a\s*summary\s*of\s*my\s*(?:health|profile)|(?:لخص|لخصلي|اعرض|وريني|قولي)\s*(?:لي\s*)?(?:ملفي\s*الصحي|سجلاتي\s*الصحية|تاريخي\s*الطبي|بياناتي\s*الصحية)|ملخص\s*ملفي\s*الصحي|عندي\s*ايه\s*متسجل\s*في\s*ملفي)/i.test(
      normalizedDigits
    )
  ) {
    return {
      matched: true,
      actionType: 'summarize_health_records',
      riskLevel: 'read_only',
      args: {},
    };
  }

  // ── 2. VITALS & PERSONAL DETAILS UPDATES (Weight, Age, Name, Blood Type, Pregnancy/Renal/Hepatic) ──
  const weightMatch = normalizedDigits.match(
    /(?:update\s*(?:my\s*)?weight\s*(?:to)?|my\s*weight\s*is|set\s*weight\s*(?:to)?|وزني\s*(?:الحالي|أصبح|بقى|بقي|هو|دلوقتي)?|خلي\s*الوزن|تحديث\s*الوزن\s*(?:إلى|الى|لـ)?|سجل\s*وزني)\s*(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilograms?|كجم|كيلو|كيلوجرام)?/i
  );
  const ageMatch = normalizedDigits.match(
    /(?:update\s*(?:my\s*)?age\s*(?:to)?|my\s*age\s*is|i\s*am\s*(\d{1,3})\s*years?\s*old|(?:عمري|سني)\s*(?:الحالي|بقى|بقي|هو|دلوقتي)?|خلي\s*(?:العمر|السن)|تحديث\s*(?:العمر|السن)\s*(?:إلى|الى|لـ)?|عندي\s*(\d{1,3})\s*(?:سنة|سنه))\s*(\d{1,3})?/i
  );
  const bloodMatch = normalizedDigits.match(
    /(?:update\s*(?:my\s*)?blood\s*type\s*(?:to)?|my\s*blood\s*type\s*is|فصيلة\s*دمي|فصيله\s*دمي|فصيلة\s*الدم)\s*(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)/i
  );
  const nameMatch = normalizedDigits.match(
    /(?:my\s*name\s*is|update\s*my\s*name\s*to|اسمي|غير\s*اسمي\s*(?:لـ|إلى|الى)?|سجل\s*اسمي)\s+([\u0600-\u06FFa-zA-Z\s]{2,35}?)(?=\s+(?:وعندي|وسني|وعمري|ووزني|وفصيلة|and\s+i|and\s+my)|$)/i
  );
  const phoneMatch = normalizedDigits.match(
    /(?:emergency\s*(?:contact|phone|number)|رقم\s*الطوارئ|تليفون\s*الطوارئ)\s*[:isهو]*\s*(01[0125]\d{8}|\+?\d{8,15})/i
  );

  const isPregnantMention = /(?:انا\s*حامل|أنا\s*حامل|سجل\s*اني\s*حامل|i\s*am\s*pregnant|set\s*pregnancy\s*to\s*pregnant)/i.test(normalizedDigits);
  const isBreastfeedingMention = /(?:انا\s*برضع|أنا\s*مرضع|برضع\s*طبيعي|i\s*am\s*breastfeeding)/i.test(normalizedDigits);

  const resolvedAge = ageMatch ? ageMatch[1] || ageMatch[2] || ageMatch[3] : undefined;

  if (
    weightMatch ||
    bloodMatch ||
    resolvedAge ||
    nameMatch ||
    phoneMatch ||
    isPregnantMention ||
    isBreastfeedingMention
  ) {
    const vitalsArgs: UpdateVitalsArgs = {};
    if (nameMatch?.[1]) vitalsArgs.displayName = nameMatch[1].trim();
    if (weightMatch?.[1]) vitalsArgs.weightKg = weightMatch[1];
    if (resolvedAge) vitalsArgs.age = resolvedAge;
    if (bloodMatch?.[1]) vitalsArgs.bloodType = bloodMatch[1].toUpperCase();
    if (phoneMatch?.[1]) vitalsArgs.emergencyContact = phoneMatch[1];
    if (isPregnantMention) vitalsArgs.pregnancyStatus = 'pregnant';
    else if (isBreastfeedingMention) vitalsArgs.pregnancyStatus = 'breastfeeding';

    const validation = validateActionArguments('update_vitals', vitalsArgs);
    if (validation.valid && validation.sanitized) {
      return {
        matched: true,
        actionType: 'update_vitals',
        riskLevel: getActionRiskLevel('update_vitals'),
        args: validation.sanitized,
        conversationalLeadAr: 'عنيا ليك! جهزتلك تحديث بياناتك الشخصية، بص عليها كده ودوس «تأكيد وحفظ»:',
        conversationalLeadEn: 'I have prepared your profile update. Please review and click "Confirm and Save":',
      };
    }
  }

  // ── 3. REMOVE / DELETE ALLERGY, CONDITION, OR MEDICATION ────────────────────
  const isRemoveActionWord = /(?:remove|delete|clear|شيل|امسح|احذف|الغى|إلغاء|الغي)/i.test(normalizedDigits);
  if (isRemoveActionWord && /(allergy|حساسية|حساسيه|الحساسية)/i.test(normalizedDigits)) {
    const medHit = extractMedicationFromSentence(normalizedDigits);
    const customName =
      medHit?.drugName ||
      normalizedDigits
        .replace(/(?:remove|delete|clear|my|allergy|from|profile|شيل|امسح|احذف|حساسية|حساسيه|من|ملفي|الصحي)/gi, '')
        .trim();
    if (!customName) {
      return {
        matched: true,
        actionType: 'remove_allergy',
        needsClarification: true,
        missingFields: ['drugName'],
        clarificationQuestionAr: 'قولي يا فندم، إيه اسم الدوا اللي عايز تمسح حساسيته من ملفك؟',
        clarificationQuestionEn: 'Which drug allergy would you like to remove from your profile?',
      };
    }
    const args: RemoveAllergyArgs = { drugName: customName };
    return {
      matched: true,
      actionType: 'remove_allergy',
      riskLevel: 'confirmation_required',
      args: validateActionArguments('remove_allergy', args).sanitized,
      conversationalLeadAr: `حاضر، جهزتلك مسح حساسية «${customName}» من ملفك. أكد من الكارت ده لو متأكد:`,
    };
  }

  if (
    isRemoveActionWord &&
    !/(allergy|حساسية|حساسيه|reminder|منبه|تذكير)/i.test(normalizedDigits)
  ) {
    for (const c of KNOWN_CONDITIONS_MAP) {
      if (c.pattern.test(normalizedDigits)) {
        const condName = lang === 'ar' ? c.nameAr : c.nameEn;
        const args: RemoveChronicConditionArgs = { conditionName: condName };
        return {
          matched: true,
          actionType: 'remove_chronic_condition',
          riskLevel: 'confirmation_required',
          args: validateActionArguments('remove_chronic_condition', args).sanitized,
          conversationalLeadAr: `تمام، جهزتلك حذف «${condName}» من ملفك الصحي. دوس «تأكيد وحفظ» عشان نمسحه:`,
        };
      }
    }

    const medHit = extractMedicationFromSentence(normalizedDigits);
    if (medHit) {
      const args: RemoveMedicationArgs = { drugName: medHit.drugName, mode: 'delete' };
      return {
        matched: true,
        actionType: 'remove_medication',
        riskLevel: 'confirmation_required',
        args: validateActionArguments('remove_medication', args).sanitized,
        conversationalLeadAr: `حاضر، جهزتلك شيل دوا «${medHit.drugName}» من قايمة أدويتك. دوس تأكيد لو تحب نحذفه:`,
      };
    }
  }

  // ── 4. ADD ALLERGY TO HEALTH PROFILE ────────────────────────────────────────
  const isAddAllergyIntent =
    /(?:add|record|save|register|document)\s+(?:my\s+|a\s+|an\s+)?[\w\s\-]+allergy|i\s*(?:am|'m)\s*allergic\s+to\s+[\w\s\-]+|allergic\s+to\s+[\w\s\-]+|add\s+[\w\s\-]+\s+to\s+my\s+allerg|(?:أضف|اضف|سجل|ضيف|حط|اكتب|زود)\s*(?:ان\s*عندي\s*|إني\s*عندي\s*)?(?:حساسية|حساسيه|حساسيتي\s*من)|(?:انا\s*|أنا\s*)?(?:عندي|لدي|بيجيلي|بتحسس\s*من|جسمي\s*بيتحسس\s*من)\s*(?:حساسية|حساسيه)?\s*(?:من|ضد)/i.test(
      normalizedDigits
    );

  if (isAddAllergyIntent) {
    const medHit = extractMedicationFromSentence(normalizedDigits);
    let customDrugName = medHit?.drugName || '';
    let allergenKey = medHit?.allergenFamily || 'other';

    if (!customDrugName) {
      const enCustom = normalizedDigits.match(
        /(?:add\s+(?:my\s+|a\s+)?|allergic\s+to\s+)([a-zA-Z0-9\-\s]{3,35}?)(?:\s+allergy|\s+to\s+my|\s*$)/i
      );
      const arCustom = normalizedDigits.match(
        /(?:حساسية\s*(?:من|ضد)?|حساسيه\s*(?:من|ضد)?|بتحسس\s*من|سجل\s*حساسية|أضف\s*حساسية|اضف\s*حساسية|ضيف\s*حساسية|حط\s*حساسية)\s+([\u0600-\u06FFa-zA-Z0-9\s\-]{3,35})/i
      );
      customDrugName = (enCustom?.[1] || arCustom?.[1] || '')
        .replace(/(?:في\s*ملفي|لملفي|الصحي|عندي|لو\s*سمحت).*$/i, '')
        .trim();
      const resolvedId = resolveCanonicalAllergenDrugId(customDrugName);
      if (resolvedId && DRUG_ALLERGEN_MAP[resolvedId]) {
        allergenKey = DRUG_ALLERGEN_MAP[resolvedId].family;
      }
    }

    if (!customDrugName || /^(allergy|حساسية|حساسيه|دواء|دوا|medicine|drug)$/i.test(customDrugName)) {
      return {
        matched: true,
        actionType: 'add_allergy',
        needsClarification: true,
        missingFields: ['drugName'],
        clarificationQuestionAr:
          'ألف سلامة عليك! قولي بس إيه اسم الدوا أو العيلة الدوائية اللي بتعملك حساسية (زي البنسلين، أوجمنتين، السلفا، سيبروفار) وإيه الأعراض اللي بتحصلك منه عشان أسجلهولك فوراً؟',
        clarificationQuestionEn:
          'Which medication or drug family are you allergic to (e.g., Penicillin, Augmentin, Sulfa), and what symptoms did it cause?',
      };
    }

    let severity: AddAllergyArgs['severity'] = 'severe';
    if (/(anaphylax|صدمة|اختناق|إغماء|اغماء|مهدد|ضيق\s*تنفس|نفسي\s*بيتقطع|وشي\s*بيورم)/i.test(normalizedDigits)) {
      severity = 'life_threatening';
    } else if (/(mild|خفيف|حكة\s*بسيط|هرش\s*بسيط)/i.test(normalizedDigits)) {
      severity = 'mild';
    } else if (/(moderate|متوسط|طفح|هرش|حساسية\s*جلد)/i.test(normalizedDigits)) {
      severity = 'moderate';
    }

    let symptoms =
      lang === 'ar'
        ? 'تفاعل تحسسي بلّغ عنه المريض في الشات'
        : 'Patient-reported allergic reaction via AI Assistant';
    const sympMatchAr = normalizedDigits.match(/(?:بسبب|الأعراض|اعراضه|يسبب|بيعملي|بيعمل\s*لي)\s+(.+)$/i);
    const sympMatchEn = normalizedDigits.match(/(?:causes?|symptoms?:?|with)\s+(.+)$/i);
    if (sympMatchAr?.[1]) symptoms = sympMatchAr[1].trim();
    else if (sympMatchEn?.[1]) symptoms = sympMatchEn[1].trim();

    const args: AddAllergyArgs = {
      drugName: customDrugName,
      allergenKey,
      reportedSymptoms: symptoms,
      severity,
      evidenceStatus: 'patient_reported',
    };

    const validated = validateActionArguments('add_allergy', args);
    return {
      matched: true,
      actionType: 'add_allergy',
      riskLevel: getActionRiskLevel('add_allergy'),
      args: validated.sanitized,
      conversationalLeadAr: `ألف سلامة عليك! جهزتلك كارت تسجيل حساسية «${customDrugName}» عشان نحميك من أي دوا يتعارض معاه. راجعه ودوس «تأكيد وحفظ»:`,
    };
  }

  // ── 5. ADD CHRONIC CONDITION TO HEALTH PROFILE ──────────────────────────────
  const isAddConditionIntent =
    /(?:add|record|save|include)\s+[\w\s\-]+?\s+to\s+my\s+(?:health\s*profile|medical\s*history|conditions?|profile)|i\s+have\s+(?:diabetes|hypertension|high\s+blood\s+pressure|asthma|kidney\s+disease|liver\s+disease|g6pd)[\s,;]*(?:add|save|record)?|(?:أضف|اضف|ضيف|سجل|حط|اكتب|زود)\s+[\u0600-\u06FFa-zA-Z0-9\s\-]+?\s*(?:في|إلى|الى|لـ|ل|عندي)?\s*(?:ملفي\s*الصحي|ملفي|تاريخي\s*الطبي|الأمراض\s*المزمنة|حسابي)|(?:انا\s*|أنا\s*)?(?:عندي|لدي|مريض|أعاني\s*من|بعاني\s*من)\s+(?:سكر|السكري|السكر|ضغط|الضغط|ربو|الربو|حساسية\s*صدر|قصور\s*كلى|أنيميا\s*الفول|انيميا\s*الفول|غدة|الغدة|قرحة|كبد|قلب)/i.test(
      normalizedDigits
    );

  if (
    isAddConditionIntent &&
    !/(allergy|حساسية\s*(?:من|ضد|بنسلين|دوا)|remind|فكرني|منبه|تذكير|prescription|روشتة)/i.test(
      normalizedDigits
    )
  ) {
    let detectedCondition = '';
    for (const c of KNOWN_CONDITIONS_MAP) {
      if (c.pattern.test(normalizedDigits)) {
        detectedCondition = lang === 'ar' ? c.nameAr : c.nameEn;
        break;
      }
    }

    if (!detectedCondition) {
      const enMatch = normalizedDigits.match(
        /(?:add|record|save)\s+([a-zA-Z0-9\s\-]{3,40}?)\s+to\s+my\s+(?:health\s*profile|medical\s*history|profile)/i
      );
      const arMatch = normalizedDigits.match(
        /(?:أضف|اضف|ضيف|سجل|حط|اكتب)\s+(?:مرض\s*|حالة\s*|اني\s*عندي\s*)?([\u0600-\u06FFa-zA-Z0-9\s\-]{3,40}?)\s+(?:في|إلى|الى|لملفي|بملفي|في\s*الأمراض)/i
      );
      detectedCondition = (enMatch?.[1] || arMatch?.[1] || '').trim();
    }

    if (!/(medicine|medication|drug|prescription|دواء|دوا|الدواء|روشتة|الروشتة)/i.test(detectedCondition)) {
      if (!detectedCondition) {
        return {
          matched: true,
          actionType: 'add_chronic_condition',
          needsClarification: true,
          missingFields: ['conditionName'],
          clarificationQuestionAr: 'قولي يا فندم، إيه اسم المرض المزمن أو الحالة الصحية اللي تحب أضيفهالك في ملفك الصحي؟',
          clarificationQuestionEn: 'What is the name of the medical condition you would like to add to your health profile?',
        };
      }

      const args: AddChronicConditionArgs = {
        conditionName: detectedCondition,
        evidenceStatus: 'patient_reported',
        source: 'patient_chat',
      };
      const validated = validateActionArguments('add_chronic_condition', args);
      return {
        matched: true,
        actionType: 'add_chronic_condition',
        riskLevel: getActionRiskLevel('add_chronic_condition'),
        args: validated.sanitized,
        conversationalLeadAr: `ألف سلامة عليك! جهزتلك إضافة «${detectedCondition}» لملفك الصحي. دوس «تأكيد وحفظ» عشان يتسجل عندك:`,
      };
    }
  }

  // ── 6. MEDICATION REMINDERS (Create, Modify, Stop) ──────────────────────────
  const isStopReminderIntent =
    /(?:stop|cancel|delete|remove|disable)\s+(?:this\s+|my\s+|the\s+)?[\w\s]*(?:reminder|alarm)|(?:أوقف|اوقف|إلغاء|الغاء|الغي|احذف|امسح|شيل|وقف)\s*(?:تذكير|منبه|جدول\s*مواعيد)/i.test(
      normalizedDigits
    );
  if (isStopReminderIntent) {
    const medHit = extractMedicationFromSentence(normalizedDigits);
    const targetMed = medHit?.drugName || contextMedName || '';
    if (!targetMed) {
      return {
        matched: true,
        actionType: 'stop_reminder',
        needsClarification: true,
        missingFields: ['medicineName'],
        clarificationQuestionAr: 'قولي بس إيه اسم الدوا اللي عايز توقف المنبه بتاعه؟',
        clarificationQuestionEn: 'Which medication reminder would you like to stop? Please specify the medicine name.',
      };
    }
    const args: StopReminderArgs = {
      medicineName: targetMed,
    };
    return {
      matched: true,
      actionType: 'stop_reminder',
      riskLevel: getActionRiskLevel('stop_reminder'),
      args: validateActionArguments('stop_reminder', args).sanitized,
      conversationalLeadAr: `تمام، جهزتلك إيقاف منبه «${targetMed}». دوس تأكيد عشان نوقفه:`,
    };
  }

  const isUpdateReminderIntent =
    /(?:modify|change|update|edit|reschedule)\s+(?:my\s+|the\s+|this\s+)?[\w\s]*(?:reminder|alarm)|(?:عدل|تعديل|غير|تغيير|خلي)\s*(?:موعد\s*|ميعاد\s*|مواعيد\s*)?(?:تذكير|منبه)/i.test(
      normalizedDigits
    );
  if (isUpdateReminderIntent) {
    const medHit = extractMedicationFromSentence(normalizedDigits);
    const targetMed = medHit?.drugName || contextMedName || '';
    const times = extractClockTimesFromText(normalizedDigits);
    if (!targetMed || times.length === 0) {
      return {
        matched: true,
        actionType: 'update_reminder',
        needsClarification: true,
        missingFields: [
          ...(!targetMed ? ['medicineName'] : []),
          ...(times.length === 0 ? ['newDoseTimes'] : []),
        ],
        clarificationQuestionAr:
          'عشان أعدل المنبه، قولي اسم الدوا والميعاد الجديد اللي يناسبك (مثلاً: عدل منبه أوجمنتين للساعة 9 الصبح و 9 بالليل).',
        clarificationQuestionEn:
          'To modify a reminder, please specify the medication name and the new time(s) (e.g., "Modify my Augmentin reminder to 9 AM and 9 PM").',
      };
    }
    const args: UpdateReminderArgs = {
      medicineName: targetMed,
      newDoseTimes: times,
    };
    return {
      matched: true,
      actionType: 'update_reminder',
      riskLevel: getActionRiskLevel('update_reminder'),
      args: validateActionArguments('update_reminder', args).sanitized,
      conversationalLeadAr: `حاضر! جهزتلك تعديل مواعيد منبه «${targetMed}». راجع المواعيد الجديدة ودوس «تأكيد وحفظ»:`,
    };
  }

  const isCreateReminderIntent =
    /(?:remind\s*me\s*to\s*take|create\s*(?:a\s*)?reminders?\s*for|set\s*(?:a\s*)?(?:dose\s*)?(?:reminder|alarm)|فكرني\s*(?:آخد|اخد|أتناول|اتناول|بدوا|بجرعة|بميعاد)|ظبطلي\s*(?:منبه|تذكير)|اظبط\s*(?:منبه|تذكير)|اعمل\s*(?:لي\s*)?(?:تذكير|منبه)|اعملي\s*(?:منبه|تذكير)|نبهني\s*(?:آخد|اخد)|أنشئ\s*تذكير|انشئ\s*تذكير|ذكرني\s*(?:بدواء|بجرعة|آخد|اخد))/i.test(
      normalizedDigits
    );
  if (isCreateReminderIntent) {
    const medHit = extractMedicationFromSentence(normalizedDigits);
    const targetMed = medHit?.drugName || contextMedName || '';
    const times = extractClockTimesFromText(normalizedDigits);
    const parsedRx = parsePrescriptionTextDeterministically(normalizedDigits);

    if (!targetMed || times.length === 0) {
      const missing: string[] = [];
      if (!targetMed) missing.push('medicineName');
      if (times.length === 0) missing.push('doseTimes');
      return {
        matched: true,
        actionType: 'create_reminder',
        needsClarification: true,
        missingFields: missing,
        clarificationQuestionAr: !targetMed
          ? 'من عنيا! قولي بس اسم الدوا والميعاد اللي عايز أفكرك فيه (مثلاً: فكرني آخد أوجمنتين 1 جرام الساعة 8 الصبح و 8 بالليل)؟'
          : `من عنيا! تحب أفكرك بدوا «${targetMed}» الساعة كام كل يوم (مثلاً الساعة 8 الصبح و 8 بالليل)؟`,
        clarificationQuestionEn: !targetMed
          ? 'Which medicine, prescribed dose, and time(s) should I set the reminder for (e.g., "Remind me to take Augmentin 1g at 8 AM and 8 PM")?'
          : `What time(s) on your prescription should I set the reminder for "${targetMed}" (e.g., 8 AM and 8 PM)?`,
      };
    }

    const freq: CreateReminderArgs['frequency'] =
      parsedRx.extractedFrequencyKey ||
      (times.length === 1
        ? 'once_daily'
        : times.length === 3
          ? 'thrice_daily'
          : times.length >= 4
            ? 'four_times_daily'
            : 'twice_daily');

    const args: CreateReminderArgs = {
      medicineName: targetMed,
      prescribedDose:
        parsedRx.extractedDoseText ||
        (lang === 'ar' ? 'حسب الروشتة (تقدر تعدلها من الكارت)' : 'Per prescription (please confirm)'),
      route: parsedRx.extractedRoute || 'oral',
      frequency: freq,
      doseTimes: times,
      durationDays: parsedRx.extractedDurationDays || 5,
      startDate: new Date().toISOString().split('T')[0],
    };

    return {
      matched: true,
      actionType: 'create_reminder',
      riskLevel: getActionRiskLevel('create_reminder'),
      args: validateActionArguments('create_reminder', args).sanitized,
      conversationalLeadAr: `تمام جداً! جهزتلك جدول تذكير لدوا «${targetMed}». راجع المواعيد والمدة ودوس «تأكيد وحفظ»:`,
    };
  }

  // ── 7. UPDATE PRESCRIPTION STATUS ───────────────────────────────────────────
  if (
    /(?:update\s*(?:the\s*|my\s*)?prescription\s*status|verify\s*my\s*prescription|تحديث\s*حالة\s*الروشتة|توثيق\s*الروشتة|وثق\s*الروشتة|أكد\s*الروشتة)/i.test(
      normalizedDigits
    )
  ) {
    const medHit = extractMedicationFromSentence(normalizedDigits);
    const args: UpdatePrescriptionStatusArgs = {
      ...(medHit?.drugName ? { medicineName: medHit.drugName } : {}),
      newStatus: /clarif|توضيح/i.test(lower) ? 'needs_clarification' : 'verified_by_patient',
    };
    return {
      matched: true,
      actionType: 'update_prescription_status',
      riskLevel: getActionRiskLevel('update_prescription_status'),
      args,
      conversationalLeadAr: 'حاضر! جهزتلك تحديث حالة الروشتة، دوس تأكيد عشان نعتمدها:',
    };
  }

  // ── 8. ADD PRESCRIPTION OR MEDICATION TO ACCOUNT ────────────────────────────
  const isAddPrescriptionIntent =
    /(?:add\s+(?:this\s+|a\s+|my\s+)?prescription|save\s+(?:this\s+|my\s+)?prescription|(?:أضف|اضف|ضيف|سجل|احفظ|حط)\s*(?:لي\s*)?(?:هذه\s*)?(?:الروشتة|الروشته|روشتة))/i.test(
      normalizedDigits
    );
  if (isAddPrescriptionIntent) {
    const items = extractMultiplePrescriptionItemsFromText(normalizedDigits);
    const hasNamedDrug = items.some((i) => Boolean(i.medicineName));
    if (!hasNamedDrug) {
      return {
        matched: true,
        actionType: 'add_prescription',
        needsClarification: true,
        missingFields: ['medicineName', 'prescribedDose', 'frequency', 'durationDays'],
        clarificationQuestionAr:
          'تقدر تصور الروشتة أو ترفع صورتها فوراً من زرار 📎 اللي جنب مربع الكتابة وأنا هقرأها وأطلعهالك، أو تكتبلي هنا اسم الدوا والتركيز وبتاخده كام مرة في اليوم ولمدة كام يوم.',
        clarificationQuestionEn:
          'You can attach the prescription photo using the 📎 button next to the input box for automatic analysis, or type the prescription details (medicine name, dose, frequency, and duration in days).',
      };
    }
    const args: AddPrescriptionArgs = { items };
    return {
      matched: true,
      actionType: 'add_prescription',
      riskLevel: getActionRiskLevel('add_prescription'),
      args: validateActionArguments('add_prescription', args).sanitized,
      conversationalLeadAr: 'تمام! جهزتلك بيانات الروشتة عشان تراجعها وتأكد حفظها في حسابك:',
    };
  }

  const isAddMedicationIntent =
    /(?:add\s+(?:this\s+|[\w\s\-]+)?(?:medicine|medication|drug|augmentin|ciprofar|zithromax|flagyl|amoxil|hibiotic)|i\s+(?:am\s+taking|take)\s+[\w\s\-]+|(?:أضف|اضف|ضيف|سجل|حط|زود)\s*(?:لي\s*)?(?:هذا\s*الدواء|الدوا\s*ده|دواء|دوا|علاج)?\s*[\u0600-\u06FFa-zA-Z0-9\s\-]*?(?:إلى|الى|في|لـ)?\s*(?:قائمة\s*أدويتي|قايمة\s*ادويتي|أدويتي|ادويتي|سجل\s*الأدوية|علاجي|ملفي)|(?:انا\s*|أنا\s*)?(?:باخد|بآخد|ماشي\s*على|بمشي\s*على|كتبتلي\s*الدكتورة\s*على|كتبلي\s*الدكتور\s*على)\s+[\u0600-\u06FFa-zA-Z0-9\s\-]+)/i.test(
      normalizedDigits
    );
  if (isAddMedicationIntent && !/\?$|؟$|^هل\s|^ينفع\s|^ممكن\s*آخد/i.test(normalizedDigits)) {
    const medHit = extractMedicationFromSentence(normalizedDigits);
    const parsedRx = parsePrescriptionTextDeterministically(normalizedDigits);
    const drugName = medHit?.drugName || parsedRx.detectedDrugName || '';

    if (!drugName) {
      return {
        matched: true,
        actionType: 'add_medication',
        needsClarification: true,
        missingFields: ['drugName', 'prescribedDose'],
        clarificationQuestionAr:
          'من عنيا! قولي بس اسم الدوا والتركيز بتاعه وبتاخده كام مرة في اليوم عشان أجهزهولك وتأكد حفظه في ملفك؟',
        clarificationQuestionEn:
          'What is the exact medication name, prescribed dose/strength, and daily frequency so I can prepare it for your confirmation?',
      };
    }

    const args: AddMedicationArgs = {
      drugName,
      activeIngredients: medHit?.activeIngredients || '',
      prescribedDose: parsedRx.extractedDoseText || '',
      route: parsedRx.extractedRoute || 'oral',
      frequency: parsedRx.extractedFrequencyKey || 'twice_daily',
      durationDays: parsedRx.extractedDurationDays,
      status: 'active',
      evidenceStatus: 'patient_reported',
      source: 'patient_chat',
    };

    return {
      matched: true,
      actionType: 'add_medication',
      riskLevel: getActionRiskLevel('add_medication'),
      args: validateActionArguments('add_medication', args).sanitized,
      conversationalLeadAr: `تمام يا فندم! جهزتلك إضافة دوا «${drugName}» لقايمة أدويتك الحالية وفحصتهولك مع ملفك الصحي. راجع الكارت ودوس «تأكيد وحفظ»:`,
    };
  }

  return { matched: false };
}

/**
 * Parses an embedded `[[ACTION_CALL: {...}]]` block if emitted by the LLM tool-calling response,
 * validating it through `validateActionArguments` before execution.
 */
export function extractAiToolCallFromResponse(rawAiText: string): {
  cleanReplyText: string;
  detectedIntent: DetectedActionIntent | null;
} {
  if (!rawAiText) return { cleanReplyText: '', detectedIntent: null };

  const match = rawAiText.match(/\[\[ACTION_CALL:\s*(\{[\s\S]*?\})\s*\]\]/i);
  if (!match) {
    return { cleanReplyText: rawAiText.trim(), detectedIntent: null };
  }

  const cleanReplyText = rawAiText.replace(match[0], '').trim();
  try {
    const parsed = JSON.parse(match[1]);
    const actionType = parsed?.actionType as AiActionType | undefined;
    if (!actionType || !AI_ACTION_REGISTRY[actionType]) {
      return { cleanReplyText, detectedIntent: null };
    }
    const validation = validateActionArguments(actionType, parsed.args || {});
    if (!validation.valid || !validation.sanitized) {
      return {
        cleanReplyText,
        detectedIntent: {
          matched: true,
          actionType,
          needsClarification: true,
          missingFields: validation.missingFields,
          clarificationQuestionAr: cleanReplyText || validation.errorsAr.join(' '),
          clarificationQuestionEn: cleanReplyText || validation.errorsEn.join(' '),
        },
      };
    }
    return {
      cleanReplyText,
      detectedIntent: {
        matched: true,
        actionType,
        riskLevel: getActionRiskLevel(actionType),
        args: validation.sanitized,
        conversationalLeadAr: cleanReplyText,
        conversationalLeadEn: cleanReplyText,
      },
    };
  } catch {
    return { cleanReplyText, detectedIntent: null };
  }
}
