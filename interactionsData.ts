import { Bi, Source } from './types';
import { ACTIVE_INGREDIENTS } from './egyptianDrugDatabase';

export type Severity = 'severe' | 'moderate' | 'safe';

export interface InteractingItem {
  id: string;
  aliases?: string[];
  keywordsAr?: string[];
  keywordsEn?: string[];
  name: Bi;
  category: 'food' | 'supplement' | 'drug';
  icon: string;
}

export interface InteractionRule {
  antibioticId: string;
  targetId: string;
  severity: Severity;
  title: Bi;
  mechanism: Bi;
  management: Bi;
  nursingTip: Bi;
  source?: Source;
}

export interface AntibioticPairInteractionRule {
  id: string;
   appliesTo: (abxA: string, abxB: string) => boolean;
  severity: 'severe' | 'moderate';
  title: Bi;
  mechanism: Bi;
  management: Bi;
  nursingTip: Bi;
  source: Source;
}

export const INTERACTION_SOURCES: Record<string, Source> = {
  medlineplus_fda: {
    title: 'NIH MedlinePlus & FDA Clinical Pharmacology Drug Interactions',
    url: 'https://medlineplus.gov/druginformation.html',
    publisher: 'National Library of Medicine (NIH) / US FDA',
    updated: '2026-01-15',
    accessed: '2026-10-14',
  },
  eda_stewardship: {
    title: 'هيئة الدواء المصرية (EDA) — الدليل القومي لترشيد المضادات الحيوية والتداخلات الدوائية',
    url: 'https://edaegypt.gov.eg',
    publisher: 'Egyptian Drug Authority (EDA)',
    updated: '2026-05-01',
    accessed: '2026-10-14',
  },
  who_aware: {
    title: 'WHO AWaRe (Access, Watch, Reserve) Antibiotic Book — Clinical Interactions & Safety',
    url: 'https://www.who.int/publications/i/item/9789240062382',
    publisher: 'World Health Organization (WHO)',
    updated: '2025-12-01',
    accessed: '2026-10-14',
  },
};

export const TARGETS: InteractingItem[] = [
  // Foods
  {
    id: 'dairy',
    aliases: ['calcium_dairy'],
    keywordsAr: ['حليب', 'لبن', 'جبن', 'ألبان', 'البان', 'كالسيوم غذائي'],
    keywordsEn: ['milk', 'dairy', 'cheese', 'dietary calcium'],
    name: { ar: 'الحليب ومشتقات الألبان (الكالسيوم الغذائي)', en: 'Milk & Dairy Products (Dietary Calcium)' },
    category: 'food',
    icon: '🥛',
  },
  {
    id: 'alcohol',
    aliases: ['ethanol'],
    keywordsAr: ['كحول', 'مشروبات كحولية', 'إيثانول'],
    keywordsEn: ['alcohol', 'ethanol', 'alcoholic beverages'],
    name: { ar: 'المشروبات الكحولية أو الأدوية المحتوية على كحول', en: 'Alcoholic Beverages / Alcohol-Containing Elixirs' },
    category: 'food',
    icon: '🍷',
  },
  {
    id: 'meals',
    aliases: ['food'],
    keywordsAr: ['طعام', 'وجبات', 'الأكل', 'معدة فارغة'],
    keywordsEn: ['food', 'meals', 'empty stomach'],
    name: { ar: 'الطعام العام والوجبات', en: 'General Food & Meals' },
    category: 'food',
    icon: '🍽️',
  },

  // Supplements
  {
    id: 'iron',
    aliases: ['iron_zinc'],
    keywordsAr: ['حديد', 'زنك', 'فيروترون', 'فيروجلوبين', 'زنكترون', 'أنيميا', 'انيميا'],
    keywordsEn: ['iron', 'zinc', 'ferrotron', 'feroglobin', 'zinctron', 'ferrous'],
    name: { ar: 'مكملات الحديد والزنك وعلاج فقر الدم', en: 'Iron & Zinc Supplements' },
    category: 'supplement',
    icon: '💊',
  },
  {
    id: 'calcium_antacids',
    aliases: ['antacids'],
    keywordsAr: ['مضادات الحموضة', 'حموضة', 'كالسيوم', 'ماغنيسيوم', 'مغنيسيوم', 'مالوكس', 'جافيسكون', 'أنتودين', 'أوميبرازول', 'أوستيوكير', 'كالسيترون'],
    keywordsEn: ['antacid', 'antacids', 'maalox', 'gaviscon', 'calcium', 'magnesium', 'aluminum', 'osteocare', 'calcitron', 'omeprazole'],
    name: { ar: 'مكملات الكالسيوم ومضادات الحموضة (الألومنيوم/المغنيسيوم)', en: 'Calcium Supplements & Aluminum/Magnesium Antacids' },
    category: 'supplement',
    icon: '🧪',
  },
  {
    id: 'probiotics',
    aliases: ['yogurt_probiotics'],
    keywordsAr: ['بروبيوتيك', 'خمائر نافعة', 'لاكتيول', 'لينكس', 'زبادي'],
    keywordsEn: ['probiotic', 'probiotics', 'lacteol', 'linex', 'yogurt', 'lactobacillus'],
    name: { ar: 'مكملات البروبيوتيك والزبادي (البكتيريا النافعة)', en: 'Probiotics & Yogurt (Beneficial Flora)' },
    category: 'supplement',
    icon: '🥣',
  },

  // Drugs
  {
    id: 'birth_control',
    aliases: ['contraceptives'],
    keywordsAr: ['منع الحمل', 'ياسمين', 'جينيرا', 'ميكروجينون', 'أقراص منع الحمل'],
    keywordsEn: ['contraceptive', 'contraceptives', 'birth control', 'yasmin', 'gynera', 'microgynon', 'oral contraceptive'],
    name: { ar: 'حبوب منع الحمل الهرمونية', en: 'Oral Contraceptive Pills' },
    category: 'drug',
    icon: '🌸',
  },
  {
    id: 'warfarin',
    aliases: ['anticoagulants'],
    keywordsAr: ['وارفارين', 'ماريفان', 'سيولة', 'مميعات الدم', 'كومادين'],
    keywordsEn: ['warfarin', 'marevan', 'coumadin', 'blood thinner', 'anticoagulant'],
    name: { ar: 'أدوية السيولة ومميعات الدم (الوارفارين/ماريفان)', en: 'Blood Thinners (Warfarin / Marevan)' },
    category: 'drug',
    icon: '🩸',
  },
  {
    id: 'nsaids',
    aliases: ['painkillers_nsaid'],
    keywordsAr: ['مسكنات', 'بروفين', 'إيبوبروفين', 'ايبوبروفين', 'كتافلام', 'فولتارين', 'ديكلوفيناك', 'كيتوفان', 'كيتوبروفين', 'نابروكسين'],
    keywordsEn: ['nsaid', 'nsaids', 'ibuprofen', 'brufen', 'cataflam', 'voltaren', 'diclofenac', 'ketofan', 'ketoprofen', 'naproxen'],
    name: { ar: 'المسكنات ومضادات الالتهاب (بروفين، كتافلام، فولتارين)', en: 'NSAIDs (Ibuprofen, Diclofenac, Ketoprofen)' },
    category: 'drug',
    icon: '⚡',
  },
  {
    id: 'statins',
    aliases: ['cholesterol_statins'],
    keywordsAr: ['كوليسترول', 'ستاتين', 'أتور', 'اتور', 'ليبيتور', 'زوكور', 'سيمفاستاتين', 'أتورفاستاتين', 'روزوفاستاتين', 'كريستور'],
    keywordsEn: ['statin', 'statins', 'simvastatin', 'atorvastatin', 'ator', 'lipitor', 'zocor', 'rosuvastatin', 'crestor'],
    name: { ar: 'أدوية الكوليسترول والدهون (سيمفاستاتين، أتورفاستاتين)', en: 'Statins (Simvastatin, Atorvastatin)' },
    category: 'drug',
    icon: '🫀',
  },
  {
    id: 'allopurinol',
    aliases: ['gout_allopurinol'],
    keywordsAr: ['ألوبيورينول', 'الوبيورينول', 'زيلوريك', 'نويوريك', 'نقرس'],
    keywordsEn: ['allopurinol', 'zyloric', 'no-uric', 'gout'],
    name: { ar: 'أدوية النقرس وحمض اليوريك (ألوبيورينول / زيلوريك)', en: 'Gout Medicine (Allopurinol / Zyloric)' },
    category: 'drug',
    icon: '🦶',
  },
  {
    id: 'paracetamol',
    aliases: ['acetaminophen'],
    keywordsAr: ['باراسيتامول', 'بنادول', 'بانادول', 'سيتال', 'أبيمول', 'ابيمول', 'أدول', 'ادول'],
    keywordsEn: ['paracetamol', 'acetaminophen', 'panadol', 'cetal', 'abimol', 'adol', 'tylenol'],
    name: { ar: 'باراسيتامول (خافض حرارة ومسكن آمن)', en: 'Paracetamol / Acetaminophen' },
    category: 'drug',
    icon: '🌡️',
  },
];

/** Resolves any target ID, PrescriptionRadar co-med ID, or free-text drug/supplement name to a canonical target ID */
export function resolveTargetId(idOrText: string): string | null {
  const clean = (idOrText || '').toLowerCase().trim();
  if (!clean) return null;

  for (const t of TARGETS) {
    if (t.id === clean || t.aliases?.includes(clean)) {
      return t.id;
    }
  }

  for (const t of TARGETS) {
    if (
      t.keywordsEn?.some((k) => clean.includes(k.toLowerCase())) ||
      t.keywordsAr?.some((k) => clean.includes(k))
    ) {
      return t.id;
    }
  }

  return null;
}

export const RULES: InteractionRule[] = [
  // Ciprofloxacin / Fluoroquinolones
  {
    antibioticId: 'ciprofloxacin',
    targetId: 'dairy',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: ارتباط الكالسيوم ومنع الامتصاص', en: 'Moderate: Calcium Chelation Inhibiting Absorption' },
    mechanism: {
      ar: 'يرتبط الكالسيوم الموجود في الحليب والزبادي مع السيبروفلوكساسين في المعدة مكوناً مركباً غير قابل للذوبان، مما يقلل امتصاص المضاد في الدم بنسبة تصل إلى 60% ويفشل العلاج.',
      en: 'Calcium ions bind to ciprofloxacin, forming an insoluble chelate that decreases drug bioavailability by up to 60%.',
    },
    management: {
      ar: 'يجب الفصل التام: تناول السيبروفلوكساسين بساعتين قبل شرب الحليب أو تناول منتجات الألبان، أو بعد تناولها بـ 4 ساعات على الأقل.',
      en: 'Strictly separate: take ciprofloxacin 2 hours before or 4 hours after consuming dairy products.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: نبّه المريض بتناول القرص مع كوب ماء كبير وليس مع كوب حليب أو عصير مدعم بالكالسيوم، واسأله عن وجبات الإفطار.',
      en: 'Nursing Stewardship: Instruct the patient to take the tablet with a full glass of water, never with milk or calcium-fortified juice.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },
  {
    antibioticId: 'ciprofloxacin',
    targetId: 'iron',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: ارتباط الحديد وإلغاء فاعلية المضاد', en: 'Moderate: Iron Chelation Inhibiting Absorption' },
    mechanism: {
      ar: 'أيونات الحديد الثنائية والزنك ترتبط بجزيئات الفلوروكينولون في الجهاز الهضمي وتمنع امتصاصها بصورة شبه تامة.',
      en: 'Iron and zinc salts chelate with ciprofloxacin in the gut, severely decreasing its clinical efficacy.',
    },
    management: {
      ar: 'افصل بين كبسولات الحديد/الزنك والسيبروفلوكساسين بساعتين على الأقل قبل المضاد أو 4 ساعات بعده.',
      en: 'Separate iron/zinc administration by at least 2 hours before or 4 hours after ciprofloxacin.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: راجع قائمة أدوية المريض بحثاً عن مكملات علاج الأنيميا ونظم جدول إعطائها في مواعيد متباعدة.',
      en: 'Nursing Assessment: Screen the patient for anemia supplements and reschedule medication timing.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },
  {
    antibioticId: 'ciprofloxacin',
    targetId: 'nsaids',
    severity: 'severe',
    title: { ar: 'تعارض خطير: زيادة خطر التشنجات العصبية والإجهاد الكلوي', en: 'Severe: Elevated Seizure, Neurotoxicity & Renal Risk' },
    mechanism: {
      ar: 'الجمع بين الفلوروكينولونات ومضادات الالتهاب غير الستيرويدية (NSAIDs مثل كتافلام/بروفين) يزيد من تثبيط مستقبلات GABA في الدماغ والإجهاد الكلوي.',
      en: 'Concurrent use increases GABA antagonism in the CNS, significantly lowering the seizure threshold and increasing renal strain.',
    },
    management: {
      ar: 'تجنب تناول المسكنات القوية (كالإيبوبروفين والديكلوفيناك) بالتزامن مع الفلوروكينولونات دون استشارة الطبيب، واستخدم الباراسيتامول كمسكن آمن عند الحاجة.',
      en: 'Avoid concurrent NSAIDs without physician approval; paracetamol is the safer analgesic alternative.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: اسأل المريض إذا كان لديه تاريخ مرضي للتشنجات العصبية ووجهه لاستخدام الباراسيتامول لتسكين الألم.',
      en: 'Nursing Tip: Check patient history for epilepsy and advocate for paracetamol for pain control.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Metronidazole (Flagyl)
  {
    antibioticId: 'metronidazole',
    targetId: 'alcohol',
    severity: 'severe',
    title: { ar: 'تعارض خطير جداً: تفاعل ديسولفيرام الحاد والتسمم الكحولي', en: 'Severe: Severe Disulfiram-like Reaction' },
    mechanism: {
      ar: 'يثبط الميترونيدازول إنزيم ألديهيد ديهيدروجيناز الكبدي، مما يؤدي لتراكم مادة الأسيتالديهيد السامة في الدم مسبباً قيئاً مستمراً، تسارع ضربات القلب، وهبوط ضغط حاد.',
      en: 'Inhibits acetaldehyde dehydrogenase, causing toxic accumulation of acetaldehyde with flushing, vomiting, tachycardia and hypotension.',
    },
    management: {
      ar: 'ممنوع منعاً باتاً تناول أي مشروبات كحولية أو أدوية تحتوي على كحول أثناء العلاج بالميترونيدازول ولمدة 48 ساعة كاملة بعد انتهاء آخر جرعة.',
      en: 'Strictly avoid any alcohol consumption during therapy and for at least 48 hours after discontinuation.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: حذر المريض بوضوح شديد، وتأكد من خلو غسول الفم أو أدوية السعال التي يتناولها من نسب الكحول.',
      en: 'Nursing Alert: Emphasize complete alcohol abstinence, including alcohol-containing mouthwashes and cough syrups.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },
  {
    antibioticId: 'metronidazole',
    targetId: 'warfarin',
    severity: 'severe',
    title: { ar: 'تعارض خطير: زيادة مفعول الوارفارين وخطر النزيف', en: 'Severe: Potentiation of Warfarin & Hemorrhage Risk' },
    mechanism: {
      ar: 'يثبط الميترونيدازول استقلاب الوارفارين في الكبد (CYP2C9)، مما يؤدي إلى تراكمه وارتفاع حاد في نسبة السيولة (INR) وحدوث نزيف.',
      en: 'Inhibits CYP2C9 metabolism of S-warfarin, dramatically increasing INR and bleeding risk.',
    },
    management: {
      ar: 'يجب مراجعة الطبيب المعالج فوراً لمراقبة تحليل السيولة (INR) بدقة وتعديل الجرعة تحت إشراف طبي.',
      en: 'Requires immediate physician review for frequent INR monitoring and anticoagulant dose adjustment.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: راقب علامات النزيف لدى المريض (نزيف اللثة، كدمات غير مبررة، أو تحول لون البراز للأسود).',
      en: 'Nursing Assessment: Monitor for signs of bleeding (ecchymosis, hematuria, melena).',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Doxycycline
  {
    antibioticId: 'doxycycline',
    targetId: 'dairy',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: ارتباط الكالسيوم وضعف الامتصاص', en: 'Moderate: Calcium Binding & Reduced Bioavailability' },
    mechanism: {
      ar: 'يرتبط التتراسيكلين مع أيونات الكالسيوم في منتجات الألبان مكوناً مركباً مخلبياً يمنع امتصاص الدواء عبر جدار الأمعاء.',
      en: 'Doxycycline chelates with calcium ions in dairy, impairing intestinal absorption.',
    },
    management: {
      ar: 'تناول الدوكسيسيكلين مع كوب ماء كبير بساعتين قبل أو بعد تناول الحليب أو مشتقات الألبان.',
      en: 'Administer doxycycline at least 2 hours before or after dairy ingestion.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: ذكر مريض حب الشباب بعدم تناول الكبسولة مع كوب حليب الإفطار لضمان فاعلية العلاج.',
      en: 'Nursing Tip: Instruct acne patients never to swallow capsules with morning milk.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },
  {
    antibioticId: 'doxycycline',
    targetId: 'iron',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: ارتباط الحديد وإلغاء امتصاص الدواء', en: 'Moderate: Iron Chelation Inhibiting Efficacy' },
    mechanism: {
      ar: 'مكملات الحديد والزنك ترتبط بشدة مع الدوكسيسيكلين وتقلل تركيزه في مجرى الدم بدرجة كبيرة.',
      en: 'Iron and zinc salts significantly reduce doxycycline absorption through heavy chelation.',
    },
    management: {
      ar: 'افصل بين كبسولة الدوكسيسيكلين وأقراص الحديد بفارق زمني لا يقل عن 2 إلى 3 ساعات.',
      en: 'Space iron supplements and doxycycline by at least 2-3 hours.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: تحقق من أدوية الفيتامينات والحديد التي يتناولها المريض وافصل مواعيدها في كارت المواعيد.',
      en: 'Nursing Stewardship: Review multivitamin/iron intake and reschedule doses.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Amoxicillin / Clavulanate (Augmentin)
  {
    antibioticId: 'amoxicillin-clavulanic-acid',
    targetId: 'birth_control',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: تنبيه بخصوص حبوب منع الحمل (خاصة عند القيء أو الإسهال)', en: 'Moderate: Contraceptive Efficacy Caution (Especially with GI Upset)' },
    mechanism: {
      ar: 'المضادات واسعة المجال قد تؤثر على الفلورا المعوية أو تسبب إسهالاً وقيئاً يقلل امتصاص أقراص منع الحمل الهرمونية.',
      en: 'Broad-spectrum antibiotics may alter gut flora or induce vomiting/diarrhea that impairs oral contraceptive absorption.',
    },
    management: {
      ar: 'يُنصح باستخدام وسيلة حماية إضافية أثناء كورس المضاد الحيوي خاصة في حال حدوث قيء أو إسهال شديد.',
      en: 'Consider additional barrier protection during the course, especially if vomiting or severe diarrhea occurs.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: قدم التثقيف الصحي اللازم للسيدات بشأن الاستمرار على قرص منع الحمل في موعده الثابت.',
      en: 'Nursing Patient Education: Counsel patients on maintaining fixed contraceptive timing and backup precautions if GI upset occurs.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },
  {
    antibioticId: 'amoxicillin-clavulanic-acid',
    targetId: 'meals',
    severity: 'safe',
    title: { ar: 'آمن وموصى به: تناوله مع بداية الطعام لتقليل اضطراب المعدة', en: 'Safe: Take with Food to Minimize GI Upset' },
    mechanism: {
      ar: 'تناول الأوجمنتين مع بداية وجبة خفيفة يحسن امتصاص حمض الكلافولانيك ويقلل كثيراً من الغثيان والإسهال وآلام المعدة.',
      en: 'Administering at the start of a meal optimizes clavulanate absorption and minimizes GI intolerance.',
    },
    management: {
      ar: 'تناول الجرعة دائماً مع أول لقمة من الوجبة مع كوب ماء كامل.',
      en: 'Take with the first bites of a meal or light snack with water.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: درب المريض أو الأم على إعطاء الجرعة للطفل مع بداية الطعام لمنع القيء والمغص.',
      en: 'Nursing Tip: Instruct parents to give pediatric doses with food to avoid gastric irritation.',
    },
    source: INTERACTION_SOURCES.eda_stewardship,
  },
  {
    antibioticId: 'amoxicillin-clavulanic-acid',
    targetId: 'allopurinol',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: زيادة في خطر الطفح الجلدي الدوائي', en: 'Moderate: Increased Incidence of Drug Rash' },
    mechanism: {
      ar: 'الجمع بين الأموكسيسيلين وألوبيورينول يزيد من احتمالية ظهور طفح جلدي أحمر غير تحسسي أو تحسسي.',
      en: 'Concomitant administration significantly increases the frequency of erythematous skin rashes.',
    },
    management: {
      ar: 'يراقب المريض ظهور أي احمرار أو حكة بالجلد، واستشر الطبيب فوراً لتقييم الحالة إذا ظهر طفح جلدي.',
      en: 'Monitor skin closely; consult physician if rash develops.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: فحص جلد المريض والتأكد من عدم الخلط بين الطفح الدوائي والحساسية المفرطة للبنسلين.',
      en: 'Nursing Assessment: Differentiate between ampicillin-like rash and true penicillin anaphylaxis.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Clarithromycin (Klacid)
  {
    antibioticId: 'clarithromycin',
    targetId: 'statins',
    severity: 'severe',
    title: { ar: 'تعارض خطير جداً (CYP3A4): خطر انحلال العضلات والفشل الكلوي', en: 'Severe CYP3A4 Interaction: High Risk of Rhabdomyolysis' },
    mechanism: {
      ar: 'الكلاريثرومايسين مثبط قوي لإنزيم CYP3A4 الكبدي، مما يؤدي لتراكم أدوية الكوليسترول (سيمفاستاتين وأتورفاستاتين) لدرجات سمية تسبب انحلال العضلات.',
      en: 'Potent CYP3A4 inhibition elevates statin plasma levels, precipitating severe myopathy and rhabdomyolysis.',
    },
    management: {
      ar: 'يجب مراجعة الطبيب المعالج أو الصيدلي قبل تناولهما معاً؛ قد يوجه الطبيب بإيقاف الستاتين مؤقتاً أثناء كورس الكلاريثرومايسين أو تعديل الخطة العلاجية.',
      en: 'Consult your prescribing physician or pharmacist immediately before combining; temporary statin suspension or alternative therapy is typically required.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي حرج: راجع أدوية المريض للتأكد من عدم تناول السيمفاستاتين/الأتورفاستاتين دون مراجعة طبية، ونبهه للإبلاغ الفوري عن أي ألم عضلي.',
      en: 'Critical Nursing Check: Screen patients for statins; advise immediate reporting of unexplained muscle pain or dark urine.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Universal Probiotics Rule
  {
    antibioticId: 'amoxicillin-clavulanic-acid',
    targetId: 'probiotics',
    severity: 'safe',
    title: { ar: 'آمن ومفيد جداً: تعويض البكتيريا النافعة بشرط الفصل ساعتين', en: 'Safe & Recommended: Restoring Gut Flora (Space by 2 Hours)' },
    mechanism: {
      ar: 'تناول البروبيوتيك أو الزبادي يساعد على استعادة توازن ميكروبيوم الأمعاء والوقاية من الإسهال المرتبط بالمضادات، بشرط عدم تناولهما في نفس اللحظة.',
      en: 'Probiotics replenish beneficial intestinal microbiota disrupted by broad-spectrum antibiotic therapy when spaced apart.',
    },
    management: {
      ar: 'يوصى بتناولهما بفارق زمني ساعتين على الأقل عن موعد جرعة المضاد، حتى لا يقتل المضاد الحيوي بكتيريا البروبيوتيك الحية.',
      en: 'Administer probiotics spaced at least 2 hours away from the antibiotic dose.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: انصح المريض بتناول الزبادي الطبيعي الغني بالخمائر النافعة يومياً بعد جرعة المضاد بساعتين.',
      en: 'Nursing Recommendation: Encourage daily yogurt or probiotic intake spaced 2 hours from doses.',
    },
    source: INTERACTION_SOURCES.who_aware,
  },
  {
    antibioticId: 'doxycycline',
    targetId: 'probiotics',
    severity: 'safe',
    title: { ar: 'آمن ومفيد: حماية الجهاز الهضمي بالفصل ساعتين', en: 'Safe: Gastrointestinal Protection (Space 2 Hours)' },
    mechanism: {
      ar: 'يساعد البروبيوتيك في حماية الأمعاء؛ يفصل بساعتين لضمان بقاء البكتيريا النافعة حية وعدم تعارض الكالسيوم في الزبادي مع الدوكسيسيكلين.',
      en: 'Supports digestive health during treatment; space 2 hours away to protect flora and avoid dairy calcium chelation.',
    },
    management: {
      ar: 'افصل بين جرعة المضاد والزبادي أو البروبيوتيك بساعتين على الأقل.',
      en: 'Space probiotic ingestion at least 2 hours apart from the antibiotic.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: تنظيم مواعيد الوجبات والمكملات بدقة.',
      en: 'Nursing Tip: Organize schedule for optimal spacing.',
    },
    source: INTERACTION_SOURCES.who_aware,
  },

  // Nitrofurantoin
  {
    antibioticId: 'nitrofurantoin',
    targetId: 'calcium_antacids',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: مضادات الحموضة تقلل امتصاص الدواء', en: 'Moderate: Antacids Inhibit Absorption' },
    mechanism: {
      ar: 'مضادات الحموضة المحتوية على ثلاثي سيليكات المغنيسيوم ترتبط بالنيتروفورانتوين وتقلل وصوله للمسالك البولية.',
      en: 'Magnesium-containing antacids bind nitrofurantoin, impairing urinary concentration.',
    },
    management: {
      ar: 'تجنب تناول مضادات الحموضة المحتوية على المغنيسيوم أثناء كورس علاج المسالك، أو افصل بـ 2 إلى 3 ساعات.',
      en: 'Avoid magnesium trisilicate antacids or space by at least 2–3 hours.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: شرب كميات وافرة من الماء وتجنب الفوار القلوي دون استشارة.',
      en: 'Nursing Tip: Encourage generous fluid intake and avoid urinary alkalinizers unless prescribed.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },
  {
    antibioticId: 'nitrofurantoin',
    targetId: 'meals',
    severity: 'safe',
    title: { ar: 'آمن وموصى به بقوة: تناوله مع الطعام يزيد الامتصاص ويمنع الغثيان', en: 'Safe & Recommended: Take with Food' },
    mechanism: {
      ar: 'تناول النيتروفورانتوين مع وجبة طعام يزيد من التوافر الحيوي للدواء بنسبة 40% ويقلل اضطراب المعدة.',
      en: 'Food significantly enhances drug absorption and substantially mitigates nausea.',
    },
    management: {
      ar: 'تناول الكبسولة دائماً في منتصف أو نهاية الوجبة مع كوب ماء كبير.',
      en: 'Always take capsules with food or milk.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: التأكيد على تناول الدواء مع وجبتي الإفطار والعشاء لمنع فقدان الشهية.',
      en: 'Nursing Tip: Align administration with breakfast and dinner to prevent anorexia.',
    },
    source: INTERACTION_SOURCES.eda_stewardship,
  },

  // Co-trimoxazole (Septazole)
  {
    antibioticId: 'co-trimoxazole',
    targetId: 'warfarin',
    severity: 'severe',
    title: { ar: 'تعارض خطير: زيادة حادة في سيولة الدم وخطر النزيف', en: 'Severe: Marked Increase in Bleeding Risk' },
    mechanism: {
      ar: 'يثبط السلفاميثوكسازول استقلاب الوارفارين ويزيحه من بروتينات البلازما، مما يرفع INR لدرجات خطيرة مهددة للحياة.',
      en: 'Inhibits warfarin clearance and displaces it from albumin, risking severe hemorrhage.',
    },
    management: {
      ar: 'يجب مراجعة الطبيب المعالج فوراً لمراقبة تحليل INR وتعديل الجرعة أو اختيار بديل آمن.',
      en: 'Consult prescribing physician immediately for INR monitoring and dose adjustment.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي حرج: تنبيه المريض لمراقبة أي كدمات أو رعاف أو نزيف أثناء غسيل الأسنان.',
      en: 'Critical Nursing Check: Instruct patient to immediately report epistaxis, gingival bleeding, or hematomas.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Ceftriaxone
  {
    antibioticId: 'ceftriaxone',
    targetId: 'calcium_antacids',
    severity: 'severe',
    title: { ar: 'تعارض خطير: ترسبات بلورية غير قابلة للذوبان مع محاليل الكالسيوم الوريدية', en: 'Severe: Calcium-Ceftriaxone IV Particulate Precipitation' },
    mechanism: {
      ar: 'مزج أو إعطاء السيفترياكسون بالتزامن مع محاليل الكالسيوم الوريدية (كالرينجر لاكتات) يؤدي لتكون ترسبات صلبة خطيرة في الرئتين والكلى خاصة لدى حديثي الولادة.',
      en: 'Co-administration with IV calcium forms fatal precipitates in the pulmonary and renal vasculature, especially in neonates.',
    },
    management: {
      ar: 'ممنوع منعاً باتاً خلط أو إعطاء محاليل الكالسيوم الوريدية مع السيفترياكسون عبر نفس الخط الوريدي أو لحديثي الولادة.',
      en: 'Strictly contraindicated with calcium-containing IV solutions in neonates and shared IV lines.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي حرج للمستشفيات: غسل الخط الوريدي جيداً بمحلول ملحي طبيعي (Normal Saline) قبل وبعد تسريب أي مضاد حيوي.',
      en: 'Hospital Nursing Standard: Thoroughly flush lines with normal saline before and after IV antibiotic infusions.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Moxifloxacin
  {
    antibioticId: 'moxifloxacin',
    targetId: 'calcium_antacids',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: مضادات الحموضة تعطل امتصاص الموكسيفلوكساسين', en: 'Moderate: Antacid Chelation Impairing Moxifloxacin' },
    mechanism: {
      ar: 'أيونات الكالسيوم والمغنيسيوم والألومنيوم في مضادات الحموضة ترتبط بالموكسيفلوكساسين وتمنع امتصاصه في الجهاز الهضمي بنسبة تزيد عن 60%.',
      en: 'Polyvalent cations (Mg, Al, Ca) chelate moxifloxacin, reducing bioavailability significantly.',
    },
    management: {
      ar: 'تناول موكسيفلوكساسين قبل أدوية الحموضة بساعتين على الأقل أو بعدها بـ 4 ساعات.',
      en: 'Take moxifloxacin 2 hours before or 4 hours after antacids.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: اسأل المريض إذا كان يتناول فوار أو أقراص لعلاج حرقان المعدة ونبهه لمواعيد الفصل.',
      en: 'Nursing Guidance: Screen for OTC antacid use and educate patient on separated administration times.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Vancomycin
  {
    antibioticId: 'vancomycin',
    targetId: 'nsaids',
    severity: 'severe',
    title: { ar: 'تعارض حرج: سمية كلوية مضاعفة مع المسكنات القوية', en: 'Severe: Synergistic Nephrotoxicity with NSAIDs' },
    mechanism: {
      ar: 'مضادات الالتهاب غير الستيرويدية كالكتافلام والبروفين تقلل تدفق الدم الكلوي وتضاعف خطر القصور الكلوي الحاد الناتج عن الفانكومايسين.',
      en: 'NSAIDs constrict renal afferent arterioles and synergistically exacerbate vancomycin nephrotoxicity.',
    },
    management: {
      ar: 'تجنب استخدام المسكنات غير الستيرويدية بالتزامن مع الفانكومايسين دون استشارة الطبيب واستبدالها بالباراسيتامول الآمن عند الحاجة.',
      en: 'Avoid concurrent NSAIDs without medical supervision; utilize paracetamol for analgesia during vancomycin therapy.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي سريري: مراقبة كمية البول اليومية ومستوى الكرياتينين في الدم بانتظام.',
      en: 'Clinical Nursing Metric: Monitor daily urine output and serum creatinine rigorously.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },

  // Flucloxacillin
  {
    antibioticId: 'flucloxacillin',
    targetId: 'meals',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: الطعام يقلل امتصاص الفلوكلوكساسيللين إلى النصف', en: 'Moderate: Food Significantly Reduces Absorption' },
    mechanism: {
      ar: 'وجود الطعام في المعدة يعيق امتصاص فلوكلوكساسيللين (فلوكسامو/فلوسيل) بنسبة تفوق 50% مما يؤدي لفشل القضاء على العدوى.',
      en: 'Food delays gastric emptying and reduces flucloxacillin absorption by over 50%.',
    },
    management: {
      ar: 'تناول الكبسولات أو الأقراص على معدة فارغة تماماً (قبل الأكل بساعة أو بعد الأكل بساعتين).',
      en: 'Take strictly on an empty stomach (1 hour before or 2 hours after meals).',
    },
    nursingTip: {
      ar: 'إرشاد للمريض: لا تتناول الدواء وسط الأكل، بل تناوله مع كوب ماء على معدة فارغة.',
      en: 'Patient Instruction: Always take with a glass of water on an empty stomach, never during meals.',
    },
    source: INTERACTION_SOURCES.eda_stewardship,
  },
];

const QUINOLONE_IDS = new Set(['ciprofloxacin', 'levofloxacin', 'moxifloxacin']);
const TETRACYCLINE_IDS = new Set(['doxycycline']);
const MACROLIDE_IDS = new Set(['azithromycin', 'clarithromycin', 'erythromycin']);
const NITROIMIDAZOLE_IDS = new Set(['metronidazole']);
const AMINOGLYCOSIDE_IDS = new Set(['gentamicin', 'amikacin']);
const PENICILLIN_IDS = new Set([
  'amoxicillin',
  'amoxicillin-clavulanic-acid',
  'ampicillin-sulbactam',
  'flucloxacillin',
  'penicillin-v-potassium',
]);

/**
 * Resolves an evidence-supported interaction rule for an antibiotic + target substance/co-medication.
 * First checks exact rules in `RULES`, then checks validated class-based pharmacokinetic/pharmacodynamic rules.
 * Returns `undefined` when no rule is documented for the pair (never fabricates interactions).
 */
export function findInteractionRule(
  antibioticId: string,
  targetIdOrAlias: string
): InteractionRule | undefined {
  const abx = (antibioticId || '').toLowerCase().trim();
  const targetId = resolveTargetId(targetIdOrAlias) || (targetIdOrAlias || '').toLowerCase().trim();
  if (!abx || !targetId) return undefined;

  // 1. Direct exact rule lookup
  const exact = RULES.find((r) => r.antibioticId === abx && r.targetId === targetId);
  if (exact) {
    return {
      ...exact,
      source: exact.source || INTERACTION_SOURCES.medlineplus_fda,
    };
  }

  // 2. Validated class-level rules shared across Interactions and PrescriptionRadar
  const isQuinolone = QUINOLONE_IDS.has(abx);
  const isTetracycline = TETRACYCLINE_IDS.has(abx);
  const isMacrolide = MACROLIDE_IDS.has(abx);
  const isMetro = NITROIMIDAZOLE_IDS.has(abx);
  const isAminoglycoside = AMINOGLYCOSIDE_IDS.has(abx);
  const isPenicillin = PENICILLIN_IDS.has(abx);

  if (targetId === 'dairy') {
    if (isQuinolone || isTetracycline) {
      return {
        antibioticId: abx,
        targetId,
        severity: 'moderate',
        title: {
          ar: 'تفاعل متوسط: تعارض امتصاص قوي مع الكالسيوم ومنتجات الألبان (Chelation)',
          en: 'Moderate: Major Absorption Chelation with Dairy & Calcium — Separate by 2 Hours',
        },
        mechanism: {
          ar: 'أيونات الكالسيوم في الحليب ومنتجات الألبان ترتبط بالمضاد الحيوي في المعدة وتقلل امتصاصه بنسبة تصل إلى 50%.',
          en: 'Calcium ions in dairy bind to this antibiotic in the gut, reducing systemic absorption by up to 50%.',
        },
        management: {
          ar: 'افصل بين جرعة المضاد الحيوي ومنتجات الألبان أو الكالسيوم بساعتين على الأقل قبلها أو 4 ساعات بعدها.',
          en: 'Separate this antibiotic from dairy products by at least 2 hours before or 4 hours after.',
        },
        nursingTip: {
          ar: 'إرشاد تمريضي: يُبلع القرص مع كوب ماء كامل وليس مع الحليب.',
          en: 'Nursing Stewardship: Administer with a full glass of water, never with milk.',
        },
        source: INTERACTION_SOURCES.medlineplus_fda,
      };
    }
  }

  if (targetId === 'iron') {
    if (isQuinolone || isTetracycline || abx === 'cefdinir') {
      return {
        antibioticId: abx,
        targetId,
        severity: 'moderate',
        title: {
          ar: 'تفاعل متوسط: فصل زمني إلزامي عن مكملات الحديد والزنك (2–4 ساعات)',
          en: 'Moderate: Mandatory 2–4 Hour Separation from Iron & Zinc Supplements',
        },
        mechanism: {
          ar: 'أيونات الحديد والزنك ترتبط كيميائياً بالمضاد الحيوي في الجهاز الهضمي وتمنع امتصاصه.',
          en: 'Iron and zinc ions strongly chelate this antibiotic in the GI tract, markedly reducing bioavailability.',
        },
        management: {
          ar: 'تناول مكملات الحديد أو الزنك بعد جرعة المضاد الحيوي بـ 3 إلى 4 ساعات على الأقل (أو قبلها بساعتين).',
          en: 'Take iron or zinc supplements at least 3–4 hours after (or 2 hours before) your antibiotic dose.',
        },
        nursingTip: {
          ar: 'إرشاد تمريضي: راجع مكملات الأنيميا والفيتامينات المتعددة واضبط جدول إعطائها بعيداً عن المضاد.',
          en: 'Nursing Assessment: Screen for multivitamins/iron and separate administration times.',
        },
        source: INTERACTION_SOURCES.medlineplus_fda,
      };
    }
  }

  if (targetId === 'calcium_antacids') {
    if (isQuinolone || isTetracycline || isMacrolide || abx === 'cefuroxime') {
      return {
        antibioticId: abx,
        targetId,
        severity: 'moderate',
        title: {
          ar: 'تفاعل متوسط: مضادات الحموضة ومكملات الكالسيوم تقلل امتصاص المضاد الحيوي',
          en: 'Moderate: Antacids & Calcium Supplements Reduce Antibiotic Absorption',
        },
        mechanism: {
          ar: 'أملاح الألومنيوم والمغنيسيوم والكالسيوم تقلل امتصاص هذا المضاد الحيوي وتضعف تركيزه العلاجي في الدم.',
          en: 'Aluminum, magnesium, and calcium salts reduce the gastrointestinal bioavailability of this antibiotic.',
        },
        management: {
          ar: 'يجب الفصل ساعتين على الأقل قبل أو 4 ساعات بعد جرعة المضاد الحيوي.',
          en: 'Separate antacids/calcium by at least 2 hours before or 4 hours after the antibiotic dose.',
        },
        nursingTip: {
          ar: 'إرشاد تمريضي: اسأل المريض عن استخدام أدوية الحموضة أو الفوار ونظم مواعيدها بعيداً عن المضاد.',
          en: 'Nursing Guidance: Check for OTC antacids and schedule them away from antibiotic doses.',
        },
        source: INTERACTION_SOURCES.medlineplus_fda,
      };
    }
  }

  if (targetId === 'nsaids') {
    if (isQuinolone || isAminoglycoside || abx === 'vancomycin') {
      return {
        antibioticId: abx,
        targetId,
        severity: 'severe',
        title: {
          ar: 'تعارض خطير: تجنب الجمع مع المسكنات المضادة للالتهاب (NSAIDs)',
          en: 'Severe Warning: Avoid Combining with NSAID Painkillers',
        },
        mechanism: {
          ar: isQuinolone
            ? 'الجمع بين الفلوروكينولونات والمسكنات (كتافلام/بروفين) يزيد خطر تنبيه الجهاز العصبي والتشنجات والإجهاد الكلوي.'
            : 'الجمع بين هذا المضاد الحيوي والمسكنات غير الستيرويدية يضاعف خطر السمية الكلوية والقصور الكلوي الحاد.',
          en: isQuinolone
            ? 'Combining fluoroquinolones with NSAIDs increases CNS excitation/seizure risk and renal strain.'
            : 'Combining this antibiotic with NSAIDs synergistically increases nephrotoxicity risk.',
        },
        management: {
          ar: 'راجع الطبيب المعالج أو الصيدلي قبل الجمع بينهما؛ يُفضل استخدام الباراسيتامول لتسكين الألم أو الحرارة عند اللزوم.',
          en: 'Consult your prescribing doctor or pharmacist before combining; paracetamol is preferred for pain/fever if needed.',
        },
        nursingTip: {
          ar: 'إرشاد تمريضي: تجنب إعطاء المسكنات غير الستيرويدية روتينياً وراقب وظائف الكلى.',
          en: 'Nursing Alert: Avoid routine NSAID co-administration and monitor renal function.',
        },
        source: INTERACTION_SOURCES.medlineplus_fda,
      };
    }
  }

  if (targetId === 'warfarin') {
    if (isMetro || isMacrolide || isQuinolone || abx === 'co-trimoxazole' || abx === 'cefoperazone-sulbactam') {
      return {
        antibioticId: abx,
        targetId,
        severity: 'severe',
        title: {
          ar: 'تفاعل خطير: يرفع سيولة الدم (INR) ويضاعف خطر النزيف',
          en: 'Severe Interaction: Elevates INR & Bleeding Risk with Warfarin',
        },
        mechanism: {
          ar: 'يثبط هذا المضاد الحيوي تكسير الوارفارين في الكبد أو يؤثر على عوامل التجلط، مما يضاعف خطر النزيف الحاد.',
          en: 'This antibiotic inhibits hepatic warfarin metabolism or alters coagulation flora, sharply increasing bleeding risk.',
        },
        management: {
          ar: 'يجب مراجعة الطبيب المعالج فوراً لقياس سيولة الدم (INR) وضبط الجرعة تحت إشراف طبي دقيق.',
          en: 'Consult your physician promptly for close INR monitoring and potential anticoagulant adjustment.',
        },
        nursingTip: {
          ar: 'إرشاد تمريضي: راقب أي علامات نزيف باللثة أو كدمات بالجلد وأبلغ الطبيب فوراً.',
          en: 'Nursing Assessment: Monitor closely for bruising, gum bleeding, or melena.',
        },
        source: INTERACTION_SOURCES.medlineplus_fda,
      };
    }
    // General antibiotic + warfarin caution
    if (ACTIVE_INGREDIENTS.some((a) => a.id === abx)) {
      return {
        antibioticId: abx,
        targetId,
        severity: 'moderate',
        title: {
          ar: 'تنبيه: راقب تحليل السيولة (INR) عند استخدام أي مضاد حيوي مع الوارفارين',
          en: 'Moderate Caution: Monitor INR During Any Antibiotic Course with Warfarin',
        },
        mechanism: {
          ar: 'المضادات الحيوية قد تقلل البكتيريا المعوية المنتجة لفيتامين K مما قد يغير مستوى سيولة الدم (INR).',
          en: 'Antibiotics can alter gut vitamin K-producing flora and infection itself can shift INR levels.',
        },
        management: {
          ar: 'أبلغ الطبيب المعالج لمتابعة تحليل السيولة (INR) أثناء الكورس العلاجي.',
          en: 'Inform your prescribing physician so INR can be monitored during therapy.',
        },
        nursingTip: {
          ar: 'إرشاد تمريضي: راجع أحدث تحليل INR للمريض وراقب علامات النزيف.',
          en: 'Nursing Note: Verify recent INR values and observe for bleeding signs.',
        },
        source: INTERACTION_SOURCES.medlineplus_fda,
      };
    }
  }

  if (targetId === 'statins') {
    if (abx === 'clarithromycin' || abx === 'erythromycin') {
      return {
        antibioticId: abx,
        targetId,
        severity: 'severe',
        title: {
          ar: 'تفاعل خطير (CYP3A4): خطر انحلال العضلات مع أدوية الكوليسترول',
          en: 'Severe CYP3A4 Interaction: Myopathy & Rhabdomyolysis Risk with Statins',
        },
        mechanism: {
          ar: 'كلاريثرومايسين وإريثرومايسين يثبطان بشدة إنزيم CYP3A4 المسؤول عن تكسير أدوية الكوليسترول (مثل سيمفاستاتين وأتورفاستاتين).',
          en: 'Clarithromycin and erythromycin strongly inhibit CYP3A4 statin metabolism, risking severe myopathy.',
        },
        management: {
          ar: 'استشر الطبيب المعالج أو الصيدلي قبل تناولهما معاً؛ غالباً يلزم إيقاف الستاتين مؤقتاً أثناء كورس المضاد.',
          en: 'Consult your prescribing doctor or pharmacist before combining; temporary statin hold is often required.',
        },
        nursingTip: {
          ar: 'إرشاد تمريضي: نبه المريض لمراجعة الطبيب فوراً عند الشعور بألم أو ضعف غير مبرر بالعضلات.',
          en: 'Nursing Alert: Instruct patient to report muscle pain, tenderness, or dark urine immediately.',
        },
        source: INTERACTION_SOURCES.medlineplus_fda,
      };
    }
  }

  if (targetId === 'allopurinol') {
    if (isPenicillin && (abx === 'amoxicillin' || abx === 'amoxicillin-clavulanic-acid' || abx === 'ampicillin-sulbactam')) {
      return {
        antibioticId: abx,
        targetId,
        severity: 'moderate',
        title: {
          ar: 'تفاعل متوسط: زيادة احتمالية ظهور الطفح الجلدي مع ألوبيورينول',
          en: 'Moderate: Increased Risk of Skin Rash with Allopurinol',
        },
        mechanism: {
          ar: 'الجمع بين مركبات الأمينوبنسلين (أموكسيسيلين/أمبيسيلين) وألوبيورينول يزيد من معدل حدوث الطفح الجلدي.',
          en: 'Concurrent use of aminopenicillins and allopurinol increases the incidence of skin rashes.',
        },
        management: {
          ar: 'راقب الجلد وأبلغ الطبيب المعالج إذا ظهر أي طفح جلدي أو حكة.',
          en: 'Monitor skin and consult your physician if a rash develops.',
        },
        nursingTip: {
          ar: 'إرشاد تمريضي: تابع حالة الجلد لدى مرضى النقرس الذين يتناولون الأموكسيسيلين أو الأمبيسيلين.',
          en: 'Nursing Assessment: Monitor skin integrity in patients taking allopurinol with aminopenicillins.',
        },
        source: INTERACTION_SOURCES.medlineplus_fda,
      };
    }
  }

  if (targetId === 'probiotics' && ACTIVE_INGREDIENTS.some((a) => a.id === abx)) {
    return {
      antibioticId: abx,
      targetId,
      severity: 'safe',
      title: {
        ar: 'إرشاد: ممتاز لحماية الأمعاء — بشرط الفصل ساعتين عن جرعة المضاد',
        en: 'Guidance: Beneficial for Gut Flora — Must Separate by 2 Hours',
      },
      mechanism: {
        ar: 'تناول البروبيوتيك في نفس لحظة المضاد الحيوي يؤدي لقتل البكتيريا النافعة قبل استفادة الأمعاء منها.',
        en: 'Taking probiotics simultaneously with the antibiotic inactivates the live beneficial bacteria.',
      },
      management: {
        ar: 'تناول البروبيوتيك أو الزبادي بعد جرعة المضاد الحيوي بساعتين على الأقل.',
        en: 'Take probiotics or yogurt at least 2 hours after your antibiotic dose.',
      },
      nursingTip: {
        ar: 'إرشاد تمريضي: جدولة البروبيوتيك في منتصف المسافة بين جرعات المضاد.',
        en: 'Nursing Tip: Schedule probiotics midway between antibiotic doses.',
      },
      source: INTERACTION_SOURCES.who_aware,
    };
  }

  if (targetId === 'paracetamol' && ACTIVE_INGREDIENTS.some((a) => a.id === abx)) {
    return {
      antibioticId: abx,
      targetId,
      severity: 'safe',
      title: {
        ar: 'لا يوجد تداخل دوائي معروف مع الباراسيتامول عند الاستخدام بالجرعة المقررة',
        en: 'No Known Direct Interaction with Paracetamol at Recommended Doses',
      },
      mechanism: {
        ar: 'لا يتعارض الباراسيتامول مع امتصاص هذا المضاد الحيوي عند استخدامه وفق إرشادات الطبيب أو الصيدلي.',
        en: 'Paracetamol does not block the absorption of this antibiotic when used as directed by a clinician.',
      },
      management: {
        ar: 'يُستخدم عند اللزوم فقط وفق تعليمات الطبيب أو الصيدلي مع عدم تجاوز الجرعة اليومية الآمنة.',
        en: 'Use only as directed by your doctor or pharmacist without exceeding safe daily limits.',
      },
      nursingTip: {
        ar: 'إرشاد تمريضي: تأكد من عدم تكرار تناول أكثر من مستحضر لنزلات البرد يحتوي على الباراسيتامول.',
        en: 'Nursing Note: Ensure patient is not taking multiple OTC cold products containing paracetamol.',
      },
      source: INTERACTION_SOURCES.eda_stewardship,
    };
  }

  if (targetId === 'birth_control' && ACTIVE_INGREDIENTS.some((a) => a.id === abx)) {
    return {
      antibioticId: abx,
      targetId,
      severity: 'moderate',
      title: {
        ar: 'تنبيه: الحذر في حال حدوث قيء أو إسهال شديد مع أقراص منع الحمل',
        en: 'Caution: Backup Advice if Severe Vomiting or Diarrhea Occurs',
      },
      mechanism: {
        ar: 'المضادات الحيوية غير الريفامايسينية لا تبطل مفعول أقراص منع الحمل مباشرة، لكن القيء أو الإسهال الشديد قد يمنع امتصاص القرص.',
        en: 'Non-rifamycin antibiotics do not directly induce contraceptive metabolism, but severe GI upset can impair pill absorption.',
      },
      management: {
        ar: 'استمري على قرص منع الحمل في موعده الثابت، واستشيري الطبيب أو الصيدلي بشأن وسيلة إضافية إذا حدث قيء أو إسهال شديد.',
        en: 'Continue taking your pill at its fixed time and consult your clinician regarding backup protection if severe vomiting/diarrhea occurs.',
      },
      nursingTip: {
        ar: 'إرشاد تمريضي: طمأنة المريضة وتوضيح أهمية ثبات الموعد ومراقبة الأعراض الهضمية.',
        en: 'Nursing Education: Counsel on adherence and GI absorption precautions.',
      },
      source: INTERACTION_SOURCES.who_aware,
    };
  }

  return undefined;
}

/**
 * Validated antibiotic–antibiotic interaction rules when two systemic antibiotics are combined.
 */
export const ANTIBIOTIC_PAIR_RULES: AntibioticPairInteractionRule[] = [
  {
    id: 'abx-pair-qt-macrolide-quinolone',
    appliesTo: (a, b) =>
      (MACROLIDE_IDS.has(a) && QUINOLONE_IDS.has(b)) ||
      (QUINOLONE_IDS.has(a) && MACROLIDE_IDS.has(b)),
    severity: 'severe',
    title: {
      ar: 'تداخل دوائي خطير: خطر مضاعف لاضطراب كهرباء القلب (استطالة فترة QT)',
      en: 'Severe Drug–Drug Interaction: Additive QT Interval Prolongation Risk',
    },
    mechanism: {
      ar: 'الجمع بين مضاد من عائلة الماكروليد (مثل أزيثرومايسين/كلاريثرومايسين) ومضاد من عائلة الفلوروكينولون (مثل سيبروفلوكساسين/ليفوفلوكساسين/موكسيفلوكساسين) يزيد من خطر استطالة فترة QT واضطراب نظم القلب.',
      en: 'Combining a macrolide with a fluoroquinolone produces additive cardiac repolarization delay (QT prolongation), increasing arrhythmia risk.',
    },
    management: {
      ar: 'يجب مراجعة الطبيب المعالج أو الصيدلي فوراً قبل تناول هذين المضادين معاً لتقييم الضرورة السريرية وتخطيط القلب.',
      en: 'Consult the prescribing physician or pharmacist promptly before combining these two antibiotics.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: راقب نبض المريض وتأكد من مراجعة الطبيب خاصة لدى مرضى القلب أو نقص البوتاسيوم.',
      en: 'Nursing Alert: Check baseline cardiac history/electrolytes and verify dual-antibiotic order with prescriber.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },
  {
    id: 'abx-pair-nephro-aminoglycoside-vanco-ceph',
    appliesTo: (a, b) =>
      (AMINOGLYCOSIDE_IDS.has(a) && (b === 'vancomycin' || b === 'cephalexin' || b === 'cefuroxime' || b === 'ceftriaxone' || b === 'cefotaxime' || b === 'cefepime')) ||
      (AMINOGLYCOSIDE_IDS.has(b) && (a === 'vancomycin' || a === 'cephalexin' || a === 'cefuroxime' || a === 'ceftriaxone' || a === 'cefotaxime' || a === 'cefepime')),
    severity: 'severe',
    title: {
      ar: 'تداخل دوائي خطير: زيادة خطر السمية الكلوية والسمعية (Nephrotoxicity)',
      en: 'Severe Drug–Drug Interaction: Additive Nephrotoxicity Risk',
    },
    mechanism: {
      ar: 'الجمع بين الأمينوجليكوزيدات (جنتامايسين/أميكاسين) والفانكومايسين أو السيفالوسبورينات الوريدية يزيد من الإجهاد الكلوي التراكمي.',
      en: 'Concomitant administration of aminoglycosides with vancomycin or cephalosporins increases cumulative nephrotoxicity risk.',
    },
    management: {
      ar: 'يُعطى فقط تحت إشراف طبي دقيق بالمستشفيات مع المراقبة المستمرة لوظائف الكلى (الكرياتينين) ومستوى الدواء.',
      en: 'Requires strict clinical supervision with serial serum creatinine and therapeutic drug monitoring.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: لا تخلط الأمينوجليكوزيدات مع مضادات بيتا-لاكتام في نفس المحلول الوريدي، وراقب كمية البول.',
      en: 'Nursing Standard: Never mix aminoglycosides and beta-lactams in the same IV bag/line; monitor urine output.',
    },
    source: INTERACTION_SOURCES.medlineplus_fda,
  },
  {
    id: 'abx-pair-antagonism-tetracycline-penicillin',
    appliesTo: (a, b) =>
      (TETRACYCLINE_IDS.has(a) && PENICILLIN_IDS.has(b)) ||
      (PENICILLIN_IDS.has(a) && TETRACYCLINE_IDS.has(b)),
    severity: 'moderate',
    title: {
      ar: 'تعارض دوائي محتمل: تضاد بين مضاد قاتل للبكتيريا ومضاد مثبط لنموها',
      en: 'Moderate Drug–Drug Caution: Potential Bacteriostatic–Bactericidal Antagonism',
    },
    mechanism: {
      ar: 'التتراسيكلينات (كالدوكسيسيكلين) تثبط تكاثر البكتيريا بينما تحتاج البنسلينات إلى بكتيريا في طور الانقسام النشط لتدمير جدارها الخلوي.',
      en: 'Bacteriostatic tetracyclines can theoretically antagonize the cell-wall bactericidal activity of penicillins in certain infections.',
    },
    management: {
      ar: 'راجع الطبيب المعالج أو الصيدلي للتأكد مما إذا كان الجمع بينهما مقصوداً لحالة خاصة أم يجب الاكتفاء بأحدهما.',
      en: 'Verify with the prescribing physician or pharmacist whether concurrent use is intended.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: تأكد من عدم تناول المريض لمضاد قديم متبقٍ بالمنزل مع الروشتة الجديدة.',
      en: 'Nursing Check: Ensure the patient is not self-medicating with leftover antibiotics alongside a new prescription.',
    },
    source: INTERACTION_SOURCES.eda_stewardship,
  },
];

export const COMMON_QUICK_CHECKS = [
  { antibioticId: 'ciprofloxacin', targetId: 'dairy', label: { ar: 'سيبروفلوكساسين + الحليب ومنتجات الألبان', en: 'Ciprofloxacin + Dairy' } },
  { antibioticId: 'metronidazole', targetId: 'alcohol', label: { ar: 'فلاجيل (ميترونيدازول) + المشروبات الكحولية', en: 'Flagyl + Alcohol' } },
  { antibioticId: 'amoxicillin-clavulanic-acid', targetId: 'birth_control', label: { ar: 'أوجمنتين + حبوب منع الحمل', en: 'Augmentin + Birth Control' } },
  { antibioticId: 'doxycycline', targetId: 'iron', label: { ar: 'دوكسيسيكلين + مكملات الحديد', en: 'Doxycycline + Iron' } },
  { antibioticId: 'clarithromycin', targetId: 'statins', label: { ar: 'كلاسيد + أدوية الكوليسترول (الستاتينات)', en: 'Klacid + Statins' } },
  { antibioticId: 'amoxicillin-clavulanic-acid', targetId: 'probiotics', label: { ar: 'أوجمنتين + الزبادي والبروبيوتيك', en: 'Augmentin + Probiotics' } },
];
