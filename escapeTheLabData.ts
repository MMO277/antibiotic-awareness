import { Cartoon3DGameConfig } from './Cartoon3DGameShell';

export const ESCAPE_THE_LAB_CONFIG: Cartoon3DGameConfig = {
  gameId: 'escapeTheLab',
  route: '/escape-the-lab',
  worldPreset: 'escape_lab',
  gameIcon: '🔐',
  gameTitle: {
    ar: 'الهروب من المختبر 3D (Escape the Lab)',
    en: 'Escape the Lab 3D',
  },
  fictionalNoticeBadge: {
    ar: 'غرفة هروب تعليمية خيالية للسلامة ومكافحة العدوى • إجراءات عامة آمنة',
    en: 'Fictional Safety & IPC Escape Room • Educational Overview Only',
  },
  loadingTitle: {
    ar: 'جارٍ تجهيز غرف الهروب من المختبر ثلاثية الأبعاد (WebGL)...',
    en: 'Initializing 3D Escape the Lab Rooms & Security Locks...',
  },
  loadingSubtitle: {
    ar: 'يتم بناء غرفة التعقيم (Airlock)، غرفة سلامة العينات، غرفة فرز النفايات، وبوابة الخروج.',
    en: 'Building Room 1 (Hygiene Airlock), Room 2 (Specimen Safety), Room 3 (Waste Segregation), and the Master Exit Vault.',
  },
  controlsHintTitle: {
    ar: 'طريقة اللعب في «الهروب من المختبر 3D»:',
    en: 'How to Escape in Escape the Lab 3D:',
  },
  controlsHintBody: {
    ar: 'استكشف الغرف الثلاث المتصلة بعصا التحكم (أو WASD/الأسهم)، افحص محطات الألغاز المضيئة لجمع بطاقات المرور (Keycards) وفتح الحواجز الليزرية، واستخدم زر «💡 تلميح» عند الحاجة حتى تفتح بوابة الخروج النهائية!',
    en: 'Explore the 3 connected rooms with the joystick (or WASD/Arrows), solve glowing 3D puzzle stations to collect Keycards and open the laser gates, and use the "💡 Hint" button anytime to unlock the final exit!',
  },
  showInventoryBar: true,
  npcs: {
    biosafetyOfficer: {
      id: 'biosafetyOfficer',
      name: {
        ar: 'رامي (مسؤول السلامة ومكافحة العدوى)',
        en: 'Rami (Infection Prevention & Safety Coordinator)',
      },
      title: {
        ar: 'مشرف تدريب غرفة التعقيم ومعدات الوقاية (الغرفة ١)',
        en: 'Room 1 Hygiene & PPE Airlock Guide',
      },
      stationLabel: {
        ar: 'غرفة ١: مدخل التعقيم والوقاية (Airlock)',
        en: 'Room 1: Hygiene & PPE Airlock',
      },
      position: [-4.2, 0, 4.4],
      rotationY: 0.5,
      outfitColor: 0x0284c7,
      accentColor: 0xfacc15,
      skinColor: 0xf1c27d,
      hatType: 'safety_helmet',
      avatarEmoji: '🦺',
      defaultGreeting: {
        ar: 'أهلاً بك في تدريب الهروب التفاعلي! تم إغلاق أبواب التدريب الآلي؛ لحل الألغاز وفتح الحواجز الليزرية، طبّق قواعد نظافة اليدين، معدات الوقاية، وفرز النفايات الآمن!',
        en: 'Welcome to our interactive safety escape drill! The automated training doors are locked; solve the hand hygiene, PPE, specimen handling, and waste segregation puzzles to open the laser gates!',
      },
    },
    specimenMentor: {
      id: 'specimenMentor',
      name: {
        ar: 'د. نادية (مشرفة سلامة العينات والنقل الآمن)',
        en: 'Dr. Nadia (Specimen Integrity & Containment Mentor)',
      },
      title: {
        ar: 'مشرفة الغرفة الوسطى (الغرفة ٢: سلامة العينات)',
        en: 'Room 2 Specimen & Spill Containment Guide',
      },
      stationLabel: {
        ar: 'غرفة ٢: وحدة سلامة العينات والاحتواء',
        en: 'Room 2: Specimen & Containment Zone',
      },
      position: [4.4, 0, 0.2],
      rotationY: -0.6,
      outfitColor: 0x4f46e5,
      accentColor: 0xffffff,
      skinColor: 0xf6d0b1,
      hatType: 'lab_goggles',
      avatarEmoji: '👩‍🔬',
      defaultGreeting: {
        ar: 'مرحباً بك في الغرفة الثانية! هنا نتعلم المبادئ التعليمية العامة لحفظ العينات ومنع تلوث الأسطح دون أي إجراءات خطرة.',
        en: 'Welcome to Room 2! Here we practice high-level educational principles of specimen labeling and surface contamination prevention.',
      },
    },
    exitWarden: {
      id: 'exitWarden',
      name: {
        ar: 'المهندسة سلمى (مراقبة بوابة الخروج والبيئة)',
        en: 'Eng. Salma (Environmental Safety & Exit Vault Warden)',
      },
      title: {
        ar: 'مشرفة الغرفة الثالثة وبوابة الخروج النهائية',
        en: 'Room 3 Waste Segregation & Master Exit Warden',
      },
      stationLabel: {
        ar: 'غرفة ٣: بوابة الخروج النهائية (Master Exit Vault)',
        en: 'Room 3: Master Exit Vault',
      },
      position: [-3.8, 0, -5.2],
      rotationY: 0.4,
      outfitColor: 0x059669,
      accentColor: 0xa7f3d0,
      skinColor: 0xe5b887,
      hatType: 'safety_helmet',
      avatarEmoji: '🔐',
      defaultGreeting: {
        ar: 'أنت قريب جداً من بوابة الخروج! الفرز الصحيح للنفايات والتخلص الآمن من الأدوية يحمي البيئة ويمنع انتشار المقاومة البكتيرية.',
        en: 'You are right by the Master Exit Vault! Proper waste segregation and safe medication disposal protect the environment and curb AMR.',
      },
    },
  },
  missions: [
    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 1 — Room 1: The Hand Hygiene & PPE Airlock
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'escape-stage-1-airlock-ppe',
      missionIndex: 1,
      requiredMissionId: null,
      unlockRequirementText: {
        ar: 'متاح للبدء مباشرة (المرحلة الأولى: غرفة التعقيم ١)',
        en: 'Unlocked by default (Stage 1: Room 1 Airlock)',
      },
      accentHex: 0x0284c7,
      title: {
        ar: 'المرحلة ١ — الغرفة الأولى: قفل نظافة اليدين ومعدات الوقاية (Airlock)',
        en: 'Stage 1 — Room 1: The Hand Hygiene & PPE Airlock Puzzle',
      },
      subtitle: {
        ar: 'افحص ماسح الأشعة فوق البنفسجية لليدين وخزانة معدات الوقاية الشخصية (PPE) لجمع بطاقتي المرور وفتح الحاجز الليزري الأول',
        en: 'Solve the UV Hand Hygiene Scanner and PPE Locker puzzles to collect Keycards and unlock the first security laser gate',
      },
      categoryBadge: {
        ar: 'غرفة هروب ١ • نظافة اليدين و PPE',
        en: 'Escape Room 1 • Hand Hygiene & PPE',
      },
      badgeIcon: '🧤',
      badgeTitle: {
        ar: 'وسام مفتاح غرفة التعقيم الأولى',
        en: 'Airlock Hygiene Escape Keyholder',
      },
      primaryNpc: 'biosafetyOfficer',
      briefing: {
        ar: 'بدأت محاكاة الهروب التدريبية في الغرفة ١! الحاجز الليزري المؤدي للغرفة ٢ مغلق. افحص أولاً «ماسح نظافة اليدين بالأشعة فوق البنفسجية 3D» ثم «خزانة معدات الوقاية الشخصية PPE 3D» للحصول على بطاقتي الأمان، ثم تحدث مع رامي لفتح البوابة.',
        en: 'The escape drill has started in Room 1! The laser barrier to Room 2 is locked. First inspect the 3D UV Hand Hygiene Scanner and the 3D PPE Locker to collect both Security Keycards, then speak with Rami to unlock Gate 1.',
      },
      initialNodeId: 'esc1_start',
      requirePropsSolvedBeforeNodeId: 'esc1_unlock',
      interactiveProps: [
        {
          id: 'prop-esc1-uv-scanner',
          name: {
            ar: 'ماسح الأشعة فوق البنفسجية لنظافة اليدين (UV Hand Scanner)',
            en: 'UV Hand Hygiene Fluorescence Scanner',
          },
          stationLabel: {
            ar: 'ماسح تعقيم اليدين 3D',
            en: '3D UV Hand Scanner',
          },
          position: [-2.4, 0, 4.6],
          color: 0x0284c7,
          accentColor: 0x38bdf8,
          iconEmoji: '🧴',
          shape: 'uv_hand_scanner',
          rewardItem: {
            id: 'keycard-alpha-1',
            icon: '🪪',
            label: {
              ar: 'بطاقة أمان (A1): اجتياز فحص نظافة اليدين (20-30 ثانية)',
              en: 'Keycard A1: Hand Hygiene UV Scan Passed',
            },
          },
          puzzleSteps: [
            {
              id: 'esc1_uv_s1',
              prompt: {
                ar: 'لغز الماسح الضوئي (١/٢): يعرض جهاز الفحص بالأشعة فوق البنفسجية مناطق مضيئة لم يصلها المطهر على اليدين (بين الأصابع، ظهر الإبهام، وأطراف الأصابع). ما المدة والطريقة الصحيحة للدلك بالمطهر الكحولي لفتح القفل الأول؟',
                en: 'UV Scanner Puzzle (1/2): The UV light highlights commonly missed areas on the hands (between fingers, thumbs, and fingertips). What is the correct duration and technique for alcohol-based hand rub to unlock Lock 1?',
              },
              hint: {
                ar: 'توصي منظمة الصحة العالمية بفرك جميع أسطح اليدين بالمطهر الكحولي لمدة 20 إلى 30 ثانية حتى تجف تماماً.',
                en: 'WHO recommends rubbing all surfaces of the hands with alcohol-based sanitizer for 20–30 seconds until completely dry.',
              },
              options: [
                {
                  id: 'esc1_uv_o1',
                  label: {
                    ar: 'فرك جميع أسطح اليدين (الكفين، ظهر اليد، بين الأصابع، الإبهام، وأطراف الأصابع) لمدة 20–30 ثانية حتى تجف تماماً',
                    en: 'Rub all hand surfaces (palms, backs, between fingers, thumbs, and fingertips) for 20–30 seconds until dry',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'أحسنت! تحول ضوء الماسح إلى الأخضر؛ تغطية الإبهام وأطراف الأصابع تضمن القضاء على الجراثيم العالقة.',
                    en: 'Correct! The scanner turned green; covering thumbs and fingertips ensures complete hand antisepsis.',
                  },
                },
                {
                  id: 'esc1_uv_o2',
                  label: {
                    ar: 'مسح راحة اليد لمدة ثانيتين فقط ثم تجفيفها بالملابس',
                    en: 'Wipe only the palms for 2 seconds and wipe them dry on clothing',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'ما زال الإنذار يعمل! مسح الكف لثانيتين يترك أطراف الأصابع والإبهام ملوثة، ومسحها بالملابس يعيد تلويثها.',
                    en: 'Alarm still active! A 2-second palm wipe misses fingertips and thumbs, and wiping on clothing re-contaminates hands.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'ماسح اليدين UV: إتقان خطوات الدلك الكحولي الشامل لمدة 20–30 ثانية.',
            en: 'UV Hand Scanner: Mastered full-surface alcohol hand rub for 20–30 seconds.',
          },
        },
        {
          id: 'prop-esc1-ppe-locker',
          name: {
            ar: 'خزانة معدات الوقاية الشخصية الذكية (Smart PPE Locker)',
            en: 'Smart PPE Sequence Locker',
          },
          stationLabel: {
            ar: 'خزانة معدات الوقاية PPE 3D',
            en: '3D PPE Smart Locker',
          },
          position: [2.6, 0, 4.6],
          color: 0x0d9488,
          accentColor: 0x2dd4bf,
          iconEmoji: '🦺',
          shape: 'ppe_locker',
          rewardItem: {
            id: 'keycard-alpha-2',
            icon: '🔑',
            label: {
              ar: 'مفتاح المرور (A2): ترتيب ارتداء معدات الوقاية السليم',
              en: 'Keycard A2: Correct PPE Donning Sequence',
            },
          },
          puzzleSteps: [
            {
              id: 'esc1_ppe_s1',
              prompt: {
                ar: 'لغز خزانة الوقاية (٢/٢): لفتح قفل الخزانة، اختر الترتيب التعليمي القياسي الصحيح لارتداء معدات الوقاية الشخصية (Donning PPE) بعد تطهير اليدين:',
                en: 'PPE Locker Puzzle (2/2): To unlock the cabinet, select the standard educational sequence for putting on (donning) PPE after performing hand hygiene:',
              },
              hint: {
                ar: 'ابدأ بالرداء الواقي (Gown)، ثم القناع/الكمامة، ثم واقي العينين، وأخيراً القفازات بحيث تغطي أساور الرداء.',
                en: 'Start with the Gown, then Mask, then Eye Protection/Goggles, and put on Gloves last so they cover the gown cuffs.',
              },
              options: [
                {
                  id: 'esc1_ppe_o1',
                  label: {
                    ar: '١) الرداء الواقي (Gown) ← ٢) الكمامة (Mask) ← ٣) واقي العينين ← ٤) القفازات (تغطي معصم الرداء)',
                    en: '1) Gown → 2) Mask → 3) Eye Protection → 4) Gloves (covering gown wrists)',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'تم فتح القفل بنجاح! ارتداء القفازات في الخطوة الأخيرة يضمن بقاءها نظيفة وتغطيتها لأطراف الرداء.',
                    en: 'Lock opened! Putting gloves on last keeps them clean and allows them to overlap the gown cuffs.',
                  },
                },
                {
                  id: 'esc1_ppe_o2',
                  label: {
                    ar: 'ارتداء القفازات أولاً قبل غسل اليدين ثم عدم ارتداء أي رداء',
                    en: 'Put gloves on first before washing hands and skip the rest',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'ترتيب غير صحيح! القفازات تُرتدى في النهاية بعد تطهير اليدين وارتداء الرداء والقناع.',
                    en: 'Incorrect order! Gloves are donned last after hand hygiene, gown, and mask/eye protection.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'خزانة الوقاية PPE: تطبيق الترتيب القياسي لارتداء معدات الوقاية الشخصية.',
            en: 'PPE Locker: Verified standard PPE donning sequence (Hand hygiene → Gown → Mask → Goggles → Gloves).',
          },
        },
      ],
      nodes: {
        esc1_start: {
          id: 'esc1_start',
          speaker: 'biosafetyOfficer',
          targetNpc: 'biosafetyOfficer',
          objectiveHint: {
            ar: 'تحدث مع رامي في الغرفة ١ لبدء تحدي الهروب الأول',
            en: 'Speak with Rami in Room 1 to begin Escape Stage 1',
          },
          dialogue: {
            ar: 'مرحباً بك في «الهروب من المختبر 3D»! نحن الآن في الغرفة الأولى (Airlock). لن يُفتح الحاجز الليزري المؤدي للغرفة الثانية إلا بعد جمع بطاقتي الأمان من «ماسح اليدين UV» و«خزانة معدات الوقاية PPE». هل أنت مستعد؟',
            en: 'Welcome to Escape the Lab 3D! We are in Room 1 (the Airlock). The laser gate to Room 2 will only open once you collect both security keycards from the 3D UV Hand Scanner and 3D PPE Locker. Ready?',
          },
          choices: [
            {
              id: 'esc1_c1_go',
              label: {
                ar: 'نعم! سأحل لغزي نظافة اليدين وخزانة الوقاية لجمع بطاقتي المرور',
                en: 'Yes! I will solve the UV Hand Scanner and PPE Locker puzzles to collect both keycards',
              },
              nextNodeId: 'esc1_unlock',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'انطلق! افحص المحطتين المضيئتين في الغرفة ١ ثم عد إلى رامي.',
                en: 'Go for it! Inspect both glowing 3D stations in Room 1, then return to Rami.',
              },
              rationale: {
                ar: 'نظافة اليدين والترتيب السليم لمعدات الوقاية هما خط الدفاع الأول ضد التلوث.',
                en: 'Hand hygiene and proper PPE sequence are the first line of defense against contamination.',
              },
            },
          ],
        },
        esc1_unlock: {
          id: 'esc1_unlock',
          speaker: 'biosafetyOfficer',
          targetNpc: 'biosafetyOfficer',
          objectiveHint: {
            ar: 'بعد جمع بطاقتي الغرفة ١، تحدث مع رامي لفتح الحاجز الليزري الأول',
            en: 'After collecting both Room 1 keycards, talk to Rami to unlock Laser Gate 1',
          },
          dialogue: {
            ar: 'رائع! حصلت على البطاقتين (A1 و A2) وتحول الحاجز الليزري الأول إلى اللون الأخضر! سؤال تأكيد أخير قبل العبور للغرفة ٢: هل يغني ارتداء القفازات الطبية عن غسل أو تعقيم اليدين؟',
            en: 'Awesome! You collected Keycards A1 & A2 and the first laser gate turned green! One quick verification question before crossing into Room 2: does wearing medical gloves replace hand hygiene?',
          },
          choices: [
            {
              id: 'esc1_c2_optimal',
              label: {
                ar: 'أبداً؛ القفازات لا تغني عن نظافة اليدين، ويجب تطهير اليدين قبل ارتدائها وفور خلعها',
                en: 'Never; gloves do not replace hand hygiene—hands must be sanitized before putting gloves on and immediately after removing them',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'إجابة صحيحة ١٠٠٪! فُتحت البوابة للغرفة الثانية (المرحلة ٢).',
                en: '100% correct! The gate to Room 2 (Stage 2) is now unlocked.',
              },
              rationale: {
                ar: 'الأيدي قد تتلوث عبر الثقوب المجهرية أو أثناء خلع القفازات، لذا فالتعقيم بعد خلعها إلزامي.',
                en: 'Hands can become contaminated during glove removal or via micro-perforations, making post-removal hand hygiene mandatory.',
              },
            },
            {
              id: 'esc1_c2_unsafe',
              label: {
                ar: 'نعم، طالما ارتديت القفازات فلا داعي لغسل اليدين طوال اليوم',
                en: 'Yes, as long as I wear gloves I never need to wash my hands all day',
              },
              nextNodeId: 'END',
              quality: 'unsafe',
              immediateFeedback: {
                ar: 'انتبه: هذا خطأ شائع! القفازات قد تنقل الجراثيم وتلوث اليدين عند خلعها.',
                en: 'Careful: that is a common myth! Gloves can transfer microbes and contaminate hands during removal.',
              },
              rationale: {
                ar: 'تؤكد منظمة الصحة العالمية أن القفازات مكمل لنظافة اليدين وليست بديلاً عنها.',
                en: 'WHO emphasizes that gloves complement hand hygiene and never replace it.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'تطبيق تقنية الدلك الكحولي الشاملة وترتيب ارتداء معدات الوقاية الشخصية وفهم أن القفازات لا تغني عن غسل اليدين.',
        en: 'Applying comprehensive alcohol hand rub technique, proper PPE donning order, and confirming that gloves never replace hand hygiene.',
      },
      educationalTakeaway: {
        ar: 'نظافة اليدين (20–30 ثانية بالمطهر الكحولي أو 40–60 ثانية بالماء والصابون) هي الإجراء الأكثر فعالية لمنع انتقال العدوى والميكروبات المقاومة.',
        en: 'Hand hygiene (20–30s alcohol rub or 40–60s soap and water) is the single most effective measure to prevent transmission of resistant microbes.',
      },
      escalationGuidance: {
        ar: 'هذا التدريب تعليمي عام للوقاية من العدوى ولا يتضمن أي إجراءات معملية خطرة.',
        en: 'This drill provides high-level infection prevention education and contains no hazardous laboratory procedures.',
      },
      sources: [
        {
          title: 'WHO — Hand Hygiene Technical Reference Manual',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/campaigns/world-hand-hygiene-day',
        },
        {
          title: 'CDC — Sequence for Putting On and Removing Personal Protective Equipment (PPE)',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/infection-control/hcp/core-practices/index.html',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 2 — Room 2: Specimen Integrity & Contamination Prevention Chamber
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'escape-stage-2-specimen-containment',
      missionIndex: 2,
      requiredMissionId: 'escape-stage-1-airlock-ppe',
      unlockRequirementText: {
        ar: 'أكمل المرحلة ١ (قفل نظافة اليدين ومعدات الوقاية) أولاً لفتح الغرفة الثانية',
        en: 'Complete Stage 1 (Room 1 Airlock) first to unlock Room 2',
      },
      accentHex: 0x4f46e5,
      title: {
        ar: 'المرحلة ٢ — الغرفة الثانية: لغز سلامة العينات ومنع تلوث الأسطح',
        en: 'Stage 2 — Room 2: Specimen Labeling & Contamination Prevention',
      },
      subtitle: {
        ar: 'اعبر إلى الغرفة الوسطى، حل لغز حفظ العينات المرقمة ولغز منع تلوث بيئة العمل لجمع بطاقتي الغرفة الثانية',
        en: 'Enter the middle chamber, solve the specimen integrity and surface contamination puzzles, and unlock Gate 2',
      },
      categoryBadge: {
        ar: 'غرفة هروب ٢ • سلامة العينات والاحتواء',
        en: 'Escape Room 2 • Specimen & Containment',
      },
      badgeIcon: '🧪',
      badgeTitle: {
        ar: 'وسام حارس سلامة العينات',
        en: 'Specimen Integrity Escape Specialist',
      },
      primaryNpc: 'specimenMentor',
      briefing: {
        ar: 'أنت الآن في الغرفة الثانية! لفتح الحاجز الليزري المؤدي للغرفة الثالثة، افحص «وحدة كبسولات العينات والترقيم 3D» و«محطة منع التلوث السطحي 3D»، ثم تحدث مع د. نادية.',
        en: 'You are now in Room 2! To unlock the laser gate to Room 3, inspect the 3D Specimen Capsule Station and the 3D Surface Containment Station, then talk to Dr. Nadia.',
      },
      initialNodeId: 'esc2_start',
      requirePropsSolvedBeforeNodeId: 'esc2_unlock',
      interactiveProps: [
        {
          id: 'prop-esc2-specimen-capsule',
          name: {
            ar: 'وحدة كبسولات العينات والتغليف الآمن (Specimen Transport Lock)',
            en: 'Specimen Labeling & Triple-Barrier Transport Lock',
          },
          stationLabel: {
            ar: 'وحدة كبسولات العينات 3D',
            en: '3D Specimen Capsule Station',
          },
          position: [-3.4, 0, 0.2],
          color: 0x4f46e5,
          accentColor: 0x818cf8,
          iconEmoji: '🧪',
          shape: 'specimen_capsule',
          rewardItem: {
            id: 'keycard-beta-1',
            icon: '🪪',
            label: {
              ar: 'بطاقة أمان (B1): توثيق العينة ومنع الخلط والتسرب',
              en: 'Keycard B1: Specimen Labeling & Leak-Proof Seal',
            },
          },
          puzzleSteps: [
            {
              id: 'esc2_sp_s1',
              prompt: {
                ar: 'لغز كبسولة العينات (١/٢): وجدت ثلاث حاويات تدريبية خيالية على الطاولة. أي حاوية تحقق شروط السلامة القياسية للنقل الداخلي وتمنع الأخطاء التشخيصية؟',
                en: 'Specimen Capsule Puzzle (1/2): Three fictional training containers are on the bench. Which container meets standard safety and diagnostic quality requirements?',
              },
              hint: {
                ar: 'الحاوية الآمنة يجب أن تكون محكمة الإغلاق، داخل كيس ثانوي مانع للتسرب، وعليها ملصق بيانات واضح (الرمز، التاريخ، الوقت، ونوع العينة).',
                en: 'A safe specimen container must be tightly capped, placed in a leak-proof secondary bag, and clearly labeled with ID, date/time, and source.',
              },
              options: [
                {
                  id: 'esc2_sp_o1',
                  label: {
                    ar: 'الحاوية المغلقة بإحكام داخل كيس واقٍ مانع للتسرب، والمزودة بملصق واضح يحدد رقم الحالة الخيالية ونوع العينة ووقت الجمع',
                    en: 'A tightly sealed container inside a leak-proof secondary pouch, clearly labeled with fictional case ID, specimen type, and collection time',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'إجابة صحيحة! الإغلاق المحكم والترقيم الدقيق يمنعان تلوث البيئة ويمنعان تبديل العينات بين المرضى.',
                    en: 'Correct! Leak-proof containment and accurate labeling prevent environmental contamination and patient mix-ups.',
                  },
                },
                {
                  id: 'esc2_sp_o2',
                  label: {
                    ar: 'أنبوب مفتوح الغطاء بدون أي اسم أو ملصق موضوع في جيب المعطف',
                    en: 'An uncapped, unlabeled tube carried loosely in a coat pocket',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'خطر ومرفوض! الأنابيب غير المغلقة أو غير المرقمة تسبب تلوثاً وأخطاء تشخيصية جسيمة.',
                    en: 'Unsafe and rejected! Uncapped or unlabeled tubes cause contamination and diagnostic errors.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'وحدة العينات: التحقق من الإغلاق المانع للتسرب والملصق التعريفي الدقيق.',
            en: 'Specimen Station: Verified leak-proof containment and accurate specimen labeling.',
          },
        },
        {
          id: 'prop-esc2-spill-kit',
          name: {
            ar: 'محطة تطهير الأسطح ومنع التلوث المتبادل (Surface Safety Lock)',
            en: 'Surface Disinfection & Cross-Contamination Lock',
          },
          stationLabel: {
            ar: 'محطة تطهير الأسطح 3D',
            en: '3D Surface Safety Station',
          },
          position: [0.0, 0, -0.2],
          color: 0x0d9488,
          accentColor: 0x5eead4,
          iconEmoji: '🧼',
          shape: 'spill_kit',
          rewardItem: {
            id: 'keycard-beta-2',
            icon: '🔑',
            label: {
              ar: 'مفتاح المرور (B2): تطهير الأسطح والتمييز بين المطهر والمضاد الحيوي',
              en: 'Keycard B2: Surface Disinfection vs. Antibiotic Clarity',
            },
          },
          puzzleSteps: [
            {
              id: 'esc2_sk_s1',
              prompt: {
                ar: 'لغز تطهير الأسطح (٢/٢): لفك تشفير القفل الثاني، ما الفرق العلمي الجوهري بين «المطهرات السطحية» (Disinfectants) و«المضادات الحيوية» (Antibiotics)؟',
                en: 'Surface Safety Puzzle (2/2): To decode Lock 2, what is the fundamental scientific difference between environmental Disinfectants and clinical Antibiotics?',
              },
              hint: {
                ar: 'المطهرات تُستخدم على الأسطح غير الحية، بينما المضادات الحيوية أدوية داخلية لا يجوز أبداً سكبها أو رشها على الطاولات.',
                en: 'Disinfectants are formulated for inanimate surfaces, whereas antibiotics are internal medicines that must never be poured on benches.',
              },
              options: [
                {
                  id: 'esc2_sk_o1',
                  label: {
                    ar: 'تُطهّر الأسطح غير الحية بالمطهرات القياسية المعتمدة مع соблюдение زمن التلامس، بينما لا تُستخدم المضادات الحيوية الدوائية أبداً لتنظيف الأسطح (لأن ذلك ينشر المقاومة)',
                    en: 'Inanimate surfaces are cleaned with approved surface disinfectants for the required contact time; medicinal antibiotics are never used to clean surfaces',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'ممتاز! استخدام كبسولات أو محاليل المضادات الحيوية على الأسطح خطأ جسيم يلوث البيئة ببكتيريا مقاومة.',
                    en: 'Spot on! Pouring medicinal antibiotics on surfaces is unsafe and breeds environmental antimicrobial resistance.',
                  },
                },
                {
                  id: 'esc2_sk_o2',
                  label: {
                    ar: 'تفريغ كبسولات المضاد الحيوي في دلو المسح لتنظيف طاولات المختبر والمستشفى',
                    en: 'Empty antibiotic capsules into a mop bucket to clean hospital and lab tables',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'خطأ خطر! نشر المضادات الحيوية في البيئة ومياه الصرف يخلق بؤراً للبكتيريا الخارقة المقاومة.',
                    en: 'Dangerous misconception! Releasing antibiotics into surfaces and wastewater selects for resistant superbugs.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'محطة تطهير الأسطح: استخدام المطهرات القياسية للأسطح ومنع تلوث البيئة بالمضادات الدوائية.',
            en: 'Surface Safety Station: Using standard surface disinfectants and preventing environmental antibiotic release.',
          },
        },
      ],
      nodes: {
        esc2_start: {
          id: 'esc2_start',
          speaker: 'specimenMentor',
          targetNpc: 'specimenMentor',
          objectiveHint: {
            ar: 'تحدث مع د. نادية في الغرفة ٢ لبدء المرحلة الثانية',
            en: 'Speak with Dr. Nadia in Room 2 to begin Stage 2',
          },
          dialogue: {
            ar: 'مرحباً بك في الغرفة الثانية! لفتح الحاجز الليزري الثاني والوصول إلى غرفة بوابة الخروج، عليك حل لغزين في هذه الغرفة: «وحدة كبسولات العينات 3D» و«محطة تطهير الأسطح 3D».',
            en: 'Welcome to Room 2! To unlock the second laser gate and reach the exit chamber, solve the two 3D stations here: the Specimen Capsule Station and the Surface Safety Station.',
          },
          choices: [
            {
              id: 'esc2_c1_go',
              label: {
                ar: 'سأفحص المحطتين الآن لجمع بطاقتي المرور (B1 و B2)',
                en: 'I will inspect both 3D stations now to collect Keycards B1 and B2',
              },
              nextNodeId: 'esc2_unlock',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'ممتاز! حل اللغزين في الغرفة الوسطى ثم عد إلى د. نادية.',
                en: 'Great! Solve both puzzles in the middle room, then return to Dr. Nadia.',
              },
              rationale: {
                ar: 'سلامة العينات وتطهير الأسطح يمنعان الحوادث المعملية والعدوى المكتسبة.',
                en: 'Specimen integrity and surface disinfection prevent cross-contamination.',
              },
            },
          ],
        },
        esc2_unlock: {
          id: 'esc2_unlock',
          speaker: 'specimenMentor',
          targetNpc: 'specimenMentor',
          objectiveHint: {
            ar: 'بعد جمع بطاقتي الغرفة ٢، تحدث مع د. نادية لفتح الحاجز الليزري الثاني',
            en: 'After collecting both Room 2 keycards, talk to Dr. Nadia to unlock Laser Gate 2',
          },
          dialogue: {
            ar: 'عمل رائع! فُتح الحاجز الليزري الثاني الآن. قبل انتقالك للغرفة الثالثة، لماذا يُمنع تناول الطعام أو الشراب أو لمس الوجه والهاتف بالقفازات داخل مناطق الفحص؟',
            en: 'Fantastic work! Laser Gate 2 is now open. Before stepping into Room 3, why is eating, drinking, or touching your face/phone with gloved hands strictly prohibited in clinical and lab zones?',
          },
          choices: [
            {
              id: 'esc2_c2_optimal',
              label: {
                ar: 'لمنع انتقال التلوث الميكروبي أو الكيميائي من الأسطح والقفازات إلى الفم والعينين والأدوات الشخصية (Cross-contamination)',
                en: 'To prevent cross-contamination from work surfaces and gloves to mucous membranes and personal items',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'إجابة ممتازة! انتقل الآن إلى المرحلة الثالثة (غرفة فرز النفايات وبوابة الخروج).',
                en: 'Spot on! Proceed to Stage 3 (Room 3: Waste Segregation & Exit Lock).',
              },
              rationale: {
                ar: 'فصل الأدوات الشخصية ومنع لمس الوجه بالقفازات قاعدة ذهبية للسلامة الحيوية.',
                en: 'Keeping personal items separate and avoiding face contact with gloves is a core biosafety rule.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'التأكد من الإغلاق المحكم والترقيم السليم للعينات، والتمييز بين المطهرات البيئية والمضادات الحيوية الدوائية.',
        en: 'Verifying leak-proof specimen labeling and distinguishing surface disinfectants from medicinal antibiotics.',
      },
      educationalTakeaway: {
        ar: 'الدقة في ترقيم العينات وحفظها تمنع التشخيص الخاطئ، وعدم استخدام المضادات الحيوية خارج الإشراف الطبي يحمي البيئة من البكتيريا المقاومة.',
        en: 'Accurate specimen labeling prevents diagnostic errors, and keeping medicinal antibiotics out of environmental surfaces prevents resistance.',
      },
      escalationGuidance: {
        ar: 'هذه المعلومات تثقيفية عامة؛ في المنشآت الحقيقية يجب اتباع بروتوكولات السلامة المؤسسية المعتمدة وإبلاغ المشرف المختص فوراً عند أي طارئ.',
        en: 'This content is general educational awareness; real facilities always follow institutional safety protocols and supervisor reporting.',
      },
      sources: [
        {
          title: 'WHO — Laboratory Biosafety Manual (Core Concepts)',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/publications/i/item/9789240011311',
        },
        {
          title: 'CDC — Environmental Infection Control Guidelines',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/infection-control/hcp/environmental-control/index.html',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 3 — Room 3: Waste Segregation & Safe Antibiotic Disposal
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'escape-stage-3-waste-segregation-exit',
      missionIndex: 3,
      requiredMissionId: 'escape-stage-2-specimen-containment',
      unlockRequirementText: {
        ar: 'أكمل المرحلة ٢ (الغرفة الثانية) أولاً لفتح الغرفة الثالثة',
        en: 'Complete Stage 2 (Room 2) first to unlock Room 3',
      },
      accentHex: 0x059669,
      title: {
        ar: 'المرحلة ٣ — الغرفة الثالثة: لغز فرز النفايات والتخلص الآمن من الأدوية',
        en: 'Stage 3 — Room 3: Waste Segregation & Safe Disposal Puzzle',
      },
      subtitle: {
        ar: 'رتّب النفايات في الحاويات الملونة 3D وتعلّم كيف نمنع تسرب المضادات الحيوية للمياه والتربة لفتح قفل الخروج',
        en: 'Sort items into the 3D color-coded bins and prevent environmental antibiotic pollution to unlock the exit vault',
      },
      categoryBadge: {
        ar: 'غرفة هروب ٣ • فرز النفايات والبيئة',
        en: 'Escape Room 3 • Waste & Safe Disposal',
      },
      badgeIcon: '♻️',
      badgeTitle: {
        ar: 'وسام خبير الفرز الآمن وحماية البيئة',
        en: 'Safe Waste & Eco-Stewardship Expert',
      },
      primaryNpc: 'exitWarden',
      briefing: {
        ar: 'وصلت إلى الغرفة الثالثة أمام بوابة الخروج! افحص «محطة حاويات فرز النفايات الثلاثية 3D» و«قفل خلع الوقاية والتخلص الآمن 3D» لجمع مفتاحي الغرفة الثالثة، ثم تحدث مع المهندسة سلمى.',
        en: 'You have reached Room 3 in front of the Exit Vault! Inspect the 3D Waste Sorter Station and the 3D Safe Disposal & Doffing Lock to collect both keys, then speak with Eng. Salma.',
      },
      initialNodeId: 'esc3_start',
      requirePropsSolvedBeforeNodeId: 'esc3_unlock',
      interactiveProps: [
        {
          id: 'prop-esc3-waste-sorter',
          name: {
            ar: 'محطة فرز النفايات الملونة (3D Color-Coded Waste Sorter)',
            en: 'Color-Coded Waste Segregation Station',
          },
          stationLabel: {
            ar: 'محطة فرز النفايات 3D',
            en: '3D Waste Sorter Bins',
          },
          position: [-2.8, 0, -4.4],
          color: 0xeab308,
          accentColor: 0xef4444,
          iconEmoji: '🗑️',
          shape: 'waste_sorter',
          rewardItem: {
            id: 'keycard-gamma-1',
            icon: '🪪',
            label: {
              ar: 'بطاقة أمان (C1): الفرز الصحيح للنفايات الحادة والحيوية والعادية',
              en: 'Keycard C1: Correct Waste Segregation',
            },
          },
          puzzleSteps: [
            {
              id: 'esc3_ws_s1',
              prompt: {
                ar: 'لغز فرز النفايات (١/٢): أمامك ٣ حاويات ملونة (صندوق أحمر صلب مقاوم للثقب، كيس أصفر للنفايات الملوثة حيوياً، وحاوية زرقاء للورق المكتبي النظيف). كيف يتم الفرز الآمن؟',
                en: 'Waste Sorter Puzzle (1/2): You have 3 color-coded containers (Red puncture-resistant sharps box, Yellow biohazard bag, Blue clean office paper bin). Which sorting rule is correct?',
              },
              hint: {
                ar: 'الأدوات الحادة والشرائح الزجاجية توضع في الصندوق الصلب المقاوم للثقب، والقفازات الملوثة في الكيس الأصفر، والورق النظيف في الحاوية العادية.',
                en: 'Sharps/glass slides go in the rigid puncture-proof sharps box, contaminated gloves/swabs in the yellow biohazard bag, and clean paper in general recycling.',
              },
              options: [
                {
                  id: 'esc3_ws_o1',
                  label: {
                    ar: 'الأدوات الحادة والشرائح الزجاجية في الصندوق الأحمر المقاوم للثقب، المسحات والقفازات الملوثة في الكيس الأصفر، والورق النظيف في الحاوية الزرقاء',
                    en: 'Sharps/slides in the red puncture-proof box, contaminated swabs/gloves in the yellow biohazard bag, and clean paper in the blue bin',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'فرز سليم ١٠٠٪! فصل الأدوات الحادة في صندوق صلب يمنع إصابات الوخز لعمال النظافة والفريق الصحي.',
                    en: '100% accurate sorting! Placing sharps in a rigid box prevents needlestick and glass injuries.',
                  },
                },
                {
                  id: 'esc3_ws_o2',
                  label: {
                    ar: 'رمي الإبر والشرائح الزجاجية والقفازات الملوثة في سلة المهملات المكتبية العادية',
                    en: 'Toss needles, glass slides, and contaminated gloves into the open office trash basket',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'خطر شديد! رمي الأدوات الحادة أو الملوثة في سلة المهملات العادية يعرّض الآخرين للإصابة والعدوى.',
                    en: 'Severe hazard! Disposing of sharps or biohazard waste in regular trash causes injuries and infection risk.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'محطة فرز النفايات: فصل الأدوات الحادة والنفايات الحيوية والورق العادي بدقة.',
            en: 'Waste Sorter Station: Properly segregated sharps, biohazard items, and general paper waste.',
          },
        },
        {
          id: 'prop-esc3-safe-disposal',
          name: {
            ar: 'قفل التخلص الآمن من المضادات الحيوية وحماية المياه',
            en: 'Safe Antibiotic Disposal & Environmental Lock',
          },
          stationLabel: {
            ar: 'قفل حماية البيئة 3D',
            en: '3D Eco-Disposal Lock',
          },
          position: [2.8, 0, -4.4],
          color: 0x10b981,
          accentColor: 0x34d399,
          iconEmoji: '🌿',
          shape: 'keypad_lock',
          rewardItem: {
            id: 'keycard-gamma-2',
            icon: '🔑',
            label: {
              ar: 'مفتاح المرور (C2): منع سكب المضادات الحيوية في الصرف الصحي',
              en: 'Keycard C2: Prevented Antibiotic Wastewater Pollution',
            },
          },
          puzzleSteps: [
            {
              id: 'esc3_sd_s1',
              prompt: {
                ar: 'لغز حماية البيئة (٢/٢): لماذا يُحظر تماماً سكب بقايا المضادات الحيوية السائلة أو الأقراص في الحوض أو المرحاض أو إلقاؤها مكشوفة في البيئة؟',
                en: 'Environmental Lock Puzzle (2/2): Why must leftover liquid or tablet antibiotics NEVER be poured down the sink/toilet or thrown loosely into the environment?',
              },
              hint: {
                ar: 'وصول المضادات الحيوية إلى المياه والتربة يعرّض بكتيريا البيئة لتركيزات منخفضة تحفز ظهور جينات المقاومة (One Health).',
                en: 'Antibiotics entering water and soil expose environmental bacteria to sub-lethal levels that select for resistance genes (One Health).',
              },
              options: [
                {
                  id: 'esc3_sd_o1',
                  label: {
                    ar: 'لأن تسرب المضادات للمياه والتربة يلوث البيئة ويحفز البكتيريا على تطوير جينات مقاومة تنتقل للإنسان والحيوان (مفهوم الصحة الواحدة One Health)',
                    en: 'Because antibiotics in water and soil pollute ecosystems and select for resistance genes across humans, animals, and the environment (One Health)',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'إجابة ممتازة! يتم التخلص من الأدوية المنتهية عبر برامج الاسترجاع الدوائي أو الطرق الآمنة المعتمدة بدلاً من سكبها في الصرف.',
                    en: 'Spot on! Expired or leftover medicines should be returned via pharmacy take-back programs or approved safe disposal protocols, never flushed.',
                  },
                },
                {
                  id: 'esc3_sd_o2',
                  label: {
                    ar: 'سكب المضادات الحيوية في الأحواض مفيد لأنه يطهر مياه الأنهار والبحار',
                    en: 'Pouring antibiotics down the drain is beneficial because it sterilizes rivers and seas',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'مفهوم خاطئ وخطير! المضادات في مياه الصرف تقتل الكائنات النافعة وتصنع سلالات بكتيرية مقاومة.',
                    en: 'Dangerous myth! Antibiotics in wastewater harm ecosystems and breed multidrug-resistant bacteria.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'قفل حماية البيئة: تطبيق مفهوم الصحة الواحدة (One Health) ومنع سكب المضادات في الصرف.',
            en: 'Eco-Disposal Lock: Applied One Health principles by preventing antibiotic disposal in drains.',
          },
        },
      ],
      nodes: {
        esc3_start: {
          id: 'esc3_start',
          speaker: 'exitWarden',
          targetNpc: 'exitWarden',
          objectiveHint: {
            ar: 'تحدث مع المهندسة سلمى في الغرفة ٣ لبدء المرحلة الثالثة',
            en: 'Speak with Eng. Salma in Room 3 to start Stage 3',
          },
          dialogue: {
            ar: 'أحسنت في الوصول إلى الغرفة الثالثة! أمامك الآن «محطة فرز النفايات الملونة 3D» و«قفل التخلص الآمن وحماية البيئة 3D». اجمع مفتاحي الغرفة الثالثة (C1 و C2) لنقترب من فتح بوابة الخروج الكبرى!',
            en: 'Great job reaching Room 3! Ahead of you are the 3D Color-Coded Waste Sorter and the 3D Safe Eco-Disposal Lock. Collect Keycards C1 and C2 so we can prepare the Master Exit Vault!',
          },
          choices: [
            {
              id: 'esc3_c1_go',
              label: {
                ar: 'سأفحص محطة فرز النفايات وقفل حماية البيئة الآن',
                en: 'I will inspect the Waste Sorter and Eco-Disposal Lock now',
              },
              nextNodeId: 'esc3_unlock',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'بالتوفيق! حل اللغزين في الغرفة ٣ ثم عد للتحدث مع المهندسة سلمى.',
                en: 'Good luck! Solve both puzzles in Room 3, then return to Eng. Salma.',
              },
              rationale: {
                ar: 'الإدارة السليمة للنفايات الطبية والدوائية ركن أساسي في خطة منظمة الصحة العالمية لمكافحة المقاومة.',
                en: 'Safe healthcare and pharmaceutical waste management is a key pillar of the WHO Global Action Plan on AMR.',
              },
            },
          ],
        },
        esc3_unlock: {
          id: 'esc3_unlock',
          speaker: 'exitWarden',
          targetNpc: 'exitWarden',
          objectiveHint: {
            ar: 'بعد جمع بطاقتي الغرفة ٣، تحدث مع المهندسة سلمى لفتح المرحلة النهائية',
            en: 'After collecting both Room 3 keycards, speak with Eng. Salma to unlock the final stage',
          },
          dialogue: {
            ar: 'ممتاز! جمعت بطاقتي الغرفة الثالثة (C1 و C2). قبل فتح بوابة الخروج الكبرى في المرحلة الرابعة، ما الخطوة الإلزامية الأخيرة عند مغادرة أي منطقة عمل معملية أو سريرية؟',
            en: 'Excellent! You collected Keycards C1 and C2. Before unlocking the Master Exit Vault in Stage 4, what is the mandatory final personal step before stepping out of any lab or clinical zone?',
          },
          choices: [
            {
              id: 'esc3_c2_optimal',
              label: {
                ar: 'خلع معدات الوقاية الشخصية (Doffing PPE) بالترتيب الآمن ووضعها في الحاوية المخصصة، ثم غسل أو تطهير اليدين جيداً قبل لمس مقبض باب الخروج',
                en: 'Safely remove (doff) PPE in proper sequence into designated bins, then wash/sanitize hands thoroughly before touching the exit door',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'رائع! لقد فتحت المرحلة الرابعة والأخيرة: «بوابة الخروج الكبرى (Master Exit Vault)»!',
                en: 'Brilliant! You have unlocked Stage 4: The Master Exit Vault!',
              },
              rationale: {
                ar: 'خلع معدات الوقاية وغسل اليدين قبل المغادرة يمنع نقل التلوث إلى الممرات العامة.',
                en: 'Removing PPE and washing hands before exiting prevents carrying contamination into public corridors.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'فرز النفايات الحادة والحيوية والعادية بشكل صحيح، ومنع تلوث المياه بالمضادات الحيوية، وخلع معدات الوقاية مع غسل اليدين قبل الخروج.',
        en: 'Properly segregating sharps and biohazard waste, preventing antibiotic water pollution, and doffing PPE with handwashing before exit.',
      },
      educationalTakeaway: {
        ar: 'مفهوم «الصحة الواحدة» (One Health) يربط بين صحة الإنسان والحيوان والبيئة؛ التخلص الآمن من النفايات والأدوية يحمي الجميع من البكتيريا المقاومة.',
        en: 'The One Health approach links human, animal, and environmental health; safe waste and medication disposal protects everyone from AMR.',
      },
      escalationGuidance: {
        ar: 'للتخلص الآمن من الأدوية المتبقية في المنزل، راجع إرشادات صفحة «التخلص الآمن من المضادات» في الموقع أو استشر الصيدلي.',
        en: 'For safe disposal of leftover household medications, consult the Safe Disposal guide on our website or ask your local pharmacist.',
      },
      sources: [
        {
          title: 'WHO — Safe Management of Wastes from Health-Care Activities',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/publications/i/item/9789241548564',
        },
        {
          title: 'WHO — One Health & Antimicrobial Resistance',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/news-room/fact-sheets/detail/one-health',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STAGE 4 — The Master Exit Vault & Final Escape Protocol
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'escape-stage-4-master-warden-challenge',
      missionIndex: 4,
      requiredMissionId: 'escape-stage-3-waste-segregation-exit',
      unlockRequirementText: {
        ar: 'أكمل المرحلة ٣ (فرز النفايات والبيئة) أولاً لفتح بوابة الخروج الكبرى',
        en: 'Complete Stage 3 (Waste Segregation) first to unlock the Master Exit Vault',
      },
      accentHex: 0x10b981,
      title: {
        ar: 'المرحلة ٤ — بوابة الخروج الكبرى: الشفرة النهائية للهروب الآمن!',
        en: 'Stage 4 — Master Exit Vault: The Final Safe Escape Code!',
      },
      subtitle: {
        ar: 'ادمج أختام الغرف الثلاث في لوحة تحكم البوابة الرئيسية (Master Exit Vault Console) لإتمام الهروب من المختبر بنجاح!',
        en: 'Combine the safety seals from all 3 rooms at the Master Exit Vault Console to complete Escape the Lab 3D!',
      },
      categoryBadge: {
        ar: 'الهروب النهائي • الشفرة الشاملة',
        en: 'Final Escape • Master Safety Vault',
      },
      badgeIcon: '🏆',
      badgeTitle: {
        ar: 'وسام بطل الهروب الآمن من المختبر 3D',
        en: 'Master Lab Escape Safety Champion',
      },
      primaryNpc: 'exitWarden',
      briefing: {
        ar: 'أنت الآن أمام «لوحة تحكم بوابة الخروج الكبرى 3D» عند الجدار الشمالي! افحص اللوحة الرئيسية، وأدخل الإجابات الصحيحة لدمج أختام الغرف الثلاث (نظافة اليدين، سلامة العينات، وحماية البيئة)، ثم تحدث مع المهندسة سلمى للاحتفال بالخروج!',
        en: 'You stand before the 3D Master Exit Vault Console at the north wall! Inspect the console, solve the two-step final safety code combining lessons from all 3 rooms, and talk to Eng. Salma to complete your escape!',
      },
      initialNodeId: 'esc4_start',
      requirePropsSolvedBeforeNodeId: 'esc4_victory',
      interactiveProps: [
        {
          id: 'prop-esc4-master-vault',
          name: {
            ar: 'لوحة تحكم بوابة الخروج الكبرى (Master Exit Vault Console)',
            en: 'Master Exit Vault Security Console',
          },
          stationLabel: {
            ar: 'لوحة بوابة الخروج 3D',
            en: '3D Master Exit Console',
          },
          position: [0.0, 0, -5.8],
          color: 0x10b981,
          accentColor: 0xfacc15,
          iconEmoji: '🔐',
          shape: 'exit_vault_console',
          rewardItem: {
            id: 'keycard-master-escape',
            icon: '🏆',
            label: {
              ar: 'ختم الهروب النهائي: تم فتح بوابة الخروج الكبرى بنجاح!',
              en: 'Master Escape Seal: Exit Vault Unlocked!',
            },
          },
          puzzleSteps: [
            {
              id: 'esc4_mv_s1',
              prompt: {
                ar: 'شفرة البوابة الكبرى (١/٢): تطلب البوابة ترتيب خطوات «الخلع الآمن لمعدات الوقاية والعبور» قبل الخروج من المختبر. أي تسلسل هو الصحيح؟',
                en: 'Master Vault Code (1/2): The vault requests the safe PPE removal (doffing) and exit sequence before leaving the lab. Which sequence is correct?',
              },
              hint: {
                ar: 'القفازات هي الأكثر تلوثاً فتُخلع أولاً، وتنتهي العملية دائماً بغسل/تطهير اليدين جيداً.',
                en: 'Gloves are the most contaminated item and come off first, and the process always ends with thorough hand hygiene.',
              },
              options: [
                {
                  id: 'esc4_mv_o1',
                  label: {
                    ar: 'خلع القفازات أولاً بقلبها للداخل ← خلع الرداء وواقي العينين والكمامة من الخلف دون لمس مقدمتها ← غسل/تطهير اليدين جيداً قبل الخروج',
                    en: 'Remove gloves first (peeling inside-out) → remove gown, eye protection, and mask from the straps/back → wash/sanitize hands thoroughly before exiting',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'تم قبول الشفرة الأولى (١/٢)! خلع القفازات أولاً وعدم لمس مقدمة الكمامة ثم غسل اليدين يمنع التلوث الذاتي.',
                    en: 'Code 1/2 accepted! Removing gloves first, avoiding front-of-mask contact, and washing hands prevents self-contamination.',
                  },
                },
                {
                  id: 'esc4_mv_o2',
                  label: {
                    ar: 'لمس مقدمة الكمامة والعينين بالقفازات المتسخة ثم الخروج للشارع بنفس المعطف والقفازات',
                    en: 'Touch the front of the mask and eyes with soiled gloves, then walk outside wearing the lab coat and gloves',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'تم رفض الشفرة! الخروج بمعدات الوقاية أو لمس الوجه بالقفازات ينقل التلوث خارج الغرفة.',
                    en: 'Code rejected! Wearing PPE outside the work zone or touching the face with soiled gloves spreads contamination.',
                  },
                },
              ],
            },
            {
              id: 'esc4_mv_s2',
              prompt: {
                ar: 'شفرة البوابة الكبرى (٢/٢ — السؤال الحاسم للفتح): كيف يسهم التزامنا بنظافة اليدين والوقاية من العدوى والفرز الآمن للنفايات في حماية فعالية المضادات الحيوية عالمياً؟',
                en: 'Master Vault Code (2/2 — Final Unlock Question): How does strict hand hygiene, infection prevention, and safe waste disposal protect antibiotic effectiveness worldwide?',
              },
              options: [
                {
                  id: 'esc4_mv_s2_o1',
                  label: {
                    ar: 'كل عدوى نمنع حدوثها بالنظافة والوقاية تعني مضاداً حيوياً لم نحتج لصرفه أصلاً، مما يبطئ ظهور السلالات المقاومة (AMR)',
                    en: 'Every infection prevented through hygiene and safety is an antibiotic course never needed, directly slowing antimicrobial resistance (AMR)',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: '🔓 فُتحت بوابة الخروج الكبرى! «الوقاية من العدوى هي خط الدفاع الأول لترشيد المضادات الحيوية».',
                    en: '🔓 Master Exit Vault UNLOCKED! "Every infection prevented is an antibiotic treatment avoided."',
                  },
                },
                {
                  id: 'esc4_mv_s2_o2',
                  label: {
                    ar: 'النظافة والوقاية لا علاقة لهما أبداً بالمضادات الحيوية أو البكتيريا المقاومة',
                    en: 'Hygiene and infection prevention have nothing to do with antibiotics or resistance',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'راجع العلاقة العلمية: منع العدوى يقلل استهلاك المضادات الحيوية ويمنع انتشار البكتيريا المقاومة.',
                    en: 'Review the connection: preventing infections directly reduces antibiotic use and stops resistant bacteria from spreading.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'بوابة الخروج الكبرى: إدخال شفرة الخلع الآمن لمعدات الوقاية والربط بين مكافحة العدوى وترشيد المضادات.',
            en: 'Master Exit Vault: Completed safe PPE doffing sequence and linked IPC with AMR prevention.',
          },
        },
      ],
      nodes: {
        esc4_start: {
          id: 'esc4_start',
          speaker: 'exitWarden',
          targetNpc: 'exitWarden',
          objectiveHint: {
            ar: 'تحدث مع المهندسة سلمى أمام بوابة الخروج الكبرى لبدء التحدي النهائي',
            en: 'Speak with Eng. Salma in front of the Master Exit Vault to begin the final challenge',
          },
          dialogue: {
            ar: 'ها قد وصلنا إلى اللحظة الحاسمة! جميع الحواجز الليزرية خضراء الآن. توجه إلى «لوحة تحكم بوابة الخروج الكبرى 3D» في منتصف الجدار الخلفي، وأجب عن سؤالي الشفرة النهائية لفتح البوابة والهروب بنجاح!',
            en: 'Here is the final moment! All interior laser barriers are green. Walk to the 3D Master Exit Vault Console at the center of the back wall and solve the 2-step final safety code to unlock the exit!',
          },
          choices: [
            {
              id: 'esc4_c1_go',
              label: {
                ar: 'سأفحص لوحة بوابة الخروج الكبرى 3D وأفتح القفل النهائي الآن!',
                en: 'I will inspect the 3D Master Exit Console and unlock the final vault now!',
              },
              nextNodeId: 'esc4_victory',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'انطلق إلى اللوحة الذهبية/الخضراء أمام البوابة ثم عد للاحتفال بالهروب!',
                en: 'Head to the glowing Master Console in front of the vault door, then return to celebrate your escape!',
              },
              rationale: {
                ar: 'الالتزام الكامل ببروتوكول الخروج الآمن يضمن سلامة الفرد والمجتمع.',
                en: 'Completing the full exit safety protocol ensures both personal and community safety.',
              },
            },
          ],
        },
        esc4_victory: {
          id: 'esc4_victory',
          speaker: 'exitWarden',
          targetNpc: 'exitWarden',
          objectiveHint: {
            ar: 'تحدث مع المهندسة سلمى لإتمام الهروب من المختبر 3D واستلام وسام البطولة!',
            en: 'Speak with Eng. Salma to complete Escape the Lab 3D and claim your Master Badge!',
          },
          dialogue: {
            ar: '🎉 مبارك عليك! لقد فُتحت بوابة الخروج الكبرى وأتممت جميع غرف «الهروب من المختبر 3D» بنجاح! ما الشعار الذي ستحمله معك بعد هذه التجربة؟',
            en: '🎉 Congratulations! The Master Exit Vault is wide open and you have conquered all rooms of Escape the Lab 3D! What motto will you carry forward from this experience?',
          },
          choices: [
            {
              id: 'esc4_c2_optimal',
              label: {
                ar: '«الوقاية، نظافة اليدين، وسلامة البيئة والدواء تحمي الجميع وتوقف مقاومة الميكروبات!»',
                en: '"Prevention, hand hygiene, and safe environmental & medication practices protect everyone and stop AMR!"',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: '🏆 هروب ناجح ١٠٠٪! لقد حصلت على وسام بطل الهروب الآمن من المختبر 3D!',
                en: '🏆 100% Successful Escape! You earned the Master Lab Escape Safety Champion Badge!',
              },
              rationale: {
                ar: 'دمج الوقاية من العدوى مع الاستخدام الرشيد للمضادات الحيوية هو الطريق الآمن للمستقبل.',
                en: 'Combining infection prevention with responsible antibiotic stewardship safeguards future health.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'إتمام جميع مراحل الهروب الثلاثية الأبعاد: تعقيم اليدين، ارتداء وخلع معدات الوقاية، سلامة العينات، وفرز النفايات وحماية البيئة.',
        en: 'Completing all 3D escape stages: hand antisepsis, PPE donning/doffing, specimen integrity, waste segregation, and environmental stewardship.',
      },
      educationalTakeaway: {
        ar: 'كل عدوى نمنعها عبر نظافة اليدين وإجراءات السلامة تعني تقليل الحاجة للمضادات الحيوية وحماية فعاليتها للأجيال القادمة.',
        en: 'Every infection prevented through hand hygiene and safety practices reduces the need for antibiotics and preserves their effectiveness for future generations.',
      },
      escalationGuidance: {
        ar: 'هذه اللعبة تجربة تعليمية تفاعلية مبسطة ولا تغني عن التدريب المهني المعتمد أو استشارة المختصين.',
        en: 'This game is a simplified interactive educational experience and does not replace certified institutional training or professional guidance.',
      },
      sources: [
        {
          title: 'WHO — Global Report on Infection Prevention and Control',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/publications/i/item/9789240051164',
        },
        {
          title: 'CDC — Core Infection Prevention and Control Practices',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/infection-control/hcp/core-practices/index.html',
        },
      ],
    },
  ],
};
