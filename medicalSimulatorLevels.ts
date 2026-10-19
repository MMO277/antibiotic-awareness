import { Bilingual } from './types';
import { MedicalScenario } from './medicalSimulatorScenarios';

export type EnvironmentTheme =
  | 'ward'
  | 'er'
  | 'allergy_clinic'
  | 'pharmacy_hub'
  | 'home_mystery'
  | 'nursing_station'
  | 'med_lab'
  | 'ward_round'
  | 'infection_puzzle'
  | 'microscopic_3d'
  | 'capstone_mission';

export type PropVisualShape =
  | 'monitor'
  | 'allergy_chart'
  | 'rx_slips'
  | 'medicine_cabinet'
  | 'wristband_scanner'
  | 'lab_specimen'
  | 'vitals_board'
  | 'sanitizer_ppe'
  | 'microbe_scanner'
  | 'capstone_console';

export interface InteractivePropStep {
  id: string;
  prompt: Bilingual;
  options: {
    id: string;
    label: Bilingual;
    isCorrect: boolean;
    feedback: Bilingual;
  }[];
}

export interface InteractivePropDefinition {
  id: string;
  name: Bilingual;
  stationLabel: Bilingual;
  /** World-space position [x, y, z] inside the 3D scene */
  position: [number, number, number];
  color: number;
  accentColor: number;
  iconEmoji: string;
  shape: PropVisualShape;
  /** Multi-step interactive inspection / puzzle completed at this 3D prop */
  puzzleSteps: InteractivePropStep[];
  completionClueSummary: Bilingual;
}

export interface CampaignLevel extends MedicalScenario {
  isCampaignLevel: true;
  campaignIndex: number; // 1 to 10
  /** ID of the level that must be completed to unlock this level (null for Level 1) */
  requiredLevelId: string | null;
  unlockRequirementText: Bilingual;
  environmentTheme: EnvironmentTheme;
  /** Gentle non-punitive target time in seconds for ER response pacing (optional) */
  gentleTimerSeconds?: number;
  /** Interactive 3D props/clues placed in the 3D world that the player must physically inspect/solve */
  interactiveProps: InteractivePropDefinition[];
  /** Node ID where the required 3D prop puzzle must be solved before finalizing the level */
  requirePropsSolvedBeforeNodeId?: string;
}

export const CAMPAIGN_TEN_LEVELS: CampaignLevel[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 1 — Emergency Room: First Response
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-1-er-first-response',
    isCampaignLevel: true,
    campaignIndex: 1,
    number: 1,
    requiredLevelId: null,
    unlockRequirementText: {
      ar: 'متاح للبدء مباشرة (المستوى الأول في الحملة)',
      en: 'Unlocked by default (Campaign Level 1)',
    },
    environmentTheme: 'er',
    gentleTimerSeconds: 90,
    title: {
      ar: 'المستوى ١ — غرفة الطوارئ: الاستجابة الأولى',
      en: 'Level 1 — Emergency Room: First Response',
    },
    subtitle: {
      ar: 'استكشف قسم الطوارئ، افحص شاشة العلامات الحيوية ثلاثية الأبعاد، وتعرّف على علامات الإنذار التنفسية لتصعيدها فوراً',
      en: 'Explore the emergency bay, inspect the 3D vitals monitor, recognize respiratory warning signs, and call qualified help',
    },
    categoryBadge: {
      ar: 'طوارئ واستجابة أولى',
      en: 'ER Triage & Escalation',
    },
    primaryNpc: 'nurse',
    involvedNpcs: ['nurse', 'patient', 'doctor'],
    briefing: {
      ar: 'وصل مريض خيالي إلى غرفة الطوارئ يعاني من تسارع في التنفس بعد ٣ أيام من أعراض تنفسية. افحص أولاً «شاشة العلامات الحيوية» بجوار السرير، ثم تحدث مع الممرضة سارة والمريض، وصعّد الحالة للطبيب المختص دون إعطاء مضاد حيوي عشوائي.',
      en: 'A fictional patient arrived in the Emergency Bay with rapid breathing after 3 days of respiratory symptoms. First inspect the 3D Vitals Monitor near the bed, then speak with Nurse Sara and the patient, and escalate safely to Dr. Tarek.',
    },
    interactiveProps: [
      {
        id: 'prop-er-monitor',
        name: {
          ar: 'شاشة العلامات الحيوية وأكسجين الدم (SpO2)',
          en: 'Emergency Vitals & Pulse Oximetry Monitor',
        },
        stationLabel: {
          ar: 'جهاز المونيتور بجانب سرير الطوارئ',
          en: 'Bedside ER Vitals Monitor',
        },
        position: [-3.4, 0, 2.8],
        color: 0xef4444,
        accentColor: 0x38bdf8,
        iconEmoji: '📟',
        shape: 'monitor',
        puzzleSteps: [
          {
            id: 'er_mon_s1',
            prompt: {
              ar: 'تشير شاشة المونيتور في الحالة التعليمية إلى: معدل التنفس 28/دقيقة، نسبة الأكسجين 91%، والحرارة 38.9°C. ما دلالة هذه القراءة؟',
              en: 'The educational monitor displays: Respiratory Rate 28/min, SpO2 91%, Temp 38.9°C. What does this clue indicate?',
            },
            options: [
              {
                id: 'er_mon_o1',
                label: {
                  ar: 'علامات إنذار تنفسية (Red Flags) تتطلب استدعاء الطبيب المختص فوراً للتقييم السريري',
                  en: 'Respiratory warning signs (Red Flags) requiring immediate escalation to a qualified physician',
                },
                isCorrect: true,
                feedback: {
                  ar: 'ممتاز! انخفاض الأكسجين وتسارع التنفس من علامات الإنذار التي تستوجب تدخل الطبيب الفوري.',
                  en: 'Correct! Hypoxemia and tachypnea are key warning signs requiring immediate clinician assessment.',
                },
              },
              {
                id: 'er_mon_o2',
                label: {
                  ar: 'مجرد عطس بسيط لا يحتاج لأي متابعة أو إبلاغ للفريق الطبي',
                  en: 'Just a minor sneeze that requires no follow-up or team notification',
                },
                isCorrect: false,
                feedback: {
                  ar: 'انتبه: معدل التنفس المرتفع وانخفاض الأكسجين إلى 91% علامة مقلقة يجب إبلاغ الطبيب بها فوراً.',
                  en: 'Look closely: RR 28/min and SpO2 91% are warning signs that must be escalated right away.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'تم رصد علامات الإنذار على المونيتور (SpO2 91% وتسارع التنفس) وتجهيزها لإبلاغ الطبيب.',
          en: 'Vitals monitor clue logged: SpO2 91% and tachypnea identified for immediate physician escalation.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l1_doctor',
    initialNodeId: 'l1_start',
    nodes: {
      l1_start: {
        id: 'l1_start',
        speaker: 'nurse',
        targetNpc: 'nurse',
        objectiveHint: {
          ar: 'تحدث مع الممرضة سارة في محطة طوارئ الجناح لبدء الاستجابة الأولى.',
          en: 'Talk to Nurse Sara at the Emergency Triage desk to begin.',
        },
        dialogue: {
          ar: 'حالة طوارئ تدريبية! المريض في سرير ١ يعاني من نهجان واضح، ومرافقه يطلب إعطاءه «حقنة مضاد حيوي فورية» قبل فحص الطبيب. كيف نبدأ الاستجابة الأولى الآمنة؟',
          en: 'Training ER alert! The patient in Bed 1 is short of breath, and a relative is asking us to inject an antibiotic immediately before any doctor exam. What is our safe first response?',
        },
        choices: [
          {
            id: 'l1_c1_safe',
            label: {
              ar: 'فحص شاشة العلامات الحيوية وتقييم المريض أولاً، والامتناع عن إعطاء أي مضاد حيوي قبل تقييم الطبيب المختص',
              en: 'Check the bedside vitals monitor and assess the patient first, refusing unprescribed antibiotics prior to physician evaluation',
            },
            nextNodeId: 'l1_patient',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'استجابة أولى صحيحة! الأولوية في الطوارئ هي لتقييم العلامات الحيوية ومجرى النفس والتصعيد الطبي.',
              en: 'Safe first response! Emergency priority is airway/breathing assessment and rapid escalation to a clinician.',
            },
            rationale: {
              ar: 'إعطاء مضاد حيوي عشوائي في الطوارئ قبل التشخيص قد يضر المريض ويؤخر الرعاية التنفسية العاجلة.',
              en: 'Giving unprescribed antibiotics before triage assessment delays urgent respiratory support.',
            },
          },
          {
            id: 'l1_c1_unsafe',
            label: {
              ar: 'إعطاء مضاد حيوي عشوائي فوراً لتهدئة المرافق دون فحص العلامات الحيوية',
              en: 'Inject a random antibiotic immediately to calm the relative without checking vitals',
            },
            nextNodeId: 'l1_patient',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطر! لا يجوز أبداً إعطاء دواء في الطوارئ دون تقييم العلامات الحيوية وأمر طبي.',
              en: 'Unsafe! Never administer unprescribed medications in the ER without vitals assessment and a physician order.',
            },
            rationale: {
              ar: 'سلامة المريض في الطوارئ تعتمد على الرصد الدقيق للعلامات الحيوية واستدعاء الفريق المؤهل.',
              en: 'Emergency safety depends on accurate triage vitals and calling qualified help.',
            },
          },
        ],
      },
      l1_patient: {
        id: 'l1_patient',
        speaker: 'patient',
        targetNpc: 'patient',
        objectiveHint: {
          ar: 'افحص «شاشة العلامات الحيوية 📟» بجوار السرير، ثم تحدث مع المريض أحمد.',
          en: 'Inspect the 3D Vitals Monitor 📟 near the bed, then talk to Patient Ahmed.',
        },
        dialogue: {
          ar: 'أشعر أن نفسي سريع ومجهد اليوم.. هل فحصت شاشة العلامات الحيوية بجانبي وأبلغت الطبيب؟',
          en: 'My breathing feels fast and labored today... Did you check the vitals monitor next to me and alert the doctor?',
        },
        choices: [
          {
            id: 'l1_c2_escalate',
            label: {
              ar: 'طمأنته ومساعدته على الجلوس في وضع مريح، وإبلاغ د. طارق فوراً بقراءات المونيتور وعلامات الإنذار',
              en: 'Reassure him, help him sit upright comfortably, and immediately report the monitor warning signs to Dr. Tarek',
            },
            nextNodeId: 'l1_doctor',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'تصرف سليم! تأكد من فحص شاشة المونيتور ثلاثية الأبعاد (📟) ثم توجه إلى د. طارق.',
              en: 'Great action! Make sure you have inspected the 3D Vitals Monitor (📟), then report to Dr. Tarek.',
            },
            rationale: {
              ar: 'رصد العلامات الحيوية ونقلها بدقة للطبيب يسرّع التدخل الطبي الآمن.',
              en: 'Recording and communicating vital sign red flags accelerates safe medical intervention.',
            },
          },
          {
            id: 'l1_c2_delay',
            label: {
              ar: 'طلب الانتظار لساعات دون إبلاغ الطبيب بانخفاض الأكسجين',
              en: 'Tell him to wait for hours without informing the physician about his low oxygen reading',
            },
            nextNodeId: 'l1_doctor',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! علامات ضيق التنفس وانخفاض الأكسجين تتطلب استدعاء الطبيب فوراً.',
              en: 'Unsafe! Shortness of breath and low oxygen saturation require immediate clinician notification.',
            },
            rationale: {
              ar: 'التأخر في تصعيد علامات الإنذار التنفسية يعرض حياة المريض للخطر.',
              en: 'Delaying escalation of respiratory warning signs endangers patient safety.',
            },
          },
        ],
      },
      l1_doctor: {
        id: 'l1_doctor',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'تحدث مع د. طارق في مكتب الاستشارة لتسليم تقرير الاستجابة الأولى.',
          en: 'Speak with Dr. Tarek at the Consultation Desk to hand over the ER triage findings.',
        },
        dialogue: {
          ar: 'أحسنت برصد قراءات شاشة العلامات الحيوية واستدعائي فوراً! سنبدأ بروتوكول دعم الأكسجين والفحص التشخيصي الكامل قبل اتخاذ أي قرار دوائي. ما الدرس الأهم من استجابتك الأولى؟',
          en: 'Well done inspecting the vitals monitor and escalating immediately! We will initiate oxygen support and diagnostic workup before deciding on any medication. What is our key takeaway?',
        },
        choices: [
          {
            id: 'l1_c3_finish',
            label: {
              ar: 'التعرف المبكر على علامات الإنذار التنفسية واستدعاء الفريق الطبي المؤهل فوراً بدلاً من التداوي العشوائي بالمضادات الحيوية',
              en: 'Recognize respiratory warning signs early and call qualified medical help immediately instead of guessing antibiotics',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'إتمام ممتاز للمستوى الأول! لقد فتحت الآن المستوى الثاني: لغز الحساسية الدوائية.',
              en: 'Level 1 complete! You have unlocked Level 2: The Allergy Clue.',
            },
            rationale: {
              ar: 'الاستجابة الأولى الآمنة تعتمد على الفحص المنظم والتصعيد الفوري للمختصين.',
              en: 'Safe first response relies on structured triage and prompt escalation to qualified clinicians.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'فحص شاشة العلامات الحيوية ثلاثية الأبعاد، التعرف على علامات الإنذار التنفسية، واستدعاء الطبيب المختص فوراً دون إعطاء مضاد حيوي غير موصوف.',
      en: 'Inspecting the 3D vitals monitor, recognizing respiratory warning signs, and calling a qualified clinician immediately without administering unprescribed antibiotics.',
    },
    educationalTakeaway: {
      ar: 'في حالات ضيق التنفس أو الأعراض الحادة، الأولوية هي لرصد علامات الإنذار وطلب المساعدة الطبية المؤهلة فوراً—وليس إعطاء مضادات حيوية عشوائية.',
      en: 'When facing acute respiratory symptoms, the priority is recognizing warning signs and calling qualified medical help—never administering unprescribed antibiotics.',
    },
    escalationGuidance: {
      ar: 'في الواقع: اطلب الإسعاف فوراً (123) عند ملاحظة صعوبة في التنفس، نهجان مستمر، ازرقاق الشفاه، أو ألم بالصدر.',
      en: 'In real life: Call emergency services (123) immediately for difficulty breathing, rapid labored breathing, bluish lips, or chest pain.',
    },
    badgeTitle: {
      ar: 'مستجيب الطوارئ الآمن',
      en: 'Safe ER First Responder',
    },
    badgeIcon: '🚑',
    sources: [
      {
        title: 'WHO Emergency Triage & Respiratory Warning Signs',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/health-topics/emergency-care',
      },
      {
        title: 'CDC Antibiotic Use — Acute Respiratory Symptoms',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/index.html',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 2 — The Allergy Clue
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-2-allergy-clue',
    isCampaignLevel: true,
    campaignIndex: 2,
    number: 2,
    requiredLevelId: 'level-1-er-first-response',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ١ (غرفة الطوارئ: الاستجابة الأولى)',
      en: 'Unlocks after completing Level 1 (Emergency Room: First Response)',
    },
    environmentTheme: 'allergy_clinic',
    title: {
      ar: 'المستوى ٢ — دليل الحساسية الدوائية',
      en: 'Level 2 — The Allergy Clue',
    },
    subtitle: {
      ar: 'افحص سجل الحساسية ثلاثي الأبعاد، استخرج المادة الفعالة الموثقة، وصعّد الشكوك للصيدلي والطبيب المختص',
      en: 'Inspect the 3D allergy chart, identify the documented active ingredient, and escalate cross-reactivity questions to specialists',
    },
    categoryBadge: {
      ar: 'تحقيق الحساسية الدوائية',
      en: 'Allergy Clue Investigation',
    },
    primaryNpc: 'patient',
    involvedNpcs: ['patient', 'pharmacist', 'doctor'],
    briefing: {
      ar: 'يذكر المريض أنه تحسس سابقاً من مضاد حيوي لكنه لا يتذكر سوى جزء من بيانات العلبة. افحص «ملف سجل الحساسية 🛡️» الموجود في الجناح لاستخراج المادة الفعالة، ثم استشر الصيدلانية د. مريم والطبيب د. طارق.',
      en: 'The patient mentions a past antibiotic reaction but only remembers part of the label. Inspect the 3D Allergy Record Chart 🛡️ in the ward to identify the active ingredient, then consult Pharmacist Mariam and Dr. Tarek.',
    },
    interactiveProps: [
      {
        id: 'prop-allergy-chart',
        name: {
          ar: 'لوحة سجل الحساسية والمادة الفعالة',
          en: 'Patient Allergy Record & Ingredient Chart',
        },
        stationLabel: {
          ar: 'حامل ملفات الحساسية بجانب محطة التمريض',
          en: 'Allergy Record Stand near Nursing Station',
        },
        position: [-1.8, 0, -2.2],
        color: 0xf59e0b,
        accentColor: 0xfef3c7,
        iconEmoji: '🛡️',
        shape: 'allergy_chart',
        puzzleSteps: [
          {
            id: 'al_s1',
            prompt: {
              ar: 'يظهر في السجل التثقيفي الموثق: «المنتج السابق: أوجمنتين (Augmentin) — التركيب العلمي: أموكسيسيلين + حمض كلافولانيك — التفاعل: شرى جلدي وتورم بالشفاه». ما هي المادة الفعالة للمضاد الحيوي هنا؟',
              en: 'The documented educational chart reads: "Prior product: Augmentin — Generic composition: Amoxicillin + Clavulanic Acid — Reaction: Hives & lip swelling." What is the active beta-lactam antibiotic ingredient?',
            },
            options: [
              {
                id: 'al_o1',
                label: {
                  ar: 'أموكسيسيلين (Amoxicillin) — من عائلة البنسلينات (مع حمض كلافولانيك)',
                  en: 'Amoxicillin (Penicillin class beta-lactam, combined with clavulanic acid)',
                },
                isCorrect: true,
                feedback: {
                  ar: 'أحسنت! تحديد المادة الفعالة (أموكسيسيلين) بدلاً من الاكتفاء بالاسم التجاري هو مفتاح أمان المريض.',
                  en: 'Spot on! Identifying the generic active ingredient (Amoxicillin) rather than just the brand name is essential.',
                },
              },
              {
                id: 'al_o2',
                label: {
                  ar: 'لا توجد مادة فعالة، فالاسم التجاري وحده يكفي للحكم على كل الأدوية',
                  en: 'There is no active ingredient; brand names alone determine allergy safety',
                },
                isCorrect: false,
                feedback: {
                  ar: 'غير صحيح! يجب دائماً تحديد المادة الفعالة (أموكسيسيلين) المسؤولة عن التحسس.',
                  en: 'Incorrect! You must always look up the generic active ingredient (Amoxicillin).',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'تم استخراج الدليل: المادة الفعالة هي أموكسيسيلين (Amoxicillin) مع تاريخ تفاعل تحسسي حاد.',
          en: 'Clue solved: Active ingredient identified as Amoxicillin with documented angioedema history.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l2_pharmacist',
    initialNodeId: 'l2_start',
    nodes: {
      l2_start: {
        id: 'l2_start',
        speaker: 'patient',
        targetNpc: 'patient',
        objectiveHint: {
          ar: 'تحدث مع المريض أحمد في سرير ١، ثم افحص «لوحة سجل الحساسية 🛡️» في وسط الجناح.',
          en: 'Talk to Patient Ahmed at Bed 1, then inspect the 3D Allergy Record Chart 🛡️ in the ward.',
        },
        dialogue: {
          ar: 'أهلاً بك! عندي بطاقة حساسية قديمة معلقة في سجل الجناح، وأريد أن أعرف: ما هي المادة الفعالة المسجلة فيها؟ وهل كل دواء في نفس العائلة أو العائلات القريبة يُعتبر آمناً أو خطراً تلقائياً؟',
          en: 'Hello! My old allergy card is filed on the ward chart stand. Can you find the active ingredient listed on it, and tell me if every medicine in related classes is automatically safe or unsafe?',
        },
        choices: [
          {
            id: 'l2_c1_inspect',
            label: {
              ar: 'فحص سجل الحساسية الموثق لتحديد المادة الفعالة بدقة، ثم استشارة الصيدلانية الإكلينيكية لتقييم التفاعل المتصالب علمياً',
              en: 'Inspect the documented allergy chart to identify the exact active ingredient, then consult the clinical pharmacist to evaluate cross-reactivity',
            },
            nextNodeId: 'l2_pharmacist',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'خطوة ممتازة! افحص مجسم «سجل الحساسية 🛡️» في الغرفة ثم توجه إلى الصيدلانية د. مريم.',
              en: 'Excellent step! Inspect the 3D Allergy Chart 🛡️ prop in the room, then speak with Pharmacist Mariam.',
            },
            rationale: {
              ar: 'التحقق من السجل الموثق يمنع التخمين الخاطئ لاسم الدواء.',
              en: 'Checking documented records prevents dangerous guessing of medication names.',
            },
          },
          {
            id: 'l2_c1_blanket',
            label: {
              ar: 'الافتراض التلقائي بأن جميع المضادات الحيوية آمنة طالما تغير لون العلبة',
              en: 'Assume all other antibiotics are automatically safe as long as the box color is different',
            },
            nextNodeId: 'l2_pharmacist',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطأ خطر! اختلاف شكل العلبة لا يمنع وجود نفس المادة الفعالة أو تفاعل متصالب.',
              en: 'Unsafe! Box color has nothing to do with active ingredients or beta-lactam cross-reactivity.',
            },
            rationale: {
              ar: 'يجب دائماً فحص المادة الفعالة ومراجعة الصيدلي والطبيب.',
              en: 'Always verify the active ingredient and escalate to a pharmacist or physician.',
            },
          },
        ],
      },
      l2_pharmacist: {
        id: 'l2_pharmacist',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'بعد حل دليل «لوحة سجل الحساسية 🛡️»، تحدث مع د. مريم في ركن الصيدلية.',
          en: 'After solving the 3D Allergy Chart 🛡️ clue, talk to Dr. Mariam at the Pharmacy Counter.',
        },
        dialogue: {
          ar: 'رائع أنك استخرجت المادة الفعالة (أموكسيسيلين) من السجل! الآن، عندما نسأل عن البدائل أو عائلة السيفالوسبورينات، كيف نصيغ القاعدة العلمية الدقيقة دون تعميم خاطئ؟',
          en: 'Great job identifying Amoxicillin from the chart! Now, regarding related beta-lactams like cephalosporins, what is the accurate clinical rule?',
        },
        choices: [
          {
            id: 'l2_c2_nuanced',
            label: {
              ar: 'لا نفترض أن كل دواء في عائلة واسعة آمن تلقائياً أو ممنوع تلقائياً؛ بل نصعّد القرار للطبيب والصيدلي لتقييم السلاسل الكيميائية وشدة الحساسية',
              en: 'Do not claim every drug in a broad class is automatically safe or unsafe; escalate to a qualified clinician/pharmacist to evaluate side-chain similarity and reaction severity',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'إجابة علمية دقيقة! أتممت المستوى الثاني وفتحت المستوى الثالث (تحدي كاونتر الصيدلية).',
              en: 'Clinically precise! You completed Level 2 and unlocked Level 3 (Pharmacy Counter Challenge).',
            },
            rationale: {
              ar: 'التقييم المهني للسلاسل الجانبية وشدة التفاعل السابق هو المعيار الطبي المعتمد.',
              en: 'Professional evaluation of chemical side chains and reaction history is the standard of care.',
            },
          },
          {
            id: 'l2_c2_guess',
            label: {
              ar: 'إعطاء المريض أي دواء عشوائياً دون استشارة الطبيب',
              en: 'Give the patient a random antibiotic without consulting the physician',
            },
            nextNodeId: 'END',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! الحساسية الشديدة تتطلب تقييماً طبياً وصيدلانياً موثقاً.',
              en: 'Unsafe! Severe allergy history requires formal physician and pharmacist evaluation.',
            },
            rationale: {
              ar: 'التصعيد للمختصين يحمي المريض من الصدمة التحسسية.',
              en: 'Escalating uncertainty to specialists protects patients from anaphylaxis.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'استخراج المادة الفعالة (أموكسيسيلين) من سجل الحساسية الموثق وتصعيد تقييم التفاعل المتصالب للصيدلي والطبيب دون تعميم عشوائي.',
      en: 'Identifying the active ingredient (Amoxicillin) from the allergy record and escalating cross-reactivity assessment to qualified professionals.',
    },
    educationalTakeaway: {
      ar: 'تحديد المادة الفعالة (الاسم العلمي) أساسي عند فحص الحساسية، ولا يجوز افتراض أن كل دواء في عائلة دوائية آمن أو غير آمن تلقائياً دون تقييم طبي وصيدلاني.',
      en: 'Identifying the active ingredient is critical for allergy safety. Never assume every drug in a broad class is automatically safe or unsafe—always escalate uncertainty to a clinician or pharmacist.',
    },
    escalationGuidance: {
      ar: 'عند ظهور أعراض تحسس حادة (تورم الشفاه أو اللسان أو صعوبة التنفس)، اتصل بالإسعاف (123) فوراً.',
      en: 'If severe allergic signs appear (lip/tongue swelling or breathing difficulty), call emergency services (123) immediately.',
    },
    badgeTitle: {
      ar: 'محقق دليل الحساسية',
      en: 'Allergy Clue Detective',
    },
    badgeIcon: '🔍',
    sources: [
      {
        title: 'Penicillin Allergy & Cross-Reactivity Facts',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/clinicians/penicillin-allergy.html',
      },
      {
        title: 'Drug Reactions & Allergy Documentation',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/drugreactions.html',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — Pharmacy Counter Challenge
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-3-pharmacy-challenge',
    isCampaignLevel: true,
    campaignIndex: 3,
    number: 3,
    requiredLevelId: 'level-2-allergy-clue',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ٢ (دليل الحساسية الدوائية)',
      en: 'Unlocks after completing Level 2 (The Allergy Clue)',
    },
    environmentTheme: 'pharmacy_hub',
    title: {
      ar: 'المستوى ٣ — تحدي كاونتر الصيدلية',
      en: 'Level 3 — Pharmacy Counter Challenge',
    },
    subtitle: {
      ar: 'تعامل مع ٣ حالات صيدلانية: طلب مضاد بدون وصفة، معلومات دواء غير واضحة، وحالة تحتاج تقييماً طبياً',
      en: 'Handle 3 pharmacy queue cases: unprescribed antibiotic request, unclear medicine info, and a customer needing clinical assessment',
    },
    categoryBadge: {
      ar: 'حوكمة الصيدلية والتثقيف',
      en: 'Pharmacy Queue Triage',
    },
    primaryNpc: 'pharmacist',
    involvedNpcs: ['pharmacist', 'doctor'],
    briefing: {
      ar: 'في ركن الصيدلية ثلاثي الأبعاد توجد «منصة طلبات المراجعين الثلاثة 🧾». افحص الحالات الثلاث على المنصة وفرّق بينها بدقة، ثم نسّق مع د. مريم ود. طارق.',
      en: 'At the 3D Pharmacy Counter, inspect the "Pharmacy Triage Slips Stand 🧾" to review three distinct visitor cases, then coordinate safe responses with Dr. Mariam and Dr. Tarek.',
    },
    interactiveProps: [
      {
        id: 'prop-rx-slips',
        name: {
          ar: 'منصة طلبات المراجعين الثلاثة في الصيدلية',
          en: 'Pharmacy Queue: 3 Visitor Request Slips',
        },
        stationLabel: {
          ar: 'كاونتر الصيدلية الإكلينيكية',
          en: 'Clinical Pharmacy Queue Stand',
        },
        position: [3.2, 0, 2.8],
        color: 0x10b981,
        accentColor: 0xa7f3d0,
        iconEmoji: '🧾',
        shape: 'rx_slips',
        puzzleSteps: [
          {
            id: 'rx_s1',
            prompt: {
              ar: 'الحالة (أ): مراجع يطلب مضاداً حيوياً قوياً لاحتقان بسيط بدون روشتة. الحالة (ب): مراجع يحمل شريط دواء مقصوصاً بلا اسم واضح. الحالة (ج): مراجع يشكو من حمى شديدة وألم حاد بالأذن. ما الإجراء الصحيح للحالات الثلاث؟',
              en: 'Case A: Requests antibiotics without a prescription. Case B: Holds an unlabeled cut blister strip with unclear medicine info. Case C: Reports high fever and severe ear pain needing assessment. What is the safe response?',
            },
            options: [
              {
                id: 'rx_o1',
                label: {
                  ar: 'رفض الصرف بدون وصفة بأدب في (أ)، عدم التخمين في الشريط المجهول في (ب)، وتوجيه (ج) للفحص الطبي العاجل',
                  en: 'Respectfully decline unprescribed dispensing in (A), never guess unlabeled strips in (B), and refer (C) to a qualified clinician for assessment',
                },
                isCorrect: true,
                feedback: {
                  ar: 'فرز صيدلاني ممتاز! كل حالة من الحالات الثلاث حصلت على التوجيه الآمن المتوافق مع القواعد.',
                  en: 'Excellent pharmacy triage! All three cases received safe, rules-compliant guidance.',
                },
              },
              {
                id: 'rx_o2',
                label: {
                  ar: 'صرف مضادات حيوية للجميع وتخمين اسم الشريط المقصوص من لونه',
                  en: 'Dispense antibiotics to everyone and guess the cut blister strip by pill color',
                },
                isCorrect: false,
                feedback: {
                  ar: 'خطر! تخمين الأدوية غير الواضحة أو صرف المضادات بلا وصفة يعرض المرضى للخطر.',
                  en: 'Unsafe! Guessing unlabeled pills or dispensing unprescribed antibiotics endangers patients.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'تم فرز طلبات الصيدلية الثلاثة: تثقيف محترم، عدم تخمين الدواء غير الواضح، وإحالة للتقييم الطبي.',
          en: '3 Pharmacy queue slips triaged: respectful education, no guessing unclear meds, and clinical referral.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l3_doctor',
    initialNodeId: 'l3_start',
    nodes: {
      l3_start: {
        id: 'l3_start',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'افحص «منصة طلبات الصيدلية 🧾» بجوار الكاونتر، وتحدث مع الصيدلانية د. مريم.',
          en: 'Inspect the "Pharmacy Triage Slips 🧾" prop near the counter and speak with Pharmacist Dr. Mariam.',
        },
        dialogue: {
          ar: 'أهلاً بك في تحدي كاونتر الصيدلية! لدينا ٣ مراجعين في وقت واحد: الأول يطلب مضاداً حيوياً بدون وصفة، الثاني معه شريط دواء مقصوص غير واضح البيانات، والثالث يعاني من أعراض تحتاج تقييماً طبياً. كيف نتصرف مع المراجع الذي يحمل دواءً غير واضح البيانات؟',
          en: 'Welcome to the Pharmacy Counter Challenge! We have three visitors at once: one requesting antibiotics without a prescription, one with an unclear cut medicine strip, and one needing clinical assessment. How do we handle the unclear medication strip?',
        },
        choices: [
          {
            id: 'l3_c1_unclear',
            label: {
              ar: 'عدم تخمين الدواء من لون الكبسولة أبداً، ومراجعة السجل الرسمي أو العبوة الأصلية الموثقة واستشارة الطبيب/الصيدلي',
              en: 'Never guess a medicine by pill color; verify only from intact official packaging/records and escalate to a pharmacist/clinician',
            },
            nextNodeId: 'l3_doctor',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'أحسنت! تأكد من إتمام فحص مجسم «منصة طلبات الصيدلية 🧾» ثم توجه إلى د. طارق.',
              en: 'Correct! Ensure you have completed the 3D Pharmacy Slips 🧾 inspection, then talk to Dr. Tarek.',
            },
            rationale: {
              ar: 'تتشابه آلاف الأقراص والكبسولات في اللون والشكل؛ التخمين قد يسبب خطأً دوائياً جسيماً.',
              en: 'Many pills look identical; guessing from an unlabeled cut strip risks severe medication error.',
            },
          },
          {
            id: 'l3_c1_guess',
            label: {
              ar: 'التخمين السريع من شكل الكبسولة وإعطاؤه مضاداً مشابهاً في اللون',
              en: 'Guess quickly from the capsule color and hand over a similar-looking antibiotic',
            },
            nextNodeId: 'l3_doctor',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! لا يجوز أبداً صرف أو تحديد دواء بناءً على التخمين البصري.',
              en: 'Unsafe! Never identify or dispense medications by visual guessing.',
            },
            rationale: {
              ar: 'التحقق من الاسم العلمي والتركيز وتاريخ الصلاحية على العبوة الموثقة شرط أساسي للأمان.',
              en: 'Verifying generic name, strength, and expiry on intact labeling is mandatory.',
            },
          },
        ],
      },
      l3_doctor: {
        id: 'l3_doctor',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'تحدث مع د. طارق لاستقبال المراجع الذي يحتاج تقييماً طبياً.',
          en: 'Speak with Dr. Tarek to complete the clinical referral for the third pharmacy visitor.',
        },
        dialogue: {
          ar: 'شكراً لتوجيه المراجع الثالث للعيادة الفورية، ورفض صرف المضاد بدون وصفة بأسلوب محترم، ومنع استخدام الدواء المجهول البيانات! ما القاعدة الذهبية للتعامل في الصيدلية؟',
          en: 'Thank you for referring the symptomatic visitor for assessment, politely declining unprescribed dispensing, and halting the unlabeled medication! What is our golden rule?',
        },
        choices: [
          {
            id: 'l3_c2_finish',
            label: {
              ar: 'التثقيف المحترم، الالتزام بقواعد الوصفة الطبية، عدم تخمين الأدوية غير الواضحة، والإحالة للطبيب المختص عند الحاجة لتقييم',
              en: 'Provide respectful education, follow prescription rules, never guess unclear medicines, and refer patients needing clinical assessment',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'أحسنت! أتممت المستوى الثالث وفتحت المستوى الرابع (لغز الدواء المتبقي بالمنزل).',
              en: 'Well done! You completed Level 3 and unlocked Level 4 (The Leftover Medicine Mystery).',
            },
            rationale: {
              ar: 'التكامل بين الصيدلي والطبيب يحمي المجتمع من الاستخدام الخاطئ للمضادات الحيوية.',
              en: 'Pharmacist-physician collaboration protects the community from unsafe antibiotic use.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'فرز ٣ حالات صيدلانية: رفض الصرف بلا وصفة باحترام، الامتناع عن تخمين دواء غير واضح البيانات، وتوجيه المريض الذي يعاني من أعراض للفحص الطبي.',
      en: 'Handling 3 pharmacy interactions safely: respectful refusal of unprescribed antibiotics, refusing to guess unclear medicine strips, and referring symptomatic patients for assessment.',
    },
    educationalTakeaway: {
      ar: 'في الصيدلية: لا تُصرف المضادات الحيوية بدون وصفة طبية، ولا يُخمّن أي دواء مقصوص أو غير واضح البيانات، ويُحال المريض ذو الأعراض المقلقة إلى طبيب مؤهل.',
      en: 'At the pharmacy counter: never dispense antibiotics without an appropriate prescription, never guess unlabeled medications, and always refer patients needing clinical evaluation.',
    },
    escalationGuidance: {
      ar: 'لا تتناول أي شريط دواء مقصوص لا يظهر عليه الاسم العلمي والتركيز وتاريخ الصلاحية بوضوح؛ راجع الصيدلي أو الطبيب دائماً.',
      en: 'Never take pills from an unlabeled or cut blister strip missing the generic name, strength, and expiry date.',
    },
    badgeTitle: {
      ar: 'بطل تحدي الصيدلية',
      en: 'Pharmacy Challenge Champion',
    },
    badgeIcon: '🏪',
    sources: [
      {
        title: 'Egyptian Drug Authority (EDA) — Community Pharmacy Good Dispensing Practice',
        publisher: 'EDA Egypt',
        url: 'https://edaegypt.gov.eg',
      },
      {
        title: 'WHO AWaRe Antibiotic Stewardship Guidance',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/publications/i/item/9789240062382',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 4 — The Leftover Medicine Mystery
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-4-leftover-mystery',
    isCampaignLevel: true,
    campaignIndex: 4,
    number: 4,
    requiredLevelId: 'level-3-pharmacy-challenge',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ٣ (تحدي كاونتر الصيدلية)',
      en: 'Unlocks after completing Level 3 (Pharmacy Counter Challenge)',
    },
    environmentTheme: 'home_mystery',
    title: {
      ar: 'المستوى ٤ — لغز الدواء المتبقي في المنزل',
      en: 'Level 4 — The Leftover Medicine Mystery',
    },
    subtitle: {
      ar: 'استكشف خزانة الأدوية المنزلية ثلاثية الأبعاد، افحص أدلة التخزين والتغليف، وامنع مشاركة أو إعادة استخدام البقايا',
      en: 'Explore the 3D home medicine cabinet, inspect packaging and storage clues, and explain why leftover antibiotics must not be reused',
    },
    categoryBadge: {
      ar: 'تحقيق التغليف والتخزين',
      en: 'Home Storage & Packaging Clues',
    },
    primaryNpc: 'patient',
    involvedNpcs: ['patient', 'nurse', 'pharmacist'],
    briefing: {
      ar: 'أحضرك المريض لاستكشاف «خزانة الأدوية المنزلية 🏠» التي تحتوي على عبوات مضادات حيوية قديمة. افحص الخزانة ثلاثية الأبعاد لاكتشاف أخطاء التخزين والصلاحية، ثم ساعد الأسرة على فهم خطورة مشاركة أو إعادة استخدام البقايا.',
      en: 'Explore the 3D "Home Medicine Cabinet 🏠" containing leftover antibiotic packages. Inspect the packaging and storage clues, then help the family understand why leftover antibiotics must never be shared or reused.',
    },
    interactiveProps: [
      {
        id: 'prop-home-cabinet',
        name: {
          ar: 'خزانة الأدوية المنزلية وأدلة التخزين',
          en: 'Home Medicine Cabinet & Storage Clues',
        },
        stationLabel: {
          ar: 'خزانة الأدوية المنزلية للفحص',
          en: 'Home Medicine Cabinet Clue Station',
        },
        position: [0.0, 0, 3.0],
        color: 0x8b5cf6,
        accentColor: 0xddd6fe,
        iconEmoji: '🏠',
        shape: 'medicine_cabinet',
        puzzleSteps: [
          {
            id: 'hm_s1',
            prompt: {
              ar: 'وجدت في الخزانة الدليلين التاليين: (١) زجاجة شراب مضاد حيوي تم حلّها بالماء منذ ٣ أسابيع وموضوعة في مكان دافئ ورطب، (٢) ٣ كبسولات متبقية من كورس قديم لشخص آخر. ماذا تكشف هذه الأدلة؟',
              en: 'Inside the cabinet you find two clues: (1) A liquid antibiotic suspension reconstituted with water 3 weeks ago stored in a warm humid spot, and (2) 3 leftover capsules from another family member’s old course. What do these clues prove?',
            },
            options: [
              {
                id: 'hm_o1',
                label: {
                  ar: 'الشراب المحلول انتهت صلاحيته وتدهور بسبب سوء التخزين، والكبسولات المتبقية لا يجوز مشاركتها أو إعادة استخدامها أبداً',
                  en: 'The reconstituted suspension is expired/degraded from improper storage, and leftover capsules must never be shared or reused',
                },
                isCorrect: true,
                feedback: {
                  ar: 'كشف دقيق للأدلة! الشراب المعلق يفسد بعد ٧–١٤ يوماً من حله، ومشاركة الكبسولات المتبقية خطر كبير.',
                  en: 'Great detective work! Reconstituted suspensions expire within 7–14 days, and sharing leftover capsules is unsafe.',
                },
              },
              {
                id: 'hm_o2',
                label: {
                  ar: 'يمكن للأسرة شرب الزجاجة وتناول الكبسولات الثلاث بأمان دون استشارة طبيب',
                  en: 'The family can safely drink the old suspension and take the 3 capsules without asking a doctor',
                },
                isCorrect: false,
                feedback: {
                  ar: 'خطر! تناول شراب متحلل أو بقايا كورس ناقص يسبب فشلاً علاجياً وتسمماً ومقاومة بكتيرية.',
                  en: 'Unsafe! Taking degraded suspension or partial leftover capsules risks harm and resistance.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'تم فحص أدلة خزانة المنزل: شراب محلول منذ ٣ أسابيع (تالف) وكبسولات ناقصة لا تجوز مشاركتها.',
          en: 'Home cabinet clues inspected: 3-week-old reconstituted syrup (expired) and incomplete leftover capsules identified.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l4_pharmacist',
    initialNodeId: 'l4_start',
    nodes: {
      l4_start: {
        id: 'l4_start',
        speaker: 'patient',
        targetNpc: 'patient',
        objectiveHint: {
          ar: 'تحدث مع الأستاذ أحمد، ثم افحص «خزانة الأدوية المنزلية 🏠» في وسط الغرفة.',
          en: 'Talk to Mr. Ahmed, then inspect the 3D "Home Medicine Cabinet 🏠" in the center of the room.',
        },
        dialogue: {
          ar: 'لقد وضعنا محتويات خزانة الأدوية المنزلية أمامك لفحصها. لماذا لا نكتفي بإعطاء هذه البقايا لأي فرد من الأسرة يشعر بتعب مشابه، أو نخمّن له جرعة منها؟',
          en: 'We placed the contents of our home medicine cabinet right there for you to inspect. Why shouldn’t we share those leftovers with a family member who feels sick, or guess a dose?',
        },
        choices: [
          {
            id: 'l4_c1_clues',
            label: {
              ar: 'فحص أدلة العبوات والتخزين في الخزانة، وتوضيح أن مشاركة البقايا أو تخمين الدواء والجرعة يعرض المريض للخطر',
              en: 'Inspect the packaging/storage clues in the cabinet, and explain that sharing leftovers or guessing a drug/dose is unsafe',
            },
            nextNodeId: 'l4_pharmacist',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'أحسنت! افحص الآن مجسم «خزانة الأدوية المنزلية 🏠» ثم توجه إلى د. مريم في الصيدلية.',
              en: 'Great! Now inspect the 3D Home Medicine Cabinet 🏠 prop and speak with Pharmacist Dr. Mariam.',
            },
            rationale: {
              ar: 'البحث عن أدلة الصلاحية والتخزين يوضح للأسرة عملياً خطورة بقايا الأدوية.',
              en: 'Inspecting real storage and expiry clues helps families understand why leftovers are unsafe.',
            },
          },
          {
            id: 'l4_c1_guess_dose',
            label: {
              ar: 'تخمين جرعة تقريبية من الزجاجة القديمة دون فحص تاريخ حلّها بالماء',
              en: 'Guess a rough dose from the old bottle without checking when it was mixed with water',
            },
            nextNodeId: 'l4_pharmacist',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! لا يجوز تخمين جرعة أو استخدام شراب قديم محلول مسبقاً.',
              en: 'Unsafe! Never guess a dose or use an old reconstituted suspension.',
            },
            rationale: {
              ar: 'تحديد الدواء والجرعة مسؤولية الطبيب والصيدلي بعد فحص المريض.',
              en: 'Selecting a drug and dose requires professional clinical evaluation.',
            },
          },
        ],
      },
      l4_pharmacist: {
        id: 'l4_pharmacist',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'بعد فحص «خزانة الأدوية المنزلية 🏠»، تحدث مع الصيدلانية د. مريم.',
          en: 'After inspecting the 3D Home Medicine Cabinet 🏠, speak with Pharmacist Dr. Mariam.',
        },
        dialogue: {
          ar: 'عمل رائع في كشف أدلة التخزين الخاطئ وانتهاء صلاحية الشراب بعد الحل! ما التوجيه الختامي الذي نقدمه للأسرة؟',
          en: 'Excellent work uncovering the storage clues and expired reconstituted suspension! What final guidance do we give the family?',
        },
        choices: [
          {
            id: 'l4_c2_finish',
            label: {
              ar: 'عدم مشاركة أو إعادة استخدام بقايا المضادات الحيوية أبداً، التخلص الآمن من البقايا التالفة، واستشارة الطبيب المختص عند المرض',
              en: 'Never share or reuse leftover antibiotics, safely dispose of expired/leftover meds, and seek professional clinical advice when ill',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'ممتاز! أتممت المستوى الرابع وفتحت المستوى الخامس (قائمة فحص السلامة التمريضية).',
              en: 'Awesome! You completed Level 4 and unlocked Level 5 (Nursing Safety Checklist).',
            },
            rationale: {
              ar: 'حماية الأسرة تبدأ بعدم مشاركة الأدوية والتخلص الآمن من البقايا.',
              en: 'Family medication safety starts with never sharing prescription drugs and disposing of leftovers safely.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'فحص خزانة الأدوية المنزلية ثلاثية الأبعاد، كشف فساد الشراب المحلول قديماً، ومنع مشاركة البقايا أو تخمين الجرعات.',
      en: 'Inspecting the 3D home medicine cabinet, identifying degraded reconstituted suspension, and preventing leftover sharing or dose guessing.',
    },
    educationalTakeaway: {
      ar: 'مضادات الشراب المحلولة بالماء تنتهي صلاحيتها خلال ٧–١٤ يوماً، وبقايا الكبسولات لا تكفي لكورس علاجي ولا تجوز مشاركتها. استشر مختصاً دائماً ولا تخمّن دواءً أو جرعة.',
      en: 'Reconstituted liquid antibiotics expire within 7–14 days, and leftover capsules are incomplete courses that must never be shared. Always seek professional advice rather than guessing a drug or dose.',
    },
    escalationGuidance: {
      ar: 'في حال تناول دواء منتهي الصلاحية أو ظهور أعراض غير معتادة، تواصل مع الطبيب أو مركز السموم أو طوارئ 123.',
      en: 'If expired medication is ingested or adverse symptoms occur, contact a clinician, poison control, or emergency services (123).',
    },
    badgeTitle: {
      ar: 'محقق سلامة الأدوية المنزلية',
      en: 'Home Medicine Sleuth',
    },
    badgeIcon: '🔎',
    sources: [
      {
        title: 'FDA Safe Disposal of Unused Medicines',
        publisher: 'U.S. FDA',
        url: 'https://www.fda.gov/consumers/consumer-updates/where-and-how-dispose-unused-medicines',
      },
      {
        title: 'WHO — Never Share Leftover Antibiotics',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/campaigns/world-amr-awareness-week',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 5 — Nursing Safety Checklist
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-5-nursing-checklist-puzzle',
    isCampaignLevel: true,
    campaignIndex: 5,
    number: 5,
    requiredLevelId: 'level-4-leftover-mystery',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ٤ (لغز الدواء المتبقي في المنزل)',
      en: 'Unlocks after completing Level 4 (The Leftover Medicine Mystery)',
    },
    environmentTheme: 'nursing_station',
    title: {
      ar: 'المستوى ٥ — لغز قائمة فحص السلامة التمريضية',
      en: 'Level 5 — Nursing Safety Checklist Workflow Puzzle',
    },
    subtitle: {
      ar: 'أكمل لغز سير العمل التمريضي: طابق هوية المريض، افحص الأمر الموصوف، راجع الحساسية، وصعّد التعارض دون تغيير الوصفة فردياً',
      en: 'Complete the workflow puzzle: verify patient identity, check prescribed order, review allergies, and escalate inconsistency without altering orders',
    },
    categoryBadge: {
      ar: 'لغز سير العمل التمريضي',
      en: 'Nursing Workflow Puzzle',
    },
    primaryNpc: 'nurse',
    involvedNpcs: ['nurse', 'patient', 'doctor'],
    briefing: {
      ar: 'قبل إعطاء الجرعة في الجناح، توجه إلى «محطة مطابقة السوار والتذكرة العلاجية 📋» لإكمال لغز التحقق التمريضي خطوة بخطوة، ثم أوقف الإعطاء وصعّد التعارض المكتشف إلى د. طارق.',
      en: 'Before medication administration, walk to the 3D "Wristband & Chart Verification Terminal 📋" to solve the two-step nursing safety puzzle, then hold the dose and escalate the discrepancy to Dr. Tarek.',
    },
    interactiveProps: [
      {
        id: 'prop-wristband-scanner',
        name: {
          ar: 'محطة مطابقة سوار الهوية والتذكرة العلاجية',
          en: 'Wristband & Medication Order Verification Station',
        },
        stationLabel: {
          ar: 'جهاز التحقق التمريضي بجانب السرير',
          en: 'Bedside Nursing Verification Terminal',
        },
        position: [-3.8, 0, 0.8],
        color: 0x0e9aa7,
        accentColor: 0x99f6e4,
        iconEmoji: '📋',
        shape: 'wristband_scanner',
        puzzleSteps: [
          {
            id: 'ns_s1',
            prompt: {
              ar: 'الخطوة ١ في اللغز: السوار الطبي للمريض يحمل (أحمد محمود — الرقم الطبي #4082 — حساسية موثقة: بنسلين). بينما التذكرة التي سُلّمت لك مكتوب عليها (أموكسيسيلين — سرير ١). ما الخلل المكتشف؟',
              en: 'Puzzle Step 1: The patient wristband reads (Ahmed Mahmoud — MRN #4082 — Documented Allergy: Penicillin). The chart order lists (Amoxicillin — Bed 1). What inconsistency is present?',
            },
            options: [
              {
                id: 'ns_o1',
                label: {
                  ar: 'تعارض خطير: الدواء الموصوف (أموكسيسيلين) ينتمي لعائلة البنسلين المسجلة كحساسية موثقة لدى المريض',
                  en: 'Critical inconsistency: The ordered drug (Amoxicillin) belongs to the Penicillin class documented as the patient’s allergy',
                },
                isCorrect: true,
                feedback: {
                  ar: 'رصد دقيق! مطابقة الهوية والأمر الطبي مع سجل الحساسية كشفت التعارض قبل إعطاء الدواء.',
                  en: 'Sharp catch! Cross-checking identity, order, and documented allergies caught the discrepancy before administration.',
                },
              },
              {
                id: 'ns_o2',
                label: {
                  ar: 'لا يوجد أي تعارض طالما رقم السرير متطابق',
                  en: 'There is no inconsistency as long as the bed number matches',
                },
                isCorrect: false,
                feedback: {
                  ar: 'انتبه: رقم السرير لا يكفي، وهناك تعارض صريح مع سوار الحساسية الأحمر.',
                  en: 'Watch out: Bed number is not an identifier, and the order conflicts with his allergy band.',
                },
              },
            ],
          },
          {
            id: 'ns_s2',
            prompt: {
              ar: 'الخطوة ٢ في اللغز: بعد اكتشاف التعارض، ما هو الإجراء التمريضي القانوني والآمن؟',
              en: 'Puzzle Step 2: After discovering this allergy discrepancy, what is the safe nursing action?',
            },
            options: [
              {
                id: 'ns_s2_o1',
                label: {
                  ar: 'إيقاف إعطاء الجرعة فوراً (Hold) وتصعيد التعارض للطبيب الواصف والصيدلي دون تعديل الوصفة فردياً',
                  en: 'Hold the dose immediately and escalate the inconsistency to the prescribing clinician and pharmacist without altering the order yourself',
                },
                isCorrect: true,
                feedback: {
                  ar: 'ممتاز! أتممت لغز التحقق التمريضي بنجاح. توجه الآن لإبلاغ د. طارق.',
                  en: 'Perfect! You solved the nursing safety workflow puzzle. Now report to Dr. Tarek.',
                },
              },
              {
                id: 'ns_s2_o2',
                label: {
                  ar: 'شطب اسم الدواء باليد وكتابة مضاد حيوي آخر من اختيارك دون الرجوع للطبيب',
                  en: 'Cross out the drug name yourself and write a different antibiotic without consulting the physician',
                },
                isCorrect: false,
                feedback: {
                  ar: 'ممنوع تماماً! لا يجوز للممرض أو الطالب تغيير الوصفة الطبية بشكل مستقل.',
                  en: 'Never allowed! Nurses and students must never independently alter a prescription.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'اكتمل لغز الفحص التمريضي: تم التحقق من الهوية، اكتشاف تعارض الحساسية، وإيقاف الجرعة للتصعيد.',
          en: 'Nursing workflow puzzle solved: ID verified, allergy conflict caught, dose held for escalation.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l5_doctor',
    initialNodeId: 'l5_start',
    nodes: {
      l5_start: {
        id: 'l5_start',
        speaker: 'nurse',
        targetNpc: 'nurse',
        objectiveHint: {
          ar: 'تحدث مع الممرضة سارة، ثم حل لغز «محطة مطابقة السوار والتذكرة 📋».',
          en: 'Talk to Nurse Sara, then solve the 3D "Wristband & Order Verification Terminal 📋" puzzle.',
        },
        dialogue: {
          ar: 'في هذا المستوى التدريبي ستطبق قائمة فحص سلامة الدواء التمريضية عملياً. توجه أولاً إلى محطة التحقق (📋) لمطابقة هوية المريض والأمر الموصوف وسجل الحساسية، ثم أخبرني: هل يحق لنا تعديل الوصفة بأنفسنا إذا وجدنا خطأ؟',
          en: 'In this level you will practice the nursing safety checklist workflow. Inspect the Verification Terminal (📋) to verify patient identity, prescribed order, and allergies. First tell me: may we independently alter a prescription if we spot an error?',
        },
        choices: [
          {
            id: 'l5_c1_never_alter',
            label: {
              ar: 'لا أبداً؛ واجبنا إيقاف الإعطاء المؤقت وتصعيد التعارض للطبيب الواصف والصيدلي الإكلينيكي',
              en: 'Never; our responsibility is to hold administration and escalate the inconsistency to the prescriber and pharmacist',
            },
            nextNodeId: 'l5_doctor',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'قاعدة ذهبية! حل الآن لغز «محطة مطابقة السوار والتذكرة 📋» في الجناح ثم توجه إلى د. طارق.',
              en: 'Golden rule! Now solve the 3D Verification Terminal 📋 puzzle in the ward, then report to Dr. Tarek.',
            },
            rationale: {
              ar: 'الالتزام بنطاق الممارسة المهنية يمنع الأخطاء الدوائية المركبة.',
              en: 'Respecting professional scope of practice prevents compounding medication errors.',
            },
          },
          {
            id: 'l5_c1_alter',
            label: {
              ar: 'نعم، نغيّر الدواء والجرعة بأنفسنا لتوفير وقت الطبيب',
              en: 'Yes, we can rewrite the drug and dose ourselves to save the doctor time',
            },
            nextNodeId: 'l5_doctor',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! لا يجوز تعديل الوصفات الطبية بشكل مستقل تحت أي ظرف.',
              en: 'Unsafe! Never independently alter a prescription order.',
            },
            rationale: {
              ar: 'أي تعديل علاجي يجب أن يصدر من الطبيب المختص بعد مراجعة الصيدلي.',
              en: 'Any prescription modification must be authorized by a qualified prescriber.',
            },
          },
        ],
      },
      l5_doctor: {
        id: 'l5_doctor',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'بعد حل لغز «محطة مطابقة السوار 📋»، تحدث مع د. طارق لاعتماد التصعيد.',
          en: 'After solving the Verification Terminal 📋 puzzle, report the inconsistency to Dr. Tarek.',
        },
        dialogue: {
          ar: 'أحسنت في إتمام لغز التحقق التمريضي خطوة بخطوة وإيقاف الدواء المتعارض! لقد ألغينا الأمر السابق ووثّقنا التنبيه. ماذا تعلمنا من هذا سير العمل؟',
          en: 'Excellent job completing the two-step nursing verification puzzle and holding the conflicting order! What is our core lesson?',
        },
        choices: [
          {
            id: 'l5_c2_finish',
            label: {
              ar: 'التحقق من هوية المريض والأمر الطبي والحساسية المسجلة قبل كل جرعة، وتصعيد أي تعارض دون تعديل الوصفة فردياً',
              en: 'Verify patient identity, prescribed order, and documented allergies before every dose, and escalate inconsistencies rather than altering orders',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'رائع! أتممت المستوى الخامس وفتحت المستوى السادس (المختبر الطبي: تتبع الدليل).',
              en: 'Fantastic! You completed Level 5 and unlocked Level 6 (Medical Laboratory: Follow the Evidence).',
            },
            rationale: {
              ar: 'قائمة فحص السلامة التمريضية هي خط الدفاع الأخير والأهم لحماية المريض.',
              en: 'The nursing safety checklist is the critical final barrier protecting patients from medication harm.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'إتمام لغز سير العمل التمريضي: مطابقة هوية المريض، فحص الأمر الموصوف، مراجعة الحساسية، وتصعيد التعارض للطبيب دون تغيير الوصفة فردياً.',
      en: 'Completing the nursing workflow puzzle: verifying patient identity, checking the prescribed order, reviewing allergies, and escalating the inconsistency without altering the prescription.',
    },
    educationalTakeaway: {
      ar: 'قائمة فحص السلامة التمريضية تتطلب التحقق من الهوية والأمر والحساسية في كل مرة، مع تصعيد أي تعارض للطبيب والصيدلي وعدم تعديل الوصفة بشكل مستقل أبداً.',
      en: 'The nursing medication safety checklist requires verifying patient identity, prescribed order, and documented allergies every time, escalating any inconsistency rather than independently modifying orders.',
    },
    escalationGuidance: {
      ar: 'أوقف إعطاء الدواء فوراً عند وجود أي شك أو تعارض في التذكرة العلاجية واستشر الطبيب الواصف والصيدلي.',
      en: 'Hold medication administration immediately whenever an order conflicts with allergy records and contact the prescribing clinician.',
    },
    badgeTitle: {
      ar: 'خبير قائمة الفحص التمريضية',
      en: 'Nursing Checklist Master',
    },
    badgeIcon: '📋',
    sources: [
      {
        title: 'WHO Medication Without Harm — 5 Moments for Medication Safety',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/initiatives/medication-without-harm',
      },
      {
        title: 'CDC Core Elements of Hospital Antibiotic Stewardship — Nursing Checklist',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/core-elements/hospital.html',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 6 — Medical Laboratory: Follow the Evidence
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-6-medical-laboratory',
    isCampaignLevel: true,
    campaignIndex: 6,
    number: 6,
    requiredLevelId: 'level-5-nursing-checklist-puzzle',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ٥ (لغز قائمة فحص السلامة التمريضية)',
      en: 'Unlocks after completing Level 5 (Nursing Safety Checklist)',
    },
    environmentTheme: 'med_lab',
    title: {
      ar: 'المستوى ٦ — المختبر الطبي: تتبّع الدليل المعملي',
      en: 'Level 6 — Medical Laboratory: Follow the Evidence',
    },
    subtitle: {
      ar: 'تجول في المختبر ثلاثي الأبعاد، طابق العينة الخيالية بملصق المريض الصحيح، واقرأ تقرير المزرعة والحساسية المبسط مع المختص',
      en: 'Navigate the 3D lab, match the fictional specimen to the correct patient label, and review a simplified culture/susceptibility report',
    },
    categoryBadge: {
      ar: 'المزرعة والحساسية المعملية',
      en: 'Lab Specimen & Culture Matching',
    },
    primaryNpc: 'pharmacist',
    involvedNpcs: ['pharmacist', 'doctor'],
    briefing: {
      ar: 'انتقلت الآن إلى بيئة المختبر الطبي ثلاثي الأبعاد! توجه إلى «طاولة العينات وتقرير المزرعة 🔬» لمطابقة العينة الخيالية بملصق المريض الصحيح وفهم الفرق بين (حساس S) و(مقاوم R) كمفهوم تعليمي مبسط، ثم ناقش النتيجة مع د. مريم ود. طارق.',
      en: 'Welcome to the 3D Medical Laboratory! Walk to the "Lab Specimen & Culture Bench 🔬" to match the fictional specimen to the correct patient label and interpret a simplified educational culture/susceptibility table with Dr. Mariam and Dr. Tarek.',
    },
    interactiveProps: [
      {
        id: 'prop-lab-specimen',
        name: {
          ar: 'طاولة مطابقة العينات وتقرير المزرعة المبسط (C&S)',
          en: 'Lab Specimen Matching & Culture/Susceptibility Bench',
        },
        stationLabel: {
          ar: 'طاولة المختبر الميكروبيولوجي',
          en: 'Microbiology Lab Bench',
        },
        position: [1.5, 0, 0.5],
        color: 0x06b6d4,
        accentColor: 0xcffafe,
        iconEmoji: '🔬',
        shape: 'lab_specimen',
        puzzleSteps: [
          {
            id: 'lab_s1',
            prompt: {
              ar: 'لغز المطابقة ١: أمامك عينة مزرعة تحمل طلب الفحص للمريض الخيالي (أحمد محمود — الرقم الطبي #4082). أي ملصق عينة يجب مطابقته واعتماده؟',
              en: 'Matching Puzzle 1: You have a lab requisition for fictional patient (Ahmed Mahmoud — MRN #4082). Which specimen label matches correctly?',
            },
            options: [
              {
                id: 'lab_o1',
                label: {
                  ar: 'الملصق المطابق بالاسم الكامل والرقم الطبي معاً: (أحمد محمود — #4082 — تاريخ وساعة السحب موثقة)',
                  en: 'The label matching both full name and medical ID: (Ahmed Mahmoud — MRN #4082 — collection time documented)',
                },
                isCorrect: true,
                feedback: {
                  ar: 'مطابقة صحيحة! دقة ملصق العينة تمنع تبديل نتائج المرضى في المختبر.',
                  en: 'Correct match! Verifying specimen labels with two identifiers prevents lab mix-ups.',
                },
              },
              {
                id: 'lab_o2',
                label: {
                  ar: 'أنبوب غير ملصق عليه اسم ومكتوب عليه بالقلم «سرير ١ فقط»',
                  en: 'An unlabeled tube with only "Bed 1" scribbled on the cap',
                },
                isCorrect: false,
                feedback: {
                  ar: 'خطأ معملي! لا تُقبل أي عينة غير معرفة بالاسم الكامل والرقم الطبي.',
                  en: 'Lab error! Unlabeled specimens without two patient identifiers must never be used.',
                },
              },
            ],
          },
          {
            id: 'lab_s2',
            prompt: {
              ar: 'لغز التفسير التعليمي ٢: يظهر تقرير المزرعة التثقيفي المبسط أن البكتيريا المعزولة (مقاومة R للمضاد أ) و(حساسة S للمضاد ب). كيف يُستخدم هذا التقرير؟',
              en: 'Educational Puzzle 2: The simplified culture report shows the isolated bacteria are Resistant (R) to Drug A and Susceptible (S) to Drug B. How is this report used?',
            },
            options: [
              {
                id: 'lab_s2_o1',
                label: {
                  ar: 'توضيح أن (R) تعني عدم فعالية المضاد (أ)، ويُرفع التقرير للطبيب المختص لدمجه مع حالة المريض وحساسيته (وهذا تبسيط تعليمي لا يغني عن التفسير الإكلينيكي الحقيقي)',
                  en: 'Explain that (R) means Drug A is ineffective, and escalate the report to the clinician to integrate with patient factors (noting this game view is an educational simplification)',
                },
                isCorrect: true,
                feedback: {
                  ar: 'تفسير تعليمي ممتاز! تقارير المزارع توجه العلاج الموجه (Targeted Therapy) تحت إشراف الطبيب.',
                  en: 'Spot on! Culture reports guide targeted stewardship under qualified clinical interpretation.',
                },
              },
              {
                id: 'lab_s2_o2',
                label: {
                  ar: 'قيام المريض باختيار وشراء المضاد من تلقاء نفسه من ورقة التحليل دون مراجعة الطبيب',
                  en: 'Have the patient self-prescribe a drug directly from the lab sheet without seeing a doctor',
                },
                isCorrect: false,
                feedback: {
                  ar: 'غير آمن! تفسير المزرعة يتطلب طبيباً مختصاً يراعي موضع العدوى والحساسية ووظائف الأعضاء.',
                  en: 'Unsafe! Real clinical interpretation requires a physician considering infection site, allergies, and organ function.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'تمت مطابقة العينة (#4082) وقراءة التقرير التعليمي المبسط للمزرعة والحساسية (S مقابل R).',
          en: 'Specimen #4082 matched and simplified educational culture/susceptibility report reviewed.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l6_doctor',
    initialNodeId: 'l6_start',
    nodes: {
      l6_start: {
        id: 'l6_start',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'توجه إلى «طاولة العينات وتقرير المزرعة 🔬» لحل لغز المطابقة، وتحدث مع د. مريم.',
          en: 'Walk to the 3D "Lab Specimen & Culture Bench 🔬" to solve the matching puzzle, and speak with Dr. Mariam.',
        },
        dialogue: {
          ar: 'أهلاً بك في وحدة المختبر الإكلينيكي! قبل إصدار أي نتيجة مزرعة بكتيرية، يجب أولاً مطابقة ملصق العينة بدقة، ثم فهم رموز الحساسية (S) والمقاومة (R). هل يغني هذا النموذج التعليمي المبسط عن تفسير الطبيب المختص في الواقع؟',
          en: 'Welcome to the Clinical Lab module! Before reviewing a culture report, we match the specimen label and review Susceptible (S) vs Resistant (R) markers. Does a simplified educational table replace real-world clinical interpretation by a physician?',
        },
        choices: [
          {
            id: 'l6_c1_edu_note',
            label: {
              ar: 'لا؛ هذا نموذج تعليمي مبسط لفهم فكرة المزرعة، بينما في الواقع يفسر الطبيب المختص والمختبر التقرير مع الفحص السريري الشامل',
              en: 'No; this is an educational simplification, whereas real clinical interpretation requires a licensed physician and laboratory specialist',
            },
            nextNodeId: 'l6_doctor',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'إجابة دقيقة! تأكد من حل لغز «طاولة العينات 🔬» في وسط المختبر ثم توجه إلى د. طارق.',
              en: 'Accurate! Make sure you solve the 3D Lab Specimen Bench 🔬 puzzle, then report to Dr. Tarek.',
            },
            rationale: {
              ar: 'التفريق بين التبسيط التعليمي والممارسة الإكلينيكية الفعلية يحمي المتعلمين والمرضى من التفسير الذاتي للتحاليل.',
              en: 'Distinguishing educational simplification from clinical practice prevents unsafe self-interpretation of lab results.',
            },
          },
          {
            id: 'l6_c1_self_lab',
            label: {
              ar: 'نعم، يمكن لأي شخص وصف العلاج لنفسه بمجرد النظر لورقة المزرعة',
              en: 'Yes, anyone can prescribe their own treatment just by glancing at a lab printout',
            },
            nextNodeId: 'l6_doctor',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'خطأ خطر! قراءة المزارع تتطلب خبرة طبية ومراعاة لحساسية المريض وتداخلات الأدوية.',
              en: 'Unsafe! Interpreting cultures requires clinical expertise, allergy checks, and pharmacokinetic evaluation.',
            },
            rationale: {
              ar: 'الطبيب المختص وحده هو من يترجم نتيجة المزرعة إلى خطة علاجية آمنة.',
              en: 'Only a qualified clinician can translate lab susceptibility data into a safe treatment plan.',
            },
          },
        ],
      },
      l6_doctor: {
        id: 'l6_doctor',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'بعد إتمام لغز «طاولة العينات 🔬»، سلّم النتيجة إلى د. طارق.',
          en: 'After completing the Lab Specimen Bench 🔬 puzzle, discuss the findings with Dr. Tarek.',
        },
        dialogue: {
          ar: 'عمل متقن في مطابقة العينة وقراءة التقرير المبسط! كيف تسهم المزرعة البكتيرية في حماية المجتمع من مقاومة المضادات الحيوية (AMR)؟',
          en: 'Great work matching the specimen label and reviewing the report! How does culture-guided care support antibiotic stewardship?',
        },
        choices: [
          {
            id: 'l6_c2_finish',
            label: {
              ar: 'تساعد الفريق الطبي على تجنب المضادات غير الفعالة واختيار العلاج الموجه بدقة تحت إشراف الطبيب المختص',
              en: 'It helps the care team avoid ineffective antibiotics and select targeted therapy under qualified clinician guidance',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'ممتاز! أتممت المستوى السادس وفتحت المستوى السابع (جولة الجناح: ربط الأدلة).',
              en: 'Excellent! You completed Level 6 and unlocked Level 7 (Ward Round: Connect the Clues).',
            },
            rationale: {
              ar: 'التشخيص المعملي الدقيق يقلل الاستخدام العشوائي للمضادات واسعة المجال.',
              en: 'Diagnostic stewardship reduces unnecessary broad-spectrum antibiotic exposure.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'مطابقة العينة الخيالية بملصق المريض الصحيح، فهم الفرق التعليمي بين الحساسية (S) والمقاومة (R)، والتمييز بين التبسيط التعليمي والتفسير الطبي الحقيقي.',
      en: 'Matching the fictional specimen to the correct patient label, understanding Susceptible (S) vs Resistant (R) concepts, and distinguishing educational simplification from clinical interpretation.',
    },
    educationalTakeaway: {
      ar: 'مطابقة هوية العينة خطوة حاسمة في المختبر، وتقارير المزرعة والحساسية تساعد الأطباء على اختيار المضاد المناسب، لكن لا يجوز للمريض تفسير التحاليل أو أخذ دواء من تلقاء نفسه.',
      en: 'Specimen identity matching is vital in the lab, and culture/susceptibility reports help clinicians choose targeted therapy—but patients must never self-prescribe from lab reports.',
    },
    escalationGuidance: {
      ar: 'اعرض نتائج التحاليل والمزارع دائماً على الطبيب المعالج ولا تبدأ أو تغيّر أي مضاد حيوي بنفسك.',
      en: 'Always review laboratory and culture results with your prescribing physician before starting or changing any medication.',
    },
    badgeTitle: {
      ar: 'محقق الدليل المعملي',
      en: 'Lab Evidence Investigator',
    },
    badgeIcon: '🔬',
    sources: [
      {
        title: 'Diagnostic Stewardship & Microbiological Cultures',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/publications/i/item/9789241511414',
      },
      {
        title: 'Susceptibility Testing Educational Overview',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/lab-tests/antibiotic-sensitivity-test/',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 7 — Ward Round: Connect the Clues
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-7-ward-round-clues',
    isCampaignLevel: true,
    campaignIndex: 7,
    number: 7,
    requiredLevelId: 'level-6-medical-laboratory',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ٦ (المختبر الطبي: تتبع الدليل)',
      en: 'Unlocks after completing Level 6 (Medical Laboratory: Follow the Evidence)',
    },
    environmentTheme: 'ward_round',
    title: {
      ar: 'المستوى ٧ — جولة الجناح: ربط الأدلة السريرية',
      en: 'Level 7 — Ward Round: Connect the Clues',
    },
    subtitle: {
      ar: 'اجمع الأدلة غير التعريفية من لوحة متابعة الجناح والفريق، لاحظ التغير المقلق في حالة مريض، وبلّغ الطبيب فوراً',
      en: 'Collect non-identifying ward clues, notice a concerning change in a fictional patient, and communicate clearly to the clinician',
    },
    categoryBadge: {
      ar: 'ملاحظة التغيرات والتواصل الجماعي',
      en: 'Ward Round & Escalation',
    },
    primaryNpc: 'nurse',
    involvedNpcs: ['nurse', 'patient', 'doctor'],
    briefing: {
      ar: 'أثناء المرور الصباحي في الجناح، افحص «لوحة مؤشرات جولة الجناح 📊» لجمع الملاحظات غير التعريفية وملاحظة التغير المقلق في حالة أحد المرضى، ثم تواصل مع الممرضة سارة والمريض وبلّغ د. طارق بشكل منظم بدلاً من محاولة التشخيص الفردي.',
      en: 'During morning ward rounds, inspect the 3D "Ward Round Observation Board 📊" to connect non-identifying clinical clues and spot a concerning change, then coordinate with Nurse Sara and escalate clearly to Dr. Tarek.',
    },
    interactiveProps: [
      {
        id: 'prop-ward-board',
        name: {
          ar: 'لوحة ملاحظات جولة الجناح (تغيرات الحالة)',
          en: 'Ward Round Observation & Trend Board',
        },
        stationLabel: {
          ar: 'لوحة متابعة الحالات في الجناح',
          en: 'Central Ward Round Board',
        },
        position: [0.0, 0, -1.5],
        color: 0x0284c7,
        accentColor: 0xbae6fd,
        iconEmoji: '📊',
        shape: 'vitals_board',
        puzzleSteps: [
          {
            id: 'wr_s1',
            prompt: {
              ar: 'تظهر لوحة المتابعة الصباحية (دون بيانات شخصية تعريفية): «حالة الجناح أ: مستقرة بدون حمى | حالة الجناح ب: ظهور إسهال مائي متكرر وحمى جديدة بعد ٤ أيام من العلاج». ما الدليل الأهم الذي يجب تصعيده؟',
              en: 'The non-identifying ward board shows: "Case A: Afebrile & stable | Case B: New onset watery diarrhea and rising fever after 4 days of therapy." Which clue requires immediate escalation to the clinician?',
            },
            options: [
              {
                id: 'wr_o1',
                label: {
                  ar: 'التغير المقلق في (حالة الجناح ب) — ظهور إسهال مائي متكرر وحمى جديدة يستوجب إبلاغ الطبيب فوراً للتقييم دون تشخيص ذاتي',
                  en: 'The concerning change in Case B (new watery diarrhea and fever) must be communicated promptly to the clinician rather than self-diagnosing',
                },
                isCorrect: true,
                feedback: {
                  ar: 'ملاحظة سريرية ممتازة! رصد التغيرات الحادة أثناء العلاج وإبلاغ الطبيب هو جوهر العمل الجماعي.',
                  en: 'Great clinical observation! Spotting new concerning symptoms and escalating to the clinician is key teamwork.',
                },
              },
              {
                id: 'wr_o2',
                label: {
                  ar: 'تجاهل التغير الجديد وعدم إبلاغ الطبيب أثناء الجولة',
                  en: 'Ignore the new symptoms and skip reporting them during rounds',
                },
                isCorrect: false,
                feedback: {
                  ar: 'خطأ! الإسهال المائي الشديد أو الحمى الجديدة أثناء تناول المضادات علامة تستلزم تقييم الطبيب فوراً.',
                  en: 'Unsafe! Severe watery diarrhea or new fever during therapy requires prompt clinician evaluation.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'تم ربط أدلة الجولة: رصد تغير مقلق (إسهال مائي وحمى جديدة) جاهز للتصعيد المنظم للطبيب.',
          en: 'Ward round clues connected: new concerning symptom trend identified for structured clinician handoff.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l7_doctor',
    initialNodeId: 'l7_start',
    nodes: {
      l7_start: {
        id: 'l7_start',
        speaker: 'nurse',
        targetNpc: 'nurse',
        objectiveHint: {
          ar: 'تحدث مع الممرضة سارة، وافحص «لوحة ملاحظات جولة الجناح 📊».',
          en: 'Speak with Nurse Sara and inspect the 3D "Ward Round Observation Board 📊".',
        },
        dialogue: {
          ar: 'صباح الخير في جولة الجناح! مهمتنا اليوم هي جمع الملاحظات غير التعريفية وملاحظة أي تغير مقلق في حالة المرضى. هل نحاول إصدار تشخيص طبي نهائي بأنفسنا أم نصعّد الملاحظات المنظمة للطبيب؟',
          en: 'Good morning on ward rounds! Our goal is to gather non-identifying clues and notice concerning changes. Should we attempt to make a definitive medical diagnosis ourselves, or prioritize structured escalation and teamwork?',
        },
        choices: [
          {
            id: 'l7_c1_teamwork',
            label: {
              ar: 'نعطي الأولوية للعمل الجماعي والتصعيد المنظم للطبيب المختص فور ملاحظة أي تغير مقلق، دون ادعاء التشخيص',
              en: 'Prioritize teamwork and structured escalation to a qualified clinician upon noticing concerning changes, rather than diagnosing',
            },
            nextNodeId: 'l7_patient',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'أحسنت! افحص «لوحة ملاحظات جولة الجناح 📊» وتحدث مع المريض ثم أبلغ د. طارق.',
              en: 'Spot on! Inspect the 3D Ward Round Board 📊, check on the patient, and report to Dr. Tarek.',
            },
            rationale: {
              ar: 'الملاحظة المبكرة والتواصل الفعال بين الفريق الطبي يحميان المريض من المضاعفات.',
              en: 'Early observation and clear interprofessional communication prevent complications.',
            },
          },
          {
            id: 'l7_c1_solo_diag',
            label: {
              ar: 'تشخيص الحالة فردياً وتغيير خطة العلاج دون إبلاغ الطبيب',
              en: 'Diagnose the condition solo and alter the care plan without telling the physician',
            },
            nextNodeId: 'l7_patient',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! التشخيص وتعديل العلاج مسؤولية الطبيب المختص ضمن الفريق.',
              en: 'Unsafe! Diagnosis and treatment changes require a qualified clinician.',
            },
            rationale: {
              ar: 'العمل الجماعي يعتمد على دقة الرصد وسرعة الإبلاغ.',
              en: 'Safe ward care relies on accurate observation and timely escalation.',
            },
          },
        ],
      },
      l7_patient: {
        id: 'l7_patient',
        speaker: 'patient',
        targetNpc: 'patient',
        objectiveHint: {
          ar: 'اطمئن على المريض في سرير ١، وتأكد من فحص «لوحة ملاحظات الجولة 📊».',
          en: 'Check on the patient at Bed 1 and make sure you inspected the Ward Round Board 📊.',
        },
        dialogue: {
          ar: 'شكراً لمروركم الصباحي.. لقد لاحظت تغيراً في الأعراض اليوم وأشعر بإجهاد وإسهال مائي جديد. هل ستبلغ الطبيب المعالج بذلك؟',
          en: 'Thank you for checking on me during rounds... I noticed new watery diarrhea and fatigue today. Will you communicate this change to the doctor?',
        },
        choices: [
          {
            id: 'l7_c2_report',
            label: {
              ar: 'طمأنته وتوثيق التغير الجديد فوراً وإبلاغ د. طارق لتقييم الحالة',
              en: 'Reassure him, log the new symptom change, and immediately communicate it to Dr. Tarek',
            },
            nextNodeId: 'l7_doctor',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'تواصل ممتاز! توجه الآن إلى مكتب د. طارق لإتمام تسليم الجولة.',
              en: 'Excellent communication! Now walk to Dr. Tarek’s desk to complete the handoff.',
            },
            rationale: {
              ar: 'الاستماع لملاحظات المريض وربطها بمؤشرات الجولة يكشف الآثار الجانبية الخطيرة مبكراً.',
              en: 'Connecting patient-reported changes with ward observations detects adverse events early.',
            },
          },
        ],
      },
      l7_doctor: {
        id: 'l7_doctor',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'تحدث مع د. طارق لتسليم ملخص الأدلة التي جمعتها في الجولة.',
          en: 'Speak with Dr. Tarek to communicate the connected clues from the ward round.',
        },
        dialogue: {
          ar: 'شكراً لتسليمك المنظم والواضح! بفضل ملاحظتك للتغير الحاد في الأعراض وإبلاغي فوراً، سأقوم الآن بفحص المريض وإجراء التقييم اللازم. ما الدرس الأساسي من جولة الجناح؟',
          en: 'Thank you for that clear, structured handoff! Because you connected the clues and escalated promptly, I will evaluate the patient immediately. What is our key lesson from ward rounds?',
        },
        choices: [
          {
            id: 'l7_c3_finish',
            label: {
              ar: 'ربط الأدلة السريرية وملاحظة أي تدهور أو عرض جديد وإبلاغ الطبيب فوراً بروح الفريق بدلاً من التشخيص الفردي',
              en: 'Connect clinical clues, spot concerning changes early, and communicate promptly with the care team rather than diagnosing solo',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'أحسنت! أتممت المستوى السابع وفتحت المستوى الثامن (لغز الوقاية من العدوى).',
              en: 'Great job! You completed Level 7 and unlocked Level 8 (Infection Prevention Escape Puzzle).',
            },
            rationale: {
              ar: 'التواصل المنظم (مثل SBAR) يعزز سلامة المرضى في جميع الأقسام.',
              en: 'Structured team communication enhances patient safety across hospital wards.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'جمع الأدلة غير التعريفية من لوحة الجناح والمريض، ملاحظة ظهور عرض مقلق جديد، وإبلاغ الطبيب المختص بوضوح.',
      en: 'Gathering non-identifying ward clues, noticing a concerning symptom change, and escalating clearly to the physician.',
    },
    educationalTakeaway: {
      ar: 'المتابعة الدقيقة أثناء جولات الجناح وملاحظة التغيرات الجديدة (مثل الإسهال المائي الشديد أو الحمى) والتصعيد الفوري للطبيب تحمي المريض من المضاعفات.',
      en: 'Vigilant observation during ward rounds—spotting new symptoms like severe watery diarrhea or fever and escalating promptly to a clinician—protects patients.',
    },
    escalationGuidance: {
      ar: 'عند ظهور إسهال شديد أو مدمم أو حمى مستمرة أثناء أو بعد تناول المضاد الحيوي، راجع الطبيب فوراً.',
      en: 'If severe or bloody diarrhea or persistent fever develops during or after antibiotic therapy, seek medical evaluation immediately.',
    },
    badgeTitle: {
      ar: 'منسق جولة الجناح',
      en: 'Ward Round Communicator',
    },
    badgeIcon: '🩺',
    sources: [
      {
        title: 'CDC Antibiotic Side Effects & C. difficile Awareness',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/index.html',
      },
      {
        title: 'WHO Patient Safety — Clinical Handover & Communication',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/teams/integrated-health-services/patient-safety',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 8 — Infection Prevention Escape Puzzle
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-8-infection-prevention-puzzle',
    isCampaignLevel: true,
    campaignIndex: 8,
    number: 8,
    requiredLevelId: 'level-7-ward-round-clues',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ٧ (جولة الجناح: ربط الأدلة السريرية)',
      en: 'Unlocks after completing Level 7 (Ward Round: Connect the Clues)',
    },
    environmentTheme: 'infection_puzzle',
    title: {
      ar: 'المستوى ٨ — لغز الوقاية من العدوى ومكافحتها (IPC)',
      en: 'Level 8 — Infection Prevention Escape Puzzle',
    },
    subtitle: {
      ar: 'حل الألغاز البيئية في الجناح: نظافة اليدين، مهمات الوقاية الشخصية (PPE)، تطهير الأسطح كثيرة اللمس، والحركة الآمنة بين مناطق الرعاية',
      en: 'Solve environmental puzzles on hand hygiene, appropriate PPE, cleaning high-touch surfaces, and safe movement between care zones',
    },
    categoryBadge: {
      ar: 'لغز مكافحة العدوى البيئي',
      en: 'IPC Environmental Puzzle',
    },
    primaryNpc: 'nurse',
    involvedNpcs: ['nurse', 'doctor'],
    briefing: {
      ar: 'لمنع انتقال الميكروبات داخل الجناح وتقليل الحاجة للمضادات الحيوية أصلاً، توجه إلى «محطة تعقيم اليدين ومهمات الوقاية 🧼» لحل لغز خطوات مكافحة العدوى (نظافة اليدين، PPE، وتطهير الأسطح كثيرة اللمس)، ثم راجع الإجراءات مع الممرضة سارة ود. طارق.',
      en: 'Preventing infection transmission reduces the need for antibiotics in the first place! Walk to the 3D "Hand Hygiene & PPE Puzzle Station 🧼" to solve the environmental infection-control puzzle, then review with Nurse Sara and Dr. Tarek.',
    },
    interactiveProps: [
      {
        id: 'prop-ipc-station',
        name: {
          ar: 'محطة لغز نظافة اليدين ومهمات الوقاية وتطهير الأسطح',
          en: 'Hand Hygiene, PPE & High-Touch Surface Puzzle Station',
        },
        stationLabel: {
          ar: 'ركن مكافحة العدوى (IPC)',
          en: 'Infection Prevention & Control Station',
        },
        position: [-1.5, 0, 2.5],
        color: 0x14b8a6,
        accentColor: 0xccfbf1,
        iconEmoji: '🧼',
        shape: 'sanitizer_ppe',
        puzzleSteps: [
          {
            id: 'ipc_s1',
            prompt: {
              ar: 'اللغز البيئي ١ (الانتقال بين منطقتي رعاية): انتهيت من رعاية مريض وتستعد للانتقال لمنطقة مريض آخر. ما التسلسل البيئي السليم؟',
              en: 'Environmental Puzzle 1 (Moving between care areas): You finished assisting one patient and are moving to another care zone. What is the safe sequence?',
            },
            options: [
              {
                id: 'ipc_o1',
                label: {
                  ar: 'خلع القفازات/مهمات الوقاية المستعملة بأمان، تطهير اليدين جيداً (وفق اللحظات الخمس لنظافة اليدين)، وتطهير الأسطح والأدوات كثيرة اللمس',
                  en: 'Safely remove used PPE, perform thorough hand hygiene (WHO 5 Moments), and disinfect shared high-touch surfaces/equipment',
                },
                isCorrect: true,
                feedback: {
                  ar: 'حل ممتاز! نظافة اليدين وعدم التجول بنفس القفازات بين المرضى يمنعان انتقال العدوى.',
                  en: 'Great solution! Hand hygiene and changing PPE between care zones stop cross-transmission.',
                },
              },
              {
                id: 'ipc_o2',
                label: {
                  ar: 'الاحتفاظ بنفس القفاز للتعامل مع جميع المرضى ولمس مقابض الأبواب والأسطح دون غسل اليدين',
                  en: 'Keep wearing the same pair of gloves across all patients and touch door handles without hand hygiene',
                },
                isCorrect: false,
                feedback: {
                  ar: 'تذكير تعليمي لطيف: القفازات لا تغني عن غسل اليدين، والتجول بنفس القفاز ينقل الميكروبات عبر الأسطح.',
                  en: 'Supportive tip: Gloves never replace hand hygiene, and wearing the same gloves across zones spreads microbes.',
                },
              },
            ],
          },
          {
            id: 'ipc_s2',
            prompt: {
              ar: 'اللغز البيئي ٢ (الأسطح كثيرة اللمس): أي مجموعة تمثل «الأسطح كثيرة اللمس» التي تتطلب تطهيراً دورياً في الجناح؟',
              en: 'Environmental Puzzle 2 (High-touch surfaces): Which items represent high-touch surfaces requiring regular disinfection in the ward?',
            },
            options: [
              {
                id: 'ipc_s2_o1',
                label: {
                  ar: 'حواجز السرير، أزرار الاستدعاء، مقابض الأبواب، طاولات المريض، وأجهزة قياس العلامات الحيوية المشتركة',
                  en: 'Bed rails, call buttons, door handles, overbed tables, and shared vital-sign equipment',
                },
                isCorrect: true,
                feedback: {
                  ar: 'إجابة صحيحة ١٠٠٪! فتحت الآن بوابة الخروج الآمن في لغز مكافحة العدوى.',
                  en: '100% correct! You solved the Infection Prevention environmental puzzle.',
                },
              },
              {
                id: 'ipc_s2_o2',
                label: {
                  ar: 'سقف الغرفة فقط، بينما حواجز السرير ومقابض الأبواب لا تحتاج لأي تنظيف',
                  en: 'Only the ceiling tiles, while bed rails and door handles need no cleaning',
                },
                isCorrect: false,
                feedback: {
                  ar: 'حاول مرة أخرى: حواجز السرير ومقابض الأبواب هي أكثر الأسطح لمساً ونقلاً للعدوى.',
                  en: 'Try again: Bed rails and door handles are high-touch surfaces that frequently harbor microbes.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'تم حل لغز مكافحة العدوى: تطهير اليدين، الاستخدام الصحيح لـ PPE، وتطهير الأسطح كثيرة اللمس.',
          en: 'IPC Escape Puzzle solved: hand hygiene moments, safe PPE transitions, and high-touch surface disinfection verified.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l8_doctor',
    initialNodeId: 'l8_start',
    nodes: {
      l8_start: {
        id: 'l8_start',
        speaker: 'nurse',
        targetNpc: 'nurse',
        objectiveHint: {
          ar: 'تحدث مع الممرضة سارة، ثم حل لغز «محطة تعقيم اليدين ومهمات الوقاية 🧼».',
          en: 'Speak with Nurse Sara, then solve the 3D "Hand Hygiene & PPE Puzzle Station 🧼".',
        },
        dialogue: {
          ar: 'مرحباً بك في لغز الوقاية من العدوى (IPC)! كل عدوى نمنع انتقالها داخل المستشفى تعني مريضاً أقل يحتاج إلى مضاد حيوي. توجه إلى محطة التعقيم (🧼) لحل اللغز البيئي، وأخبرني: هل القفازات تغني عن تطهير اليدين؟',
          en: 'Welcome to the Infection Prevention Escape Puzzle! Every infection we prevent means one less antibiotic course needed. Visit the IPC Station (🧼) to solve the puzzle, and tell me: does wearing gloves replace hand hygiene?',
        },
        choices: [
          {
            id: 'l8_c1_hand_hygiene',
            label: {
              ar: 'لا؛ القفازات لا تغني عن نظافة اليدين أبداً، ويجب تطهير اليدين قبل ارتدائها وبعد خلعها وعند الانتقال بين مناطق الرعاية',
              en: 'No; gloves never replace hand hygiene. Hands must be cleaned before donning, after doffing, and between care areas',
            },
            nextNodeId: 'l8_doctor',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'إجابة رائعة! حل الآن لغز «محطة تعقيم اليدين ومهمات الوقاية 🧼» ثم تحدث مع د. طارق.',
              en: 'Great answer! Now solve the 3D IPC Station 🧼 puzzle and talk to Dr. Tarek.',
            },
            rationale: {
              ar: 'اللحظات الخمس لنظافة اليدين لمنظمة الصحة العالمية هي حجر الزاوية في منع العدوى المكتسبة.',
              en: 'WHO’s 5 Moments for Hand Hygiene are the cornerstone of infection prevention.',
            },
          },
          {
            id: 'l8_c1_gloves_only',
            label: {
              ar: 'نعم، ارتداء قفاز واحد طوال اليوم يكفي دون غسل اليدين',
              en: 'Yes, wearing a single pair of gloves all day replaces washing hands',
            },
            nextNodeId: 'l8_doctor',
            quality: 'caution',
            immediateFeedback: {
              ar: 'تذكير تعليمي مشجع: القفاز الواحد يتلوث سريعاً عند لمس الأسطح؛ لذلك نغيره ونطهر أيدينا بين كل مريض وآخر.',
              en: 'Encouraging reminder: Single gloves quickly pick up germs on surfaces, so we change them and clean our hands between care areas.',
            },
            rationale: {
              ar: 'الحركة الآمنة بين مناطق الرعاية تتطلب خلع القفاز المستعمل وتطهير اليدين.',
              en: 'Safe movement between care areas requires removing used PPE and performing hand hygiene.',
            },
          },
        ],
      },
      l8_doctor: {
        id: 'l8_doctor',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'بعد حل لغز «محطة مكافحة العدوى 🧼»، تحدث مع د. طارق.',
          en: 'After solving the IPC Station 🧼 puzzle, speak with Dr. Tarek.',
        },
        dialogue: {
          ar: 'أحسنت في حل ألغاز البيئة السريرية وتطهير الأسطح كثيرة اللمس! كيف ترتبط مكافحة العدوى ببرنامج ترشيد المضادات الحيوية؟',
          en: 'Well done solving the environmental hygiene and PPE puzzles! How does infection prevention connect to antibiotic stewardship?',
        },
        choices: [
          {
            id: 'l8_c2_finish',
            label: {
              ar: 'منع انتقال البكتيريا عبر اليدين والأسطح يقلل العدوى، وبالتالي يقلل الحاجة لوصف المضادات الحيوية ويحد من المقاومة',
              en: 'Stopping bacterial spread via hands and high-touch surfaces prevents infections, reducing antibiotic need and resistance',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'ممتاز! أتممت المستوى الثامن وفتحت المستوى التاسع (تحقيق مقاومة المضادات الحيوية المجهري).',
              en: 'Awesome! You completed Level 8 and unlocked Level 9 (Antibiotic Resistance Investigation).',
            },
            rationale: {
              ar: 'الوقاية من العدوى وترشيد المضادات وجهان لعملة واحدة في حماية المرضى.',
              en: 'Infection prevention and antibiotic stewardship work hand in hand to protect patients.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'حل اللغز البيئي لنظافة اليدين، الاستخدام الصحيح لمهمات الوقاية (PPE)، وتطهير الأسطح كثيرة اللمس عند الانتقال بين مناطق الرعاية.',
      en: 'Solving environmental puzzles on hand hygiene, appropriate PPE use, and disinfecting high-touch surfaces between care areas.',
    },
    educationalTakeaway: {
      ar: 'نظافة اليدين، الاستخدام السليم لمهمات الوقاية، وتطهير الأسطح كثيرة اللمس تمنع انتشار الميكروبات المقاومة وتقلل الحاجة للمضادات الحيوية.',
      en: 'Hand hygiene, proper PPE transitions, and cleaning high-touch surfaces stop the spread of resistant microbes and reduce the need for antibiotics.',
    },
    escalationGuidance: {
      ar: 'اتبع دائماً إرشادات مكافحة العدوى في المنشآت الصحية والمنزل، واستشر فريق مكافحة العدوى عند التعامل مع حالات العزل.',
      en: 'Always follow institutional infection prevention protocols and consult IPC specialists when managing isolation precautions.',
    },
    badgeTitle: {
      ar: 'بطل الوقاية ومكافحة العدوى',
      en: 'Infection Prevention Guardian',
    },
    badgeIcon: '🧼',
    sources: [
      {
        title: 'WHO Five Moments for Hand Hygiene',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/campaigns/world-hand-hygiene-day',
      },
      {
        title: 'CDC Infection Control Basics in Healthcare',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/infection-control/hcp/basics/index.html',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 9 — Antibiotic Resistance Investigation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-9-amr-microscopic-investigation',
    isCampaignLevel: true,
    campaignIndex: 9,
    number: 9,
    requiredLevelId: 'level-8-infection-prevention-puzzle',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ٨ (لغز الوقاية من العدوى ومكافحتها)',
      en: 'Unlocks after completing Level 8 (Infection Prevention Escape Puzzle)',
    },
    environmentTheme: 'microscopic_3d',
    title: {
      ar: 'المستوى ٩ — تحقيق مقاومة المضادات الحيوية (البيئة المجهرية 3D)',
      en: 'Level 9 — Antibiotic Resistance Investigation (3D Microscopic Arena)',
    },
    subtitle: {
      ar: 'ادخل البيئة المجهرية ثلاثية الأبعاد، استخدم الأدلة للتفريق بين البكتيريا والفيروسات، واكتشف كيف تنشأ السلالات المقاومة (AMR)',
      en: 'Enter a stylized microscopic 3D environment, use clues to distinguish bacteria from viruses, and see how misuse drives AMR',
    },
    categoryBadge: {
      ar: 'استكشاف مجهري 3D',
      en: '3D Microscopic Investigation',
    },
    primaryNpc: 'pharmacist',
    involvedNpcs: ['pharmacist', 'doctor'],
    briefing: {
      ar: 'تحوّل المشهد ثلاثي الأبعاد الآن إلى «مختبر المحاكاة المجهرية ثلاثي الأبعاد 🦠»! توجه إلى «منصة التحليل المجهري (بكتيريا مقابل فيروس)» لفحص الكائنات المجهرية وفهم لماذا لا تعالج المضادات الحيوية العدوى الفيروسية وكيف يؤدي الاستخدام الخاطئ لبقاء البكتيريا المقاومة.',
      en: 'You have entered the stylized 3D Microscopic Investigation Arena 🦠! Walk to the "Microbe Analyzerホログラム (Bacteria vs Virus)" to distinguish bacteria from viruses and discover how inappropriate antibiotic use selects for resistant strains.',
    },
    interactiveProps: [
      {
        id: 'prop-microbe-scanner',
        name: {
          ar: 'منصة الفحص المجهري ثلاثي الأبعاد (البكتيريا مقابل الفيروسات)',
          en: '3D Microscopic Clue Analyzer: Bacteria vs Viruses & AMR',
        },
        stationLabel: {
          ar: 'جهاز المحاكاة المجهرية الوسطي',
          en: 'Central 3D Microbe Holo-Scanner',
        },
        position: [0.0, 0, 0.8],
        color: 0xec4899,
        accentColor: 0xfbcfe8,
        iconEmoji: '🦠',
        shape: 'microbe_scanner',
        puzzleSteps: [
          {
            id: 'amr_s1',
            prompt: {
              ar: 'الدليل المجهري ١: يظهر المجسم الأول كائناً غير خلوي يتكاثر فقط داخل خلايا العائل (فيروس نزلة البرد)، والمجسم الثاني خلية بكتيرية لها جدار خلوي. لماذا لا يؤثر المضاد الحيوي على الفيروس؟',
              en: 'Microscopic Clue 1: Sample A is a non-cellular respiratory virus lacking a bacterial cell wall, while Sample B is a bacterial cell. Why do antibiotics have zero effect on Sample A (the virus)?',
            },
            options: [
              {
                id: 'amr_o1',
                label: {
                  ar: 'لأن المضادات الحيوية تستهدف تراكيب خاصة بالخلية البكتيرية (مثل الجدار الخلوي البكتيري) ولا توجد هذه الأهداف في الفيروسات',
                  en: 'Because antibiotics target bacterial structures (such as bacterial cell walls or machinery) that viruses do not possess',
                },
                isCorrect: true,
                feedback: {
                  ar: 'تفسير علمي دقيق! الفيروسات تختلف جذرياً في تركيبها عن البكتيريا، لذا لا تفيدها المضادات الحيوية.',
                  en: 'Exact scientific answer! Viruses lack bacterial targets, so antibiotics cannot treat viral infections.',
                },
              },
              {
                id: 'amr_o2',
                label: {
                  ar: 'المضادات الحيوية تقتل الفيروسات والبكتيريا بنفس الطريقة دائماً',
                  en: 'Antibiotics kill both viruses and bacteria in the exact same way',
                },
                isCorrect: false,
                feedback: {
                  ar: 'غير صحيح! المضادات الحيوية مخصصة للبكتيريا فقط ولا تقضي على الفيروسات.',
                  en: 'Incorrect! Antibiotics only work against bacteria, never viruses.',
                },
              },
            ],
          },
          {
            id: 'amr_s2',
            prompt: {
              ar: 'الدليل المجهري ٢: عند تعرض تجمع بكتيري لجرعات غير مكتملة أو غير مبررة من مضاد حيوي، ماذا يحدث على المستوى المجهري (كمفهوم تعليمي)؟',
              en: 'Microscopic Clue 2: When a bacterial population is exposed to inappropriate or incomplete antibiotic doses, what happens educationally?',
            },
            options: [
              {
                id: 'amr_s2_o1',
                label: {
                  ar: 'تموت البكتيريا الحساسة وتنجو البكتيريا التي تمتلك جينات مقاومة لتتكاثر وتنقل المقاومة (الانتخاب الطبيعي للمقاومة AMR)',
                  en: 'Susceptible bacteria die while bacteria carrying resistance traits survive and multiply (selection pressure driving AMR)',
                },
                isCorrect: true,
                feedback: {
                  ar: 'أحسنت! هذا التوضيح التعليمي يفسر كيف يسهم سوء استخدام المضادات في ظهور السلالات المقاومة.',
                  en: 'Well done! This educational model illustrates how antibiotic misuse selects for resistant strains.',
                },
              },
              {
                id: 'amr_s2_o2',
                label: {
                  ar: 'تصبح جميع البكتيريا أضعف كلما أخذنا مضادات حيوية بدون وصفة',
                  en: 'All bacteria become weaker the more we take unprescribed antibiotics',
                },
                isCorrect: false,
                feedback: {
                  ar: 'العكس هو الصحيح! الاستخدام غير المبرر ينتخب السلالات المقاومة ويجعل علاجها أصعب.',
                  en: 'The opposite happens! Inappropriate use selects for resistant bacteria.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'تم إتمام التحقيق المجهري: التمييز بين البكتيريا والفيروسات وفهم آلية انتخاب المقاومة (AMR).',
          en: 'Microscopic investigation completed: bacteria vs viruses distinguished and AMR selection mechanism reviewed.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l9_doctor',
    initialNodeId: 'l9_start',
    nodes: {
      l9_start: {
        id: 'l9_start',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'افحص «منصة الفحص المجهري ثلاثي الأبعاد 🦠» وتحدث مع د. مريم.',
          en: 'Inspect the 3D "Microscopic Clue Analyzer 🦠" in the center of the arena and talk to Dr. Mariam.',
        },
        dialogue: {
          ar: 'مرحباً بك في البيئة المجهرية ثلاثية الأبعاد! هنا نشاهد عن قرب الفرق بين البكتيريا والفيروسات وكيف تنشأ مقاومة المضادات الحيوية (AMR). توجه إلى منصة الفحص المجهري (🦠) لحل الأدلة، وتذكر: هل اختياراتنا داخل اللعبة تحدد علاجاً حقيقياً لمريض؟',
          en: 'Welcome to the stylized 3D Microscopic Arena! Here we visualize bacteria vs viruses and how antimicrobial resistance (AMR) emerges. Inspect the 3D Microbe Scanner (🦠), and remember: do game actions select real-world medical treatment?',
        },
        choices: [
          {
            id: 'l9_c1_clear',
            label: {
              ar: 'لا؛ هذه محاكاة تعليمية لفهم آلية المقاومة والفرق بين البكتيريا والفيروسات، بينما اختيار العلاج الحقيقي يتم حصراً بواسطة الطبيب المختص',
              en: 'No; this is an educational simulation explaining AMR and bacteria vs viruses, while real treatment selection requires a licensed clinician',
            },
            nextNodeId: 'l9_doctor',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'وعي علمي ممتاز! حل الآن لغز «منصة الفحص المجهري 🦠» ثم توجه إلى د. طارق.',
              en: 'Great clarity! Solve the 3D Microbe Scanner 🦠 puzzle, then speak with Dr. Tarek.',
            },
            rationale: {
              ar: 'فهم الآلية البيولوجية للمقاومة يعزز التزام الجميع بترشيد المضادات دون تداوٍ ذاتي.',
              en: 'Understanding biological resistance mechanisms reinforces stewardship while respecting clinical boundaries.',
            },
          },
          {
            id: 'l9_c1_misuse',
            label: {
              ar: 'المضادات الحيوية تعالج جميع الفيروسات ولا تسبب أي مقاومة بكتيرية',
              en: 'Antibiotics cure all viruses and never cause bacterial resistance',
            },
            nextNodeId: 'l9_doctor',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'معلومة خاطئة! المضادات لا تعالج الفيروسات، وسوء استخدامها يسرّع مقاومة الميكروبات.',
              en: 'Incorrect! Antibiotics do not treat viruses, and misuse accelerates antimicrobial resistance.',
            },
            rationale: {
              ar: 'أخذ المضاد الحيوي لعدوى فيروسية يقضي على البكتيريا النافعة ويترك البكتيريا المقاومة تنمو.',
              en: 'Taking antibiotics for viral illnesses harms beneficial flora and selects for resistant bacteria.',
            },
          },
        ],
      },
      l9_doctor: {
        id: 'l9_doctor',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'بعد حل لغز «منصة الفحص المجهري 🦠»، تحدث مع د. طارق.',
          en: 'After solving the 3D Microbe Scanner 🦠 puzzle, speak with Dr. Tarek.',
        },
        dialogue: {
          ar: 'تحقيق مجهري رائع! لقد رأيت كيف أن الفيروسات لا تستجيب للمضادات الحيوية، وكيف أن الاستخدام غير الملائم يمنح الأفضلية للبكتيريا المقاومة. ما الخلاصة التي تحملها للمهمة النهائية؟',
          en: 'Outstanding microscopic investigation! You demonstrated why viruses do not respond to antibiotics and how misuse drives resistance. What takeaway prepares you for the Final Mission?',
        },
        choices: [
          {
            id: 'l9_c2_finish',
            label: {
              ar: 'المضادات الحيوية ليست مناسبة لكل عدوى؛ ترشيد استخدامها وفحص الطبيب يحميان فعالية هذه الأدوية المنقذة للحياة',
              en: 'Antibiotics are not appropriate for every infection; prudent stewardship and clinician evaluation preserve life-saving medicines',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'مذهل! أتممت المستوى التاسع وفتحت المستوى العاشر والأخير (المهمة النهائية: تحدي الرعاية الآمنة الشامل).',
              en: 'Brilliant! You completed Level 9 and unlocked Level 10 (Final Mission: The Safe Care Challenge).',
            },
            rationale: {
              ar: 'حماية فعالية المضادات الحيوية مسؤولية مشتركة بين الفريق الطبي والمجتمع.',
              en: 'Preserving antibiotic effectiveness is a shared responsibility across healthcare teams and communities.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'استخدام الأدلة في البيئة المجهرية ثلاثية الأبعاد للتفريق بين البكتيريا والفيروسات وفهم كيف يؤدي سوء استخدام المضادات إلى انتخاب السلالات المقاومة.',
      en: 'Using clues in the 3D microscopic environment to distinguish bacteria from viruses and understand how antibiotic misuse drives resistance.',
    },
    educationalTakeaway: {
      ar: 'المضادات الحيوية تستهدف البكتيريا فقط ولا تعالج الفيروسات. الاستخدام غير الملائم للمضادات يقضي على البكتيريا الحساسة والنافعة ويترك السلالات المقاومة تتكاثر.',
      en: 'Antibiotics target bacteria only and do not treat viruses. Inappropriate antibiotic use eliminates susceptible/beneficial bacteria and selects for resistant strains.',
    },
    escalationGuidance: {
      ar: 'هذه المحاكاة المجهرية للتثقيف العلمي فقط ولا تُستخدم لاختيار علاج حقيقي؛ راجع الطبيب أو الصيدلي دائماً.',
      en: 'This microscopic simulation is for educational understanding only and never selects real clinical treatment—always consult a qualified professional.',
    },
    badgeTitle: {
      ar: 'محقق المقاومة المجهرية',
      en: 'AMR Microscopic Investigator',
    },
    badgeIcon: '🧬',
    sources: [
      {
        title: 'WHO Antimicrobial Resistance (AMR) Fact Sheet',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance',
      },
      {
        title: 'CDC About Antimicrobial Resistance',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antimicrobial-resistance/about/index.html',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 10 — Final Mission: The Safe Care Challenge
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-10-final-mission',
    isCampaignLevel: true,
    campaignIndex: 10,
    number: 10,
    requiredLevelId: 'level-9-amr-microscopic-investigation',
    unlockRequirementText: {
      ar: 'يُفتح بعد إتمام المستوى ٩ (تحقيق مقاومة المضادات الحيوية)',
      en: 'Unlocks after completing Level 9 (Antibiotic Resistance Investigation)',
    },
    environmentTheme: 'capstone_mission',
    title: {
      ar: 'المستوى ١٠ — المهمة النهائية: تحدي الرعاية الآمنة الشامل',
      en: 'Level 10 — Final Mission: The Safe Care Challenge',
    },
    subtitle: {
      ar: 'مهمة ختامية متعددة المراحل تجمع الاستكشاف، الحوار، فحص الحساسية، سلامة الدواء، مكافحة العدوى، والتواصل مع فريق الرعاية',
      en: 'Multi-part capstone combining exploration, NPC dialogue, medication safety, allergy checks, infection prevention, and team communication',
    },
    categoryBadge: {
      ar: 'المهمة الختامية الشاملة',
      en: 'Capstone Safe Care Mission',
    },
    primaryNpc: 'nurse',
    involvedNpcs: ['nurse', 'patient', 'pharmacist', 'doctor'],
    briefing: {
      ar: 'مرحباً بك في المهمة النهائية الشاملة! في هذه الجولة الختامية ستزور جميع أعضاء الفريق وتحل محطتين ثلاثيتي الأبعاد: «منصة تدقيق سلامة الدواء والحساسية 🛡️» و«محطة مكافحة العدوى والتسليم السريري 🏆» لتطبيق كل ما تعلمته في رعاية آمنة متكاملة.',
      en: 'Welcome to the Final Capstone Mission! Coordinate with all four NPCs and solve two 3D stations—"Medication & Allergy Audit Console 🛡️" and "Infection Control & Team Handoff Hub 🏆"—to synthesize every safe care principle.',
    },
    interactiveProps: [
      {
        id: 'prop-capstone-allergy-med',
        name: {
          ar: 'منصة المهمة النهائية (١): تدقيق الهوية والحساسية والأمر الدوائي',
          en: 'Capstone Console (1): Identity, Allergy & Order Safety Audit',
        },
        stationLabel: {
          ar: 'منصة التدقيق الدوائي الشامل',
          en: 'Capstone Medication Audit Console',
        },
        position: [-2.2, 0, 1.8],
        color: 0xf59e0b,
        accentColor: 0xfef08a,
        iconEmoji: '🛡️',
        shape: 'capstone_console',
        puzzleSteps: [
          {
            id: 'cap1_s1',
            prompt: {
              ar: 'الجزء ١ من التحدي الختامي: مريض في الجناح لديه حساسية موثقة من البنسلين، ويريد مرافقه إعطاؤه بقايا كبسولات غير واضحة من المنزل بينما التذكرة تحتاج لمراجعة. ما الإجراء المتكامل؟',
              en: 'Capstone Audit Part 1: A ward patient has a documented penicillin allergy, a relative offers leftover unlabeled home capsules, and the chart order needs verification. What is the safe integrated action?',
            },
            options: [
              {
                id: 'cap1_o1',
                label: {
                  ar: 'منع استخدام بقايا المنزل، التحقق من هوية المريض وسجل الحساسية، إيقاف أي أمر متعارض، وتصعيد المراجعة للطبيب والصيدلي',
                  en: 'Refuse home leftovers, verify patient ID and allergy record, hold any conflicting order, and escalate to the physician and pharmacist',
                },
                isCorrect: true,
                feedback: {
                  ar: 'تدقيق مثالي! جمعت بين أمان المنزل وفحص الحساسية وقائمة السلامة التمريضية.',
                  en: 'Exemplary audit! You combined home leftover safety, allergy verification, and the nursing checklist.',
                },
              },
              {
                id: 'cap1_o2',
                label: {
                  ar: 'قبول كبسولات المنزل وتعديل التذكرة العلاجية فردياً',
                  en: 'Accept the leftover home capsules and modify the chart order yourself',
                },
                isCorrect: false,
                feedback: {
                  ar: 'غير آمن! لا تُستخدم بقايا المنزل ولا تُعدّل الوصفات بشكل فردي.',
                  en: 'Unsafe! Never use home leftovers or independently alter prescriptions.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'اكتمل التدقيق الأول للمهمة النهائية: مطابقة الهوية، حماية الحساسية، ومنع البقايا المنزلية.',
          en: 'Capstone Audit 1 complete: ID verified, allergy protected, and home leftovers prevented.',
        },
      },
      {
        id: 'prop-capstone-ipc-handoff',
        name: {
          ar: 'منصة المهمة النهائية (٢): مكافحة العدوى وتسليم فريق الرعاية',
          en: 'Capstone Console (2): Infection Prevention & Care Team Handoff',
        },
        stationLabel: {
          ar: 'منصة مكافحة العدوى والتواصل الجماعي',
          en: 'Capstone IPC & Handoff Station',
        },
        position: [2.2, 0, 1.8],
        color: 0x10b981,
        accentColor: 0xa7f3d0,
        iconEmoji: '🏆',
        shape: 'sanitizer_ppe',
        puzzleSteps: [
          {
            id: 'cap2_s1',
            prompt: {
              ar: 'الجزء ٢ من التحدي الختامي: قبل الانتقال من سرير المريض إلى مكتب الطبيب والصيدلية لتسليم التقرير، ما هي خطوة مكافحة العدوى والتواصل الصحيحة؟',
              en: 'Capstone Audit Part 2: Before moving from the patient bedside to the physician and pharmacy stations for handoff, what IPC and communication steps are required?',
            },
            options: [
              {
                id: 'cap2_o1',
                label: {
                  ar: 'خلع مهمات الوقاية المستعملة، تطهير اليدين جيداً، وتقديم تقرير منظم للفريق الطبي يتضمن العلامات الحيوية والحساسية ونتيجة المزرعة المبسطة',
                  en: 'Remove used PPE, perform hand hygiene, and deliver a structured team handoff covering vitals, allergies, and lab evidence',
                },
                isCorrect: true,
                feedback: {
                  ar: 'إنجاز رائع! أتممت محطتي المهمة النهائية بنجاح.',
                  en: 'Outstanding! You completed both 3D Capstone Stations.',
                },
              },
              {
                id: 'cap2_o2',
                label: {
                  ar: 'الانتقال بدون غسل اليدين والاكتفاء بمعلومات ناقصة',
                  en: 'Move between zones without hand hygiene and omit allergy details',
                },
                isCorrect: false,
                feedback: {
                  ar: 'تذكر: نظافة اليدين والتواصل الكامل بين الفريق عنصران أساسيان في التحدي الختامي.',
                  en: 'Remember: Hand hygiene and complete team communication are essential.',
                },
              },
            ],
          },
        ],
        completionClueSummary: {
          ar: 'اكتمل التدقيق الثاني للمهمة النهائية: تطبيق مكافحة العدوى وتجهيز التسليم السريري الشامل.',
          en: 'Capstone Audit 2 complete: IPC precautions applied and structured team handoff prepared.',
        },
      },
    ],
    requirePropsSolvedBeforeNodeId: 'l10_doctor',
    initialNodeId: 'l10_start',
    nodes: {
      l10_start: {
        id: 'l10_start',
        speaker: 'nurse',
        targetNpc: 'nurse',
        objectiveHint: {
          ar: 'تحدث مع الممرضة سارة لبدء المهمة النهائية، ثم حل منصتي التحدي (🛡️ و 🏆).',
          en: 'Speak with Nurse Sara to launch the Final Mission, then solve both 3D Capstone Consoles (🛡️ & 🏆).',
        },
        dialogue: {
          ar: 'مرحباً بك في المستوى العاشر والأخير: تحدي الرعاية الآمنة الشامل! لتجتاز هذه المهمة بنجاح، ستتعاون مع المريض والصيدلانية والطبيب، وتحل منصتي التدقيق ثلاثيتي الأبعاد في الجناح. ما المبدأ الذي يجمع كل ما تعلمناه في المستويات التسعة السابقة؟',
          en: 'Welcome to Level 10: The Safe Care Challenge! To complete this capstone mission, coordinate with the patient, pharmacist, and physician, and solve both 3D audit consoles in the ward. What principle unites all 10 levels?',
        },
        choices: [
          {
            id: 'l10_c1_holistic',
            label: {
              ar: 'سلامة المريض وترشيد المضادات الحيوية يعتمدان على التقييم الدقيق، التحقق من الهوية والحساسية، منع التداوي الذاتي، مكافحة العدوى، والتصعيد للفريق المؤهل',
              en: 'Patient safety and antibiotic stewardship unite accurate assessment, ID/allergy checks, avoiding self-medication, infection prevention, and team escalation',
            },
            nextNodeId: 'l10_pharmacist',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'بداية قوية للمهمة النهائية! حل الآن منصتي التحدي (🛡️ و 🏆) في الغرفة وتوجه إلى الصيدلانية د. مريم.',
              en: 'Strong start! Solve both 3D Capstone Consoles (🛡️ & 🏆) in the room, then talk to Pharmacist Dr. Mariam.',
            },
            rationale: {
              ar: 'دمج مهارات التمريض والصيدلة والطب ومكافحة العدوى يمنع الأخطاء قبل وصولها للمريض.',
              en: 'Integrating nursing, pharmacy, medical, and IPC safeguards prevents errors before they reach the patient.',
            },
          },
          {
            id: 'l10_c1_shortcut',
            label: {
              ar: 'تخطي قوائم الفحص وإعطاء المضادات الحيوية لكل مريض دون استشارة الفريق',
              en: 'Skip safety checklists and give antibiotics to every patient without team consultation',
            },
            nextNodeId: 'l10_pharmacist',
            quality: 'unsafe',
            immediateFeedback: {
              ar: 'غير آمن! اختصار خطوات السلامة يعرض المرضى للحساسية والفشل العلاجي.',
              en: 'Unsafe! Skipping safety checks exposes patients to allergic reactions and treatment failure.',
            },
            rationale: {
              ar: 'لا توجد طرق مختصرة في سلامة الدواء.',
              en: 'There are no shortcuts in medication safety.',
            },
          },
        ],
      },
      l10_pharmacist: {
        id: 'l10_pharmacist',
        speaker: 'pharmacist',
        targetNpc: 'pharmacist',
        objectiveHint: {
          ar: 'تحدث مع الصيدلانية د. مريم في ركن الصيدلية لمراجعة التدقيق الدوائي.',
          en: 'Speak with Pharmacist Dr. Mariam at the Pharmacy Counter to verify the medication & allergy audit.',
        },
        dialogue: {
          ar: 'فخورة بوصولك إلى المهمة النهائية! بعد مراجعتنا لسجل الحساسية، ورفض الصرف بدون وصفة، ومنع إعادة استخدام البقايا المنزلية، كيف نلخص دور التثقيف الصيدلاني والتمريضي؟',
          en: 'Proud to see you in the Final Mission! After verifying allergies, declining unprescribed requests, and preventing home leftover reuse, how do we summarize our educational role?',
        },
        choices: [
          {
            id: 'l10_c2_pharm',
            label: {
              ar: 'تمكين المرضى بمعلومات دقيقة ومحترمة حول الاستخدام الآمن للمضادات، والتعاون مع الأطباء لضمان توافق كل أمر دوائي مع حالة المريض وحساسيته',
              en: 'Empower patients with respectful education on safe antibiotic use, and collaborate with clinicians so every order matches allergy and lab data',
            },
            nextNodeId: 'l10_doctor',
            quality: 'optimal',
            immediateFeedback: {
              ar: 'ممتاز! تأكد من حل منصتي التحدي (🛡️ و 🏆) في الغرفة ثلاثية الأبعاد، ثم توجه إلى د. طارق لإتمام المهمة النهائية.',
              en: 'Excellent! Make sure both 3D Capstone Consoles (🛡️ & 🏆) are solved, then visit Dr. Tarek to complete the Final Mission.',
            },
            rationale: {
              ar: 'التعاون بين الصيدلي والممرض والطبيب يشكل شبكة أمان متكاملة.',
              en: 'Pharmacist-nurse-physician collaboration forms a complete safety net.',
            },
          },
        ],
      },
      l10_doctor: {
        id: 'l10_doctor',
        speaker: 'doctor',
        targetNpc: 'doctor',
        objectiveHint: {
          ar: 'بعد حل منصتي التحدي (🛡️ و 🏆)، تحدث مع د. طارق لإتمام المهمة النهائية.',
          en: 'After solving both 3D Capstone Consoles (🛡️ & 🏆), speak with Dr. Tarek to complete the Final Mission.',
        },
        dialogue: {
          ar: 'تهانينا على إتمام جميع مراحل المهمة النهائية! لقد طبقت الاستجابة الأولى، فحص الحساسية، حوكمة الصيدلية، سلامة المنزل، قائمة الفحص التمريضية، الدليل المعملي، جولة الجناح، مكافحة العدوى، والتحقيق المجهري. تذكر دائماً: هل إتمام هذه اللعبة التعليمية يُعد شهادة مزاولة سريرية؟',
          en: 'Congratulations on completing every stage of the Final Mission! You combined ER triage, allergy clues, pharmacy stewardship, home safety, nursing checklists, lab evidence, ward rounds, IPC, and AMR investigation. One final check: does completing this educational game certify real-world clinical competence?',
        },
        choices: [
          {
            id: 'l10_c3_finish',
            label: {
              ar: 'لا؛ هذه التجربة للتوعية والتدريب التعليمي التفاعلي فقط، ولا تُعد شهادة كفاءة سريرية ولا تغني عن التعليم الطبي المعتمد أو استشارة الطبيب والصيدلي',
              en: 'No; this simulator is strictly for interactive educational awareness and does not certify clinical competence or replace licensed healthcare professionals',
            },
            nextNodeId: 'END',
            quality: 'optimal',
            immediateFeedback: {
              ar: '🏆 مبروك! لقد أتممت جميع المستويات العشرة في حملة محاكي الحياة الطبية بنجاح!',
              en: '🏆 Congratulations! You have completed all 10 Campaign Levels in the Medical Life Simulator!',
            },
            rationale: {
              ar: 'الوعي بحدود الأدوات التعليمية والالتزام بالرجوع للمختصين المؤهلين هو قمة المسؤولية الطبية.',
              en: 'Recognizing the educational scope of simulation and relying on licensed clinicians in real life is the pinnacle of safe care.',
            },
          },
        ],
      },
    },
    safeActionDemonstrated: {
      ar: 'إتمام التحدي الختامي متعدد المراحل: دمج فحص الهوية والحساسية، منع بقايا الأدوية المنزلية، تطبيق مكافحة العدوى، والتسليم المنظم للفريق الطبي مع تأكيد الإطار التعليمي للمحاكاة.',
      en: 'Completing the multi-part capstone mission: combining ID/allergy checks, preventing home leftover misuse, applying IPC precautions, and executing structured team handoff within safe educational boundaries.',
    },
    educationalTakeaway: {
      ar: 'الرعاية الآمنة وترشيد المضادات الحيوية منظومة متكاملة تبدأ من الوقاية من العدوى والتقييم السريري الدقيق وتمتد إلى فحص الحساسية وقوائم السلامة التمريضية والصرف الرشيد. إتمام هذه اللعبة يعزز الوعي التعليمي ولا يُعد شهادة مزاولة سريرية.',
      en: 'Safe care and antibiotic stewardship form an integrated system spanning infection prevention, clinical assessment, allergy verification, nursing safety checklists, and responsible dispensing. Completing this educational game builds awareness and does not certify clinical competence.',
    },
    escalationGuidance: {
      ar: 'في جميع الحالات الواقعية: استشر دائماً طبيباً أو صيدلياً مرخصاً، وفي حالات الطوارئ التنفسية أو التحسسية الحادة اتصل بالإسعاف (123) فوراً.',
      en: 'In all real-world situations: always consult a licensed physician or pharmacist, and call emergency services (123) immediately for respiratory or allergic emergencies.',
    },
    badgeTitle: {
      ar: 'وسام المهمة النهائية للرعاية الآمنة',
      en: 'Safe Care Capstone Master',
    },
    badgeIcon: '🏆',
    sources: [
      {
        title: 'WHO Global Action Plan on Antimicrobial Resistance',
        publisher: 'World Health Organization (WHO)',
        url: 'https://www.who.int/publications/i/item/9789241509763',
      },
      {
        title: 'CDC Core Elements of Antibiotic Stewardship',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/core-elements/index.html',
      },
      {
        title: 'Egyptian Drug Authority (EDA) — Patient Medication Safety',
        publisher: 'EDA Egypt',
        url: 'https://edaegypt.gov.eg',
      },
    ],
  },
];

export const PROGRESS_STORAGE_KEY = 'aa_medsim_progress_v1';

export interface SimulatorSavedProgress {
  version: 1;
  completedIds: string[];
  earnedBadgeIds: string[];
  lastPlayedId?: string;
}

/**
 * Loads non-clinical educational level progress from localStorage safely,
 * falling back to empty arrays if storage is unavailable or corrupt.
 */
export function loadSimulatorProgress(): SimulatorSavedProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return { version: 1, completedIds: [], earnedBadgeIds: [] };
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        version: 1,
        completedIds: Array.isArray(parsed.completedIds)
          ? parsed.completedIds.filter((x: unknown) => typeof x === 'string')
          : [],
        earnedBadgeIds: Array.isArray(parsed.earnedBadgeIds)
          ? parsed.earnedBadgeIds.filter((x: unknown) => typeof x === 'string')
          : [],
        lastPlayedId: typeof parsed.lastPlayedId === 'string' ? parsed.lastPlayedId : undefined,
      };
    }
  } catch {
    /* ignore storage errors in private/restricted browsing */
  }
  return { version: 1, completedIds: [], earnedBadgeIds: [] };
}

/**
 * Saves non-clinical educational level completion to localStorage safely.
 * Never writes to Firebase or stores personal health information.
 */
export function saveSimulatorProgress(progress: SimulatorSavedProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* ignore storage quota or privacy errors */
  }
}

/**
 * Checks whether a campaign level is unlocked based on completed level IDs.
 * - All 5 original scenarios are always unlocked (backward compatibility).
 * - Campaign Level 1 ('level-1-er-first-response') is unlocked by default.
 * - Campaign Levels 2..10 require their `requiredLevelId` to be in `completedIds`.
 */
export function isExperienceUnlocked(
  itemId: string,
  completedIds: string[]
): boolean {
  const campaignLevel = CAMPAIGN_TEN_LEVELS.find((l) => l.id === itemId);
  if (!campaignLevel) {
    // Original 5 scenarios remain unlocked at all times
    return true;
  }
  if (!campaignLevel.requiredLevelId) {
    return true;
  }
  return completedIds.includes(campaignLevel.requiredLevelId);
}
