/**
 * aiActionRegistry.ts
 *
 * Structured Action & Tool-Calling Registry for the Antibiotic Awareness
 * Personal Health Assistant.
 *
 * Capabilities:
 * 1. Defines all approved patient actions with metadata, risk level, and schema validators.
 * 2. Understands natural-language requests in Arabic (including Egyptian dialect) and English:
 *    - Health Profile: Add chronic conditions, add allergies, update weight/age/blood type/organ status, show allergies.
 *    - Prescriptions & Medications: Add prescription, add medication, update prescription status, show current medications/prescriptions.
 *    - Reminders: Create medication reminders (single or multiple times like 8 AM and 8 PM), modify reminders, stop reminders, list reminders.
 *    - Medical Documents & Records: Upload/save medical documents, show latest report/prescription, summarize health records.
 * 3. Strictly enforces Responsible Medical AI rules:
 *    - Never diagnoses diseases from symptoms.
 *    - Never prescribes antibiotics or invents missing doses, frequencies, or durations.
 *    - Never advises doubling a missed dose.
 *    - Requests missing information when a command is ambiguous.
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
    titleAr: 'إضافة حالة صحية / مرض مزمن للملف الصحي',
    titleEn: 'Add Medical Condition to Health Profile',
    descriptionAr: 'يسجل حالة صحية أبلغ عنها المريض في ملفه الصحي بعد التأكيد.',
    descriptionEn: 'Records a patient-reported medical condition in the Health Profile after confirmation.',
    riskLevel: 'confirmation_required',
    icon: '🏥',
  },
  add_allergy: {
    type: 'add_allergy',
    titleAr: 'تسجيل حساسية دوائية في الملف الصحي',
    titleEn: 'Add Drug Allergy to Health Profile',
    descriptionAr: 'يضيف دواءً أو عائلة دوائية إلى سجل الحساسية لفحص التعارضات تلقائياً.',
    descriptionEn: 'Adds a medication or drug class allergy to the patient profile for safety checks.',
    riskLevel: 'confirmation_required',
    icon: '🚨',
  },
  update_vitals: {
    type: 'update_vitals',
    titleAr: 'تحديث البيانات الحيوية والشخصية بالملف الصحي',
    titleEn: 'Update Health Profile Vitals & Details',
    descriptionAr: 'يحدث الوزن أو العمر أو فصيلة الدم أو حالة الكلى/الكبد/الحمل في الملف الصحي.',
    descriptionEn: 'Updates weight, age, blood type, or organ/pregnancy status in the Health Profile.',
    riskLevel: 'confirmation_required',
    icon: '⚖️',
  },
  add_medication: {
    type: 'add_medication',
    titleAr: 'إضافة دواء إلى قائمة أدويتي الحالية',
    titleEn: 'Add Medicine to Current Medication List',
    descriptionAr: 'يضيف دواءً إلى سجل الأدوية النشطة في الملف الصحي مع فحص التداخلات والحساسية.',
    descriptionEn: 'Adds a medication to the active medication list with allergy and interaction checks.',
    riskLevel: 'confirmation_required',
    icon: '💊',
  },
  add_prescription: {
    type: 'add_prescription',
    titleAr: 'إضافة روشتة إلى حسابي (رادار الروشتة)',
    titleEn: 'Add Prescription to My Account (Prescription Radar)',
    descriptionAr: 'يحفظ الروشتة وأدويتها المستخرجة في رادار الروشتة مع التحقق من الأمان الدوائي.',
    descriptionEn: 'Saves a prescription and its medications into Prescription Radar with safety verification.',
    riskLevel: 'confirmation_required',
    icon: '📋',
  },
  update_prescription_status: {
    type: 'update_prescription_status',
    titleAr: 'تحديث حالة الروشتة',
    titleEn: 'Update Prescription Status',
    descriptionAr: 'يحدث حالة توثيق الروشتة في حساب المريض.',
    descriptionEn: 'Updates the verification status of a saved prescription.',
    riskLevel: 'confirmation_required',
    icon: '✅',
  },
  create_reminder: {
    type: 'create_reminder',
    titleAr: 'إنشاء تذكير وجدول مواعيد جرعات الدواء',
    titleEn: 'Create Medication Dose Reminder Schedule',
    descriptionAr: 'ينشئ جدول مواعيد وتنبيهات للجرعات في المتابع العلاجي.',
    descriptionEn: 'Creates a recurring medication dose reminder schedule in the tracker.',
    riskLevel: 'confirmation_required',
    icon: '⏰',
  },
  update_reminder: {
    type: 'update_reminder',
    titleAr: 'تعديل مواعيد تذكير الدواء',
    titleEn: 'Modify Medication Reminder Schedule',
    descriptionAr: 'يعدل مواعيد الجرعات اليومية أو مدة التذكير لجدول علاجي حالي.',
    descriptionEn: 'Modifies daily dose times or duration for an existing reminder schedule.',
    riskLevel: 'confirmation_required',
    icon: '🕒',
  },
  stop_reminder: {
    type: 'stop_reminder',
    titleAr: 'إيقاف / حذف تذكير الدواء',
    titleEn: 'Stop / Remove Medication Reminder',
    descriptionAr: 'يوقف ويحذف جدول التذكير المحدد بعد تأكيد المريض.',
    descriptionEn: 'Stops and removes the specified medication reminder schedule after confirmation.',
    riskLevel: 'confirmation_required',
    icon: '🔕',
  },
  save_medical_document: {
    type: 'save_medical_document',
    titleAr: 'حفظ مستند أو صورة طبية في حسابي',
    titleEn: 'Save Medical Image / Document to Account',
    descriptionAr: 'يحفظ الصورة أو التقرير الطبي في حساب المريض مع البيانات المستخرجة.',
    descriptionEn: 'Saves the uploaded medical image/report and extracted metadata to the patient account.',
    riskLevel: 'confirmation_required',
    icon: '📄',
  },
  show_allergies: {
    type: 'show_allergies',
    titleAr: 'عرض سجل الحساسية الدوائية',
    titleEn: 'Show Current Drug Allergies',
    descriptionAr: 'يعرض قائمة الحساسيات المسجلة في ملف المريض.',
    descriptionEn: 'Displays the patient’s documented drug allergies.',
    riskLevel: 'read_only',
    icon: '🛡️',
  },
  show_medications: {
    type: 'show_medications',
    titleAr: 'عرض قائمة أدويتي الحالية',
    titleEn: 'Show Current Medications',
    descriptionAr: 'يعرض الأدوية الحالية المسجلة في الملف الصحي للمريض.',
    descriptionEn: 'Displays active and past medications in the patient’s Health Profile.',
    riskLevel: 'read_only',
    icon: '💊',
  },
  show_reminders: {
    type: 'show_reminders',
    titleAr: 'عرض تذكيرات وجداول الجرعات',
    titleEn: 'Show Medication Reminders & Schedules',
    descriptionAr: 'يعرض جداول التذكير النشطة ومواعيد الجرعات القادمة.',
    descriptionEn: 'Displays active medication reminders and upcoming dose times.',
    riskLevel: 'read_only',
    icon: '⏰',
  },
  show_prescriptions: {
    type: 'show_prescriptions',
    titleAr: 'عرض الروشتات المحفوظة',
    titleEn: 'Show Saved Prescriptions',
    descriptionAr: 'يعرض الروشتات المحفوظة وحالة توثيقها في رادار الروشتة.',
    descriptionEn: 'Displays saved prescriptions and their verification status.',
    riskLevel: 'read_only',
    icon: '📋',
  },
  show_medical_documents: {
    type: 'show_medical_documents',
    titleAr: 'عرض التقارير والتحاليل والمستندات الطبية',
    titleEn: 'Show Medical Reports & Documents',
    descriptionAr: 'يعرض أحدث التقارير الطبية والتحاليل المرفوعة في حساب المريض.',
    descriptionEn: 'Displays uploaded medical reports, lab results, and documents.',
    riskLevel: 'read_only',
    icon: '📂',
  },
  summarize_health_records: {
    type: 'summarize_health_records',
    titleAr: 'ملخص شامل للسجل الصحي للمريض',
    titleEn: 'Summarize Complete Patient Health Records',
    descriptionAr: 'يلخص البيانات الحيوية، الحساسيات، الأمراض المزمنة، الأدوية، التذكيرات، والتقارير.',
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
  { pattern: /\b(type\s*1\s*diabetes|سكري?\s*النوع\s*(الأول|الاول|1))\b/i, nameAr: 'السكري من النوع الأول (Type 1 Diabetes)', nameEn: 'Type 1 Diabetes' },
  { pattern: /\b(type\s*2\s*diabetes|سكري?\s*النوع\s*(الثاني|التاني|2))\b/i, nameAr: 'السكري من النوع الثاني (Type 2 Diabetes)', nameEn: 'Type 2 Diabetes' },
  { pattern: /\b(diabetes|diabetic|السكري|مرض السكر|سكر)\b/i, nameAr: 'مرض السكري (Diabetes Mellitus)', nameEn: 'Diabetes Mellitus' },
  { pattern: /\b(hypertension|high blood pressure|ضغط الدم المرتفع|ارتفاع ضغط الدم|الضغط العالي|مرض الضغط|ضغط)\b/i, nameAr: 'ارتفاع ضغط الدم (Hypertension)', nameEn: 'Hypertension' },
  { pattern: /\b(asthma|ربو|الربو|حساسية صدر|حساسيه صدر)\b/i, nameAr: 'الربو الشعبي (Asthma)', nameEn: 'Asthma' },
  { pattern: /\b(chronic kidney|renal failure|kidney disease|قصور الكلى|ضعف الكلى|مرض الكلى|فشل كلوي)\b/i, nameAr: 'قصور وظائف الكلى المزمن (Chronic Kidney Disease)', nameEn: 'Chronic Kidney Disease' },
  { pattern: /\b(liver disease|hepatic impairment|cirrhosis|قصور الكبد|تليف الكبد|مرض الكبد)\b/i, nameAr: 'اعتلال وظائف الكبد (Hepatic Condition)', nameEn: 'Hepatic Condition' },
  { pattern: /\b(heart failure|coronary|cardiac|قصور القلب|مرض القلب|القلب)\b/i, nameAr: 'أمراض القلب والأوعية الدموية (Cardiac Condition)', nameEn: 'Cardiac Condition' },
  { pattern: /\b(g6pd|favism|أنيميا الفول|انيميا الفول)\b/i, nameAr: 'أنيميا الفول (G6PD Deficiency)', nameEn: 'G6PD Deficiency (Favism)' },
  { pattern: /\b(peptic ulcer|stomach ulcer|قرحة المعدة|قرحه المعده)\b/i, nameAr: 'قرحة المعدة (Peptic Ulcer)', nameEn: 'Peptic Ulcer Disease' },
  { pattern: /\b(hypothyroidism|hyperthyroidism|thyroid|الغدة الدرقية|الغده الدرقيه)\b/i, nameAr: 'اضطراب الغدة الدرقية (Thyroid Disorder)', nameEn: 'Thyroid Disorder' },
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

  // 3. Check general allergen categories (e.g., "penicillin" / "بنسلين", "sulfa" / "سلفا", "cephalosporin" / "سيفالوسبورين")
  if (/(penicillin|بنسلين|بنسيلين|البنسلين)/i.test(clean)) {
    return {
      drugName: /[\u0600-\u06FF]/.test(clean) ? 'عائلة البنسلين (Penicillin)' : 'Penicillin',
      antibioticId: 'penicillin-v-potassium',
      activeIngredients: 'Penicillin / Beta-Lactam',
      allergenFamily: 'penicillin',
    };
  }
  if (/(sulfa|sulfonamide|سلفا|السلفا)/i.test(clean)) {
    return {
      drugName: /[\u0600-\u06FF]/.test(clean) ? 'مركبات السلفا (Sulfa)' : 'Sulfa (Sulfonamides)',
      antibioticId: 'co-trimoxazole',
      activeIngredients: 'Sulfonamides',
      allergenFamily: 'sulfa',
    };
  }
  if (/(cephalosporin|سيفالوسبورين)/i.test(clean)) {
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

  // 4. Check common co-medications
  const commonMeds: Array<{ re: RegExp; en: string; ar: string }> = [
    { re: /\b(panadol|paracetamol|بانادول|باراسيتامول|سيتال|أبيمول)\b/i, en: 'Paracetamol (Panadol)', ar: 'باراسيتامول (بانادول)' },
    { re: /\b(brufen|ibuprofen|بروفين|إيبوبروفين)\b/i, en: 'Ibuprofen (Brufen)', ar: 'إيبوبروفين (بروفين)' },
    { re: /\b(cataflam|voltaren|diclofenac|كتافلام|فولتارين)\b/i, en: 'Diclofenac (Cataflam)', ar: 'ديكلوفيناك (كتافلام)' },
    { re: /\b(warfarin|marevan|وارفارين|ماريفان)\b/i, en: 'Warfarin (Marevan)', ar: 'وارفارين (ماريفان)' },
    { re: /\b(metformin|glucophage|ميتفورمين|جلوكوفاج)\b/i, en: 'Metformin (Glucophage)', ar: 'ميتفورمين (جلوكوفاج)' },
    { re: /\b(omeprazole|antodine|أوميبرازول|أنتودين)\b/i, en: 'Omeprazole', ar: 'أوميبرازول' },
    { re: /\b(aspirin|أسبرين|اسبرين)\b/i, en: 'Aspirin', ar: 'أسبرين (Aspirin)' },
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
 * Extracts explicit clock times from natural language in Arabic or English
 * (e.g., "at 8 AM and 8 PM", "الساعة 8 الصبح و 8 بالليل", "09:00", "at 10pm").
 */
export function extractClockTimesFromText(raw: string): string[] {
  const normalizedDigits = raw.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const times: string[] = [];

  const regexFull =
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|صباحا|صباحاً|الصبح|ص|مساء|مساءً|بالليل|ليلا|ليلاً|م|ظهرا|ظهراً|عصرا|عصراً)\b/gi;
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
      period.includes('ظهر');
    const isAm = period === 'am' || period === 'ص' || period.includes('صباح') || period.includes('صبح');

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
    const bareHourMatch = normalizedDigits.match(/(?:\bat\b|الساعة|الساعه)\s*(\d{1,2})(?!\s*[:\d])/i);
    if (bareHourMatch) {
      const h = parseInt(bareHourMatch[1], 10);
      if (h >= 0 && h <= 23) {
        times.push(`${String(h).padStart(2, '0')}:00`);
      }
    }
  }

  return times;
}

/**
 * Primary NLU & Tool-Calling Intent Detector.
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
    /(double\s*(?:my|the|a)?\s*(?:missed\s*)?dose|take\s*(?:two|2|double)\s*doses\s*(?:at\s*once|together)|أضاعف\s*الجرعة|اضاعف\s*الجرعه|آخد\s*جرعتين\s*مع\s*بعض|اخد\s*حبايتين\s*عشان\s*نسيت|مضاعفة\s*الجرعة)/i.test(
      normalizedDigits
    )
  ) {
    return {
      matched: true,
      safetyRefusal: {
        refused: true,
        reasonCode: 'no_double_dose',
        messageAr:
          '⚠️ تنبيه سلامة دوائية صارم: لا تضاعف الجرعة أبداً لتعويض الجرعة الفائتة! مضاعفة جرعة المضاد الحيوي ترفع خطر السمية الدوائية والآثار الجانبية الحادة. إذا تذكرت الجرعة قريباً من موعدها المعتاد فخذها، أما إذا اقترب موعد الجرعة التالية فتخطَّ الجرعة الفائتة وأكمل جدولك المعتاد، واستشر الطبيب أو الصيدلي عند الشك.',
        messageEn:
          '⚠️ Mandatory Medication Safety Rule: NEVER double a dose to make up for a missed dose! Doubling an antibiotic dose increases toxicity and severe side-effect risks. Take the missed dose only if remembered soon, or skip it if the next scheduled dose is near, and consult your pharmacist or physician.',
      },
    };
  }

  // ── 1. READ-ONLY PATIENT RECORD QUERIES ─────────────────────────────────────
  if (
    /(show\s*(?:me\s*)?(?:my\s*)?(?:current\s*)?allerg|what\s*allergies\s*do\s*i\s*have|list\s*my\s*allerg|اعرض\s*(?:لي\s*)?حساسي|وريني\s*حساسي|ايه\s*الحساسي(?:ة|ه)\s*اللي\s*عندي|ما\s*هي\s*حساسياتي|سجل\s*حساسيتي)/i.test(
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
    /(show\s*(?:me\s*)?(?:my\s*)?(?:current\s*)?medications?|what\s*medications?\s*(?:am\s*i\s*taking|do\s*i\s*take)|list\s*my\s*medicines?|show\s*my\s*drugs|اعرض\s*(?:لي\s*)?(?:قائمة\s*)?(?:أدويتي|ادويتي)|وريني\s*(?:أدويتي|ادويتي)|ايه\s*(?:الأدوية|الادويه)\s*اللي\s*باخدها|ما\s*هي\s*أدويتي\s*الحالية)/i.test(
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
    /(show\s*(?:me\s*)?(?:my\s*)?(?:medication\s*)?reminders?|list\s*(?:my\s*)?reminders?|what\s*are\s*my\s*(?:dose\s*)?reminders?|اعرض\s*(?:لي\s*)?(?:تذكيراتي|مواعيد\s*جرعاتي|منبهات\s*الأدوية)|وريني\s*التذكيرات|مواعيد\s*أدويتي\s*اليوم)/i.test(
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
    /(find\s*my\s*last\s*prescription|show\s*(?:me\s*)?(?:my\s*)?(?:last|latest|saved)?\s*prescriptions?|اعرض\s*(?:لي\s*)?(?:آخر\s*)?(?:روشتة|روشتاتي)|وريني\s*(?:آخر\s*)?روشتة|ابحث\s*عن\s*آخر\s*روشتة)/i.test(
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
    /(show\s*(?:me\s*)?(?:my\s*)?(?:latest|last)?\s*(?:medical\s*report|lab\s*report|laboratory\s*result|documents?)|اعرض\s*(?:لي\s*)?(?:آخر\s*|أحدث\s*)?(?:تقرير\s*طبي|تحليل|نتيجة\s*تحليل|مستنداتي\s*الطبية)|وريني\s*(?:آخر\s*)?(?:تقرير|تحليل))/i.test(
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
    /(summarize\s*my\s*(?:health\s*)?(?:records?|profile|history)|health\s*profile\s*summary|give\s*me\s*a\s*summary\s*of\s*my\s*(?:health|profile)|لخص\s*(?:لي\s*)?(?:ملفي\s*الصحي|سجلاتي\s*الصحية|تاريخي\s*الطبي)|ملخص\s*ملفي\s*الصحي|اعرض\s*ملفي\s*الصحي\s*كامل)/i.test(
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

  // ── 2. VITALS & PERSONAL DETAILS UPDATES ────────────────────────────────────
  const weightMatch = normalizedDigits.match(
    /(?:update\s*(?:my\s*)?weight\s*(?:to)?|my\s*weight\s*is|set\s*weight\s*(?:to)?|وزني\s*(?:الحالي|أصبح|بقى)?|تحديث\s*الوزن\s*(?:إلى|الى)?|سجل\s*وزني)\s*(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilograms?|كجم|كيلو|كيلوجرام)?/i
  );
  const ageMatch = normalizedDigits.match(
    /(?:update\s*(?:my\s*)?age\s*(?:to)?|my\s*age\s*is|i\s*am\s*(\d{1,3})\s*years?\s*old|عمري\s*(?:الحالي)?|تحديث\s*العمر\s*(?:إلى|الى)?|سني)\s*(\d{1,3})?/i
  );
  const bloodMatch = normalizedDigits.match(
    /(?:update\s*(?:my\s*)?blood\s*type\s*(?:to)?|my\s*blood\s*type\s*is|فصيلة\s*دمي|فصيله\s*دمي)\s*(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)/i
  );

  if (weightMatch || bloodMatch || (ageMatch && (ageMatch[1] || ageMatch[2]))) {
    const vitalsArgs: UpdateVitalsArgs = {};
    if (weightMatch && weightMatch[1]) {
      vitalsArgs.weightKg = weightMatch[1];
    }
    if (ageMatch && (ageMatch[1] || ageMatch[2])) {
      vitalsArgs.age = ageMatch[1] || ageMatch[2];
    }
    if (bloodMatch && bloodMatch[1]) {
      vitalsArgs.bloodType = bloodMatch[1].toUpperCase();
    }
    const validation = validateActionArguments('update_vitals', vitalsArgs);
    if (validation.valid && validation.sanitized) {
      return {
        matched: true,
        actionType: 'update_vitals',
        riskLevel: getActionRiskLevel('update_vitals'),
        args: validation.sanitized,
      };
    }
  }

  // ── 3. ADD ALLERGY TO HEALTH PROFILE ────────────────────────────────────────
  const isAddAllergyIntent =
    /(?:add|record|save|register|document)\s+(?:my\s+|a\s+|an\s+)?[\w\s\-]+allergy|allergic\s+to\s+[\w\s\-]+|add\s+[\w\s\-]+\s+to\s+my\s+allerg|(?:أضف|اضف|سجل|ضيف)\s*(?:حساسية|حساسيه|حساسيتي\s*من)|(?:عندي|لدي)\s*(?:حساسية|حساسيه)\s*(?:من|ضد)/i.test(
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
        /(?:حساسية\s*من|حساسيه\s*من|سجل\s*حساسية|أضف\s*حساسية|اضف\s*حساسية|ضيف\s*حساسية)\s+([\u0600-\u06FFa-zA-Z0-9\s\-]{3,35})/i
      );
      customDrugName = (enCustom?.[1] || arCustom?.[1] || '').trim();
      const resolvedId = resolveCanonicalAllergenDrugId(customDrugName);
      if (resolvedId && DRUG_ALLERGEN_MAP[resolvedId]) {
        allergenKey = DRUG_ALLERGEN_MAP[resolvedId].family;
      }
    }

    if (!customDrugName || /^(allergy|حساسية|حساسيه|دواء|medicine|drug)$/i.test(customDrugName)) {
      return {
        matched: true,
        actionType: 'add_allergy',
        needsClarification: true,
        missingFields: ['drugName'],
        clarificationQuestionAr:
          'ما هو اسم الدواء أو العائلة الدوائية التي تسبب لك الحساسية (مثال: البنسلين، أوجمنتين، السلفا، سيبروفار)، وما هي الأعراض التي ظهرت عليك؟',
        clarificationQuestionEn:
          'Which medication or drug family are you allergic to (e.g., Penicillin, Augmentin, Sulfa), and what symptoms did it cause?',
      };
    }

    let severity: AddAllergyArgs['severity'] = 'severe';
    if (/(anaphylax|صدمة|اختناق|إغماء|اغماء|مهدد)/i.test(normalizedDigits)) {
      severity = 'life_threatening';
    } else if (/(mild|خفيف|حكة بسيط)/i.test(normalizedDigits)) {
      severity = 'mild';
    } else if (/(moderate|متوسط|طفح)/i.test(normalizedDigits)) {
      severity = 'moderate';
    }

    let symptoms =
      lang === 'ar'
        ? 'تفاعل تحسسي أبلغ عنه المريض عبر المساعد الذكي'
        : 'Patient-reported allergic reaction via AI Assistant';
    const sympMatchAr = normalizedDigits.match(/(?:بسبب|الأعراض|اعراضه|يسبب)\s+(.+)$/i);
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
    };
  }

  // ── 4. ADD CHRONIC CONDITION TO HEALTH PROFILE ──────────────────────────────
  const isAddConditionIntent =
    /(?:add|record|save|include)\s+[\w\s\-]+?\s+to\s+my\s+(?:health\s*profile|medical\s*history|conditions?|profile)|i\s+have\s+(?:diabetes|hypertension|high\s+blood\s+pressure|asthma|kidney\s+disease|liver\s+disease|g6pd)[\s,;]*(?:add|save|record)?|(?:أضف|اضف|ضيف|سجل)\s+[\u0600-\u06FFa-zA-Z0-9\s\-]+?\s*(?:في|إلى|الى|لـ|ل)?\s*(?:ملفي\s*الصحي|تاريخي\s*الطبي|الأمراض\s*المزمنة|حسابي)|(?:عندي|لدي|أعاني\s*من)\s+(?:سكر|السكري|ضغط|الضغط|ربو|الربو|قصور\s*كلى|أنيميا\s*الفول)/i.test(
      normalizedDigits
    );

  if (isAddConditionIntent && !/(allergy|حساسية|حساسيه|remind|فكرني|تذكير|prescription|روشتة)/i.test(normalizedDigits)) {
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
        /(?:أضف|اضف|ضيف|سجل)\s+([\u0600-\u06FFa-zA-Z0-9\s\-]{3,40}?)\s+(?:في|إلى|الى|لملفي|بتاعي)/i
      );
      detectedCondition = (enMatch?.[1] || arMatch?.[1] || '').trim();
    }

    if (!/(medicine|medication|drug|prescription|دواء|الدواء|روشتة|الروشتة)/i.test(detectedCondition)) {
      if (!detectedCondition) {
        return {
          matched: true,
          actionType: 'add_chronic_condition',
          needsClarification: true,
          missingFields: ['conditionName'],
          clarificationQuestionAr: 'ما هو اسم الحالة الصحية أو المرض المزمن الذي ترغب في إضافته إلى ملفك الصحي؟',
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
      };
    }
  }

  // ── 5. MEDICATION REMINDERS (Create, Modify, Stop) ──────────────────────────
  const isStopReminderIntent =
    /(?:stop|cancel|delete|remove|disable)\s+(?:this\s+|my\s+|the\s+)?[\w\s]*reminder|(?:أوقف|اوقف|إلغاء|الغاء|احذف|امسح|وقف)\s*(?:تذكير|منبه|جدول)/i.test(
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
        clarificationQuestionAr: 'أي تذكير دواء ترغب في إيقافه؟ يرجى ذكر اسم الدواء.',
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
    };
  }

  const isUpdateReminderIntent =
    /(?:modify|change|update|edit|reschedule)\s+(?:my\s+|the\s+|this\s+)?[\w\s]*reminder|(?:عدل|تعديل|غير|تغيير)\s*(?:موعد\s*|ميعاد\s*)?(?:تذكير|منبه)/i.test(
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
          'لتعديل التذكير، يرجى تحديد اسم الدواء والموعد الجديد المطلوب (مثال: عدل تذكير أوجمنتين إلى الساعة 9 صباحاً و 9 مساءً).',
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
    };
  }

  const isCreateReminderIntent =
    /(?:remind\s*me\s*to\s*take|create\s*(?:a\s*)?reminders?\s*for|set\s*(?:a\s*)?(?:dose\s*)?(?:reminder|alarm)|فكرني\s*(?:آخد|اخد|أتناول|اتناول)|اعمل\s*(?:لي\s*)?(?:تذكير|منبه)|أنشئ\s*تذكير|انشئ\s*تذكير|ذكرني\s*(?:بدواء|بجرعة))/i.test(
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
          ? 'ما هو اسم الدواء والجرعة الموصوفة والموعد الذي تريد التذكير به (مثال: فكرني آخد أوجمنتين 1 جرام الساعة 8 صباحاً و 8 مساءً)؟'
          : `ما هو الموعد اليومي المحدد في روشتتك لدواء «${targetMed}» (مثلاً الساعة 8 صباحاً و 8 مساءً)؟`,
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
      prescribedDose: parsedRx.extractedDoseText || (lang === 'ar' ? 'حسب الوصفة الطبية (يُرجى التأكيد)' : 'Per prescription (please confirm)'),
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
    };
  }

  // ── 6. UPDATE PRESCRIPTION STATUS ───────────────────────────────────────────
  if (
    /(?:update\s*(?:the\s*|my\s*)?prescription\s*status|verify\s*my\s*prescription|تحديث\s*حالة\s*الروشتة|توثيق\s*الروشتة)/i.test(
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
    };
  }

  // ── 7. ADD PRESCRIPTION OR MEDICATION TO ACCOUNT ────────────────────────────
  const isAddPrescriptionIntent =
    /(?:add\s+(?:this\s+|a\s+|my\s+)?prescription|save\s+(?:this\s+|my\s+)?prescription|(?:أضف|اضف|ضيف|سجل|احفظ)\s*(?:هذه\s*)?(?:الروشتة|الروشته|روشتة))/i.test(
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
          'يمكنك إرفاق صورة الروشتة مباشرة عبر زر 📎 بجانب مربع الكتابة لتحليلها تلقائياً، أو كتابة تفاصيل الروشتة (اسم الدواء، التركيز/الجرعة، عدد المرات يومياً، ومدة الكورس بالأيام).',
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
    };
  }

  const isAddMedicationIntent =
    /(?:add\s+(?:this\s+|[\w\s\-]+)?(?:medicine|medication|drug)\s+to\s+my\s+(?:medication\s*list|profile|medications?|account)|i\s+am\s+taking\s+[\w\s\-]+\s+add\s+it|(?:أضف|اضف|ضيف|سجل)\s*(?:هذا\s*الدواء|دواء|علاج)?\s*[\u0600-\u06FFa-zA-Z0-9\s\-]*?(?:إلى|الى|في|لـ)?\s*(?:قائمة\s*أدويتي|ادويتي|سجل\s*الأدوية|أدويتي\s*الحالية))/i.test(
      normalizedDigits
    );
  if (isAddMedicationIntent) {
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
          'ما هو اسم الدواء والتركيز/الجرعة الموصوفة وعدد مرات تناوله يومياً حتى أجهزه لك للمراجعة والحفظ؟ (لا يقوم المساعد بافتراض اسم الدواء أو جرعته تلقائياً).',
        clarificationQuestionEn:
          'What is the exact medication name, prescribed dose/strength, and daily frequency so I can prepare it for your confirmation? (The assistant never invents drug names or doses).',
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
    };
  }

  return { matched: false };
}
