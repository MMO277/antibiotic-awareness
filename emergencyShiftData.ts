import { Cartoon3DGameConfig } from './Cartoon3DGameShell';

export const EMERGENCY_SHIFT_CONFIG: Cartoon3DGameConfig = {
  gameId: 'emergencyShift',
  route: '/emergency-shift',
  worldPreset: 'emergency_shift',
  gameIcon: '🚑',
  gameTitle: {
    ar: 'مناوبة الطوارئ 3D (Emergency Shift)',
    en: 'Emergency Shift 3D',
  },
  fictionalNoticeBadge: {
    ar: 'سيناريو طوارئ تعليمي خيالي • لا يغني عن الإسعاف (123) أو الطبيب',
    en: 'Fictional ER Training • Not Clinical Decision Support',
  },
  loadingTitle: {
    ar: 'جارٍ تجهيز قسم الطوارئ ثلاثي الأبعاد (WebGL)...',
    en: 'Initializing 3D Emergency Department Shift...',
  },
  loadingSubtitle: {
    ar: 'يتم بناء مكتب الفرز (Triage)، أسرّة الملاحظة، شاشات العلامات الحيوية، وفريق الطوارئ.',
    en: 'Building triage reception desk, resuscitation stretchers, vitals monitors, and ED team NPCs.',
  },
  controlsHintTitle: {
    ar: 'طريقة العمل في مناوبة الطوارئ 3D:',
    en: 'How to Navigate Emergency Shift 3D:',
  },
  controlsHintBody: {
    ar: 'تحرك بعصا التحكم (أو WASD/الأسهم) بين مكتب الفرز وأسرّة المرضى ومحطات الحساسية والتعقيم، حدد علامات الإنذار (Red Flags)، وصعّد الحالات الحرجة للطبيب المختص فوراً.',
    en: 'Move with the joystick (or WASD/Arrows) between the Triage Desk, Patient Bays, and Safety Stations. Identify red flags, verify allergies, practice hand hygiene, and escalate to qualified clinicians.',
  },
  showInventoryBar: true,
  npcs: {
    triageNurse: {
      id: 'triageNurse',
      name: {
        ar: 'الممرضة هدى (مسؤولة فرز الطوارئ)',
        en: 'Nurse Huda (ED Triage Lead)',
      },
      title: {
        ar: 'تحديد الأولويات ورصد علامات الإنذار المبكرة',
        en: 'Triage Prioritization & Red-Flag Screening',
      },
      stationLabel: {
        ar: 'مكتب الفرز الطارئ (Triage Desk)',
        en: 'ED Triage Reception Desk',
      },
      position: [-4.5, 0, -2.5],
      rotationY: 0.35,
      outfitColor: 0xdc2626,
      accentColor: 0xffffff,
      skinColor: 0xf6d0b1,
      hatType: 'nurse_cap',
      avatarEmoji: '👩‍⚕️',
      defaultGreeting: {
        ar: 'أهلاً بك في مناوبة الطوارئ! في قسم الطوارئ، الأولوية القصوى هي رصد علامات الإنذار الخطرة (Red Flags) وتصعيدها للطبيب المختص دون أي تأخير.',
        en: 'Welcome to Emergency Shift! In the ED, our top priority is recognizing life-threatening red flags and escalating immediately to the attending physician.',
      },
    },
    erAttending: {
      id: 'erAttending',
      name: {
        ar: 'د. طارق (استشاري طب الطوارئ)',
        en: 'Dr. Tarek (ER Attending Physician)',
      },
      title: {
        ar: 'التقييم السريري العاجل وإدارة الحالات الحرجة',
        en: 'Acute Clinical Evaluation & Resuscitation Lead',
      },
      stationLabel: {
        ar: 'منصة أخصائي الطوارئ',
        en: 'ER Attending Command Desk',
      },
      position: [4.5, 0, -2.5],
      rotationY: -0.35,
      outfitColor: 0x1e3a8a,
      accentColor: 0x93c5fd,
      skinColor: 0xe5b887,
      hatType: 'doctor_hair',
      avatarEmoji: '👨‍⚕️',
      defaultGreeting: {
        ar: 'تذكّر: علامات مثل ضيق التنفس، انخفاض الأكسجين، هبوط الضغط، أو التشوش الذهني تتطلب تقييماً طبياً طارئاً فوراً ولا تُعالج أبداً بوصفات منزلية.',
        en: 'Remember: warning signs like respiratory distress, hypoxia, hypotension, or confusion require immediate medical evaluation—never home self-medication.',
      },
    },
    erPatient: {
      id: 'erPatient',
      name: {
        ar: 'المريض / المرافق في سرير الملاحظة',
        en: 'Patient / Family Member in Observation Bay',
      },
      title: {
        ar: 'حالة تعليمية خيالية في عنبر الطوارئ',
        en: 'Fictional Educational Case in ED Bay',
      },
      stationLabel: {
        ar: 'عنبر أسرّة الطوارئ (Bay 1 & 2)',
        en: 'ED Patient Stretcher Bays',
      },
      position: [-5.2, 0, 2.3],
      rotationY: 1.35,
      outfitColor: 0x0284c7,
      accentColor: 0xfef08a,
      skinColor: 0xf1c27d,
      hatType: 'patient_band',
      avatarEmoji: '🧑',
      defaultGreeting: {
        ar: 'شكراً لاهتمامكم! سأخبركم بالأعراض وتاريخ الحساسية الدوائية بوضوح لمساعدة الفريق الطبي.',
        en: 'Thank you for checking on me! I can share my symptom history and allergy details to help the clinical team.',
      },
    },
    erPharmacist: {
      id: 'erPharmacist',
      name: {
        ar: 'د. ياسر (صيدلي الطوارئ وسلامة الدواء)',
        en: 'Dr. Yasser (Emergency Clinical Pharmacist)',
      },
      title: {
        ar: 'التحقق من الحساسية المتصالبة وسلامة المضادات',
        en: 'Allergy Cross-Reactivity & Medication Safety',
      },
      stationLabel: {
        ar: 'وحدة سلامة الدواء ومكافحة العدوى',
        en: 'Allergy & IPC Safety Station',
      },
      position: [5.5, 0, 3.1],
      rotationY: -1.35,
      outfitColor: 0x059669,
      accentColor: 0xffffff,
      skinColor: 0xeab68c,
      hatType: 'pharmacist_glasses',
      avatarEmoji: '💊',
      defaultGreeting: {
        ar: 'في زحام الطوارئ، التحقق من سوار الحساسية الدوائية واللحظات الخمس لنظافة اليدين يمنع أخطاء دوائية وعدوى مكتسبة خطيرة.',
        en: 'Even during a busy ER shift, verifying the allergy wristband and practicing the 5 Moments for Hand Hygiene prevents serious harm.',
      },
    },
  },
  missions: [
    // ═══════════════════════════════════════════════════════════════════════════
    // SCENARIO 1 — Triage Priority & Sepsis Red-Flag Escalation
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'er-shift-1-triage-red-flags',
      missionIndex: 1,
      requiredMissionId: null,
      unlockRequirementText: {
        ar: 'متاح للبدء مباشرة (السيناريو الأول في مناوبة الطوارئ)',
        en: 'Unlocked by default (Emergency Shift Scenario 1)',
      },
      accentHex: 0xdc2626,
      gentleTimerSeconds: 90,
      title: {
        ar: 'السيناريو ١ — أولوية الفرز (Triage) ورصد علامات الإنذار الحرجة',
        en: 'Scenario 1 — Triage Priority & Critical Red-Flag Recognition',
      },
      subtitle: {
        ar: 'قارن بين الحالات الخيالية الواردة لقسم الطوارئ، تعرّف على علامات الإنتان وضيق التنفس (Red Flags)، وصعّد الحالة الحرجة فوراً للطبيب',
        en: 'Evaluate fictional ED arrivals, recognize sepsis and respiratory red flags, perform hand hygiene, and escalate urgently to the physician',
      },
      categoryBadge: {
        ar: 'فرز الطوارئ وعلامات الإنذار',
        en: 'ED Triage & Red Flags',
      },
      badgeIcon: '🚨',
      badgeTitle: {
        ar: 'وسام اليقظة في فرز الطوارئ',
        en: 'ED Red-Flag Triage Responder',
      },
      primaryNpc: 'triageNurse',
      briefing: {
        ar: 'وصلت حالتان خياليتان إلى الاستقبال في نفس الوقت: الحالة (أ) تعاني من حمى مرتفعة، تسارع تنفس، هبوط ضغط، وتشوش ذهني؛ والحالة (ب) تعاني من عطس خفيف بدون حمى وتطلب مضاداً حيوياً. افحص «لوحة الفرز والعلامات الحيوية 3D» و«محطة تعقيم اليدين»، ثم نسّق مع الممرضة هدى ود. طارق.',
        en: 'Two fictional arrivals presented simultaneously: Case A has high fever, rapid breathing, low blood pressure, and new confusion; Case B has mild sneezing without fever and asks for an antibiotic. Inspect the 3D Triage Board and Hand Hygiene Station, then coordinate with Nurse Huda and Dr. Tarek.',
      },
      initialNodeId: 'er1_start',
      requirePropsSolvedBeforeNodeId: 'er1_doctor_escalate',
      interactiveProps: [
        {
          id: 'prop-er1-triage-board',
          name: {
            ar: 'لوحة الفرز وشاشة العلامات الحيوية (الحالة الخيالية #ED-201)',
            en: 'ED Triage & Vitals Monitor (Fictional Case #ED-201)',
          },
          stationLabel: {
            ar: 'لوحة الفرز الطارئ 3D',
            en: '3D Triage Vitals Board',
          },
          position: [-3.1, 0, -2.6],
          color: 0xdc2626,
          accentColor: 0xf87171,
          iconEmoji: '📟',
          shape: 'triage_board',
          rewardItem: {
            id: 'clue-er1-triage',
            icon: '🚨',
            label: {
              ar: 'أولوية قصوى (أحمر): رصد علامات إنذار حرجة (#ED-201)',
              en: 'Priority 1 (Red): Critical Red Flags Identified (#ED-201)',
            },
          },
          triageCardConfig: {
            patientCode: 'ED-201-FICT',
            fictionalCaseName: {
              ar: 'الحالة الخيالية (أ) — اشتباه عدوى جهازية حرجة',
              en: 'Fictional Case A — Suspected Systemic Red Flags',
            },
            ageGroup: {
              ar: 'بالغ (62 سنة - سيناريو تعليمي)',
              en: 'Adult (62y - Educational Scenario)',
            },
            chiefComplaint: {
              ar: 'حمى شديدة مع قشعريرة، تسارع تنفس، ودوار شديد منذ صباح اليوم',
              en: 'High fever with rigors, rapid breathing, and severe dizziness since morning',
            },
            vitals: {
              temp: '39.4 °C',
              hr: '124 bpm',
              rr: '28 /min',
              spo2: '90%',
              bp: '88/54 mmHg',
            },
            allergyAlert: {
              ar: 'لا توجد حساسية مسجلة مسبقاً (يُتحقق منها مع المرافق)',
              en: 'No known drug allergies on file (verify with family)',
            },
            redFlags: [
              { ar: 'هبوط ضغط الدم (88/54)', en: 'Hypotension (88/54)' },
              { ar: 'انخفاض الأكسجين (SpO2 90%)', en: 'Hypoxemia (SpO2 90%)' },
              { ar: 'تسارع التنفس (28/دقيقة)', en: 'Tachypnea (RR 28/min)' },
            ],
          },
          puzzleSteps: [
            {
              id: 'er1_tb_s1',
              prompt: {
                ar: 'بمقارنة العلامات الحيوية للحالة الخيالية (أ) أعلاه [ضغط 88/54، أكسجين 90%، تنفس 28/دقيقة] مع الحالة الخيالية (ب) [زكام بسيط وعلامات حيوية طبيعية 100%]، كيف تحدد أولوية الفرز (Triage)؟',
                en: 'Comparing Fictional Case A above [BP 88/54, SpO2 90%, RR 28/min] with Fictional Case B [mild cold, 100% normal vitals], how should triage priority be assigned?',
              },
              options: [
                {
                  id: 'er1_tb_o1',
                  label: {
                    ar: 'الحالة (أ) أولوية طوارئ قصوى فورية (Red Flag Escalation) لإدخالها لغرفة الإنعاش واستدعاء الطبيب فوراً',
                    en: 'Case A is top immediate emergency priority (Red Flag Escalation) for resuscitation bay and instant physician evaluation',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'قرار سليم وحاسم! اجتماع الحمى مع هبوط الضغط وانخفاض الأكسجين وتسارع التنفس يمثل علامات إنذار خطرة تستدعي تدخلاً طبياً طارئاً.',
                    en: 'Critical and correct! Fever combined with hypotension, hypoxia, and tachypnea are emergency red flags requiring immediate physician intervention.',
                  },
                },
                {
                  id: 'er1_tb_o2',
                  label: {
                    ar: 'البدء بالحالة (ب) أولاً لأنها تطلب مضاداً حيوياً للزكام وترك الحالة (أ) في قاعة الانتظار',
                    en: 'See Case B first to hand out an antibiotic for a cold and leave Case A waiting',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'خطر شديد! تأخير تقييم مريض يعاني من هبوط ضغط ونقص أكسجين يهدد الحياة، كما أن الزكام لا يعالج بالمضادات.',
                    en: 'Extremely unsafe! Delaying care for hypotension and hypoxia is life-threatening, and colds do not need antibiotics.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'لوحة الفرز (#ED-201): تمييز علامات الإنذار الحرجة (نقص الأكسجين وهبوط الضغط) وتصعيدها الفوري.',
            en: 'Triage Board (#ED-201): Recognized critical red flags (hypoxia and hypotension) for immediate escalation.',
          },
        },
        {
          id: 'prop-er1-hand-hygiene',
          name: {
            ar: 'محطة نظافة اليدين ومكافحة العدوى قبل ملامسة المريض',
            en: 'Hand Hygiene & IPC Dispenser Station (Moment 1)',
          },
          stationLabel: {
            ar: 'محطة تعقيم اليدين 3D',
            en: '3D Hand Hygiene Station',
          },
          position: [2.8, 0, 2.2],
          color: 0x059669,
          accentColor: 0x34d399,
          iconEmoji: '🧴',
          shape: 'hand_hygiene_station',
          rewardItem: {
            id: 'clue-er1-hygiene',
            icon: '🧴',
            label: {
              ar: 'تعقيم اليدين: تم تطبيق اللحظة ١ لمنظمة الصحة العالمية',
              en: 'Hand Hygiene: WHO Moment 1 Completed',
            },
          },
          puzzleSteps: [
            {
              id: 'er1_hh_s1',
              prompt: {
                ar: 'قبل الدخول لفحص المريض في سرير الطوارئ أو تركيب أي أجهزة مراقبة، ما الإجراء الأساسي لمنع نقل الميكروبات المقاومة داخل قسم الطوارئ؟',
                en: 'Before approaching the patient stretcher or attaching monitoring equipment, what essential infection-prevention step must be performed?',
              },
              options: [
                {
                  id: 'er1_hh_o1',
                  label: {
                    ar: 'تطهير اليدين بالمطهر الكحولي (20–30 ثانية) وارتداء القفازات النظيفة عند اللزوم (اللحظة الأولى لـ WHO)',
                    en: 'Perform alcohol-based hand rub (20–30 seconds) and don clean gloves as indicated (WHO Moment 1: Before touching a patient)',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'ممتاز! نظافة اليدين في الطوارئ تحمي المرضى الحرجين من العدوى المكتسبة.',
                    en: 'Excellent! Hand hygiene in the ED protects vulnerable patients from healthcare-associated infections.',
                  },
                },
                {
                  id: 'er1_hh_o2',
                  label: {
                    ar: 'إهمال تعقيم اليدين لأن الطوارئ لا وقت فيها للنظافة',
                    en: 'Skip hand hygiene altogether because the ER is busy',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'غير مقبول طبياً؛ الدلك الكحولي يستغرق ثواني معدودة ويمنع انتقال البكتيريا المقاومة.',
                    en: 'Unacceptable; alcohol hand rub takes seconds and prevents cross-transmission of resistant pathogens.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'محطة التعقيم: تطبيق اللحظة الأولى لنظافة اليدين قبل ملامسة المريض.',
            en: 'Hand Hygiene Station: Applied WHO Moment 1 hand antisepsis before patient contact.',
          },
        },
      ],
      nodes: {
        er1_start: {
          id: 'er1_start',
          speaker: 'triageNurse',
          targetNpc: 'triageNurse',
          objectiveHint: {
            ar: 'تحدث مع الممرضة هدى عند مكتب الفرز لبدء السيناريو الأول',
            en: 'Speak with Nurse Huda at the Triage Desk to start Scenario 1',
          },
          dialogue: {
            ar: 'أهلاً بك في مناوبة الطوارئ! لدينا حالتان خياليتان في منطقة الاستقبال الآن. افحص أولاً «لوحة الفرز 3D» لتحديد الحالة ذات علامات الإنذار الحرجة (Red Flags)، وطهّر يديك في «محطة تعقيم اليدين 3D»، ثم أبلغ د. طارق فوراً!',
            en: 'Welcome to the ED shift! We have two fictional arrivals in reception. First inspect the 3D Triage Vitals Board to identify the critical red-flag case, sanitize your hands at the 3D Hand Hygiene Station, and escalate to Dr. Tarek!',
          },
          choices: [
            {
              id: 'er1_c1_go',
              label: {
                ar: 'سأفحص لوحة الفرز ومحطة تعقيم اليدين فوراً لتصعيد الحالة الحرجة',
                en: 'I will inspect the Triage Board and Hand Hygiene Station right away to escalate the critical case',
              },
              nextNodeId: 'er1_doctor_escalate',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'تحرك سريع ومنظم! أكمل فحص المحطتين المضيئتين ثم توجه إلى د. طارق.',
                en: 'Fast, structured response! Complete both glowing 3D stations, then report to Dr. Tarek.',
              },
              rationale: {
                ar: 'الفرز المبني على العلامات الحيوية يمنع تأخر إنقاذ الحالات الحرجة.',
                en: 'Vitals-driven triage prevents dangerous delays in critical care.',
              },
            },
          ],
        },
        er1_doctor_escalate: {
          id: 'er1_doctor_escalate',
          speaker: 'erAttending',
          targetNpc: 'erAttending',
          objectiveHint: {
            ar: 'بعد حل لوحة الفرز ومحطة التعقيم، تحدث مع د. طارق لتصعيد الحالة #ED-201',
            en: 'After completing the Triage Board and Hand Hygiene stations, speak with Dr. Tarek',
          },
          dialogue: {
            ar: 'أحسنت في رصد علامات الإنذار وتصعيد الحالة (أ) فوراً لغرفة الإنعاش! بينما يبدأ الفريق الطبي المختص بروتوكول الطوارئ وسحب المزارع، ماذا نقول للمريض في الحالة الخيالية (ب) الذي يعاني من عطس بسيط بلا حمى ويطالب بمضاد حيوي؟',
            en: 'Great job recognizing the red flags and escalating Case A immediately! While the medical team initiates emergency stabilization for Case A, how should we counsel Fictional Case B, who has mild sneezing without fever and asks for an antibiotic?',
          },
          choices: [
            {
              id: 'er1_c2_optimal',
              label: {
                ar: 'نوضح بلطف أن الزكام الفيروسي البسيط لا يستجيب للمضادات الحيوية، مع تقديم إرشادات الراحة والسوائل وعلامات الإنذار التي تستدعي العودة للطبيب',
                en: 'Explain kindly that a mild viral cold does not respond to antibiotics, and provide supportive care guidance plus warning signs that warrant medical re-evaluation',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'ممتاز! جمعت بين سرعة التصعيد الطبي للحالة الحرجة والتثقيف الآمن للحالة الفيروسية البسيطة.',
                en: 'Excellent! You combined rapid escalation for the critical patient with safe stewardship education for the viral cold.',
              },
              rationale: {
                ar: 'التوعية الواضحة بعلامات الإنذار تطمئن المريض وتحميه من الاستخدام الخاطئ للمضادات.',
                en: 'Clear red-flag education reassures patients while preventing unnecessary antibiotic use.',
              },
            },
            {
              id: 'er1_c2_unsafe',
              label: {
                ar: 'صرف مضاد حيوي للحالة (ب) لمجرد إرضائه وإنهاء النقاش بسرعة',
                en: 'Give Case B an antibiotic just to satisfy the request and end the conversation quickly',
              },
              nextNodeId: 'END',
              quality: 'unsafe',
              immediateFeedback: {
                ar: 'غير سليم! صرف المضادات الحيوية للرشح الفيروسي يضر المريض ويزيد المقاومة البكتيرية.',
                en: 'Unsafe! Prescribing or dispensing antibiotics for a viral cold harms patients and accelerates resistance.',
              },
              rationale: {
                ar: 'التواصل التثقيفي الهادئ يغني عن الوصف غير المبرر.',
                en: 'Empathetic patient education replaces unnecessary antibiotic prescribing.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'تحديد أولوية الفرز لعلامات الإنذار الحرجة (هبوط الضغط ونقص الأكسجين) وتصعيدها الفوري للطبيب، مع رفض المضاد العشوائي للزكام.',
        en: 'Prioritizing critical red flags (hypotension and hypoxia) for immediate physician escalation while avoiding antibiotics for a viral cold.',
      },
      educationalTakeaway: {
        ar: 'في الطوارئ، علامات الإنذار (ضيق التنفس، زرقة الشفاه، هبوط الضغط، التشوش الذهني، الحمى الشديدة) تستوجب تدخلاً طبياً عاجلاً، بينما نزلات البرد البسيطة لا تعالج بالمضادات الحيوية.',
        en: 'Emergency warning signs (shortness of breath, hypoxia, low blood pressure, confusion, persistent high fever) require immediate medical care, whereas mild colds do not require antibiotics.',
      },
      escalationGuidance: {
        ar: 'في الواقع: عند ملاحظة أي علامة إنذار خطرة لدى أي شخص، اتصل بالإسعاف (123 في مصر) أو توجه لأقرب قسم طوارئ فوراً ولا تعتمد على أي تطبيق أو لعبة.',
        en: 'In real life: if any emergency warning signs appear, call emergency services (123 in Egypt) or go to the nearest ER immediately.',
      },
      sources: [
        {
          title: 'WHO — Emergency Triage Assessment and Treatment (ETAT) Principles',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/publications/i/item/9241546875',
        },
        {
          title: 'CDC — Sepsis Signs and Symptoms (Act Fast)',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/sepsis/signs-symptoms/index.html',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SCENARIO 2 — Severe Penicillin Allergy Check & Cross-Reactivity Prevention
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'er-shift-2-penicillin-allergy-check',
      missionIndex: 2,
      requiredMissionId: 'er-shift-1-triage-red-flags',
      unlockRequirementText: {
        ar: 'أكمل السيناريو ١ (أولوية الفرز وعلامات الإنذار) أولاً لفتح هذا السيناريو',
        en: 'Complete Scenario 1 (Triage Priority & Red Flags) first to unlock this scenario',
      },
      accentHex: 0xd97706,
      title: {
        ar: 'السيناريو ٢ — فحص الحساسية الدوائية ومنع صدمة الحساسية (Anaphylaxis)',
        en: 'Scenario 2 — Allergy Verification & Preventing Beta-Lactam Anaphylaxis',
      },
      subtitle: {
        ar: 'تحدث مع المريض الخيالي (#ED-202)، افحص سوار الحساسية الأحمر، وامنع إعطاء مضاد بيتا-لاكتام لمريض لديه تاريخ صدمة تحسسية',
        en: 'Interview fictional patient #ED-202, inspect the red allergy wristband station, and prevent unsafe beta-lactam exposure',
      },
      categoryBadge: {
        ar: 'سلامة الحساسية الدوائية',
        en: 'Drug Allergy Safety Workflow',
      },
      badgeIcon: '🛡️',
      badgeTitle: {
        ar: 'وسام حارس سلامة الحساسية الدوائية',
        en: 'Allergy Safety Shield Guardian',
      },
      primaryNpc: 'erPatient',
      briefing: {
        ar: 'في عنبر الطوارئ، يعاني المريض الخيالي (#ED-202) من التهاب بكتيري حاد يستدعي علاجاً يحدده الطبيب، لكنه يرتدي سواراً أحمر في معصمه. تحدث مع المريض، ثم افحص «محطة فحص الحساسية والسوار الطبي 3D» واستشر الصيدلي د. ياسر ود. طارق.',
        en: 'In the ED bay, fictional patient #ED-202 has an acute bacterial infection requiring physician-directed care, and is wearing a red wristband. Speak with the patient, inspect the 3D Allergy & Wristband Scanner, and consult Pharmacist Dr. Yasser and Dr. Tarek.',
      },
      initialNodeId: 'er2_patient_talk',
      requirePropsSolvedBeforeNodeId: 'er2_pharmacist_consult',
      interactiveProps: [
        {
          id: 'prop-er2-allergy-scanner',
          name: {
            ar: 'محطة فحص سوار الحساسية والسجل الدوائي (#ED-202)',
            en: 'Allergy Wristband & Medication Record Scanner (#ED-202)',
          },
          stationLabel: {
            ar: 'فاحص الحساسية والسوار 3D',
            en: '3D Allergy Wristband Scanner',
          },
          position: [-3.4, 0, 2.2],
          color: 0xd97706,
          accentColor: 0xfacc15,
          iconEmoji: '🛑',
          shape: 'allergy_scanner',
          rewardItem: {
            id: 'clue-er2-allergy',
            icon: '🛑',
            label: {
              ar: 'تنبيه أحمر: صدمة تحسسية سابقة (Anaphylaxis) للأموكسيسيلين',
              en: 'Red Alert: Prior IgE Anaphylaxis to Amoxicillin',
            },
          },
          triageCardConfig: {
            patientCode: 'ED-202-FICT',
            fictionalCaseName: {
              ar: 'الحالة الخيالية (#ED-202) — التهاب خلوي بكتيري حاد مع حساسية خطرة',
              en: 'Fictional Case #ED-202 — Acute Bacterial Infection + Severe Allergy',
            },
            ageGroup: {
              ar: 'بالغ (38 سنة - سيناريو تعليمي)',
              en: 'Adult (38y - Educational Scenario)',
            },
            chiefComplaint: {
              ar: 'تورم واحمرار وحمى (38.6°C) مع تاريخ سابق لتورم الحنجرة وضيق تنفس بعد كبسولة أموكسيسيلين',
              en: 'Local swelling, fever (38.6°C), and history of throat swelling/wheezing after amoxicillin',
            },
            vitals: {
              temp: '38.6 °C',
              hr: '98 bpm',
              rr: '18 /min',
              spo2: '98%',
              bp: '122/78 mmHg',
            },
            allergyAlert: {
              ar: 'حساسية مفرطة موثقة (Anaphylaxis): بنسلين / أموكسيسيلين (تورم بالحلق والشفتين وهبوط ضغط سابق)',
              en: 'Documented Anaphylaxis: Penicillin / Amoxicillin (prior angioedema, wheezing, hypotension)',
            },
            redFlags: [
              { ar: 'حساسية بيتا-لاكتام مهددة للحياة (تجنب البنسلينات)', en: 'Life-Threatening Beta-Lactam Allergy' },
            ],
          },
          puzzleSteps: [
            {
              id: 'er2_al_s1',
              prompt: {
                ar: 'يُظهر سجل المريض الخيالي (#ED-202) حدوث «تورم في الحلق واللسان مع صفير تنفسي وهبوط ضغط (Anaphylaxis)» بعد تناول قرص يحتوي على أموكسيسيلين/كلافولانات سابقاً. لماذا يمثل هذا التاريخ خطراً دوائياً حرجاً؟',
                en: 'Fictional patient #ED-202’s chart documents prior throat/tongue swelling, wheezing, and hypotension (anaphylaxis) after taking amoxicillin/clavulanate. Why is this history critically important?',
              },
              hint: {
                ar: 'الأموكسيسيلين ينتمي لعائلة البنسلينات (Beta-lactams)، وإعادة إعطائه تحت اسم تجاري مختلف قد تسبب صدمة تحسسية قاتلة.',
                en: 'Amoxicillin is a penicillin (beta-lactam); re-exposure under a different brand name can trigger fatal anaphylaxis.',
              },
              options: [
                {
                  id: 'er2_al_o1',
                  label: {
                    ar: 'لأنها حساسية مفرطة مهددة للحياة (IgE-mediated Anaphylaxis) تمنع إعطاء أي دواء من عائلة البنسلينات (مهما اختلف اسمه التجاري) وتتطلب بديلاً يحدده الطبيب والصيدلي',
                    en: 'Because it is life-threatening IgE-mediated anaphylaxis—all penicillin brands must be strictly avoided and the physician/pharmacist must select a safe alternative class',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'تحليل ممتاز! كثير من الحوادث تقع بسبب إعطاء نفس المادة الفعالة (Amoxicillin) تحت اسم تجاري آخر دون فحص التركيب العلمي.',
                    en: 'Spot on! Many severe allergic incidents happen when a patient receives the same generic penicillin under an unfamiliar brand name.',
                  },
                },
                {
                  id: 'er2_al_o2',
                  label: {
                    ar: 'لا بأس من إعطائه أموكسيسيلين إذا غيرنا شركة الدواء أو الاسم التجاري فقط',
                    en: 'It is fine to give amoxicillin again as long as we pick a different commercial brand name',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'خطأ قاتل! جهاز المناعة يتفاعل مع المادة الكيميائية (البنسلين/الأموكسيسيلين) بغض النظر عن الاسم التجاري.',
                    en: 'Dangerous error! The immune system reacts to the chemical structure (amoxicillin/penicillin) regardless of the commercial brand name.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'فاحص الحساسية (#ED-202): توثيق حساسية البنسلين المفرطة ومنع التكرار تحت أسماء تجارية مختلفة.',
            en: 'Allergy Scanner (#ED-202): Documented severe penicillin anaphylaxis and blocked brand-name re-exposure.',
          },
        },
      ],
      nodes: {
        er2_patient_talk: {
          id: 'er2_patient_talk',
          speaker: 'erPatient',
          targetNpc: 'erPatient',
          objectiveHint: {
            ar: 'تحدث مع المريض في سرير الطوارئ (Bay 1) لجمع تاريخ الأعراض والحساسية',
            en: 'Talk to the patient in the ED Stretcher Bay to gather symptom and allergy history',
          },
          dialogue: {
            ar: 'مرحباً يا دكتور! لدي التهاب شديد ومؤلم، لكن أرجوك انتبه: في العام الماضي تناولت مضاداً حيوياً يحتوي على «أموكسيسيلين» فتورم وجهي وحلقي وكدت أختنق في دقائق! ماذا يجب أن نفعل قبل صرف أي علاج؟',
            en: 'Hello! I have a painful acute infection, but please be careful: last year I took an antibiotic containing amoxicillin and my face and throat swelled up within minutes! What should we do before any medication is ordered?',
          },
          choices: [
            {
              id: 'er2_c1_good',
              label: {
                ar: 'أطمئنك تماماً؛ سنوثّق الحساسية المفرطة فوراً في محطة السوار الطبي 3D ونراجع الصيدلي السريري والطبيب لاختيار بديل آمن تماماً',
                en: 'We will document your severe allergy immediately at the 3D Allergy Scanner and consult the clinical pharmacist and physician for a safe non-penicillin protocol',
              },
              nextNodeId: 'er2_pharmacist_consult',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'استجابة مهنية مطمئنة! توجه الآن لفحص «محطة فحص الحساسية 3D» بجوار السرير ثم تحدث مع الصيدلي د. ياسر.',
                en: 'Reassuring, safe response! Inspect the 3D Allergy Wristband Scanner beside the bed, then speak with Pharmacist Dr. Yasser.',
              },
              rationale: {
                ar: 'الاستماع لتاريخ الحساسية من المريض وتوثيقه خط الدفاع الأول ضد صدمة الحساسية.',
                en: 'Listening carefully to a patient’s allergy history and documenting it is the first line of defense against anaphylaxis.',
              },
            },
            {
              id: 'er2_c1_bad',
              label: {
                ar: 'تجاهل كلام المريض لأن الحساسية نادرة الحدوث',
                en: 'Ignore the patient’s report because severe allergies are rare',
              },
              nextNodeId: 'er2_pharmacist_consult',
              quality: 'unsafe',
              immediateFeedback: {
                ar: 'خطر جسيم! تجاهل تاريخ صدمة تحسسية سابقة قد يؤدي لتوقف التنفس والوفاة.',
                en: 'Grave danger! Ignoring a history of prior anaphylaxis can result in airway obstruction and death.',
              },
              rationale: {
                ar: 'التحقق من الحساسية الدوائية خطوة إلزامية قبل أي وصف أو إعطاء دوائي.',
                en: 'Allergy verification is mandatory before prescribing or administering any antimicrobial.',
              },
            },
          ],
        },
        er2_pharmacist_consult: {
          id: 'er2_pharmacist_consult',
          speaker: 'erPharmacist',
          targetNpc: 'erPharmacist',
          objectiveHint: {
            ar: 'بعد فحص محطة الحساسية 3D، تحدث مع الصيدلي د. ياسر لمراجعة بروتوكول البدائل الآمنة',
            en: 'After inspecting the 3D Allergy Scanner, talk to Pharmacist Dr. Yasser to review safe escalation',
          },
          dialogue: {
            ar: 'أحسنت في توثيق تنبيه الحساسية الحمراء للحالة الخيالية (#ED-202)! ما القاعدة الأساسية التي يجب أن يعرفها كل مريض لديه حساسية من البنسلين عند زيارة أي طبيب أو صيدلية؟',
            en: 'Great work documenting the red allergy alert for fictional case #ED-202! What essential safety rule should every patient with a penicillin allergy know when visiting any doctor or pharmacy?',
          },
          choices: [
            {
              id: 'er2_c2_optimal',
              label: {
                ar: 'إبلاغ الطبيب والصيدلي دائماً باسم المادة الفعالة (بنسلين/أموكسيسيلين) ووصف طبيعة التفاعل بدقة، وعدم تناول أي دواء دون مراجعة تركيبه العلمي',
                en: 'Always inform the doctor and pharmacist of the generic drug name (penicillin/amoxicillin) and exact reaction type, and never take any medication without verifying its active ingredients',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'ممتاز! أكملت السيناريو الثاني بنجاح وفتحت السيناريو الثالث.',
                en: 'Excellent! You completed Scenario 2 and unlocked Scenario 3.',
              },
              rationale: {
                ar: 'معرفة الاسم العلمي (Generic Name) والتفرقة بين الحساسية الحقيقية والآثار الجانبية البسيطة تحمي حياة المريض.',
                en: 'Knowing generic ingredient names and communicating reaction severity protects patient lives.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'التحقق المنهجي من تاريخ صدمة الحساسية (Anaphylaxis) للبنسلين وتنبيه الفريق الطبي والصيدلي لمنع التعرض الخاطئ.',
        en: 'Systematically verifying a history of penicillin anaphylaxis and alerting the clinical and pharmacy team to prevent re-exposure.',
      },
      educationalTakeaway: {
        ar: 'قد يشترك أكثر من ٢٠ دواءً تجارياً في نفس المادة الفعالة (مثل الأموكسيسيلين). إفصاح المريض عن حساسيته وفحص الصيدلي والطبيب للتركيب العلمي يمنع تفاعلات الحساسية المهددة للحياة.',
        en: 'Dozens of commercial brand names can contain the same active penicillin ingredient. Communicating allergies and checking generic composition prevents life-threatening reactions.',
      },
      escalationGuidance: {
        ar: 'في الواقع: إذا ظهر طفح جلدي منتشر، تورم في الوجه أو اللسان، أو ضيق تنفس بعد تناول أي دواء، اتصل بالإسعاف (123) أو توجه للطوارئ فوراً.',
        en: 'In real life: if hives, facial/tongue swelling, or trouble breathing occur after taking any medicine, call emergency services (123) or go to the ER immediately.',
      },
      sources: [
        {
          title: 'CDC — Penicillin Allergy Fact Sheet & Evaluation',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/antibiotic-use/core-elements/hospital.html',
        },
        {
          title: 'Egyptian Drug Authority (EDA) — Pharmacovigilance & Patient Safety',
          publisher: 'EDA Egypt',
          url: 'https://edaegypt.gov.eg',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SCENARIO 3 — Pediatric Respiratory Red Flags vs. Leftover Antibiotics
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'er-shift-3-pediatric-viral-croup',
      missionIndex: 3,
      requiredMissionId: 'er-shift-2-penicillin-allergy-check',
      unlockRequirementText: {
        ar: 'أكمل السيناريو ٢ (فحص الحساسية الدوائية) أولاً لفتح هذا السيناريو',
        en: 'Complete Scenario 2 (Allergy Verification) first to unlock this scenario',
      },
      accentHex: 0x0284c7,
      title: {
        ar: 'السيناريو ٣ — طوارئ الأطفال: صرير تنفسي وعلامات إنذار أم بقايا مضاد منزلي؟',
        en: 'Scenario 3 — Pediatric ER: Airway Red Flags vs. Leftover Home Antibiotics',
      },
      subtitle: {
        ar: 'قيّم حالة طفل خيالي (#ED-203) أحضره والده بعد محاولة إعطائه شراب مضاد حيوي قديم محفوظ في باب الثلاجة',
        en: 'Assess fictional pediatric case #ED-203 brought in after parents considered giving an old reconstituted antibiotic suspension',
      },
      categoryBadge: {
        ar: 'سلامة الأطفال وعلامات الإنذار',
        en: 'Pediatric Safety & Airway Red Flags',
      },
      badgeIcon: '🧸',
      badgeTitle: {
        ar: 'وسام حماية الطفل في الطوارئ',
        en: 'Pediatric ED Safety Advocate',
      },
      primaryNpc: 'triageNurse',
      briefing: {
        ar: 'وصل والد قلق إلى قسم الطوارئ مع طفله الخيالي (#ED-203) الذي يعاني من سعال نباحي وانسحاب بين الضلوع أثناء التنفس، ويحمل زجاجة مضاد حيوي محلولة منذ ٣ أشهر كان ينوي إعطاءها للطفل. افحص «شاشة طوارئ الأطفال 3D» وتحدث مع الممرضة هدى ود. طارق.',
        en: 'A worried parent arrived in the ED with fictional child #ED-203 who has a barking cough and chest wall retractions, holding a 3-month-old reconstituted antibiotic bottle from home. Inspect the 3D Pediatric Monitor and speak with Nurse Huda and Dr. Tarek.',
      },
      initialNodeId: 'er3_start',
      requirePropsSolvedBeforeNodeId: 'er3_attending',
      interactiveProps: [
        {
          id: 'prop-er3-peds-monitor',
          name: {
            ar: 'شاشة تقييم تنفس الطفل وفحص الدواء المنزلي (#ED-203)',
            en: 'Pediatric Airway Monitor & Leftover Suspension Check (#ED-203)',
          },
          stationLabel: {
            ar: 'شاشة طوارئ الأطفال 3D',
            en: '3D Pediatric Airway Monitor',
          },
          position: [-3.4, 0, 4.6],
          color: 0x0284c7,
          accentColor: 0x38bdf8,
          iconEmoji: '🧸',
          shape: 'pediatric_airway_monitor',
          rewardItem: {
            id: 'clue-er3-peds',
            icon: '🧸',
            label: {
              ar: 'تنبيه أطفال: علامة إنذار بمجرى الهواء + منع استخدام شراب قديم تالف',
              en: 'Pediatric Clue: Airway Red Flag + Expired Leftover Suspension Blocked',
            },
          },
          triageCardConfig: {
            patientCode: 'ED-203-PEDS',
            fictionalCaseName: {
              ar: 'الحالة الخيالية (#ED-203) — طفل يعاني من سعال نباحي وضيق تنفس ليلي',
              en: 'Fictional Case #ED-203 — Pediatric Barking Cough & Stridor',
            },
            ageGroup: {
              ar: 'طفل (3 سنوات - سيناريو تعليمي خيالي)',
              en: 'Child (3y - Fictional Educational Scenario)',
            },
            chiefComplaint: {
              ar: 'سعال نباحي مفاجئ ليلاً مع صوت صرير تنفسي (Stridor) وانسحاب بين الضلوع',
              en: 'Sudden nighttime barking cough with inspiratory stridor and intercostal retractions',
            },
            vitals: {
              temp: '38.1 °C',
              hr: '136 bpm',
              rr: '36 /min',
              spo2: '93%',
              bp: '95/60 mmHg',
            },
            allergyAlert: {
              ar: 'لا توجد حساسية معروفة — تنبيه: الأب أحضر زجاجة مضاد حيوي محلولة منذ 90 يوماً',
              en: 'No known allergies — Alert: Parent brought a 90-day-old reconstituted antibiotic bottle',
            },
            redFlags: [
              { ar: 'صرير تنفسي أثناء الراحة (Stridor at rest)', en: 'Stridor at Rest (Airway Red Flag)' },
              { ar: 'انسحاب بين الضلوع وتسارع تنفس', en: 'Chest Wall Retractions & Tachypnea' },
            ],
          },
          puzzleSteps: [
            {
              id: 'er3_pm_s1',
              prompt: {
                ar: 'في الحالة الخيالية (#ED-203)، يعاني الطفل من صرير تنفسي وانسحاب بين الضلوع، وكان الأهل على وشك إعطائه شراب مضاد حيوي قديم تم حلّه بالماء قبل ٣ أشهر في المنزل. ما الخطآن الجسيمان لو تم الاكتفاء بهذا المضاد المنزلي؟',
                en: 'In fictional case #ED-203, the child has stridor at rest and chest retractions, and the family nearly gave a 3-month-old reconstituted antibiotic suspension at home. What two major dangers would that pose?',
              },
              options: [
                {
                  id: 'er3_pm_o1',
                  label: {
                    ar: 'أولاً: تأخير إسعاف مجرى الهواء الطارئ في الطوارئ؛ ثانياً: معلقات المضادات المحلولة بالماء تتلف بعد 7–14 يوماً ولا تفيد في الخناق الفيروسي (Viral Croup)',
                    en: 'First: delaying urgent ER airway care for stridor/retractions; Second: reconstituted suspensions expire after 7–14 days and antibiotics do not treat viral croup',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'إجابة شاملة ودقيقة! علامات ضيق التنفس عند الأطفال تتطلب تقييم طبيب الطوارئ فوراً، ومعلقات المضادات المحلولة سابقاً يجب التخلص منها بأمان بعد انتهاء كورس العلاج.',
                    en: 'Comprehensive and accurate! Pediatric respiratory distress requires urgent ER physician care, and leftover reconstituted suspensions must never be reused.',
                  },
                },
                {
                  id: 'er3_pm_o2',
                  label: {
                    ar: 'المضاد الحيوي المحلول بالماء يظل صالحاً لسنوات في الثلاجة ويعالج ضيق التنفس في دقائق',
                    en: 'Reconstituted liquid antibiotics last for years in the fridge and cure airway narrowing in minutes',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'معلومة خاطئة وخطيرة! المعلقات المحلولة بالماء تفقد فعاليتها وقد تتحلل كيميائياً بعد أسبوع إلى أسبوعين، ولا تعالج تورم مجرى الهواء الطارئ.',
                    en: 'False and dangerous! Reconstituted suspensions degrade after 7–14 days and do not relieve acute airway obstruction.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'شاشة طوارئ الأطفال (#ED-203): رصد علامات إنذار مجرى الهواء ومنع استخدام معلق مضاد حيوي قديم تالف.',
            en: 'Pediatric Monitor (#ED-203): Identified airway red flags and prevented use of degraded leftover antibiotic suspension.',
          },
        },
      ],
      nodes: {
        er3_start: {
          id: 'er3_start',
          speaker: 'triageNurse',
          targetNpc: 'triageNurse',
          objectiveHint: {
            ar: 'تحدث مع الممرضة هدى لبدء السيناريو الثالث (طوارئ الأطفال)',
            en: 'Speak with Nurse Huda to start Scenario 3 (Pediatric ER)',
          },
          dialogue: {
            ar: 'وصل طفل في الثالثة من عمره (الحالة الخيالية #ED-203) مع والده وهو يعاني من سعال نباحي وصوت صرير عند الشهيق. افحص «شاشة طوارئ الأطفال 3D» في قسم الملاحظة، ثم صعّد الحالة فوراً إلى د. طارق!',
            en: 'A fictional 3-year-old child (#ED-203) arrived with a barking cough and inspiratory stridor. Inspect the 3D Pediatric Airway Monitor in the observation bay, then escalate immediately to Dr. Tarek!',
          },
          choices: [
            {
              id: 'er3_c1_go',
              label: {
                ar: 'سأفحص شاشة طوارئ الأطفال 3D وأصعّد الحالة فوراً للطبيب',
                en: 'I will inspect the 3D Pediatric Airway Monitor and escalate immediately to the physician',
              },
              nextNodeId: 'er3_attending',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'أحسنت! توجه إلى شاشة طوارئ الأطفال المضيئة 3D ثم تحدث مع د. طارق.',
                en: 'Well done! Walk to the glowing 3D Pediatric Monitor, then speak with Dr. Tarek.',
              },
              rationale: {
                ar: 'الصرير التنفسي وانسحاب الضلوع عند الأطفال من علامات الإنذار القصوى.',
                en: 'Stridor at rest and chest retractions in children are high-priority emergency warning signs.',
              },
            },
          ],
        },
        er3_attending: {
          id: 'er3_attending',
          speaker: 'erAttending',
          targetNpc: 'erAttending',
          objectiveHint: {
            ar: 'بعد فحص شاشة طوارئ الأطفال 3D، تحدث مع د. طارق لإتمام السيناريو ٣',
            en: 'After inspecting the 3D Pediatric Monitor, speak with Dr. Tarek to complete Scenario 3',
          },
          dialogue: {
            ar: 'شكراً لتصعيدك الفوري! بدأ الفريق الطبي المختص رعاية مجرى الهواء للطفل في غرفة الطوارئ. ما النصيحة التوعوية الأهم التي نقدمها للأهل بخصوص زجاجة المضاد الحيوي القديمة المحفوظة منذ شهور؟',
            en: 'Thank you for the rapid escalation! The medical team has initiated airway care for the child. What key educational advice should we share with the parents regarding the months-old reconstituted antibiotic bottle?',
          },
          choices: [
            {
              id: 'er3_c2_optimal',
              label: {
                ar: 'عدم الاحتفاظ أبداً ببقايا شراب المضاد الحيوي بعد انتهاء العلاج الموصوف، وعدم إعطاء أي دواء لطفل دون فحص الطبيب وحساب الجرعة حسب الوزن الحالي',
                en: 'Never save leftover reconstituted liquid antibiotics after a prescribed course, and never give any antibiotic to a child without a physician exam and weight-based evaluation',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'ممتاز! أكملت السيناريو الثالث بنجاح وفتحت السيناريو الرابع والأخير.',
                en: 'Excellent! You completed Scenario 3 and unlocked Scenario 4.',
              },
              rationale: {
                ar: 'أدوية الأطفال تتطلب تقييماً طبياً دقيقاً وصلاحية مضمونة، وبقايا المعلقات المحلولة تفقد فعاليتها سريعاً.',
                en: 'Pediatric medications require fresh preparation and clinician evaluation; leftover suspensions quickly lose potency.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'رصد علامات ضيق التنفس الطارئة عند الأطفال وتصعيدها فوراً، والتوعية بمخاطر بقايا أشربة المضادات الحيوية القديمة.',
        en: 'Recognizing pediatric airway red flags for urgent physician care and educating families against using expired leftover antibiotic suspensions.',
      },
      educationalTakeaway: {
        ar: 'انسحاب الصدر أو الصرير التنفسي أو الزرقة عند الطفل طوارئ طبية فورية. لا تعطِ طفلك أبداً بقايا مضاد حيوي قديم أو دواءً موصوفاً لطفل آخر.',
        en: 'Chest retractions, stridor, or cyanosis in a child are immediate medical emergencies. Never give a child leftover antibiotics or medication prescribed for someone else.',
      },
      escalationGuidance: {
        ar: 'في الواقع: توجه بأي طفل يعاني من صعوبة تنفس أو خمول شديد إلى أقرب طوارئ فوراً أو اتصل بالإسعاف (123).',
        en: 'In real life: take any child with breathing difficulty or lethargy to the nearest ER immediately or call emergency services (123).',
      },
      sources: [
        {
          title: 'WHO — Pocket Book of Hospital Care for Children',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/publications/i/item/978-92-4-154837-3',
        },
        {
          title: 'CDC — Antibiotic Prescribing and Use in Pediatrics',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/antibiotic-use/ index.html',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SCENARIO 4 — Infection Prevention, Isolation & Shift Handoff
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'er-shift-4-isolation-hand-hygiene',
      missionIndex: 4,
      requiredMissionId: 'er-shift-3-pediatric-viral-croup',
      unlockRequirementText: {
        ar: 'أكمل السيناريو ٣ (طوارئ الأطفال) أولاً لفتح السيناريو الختامي',
        en: 'Complete Scenario 3 (Pediatric ER) first to unlock the final scenario',
      },
      accentHex: 0x059669,
      title: {
        ar: 'السيناريو ٤ — مكافحة العدوى في الطوارئ وتسليم المناوبة الآمن',
        en: 'Scenario 4 — ED Infection Prevention & Safe Shift Handoff',
      },
      subtitle: {
        ar: 'طبّق إجراءات منع انتقال العدوى (اللحظات الخمس لنظافة اليدين والاحتياطات التلامسية) وسلّم المناوبة بأمان للفريق المناوب',
        en: 'Apply ED infection prevention workflows (WHO 5 Moments & contact precautions) and complete a structured clinical handoff',
      },
      categoryBadge: {
        ar: 'مكافحة العدوى وتسليم المناوبة',
        en: 'IPC Workflow & Shift Handoff',
      },
      badgeIcon: '🏆',
      badgeTitle: {
        ar: 'وسام قائد مناوبة الطوارئ الآمنة',
        en: 'Safe Emergency Shift Champion',
      },
      primaryNpc: 'erPharmacist',
      briefing: {
        ar: 'في نهاية مناوبة الطوارئ، نراجع حالة خيالية (#ED-204) تتطلب احتياطات تلامسية لمنع انتقال العدوى داخل القسم. افحص «محطة مكافحة العدوى وتعقيم اليدين 3D» وتحدث مع د. ياسر ود. طارق لإتمام تسليم المناوبة.',
        en: 'At the end of the ED shift, we review fictional case #ED-204 requiring contact precautions to prevent cross-transmission. Inspect the 3D IPC & Hand Hygiene Station and speak with Dr. Yasser and Dr. Tarek to complete shift handoff.',
      },
      initialNodeId: 'er4_start',
      requirePropsSolvedBeforeNodeId: 'er4_final',
      interactiveProps: [
        {
          id: 'prop-er4-ipc-station',
          name: {
            ar: 'محطة بروتوكول مكافحة العدوى واللحظات الخمس (#ED-204)',
            en: 'ED Infection Prevention & 5 Moments Station (#ED-204)',
          },
          stationLabel: {
            ar: 'محطة مكافحة العدوى 3D',
            en: '3D IPC Protocol Station',
          },
          position: [3.8, 0, 2.6],
          color: 0x059669,
          accentColor: 0x34d399,
          iconEmoji: '🧤',
          shape: 'hand_hygiene_station',
          rewardItem: {
            id: 'clue-er4-ipc',
            icon: '🛡️',
            label: {
              ar: 'بروتوكول IPC: غسل اليدين بالماء والصابون + خلع القفازات قبل مغادرة الغرفة',
              en: 'IPC Protocol: Soap & Water Wash + Safe PPE Doffing Verified',
            },
          },
          puzzleSteps: [
            {
              id: 'er4_ipc_s1',
              prompt: {
                ar: 'عند رعاية حالة خيالية (#ED-204) تعاني من إسهال حاد يُشتبه في ارتباطه ببكتيريا متبوغة (مثل C. difficile) بعد استخدام سابق غير مرشد للمضادات الحيوية، ما الخطوة الصحيحة لنظافة اليدين ومعدات الوقاية قبل الانتقال لمريض آخر؟',
                en: 'When caring for fictional case #ED-204 with acute diarrhea suspected to involve spore-forming bacteria (such as C. difficile) following prior antibiotic misuse, what is the proper hand hygiene and PPE step before seeing another patient?',
              },
              hint: {
                ar: 'الأبواغ البكتيرية تتطلب غسل اليدين جيداً بالماء والصابون بعد خلع القفازات.',
                en: 'Bacterial spores require thorough washing with soap and water after removing gloves.',
              },
              options: [
                {
                  id: 'er4_ipc_o1',
                  label: {
                    ar: 'خلع القفازات والرداء الواقي بأمان قبل مغادرة منطقة العزل، ثم غسل اليدين جيداً بالماء والصابون لإزالة الأبواغ البكتيرية',
                    en: 'Safely remove gloves and gown before leaving the isolation zone, then wash hands thoroughly with soap and water',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'ممتاز! الانتقال بنفس القفازات بين المرضى ينقل العدوى؛ يجب خلعها وغسل اليدين بالماء والصابون في حالات الأبواغ.',
                    en: 'Spot on! Wearing the same gloves between patients spreads infection; doff PPE and wash with soap and water for spore-forming pathogens.',
                  },
                },
                {
                  id: 'er4_ipc_o2',
                  label: {
                    ar: 'التجول بنفس القفازات في جميع أنحاء قسم الطوارئ ولمس أسرّة المرضى الآخرين',
                    en: 'Walk around the entire ER wearing the same gloves and touch other patient beds',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'ممارسة خطرة جداً! القفازات الملوثة تنقل الجراثيم من سرير لآخر؛ القفازات لا تغني أبداً عن نظافة اليدين.',
                    en: 'Extremely unsafe! Contaminated gloves transmit microbes across surfaces; gloves never replace hand hygiene.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'محطة مكافحة العدوى (#ED-204): خلع القفازات بأمان وغسل اليدين بالماء والصابون لمنع انتقال الأبواغ.',
            en: 'IPC Station (#ED-204): Safe glove removal and soap-and-water handwashing to prevent cross-transmission.',
          },
        },
      ],
      nodes: {
        er4_start: {
          id: 'er4_start',
          speaker: 'erPharmacist',
          targetNpc: 'erPharmacist',
          objectiveHint: {
            ar: 'تحدث مع الصيدلي د. ياسر عند وحدة سلامة الدواء لبدء السيناريو الرابع',
            en: 'Speak with Pharmacist Dr. Yasser at the Safety Station to start Scenario 4',
          },
          dialogue: {
            ar: 'وصلنا للمحطة الأخيرة في مناوبة الطوارئ! الاستخدام العشوائي للمضادات الحيوية قد يقضي على البكتيريا النافعة في الأمعاء ويسبب إسهالاً شديداً معديًا. افحص «محطة مكافحة العدوى 3D» ثم توجه إلى د. طارق لتسليم المناوبة.',
            en: 'We have reached the final scenario of Emergency Shift! Unnecessary antibiotic use can wipe out protective gut flora and trigger contagious diarrhea. Inspect the 3D IPC Station, then meet Dr. Tarek for shift handoff.',
          },
          choices: [
            {
              id: 'er4_c1_go',
              label: {
                ar: 'سأفحص محطة مكافحة العدوى 3D الآن ثم أتوجه لتسليم المناوبة',
                en: 'I will inspect the 3D IPC Station now and then proceed to shift handoff',
              },
              nextNodeId: 'er4_final',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'رائع! أتمم فحص المحطة ثلاثية الأبعاد ثم تحدث مع د. طارق.',
                en: 'Great! Complete the 3D station inspection, then speak with Dr. Tarek.',
              },
              rationale: {
                ar: 'مكافحة العدوى وترشيد المضادات وجهان لعملة واحدة.',
                en: 'Infection prevention and antibiotic stewardship go hand in hand.',
              },
            },
          ],
        },
        er4_final: {
          id: 'er4_final',
          speaker: 'erAttending',
          targetNpc: 'erAttending',
          objectiveHint: {
            ar: 'تحدث مع د. طارق لإتمام تسليم مناوبة الطوارئ 3D بالكامل',
            en: 'Speak with Dr. Tarek to complete Emergency Shift 3D',
          },
          dialogue: {
            ar: 'عمل بطولي طوال المناوبة! عند تسليم المناوبة للفريق التالي، ما الركائز الأربع التي التزمنا بها اليوم لحماية المرضى؟',
            en: 'Outstanding work throughout the shift! As we hand off to the incoming team, what four pillars kept our fictional patients safe today?',
          },
          choices: [
            {
              id: 'er4_c2_optimal',
              label: {
                ar: '١) فرز علامات الإنذار وتصعيدها فوراً للطبيب، ٢) التحقق الصارم من الحساسية الدوائية، ٣) نظافة اليدين ومكافحة العدوى، ٤) عدم استخدام المضادات للعدوى الفيروسية أو من بقايا أدوية قديمة',
                en: '1) Rapid red-flag triage & clinician escalation, 2) Strict allergy verification, 3) Hand hygiene & IPC, and 4) Zero antibiotic misuse for viral illness or leftover drugs',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'تهانينا! لقد أتممت جميع سيناريوهات «مناوبة الطوارئ 3D» بنجاح!',
                en: 'Congratulations! You have completed all scenarios in Emergency Shift 3D!',
              },
              rationale: {
                ar: 'هذه الركائز الأربع تمثل جوهر سلامة المرضى في أقسام الطوارئ.',
                en: 'These four pillars represent the foundation of emergency patient safety and stewardship.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'تطبيق احتياطات التلامس ونظافة اليدين وإتمام تسليم مناوبة منظم يشمل علامات الإنذار وسجل الحساسية.',
        en: 'Applying contact precautions, proper hand hygiene, and structured shift handoff covering red flags and allergies.',
      },
      educationalTakeaway: {
        ar: 'الوقاية من العدوى (غسل اليدين والاستخدام السليم لمعدات الوقاية) مع التحقق من الحساسية وتجنب المضادات العشوائية يحمي المرضى والمجتمع.',
        en: 'Infection prevention (handwashing and proper PPE use), allergy verification, and avoiding unnecessary antibiotics protect both patients and the community.',
      },
      escalationGuidance: {
        ar: 'هذا السيناريو تعليمي وتوعوي بالكامل؛ لا تتردد أبداً في طلب الرعاية الطبية الفورية أو الاتصال بالإسعاف (123) عند وجود أي أعراض طارئة.',
        en: 'This scenario is purely educational; never hesitate to seek immediate medical attention or call emergency services (123) for urgent symptoms.',
      },
      sources: [
        {
          title: 'WHO — Five Moments for Hand Hygiene in Health Care',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/campaigns/world-hand-hygiene-day',
        },
        {
          title: 'CDC — About C. diff & Antibiotic Stewardship',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/c-diff/about/index.html',
        },
      ],
    },
  ],
};
