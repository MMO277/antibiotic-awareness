import { Bilingual } from './types';

export type NpcRole = 'nurse' | 'doctor' | 'patient' | 'pharmacist';

export interface NpcDefinition {
  id: NpcRole;
  name: Bilingual;
  title: Bilingual;
  stationLabel: Bilingual;
  /** World-space position [x, y, z] inside the 3D hospital ward */
  position: [number, number, number];
  /** Initial Y rotation in radians */
  rotationY: number;
  /** Primary uniform/scrubs color (hex) */
  outfitColor: number;
  /** Secondary accent color (hex) */
  accentColor: number;
  /** Skin tone (hex) */
  skinColor: number;
  /** Badge emoji for HUD/dialogue overlay */
  avatarEmoji: string;
  /** Default greeting when no specific scenario step is active */
  defaultGreeting: Bilingual;
}

export interface ScenarioChoice {
  id: string;
  label: Bilingual;
  /** Next node ID, or 'END' if this choice concludes the scenario */
  nextNodeId: string;
  /** Educational safety classification of this decision */
  quality: 'optimal' | 'caution' | 'unsafe';
  /** Immediate feedback shown right after selecting this option */
  immediateFeedback: Bilingual;
  /** Summary of why this decision mattered (displayed in end-of-scenario review) */
  rationale: Bilingual;
}

export interface ScenarioNode {
  id: string;
  speaker: NpcRole;
  /** Optional location prompt if the player needs to walk to a specific NPC for this step */
  targetNpc: NpcRole;
  objectiveHint: Bilingual;
  dialogue: Bilingual;
  choices: ScenarioChoice[];
}

export interface ScenarioSource {
  title: string;
  publisher: string;
  url: string;
}

export interface MedicalScenario {
  id: string;
  number: number;
  title: Bilingual;
  subtitle: Bilingual;
  categoryBadge: Bilingual;
  primaryNpc: NpcRole;
  involvedNpcs: NpcRole[];
  briefing: Bilingual;
  initialNodeId: string;
  nodes: Record<string, ScenarioNode>;
  safeActionDemonstrated: Bilingual;
  educationalTakeaway: Bilingual;
  escalationGuidance: Bilingual;
  badgeTitle: Bilingual;
  badgeIcon: string;
  sources: ScenarioSource[];
}

export const SIMULATOR_NPCS: Record<NpcRole, NpcDefinition> = {
  nurse: {
    id: 'nurse',
    name: {
      ar: 'الممرضة سارة (ممرضة الجناح السريري)',
      en: 'Nurse Sara (Clinical Ward Nurse)',
    },
    title: {
      ar: 'تمريض التقييم الأولي وسلامة الدواء',
      en: 'Triage & Medication Safety Nursing',
    },
    stationLabel: {
      ar: 'محطة التمريض المركزية',
      en: 'Central Nursing Station',
    },
    position: [-4.2, 0, -2.5],
    rotationY: 0.45,
    outfitColor: 0x0e9aa7, // Clinical teal scrubs
    accentColor: 0xffffff,
    skinColor: 0xf6d0b1,
    avatarEmoji: '👩‍⚕️',
    defaultGreeting: {
      ar: 'مرحباً بك في محطة التمريض! يمكنك اختيار سيناريو تدريبي أو مراجعة قائمة فحص سلامة الدواء.',
      en: 'Welcome to the Nursing Station! Select a training scenario or review our medication safety checklist.',
    },
  },
  patient: {
    id: 'patient',
    name: {
      ar: 'الأستاذ أحمد (مريض الجناح - سرير ١)',
      en: 'Mr. Ahmed (Ward Patient - Bed 1)',
    },
    title: {
      ar: 'حالة تعليمية خيالية للتقييم السريري',
      en: 'Fictional Educational Case Patient',
    },
    stationLabel: {
      ar: 'جناح المرضى - سرير ١',
      en: 'Patient Ward - Bed 1',
    },
    position: [-5.5, 0, 3.2],
    rotationY: 1.57,
    outfitColor: 0x60a5fa, // Light blue patient gown
    accentColor: 0xe0f2fe,
    skinColor: 0xedc09e,
    avatarEmoji: '🛌',
    defaultGreeting: {
      ar: 'أهلاً بك.. أنا أشعر ببعض الأعراض وأحتاج لمن يستمع لتاريخي الصحي بعناية قبل أي دواء.',
      en: 'Hello there... I have been feeling unwell and need someone to review my symptoms and allergy history carefully.',
    },
  },
  doctor: {
    id: 'doctor',
    name: {
      ar: 'د. طارق (الطبيب الاستشاري المناوب)',
      en: 'Dr. Tarek (Attending Consultant Physician)',
    },
    title: {
      ar: 'استشاري الأمراض الباطنية وترشيد المضادات',
      en: 'Internal Medicine & Antibiotic Stewardship Consultant',
    },
    stationLabel: {
      ar: 'مكتب الاستشارة الطبية',
      en: 'Clinical Consultation Desk',
    },
    position: [4.5, 0, -2.6],
    rotationY: -0.5,
    outfitColor: 0xf8fafc, // White lab coat
    accentColor: 0x1d4ed8, // Royal blue tie/scrubs
    skinColor: 0xebbd9b,
    avatarEmoji: '👨‍⚕️',
    defaultGreeting: {
      ar: 'أهلاً بك يا زميلي. تذكر دائماً أن التشخيص السريري الدقيق يسبق أي قرار بصرف مضاد حيوي.',
      en: 'Welcome, colleague. Always remember that thorough clinical evaluation comes before any antibiotic decision.',
    },
  },
  pharmacist: {
    id: 'pharmacist',
    name: {
      ar: 'د. مريم (صيدلانية المستشفى الإكلينيكية)',
      en: 'Dr. Mariam (Clinical Hospital Pharmacist)',
    },
    title: {
      ar: 'الصيدلة الإكلينيكية وفحص الحساسية والتداخلات',
      en: 'Clinical Pharmacy & Allergy/Stewardship Verification',
    },
    stationLabel: {
      ar: 'ركن الصيدلية الإكلينيكية',
      en: 'Clinical Pharmacy Counter',
    },
    position: [5.2, 0, 3.4],
    rotationY: -2.1,
    outfitColor: 0x10b981, // Emerald clinical coat
    accentColor: 0xffffff,
    skinColor: 0xf4ccb0,
    avatarEmoji: '🧑‍⚕️',
    defaultGreeting: {
      ar: 'مرحباً بك في صيدلية المستشفى! نحن هنا للتحقق من المادة الفعالة، الحساسية المتصالبة، وعدم صرف المضادات بدون وصفة.',
      en: 'Welcome to the Hospital Pharmacy! We verify active ingredients, cross-reactivity, and prescription compliance.',
    },
  },
};

export const MEDICAL_SIMULATOR_SCENARIOS: MedicalScenario[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Hospital Respiratory Symptoms
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'scenario-1-respiratory',
    number: 1,
    title: {
      ar: 'السيناريو ١: أعراض تنفسية في جناح المستشفى',
      en: 'Scenario 1: Hospital Respiratory Symptoms',
    },
    subtitle: {
      ar: 'التقييم الأولي للأعراض وتصعيد العلامات المقلقة للطبيب المختص بدلاً من الوصف الذاتي',
      en: 'Gathering symptom context and escalating concerning signs rather than self-prescribing antibiotics',
    },
    categoryBadge: {
      ar: 'تقييم الأعراض والتصعيد الآمن',
      en: 'Symptom Triage & Safe Escalation',
    },
    primaryNpc: 'nurse',
    involvedNpcs: ['nurse', 'patient', 'doctor'],
    briefing: {
      ar: 'دخل الأستاذ أحمد الجناح يشكو من كحة ورشح منذ يومين، ويطلب من الفريق إعطاءه مضاداً حيوياً قوياً فوراً. ابدأ بالحديث مع الممرضة سارة ثم قيّم الأعراض مع المريض ونسّق مع د. طارق.',
      en: 'Mr. Ahmed arrived reporting a 2-day cough and runny nose, asking for a strong antibiotic right away. Speak with Nurse Sara, gather symptom context from the patient, and coordinate with Dr. Tarek.',
    },
    initialNodeId: 's1_start',
    nodes: {
      s1_start: {
        id: 's1_start',
        speaker: 'nurse',
        targetNpc: 'nurse',
        objectiveHint: {
          ar: 'تحدث مع الممرضة سارة في محطة التمريض لبدء تقييم الحالة.',
          en: 'Talk to Nurse Sara at the Nursing Station to begin the assessment.',
        },
        dialogue: {
          ar: 'أهلاً بك في الجناح! المريض في سرير ١ (الأستاذ أحمد) يعاني من رشح واحتقان حلق خفيف منذ ٤٨ ساعة، لكنه يلحّ على أخذ مضاد حيوي الآن. ما هي خطوتك الأولى السليمة؟',
          en: 'Welcome to the ward! Mr. Ahmed in Bed 1 has had a runny nose and mild sore throat for 48 hours, and he is insisting on an antibiotic right now. What is your safest first step?',
        },
        choices: [
          {
            id: 's1_c1_gather',
            label: {
              ar: 'التوجه للمريض لأخذ تاريخ الأعراض الكامل والتحقق من وجود علامات إنذار (كضيق التنفس أو الحمى الشديدة)',
              en: 'Speak with the patient to gather full symptom context and screen for red-flag signs (e.g. shortness of breath or high fever)',
            },
            nextNodeId: 's1_patient_check',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'قرار سليم! جمع التاريخ المرضي وفحص علامات الخطورة هو الأساس قبل أي قرار علاجي.',
              en: 'Excellent choice! Gathering symptom context and checking for warning signs is essential before any clinical action.',
            },
            rationale: {
              ar: 'معظم نزلات البرد والرشح الحادة فيروسية المنشأ، لكن يجب دائماً استبعاد علامات الخطر قبل طمأنة المريض.',
              en: 'Most acute upper respiratory colds are viral, yet screening for red-flag symptoms is required before reassuring the patient.',
            },
          },
          {
            id: 's1_c1_give_abx',
            label: {
              ar: 'إعطاؤه كبسولة مضاد حيوي واسع المجال فوراً لتهدئة قلقه وتوفير الوقت',
              en: 'Give him a broad-spectrum antibiotic capsule immediately to calm him down and save time',
            },
            nextNodeId: 's1_patient_check',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! لا يجوز صرف أو إعطاء مضاد حيوي دون تقييم طبي وتشخيص مؤكد، لأن المضادات لا تعالج الفيروسات.',
              en: 'Unsafe! Antibiotics must never be given without clinical evaluation, and they do not treat viral colds.',
            },
            rationale: {
              ar: 'الوصف العشوائي للمضادات الحيوية لإرضاء المريض يعرضه لآثار جانبية ويزيد من مقاومة البكتيريا (AMR).',
              en: 'Giving antibiotics solely to satisfy a request exposes the patient to side effects and accelerates antimicrobial resistance.',
            },
          },
          {
            id: 's1_c1_dismiss',
            label: {
              ar: 'إخبار المريض أن حالته لا تستدعي أي فحص وتركه دون سؤال عن أعراضه',
              en: 'Tell the patient he needs no evaluation at all and walk away without asking about his symptoms',
            },
            nextNodeId: 's1_patient_check',
            quality: 'caution',
            immediateFeedback: {
              ar: 'تنبيه: صحيح أن المضاد غالباً غير مطلوب، لكن تجاهل سماع المريض قد يخفي أعراضاً تنفسية مقلقة تحتاج لتصعيد طبي.',
              en: 'Caution: While antibiotics are likely unneeded, skipping symptom assessment can miss concerning respiratory signs.',
            },
            rationale: {
              ar: 'التواصل العلاجي يتطلب الاستماع للمريض وفحص الأعراض للتفريق بين نزلة البرد البسيطة والعدوى الأكثر خطورة.',
              en: 'Safe care requires listening to the patient to distinguish a simple cold from symptoms needing physician escalation.',
            },
          },
        ],
      },
      s1_patient_check: {
        id: 's1_patient_check',
        speaker: 'patient',
        targetNpc: 'patient',
        objectiveHint: {
          ar: 'توجه إلى سرير الأستاذ أحمد (سرير ١) وتفاعل معه لسماع أعراضه.',
          en: 'Walk over to Mr. Ahmed at Bed 1 and interact with him to hear his symptoms.',
        },
        dialogue: {
          ar: 'يا دكتور/تمريض، عندي رشح وعطس منذ يومين، لكن منذ ساعة بدأت أشعر بضيق خفيف في النفس مع ارتفاع بالحرارة وألم بالصدر عند التنفس العميق. هل آخذ مضاداً حيوياً من نفسي؟',
          en: 'I have had a runny nose and sneezing for two days, but an hour ago I started feeling mild shortness of breath, rising fever, and chest discomfort when breathing deeply. Should I just take an antibiotic on my own?',
        },
        choices: [
          {
            id: 's1_c2_escalate',
            label: {
              ar: 'طمأنة المريض، الامتناع عن إعطاء مضاد ذاتي، وتصعيد الأعراض التنفسية المقلقة فوراً للطبيب المختص (د. طارق)',
              en: 'Reassure the patient, avoid self-prescribing antibiotics, and immediately escalate the concerning respiratory symptoms to Dr. Tarek',
            },
            nextNodeId: 's1_doctor_consult',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'أحسنت! ظهور ضيق التنفس أو ألم الصدر يستوجب التصعيد الطبي الفوري للفحص السريري، وليس الاجتهاد الشخصي.',
              en: 'Spot on! Shortness of breath or chest discomfort requires prompt escalation to a qualified clinician, not self-medication.',
            },
            rationale: {
              ar: 'تصعيد الأعراض المقلقة للطبيب المختص يحمي المريض من تأخر التشخيص ومن أخطار التداوي الذاتي.',
              en: 'Escalating warning signs to a qualified physician protects the patient from delayed diagnosis and unsafe self-medication.',
            },
          },
          {
            id: 's1_c2_self_rx',
            label: {
              ar: 'اختيار مضاد حيوي عشوائي له بدون استشارة الطبيب لعلاج ألم الصدر',
              en: 'Select a random antibiotic for him yourself without consulting the physician',
            },
            nextNodeId: 's1_doctor_consult',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطأ خطر! وصف المضادات الحيوية خارج نطاق التخصص ودون فحص الطبيب قد يخفي حالة حرجة أو يسبب ضرراً.',
              en: 'Unsafe action! Prescribing antibiotics without a physician’s diagnostic evaluation can mask serious conditions.',
            },
            rationale: {
              ar: 'ضيق التنفس وألم الصدر يتطلبان فحصاً طبياً شاملاً (سماعة، علامات حيوية، تحاليل/أشعة) من طبيب مؤهل.',
              en: 'Chest discomfort and dyspnea require formal clinical evaluation by a licensed clinician.',
            },
          },
        ],
      },
      s1_doctor_consult: {
        id: 's1_doctor_consult',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'توجه الآن إلى مكتب د. طارق لإبلاغه بنتائج التقييم وتلقي التوجيه.',
          en: 'Walk to Dr. Tarek’s consultation desk to escalate the findings.',
        },
        dialogue: {
          ar: 'شكراً لتصعيد الحالة في الوقت المناسب! سأقوم الآن بفحص رئتي المريض ومستوى الأكسجين. ما هي الرسالة التثقيفية التي ستقدمها للمريض حول المضادات الحيوية وأعراض البرد؟',
          en: 'Thank you for escalating promptly! I will examine his lungs and oxygen saturation now. What educational message will you share with him about antibiotics and respiratory symptoms?',
        },
        choices: [
          {
            id: 's1_c3_educate',
            label: {
              ar: 'توضيح أن نزلات البرد الفيروسية لا تعالج بالمضادات الحيوية، وأن أي أعراض مقلقة كضيق التنفس تتطلب فحص الطبيب ليقرر العلاج المناسب',
              en: 'Explain that viral colds do not respond to antibiotics, and concerning symptoms like shortness of breath require a doctor’s exam to guide safe care',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'تثقيف صحي مثالي! لقد جمعت بين التوعية بترشيد المضادات والتصعيد السريري الآمن.',
              en: 'Exemplary patient education! You combined antibiotic stewardship with safe clinical escalation.',
            },
            rationale: {
              ar: 'المريض الواعي يدرك أن المضاد الحيوي ليس مسكناً أو علاجاً للبرد، ويعرف متى يطلب الفحص الطبي العاجل.',
              en: 'Informed patients understand antibiotics are not for viral colds and know when to seek timely medical evaluation.',
            },
          },
          {
            id: 's1_c3_promise_abx',
            label: {
              ar: 'إخباره أن المضادات الحيوية تشفي كل أنواع الكحة والرشح في يوم واحد',
              en: 'Tell him that antibiotics cure every cough and runny nose within a single day',
            },
            nextNodeId: 'END',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'معلومة خاطئة! المضادات الحيوية لا تؤثر على الفيروسات المسببة للبرد والرشح.',
              en: 'Incorrect! Antibiotics have zero effect on respiratory viruses that cause common colds.',
            },
            rationale: {
              ar: 'نشر معلومات غير دقيقة يشجع المرضى على تكرار طلب المضادات الحيوية دون داعٍ طبي.',
              en: 'Inaccurate claims encourage unnecessary antibiotic requests in the future.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'الاستماع لتاريخ الأعراض، الامتناع عن صرف مضاد حيوي ذاتياً لنزلة برد، وتصعيد العلامات التنفسية المقلقة فوراً إلى الطبيب المؤهل.',
      en: 'Gathering symptom context, refusing self-prescribed antibiotics for cold symptoms, and escalating red-flag respiratory signs to a qualified clinician.',
    },
    educationalTakeaway: {
      ar: 'المضادات الحيوية تعالج العدوى البكتيرية فقط ولا تفيد في نزلات البرد الفيروسية. عند ظهور علامات مقلقة مثل ضيق التنفس أو الحمى الشديدة، فإن التصرف الآمن هو الفحص الطبي العاجل وليس تناول مضاد حيوي عشوائي.',
      en: 'Antibiotics only treat bacterial infections and do not help viral colds. When warning signs like shortness of breath or high fever appear, the safe step is prompt evaluation by a qualified clinician—not self-prescribing antibiotics.',
    },
    escalationGuidance: {
      ar: 'في الحياة الواقعية: اطلب الرعاية الطبية العاجلة أو اتصل بالإسعاف (123 في مصر) عند وجود صعوبة في التنفس، ألم شديد بالصدر، ازرقاق الشفاه، أو حمى شديدة مستمرة.',
      en: 'In real life: Seek urgent medical care or call emergency services (123 in Egypt) for difficulty breathing, severe chest pain, bluish lips, or persistent high fever.',
    },
    badgeTitle: {
      ar: 'حارس التصعيد الآمن',
      en: 'Safe Escalation Guardian',
    },
    badgeIcon: '🩺',
    sources: [
      {
        title: 'Antibiotic Do’s & Don’ts — Acute Respiratory Infections',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/index.html',
      },
      {
        title: 'Antimicrobial Resistance Fact Sheet',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Medication Allergy Safety
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'scenario-2-allergy',
    number: 2,
    title: {
      ar: 'السيناريو ٢: أمان الحساسية الدوائية والتفاعل المتصالب',
      en: 'Scenario 2: Medication Allergy Safety & Cross-Reactivity',
    },
    subtitle: {
      ar: 'التحقق من المادة الفعالة وتاريخ الحساسية وتصعيد الشكوك للصيدلي والطبيب المختص',
      en: 'Checking reported allergy details and escalating active-ingredient / cross-reactivity evaluation to specialists',
    },
    categoryBadge: {
      ar: 'فحص الحساسية الدوائية',
      en: 'Allergy & Cross-Reactivity Safety',
    },
    primaryNpc: 'patient',
    involvedNpcs: ['patient', 'pharmacist', 'doctor'],
    briefing: {
      ar: 'يذكر المريض أنه أصيب سابقاً بطفح جلدي وتورم بالشفتين بعد تناول دواء يحتوي على «أموكسيسيلين»، ويتساءل إن كان بإمكانه تناول دواء آخر باسم تجاري مختلف أو من عائلة السيفالوسبورينات دون استشارة.',
      en: 'The patient reports a past rash and lip swelling after taking an amoxicillin product, and asks whether a different brand name or a cephalosporin antibiotic is automatically safe.',
    },
    initialNodeId: 's2_start',
    nodes: {
      s2_start: {
        id: 's2_start',
        speaker: 'patient',
        targetNpc: 'patient',
        objectiveHint: {
          ar: 'تحدث مع الأستاذ أحمد في سرير ١ لمعرفة تفاصيل الحساسية الدوائية التي يبلغ عنها.',
          en: 'Speak with Mr. Ahmed at Bed 1 about his reported medication allergy.',
        },
        dialogue: {
          ar: 'لقد حدث لي تورم في الشفتين وطفح جلدي العام الماضي بعد أخذ كبسولات «أموكسيسيلين». قال لي جاري أن آخذ «أوجمنتين» أو دواء من عائلة «سيفالوسبورين» لأن الاسم التجاري مختلف تماماً! ما رأيك؟',
          en: 'Last year I developed lip swelling and hives after taking Amoxicillin capsules. My neighbor told me to just take Augmentin or a cephalosporin because the brand name is different! What do you think?',
        },
        choices: [
          {
            id: 's2_c1_verify',
            label: {
              ar: 'تنبيهه فوراً للتوقف، وتوثيق أعراض الحساسية الخطيرة، ومراجعة الصيدلانية الإكلينيكية (د. مريم) لفحص المادة الفعالة والتفاعل المتصالب',
              en: 'Warn him to pause immediately, document the severe reaction history, and consult Clinical Pharmacist Dr. Mariam to verify active ingredients and cross-reactivity',
            },
            nextNodeId: 's2_pharmacist_check',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'ممتاز! اختلاف الاسم التجاري لا يعني اختلاف المادة الفعالة (أوجمنتين يحتوي على أموكسيسيلين)، وتورم الشفتين علامة تحسس خطيرة.',
              en: 'Great catch! Different brand names can contain the exact same active ingredient (Augmentin contains amoxicillin), and lip swelling is a serious IgE-mediated warning sign.',
            },
            rationale: {
              ar: 'الاعتماد على الاسم التجاري فقط خطأ شائع وخطير؛ العبرة دائماً بالمادة الفعالة والعائلة الكيميائية.',
              en: 'Relying on trade names alone is dangerous; safety checks must always inspect the generic active ingredient and beta-lactam ring structure.',
            },
          },
          {
            id: 's2_c1_brand_ok',
            label: {
              ar: 'الموافقة على كلام الجار لأن الاسم التجاري على العلبة مختلف',
              en: 'Agree with the neighbor that a different trade name on the box makes it safe',
            },
            nextNodeId: 's2_pharmacist_check',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطر شديد! العديد من الأسماء التجارية تشترك في نفس المادة الفعالة وقد تسبب صدمة تحسسية قاتلة (Anaphylaxis).',
              en: 'Highly unsafe! Many trade names share the exact same active ingredient and can trigger life-threatening anaphylaxis.',
            },
            rationale: {
              ar: 'تناول نفس المادة الفعالة تحت اسم تجاري آخر لدى مريض يعاني من حساسية حادة قد يؤدي إلى انسداد مجرى الهواء.',
              en: 'Re-exposing a patient with angioedema history to the same active ingredient under another brand name risks airway compromise.',
            },
          },
        ],
      },
      s2_pharmacist_check: {
        id: 's2_pharmacist_check',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'توجه إلى د. مريم في ركن الصيدلية الإكلينيكية لمناقشة المادة الفعالة والتفاعل المتصالب.',
          en: 'Walk to Dr. Mariam at the Clinical Pharmacy counter to evaluate active ingredients and cross-reactivity.',
        },
        dialogue: {
          ar: 'أحسنت بإحضار سجل الحساسية! المريض لديه تاريخ تفاعل تحسسي شديد (تورم الشفتين) مع البنسلينات. ماذا يجب أن نفعل بخصوص احتمال التفاعل المتصالب مع السيفالوسبورينات أو البدائل؟',
          en: 'Good job bringing the allergy record! The patient had a severe reaction (lip angioedema) to a penicillin. How should we handle potential cross-reactivity with cephalosporins or alternatives?',
        },
        choices: [
          {
            id: 's2_c2_professional_eval',
            label: {
              ar: 'عدم افتراض أن كل دواء في عائلة واسعة آمن أو غير آمن تلقائياً، وتصعيد الحالة للطبيب والصيدلي لتقييم السلاسل الجانبية واختيار بديل آمن موثق',
              en: 'Do not assume every medicine in a broad class is automatically safe or unsafe; escalate to the physician and pharmacist for professional cross-reactivity evaluation',
            },
            nextNodeId: 's2_doctor_confirm',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'دقة علمية عالية! التفاعل المتصالب يعتمد على التركيب الكيميائي (السلاسل الجانبية R1) وشدة التفاعل السابق، لذا يتطلب تقييماً مهنياً متخصصاً.',
              en: 'Clinically accurate! Cross-reactivity depends on chemical side-chain similarity and reaction severity, requiring qualified specialist evaluation.',
            },
            rationale: {
              ar: 'التقييم المهني يفرق بين التفاعلات المهددة للحياة (التي تمنع عائلات معينة) وبين البدائل الآمنة بناءً على المراجع الدوائية.',
              en: 'Professional evaluation distinguishes high-risk shared side chains from safe alternatives under clinical supervision.',
            },
          },
          {
            id: 's2_c2_guess_class',
            label: {
              ar: 'التخمين الشخصي وإعطاء أي مضاد حيوي آخر من الرف دون مراجعة الطبيب',
              en: 'Guess on your own and hand over another antibiotic from the shelf without consulting the physician',
            },
            nextNodeId: 's2_doctor_confirm',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! لا يجوز التخمين في حالات الحساسية الدوائية أبداً.',
              en: 'Unsafe! Never guess when dealing with documented medication allergies.',
            },
            rationale: {
              ar: 'وجود تاريخ لتورم الوجه أو الشفتين يتطلب مراجعة دقيقة من الطبيب والصيدلي قبل صرف أي مضاد حيوي.',
              en: 'A history of facial or lip swelling requires strict physician and pharmacist verification before any antibiotic is prescribed.',
            },
          },
        ],
      },
      s2_doctor_confirm: {
        id: 's2_doctor_confirm',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'توجه إلى مكتب د. طارق لتأكيد توثيق الحساسية في ملف المريض.',
          en: 'Visit Dr. Tarek’s desk to confirm allergy documentation and escalation.',
        },
        dialogue: {
          ar: 'تعاون رائع بين التمريض والصيدلة! لقد وثّقنا حساسية البنسلين وتاريخ الوذمة الوعائية في ملف المريض. ما هي النصيحة الأساسية التي نؤكد عليها للمريض قبل خروجه؟',
          en: 'Great teamwork between nursing and pharmacy! We documented the penicillin allergy and angioedema history in his chart. What key safety advice should we give the patient?',
        },
        choices: [
          {
            id: 's2_c3_carry_record',
            label: {
              ar: 'الاحتفاظ بسجل واضح للمادة الفعالة المسببة للحساسية وطبيعة التفاعل، وإبلاغ الطبيب والصيدلي دائماً قبل تناول أي دواء جديد',
              en: 'Keep a clear record of the specific active ingredient and reaction type, and always inform the doctor and pharmacist before taking any new medication',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'إجابة مثالية! توثيق المادة الفعالة وإبلاغ الفريق الطبي يحمي المريض مدى الحياة.',
              en: 'Perfect! Documenting the generic active ingredient and informing healthcare professionals protects the patient for life.',
            },
            rationale: {
              ar: 'معرفة المريض للاسم العلمي (المادة الفعالة) وليس التجاري فقط تمنع تكرار التعرض العرضي للدواء المسبب للحساسية.',
              en: 'Knowing the generic active ingredient rather than just a single brand name prevents accidental re-exposure.',
            },
          },
          {
            id: 's2_c3_ignore_mild',
            label: {
              ar: 'إخباره أنه لا داعي لذكر الحساسية للطبيب طالما سيشترى دواءً بشريط مختلف الشكل',
              en: 'Tell him there is no need to mention allergies to doctors as long as the pill box looks different',
            },
            nextNodeId: 'END',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطأ خطير! شكل العلبة أو الشريط لا علاقة له بالمادة الفعالة.',
              en: 'Dangerous misconception! Packaging appearance does not indicate the active ingredient inside.',
            },
            rationale: {
              ar: 'إخفاء تاريخ الحساسية عن الطبيب أو الصيدلي يعرض المريض لخطر التفاعلات التحسسية المهددة للحياة.',
              en: 'Failing to disclose allergy history puts the patient at risk of severe allergic reactions.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'فحص المادة الفعالة بدلاً من الاعتماد على الاسم التجاري، عدم الجزم التلقائي بأمان أو خطورة عائلة دوائية كاملة دون تدقيق، وتصعيد الحالة للصيدلي والطبيب المختص.',
      en: 'Checking the generic active ingredient rather than relying on brand names, avoiding blanket assumptions across drug classes, and escalating to a pharmacist and physician.',
    },
    educationalTakeaway: {
      ar: 'المادة الفعالة (الاسم العلمي) والتشابه الكيميائي بين العائلات الدوائية يتطلبان تقييماً مهنياً من الطبيب أو الصيدلي. لا تفترض أن تغير الاسم التجاري يجعل الدواء آمناً، ولا تفترض أن كل دواء في عائلة واسعة آمن أو غير آمن تلقائياً دون مراجعة مختص.',
      en: 'Active ingredients and chemical cross-reactivity require professional evaluation by a clinician or pharmacist. Never assume a different brand name is safe, and do not assume every drug in a broad class is automatically safe or unsafe without specialist review.',
    },
    escalationGuidance: {
      ar: 'علامات الطوارئ التحسسية (تورم الوجه أو الشفتين أو اللسان، صعوبة التنفس أو البلع، طفح جلدي منتشر، دوخة شديدة) تتطلب الاتصال بالإسعاف (123) أو التوجه لأقرب طوارئ فوراً.',
      en: 'Signs of anaphylaxis (swelling of face, lips, or tongue, difficulty breathing or swallowing, widespread hives, dizziness) require calling emergency services (123) or going to the nearest emergency department immediately.',
    },
    badgeTitle: {
      ar: 'خبير أمان الحساسية الدوائية',
      en: 'Allergy Safety Advocate',
    },
    badgeIcon: '🛡️',
    sources: [
      {
        title: 'Drug Allergies — Diagnosis & Management',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/drugreactions.html',
      },
      {
        title: 'Penicillin Allergy & Cephalosporin Cross-Reactivity Clinical Guidance',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/clinicians/penicillin-allergy.html',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Pharmacy Request Without an Appropriate Prescription
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'scenario-3-pharmacy-otc',
    number: 3,
    title: {
      ar: 'السيناريو ٣: طلب مضاد حيوي من الصيدلية بدون وصفة طبية',
      en: 'Scenario 3: Pharmacy Request Without an Appropriate Prescription',
    },
    subtitle: {
      ar: 'التثقيف المحترم، رفض الصرف غير الملائم، وتوجيه المراجع إلى الرعاية الطبية المعتمدة',
      en: 'Respectful patient education, avoiding inappropriate dispensing, and directing to qualified clinical care',
    },
    categoryBadge: {
      ar: 'حوكمة الصرف الدوائي',
      en: 'Prescription Stewardship',
    },
    primaryNpc: 'pharmacist',
    involvedNpcs: ['pharmacist', 'doctor'],
    briefing: {
      ar: 'مراجع في ركن الصيدلية يطلب شراء «حقنة برد» أو مضاد حيوي قوي بدون روشتة طبية بحجة ضيق الوقت. تعاون مع د. مريم لتقديم تثقيف محترم وتوجيهه للمسار الطبي الآمن.',
      en: 'A visitor at the pharmacy counter requests a "cold injection mix" or strong antibiotic without a prescription to save time. Work with Pharmacist Dr. Mariam to provide respectful education and safe referral.',
    },
    initialNodeId: 's3_start',
    nodes: {
      s3_start: {
        id: 's3_start',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'تحدث مع الصيدلانية د. مريم في ركن الصيدلية الإكلينيكية.',
          en: 'Speak with Pharmacist Dr. Mariam at the Clinical Pharmacy counter.',
        },
        dialogue: {
          ar: 'يوجد مراجع يطلب صرف مضاد حيوي واسع المجال أو ما يُعرف شعبياً بـ «خلطة/حقنة البرد» بدون وصفة طبية لأنه يريد التعافي سريعاً للعمل. كيف نتعامل مع طلبه بمهنية واحترام؟',
          en: 'A visitor is asking us to dispense a broad-spectrum antibiotic or a "cold injection cocktail" without a prescription so he can return to work quickly. How should we respond respectfully and safely?',
        },
        choices: [
          {
            id: 's3_c1_respectful_refusal',
            label: {
              ar: 'التحدث معه باحترام وتعاطف، والاعتذار عن صرف المضاد الحيوي بدون وصفة طبية مع شرح مخاطر الصرف العشوائي وحقن البرد',
              en: 'Respond with empathy and respect, decline dispensing antibiotics without an appropriate prescription, and explain the risks of unprescribed antibiotics',
            },
            nextNodeId: 's3_refer_step',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'تصرف مهني ممتاز! التثقيف الهادئ المحترم يبني الثقة ويحمي المريض من مخاطر الأدوية غير الموصوفة.',
              en: 'Outstanding professional communication! Respectful education builds trust while protecting the patient from inappropriate dispensing.',
            },
            rationale: {
              ar: 'المضادات الحيوية أدوية تُصرف بوصفة طبية فقط (Prescription-Only) وفق لوائح هيئة الدواء المصرية ومنظمة الصحة العالمية.',
              en: 'Antibiotics are prescription-only medicines; dispensing them without a clinical diagnosis fuels resistance and adverse events.',
            },
          },
          {
            id: 's3_c1_dispense_anyway',
            label: {
              ar: 'صرف المضاد الحيوي له بدون وصفة حتى لا يغضب أو يشتريه من مكان آخر',
              en: 'Dispense the antibiotic without a prescription so the customer does not get upset',
            },
            nextNodeId: 's3_refer_step',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'ممارسة غير آمنة! صرف المضادات الحيوية بدون وصفة طبية يعرض المريض لمضاعفات خطيرة ويسهم في انتشار البكتيريا المقاومة.',
              en: 'Unsafe practice! Dispensing antibiotics without a valid prescription endangers patient safety and drives antimicrobial resistance.',
            },
            rationale: {
              ar: 'سلامة المريض والالتزام بالمعايير المهنية والقانونية مقدمان دائماً على البيع التجاري.',
              en: 'Patient safety and regulatory compliance always take precedence over convenience.',
            },
          },
          {
            id: 's3_c1_scold',
            label: {
              ar: 'توبيخ المراجع بحدة ورفض التحدث معه أو توضيح السبب العلمي',
              en: 'Scold the customer harshly and refuse to explain the medical reason',
            },
            nextNodeId: 's3_refer_step',
            quality: 'caution',
            immediateFeedback: {
              ar: 'تنبيه: رفض الصرف صحيح، لكن الأسلوب الفظ ينفر المريض ولا يصحح المفاهيم الخاطئة لديه.',
              en: 'Caution: Refusing to dispense is right, but harsh language alienates patients instead of educating them.',
            },
            rationale: {
              ar: 'التواصل التثقيفي غير الوصمي (Non-stigmatizing) هو المفتاح لإقناع المريض بضرورة الفحص الطبي.',
              en: 'Respectful, non-stigmatizing communication is essential for effective antibiotic stewardship.',
            },
          },
        ],
      },
      s3_refer_step: {
        id: 's3_refer_step',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'توجه إلى مكتب د. طارق لتنسيق مسار التوجيه الطبي للمراجع.',
          en: 'Walk to Dr. Tarek’s desk to coordinate safe clinical referral guidance.',
        },
        dialogue: {
          ar: 'شكراً لتوجيه المراجع إلى العيادة بدلاً من صرف مضاد حيوي بلا وصفة. ما هو التوجيه الصحي السليم الذي نقدمه له عند السؤال عن البديل الآمن؟',
          en: 'Thank you for directing the visitor to clinical evaluation instead of dispensing an unprescribed antibiotic. What safe guidance should we reinforce?',
        },
        choices: [
          {
            id: 's3_c2_qualified_care',
            label: {
              ar: 'توجيهه لإجراء فحص لدى طبيب مؤهل لتحديد سبب الأعراض، والاكتفاء بالرعاية الداعمة الآمنة المعتمدة إذا كانت الحالة فيروسية بسيطة',
              en: 'Direct him to a qualified clinician for proper diagnosis, and follow safe supportive care guidance when symptoms are viral',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'توجيه سليم ١٠٠٪! الطبيب المؤهل هو من يحدد الحاجة للمضاد الحيوي بعد الفحص.',
              en: '100% safe guidance! A qualified clinician determines whether an antibiotic is truly indicated after examination.',
            },
            rationale: {
              ar: 'الالتزام بصرف المضادات الحيوية بوصفة طبية يحمي الفرد والمجتمع من فشل العلاجات الحيوية مستقبلاً.',
              en: 'Ensuring antibiotics are dispensed only with an appropriate prescription preserves life-saving medicines for everyone.',
            },
          },
          {
            id: 's3_c2_half_course',
            label: {
              ar: 'نصحه بشراء شريط واحد فقط (٣ كبسولات) لتجربته بدون وصفة',
              en: 'Advise him to buy just a single blister strip (3 capsules) to try out without a prescription',
            },
            nextNodeId: 'END',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطأ جسيم! بيع جرعات غير مكتملة وبدون وصفة هو أخطر محفز لمقاومة البكتيريا.',
              en: 'Major error! Dispensing incomplete antibiotic doses without a prescription strongly promotes bacterial resistance.',
            },
            rationale: {
              ar: 'الجرعات الناقصة بدون تشخيص لا تقضي على البكتيريا بل تدربها على مقاومة الدواء.',
              en: 'Sub-therapeutic, unprescribed doses select for resistant bacterial strains.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'رفض صرف المضادات الحيوية بدون وصفة طبية بأسلوب محترم وغير وصمي، وتوجيه المراجع إلى طبيب مؤهل للتقييم السريري.',
      en: 'Refusing inappropriate over-the-counter antibiotic dispensing with respectful education, and referring the individual to a qualified clinician.',
    },
    educationalTakeaway: {
      ar: 'لا ينبغي أبداً طلب أو صرف المضادات الحيوية (أو ما يُسمى بحقن البرد) من الصيدلية بدون وصفة طبية معتمدة. التثقيف المحترم وتوجيه المريض للفحص الطبي يحميان من التسمم الدوائي والحساسية ومقاومة البكتيريا.',
      en: 'Antibiotics and unapproved "cold injection mixes" should never be requested or dispensed without a valid prescription. Respectful education and referral to a qualified clinician prevent adverse reactions and antimicrobial resistance.',
    },
    escalationGuidance: {
      ar: 'استشر الطبيب المختص دائماً قبل البدء بأي مضاد حيوي، والتزم بالقواعد التنظيمية لهيئة الدواء المصرية بعدم صرف المضادات إلا بوصفة طبية.',
      en: 'Always consult a licensed physician before starting any antibiotic, and follow national regulatory standards requiring a valid prescription.',
    },
    badgeTitle: {
      ar: 'سفير الصرف الدوائي الرشيد',
      en: 'Responsible Dispensing Ambassador',
    },
    badgeIcon: '💊',
    sources: [
      {
        title: 'Egyptian Drug Authority (EDA) — Rational Antibiotic Use & Warnings on Cold Injections',
        publisher: 'EDA Egypt',
        url: 'https://edaegypt.gov.eg',
      },
      {
        title: 'The WHO AWaRe Antibiotic Book',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/publications/i/item/9789240062382',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Leftover Antibiotics at Home
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'scenario-4-leftover-home',
    number: 4,
    title: {
      ar: 'السيناريو ٤: بقايا المضادات الحيوية في المنزل ومشاركتها',
      en: 'Scenario 4: Leftover Antibiotics at Home',
    },
    subtitle: {
      ar: 'منع إعادة استخدام أو مشاركة بقايا المضادات الحيوية والتوجيه للاستشارة الطبية والتخلص الآمن',
      en: 'Preventing sharing or reusing leftover antibiotics and guiding toward professional advice and safe disposal',
    },
    categoryBadge: {
      ar: 'سلامة الأدوية بالمنزل',
      en: 'Home Medication Safety',
    },
    primaryNpc: 'patient',
    involvedNpcs: ['patient', 'nurse', 'pharmacist'],
    briefing: {
      ar: 'يخبرك الأستاذ أحمد أن أحد أفراد أسرته في المنزل يريد تناول بقايا شراب أو كبسولات مضاد حيوي متبقية من كورس علاجي سابق لأن الأعراض تبدو متشابهة. ساعده على اتخاذ القرار الصحيح.',
      en: 'Mr. Ahmed tells you a family member at home wants to take leftover antibiotic capsules/syrup from a previous illness because the symptoms "look similar." Guide him toward safe practices.',
    },
    initialNodeId: 's4_start',
    nodes: {
      s4_start: {
        id: 's4_start',
        speaker: 'patient',
        targetNpc: 'patient',
        objectiveHint: {
          ar: 'تحدث مع الأستاذ أحمد في سرير ١ حول بقايا المضاد الحيوي في منزله.',
          en: 'Talk to Mr. Ahmed at Bed 1 about the leftover antibiotics at home.',
        },
        dialogue: {
          ar: 'اتصل بي أخي من المنزل؛ لديه ألم في الحلق ووجد في الثلاجة نصف زجاجة مضاد حيوي وشريط كبسولات تبقّيا من علاج سابق منذ شهرين. هل يعيد استخدامها لتوفير الوقت؟',
          en: 'My brother just called from home; he has a sore throat and found a half-used antibiotic bottle and leftover capsules from two months ago. Should he reuse them?',
        },
        choices: [
          {
            id: 's4_c1_never_reuse',
            label: {
              ar: 'نصحه بعدم مشاركة أو إعادة استخدام أي مضادات حيوية متبقية أبداً، وضرورة استشارة طبيب مختص لتقييم حالته الحالية',
              en: 'Advise him never to share or reuse leftover antibiotics, and to seek professional medical evaluation for the current symptoms',
            },
            nextNodeId: 's4_nurse_why',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'نصيحة ذهبية! بقايا المضادات الحيوية قد تكون غير مناسبة للعدوى الحالية، أو غير مكتملة الكورس، أو منتهية الصلاحية بعد الحلّ.',
              en: 'Crucial advice! Leftover antibiotics may be the wrong drug for the current illness, an incomplete course, or degraded/expired after reconstitution.',
            },
            rationale: {
              ar: 'تشابه الأعراض الظاهرية لا يعني أبداً تطابق الميكروب المسبب أو صلاحية الدواء القديم.',
              en: 'Similar-looking symptoms do not mean the same pathogen is involved or that leftover medication is safe.',
            },
          },
          {
            id: 's4_c1_reuse_ok',
            label: {
              ar: 'الموافقة على تناول البقايا طالما لم ينتهِ التاريخ المطبوع على العلبة الخارجية',
              en: 'Tell him to go ahead and finish the leftover pills as long as the outer box date has not passed',
            },
            nextNodeId: 's4_nurse_why',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن إطلاقاً! الشراب المعلق يفسد بعد ١٤ يوماً على الأكثر من حله بالماء، والكورس الناقص يسبب مقاومة بكتيرية.',
              en: 'Unsafe! Reconstituted suspensions expire within 7–14 days, and partial leftover courses promote resistance and treatment failure.',
            },
            rationale: {
              ar: 'إعادة استخدام بقايا المضادات تعرض المريض لجرعة غير كافية أو دواء فاسد أو غير مناسب لحالته.',
              en: 'Reusing leftovers risks sub-therapeutic dosing, degraded drug products, and untreated illness.',
            },
          },
        ],
      },
      s4_nurse_why: {
        id: 's4_nurse_why',
        speaker: 'nurse',
        targetNpc: 'nurse',
        objectiveHint: {
          ar: 'توجه إلى الممرضة سارة في محطة التمريض لمراجعة أسباب خطورة بقايا المضادات.',
          en: 'Speak with Nurse Sara at the Nursing Station to review why leftover antibiotics exist and how to prevent them.',
        },
        dialogue: {
          ar: 'توعية ممتازة! في رأيك، لماذا تتبقى كبسولات مضاد حيوي في المنازل أصلاً، وماذا نعلّم المرضى لتجنب ذلك؟',
          en: 'Great education! Why do patients often end up with leftover antibiotics at home, and what should we teach them?',
        },
        choices: [
          {
            id: 's4_c2_adherence',
            label: {
              ar: 'لأن البعض يوقف الكورس فور شعوره بتحسن؛ ويجب إكمال الكورس الموصوف من الطبيب وعدم إيقافه أو تغييره دون استشارة مختص',
              en: 'Because people stop early when they feel better; patients should follow the prescribed course and never stop or reuse antibiotics without professional advice',
            },
            nextNodeId: 's4_pharmacist_disposal',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'صحيح تماماً! التوقف المبكر يترك بكتيريا مقاومة ويخلق فائضاً خطيراً في المنزل.',
              en: 'Exactly right! Stopping treatment early without clinical guidance leaves surviving bacteria and creates unsafe home leftovers.',
            },
            rationale: {
              ar: 'الالتزام بالخطة العلاجية الموصوفة من الطبيب يمنع الانتكاس ويقلل من تراكم بقايا الأدوية.',
              en: 'Adhering to the clinician’s prescribed plan prevents relapse and avoids leftover medication hazards.',
            },
          },
          {
            id: 's4_c2_recommend_dose',
            label: {
              ar: 'اقتراح اسم مضاد حيوي بديل وجرعة محددة لأخيه عبر الهاتف دون فحص طبي',
              en: 'Recommend a specific antibiotic name and dosage for his brother over the phone without a medical exam',
            },
            nextNodeId: 's4_pharmacist_disposal',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! لا يجوز اقتراح مضاد حيوي محدد أو جرعة شخصية دون فحص سريري من طبيب مؤهل.',
              en: 'Unsafe! Never recommend a specific antibiotic or personal dosage without a formal evaluation by a licensed clinician.',
            },
            rationale: {
              ar: 'تحديد الدواء والجرعة يتطلب فحص المريض ومعرفة وزنه ووظائف أعضائه وتاريخ حساسيته.',
              en: 'Selecting a drug and dose requires examining the patient and reviewing their weight, organ function, and allergies.',
            },
          },
        ],
      },
      s4_pharmacist_disposal: {
        id: 's4_pharmacist_disposal',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'توجه إلى د. مريم في ركن الصيدلية لمعرفة الطريقة الآمنة للتعامل مع البقايا القديمة.',
          en: 'Visit Dr. Mariam at the Pharmacy Counter to confirm safe handling of leftover antibiotics.',
        },
        dialogue: {
          ar: 'الآن بعد أن اقتنع المريض بعدم استخدام البقايا القديمة، كيف نرشده للتخلص الآمن منها لحماية الأطفال والبيئة؟',
          en: 'Now that the family knows not to take the leftover antibiotics, how should we guide them on safe disposal?',
        },
        choices: [
          {
            id: 's4_c3_safe_disposal',
            label: {
              ar: 'عدم إلقائها في الصرف الصحي أو تركها في متناول الأطفال، واتباع إرشادات التخلص الآمن من الأدوية أو تسليمها لنظام الاسترجاع الآمن بالصيدلية إن توفر',
              en: 'Do not flush them into waterways or leave them within children’s reach; follow safe medication disposal guidelines or pharmacy take-back programs',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'أحسنت! التخلص الآمن يحمي الأطفال من التسمم العرضي ويحمي المياه والتربة من التلوث بالمضادات الحيوية.',
              en: 'Well done! Safe disposal prevents accidental pediatric poisoning and protects water systems from antibiotic contamination.',
            },
            rationale: {
              ar: 'رمي المضادات الحيوية في الأحواض والمجاري المائية يسهم في ظهور سلالات بكتيرية مقاومة في البيئة.',
              en: 'Flushing antibiotics into sewage and waterways contributes to environmental antimicrobial resistance.',
            },
          },
          {
            id: 's4_c3_keep_forever',
            label: {
              ar: 'تخزين الشراب المحلول في باب الثلاجة لاستخدامه العام القادم',
              en: 'Keep the reconstituted liquid antibiotic in the fridge door to use next year',
            },
            nextNodeId: 'END',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطأ خطر! الشراب المحلول يفقد فعاليته وقد يتحلل إلى مواد ضارة بعد انتهاء مدة صلاحيته القصيرة (٧–١٤ يوماً).',
              en: 'Dangerous! Reconstituted liquid antibiotics lose potency and degrade after 7–14 days.',
            },
            rationale: {
              ar: 'يجب دائماً التخلص من أي كمية متبقية من شراب المضاد الحيوي فور انتهاء الكورس الموصوف.',
              en: 'Any remaining reconstituted antibiotic suspension must be safely discarded immediately after completing the prescribed course.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'رفض مشاركة أو إعادة استخدام بقايا المضادات الحيوية في المنزل، الامتناع عن وصف دواء أو جرعة بدون فحص، والتوجيه للاستشارة الطبية والتخلص الآمن.',
      en: 'Refusing to share or reuse leftover home antibiotics, avoiding unprescribed drug/dosage recommendations, and guiding toward professional care and safe disposal.',
    },
    educationalTakeaway: {
      ar: 'لا تشارك المضادات الحيوية مع الآخرين ولا تعِد استخدام بقايا كورس قديم أبداً؛ فالدواء المتبقي قد يكون غير مناسب للحالة أو فاسداً أو ناقص الجرعة. استشر الطبيب أو الصيدلي دائماً وتخلص من البقايا بطرق آمنة.',
      en: 'Never share antibiotics or reuse leftover medications from a previous illness. Leftovers may be the wrong treatment, degraded, or an incomplete course. Always seek professional clinical advice and dispose of leftovers safely.',
    },
    escalationGuidance: {
      ar: 'إذا تناول طفل أو بالغ دواءً قديماً أو بقايا دواء بالخطأ وظهرت عليه أعراض غير طبيعية، تواصل فوراً مع مركز السموم أو طوارئ الإسعاف (123).',
      en: 'If someone accidentally ingests expired or leftover medication and develops adverse symptoms, contact poison control or emergency services (123) immediately.',
    },
    badgeTitle: {
      ar: 'حامي الأسرة والبيئة',
      en: 'Home & Eco Safety Champion',
    },
    badgeIcon: '♻️',
    sources: [
      {
        title: 'Where and How to Dispose of Unused Medicines',
        publisher: 'U.S. FDA',
        url: 'https://www.fda.gov/consumers/consumer-updates/where-and-how-dispose-unused-medicines',
      },
      {
        title: 'Antibiotic Awareness — Never Share or Reuse Leftover Antibiotics',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/campaigns/world-amr-awareness-week',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Nursing Medication Safety Check
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'scenario-5-nursing-rights',
    number: 5,
    title: {
      ar: 'السيناريو ٥: قائمة فحص سلامة إعطاء الدواء التمريضية',
      en: 'Scenario 5: Nursing Medication Safety Check',
    },
    subtitle: {
      ar: 'التحقق من هوية المريض، مطابقة الأمر الطبي، فحص الحساسية المسجلة، وتصعيد أي تعارض للطبيب والصيدلي',
      en: 'Practicing the safety checklist: verifying patient identity, prescribed order, documented allergies, and escalating discrepancies',
    },
    categoryBadge: {
      ar: 'الحقوق التمريضية وسلامة المريض',
      en: 'Nursing Safety Checklist',
    },
    primaryNpc: 'nurse',
    involvedNpcs: ['nurse', 'patient', 'doctor', 'pharmacist'],
    briefing: {
      ar: 'تستعد في جولة التمريض لمراجعة أمر دوائي خيالي لمريض في الجناح قبل الإعطاء. طبّق قائمة الفحص التمريضية (هوية المريض، الأمر الموصوف، الحساسية المسجلة) واكتشف التعارض لتصعيده بأمان دون تعديل الوصفة من تلقاء نفسك.',
      en: 'During a nursing round, you are reviewing a fictional medication order before administration. Apply the safety checklist (patient identity, prescribed order, documented allergies) and escalate any discrepancy rather than independently altering the prescription.',
    },
    initialNodeId: 's5_start',
    nodes: {
      s5_start: {
        id: 's5_start',
        speaker: 'nurse',
        targetNpc: 'nurse',
        objectiveHint: {
          ar: 'تحدث مع الممرضة سارة في محطة التمريض لاستلام قائمة فحص سلامة الدواء.',
          en: 'Speak with Nurse Sara at the Nursing Station to start the medication safety checklist.',
        },
        dialogue: {
          ar: 'لدينا تذكرة علاجية لإعطاء مضاد حيوي للمريض في سرير ١. قبل تحضير أو إعطاء أي دواء في الجناح، ما هي الخطوة الأولى في قائمة فحص السلامة التمريضية؟',
          en: 'We have a medication chart order for the patient in Bed 1. Before preparing or administering any medication on the ward, what is the critical first step in our nursing safety checklist?',
        },
        choices: [
          {
            id: 's5_c1_verify_id_order',
            label: {
              ar: 'التحقق من هوية المريض باستخدام معرّفين مستقلين (الاسم الكامل والرقم الطبي/السوار) ومطابقة الأمر الطبي الموصوف وسجل الحساسية',
              en: 'Verify patient identity using two independent identifiers (full name and wristband/medical ID) and cross-check the prescribed order and allergy record',
            },
            nextNodeId: 's5_patient_wristband',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'إجراء قياسي سليم! التحقق من الهوية ومطابقة التذكرة العلاجية وسجل الحساسية يمنع أخطاء الإعطاء قبل وقوعها.',
              en: 'Gold-standard nursing practice! Verifying two patient identifiers, the prescribed order, and documented allergies prevents administration errors.',
            },
            rationale: {
              ar: 'الالتزام بالحقوق السريرية لإعطاء الدواء (Right Patient, Right Medication, Allergy Check) هو خط الدفاع الأول عن سلامة المريض.',
              en: 'Strict adherence to medication administration rights and allergy verification is the primary safeguard in clinical nursing.',
            },
          },
          {
            id: 's5_c1_rely_bed_number',
            label: {
              ar: 'الاعتماد على رقم السرير فقط وإعطاء الدواء فوراً دون سؤال المريض أو فحص ملفه',
              en: 'Rely only on the bed number and administer the medicine immediately without checking the wristband or chart',
            },
            nextNodeId: 's5_patient_wristband',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطر كبير! رقم السرير ليس معرّفاً لهوية المريض، وتجاهل فحص التذكرة والحساسية قد يؤدي لخطأ دوائي قاتل.',
              en: 'High risk! Room or bed numbers are never valid patient identifiers, and skipping allergy checks can be fatal.',
            },
            rationale: {
              ar: 'قد ينتقل المرضى بين الأسرة؛ لذلك يجب دائماً مطابقة سوار الهوية وسؤال المريض.',
              en: 'Patients may change beds; always verify wristband identifiers and chart records directly.',
            },
          },
        ],
      },
      s5_patient_wristband: {
        id: 's5_patient_wristband',
        speaker: 'patient',
        targetNpc: 'patient',
        objectiveHint: {
          ar: 'توجه إلى الأستاذ أحمد في سرير ١ لمطابقة سوار الهوية وسجل الحساسية قبل الإعطاء.',
          en: 'Walk to Mr. Ahmed at Bed 1 to verify his ID wristband and allergy bracelet.',
        },
        dialogue: {
          ar: 'اسمي أحمد محمود، وهذا سواري الطبي.. وبالمناسبة أنا أرتدي أيضاً سوار تنبيه أحمر مكتوب عليه «حساسية موثقة من البنسلين»، بينما تذكرة الدواء التي بيدك مكتوب فيها مضاد حيوي من فئة البنسلين عن طريق الخطأ! ماذا ستفعل؟',
          en: 'My name is Ahmed Mahmoud, here is my ID wristband... and notice I am wearing a red allergy band stating "Documented Penicillin Allergy," while the chart order shows a penicillin-class antibiotic! What will you do?',
        },
        choices: [
          {
            id: 's5_c2_hold_and_escalate',
            label: {
              ar: 'إيقاف إعطاء الدواء فوراً (Hold)، عدم تغيير الوصفة بشكل مستقل، وتصعيد التعارض المكتشف فوراً إلى الطبيب الواصف والصيدلي الإكلينيكي',
              en: 'Hold administration immediately, do not independently change the prescription, and escalate the discrepancy to the prescribing physician and clinical pharmacist',
            },
            nextNodeId: 's5_doctor_resolution',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'يقظة تمريضية ممتازة! إيقاف الإعطاء عند اكتشاف تعارض وتصعيده للطبيب والصيدلي أنقذ المريض من تفاعل تحسسي خطير.',
              en: 'Exemplary nursing vigilance! Holding the medication and escalating the discrepancy to the prescriber and pharmacist prevented a severe allergic reaction.',
            },
            rationale: {
              ar: 'لا يقوم التمريض باستبدال الدواء من تلقاء نفسه، بل يوقف الإعطاء المؤقت ويُبلغ الطبيب والصيدلي لتعديل الأمر الطبي رسمياً.',
              en: 'Nurses never independently substitute prescription drugs; they hold the dose and escalate so the physician can issue a verified safe order.',
            },
          },
          {
            id: 's5_c2_change_independently',
            label: {
              ar: 'تغيير الدواء من تلقاء نفسك إلى مضاد حيوي آخر من دولاب الجناح دون إبلاغ الطبيب',
              en: 'Independently swap the medicine for a different antibiotic from the ward cabinet without telling the doctor',
            },
            nextNodeId: 's5_doctor_resolution',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير قانوني وغير آمن! لا يجوز تعديل أو استبدال الوصفة الطبية بشكل فردي دون أمر طبي معتمد ومراجعة الصيدلي.',
              en: 'Unsafe and out of scope! Never independently alter or substitute a prescribed medication without prescriber authorization.',
            },
            rationale: {
              ar: 'الاستبدال الفردي بدون مراجعة الطبيب والصيدلي قد يسبب تداخلاً دوائياً أو جرعة خاطئة أو فشلاً علاجياً.',
              en: 'Unauthorized substitution bypasses clinical checks for indication, renal dosing, and drug interactions.',
            },
          },
          {
            id: 's5_c2_give_anyway',
            label: {
              ar: 'إعطاء الدواء كما هو لأن الأمر مكتوب في التذكرة وتجاهل سوار الحساسية الأحمر',
              en: 'Administer the medication anyway because it is written on the chart, ignoring the red allergy band',
            },
            nextNodeId: 's5_doctor_resolution',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطأ كارثي! إعطاء دواء لمريض يحمل سوار حساسية موثق ضده يعرضه لصدمة تحسسية تهدد حياته.',
              en: 'Critical error! Administering a contraindicated drug to a patient with a documented allergy risks fatal anaphylaxis.',
            },
            rationale: {
              ar: 'وظيفة قائمة الفحص التمريضية هي اكتشاف مثل هذه الأخطاء وإيقافها قبل وصول الدواء للمريض.',
              en: 'The core purpose of the nursing safety checklist is to catch and halt discrepancies before reaching the patient.',
            },
          },
        ],
      },
      s5_doctor_resolution: {
        id: 's5_doctor_resolution',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'توجه إلى د. طارق لإبلاغه بالتعارض المكتشف وتوثيق الإجراء التصحيحي.',
          en: 'Walk to Dr. Tarek’s desk to report the discrepancy and finalize the safe order review.',
        },
        dialogue: {
          ar: 'أشكرك بشدة على تطبيق قائمة الفحص التمريضية بدقة وإيقاف الدواء قبل إعطائه! سأقوم بالتنسيق مع د. مريم في الصيدلية لإلغاء الأمر السابق وتوثيق الإجراء. ما هي الخطوة الختامية في التوثيق التمريضي؟',
          en: 'Thank you for strictly following the nursing safety checklist and holding the dose! I will coordinate with Pharmacist Dr. Mariam to update the order safely. What is our final step in nursing documentation?',
        },
        choices: [
          {
            id: 's5_c3_document_clear',
            label: {
              ar: 'توثيق إيقاف الجرعة وسبب التعارض، وإبلاغ الطبيب والصيدلي، والتأكد من تحديث تنبيه الحساسية في السجل قبل أي إعطاء لاحق',
              en: 'Document the held dose, the allergy discrepancy, and the escalation to the physician/pharmacist, ensuring the chart alert is updated before any administration',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'توثيق احترافي متكامل! لقد أتممت جميع عناصر قائمة الفحص التمريضية لسلامة الدواء بنجاح.',
              en: 'Complete professional documentation! You successfully demonstrated every element of the nursing medication safety checklist.',
            },
            rationale: {
              ar: 'التوثيق الدقيق والتواصل الفعال بين التمريض والطب والصيدلة يغلق الفجوات ويمنع تكرار الأخطاء الدوائية.',
              en: 'Clear documentation and interprofessional communication close safety loops and prevent recurring medication errors.',
            },
          },
          {
            id: 's5_c3_no_doc',
            label: {
              ar: 'عدم كتابة أي ملاحظة في الملف حتى لا يعلم باقي الفريق بوجود تعارض سابق',
              en: 'Leave it undocumented in the chart so the rest of the shift does not know a discrepancy occurred',
            },
            nextNodeId: 'END',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! عدم توثيق التعارض قد يؤدي لقيام ممرض آخر في الوردية التالية بإعطاء الدواء الخاطئ.',
              en: 'Unsafe! Failing to document the held order and allergy alert risks another staff member administering it on the next shift.',
            },
            rationale: {
              ar: 'ثقافة سلامة المرضى (Just Culture) تشجع على الإبلاغ والتوثيق الشفاف لمنع الضرر.',
              en: 'A strong patient safety culture relies on transparent reporting and chart documentation to protect patients across shifts.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'تطبيق قائمة الفحص التمريضية (التحقق من هوية المريض بمعرّفين، مطابقة الأمر الموصوف، فحص الحساسية الموثقة) وتصعيد التعارض للطبيب والصيدلي بدلاً من تغيير الوصفة فردياً.',
      en: 'Executing the nursing medication safety checklist (verifying patient identity, prescribed order, and documented allergies) and escalating discrepancies to the prescriber rather than independently modifying orders.',
    },
    educationalTakeaway: {
      ar: 'قوائم فحص سلامة الدواء التمريضية تحمي حياة المرضى: تحقق دائماً من هوية المريض والأمر الطبي والحساسية المسجلة قبل أي إعطاء، وإذا وجدت أي تعارض أو شك، أوقف الإعطاء وصعّد الأمر للطبيب والصيدلي ولا تغيّر الوصفة من تلقاء نفسك.',
      en: 'Nursing medication safety checklists save lives: always verify patient identity, the prescribed order, and documented allergies before administration. When any discrepancy arises, hold the dose and escalate to the prescribing clinician and pharmacist—never alter prescriptions independently.',
    },
    escalationGuidance: {
      ar: 'عند الشك في أي أمر دوائي أو ملاحظة تعارض مع حساسية المريض أو وظائف أعضائه، أوقف الإعطاء فوراً وتواصل مع الطبيب المعالج والصيدلي الإكلينيكي.',
      en: 'Whenever a medication order appears unclear or conflicts with a patient’s documented allergies, pause administration immediately and contact the prescribing clinician and pharmacist.',
    },
    badgeTitle: {
      ar: 'بطل سلامة الدواء التمريضية',
      en: 'Nursing Medication Safety Star',
    },
    badgeIcon: '⭐',
    sources: [
      {
        title: 'Medication Without Harm — Global Patient Safety Challenge',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/initiatives/medication-without-harm',
      },
      {
        title: 'Core Elements of Hospital Antibiotic Stewardship Programs — Nursing Role',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/core-elements/hospital.html',
      },
    ],
  },
];
