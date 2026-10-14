import { Bi } from './types';

export type SymptomPathwayId = 'cold' | 'sore_throat' | 'cough' | 'diarrhea' | 'unsure';

export type TriageLevel = 'green_care' | 'amber_alert' | 'red_flag' | 'incomplete';

export interface ClinicalReviewMetadata {
  sourceTitle: Bi;
  sourceUrl: string;
  accessedDate: string;
  lastReviewed: string;
  reviewerRole: Bi;
  approvalStatus: Bi;
}

export interface GreenCarePlan {
  id: SymptomPathwayId;
  icon: string;
  title: Bi;
  subtitle: Bi;
  whatToDoNow: Bi[];
  whatToAvoid: Bi[];
  whenToSeekHelp: Bi[];
  ifSymptomsWorsen: Bi;
  reviewMeta: ClinicalReviewMetadata;
}

export interface SafetyQuestionItem {
  id: string;
  text: Bi;
}

export const RED_FLAG_ITEMS: SafetyQuestionItem[] = [
  {
    id: 'rf_breathing',
    text: {
      ar: 'صعوبة شديدة في التنفس، نهجان وقت الراحة، أو ازرقاق في الشفاه أو الوجه',
      en: 'Severe difficulty breathing, shortness of breath at rest, or bluish lips/face',
    },
  },
  {
    id: 'rf_consciousness',
    text: {
      ar: 'إغماء، تشوش ذهني أو ارتباك شديد، خمول غير طبيعي، أو صعوبة في الاستيقاظ',
      en: 'Fainting, severe confusion, extreme lethargy, or difficulty waking up',
    },
  },
  {
    id: 'rf_dehydration',
    text: {
      ar: 'عدم القدرة على الاحتفاظ بأي سوائل بسبب القيء المستمر، أو علامات جفاف شديد (قلة البول بشدة، دوار حاد عند الوقوف)',
      en: 'Inability to keep fluids down, or signs of severe dehydration (very little urination, severe dizziness on standing)',
    },
  },
  {
    id: 'rf_bleeding_pain',
    text: {
      ar: 'وجود دم في البراز أو البلغم أو القيء، أو ألم شديد ومفاجئ، أو صعوبة في بلع اللعاب',
      en: 'Blood in stool, sputum, or vomit, severe sudden pain, or inability to swallow saliva',
    },
  },
  {
    id: 'rf_rapid_worsening',
    text: {
      ar: 'حمى شديدة جداً مصحوبة بتيبس في الرقبة أو طفح جلدي لا يختفي بالضغط، أو تدهور سريع في الحالة العامة',
      en: 'High fever with stiff neck, non-blanching rash, or rapid clinical deterioration',
    },
  },
];

export const HIGH_RISK_GROUP_ITEMS: SafetyQuestionItem[] = [
  {
    id: 'hr_infant_child',
    text: {
      ar: 'المريض رضيع أو طفل صغير (خصوصاً أقل من عامين)',
      en: 'Patient is an infant or young child (especially under 2 years old)',
    },
  },
  {
    id: 'hr_pregnant',
    text: {
      ar: 'سيدة حامل أو مرضع',
      en: 'Pregnant or breastfeeding woman',
    },
  },
  {
    id: 'hr_elderly',
    text: {
      ar: 'كبار السن (65 عاماً فأكثر)',
      en: 'Older adult (65 years or older)',
    },
  },
  {
    id: 'hr_immunocompromised_chronic',
    text: {
      ar: 'وجود ضعف في المناعة (مثل العلاج الكيميائي أو الكورتيزون المطول) أو مرض مزمن مهم (قلب، كلى، كبد، رئة، أو سكري غير منضبط)',
      en: 'Weakened immune system or significant chronic condition (heart, kidney, liver, lung disease, or uncontrolled diabetes)',
    },
  },
];

export const GREEN_CARE_PLANS: Record<SymptomPathwayId, GreenCarePlan> = {
  cold: {
    id: 'cold',
    icon: '🤧',
    title: {
      ar: 'أعراض نزلة برد أو رشح بسيطة',
      en: 'Mild Common Cold / Runny Nose Symptoms',
    },
    subtitle: {
      ar: 'رشح أو انسداد بالأنف، عطس، وإجهاد خفيف بدون علامات خطر',
      en: 'Nasal congestion, runny nose, sneezing, and mild fatigue without danger signs',
    },
    whatToDoNow: [
      {
        ar: 'الحصول على قسط كافٍ من الراحة البدنية والنوم لمساعدة الجهاز المناعي على التعافي الطبيعي.',
        en: 'Get adequate rest and sleep to support natural immune recovery.',
      },
      {
        ar: 'شرب السوائل الدافئة والماء بانتظام على مدار اليوم للحفاظ على ترطيب الجسم وتخفيف لزوجة الإفرازات.',
        en: 'Drink water and warm fluids regularly throughout the day to stay hydrated and loosen secretions.',
      },
      {
        ar: 'استخدام نقط أو بخاخ محلول الملح الأنفي المعقم (Saline nasal spray) لتخفيف انسداد الأنف بأمان.',
        en: 'Use sterile saline nasal drops or spray to gently relieve nasal congestion.',
      },
      {
        ar: 'استنشاق بخار الماء الدافئ أثناء الاستحمام لتهدئة مجرى الأنف والجيوب الأنفية.',
        en: 'Inhale warm moist air (such as during a warm shower) to soothe nasal passages.',
      },
    ],
    whatToAvoid: [
      {
        ar: 'تجنب تناول أي مضاد حيوي دون وصفة طبية؛ فالمضادات الحيوية لا تفيد في نزلات البرد العادية ولا تقصر مدتها.',
        en: 'Do not take antibiotics without a prescription; antibiotics do not treat common colds or shorten their duration.',
      },
      {
        ar: 'تجنب طلب أو أخذ ما يُعرف شعبياً بـ «حقنة البرد أو الخلطة الثلاثية» لما تحمله من مخاطر صحية جسيمة.',
        en: 'Never take unprescribed mixed cold injections (antibiotic + steroid + painkiller).',
      },
      {
        ar: 'تجنب التدخين أو التعرض للدخان والأتربة لأنها تزيد من تهيج الأغشية المخاطية.',
        en: 'Avoid smoking and exposure to secondhand smoke or dust.',
      },
      {
        ar: 'لا تشارك أدويتك السابقة أو بواقي الأدوية الموجودة بالمنزل مع أي شخص آخر.',
        en: 'Do not use leftover medications or share medicines with others.',
      },
    ],
    whenToSeekHelp: [
      {
        ar: 'ظهور ضيق في التنفس، أو ألم في الصدر، أو صفير أثناء التنفس.',
        en: 'Development of shortness of breath, chest pain, or wheezing.',
      },
      {
        ar: 'ألم شديد في الأذن، أو ألم حاد ومتركز في الوجه والجبهة مع تورم حول العين.',
        en: 'Severe earache, or intense localized facial/sinus pain with swelling around the eye.',
      },
      {
        ar: 'ارتفاع شديد ومستمر في درجة الحرارة لا يستجيب للرعاية التحفظية.',
        en: 'Persistent high fever that does not improve with supportive care.',
      },
    ],
    ifSymptomsWorsen: {
      ar: 'إذا ساءت الأعراض فجأة بعد بداية تحسنها، أو استمرت دون أي تحسن ملحوظ، راجع الطبيب أو الصيدلي لإجراء تقييم سريري مباشر.',
      en: 'If symptoms worsen after initially improving ("double sickening") or fail to improve, consult a doctor or pharmacist.',
    },
    reviewMeta: {
      sourceTitle: {
        ar: 'مراجع التثقيف الصحي وترشيد المضادات الحيوية (CDC Be Antibiotics Aware & NICE Self-Care Guidance)',
        en: 'CDC Be Antibiotics Aware & NICE Common Cold Self-Care Guidance',
      },
      sourceUrl: 'https://www.cdc.gov/antibiotic-use/',
      accessedDate: '2026-10-14',
      lastReviewed: '2026-10-14',
      reviewerRole: {
        ar: 'فريق المراجعة التمريضية والتثقيف الصحي (محتوى تثقيفي للمراجعة السريرية)',
        en: 'Nursing Stewardship & Health Education Review Team',
      },
      approvalStatus: {
        ar: 'نموذج تثقيفي إرشادي خاضع للمراجعة السريرية',
        en: 'Educational guidance template subject to clinical review',
      },
    },
  },

  sore_throat: {
    id: 'sore_throat',
    icon: '🧣',
    title: {
      ar: 'ألم أو احتقان بسيط في الحلق',
      en: 'Mild Sore Throat',
    },
    subtitle: {
      ar: 'شعور بجفاف أو خشونة أو ألم بسيط بالحلق عند البلع بدون علامات خطر',
      en: 'Scratchy, dry, or mildly painful throat when swallowing without red flags',
    },
    whatToDoNow: [
      {
        ar: 'الإكثار من شرب السوائل الدافئة المهدئة للحلق (مثل الأعشاب الدافئة أو الماء الدافئ مع العسل للبالغين والأطفال فوق عمر سنة).',
        en: 'Sip warm soothing fluids (such as warm herbal tea or warm water with honey for adults and children over 1 year old).',
      },
      {
        ar: 'الغرغرة بماء دافئ مملح (نصف ملعقة صغيرة ملح في كوب ماء دافئ) مع بصق المحلول وعدم بلعه (للبالغين ومن يستطيع الغرغرة بأمان).',
        en: 'Gargle with warm salt water (spit out after gargling; only for adults and older children able to gargle safely).',
      },
      {
        ar: 'إراحة الصوت وتجنب التحدث بصوت مرتفع أو في أماكن جافة ومليئة بالدخان.',
        en: 'Rest your voice and avoid smoky or dry environments.',
      },
      {
        ar: 'تناول أطعمة لينة وسهلة البلع وتجنب الأطعمة الحارة أو الحمضية التي تزيد تهيج الحلق.',
        en: 'Choose soft, easy-to-swallow foods and avoid spicy or acidic items.',
      },
    ],
    whatToAvoid: [
      {
        ar: 'لا تبدأ بتناول مضاد حيوي لاحتقان الحلق من تلقاء نفسك؛ فالتفريق بين التهاب الحلق الفيروسي والبكتيري يتطلب تقييماً طبياً.',
        en: 'Do not start an antibiotic on your own; distinguishing bacterial from viral pharyngitis requires clinical evaluation.',
      },
      {
        ar: 'تجنب إعطاء العسل للأطفال الرضع أقل من عمر سنة واحدة نهائياً.',
        en: 'Never give honey to infants under 1 year of age.',
      },
      {
        ar: 'تجنب المشروبات الساخنة جداً التي قد تزيد من التهاب الغشاء المخاطي للحلق.',
        en: 'Avoid overly hot beverages that may scald or irritate the throat.',
      },
    ],
    whenToSeekHelp: [
      {
        ar: 'صعوبة شديدة في البلع لدرجة عدم القدرة على بلع اللعاب أو السوائل، أو تغير الصوت ليصبح مكتوماً.',
        en: 'Severe difficulty swallowing, drooling, or a muffled "hot potato" voice.',
      },
      {
        ar: 'ملاحظة بقع بيضاء صديدية واضحة على اللوزتين مع ارتفاع في الحرارة وتورم مؤلم في الغدد الليمفاوية بالرقبة.',
        en: 'Visible white pus/exudates on tonsils accompanied by high fever and tender neck lymph nodes.',
      },
      {
        ar: 'وجود تاريخ مرضي سابق للإصابة بالحمى الروماتيزمية.',
        en: 'Personal history of rheumatic fever or rheumatic heart disease.',
      },
    ],
    ifSymptomsWorsen: {
      ar: 'إذا استمر ألم الحلق دون تحسن أو صاحبه ارتفاع في الحرارة أو طفح جلدي، استشر الطبيب لتقييم الحاجة الفعلية لأي علاج.',
      en: 'If sore throat persists without improvement or is accompanied by fever or rash, consult a physician.',
    },
    reviewMeta: {
      sourceTitle: {
        ar: 'إرشادات الرعاية الذاتية لالتهاب الحلق الحاد (NICE NG84 & CDC Sore Throat Guide)',
        en: 'NICE NG84 Sore Throat Antimicrobial Prescribing & CDC Guidance',
      },
      sourceUrl: 'https://www.cdc.gov/antibiotic-use/',
      accessedDate: '2026-10-14',
      lastReviewed: '2026-10-14',
      reviewerRole: {
        ar: 'فريق المراجعة التمريضية والتثقيف الصحي',
        en: 'Nursing Stewardship & Health Education Review Team',
      },
      approvalStatus: {
        ar: 'نموذج تثقيفي إرشادي خاضع للمراجعة السريرية',
        en: 'Educational guidance template subject to clinical review',
      },
    },
  },

  cough: {
    id: 'cough',
    icon: '🫁',
    title: {
      ar: 'كحة (سعال) حادة بسيطة',
      en: 'Mild Acute Cough',
    },
    subtitle: {
      ar: 'كحة بسيطة مصاحبة لدور برد دون نهجان أو ألم بالصدر أو علامات خطر',
      en: 'Mild cough without shortness of breath, chest pain, or systemic danger signs',
    },
    whatToDoNow: [
      {
        ar: 'الحفاظ على شرب الماء والسوائل الدافئة بانتظام للمساعدة في ترطيب مجرى التنفس وتهدئة السعال.',
        en: 'Drink plenty of water and warm fluids to keep airways moist and soothe coughing.',
      },
      {
        ar: 'يمكن للبالغين والأطفال فوق عمر سنة تناول ملعقة صغيرة من العسل قبل النوم لتهدئة الكحة الليلية.',
        en: 'Adults and children over 1 year old may take honey to help soothe nighttime cough.',
      },
      {
        ar: 'رفع الرأس قليلاً بوسادة إضافية أثناء النوم لتقليل الكحة الناتجة عن الإفرازات الخلفية للأنف.',
        en: 'Elevate the head with an extra pillow during sleep to ease post-nasal drip cough.',
      },
      {
        ar: 'تهوية الغرفة جيداً والابتعاد التام عن التدخين والأتربة والعطور النفاذة.',
        en: 'Keep rooms well-ventilated and avoid smoke, dust, and strong fumes.',
      },
    ],
    whatToAvoid: [
      {
        ar: 'لا تتناول مضاداً حيوياً لمجرد وجود كحة أو تغير لون البلغم؛ فالطبيب وحده هو من يحدد وجود التهاب رئوي بكتيري من عدمه.',
        en: 'Do not take antibiotics solely for a cough or colored phlegm without a doctor’s examination.',
      },
      {
        ar: 'تجنب إعطاء أدوية الكحة والبرد للأطفال الصغار دون استشارة الطبيب أو الصيدلي.',
        en: 'Do not give over-the-counter cough and cold medicines to young children without medical advice.',
      },
    ],
    whenToSeekHelp: [
      {
        ar: 'ظهور ضيق في التنفس، أو سرعة في التنفس، أو ألم في الصدر عند التنفس أو السعال.',
        en: 'Shortness of breath, rapid breathing, or chest pain when breathing or coughing.',
      },
      {
        ar: 'خروج دم مع الكحة أو البلغم، أو استمرار الكحة لفترة طويلة، أو مصاحبتها لفقدان وزن أو عرق ليلي شديد.',
        en: 'Coughing up blood, persistent cough lasting more than 2-3 weeks, or unexplained weight loss/night sweats.',
      },
      {
        ar: 'نوبات سعال شديدة متلاحقة يعقبها قيء أو صوت شهيق عالٍ.',
        en: 'Severe coughing fits followed by vomiting or a "whooping" sound.',
      },
    ],
    ifSymptomsWorsen: {
      ar: 'إذا زادت حدة السعال أو صاحبه ارتفاع في الحرارة أو نهجان، يجب مراجعة الطبيب لفحص الصدر بالسماعة الطبية.',
      en: 'If cough worsens or is accompanied by fever or breathlessness, seek medical chest examination.',
    },
    reviewMeta: {
      sourceTitle: {
        ar: 'إرشادات تدبير السعال الحاد وترشيد المضادات (NICE NG120 & CDC Acute Cough)',
        en: 'NICE NG120 Cough (Acute): Antimicrobial Prescribing & CDC Guidance',
      },
      sourceUrl: 'https://www.cdc.gov/antibiotic-use/',
      accessedDate: '2026-10-14',
      lastReviewed: '2026-10-14',
      reviewerRole: {
        ar: 'فريق المراجعة التمريضية والتثقيف الصحي',
        en: 'Nursing Stewardship & Health Education Review Team',
      },
      approvalStatus: {
        ar: 'نموذج تثقيفي إرشادي خاضع للمراجعة السريرية',
        en: 'Educational guidance template subject to clinical review',
      },
    },
  },

  diarrhea: {
    id: 'diarrhea',
    icon: '💧',
    title: {
      ar: 'إسهال حاد بسيط (بدون جفاف أو دم)',
      en: 'Mild Acute Diarrhea (Without Dehydration or Blood)',
    },
    subtitle: {
      ar: 'ليونة بسيطة في البراز لدى بالغ سليم مع القدرة الكاملة على شرب السوائل',
      en: 'Mild loose stools in an otherwise healthy adult able to drink fluids normally',
    },
    whatToDoNow: [
      {
        ar: 'الأولوية القصوى هي تعويض السوائل والأملاح المفقودة بشرب السوائل على دفعات صغيرة ومتكررة، واستشارة الصيدلي حول محلول الجفاف الفموي (ORS) المناسب وطريقة تحضيره الصحيحة.',
        en: 'Prioritize fluid replacement by sipping fluids frequently; ask a pharmacist about Oral Rehydration Solution (ORS) and proper preparation.',
      },
      {
        ar: 'تناول وجبات خفيفة سهلة الهضم تدريجياً (مثل الأرز المسلوق، البطاطس المسلوقة، الموز، التوست، أو الشوربة الخفيفة).',
        en: 'Eat bland, easy-to-digest foods in small amounts (e.g. boiled rice, potatoes, bananas, toast, clear soup).',
      },
      {
        ar: 'غسل اليدين بالماء والصابون جيداً لمدة 20 ثانية بعد استخدام الحمام وقبل تحضير الطعام لمنع نقل العدوى للأسرة.',
        en: 'Wash hands thoroughly with soap and water after bathroom use and before handling food.',
      },
    ],
    whatToAvoid: [
      {
        ar: 'لا تتناول مضاداً حيوياً أو مطهراً معوياً للإسهال من تلقاء نفسك؛ فبعض حالات الإسهال تسوء أو تتضاعف عند تناول مضاد حيوي غير مناسب.',
        en: 'Do not self-medicate with antibiotics for diarrhea; inappropriate antibiotics can worsen certain gut infections.',
      },
      {
        ar: 'تجنب إعطاء أدوية إيقاف حركة الأمعاء للأطفال نهائياً، ولا تستخدمها للبالغين دون استشارة الطبيب أو الصيدلي.',
        en: 'Never give anti-motility diarrhea medications to children, and do not use them without professional advice.',
      },
      {
        ar: 'تجنب الأطعمة الدسمة والمقلية والسكريات العالية والمشروبات الغازية والكافيين لأنها تزيد من حركة الأمعاء وفقدان السوائل.',
        en: 'Avoid fatty, fried, spicy, or high-sugar foods, sodas, and caffeine until recovery.',
      },
    ],
    whenToSeekHelp: [
      {
        ar: 'ظهور أي علامة من علامات الجفاف (عطش شديد، جفاف الفم، قلة البول أو تغير لونه للداكن جداً، دوار عند الوقوف).',
        en: 'Signs of dehydration (excessive thirst, dry mouth, dark or scanty urine, dizziness upon standing).',
      },
      {
        ar: 'وجود دم أو مخاط كثيف في البراز، أو براز أسود اللون، أو ألم شديد ومستمر في البطن، أو حمى مرتفعة.',
        en: 'Blood or pus in stool, black tarry stools, severe abdominal pain, or high fever.',
      },
      {
        ar: 'استمرار القيء بحيث يمنع تعويض السوائل عن طريق الفم.',
        en: 'Persistent vomiting preventing oral fluid intake.',
      },
    ],
    ifSymptomsWorsen: {
      ar: 'إذا لم يبدأ الإسهال في التحسن أو زادت عدد مرات الإخراج أو ظهر إعياء عام، توجه فوراً للطبيب للتقييم السريري.',
      en: 'If diarrhea does not improve, increases in frequency, or causes weakness, seek medical evaluation promptly.',
    },
    reviewMeta: {
      sourceTitle: {
        ar: 'إرشادات التعامل الآمن مع الإسهال الحاد والوقاية من الجفاف (WHO & CDC Rehydration Guidance)',
        en: 'WHO & CDC Acute Diarrhea Management and Rehydration Guidance',
      },
      sourceUrl: 'https://www.who.int/',
      accessedDate: '2026-10-14',
      lastReviewed: '2026-10-14',
      reviewerRole: {
        ar: 'فريق المراجعة التمريضية والتثقيف الصحي',
        en: 'Nursing Stewardship & Health Education Review Team',
      },
      approvalStatus: {
        ar: 'نموذج تثقيفي إرشادي خاضع للمراجعة السريرية',
        en: 'Educational guidance template subject to clinical review',
      },
    },
  },

  unsure: {
    id: 'unsure',
    icon: '❓',
    title: {
      ar: 'لست متأكداً / شكوى أخرى',
      en: 'Not Sure / Other Symptoms',
    },
    subtitle: {
      ar: 'أعراض غير محددة أو خارج مسارات الرعاية الذاتية البسيطة (كالمسالك البولية أو الأذن أو الجلد)',
      en: 'Unclear symptoms or complaints outside simple self-care pathways (e.g. urinary, ear, skin)',
    },
    whatToDoNow: [],
    whatToAvoid: [],
    whenToSeekHelp: [],
    ifSymptomsWorsen: {
      ar: 'يتطلب الأمر تقييماً مباشراً من الطبيب أو الصيدلي لتحديد طبيعة الشكوى بدقة.',
      en: 'Requires direct evaluation by a physician or pharmacist.',
    },
    reviewMeta: {
      sourceTitle: {
        ar: 'بروتوكول الفرز المحافظ للسلامة الدوائية',
        en: 'Conservative Medication Safety Triage Protocol',
      },
      sourceUrl: 'https://www.cdc.gov/antibiotic-use/',
      accessedDate: '2026-10-14',
      lastReviewed: '2026-10-14',
      reviewerRole: {
        ar: 'فريق المراجعة التمريضية والتثقيف الصحي',
        en: 'Nursing Stewardship & Health Education Review Team',
      },
      approvalStatus: {
        ar: 'نموذج تثقيفي إرشادي خاضع للمراجعة السريرية',
        en: 'Educational guidance template subject to clinical review',
      },
    },
  },
};

export interface TriageInputState {
  pathway: SymptomPathwayId | null;
  redFlagsAnswered: boolean;
  selectedRedFlags: string[];
  highRiskAnswered: boolean;
  selectedHighRisks: string[];
  progression: 'mild_stable' | 'worsening_persistent' | 'unsure' | null;
}

/**
 * Conservative clinical safety triage engine:
 * - Never diagnoses viral vs bacterial disease.
 * - Any incomplete answer -> 'incomplete' (never assumes safety).
 * - Any Red Flag -> 'red_flag' (urgent medical evaluation).
 * - Unsure pathway, High-Risk patient group, or worsening/persistent symptoms -> 'amber_alert'.
 * - Only mild, stable symptoms in non-high-risk adults with 0 red flags -> 'green_care'.
 */
export function evaluateGreenPrescriptionTriage(input: TriageInputState): TriageLevel {
  if (
    !input.pathway ||
    !input.redFlagsAnswered ||
    !input.highRiskAnswered ||
    !input.progression
  ) {
    return 'incomplete';
  }

  if (input.selectedRedFlags.length > 0) {
    return 'red_flag';
  }

  if (
    input.pathway === 'unsure' ||
    input.selectedHighRisks.length > 0 ||
    input.progression === 'worsening_persistent' ||
    input.progression === 'unsure'
  ) {
    return 'amber_alert';
  }

  return 'green_care';
}
