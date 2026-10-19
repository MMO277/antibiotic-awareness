import { Cartoon3DGameConfig } from './Cartoon3DGameShell';

export const NURSE_ACADEMY_CONFIG: Cartoon3DGameConfig = {
  "gameId": "nurseAcademy",
  "route": "/nurse-academy",
  "worldPreset": "nurse_academy",
  "gameIcon": "🎓",
  "gameTitle": {
    "ar": "أكاديمية التمريض 3D: محاكاة المهارات السريرية وسلامة المرضى",
    "en": "Nurse Academy 3D: Clinical Nursing & Patient Safety Simulator"
  },
  "fictionalNoticeBadge": {
    "ar": "أكاديمية تدريب تمريضي خيالية • للتوعية وسلامة المرضى فقط",
    "en": "Fictional Nursing Simulation • Patient Safety Education Only"
  },
  "loadingTitle": {
    "ar": "جارٍ تجهيز أكاديمية التمريض ثلاثية الأبعاد (WebGL)...",
    "en": "Initializing Nurse Academy 3D Simulation Center..."
  },
  "loadingSubtitle": {
    "ar": "يتم بناء محطات المهارات التمريضية، قوائم الفحص السريري، ومنصة التسليم SBAR.",
    "en": "Building 3D nursing skill stations, bedside safety checklists, and SBAR handover podium."
  },
  "controlsHintTitle": {
    "ar": "طريقة التدريب في أكاديمية التمريض 3D:",
    "en": "How to Train in Nurse Academy 3D:"
  },
  "controlsHintBody": {
    "ar": "تحرك بعصا التحكم (أو WASD/الأسهم) لفحص محطة البروتوكول التمريضي المضيئة أولاً، ثم تحدث مع المريض والمشرفين لتطبيق المهارة السريرية.",
    "en": "Use the joystick (or WASD/Arrows) to inspect the glowing 3D Nursing Protocol Station first, then speak with the patient and preceptors."
  },
  "showInventoryBar": true,
  "npcs": {
    "educatorMona": {
      "id": "educatorMona",
      "name": {
        "ar": "أ. منى (مدربة التمريض الإكلينيكي)",
        "en": "Educator Mona (Clinical Nurse Educator)"
      },
      "title": {
        "ar": "قائدة التدريب السريري وسلامة المرضى",
        "en": "Clinical Skills & Patient Safety Lead"
      },
      "stationLabel": {
        "ar": "منصة تدريب التمريض والتسليم SBAR",
        "en": "Nursing Education & SBAR Podium"
      },
      "position": [
        -6.2,
        0,
        -3.2
      ],
      "rotationY": 0.4,
      "outfitColor": 165063,
      "accentColor": 3718648,
      "skinColor": 15976096,
      "hatType": "nurse_cap",
      "avatarEmoji": "👩‍⚕️",
      "defaultGreeting": {
        "ar": "أهلاً بك في أكاديمية التمريض ثلاثية الأبعاد! افحص محطة التدريب المضيئة في الجناح وطبّق خطوات سلامة المرضى بدقة.",
        "en": "Welcome to Nurse Academy 3D! Inspect the glowing training station in the ward and apply patient safety standards."
      }
    },
    "preceptorKareem": {
      "id": "preceptorKareem",
      "name": {
        "ar": "م. كريم (مشرف التمريض السريري)",
        "en": "Preceptor Kareem (Charge Nurse Preceptor)"
      },
      "title": {
        "ar": "مشرف جودة الرعاية ومكافحة العدوى",
        "en": "Ward Preceptor & IPC Champion"
      },
      "stationLabel": {
        "ar": "ركن مكافحة العدوى وجودة الرعاية",
        "en": "IPC & Clinical Skills Preceptor Zone"
      },
      "position": [
        6.2,
        0,
        -3.2
      ],
      "rotationY": -0.4,
      "outfitColor": 889992,
      "accentColor": 3003583,
      "skinColor": 15119498,
      "hatType": "nurse_cap",
      "avatarEmoji": "🧑‍⚕️",
      "defaultGreeting": {
        "ar": "مرحباً! الالتزام باللحظات الخمس لنظافة اليدين وقوائم الفحص السريري يحمي المرضى والطاقم الطبي معاً.",
        "en": "Hello! Upholding the WHO 5 Moments for Hand Hygiene and clinical safety checklists protects patients and staff alike."
      }
    },
    "patientSamira": {
      "id": "patientSamira",
      "name": {
        "ar": "أ. سميرة (مريضة محاكاة تدريبية)",
        "en": "Ms. Samira (Simulated Training Patient)"
      },
      "title": {
        "ar": "مريضة محاكاة في جناح التدريب",
        "en": "Standardized Patient Actor"
      },
      "stationLabel": {
        "ar": "سرير المحاكاة التدريبي (أ. سميرة)",
        "en": "Simulated Patient Bed (Ms. Samira)"
      },
      "position": [
        -5.8,
        0,
        3.4
      ],
      "rotationY": 1.25,
      "outfitColor": 8141549,
      "accentColor": 12616956,
      "skinColor": 16041893,
      "hatType": "patient_band",
      "avatarEmoji": "🧑",
      "defaultGreeting": {
        "ar": "أهلاً بك يا ممرض/ة. شكراً لحرصك على التحقق من هويتي وسلامة أدويتي قبل أي إجراء.",
        "en": "Hello nurse! Thank you for verifying my identity and medication safety before any care."
      }
    },
    "doctorTarek": {
      "id": "doctorTarek",
      "name": {
        "ar": "د. طارق (الطبيب المناوب في الجناح)",
        "en": "Dr. Tarek (Attending Ward Physician)"
      },
      "title": {
        "ar": "استشاري الباطنة وحوكمة المضادات الحيوية",
        "en": "Internal Medicine & Stewardship Physician"
      },
      "stationLabel": {
        "ar": "مكتب الاستشارة الطبية وحوكمة المضادات",
        "en": "Physician Consult & Stewardship Desk"
      },
      "position": [
        5.8,
        0,
        3.4
      ],
      "rotationY": -1.25,
      "outfitColor": 16777215,
      "accentColor": 2450411,
      "skinColor": 14724226,
      "hatType": "doctor_hair",
      "avatarEmoji": "👨‍⚕️",
      "defaultGreeting": {
        "ar": "مرحباً! التواصل المنظم بين التمريض والأطباء عبر نموذج SBAR يضمن التدخل السريع وترشيد المضادات الحيوية.",
        "en": "Welcome! Structured nurse-physician communication via SBAR ensures timely escalation and rational antibiotic stewardship."
      }
    }
  },
  "missions": [
    {
      "id": "na-scen-1-patient-id-comm",
      "missionIndex": 1,
      "requiredMissionId": null,
      "unlockRequirementText": {
        "ar": "متاح للبدء مباشرة (المرحلة الأولى)",
        "en": "Unlocked by default (Stage 1)"
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 1: التحقق من هوية المريض والتواصل العلاجي",
        "en": "Scenario 1: Patient Identification & Therapeutic Communication"
      },
      "subtitle": {
        "ar": "استخدام معرّفين مستقلين والاستماع الفعّال قبل أي إجراء تمريضي (حالة تعليمية خيالية)",
        "en": "Verify two independent patient identifiers and establish therapeutic rapport before care (fictional scenario)"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #1",
        "en": "Nursing Safety Scenario #1"
      },
      "badgeIcon": "🪪",
      "badgeTitle": {
        "ar": "🪪 حارس الهوية والتواصل العلاجي",
        "en": "🪪 Patient ID & Rapport Guardian"
      },
      "primaryNpc": "patientSamira",
      "briefing": {
        "ar": "في جناح التدريب يوجد مريضان يحملان الاسم الأول نفسه \"سميرة\". قبل سحب أي عينة أو إعطاء أي رعاية، تدرب على التحقق من الهوية بمعرّفين مستقلين والتواصل العلاجي المطمئن.",
        "en": "Two patients on the training ward share the first name \"Samira\". Practice verifying two independent identifiers and communicating empathetically before performing any care."
      },
      "initialNodeId": "patientSamira_start",
      "requirePropsSolvedBeforeNodeId": "patientSamira_start",
      "interactiveProps": [
        {
          "id": "prop-wristband-scanner",
          "name": {
            "ar": "فحص بروتوكول التحقق من هوية المريض",
            "en": "Patient Identification Protocol Check"
          },
          "stationLabel": {
            "ar": "محطة التحقق من سوار المعصم",
            "en": "Wristband & ID Verification Station"
          },
          "position": [
            -2.6,
            0,
            -2.2
          ],
          "color": 165063,
          "accentColor": 3718648,
          "iconEmoji": "🪪",
          "shape": "nursing_id_scanner",
          "rewardItem": {
            "id": "reward-prop-wristband-scanner",
            "icon": "🪪",
            "label": {
              "ar": "محطة التحقق من سوار المعصم",
              "en": "Wristband & ID Verification Station"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-01",
            "protocolTitle": {
              "ar": "قائمة التحقق من هوية المريض (معرّفان مستقلان)",
              "en": "Two-Identifier Verification Checklist"
            },
            "patientContext": {
              "ar": "راجع خطوات التحقق الصحيحة قبل البدء بأي إجراء تمريضي:",
              "en": "Review the required verification steps before starting any nursing procedure:"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "1️⃣ سؤال المريض بـسؤال مفتوح: \"من فضلك أخبرني باسمك الكامل وتاريخ ميلادك؟\"",
                  "en": "1️⃣ Ask an open-ended question: \"Please tell me your full name and date of birth.\""
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "2️⃣ مطابقة إجابة المريض مع سوار المعصم المطبوع والسجل الطبي الإلكتروني.",
                  "en": "2️⃣ Match the patient response against the printed wristband and electronic record."
                }
              },
              {
                "icon": "3️⃣",
                "label": {
                  "ar": "الخطوة القياسية 3",
                  "en": "Standard Step 3"
                },
                "detail": {
                  "ar": "3️⃣ عدم استخدام رقم السرير أو الغرفة كمعرّف للهوية تحت أي ظرف.",
                  "en": "3️⃣ Never use bed or room number as a patient identifier under any circumstance."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "ملاحظة تدريبية: في حال وجود تشابه في الأسماء (Name Alert)، يجب وضع تنبيه واضح في السجل الطبي.",
              "en": "Training Note: When similar names exist on a ward, verify the unique Medical Record Number (MRN) every time."
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-wristband-scanner-step-1",
              "prompt": {
                "ar": "توصي معايير سلامة المرضى بالتحقق من معرّفين مستقلين (الاسم الكامل + تاريخ الميلاد أو الرقم الطبي) ومطابقتهما مع سوار المعصم والسجل الإلكتروني، وعدم الاعتماد أبداً على رقم الغرفة أو السرير.",
                "en": "Patient safety standards require verifying two independent identifiers (Full Name + Date of Birth or Medical Record Number) against the wristband and chart—never use room or bed number."
              },
              "hint": {
                "ar": "ملاحظة تدريبية: في حال وجود تشابه في الأسماء (Name Alert)، يجب وضع تنبيه واضح في السجل الطبي.",
                "en": "Training Note: When similar names exist on a ward, verify the unique Medical Record Number (MRN) every time."
              },
              "options": [
                {
                  "id": "prop-wristband-scanner-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "ملاحظة تدريبية: في حال وجود تشابه في الأسماء (Name Alert)، يجب وضع تنبيه واضح في السجل الطبي.",
                    "en": "Training Note: When similar names exist on a ward, verify the unique Medical Record Number (MRN) every time."
                  }
                },
                {
                  "id": "prop-wristband-scanner-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "ملاحظة تدريبية: في حال وجود تشابه في الأسماء (Name Alert)، يجب وضع تنبيه واضح في السجل الطبي.",
            "en": "Training Note: When similar names exist on a ward, verify the unique Medical Record Number (MRN) every time."
          }
        }
      ],
      "nodes": {
        "patientSamira_start": {
          "id": "patientSamira_start",
          "speaker": "patientSamira",
          "targetNpc": "patientSamira",
          "objectiveHint": {
            "ar": "افحص محطة سوار المعصم ثم تحدث مع المريضة سميرة ومدربة التمريض منى لتطبيق معايير التحقق من الهوية.",
            "en": "Inspect the Wristband ID Station, then speak with Ms. Samira and Educator Mona to apply two-identifier verification."
          },
          "dialogue": {
            "ar": "أهلاً بك يا ممرض/ة. أنا متوترة قليلاً لأن الممرض السابق كاد يعطيني ملف سيدة أخرى اسمها سميرة في الغرفة المجاورة! كيف ستتأكد من هويتي؟",
            "en": "Hello nurse. I am a bit anxious because someone almost mixed up my chart with another Samira next door! How will you verify who I am?"
          },
          "choices": [
            {
              "id": "patientSamira_start_c1",
              "label": {
                "ar": "أقدم نفسي بلطف، وأطلب منكِ ذكر اسمكِ الكامل وتاريخ ميلادكِ وأطابقهما مع سوار معصمكِ والرقم الطبي",
                "en": "Introduce myself warmly, ask you to state your full name and date of birth, and match them to your wristband and MRN"
              },
              "nextNodeId": "patientSamira_done",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تواصل علاجي ممتاز! السؤال المفتوح مع مطابقة سوار المعصم يبني الثقة ويحمي المريضة.",
                "en": "Excellent therapeutic communication! Open-ended verification plus wristband matching builds trust and ensures safety."
              },
              "rationale": {
                "ar": "أحسنت! التحقق من الاسم الرباعي وتاريخ الميلاد أو الرقم الطبي مع إشراك المريض بالأسئلة المفتوحة يمنع أخطاء تبديل المرضى.",
                "en": "Great work! Checking full name plus date of birth or MRN through open-ended questions prevents wrong-patient errors."
              }
            },
            {
              "id": "patientSamira_start_c2",
              "label": {
                "ar": "أكتفي بسؤالكِ: \"أنتِ سميرة صاحبة سرير رقم 4، صحيح؟\"",
                "en": "Just ask: \"You are Samira in Bed 4, right?\""
              },
              "nextNodeId": "patientSamira_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "تنبيه: الأسئلة المغلقة ورقم السرير قد يؤديان إلى إجابة \"نعم\" بالخطأ من مريض متعب أو متوتر.",
                "en": "Caution: Closed yes/no questions and bed numbers frequently lead to wrong-patient confirmation errors."
              },
              "rationale": {
                "ar": "أحسنت! التحقق من الاسم الرباعي وتاريخ الميلاد أو الرقم الطبي مع إشراك المريض بالأسئلة المفتوحة يمنع أخطاء تبديل المرضى.",
                "en": "Great work! Checking full name plus date of birth or MRN through open-ended questions prevents wrong-patient errors."
              }
            }
          ]
        },
        "patientSamira_done": {
          "id": "patientSamira_done",
          "speaker": "patientSamira",
          "targetNpc": "patientSamira",
          "objectiveHint": {
            "ar": "افحص محطة سوار المعصم ثم تحدث مع المريضة سميرة ومدربة التمريض منى لتطبيق معايير التحقق من الهوية.",
            "en": "Inspect the Wristband ID Station, then speak with Ms. Samira and Educator Mona to apply two-identifier verification."
          },
          "dialogue": {
            "ar": "شكراً لك! الآن أشعر بالاطمئنان. اسمي سميرة حسن محمود، وتاريخ ميلادي مطابق للسوار.",
            "en": "Thank you! I feel much safer now. My full name and birth date match my wristband."
          },
          "choices": [
            {
              "id": "patientSamira_done_end",
              "label": {
                "ar": "الانتقال إلى أ. منى لتوثيق المهارة",
                "en": "Proceed to Educator Mona to log the skill"
              },
              "nextNodeId": "educatorMona_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "أحسنت! التحقق من الاسم الرباعي وتاريخ الميلاد أو الرقم الطبي مع إشراك المريض بالأسئلة المفتوحة يمنع أخطاء تبديل المرضى.",
                "en": "Great work! Checking full name plus date of birth or MRN through open-ended questions prevents wrong-patient errors."
              },
              "rationale": {
                "ar": "أحسنت! التحقق من الاسم الرباعي وتاريخ الميلاد أو الرقم الطبي مع إشراك المريض بالأسئلة المفتوحة يمنع أخطاء تبديل المرضى.",
                "en": "Great work! Checking full name plus date of birth or MRN through open-ended questions prevents wrong-patient errors."
              }
            }
          ]
        },
        "educatorMona_start": {
          "id": "educatorMona_start",
          "speaker": "educatorMona",
          "targetNpc": "educatorMona",
          "objectiveHint": {
            "ar": "افحص محطة سوار المعصم ثم تحدث مع المريضة سميرة ومدربة التمريض منى لتطبيق معايير التحقق من الهوية.",
            "en": "Inspect the Wristband ID Station, then speak with Ms. Samira and Educator Mona to apply two-identifier verification."
          },
          "dialogue": {
            "ar": "بعد أن تحققت من هوية أ. سميرة، ماذا تفعل لو وجدت أن سوار المعصم مفقود أو غير مقروء قبل سحب عينة الدم؟",
            "en": "After speaking with Ms. Samira, what should you do if a patient wristband is missing or illegible before drawing a blood sample?"
          },
          "choices": [
            {
              "id": "educatorMona_start_c1",
              "label": {
                "ar": "أؤجل سحب العينة غير الطارئة حتى يتم إصدار وتثبيت سوار معصم جديد بعد التحقق الرسمي من الهوية",
                "en": "Hold the non-emergent draw until a replacement wristband is verified and attached to the patient"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "إجابة مثالية! لا يجوز سحب عينات أو إعطاء أدوية لمريض بدون سوار هوية موثق.",
                "en": "Spot on! Never draw samples or administer medications without an intact, verified identification band."
              },
              "rationale": {
                "ar": "أحسنت! التحقق من الاسم الرباعي وتاريخ الميلاد أو الرقم الطبي مع إشراك المريض بالأسئلة المفتوحة يمنع أخطاء تبديل المرضى.",
                "en": "Great work! Checking full name plus date of birth or MRN through open-ended questions prevents wrong-patient errors."
              }
            },
            {
              "id": "educatorMona_start_c2",
              "label": {
                "ar": "ألصق السوار على طاولة الطعام بجانب السرير مؤقتاً وأسحب العينة",
                "en": "Tape the wristband to the bedside table temporarily and proceed"
              },
              "nextNodeId": "educatorMona_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطر: تثبيت السوار على الأثاث بدلاً من معصم المريض يسبب أخطاء جسيمة عند تبديل الأسرة أو الطاولات.",
                "en": "Unsafe: Taping wristbands to furniture causes severe errors when beds or tables are moved."
              },
              "rationale": {
                "ar": "أحسنت! التحقق من الاسم الرباعي وتاريخ الميلاد أو الرقم الطبي مع إشراك المريض بالأسئلة المفتوحة يمنع أخطاء تبديل المرضى.",
                "en": "Great work! Checking full name plus date of birth or MRN through open-ended questions prevents wrong-patient errors."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص محطة سوار المعصم ثم تحدث مع المريضة سميرة ومدربة التمريض منى لتطبيق معايير التحقق من الهوية.",
        "en": "Inspect the Wristband ID Station, then speak with Ms. Samira and Educator Mona to apply two-identifier verification."
      },
      "educationalTakeaway": {
        "ar": "أحسنت! التحقق من الاسم الرباعي وتاريخ الميلاد أو الرقم الطبي مع إشراك المريض بالأسئلة المفتوحة يمنع أخطاء تبديل المرضى.",
        "en": "Great work! Checking full name plus date of birth or MRN through open-ended questions prevents wrong-patient errors."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-2-hand-hygiene",
      "missionIndex": 2,
      "requiredMissionId": "na-scen-1-patient-id-comm",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 1: التحقق من هوية المريض والتواصل العلاجي» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 1: Patient Identification & Therapeutic Communication\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 2: اللحظات الخمس لنظافة اليدين (WHO 5 Moments)",
        "en": "Scenario 2: WHO 5 Moments for Hand Hygiene"
      },
      "subtitle": {
        "ar": "اختيار الطريقة الصحيحة لتطهير اليدين (فرك كحولي مقابل غسيل بالماء والصابون) وكسر سلسلة العدوى",
        "en": "Choose between alcohol-based handrub vs. soap and water across the 5 clinical moments"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #2",
        "en": "Nursing Safety Scenario #2"
      },
      "badgeIcon": "🧼",
      "badgeTitle": {
        "ar": "🧼 بطل اللحظات الخمس لنظافة اليدين",
        "en": "🧼 WHO 5 Moments Champion"
      },
      "primaryNpc": "preceptorKareem",
      "briefing": {
        "ar": "تنتقل البكتيريا المقاومة للمضادات الحيوية بين المرضى عبر الأيدي غير المطهرة. تدرب في محطة التعقيم مع المشرف كريم على تطبيق اللحظات الخمس لنظافة اليدين.",
        "en": "Resistant bacteria spread rapidly on unwashed hands. Practice the WHO 5 Moments for Hand Hygiene at the scrubbing station with Preceptor Kareem."
      },
      "initialNodeId": "preceptorKareem_start",
      "requirePropsSolvedBeforeNodeId": "preceptorKareem_start",
      "interactiveProps": [
        {
          "id": "prop-hand-hygiene-sink",
          "name": {
            "ar": "بروتوكول اللحظات الخمس لنظافة اليدين",
            "en": "WHO 5 Moments & Handwash Selection"
          },
          "stationLabel": {
            "ar": "محطة نظافة اليدين (اللحظات الـ 5)",
            "en": "WHO 5 Moments Hand Hygiene Station"
          },
          "position": [
            2.6,
            0,
            -2.2
          ],
          "color": 889992,
          "accentColor": 3003583,
          "iconEmoji": "🧼",
          "shape": "hand_sink",
          "rewardItem": {
            "id": "reward-prop-hand-hygiene-sink",
            "icon": "🧼",
            "label": {
              "ar": "محطة نظافة اليدين (اللحظات الـ 5)",
              "en": "WHO 5 Moments Hand Hygiene Station"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-02",
            "protocolTitle": {
              "ar": "مقارنة الفرك الكحولي مقابل الماء والصابون",
              "en": "Alcohol Handrub vs. Soap & Water Checklist"
            },
            "patientContext": {
              "ar": "متى تستخدم الجل الكحولي ومتى يجب الغسيل بالماء والصابون؟",
              "en": "When is alcohol handrub preferred versus washing with soap and water?"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "🧴 الفرك الكحولي (20–30 ثانية): الخيار المفضل روتينياً طالما اليدان غير متسختين ظاهرياً.",
                  "en": "🧴 Alcohol Handrub (20–30 sec): Preferred routine method when hands are not visibly soiled."
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "🚰 الماء والصابون (40–60 ثانية): إلزامي عند اتساخ اليدين ظاهرياً، أو بعد التعرض لسوائل الجسم، أو مع الميكروبات المكونة للأبواغ (مثل C. difficile).",
                  "en": "🚰 Soap & Water (40–60 sec): Mandatory when hands are visibly soiled, after body fluid exposure, or when caring for spore-forming organisms (e.g., C. difficile)."
                }
              },
              {
                "icon": "3️⃣",
                "label": {
                  "ar": "الخطوة القياسية 3",
                  "en": "Standard Step 3"
                },
                "detail": {
                  "ar": "🧤 نزع القفازات يتبعه دائماً تطهير فوري لليدين لأن القفازات قد تحتوي ثقوباً مجهرية.",
                  "en": "🧤 Always perform hand hygiene immediately after removing gloves."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "تلميح: لمس مضخة المحلول أو حافة السرير ثم المغادرة دون تطهير اليدين يخرق اللحظة الخامسة!",
              "en": "Tip: Touching an IV pump or bedrail and leaving without handrub violates Moment 5!"
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-hand-hygiene-sink-step-1",
              "prompt": {
                "ar": "اللحظات الـ 5: (1) قبل ملامسة المريض، (2) قبل إجراء نظيف/معقم، (3) بعد خطر التعرض لسوائل الجسم، (4) بعد ملامسة المريض، (5) بعد ملامسة محيط المريض.",
                "en": "The 5 Moments: (1) Before touching a patient, (2) Before clean/aseptic procedures, (3) After body fluid exposure risk, (4) After touching a patient, (5) After touching patient surroundings."
              },
              "hint": {
                "ar": "تلميح: لمس مضخة المحلول أو حافة السرير ثم المغادرة دون تطهير اليدين يخرق اللحظة الخامسة!",
                "en": "Tip: Touching an IV pump or bedrail and leaving without handrub violates Moment 5!"
              },
              "options": [
                {
                  "id": "prop-hand-hygiene-sink-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تلميح: لمس مضخة المحلول أو حافة السرير ثم المغادرة دون تطهير اليدين يخرق اللحظة الخامسة!",
                    "en": "Tip: Touching an IV pump or bedrail and leaving without handrub violates Moment 5!"
                  }
                },
                {
                  "id": "prop-hand-hygiene-sink-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "تلميح: لمس مضخة المحلول أو حافة السرير ثم المغادرة دون تطهير اليدين يخرق اللحظة الخامسة!",
            "en": "Tip: Touching an IV pump or bedrail and leaving without handrub violates Moment 5!"
          }
        }
      ],
      "nodes": {
        "preceptorKareem_start": {
          "id": "preceptorKareem_start",
          "speaker": "preceptorKareem",
          "targetNpc": "preceptorKareem",
          "objectiveHint": {
            "ar": "افحص حوض ومحطة تعقيم اليدين ثم أجب عن أسئلة المشرف كريم وأ. منى.",
            "en": "Inspect the Hand Hygiene Station, then complete the clinical checks with Preceptor Kareem and Educator Mona."
          },
          "dialogue": {
            "ar": "دخلت غرفة مريض لضبط شاشة مونيتور بجانب السرير فقط دون لمس المريض نفسه، ثم هممت بالخروج. هل يلزم تطهير اليدين؟",
            "en": "You entered a room only to silence an alarm on the bedside monitor without touching the patient. Do you need hand hygiene before leaving?"
          },
          "choices": [
            {
              "id": "preceptorKareem_start_c1",
              "label": {
                "ar": "نعم، هذه هي \"اللحظة الخامسة\" (بعد ملامسة محيط المريض) لأن الأسطح القريبة قد تحمل ميكروبات",
                "en": "Yes—this is Moment 5 (after touching patient surroundings), as bedside surfaces carry organisms"
              },
              "nextNodeId": "educatorMona_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "إجابة دقيقة! محيط المريض المباشر (السرير، المونيتور، الطاولة) يُعامل كمصدر محتمل لانتقال العدوى.",
                "en": "Spot on! The immediate patient zone (bedrail, monitor, table) is colonized with patient flora."
              },
              "rationale": {
                "ar": "عمل رائع! تذكر أن القفازات لا تغني أبداً عن نظافة اليدين قبل ارتدائها وفور خلعها.",
                "en": "Well done! Remember that medical gloves never replace hand hygiene before donning and immediately after doffing."
              }
            },
            {
              "id": "preceptorKareem_start_c2",
              "label": {
                "ar": "لا داعي ما دمت لم ألمس جلد المريض مباشرة",
                "en": "No need since I did not touch the patient skin directly"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطأ شائع: إهمال اللحظة الخامسة ينقل البكتيريا من شاشات الأجهزة إلى المريض التالي.",
                "en": "Common pitfall: Skipping Moment 5 transfers bacteria from bedside monitors to the next patient."
              },
              "rationale": {
                "ar": "عمل رائع! تذكر أن القفازات لا تغني أبداً عن نظافة اليدين قبل ارتدائها وفور خلعها.",
                "en": "Well done! Remember that medical gloves never replace hand hygiene before donning and immediately after doffing."
              }
            }
          ]
        },
        "educatorMona_start": {
          "id": "educatorMona_start",
          "speaker": "educatorMona",
          "targetNpc": "educatorMona",
          "objectiveHint": {
            "ar": "افحص حوض ومحطة تعقيم اليدين ثم أجب عن أسئلة المشرف كريم وأ. منى.",
            "en": "Inspect the Hand Hygiene Station, then complete the clinical checks with Preceptor Kareem and Educator Mona."
          },
          "dialogue": {
            "ar": "سؤال إضافي: مريض يعاني من إسهال حاد يشتبه أنه بسبب بكتيريا مكونة للأبواغ (Clostridioides difficile). ما وسيلة نظافة اليدين الصحيحة عند الخروج؟",
            "en": "Follow-up question: A patient has acute diarrhea suspected to be spore-forming C. difficile. Which hand hygiene method is required on exit?"
          },
          "choices": [
            {
              "id": "educatorMona_start_c1",
              "label": {
                "ar": "الغسيل الجيد بالماء والصابون لمدة 40-60 ثانية لإزالة الأبواغ ميكانيكياً",
                "en": "Wash thoroughly with soap and running water for 40–60 seconds to mechanically remove spores"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "ممتاز! الكحول لا يقضي على الأبواغ البكتيرية، لذا يجب الغسل بالماء والصابون.",
                "en": "Correct! Alcohol does not kill bacterial spores; mechanical friction with soap and water is essential."
              },
              "rationale": {
                "ar": "عمل رائع! تذكر أن القفازات لا تغني أبداً عن نظافة اليدين قبل ارتدائها وفور خلعها.",
                "en": "Well done! Remember that medical gloves never replace hand hygiene before donning and immediately after doffing."
              }
            },
            {
              "id": "educatorMona_start_c2",
              "label": {
                "ar": "فرك سريع بالجل الكحولي فوق القفازات",
                "en": "Quick alcohol handrub over the gloves"
              },
              "nextNodeId": "educatorMona_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "غير آمن: لا يُفرك الكحول أبداً فوق القفازات، كما أن الأبواغ تقاوم الكحول.",
                "en": "Unsafe: Never sanitize over gloves, and alcohol is ineffective against spores."
              },
              "rationale": {
                "ar": "عمل رائع! تذكر أن القفازات لا تغني أبداً عن نظافة اليدين قبل ارتدائها وفور خلعها.",
                "en": "Well done! Remember that medical gloves never replace hand hygiene before donning and immediately after doffing."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص حوض ومحطة تعقيم اليدين ثم أجب عن أسئلة المشرف كريم وأ. منى.",
        "en": "Inspect the Hand Hygiene Station, then complete the clinical checks with Preceptor Kareem and Educator Mona."
      },
      "educationalTakeaway": {
        "ar": "عمل رائع! تذكر أن القفازات لا تغني أبداً عن نظافة اليدين قبل ارتدائها وفور خلعها.",
        "en": "Well done! Remember that medical gloves never replace hand hygiene before donning and immediately after doffing."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-3-ppe-basics",
      "missionIndex": 3,
      "requiredMissionId": "na-scen-2-hand-hygiene",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 2: اللحظات الخمس لنظافة اليدين (WHO 5 Moments)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 2: WHO 5 Moments for Hand Hygiene\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 3: أساسيات معدات الوقاية الشخصية (PPE)",
        "en": "Scenario 3: PPE Basics — Donning, Doffing & Isolation"
      },
      "subtitle": {
        "ar": "ترتيب ارتداء وخلع معدات الوقاية الشخصية بأمان لمنع التلوث الذاتي",
        "en": "Master the safe sequence for putting on (donning) and removing (doffing) PPE without self-contamination"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #3",
        "en": "Nursing Safety Scenario #3"
      },
      "badgeIcon": "🛡️",
      "badgeTitle": {
        "ar": "🛡️ خبير الوقاية والعزل الآمن",
        "en": "🛡️ Safe PPE & Isolation Specialist"
      },
      "primaryNpc": "preceptorKareem",
      "briefing": {
        "ar": "أثناء رعاية مريض في غرفة عزل تلامسي/قطيري، يقع معظم التلوث أثناء خلع معدات الوقاية (Doffing) بترتيب خاطئ. تدرب على الترتيب القياسي الآمن.",
        "en": "When caring for a patient under Contact & Droplet Isolation, self-contamination most often happens during PPE removal (doffing). Practice the safe sequence."
      },
      "initialNodeId": "preceptorKareem_start",
      "requirePropsSolvedBeforeNodeId": "preceptorKareem_start",
      "interactiveProps": [
        {
          "id": "prop-ppe-station",
          "name": {
            "ar": "الترتيب القياسي لارتداء وخلع معدات الوقاية",
            "en": "Standard PPE Donning & Doffing Sequence"
          },
          "stationLabel": {
            "ar": "عربة معدات الوقاية الشخصية (PPE)",
            "en": "Isolation PPE Station"
          },
          "position": [
            -2.4,
            0,
            0.4
          ],
          "color": 165063,
          "accentColor": 2278750,
          "iconEmoji": "🧤",
          "shape": "ppe_rack",
          "rewardItem": {
            "id": "reward-prop-ppe-station",
            "icon": "🧤",
            "label": {
              "ar": "عربة معدات الوقاية الشخصية (PPE)",
              "en": "Isolation PPE Station"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-03",
            "protocolTitle": {
              "ar": "دليل ارتداء وخلع معدات الوقاية (PPE)",
              "en": "PPE Donning & Doffing Guide"
            },
            "patientContext": {
              "ar": "احفظ الترتيب القياسي لمنع تلويث الملابس أو الوجه:",
              "en": "Memorize the standard order to prevent contaminating your scrubs or face:"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "🟢 ترتيب الارتداء (Donning): تطهير اليدين ⬅️ المريول (Gown) ⬅️ القناع (Mask) ⬅️ واقي العينين ⬅️ القفازات (تغطي أساور المريول).",
                  "en": "🟢 Donning Order: Hand Hygiene ⬅️ Gown ⬅️ Mask ⬅️ Eye Protection ⬅️ Gloves (cuffs over gown sleeves)."
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "🟠 ترتيب الخلع (Doffing): القفازات أولاً ⬅️ واقي العينين ⬅️ المريول (بطيه للداخل) ⬅️ القناع أخيراً ⬅️ تطهير اليدين فوراً.",
                  "en": "🟠 Doffing Order: Gloves first ⬅️ Eye Protection ⬅️ Gown (rolled inside-out) ⬅️ Mask last ⬅️ Immediate Hand Hygiene."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "تنبيه: لا تلمس الجزء الأمامي الخارجي للمريول أو القناع أثناء الخلع؛ أمسك الأربطة الخلفية فقط.",
              "en": "Alert: Never touch the contaminated front of the gown or mask during removal—handle only ties/ear loops."
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-ppe-station-step-1",
              "prompt": {
                "ar": "يبدأ الارتداء دائماً بتطهير اليدين ثم المريول فالقناع فواقي العينين وأخيراً القفازات. أما الخلع فيبدأ بالأكثر تلوثاً (القفازات).",
                "en": "Donning starts with hand hygiene, then gown, mask, eye protection, and finally gloves. Doffing removes the most contaminated piece (gloves) first."
              },
              "hint": {
                "ar": "تنبيه: لا تلمس الجزء الأمامي الخارجي للمريول أو القناع أثناء الخلع؛ أمسك الأربطة الخلفية فقط.",
                "en": "Alert: Never touch the contaminated front of the gown or mask during removal—handle only ties/ear loops."
              },
              "options": [
                {
                  "id": "prop-ppe-station-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تنبيه: لا تلمس الجزء الأمامي الخارجي للمريول أو القناع أثناء الخلع؛ أمسك الأربطة الخلفية فقط.",
                    "en": "Alert: Never touch the contaminated front of the gown or mask during removal—handle only ties/ear loops."
                  }
                },
                {
                  "id": "prop-ppe-station-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "تنبيه: لا تلمس الجزء الأمامي الخارجي للمريول أو القناع أثناء الخلع؛ أمسك الأربطة الخلفية فقط.",
            "en": "Alert: Never touch the contaminated front of the gown or mask during removal—handle only ties/ear loops."
          }
        }
      ],
      "nodes": {
        "preceptorKareem_start": {
          "id": "preceptorKareem_start",
          "speaker": "preceptorKareem",
          "targetNpc": "preceptorKareem",
          "objectiveHint": {
            "ar": "افحص عربة معدات الوقاية الشخصية (PPE) ثم تحدث مع المشرف كريم ود. طارق.",
            "en": "Inspect the PPE Isolation Cart, then review donning and doffing with Preceptor Kareem and Dr. Tarek."
          },
          "dialogue": {
            "ar": "أنهيت تقديم الرعاية داخل غرفة عزل وتستعد لخلع معدات الوقاية (Doffing). ما القطعة الأولى التي يجب خلعها؟",
            "en": "You have finished care inside an isolation room and are ready to doff your PPE. Which item must be removed first?"
          },
          "choices": [
            {
              "id": "preceptorKareem_start_c1",
              "label": {
                "ar": "القفازات أولاً (بتقنية القفاز داخل قفاز دون لمس الجلد)، لأنها الأكثر تلوثاً المباشر",
                "en": "Gloves first (using glove-in-glove technique without touching bare skin), as they are most contaminated"
              },
              "nextNodeId": "doctorTarek_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "صحيح تماماً! خلع القفازات أولاً يمنع نقل الميكروبات إلى وجهك أو رقبتك عند فك المريول أو النظارات.",
                "en": "Exactly right! Removing gloves first prevents transferring pathogens to your face or neck while untying other PPE."
              },
              "rationale": {
                "ar": "أحسنت! القفازات هي الأكثر تلوثاً لذا تُخلع أولاً، بينما القناع يحمي الجهاز التنفسي فيُخلع أخيراً متبوعاً بتطهير اليدين.",
                "en": "Well done! Gloves are the most contaminated item and come off first, while the mask comes off last, followed immediately by hand hygiene."
              }
            },
            {
              "id": "preceptorKareem_start_c2",
              "label": {
                "ar": "أخلع القناع أولاً وأنا أرتدي القفازات الملوثة لأتنفس براحة",
                "en": "Pull off the face mask first while still wearing dirty gloves"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطر تلوث ذاتي مباشر! لمس الوجه بالقفازات الملوثة ينقل العدوى فوراً إلى الأغشية المخاطية.",
                "en": "Direct self-contamination hazard! Touching your face with used gloves transfers pathogens to mucous membranes."
              },
              "rationale": {
                "ar": "أحسنت! القفازات هي الأكثر تلوثاً لذا تُخلع أولاً، بينما القناع يحمي الجهاز التنفسي فيُخلع أخيراً متبوعاً بتطهير اليدين.",
                "en": "Well done! Gloves are the most contaminated item and come off first, while the mask comes off last, followed immediately by hand hygiene."
              }
            }
          ]
        },
        "doctorTarek_start": {
          "id": "doctorTarek_start",
          "speaker": "doctorTarek",
          "targetNpc": "doctorTarek",
          "objectiveHint": {
            "ar": "افحص عربة معدات الوقاية الشخصية (PPE) ثم تحدث مع المشرف كريم ود. طارق.",
            "en": "Inspect the PPE Isolation Cart, then review donning and doffing with Preceptor Kareem and Dr. Tarek."
          },
          "dialogue": {
            "ar": "بعد الخروج من غرفة المريض A، نادى عليك مريض في الغرفة B المجاورة. هل يمكنك الدخول بنفس القفازات والمريول لتوفير الوقت؟",
            "en": "After stepping out of Room A, a patient in Room B calls out. Can you walk into Room B wearing the same gown and gloves to save time?"
          },
          "choices": [
            {
              "id": "doctorTarek_start_c1",
              "label": {
                "ar": "ممنوع تماماً؛ معدات الوقاية تُخلع وتُطهر اليدان قبل مغادرة غرفة المريض A لمنع نقل العدوى بين الغرف",
                "en": "Never; PPE is single-patient use and must be removed with hand hygiene performed before entering another patient room"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "قرار سليم! التجول بالقفازات أو المريول في الممر ينشر العدوى المكتسبة بالمستشفيات.",
                "en": "Correct decision! Wearing used PPE in hallways or between rooms spreads healthcare-associated infections."
              },
              "rationale": {
                "ar": "أحسنت! القفازات هي الأكثر تلوثاً لذا تُخلع أولاً، بينما القناع يحمي الجهاز التنفسي فيُخلع أخيراً متبوعاً بتطهير اليدين.",
                "en": "Well done! Gloves are the most contaminated item and come off first, while the mask comes off last, followed immediately by hand hygiene."
              }
            },
            {
              "id": "doctorTarek_start_c2",
              "label": {
                "ar": "نعم إذا كانت الغرفة قريبة ولم ألمس جرحاً مفتوحاً",
                "en": "Yes, if it is just next door and I only touched intact skin"
              },
              "nextNodeId": "doctorTarek_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "غير مقبول: المريول والقفازات تحمل ميكروبات غير مرئية وتسبب تفشياً في الجناح.",
                "en": "Unacceptable: Used gowns and gloves carry invisible flora and trigger ward outbreaks."
              },
              "rationale": {
                "ar": "أحسنت! القفازات هي الأكثر تلوثاً لذا تُخلع أولاً، بينما القناع يحمي الجهاز التنفسي فيُخلع أخيراً متبوعاً بتطهير اليدين.",
                "en": "Well done! Gloves are the most contaminated item and come off first, while the mask comes off last, followed immediately by hand hygiene."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص عربة معدات الوقاية الشخصية (PPE) ثم تحدث مع المشرف كريم ود. طارق.",
        "en": "Inspect the PPE Isolation Cart, then review donning and doffing with Preceptor Kareem and Dr. Tarek."
      },
      "educationalTakeaway": {
        "ar": "أحسنت! القفازات هي الأكثر تلوثاً لذا تُخلع أولاً، بينما القناع يحمي الجهاز التنفسي فيُخلع أخيراً متبوعاً بتطهير اليدين.",
        "en": "Well done! Gloves are the most contaminated item and come off first, while the mask comes off last, followed immediately by hand hygiene."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-4-allergy-check",
      "missionIndex": 4,
      "requiredMissionId": "na-scen-3-ppe-basics",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 3: أساسيات معدات الوقاية الشخصية (PPE)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 3: PPE Basics — Donning, Doffing & Isolation\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 4: التحقق من الحساسية الدوائية والتصعيد السريري",
        "en": "Scenario 4: Medication-Allergy Verification & Escalation"
      },
      "subtitle": {
        "ar": "رصد الحساسية المتقاطعة وإيقاف الإعطاء فوراً عند وجود تاريخ تفاعل تحسسي خطير (حالة تعليمية)",
        "en": "Identify severe allergy history, hold potentially cross-reactive orders, and escalate safely (fictional case)"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #4",
        "en": "Nursing Safety Scenario #4"
      },
      "badgeIcon": "⚠️",
      "badgeTitle": {
        "ar": "⚠️ درع الوقاية من الحساسية الدوائية",
        "en": "⚠️ Allergy Safety Shield"
      },
      "primaryNpc": "patientSamira",
      "briefing": {
        "ar": "قبل إعطاء أي مضاد حيوي، يجب سؤال المريض عن تاريخ الحساسية وطبيعة التفاعل ومراجعة سوار الحساسية الأحمر. افحص عربة الأدوية وتحدث مع أ. سميرة ود. طارق.",
        "en": "Before administering any antimicrobial, nurses must verify allergy history and reaction type. Inspect the Medication Cart and speak with Ms. Samira and Dr. Tarek."
      },
      "initialNodeId": "patientSamira_start",
      "requirePropsSolvedBeforeNodeId": "patientSamira_start",
      "interactiveProps": [
        {
          "id": "prop-allergy-cart",
          "name": {
            "ar": "تنبيه سجل الحساسية الدوائية (حالة خيالية)",
            "en": "Medication Allergy Alert Review (Fictional Case)"
          },
          "stationLabel": {
            "ar": "محطة التحقق من الحساسية الدوائية",
            "en": "Allergy & Cross-Reactivity Check Station"
          },
          "position": [
            2.4,
            0,
            0.4
          ],
          "color": 14427686,
          "accentColor": 16281969,
          "iconEmoji": "💊",
          "shape": "med_safety_cart",
          "rewardItem": {
            "id": "reward-prop-allergy-cart",
            "icon": "💊",
            "label": {
              "ar": "محطة التحقق من الحساسية الدوائية",
              "en": "Allergy & Cross-Reactivity Check Station"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-04",
            "protocolTitle": {
              "ar": "بروتوكول التحقق من الحساسية قبل إعطاء الدواء",
              "en": "Pre-Administration Allergy Verification Checklist"
            },
            "patientContext": {
              "ar": "خطوات التحقق التمريضي الإلزامية:",
              "en": "Mandatory nursing allergy verification steps:"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "🔴 فحص سوار الحساسية وتوثيق اسم المادة المسببة للحساسية في السجل الطبي.",
                  "en": "🔴 Check the allergy wristband and documented allergen list in the electronic chart."
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "🗣️ سؤال المريض عن طبيعة التفاعل السابق (طفح بسيط؟ أم تورم بالحلق/ضيق تنفس/تأق؟).",
                  "en": "🗣️ Ask the patient to describe the exact prior reaction (mild GI upset vs. hives, swelling, or breathing difficulty)."
                }
              },
              {
                "icon": "3️⃣",
                "label": {
                  "ar": "الخطوة القياسية 3",
                  "en": "Standard Step 3"
                },
                "detail": {
                  "ar": "🛑 إيقاف الإعطاء فوراً (Hold) والتصعيد للطبيب والصيدلي الإكلينيكي عند وجود تعارض أو حساسية شديدة.",
                  "en": "🛑 Hold administration immediately and escalate to the prescriber and pharmacist if severe allergy or cross-reactivity exists."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "قاعدة ذهبية: لا تعطِ جرعة يشتبه في تعارضها مع حساسية شديدة مسجلة حتى يتم مراجعتها وتعديلها رسمياً.",
              "en": "Golden Rule: Never administer a medication when severe allergy cross-reactivity is suspected until reviewed by the care team."
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-allergy-cart-step-1",
              "prompt": {
                "ar": "يظهر في الملف التدريبي طلب مضاد حيوي من عائلة البيتالاكتام، بينما تشير ملاحظة الاستقبال إلى أن المريضة تعرضت سابقاً لضيق تنفس وتورم في الشفتين بعد مضاد من نفس الفئة.",
                "en": "The training chart shows a newly entered beta-lactam antibiotic order, while intake notes mention prior lip swelling and shortness of breath to a penicillin-class medication."
              },
              "hint": {
                "ar": "قاعدة ذهبية: لا تعطِ جرعة يشتبه في تعارضها مع حساسية شديدة مسجلة حتى يتم مراجعتها وتعديلها رسمياً.",
                "en": "Golden Rule: Never administer a medication when severe allergy cross-reactivity is suspected until reviewed by the care team."
              },
              "options": [
                {
                  "id": "prop-allergy-cart-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "قاعدة ذهبية: لا تعطِ جرعة يشتبه في تعارضها مع حساسية شديدة مسجلة حتى يتم مراجعتها وتعديلها رسمياً.",
                    "en": "Golden Rule: Never administer a medication when severe allergy cross-reactivity is suspected until reviewed by the care team."
                  }
                },
                {
                  "id": "prop-allergy-cart-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "قاعدة ذهبية: لا تعطِ جرعة يشتبه في تعارضها مع حساسية شديدة مسجلة حتى يتم مراجعتها وتعديلها رسمياً.",
            "en": "Golden Rule: Never administer a medication when severe allergy cross-reactivity is suspected until reviewed by the care team."
          }
        }
      ],
      "nodes": {
        "patientSamira_start": {
          "id": "patientSamira_start",
          "speaker": "patientSamira",
          "targetNpc": "patientSamira",
          "objectiveHint": {
            "ar": "افحص محطة فحص الحساسية، ثم اسأل أ. سميرة عن تفاعلها السابق وبلّغ د. طارق لإيقاف الطلب.",
            "en": "Inspect the Allergy Verification Cart, ask Ms. Samira about her reaction history, and escalate to Dr. Tarek."
          },
          "dialogue": {
            "ar": "العام الماضي عندما تناولت مضاداً من عائلة البنسلين، تورمت شفتاي وشعرت بصفير وضيق شديد في التنفس واحتجت إسعافاً فورياً. هل الدواء الجديد آمن لي؟",
            "en": "Last year when I took a penicillin-family antibiotic, my lips swelled up and I had severe wheezing requiring emergency care. Is this new medication safe for me?"
          },
          "choices": [
            {
              "id": "patientSamira_start_c1",
              "label": {
                "ar": "شكراً لتنبيهي! لن أعطيكِ هذه الجرعة الآن، وسأتحقق فوراً مع الطبيب والصيدلي لأن تفاعلكِ السابق يحمل علامات تأق خطير",
                "en": "Thank you for telling me! I will hold this dose right now and escalate to the physician and pharmacist because your prior reaction indicates severe anaphylaxis"
              },
              "nextNodeId": "doctorTarek_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تصرف تمريضي مثالي! الاستماع للمريض وإيقاف الدواء فوراً يمنع تفاعلاً تحسسياً مهدداً للحياة.",
                "en": "Ideal nursing action! Listening to the patient and holding the medication prevents potentially fatal anaphylaxis."
              },
              "rationale": {
                "ar": "يقظة ممتازة! التمييز بين الأعراض الجانبية البسيطة والتأق المهدد للحياة (Anaphylaxis) وإيقاف الدواء قبل إعطائه ينقذ حياة المريض.",
                "en": "Outstanding vigilance! Distinguishing mild side effects from life-threatening anaphylaxis and holding the dose before administration saves lives."
              }
            },
            {
              "id": "patientSamira_start_c2",
              "label": {
                "ar": "لا تقلقي، سأعطيكِ الدواء الآن وأراقبكِ بعد ساعة",
                "en": "Do not worry, I will give it now and check on you in an hour"
              },
              "nextNodeId": "patientSamira_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطر جسيم! إعطاء دواء متعارض لمريض لديه تاريخ تأق (Anaphylaxis) قد يسبب صدمة تحسسية خلال دقائق.",
                "en": "Critical risk! Administering a cross-reactive drug to a patient with prior anaphylaxis can cause airway compromise within minutes."
              },
              "rationale": {
                "ar": "يقظة ممتازة! التمييز بين الأعراض الجانبية البسيطة والتأق المهدد للحياة (Anaphylaxis) وإيقاف الدواء قبل إعطائه ينقذ حياة المريض.",
                "en": "Outstanding vigilance! Distinguishing mild side effects from life-threatening anaphylaxis and holding the dose before administration saves lives."
              }
            }
          ]
        },
        "doctorTarek_start": {
          "id": "doctorTarek_start",
          "speaker": "doctorTarek",
          "targetNpc": "doctorTarek",
          "objectiveHint": {
            "ar": "افحص محطة فحص الحساسية، ثم اسأل أ. سميرة عن تفاعلها السابق وبلّغ د. طارق لإيقاف الطلب.",
            "en": "Inspect the Allergy Verification Cart, ask Ms. Samira about her reaction history, and escalate to Dr. Tarek."
          },
          "dialogue": {
            "ar": "ما المعلومة التي تود إبلاغي بها بخصوص طلب المضاد الحيوي للمريضة سميرة؟",
            "en": "What update do you have regarding Ms. Samira’s antimicrobial order?"
          },
          "choices": [
            {
              "id": "doctorTarek_start_c1",
              "label": {
                "ar": "أوقفت الإعطاء مؤقتاً (Hold)؛ المريضة لديها تاريخ تأق شديد (تورم شفتين وضيق تنفس) مع فئة البنسلين، ونحتاج لتوثيق الحساسية واختيار فئة بديلة آمنة",
                "en": "I held the dose; the patient reports prior severe anaphylaxis (lip swelling and wheezing) to penicillin-class drugs, so we need allergy documentation and a safe non-cross-reactive alternative"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تصعيد واضح ومهني! تم تحديث سجل الحساسية وإلغاء الطلب المتعارض فوراً.",
                "en": "Clear, professional escalation! The allergy alert is updated and the conflicting order is safely canceled."
              },
              "rationale": {
                "ar": "يقظة ممتازة! التمييز بين الأعراض الجانبية البسيطة والتأق المهدد للحياة (Anaphylaxis) وإيقاف الدواء قبل إعطائه ينقذ حياة المريض.",
                "en": "Outstanding vigilance! Distinguishing mild side effects from life-threatening anaphylaxis and holding the dose before administration saves lives."
              }
            },
            {
              "id": "doctorTarek_start_c2",
              "label": {
                "ar": "المريضة مترددة فقط ولا توجد مشكلة حقيقية",
                "en": "The patient is just hesitant, no real issue"
              },
              "nextNodeId": "doctorTarek_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "غير دقيق: إغفال نقل تفاصيل التفاعل التحسسي للطبيب يعرض المريض للخطر.",
                "en": "Inaccurate: Failing to communicate specific anaphylactic symptoms puts the patient in danger."
              },
              "rationale": {
                "ar": "يقظة ممتازة! التمييز بين الأعراض الجانبية البسيطة والتأق المهدد للحياة (Anaphylaxis) وإيقاف الدواء قبل إعطائه ينقذ حياة المريض.",
                "en": "Outstanding vigilance! Distinguishing mild side effects from life-threatening anaphylaxis and holding the dose before administration saves lives."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص محطة فحص الحساسية، ثم اسأل أ. سميرة عن تفاعلها السابق وبلّغ د. طارق لإيقاف الطلب.",
        "en": "Inspect the Allergy Verification Cart, ask Ms. Samira about her reaction history, and escalate to Dr. Tarek."
      },
      "educationalTakeaway": {
        "ar": "يقظة ممتازة! التمييز بين الأعراض الجانبية البسيطة والتأق المهدد للحياة (Anaphylaxis) وإيقاف الدواء قبل إعطائه ينقذ حياة المريض.",
        "en": "Outstanding vigilance! Distinguishing mild side effects from life-threatening anaphylaxis and holding the dose before administration saves lives."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-5-med-safety-rights",
      "missionIndex": 5,
      "requiredMissionId": "na-scen-4-allergy-check",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 4: التحقق من الحساسية الدوائية والتصعيد السريري» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 4: Medication-Allergy Verification & Escalation\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 5: التحقق من سلامة الدواء (الحقوق الستة بدون وصف جرعات)",
        "en": "Scenario 5: Medication Safety Verification (The 6 Rights)"
      },
      "subtitle": {
        "ar": "مطابقة المريض الصحيح، الدواء الصحيح، الطريق الصحيح، التوقيت، التوثيق، والغرض (تدريب مفاهيمي آمن)",
        "en": "Verify Right Patient, Medication, Route, Time, Documentation & Reason against the MAR (conceptual safety training)"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #5",
        "en": "Nursing Safety Scenario #5"
      },
      "badgeIcon": "💊",
      "badgeTitle": {
        "ar": "💊 محقق الحقوق الستة لسلامة الدواء",
        "en": "💊 Six Rights Safety Champion"
      },
      "primaryNpc": "educatorMona",
      "briefing": {
        "ar": "انتبه: الأدوية المتشابهة في الشكل أو الاسم (Look-Alike / Sound-Alike) قد تسبب أخطاء إذا لم تُطابق بدقة مع سجل إعطاء الأدوية (MAR). هذا السيناريو يركز على إجراءات المطابقة التمريضية دون تقديم أي وصفات أو جرعات علاجية.",
        "en": "Look-alike and sound-alike packaging can cause errors if not verified against the Medication Administration Record (MAR). Practice verification checks (educational principles only—no prescribing/dosing advice)."
      },
      "initialNodeId": "educatorMona_start",
      "requirePropsSolvedBeforeNodeId": "educatorMona_start",
      "interactiveProps": [
        {
          "id": "prop-mar-station",
          "name": {
            "ar": "مبادئ التحقق الآمن من الأدوية (الحقوق الستة)",
            "en": "Medication Safety Verification Principles"
          },
          "stationLabel": {
            "ar": "محطة سجل إعطاء الأدوية (MAR)",
            "en": "Bedside MAR & Barcode Station"
          },
          "position": [
            -2.5,
            0,
            -2
          ],
          "color": 2450411,
          "accentColor": 6333946,
          "iconEmoji": "💊",
          "shape": "med_safety_cart",
          "rewardItem": {
            "id": "reward-prop-mar-station",
            "icon": "💊",
            "label": {
              "ar": "محطة سجل إعطاء الأدوية (MAR)",
              "en": "Bedside MAR & Barcode Station"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-05",
            "protocolTitle": {
              "ar": "قائمة الحقوق الستة لإعطاء الدواء بأمان",
              "en": "The 6 Rights of Safe Medication Verification"
            },
            "patientContext": {
              "ar": "تحقق من البنود التالية في كل مرة قبل الإعطاء (تدريب مفاهيمي):",
              "en": "Verify these core principles every time before administration (conceptual checklist):"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "✅ المريض الصحيح (Right Patient) والدواء الصحيح (Right Medication) عبر قراءة الاسم العلمي والباركود.",
                  "en": "✅ Right Patient & Right Medication verified via generic name and barcode scan."
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "✅ الطريق الصحيح للإعطاء (Right Route) والتوقيت الصحيح (Right Time) وفق السجل المعتمد.",
                  "en": "✅ Right Route & Right Time matched strictly to the verified chart order."
                }
              },
              {
                "icon": "3️⃣",
                "label": {
                  "ar": "الخطوة القياسية 3",
                  "en": "Standard Step 3"
                },
                "detail": {
                  "ar": "✅ التوثيق الصحيح (Right Documentation): يتم التوثيق فور الإعطاء الفعلي وليس قبله أبداً.",
                  "en": "✅ Right Documentation: Record administration immediately AFTER giving the medication, never beforehand."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "تنبيه تعليمي: هذا السيناريو لتدريب مهارات التحقق والسلامة ولا يتضمن أي إرشادات لوصف أو حساب جرعات دوائية.",
              "en": "Educational Notice: This scenario teaches verification workflow only and does not provide prescribing or dosing instructions."
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-mar-station-step-1",
              "prompt": {
                "ar": "يتضمن التحقق التمريضي مقارنة ملصق الدواء بسجل إعطاء الأدوية (MAR) ثلاث مرات (عند الإخراج، عند التحضير، وبجانب السرير) قبل الإعطاء.",
                "en": "Safe nursing verification requires checking the medication label against the MAR three times (when retrieving, when preparing, and at the bedside) before administration."
              },
              "hint": {
                "ar": "تنبيه تعليمي: هذا السيناريو لتدريب مهارات التحقق والسلامة ولا يتضمن أي إرشادات لوصف أو حساب جرعات دوائية.",
                "en": "Educational Notice: This scenario teaches verification workflow only and does not provide prescribing or dosing instructions."
              },
              "options": [
                {
                  "id": "prop-mar-station-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تنبيه تعليمي: هذا السيناريو لتدريب مهارات التحقق والسلامة ولا يتضمن أي إرشادات لوصف أو حساب جرعات دوائية.",
                    "en": "Educational Notice: This scenario teaches verification workflow only and does not provide prescribing or dosing instructions."
                  }
                },
                {
                  "id": "prop-mar-station-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "تنبيه تعليمي: هذا السيناريو لتدريب مهارات التحقق والسلامة ولا يتضمن أي إرشادات لوصف أو حساب جرعات دوائية.",
            "en": "Educational Notice: This scenario teaches verification workflow only and does not provide prescribing or dosing instructions."
          }
        }
      ],
      "nodes": {
        "educatorMona_start": {
          "id": "educatorMona_start",
          "speaker": "educatorMona",
          "targetNpc": "educatorMona",
          "objectiveHint": {
            "ar": "افحص محطة مطابقة الأدوية والباركود، ثم تحدث مع أ. منى والمشرف كريم.",
            "en": "Inspect the Barcode & MAR Verification Station, then complete the safety review with Educator Mona and Preceptor Kareem."
          },
          "dialogue": {
            "ar": "وجدت عبوتين متشابهتين في اللون داخل درج التحضير، إحداهما قطرة موضعية والأخرى محلول وريدي. كيف تتجنب الخطأ؟",
            "en": "You notice two nearly identical vials in the prep drawer with similar labels but different routes. How do you prevent an error?"
          },
          "choices": [
            {
              "id": "educatorMona_start_c1",
              "label": {
                "ar": "أجري الفحص الثلاثي للملصق (الاسم العلمي وطريق الإعطاء) وأمسح الباركود بجانب السرير مع مطابقة سجل MAR",
                "en": "Perform three independent label checks (generic name and route) and scan the barcode against the MAR at the bedside"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "ممتاز! عدم الاعتماد على شكل أو لون العبوة وقراءة الملصق كاملاً يمنع أخطاء الأدوية المتشابهة.",
                "en": "Excellent! Never rely on packaging color—reading the full label three times and scanning prevents look-alike errors."
              },
              "rationale": {
                "ar": "أحسنت! الفحص الثلاثي للعبوة ومطابقة الباركود بجانب السرير وعدم التوثيق المسبق هي ركائز سلامة إعطاء الدواء.",
                "en": "Excellent! Performing the three label checks, scanning at the bedside, and documenting only after administration keep medication delivery safe."
              }
            },
            {
              "id": "educatorMona_start_c2",
              "label": {
                "ar": "أختار العبوة بناءً على لون الغطاء المعتاد لتسريع العمل",
                "en": "Pick the vial based on cap color to save time"
              },
              "nextNodeId": "educatorMona_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطر! الاعتماد على لون الغطاء أو مكان الدرج من أكثر أسباب أخطاء الأدوية شيوعاً.",
                "en": "Hazardous! Relying on cap color or drawer position is a leading cause of look-alike medication errors."
              },
              "rationale": {
                "ar": "أحسنت! الفحص الثلاثي للعبوة ومطابقة الباركود بجانب السرير وعدم التوثيق المسبق هي ركائز سلامة إعطاء الدواء.",
                "en": "Excellent! Performing the three label checks, scanning at the bedside, and documenting only after administration keep medication delivery safe."
              }
            }
          ]
        },
        "preceptorKareem_start": {
          "id": "preceptorKareem_start",
          "speaker": "preceptorKareem",
          "targetNpc": "preceptorKareem",
          "objectiveHint": {
            "ar": "افحص محطة مطابقة الأدوية والباركود، ثم تحدث مع أ. منى والمشرف كريم.",
            "en": "Inspect the Barcode & MAR Verification Station, then complete the safety review with Educator Mona and Preceptor Kareem."
          },
          "dialogue": {
            "ar": "زميل لك يقترح توثيق إعطاء الدواء في النظام الإلكتروني قبل دخول غرفة المريض لتوفير الوقت. ما رأيك؟",
            "en": "A colleague suggests signing off the medication in the electronic MAR before entering the patient room to save time. What is your response?"
          },
          "choices": [
            {
              "id": "preceptorKareem_start_c1",
              "label": {
                "ar": "أرفض التوثيق المسبق؛ يجب التوثيق فقط بعد التأكد من تناول أو تلقي المريض للدواء فعلياً",
                "en": "Never pre-chart; documentation must happen only after witnessing actual administration"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "صحيح! إذا رفض المريض الدواء أو حدث طارئ بعد التوثيق المسبق، يصبح السجل الطبي مضللاً وخطراً.",
                "en": "Correct! If a dose is interrupted or refused after pre-charting, the medical record becomes inaccurate and unsafe."
              },
              "rationale": {
                "ar": "أحسنت! الفحص الثلاثي للعبوة ومطابقة الباركود بجانب السرير وعدم التوثيق المسبق هي ركائز سلامة إعطاء الدواء.",
                "en": "Excellent! Performing the three label checks, scanning at the bedside, and documenting only after administration keep medication delivery safe."
              }
            },
            {
              "id": "preceptorKareem_start_c2",
              "label": {
                "ar": "لا بأس بالتوثيق المسبق طالما الدواء في يدي",
                "en": "Pre-charting is fine as long as the medication is in my hand"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "ممارسة خاطئة: التوثيق المسبق يعرض المريض لخطر نسيان الجرعة أو تضارب السجلات.",
                "en": "Unsafe practice: Pre-charting risks missed doses or inaccurate medical records."
              },
              "rationale": {
                "ar": "أحسنت! الفحص الثلاثي للعبوة ومطابقة الباركود بجانب السرير وعدم التوثيق المسبق هي ركائز سلامة إعطاء الدواء.",
                "en": "Excellent! Performing the three label checks, scanning at the bedside, and documenting only after administration keep medication delivery safe."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص محطة مطابقة الأدوية والباركود، ثم تحدث مع أ. منى والمشرف كريم.",
        "en": "Inspect the Barcode & MAR Verification Station, then complete the safety review with Educator Mona and Preceptor Kareem."
      },
      "educationalTakeaway": {
        "ar": "أحسنت! الفحص الثلاثي للعبوة ومطابقة الباركود بجانب السرير وعدم التوثيق المسبق هي ركائز سلامة إعطاء الدواء.",
        "en": "Excellent! Performing the three label checks, scanning at the bedside, and documenting only after administration keep medication delivery safe."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-6-vitals-red-flags",
      "missionIndex": 6,
      "requiredMissionId": "na-scen-5-med-safety-rights",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 5: التحقق من سلامة الدواء (الحقوق الستة بدون وصف جرعات)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 5: Medication Safety Verification (The 6 Rights)\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 6: رصد العلامات الحيوية وتصعيد المؤشرات التحذيرية (Red Flags)",
        "en": "Scenario 6: Observing Vital Signs & Escalating Red Flags"
      },
      "subtitle": {
        "ar": "اكتشاف علامات التدهور السريري المبكر وإبلاغ الفريق الطبي فوراً",
        "en": "Recognize early clinical deterioration patterns on the bedside monitor and escalate promptly"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #6",
        "en": "Nursing Safety Scenario #6"
      },
      "badgeIcon": "📟",
      "badgeTitle": {
        "ar": "📟 راصد العلامات التحذيرية المبكرة",
        "en": "📟 Early Warning & Red-Flag Responder"
      },
      "primaryNpc": "patientSamira",
      "briefing": {
        "ar": "الملاحظة التمريضية الدقيقة للعلامات الحيوية هي خط الدفاع الأول لاكتشاف الإنتان (Sepsis) أو التدهور التنفسي مبكراً. افحص شاشة المونيتور بجانب السرير ونسق التصعيد الفوري.",
        "en": "Careful nursing observation of vital sign trends is the first line of defense in catching early deterioration. Inspect the Bedside Monitor and escalate red flags immediately."
      },
      "initialNodeId": "patientSamira_start",
      "requirePropsSolvedBeforeNodeId": "patientSamira_start",
      "interactiveProps": [
        {
          "id": "prop-vitals-monitor",
          "name": {
            "ar": "قراءة مؤشرات الإنذار المبكر (حالة تدريبية)",
            "en": "Early Warning Vital Signs Review (Training Case)"
          },
          "stationLabel": {
            "ar": "شاشة العلامات الحيوية (مؤشرات تحذيرية)",
            "en": "Bedside Vital Signs Monitor"
          },
          "position": [
            -2.4,
            0,
            0.6
          ],
          "color": 15357964,
          "accentColor": 16486972,
          "iconEmoji": "📟",
          "shape": "vitals_monitor",
          "rewardItem": {
            "id": "reward-prop-vitals-monitor",
            "icon": "📟",
            "label": {
              "ar": "شاشة العلامات الحيوية (مؤشرات تحذيرية)",
              "en": "Bedside Vital Signs Monitor"
            }
          },
          "triageCardConfig": {
            "patientCode": "NA-SIM-06",
            "fictionalCaseName": {
              "ar": "حالة محاكاة تدريبية — مراقبة الجناح",
              "en": "Simulated Ward Patient — Trend Alert"
            },
            "ageGroup": {
              "ar": "46 سنة • ملاحظة تمريضية",
              "en": "46 yrs • Nursing Observation"
            },
            "chiefComplaint": {
              "ar": "قشعريرة مفاجئة، تسارع في التنفس، وشعور بالدوار مقارنة بالقراءة السابقة قبل ساعتين.",
              "en": "New-onset chills, rapid breathing, and lightheadedness compared to baseline two hours ago."
            },
            "vitals": {
              "temp": "38.9 °C",
              "hr": "118 bpm",
              "rr": "26 /min",
              "spo2": "91%",
              "bp": "غير مسجل / Not recorded"
            },
            "allergyAlert": {
              "ar": "ملاحظة تعليمية: اجتماع تسارع التنفس والنبض مع الحمى ونقص الأكسجين يمثل علامة تحذيرية (Red Flag) تستوجب التصعيد الفوري للفريق الطبي.",
              "en": "Educational Note: Combined tachypnea, tachycardia, fever, and hypoxia are red flags requiring immediate escalation to the medical team."
            },
            "redFlags": [
              {
                "ar": "ملاحظة تعليمية: اجتماع تسارع التنفس والنبض مع الحمى ونقص الأكسجين يمثل علامة تحذيرية (Red Flag) تستوجب التصعيد الفوري للفريق الطبي.",
                "en": "Educational Note: Combined tachypnea, tachycardia, fever, and hypoxia are red flags requiring immediate escalation to the medical team."
              }
            ]
          },
          "puzzleSteps": [
            {
              "id": "prop-vitals-monitor-step-1",
              "prompt": {
                "ar": "تظهر الشاشة ارتفاعاً مفاجئاً في معدل التنفس والنبض مع انخفاض تشبع الأكسجين وحمى، وهي مؤشرات تحذيرية (Red Flags) تستدعي تقييماً طبياً عاجلاً.",
                "en": "The monitor shows rising respiratory rate and heart rate with dropping oxygen saturation and fever—classic red flags requiring immediate clinical escalation."
              },
              "options": [
                {
                  "id": "prop-vitals-monitor-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تظهر الشاشة ارتفاعاً مفاجئاً في معدل التنفس والنبض مع انخفاض تشبع الأكسجين وحمى، وهي مؤشرات تحذيرية (Red Flags) تستدعي تقييماً طبياً عاجلاً.",
                    "en": "The monitor shows rising respiratory rate and heart rate with dropping oxygen saturation and fever—classic red flags requiring immediate clinical escalation."
                  }
                },
                {
                  "id": "prop-vitals-monitor-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "تظهر الشاشة ارتفاعاً مفاجئاً في معدل التنفس والنبض مع انخفاض تشبع الأكسجين وحمى، وهي مؤشرات تحذيرية (Red Flags) تستدعي تقييماً طبياً عاجلاً.",
            "en": "The monitor shows rising respiratory rate and heart rate with dropping oxygen saturation and fever—classic red flags requiring immediate clinical escalation."
          }
        }
      ],
      "nodes": {
        "patientSamira_start": {
          "id": "patientSamira_start",
          "speaker": "patientSamira",
          "targetNpc": "patientSamira",
          "objectiveHint": {
            "ar": "افحص شاشة العلامات الحيوية، ثم تحدث مع أ. سميرة وصعّد الحالة فوراً إلى د. طارق.",
            "en": "Inspect the Vital Signs Monitor, check on Ms. Samira, and escalate the red flags to Dr. Tarek."
          },
          "dialogue": {
            "ar": "أشعر فجأة برجفة شديدة ونفسي قصير جداً مقارنة بالصباح... هل كل شيء على ما يرام؟",
            "en": "I suddenly feel very shaky and short of breath compared to this morning... is everything okay?"
          },
          "choices": [
            {
              "id": "patientSamira_start_c1",
              "label": {
                "ar": "أطمئنكِ وأبقى بجانبكِ لتقييم مجرى الهواء والتنفس والوعي، وأطلب مساعدة الفريق الطبي فوراً",
                "en": "Reassure you, stay at the bedside to assess airway/breathing/alertness, and call the medical team immediately"
              },
              "nextNodeId": "doctorTarek_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "استجابة سريعة ومطمئنة! تقييم المريض مباشرة مع طلب التصعيد هو الإجراء التمريضي الصحيح.",
                "en": "Prompt, reassuring response! Assessing the patient directly while escalating is the right nursing action."
              },
              "rationale": {
                "ar": "ممتاز! ربط تغير العلامات الحيوية (تسارع التنفس والنبض مع انخفاض الأكسجين) بحالة المريض السريرية والتصعيد المبكر يحمي المرضى من المضاعفات.",
                "en": "Excellent! Connecting abnormal vital sign trends with bedside assessment and escalating early prevents severe complications."
              }
            },
            {
              "id": "patientSamira_start_c2",
              "label": {
                "ar": "أغلق صوت إنذار المونيتور وأعود لقياس العلامات بعد 4 ساعات في الجولة الروتينية",
                "en": "Silence the monitor alarm and wait until the next routine vitals round in 4 hours"
              },
              "nextNodeId": "patientSamira_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطر شديد! تجاهل العلامات التحذيرية وتأجيل التقييم قد يؤدي لتدهور حاد.",
                "en": "Severe risk! Silencing alarms and delaying evaluation when red flags appear allows dangerous deterioration."
              },
              "rationale": {
                "ar": "ممتاز! ربط تغير العلامات الحيوية (تسارع التنفس والنبض مع انخفاض الأكسجين) بحالة المريض السريرية والتصعيد المبكر يحمي المرضى من المضاعفات.",
                "en": "Excellent! Connecting abnormal vital sign trends with bedside assessment and escalating early prevents severe complications."
              }
            }
          ]
        },
        "doctorTarek_start": {
          "id": "doctorTarek_start",
          "speaker": "doctorTarek",
          "targetNpc": "doctorTarek",
          "objectiveHint": {
            "ar": "افحص شاشة العلامات الحيوية، ثم تحدث مع أ. سميرة وصعّد الحالة فوراً إلى د. طارق.",
            "en": "Inspect the Vital Signs Monitor, check on Ms. Samira, and escalate the red flags to Dr. Tarek."
          },
          "dialogue": {
            "ar": "وصلني نداء التصعيد العاجل. ما القراءات والعلامات التحذيرية التي رصدتها؟",
            "en": "I received your urgent escalation call. What vital sign trends and red flags did you observe?"
          },
          "choices": [
            {
              "id": "doctorTarek_start_c1",
              "label": {
                "ar": "رصدت حرارة 38.9، نبض 118، معدل تنفس 26/دقيقة، وانخفاض SpO2 إلى 91% مع ضيق تنفس جديد، وأطلب تقييماً سريرياً فورياً",
                "en": "Temp 38.9°C, HR 118, RR 26/min, and SpO2 down to 91% with new shortness of breath—requesting immediate bedside review"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تقرير دقيق ومنظم! الأرقام الواضحة والمقارنة بالحالة السابقة تساعد الطبيب على التدخل الفوري.",
                "en": "Clear, structured report! Specific vital numbers and change from baseline enable rapid clinical response."
              },
              "rationale": {
                "ar": "ممتاز! ربط تغير العلامات الحيوية (تسارع التنفس والنبض مع انخفاض الأكسجين) بحالة المريض السريرية والتصعيد المبكر يحمي المرضى من المضاعفات.",
                "en": "Excellent! Connecting abnormal vital sign trends with bedside assessment and escalating early prevents severe complications."
              }
            },
            {
              "id": "doctorTarek_start_c2",
              "label": {
                "ar": "المريضة تبدو متعبة قليلاً ولكنني لم أسجل الأرقام",
                "en": "The patient looks a bit tired, though I did not note the exact numbers"
              },
              "nextNodeId": "doctorTarek_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "التصعيد الفعّال يتطلب دائماً تقديم قراءات العلامات الحيوية المحددة.",
                "en": "Effective escalation always includes specific vital sign readings and trends."
              },
              "rationale": {
                "ar": "ممتاز! ربط تغير العلامات الحيوية (تسارع التنفس والنبض مع انخفاض الأكسجين) بحالة المريض السريرية والتصعيد المبكر يحمي المرضى من المضاعفات.",
                "en": "Excellent! Connecting abnormal vital sign trends with bedside assessment and escalating early prevents severe complications."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص شاشة العلامات الحيوية، ثم تحدث مع أ. سميرة وصعّد الحالة فوراً إلى د. طارق.",
        "en": "Inspect the Vital Signs Monitor, check on Ms. Samira, and escalate the red flags to Dr. Tarek."
      },
      "educationalTakeaway": {
        "ar": "ممتاز! ربط تغير العلامات الحيوية (تسارع التنفس والنبض مع انخفاض الأكسجين) بحالة المريض السريرية والتصعيد المبكر يحمي المرضى من المضاعفات.",
        "en": "Excellent! Connecting abnormal vital sign trends with bedside assessment and escalating early prevents severe complications."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-7-fall-prevention",
      "missionIndex": 7,
      "requiredMissionId": "na-scen-6-vitals-red-flags",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 6: رصد العلامات الحيوية وتصعيد المؤشرات التحذيرية (Red Flags)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 6: Observing Vital Signs & Escalating Red Flags\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 7: الوقاية من سقوط المرضى وسلامة بيئة الغرفة",
        "en": "Scenario 7: Patient Fall Prevention & Environmental Safety"
      },
      "subtitle": {
        "ar": "ضبط ارتفاع السرير، المكابح، جرس النداء، والإضاءة لحماية المرضى المعرضين للدوار",
        "en": "Secure bed height, wheel brakes, call bell reach, and clutter-free pathways for dizzy patients"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #7",
        "en": "Nursing Safety Scenario #7"
      },
      "badgeIcon": "🛏️",
      "badgeTitle": {
        "ar": "🛏️ حامي سلامة البيئة ومنع السقوط",
        "en": "🛏️ Fall Prevention & Safety Champion"
      },
      "primaryNpc": "patientSamira",
      "briefing": {
        "ar": "المرضى المصابون بالحمى أو الجفاف أو الذين يتلقون محاليل وريدية معرضون لخطر السقوط عند محاولة النهوض بمفردهم. افحص سرير التدريب وطبق إجراءات الوقاية من السقوط.",
        "en": "Patients with fever, dehydration, or IV lines face high fall risk when getting up unassisted. Inspect the Safety Bed Station and secure the environment."
      },
      "initialNodeId": "patientSamira_start",
      "requirePropsSolvedBeforeNodeId": "patientSamira_start",
      "interactiveProps": [
        {
          "id": "prop-fall-bed",
          "name": {
            "ar": "فحص عوامل خطر السقوط في غرفة المريض",
            "en": "Bedside Fall-Risk Environmental Audit"
          },
          "stationLabel": {
            "ar": "محطة سرير الوقاية من السقوط",
            "en": "Fall Prevention Bedside Station"
          },
          "position": [
            2.5,
            0,
            -2
          ],
          "color": 14251782,
          "accentColor": 16498468,
          "iconEmoji": "🛏️",
          "shape": "fall_safety_bed",
          "rewardItem": {
            "id": "reward-prop-fall-bed",
            "icon": "🛏️",
            "label": {
              "ar": "محطة سرير الوقاية من السقوط",
              "en": "Fall Prevention Bedside Station"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-07",
            "protocolTitle": {
              "ar": "قائمة فحص الوقاية من السقوط (Fall Prevention)",
              "en": "Universal Fall Prevention Checklist"
            },
            "patientContext": {
              "ar": "تأكد من استيفاء عناصر الأمان الخمسة قبل مغادرة غرفة المريض:",
              "en": "Verify these core environmental safety controls before leaving any patient room:"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "🛏️ السرير في أدنى وضع آمن (Lowest Position) مع قفل مكابح العجلات (Brakes Locked).",
                  "en": "🛏️ Bed in lowest safe position with wheel brakes locked."
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "🔔 جرس النداء (Call Light) والمقتنيات الشخصية في متناول يد المريض مباشرة.",
                  "en": "🔔 Call bell and personal items placed within easy reach of the patient."
                }
              },
              {
                "icon": "3️⃣",
                "label": {
                  "ar": "الخطوة القياسية 3",
                  "en": "Standard Step 3"
                },
                "detail": {
                  "ar": "🧦 ارتداء جوارب مانعة للانزلاق، وإضاءة ليلية كافية، وإخلاء الممر من الأسلاك والعوائق.",
                  "en": "🧦 Non-slip footwear available, nightlight on, and floor pathways free of cords or spills."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "تذكير: شجع المريض الذي يشعر بالدوار على طلب المساعدة دائماً قبل النهوض تدريجياً من السرير.",
              "en": "Reminder: Instruct dizzy patients to call for assistance and sit at the edge of the bed before standing."
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-fall-bed-step-1",
              "prompt": {
                "ar": "عند فحص الغرفة، لاحظت أن السرير مرتفع، وجرس النداء بعيد عن متناول يد المريضة، وحامل المحلول يعيق الممر نحو الحمام.",
                "en": "During your room check, you notice the bed is left in a high position, the call bell is out of reach, and tubing clutter blocks the path to the bathroom."
              },
              "hint": {
                "ar": "تذكير: شجع المريض الذي يشعر بالدوار على طلب المساعدة دائماً قبل النهوض تدريجياً من السرير.",
                "en": "Reminder: Instruct dizzy patients to call for assistance and sit at the edge of the bed before standing."
              },
              "options": [
                {
                  "id": "prop-fall-bed-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تذكير: شجع المريض الذي يشعر بالدوار على طلب المساعدة دائماً قبل النهوض تدريجياً من السرير.",
                    "en": "Reminder: Instruct dizzy patients to call for assistance and sit at the edge of the bed before standing."
                  }
                },
                {
                  "id": "prop-fall-bed-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "تذكير: شجع المريض الذي يشعر بالدوار على طلب المساعدة دائماً قبل النهوض تدريجياً من السرير.",
            "en": "Reminder: Instruct dizzy patients to call for assistance and sit at the edge of the bed before standing."
          }
        }
      ],
      "nodes": {
        "patientSamira_start": {
          "id": "patientSamira_start",
          "speaker": "patientSamira",
          "targetNpc": "patientSamira",
          "objectiveHint": {
            "ar": "افحص سرير سلامة المريض، ثم تحدث مع أ. سميرة والمشرف كريم لتأمين الغرفة.",
            "en": "Inspect the Fall-Prevention Bed Station, then coordinate with Ms. Samira and Preceptor Kareem."
          },
          "dialogue": {
            "ar": "أشعر ببعض الدوار بعد الحمى، لكنني لا أريد إزعاجكم عندما أحتاج الذهاب إلى الحمام ليلاً.",
            "en": "I feel a bit dizzy after the fever, but I do not want to bother anyone when I need to walk to the bathroom at night."
          },
          "choices": [
            {
              "id": "patientSamira_start_c1",
              "label": {
                "ar": "سلامتكِ أولويتنا وليس إزعاجاً أبداً! وضعت جرس النداء في يدكِ وخفضت السرير؛ اضغطي الجرس دائماً لنرافقكِ بأمان",
                "en": "Your safety comes first and it is never a bother! I placed the call bell in your reach and lowered the bed—please call us every time before getting up"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تثقيف تمريضي ممتاز! كثير من المرضى يسقطون لأنهم يتحرجون من طلب المساعدة.",
                "en": "Wonderful patient education! Many falls happen because patients hesitate to disturb nursing staff."
              },
              "rationale": {
                "ar": "رائع! خفض السرير لأدنى مستوى، قفل العجلات، وضع جرس النداء في متناول اليد، وإزالة العوائق تمنع إصابات السقوط داخل المستشفى.",
                "en": "Great job! Keeping the bed in low locked position with the call bell in reach and clear floor pathways prevents inpatient falls."
              }
            },
            {
              "id": "patientSamira_start_c2",
              "label": {
                "ar": "حسناً، تحركي بسرعة لوحدكِ وتمسكي بحامل المحلول المتحرك",
                "en": "Okay, just walk quickly on your own and lean on the rolling IV pole"
              },
              "nextNodeId": "patientSamira_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطر سقوط مؤكد! حامل المحلول ذو العجلات ينزلق بسهولة عند الاتكاء عليه.",
                "en": "High fall hazard! Rolling IV poles tip or roll away easily when used for support."
              },
              "rationale": {
                "ar": "رائع! خفض السرير لأدنى مستوى، قفل العجلات، وضع جرس النداء في متناول اليد، وإزالة العوائق تمنع إصابات السقوط داخل المستشفى.",
                "en": "Great job! Keeping the bed in low locked position with the call bell in reach and clear floor pathways prevents inpatient falls."
              }
            }
          ]
        },
        "preceptorKareem_start": {
          "id": "preceptorKareem_start",
          "speaker": "preceptorKareem",
          "targetNpc": "preceptorKareem",
          "objectiveHint": {
            "ar": "افحص سرير سلامة المريض، ثم تحدث مع أ. سميرة والمشرف كريم لتأمين الغرفة.",
            "en": "Inspect the Fall-Prevention Bed Station, then coordinate with Ms. Samira and Preceptor Kareem."
          },
          "dialogue": {
            "ar": "ما التعديلات البيئية التي قمت بها في غرفة أ. سميرة لتقليل خطر السقوط؟",
            "en": "What environmental adjustments did you complete in Ms. Samira’s room to reduce fall risk?"
          },
          "choices": [
            {
              "id": "preceptorKareem_start_c1",
              "label": {
                "ar": "خفضت السرير، قفلت مكابح العجلات، وضعت جرس النداء في متناول يدها، وأزلت عوائق الأسلاك مع تفعيل الإضاءة الليلية",
                "en": "Lowered the bed, locked the brakes, placed the call bell within reach, cleared floor cords, and turned on the nightlight"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تطبيق شامل لمعايير سلامة البيئة ومنع السقوط!",
                "en": "Comprehensive application of bedside fall-prevention standards!"
              },
              "rationale": {
                "ar": "رائع! خفض السرير لأدنى مستوى، قفل العجلات، وضع جرس النداء في متناول اليد، وإزالة العوائق تمنع إصابات السقوط داخل المستشفى.",
                "en": "Great job! Keeping the bed in low locked position with the call bell in reach and clear floor pathways prevents inpatient falls."
              }
            },
            {
              "id": "preceptorKareem_start_c2",
              "label": {
                "ar": "تركت السرير مرتفعاً ليكون مريحاً للفحص القادم",
                "en": "Left the bed elevated at waist height for the next exam"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "ترك السرير مرتفعاً بعد انتهاء الإجراء يزيد بشدة من خطورة الإصابة عند السقوط.",
                "en": "Leaving the bed elevated after care significantly increases injury severity if a patient attempts to exit."
              },
              "rationale": {
                "ar": "رائع! خفض السرير لأدنى مستوى، قفل العجلات، وضع جرس النداء في متناول اليد، وإزالة العوائق تمنع إصابات السقوط داخل المستشفى.",
                "en": "Great job! Keeping the bed in low locked position with the call bell in reach and clear floor pathways prevents inpatient falls."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص سرير سلامة المريض، ثم تحدث مع أ. سميرة والمشرف كريم لتأمين الغرفة.",
        "en": "Inspect the Fall-Prevention Bed Station, then coordinate with Ms. Samira and Preceptor Kareem."
      },
      "educationalTakeaway": {
        "ar": "رائع! خفض السرير لأدنى مستوى، قفل العجلات، وضع جرس النداء في متناول اليد، وإزالة العوائق تمنع إصابات السقوط داخل المستشفى.",
        "en": "Great job! Keeping the bed in low locked position with the call bell in reach and clear floor pathways prevents inpatient falls."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-8-specimen-labeling",
      "missionIndex": 8,
      "requiredMissionId": "na-scen-7-fall-prevention",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 7: الوقاية من سقوط المرضى وسلامة بيئة الغرفة» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 7: Patient Fall Prevention & Environmental Safety\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 8: مبادئ سحب وترميز العينات المخبرية بجانب السرير",
        "en": "Scenario 8: Specimen Collection & Bedside Labeling Principles"
      },
      "subtitle": {
        "ar": "تجنب أخطاء الملصقات المسبقة وتوثيق الوقت والموقع بدقة لضمان دقة المزارع البكتيرية",
        "en": "Prevent mislabeled cultures by labeling exclusively at the bedside immediately after collection"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #8",
        "en": "Nursing Safety Scenario #8"
      },
      "badgeIcon": "🧪",
      "badgeTitle": {
        "ar": "🧪 أمين دقة العينات المخبرية",
        "en": "🧪 Bedside Specimen Integrity Pro"
      },
      "primaryNpc": "educatorMona",
      "briefing": {
        "ar": "العينة غير المعنونة أو المعنونة باسم مريض خاطئ تؤدي إلى تشخيص ومضاد حيوي خاطئ تماماً. تدرب في محطة العينات على قواعد الترميز الآمن بجانب السرير.",
        "en": "An unlabeled or mislabeled microbiology specimen leads directly to wrong diagnosis and inappropriate antibiotic therapy. Practice bedside labeling standards."
      },
      "initialNodeId": "educatorMona_start",
      "requirePropsSolvedBeforeNodeId": "educatorMona_start",
      "interactiveProps": [
        {
          "id": "prop-specimen-station",
          "name": {
            "ar": "بروتوكول ترميز عينات المزارع بجانب السرير",
            "en": "Bedside Microbiology Specimen Labeling Protocol"
          },
          "stationLabel": {
            "ar": "محطة ترميز وحفظ العينات",
            "en": "Bedside Specimen Labeling Station"
          },
          "position": [
            -2.4,
            0,
            -2
          ],
          "color": 561586,
          "accentColor": 2282478,
          "iconEmoji": "🧪",
          "shape": "specimen_cooler",
          "rewardItem": {
            "id": "reward-prop-specimen-station",
            "icon": "🧪",
            "label": {
              "ar": "محطة ترميز وحفظ العينات",
              "en": "Bedside Specimen Labeling Station"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-08",
            "protocolTitle": {
              "ar": "القواعد الذهبية لترميز العينات (Specimen Labeling)",
              "en": "Golden Rules of Specimen Labeling"
            },
            "patientContext": {
              "ar": "اتبع هذه الخطوات في كل مرة تسحب فيها عينة مزرعة:",
              "en": "Follow these steps every time you collect a clinical culture specimen:"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "🏷️ وضع الملصق بجانب سرير المريض مباشرة وفور جمع العينة (Never leave bedside unlabeled).",
                  "en": "🏷️ Label the container at the bedside immediately after collection—never in the hallway or nurses station."
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "🕒 تدوين اسم المريض الكامل، الرقم الطبي، تاريخ ووقت السحب الدقيق، وموقع/نوع العينة.",
                  "en": "🕒 Include full patient name, MRN, exact collection date/time, specimen source, and collector ID."
                }
              },
              {
                "icon": "3️⃣",
                "label": {
                  "ar": "الخطوة القياسية 3",
                  "en": "Standard Step 3"
                },
                "detail": {
                  "ar": "🚫 عدم إحضار ملصقات تخص أكثر من مريض واحد في الجيب أو على العربة.",
                  "en": "🚫 Never carry labels for more than one patient at a time."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "معلومة مهمة: سحب عينات المزارع يتم (متى أمكن سريرياً) قبل بدء الجرعة الأولى من المضاد الحيوي لتجنب النتائج السلبية الكاذبة.",
              "en": "Key Principle: Collect microbiology cultures prior to initiating antimicrobials whenever clinically safe to preserve culture sensitivity."
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-specimen-station-step-1",
              "prompt": {
                "ar": "يتطلب المختبر رفض أي عينة غير معنونة أو يظهر فيها تضارب بين الملصق وطلب الفحص. يجب وضع الملصق فور السحب وأمام المريض.",
                "en": "The laboratory must reject unlabeled or mismatched specimens. Labels must be applied immediately after collection in the presence of the patient."
              },
              "hint": {
                "ar": "معلومة مهمة: سحب عينات المزارع يتم (متى أمكن سريرياً) قبل بدء الجرعة الأولى من المضاد الحيوي لتجنب النتائج السلبية الكاذبة.",
                "en": "Key Principle: Collect microbiology cultures prior to initiating antimicrobials whenever clinically safe to preserve culture sensitivity."
              },
              "options": [
                {
                  "id": "prop-specimen-station-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "معلومة مهمة: سحب عينات المزارع يتم (متى أمكن سريرياً) قبل بدء الجرعة الأولى من المضاد الحيوي لتجنب النتائج السلبية الكاذبة.",
                    "en": "Key Principle: Collect microbiology cultures prior to initiating antimicrobials whenever clinically safe to preserve culture sensitivity."
                  }
                },
                {
                  "id": "prop-specimen-station-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "معلومة مهمة: سحب عينات المزارع يتم (متى أمكن سريرياً) قبل بدء الجرعة الأولى من المضاد الحيوي لتجنب النتائج السلبية الكاذبة.",
            "en": "Key Principle: Collect microbiology cultures prior to initiating antimicrobials whenever clinically safe to preserve culture sensitivity."
          }
        }
      ],
      "nodes": {
        "educatorMona_start": {
          "id": "educatorMona_start",
          "speaker": "educatorMona",
          "targetNpc": "educatorMona",
          "objectiveHint": {
            "ar": "افحص محطة ترميز العينات، ثم تحدث مع أ. منى والمشرف كريم.",
            "en": "Inspect the Specimen Labeling Station, then verify collection workflow with Educator Mona and Preceptor Kareem."
          },
          "dialogue": {
            "ar": "سحبت عينة مزرعة من المريض، لكن طابعة الملصقات المحمولة نفد ورقها. هل تأخذ الأنبوبة غير معنونة في جيبك إلى محطة التمريض لتسميتها هناك؟",
            "en": "You just collected a culture specimen, but the portable label printer ran out of paper. Should you carry the unlabeled tube in your pocket to the nurses station?"
          },
          "choices": [
            {
              "id": "educatorMona_start_c1",
              "label": {
                "ar": "لا أخرج أبداً بأنبوبة غير معنونة؛ أكتب المعرّفين والوقت والموقع يدوياً بوضوح بجانب السرير أولاً قبل التحرك",
                "en": "Never leave the bedside with an unlabeled tube; clearly write the two identifiers, time, and source on the tube at the bedside first"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "قرار ممتاز! حمل أنابيب غير معنونة في الجيب أو الممر هو السبب الأول لتبديل عينات المرضى.",
                "en": "Excellent decision! Carrying unlabeled tubes out of the room is the #1 cause of swapped specimen errors."
              },
              "rationale": {
                "ar": "أحسنت! لا تغادر جانب سرير المريض أبداً بأنابيب غير معنونة، ولا تطبع ملصقات لعدة مرضى دفعة واحدة.",
                "en": "Spot on! Never leave the bedside with unlabeled tubes, and never carry pre-printed labels for multiple patients at once."
              }
            },
            {
              "id": "educatorMona_start_c2",
              "label": {
                "ar": "أضعها في جيبي مع أنبوبة مريض آخر وأسميهما معاً عند المكتب",
                "en": "Put it in my pocket next to another tube and label both at the desk"
              },
              "nextNodeId": "educatorMona_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطأ جسيم يؤدي حتماً إلى الخلط بين العينات وتشخيص خاطئ.",
                "en": "Critical error that frequently leads to swapped samples and misdiagnosis."
              },
              "rationale": {
                "ar": "أحسنت! لا تغادر جانب سرير المريض أبداً بأنابيب غير معنونة، ولا تطبع ملصقات لعدة مرضى دفعة واحدة.",
                "en": "Spot on! Never leave the bedside with unlabeled tubes, and never carry pre-printed labels for multiple patients at once."
              }
            }
          ]
        },
        "preceptorKareem_start": {
          "id": "preceptorKareem_start",
          "speaker": "preceptorKareem",
          "targetNpc": "preceptorKareem",
          "objectiveHint": {
            "ar": "افحص محطة ترميز العينات، ثم تحدث مع أ. منى والمشرف كريم.",
            "en": "Inspect the Specimen Labeling Station, then verify collection workflow with Educator Mona and Preceptor Kareem."
          },
          "dialogue": {
            "ar": "وجدت على طاولة التحضير أنبوبة دم مسحوبة بدون أي ملصق ولا أحد يتذكر لمن تعود. ما الإجراء الصحيح؟",
            "en": "You find an unlabeled blood tube sitting unattended on the prep counter. What is the correct protocol?"
          },
          "choices": [
            {
              "id": "preceptorKareem_start_c1",
              "label": {
                "ar": "التخلص الآمن من العينة غير المعنونة وفق البروتوكول وإبلاغ الفريق لإعادة السحب بطريقة موثقة؛ لا يجوز تخمين صاحب العينة أبداً",
                "en": "Safely discard the unlabeled specimen per protocol and arrange a verified redraw; never guess or label an unattended tube"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "إجابة صحيحة 100%! تخمين هوية عينة مجهولة يعرض حياة المرضى لخطر جسيم.",
                "en": "100% correct! Guessing the owner of an unlabeled specimen poses a severe patient safety hazard."
              },
              "rationale": {
                "ar": "أحسنت! لا تغادر جانب سرير المريض أبداً بأنابيب غير معنونة، ولا تطبع ملصقات لعدة مرضى دفعة واحدة.",
                "en": "Spot on! Never leave the bedside with unlabeled tubes, and never carry pre-printed labels for multiple patients at once."
              }
            },
            {
              "id": "preceptorKareem_start_c2",
              "label": {
                "ar": "ألصق عليها اسم آخر مريض دخل الجناح اليوم",
                "en": "Put the label of the most recent admission on it"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "ممنوع تماماً! وضع ملصق بالتخمين يسبب كوارث تشخيصية وعلاجية.",
                "en": "Strictly prohibited! Labeling by guesswork causes catastrophic diagnostic errors."
              },
              "rationale": {
                "ar": "أحسنت! لا تغادر جانب سرير المريض أبداً بأنابيب غير معنونة، ولا تطبع ملصقات لعدة مرضى دفعة واحدة.",
                "en": "Spot on! Never leave the bedside with unlabeled tubes, and never carry pre-printed labels for multiple patients at once."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص محطة ترميز العينات، ثم تحدث مع أ. منى والمشرف كريم.",
        "en": "Inspect the Specimen Labeling Station, then verify collection workflow with Educator Mona and Preceptor Kareem."
      },
      "educationalTakeaway": {
        "ar": "أحسنت! لا تغادر جانب سرير المريض أبداً بأنابيب غير معنونة، ولا تطبع ملصقات لعدة مرضى دفعة واحدة.",
        "en": "Spot on! Never leave the bedside with unlabeled tubes, and never carry pre-printed labels for multiple patients at once."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-9-antibiotic-education",
      "missionIndex": 9,
      "requiredMissionId": "na-scen-8-specimen-labeling",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 8: مبادئ سحب وترميز العينات المخبرية بجانب السرير» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 8: Specimen Collection & Bedside Labeling Principles\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 9: تثقيف المريض والأسرة حول الاستخدام الرشيد للمضادات الحيوية",
        "en": "Scenario 9: Patient & Family Antibiotic Stewardship Education"
      },
      "subtitle": {
        "ar": "توضيح الفرق بين العدوى الفيروسية والبكتيرية ومخاطر مشاركة المضادات أو إيقافها دون استشارة",
        "en": "Educate patients on viral vs. bacterial infections, avoiding leftover sharing, and recognizing side effects"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #9",
        "en": "Nursing Safety Scenario #9"
      },
      "badgeIcon": "🌱",
      "badgeTitle": {
        "ar": "🌱 سفير التوعية بالمضادات الحيوية",
        "en": "🌱 Antibiotic Stewardship Educator"
      },
      "primaryNpc": "patientSamira",
      "briefing": {
        "ar": "يلعب التمريض دوراً محورياً في التوعية بمقاومة المضادات الحيوية عند خروج المريض أو أثناء الرعاية. افحص منصة التثقيف الصحي وحاور أ. سميرة ود. طارق.",
        "en": "Nurses play a vital role in antimicrobial stewardship education during care and discharge. Inspect the Stewardship Education Kiosk and speak with Ms. Samira and Dr. Tarek."
      },
      "initialNodeId": "patientSamira_start",
      "requirePropsSolvedBeforeNodeId": "patientSamira_start",
      "interactiveProps": [
        {
          "id": "prop-abx-education-kiosk",
          "name": {
            "ar": "رسائل التوعية الأساسية للمرضى والأسر",
            "en": "Core Patient & Family Stewardship Messages"
          },
          "stationLabel": {
            "ar": "منصة التثقيف بالمضادات الحيوية",
            "en": "Antibiotic Stewardship Education Kiosk"
          },
          "position": [
            2.4,
            0,
            0.6
          ],
          "color": 366185,
          "accentColor": 3462041,
          "iconEmoji": "🛡️",
          "shape": "stewardship_kiosk",
          "rewardItem": {
            "id": "reward-prop-abx-education-kiosk",
            "icon": "🛡️",
            "label": {
              "ar": "منصة التثقيف بالمضادات الحيوية",
              "en": "Antibiotic Stewardship Education Kiosk"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-09",
            "protocolTitle": {
              "ar": "نقاط التثقيف التمريضي حول المضادات الحيوية",
              "en": "Patient Antibiotic Education Checklist"
            },
            "patientContext": {
              "ar": "أهم الرسائل التوعوية التي يقدمها الممرض للمريض وأسرته:",
              "en": "Key educational points nurses share with patients and families:"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "🦠 المضادات الحيوية لا تعالج الفيروسات (مثل الزكام والإنفلونزا معظم التهابات الحلق البسيطة).",
                  "en": "🦠 Antibiotics do not treat viruses (such as common colds, flu, or most viral sore throats)."
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "🚫 عدم مشاركة المضادات الحيوية مع الآخرين أو الاحتفاظ ببقايا الدواء لاستخدامها لاحقاً بدون تقييم طبي.",
                  "en": "🚫 Never share antibiotics with family members or save leftover doses for future illnesses."
                }
              },
              {
                "icon": "3️⃣",
                "label": {
                  "ar": "الخطوة القياسية 3",
                  "en": "Standard Step 3"
                },
                "detail": {
                  "ar": "📞 إبلاغ الفريق الطبي فوراً إذا ظهر طفح جلدي، إسهال شديد مستمر، أو ضيق تنفس.",
                  "en": "📞 Contact a healthcare provider promptly if rash, severe watery diarrhea, or breathing difficulty occurs."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "ملاحظة: هذا التثقيف عام لتعزيز الوعي الصحي ولا يحل محل استشارة الطبيب المعالج لكل حالة.",
              "en": "Note: Educational guidance supports safe awareness and never replaces individualized medical supervision."
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-abx-education-kiosk-step-1",
              "prompt": {
                "ar": "المضادات الحيوية تعالج العدوى البكتيرية فقط ولا تفيد في نزلات البرد أو الإنفلونزا الفيروسية. الاستخدام العشوائي يخلق بكتيريا مقاومة يصعب علاجها.",
                "en": "Antibiotics treat bacterial infections only and do not cure viral colds or flu. Misuse selects for resistant bacteria and can cause side effects."
              },
              "hint": {
                "ar": "ملاحظة: هذا التثقيف عام لتعزيز الوعي الصحي ولا يحل محل استشارة الطبيب المعالج لكل حالة.",
                "en": "Note: Educational guidance supports safe awareness and never replaces individualized medical supervision."
              },
              "options": [
                {
                  "id": "prop-abx-education-kiosk-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "ملاحظة: هذا التثقيف عام لتعزيز الوعي الصحي ولا يحل محل استشارة الطبيب المعالج لكل حالة.",
                    "en": "Note: Educational guidance supports safe awareness and never replaces individualized medical supervision."
                  }
                },
                {
                  "id": "prop-abx-education-kiosk-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "ملاحظة: هذا التثقيف عام لتعزيز الوعي الصحي ولا يحل محل استشارة الطبيب المعالج لكل حالة.",
            "en": "Note: Educational guidance supports safe awareness and never replaces individualized medical supervision."
          }
        }
      ],
      "nodes": {
        "patientSamira_start": {
          "id": "patientSamira_start",
          "speaker": "patientSamira",
          "targetNpc": "patientSamira",
          "objectiveHint": {
            "ar": "افحص منصة التوعية بالمضادات الحيوية، ثم قدم التثقيف الصحي لأ. سميرة ونسق مع د. طارق.",
            "en": "Inspect the Antibiotic Education Kiosk, counsel Ms. Samira, and review stewardship points with Dr. Tarek."
          },
          "dialogue": {
            "ar": "ابني في المنزل لديه زكام وعطاس بسيط منذ يومين. هل أعطيه من كبسولات المضاد الحيوي القديمة الموجودة لدينا في خزانة المنزل؟",
            "en": "My son at home has had a mild runny nose and sneezing for two days. Should I give him leftover antibiotic capsules from our home cabinet?"
          },
          "choices": [
            {
              "id": "patientSamira_start_c1",
              "label": {
                "ar": "أنصحكِ بعدم إعطائه أي مضاد متبقٍ؛ الزكام غالباً فيروسي لا يستجيب للمضادات، ومشاركة الأدوية تزيد المقاومة البكتيرية وتسبب أعراضاً جانبية",
                "en": "Please do not give leftover antibiotics; colds are typically viral where antibiotics do not help, and sharing medications drives resistance and side effects"
              },
              "nextNodeId": "doctorTarek_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تثقيف صحي واضح ومقنع! شرح السبب العلمي بأسلوب مبسط يساعد الأسرة على اتخاذ القرار الصحيح.",
                "en": "Clear, empathetic education! Explaining why antibiotics do not help viruses empowers families to avoid misuse."
              },
              "rationale": {
                "ar": "عمل ممتاز! التثقيف التمريضي الواضح يمنع استخدام المضادات الحيوية لنزلات البرد الفيروسية ويمنع مشاركة الأدوية المتبقية.",
                "en": "Great work! Clear nursing education prevents unnecessary antibiotic use for viral colds and stops leftover medication sharing."
              }
            },
            {
              "id": "patientSamira_start_c2",
              "label": {
                "ar": "نعم، أعطيه كبسولة أو اثنتين احتياطاً حتى يتحسن",
                "en": "Sure, give him a couple of leftover capsules just in case"
              },
              "nextNodeId": "patientSamira_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "ممارسة خاطئة خطيرة تسهم في انتشار البكتيريا المقاومة وتعرض الطفل لأعراض جانبية دون فائدة.",
                "en": "Unsafe practice that fuels antimicrobial resistance and exposes patients to avoidable harm."
              },
              "rationale": {
                "ar": "عمل ممتاز! التثقيف التمريضي الواضح يمنع استخدام المضادات الحيوية لنزلات البرد الفيروسية ويمنع مشاركة الأدوية المتبقية.",
                "en": "Great work! Clear nursing education prevents unnecessary antibiotic use for viral colds and stops leftover medication sharing."
              }
            }
          ]
        },
        "doctorTarek_start": {
          "id": "doctorTarek_start",
          "speaker": "doctorTarek",
          "targetNpc": "doctorTarek",
          "objectiveHint": {
            "ar": "افحص منصة التوعية بالمضادات الحيوية، ثم قدم التثقيف الصحي لأ. سميرة ونسق مع د. طارق.",
            "en": "Inspect the Antibiotic Education Kiosk, counsel Ms. Samira, and review stewardship points with Dr. Tarek."
          },
          "dialogue": {
            "ar": "ما الأعراض التحذيرية التي نؤكد على المريض مراقبتها وإبلاغ الفريق الطبي بها أثناء فترة المتابعة؟",
            "en": "Which warning signs did you emphasize for the patient to report promptly during follow-up?"
          },
          "choices": [
            {
              "id": "doctorTarek_start_c1",
              "label": {
                "ar": "ظهور طفح جلدي أو حكة، تورم بالوجه/ضيق تنفس، أو إسهال مائي شديد ومستمر، مع عدم مشاركة الدواء مع أي شخص آخر",
                "en": "Any new rash/hives, facial swelling or breathing trouble, or severe persistent watery diarrhea, while never sharing medication"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تكامل ممتاز بين التمريض والفريق الطبي في تعزيز التوعية الدوائية!",
                "en": "Excellent collaboration between nursing and medical teams on patient stewardship education!"
              },
              "rationale": {
                "ar": "عمل ممتاز! التثقيف التمريضي الواضح يمنع استخدام المضادات الحيوية لنزلات البرد الفيروسية ويمنع مشاركة الأدوية المتبقية.",
                "en": "Great work! Clear nursing education prevents unnecessary antibiotic use for viral colds and stops leftover medication sharing."
              }
            },
            {
              "id": "doctorTarek_start_c2",
              "label": {
                "ar": "أخبرتها أنه لا توجد أي أعراض جانبية للمضادات الحيوية إطلاقاً",
                "en": "I told her antibiotics never cause any side effects"
              },
              "nextNodeId": "doctorTarek_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "غير صحيح: يجب دائماً توعية المريض بالعلامات التحذيرية كالحساسية أو الإسهال الشديد.",
                "en": "Inaccurate: Patients must always know what adverse reactions require prompt medical evaluation."
              },
              "rationale": {
                "ar": "عمل ممتاز! التثقيف التمريضي الواضح يمنع استخدام المضادات الحيوية لنزلات البرد الفيروسية ويمنع مشاركة الأدوية المتبقية.",
                "en": "Great work! Clear nursing education prevents unnecessary antibiotic use for viral colds and stops leftover medication sharing."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص منصة التوعية بالمضادات الحيوية، ثم قدم التثقيف الصحي لأ. سميرة ونسق مع د. طارق.",
        "en": "Inspect the Antibiotic Education Kiosk, counsel Ms. Samira, and review stewardship points with Dr. Tarek."
      },
      "educationalTakeaway": {
        "ar": "عمل ممتاز! التثقيف التمريضي الواضح يمنع استخدام المضادات الحيوية لنزلات البرد الفيروسية ويمنع مشاركة الأدوية المتبقية.",
        "en": "Great work! Clear nursing education prevents unnecessary antibiotic use for viral colds and stops leftover medication sharing."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    },
    {
      "id": "na-scen-10-shift-handover",
      "missionIndex": 10,
      "requiredMissionId": "na-scen-9-antibiotic-education",
      "unlockRequirementText": {
        "ar": "أكمل «السيناريو 9: تثقيف المريض والأسرة حول الاستخدام الرشيد للمضادات الحيوية» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Scenario 9: Patient & Family Antibiotic Stewardship Education\" first to unlock this stage."
      },
      "accentHex": 165063,
      "title": {
        "ar": "السيناريو 10: التسليم السريري المنظم بين النوبات (SBAR Handover)",
        "en": "Scenario 10: Structured SBAR Shift Handover Capstone"
      },
      "subtitle": {
        "ar": "نقل المعلومات الحرجة (الحالة، الخلفية، التقييم، التوصية) بدقة عند تبديل الشفت التمريضي",
        "en": "Communicate Situation, Background, Assessment, and Recommendation without omitting critical safety details"
      },
      "categoryBadge": {
        "ar": "سيناريو تدريب تمريضي #10",
        "en": "Nursing Safety Scenario #10"
      },
      "badgeIcon": "🏆",
      "badgeTitle": {
        "ar": "🏆 خريج أكاديمية التمريض المعتمد (SBAR Master)",
        "en": "🏆 Certified Nurse Academy Graduate (SBAR Master)"
      },
      "primaryNpc": "preceptorKareem",
      "briefing": {
        "ar": "في ختام تدريب أكاديمية التمريض، حان وقت تسليم الشفت للمناوبة القادمة باستخدام نموذج SBAR القياسي لضمان عدم سقوط أي معلومة تتعلق بالحساسية، نتائج المزارع المعلقة، أو خطة المراقبة.",
        "en": "In your Nurse Academy capstone, deliver a complete shift handover using the structured SBAR framework so allergies, pending cultures, and monitoring plans are never lost."
      },
      "initialNodeId": "preceptorKareem_start",
      "requirePropsSolvedBeforeNodeId": "preceptorKareem_start",
      "interactiveProps": [
        {
          "id": "prop-sbar-podium",
          "name": {
            "ar": "نموذج SBAR للتواصل والتسليم السريري الآمن",
            "en": "Structured SBAR Handover Framework"
          },
          "stationLabel": {
            "ar": "منصة التسليم السريري (SBAR)",
            "en": "SBAR Shift Handover Station"
          },
          "position": [
            0,
            0,
            -2.4
          ],
          "color": 165063,
          "accentColor": 3718648,
          "iconEmoji": "📋",
          "shape": "sbar_podium",
          "rewardItem": {
            "id": "reward-prop-sbar-podium",
            "icon": "📋",
            "label": {
              "ar": "منصة التسليم السريري (SBAR)",
              "en": "SBAR Shift Handover Station"
            }
          },
          "nursingChecklistConfig": {
            "protocolCode": "NA-SOP-10",
            "protocolTitle": {
              "ar": "عناصر التسليم السريري الآمن (SBAR Checklist)",
              "en": "SBAR Shift Handover Checklist"
            },
            "patientContext": {
              "ar": "تأكد من تضمين العناصر الأربعة مع إتاحة فرصة لطرح الأسئلة وتأكيد الفهم (Read-back):",
              "en": "Include all four pillars and invite clarifying questions during shift transition:"
            },
            "checklistItems": [
              {
                "icon": "1️⃣",
                "label": {
                  "ar": "الخطوة القياسية 1",
                  "en": "Standard Step 1"
                },
                "detail": {
                  "ar": "📌 S — Situation: اسم المريض الكامل، الرقم الطبي، الغرفة، وسبب التنويم الحالي.",
                  "en": "📌 S — Situation: Full patient name, MRN, room, and primary reason for admission."
                }
              },
              {
                "icon": "2️⃣",
                "label": {
                  "ar": "الخطوة القياسية 2",
                  "en": "Standard Step 2"
                },
                "detail": {
                  "ar": "📋 B — Background: التاريخ المرضي، الحساسية الدوائية المسجلة (ومدى خطورتها)، وحالة العزل.",
                  "en": "📋 B — Background: Relevant history, verified allergies/reaction type, and isolation status."
                }
              },
              {
                "icon": "3️⃣",
                "label": {
                  "ar": "الخطوة القياسية 3",
                  "en": "Standard Step 3"
                },
                "detail": {
                  "ar": "🩺 A — Assessment: أحدث العلامات الحيوية، اتجاه التحسن أو التدهور، وحالة خطر السقوط.",
                  "en": "🩺 A — Assessment: Latest vital signs trend, line/catheter status, and fall-risk precautions."
                }
              },
              {
                "icon": "4️⃣",
                "label": {
                  "ar": "الخطوة القياسية 4",
                  "en": "Standard Step 4"
                },
                "detail": {
                  "ar": "🎯 R — Recommendation: نتائج المزارع المعلقة التي تحتاج متابعة، وموعد التقييم القادم.",
                  "en": "🎯 R — Recommendation: Pending culture results to follow up and scheduled reassessments."
                }
              }
            ],
            "safetyPrinciple": {
              "ar": "قاعدة السلامة: التسليم الشفهي السريع في الممر دون مراجعة السجل المشترك يؤدي لفقدان معلومات الحساسية والمزارع.",
              "en": "Safety Rule: Rushed hallway handovers without reviewing the chart lead to missed allergies and pending labs."
            }
          },
          "puzzleSteps": [
            {
              "id": "prop-sbar-podium-step-1",
              "prompt": {
                "ar": "يضمن إطار SBAR نقل المعلومات بترتيب واضح: S (Situation الوضع الحالي)، B (Background الخلفية والحساسية)، A (Assessment التقييم والعلامات الحيوية)، R (Recommendation التوصيات والمتابعة).",
                "en": "SBAR structures clinical communication clearly: Situation, Background (including allergies & isolation), Assessment (vitals & stability), and Recommendation (pending labs & next steps)."
              },
              "hint": {
                "ar": "قاعدة السلامة: التسليم الشفهي السريع في الممر دون مراجعة السجل المشترك يؤدي لفقدان معلومات الحساسية والمزارع.",
                "en": "Safety Rule: Rushed hallway handovers without reviewing the chart lead to missed allergies and pending labs."
              },
              "options": [
                {
                  "id": "prop-sbar-podium-opt-correct",
                  "label": {
                    "ar": "تطبيق هذا البروتوكول التمريضي القياسي والتحقق من جميع عناصر السلامة",
                    "en": "Apply this standard nursing safety protocol and verify all checklist elements"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "قاعدة السلامة: التسليم الشفهي السريع في الممر دون مراجعة السجل المشترك يؤدي لفقدان معلومات الحساسية والمزارع.",
                    "en": "Safety Rule: Rushed hallway handovers without reviewing the chart lead to missed allergies and pending labs."
                  }
                },
                {
                  "id": "prop-sbar-podium-opt-wrong",
                  "label": {
                    "ar": "تخطي خطوات التحقق القياسية للاعتماد على الذاكرة الشخصية فقط",
                    "en": "Skip the standard verification checklist and rely on memory alone"
                  },
                  "isCorrect": false,
                  "feedback": {
                    "ar": "تنبيه تعليمي: تخطي فحص الأدلة أو قوائم التحقق السريرية يؤدي إلى أخطاء طبية يمكن الوقاية منها. راجع المعطيات أعلاه وحاول مجدداً.",
                    "en": "Educational note: Skipping evidence audits or safety checklists leads to preventable clinical errors. Review the station details above and try again."
                  }
                }
              ]
            }
          ],
          "completionClueSummary": {
            "ar": "قاعدة السلامة: التسليم الشفهي السريع في الممر دون مراجعة السجل المشترك يؤدي لفقدان معلومات الحساسية والمزارع.",
            "en": "Safety Rule: Rushed hallway handovers without reviewing the chart lead to missed allergies and pending labs."
          }
        }
      ],
      "nodes": {
        "preceptorKareem_start": {
          "id": "preceptorKareem_start",
          "speaker": "preceptorKareem",
          "targetNpc": "preceptorKareem",
          "objectiveHint": {
            "ar": "افحص منصة تسليم الشفت (SBAR)، ثم أتمم التسليم مع المشرف كريم وأ. منى.",
            "en": "Inspect the SBAR Handover Podium, then complete the structured handover with Preceptor Kareem and Educator Mona."
          },
          "dialogue": {
            "ar": "أنا مستعد لاستلام الشفت عن حالة أ. سميرة. كيف ستقدم التسليم السريري؟",
            "en": "I am ready to receive shift handover for Ms. Samira. How will you present the report?"
          },
          "choices": [
            {
              "id": "preceptorKareem_start_c1",
              "label": {
                "ar": "أستخدم SBAR: أعرض الهوية والوضع الحالي (S)، الحساسية المؤكدة للبنسلين وإجراءات منع السقوط (B)، أحدث العلامات الحيوية (A)، ومتابعة نتيجة المزرعة المعلقة (R)",
                "en": "Use SBAR: state ID & current status (S), severe penicillin allergy & fall precautions (B), latest vital sign trends (A), and pending culture follow-up (R)"
              },
              "nextNodeId": "educatorMona_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تسليم SBAR متكامل واحترافي! كل المعلومات الحرجة وصلت بوضوح للشفت القادم.",
                "en": "Comprehensive, professional SBAR handover! Every critical safety detail has been clearly transferred."
              },
              "rationale": {
                "ar": "تهانينا! لقد أتممت جميع السيناريوهات العشرة في أكاديمية التمريض 3D بنجاح وأثبتّ كفاءة عالية في التواصل السريري وسلامة المرضى.",
                "en": "Congratulations! You have completed all 10 scenarios in Nurse Academy 3D, demonstrating excellence in clinical communication and patient safety."
              }
            },
            {
              "id": "preceptorKareem_start_c2",
              "label": {
                "ar": "أقول باختصار: \"المريضة مستقرة وكل شيء في الملف\" وأغادر بسرعة",
                "en": "Just say: \"She is fine, everything is in the chart\" and leave quickly"
              },
              "nextNodeId": "preceptorKareem_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "تسليم غير آمن! إغفال ذكر الحساسية الشديدة والمزارع المعلقة يعرض المريضة لأخطاء في الشفت التالي.",
                "en": "Unsafe handover! Omitting severe allergies and pending cultures sets up the incoming shift for errors."
              },
              "rationale": {
                "ar": "تهانينا! لقد أتممت جميع السيناريوهات العشرة في أكاديمية التمريض 3D بنجاح وأثبتّ كفاءة عالية في التواصل السريري وسلامة المرضى.",
                "en": "Congratulations! You have completed all 10 scenarios in Nurse Academy 3D, demonstrating excellence in clinical communication and patient safety."
              }
            }
          ]
        },
        "educatorMona_start": {
          "id": "educatorMona_start",
          "speaker": "educatorMona",
          "targetNpc": "educatorMona",
          "objectiveHint": {
            "ar": "افحص منصة تسليم الشفت (SBAR)، ثم أتمم التسليم مع المشرف كريم وأ. منى.",
            "en": "Inspect the SBAR Handover Podium, then complete the structured handover with Preceptor Kareem and Educator Mona."
          },
          "dialogue": {
            "ar": "ختاماً، ما الخطوة الأخيرة التي تضمن أن الممرض المستلم قد فهم المعلومات الحرجة دون لبس؟",
            "en": "Finally, what closing step ensures the receiving nurse understood all critical handover actions without ambiguity?"
          },
          "choices": [
            {
              "id": "educatorMona_start_c1",
              "label": {
                "ar": "تطبيق التواصل ثنائي الاتجاه (Closed-Loop / Read-Back) وإتاحة الفرصة لطرح الأسئلة بجانب السرير ومراجعة السجل معاً",
                "en": "Use closed-loop communication (read-back of critical action items) and invite questions while viewing the chart together"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "إجابة ختامية رائعة! مبروك تخرجك من السيناريوهات العشرة لأكاديمية التمريض 3D.",
                "en": "Outstanding final answer! Congratulations on completing all 10 scenarios of Nurse Academy 3D."
              },
              "rationale": {
                "ar": "تهانينا! لقد أتممت جميع السيناريوهات العشرة في أكاديمية التمريض 3D بنجاح وأثبتّ كفاءة عالية في التواصل السريري وسلامة المرضى.",
                "en": "Congratulations! You have completed all 10 scenarios in Nurse Academy 3D, demonstrating excellence in clinical communication and patient safety."
              }
            },
            {
              "id": "educatorMona_start_c2",
              "label": {
                "ar": "إرسال رسالة نصية غير رسمية بدون مراجعة مشتركة",
                "en": "Send an informal text message without reviewing the chart together"
              },
              "nextNodeId": "educatorMona_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "التسليم الآمن يتطلب تواصلاً مباشراً وتأكيد الفهم المشترك للمهام الحرجة.",
                "en": "Safe handover requires interactive communication and confirmation of critical tasks."
              },
              "rationale": {
                "ar": "تهانينا! لقد أتممت جميع السيناريوهات العشرة في أكاديمية التمريض 3D بنجاح وأثبتّ كفاءة عالية في التواصل السريري وسلامة المرضى.",
                "en": "Congratulations! You have completed all 10 scenarios in Nurse Academy 3D, demonstrating excellence in clinical communication and patient safety."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص منصة تسليم الشفت (SBAR)، ثم أتمم التسليم مع المشرف كريم وأ. منى.",
        "en": "Inspect the SBAR Handover Podium, then complete the structured handover with Preceptor Kareem and Educator Mona."
      },
      "educationalTakeaway": {
        "ar": "تهانينا! لقد أتممت جميع السيناريوهات العشرة في أكاديمية التمريض 3D بنجاح وأثبتّ كفاءة عالية في التواصل السريري وسلامة المرضى.",
        "en": "Congratulations! You have completed all 10 scenarios in Nurse Academy 3D, demonstrating excellence in clinical communication and patient safety."
      },
      "escalationGuidance": {
        "ar": "التزم دائماً ببروتوكولات سلامة المرضى، التحقق المزدوج، وإبلاغ الطبيب المختص أو فريق الاستجابة السريعة فوراً عند رصد أي علامات إنذار.",
        "en": "Always uphold patient safety protocols, independent double-checks, and immediate escalation to the attending physician when red flags arise."
      },
      "sources": [
        {
          "title": "WHO Patient Safety & Antimicrobial Stewardship Curriculum",
          "publisher": "World Health Organization (WHO)",
          "url": "https://www.who.int/health-topics/patient-safety"
        },
        {
          "title": "Core Elements of Hospital Antibiotic Stewardship Programs",
          "publisher": "CDC",
          "url": "https://www.cdc.gov/antibiotic-use/core-elements/hospital.html"
        }
      ]
    }
  ]
};
