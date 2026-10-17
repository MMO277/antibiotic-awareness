import { Cartoon3DGameConfig } from './Cartoon3DGameShell';

export const BACTERIA_LAB_CONFIG: Cartoon3DGameConfig = {
  gameId: 'bacteriaLab',
  route: '/bacteria-lab',
  worldPreset: 'bacteria_lab',
  gameIcon: '🔬',
  gameTitle: {
    ar: 'مختبر البكتيريا 3D (Bacteria Lab)',
    en: 'Bacteria Lab 3D',
  },
  fictionalNoticeBadge: {
    ar: 'مختبر تعليمي خيالي • ليس للتشخيص أو الوصف الطبي',
    en: 'Fictional Educational Lab • Not for Clinical Prescribing',
  },
  loadingTitle: {
    ar: 'جارٍ تجهيز مختبر الميكروبيولوجيا ثلاثي الأبعاد (WebGL)...',
    en: 'Initializing 3D Microbiology Investigation Lab...',
  },
  loadingSubtitle: {
    ar: 'يتم بناء محطة المجهر الضوئي، الحاضنة، جهاز الحساسية الدوائية AST، وفريق المختبر.',
    en: 'Building optical microscope station, agar incubator, AST susceptibility terminal, and lab NPCs.',
  },
  controlsHintTitle: {
    ar: 'طريقة التحقيق في مختبر البكتيريا 3D:',
    en: 'How to Investigate in Bacteria Lab 3D:',
  },
  controlsHintBody: {
    ar: 'تجول بعصا التحكم (أو WASD/الأسهم) بين محطات المختبر المضيئة، استخدم المجهر التفاعلي واقرأ تقارير الحساسية الخيالية (S/I/R)، ثم ناقش النتائج مع أخصائيي المختبر.',
    en: 'Walk using the joystick (or WASD/Arrows) to glowing lab stations, operate the interactive microscope, read fictional AST (S/I/R) reports, and discuss findings with lab specialists.',
  },
  showInventoryBar: true,
  npcs: {
    microbiologist: {
      id: 'microbiologist',
      name: {
        ar: 'د. ليلى (استشارية الميكروبيولوجيا الطبية)',
        en: 'Dr. Laila (Clinical Microbiologist)',
      },
      title: {
        ar: 'إشراف المزارع البكتيرية وصبغة جرام',
        en: 'Microbiology & Gram Stain Lead',
      },
      stationLabel: {
        ar: 'منصة المجهر الضوئي وصبغة جرام',
        en: 'Microscope & Gram Stain Bench',
      },
      position: [-4.5, 0, -2.6],
      rotationY: 0.35,
      outfitColor: 0x0284c7,
      accentColor: 0xffffff,
      skinColor: 0xf6d0b1,
      hatType: 'lab_goggles',
      avatarEmoji: '👩‍🔬',
      defaultGreeting: {
        ar: 'أهلاً بك في مختبر الميكروبيولوجيا التعليمي! تذكّر دائماً أن جميع العينات هنا خيالية، وأن نتائج المختبر لا تُفسّر بمعزل عن التقييم السريري للطبيب.',
        en: 'Welcome to our educational Microbiology Lab! Remember that all samples here are fictional and lab findings must always be paired with qualified clinical assessment.',
      },
    },
    labTech: {
      id: 'labTech',
      name: {
        ar: 'عمر (أخصائي تكنولوجيا المختبرات)',
        en: 'Omar (Medical Lab Technologist)',
      },
      title: {
        ar: 'فحص جودة العينات والحاضنة البكتيرية',
        en: 'Specimen Quality & Agar Incubator Specialist',
      },
      stationLabel: {
        ar: 'محطة الحاضنة وجودة العينات',
        en: 'Incubator & Specimen Bench',
      },
      position: [-5.8, 0, 2.8],
      rotationY: 1.15,
      outfitColor: 0x4f46e5,
      accentColor: 0xe0e7ff,
      skinColor: 0xeab68c,
      hatType: 'lab_goggles',
      avatarEmoji: '🧑‍🔬',
      defaultGreeting: {
        ar: 'أهلاً بك! جودة العينة تبدأ قبل وصولها للمجهر؛ أي تلوث أثناء السحب قد يعطي نتيجة مضللة.',
        en: 'Hello! Specimen quality starts before the microscope; contamination during collection can produce misleading results.',
      },
    },
    stewardshipPharm: {
      id: 'stewardshipPharm',
      name: {
        ar: 'د. كريم (صيدلي ترشيد المضادات الحيوية)',
        en: 'Dr. Karim (Antimicrobial Stewardship Pharmacist)',
      },
      title: {
        ar: 'تفسير تقارير الحساسية الدوائية (AST) وتصنيف AWaRe',
        en: 'AST Interpretation & WHO AWaRe Stewardship',
      },
      stationLabel: {
        ar: 'وحدة تقارير الحساسية الدوائية AST',
        en: 'AST Susceptibility Terminal',
      },
      position: [5.6, 0, 3.0],
      rotationY: -1.25,
      outfitColor: 0x059669,
      accentColor: 0xffffff,
      skinColor: 0xf1c27d,
      hatType: 'pharmacist_glasses',
      avatarEmoji: '👨‍⚕️',
      defaultGreeting: {
        ar: 'مرحباً! تقرير الحساسية (S / I / R) يساعد الفريق الطبي المختص على تضييق الطيف الدوائي (De-escalation) وحماية المضادات الحيوية الاحتياطية.',
        en: 'Welcome! Susceptibility reports (S / I / R) help qualified clinicians narrow therapy (de-escalation) and protect Reserve antibiotics.',
      },
    },
    idDoctor: {
      id: 'idDoctor',
      name: {
        ar: 'د. طارق (استشاري الأمراض المعدية)',
        en: 'Dr. Tarek (Infectious Diseases Consultant)',
      },
      title: {
        ar: 'الربط بين الفحص السريري ونتائج المختبر',
        en: 'Clinical Correlation & Diagnostic Stewardship',
      },
      stationLabel: {
        ar: 'مكتب الاستشارة السريرية والمختبرية',
        en: 'Clinical Correlation Desk',
      },
      position: [4.5, 0, -2.6],
      rotationY: -0.4,
      outfitColor: 0x1e3a8a,
      accentColor: 0x93c5fd,
      skinColor: 0xe5b887,
      hatType: 'doctor_hair',
      avatarEmoji: '🩺',
      defaultGreeting: {
        ar: 'تذكر قاعدتنا الذهبية: نحن نعالج المريض بعد تقييمه سريرياً، ولا نعالج ورقة التحليل بمعزل عن الأعراض.',
        en: 'Remember our golden rule: qualified clinicians treat the patient based on clinical evaluation, not an isolated lab slip.',
      },
    },
  },
  missions: [
    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 1 — Viral vs. Bacterial Pharyngitis Swab Investigation
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'blab-mission-1-throat-swab',
      missionIndex: 1,
      requiredMissionId: null,
      unlockRequirementText: {
        ar: 'متاح للبدء مباشرة (المهمة الأولى)',
        en: 'Unlocked by default (Mission 1)',
      },
      accentHex: 0x0284c7,
      title: {
        ar: 'المهمة ١ — لغز مسحة الحلق: عدوى فيروسية أم بكتيرية؟',
        en: 'Mission 1 — Throat Swab Mystery: Viral or Bacterial?',
      },
      subtitle: {
        ar: 'استخدم المجهر التفاعلي وافحص مسحة الحلق الخيالية (#BL-101) لتحديد ما إذا كان المضاد الحيوي مبرراً علمياً',
        en: 'Operate the interactive microscope and inspect fictional throat swab #BL-101 to see why viral infections do not respond to antibiotics',
      },
      categoryBadge: {
        ar: 'فحص مجهري وتمييز حيوي',
        en: 'Microscopy & Viral vs. Bacterial',
      },
      badgeIcon: '🔬',
      badgeTitle: {
        ar: 'وسام المحقق المجهري الدقيق',
        en: 'Precision Microscope Investigator',
      },
      primaryNpc: 'microbiologist',
      briefing: {
        ar: 'وصلت عينة خيالية (#BL-101) لمريض يعاني من رشح وبحة صوت وسعال خفيف منذ يومين. افحص أولاً «محطة المجهر الضوئي» و«جهاز الاختبار السريع والمزرعة» في الغرفة 3D، ثم ناقش النتيجة مع د. ليلى ود. طارق.',
        en: 'Fictional sample #BL-101 arrived from a case with runny nose, hoarseness, and mild cough for 2 days. Inspect the 3D Optical Microscope Station and the Rapid Strep & Culture Reader first, then consult Dr. Laila and Dr. Tarek.',
      },
      initialNodeId: 'm1_start',
      requirePropsSolvedBeforeNodeId: 'm1_consult_doctor',
      interactiveProps: [
        {
          id: 'prop-blab-m1-microscope',
          name: {
            ar: 'محطة المجهر الضوئي التفاعلي (عينة #BL-101)',
            en: 'Interactive Optical Microscope Station (Sample #BL-101)',
          },
          stationLabel: {
            ar: 'المجهر الضوئي 3D',
            en: '3D Optical Microscope',
          },
          position: [-3.2, 0, -2.8],
          color: 0x0284c7,
          accentColor: 0x38bdf8,
          iconEmoji: '🔬',
          shape: 'microscope_station',
          rewardItem: {
            id: 'clue-m1-slide',
            icon: '🔬',
            label: {
              ar: 'نتيجة المجهر: لا توجد بكتيريا ممرضة',
              en: 'Microscope Clue: No Pathogenic Bacteria',
            },
          },
          microscopeConfig: {
            specimenId: 'BL-101-SWAB',
            specimenTitle: {
              ar: 'شريحة مسحة بلعوم خيالية (#BL-101)',
              en: 'Fictional Pharyngeal Swab Slide (#BL-101)',
            },
            gramStainType: 'viral_no_bacteria',
            targetMagnification: '40x',
            targetFocusRange: [55, 85],
            findingSummary: {
              ar: 'الرؤية واضحة: خلايا طلائية تنفسية طبيعية فقط دون أي تجمعات بكتيرية قيحية (نمط متوافق مع عدوى فيروسية).',
              en: 'Slide in focus: Normal respiratory epithelial cells only with no purulent bacterial clusters (consistent with viral pattern).',
            },
          },
          puzzleSteps: [
            {
              id: 'blab_m1_s1',
              prompt: {
                ar: 'بعد ضبط عدسة المجهر وبؤرة التركيز (Focus) على الشريحة الخيالية #BL-101، ظهرت خلايا طلائية فقط دون بكتيريا ممرضة، مع أعراض رشح وبحة صوت. ماذا تستنتج علمياً؟',
                en: 'After focusing the microscope on fictional slide #BL-101, only respiratory epithelial cells are seen without pathogenic bacteria, alongside runny nose and hoarseness. What does this evidence indicate?',
              },
              hint: {
                ar: 'تذكّر أن الفيروسات لا تُرى بالمجهر الضوئي العادي ولا تستجيب للمضادات الحيوية البكتيرية.',
                en: 'Remember that respiratory viruses are not targets for antibacterial drugs and do not show purulent bacterial chains on routine Gram stain.',
              },
              options: [
                {
                  id: 'blab_m1_o1',
                  label: {
                    ar: 'القرينة تدعم عدوى تنفسية فيروسية؛ المضادات الحيوية البكتيرية لا تفيد هنا',
                    en: 'Evidence supports a viral upper respiratory pattern; antibacterial drugs are ineffective here',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'أحسنت! غياب البكتيريا الممرضة مع أعراض الرشح وبحة الصوت يشير لعدوى فيروسية لا تحتاج لمضاد حيوي.',
                    en: 'Spot on! Absence of bacterial pathogens with coryza and hoarseness indicates a viral infection where antibiotics provide zero benefit.',
                  },
                },
                {
                  id: 'blab_m1_o2',
                  label: {
                    ar: 'يجب إعطاء أقوى مضاد حيوي واسع الطيف احتياطياً لأي زكام',
                    en: 'Give the strongest broad-spectrum antibiotic just in case for any common cold',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'غير صحيح علمياً. المضادات الحيوية لا تعالج الفيروسات بل تسبب آثاراً جانبية وتزيد المقاومة البكتيرية.',
                    en: 'Incorrect. Antibiotics do not treat viruses; unnecessary use causes side effects and drives resistance.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'فحص المجهر (#BL-101): غياب البكتيريا الممرضة (قرينة عدوى فيروسية).',
            en: 'Microscope Inspection (#BL-101): No bacterial pathogen observed (viral etiology clue).',
          },
        },
        {
          id: 'prop-blab-m1-culture',
          name: {
            ar: 'حاضنة المزرعة والاختبار السريع (عينة #BL-101)',
            en: 'Rapid Antigen & Culture Incubator (#BL-101)',
          },
          stationLabel: {
            ar: 'حاضنة المزارع البكتيرية',
            en: 'Culture Incubator',
          },
          position: [2.8, 0, -2.8],
          color: 0x0d9488,
          accentColor: 0x5eead4,
          iconEmoji: '🧫',
          shape: 'agar_incubator',
          rewardItem: {
            id: 'clue-m1-radt',
            icon: '🧫',
            label: {
              ar: 'نتيجة المزرعة: سلبية للمكورات العقدية (Strep A Negative)',
              en: 'Culture Clue: Group A Strep Negative',
            },
          },
          puzzleSteps: [
            {
              id: 'blab_m1_c1',
              prompt: {
                ar: 'يُظهر سجل الحاضنة للحالة الخيالية #BL-101: «الاختبار السريع للمكورات العقدية (RADT): سلبي (Negative) — مزرعة الحلق: فلورا طبيعية فقط (Normal commensal flora)». كيف يفسر المختبر وجود الفلورا الطبيعية؟',
                en: 'The incubator log for fictional case #BL-101 shows: "Rapid Strep Test: Negative — Throat Culture: Normal commensal flora only." How is normal flora interpreted?',
              },
              options: [
                {
                  id: 'blab_m1_co1',
                  label: {
                    ar: 'الفلورا الطبيعية بكتيريا نافعة متعايشة تحمي الأغشية المخاطية ولا يجوز استئصالها بالمضادات',
                    en: 'Normal commensal flora are protective resident microbes and should not be eradicated with antibiotics',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'صحيح تماماً! البكتيريا المتعايشة النافعة جزء من دفاع الجسم الطبيعي.',
                    en: 'Exactly right! Commensal flora protect mucosal surfaces and should be preserved.',
                  },
                },
                {
                  id: 'blab_m1_co2',
                  label: {
                    ar: 'أي بكتيريا طبيعية في الفم يجب القضاء عليها فوراً بالمضادات الحيوية',
                    en: 'Any normal mouth flora must be immediately wiped out with antibiotics',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'انتبه: القضاء على الفلورا النافعة يخل بتوازن الميكروبيوم ويمهد لنمو البكتيريا المقاومة.',
                    en: 'Careful: wiping out normal flora disrupts the microbiome and promotes resistant organisms.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'حاضنة المزارع (#BL-101): سلبية للمكورات العقدية المقيحة مع وجود فلورا طبيعية نافعة فقط.',
            en: 'Incubator (#BL-101): Negative for Group A Strep; only protective normal flora present.',
          },
        },
      ],
      nodes: {
        m1_start: {
          id: 'm1_start',
          speaker: 'microbiologist',
          targetNpc: 'microbiologist',
          objectiveHint: {
            ar: 'تحدث مع د. ليلى عند منصة المجهر الضوئي لبدء فحص العينة الخيالية #BL-101',
            en: 'Speak with Dr. Laila at the Microscope Bench to start investigating fictional sample #BL-101',
          },
          dialogue: {
            ar: 'أهلاً بك في المهمة الأولى! لدينا عينة بلعوم خيالية (#BL-101) لحالة تعاني من رشح وسعال خفيف وبحة صوت. قبل إصدار أي تقرير، كيف نبدأ التحقيق المعملي السليم؟',
            en: 'Welcome to Mission 1! We have a fictional throat sample (#BL-101) from a case with runny nose, mild cough, and hoarseness. Before issuing our lab report, how should we start?',
          },
          choices: [
            {
              id: 'm1_c1_good',
              label: {
                ar: 'نفحص الشريحة بالمجهر التفاعلي ونراجع نتيجة الاختبار السريع والمزرعة في الحاضنة قبل أي استنتاج',
                en: 'Inspect the slide on the 3D Microscope and check the Rapid Strep & Culture Incubator before drawing conclusions',
              },
              nextNodeId: 'm1_consult_doctor',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'بداية علمية ممتازة! توجه الآن لفحص محطة المجهر 3D ومحطة الحاضنة 3D ثم راجع د. طارق.',
                en: 'Excellent scientific workflow! Inspect both the 3D Microscope and 3D Incubator stations, then report to Dr. Tarek.',
              },
              rationale: {
                ar: 'التشخيص الدقيق يعتمد على جمع الأدلة السريرية والمخبرية معاً قبل اتخاذ أي قرار علاجي.',
                en: 'Diagnostic stewardship relies on gathering both clinical and laboratory evidence before making decisions.',
              },
            },
            {
              id: 'm1_c1_bad',
              label: {
                ar: 'نوصي بمضاد حيوي فوراً دون فحص العينة توفيراً للوقت',
                en: 'Recommend an antibiotic immediately without inspecting the sample to save time',
              },
              nextNodeId: 'm1_consult_doctor',
              quality: 'unsafe',
              immediateFeedback: {
                ar: 'ممارسة غير آمنة! معظم التهابات الحلق المصحوبة برشح وبحة صوت هي عدوى فيروسية.',
                en: 'Unsafe practice! Most sore throats accompanied by runny nose and hoarseness are viral.',
              },
              rationale: {
                ar: 'التسرع في صرف المضادات الحيوية للعدوى الفيروسية هو السبب الأول لمقاومة الميكروبات.',
                en: 'Rushing to use antibiotics for viral respiratory infections is a primary driver of AMR.',
              },
            },
          ],
        },
        m1_consult_doctor: {
          id: 'm1_consult_doctor',
          speaker: 'idDoctor',
          targetNpc: 'idDoctor',
          objectiveHint: {
            ar: 'افحص محطتي المجهر والحاضنة 3D أولاً، ثم تحدث مع د. طارق لاعتماد خلاصة الحالة #BL-101',
            en: 'Inspect the 3D Microscope and Incubator stations first, then talk to Dr. Tarek to finalize Case #BL-101',
          },
          dialogue: {
            ar: 'أحسنت في فحص المجهر والحاضنة! العينة الخيالية #BL-101 سلبية للبكتيريا الممرضة والأعراض سريرياً فيروسية. ما الرسالة التثقيفية الصحيحة في التقرير التعليمي؟',
            en: 'Great work inspecting the microscope and incubator! Fictional sample #BL-101 is negative for pathogenic bacteria and the clinical picture is viral. What is the correct educational conclusion?',
          },
          choices: [
            {
              id: 'm1_c2_good',
              label: {
                ar: 'لا حاجة للمضاد الحيوي في العدوى الفيروسية؛ يُكتفى بالرعاية الداعمة بإشراف الطبيب ومراقبة علامات الإنذار',
                en: 'No antibiotic is indicated for viral infection; clinician-guided supportive care and red-flag monitoring are appropriate',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'ممتاز! لقد أنهيت المهمة الأولى بنجاح وفتحت المهمة الثانية.',
                en: 'Outstanding! You completed Mission 1 and unlocked Mission 2.',
              },
              rationale: {
                ar: 'تؤكد منظمة الصحة العالمية (WHO) أن المضادات الحيوية لا تؤثر في الفيروسات وأن الرعاية التلطيفية هي الخيار الآمن.',
                en: 'WHO confirms that antibiotics have zero activity against viruses and supportive care is the safe approach.',
              },
            },
            {
              id: 'm1_c2_caution',
              label: {
                ar: 'إعطاء مضاد حيوي لمدة يومين فقط «كوقاية» رغم سلبية المزرعة',
                en: 'Give a 2-day antibiotic course "just for prevention" despite the negative culture',
              },
              nextNodeId: 'END',
              quality: 'caution',
              immediateFeedback: {
                ar: 'تنبيه: الجرعات القصيرة غير المبررة في العدوى الفيروسية تعرض المريض للآثار الجانبية وتنتخب السلالات المقاومة.',
                en: 'Caution: Unjustified short courses in viral illness expose patients to adverse effects and select for resistance.',
              },
              rationale: {
                ar: 'عندما تكون العدوى فيروسية، فإن أي جرعة مضاد حيوي هي جرعة غير ضرورية.',
                en: 'When an infection is viral, any antibacterial dose is unnecessary.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'فحص الشريحة المجهرية ونتيجة المزرعة السلبية وربطها بالأعراض الفيروسية لتجنب استخدام مضاد حيوي غير مبرر.',
        en: 'Correlating negative microscopy/culture findings with viral symptoms to avoid unnecessary antibiotic exposure.',
      },
      educationalTakeaway: {
        ar: 'المضادات الحيوية مصممة لاستهداف البكتيريا فقط ولا تعالج نزلات البرد أو التهابات الحلق الفيروسية. الفحص المخبري لا يُقرأ بمعزل عن التقييم السريري للطبيب.',
        en: 'Antibiotics target bacteria only and do not cure colds or viral pharyngitis. Lab tests must always be interpreted alongside clinical evaluation.',
      },
      escalationGuidance: {
        ar: 'في الواقع: لا تتناول أو توقف أي دواء بناءً على لعبة تعليمية. راجع الطبيب دائماً، واطلب الطوارئ فوراً عند وجود صعوبة في التنفس أو البلع أو حمى شديدة مستمرة.',
        en: 'In real life: never start or stop medication based on an educational game. Always consult a physician, and seek urgent care for difficulty breathing, inability to swallow, or persistent high fever.',
      },
      sources: [
        {
          title: 'WHO — Antimicrobial Resistance Fact Sheet',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance',
        },
        {
          title: 'CDC — Sore Throat Basics & Antibiotic Use',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/sore-throat/about/index.html',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 2 — Culture & Susceptibility (S / I / R) De-escalation Puzzle
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'blab-mission-2-urine-ast',
      missionIndex: 2,
      requiredMissionId: 'blab-mission-1-throat-swab',
      unlockRequirementText: {
        ar: 'أكمل المهمة ١ (لغز مسحة الحلق) أولاً لفتح هذه المهمة',
        en: 'Complete Mission 1 (Throat Swab Mystery) first to unlock this mission',
      },
      accentHex: 0x059669,
      title: {
        ar: 'المهمة ٢ — قراءة المزرعة والحساسية (S / I / R) وتضييق الطيف',
        en: 'Mission 2 — Reading AST Reports (S / I / R) & De-escalation',
      },
      subtitle: {
        ar: 'حلل تقرير الحساسية الدوائية الخيالي (#BL-102) وتعلّم كيف يختار الأطباء المضاد الأضيق طيفاً (Access) بدلاً من استهلاك مضادات الاحتياط',
        en: 'Analyze fictional susceptibility report #BL-102 and learn how clinicians de-escalate to targeted Access-group therapy',
      },
      categoryBadge: {
        ar: 'تقرير الحساسية AST و AWaRe',
        en: 'AST Report & WHO AWaRe',
      },
      badgeIcon: '📊',
      badgeTitle: {
        ar: 'وسام محلل الحساسية الدوائية (AST)',
        en: 'AST Susceptibility Analyst',
      },
      primaryNpc: 'stewardshipPharm',
      briefing: {
        ar: 'صدرت نتائج المزرعة والحساسية للحالة التعليمية الخيالية (#BL-102). افحص أولاً «محطة المجهر (صبغة جرام)» ثم «جهاز تقارير الحساسية الدوائية AST» في المختبر، ثم ناقش خطة الترشيد (De-escalation) مع د. كريم.',
        en: 'Culture and susceptibility results are ready for fictional educational case #BL-102. First inspect the 3D Microscope Station and the 3D AST Susceptibility Terminal, then discuss de-escalation principles with Dr. Karim.',
      },
      initialNodeId: 'm2_start',
      requirePropsSolvedBeforeNodeId: 'm2_final',
      interactiveProps: [
        {
          id: 'prop-blab-m2-microscope',
          name: {
            ar: 'فحص صبغة جرام للعينة الخيالية (#BL-102)',
            en: 'Gram Stain Microscopy (Fictional Sample #BL-102)',
          },
          stationLabel: {
            ar: 'محطة صبغة جرام 3D',
            en: '3D Gram Stain Microscope',
          },
          position: [-3.2, 0, -2.8],
          color: 0xdb2777,
          accentColor: 0xf472b6,
          iconEmoji: '🔬',
          shape: 'microscope_station',
          rewardItem: {
            id: 'clue-m2-gram',
            icon: '🔬',
            label: {
              ar: 'صبغة جرام: عصيات سالبة الجرام (Gram-Negative Rods)',
              en: 'Gram Stain: Gram-Negative Rods',
            },
          },
          microscopeConfig: {
            specimenId: 'BL-102-GRAM',
            specimenTitle: {
              ar: 'صبغة جرام لعينة خيالية (#BL-102)',
              en: 'Fictional Gram Stain Slide (#BL-102)',
            },
            gramStainType: 'gram_neg_rods',
            targetMagnification: '100x',
            targetFocusRange: [60, 88],
            findingSummary: {
              ar: 'تظهر عصيات وردية/حمراء (سالبة الجرام Gram-negative bacilli) مع خلايا صديدية في الحقل المجهري.',
              en: 'Pink/red rod-shaped bacteria (Gram-negative bacilli) with leukocytes are clearly visible.',
            },
          },
          puzzleSteps: [
            {
              id: 'blab_m2_s1',
              prompt: {
                ar: 'بعد ضبط العدسة الزيتية (100x) وبؤرة التركيز، ظهرت عصيات سالبة الجرام. هل تكفي صبغة جرام وحدها لمعرفة أي مضاد حيوي تتأثر به البكتيريا أم نحتاج لتقرير الحساسية (AST)؟',
                en: 'After focusing with the 100x lens, Gram-negative rods are visible. Is Gram stain alone enough to know exact antibiotic susceptibility, or is an AST report needed?',
              },
              options: [
                {
                  id: 'blab_m2_o1',
                  label: {
                    ar: 'صبغة جرام تحدد الفئة الشكلية الأولية فقط، بينما يحدد اختبار الحساسية (AST) الاستجابة (S/I/R) بدقة',
                    en: 'Gram stain identifies morphology/group only, whereas AST testing determines specific S / I / R susceptibility',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'صحيح! البكتيريا من نفس الفصيلة قد تختلف في مقاومتها، لذا يلزم فحص الحساسية (AST).',
                    en: 'Correct! Organisms with identical Gram morphology can have very different resistance profiles.',
                  },
                },
                {
                  id: 'blab_m2_o2',
                  label: {
                    ar: 'اللون الوردي في صبغة جرام يعني أن جميع المضادات الحيوية ستعمل بنسبة 100% دون فحص',
                    en: 'Pink color on Gram stain guarantees every antibiotic will work 100% without testing',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'غير صحيح. اللون الوردي يدل على جدار الخلية سالب الجرام فقط ولا يكشف جينات المقاومة.',
                    en: 'Incorrect. Pink staining reflects a Gram-negative cell wall, not antibiotic susceptibility.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'صبغة جرام (#BL-102): عصيات سالبة الجرام تتطلب مطابقة مع جدول الحساسية الدوائية (AST).',
            en: 'Gram Stain (#BL-102): Gram-negative rods requiring correlation with the AST susceptibility table.',
          },
        },
        {
          id: 'prop-blab-m2-ast',
          name: {
            ar: 'جهاز تقرير الحساسية الدوائية AST (#BL-102)',
            en: 'AST Susceptibility Report Analyzer (#BL-102)',
          },
          stationLabel: {
            ar: 'شاشة تقرير الحساسية AST',
            en: 'AST Report Terminal',
          },
          position: [4.2, 0, 2.6],
          color: 0x059669,
          accentColor: 0x34d399,
          iconEmoji: '📊',
          shape: 'ast_analyzer',
          rewardItem: {
            id: 'clue-m2-ast',
            icon: '📊',
            label: {
              ar: 'تقرير AST: حساس (S) لـ Nitrofurantoin ومقاوم (R) لـ Ampicillin',
              en: 'AST Clue: Susceptible (S) to Access Agent, Resistant (R) to Ampicillin',
            },
          },
          astReportConfig: {
            reportCode: 'AST-FICT-102',
            fictionalPatientLabel: {
              ar: 'حالة تعليمية خيالية #BL-102 (التهاب مسالك سفلي غير معقد)',
              en: 'Fictional Training Case #BL-102 (Uncomplicated Lower UTI Scenario)',
            },
            specimenSource: {
              ar: 'عينة بول وسطى خيالية (Midstream Urine)',
              en: 'Fictional Midstream Urine Specimen',
            },
            organismName: {
              ar: 'إشريكية قولونية خيالية (Fictional E. coli strain)',
              en: 'Fictional Escherichia coli educational strain',
            },
            colonyCount: {
              ar: '> 100,000 CFU/mL (نمو معنوي في السيناريو)',
              en: '> 100,000 CFU/mL (Significant growth in scenario)',
            },
            rows: [
              {
                antibiotic: { ar: 'أمبيسيلين (Ampicillin)', en: 'Ampicillin' },
                awareCategory: 'Access',
                mic: '>= 32 µg/mL',
                result: 'R',
                note: { ar: 'مقاوم (Resistant) — لا يُستخدم', en: 'Resistant (R) — ineffective' },
              },
              {
                antibiotic: { ar: 'نيتروفورانتوين (Nitrofurantoin)', en: 'Nitrofurantoin' },
                awareCategory: 'Access',
                mic: '<= 16 µg/mL',
                result: 'S',
                note: {
                  ar: 'حساس (Susceptible) — فئة Access موجهة الضيق',
                  en: 'Susceptible (S) — targeted narrow-spectrum Access option',
                },
              },
              {
                antibiotic: { ar: 'سيبروفلوكساسين (Ciprofloxacin)', en: 'Ciprofloxacin' },
                awareCategory: 'Watch',
                mic: '0.5 µg/mL',
                result: 'I',
                note: {
                  ar: 'فئة Watch — يُحفظ للحالات المحددة لتجنب المقاومة والآثار الجانبية',
                  en: 'Watch group — avoid routine first-line use when Access agent is active',
                },
              },
              {
                antibiotic: { ar: 'ميروبينيم (Meropenem)', en: 'Meropenem' },
                awareCategory: 'Reserve',
                mic: '<= 0.25 µg/mL',
                result: 'S',
                note: {
                  ar: 'مضاد وريدي فائق الطيف — يُحفظ للعدوى الحرجة المقاومة بالمستشفيات فقط',
                  en: 'Carbapenem — strictly reserved for severe multidrug-resistant hospital infections',
                },
              },
            ],
            stewardshipNote: {
              ar: 'عندما يُظهر تقرير الحساسية أن البكتيريا حساسة (S) لمضاد موجه ضيق الطيف من فئة Access (ومناسب سريرياً للمريض)، يختاره الطبيب بدلاً من استهلاك مضادات فئة Watch أو Reserve.',
              en: 'When AST confirms susceptibility (S) to an appropriate narrow-spectrum Access agent, clinicians select it rather than overusing Watch or last-resort carbapenem antibiotics.',
            },
          },
          puzzleSteps: [
            {
              id: 'blab_m2_ast_s1',
              prompt: {
                ar: 'انظر إلى جدول الحساسية الخيالي (AST-FICT-102) أعلاه: الميكروب مقاوم (R) للأمبيسيلين، ولكنه حساس (S) للنيتروفورانتوين (فئة Access) وللميروبينيم. وفق مبادئ منظمة الصحة العالمية (WHO AWaRe)، ما المبدأ العلمي الذي يطبقه الطبيب المعالج هنا؟',
                en: 'Review fictional AST report AST-FICT-102 above: the organism is Resistant (R) to Ampicillin, and Susceptible (S) to both Nitrofurantoin (Access group) and Meropenem. According to WHO AWaRe stewardship, what principle applies?',
              },
              hint: {
                ar: 'ابحث عن الخيار الذي يجمع بين كونه حساساً (S) ومن فئة Access الضيقة الطيف، مع ترك مضادات المستشفيات للحالات الحرجة.',
                en: 'Look for the principle that favors a susceptible (S) narrow-spectrum Access agent after clinical assessment, sparing last-resort hospital drugs.',
              },
              options: [
                {
                  id: 'blab_m2_ast_o1',
                  label: {
                    ar: 'بعد تقييم حالة المريض ووظائف أعضائه، يفضل الطبيب المضاد الحساس (S) الأضيق طيفاً من فئة Access لحماية مضادات الطوارئ من المقاومة',
                    en: 'After clinical patient assessment, the clinician selects the appropriate Susceptible (S) narrow-spectrum Access agent to preserve critical broad-spectrum drugs',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'تحليل ممتاز! هذا هو جوهر «تضييق الطيف الدوائي» (De-escalation) في برامج ترشيد المضادات الحيوية.',
                    en: 'Excellent analysis! That is the core principle of antimicrobial de-escalation and WHO AWaRe stewardship.',
                  },
                },
                {
                  id: 'blab_m2_ast_o2',
                  label: {
                    ar: 'اختيار المضاد المكتوب أمامه حرف (R) لأن حرف R يعني أنه سريع المفعول',
                    en: 'Select the drug marked (R) because R stands for Rapid action',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'احذر! حرف (R) في تقرير المزرعة يعني Resistant أي «مقاوم»؛ أي أن البكتيريا لا تتأثر بهذا الدواء.',
                    en: 'Watch out! In an AST report, (R) stands for Resistant — meaning the bacteria will not respond to that antibiotic.',
                  },
                },
                {
                  id: 'blab_m2_ast_o3',
                  label: {
                    ar: 'استخدام أضخم مضاد وريدي للمستشفيات (Meropenem) لكل الحالات البسيطة',
                    en: 'Use last-resort intravenous hospital carbapenems (Meropenem) for every mild case',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'إجراء خاطئ؛ الإفراط في مضادات المستشفيات الواسعة يفقدنا خط الدفاع الأخير ضد البكتيريا الشرسة.',
                    en: 'Incorrect; overusing broad hospital carbapenems destroys our last line of defense against severe infections.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'تقرير الحساسية (#BL-102): التمييز بين S (حساس) و R (مقاوم) وتطبيق مبدأ تضييق الطيف (WHO AWaRe Access).',
            en: 'AST Report (#BL-102): Distinguishing S (Susceptible) vs. R (Resistant) and applying WHO AWaRe de-escalation.',
          },
        },
      ],
      nodes: {
        m2_start: {
          id: 'm2_start',
          speaker: 'stewardshipPharm',
          targetNpc: 'stewardshipPharm',
          objectiveHint: {
            ar: 'تحدث مع د. كريم عند وحدة تقارير الحساسية AST لبدء المهمة الثانية',
            en: 'Speak with Dr. Karim at the AST Susceptibility Terminal to begin Mission 2',
          },
          dialogue: {
            ar: 'مرحباً بك في المهمة الثانية! كثيراً ما يسأل المتدربون: ماذا تعني رموز (S) و (I) و (R) في تقرير المزرعة؟ ولماذا لا نختار دائماً أقوى مضاد حيوي في القائمة؟ هيا نفحص محطة المجهر ومحطة تقرير الحساسية AST للحالة الخيالية #BL-102.',
            en: 'Welcome to Mission 2! Trainees often ask: what do S, I, and R mean on a culture report, and why not just pick the strongest drug on the list? Let’s inspect the 3D Microscope and AST Terminal for fictional case #BL-102.',
          },
          choices: [
            {
              id: 'm2_c1_go',
              label: {
                ar: 'سأفحص صبغة جرام وجدول الحساسية (AST) الآن لتحليل نتائج S / I / R وتصنيف AWaRe',
                en: 'I will inspect the Gram stain and AST report terminal now to analyze the S / I / R and AWaRe data',
              },
              nextNodeId: 'm2_final',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'انطلق! افحص المحطتين المضيئتين في المختبر ثم عد لمناقشة التوصية التثقيفية.',
                en: 'Go ahead! Inspect both glowing 3D stations in the lab, then return to discuss the educational conclusion.',
              },
              rationale: {
                ar: 'مراجعة كل من صبغة جرام ونتيجة الحساسية التفصيلية تمنع العلاج العشوائي.',
                en: 'Reviewing both Gram morphology and susceptibility data prevents guesswork.',
              },
            },
          ],
        },
        m2_final: {
          id: 'm2_final',
          speaker: 'stewardshipPharm',
          targetNpc: 'stewardshipPharm',
          objectiveHint: {
            ar: 'أتمم فحص محطتي صبغة جرام وتقرير AST، ثم تحدث مع د. كريم لإغلاق المهمة',
            en: 'Complete both the 3D Gram Stain and AST Terminal inspections, then speak with Dr. Karim',
          },
          dialogue: {
            ar: 'عمل رائع! بعد فحص تقرير الحساسية الخيالي (#BL-102)، لماذا يُشترط دائماً أن يراجع الطبيب المعالج التقرير مع حالة المريض السريرية بدلاً من أن يشتري المريض الدواء بنفسه من ورقة المزرعة؟',
            en: 'Great job! After reviewing fictional AST report #BL-102, why must a qualified clinician always correlate the report with the patient’s clinical status rather than a patient self-prescribing from a lab sheet?',
          },
          choices: [
            {
              id: 'm2_c2_optimal',
              label: {
                ar: 'لأن اختيار المضاد يعتمد أيضاً على موقع العدوى، وظائف الكلى والكبد، الحساسية الدوائية، الحمل، والتداخلات التي يقيّمها الطبيب والصيدلي',
                en: 'Because safe selection also depends on infection site penetration, renal/hepatic function, allergies, pregnancy, and drug interactions evaluated by clinicians',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'إجابة نموذجية! التقرير المعملي أداة مساعدة بيد الطبيب المختص وليس وصفة طبية جاهزة.',
                en: 'Exemplary answer! A laboratory AST report is a clinical decision tool for qualified providers, never an automatic prescription.',
              },
              rationale: {
                ar: 'المضاد الحساس في أنبوب الاختبار (In vitro) قد لا يناسب مريضاً بعينه بسبب الحساسية أو قصور الكلى أو عدم وصول الدواء لموقع العدوى.',
                en: 'In-vitro susceptibility does not automatically guarantee in-vivo safety or tissue penetration for every patient.',
              },
            },
            {
              id: 'm2_c2_unsafe',
              label: {
                ar: 'يمكن لأي شخص اختيار أي دواء مكتوب أمامه حرف S من الصيدلية مباشرة دون استشارة طبيب',
                en: 'Anyone can buy whichever drug has an "S" next to it directly over the counter without a doctor',
              },
              nextNodeId: 'END',
              quality: 'unsafe',
              immediateFeedback: {
                ar: 'خطأ خطر! الصرف الذاتي حتى مع وجود مزرعة قد يؤدي لحساسية قاتلة أو فشل علاجي.',
                en: 'Dangerous misconception! Self-medication—even with a culture sheet—can cause severe allergic reactions or treatment failure.',
              },
              rationale: {
                ar: 'تفسير المزرعة يتطلب تقييماً طبياً شاملاً لحالة المريض.',
                en: 'Interpreting a culture requires full clinical evaluation of the patient.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'تفسير رموز S / I / R في تقرير المزرعة الخيالي وفهم مبدأ تضييق الطيف الدوائي (De-escalation) بإشراف طبي.',
        en: 'Interpreting S / I / R susceptibility symbols and understanding clinician-led de-escalation using WHO AWaRe principles.',
      },
      educationalTakeaway: {
        ar: 'حرف (S) يعني حساس للمضاد في المختبر، و(R) يعني مقاوم، لكن اختيار العلاج الحقيقي يتطلب دائماً تقييم الطبيب لحالة المريض وموقع العدوى وسجل الحساسية.',
        en: '"S" means Susceptible in vitro and "R" means Resistant, but real treatment selection always requires a physician’s assessment of the patient, site of infection, and safety profile.',
      },
      escalationGuidance: {
        ar: 'لا تحاول أبداً اختيار أو تغيير مضاد حيوي من تلقاء نفسك بناءً على ورقة تحليل. اعرض نتيجة المزرعة دائماً على الطبيب المعالج.',
        en: 'Never select or switch an antibiotic on your own from a lab printout. Always review culture results with your prescribing physician.',
      },
      sources: [
        {
          title: 'WHO AWaRe (Access, Watch, Reserve) Antibiotic Book',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/publications/i/item/9789240062382',
        },
        {
          title: 'CDC — Core Elements of Hospital Antibiotic Stewardship',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/antibiotic-use/core-elements/hospital.html',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 3 — Sample Contamination vs. True Infection
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'blab-mission-3-contaminated-blood',
      missionIndex: 3,
      requiredMissionId: 'blab-mission-2-urine-ast',
      unlockRequirementText: {
        ar: 'أكمل المهمة ٢ (قراءة المزرعة والحساسية) أولاً لفتح هذه المهمة',
        en: 'Complete Mission 2 (Reading AST Reports) first to unlock this mission',
      },
      accentHex: 0x4f46e5,
      title: {
        ar: 'المهمة ٣ — إنذار كاذب أم عدوى حقيقية؟ (تلوث العينة والاستعمار البكتيري)',
        en: 'Mission 3 — False Alarm vs. True Pathogen: Sample Contamination',
      },
      subtitle: {
        ar: 'حقق في عينة خيالية (#BL-103) أظهرت نمواً لبكتيريا جلدية متعايشة في مريض مستقر تماماً، وتعلّم لماذا لا نعالج التلوث المخبري بالمضادات',
        en: 'Investigate fictional sample #BL-103 growing skin flora in a clinically stable case, and learn how diagnostic stewardship prevents treating contaminants',
      },
      categoryBadge: {
        ar: 'جودة العينات ومنع العلاج الزائد',
        en: 'Diagnostic Stewardship & Contamination',
      },
      badgeIcon: '🧪',
      badgeTitle: {
        ar: 'وسام حارس دقة التشخيص المعملي',
        en: 'Diagnostic Stewardship Guardian',
      },
      primaryNpc: 'labTech',
      briefing: {
        ar: 'أثار سجل جودة العينات تنبيهاً حول العينة الخيالية (#BL-103). افحص «كابينة السلامة وسجل سحب العينة» و«محطة المجهر الضوئي»، ثم تشاور مع عمر (أخصائي المختبر) ود. طارق.',
        en: 'The specimen quality log flagged fictional sample #BL-103. Inspect the 3D Biosafety & Collection Log Station and the 3D Microscope Station, then consult Lab Technologist Omar and Dr. Tarek.',
      },
      initialNodeId: 'm3_start',
      requirePropsSolvedBeforeNodeId: 'm3_doctor_review',
      interactiveProps: [
        {
          id: 'prop-blab-m3-hood',
          name: {
            ar: 'سجل جودة سحب العينة وكابينة السلامة (#BL-103)',
            en: 'Specimen Collection Quality Log (#BL-103)',
          },
          stationLabel: {
            ar: 'سجل جودة العينات 3D',
            en: '3D Specimen Quality Log',
          },
          position: [-5.2, 0, 1.2],
          color: 0x4f46e5,
          accentColor: 0x818cf8,
          iconEmoji: '🧪',
          shape: 'biosafety_hood',
          rewardItem: {
            id: 'clue-m3-log',
            icon: '📋',
            label: {
              ar: 'دليل السحب: زجاجة واحدة فقط (1/2) دون تعقيم كافٍ للجلد',
              en: 'Collection Clue: Single bottle (1/2) with skin prep lapse',
            },
          },
          puzzleSteps: [
            {
              id: 'blab_m3_s1',
              prompt: {
                ar: 'يُظهر سجل العينة الخيالية (#BL-103): «تم سحب العينة على عجل دون انتظار جفاف مطهر الجلد، وظهر النمو في زجاجة واحدة فقط من أصل زجاجتين بعد 48 ساعة، بينما المريض الخيالي بلا حمى وعلاماته الحيوية طبيعية تماماً». ما التفسير الأدق؟',
                en: 'Fictional sample log #BL-103 notes: "Skin antiseptic was not allowed to dry before collection; growth appeared in only 1 of 2 bottles at 48h, while the fictional patient is afebrile with normal vitals." What does this clue suggest?',
              },
              options: [
                {
                  id: 'blab_m3_o1',
                  label: {
                    ar: 'قرينة قوية على تلوث العينة ببكتيريا سطح الجلد (Skin Contaminant) أثناء السحب وليس عدوى دموية حقيقية',
                    en: 'Strong evidence of specimen contamination by normal skin flora during collection rather than true bloodstream infection',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'استنتاج دقيق! عدم ترك مطهر الجلد يجف ونمو بكتيريا الجلد في زجاجة واحدة لمريض مستقر يشير لتلوث العينة.',
                    en: 'Spot on! Inadequate skin antisepsis dry time and single-bottle skin flora growth in a stable patient point to contamination.',
                  },
                },
                {
                  id: 'blab_m3_o2',
                  label: {
                    ar: 'طريقة تعقيم الجلد عند السحب لا تؤثر أبداً على نتائج المزرعة',
                    en: 'Skin disinfection technique during collection never affects culture results',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'غير صحيح. تلوث العينة أثناء السحب هو أحد أهم أسباب صرف مضادات حيوية وريدية غير ضرورية في المستشفيات.',
                    en: 'Incorrect. Collection contamination is a major cause of unnecessary IV antibiotic use.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'سجل الجودة (#BL-103): رصد تلوث عينة ناتج عن عدم انتظار جفاف مطهر الجلد قبل السحب.',
            en: 'Quality Log (#BL-103): Identified specimen contamination linked to rushing skin antisepsis drying time.',
          },
        },
        {
          id: 'prop-blab-m3-microscope',
          name: {
            ar: 'المجهر الضوئي: فحص شريحة العينة (#BL-103)',
            en: 'Microscope Slide Inspection (#BL-103)',
          },
          stationLabel: {
            ar: 'المجهر الضوئي 3D',
            en: '3D Optical Microscope',
          },
          position: [-3.2, 0, -2.8],
          color: 0x0284c7,
          accentColor: 0x38bdf8,
          iconEmoji: '🔬',
          shape: 'microscope_station',
          rewardItem: {
            id: 'clue-m3-skin',
            icon: '🔬',
            label: {
              ar: 'فحص الشريحة: مكورات جلدية متعايشة (CoNS)',
              en: 'Slide Clue: Commensal Skin Flora (CoNS)',
            },
          },
          microscopeConfig: {
            specimenId: 'BL-103-SKIN',
            specimenTitle: {
              ar: 'شريحة العينة الخيالية (#BL-103)',
              en: 'Fictional Slide (#BL-103)',
            },
            gramStainType: 'skin_contaminant',
            targetMagnification: '100x',
            targetFocusRange: [55, 85],
            findingSummary: {
              ar: 'خلايا حرشفية سطحية مع عدد قليل من المكورات الجلدية المتعايشة السالبة الكوأجيولاز (CoNS).',
              en: 'Superficial squamous cell with sparse coagulase-negative staphylococci (common skin commensal).',
            },
          },
          puzzleSteps: [
            {
              id: 'blab_m3_m1',
              prompt: {
                ar: 'أظهر المجهر وجود بكتيريا جلدية متعايشة (Coagulase-negative Staphylococci) في عينة وحيدة لمريض خيالي سليم سريرياً ولا يحمل أجهزة تعويضية. كيف يتعامل الفريق الطبي مع هذه النتيجة؟',
                en: 'Microscopy shows commensal skin flora (Coagulase-negative Staphylococci) in a single bottle from a clinically well fictional patient without implanted devices. How do clinicians handle this?',
              },
              options: [
                {
                  id: 'blab_m3_mo1',
                  label: {
                    ar: 'تُفسر النتيجة في ضوء الحالة السريرية كتلوث عينة (Contamination)، مما يجنّب المريض مضادات وريدية قوية غير لازمة',
                    en: 'Correlate clinically as a likely contaminant, avoiding unnecessary toxic IV antibiotics (like vancomycin)',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'أحسنت! التمييز بين التلوث المخبري والعدوى الحقيقية يحمي المرضى من سمية المضادات الوريدية.',
                    en: 'Well done! Distinguishing contamination from true infection protects patients from unnecessary IV antibiotic toxicity.',
                  },
                },
                {
                  id: 'blab_m3_mo2',
                  label: {
                    ar: 'البدء فوراً بمضاد حيوي وريدي لمدة شهر كامل لكل تلوث جلدي عابر',
                    en: 'Start a full month of heavy IV antibiotics for every incidental skin contaminant',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'غير سليم؛ علاج التلوث العابر لدى مريض سليم يسبب آثاراً جانبية خطيرة ومقاومة بكتيرية.',
                    en: 'Unsafe; treating a benign collection contaminant in a well patient causes harm and resistance.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'فحص المجهر (#BL-103): تأكيد نمط الفلورا الجلدية العابرة وأهمية الربط السريري.',
            en: 'Microscope (#BL-103): Confirmed transient skin flora pattern and importance of clinical correlation.',
          },
        },
      ],
      nodes: {
        m3_start: {
          id: 'm3_start',
          speaker: 'labTech',
          targetNpc: 'labTech',
          objectiveHint: {
            ar: 'تحدث مع عمر (أخصائي المختبر) قرب كابينة السلامة لبدء المهمة ٣',
            en: 'Talk to Omar (Lab Technologist) near the Biosafety Cabinet to begin Mission 3',
          },
          dialogue: {
            ar: 'مرحباً! في المهمة الثالثة نواجه تحدياً شائعاً جداً في المستشفيات: متى تكون نتيجة المزرعة الإيجابية عدوى حقيقية، ومتى تكون مجرد «تلوث عينة» (Contamination) أثناء السحب؟ افحص سجل جودة العينات والمجهر للعينة الخيالية #BL-103.',
            en: 'Hello! In Mission 3 we tackle a classic hospital challenge: when does a positive culture represent true infection versus specimen contamination during collection? Inspect the 3D Quality Log and Microscope for fictional case #BL-103.',
          },
          choices: [
            {
              id: 'm3_c1_start',
              label: {
                ar: 'سأفحص سجل سحب العينة والشريحة المجهرية للتحقق من احتمال التلوث',
                en: 'I will inspect the collection log and microscope slide to evaluate possible contamination',
              },
              nextNodeId: 'm3_doctor_review',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'ممتاز! اجمع الدليلين من المحطات ثلاثية الأبعاد ثم توجه إلى د. طارق.',
                en: 'Great! Gather both clues from the 3D stations, then report to Dr. Tarek.',
              },
              rationale: {
                ar: 'التحقق من جودة ما قبل التحليل (Pre-analytical quality) خطوة أساسية في ترشيد التشخيص.',
                en: 'Verifying pre-analytical specimen quality is essential to diagnostic stewardship.',
              },
            },
          ],
        },
        m3_doctor_review: {
          id: 'm3_doctor_review',
          speaker: 'idDoctor',
          targetNpc: 'idDoctor',
          objectiveHint: {
            ar: 'بعد حل محطتي سجل الجودة والمجهر، تحدث مع د. طارق لاعتماد القرار التعليمي',
            en: 'After solving the Quality Log and Microscope stations, talk to Dr. Tarek to finalize Mission 3',
          },
          dialogue: {
            ar: 'تحقيق ممتاز! العينة الخيالية #BL-103 أظهرت تلوثاً بفلورا الجلد في مريض مستقر تماماً بلا أعراض عدوى. ماذا نسمي المبدأ العلمي الذي يمنع وصف مضادات حيوية لمجرد وجود بكتيريا غير مسببة للمرض؟',
            en: 'Excellent investigation! Fictional sample #BL-103 showed skin flora contamination in a completely stable, asymptomatic case. What principle prevents prescribing antibiotics for harmless colonization or contamination?',
          },
          choices: [
            {
              id: 'm3_c2_optimal',
              label: {
                ar: 'ترشيد التشخيص والربط السريري (Diagnostic Stewardship): نعالج المريض المصاب بعدوى فعلية بعد تقييم الطبيب، ولا نعالج التلوث أو الاستعمار البكتيري غير العرضي',
                en: 'Diagnostic Stewardship & Clinical Correlation: qualified clinicians treat true clinical infections, not sample contaminants or asymptomatic colonization',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'رائع! لقد أكملت المهمة الثالثة بنجاح وفتحت المهمة الرابعة والأخيرة في المختبر.',
                en: 'Bravo! You completed Mission 3 and unlocked Mission 4.',
              },
              rationale: {
                ar: 'تجنب علاج التلوث المخبري أو البكتيريا غير العرضية يقلل الهدر الدوائي ويحمي المرضى.',
                en: 'Avoiding treatment of contaminants or asymptomatic colonization prevents unnecessary toxicity and resistance.',
              },
            },
            {
              id: 'm3_c2_unsafe',
              label: {
                ar: 'إعطاء مضادات حيوية لأي شخص حتى لو لم يكن مريضاً طالما ظهرت أي بكتيريا في الأنبوب',
                en: 'Give antibiotics to everyone regardless of symptoms whenever any bacteria appear in a tube',
              },
              nextNodeId: 'END',
              quality: 'unsafe',
              immediateFeedback: {
                ar: 'غير آمن! علاج التلوث المخبري يعرّض المريض لمخاطر دوائية دون أي فائدة.',
                en: 'Unsafe! Treating laboratory contamination exposes patients to drug risks with zero benefit.',
              },
              rationale: {
                ar: 'النتيجة المخبرية تُفسر دائماً ضمن السياق السريري للمريض.',
                en: 'Laboratory results must always be interpreted within the patient’s clinical context.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'اكتشاف تلوث العينة (Pre-analytical contamination) والربط مع الحالة السريرية المستقرة لمنع استخدام مضاد حيوي غير مبرر.',
        en: 'Identifying pre-analytical specimen contamination and correlating with stable clinical status to prevent unnecessary antibiotics.',
      },
      educationalTakeaway: {
        ar: 'التعقيم السليم عند سحب العينات يمنع النتائج الإيجابية الكاذبة. الطبيب المختص يقارن دائماً بين نتيجة المزرعة وأعراض المريض الحقيقية قبل اتخاذ أي قرار.',
        en: 'Proper aseptic collection prevents false-positive cultures. Qualified clinicians always correlate culture reports with actual clinical signs before deciding on therapy.',
      },
      escalationGuidance: {
        ar: 'في الواقع: إذا ظهرت علامات عدوى حقيقية مثل الحمى الشديدة أو الرعشة أو هبوط الضغط، يجب مراجعة الطوارئ فوراً للتقييم الطبي.',
        en: 'In real life: if true warning signs appear—such as high fever, rigors, or low blood pressure—seek urgent medical evaluation immediately.',
      },
      sources: [
        {
          title: 'CDC — Core Elements of Hospital Diagnostic Excellence',
          publisher: 'CDC',
          url: 'https://www.cdc.gov/antibiotic-use/core-elements/hospital.html',
        },
        {
          title: 'WHO — Diagnostic Stewardship: A Guide to Implementation',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/publications/i/item/WHO-DGO-AMR-2016.3',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 4 — Multidrug Resistance (ESBL) & Reserve Stewardship
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'blab-mission-4-esbl-stewardship',
      missionIndex: 4,
      requiredMissionId: 'blab-mission-3-contaminated-blood',
      unlockRequirementText: {
        ar: 'أكمل المهمة ٣ (إنذار كاذب أم عدوى حقيقية؟) أولاً لفتح المهمة الختامية',
        en: 'Complete Mission 3 (False Alarm vs. True Pathogen) first to unlock the final mission',
      },
      accentHex: 0xd97706,
      title: {
        ar: 'المهمة ٤ — البكتيريا المقاومة (ESBL) وحماية خط الدفاع الأخير',
        en: 'Mission 4 — Multidrug Resistance (ESBL) & Protecting Last-Resort Care',
      },
      subtitle: {
        ar: 'ادرس سلالة خيالية منتجة لإنزيمات البيتالاكتاماز ممتدة الطيف (#BL-104) وتعرّف على دور مكافحة العدوى واستشارة المختصين',
        en: 'Examine fictional ESBL-producing strain #BL-104 and learn how AST interpretation, infection control, and specialist consultation work together',
      },
      categoryBadge: {
        ar: 'مقاومة متعددة وحوكمة المضادات',
        en: 'MDR / ESBL & Reserve Stewardship',
      },
      badgeIcon: '🛡️',
      badgeTitle: {
        ar: 'وسام كبير محققي مختبر البكتيريا',
        en: 'Master Microbiology Lab Investigator',
      },
      primaryNpc: 'idDoctor',
      briefing: {
        ar: 'في المهمة الختامية لمختبر البكتيريا، رصدت الحاضنة سلالة خيالية متعددة المقاومة (#BL-104). افحص «تقرير الحساسية المتقدم AST» و«حاضنة أطباق الآغار»، ثم اجتمع مع د. طارق لإتمام التحقيق.',
        en: 'In the final Bacteria Lab mission, the incubator flagged a fictional multidrug-resistant strain (#BL-104). Inspect the 3D AST Analyzer and 3D Agar Incubator, then meet Dr. Tarek to complete the investigation.',
      },
      initialNodeId: 'm4_start',
      requirePropsSolvedBeforeNodeId: 'm4_complete',
      interactiveProps: [
        {
          id: 'prop-blab-m4-ast',
          name: {
            ar: 'تقرير الحساسية لسلالة خيالية متعددة المقاومة (#BL-104)',
            en: 'Fictional Multidrug-Resistant AST Report (#BL-104)',
          },
          stationLabel: {
            ar: 'جهاز AST المتقدم 3D',
            en: '3D Advanced AST Terminal',
          },
          position: [4.2, 0, 2.6],
          color: 0xd97706,
          accentColor: 0xfbbf24,
          iconEmoji: '📊',
          shape: 'ast_analyzer',
          rewardItem: {
            id: 'clue-m4-esbl',
            icon: '🛡️',
            label: {
              ar: 'تقرير #BL-104: نمط إنزيم ESBL يتطلب إشراف استشاري',
              en: 'Report #BL-104: ESBL Pattern Requiring Specialist Consult',
            },
          },
          astReportConfig: {
            reportCode: 'AST-FICT-104-ESBL',
            fictionalPatientLabel: {
              ar: 'حالة تعليمية خيالية #BL-104 (عدوى معقدة داخل المستشفى)',
              en: 'Fictional Hospital Educational Case #BL-104',
            },
            specimenSource: {
              ar: 'عينة سريرية خيالية بالمستشفى',
              en: 'Fictional Inpatient Clinical Specimen',
            },
            organismName: {
              ar: 'كليبسيلا رئوية خيالية منتجة لـ ESBL (Fictional ESBL K. pneumoniae)',
              en: 'Fictional ESBL-producing Klebsiella strain',
            },
            colonyCount: {
              ar: 'نمو نقي — تنبيه مقاومة متعددة (MDR Alert)',
              en: 'Pure growth — Multidrug Resistance Educational Alert',
            },
            rows: [
              {
                antibiotic: { ar: 'سيفترياكسون (Ceftriaxone)', en: 'Ceftriaxone' },
                awareCategory: 'Watch',
                mic: '>= 64 µg/mL',
                result: 'R',
                note: {
                  ar: 'مقاوم (R) بسبب إنزيم ESBL الذي يكسر السيفالوسبورينات',
                  en: 'Resistant (R) due to ESBL enzyme hydrolyzing 3rd-gen cephalosporins',
                },
              },
              {
                antibiotic: { ar: 'أموكسيسيلين (Amoxicillin)', en: 'Amoxicillin' },
                awareCategory: 'Access',
                mic: '>= 32 µg/mL',
                result: 'R',
                note: { ar: 'مقاوم (R)', en: 'Resistant (R)' },
              },
              {
                antibiotic: { ar: 'إرتابينيم / ميروبينيم (Carbapenem)', en: 'Carbapenem (Specialist Managed)' },
                awareCategory: 'Reserve',
                mic: '<= 0.25 µg/mL',
                result: 'S',
                note: {
                  ar: 'حساس (S) — يُصرف حصرياً تحت إشراف فريق الأمراض المعدية بالمستشفى',
                  en: 'Susceptible (S) — strictly managed by hospital ID/stewardship specialists',
                },
              },
            ],
            stewardshipNote: {
              ar: 'توضح هذه الحالة الخيالية كيف يؤدي الاستخدام العشوائي للمضادات في المجتمع إلى ظهور سلالات مقاومة (ESBL) لا تستجيب للعلاجات المعتادة وتتطلب رعاية تخصصية وعزلاً تلامسياً.',
              en: 'This fictional case illustrates how antibiotic misuse selects for ESBL strains that resist standard drugs and require hospital specialist management and contact precautions.',
            },
          },
          puzzleSteps: [
            {
              id: 'blab_m4_s1',
              prompt: {
                ar: 'في التقرير الخيالي (AST-FICT-104-ESBL)، البكتيريا مقاومة (R) للسيفترياكسون والأموكسيسيلين بسبب إنتاج إنزيم ESBL. ما الإجراء المؤسسي السليم داخل المستشفى؟',
                en: 'In fictional report AST-FICT-104-ESBL, the organism is Resistant (R) to Ceftriaxone and Amoxicillin due to ESBL production. What is the proper hospital stewardship workflow?',
              },
              options: [
                {
                  id: 'blab_m4_o1',
                  label: {
                    ar: 'إبلاغ استشاري الأمراض المعدية وصيدلي الترشيد فوراً وتطبيق احتياطات مكافحة العدوى لمنع انتقال السلالة',
                    en: 'Notify the Infectious Diseases consultant and stewardship pharmacist immediately and apply infection-prevention precautions',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'صحيح تماماً! السلالات متعددة المقاومة تتطلب إشرافاً طبياً متخصصاً وإجراءات عزل وتطهير صارمة.',
                    en: 'Correct! Multidrug-resistant organisms require specialist-guided therapy and strict infection control.',
                  },
                },
                {
                  id: 'blab_m4_o2',
                  label: {
                    ar: 'تجاهل تقرير المقاومة والاستمرار على الدواء المقاوم (R) بجرعة مضاعفة عشوائياً',
                    en: 'Ignore the resistance report and randomly double the dose of the Resistant (R) drug',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'خطر! إنزيم ESBL يحطم الدواء المقاوم، وتجاهل التقرير يعرض المريض لتدهور خطير.',
                    en: 'Unsafe! ESBL enzymes inactivate the resistant drug; ignoring the AST report risks severe clinical deterioration.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'تقرير AST (#BL-104): فهم آلية مقاومة ESBL وأهمية إشراف استشاري الأمراض المعدية.',
            en: 'AST Report (#BL-104): Understanding ESBL resistance and specialist stewardship escalation.',
          },
        },
        {
          id: 'prop-blab-m4-incubator',
          name: {
            ar: 'محطة مكافحة العدوى وتنبيه العزل التلامسي (#BL-104)',
            en: 'IPC Contact Precautions & Lab Alert Station (#BL-104)',
          },
          stationLabel: {
            ar: 'محطة تنبيه المقاومة 3D',
            en: '3D MDR IPC Alert Station',
          },
          position: [2.8, 0, -2.8],
          color: 0x0d9488,
          accentColor: 0x2dd4bf,
          iconEmoji: '🧫',
          shape: 'agar_incubator',
          rewardItem: {
            id: 'clue-m4-ipc',
            icon: '🧤',
            label: {
              ar: 'بروتوكول IPC: تفعيل نظافة اليدين والاحتياطات التلامسية',
              en: 'IPC Clue: Hand Hygiene & Contact Precautions Activated',
            },
          },
          puzzleSteps: [
            {
              id: 'blab_m4_ipc1',
              prompt: {
                ar: 'إلى جانب اختيار العلاج المناسب بإشراف الطبيب، كيف نمنع انتقال البكتيريا المقاومة (مثل ESBL) بين المرضى داخل المنشأة الصحية؟',
                en: 'Alongside clinician-guided therapy, how do healthcare teams prevent resistant bacteria (like ESBL) from spreading between patients?',
              },
              options: [
                {
                  id: 'blab_m4_ipco1',
                  label: {
                    ar: 'الالتزام الصارم باللحظات الخمس لنظافة اليدين (WHO 5 Moments)، ارتداء القفازات والرداء الواقي عند اللزوم، وتطهير الأسطح',
                    en: 'Strict adherence to WHO 5 Moments for Hand Hygiene, appropriate contact PPE, and environmental disinfection',
                  },
                  isCorrect: true,
                  feedback: {
                    ar: 'ممتاز! منع انتقال العدوى يقلل الحاجة أصلاً لاستخدام المضادات الحيوية.',
                    en: 'Excellent! Preventing transmission reduces the need for antibiotics in the first place.',
                  },
                },
                {
                  id: 'blab_m4_ipco2',
                  label: {
                    ar: 'رش المضادات الحيوية في هواء الغرفة بدلاً من غسل اليدين',
                    en: 'Spraying antibiotics into the room air instead of washing hands',
                  },
                  isCorrect: false,
                  feedback: {
                    ar: 'خاطئ تماماً! رش المضادات في البيئة خطر ويزيد التلوث والمقاومة؛ النظافة والتطهير القياسي هما الحل.',
                    en: 'Completely false! Environmental antibiotic spraying is hazardous and drives resistance; hand hygiene and disinfection are key.',
                  },
                },
              ],
            },
          ],
          completionClueSummary: {
            ar: 'محطة مكافحة العدوى (#BL-104): ربط نتائج المختبر باحتياطات منع انتقال العدوى.',
            en: 'IPC Station (#BL-104): Linking lab resistance alerts with contact precautions and hand hygiene.',
          },
        },
      ],
      nodes: {
        m4_start: {
          id: 'm4_start',
          speaker: 'idDoctor',
          targetNpc: 'idDoctor',
          objectiveHint: {
            ar: 'تحدث مع د. طارق لبدء المهمة الرابعة والأخيرة في مختبر البكتيريا',
            en: 'Talk to Dr. Tarek to start Mission 4 in Bacteria Lab',
          },
          dialogue: {
            ar: 'مرحباً بك في المهمة الختامية لمختبر البكتيريا! سنرى اليوم لماذا نحرص بشدة على ترشيد المضادات الحيوية: أمامنا حالة تعليمية خيالية (#BL-104) لبكتيريا طورت مقاومة للعديد من الأدوية المعتادة. افحص جهاز AST المتقدم ومحطة تنبيه مكافحة العدوى أولاً.',
            en: 'Welcome to the final mission of Bacteria Lab! Today we see why antibiotic stewardship matters so much: fictional case #BL-104 involves a strain resistant to multiple routine agents. Inspect the 3D AST Analyzer and IPC Alert Station first.',
          },
          choices: [
            {
              id: 'm4_c1_go',
              label: {
                ar: 'سأفحص تقرير الحساسية المتقدم وبروتوكول مكافحة العدوى الآن',
                en: 'I will inspect the advanced AST report and IPC protocol station now',
              },
              nextNodeId: 'm4_complete',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'بالتوفيق! أتمم فحص المحطتين ثم عد لإغلاق ملف المختبر.',
                en: 'Good luck! Complete both station inspections, then return to wrap up the lab investigation.',
              },
              rationale: {
                ar: 'مكافحة البكتيريا المقاومة تتطلب تكاملاً بين التشخيص المخبري الدقيق، الإشراف السريري، ومنع العدوى.',
                en: 'Tackling MDR bacteria requires integrating accurate lab diagnostics, clinical stewardship, and IPC.',
              },
            },
          ],
        },
        m4_complete: {
          id: 'm4_complete',
          speaker: 'idDoctor',
          targetNpc: 'idDoctor',
          objectiveHint: {
            ar: 'بعد حل المحطتين، تحدث مع د. طارق لإتمام جميع مهام مختبر البكتيريا 3D',
            en: 'After solving both stations, speak with Dr. Tarek to complete Bacteria Lab 3D',
          },
          dialogue: {
            ar: 'أحسنت صنعاً في جميع مهام مختبر البكتيريا! ما الخلاصة الأهم التي نخرج بها حول دور المختبر في اختيار المضاد الحيوي؟',
            en: 'Outstanding work across all Bacteria Lab missions! What is our overarching takeaway on the role of the laboratory in antibiotic stewardship?',
          },
          choices: [
            {
              id: 'm4_c2_optimal',
              label: {
                ar: 'اختيار المضاد الحيوي الصحيح يعتمد على التقييم السريري للطبيب المؤهل مدعوماً بنتائج مزرعة وحساسية موثوقة، مع عدم استخدام المضادات للعدوى الفيروسية',
                en: 'Safe antibiotic selection requires qualified clinical assessment supported by reliable susceptibility results, while never using antibiotics for viral infections',
              },
              nextNodeId: 'END',
              quality: 'optimal',
              immediateFeedback: {
                ar: 'تهانينا! لقد أتممت جميع مهام «مختبر البكتيريا 3D» بنجاح كامل!',
                en: 'Congratulations! You have completed all missions in Bacteria Lab 3D!',
              },
              rationale: {
                ar: 'التكامل بين الطبيب والصيدلي والمختبر هو الركيزة الأساسية لحماية فعالية المضادات الحيوية.',
                en: 'Collaboration between clinicians, pharmacists, and the microbiology lab safeguards antibiotic effectiveness.',
              },
            },
          ],
        },
      },
      safeActionDemonstrated: {
        ar: 'تحليل تقرير بكتيريا مقاومة (ESBL) وتفعيل مسار استشارة الأمراض المعدية واحتياطات مكافحة العدوى.',
        en: 'Analyzing an ESBL resistance report and activating specialist consultation and infection-prevention precautions.',
      },
      educationalTakeaway: {
        ar: 'مقاومة الميكروبات للمضادات الحيوية (AMR) تجعل علاج العدوى أصعب. ترشيد الاستهلاك، منع الصرف دون وصفة، والالتزام بنظافة اليدين يحمي خط الدفاع الأخير للجميع.',
        en: 'Antimicrobial resistance (AMR) makes infections harder to treat. Avoiding OTC antibiotic misuse and practicing hand hygiene preserves last-resort treatments for everyone.',
      },
      escalationGuidance: {
        ar: 'هذه اللعبة للتوعية فقط ولا تقدم أي نصائح علاجية أو جرعات دوائية. استشر دائماً طبيباً مرخصاً لأي حالة صحية.',
        en: 'This game is for educational awareness only and never provides prescribing or dosing advice. Always consult a licensed physician for any health concern.',
      },
      sources: [
        {
          title: 'WHO Global Action Plan on Antimicrobial Resistance',
          publisher: 'World Health Organization',
          url: 'https://www.who.int/publications/i/item/9789241509763',
        },
        {
          title: 'Egyptian Drug Authority (EDA) — Rational Antibiotic Use',
          publisher: 'EDA Egypt',
          url: 'https://edaegypt.gov.eg',
        },
      ],
    },
  ],
};
