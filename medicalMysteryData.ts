import { Cartoon3DGameConfig } from './Cartoon3DGameShell';

export const MEDICAL_MYSTERY_CONFIG: Cartoon3DGameConfig = {
  "gameId": "medicalMystery",
  "route": "/medical-mystery",
  "worldPreset": "medical_mystery",
  "gameIcon": "🕵️‍♂️",
  "gameTitle": {
    "ar": "الألغاز الطبية 3D: محقق سلامة المرضى ومكافحة العدوى",
    "en": "Medical Mystery 3D: Clinical Safety & Stewardship Detective"
  },
  "fictionalNoticeBadge": {
    "ar": "قضايا تحقيق سريرية خيالية • للتعلم وتحليل الأسباب الجذرية فقط",
    "en": "Fictional Clinical Detective Cases • Root-Cause Education Only"
  },
  "loadingTitle": {
    "ar": "جارٍ تجهيز مركز التحقيقات والألغاز الطبية 3D (WebGL)...",
    "en": "Initializing Medical Mystery 3D Investigation Center..."
  },
  "loadingSubtitle": {
    "ar": "يتم بناء لوحة الأدلة الجنائية، محطات تتبع العينات، وسجل القرائن المتسلسلة.",
    "en": "Building 3D forensic evidence board, specimen audit terminals, and chained clues."
  },
  "controlsHintTitle": {
    "ar": "طريقة التحقيق في الألغاز الطبية 3D:",
    "en": "How to Investigate in Medical Mystery 3D:"
  },
  "controlsHintBody": {
    "ar": "افحص محطات القرائن بالتسلسل (حيث تفتح القرينة الأولى قفل القرينة الثانية)، راجع «سجل الأدلة 📓»، ثم استجوب الشهود وقدّم استنتاجك النهائي.",
    "en": "Inspect the 3D clue stations in sequence (Clue 1 unlocks Clue 2), review your Evidence Journal (📓), and question the team to solve the case."
  },
  "showInventoryBar": true,
  "enableEvidenceJournal": true,
  "npcs": {
    "investigatorNour": {
      "id": "investigatorNour",
      "name": {
        "ar": "د. نور (كبيرة محققي سلامة المرضى)",
        "en": "Dr. Nour (Lead Patient Safety Investigator)"
      },
      "title": {
        "ar": "رئيسة لجنة التحقيق السريري والجودة",
        "en": "Clinical Risk & Root-Cause Analysis Lead"
      },
      "stationLabel": {
        "ar": "منصة قيادة التحقيق ولوحة الأدلة",
        "en": "Investigation Command & Evidence Board"
      },
      "position": [
        -6.2,
        0,
        -3.2
      ],
      "rotationY": 0.4,
      "outfitColor": 7153881,
      "accentColor": 12616956,
      "skinColor": 16041893,
      "hatType": "doctor_hair",
      "avatarEmoji": "🕵️‍♀️",
      "defaultGreeting": {
        "ar": "أهلاً بك في فريق التحقيق السريري! اجمع القرائن المتسلسلة في الغرفة ثلاثية الأبعاد قبل تقديم الاستنتاج النهائي للقضية.",
        "en": "Welcome to the Clinical Safety Investigation Team! Follow the 3D clue chain before presenting your root-cause conclusion."
      }
    },
    "nurseSalma": {
      "id": "nurseSalma",
      "name": {
        "ar": "م. سلمى (منسقة تمريض الجناح)",
        "en": "Nurse Salma (Ward Nursing Coordinator)"
      },
      "title": {
        "ar": "مسؤولة سجلات الجناح والتسليم السريري",
        "en": "Ward Operations & Handover Coordinator"
      },
      "stationLabel": {
        "ar": "مكتب تنسيق تمريض الجناح والتسليم",
        "en": "Ward Nursing & Handover Desk"
      },
      "position": [
        6.2,
        0,
        -3.2
      ],
      "rotationY": -0.4,
      "outfitColor": 165063,
      "accentColor": 3718648,
      "skinColor": 15843997,
      "hatType": "nurse_cap",
      "avatarEmoji": "👩‍⚕️",
      "defaultGreeting": {
        "ar": "مرحباً! سجلات التسليم السريري ومكافحة العدوى تساعدنا على كشف الثغرات النظامية ومنع تكرارها.",
        "en": "Hello! Shift handover logs and IPC records help us uncover systemic gaps and prevent recurrence."
      }
    },
    "labOmar": {
      "id": "labOmar",
      "name": {
        "ar": "أ. عمر (أخصائي الأحياء الدقيقة بالمختبر)",
        "en": "Omar (Clinical Microbiology Specialist)"
      },
      "title": {
        "ar": "مسؤول تتبع العينات والمزارع البكتيرية",
        "en": "Specimen Chain-of-Custody & Culture Lead"
      },
      "stationLabel": {
        "ar": "وحدة أرشيف المختبر وتتبع العينات",
        "en": "Microbiology Archive & Specimen Trace"
      },
      "position": [
        -5.8,
        0,
        3.4
      ],
      "rotationY": 1.25,
      "outfitColor": 889992,
      "accentColor": 3003583,
      "skinColor": 14855040,
      "hatType": "lab_goggles",
      "avatarEmoji": "🧑‍🔬",
      "defaultGreeting": {
        "ar": "أهلاً بك! تتبع سلسلة حيازة العينات وتقارير الحساسية الدوائية (AST) يكشف جذور الأخطاء التشخيصية.",
        "en": "Welcome! Auditing specimen chain-of-custody and AST reports reveals the root cause of diagnostic discrepancies."
      }
    },
    "pharmacistYasser": {
      "id": "pharmacistYasser",
      "name": {
        "ar": "د. ياسر (صيدلي حوكمة المضادات الحيوية)",
        "en": "Dr. Yasser (Antimicrobial Stewardship Pharmacist)"
      },
      "title": {
        "ar": "مراجع سجلات الأدوية والحساسية الدوائية",
        "en": "MAR Audit & Allergy Safety Specialist"
      },
      "stationLabel": {
        "ar": "وحدة تدقيق سجلات الأدوية (MAR) والحساسية",
        "en": "MAR Audit & Stewardship Pharmacy Hub"
      },
      "position": [
        5.8,
        0,
        3.4
      ],
      "rotationY": -1.25,
      "outfitColor": 16777215,
      "accentColor": 9133302,
      "skinColor": 15119498,
      "hatType": "pharmacist_glasses",
      "avatarEmoji": "💊",
      "defaultGreeting": {
        "ar": "مرحباً! مراجعة سجل إعطاء الأدوية (MAR) وتنبيهات الحساسية المتصالبة تحمي المرضى من الأحداث الدوائية الضارة.",
        "en": "Hello! Auditing Medication Administration Records (MAR) and allergy alerts protects patients from adverse drug events."
      }
    }
  },
  "missions": [
    {
      "id": "mm-case-1-mislabelled-sample",
      "missionIndex": 1,
      "requiredMissionId": null,
      "unlockRequirementText": {
        "ar": "متاح للبدء مباشرة (المرحلة الأولى)",
        "en": "Unlocked by default (Stage 1)"
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 1: لغز العينة ذات الملصق الخاطئ (The Mislabelled Sample)",
        "en": "Case 1: The Mislabelled Sample"
      },
      "subtitle": {
        "ar": "كيف ظهرت نتيجة مزرعة إيجابية لمريض يتعافى تماماً ويستعد للخروج؟ (قضية خيالية تعليمية)",
        "en": "Why did a thriving patient ready for discharge suddenly receive a positive culture alert? (Fictional case)"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #1",
        "en": "Clinical Mystery Case #1"
      },
      "badgeIcon": "🔍",
      "badgeTitle": {
        "ar": "🔍 محقق القضية 1: كاشف تبديل العينات",
        "en": "🔍 Case 1 Solved: Specimen Swap Detective"
      },
      "primaryNpc": "labOmar",
      "briefing": {
        "ar": "وصل تنبيه من المختبر يفيد بنمو بكتيري في عينة المريض (أ) بالغرفة 204، رغم أنه لا يعاني من أي أعراض عدوى! في المقابل، المريض (ب) بالغرفة 205 يعاني من حمى مستمرة ولكن نتيجته عادت سلبية. اجمع القرائن المتسلسلة واكشف الحقيقة.",
        "en": "The lab reported bacterial growth for Patient A in Room 204 who has zero symptoms of infection, while febrile Patient B in Room 205 had a negative sample. Follow the clue chain and uncover what happened."
      },
      "initialNodeId": "labOmar_start",
      "requirePropsSolvedBeforeNodeId": "labOmar_start",
      "interactiveProps": [
        {
          "id": "c1-clue-cooler",
          "name": {
            "ar": "فحص طوابع الوقت على أنابيب الغرفتين 204 و205",
            "en": "Timestamp Audit on Tubes 204 & 205"
          },
          "stationLabel": {
            "ar": "قرينة 1: حافظة نقل العينات",
            "en": "Clue 1: Specimen Transport Cooler"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 561586,
          "accentColor": 2282478,
          "iconEmoji": "🧪",
          "shape": "specimen_cooler",
          "rewardItem": {
            "id": "item-c1-cooler-log",
            "icon": "🧪",
            "label": {
              "ar": "قرينة 1: سجل استلام العينات 08:14",
              "en": "Clue 1: 08:14 Specimen Log"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-01 • CLUE A",
            "clueTitle": {
              "ar": "فحص طوابع الوقت على أنابيب الغرفتين 204 و205",
              "en": "Timestamp Audit on Tubes 204 & 205"
            },
            "sourceLocation": {
              "ar": "وحدة استلام العينات",
              "en": "Specimen Receiving Bay"
            },
            "timestampLabel": {
              "ar": "سجل الحافظة المبردة",
              "en": "Transport Cooler Log"
            },
            "evidenceSummary": {
              "ar": "تم سحب عينتين متتاليتين من الغرفتين 204 و205 في جولة واحدة دون وضع الملصق داخل الغرفة.",
              "en": "Two consecutive specimens from Rooms 204 and 205 were carried out unlabeled during a single round."
            },
            "deductionNote": {
              "ar": "افحص الآن لوحة تدقيق طابعة الباركود لمعرفة متى وأين طُبعت الملصقات!",
              "en": "Now inspect the Barcode Printer Audit Board to see when and where the labels were printed!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c1-clue-cooler-step-1",
              "prompt": {
                "ar": "تظهر الأنبوبتان أنهما سُلمتا للمختبر في الدقيقة نفسها (08:14 صباحاً)، لكن خط اليد لموقع السحب على الأنبوبة 204 شُطب وعُدّل في الممر!",
                "en": "Both tubes arrived together at 08:14 AM, and the handwritten collection note on Tube 204 shows anink cross-out made outside the room."
              },
              "hint": {
                "ar": "افحص الآن لوحة تدقيق طابعة الباركود لمعرفة متى وأين طُبعت الملصقات!",
                "en": "Now inspect the Barcode Printer Audit Board to see when and where the labels were printed!"
              },
              "options": [
                {
                  "id": "c1-clue-cooler-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تم سحب عينتين متتاليتين من الغرفتين 204 و205 في جولة واحدة دون وضع الملصق داخل الغرفة.",
                    "en": "Two consecutive specimens from Rooms 204 and 205 were carried out unlabeled during a single round."
                  }
                },
                {
                  "id": "c1-clue-cooler-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "تم سحب عينتين متتاليتين من الغرفتين 204 و205 في جولة واحدة دون وضع الملصق داخل الغرفة.",
            "en": "Two consecutive specimens from Rooms 204 and 205 were carried out unlabeled during a single round."
          }
        },
        {
          "id": "c1-clue-board",
          "name": {
            "ar": "سجل الطباعة المجمّعة في محطة التمريض",
            "en": "Batch-Printing Log at Nurses Station"
          },
          "stationLabel": {
            "ar": "قرينة 2: سجل طابعة الباركود المركزية",
            "en": "Clue 2: Central Barcode Printer Log"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 8141549,
          "accentColor": 12616956,
          "iconEmoji": "🏷️",
          "shape": "evidence_board",
          "requiresPropId": "c1-clue-cooler",
          "rewardItem": {
            "id": "item-c1-printer-audit",
            "icon": "🏷️",
            "label": {
              "ar": "قرينة 2: إثبات الطباعة المسبقة المجمعة",
              "en": "Clue 2: Batch-Print Audit Trail"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-01 • CLUE B",
            "clueTitle": {
              "ar": "سجل الطباعة المجمّعة في محطة التمريض",
              "en": "Batch-Printing Log at Nurses Station"
            },
            "sourceLocation": {
              "ar": "محطة التمريض المركزية",
              "en": "Central Nurses Station"
            },
            "timestampLabel": {
              "ar": "ذاكرة طابعة الملصقات",
              "en": "Label Printer Memory Log"
            },
            "evidenceSummary": {
              "ar": "طُبع ملصقا المريضين دفعة واحدة قبل السحب، ما أدى إلى لصق ملصق الغرفة 204 على أنبوبة الغرفة 205 بالخطأ.",
              "en": "Both patient labels were batch-printed beforehand, causing Room 204’s label to be placed on Room 205’s tube."
            },
            "deductionNote": {
              "ar": "تحدث مع أ. عمر في المختبر ثم اجمع الخيوط مع د. نور لحل القضية.",
              "en": "Speak with Omar in the lab, then present the final reveal to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c1-clue-board-step-1",
              "prompt": {
                "ar": "أثبت السجل الإلكتروني أن ملصقي الغرفتين 204 و205 طُبعا معاً على الطابعة المركزية الساعة 07:55 صباحاً قبل دخول الغرفتين، ثم أُلصقا بالعكس على العربة في الممر!",
                "en": "The printer log proves labels for Room 204 and Room 205 were batch-printed together at the central desk at 07:55 AM prior to collection and applied in reverse on the hallway cart!"
              },
              "hint": {
                "ar": "تحدث مع أ. عمر في المختبر ثم اجمع الخيوط مع د. نور لحل القضية.",
                "en": "Speak with Omar in the lab, then present the final reveal to Dr. Nour."
              },
              "options": [
                {
                  "id": "c1-clue-board-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "طُبع ملصقا المريضين دفعة واحدة قبل السحب، ما أدى إلى لصق ملصق الغرفة 204 على أنبوبة الغرفة 205 بالخطأ.",
                    "en": "Both patient labels were batch-printed beforehand, causing Room 204’s label to be placed on Room 205’s tube."
                  }
                },
                {
                  "id": "c1-clue-board-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "طُبع ملصقا المريضين دفعة واحدة قبل السحب، ما أدى إلى لصق ملصق الغرفة 204 على أنبوبة الغرفة 205 بالخطأ.",
            "en": "Both patient labels were batch-printed beforehand, causing Room 204’s label to be placed on Room 205’s tube."
          }
        }
      ],
      "nodes": {
        "labOmar_start": {
          "id": "labOmar_start",
          "speaker": "labOmar",
          "targetNpc": "labOmar",
          "objectiveHint": {
            "ar": "افحص مبرد العينات (القرينة 1) لفتح لوحة تدقيق الباركود (القرينة 2)، ثم استجوب أ. عمر وقدم استنتاجك لد. نور.",
            "en": "Inspect the Specimen Cooler (Clue 1) to unlock the Barcode Audit Board (Clue 2), then question Omar and present your reveal to Dr. Nour."
          },
          "dialogue": {
            "ar": "بناءً على القرائن التي جمعتها، ما الإجراء الفوري الذي يجب أن نتخذه في المختبر والجناح بشأن هاتين العينتين؟",
            "en": "Based on the clues you gathered, what immediate action must we take regarding these two swapped samples?"
          },
          "choices": [
            {
              "id": "labOmar_start_c1",
              "label": {
                "ar": "إلغاء النتيجتين رسمياً بسبب خطأ التسمية (Mislabelled Specimen)، إبلاغ الفريق الطبي لعدم إعطاء مضاد للمريض السليم، وإعادة السحب بترميز فوري بجانب كل سرير",
                "en": "Invalidate both results due to specimen mislabeling, alert the medical team not to treat the asymptomatic patient, and redraw with immediate bedside labeling"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "قرار مخبري وسريري سليم تماماً! لا يجوز أبداً تبديل الأسماء يدوياً على عينات مشكوك فيها دون إعادة سحب موثقة.",
                "en": "Spot-on laboratory and safety decision! Never manually relabel swapped tubes—always redraw with verified bedside ID."
              },
              "rationale": {
                "ar": "تحقيق بارع! طباعة ملصقات لمريضين معاً وأخذ أنابيب غير معنونة إلى الممر أدى إلى تبديل الملصقين. القاعدة الذهبية: الترميز يتم بجانب السرير فوراً ولكل مريض على حدة.",
                "en": "Brilliant deduction! Batch-printing labels for two patients at the desk caused the tubes to be swapped in the hallway. Always label at the bedside one patient at a time."
              }
            },
            {
              "id": "labOmar_start_c2",
              "label": {
                "ar": "نعكس الاسمين بالقلم في التقرير دون إعادة سحب العينات",
                "en": "Just swap the two patient names by hand on the report without redrawing"
              },
              "nextNodeId": "labOmar_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "ممنوع: عند ثبوت اختلاط أنابيب غير معنونة، يجب رفض العينتين وإعادة السحب رسمياً لضمان سلامة المريضين.",
                "en": "Prohibited: Once specimen chain-of-custody is broken, samples must be rejected and safely recollected."
              },
              "rationale": {
                "ar": "تحقيق بارع! طباعة ملصقات لمريضين معاً وأخذ أنابيب غير معنونة إلى الممر أدى إلى تبديل الملصقين. القاعدة الذهبية: الترميز يتم بجانب السرير فوراً ولكل مريض على حدة.",
                "en": "Brilliant deduction! Batch-printing labels for two patients at the desk caused the tubes to be swapped in the hallway. Always label at the bedside one patient at a time."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص مبرد العينات (القرينة 1) لفتح لوحة تدقيق الباركود (القرينة 2)، ثم استجوب أ. عمر وقدم استنتاجك لد. نور.",
            "en": "Inspect the Specimen Cooler (Clue 1) to unlock the Barcode Audit Board (Clue 2), then question Omar and present your reveal to Dr. Nour."
          },
          "dialogue": {
            "ar": "حان وقت كشف الحقيقة في القضية الأولى: ما السبب الجذري (Root Cause) الذي أدى إلى ظهور مزرعة إيجابية للمريض غير المصاب في الغرفة 204؟",
            "en": "Time for the Case 1 Final Reveal: What was the root cause behind the positive culture appearing on asymptomatic Patient A in Room 204?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "الطباعة المسبقة لملصقي مريضين معاً وأخذ أنابيب غير معنونة إلى الممر أدى إلى تبديل الملصقين بين الغرفتين 204 و205",
                "en": "Batch-printing labels for two patients at the central desk and carrying unlabeled tubes into the hallway caused the labels for Rooms 204 and 205 to be swapped"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "استنتاج دقيق 100%! أغلقت القضية الأولى بنجاح وحميت المريض السليم من مضاد حيوي غير ضروري.",
                "en": "100% accurate reveal! You closed Case 1 and protected an uninfected patient from unnecessary antibiotic exposure."
              },
              "rationale": {
                "ar": "تحقيق بارع! طباعة ملصقات لمريضين معاً وأخذ أنابيب غير معنونة إلى الممر أدى إلى تبديل الملصقين. القاعدة الذهبية: الترميز يتم بجانب السرير فوراً ولكل مريض على حدة.",
                "en": "Brilliant deduction! Batch-printing labels for two patients at the desk caused the tubes to be swapped in the hallway. Always label at the bedside one patient at a time."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "تلوث الهواء داخل جهاز الحضانة في المختبر",
                "en": "Airborne contamination inside the laboratory incubator"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة (📓): القرائن تثبت طباعة الملصقين معاً الساعة 07:55 وتبديلهما في الممر.",
                "en": "Check your Evidence Journal (📓): The clues prove batch-printing at 07:55 AM and hallway swapping."
              },
              "rationale": {
                "ar": "تحقيق بارع! طباعة ملصقات لمريضين معاً وأخذ أنابيب غير معنونة إلى الممر أدى إلى تبديل الملصقين. القاعدة الذهبية: الترميز يتم بجانب السرير فوراً ولكل مريض على حدة.",
                "en": "Brilliant deduction! Batch-printing labels for two patients at the desk caused the tubes to be swapped in the hallway. Always label at the bedside one patient at a time."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص مبرد العينات (القرينة 1) لفتح لوحة تدقيق الباركود (القرينة 2)، ثم استجوب أ. عمر وقدم استنتاجك لد. نور.",
        "en": "Inspect the Specimen Cooler (Clue 1) to unlock the Barcode Audit Board (Clue 2), then question Omar and present your reveal to Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "تحقيق بارع! طباعة ملصقات لمريضين معاً وأخذ أنابيب غير معنونة إلى الممر أدى إلى تبديل الملصقين. القاعدة الذهبية: الترميز يتم بجانب السرير فوراً ولكل مريض على حدة.",
        "en": "Brilliant deduction! Batch-printing labels for two patients at the desk caused the tubes to be swapped in the hallway. Always label at the bedside one patient at a time."
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
      "id": "mm-case-2-allergy-alert",
      "missionIndex": 2,
      "requiredMissionId": "mm-case-1-mislabelled-sample",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 1: لغز العينة ذات الملصق الخاطئ (The Mislabelled Sample)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 1: The Mislabelled Sample\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 2: لغز تنبيه الحساسية المفقود (The Allergy Alert)",
        "en": "Case 2: The Allergy Alert"
      },
      "subtitle": {
        "ar": "كيف كاد طلب مضاد حيوي أن يمر لمريض لديه حساسية مفرطة موثقة في ملف الطوارئ الورقي؟",
        "en": "How did a beta-lactam order nearly reach a patient with documented severe allergy on their paper triage sheet?"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #2",
        "en": "Clinical Mystery Case #2"
      },
      "badgeIcon": "🛡️",
      "badgeTitle": {
        "ar": "🛡️ محقق القضية 2: صائد فجوات الحساسية",
        "en": "🛡️ Case 2 Solved: Allergy Reconciliation Detective"
      },
      "primaryNpc": "pharmacistYasser",
      "briefing": {
        "ar": "أثناء المراجعة الصباحية، أوقفت الصيدلية في اللحظة الأخيرة طلب مضاد حيوي لمريض لديه تاريخ حساسية شديدة، رغم أن شاشة الجناح كانت تُظهر \"لا توجد حساسية معروفة (NKDA)\". تتبع سلسلة القرائن لمعرفة أين اختفى التنبيه!",
        "en": "During morning rounds, pharmacy intercepted a beta-lactam order for a patient with severe prior allergy, even though the ward screen displayed \"No Known Drug Allergies (NKDA)\". Trace the clue chain to find where the alert vanished!"
      },
      "initialNodeId": "pharmacistYasser_start",
      "requirePropsSolvedBeforeNodeId": "pharmacistYasser_start",
      "interactiveProps": [
        {
          "id": "c2-clue-intake",
          "name": {
            "ar": "مقارنة استمارة الفرز الورقية بالسجل الإلكتروني",
            "en": "Paper Triage Sheet vs. Electronic Chart"
          },
          "stationLabel": {
            "ar": "قرينة 1: استمارة فرز الطوارئ الورقية",
            "en": "Clue 1: Paper ED Triage Intake Sheet"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 14427686,
          "accentColor": 16281969,
          "iconEmoji": "🔴",
          "shape": "nursing_id_scanner",
          "rewardItem": {
            "id": "item-c2-triage-sheet",
            "icon": "🔴",
            "label": {
              "ar": "قرينة 1: وثيقة حساسية الطوارئ والسوار الأحمر",
              "en": "Clue 1: ED Allergy Sheet & Red Band"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-02 • CLUE A",
            "clueTitle": {
              "ar": "مقارنة استمارة الفرز الورقية بالسجل الإلكتروني",
              "en": "Paper Triage Sheet vs. Electronic Chart"
            },
            "sourceLocation": {
              "ar": "مكتب استقبال الجناح",
              "en": "Ward Admission Desk"
            },
            "timestampLabel": {
              "ar": "استمارة استقبال الطوارئ",
              "en": "ED Triage Intake Form"
            },
            "evidenceSummary": {
              "ar": "تم توثيق الحساسية الشديدة على الورق وفي السوار الأحمر، لكنها لم تظهر في شاشة طلبات الجناح.",
              "en": "Severe allergy was documented on paper and on the red wristband, but was missing from the electronic ward screen."
            },
            "deductionNote": {
              "ar": "افحص الآن طرفية تدقيق سجل الأدوية (MAR) لمعرفة كيف سُجل الحقل إلكترونياً!",
              "en": "Now inspect the MAR Audit Terminal to see how the electronic allergy field was entered!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c2-clue-intake-step-1",
              "prompt": {
                "ar": "تظهر استمارة الطوارئ الورقية المرفقة بالملف بخط واضح: \"حساسية مفرطة (تورم بالحلق) من البنسلين\"، كما أن المريض يرتدي سوار معصم أحمر!",
                "en": "The scanned paper ED triage sheet clearly notes: \"Severe penicillin allergy (throat swelling)\", and the patient is wearing a red allergy wristband!"
              },
              "hint": {
                "ar": "افحص الآن طرفية تدقيق سجل الأدوية (MAR) لمعرفة كيف سُجل الحقل إلكترونياً!",
                "en": "Now inspect the MAR Audit Terminal to see how the electronic allergy field was entered!"
              },
              "options": [
                {
                  "id": "c2-clue-intake-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تم توثيق الحساسية الشديدة على الورق وفي السوار الأحمر، لكنها لم تظهر في شاشة طلبات الجناح.",
                    "en": "Severe allergy was documented on paper and on the red wristband, but was missing from the electronic ward screen."
                  }
                },
                {
                  "id": "c2-clue-intake-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "تم توثيق الحساسية الشديدة على الورق وفي السوار الأحمر، لكنها لم تظهر في شاشة طلبات الجناح.",
            "en": "Severe allergy was documented on paper and on the red wristband, but was missing from the electronic ward screen."
          }
        },
        {
          "id": "c2-clue-mar-terminal",
          "name": {
            "ar": "سجل التعديل الإلكتروني عند النقل السريع",
            "en": "Electronic Admission Reconciliation Log"
          },
          "stationLabel": {
            "ar": "قرينة 2: طرفية تدقيق سجل الأدوية (MAR)",
            "en": "Clue 2: MAR Electronic Audit Terminal"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 8141549,
          "accentColor": 12616956,
          "iconEmoji": "💻",
          "shape": "mar_audit_terminal",
          "requiresPropId": "c2-clue-intake",
          "rewardItem": {
            "id": "item-c2-mar-log",
            "icon": "💻",
            "label": {
              "ar": "قرينة 2: سجل تخطي حقل الحساسية الإلكتروني",
              "en": "Clue 2: Electronic NKDA Bypass Log"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-02 • CLUE B",
            "clueTitle": {
              "ar": "سجل التعديل الإلكتروني عند النقل السريع",
              "en": "Electronic Admission Reconciliation Log"
            },
            "sourceLocation": {
              "ar": "طرفية السجل الإلكتروني MAR",
              "en": "Electronic MAR Terminal"
            },
            "timestampLabel": {
              "ar": "سجل تدقيق النظام (Audit Log)",
              "en": "System Audit Trail"
            },
            "evidenceSummary": {
              "ar": "اختيار \"بدون حساسية\" مؤقتاً لتسريع تسكين السرير أوقف عمل نظام التنبيه الآلي للصيدلية.",
              "en": "Selecting a temporary \"NKDA\" placeholder to speed up bed assignment disabled automated allergy cross-checking."
            },
            "deductionNote": {
              "ar": "تحدث مع د. ياسر الصيدلي ثم قدم التقرير النهائي لد. نور.",
              "en": "Consult Pharmacist Dr. Yasser, then present your findings to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c2-clue-mar-terminal-step-1",
              "prompt": {
                "ar": "يكشف السجل أن مدخل البيانات ضغط زر \"تخطي سريع / بدون حساسية معروفة\" لفتح شاشة الغرفة بسرعة أثناء زحام المساء، ولم يتم تحديث الحقل بعدها!",
                "en": "The audit log reveals that during a busy evening transfer, the temporary \"NKDA / Bypass\" checkbox was clicked to assign a bed quickly and never updated!"
              },
              "hint": {
                "ar": "تحدث مع د. ياسر الصيدلي ثم قدم التقرير النهائي لد. نور.",
                "en": "Consult Pharmacist Dr. Yasser, then present your findings to Dr. Nour."
              },
              "options": [
                {
                  "id": "c2-clue-mar-terminal-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "اختيار \"بدون حساسية\" مؤقتاً لتسريع تسكين السرير أوقف عمل نظام التنبيه الآلي للصيدلية.",
                    "en": "Selecting a temporary \"NKDA\" placeholder to speed up bed assignment disabled automated allergy cross-checking."
                  }
                },
                {
                  "id": "c2-clue-mar-terminal-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "اختيار \"بدون حساسية\" مؤقتاً لتسريع تسكين السرير أوقف عمل نظام التنبيه الآلي للصيدلية.",
            "en": "Selecting a temporary \"NKDA\" placeholder to speed up bed assignment disabled automated allergy cross-checking."
          }
        }
      ],
      "nodes": {
        "pharmacistYasser_start": {
          "id": "pharmacistYasser_start",
          "speaker": "pharmacistYasser",
          "targetNpc": "pharmacistYasser",
          "objectiveHint": {
            "ar": "افحص محطة مطابقة الهوية والحساسية (القرينة 1) لفتح طرفية سجل الأدوية MAR (القرينة 2)، ثم تحدث مع د. ياسر ود. نور.",
            "en": "Inspect the Triage Intake Scanner (Clue 1) to unlock the MAR Audit Terminal (Clue 2), then speak with Dr. Yasser and Dr. Nour."
          },
          "dialogue": {
            "ar": "لقد اكتشفتَ الفجوة! كيف نمنع تكرار تجاوز تنبيه الحساسية عند نقل المرضى من الطوارئ إلى الأجنحة؟",
            "en": "You found the gap! How should we prevent allergy alerts from being bypassed during ED-to-ward transfers?"
          },
          "choices": [
            {
              "id": "pharmacistYasser_start_c1",
              "label": {
                "ar": "إلغاء خيار \"بدون حساسية افتراضي\"، وجعل مطابقة الحساسية (مع المريض والسوار والملف الورقي) خطوة إلزامية قبل تفعيل أي طلب دواء",
                "en": "Remove the default NKDA bypass and require active allergy reconciliation (checking patient, wristband, and triage records) before any medication order can be verified"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "حل منهجي ممتاز! جعل حقل الحساسية إلزامياً للتدقيق قبل الصرف يحمي جميع المرضى.",
                "en": "Excellent systemic fix! Requiring verified allergy status before order activation protects every patient."
              },
              "rationale": {
                "ar": "كشف ممتاز! ترك حقل الحساسية على الإعداد الافتراضي أثناء التحويل من الطوارئ وعدم مطابقة السوار الأحمر بجانب السرير كاد يسبب كارثة. التوفيق الدوائي ومراجعة الحساسية إلزاميان عند كل نقل.",
                "en": "Excellent investigation! Leaving the electronic allergy field on its default setting during transfer without reconciling the triage sheet caused the gap."
              }
            },
            {
              "id": "pharmacistYasser_start_c2",
              "label": {
                "ar": "نكتفي بالاعتماد على ذاكرة الممرض المناوب دون تعديل النظام الإلكتروني",
                "en": "Rely solely on staff memory without updating the electronic record"
              },
              "nextNodeId": "pharmacistYasser_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "الاعتماد على الذاكرة الفردية دون تصحيح السجل الإلكتروني يترك الخطر قائماً في النوبات التالية.",
                "en": "Relying on memory while leaving \"NKDA\" in the electronic record keeps the hazard active for future shifts."
              },
              "rationale": {
                "ar": "كشف ممتاز! ترك حقل الحساسية على الإعداد الافتراضي أثناء التحويل من الطوارئ وعدم مطابقة السوار الأحمر بجانب السرير كاد يسبب كارثة. التوفيق الدوائي ومراجعة الحساسية إلزاميان عند كل نقل.",
                "en": "Excellent investigation! Leaving the electronic allergy field on its default setting during transfer without reconciling the triage sheet caused the gap."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص محطة مطابقة الهوية والحساسية (القرينة 1) لفتح طرفية سجل الأدوية MAR (القرينة 2)، ثم تحدث مع د. ياسر ود. نور.",
            "en": "Inspect the Triage Intake Scanner (Clue 1) to unlock the MAR Audit Terminal (Clue 2), then speak with Dr. Yasser and Dr. Nour."
          },
          "dialogue": {
            "ar": "ما خلاصة تحقيقك في القضية الثانية حول سبب عدم ظهور تنبيه الحساسية التلقائي عند إدخال الطلب؟",
            "en": "What is your final reveal for Case 2 regarding why the automated allergy alert failed to trigger?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "تُرك حقل الحساسية الإلكتروني على خيار تخطٍ مؤقت (NKDA) أثناء تسكين السرير السريع رغم توثيق الحساسية الشديدة في استمارة الطوارئ والسوار الأحمر",
                "en": "The electronic allergy field was left on a temporary \"NKDA\" bypass during rapid bed assignment despite severe allergy documentation on the paper ED sheet and red wristband"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تحقيق متقن! تم تحديث السجل وإصلاح النظام لمنع التخطي المؤقت لحقول الحساسية.",
                "en": "Spot-on investigation! The record is updated and the bypass loophole has been closed."
              },
              "rationale": {
                "ar": "كشف ممتاز! ترك حقل الحساسية على الإعداد الافتراضي أثناء التحويل من الطوارئ وعدم مطابقة السوار الأحمر بجانب السرير كاد يسبب كارثة. التوفيق الدوائي ومراجعة الحساسية إلزاميان عند كل نقل.",
                "en": "Excellent investigation! Leaving the electronic allergy field on its default setting during transfer without reconciling the triage sheet caused the gap."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "المريض لم يخبر أحداً عن حساسيته عند دخوله المستشفى",
                "en": "The patient never told anyone about the allergy on admission"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة: المريض أبلغ الطوارئ وكان يرتدي السوار الأحمر بالفعل!",
                "en": "Review your Evidence Journal: The patient informed ED triage and was wearing a red allergy band!"
              },
              "rationale": {
                "ar": "كشف ممتاز! ترك حقل الحساسية على الإعداد الافتراضي أثناء التحويل من الطوارئ وعدم مطابقة السوار الأحمر بجانب السرير كاد يسبب كارثة. التوفيق الدوائي ومراجعة الحساسية إلزاميان عند كل نقل.",
                "en": "Excellent investigation! Leaving the electronic allergy field on its default setting during transfer without reconciling the triage sheet caused the gap."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص محطة مطابقة الهوية والحساسية (القرينة 1) لفتح طرفية سجل الأدوية MAR (القرينة 2)، ثم تحدث مع د. ياسر ود. نور.",
        "en": "Inspect the Triage Intake Scanner (Clue 1) to unlock the MAR Audit Terminal (Clue 2), then speak with Dr. Yasser and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "كشف ممتاز! ترك حقل الحساسية على الإعداد الافتراضي أثناء التحويل من الطوارئ وعدم مطابقة السوار الأحمر بجانب السرير كاد يسبب كارثة. التوفيق الدوائي ومراجعة الحساسية إلزاميان عند كل نقل.",
        "en": "Excellent investigation! Leaving the electronic allergy field on its default setting during transfer without reconciling the triage sheet caused the gap."
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
      "id": "mm-case-3-missing-handover",
      "missionIndex": 3,
      "requiredMissionId": "mm-case-2-allergy-alert",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 2: لغز تنبيه الحساسية المفقود (The Allergy Alert)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 2: The Allergy Alert\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 3: لغز المعلومة الساقطة في تسليم الشفت (The Missing Handover Detail)",
        "en": "Case 3: The Missing Handover Detail"
      },
      "subtitle": {
        "ar": "لماذا استمر مريض على مضاد واسع الطيف 48 ساعة إضافية رغم صدور نتيجة المزرعة الموجهة؟",
        "en": "Why did a patient remain on broad-spectrum empiric therapy 48 hours after a targeted culture result was ready?"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #3",
        "en": "Clinical Mystery Case #3"
      },
      "badgeIcon": "📋",
      "badgeTitle": {
        "ar": "📋 محقق القضية 3: حارس التسليم السريري SBAR",
        "en": "📋 Case 3 Solved: SBAR Continuity Investigator"
      },
      "primaryNpc": "nurseSalma",
      "briefing": {
        "ar": "أصدرت وحدة الميكروبيولوجي نتيجة مزرعة وحساسية تسمح بتضييق المضاد الحيوي (De-escalation) منذ يومين، لكن فريق الجناح لم يراجعها إلا اليوم! تتبع أين توقفت المعلومة أثناء تبديل النوبات.",
        "en": "Microbiology finalized a culture sensitivity report 48 hours ago allowing safe antibiotic de-escalation, yet the ward team was unaware until today. Trace where the handover chain broke."
      },
      "initialNodeId": "nurseSalma_start",
      "requirePropsSolvedBeforeNodeId": "nurseSalma_start",
      "interactiveProps": [
        {
          "id": "c3-clue-sbar",
          "name": {
            "ar": "مراجعة سجل تسليم النوبات الثلاث الماضية",
            "en": "Audit of Last Three Shift Handover Sheets"
          },
          "stationLabel": {
            "ar": "قرينة 1: منصة نماذج تسليم الشفت (SBAR)",
            "en": "Clue 1: SBAR Shift Handover Podium"
          },
          "position": [
            -2.5,
            0,
            -2
          ],
          "color": 165063,
          "accentColor": 3718648,
          "iconEmoji": "📋",
          "shape": "sbar_podium",
          "rewardItem": {
            "id": "item-c3-sbar-sheet",
            "icon": "📋",
            "label": {
              "ar": "قرينة 1: نموذج SBAR منسوخ بدون تحديث المزارع",
              "en": "Clue 1: Unupdated SBAR Handover Sheet"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-03 • CLUE A",
            "clueTitle": {
              "ar": "مراجعة سجل تسليم النوبات الثلاث الماضية",
              "en": "Audit of Last Three Shift Handover Sheets"
            },
            "sourceLocation": {
              "ar": "منصة التسليم السريري",
              "en": "Ward Handover Podium"
            },
            "timestampLabel": {
              "ar": "أرشيف نماذج SBAR",
              "en": "SBAR Handover Archive"
            },
            "evidenceSummary": {
              "ar": "تم نسخ خانة التوصيات من اليوم السابق دون تحديث حالة المزرعة بعد تبديل التغطية المؤقتة.",
              "en": "The Recommendation field was copy-pasted from prior shifts without updating pending microbiology status."
            },
            "deductionNote": {
              "ar": "افحص الآن لوحة إشعارات المختبر لمعرفة من استلم مكالمة النتيجة!",
              "en": "Now inspect the Lab Notification Board to see who received the microbiology callback!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c3-clue-sbar-step-1",
              "prompt": {
                "ar": "في خانة \"التوصيات والمزارع المعلقة (R)\"، تُركت العبارة القديمة منسوخة كما هي (\"لا توجد تحديثات\")، بينما تم تغيير الممرض المسؤول في منتصف النوبة لتغطية طارئ!",
                "en": "In the \"Recommendation / Pending Labs (R)\" field, an old copy-pasted line (\"No updates\") remained unchanged after a mid-shift float coverage swap!"
              },
              "hint": {
                "ar": "افحص الآن لوحة إشعارات المختبر لمعرفة من استلم مكالمة النتيجة!",
                "en": "Now inspect the Lab Notification Board to see who received the microbiology callback!"
              },
              "options": [
                {
                  "id": "c3-clue-sbar-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تم نسخ خانة التوصيات من اليوم السابق دون تحديث حالة المزرعة بعد تبديل التغطية المؤقتة.",
                    "en": "The Recommendation field was copy-pasted from prior shifts without updating pending microbiology status."
                  }
                },
                {
                  "id": "c3-clue-sbar-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "تم نسخ خانة التوصيات من اليوم السابق دون تحديث حالة المزرعة بعد تبديل التغطية المؤقتة.",
            "en": "The Recommendation field was copy-pasted from prior shifts without updating pending microbiology status."
          }
        },
        {
          "id": "c3-clue-board",
          "name": {
            "ar": "تتبع مكالمة المختبر الساعة 14:50 أثناء تبديل الشفت",
            "en": "14:50 Shift-Change Callback Trace"
          },
          "stationLabel": {
            "ar": "قرينة 2: سجل اتصالات المختبر الهاتفية",
            "en": "Clue 2: Lab Phone Notification Log"
          },
          "position": [
            2.5,
            0,
            -2
          ],
          "color": 889992,
          "accentColor": 3003583,
          "iconEmoji": "📝",
          "shape": "evidence_board",
          "requiresPropId": "c3-clue-sbar",
          "rewardItem": {
            "id": "item-c3-sticky-note",
            "icon": "📝",
            "label": {
              "ar": "قرينة 2: ورقة لاصقة منسية وقت تبديل الشفت",
              "en": "Clue 2: Forgotten Shift-Change Sticky Note"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-03 • CLUE B",
            "clueTitle": {
              "ar": "تتبع مكالمة المختبر الساعة 14:50 أثناء تبديل الشفت",
              "en": "14:50 Shift-Change Callback Trace"
            },
            "sourceLocation": {
              "ar": "هاتف محطة التمريض",
              "en": "Nurses Station Desk Phone"
            },
            "timestampLabel": {
              "ar": "سجل اتصالات المختبر",
              "en": "Lab Callback Registry"
            },
            "evidenceSummary": {
              "ar": "استُلمت نتيجة المزرعة هاتفياً أثناء انشغال الفريق بتبديل الشفت، ودُونت على قصاصة ورقية بدلاً من السجل الرسمي.",
              "en": "The culture result arrived by phone during shift change and was written on a loose sticky note instead of the chart."
            },
            "deductionNote": {
              "ar": "تحدث مع م. سلمى ثم اعرض النتيجة النهائية على د. نور.",
              "en": "Speak with Nurse Salma, then present your case reveal to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c3-clue-board-step-1",
              "prompt": {
                "ar": "اتصل المختبر الساعة 14:50 (وقت تسليم الشفت تماماً)؛ دُوّنت الملاحظة على ورقة لاصقة صغيرة على الهاتف الثابت ولم تُسجل في نظام SBAR الإلكتروني!",
                "en": "Microbiology called at 14:50 right during shift change; the message was scribbled on a sticky note by the desk phone and never entered into the electronic SBAR tracker!"
              },
              "hint": {
                "ar": "تحدث مع م. سلمى ثم اعرض النتيجة النهائية على د. نور.",
                "en": "Speak with Nurse Salma, then present your case reveal to Dr. Nour."
              },
              "options": [
                {
                  "id": "c3-clue-board-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "استُلمت نتيجة المزرعة هاتفياً أثناء انشغال الفريق بتبديل الشفت، ودُونت على قصاصة ورقية بدلاً من السجل الرسمي.",
                    "en": "The culture result arrived by phone during shift change and was written on a loose sticky note instead of the chart."
                  }
                },
                {
                  "id": "c3-clue-board-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "استُلمت نتيجة المزرعة هاتفياً أثناء انشغال الفريق بتبديل الشفت، ودُونت على قصاصة ورقية بدلاً من السجل الرسمي.",
            "en": "The culture result arrived by phone during shift change and was written on a loose sticky note instead of the chart."
          }
        }
      ],
      "nodes": {
        "nurseSalma_start": {
          "id": "nurseSalma_start",
          "speaker": "nurseSalma",
          "targetNpc": "nurseSalma",
          "objectiveHint": {
            "ar": "افحص منصة تسليم الشفت (القرينة 1) لفتح لوحة رسائل المختبر (القرينة 2)، ثم حاور م. سلمى ود. نور.",
            "en": "Inspect the SBAR Handover Podium (Clue 1) to unlock the Lab Notification Board (Clue 2), then speak with Nurse Salma and Dr. Nour."
          },
          "dialogue": {
            "ar": "يا لها من ثغرة مهمة! كيف نضمن عدم ضياع نتائج المزارع التي تصل أثناء أوقات تبديل النوبات المزدحمة؟",
            "en": "What an important catch! How can we prevent culture results from getting lost during busy shift handovers?"
          },
          "choices": [
            {
              "id": "nurseSalma_start_c1",
              "label": {
                "ar": "منع تدوين النتائج على قصاصات ورقية، وإدراج بند ثابت \"مراجعة المزارع المعلقة (Pending Cultures Check)\" ضمن قائمة SBAR الإلزامية عند كل تسليم",
                "en": "Eliminate loose sticky notes and make a live \"Pending Cultures Review\" a mandatory check item in every electronic SBAR handover"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "حل عملي ومستدام! المراجعة المباشرة لنتائج المختبر أثناء التسليم تضمن سرعة تعديل خطة العلاج.",
                "en": "Practical, sustainable solution! Reviewing live pending labs during SBAR ensures timely stewardship review."
              },
              "rationale": {
                "ar": "أحسنت! الاعتماد على الملاحظات الورقية العابرة في الجيب بدلاً من تحديث قسم (Recommendation - المزارع المعلقة) في نموذج SBAR المعتمد تسبب في ضياع النتيجة.",
                "en": "Great work! Jotting lab callbacks on a loose pocket scrap instead of updating the official SBAR Pending Cultures section caused the 48-hour stewardship delay."
              }
            },
            {
              "id": "nurseSalma_start_c2",
              "label": {
                "ar": "نطلب من المختبر عدم الاتصال بالجناح أبداً بعد الظهر",
                "en": "Ask the laboratory not to report results in the afternoon"
              },
              "nextNodeId": "nurseSalma_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "تأخير إبلاغ النتائج يضر بسلامة المرضى؛ الحل هو توثيقها مباشرة في السجل الرسمي.",
                "en": "Delaying lab reporting harms care; the solution is structured documentation in the shared record."
              },
              "rationale": {
                "ar": "أحسنت! الاعتماد على الملاحظات الورقية العابرة في الجيب بدلاً من تحديث قسم (Recommendation - المزارع المعلقة) في نموذج SBAR المعتمد تسبب في ضياع النتيجة.",
                "en": "Great work! Jotting lab callbacks on a loose pocket scrap instead of updating the official SBAR Pending Cultures section caused the 48-hour stewardship delay."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص منصة تسليم الشفت (القرينة 1) لفتح لوحة رسائل المختبر (القرينة 2)، ثم حاور م. سلمى ود. نور.",
            "en": "Inspect the SBAR Handover Podium (Clue 1) to unlock the Lab Notification Board (Clue 2), then speak with Nurse Salma and Dr. Nour."
          },
          "dialogue": {
            "ar": "أخبرني بالنتيجة النهائية للقضية الثالثة: لماذا تأخر تضييق المضاد الحيوي لمدة 48 ساعة؟",
            "en": "Give me the final reveal for Case 3: Why was antibiotic de-escalation delayed for 48 hours?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "وصلت مكالمة المختبر وقت تبديل الشفت ودُونت على ورقة لاصقة منسية مع نسخ خانة التوصيات في SBAR دون مراجعة المزارع المعلقة",
                "en": "The lab callback arrived during shift change and was written on a forgotten sticky note while the SBAR Recommendation section was copy-pasted without checking pending cultures"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "استنتاج ممتاز! تم إغلاق القضية الثالثة وتحديث بروتوكول التسليم السريري.",
                "en": "Spot-on conclusion! Case 3 is closed and the ward SBAR protocol has been upgraded."
              },
              "rationale": {
                "ar": "أحسنت! الاعتماد على الملاحظات الورقية العابرة في الجيب بدلاً من تحديث قسم (Recommendation - المزارع المعلقة) في نموذج SBAR المعتمد تسبب في ضياع النتيجة.",
                "en": "Great work! Jotting lab callbacks on a loose pocket scrap instead of updating the official SBAR Pending Cultures section caused the 48-hour stewardship delay."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "المختبر لم يقم بزراعة العينة من الأساس",
                "en": "The laboratory never cultured the specimen"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة: المختبر أصدر النتيجة واتصل الساعة 14:50، لكن الخلل وقع في تسليم الشفت.",
                "en": "Check your Evidence Journal: The lab reported the result at 14:50; the gap occurred during shift handover."
              },
              "rationale": {
                "ar": "أحسنت! الاعتماد على الملاحظات الورقية العابرة في الجيب بدلاً من تحديث قسم (Recommendation - المزارع المعلقة) في نموذج SBAR المعتمد تسبب في ضياع النتيجة.",
                "en": "Great work! Jotting lab callbacks on a loose pocket scrap instead of updating the official SBAR Pending Cultures section caused the 48-hour stewardship delay."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص منصة تسليم الشفت (القرينة 1) لفتح لوحة رسائل المختبر (القرينة 2)، ثم حاور م. سلمى ود. نور.",
        "en": "Inspect the SBAR Handover Podium (Clue 1) to unlock the Lab Notification Board (Clue 2), then speak with Nurse Salma and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "أحسنت! الاعتماد على الملاحظات الورقية العابرة في الجيب بدلاً من تحديث قسم (Recommendation - المزارع المعلقة) في نموذج SBAR المعتمد تسبب في ضياع النتيجة.",
        "en": "Great work! Jotting lab callbacks on a loose pocket scrap instead of updating the official SBAR Pending Cultures section caused the 48-hour stewardship delay."
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
      "id": "mm-case-4-ipc-gap",
      "missionIndex": 4,
      "requiredMissionId": "mm-case-3-missing-handover",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 3: لغز المعلومة الساقطة في تسليم الشفت (The Missing Handover Detail)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 3: The Missing Handover Detail\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 4: لغز ثغرة مكافحة العدوى (The Infection-Control Gap)",
        "en": "Case 4: The Infection-Control Gap"
      },
      "subtitle": {
        "ar": "كيف انتقلت سلالة بكتيرية بين غرفتين معزولتين رغم التزام الجميع بارتداء القفازات؟",
        "en": "How did an organism cross between two isolation rooms despite 100% glove-wearing compliance?"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #4",
        "en": "Clinical Mystery Case #4"
      },
      "badgeIcon": "🧼",
      "badgeTitle": {
        "ar": "🧼 محقق القضية 4: كاشف التلوث غير المرئي",
        "en": "🧼 Case 4 Solved: Invisible Vector Detective"
      },
      "primaryNpc": "nurseSalma",
      "briefing": {
        "ar": "يؤكد طاقم الجناح أن الجميع كان يرتدي القفازات، ومع ذلك انتقلت سلالة بكتيرية مطابقة من الغرفة 301 إلى الغرفة 302. استخدم جهاز الفحص الفلوري (UV) وسجل موزع المعقم لكشف الثغرة الخفية!",
        "en": "Ward staff report 100% glove use, yet an identical bacterial strain crossed from Room 301 to Room 302. Use the UV Fluorescent Tracer and Sanitizer Dispenser Log to uncover the hidden IPC gap!"
      },
      "initialNodeId": "nurseSalma_start",
      "requirePropsSolvedBeforeNodeId": "nurseSalma_start",
      "interactiveProps": [
        {
          "id": "c4-clue-sink",
          "name": {
            "ar": "مقارنة استهلاك القفازات بعدد ضغطات المعقم الكحولي",
            "en": "Glove Usage vs. Alcohol Dispenser Actuations"
          },
          "stationLabel": {
            "ar": "قرينة 1: عداد موزع المعقم وعلبة القفازات",
            "en": "Clue 1: Sanitizer Counter & Glove Dispenser"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 889992,
          "accentColor": 3003583,
          "iconEmoji": "🧴",
          "shape": "hand_sink",
          "rewardItem": {
            "id": "item-c4-dispenser-log",
            "icon": "🧴",
            "label": {
              "ar": "قرينة 1: فجوة بين سحب القفازات وضغطات المعقم",
              "en": "Clue 1: Glove vs. Handrub Discrepancy"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-04 • CLUE A",
            "clueTitle": {
              "ar": "مقارنة استهلاك القفازات بعدد ضغطات المعقم الكحولي",
              "en": "Glove Usage vs. Alcohol Dispenser Actuations"
            },
            "sourceLocation": {
              "ar": "مدخل غرف العزل 301-302",
              "en": "Isolation Corridor 301–302"
            },
            "timestampLabel": {
              "ar": "العداد الذكي لموزع المعقم",
              "en": "Smart Dispenser Counter"
            },
            "evidenceSummary": {
              "ar": "انخفاض شديد في تطهير اليدين بعد خلع القفازات، مع الخروج بالقفازات أحياناً إلى الممر.",
              "en": "Handrub actuations were far lower than glove pulls, indicating missing post-doffing hand hygiene."
            },
            "deductionNote": {
              "ar": "افحص الآن ماسح التتبع الفلوري (UV Tracer) لرؤية أين انتقلت آثار التلوث!",
              "en": "Now inspect the UV Fluorescent Tracer to see exactly which shared surface carried the contamination!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c4-clue-sink-step-1",
              "prompt": {
                "ar": "خلال الجولة الصباحية سُحب 24 زوجاً من القفازات، بينما سجل موزع المعقم الكحولي عند الخروج 6 ضغطات فقط! بعض الممارسين اعتقدوا أن القفازات تغني عن تطهير اليدين.",
                "en": "During morning rounds, 24 pairs of gloves were pulled, but the exit alcohol dispenser recorded only 6 actuations! Staff mistakenly treated gloves as a substitute for hand hygiene."
              },
              "hint": {
                "ar": "افحص الآن ماسح التتبع الفلوري (UV Tracer) لرؤية أين انتقلت آثار التلوث!",
                "en": "Now inspect the UV Fluorescent Tracer to see exactly which shared surface carried the contamination!"
              },
              "options": [
                {
                  "id": "c4-clue-sink-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "انخفاض شديد في تطهير اليدين بعد خلع القفازات، مع الخروج بالقفازات أحياناً إلى الممر.",
                    "en": "Handrub actuations were far lower than glove pulls, indicating missing post-doffing hand hygiene."
                  }
                },
                {
                  "id": "c4-clue-sink-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "انخفاض شديد في تطهير اليدين بعد خلع القفازات، مع الخروج بالقفازات أحياناً إلى الممر.",
            "en": "Handrub actuations were far lower than glove pulls, indicating missing post-doffing hand hygiene."
          }
        },
        {
          "id": "c4-clue-uv-tracer",
          "name": {
            "ar": "نتيجة الفحص بالأشعة فوق البنفسجية على العربة المتنقلة",
            "en": "UV Glow Trail on Mobile Computer Cart"
          },
          "stationLabel": {
            "ar": "قرينة 2: جهاز التتبع الفلوري (UV Tracer)",
            "en": "Clue 2: UV Fluorescent Surface Tracer"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 8141549,
          "accentColor": 3718648,
          "iconEmoji": "🔦",
          "shape": "equipment_uv_tracer",
          "requiresPropId": "c4-clue-sink",
          "rewardItem": {
            "id": "item-c4-uv-keyboard",
            "icon": "🔦",
            "label": {
              "ar": "قرينة 2: توهج UV على لوحة مفاتيح العربة المشتركة",
              "en": "Clue 2: UV Glow on Shared Cart Keyboard"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-04 • CLUE B",
            "clueTitle": {
              "ar": "نتيجة الفحص بالأشعة فوق البنفسجية على العربة المتنقلة",
              "en": "UV Glow Trail on Mobile Computer Cart"
            },
            "sourceLocation": {
              "ar": "عربة الكمبيوتر المتنقلة (COW)",
              "en": "Mobile Workstation Cart"
            },
            "timestampLabel": {
              "ar": "مسح الأشعة فوق البنفسجية UV",
              "en": "UV Fluorescent Marker Audit"
            },
            "evidenceSummary": {
              "ar": "استخدام لوحة مفاتيح العربة المتنقلة بالقفازات الملوثة قبل خلعها نقل البكتيريا مباشرة إلى الغرفة المجاورة.",
              "en": "Typing on the mobile cart keyboard before removing dirty isolation gloves transferred bacteria between rooms."
            },
            "deductionNote": {
              "ar": "تحدث مع م. سلمى ثم قدم كشف القضية لد. نور.",
              "en": "Discuss the findings with Nurse Salma, then present your reveal to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c4-clue-uv-tracer-step-1",
              "prompt": {
                "ar": "أظهر ضوء UV توهجاً كثيفاً لآثار أصابع القفازات على لوحة مفاتيح عربة الكمبيوتر المتنقلة (COW) ومقبض باب الغرفة 302؛ لقد كُتبت الملاحظات بالقفازات الملوثة قبل خلعها!",
                "en": "UV light reveals glowing glove-print trails on the shared Computer-on-Wheels (COW) keyboard and Room 302’s handle—notes were typed while still wearing contaminated isolation gloves!"
              },
              "hint": {
                "ar": "تحدث مع م. سلمى ثم قدم كشف القضية لد. نور.",
                "en": "Discuss the findings with Nurse Salma, then present your reveal to Dr. Nour."
              },
              "options": [
                {
                  "id": "c4-clue-uv-tracer-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "استخدام لوحة مفاتيح العربة المتنقلة بالقفازات الملوثة قبل خلعها نقل البكتيريا مباشرة إلى الغرفة المجاورة.",
                    "en": "Typing on the mobile cart keyboard before removing dirty isolation gloves transferred bacteria between rooms."
                  }
                },
                {
                  "id": "c4-clue-uv-tracer-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "استخدام لوحة مفاتيح العربة المتنقلة بالقفازات الملوثة قبل خلعها نقل البكتيريا مباشرة إلى الغرفة المجاورة.",
            "en": "Typing on the mobile cart keyboard before removing dirty isolation gloves transferred bacteria between rooms."
          }
        }
      ],
      "nodes": {
        "nurseSalma_start": {
          "id": "nurseSalma_start",
          "speaker": "nurseSalma",
          "targetNpc": "nurseSalma",
          "objectiveHint": {
            "ar": "افحص محطة المعقم والقفازات (القرينة 1) لفتح ماسح التتبع الفلوري UV (القرينة 2)، ثم حاور م. سلمى ود. نور.",
            "en": "Inspect the Sanitizer & Glove Station (Clue 1) to unlock the UV Tracer Scanner (Clue 2), then speak with Nurse Salma and Dr. Nour."
          },
          "dialogue": {
            "ar": "توهج الأشعة فوق البنفسجية على لوحة المفاتيح واضح جداً! ما القاعدة التي يجب تطبيقها فوراً مع عربات الكمبيوتر المتنقلة؟",
            "en": "The UV glow on that keyboard tells the whole story! What rule must we enforce immediately for mobile workstation carts?"
          },
          "choices": [
            {
              "id": "nurseSalma_start_c1",
              "label": {
                "ar": "خلع القفازات وتطهير اليدين داخل الغرفة قبل لمس أي عربة أو لوحة مفاتيح في الممر، مع مسح لوحة المفاتيح بمناديل مطهرة بين الغرف",
                "en": "Always doff gloves and sanitize hands before touching mobile carts or keyboards, and wipe high-touch cart surfaces between patient zones"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "إجراء حاسم! لوحات المفاتيح والأجهزة المحمولة تتحول إلى ناقل للعدوى إذا لُمست بالقفازات المستعملة.",
                "en": "Crucial intervention! Keyboards and mobile devices become rapid vectors if touched with used gloves."
              },
              "rationale": {
                "ar": "تحقيق رائع! ارتداء القفازات نفسها أثناء استخدام لوحة مفاتيح العربة المتنقلة دون خلعها وتطهير اليدين (اللحظة الخامسة) حوّل العربة إلى جسر لنقل العدوى.",
                "en": "Brilliant work! Wearing dirty isolation gloves while typing on the shared mobile workstation keyboard without doffing and handrubbing turned the cart into a transmission vector."
              }
            },
            {
              "id": "nurseSalma_start_c2",
              "label": {
                "ar": "ارتداء قفازين فوق بعضهما والكتابة على لوحة المفاتيح بهما",
                "en": "Wear double gloves while typing on the hallway keyboard"
              },
              "nextNodeId": "nurseSalma_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "الطبقة الخارجية للقفازات المزدوجة تظل ملوثة وتنقل البكتيريا للوحة المفاتيح.",
                "en": "The outer layer of double gloves is still contaminated and transfers flora to the keyboard."
              },
              "rationale": {
                "ar": "تحقيق رائع! ارتداء القفازات نفسها أثناء استخدام لوحة مفاتيح العربة المتنقلة دون خلعها وتطهير اليدين (اللحظة الخامسة) حوّل العربة إلى جسر لنقل العدوى.",
                "en": "Brilliant work! Wearing dirty isolation gloves while typing on the shared mobile workstation keyboard without doffing and handrubbing turned the cart into a transmission vector."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص محطة المعقم والقفازات (القرينة 1) لفتح ماسح التتبع الفلوري UV (القرينة 2)، ثم حاور م. سلمى ود. نور.",
            "en": "Inspect the Sanitizer & Glove Station (Clue 1) to unlock the UV Tracer Scanner (Clue 2), then speak with Nurse Salma and Dr. Nour."
          },
          "dialogue": {
            "ar": "ما استنتاجك النهائي في القضية الرابعة حول انتقال البكتيريا بين الغرفتين 301 و302 رغم ارتداء القفازات؟",
            "en": "What is your final reveal for Case 4 regarding how bacteria crossed from Room 301 to Room 302 despite glove use?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "لمس لوحة مفاتيح العربة المتنقلة بالقفازات المستعملة قبل خلعها وإهمال تطهير اليدين بعد الخلع حوّل العربة إلى ناقل تلامسي بين الغرفتين",
                "en": "Touching the shared mobile workstation keyboard with used isolation gloves before doffing—combined with skipped post-glove hand hygiene—transferred the strain between rooms"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تحليل ممتاز! أغلقت القضية الرابعة وعززت الالتزام بنظافة اليدين وتطهير الأسطح المشتركة.",
                "en": "Excellent root-cause analysis! Case 4 is solved and shared workstation hygiene protocols are restored."
              },
              "rationale": {
                "ar": "تحقيق رائع! ارتداء القفازات نفسها أثناء استخدام لوحة مفاتيح العربة المتنقلة دون خلعها وتطهير اليدين (اللحظة الخامسة) حوّل العربة إلى جسر لنقل العدوى.",
                "en": "Brilliant work! Wearing dirty isolation gloves while typing on the shared mobile workstation keyboard without doffing and handrubbing turned the cart into a transmission vector."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "القفازات الطبية كانت منتهية الصلاحية فقط",
                "en": "The glove boxes were simply past their expiration date"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة: فحص UV أثبت تلوث لوحة مفاتيح العربة المشتركة بسبب عدم خلع القفازات قبل الكتابة.",
                "en": "Check your Evidence Journal: The UV trace proved contamination on the shared keyboard from unremoved gloves."
              },
              "rationale": {
                "ar": "تحقيق رائع! ارتداء القفازات نفسها أثناء استخدام لوحة مفاتيح العربة المتنقلة دون خلعها وتطهير اليدين (اللحظة الخامسة) حوّل العربة إلى جسر لنقل العدوى.",
                "en": "Brilliant work! Wearing dirty isolation gloves while typing on the shared mobile workstation keyboard without doffing and handrubbing turned the cart into a transmission vector."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص محطة المعقم والقفازات (القرينة 1) لفتح ماسح التتبع الفلوري UV (القرينة 2)، ثم حاور م. سلمى ود. نور.",
        "en": "Inspect the Sanitizer & Glove Station (Clue 1) to unlock the UV Tracer Scanner (Clue 2), then speak with Nurse Salma and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "تحقيق رائع! ارتداء القفازات نفسها أثناء استخدام لوحة مفاتيح العربة المتنقلة دون خلعها وتطهير اليدين (اللحظة الخامسة) حوّل العربة إلى جسر لنقل العدوى.",
        "en": "Brilliant work! Wearing dirty isolation gloves while typing on the shared mobile workstation keyboard without doffing and handrubbing turned the cart into a transmission vector."
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
      "id": "mm-case-5-contradictory-lab",
      "missionIndex": 5,
      "requiredMissionId": "mm-case-4-ipc-gap",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 4: لغز ثغرة مكافحة العدوى (The Infection-Control Gap)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 4: The Infection-Control Gap\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 5: لغز تقرير المختبر المتناقض (The Contradictory Lab Report)",
        "en": "Case 5: The Contradictory Lab Report"
      },
      "subtitle": {
        "ar": "لماذا أظهرت صبغة غرام عصيات كثيفة بينما عادت نتيجة المزرعة \"لا يوجد نمو بكتيري\"؟",
        "en": "Why did the initial Gram stain show abundant bacteria with high WBCs, yet the 48-hour culture reported \"No Growth\"?"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #5",
        "en": "Clinical Mystery Case #5"
      },
      "badgeIcon": "🔬",
      "badgeTitle": {
        "ar": "🔬 محقق القضية 5: خبير توقيت المزارع البكتيرية",
        "en": "🔬 Case 5 Solved: Culture Timing Sleuth"
      },
      "primaryNpc": "labOmar",
      "briefing": {
        "ar": "مريض يعاني من التهاب واضح، وأظهرت صبغة غرام الأولية وجود خلايا صديدية وبكتيريا، لكن تقرير المزرعة النهائي عاد \"بدون نمو (No Growth)\" مما حير الفريق الطبي! ابحث في التوقيت الزمني بين إعطاء المضاد وسحب العينة.",
        "en": "A symptomatic patient had white blood cells and bacteria visible on initial Gram stain, yet the culture plate showed \"No Growth\" at 48 hours, baffling the team. Investigate the timeline between antibiotic administration and specimen collection!"
      },
      "initialNodeId": "labOmar_start",
      "requirePropsSolvedBeforeNodeId": "labOmar_start",
      "interactiveProps": [
        {
          "id": "c5-clue-lab",
          "name": {
            "ar": "مقارنة الفحص المجهري المباشر بنتيجة طبق الزرع",
            "en": "Direct Microscopy vs. Agar Plate Growth"
          },
          "stationLabel": {
            "ar": "قرينة 1: جهاز تحليل المزارع وصبغة غرام",
            "en": "Clue 1: Gram Stain & Culture Analyzer"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 561586,
          "accentColor": 2282478,
          "iconEmoji": "🔬",
          "shape": "lab_analyzer",
          "rewardItem": {
            "id": "item-c5-gram-slide",
            "icon": "🔬",
            "label": {
              "ar": "قرينة 1: بكتيريا متضررة في صبغة غرام (11:30 ص)",
              "en": "Clue 1: Damaged Rods on 11:30 AM Gram Stain"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-05 • CLUE A",
            "clueTitle": {
              "ar": "مقارنة الفحص المجهري المباشر بنتيجة طبق الزرع",
              "en": "Direct Microscopy vs. Agar Plate Growth"
            },
            "sourceLocation": {
              "ar": "مختبر الأحياء الدقيقة",
              "en": "Microbiology Lab Bench"
            },
            "timestampLabel": {
              "ar": "تقرير الفحص المجهري",
              "en": "Microscopy Bench Log"
            },
            "evidenceSummary": {
              "ar": "البكتيريا موجودة تحت المجهر لكنها فقدت القدرة على الانقسام والنمو في المزرعة (سُحبت العينة 11:30 صباحاً).",
              "en": "Bacteria were visible microscopically but non-viable on culture media (sample drawn at 11:30 AM)."
            },
            "deductionNote": {
              "ar": "افحص الآن طرفية سجل الأدوية (MAR) لمعرفة متى أُعطيت الجرعة الأولى من المضاد الحيوي!",
              "en": "Now inspect the MAR Timestamp Terminal to see when the first antimicrobial dose was infused!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c5-clue-lab-step-1",
              "prompt": {
                "ar": "تظهر شريحة صبغة غرام خلايا مناعية وعصيات بكتيرية باهتة متضررة الجدار، بينما لم تنمُ أي مستعمرات حية على طبق الآغار. العينة سُحبت الساعة 11:30 صباحاً.",
                "en": "The Gram stain slide shows abundant leukocytes and damaged bacterial rods, yet no viable colonies grew on agar. Specimen collection timestamp: 11:30 AM."
              },
              "hint": {
                "ar": "افحص الآن طرفية سجل الأدوية (MAR) لمعرفة متى أُعطيت الجرعة الأولى من المضاد الحيوي!",
                "en": "Now inspect the MAR Timestamp Terminal to see when the first antimicrobial dose was infused!"
              },
              "options": [
                {
                  "id": "c5-clue-lab-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "البكتيريا موجودة تحت المجهر لكنها فقدت القدرة على الانقسام والنمو في المزرعة (سُحبت العينة 11:30 صباحاً).",
                    "en": "Bacteria were visible microscopically but non-viable on culture media (sample drawn at 11:30 AM)."
                  }
                },
                {
                  "id": "c5-clue-lab-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "البكتيريا موجودة تحت المجهر لكنها فقدت القدرة على الانقسام والنمو في المزرعة (سُحبت العينة 11:30 صباحاً).",
            "en": "Bacteria were visible microscopically but non-viable on culture media (sample drawn at 11:30 AM)."
          }
        },
        {
          "id": "c5-clue-mar",
          "name": {
            "ar": "التسلسل الزمني لإعطاء المضاد مقابل سحب المزرعة",
            "en": "Infusion vs. Culture Collection Timeline"
          },
          "stationLabel": {
            "ar": "قرينة 2: سجل توقيت إعطاء المضاد (MAR)",
            "en": "Clue 2: MAR Infusion Timestamp Log"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 8141549,
          "accentColor": 12616956,
          "iconEmoji": "⏱️",
          "shape": "mar_audit_terminal",
          "requiresPropId": "c5-clue-lab",
          "rewardItem": {
            "id": "item-c5-mar-timeline",
            "icon": "⏱️",
            "label": {
              "ar": "قرينة 2: إعطاء المضاد (09:15) قبل سحب المزرعة (11:30)",
              "en": "Clue 2: Antibiotic Given 2h Before Culture"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-05 • CLUE B",
            "clueTitle": {
              "ar": "التسلسل الزمني لإعطاء المضاد مقابل سحب المزرعة",
              "en": "Infusion vs. Culture Collection Timeline"
            },
            "sourceLocation": {
              "ar": "طرفية التوقيت الزمني MAR",
              "en": "MAR Timestamp Terminal"
            },
            "timestampLabel": {
              "ar": "سجل المضخة الوريدية الذكية",
              "en": "Smart Infusion Pump Log"
            },
            "evidenceSummary": {
              "ar": "تأخر سحب العينة إلى ما بعد إعطاء المضاد الحيوي أدى إلى تثبيط نمو البكتيريا في طبق المزرعة وحرمان الفريق من تحديد الحساسية.",
              "en": "Drawing the culture after starting IV therapy sterilized the culture plate and prevented susceptibility testing."
            },
            "deductionNote": {
              "ar": "تحدث مع أ. عمر ثم قدم التفسير النهائي لد. نور.",
              "en": "Speak with Omar, then present your final reveal to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c5-clue-mar-step-1",
              "prompt": {
                "ar": "أُعطيت الجرعة الوريدية الأولى من المضاد الحيوي واسع الطيف الساعة 09:15 صباحاً، بينما لم تُسحب عينة المزرعة إلا الساعة 11:30 صباحاً (بعد ساعتين و15 دقيقة من بدء المضاد)!",
                "en": "The first broad-spectrum IV antimicrobial dose was infused at 09:15 AM, while the culture specimen was not collected until 11:30 AM—more than two hours after antibiotic exposure!"
              },
              "hint": {
                "ar": "تحدث مع أ. عمر ثم قدم التفسير النهائي لد. نور.",
                "en": "Speak with Omar, then present your final reveal to Dr. Nour."
              },
              "options": [
                {
                  "id": "c5-clue-mar-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تأخر سحب العينة إلى ما بعد إعطاء المضاد الحيوي أدى إلى تثبيط نمو البكتيريا في طبق المزرعة وحرمان الفريق من تحديد الحساسية.",
                    "en": "Drawing the culture after starting IV therapy sterilized the culture plate and prevented susceptibility testing."
                  }
                },
                {
                  "id": "c5-clue-mar-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "تأخر سحب العينة إلى ما بعد إعطاء المضاد الحيوي أدى إلى تثبيط نمو البكتيريا في طبق المزرعة وحرمان الفريق من تحديد الحساسية.",
            "en": "Drawing the culture after starting IV therapy sterilized the culture plate and prevented susceptibility testing."
          }
        }
      ],
      "nodes": {
        "labOmar_start": {
          "id": "labOmar_start",
          "speaker": "labOmar",
          "targetNpc": "labOmar",
          "objectiveHint": {
            "ar": "افحص محطة الميكروبيولوجي (القرينة 1) لفتح طرفية توقيت إعطاء الأدوية MAR (القرينة 2)، ثم حاور أ. عمر ود. نور.",
            "en": "Inspect the Microbiology Analyzer (Clue 1) to unlock the MAR Timestamp Terminal (Clue 2), then speak with Omar and Dr. Nour."
          },
          "dialogue": {
            "ar": "هذا يفسر التناقض تماماً! ما القاعدة التمريضية والسريرية التي تحمي دقة المزارع البكتيرية دون الإضرار بالمريض؟",
            "en": "That explains the contradiction completely! What clinical rule protects culture accuracy while keeping patients safe?"
          },
          "choices": [
            {
              "id": "labOmar_start_c1",
              "label": {
                "ar": "سحب عينات المزارع المطلوبة أولاً قبل بدء الجرعة الأولى من المضاد الحيوي متى كان ذلك ممكناً دون تأخير خطر في الحالات الحرجة",
                "en": "Collect ordered microbiology cultures BEFORE initiating the first antimicrobial dose whenever clinically feasible without delaying critical care"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "قاعدة ذهبية في حوكمة المضادات الحيوية! سحب المزرعة أولاً يتيح معرفة البكتيريا وتضييق العلاج لاحقاً.",
                "en": "A golden rule of antimicrobial stewardship! Obtaining cultures before the first dose preserves diagnostic yield."
              },
              "rationale": {
                "ar": "كشف علمي رائع! سحب عينة المزرعة بعد ساعتين من بدء المضاد الحيوي الوريدي يثبط نمو البكتيريا في أطباق الزرع (نتيجة سلبية كاذبة) رغم بقاء البكتيريا مرئية تحت المجهر في صبغة غرام.",
                "en": "Superb scientific deduction! Drawing the culture two hours AFTER starting IV antibiotics inhibited bacterial growth on agar (false-negative culture) even though non-viable organisms were still visible on the Gram stain."
              }
            },
            {
              "id": "labOmar_start_c2",
              "label": {
                "ar": "إلغاء فحص صبغة غرام من المختبر حتى لا يظهر تناقض",
                "en": "Stop performing Gram stains so contradictions are hidden"
              },
              "nextNodeId": "labOmar_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "صبغة غرام فحص تشخيصي مهم؛ الحل هو الالتزام بسحب العينة قبل بدء المضاد.",
                "en": "Gram stain is an essential rapid diagnostic tool; the solution is proper pre-antibiotic sample collection."
              },
              "rationale": {
                "ar": "كشف علمي رائع! سحب عينة المزرعة بعد ساعتين من بدء المضاد الحيوي الوريدي يثبط نمو البكتيريا في أطباق الزرع (نتيجة سلبية كاذبة) رغم بقاء البكتيريا مرئية تحت المجهر في صبغة غرام.",
                "en": "Superb scientific deduction! Drawing the culture two hours AFTER starting IV antibiotics inhibited bacterial growth on agar (false-negative culture) even though non-viable organisms were still visible on the Gram stain."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص محطة الميكروبيولوجي (القرينة 1) لفتح طرفية توقيت إعطاء الأدوية MAR (القرينة 2)، ثم حاور أ. عمر ود. نور.",
            "en": "Inspect the Microbiology Analyzer (Clue 1) to unlock the MAR Timestamp Terminal (Clue 2), then speak with Omar and Dr. Nour."
          },
          "dialogue": {
            "ar": "ما كشفك النهائي للقضية الخامسة حول سبب ظهور بكتيريا في صبغة غرام مع عدم نموها في المزرعة؟",
            "en": "What is your final reveal for Case 5 explaining why bacteria appeared on Gram stain but failed to grow on culture?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "سُحبت عينة المزرعة الساعة 11:30 صباحاً بعد ساعتين من إعطاء المضاد الوريدي (09:15 صباحاً)، مما ثبّط نمو البكتيريا في المزرعة وأعطى نتيجة سلبية كاذبة",
                "en": "The culture specimen was collected at 11:30 AM—more than two hours after the 09:15 AM IV antibiotic dose—inhibiting colony growth and causing a false-negative culture"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "استنتاج علمي متقن! أغلقت القضية الخامسة بنجاح.",
                "en": "Masterful scientific conclusion! Case 5 is officially solved."
              },
              "rationale": {
                "ar": "كشف علمي رائع! سحب عينة المزرعة بعد ساعتين من بدء المضاد الحيوي الوريدي يثبط نمو البكتيريا في أطباق الزرع (نتيجة سلبية كاذبة) رغم بقاء البكتيريا مرئية تحت المجهر في صبغة غرام.",
                "en": "Superb scientific deduction! Drawing the culture two hours AFTER starting IV antibiotics inhibited bacterial growth on agar (false-negative culture) even though non-viable organisms were still visible on the Gram stain."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "العينة كانت مجرد ماء مقطر بالخطأ",
                "en": "The sample tube only contained sterile water"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة: العينة احتوت خلايا مناعية وبكتيريا متضررة لأنها سُحبت بعد بدء المضاد الحيوي.",
                "en": "Check your Evidence Journal: The sample had WBCs and damaged rods because it was drawn post-antibiotic."
              },
              "rationale": {
                "ar": "كشف علمي رائع! سحب عينة المزرعة بعد ساعتين من بدء المضاد الحيوي الوريدي يثبط نمو البكتيريا في أطباق الزرع (نتيجة سلبية كاذبة) رغم بقاء البكتيريا مرئية تحت المجهر في صبغة غرام.",
                "en": "Superb scientific deduction! Drawing the culture two hours AFTER starting IV antibiotics inhibited bacterial growth on agar (false-negative culture) even though non-viable organisms were still visible on the Gram stain."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص محطة الميكروبيولوجي (القرينة 1) لفتح طرفية توقيت إعطاء الأدوية MAR (القرينة 2)، ثم حاور أ. عمر ود. نور.",
        "en": "Inspect the Microbiology Analyzer (Clue 1) to unlock the MAR Timestamp Terminal (Clue 2), then speak with Omar and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "كشف علمي رائع! سحب عينة المزرعة بعد ساعتين من بدء المضاد الحيوي الوريدي يثبط نمو البكتيريا في أطباق الزرع (نتيجة سلبية كاذبة) رغم بقاء البكتيريا مرئية تحت المجهر في صبغة غرام.",
        "en": "Superb scientific deduction! Drawing the culture two hours AFTER starting IV antibiotics inhibited bacterial growth on agar (false-negative culture) even though non-viable organisms were still visible on the Gram stain."
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
      "id": "mm-case-6-resistant-organism",
      "missionIndex": 6,
      "requiredMissionId": "mm-case-5-contradictory-lab",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 5: لغز تقرير المختبر المتناقض (The Contradictory Lab Report)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 5: The Contradictory Lab Report\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 6: لغز قرينة الميكروب المقاوم (The Resistant Organism Clue)",
        "en": "Case 6: The Resistant Organism Clue"
      },
      "subtitle": {
        "ar": "لماذا لم تتحسن الحمى رغم الالتزام بمواعيد المضاد الحيوي الأولي؟ (تفسير لوحة الحساسية AST)",
        "en": "Why did fever persist despite on-time empiric therapy? Uncover the ESBL resistance clue in the lab report"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #6",
        "en": "Clinical Mystery Case #6"
      },
      "badgeIcon": "🧬",
      "badgeTitle": {
        "ar": "🧬 محقق القضية 6: كاشف آليات المقاومة البكتيرية",
        "en": "🧬 Case 6 Solved: Resistance Pattern Detective"
      },
      "primaryNpc": "pharmacistYasser",
      "briefing": {
        "ar": "مريض يتلقى مضاداً تجريبياً بانتظام منذ 48 ساعة دون أي تحسن في المؤشرات الالتهابية. افحص تقرير الحساسية المخبري الحديث (AST) ولوحة الأدلة لكشف آلية المقاومة البكتيرية الخفية.",
        "en": "A patient has received on-time empiric therapy for 48 hours with no clinical improvement. Inspect the newly released Antimicrobial Susceptibility Testing (AST) report and Evidence Board to uncover the resistance clue."
      },
      "initialNodeId": "pharmacistYasser_start",
      "requirePropsSolvedBeforeNodeId": "pharmacistYasser_start",
      "interactiveProps": [
        {
          "id": "c6-clue-ast",
          "name": {
            "ar": "نتيجة فحص الحساسية وإفراز إنزيمات المقاومة",
            "en": "Phenotypic Resistance & Susceptibility Report"
          },
          "stationLabel": {
            "ar": "قرينة 1: لوحة فحص الحساسية للمضادات (AST)",
            "en": "Clue 1: AST Susceptibility Report Station"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 366185,
          "accentColor": 3462041,
          "iconEmoji": "🧬",
          "shape": "lab_analyzer",
          "rewardItem": {
            "id": "item-c6-ast-report",
            "icon": "🧬",
            "label": {
              "ar": "قرينة 1: تقرير AST يثبت مقاومة السلالة للمضاد الأولي",
              "en": "Clue 1: AST Report Confirming Resistance"
            }
          },
          "astReportConfig": {
            "reportCode": "MM-AST-06",
            "fictionalPatientLabel": {
              "ar": "قرينة 1: لوحة فحص الحساسية للمضادات (AST)",
              "en": "Clue 1: AST Susceptibility Report Station"
            },
            "specimenSource": {
              "ar": "نتيجة فحص الحساسية وإفراز إنزيمات المقاومة",
              "en": "Phenotypic Resistance & Susceptibility Report"
            },
            "organismName": {
              "ar": "سلالة بكتيرية منتجة لإنزيمات المقاومة (حالة تعليمية خيالية)",
              "en": "Resistant Gram-Negative Isolate (Fictional Educational Case)"
            },
            "colonyCount": {
              "ar": "> 100,000 CFU/mL (عينة تعليمية خيالية)",
              "en": "> 100,000 CFU/mL (Fictional Educational Sample)"
            },
            "rows": [
              {
                "antibiotic": {
                  "ar": "المضاد التجريبي الأولي (الفئة أ)",
                  "en": "Initial Empiric Class A"
                },
                "awareCategory": "Watch",
                "mic": ">= 64",
                "result": "R",
                "note": {
                  "ar": "مقاوم (Resistant) — يفسر عدم التحسن",
                  "en": "Resistant — explains persistent fever"
                }
              },
              {
                "antibiotic": {
                  "ar": "الخيار الموجه البديل (وفق المزرعة)",
                  "en": "Culture-Guided Targeted Option"
                },
                "awareCategory": "Access",
                "mic": "<= 0.5",
                "result": "S",
                "note": {
                  "ar": "حساس (Susceptible) — لمراجعة الفريق الطبي",
                  "en": "Susceptible — for stewardship team review"
                }
              }
            ],
            "stewardshipNote": {
              "ar": "مقاومة إنزيمية للمضاد الأولي — تتطلب تعديلاً موجهاً وعزلاً تلامسياً",
              "en": "Enzymatic resistance to initial empiric class — requires targeted review & contact precautions"
            }
          },
          "puzzleSteps": [
            {
              "id": "c6-clue-ast-step-1",
              "prompt": {
                "ar": "يظهر التقرير سلالة بكتيرية مقاومة (R) للمضاد التجريبي الحالي بسبب إفراز إنزيمات محللة، مع وجود خيارات محددة فعالة (S) وفق فحص الحساسية المخبري.",
                "en": "The laboratory AST report reveals resistance (R) to the current empiric class via beta-lactamase production, while identifying specific susceptible (S) targeted classes."
              },
              "options": [
                {
                  "id": "c6-clue-ast-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "يظهر التقرير سلالة بكتيرية مقاومة (R) للمضاد التجريبي الحالي بسبب إفراز إنزيمات محللة، مع وجود خيارات محددة فعالة (S) وفق فحص الحساسية المخبري.",
                    "en": "The laboratory AST report reveals resistance (R) to the current empiric class via beta-lactamase production, while identifying specific susceptible (S) targeted classes."
                  }
                },
                {
                  "id": "c6-clue-ast-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "يظهر التقرير سلالة بكتيرية مقاومة (R) للمضاد التجريبي الحالي بسبب إفراز إنزيمات محللة، مع وجود خيارات محددة فعالة (S) وفق فحص الحساسية المخبري.",
            "en": "The laboratory AST report reveals resistance (R) to the current empiric class via beta-lactamase production, while identifying specific susceptible (S) targeted classes."
          }
        },
        {
          "id": "c6-clue-history",
          "name": {
            "ar": "تحليل عوامل الخطر لاكتساب البكتيريا المقاومة",
            "en": "Risk-Factor Audit for Resistant Colonization"
          },
          "stationLabel": {
            "ar": "قرينة 2: سجل التعرض السابق للمضادات الحيوية",
            "en": "Clue 2: Prior Antibiotic Exposure History"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 8141549,
          "accentColor": 12616956,
          "iconEmoji": "💊",
          "shape": "evidence_board",
          "requiresPropId": "c6-clue-ast",
          "rewardItem": {
            "id": "item-c6-prior-abx",
            "icon": "💊",
            "label": {
              "ar": "قرينة 2: تاريخ استخدام عشوائي متكرر للمضادات",
              "en": "Clue 2: Repeated Incomplete Antibiotic Use"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-06 • CLUE B",
            "clueTitle": {
              "ar": "تحليل عوامل الخطر لاكتساب البكتيريا المقاومة",
              "en": "Risk-Factor Audit for Resistant Colonization"
            },
            "sourceLocation": {
              "ar": "لوحة التاريخ الدوائي",
              "en": "Medication History Board"
            },
            "timestampLabel": {
              "ar": "مقابلة التوفيق الدوائي",
              "en": "Admission Medication History"
            },
            "evidenceSummary": {
              "ar": "الاستخدام المتكرر وغير المكتمل للمضادات الحيوية أدى لانتقاء سلالة مقاومة للمضاد التجريبي المعتاد.",
              "en": "Repeated self-medication with leftover antibiotics selected for a strain resistant to standard empiric therapy."
            },
            "deductionNote": {
              "ar": "تحدث مع د. ياسر ثم اعرض استنتاجك على د. نور.",
              "en": "Speak with Dr. Yasser, then present your case reveal to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c6-clue-history-step-1",
              "prompt": {
                "ar": "يكشف التاريخ الدوائي أن المريض تناول 4 كورسات غير مكتملة من المضادات الحيوية دون وصفة خلال الأشهر الثلاثة الماضية، مما قتل البكتيريا الحساسة وأبقى السلالة المقاومة!",
                "en": "The patient history reveals four incomplete courses of leftover antibiotics taken without medical evaluation over the past 3 months—selecting for the resistant strain!"
              },
              "hint": {
                "ar": "تحدث مع د. ياسر ثم اعرض استنتاجك على د. نور.",
                "en": "Speak with Dr. Yasser, then present your case reveal to Dr. Nour."
              },
              "options": [
                {
                  "id": "c6-clue-history-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "الاستخدام المتكرر وغير المكتمل للمضادات الحيوية أدى لانتقاء سلالة مقاومة للمضاد التجريبي المعتاد.",
                    "en": "Repeated self-medication with leftover antibiotics selected for a strain resistant to standard empiric therapy."
                  }
                },
                {
                  "id": "c6-clue-history-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "الاستخدام المتكرر وغير المكتمل للمضادات الحيوية أدى لانتقاء سلالة مقاومة للمضاد التجريبي المعتاد.",
            "en": "Repeated self-medication with leftover antibiotics selected for a strain resistant to standard empiric therapy."
          }
        }
      ],
      "nodes": {
        "pharmacistYasser_start": {
          "id": "pharmacistYasser_start",
          "speaker": "pharmacistYasser",
          "targetNpc": "pharmacistYasser",
          "objectiveHint": {
            "ar": "افحص جهاز تحليل الحساسية AST (القرينة 1) لفتح لوحة التاريخ الدوائي (القرينة 2)، ثم حاور د. ياسر ود. نور.",
            "en": "Inspect the AST Susceptibility Analyzer (Clue 1) to unlock the Prior Exposure Board (Clue 2), then consult Dr. Yasser and Dr. Nour."
          },
          "dialogue": {
            "ar": "بناءً على تقرير الحساسية (AST) وتاريخ المقاومة، ما الإجراء المشترك بين الصيدلية والتمريض والطب الآن؟",
            "en": "Based on the AST report and resistance mechanism, what coordinated team action is required now?"
          },
          "choices": [
            {
              "id": "pharmacistYasser_start_c1",
              "label": {
                "ar": "إبلاغ الفريق الطبي لتعديل العلاج وفق نتيجة الحساسية (AST)، تفعيل احتياطات العزل التلامسي، وتثقيف المريض حول مخاطر الاستخدام العشوائي للمضادات",
                "en": "Alert the medical team to align therapy with the AST susceptibility report, initiate contact precautions, and educate on avoiding self-medication"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "استجابة متكاملة! الجمع بين العلاج الموجه بالمزرعة والعزل التلامسي والتثقيف يحاصر المقاومة البكتيرية.",
                "en": "Comprehensive stewardship response! Combining culture-guided therapy, contact precautions, and education curbs resistance."
              },
              "rationale": {
                "ar": "عمل ممتاز! الاستخدام المتكرر وغير المكتمل للمضادات سابقاً انتقى سلالة منتجة لإنزيمات البيتالاكتاماز واسعة الطيف (ESBL)، مما تطلب مراجعة نتيجة الحساسية وتفعيل العزل التلامسي.",
                "en": "Excellent work! Repeated incomplete antibiotic courses selected for an ESBL-producing strain resistant to standard empiric cephalosporins, requiring targeted stewardship review and contact precautions."
              }
            },
            {
              "id": "pharmacistYasser_start_c2",
              "label": {
                "ar": "الاستمرار على نفس المضاد المقاوم (R) دون تغيير",
                "en": "Continue the same resistant (R) antibiotic unchanged"
              },
              "nextNodeId": "pharmacistYasser_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "الاستمرار على مضاد ثبتت مقاومته مخبرياً يؤخر تعافي المريض ويزيد المضاعفات.",
                "en": "Continuing an agent proven resistant on AST delays recovery and risks clinical worsening."
              },
              "rationale": {
                "ar": "عمل ممتاز! الاستخدام المتكرر وغير المكتمل للمضادات سابقاً انتقى سلالة منتجة لإنزيمات البيتالاكتاماز واسعة الطيف (ESBL)، مما تطلب مراجعة نتيجة الحساسية وتفعيل العزل التلامسي.",
                "en": "Excellent work! Repeated incomplete antibiotic courses selected for an ESBL-producing strain resistant to standard empiric cephalosporins, requiring targeted stewardship review and contact precautions."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص جهاز تحليل الحساسية AST (القرينة 1) لفتح لوحة التاريخ الدوائي (القرينة 2)، ثم حاور د. ياسر ود. نور.",
            "en": "Inspect the AST Susceptibility Analyzer (Clue 1) to unlock the Prior Exposure Board (Clue 2), then consult Dr. Yasser and Dr. Nour."
          },
          "dialogue": {
            "ar": "ما خلاصة تحقيقك في القضية السادسة حول عدم استجابة الحمى للعلاج التجريبي الأولي؟",
            "en": "What is your final reveal for Case 6 regarding why the fever failed to respond to initial empiric therapy?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "أثبت فحص الحساسية (AST) وجود سلالة منتجة لإنزيمات مقاومة للمضاد الأولي نتيجة الاستخدام العشوائي غير المكتمل للمضادات سابقاً",
                "en": "The AST report proved the organism produced resistance enzymes against the initial class, driven by prior repeated incomplete antibiotic use"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تحقيق ممتاز! أغلقت القضية السادسة بنجاح.",
                "en": "Spot-on investigation! Case 6 is solved."
              },
              "rationale": {
                "ar": "عمل ممتاز! الاستخدام المتكرر وغير المكتمل للمضادات سابقاً انتقى سلالة منتجة لإنزيمات البيتالاكتاماز واسعة الطيف (ESBL)، مما تطلب مراجعة نتيجة الحساسية وتفعيل العزل التلامسي.",
                "en": "Excellent work! Repeated incomplete antibiotic courses selected for an ESBL-producing strain resistant to standard empiric cephalosporins, requiring targeted stewardship review and contact precautions."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "جهاز قياس الحرارة في الجناح كان معطلاً فقط",
                "en": "The ward thermometer was simply broken"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة: تقرير AST أثبت مقاومة البكتيريا (R) للمضاد الأولي.",
                "en": "Review your Evidence Journal: The AST report demonstrated microbiological resistance (R) to the initial agent."
              },
              "rationale": {
                "ar": "عمل ممتاز! الاستخدام المتكرر وغير المكتمل للمضادات سابقاً انتقى سلالة منتجة لإنزيمات البيتالاكتاماز واسعة الطيف (ESBL)، مما تطلب مراجعة نتيجة الحساسية وتفعيل العزل التلامسي.",
                "en": "Excellent work! Repeated incomplete antibiotic courses selected for an ESBL-producing strain resistant to standard empiric cephalosporins, requiring targeted stewardship review and contact precautions."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص جهاز تحليل الحساسية AST (القرينة 1) لفتح لوحة التاريخ الدوائي (القرينة 2)، ثم حاور د. ياسر ود. نور.",
        "en": "Inspect the AST Susceptibility Analyzer (Clue 1) to unlock the Prior Exposure Board (Clue 2), then consult Dr. Yasser and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "عمل ممتاز! الاستخدام المتكرر وغير المكتمل للمضادات سابقاً انتقى سلالة منتجة لإنزيمات البيتالاكتاماز واسعة الطيف (ESBL)، مما تطلب مراجعة نتيجة الحساسية وتفعيل العزل التلامسي.",
        "en": "Excellent work! Repeated incomplete antibiotic courses selected for an ESBL-producing strain resistant to standard empiric cephalosporins, requiring targeted stewardship review and contact precautions."
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
      "id": "mm-case-7-confusing-med-record",
      "missionIndex": 7,
      "requiredMissionId": "mm-case-6-resistant-organism",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 6: لغز قرينة الميكروب المقاوم (The Resistant Organism Clue)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 6: The Resistant Organism Clue\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 7: لغز سجل الأدوية المربك (The Confusing Medication Record)",
        "en": "Case 7: The Confusing Medication Record"
      },
      "subtitle": {
        "ar": "لماذا كاد المريض يتلقى جرعة إضافية مكررة عند التحويل من الوريدي إلى الفموي (IV-to-PO Switch)؟",
        "en": "How did an IV-to-PO step-down transition nearly cause a duplicate administration on the same shift?"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #7",
        "en": "Clinical Mystery Case #7"
      },
      "badgeIcon": "📑",
      "badgeTitle": {
        "ar": "📑 محقق القضية 7: مدقق سجلات الأدوية (MAR)",
        "en": "📑 Case 7 Solved: MAR Reconciliation Detective"
      },
      "primaryNpc": "pharmacistYasser",
      "briefing": {
        "ar": "بعد تحسن المريض، قرر الفريق تحويل المضاد من الطريق الوريدي إلى الفموي (IV-to-PO Switch). لكن الممرض المناوب لاحظ أن كلا الطلبين (الوريدي القديم والفموي الجديد) يظهران نشطين في السجل! اكتشف سبب الازدواجية.",
        "en": "Following clinical improvement, the team ordered an IV-to-PO step-down transition. However, the bedside nurse noticed both the old IV order and the new oral order appearing active simultaneously! Uncover how the record became confusing."
      },
      "initialNodeId": "pharmacistYasser_start",
      "requirePropsSolvedBeforeNodeId": "pharmacistYasser_start",
      "interactiveProps": [
        {
          "id": "c7-clue-mar",
          "name": {
            "ar": "فحص الطلبات النشطة المتداخلة في سجل الأدوية",
            "en": "Overlapping Active Orders Audit"
          },
          "stationLabel": {
            "ar": "قرينة 1: شاشة سجل إعطاء الأدوية (MAR)",
            "en": "Clue 1: Electronic MAR Active Orders Screen"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 2450411,
          "accentColor": 6333946,
          "iconEmoji": "🖥️",
          "shape": "mar_audit_terminal",
          "rewardItem": {
            "id": "item-c7-dual-orders",
            "icon": "🖥️",
            "label": {
              "ar": "قرينة 1: طلبان نشطان (وريدي وفموي) في التوقيت نفسه",
              "en": "Clue 1: Overlapping IV & Oral Active Orders"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-07 • CLUE A",
            "clueTitle": {
              "ar": "فحص الطلبات النشطة المتداخلة في سجل الأدوية",
              "en": "Overlapping Active Orders Audit"
            },
            "sourceLocation": {
              "ar": "شاشة سجل الأدوية MAR",
              "en": "Electronic MAR Station"
            },
            "timestampLabel": {
              "ar": "سجل الأوامر العلاجية النشطة",
              "en": "Active Order Entry Log"
            },
            "evidenceSummary": {
              "ar": "أُدخل طلب التحويل الفموي كطلب مستقل بدلاً من استخدام نموذج \"التحويل المرتبط (Linked IV-to-PO)\" الذي يلغي الطلب القديم تلقائياً.",
              "en": "The oral order was entered as a standalone item rather than a linked IV-to-PO replacement order."
            },
            "deductionNote": {
              "ar": "افحص الآن عربة تحضير الأدوية لمعرفة ما وُجد في درج المريض!",
              "en": "Now inspect the Medication Prep Cart to see what was placed in the patient cassette!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c7-clue-mar-step-1",
              "prompt": {
                "ar": "يظهر في النظام طلب جديد (فموي) أُضيف الساعة 11:45 صباحاً، بينما لم يتم إيقاف (Discontinue) الطلب الوريدي القديم، وكلاهما مجدول الساعة 12:00 ظهراً!",
                "en": "A new oral step-down order was entered at 11:45 AM without discontinuing the existing IV order, leaving both scheduled for 12:00 PM!"
              },
              "hint": {
                "ar": "افحص الآن عربة تحضير الأدوية لمعرفة ما وُجد في درج المريض!",
                "en": "Now inspect the Medication Prep Cart to see what was placed in the patient cassette!"
              },
              "options": [
                {
                  "id": "c7-clue-mar-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "أُدخل طلب التحويل الفموي كطلب مستقل بدلاً من استخدام نموذج \"التحويل المرتبط (Linked IV-to-PO)\" الذي يلغي الطلب القديم تلقائياً.",
                    "en": "The oral order was entered as a standalone item rather than a linked IV-to-PO replacement order."
                  }
                },
                {
                  "id": "c7-clue-mar-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "أُدخل طلب التحويل الفموي كطلب مستقل بدلاً من استخدام نموذج \"التحويل المرتبط (Linked IV-to-PO)\" الذي يلغي الطلب القديم تلقائياً.",
            "en": "The oral order was entered as a standalone item rather than a linked IV-to-PO replacement order."
          }
        },
        {
          "id": "c7-clue-cart",
          "name": {
            "ar": "فحص درج المريض في عربة الأدوية",
            "en": "Patient Medication Drawer Inspection"
          },
          "stationLabel": {
            "ar": "قرينة 2: عربة تحضير وحفظ الأدوية",
            "en": "Clue 2: Ward Medication Cassette Cart"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 8141549,
          "accentColor": 12616956,
          "iconEmoji": "🛒",
          "shape": "med_safety_cart",
          "requiresPropId": "c7-clue-mar",
          "rewardItem": {
            "id": "item-c7-cart-drawer",
            "icon": "🛒",
            "label": {
              "ar": "قرينة 2: وجود العبوة الوريدية والفموية معاً في الدرج",
              "en": "Clue 2: Both IV & Oral Forms in Cassette"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-07 • CLUE B",
            "clueTitle": {
              "ar": "فحص درج المريض في عربة الأدوية",
              "en": "Patient Medication Drawer Inspection"
            },
            "sourceLocation": {
              "ar": "عربة أدوية الجناح",
              "en": "Ward Medication Cart"
            },
            "timestampLabel": {
              "ar": "جرد درج المريض",
              "en": "Patient Cassette Audit"
            },
            "evidenceSummary": {
              "ar": "بقاء العبوة الوريدية في الدرج مع عدم إيقاف الطلب إلكترونياً كاد يؤدي لإعطاء مزدوج لولا يقظة الممرض في الفحص الثلاثي.",
              "en": "Leaving the old IV bag in the drawer while both orders stayed active nearly caused a duplicate administration."
            },
            "deductionNote": {
              "ar": "تحدث مع د. ياسر ثم اعرض كشف القضية على د. نور.",
              "en": "Speak with Dr. Yasser, then present your final reveal to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c7-clue-cart-step-1",
              "prompt": {
                "ar": "احتوى درج المريض على العبوة الوريدية من توزيع الصباح الباكر إلى جانب الكبسولة الفموية الجديدة، مع ملاحظة تليفونية غير موثقة في السجل الرسمي!",
                "en": "The drawer still contained the morning IV bag alongside the newly delivered oral tablet because the verbal step-down note was never reconciled in the chart!"
              },
              "hint": {
                "ar": "تحدث مع د. ياسر ثم اعرض كشف القضية على د. نور.",
                "en": "Speak with Dr. Yasser, then present your final reveal to Dr. Nour."
              },
              "options": [
                {
                  "id": "c7-clue-cart-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "بقاء العبوة الوريدية في الدرج مع عدم إيقاف الطلب إلكترونياً كاد يؤدي لإعطاء مزدوج لولا يقظة الممرض في الفحص الثلاثي.",
                    "en": "Leaving the old IV bag in the drawer while both orders stayed active nearly caused a duplicate administration."
                  }
                },
                {
                  "id": "c7-clue-cart-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "بقاء العبوة الوريدية في الدرج مع عدم إيقاف الطلب إلكترونياً كاد يؤدي لإعطاء مزدوج لولا يقظة الممرض في الفحص الثلاثي.",
            "en": "Leaving the old IV bag in the drawer while both orders stayed active nearly caused a duplicate administration."
          }
        }
      ],
      "nodes": {
        "pharmacistYasser_start": {
          "id": "pharmacistYasser_start",
          "speaker": "pharmacistYasser",
          "targetNpc": "pharmacistYasser",
          "objectiveHint": {
            "ar": "افحص طرفية سجل الأدوية MAR (القرينة 1) لفتح عربة تحضير الأدوية (القرينة 2)، ثم حاور د. ياسر ود. نور.",
            "en": "Inspect the MAR Audit Terminal (Clue 1) to unlock the Medication Prep Cart (Clue 2), then speak with Dr. Yasser and Dr. Nour."
          },
          "dialogue": {
            "ar": "يقظة التمريض قبل الإعطاء أنقذت الموقف! ما الإجراء الصحيح عند ملاحظة طلبين متداخلين (وريدي وفموي) لنفس الفئة الدوائية في سجل MAR؟",
            "en": "Nursing vigilance caught this right in time! What is the required procedure when two overlapping orders (IV and oral) appear on the MAR?"
          },
          "choices": [
            {
              "id": "pharmacistYasser_start_c1",
              "label": {
                "ar": "إيقاف الإعطاء مؤقتاً (Hold)، والتواصل مع الطبيب والصيدلية لتأكيد الخطة المحدثة وإلغاء الطلب القديم رسمياً وإعادة العبوة الملغاة للصيدلية",
                "en": "Hold administration, clarify with the prescriber and pharmacist to formally discontinue the superseded order, and return the discontinued IV dose to pharmacy"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تصرف آمن ودقيق! لا يجوز تخمين أي الطلبين هو المقصود دون توثيق رسمي واضح في السجل.",
                "en": "Safe, precise action! Never guess between overlapping orders without formal reconciliation in the MAR."
              },
              "rationale": {
                "ar": "يقظة رائعة! عند التحويل من الوريدي إلى الفموي أو تعديل الخطة العلاجية، يجب التأكد من إيقاف الطلب السابق رسمياً (Discontinue Old Order) وتحديث التوقيت لمنع ازدواجية الإعطاء.",
                "en": "Great catch! Whenever therapy is transitioned from IV to oral, the superseded order must be formally discontinued and start times reconciled to prevent duplicate doses."
              }
            },
            {
              "id": "pharmacistYasser_start_c2",
              "label": {
                "ar": "إعطاء الدواءين معاً لأن كليهما ظاهر في الشاشة",
                "en": "Administer both medications since both appear on the screen"
              },
              "nextNodeId": "pharmacistYasser_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "خطر ازدواجية علاجية! التفكير النقدي التمريضي يقتضي دائماً الاستفسار عند وجود تداخل واضح.",
                "en": "Duplicate therapy hazard! Critical nursing judgment always requires clarifying overlapping orders."
              },
              "rationale": {
                "ar": "يقظة رائعة! عند التحويل من الوريدي إلى الفموي أو تعديل الخطة العلاجية، يجب التأكد من إيقاف الطلب السابق رسمياً (Discontinue Old Order) وتحديث التوقيت لمنع ازدواجية الإعطاء.",
                "en": "Great catch! Whenever therapy is transitioned from IV to oral, the superseded order must be formally discontinued and start times reconciled to prevent duplicate doses."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص طرفية سجل الأدوية MAR (القرينة 1) لفتح عربة تحضير الأدوية (القرينة 2)، ثم حاور د. ياسر ود. نور.",
            "en": "Inspect the MAR Audit Terminal (Clue 1) to unlock the Medication Prep Cart (Clue 2), then speak with Dr. Yasser and Dr. Nour."
          },
          "dialogue": {
            "ar": "ما استنتاجك النهائي في القضية السابعة حول سبب ظهور الازدواجية في سجل إعطاء الأدوية؟",
            "en": "What is your final reveal for Case 7 explaining why the Medication Administration Record showed duplicate active orders?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "أُدخل طلب التحويل الفموي كطلب منفصل دون إيقاف الطلب الوريدي السابق في النظام ودون سحب العبوة الوريدية القديمة من درج العربة",
                "en": "The oral step-down order was entered as a separate order without discontinuing the prior IV order or removing the old IV bag from the medication cassette"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "استنتاج سليم 100%! تم تفعيل بروتوكول الربط التلقائي عند التحويل من الوريدي إلى الفموي.",
                "en": "100% accurate reveal! Linked IV-to-PO order sets have now been enforced."
              },
              "rationale": {
                "ar": "يقظة رائعة! عند التحويل من الوريدي إلى الفموي أو تعديل الخطة العلاجية، يجب التأكد من إيقاف الطلب السابق رسمياً (Discontinue Old Order) وتحديث التوقيت لمنع ازدواجية الإعطاء.",
                "en": "Great catch! Whenever therapy is transitioned from IV to oral, the superseded order must be formally discontinued and start times reconciled to prevent duplicate doses."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "عطل في شاشة العرض جعل السطر يتكرر بصرياً فقط",
                "en": "A monitor display glitch merely duplicated the text visually"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة: كان هناك طلبان منفصلان فعلياً وعبوتان في درج المريض.",
                "en": "Check your Evidence Journal: Two separate orders and both physical dosage forms were present."
              },
              "rationale": {
                "ar": "يقظة رائعة! عند التحويل من الوريدي إلى الفموي أو تعديل الخطة العلاجية، يجب التأكد من إيقاف الطلب السابق رسمياً (Discontinue Old Order) وتحديث التوقيت لمنع ازدواجية الإعطاء.",
                "en": "Great catch! Whenever therapy is transitioned from IV to oral, the superseded order must be formally discontinued and start times reconciled to prevent duplicate doses."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص طرفية سجل الأدوية MAR (القرينة 1) لفتح عربة تحضير الأدوية (القرينة 2)، ثم حاور د. ياسر ود. نور.",
        "en": "Inspect the MAR Audit Terminal (Clue 1) to unlock the Medication Prep Cart (Clue 2), then speak with Dr. Yasser and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "يقظة رائعة! عند التحويل من الوريدي إلى الفموي أو تعديل الخطة العلاجية، يجب التأكد من إيقاف الطلب السابق رسمياً (Discontinue Old Order) وتحديث التوقيت لمنع ازدواجية الإعطاء.",
        "en": "Great catch! Whenever therapy is transitioned from IV to oral, the superseded order must be formally discontinued and start times reconciled to prevent duplicate doses."
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
      "id": "mm-case-8-ward-outbreak-timeline",
      "missionIndex": 8,
      "requiredMissionId": "mm-case-7-confusing-med-record",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 7: لغز سجل الأدوية المربك (The Confusing Medication Record)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 7: The Confusing Medication Record\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 8: لغز التسلسل الزمني لتفشي الجناح (The Ward Outbreak Timeline)",
        "en": "Case 8: The Ward Outbreak Timeline"
      },
      "subtitle": {
        "ar": "تتبع خريطة الانتقال الزمني والمكاني لثلاث حالات متتالية في الجناح ب (حالة وبائية تعليمية)",
        "en": "Reconstruct the spatiotemporal timeline linking three consecutive cluster cases in Ward B"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #8",
        "en": "Clinical Mystery Case #8"
      },
      "badgeIcon": "📈",
      "badgeTitle": {
        "ar": "📈 محقق القضية 8: محلل الخط الزمني للتفشي",
        "en": "📈 Case 8 Solved: Outbreak Timeline Epidemiologist"
      },
      "primaryNpc": "nurseSalma",
      "briefing": {
        "ar": "ظهرت 3 حالات متتالية تحمل البصمة البكتيرية نفسها في الغرف 401 ثم 403 ثم 405 خلال 72 ساعة، رغم عدم وجود تلامس مباشر بين المرضى الثلاثة! حلل لوحة التسلسل الزمني وسجل حركة الغرف لكشف الرابط المشترك.",
        "en": "Three cases sharing an identical bacterial fingerprint appeared sequentially in Rooms 401, 403, and 405 over 72 hours, even though the patients never met! Analyze the Outbreak Timeline Board and Room Movement Log to find the common link."
      },
      "initialNodeId": "nurseSalma_start",
      "requirePropsSolvedBeforeNodeId": "nurseSalma_start",
      "interactiveProps": [
        {
          "id": "c8-clue-timeline",
          "name": {
            "ar": "خريطة تقاطع مسارات المرضى الثلاثة",
            "en": "Patient Movement Overlap Matrix"
          },
          "stationLabel": {
            "ar": "قرينة 1: لوحة الخط الزمني للتفشي (72 ساعة)",
            "en": "Clue 1: 72-Hour Outbreak Timeline Board"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 14251782,
          "accentColor": 16498468,
          "iconEmoji": "🗺️",
          "shape": "evidence_board",
          "rewardItem": {
            "id": "item-c8-timeline-map",
            "icon": "🗺️",
            "label": {
              "ar": "قرينة 1: تقاطع الحالات الثلاث في غرفة الإجراءات 2",
              "en": "Clue 1: Shared Visit to Procedure Bay 2"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-08 • CLUE A",
            "clueTitle": {
              "ar": "خريطة تقاطع مسارات المرضى الثلاثة",
              "en": "Patient Movement Overlap Matrix"
            },
            "sourceLocation": {
              "ar": "لوحة التقصي الوبائي",
              "en": "Epidemiology Timeline Board"
            },
            "timestampLabel": {
              "ar": "سجل حركة المرضى",
              "en": "Patient Movement Registry"
            },
            "evidenceSummary": {
              "ar": "القاسم المشترك الوحيد بين المرضى الثلاثة هو استخدام غرفة الإجراءات الصغرى رقم 2 بالتتابع صباح اليوم الأول.",
              "en": "The single common intersection among all three patients was sequential use of Minor Procedure Bay 2 on Day 1."
            },
            "deductionNote": {
              "ar": "افحص الآن سجل التطهير البيئي لغرفة الإجراءات رقم 2 لمعرفة ماذا حدث بين المواعيد!",
              "en": "Now inspect the Environmental Cleaning Terminal to see what happened between those three appointments!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c8-clue-timeline-step-1",
              "prompt": {
                "ar": "رغم أن المرضى أقاموا في غرف منفصلة (401، 403، 405)، يكشف الخط الزمني أن الثلاثة مروا جميعاً عبر \"غرفة الإجراءات الصغرى رقم 2\" في اليوم الأول بين الساعة 10:00 و11:30 صباحاً!",
                "en": "Although housed in separate rooms (401, 403, 405), the timeline reveals all three patients passed through \"Minor Procedure Bay 2\" on Day 1 between 10:00 AM and 11:30 AM!"
              },
              "hint": {
                "ar": "افحص الآن سجل التطهير البيئي لغرفة الإجراءات رقم 2 لمعرفة ماذا حدث بين المواعيد!",
                "en": "Now inspect the Environmental Cleaning Terminal to see what happened between those three appointments!"
              },
              "options": [
                {
                  "id": "c8-clue-timeline-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "القاسم المشترك الوحيد بين المرضى الثلاثة هو استخدام غرفة الإجراءات الصغرى رقم 2 بالتتابع صباح اليوم الأول.",
                    "en": "The single common intersection among all three patients was sequential use of Minor Procedure Bay 2 on Day 1."
                  }
                },
                {
                  "id": "c8-clue-timeline-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "القاسم المشترك الوحيد بين المرضى الثلاثة هو استخدام غرفة الإجراءات الصغرى رقم 2 بالتتابع صباح اليوم الأول.",
            "en": "The single common intersection among all three patients was sequential use of Minor Procedure Bay 2 on Day 1."
          }
        },
        {
          "id": "c8-clue-cleaning-log",
          "name": {
            "ar": "تدقيق فواصل التطهير بين الحالات في غرفة الإجراءات 2",
            "en": "Turnover Disinfection Interval Audit"
          },
          "stationLabel": {
            "ar": "قرينة 2: سجل التطهير البيئي ووقت التلامس",
            "en": "Clue 2: Terminal Cleaning & Contact-Time Log"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 889992,
          "accentColor": 3003583,
          "iconEmoji": "🧽",
          "shape": "mar_audit_terminal",
          "requiresPropId": "c8-clue-timeline",
          "rewardItem": {
            "id": "item-c8-contact-time",
            "icon": "🧽",
            "label": {
              "ar": "قرينة 2: تخطي وقت التلامس الرطب للمطهر بين الحالات",
              "en": "Clue 2: Skipped Disinfectant Contact Time"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-08 • CLUE B",
            "clueTitle": {
              "ar": "تدقيق فواصل التطهير بين الحالات في غرفة الإجراءات 2",
              "en": "Turnover Disinfection Interval Audit"
            },
            "sourceLocation": {
              "ar": "غرفة الإجراءات الصغرى 2",
              "en": "Minor Procedure Bay 2"
            },
            "timestampLabel": {
              "ar": "سجل التطهير البيئي",
              "en": "Environmental Hygiene Log"
            },
            "evidenceSummary": {
              "ar": "إدخال المرضى بالتتابع خلال دقيقتين دون الالتزام بوقت التلامس الرطب للمطهر أبقى البكتيريا حية على حواف سرير الفحص.",
              "en": "Rushing 2-minute turnovers without observing disinfectant wet contact time left viable bacteria on the exam couch rails."
            },
            "deductionNote": {
              "ar": "تحدث مع م. سلمى ثم اعرض كشف القضية على د. نور.",
              "en": "Speak with Nurse Salma, then present your reveal to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c8-clue-cleaning-log-step-1",
              "prompt": {
                "ar": "يكشف السجل أن الفاصل بين خروج المريض الأول ودخول الثاني كان دقيقتين فقط؛ تم مسح السرير سريعاً بالماء دون استخدام المطهر المعتمد أو تركه لوقت التلامس اللازم (Wet Contact Time)!",
                "en": "The log shows only a 2-minute gap between patients; the exam couch rails were wiped dry immediately without applying approved disinfectant for its required wet contact time!"
              },
              "hint": {
                "ar": "تحدث مع م. سلمى ثم اعرض كشف القضية على د. نور.",
                "en": "Speak with Nurse Salma, then present your reveal to Dr. Nour."
              },
              "options": [
                {
                  "id": "c8-clue-cleaning-log-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "إدخال المرضى بالتتابع خلال دقيقتين دون الالتزام بوقت التلامس الرطب للمطهر أبقى البكتيريا حية على حواف سرير الفحص.",
                    "en": "Rushing 2-minute turnovers without observing disinfectant wet contact time left viable bacteria on the exam couch rails."
                  }
                },
                {
                  "id": "c8-clue-cleaning-log-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "إدخال المرضى بالتتابع خلال دقيقتين دون الالتزام بوقت التلامس الرطب للمطهر أبقى البكتيريا حية على حواف سرير الفحص.",
            "en": "Rushing 2-minute turnovers without observing disinfectant wet contact time left viable bacteria on the exam couch rails."
          }
        }
      ],
      "nodes": {
        "nurseSalma_start": {
          "id": "nurseSalma_start",
          "speaker": "nurseSalma",
          "targetNpc": "nurseSalma",
          "objectiveHint": {
            "ar": "افحص لوحة الخط الزمني للتفشي (القرينة 1) لفتح سجل حركة الأسرة والتنظيف (القرينة 2)، ثم حاور م. سلمى ود. نور.",
            "en": "Inspect the Outbreak Timeline Board (Clue 1) to unlock the Room Turnover Log (Clue 2), then speak with Nurse Salma and Dr. Nour."
          },
          "dialogue": {
            "ar": "اكتشاف مهم جداً! ما القاعدة التي يجب تطبيقها بين كل مريض وآخر في غرف الفحص والإجراءات المشتركة؟",
            "en": "Crucial discovery! What rule must we enforce between every patient in shared exam and procedure bays?"
          },
          "choices": [
            {
              "id": "nurseSalma_start_c1",
              "label": {
                "ar": "عدم إدخال المريض التالي قبل إتمام تطهير جميع الأسطح عالية اللمس بالمطهر المعتمد والانتظار حتى انتهاء وقت التلامس الرطب كاملاً",
                "en": "Never room the next patient until all high-touch surfaces are wiped with approved disinfectant and the full wet contact time has elapsed"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "صحيح تماماً! المطهرات تحتاج وقت تلامس رطب (Wet Contact Time) محدد للقضاء الفعلي على الميكروبات.",
                "en": "Spot on! Disinfectants require their full specified wet contact time to inactivate pathogens."
              },
              "rationale": {
                "ar": "تحليل وبائي ممتاز! التسرع في تسكين غرفة الملاحظة المشتركة بين الحالات الثلاث دون إتمام التطهير الختامي الكامل (Terminal Cleaning) ووقت التلامس اللازم للمطهر كان الحلقة المفقودة.",
                "en": "Outstanding epidemiological analysis! Rushing patient turnover through the shared procedure bay without completing full terminal disinfection contact time linked all three cases."
              }
            },
            {
              "id": "nurseSalma_start_c2",
              "label": {
                "ar": "مسح السرير بمنديل ورقي جاف بسرعة بين المرضى",
                "en": "Just wipe the bed with a dry paper towel between patients"
              },
              "nextNodeId": "nurseSalma_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "المسح الجاف لا يقتل البكتيريا بل ينشرها على مساحة أوسع من السطح.",
                "en": "Dry wiping does not kill bacteria and instead spreads organisms across the surface."
              },
              "rationale": {
                "ar": "تحليل وبائي ممتاز! التسرع في تسكين غرفة الملاحظة المشتركة بين الحالات الثلاث دون إتمام التطهير الختامي الكامل (Terminal Cleaning) ووقت التلامس اللازم للمطهر كان الحلقة المفقودة.",
                "en": "Outstanding epidemiological analysis! Rushing patient turnover through the shared procedure bay without completing full terminal disinfection contact time linked all three cases."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص لوحة الخط الزمني للتفشي (القرينة 1) لفتح سجل حركة الأسرة والتنظيف (القرينة 2)، ثم حاور م. سلمى ود. نور.",
            "en": "Inspect the Outbreak Timeline Board (Clue 1) to unlock the Room Turnover Log (Clue 2), then speak with Nurse Salma and Dr. Nour."
          },
          "dialogue": {
            "ar": "ما استنتاجك النهائي في القضية الثامنة حول الرابط الوبائي بين الحالات الثلاث في الجناح؟",
            "en": "What is your final reveal for Case 8 explaining the epidemiological link among the three ward cases?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "تقاطع المرضى الثلاثة في غرفة الإجراءات الصغرى رقم 2 مع تخطي التطهير المعتمد ووقت التلامس الرطب بين المواعيد المتتالية",
                "en": "All three patients sequentially visited Minor Procedure Bay 2 where rushed 2-minute turnovers skipped approved disinfectant wet contact time"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تحقيق وبائي محترف! أغلقت القضية الثامنة وأوقفت سلسلة الانتقال.",
                "en": "Masterful epidemiological investigation! Case 8 is solved and the transmission chain is broken."
              },
              "rationale": {
                "ar": "تحليل وبائي ممتاز! التسرع في تسكين غرفة الملاحظة المشتركة بين الحالات الثلاث دون إتمام التطهير الختامي الكامل (Terminal Cleaning) ووقت التلامس اللازم للمطهر كان الحلقة المفقودة.",
                "en": "Outstanding epidemiological analysis! Rushing patient turnover through the shared procedure bay without completing full terminal disinfection contact time linked all three cases."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "انتقال العدوى عبر وجبات المطبخ المركزي",
                "en": "Transmission occurred through central kitchen meals"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة: الرابط المشترك كان غرفة الإجراءات الصغرى رقم 2 وتخطي وقت التطهير.",
                "en": "Check your Evidence Journal: The common link was Minor Procedure Bay 2 and skipped disinfection contact time."
              },
              "rationale": {
                "ar": "تحليل وبائي ممتاز! التسرع في تسكين غرفة الملاحظة المشتركة بين الحالات الثلاث دون إتمام التطهير الختامي الكامل (Terminal Cleaning) ووقت التلامس اللازم للمطهر كان الحلقة المفقودة.",
                "en": "Outstanding epidemiological analysis! Rushing patient turnover through the shared procedure bay without completing full terminal disinfection contact time linked all three cases."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص لوحة الخط الزمني للتفشي (القرينة 1) لفتح سجل حركة الأسرة والتنظيف (القرينة 2)، ثم حاور م. سلمى ود. نور.",
        "en": "Inspect the Outbreak Timeline Board (Clue 1) to unlock the Room Turnover Log (Clue 2), then speak with Nurse Salma and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "تحليل وبائي ممتاز! التسرع في تسكين غرفة الملاحظة المشتركة بين الحالات الثلاث دون إتمام التطهير الختامي الكامل (Terminal Cleaning) ووقت التلامس اللازم للمطهر كان الحلقة المفقودة.",
        "en": "Outstanding epidemiological analysis! Rushing patient turnover through the shared procedure bay without completing full terminal disinfection contact time linked all three cases."
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
      "id": "mm-case-9-contaminated-equipment",
      "missionIndex": 9,
      "requiredMissionId": "mm-case-8-ward-outbreak-timeline",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 8: لغز التسلسل الزمني لتفشي الجناح (The Ward Outbreak Timeline)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 8: The Ward Outbreak Timeline\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 9: لغز أثر المعدات الملوثة (The Contaminated Equipment Trail)",
        "en": "Case 9: The Contaminated Equipment Trail"
      },
      "subtitle": {
        "ar": "أي أداة تشخيص مشتركة تنقلت بين الأجنحة دون تطهير ونقلت البكتيريا؟",
        "en": "Which shared portable diagnostic device traveled between wards without disinfection?"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #9",
        "en": "Clinical Mystery Case #9"
      },
      "badgeIcon": "🩺",
      "badgeTitle": {
        "ar": "🩺 محقق القضية 9: متتبع تعقيم الأجهزة المشتركة",
        "en": "🩺 Case 9 Solved: Shared Equipment Hygiene Detective"
      },
      "primaryNpc": "labOmar",
      "briefing": {
        "ar": "رغم تطهير الغرف الثابتة، ظهرت حالتان جديدتان في طرفين متباعدين من القسم. يشتبه فريق مكافحة العدوى في \"جهاز محمول مشترك\" يتنقل من سرير لآخر. تتبع الأثر الفلوري وسجل المسحات البيئية!",
        "en": "Even after room disinfection was tightened, two new cases appeared at opposite ends of the unit. IPC suspects a shared portable device moving bed-to-bed. Follow the UV tracer and environmental culture log!"
      },
      "initialNodeId": "labOmar_start",
      "requirePropsSolvedBeforeNodeId": "labOmar_start",
      "interactiveProps": [
        {
          "id": "c9-clue-uv-equip",
          "name": {
            "ar": "فحص الأدوات التشخيصية المشتركة بالأشعة فوق البنفسجية",
            "en": "Shared Diagnostic Equipment UV Inspection"
          },
          "stationLabel": {
            "ar": "قرينة 1: فحص UV لعربة العلامات الحيوية المتنقلة",
            "en": "Clue 1: UV Scan of Rolling Vitals Cart"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 165063,
          "accentColor": 3718648,
          "iconEmoji": "🩺",
          "shape": "equipment_uv_tracer",
          "rewardItem": {
            "id": "item-c9-uv-cuff",
            "icon": "🩺",
            "label": {
              "ar": "قرينة 1: تلوث كفة الضغط ومقياس الأكسجين المشترك",
              "en": "Clue 1: Unwiped Shared BP Cuff & Oximeter"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-09 • CLUE A",
            "clueTitle": {
              "ar": "فحص الأدوات التشخيصية المشتركة بالأشعة فوق البنفسجية",
              "en": "Shared Diagnostic Equipment UV Inspection"
            },
            "sourceLocation": {
              "ar": "عربة العلامات الحيوية المشتركة",
              "en": "Shared Rolling Vitals Cart"
            },
            "timestampLabel": {
              "ar": "فحص المؤشر الفلوري UV",
              "en": "UV Fluorescent Marker Scan"
            },
            "evidenceSummary": {
              "ar": "استُخدمت كفة قياس الضغط ومشبك الأكسجين المشترك بين عدة مرضى متتاليين دون تطهير بين كل استخدام.",
              "en": "The shared blood pressure cuff and pulse oximeter sensor traveled bed-to-bed without disinfection."
            },
            "deductionNote": {
              "ar": "افحص الآن جهاز تحليل المسحات البيئية في المختبر لتأكيد تطابق البكتيريا!",
              "en": "Now inspect the Environmental Swab Analyzer to confirm whether the bacterial isolate matches!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c9-clue-uv-equip-step-1",
              "prompt": {
                "ar": "أظهر الفحص أن حامل عربة العلامات الحيوية نُظف من الخارج، لكن الكفة القماشية لجهاز الضغط ومقبض مقياس الأكسجين النبضي (Pulse Oximeter) لم يُمسحا بالمطهر أبداً بين الغرف!",
                "en": "UV scanning shows the cart frame was wiped, but the inner surface of the shared blood pressure cuff and pulse oximeter clip glow brightly—never disinfected between beds!"
              },
              "hint": {
                "ar": "افحص الآن جهاز تحليل المسحات البيئية في المختبر لتأكيد تطابق البكتيريا!",
                "en": "Now inspect the Environmental Swab Analyzer to confirm whether the bacterial isolate matches!"
              },
              "options": [
                {
                  "id": "c9-clue-uv-equip-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "استُخدمت كفة قياس الضغط ومشبك الأكسجين المشترك بين عدة مرضى متتاليين دون تطهير بين كل استخدام.",
                    "en": "The shared blood pressure cuff and pulse oximeter sensor traveled bed-to-bed without disinfection."
                  }
                },
                {
                  "id": "c9-clue-uv-equip-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "استُخدمت كفة قياس الضغط ومشبك الأكسجين المشترك بين عدة مرضى متتاليين دون تطهير بين كل استخدام.",
            "en": "The shared blood pressure cuff and pulse oximeter sensor traveled bed-to-bed without disinfection."
          }
        },
        {
          "id": "c9-clue-swab-lab",
          "name": {
            "ar": "مطابقة المسحة المأخوذة من كفة الضغط مع حالات الجناح",
            "en": "BP Cuff Swab vs. Patient Isolate Match"
          },
          "stationLabel": {
            "ar": "قرينة 2: نتائج المسحات البيئية للأجهزة المشتركة",
            "en": "Clue 2: Environmental Equipment Swab Results"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 366185,
          "accentColor": 3462041,
          "iconEmoji": "🧫",
          "shape": "lab_analyzer",
          "requiresPropId": "c9-clue-uv-equip",
          "rewardItem": {
            "id": "item-c9-swab-match",
            "icon": "🧫",
            "label": {
              "ar": "قرينة 2: تطابق مسحة كفة الضغط المشتركة مع السلالة",
              "en": "Clue 2: Positive Swab Match on Shared BP Cuff"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-09 • CLUE B",
            "clueTitle": {
              "ar": "مطابقة المسحة المأخوذة من كفة الضغط مع حالات الجناح",
              "en": "BP Cuff Swab vs. Patient Isolate Match"
            },
            "sourceLocation": {
              "ar": "مختبر المسحات البيئية",
              "en": "Environmental Microbiology Lab"
            },
            "timestampLabel": {
              "ar": "تقرير مسحات مكافحة العدوى",
              "en": "IPC Environmental Culture Report"
            },
            "evidenceSummary": {
              "ar": "تطابق بكتيري كامل بين مسحة كفة قياس الضغط المشتركة والحالتين الجديدتين في الجناح.",
              "en": "Complete microbiological match between the shared blood pressure cuff swab and both new ward cases."
            },
            "deductionNote": {
              "ar": "تحدث مع أ. عمر ثم قدم التقرير النهائي لد. نور.",
              "en": "Speak with Omar, then present your final reveal to Dr. Nour."
            }
          },
          "puzzleSteps": [
            {
              "id": "c9-clue-swab-lab-step-1",
              "prompt": {
                "ar": "أثبتت مزرعة المسحة المأخوذة من شريط الفيلكرو لكفة الضغط المشتركة وجود نفس السلالة البكتيرية (تطابق 100%) التي ظهرت لدى المريضين في طرفي الجناح!",
                "en": "Culture of the swab taken from the shared blood pressure cuff closure yielded a 100% matching bacterial strain to both patients at opposite ends of the unit!"
              },
              "hint": {
                "ar": "تحدث مع أ. عمر ثم قدم التقرير النهائي لد. نور.",
                "en": "Speak with Omar, then present your final reveal to Dr. Nour."
              },
              "options": [
                {
                  "id": "c9-clue-swab-lab-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "تطابق بكتيري كامل بين مسحة كفة قياس الضغط المشتركة والحالتين الجديدتين في الجناح.",
                    "en": "Complete microbiological match between the shared blood pressure cuff swab and both new ward cases."
                  }
                },
                {
                  "id": "c9-clue-swab-lab-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "تطابق بكتيري كامل بين مسحة كفة قياس الضغط المشتركة والحالتين الجديدتين في الجناح.",
            "en": "Complete microbiological match between the shared blood pressure cuff swab and both new ward cases."
          }
        }
      ],
      "nodes": {
        "labOmar_start": {
          "id": "labOmar_start",
          "speaker": "labOmar",
          "targetNpc": "labOmar",
          "objectiveHint": {
            "ar": "افحص جهاز التتبع الفلوري للمعدات (القرينة 1) لفتح جهاز تحليل المسحات البيئية (القرينة 2)، ثم حاور أ. عمر ود. نور.",
            "en": "Inspect the Equipment UV Tracer (Clue 1) to unlock the Environmental Swab Analyzer (Clue 2), then speak with Omar and Dr. Nour."
          },
          "dialogue": {
            "ar": "مسحة كفة الضغط قطعت الشك باليقين! كيف نمنع الأجهزة الطبية غير الجراحية (كالسماعات وكفات الضغط ومقاييس الأكسجين) من نقل العدوى؟",
            "en": "The BP cuff swab confirmed it beyond doubt! How do we stop non-critical patient-care equipment from acting as vectors?"
          },
          "choices": [
            {
              "id": "labOmar_start_c1",
              "label": {
                "ar": "تخصيص أدوات فحص منفردة لكل غرفة عزل، واستخدام كفات قابلة للمسح وتطهير جميع الأجهزة المشتركة بمناديل مطهرة معتمدة بعد كل مريض",
                "en": "Dedicate single-patient equipment to isolation rooms, use wipeable cuffs, and disinfect any shared portable device after every single patient use"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "إجراء وقائي مثالي! تخصيص الأدوات وتطهيرها بعد كل مريض يقطع أثر المعدات الملوثة تماماً.",
                "en": "Ideal IPC intervention! Dedicated isolation tools and routine post-use wiping eliminate equipment trails."
              },
              "rationale": {
                "ar": "كشف ممتاز! كفة قياس ضغط الدم القماشية ومسبار الحرارة المشترك على عربة العلامات الحيوية المتنقلة لم يُطهرا بين المرضى. يجب تخصيص أدوات لكل مريض في العزل وتطهير الأجهزة المشتركة بعد كل استخدام.",
                "en": "Great detective work! The shared blood pressure cuff and thermometer probe on the rolling vitals cart were used bed-to-bed without wiping. Always dedicate equipment for isolation rooms and disinfect shared devices after every patient."
              }
            },
            {
              "id": "labOmar_start_c2",
              "label": {
                "ar": "تطهير عربة العلامات الحيوية مرة واحدة فقط في نهاية الأسبوع",
                "en": "Disinfect the vitals cart only once at the end of each week"
              },
              "nextNodeId": "labOmar_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "التطهير الأسبوعي غير كافٍ إطلاقاً؛ يجب تطهير الأداة المشتركة بين كل مريض وآخر.",
                "en": "Weekly wiping leaves dozens of patients exposed; shared equipment must be disinfected between every patient."
              },
              "rationale": {
                "ar": "كشف ممتاز! كفة قياس ضغط الدم القماشية ومسبار الحرارة المشترك على عربة العلامات الحيوية المتنقلة لم يُطهرا بين المرضى. يجب تخصيص أدوات لكل مريض في العزل وتطهير الأجهزة المشتركة بعد كل استخدام.",
                "en": "Great detective work! The shared blood pressure cuff and thermometer probe on the rolling vitals cart were used bed-to-bed without wiping. Always dedicate equipment for isolation rooms and disinfect shared devices after every patient."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص جهاز التتبع الفلوري للمعدات (القرينة 1) لفتح جهاز تحليل المسحات البيئية (القرينة 2)، ثم حاور أ. عمر ود. نور.",
            "en": "Inspect the Equipment UV Tracer (Clue 1) to unlock the Environmental Swab Analyzer (Clue 2), then speak with Omar and Dr. Nour."
          },
          "dialogue": {
            "ar": "ما كشفك النهائي للقضية التاسعة حول كيفية انتقال السلالة بين طرفي الجناح المتباعدين؟",
            "en": "What is your final reveal for Case 9 explaining how the strain traveled between opposite ends of the unit?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "انتقلت السلالة عبر كفة قياس الضغط ومقياس الأكسجين على عربة العلامات الحيوية المتنقلة التي استُخدمت بين المرضى دون تطهير",
                "en": "The strain traveled on the shared blood pressure cuff and pulse oximeter clip on the rolling vitals cart, which moved bed-to-bed without disinfection"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "تحقيق رائع! أغلقت القضية التاسعة وبقيت أمامك القضية الختامية الكبرى.",
                "en": "Superb detective work! Case 9 is solved—now only the Grand Finale Case remains."
              },
              "rationale": {
                "ar": "كشف ممتاز! كفة قياس ضغط الدم القماشية ومسبار الحرارة المشترك على عربة العلامات الحيوية المتنقلة لم يُطهرا بين المرضى. يجب تخصيص أدوات لكل مريض في العزل وتطهير الأجهزة المشتركة بعد كل استخدام.",
                "en": "Great detective work! The shared blood pressure cuff and thermometer probe on the rolling vitals cart were used bed-to-bed without wiping. Always dedicate equipment for isolation rooms and disinfect shared devices after every patient."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "العدوى انتقلت عبر نوافذ الجناح المغلقة",
                "en": "The bacteria floated through closed exterior windows"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "راجع سجل الأدلة: المسحة الإيجابية وفحص UV أثبتا أن كفة الضغط المشتركة هي الناقل.",
                "en": "Check your Evidence Journal: Both UV scanning and culture swabs pinpointed the shared BP cuff."
              },
              "rationale": {
                "ar": "كشف ممتاز! كفة قياس ضغط الدم القماشية ومسبار الحرارة المشترك على عربة العلامات الحيوية المتنقلة لم يُطهرا بين المرضى. يجب تخصيص أدوات لكل مريض في العزل وتطهير الأجهزة المشتركة بعد كل استخدام.",
                "en": "Great detective work! The shared blood pressure cuff and thermometer probe on the rolling vitals cart were used bed-to-bed without wiping. Always dedicate equipment for isolation rooms and disinfect shared devices after every patient."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص جهاز التتبع الفلوري للمعدات (القرينة 1) لفتح جهاز تحليل المسحات البيئية (القرينة 2)، ثم حاور أ. عمر ود. نور.",
        "en": "Inspect the Equipment UV Tracer (Clue 1) to unlock the Environmental Swab Analyzer (Clue 2), then speak with Omar and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "كشف ممتاز! كفة قياس ضغط الدم القماشية ومسبار الحرارة المشترك على عربة العلامات الحيوية المتنقلة لم يُطهرا بين المرضى. يجب تخصيص أدوات لكل مريض في العزل وتطهير الأجهزة المشتركة بعد كل استخدام.",
        "en": "Great detective work! The shared blood pressure cuff and thermometer probe on the rolling vitals cart were used bed-to-bed without wiping. Always dedicate equipment for isolation rooms and disinfect shared devices after every patient."
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
      "id": "mm-case-10-final-connect-evidence",
      "missionIndex": 10,
      "requiredMissionId": "mm-case-9-contaminated-equipment",
      "unlockRequirementText": {
        "ar": "أكمل «القضية 9: لغز أثر المعدات الملوثة (The Contaminated Equipment Trail)» أولاً لفتح هذه المرحلة.",
        "en": "Complete \"Case 9: The Contaminated Equipment Trail\" first to unlock this stage."
      },
      "accentHex": 8141549,
      "title": {
        "ar": "القضية 10 (الختامية): ربط جميع الأدلة وبناء درع المستشفى الآمن (Connect the Evidence)",
        "en": "Case 10 (Grand Finale): The Final Case — Connect the Evidence"
      },
      "subtitle": {
        "ar": "ربط حلقات القضايا التسع السابقة في ميثاق متكامل لسلامة المرضى وحوكمة المضادات الحيوية",
        "en": "Synthesize findings across laboratory, pharmacy, nursing handover, and IPC into a unified Hospital Safety Charter"
      },
      "categoryBadge": {
        "ar": "قضية تحقيق سريري #10",
        "en": "Clinical Mystery Case #10"
      },
      "badgeIcon": "🏆",
      "badgeTitle": {
        "ar": "🏆 كبير محققي الألغاز الطبية (بطل الموسم الأول)",
        "en": "🏆 Master Clinical Detective (Season 1 Champion)"
      },
      "primaryNpc": "pharmacistYasser",
      "briefing": {
        "ar": "في القضية الختامية للموسم الأول، اجتمع قادة المختبر والصيدلية والتمريض ومكافحة العدوى. مهمتك هي ربط الأدلة من جميع المحطات لصياغة \"الدرع الرباعي لسلامة المرضى وحوكمة المضادات الحيوية\" ومنع الأخطاء المتسلسلة قبل وقوعها.",
        "en": "In the Season 1 Grand Finale, nursing, laboratory, pharmacy, and IPC leads convene. Connect the evidence across the Master Investigation Board and Stewardship Kiosk to establish the Four-Pillar Hospital Safety & Stewardship Charter."
      },
      "initialNodeId": "pharmacistYasser_start",
      "requirePropsSolvedBeforeNodeId": "pharmacistYasser_start",
      "interactiveProps": [
        {
          "id": "c10-clue-master-board",
          "name": {
            "ar": "نموذج الجبن السويسري (Swiss Cheese Model) لسلامة المرضى",
            "en": "Swiss Cheese Root-Cause Synthesis Across Cases 1–9"
          },
          "stationLabel": {
            "ar": "قرينة 1: اللوحة المركزية لربط الأدلة (القضايا 1–9)",
            "en": "Clue 1: Master Evidence Synthesis Board (Cases 1–9)"
          },
          "position": [
            -2.6,
            0,
            -2
          ],
          "color": 8141549,
          "accentColor": 12616956,
          "iconEmoji": "🧩",
          "shape": "evidence_board",
          "rewardItem": {
            "id": "item-c10-swiss-cheese",
            "icon": "🧩",
            "label": {
              "ar": "قرينة 1: خريطة ربط الحلقات الأربع لسلامة المرضى",
              "en": "Clue 1: Four-Layer Root-Cause Map"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-10 • MASTER CLUE A",
            "clueTitle": {
              "ar": "نموذج الجبن السويسري (Swiss Cheese Model) لسلامة المرضى",
              "en": "Swiss Cheese Root-Cause Synthesis Across Cases 1–9"
            },
            "sourceLocation": {
              "ar": "غرفة عمليات الجودة وسلامة المرضى",
              "en": "Clinical Safety Command Center"
            },
            "timestampLabel": {
              "ar": "تجميع القضايا 1 إلى 9",
              "en": "Cases 1–9 Synthesis Archive"
            },
            "evidenceSummary": {
              "ar": "ربط الأدلة يثبت أن حوكمة المضادات الحيوية تعتمد على تكامل المختبر والتمريض والصيدلية ومكافحة العدوى معاً.",
              "en": "Connecting the evidence proves antimicrobial stewardship depends on laboratory, nursing, pharmacy, and IPC working as one closed loop."
            },
            "deductionNote": {
              "ar": "افحص الآن منصة ميثاق الحوكمة والسلامة (القرينة 2) لاعتماد خطة الوقاية الشاملة!",
              "en": "Now inspect the Hospital Safety & Stewardship Kiosk (Clue 2) to ratify the prevention charter!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c10-clue-master-board-step-1",
              "prompt": {
                "ar": "تُظهر اللوحة أن الحوادث السريرية لا تقع بسبب خطأ فردي واحد، بل عندما تتطابق أربع ثغرات: (1) خطأ ما قبل التحليل بالعينة، (2) فجوة توثيق الحساسية/MAR، (3) نقص تسليم SBAR، (4) ثغرة تطهير الأيدي أو المعدات المشتركة.",
                "en": "The Master Board reveals how clinical incidents align across four system layers: (1) Pre-analytical specimen/timing errors, (2) Unreconciled allergy/MAR records, (3) Incomplete SBAR handovers, and (4) Shared surface/equipment IPC gaps."
              },
              "hint": {
                "ar": "افحص الآن منصة ميثاق الحوكمة والسلامة (القرينة 2) لاعتماد خطة الوقاية الشاملة!",
                "en": "Now inspect the Hospital Safety & Stewardship Kiosk (Clue 2) to ratify the prevention charter!"
              },
              "options": [
                {
                  "id": "c10-clue-master-board-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "ربط الأدلة يثبت أن حوكمة المضادات الحيوية تعتمد على تكامل المختبر والتمريض والصيدلية ومكافحة العدوى معاً.",
                    "en": "Connecting the evidence proves antimicrobial stewardship depends on laboratory, nursing, pharmacy, and IPC working as one closed loop."
                  }
                },
                {
                  "id": "c10-clue-master-board-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "ربط الأدلة يثبت أن حوكمة المضادات الحيوية تعتمد على تكامل المختبر والتمريض والصيدلية ومكافحة العدوى معاً.",
            "en": "Connecting the evidence proves antimicrobial stewardship depends on laboratory, nursing, pharmacy, and IPC working as one closed loop."
          }
        },
        {
          "id": "c10-clue-charter-kiosk",
          "name": {
            "ar": "الركائز الأربع لدرع المستشفى الآمن",
            "en": "The Four Pillars of the Hospital Safety Shield"
          },
          "stationLabel": {
            "ar": "قرينة 2: منصة ميثاق الحوكمة وسلامة المرضى",
            "en": "Clue 2: Hospital Safety & Stewardship Charter Kiosk"
          },
          "position": [
            2.6,
            0,
            -2
          ],
          "color": 366185,
          "accentColor": 3462041,
          "iconEmoji": "🛡️",
          "shape": "stewardship_kiosk",
          "requiresPropId": "c10-clue-master-board",
          "rewardItem": {
            "id": "item-c10-safety-charter",
            "icon": "🛡️",
            "label": {
              "ar": "قرينة 2: وثيقة الدرع الرباعي للحوكمة والسلامة",
              "en": "Clue 2: Four-Pillar Safety Charter"
            }
          },
          "mysteryClueConfig": {
            "clueCode": "CASE-10 • MASTER CLUE B",
            "clueTitle": {
              "ar": "الركائز الأربع لدرع المستشفى الآمن",
              "en": "The Four Pillars of the Hospital Safety Shield"
            },
            "sourceLocation": {
              "ar": "منصة الحوكمة المعتمدة",
              "en": "Stewardship Charter Kiosk"
            },
            "timestampLabel": {
              "ar": "لجنة سلامة المرضى وحوكمة المضادات",
              "en": "Patient Safety & AMS Committee"
            },
            "evidenceSummary": {
              "ar": "اعتماد الضوابط الأربعة يغلق جميع الثغرات التي كُشفت في القضايا التسع السابقة.",
              "en": "Ratifying the four systemic controls closes every vulnerability uncovered across Cases 1 through 9."
            },
            "deductionNote": {
              "ar": "تحدث مع د. ياسر ثم قدم المرافعة الختامية لد. نور لإتمام الموسم الأول!",
              "en": "Speak with Dr. Yasser, then deliver the Grand Finale reveal to Dr. Nour!"
            }
          },
          "puzzleSteps": [
            {
              "id": "c10-clue-charter-kiosk-step-1",
              "prompt": {
                "ar": "1) سحب المزرعة قبل المضاد والترميز بجانب السرير، 2) التوفيق الإلزامي للحساسية وسجل MAR، 3) تحديث المزارع المعلقة في SBAR كل شفت، 4) نظافة اليدين وتطهير الأجهزة المشتركة مع احترام وقت التلامس.",
                "en": "1) Pre-antibiotic cultures & bedside labeling, 2) Mandatory allergy & MAR reconciliation, 3) Live pending-culture review in SBAR handovers, and 4) Hand hygiene plus shared-equipment disinfection with full contact time."
              },
              "hint": {
                "ar": "تحدث مع د. ياسر ثم قدم المرافعة الختامية لد. نور لإتمام الموسم الأول!",
                "en": "Speak with Dr. Yasser, then deliver the Grand Finale reveal to Dr. Nour!"
              },
              "options": [
                {
                  "id": "c10-clue-charter-kiosk-opt-correct",
                  "label": {
                    "ar": "توثيق هذه القرينة في سجل الأدلة وتطبيق مبدأ السلامة السريرية المرتبط بها",
                    "en": "Log this forensic clue in the Evidence Journal and apply its clinical safety principle"
                  },
                  "isCorrect": true,
                  "feedback": {
                    "ar": "اعتماد الضوابط الأربعة يغلق جميع الثغرات التي كُشفت في القضايا التسع السابقة.",
                    "en": "Ratifying the four systemic controls closes every vulnerability uncovered across Cases 1 through 9."
                  }
                },
                {
                  "id": "c10-clue-charter-kiosk-opt-wrong",
                  "label": {
                    "ar": "تجاهل هذا الدليل الميداني وإغلاق التحقيق دون تدقيق السجلات",
                    "en": "Ignore this field evidence and close the case without auditing the records"
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
            "ar": "اعتماد الضوابط الأربعة يغلق جميع الثغرات التي كُشفت في القضايا التسع السابقة.",
            "en": "Ratifying the four systemic controls closes every vulnerability uncovered across Cases 1 through 9."
          }
        }
      ],
      "nodes": {
        "pharmacistYasser_start": {
          "id": "pharmacistYasser_start",
          "speaker": "pharmacistYasser",
          "targetNpc": "pharmacistYasser",
          "objectiveHint": {
            "ar": "افحص اللوحة المركزية لربط الأدلة (القرينة 1) لفتح منصة ميثاق الحوكمة والسلامة (القرينة 2)، ثم حاور د. ياسر وأتمم الختام مع د. نور.",
            "en": "Inspect the Master Evidence Synthesis Board (Clue 1) to unlock the Hospital Stewardship Charter Kiosk (Clue 2), then speak with Dr. Yasser and Dr. Nour."
          },
          "dialogue": {
            "ar": "بعد ربط القضايا العشر، كيف تتكامل أدوار التمريض والمختبر والصيدلية في حماية المرضى من مقاومة المضادات الحيوية؟",
            "en": "After connecting all 10 cases, how do nursing, microbiology, and pharmacy unite to protect patients from antimicrobial resistance?"
          },
          "choices": [
            {
              "id": "pharmacistYasser_start_c1",
              "label": {
                "ar": "التمريض يضمن دقة سحب العينة والتحقق من الحساسية ومكافحة العدوى، والمختبر يقدم نتائج حساسية دقيقة، والصيدلية والطب يوجهون العلاج بأمان",
                "en": "Nursing secures bedside ID, pre-dose cultures, allergy checks, and IPC; the lab delivers accurate AST data; and pharmacy/medicine align targeted therapy safely"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "رؤية شاملة وعميقة! هذا التكامل بين التخصصات هو جوهر سلامة المرضى.",
                "en": "Profound interdisciplinary synthesis! That closed loop is the heart of patient safety and stewardship."
              },
              "rationale": {
                "ar": "تهانينا الحارة! لقد حللت جميع القضايا العشر في لعبة \"الألغاز الطبية 3D\" بنجاح، وربطت بين دقة العينات، وسلامة الحساسية والسجلات الدوائية، والتسليم السريري SBAR، ومكافحة العدوى في منظومة متكاملة.",
                "en": "Congratulations! You have solved all 10 cases in Medical Mystery 3D, uniting specimen integrity, allergy & MAR reconciliation, SBAR communication, and infection prevention into a complete safety shield."
              }
            },
            {
              "id": "pharmacistYasser_start_c2",
              "label": {
                "ar": "كل قسم يعمل بمعزل عن الآخر دون مشاركة السجلات",
                "en": "Each department works in isolation without sharing records"
              },
              "nextNodeId": "pharmacistYasser_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "العمل المنعزل هو ما سمح بوقوع الثغرات في القضايا السابقة؛ التواصل المغلق هو الحل.",
                "en": "Siloed workflows caused the gaps in earlier cases; closed-loop collaboration is essential."
              },
              "rationale": {
                "ar": "تهانينا الحارة! لقد حللت جميع القضايا العشر في لعبة \"الألغاز الطبية 3D\" بنجاح، وربطت بين دقة العينات، وسلامة الحساسية والسجلات الدوائية، والتسليم السريري SBAR، ومكافحة العدوى في منظومة متكاملة.",
                "en": "Congratulations! You have solved all 10 cases in Medical Mystery 3D, uniting specimen integrity, allergy & MAR reconciliation, SBAR communication, and infection prevention into a complete safety shield."
              }
            }
          ]
        },
        "investigatorNour_start": {
          "id": "investigatorNour_start",
          "speaker": "investigatorNour",
          "targetNpc": "investigatorNour",
          "objectiveHint": {
            "ar": "افحص اللوحة المركزية لربط الأدلة (القرينة 1) لفتح منصة ميثاق الحوكمة والسلامة (القرينة 2)، ثم حاور د. ياسر وأتمم الختام مع د. نور.",
            "en": "Inspect the Master Evidence Synthesis Board (Clue 1) to unlock the Hospital Stewardship Charter Kiosk (Clue 2), then speak with Dr. Yasser and Dr. Nour."
          },
          "dialogue": {
            "ar": "وصلنا إلى اللحظة الحاسمة في القضية العاشرة: ما الاستنتاج الجامع الذي يربط جميع الأدلة ويحمي المستشفى؟",
            "en": "We have reached the final reveal of Case 10: What master synthesis connects all the evidence to protect our hospital?"
          },
          "choices": [
            {
              "id": "investigatorNour_start_c1",
              "label": {
                "ar": "بناء الدرع الرباعي: (1) سحب المزارع قبل المضاد وترميزها بجانب السرير، (2) توفيق الحساسية وسجل MAR، (3) متابعة المزارع في تسليم SBAR، و(4) تطهير الأيدي والأجهزة المشتركة",
                "en": "Establish the Four-Pillar Shield: (1) pre-antibiotic bedside-labeled cultures, (2) mandatory allergy/MAR reconciliation, (3) SBAR pending-lab tracking, and (4) hand & shared-equipment hygiene"
              },
              "nextNodeId": "END",
              "quality": "optimal",
              "immediateFeedback": {
                "ar": "مرافعة ختامية استثنائية! مبروك إنهاء جميع القضايا العشر في \"الألغاز الطبية 3D\" بدرجة محقق خبير.",
                "en": "Extraordinary Grand Finale reveal! Congratulations on solving all 10 cases in Medical Mystery 3D as a Master Clinical Detective."
              },
              "rationale": {
                "ar": "تهانينا الحارة! لقد حللت جميع القضايا العشر في لعبة \"الألغاز الطبية 3D\" بنجاح، وربطت بين دقة العينات، وسلامة الحساسية والسجلات الدوائية، والتسليم السريري SBAR، ومكافحة العدوى في منظومة متكاملة.",
                "en": "Congratulations! You have solved all 10 cases in Medical Mystery 3D, uniting specimen integrity, allergy & MAR reconciliation, SBAR communication, and infection prevention into a complete safety shield."
              }
            },
            {
              "id": "investigatorNour_start_c2",
              "label": {
                "ar": "الاكتفاء بمعاقبة الأفراد دون إصلاح أنظمة العمل والتوثيق",
                "en": "Blame individuals without fixing clinical workflows or documentation systems"
              },
              "nextNodeId": "investigatorNour_start",
              "quality": "caution",
              "immediateFeedback": {
                "ar": "ثقافة سلامة المرضى الحديثة تركز على إصلاح الأنظمة والضوابط لمنع تكرار الخطأ.",
                "en": "Modern patient safety culture focuses on building resilient system safeguards rather than blaming individuals without fixing workflows."
              },
              "rationale": {
                "ar": "تهانينا الحارة! لقد حللت جميع القضايا العشر في لعبة \"الألغاز الطبية 3D\" بنجاح، وربطت بين دقة العينات، وسلامة الحساسية والسجلات الدوائية، والتسليم السريري SBAR، ومكافحة العدوى في منظومة متكاملة.",
                "en": "Congratulations! You have solved all 10 cases in Medical Mystery 3D, uniting specimen integrity, allergy & MAR reconciliation, SBAR communication, and infection prevention into a complete safety shield."
              }
            }
          ]
        }
      },
      "safeActionDemonstrated": {
        "ar": "افحص اللوحة المركزية لربط الأدلة (القرينة 1) لفتح منصة ميثاق الحوكمة والسلامة (القرينة 2)، ثم حاور د. ياسر وأتمم الختام مع د. نور.",
        "en": "Inspect the Master Evidence Synthesis Board (Clue 1) to unlock the Hospital Stewardship Charter Kiosk (Clue 2), then speak with Dr. Yasser and Dr. Nour."
      },
      "educationalTakeaway": {
        "ar": "تهانينا الحارة! لقد حللت جميع القضايا العشر في لعبة \"الألغاز الطبية 3D\" بنجاح، وربطت بين دقة العينات، وسلامة الحساسية والسجلات الدوائية، والتسليم السريري SBAR، ومكافحة العدوى في منظومة متكاملة.",
        "en": "Congratulations! You have solved all 10 cases in Medical Mystery 3D, uniting specimen integrity, allergy & MAR reconciliation, SBAR communication, and infection prevention into a complete safety shield."
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
