import { CSSProperties, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import Disclaimer from './Disclaimer';
import './GameCenter.css';

export interface GameRegistryItem {
  id: string;
  route: string;
  badgeAr: string;
  badgeEn: string;
  modeAr: string;
  modeEn: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  featuresAr: string[];
  featuresEn: string[];
  controlsAr: string;
  controlsEn: string;
  ctaAr: string;
  ctaEn: string;
  accentColor: string;
  secondaryColor: string;
  visualType: 'simulator3d' | 'nurse3d' | 'mystery3d' | 'lab3d' | 'er3d' | 'escape3d' | 'arcade2d';
  category: 'all' | '3d-simulation' | '2d-arcade';
}

export const GAME_CENTER_REGISTRY: GameRegistryItem[] = [
  {
    id: 'open-health-world', route: '/open-world', badgeAr: 'جديد • عالم مفتوح 3D', badgeEn: 'NEW • 3D OPEN WORLD',
    modeAr: 'استكشاف مدينة صحية ثلاثية الأبعاد', modeEn: 'Third-Person 3D Open World',
    titleAr: 'عالم المدينة الصحية المفتوح', titleEn: 'Open Health World',
    subtitleAr: 'تحرّك بحرية واستكشف المستشفى والصيدلية والأشعة والمعمل والطوارئ', subtitleEn: 'Freely explore the hospital, pharmacy, learning center, and community hub',
    descriptionAr: 'مدينة صحية ثلاثية الأبعاد فيها طرق ومعابر مشاة وإنارة وشخصيات متحركة وسبعة مبانٍ تفاعلية، مع أقسام داخلية ولافتات واضحة وحفظ مكانك وتقدمك.',
    descriptionEn: 'A third-person 3D health campus with roads, crosswalks, streetlights, animated pedestrians, seven interactive buildings, named rooms, and saved exploration progress.',
    featuresAr: ['مدينة صحية بثلاثة أبعاد مع شوارع وممرات وساحة مركزية', 'سبعة مبانٍ تفاعلية تشمل الطوارئ والأشعة والمعمل والصيدلية', 'شخصيات متحركة، جويستك شمالي، وواجهة غامرة مع حفظ التقدم'],
    featuresEn: ['A 3D health campus with roads, crosswalks, sidewalks and a central plaza', 'Seven interactive buildings including emergency, radiology, laboratory and pharmacy', 'Animated pedestrians, left-side joystick, immersive fullscreen and saved progress'],
    controlsAr: 'الكمبيوتر: WASD أو الأسهم + E | الهاتف: جويستك يسار + تفاعل', controlsEn: 'Desktop: WASD / arrows + E | Mobile: left joystick + Interact',
    ctaAr: 'ادخل العالم المفتوح 🌎', ctaEn: 'Enter Open World 🌎', accentColor: '#0ea5e9', secondaryColor: '#34d399', visualType: 'simulator3d', category: '3d-simulation',
  },
  {
    id: 'nurse-academy',
    route: '/nurse-academy',
    badgeAr: 'جديد • 10 سيناريوهات تدريبية 3D',
    badgeEn: 'NEW • 10 Clinical Nursing Scenarios 3D',
    modeAr: 'أكاديمية تدريب تمريضي ثلاثية الأبعاد (WebGL 3D)',
    modeEn: '3D Nursing Education & Safety Academy',
    titleAr: 'أكاديمية التمريض 3D (Nurse Academy)',
    titleEn: 'Nurse Academy 3D',
    subtitleAr: '10 سيناريوهات تفاعلية ثلاثية الأبعاد: التحقق من الهوية، نظافة اليدين، الوقاية، الحساسية، سلامة الدواء، الإنذار المبكر، منع السقوط، ترميز العينات، التوعية بالمضادات، وتسليم SBAR',
    subtitleEn: '10 playable 3D scenarios: patient ID & rapport, WHO 5 Moments, PPE, allergy escalation, medication safety checks, red flags, fall prevention, specimen labeling, antibiotic education & SBAR handover',
    descriptionAr:
      'مركز تدريب تمريضي كرتوني ثلاثي الأبعاد بالكامل مع شخصيات تعبيرية متحركة، قوائم فحص سريرية تفاعلية، وحوارات متفرعة باللغتين العربية والإنجليزية. تدرب على مهارات سلامة المرضى وحوكمة المضادات الحيوية عبر 10 سيناريوهات متكاملة ومستقلة بحفظ سحابي خاص.',
    descriptionEn:
      'An interactive 3D cartoon nursing simulation center featuring expressive animated NPCs, clinical safety checklists, skippable camera fly-ins, and bilingual branching dialogue across 10 complete educational scenarios with independent cloud progress.',
    featuresAr: [
      '10 سيناريوهات قابلة للعب بالكامل تغطي المهارات التمريضية الأساسية وسلامة الأدوية والمضادات الحيوية',
      'قوائم تحقق تمريضية تفاعلية (Checklists) وشاشات علامات حيوية مع تغذية راجعة فورية وملخص ختامي (Debrief)',
      'حركات شخصيات سلسة (مشي، التفاف، إيماءات تفاعلية عند الإجابة)، مؤثرات صوتية اختيارية، ودعم تقليل الحركة',
      'حفظ سحابي مستقل (nurseAcademy) عبر Firebase Auth/Firestore مع دعم وضع الزائر',
    ],
    featuresEn: [
      '10 genuinely playable scenarios covering core nursing safety, IPC, and antimicrobial stewardship skills',
      'Interactive bedside safety checklists, vital-sign red-flag monitors, immediate rationale feedback, and debriefs',
      'Smooth 3D character locomotion, reactive NPC gestures, skippable camera intros, muteable audio & reduced-motion support',
      'Independent cloud progress sync (nurseAcademy) per UID with safe merge and guest fallback',
    ],
    controlsAr: 'الموبايل: عصا التحكم 3D + زر الفحص/التفاعل | الكمبيوتر: WASD أو الأسهم + مفتاح E',
    controlsEn: 'Mobile: 3D Touch Joystick + Inspect/Interact Button | Desktop: WASD / Arrows + E Key',
    ctaAr: 'ادخل أكاديمية التمريض 3D (10 سيناريوهات) 🎓',
    ctaEn: 'Launch Nurse Academy 3D (10 Scenarios) 🎓',
    accentColor: '#0284c7',
    secondaryColor: '#0d9488',
    visualType: 'nurse3d',
    category: '3d-simulation',
  },
  {
    id: 'medical-mystery',
    route: '/medical-mystery',
    badgeAr: 'جديد • 10 قضايا تحقيق + سجل أدلة 3D',
    badgeEn: 'NEW • 10 Investigation Cases + Evidence Journal 3D',
    modeAr: 'لعبة تحقيق وألغاز سريرية ثلاثية الأبعاد (WebGL 3D)',
    modeEn: '3D Story-Rich Clinical Investigation Game',
    titleAr: 'الألغاز الطبية 3D (Medical Mystery)',
    titleEn: 'Medical Mystery 3D',
    subtitleAr: 'حقق في 10 قضايا سريرية متميزة: العينة الخاطئة، تنبيه الحساسية، تفصيلة التسليم المفقودة، ثغرة العدوى، التقرير المتناقض، الميكروب المقاوم، السجل المربك، خط التفشي، أثر المعدات، والقضية الختامية',
    subtitleEn: 'Solve 10 distinct clinical cases: Mislabelled Sample, Allergy Alert, Missing Handover, IPC Gap, Contradictory Lab, Resistant Clue, Confusing MAR, Outbreak Timeline, Equipment Trail & Final Case',
    descriptionAr:
      'لعبة تحقيق قصصية ثلاثية الأبعاد داخل مركز تحقيقات سلامة المرضى. اجمع القرائن المتسلسلة (حيث تفتح القرينة الأولى قفل القرينة الثانية)، راجع «سجل الأدلة واللوحة الجنائية 📓»، استجوب أخصائي المختبر والصيدلي والتمريض، واكشف السبب الجذري في كل قضية.',
    descriptionEn:
      'A story-driven 3D clinical detective game. Follow chained 3D clues where initial findings unlock deeper forensic stations, review your interactive Evidence Journal (📓), interview specialists through branching dialogue, and reveal the systemic root cause in all 10 Season 1 cases.',
    featuresAr: [
      '10 قضايا تحقيق مستقلة ومتنوعة بالكامل (وليست مكررة) مع سلسلة قرائن مترابطة تفتح تباعاً',
      'سجل أدلة تفاعلي (Evidence Journal 📓) يحفظ القرائن المكتشفة ورموز الأدلة واستنتاجات التحقيق',
      'أجهزة فحص ثلاثية الأبعاد تشمل التتبع الفلوري بالأشعة فوق البنفسجية (UV)، تقارير AST، وتدقيق السجلات',
      'حفظ سحابي مستقل (medicalMystery) لتقدم القضايا والقرائن والأوسمة عبر جميع أجهزتك',
    ],
    featuresEn: [
      '10 genuinely distinct playable investigation cases with chained clues that unlock downstream evidence',
      'Interactive Evidence Journal & Clue Board (📓) tracking collected forensic items and deduction hints',
      '3D UV fluorescent surface tracers, barcode printer logs, AST susceptibility analyzers, and SBAR audits',
      'Independent cloud progress sync (medicalMystery) across devices with safe merge and guest support',
    ],
    controlsAr: 'الموبايل: عصا التحكم 3D + زر فحص القرينة + سجل الأدلة 📓 | الكمبيوتر: WASD + E',
    controlsEn: 'Mobile: 3D Touch Joystick + Inspect Clue + Evidence Journal 📓 | Desktop: WASD + E',
    ctaAr: 'ابدأ التحقيق في القضايا العشر 3D 🕵️‍♂️',
    ctaEn: 'Play Medical Mystery 3D (10 Cases) 🕵️‍♂️',
    accentColor: '#7c3aed',
    secondaryColor: '#0891b2',
    visualType: 'mystery3d',
    category: '3d-simulation',
  },
  {
    id: 'medical-life-simulator',
    route: '/medical-simulator',
    badgeAr: 'محدّث • 10 مستويات متدرجة + 5 سيناريوهات 3D',
    badgeEn: 'UPDATED • 10 Campaign Levels + 5 Scenarios 3D',
    modeAr: 'محاكاة سريرية ثلاثية الأبعاد (WebGL 3D)',
    modeEn: '3D Clinical Roleplay & Puzzle Simulation',
    titleAr: 'محاكي الحياة الطبية (Medical Life Simulator 3D)',
    titleEn: 'Medical Life Simulator 3D',
    subtitleAr: 'تجول داخل المستشفى والمختبر والبيئة المجهرية 3D عبر 10 مستويات متدرجة و5 سيناريوهات سريرية',
    subtitleEn: 'Explore the 3D ward, ER, lab, and microscopic arena across 10 progressive levels & 5 clinical scenarios',
    descriptionAr:
      'عالم ثلاثي الأبعاد بالكامل (WebGL 3D) بأسلوب كرتوني منخفض المضلعات. تحكّم بشخصيتك في منظور الشخص الثالث، افحص منصات الأدلة والألغاز ثلاثية الأبعاد، وتفاعل مع الممرضة والطبيب والمريض والصيدلي عبر 10 مستويات متدرجة (تُفتح تباعاً) بالإضافة إلى الـ 5 سيناريوهات الأساسية.',
    descriptionEn:
      'A genuine 3D cartoon medical world built with WebGL perspective rendering. Control your third-person avatar, inspect 3D clue/puzzle stations, interact with 4 NPCs, and progress through 10 unlockable campaign levels plus the 5 core scenarios.',
    featuresAr: [
      '10 مستويات حملة متدرجة القفل (Progressive Unlocking) + 5 سيناريوهات سريرية مفتوحة دائماً',
      'ألغاز وأدلة ثلاثية الأبعاد تفاعلية: شاشة الطوارئ، سجل الحساسية، خزانة المنزل، المختبر، والبيئة المجهرية',
      'تحكم كامل للهاتف (عصا تحكم افتراضية + زر فحص/تفاعل + تدوير الكاميرا باللمس) وللكمبيوتر (WASD + E)',
      'حفظ سحابي آمن لتقدم المستويات عبر أجهزتك عند تسجيل الدخول (أو محلياً في وضع الزائر)',
    ],
    featuresEn: [
      '10 progressive campaign levels with automatic unlock persistence + 5 permanently unlocked core scenarios',
      'Interactive 3D clue & workflow puzzles: ER vitals monitor, allergy chart, home cabinet, lab matching, IPC, & 3D microbe scanner',
      'Mobile-first virtual joystick, touch camera orbit, & desktop WASD + E controls with Low Graphics mode',
      'Cloud progress sync across devices when signed in (with safe local guest fallback)',
    ],
    controlsAr: 'الموبايل: عصا التحكم الافتراضية + زر التفاعل/الفحص | الكمبيوتر: WASD أو الأسهم + مفتاح E',
    controlsEn: 'Mobile: Virtual Joystick + Interact/Inspect Button | Desktop: WASD / Arrows + E Key',
    ctaAr: 'ابدأ المحاكاة والمستويات العشرة 🏥',
    ctaEn: 'Launch 3D Simulator (10 Levels + 5 Scenarios) 🏥',
    accentColor: '#0e9aa7',
    secondaryColor: '#0284c7',
    visualType: 'simulator3d',
    category: '3d-simulation',
  },
  {
    id: 'bacteria-lab',
    route: '/bacteria-lab',
    badgeAr: '4 مهام تحقيق معملي 3D + مجهر تفاعلي',
    badgeEn: '4 Lab Missions 3D + Microscope & AST',
    modeAr: 'تحقيق ميكروبيولوجي ثلاثي الأبعاد (WebGL 3D)',
    modeEn: '3D Microbiology Lab Investigation',
    titleAr: 'مختبر البكتيريا 3D (Bacteria Lab)',
    titleEn: 'Bacteria Lab 3D',
    subtitleAr: 'استكشف محطات المختبر 3D، اضبط عدسة المجهر الضوئي، واقرأ تقارير المزرعة والحساسية الدوائية (S / I / R)',
    subtitleEn: 'Explore 3D lab benches, focus the optical microscope mini-game, and solve fictional AST (S / I / R) reports',
    descriptionAr:
      'تجربة استكشاف حر ثلاثية الأبعاد داخل مختبر ميكروبيولوجيا كرتوني تفاعلي. اجمع قرائن العينات الخيالية، افحص شرائح صبغة جرام بالمجهر التفاعلي (مع ضبط التكبير 10x/40x/100x والبؤرة)، وحلل جداول الحساسية الدوائية (AST) وتصنيف WHO AWaRe بالتعاون مع أخصائيي المختبر.',
    descriptionEn:
      'Free-roam 3D cartoon microbiology laboratory investigation. Collect sample clues, operate an interactive microscope mini-game (with lens magnification & fine focus controls), interpret fictional culture & susceptibility (AST) reports, and learn why antibiotic selection requires clinical assessment plus valid lab evidence.',
    featuresAr: [
      '4 مهام متدرجة القفل: مسحة البلعوم الفيروسية، تضييق الطيف (AST S/I/R)، كشف تلوث العينة، والبكتيريا المقاومة (ESBL)',
      'لعبة مجهر ضوئي تفاعلية داخل الشاشة مع تبديل العدسات (10x / 40x / 100x) وضبط شريط البؤرة (Focus)',
      'جداول مزرعة وحساسية خيالية (S / I / R) مربوطة بتصنيف منظمة الصحة العالمية (Access / Watch / Reserve)',
      'حفظ سحابي مستقل لتقدم المهام والأوسمة عبر حسابك على جميع الأجهزة',
    ],
    featuresEn: [
      '4 progressive missions: Viral vs. Bacterial Swab, AST S/I/R De-escalation, Sample Contamination, and ESBL Stewardship',
      'Built-in interactive optical microscope mini-game with 10x/40x/100x lenses and live focus slider',
      'Fictional educational culture & susceptibility (AST) tables with WHO AWaRe classification badges',
      'Independent cloud progress synchronization across devices under your account',
    ],
    controlsAr: 'الموبايل: عصا التحكم 3D + زر الفحص/التفاعل | الكمبيوتر: WASD أو الأسهم + مفتاح E',
    controlsEn: 'Mobile: 3D Touch Joystick + Inspect/Interact Button | Desktop: WASD / Arrows + E Key',
    ctaAr: 'ادخل مختبر البكتيريا 3D 🔬',
    ctaEn: 'Launch Bacteria Lab 3D 🔬',
    accentColor: '#0284c7',
    secondaryColor: '#4f46e5',
    visualType: 'lab3d',
    category: '3d-simulation',
  },
  {
    id: 'emergency-shift',
    route: '/emergency-shift',
    badgeAr: '4 سيناريوهات طوارئ وفرز 3D',
    badgeEn: '4 ED Triage & Safety Scenarios 3D',
    modeAr: 'محاكاة قسم الطوارئ ثلاثية الأبعاد (WebGL 3D)',
    modeEn: '3D Emergency Department Roleplay',
    titleAr: 'مناوبة الطوارئ 3D (Emergency Shift)',
    titleEn: 'Emergency Shift 3D',
    subtitleAr: 'تحرك داخل قسم الطوارئ 3D، حدد أولويات الفرز وعلامات الإنذار (Red Flags)، وتحقق من الحساسية الدوائية',
    subtitleEn: 'Roam the 3D Emergency Department, prioritize red-flag triage, verify drug allergies, and escalate safely',
    descriptionAr:
      'محاكاة كرتونية ثلاثية الأبعاد لقسم الطوارئ الطبية. تحدث مع المرضى والمرافقين وطاقم التمريض والأطباء والصيادلة، افحص شاشات العلامات الحيوية ولوحة الفرز، رصد علامات الإنذار الحرجة (نقص الأكسجين، هبوط الضغط، صرير الأطفال)، وامنع حوادث حساسية البنسلين والعدوى المكتسبة.',
    descriptionEn:
      'Free-roam 3D cartoon emergency department scenario. Interview fictional patients and staff, inspect bedside vitals and triage boards, recognize critical red flags, enforce allergy-check and hand-hygiene workflows, and escalate appropriately to qualified clinicians.',
    featuresAr: [
      '4 سيناريوهات طوارئ متدرجة: فرز علامات الإنتان، منع صدمة حساسية البنسلين، طوارئ تنفس الأطفال، ومكافحة العدوى',
      'شاشات فرز وعلامات حيوية تفاعلية تعرض النبض، الأكسجين (SpO2)، الضغط، التنفس، وتنبيهات السوار الأحمر',
      'حوارات متفرعة القرارات تؤثر في مسار السيناريو مع ملخص علمي مفصل (Debrief) بعد كل حالة',
      'حفظ سحابي مستقل لتقدم المهام والأوسمة عبر حسابك على جميع الأجهزة',
    ],
    featuresEn: [
      '4 progressive ED scenarios: Sepsis Red-Flag Triage, Penicillin Anaphylaxis Prevention, Pediatric Airway Red Flags, & IPC Handoff',
      'Interactive ED Triage & Vitals cards displaying SpO2, BP, RR, HR, and red allergy wristband alerts',
      'Branching dialogue choices with immediate clinical rationale and end-of-shift educational debriefs',
      'Independent cloud progress synchronization across devices under your account',
    ],
    controlsAr: 'الموبايل: عصا التحكم 3D + زر التفاعل | الكمبيوتر: WASD أو الأسهم + مفتاح E',
    controlsEn: 'Mobile: 3D Touch Joystick + Interact Button | Desktop: WASD / Arrows + E Key',
    ctaAr: 'ابدأ مناوبة الطوارئ 3D 🚑',
    ctaEn: 'Start Emergency Shift 3D 🚑',
    accentColor: '#dc2626',
    secondaryColor: '#d97706',
    visualType: 'er3d',
    category: '3d-simulation',
  },
  {
    id: 'escape-the-lab',
    route: '/escape-the-lab',
    badgeAr: '3 غرف هروب متصلة + بوابة الخروج 3D',
    badgeEn: '3 Connected Escape Rooms + Master Vault 3D',
    modeAr: 'غرفة هروب وألغاز سلامة ثلاثية الأبعاد (WebGL 3D)',
    modeEn: '3D Safety & IPC Escape Room Adventure',
    titleAr: 'الهروب من المختبر 3D (Escape the Lab)',
    titleEn: 'Escape the Lab 3D',
    subtitleAr: 'حل ألغاز نظافة اليدين، معدات الوقاية (PPE)، سلامة العينات، وفرز النفايات لجمع بطاقات المرور وفتح الحواجز الليزرية',
    subtitleEn: 'Solve hand hygiene, PPE, specimen integrity, and waste segregation puzzles to unlock laser gates and escape',
    descriptionAr:
      'مغامرة غرفة هروب (Escape Room) كرتونية ثلاثية الأبعاد مكونة من ٣ غرف متصلة تفصل بينها حواجز ليزرية ذكية وبوابة خروج كبرى. افحص ماسح الأشعة فوق البنفسجية لليدين، خزانة الوقاية، كبسولات العينات، وحاويات فرز النفايات الملونة لجمع بطاقات الأمان (Keycards) والهروب بنجاح.',
    descriptionEn:
      'Free-roam 3D cartoon escape-room adventure spanning 3 connected laboratory chambers separated by animated security laser gates. Collect security keycards by solving educational puzzles on hand hygiene, PPE donning/doffing, specimen labeling, and One Health waste segregation.',
    featuresAr: [
      '4 مراحل متدرجة عبر 3 غرف ثلاثية الأبعاد بحواجز ليزرية تفتح تدريجياً عند حل الألغاز',
      'شريط مقتنيات (Inventory Bar) يعرض بطاقات الأمان والمفاتيح المفتوحة + زر «💡 طلب تلميح» في كل لغز',
      'محتوى تعليمي آمن 100% يركز على نظافة اليدين، الوقاية القياسية، التخلص الآمن من الأدوية، ومفهوم الصحة الواحدة',
      'حفظ سحابي مستقل لتقدم الغرف والأوسمة عبر حسابك على جميع الأجهزة',
    ],
    featuresEn: [
      '4 progressive stages across 3 connected 3D rooms with animated laser security barriers',
      'Built-in Keycard & Safety Seal inventory bar + on-demand "💡 Need a Hint?" system on puzzle steps',
      '100% safe high-level IPC & One Health education (hand hygiene, PPE order, waste sorting, eco-disposal)',
      'Independent cloud progress synchronization across devices under your account',
    ],
    controlsAr: 'الموبايل: عصا التحكم 3D + زر فحص القفل | الكمبيوتر: WASD أو الأسهم + مفتاح E',
    controlsEn: 'Mobile: 3D Touch Joystick + Inspect Lock Button | Desktop: WASD / Arrows + E Key',
    ctaAr: 'ابدأ تحدي الهروب من المختبر 3D 🔐',
    ctaEn: 'Play Escape the Lab 3D 🔐',
    accentColor: '#059669',
    secondaryColor: '#0d9488',
    visualType: 'escape3d',
    category: '3d-simulation',
  },
  {
    id: 'bacteria-hunter',
    route: '/game',
    badgeAr: 'كلاسيكي • Canvas 2D',
    badgeEn: 'CLASSIC • Canvas 2D Arcade',
    modeAr: 'لعبة أركيد سريعة 2D',
    modeEn: '2D Action Arcade Game',
    titleAr: 'صائد البكتيريا (Bacteria Hunter)',
    titleEn: 'Bacteria Hunter',
    subtitleAr: 'احمِ الجسم من البكتيريا الضارة وتجنب استهداف الفيروسات أو البكتيريا النافعة',
    subtitleEn: 'Defend the body against harmful bacteria while sparing viruses and beneficial flora',
    descriptionAr:
      'لعبة أركيد تفاعلية ثنائية الأبعاد تختبر سرعة بديهتك ومعرفتك الدقيقة بالمضادات الحيوية: متى تطلق المضاد الحيوي على العدوى البكتيرية، ومتى تمتنع عن إطلاقه أمام الفيروسات والميكروبيوم النافع لتجنب مقاومة الميكروبات (AMR).',
    descriptionEn:
      'Fast-paced 2D Canvas arcade challenge teaching selective antibiotic targeting: eliminate pathogenic bacteria, avoid shooting viral infections or beneficial gut flora, and defeat multidrug-resistant superbug bosses.',
    featuresAr: [
      'موجات متدرجة الصعوبة ومعارك زعماء البكتيريا المقاومة (Superbugs)',
      'تمييز بصري وتعليمي بين البكتيريا الممرضة، البكتيريا النافعة، والفيروسات',
      'نظام إنجازات متكامل ووضع ملء الشاشة التلقائي للهواتف والكمبيوتر',
      'يعمل على نفس المسار الأصلي (/game) للحفاظ على جميع الروابط المرجعية',
    ],
    featuresEn: [
      'Progressive waves and multidrug-resistant Superbug boss encounters',
      'Visual & clinical distinction between pathogenic bacteria, commensal flora, and viruses',
      'Built-in achievement badges and fullscreen gaming mode',
      'Preserved at the original /game route for full backward compatibility',
    ],
    controlsAr: 'الموبايل: عصا التحكم + زر الإطلاق 🔵 | الكمبيوتر: WASD أو الأسهم + المسافة (Space)',
    controlsEn: 'Mobile: Touch Joystick + Fire Button 🔵 | Desktop: WASD / Arrows + Spacebar',
    ctaAr: 'العب صائد البكتيريا 🦠',
    ctaEn: 'Play Bacteria Hunter 🦠',
    accentColor: '#10b981',
    secondaryColor: '#059669',
    visualType: 'arcade2d',
    category: '2d-arcade',
  },
];

export default function GameCenter() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [filter, setFilter] = useState<'all' | '3d-simulation' | '2d-arcade'>('all');

  const visibleGames = useMemo(() => {
    if (filter === 'all') return GAME_CENTER_REGISTRY;
    return GAME_CENTER_REGISTRY.filter((g) => g.category === filter);
  }, [filter]);

  const count3D = useMemo(
    () => GAME_CENTER_REGISTRY.filter((g) => g.category === '3d-simulation').length,
    []
  );

  return (
    <main className="wrap gc-page" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero Banner */}
      <section className="gc-hero">
        <div className="gc-hero-badge">
          <span aria-hidden="true">🎮</span>
          <span>
            {isAr
              ? `مركز الألعاب والمحاكاة السريرية التفاعلية (${GAME_CENTER_REGISTRY.length} تجارب تعليمية)`
              : `Interactive Clinical Games & 3D Simulation Hub (${GAME_CENTER_REGISTRY.length} Educational Games)`}
          </span>
        </div>

        <h1 className="gc-hero-title">
          {isAr
            ? 'تعلّم الاستخدام الآمن للمضادات الحيوية وسلامة المرضى باللعب والمحاكاة ثلاثية الأبعاد'
            : 'Master Antibiotic Stewardship & Patient Safety Through Play & 3D Simulation'}
        </h1>

        <p className="gc-hero-sub">
          {isAr
            ? 'استكشف 6 عوالم كرتونية ثلاثية الأبعاد (WebGL 3D) مستقلة — تشمل أكاديمية التمريض (10 سيناريوهات)، الألغاز الطبية (10 قضايا تحقيق وسجل أدلة)، محاكي الحياة الطبية، مختبر البكتيريا، مناوبة الطوارئ، والهروب من المختبر — بالإضافة إلى لعبة الأركيد الكلاسيكية «صائد البكتيريا».'
            : 'Explore 6 independent 3D WebGL cartoon worlds — including Nurse Academy (10 scenarios), Medical Mystery (10 cases & Evidence Journal), Medical Life Simulator, Bacteria Lab, Emergency Shift, and Escape the Lab — alongside our classic 2D Bacteria Hunter arcade game.'}
        </p>

        {/* Filter Pills */}
        <div className="gc-filter-bar" role="tablist" aria-label={isAr ? 'تصنيف الألعاب' : 'Game categories'}>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={`gc-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {isAr ? `كل الألعاب (${GAME_CENTER_REGISTRY.length})` : `All Games (${GAME_CENTER_REGISTRY.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === '3d-simulation'}
            className={`gc-filter-btn ${filter === '3d-simulation' ? 'active' : ''}`}
            onClick={() => setFilter('3d-simulation')}
          >
            🏥 {isAr ? `ألعاب المحاكاة ثلاثية الأبعاد 3D (${count3D})` : `3D Cartoon Simulations (${count3D})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === '2d-arcade'}
            className={`gc-filter-btn ${filter === '2d-arcade' ? 'active' : ''}`}
            onClick={() => setFilter('2d-arcade')}
          >
            🦠 {isAr ? 'أركيد 2D تفاعلي (1)' : '2D Action Arcade (1)'}
          </button>
        </div>
      </section>

      {/* Game Cards Grid */}
      <section className="gc-grid" aria-label={isAr ? 'قائمة الألعاب المتاحة' : 'Available games'}>
        {visibleGames.map((game) => (
          <article
            key={game.id}
            className="gc-card"
            style={
              {
                '--gc-accent': game.accentColor,
                '--gc-secondary': game.secondaryColor,
              } as CSSProperties
            }
          >
            {/* Visual Banner */}
            <div className={`gc-card-visual ${game.visualType}`}>
              <div className="gc-visual-top-row">
                <span className="gc-badge-pill">{isAr ? game.badgeAr : game.badgeEn}</span>
                <span className="gc-mode-tag">{isAr ? game.modeAr : game.modeEn}</span>
              </div>

              {game.visualType === 'nurse3d' && (
                <div className="gc-art-3d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <polygon points="180,15 330,75 180,138 30,75" fill="#0c2d48" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.55" />
                    {/* 3D Nursing Station, ID Scanner, Checklist & Avatar */}
                    <g transform="translate(80, 44)">
                      <rect x="0" y="10" width="46" height="34" rx="6" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
                      <line x1="8" y1="20" x2="36" y2="20" stroke="#0284c7" strokeWidth="2.2" />
                      <line x1="8" y1="28" x2="30" y2="28" stroke="#0d9488" strokeWidth="2.2" />
                      <circle cx="38" cy="34" r="5" fill="#22c55e" />
                    </g>
                    <g transform="translate(162, 34)">
                      <ellipse cx="18" cy="58" rx="16" ry="6" fill="rgba(56,189,248,0.35)" />
                      <rect x="10" y="28" width="16" height="24" rx="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" />
                      <circle cx="18" cy="16" r="10" fill="#fde68a" stroke="#ffffff" strokeWidth="1.2" />
                      <path d="M 9 10 L 27 10 L 24 3 L 12 3 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
                    </g>
                    <g transform="translate(228, 44)">
                      <rect x="0" y="8" width="52" height="36" rx="6" fill="#0f172a" stroke="#2dd4bf" strokeWidth="1.6" />
                      <text x="26" y="30" textAnchor="middle" fill="#5eead4" fontSize="11" fontWeight="bold">SBAR ✓</text>
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>🪪 {isAr ? 'تحقق الهوية' : 'Patient ID'}</span>
                    <span>🧼 {isAr ? 'اللحظات الـ 5' : '5 Moments'}</span>
                    <span>💊 {isAr ? 'سلامة الدواء' : 'Med Safety'}</span>
                    <span>📋 {isAr ? 'تسليم SBAR' : 'SBAR Handover'}</span>
                  </div>
                </div>
              )}

              {game.visualType === 'mystery3d' && (
                <div className="gc-art-3d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <polygon points="180,15 330,75 180,138 30,75" fill="#1e1338" stroke="#c084fc" strokeWidth="1.5" strokeOpacity="0.55" />
                    {/* 3D Evidence Board, Red String Clue Chain & Magnifier */}
                    <g transform="translate(82, 36)">
                      <rect x="0" y="6" width="64" height="44" rx="6" fill="#2e1065" stroke="#a855f7" strokeWidth="1.8" />
                      <rect x="8" y="14" width="16" height="12" rx="2" fill="#fef08a" />
                      <rect x="38" y="16" width="16" height="12" rx="2" fill="#bae6fd" />
                      <rect x="22" y="32" width="18" height="12" rx="2" fill="#fecdd3" />
                      <line x1="16" y1="20" x2="46" y2="22" stroke="#f43f5e" strokeWidth="1.8" />
                      <line x1="46" y1="22" x2="31" y2="38" stroke="#f43f5e" strokeWidth="1.8" />
                    </g>
                    <g transform="translate(172, 38)">
                      <circle cx="20" cy="20" r="14" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth="3" />
                      <line x1="30" y1="30" x2="44" y2="44" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
                    </g>
                    <g transform="translate(236, 44)">
                      <rect x="0" y="6" width="48" height="36" rx="6" fill="#0f172a" stroke="#c084fc" strokeWidth="1.6" />
                      <text x="24" y="28" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold">10 CASES</text>
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>📓 {isAr ? 'سجل الأدلة' : 'Evidence Journal'}</span>
                    <span>🔗 {isAr ? 'قرائن متسلسلة' : 'Clue Chains'}</span>
                    <span>🔦 {isAr ? 'تتبع UV' : 'UV Forensics'}</span>
                    <span>🕵️ {isAr ? '10 قضايا' : '10 Cases'}</span>
                  </div>
                </div>
              )}

              {game.visualType === 'simulator3d' && (
                <div className="gc-art-3d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <defs>
                      <linearGradient id="gcFloorGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0f2942" />
                        <stop offset="100%" stopColor="#091929" />
                      </linearGradient>
                      <linearGradient id="gcCrossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>
                    <polygon points="180,15 330,75 180,138 30,75" fill="url(#gcFloorGrad)" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.45" />
                    <line x1="105" y1="45" x2="255" y2="106" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1" />
                    <line x1="255" y1="45" x2="105" y2="106" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1" />
                    <g transform="translate(88, 46)">
                      <polygon points="0,24 38,8 62,18 24,34" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.2" />
                      <polygon points="0,24 24,34 24,46 0,36" fill="#0369a1" />
                      <polygon points="24,34 62,18 62,30 24,46" fill="#0284c7" />
                      <rect x="6" y="10" width="14" height="14" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
                    </g>
                    <g transform="translate(208, 52)">
                      <polygon points="0,18 34,4 58,14 24,28" fill="#5eead4" stroke="#0f766e" strokeWidth="1.2" />
                      <polygon points="0,18 24,28 24,44 0,34" fill="#0f766e" />
                      <polygon points="24,28 58,14 58,30 24,44" fill="#14b8a6" />
                    </g>
                    <g transform="translate(166, 48)">
                      <ellipse cx="14" cy="52" rx="14" ry="6" fill="rgba(14,165,233,0.35)" />
                      <rect x="7" y="24" width="14" height="22" rx="5" fill="#38bdf8" stroke="#fff" strokeWidth="1.2" />
                      <circle cx="14" cy="14" r="9" fill="#fde68a" stroke="#fff" strokeWidth="1.2" />
                      <rect x="8" y="3" width="12" height="5" rx="2" fill="#0284c7" />
                    </g>
                    <g transform="translate(165, 8)">
                      <rect x="11" y="0" width="8" height="22" rx="2" fill="url(#gcCrossGrad)" />
                      <rect x="4" y="7" width="22" height="8" rx="2" fill="url(#gcCrossGrad)" />
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>🚑 {isAr ? 'طوارئ ومختبر' : 'ER & Lab'}</span>
                    <span>🔍 {isAr ? 'ألغاز وأدلة 3D' : '3D Clues'}</span>
                    <span>🦠 {isAr ? 'تحقيق مجهري' : 'Micro-AMR'}</span>
                    <span>🏆 {isAr ? '10 مستويات' : '10 Levels'}</span>
                  </div>
                </div>
              )}

              {game.visualType === 'lab3d' && (
                <div className="gc-art-3d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <polygon points="180,15 330,75 180,138 30,75" fill="#0b1f38" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.5" />
                    <g transform="translate(96, 44)">
                      <ellipse cx="26" cy="52" rx="24" ry="10" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="1.5" />
                      <circle cx="18" cy="50" r="4" fill="#f43f5e" />
                      <circle cx="32" cy="53" r="4" fill="#22c55e" />
                      <circle cx="26" cy="46" r="4" fill="#facc15" />
                    </g>
                    <g transform="translate(162, 30)">
                      <rect x="4" y="54" width="28" height="8" rx="3" fill="#e0f2fe" />
                      <path d="M 24 54 L 24 24 L 12 24" stroke="#38bdf8" strokeWidth="5" fill="none" strokeLinecap="round" />
                      <rect x="6" y="14" width="10" height="18" rx="3" fill="#818cf8" transform="rotate(-20 11 23)" />
                      <rect x="6" y="38" width="18" height="4" rx="2" fill="#facc15" />
                    </g>
                    <g transform="translate(226, 46)">
                      <rect x="0" y="6" width="48" height="34" rx="6" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                      <text x="24" y="27" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold">S / I / R</text>
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>🔬 {isAr ? 'مجهر تفاعلي' : 'Interactive Microscope'}</span>
                    <span>🧫 {isAr ? 'مزارع بكتيرية' : 'Agar Cultures'}</span>
                    <span>📊 {isAr ? 'تقرير حساسية AST' : 'AST Reports'}</span>
                  </div>
                </div>
              )}

              {game.visualType === 'er3d' && (
                <div className="gc-art-3d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <polygon points="180,15 330,75 180,138 30,75" fill="#280d15" stroke="#f87171" strokeWidth="1.5" strokeOpacity="0.5" />
                    <g transform="translate(82, 48)">
                      <polygon points="0,24 42,8 68,18 26,34" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.3" />
                      <polygon points="0,24 26,34 26,46 0,36" fill="#9a3412" />
                      <polygon points="26,34 68,18 68,30 26,46" fill="#c2410c" />
                    </g>
                    <g transform="translate(162, 34)">
                      <rect x="0" y="10" width="44" height="32" rx="6" fill="#0f172a" stroke="#f87171" strokeWidth="1.8" />
                      <polyline points="6,28 14,28 18,18 23,35 28,24 38,24" fill="none" stroke="#4ade80" strokeWidth="2.2" />
                    </g>
                    <g transform="translate(228, 44)">
                      <circle cx="20" cy="24" r="16" fill="rgba(239,68,68,0.28)" stroke="#ef4444" strokeWidth="1.8" />
                      <rect x="17" y="13" width="6" height="14" rx="2" fill="#fca5a5" />
                      <circle cx="20" cy="32" r="3" fill="#fca5a5" />
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>🚨 {isAr ? 'فرز الطوارئ' : 'ED Triage'}</span>
                    <span>🛑 {isAr ? 'فحص الحساسية' : 'Allergy Safety'}</span>
                    <span>👩‍⚕️ {isAr ? 'قرارات متفرعة' : 'Branching ER'}</span>
                  </div>
                </div>
              )}

              {game.visualType === 'escape3d' && (
                <div className="gc-art-3d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <polygon points="180,15 330,75 180,138 30,75" fill="#082220" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.5" />
                    <line x1="115" y1="35" x2="245" y2="95" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="6 4" />
                    <g transform="translate(88, 46)">
                      <rect x="0" y="8" width="42" height="28" rx="5" fill="#065f46" stroke="#34d399" strokeWidth="1.6" />
                      <circle cx="14" cy="22" r="5" fill="#facc15" />
                      <rect x="23" y="19" width="12" height="6" rx="2" fill="#a7f3d0" />
                    </g>
                    <g transform="translate(164, 34)">
                      <rect x="2" y="6" width="34" height="44" rx="6" fill="#0f172a" stroke="#facc15" strokeWidth="1.8" />
                      <circle cx="19" cy="26" r="9" fill="none" stroke="#34d399" strokeWidth="2.2" />
                      <circle cx="19" cy="26" r="3" fill="#facc15" />
                    </g>
                    <g transform="translate(228, 48)">
                      <rect x="0" y="6" width="16" height="28" rx="3" fill="#eab308" />
                      <rect x="20" y="6" width="16" height="28" rx="3" fill="#ef4444" />
                      <rect x="40" y="6" width="16" height="28" rx="3" fill="#38bdf8" />
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>🔐 {isAr ? '3 غرف متصلة' : '3 Escape Rooms'}</span>
                    <span>🪪 {isAr ? 'بطاقات مرور' : 'Keycards'}</span>
                    <span>🧤 {isAr ? 'وقاية ونفايات' : 'PPE & Waste'}</span>
                  </div>
                </div>
              )}

              {game.visualType === 'arcade2d' && (
                <div className="gc-art-2d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <circle cx="90" cy="68" r="24" fill="rgba(239,68,68,0.22)" stroke="#ef4444" strokeWidth="2" />
                    <circle cx="83" cy="63" r="4" fill="#fca5a5" />
                    <circle cx="98" cy="63" r="4" fill="#fca5a5" />
                    <path d="M 80 77 Q 90 70 100 77" stroke="#fca5a5" strokeWidth="2.5" fill="none" />
                    <g transform="translate(155, 58)">
                      <rect x="0" y="0" width="38" height="16" rx="8" fill="#ffffff" stroke="#22d3ee" strokeWidth="2" />
                      <rect x="19" y="0" width="19" height="16" rx="8" fill="#06b6d4" />
                      <line x1="-22" y1="8" x2="-6" y2="8" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="4 3" />
                    </g>
                    <g transform="translate(248, 45)">
                      <polygon points="0,22 36,6 28,22 36,38" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.8" />
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>🦠 {isAr ? 'بكتيريا ضارة' : 'Pathogens'}</span>
                    <span>🛡️ {isAr ? 'ميكروبيوم نافع' : 'Good Flora'}</span>
                    <span>⚡ {isAr ? 'حركة سريعة' : 'Arcade Action'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="gc-card-body">
              <h2 className="gc-card-title">{isAr ? game.titleAr : game.titleEn}</h2>
              <p className="gc-card-subtitle">{isAr ? game.subtitleAr : game.subtitleEn}</p>
              <p className="gc-card-desc">{isAr ? game.descriptionAr : game.descriptionEn}</p>

              <ul className="gc-feature-list">
                {(isAr ? game.featuresAr : game.featuresEn).map((feat, idx) => (
                  <li key={idx}>
                    <span className="gc-check-icon" aria-hidden="true">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="gc-controls-box">
                <strong>🎮 {isAr ? 'طريقة التحكم:' : 'Controls:'}</strong>
                <span>{isAr ? game.controlsAr : game.controlsEn}</span>
              </div>

              <div className="gc-card-actions">
                <Link to={game.route} className="gc-play-btn">
                  <span>{isAr ? game.ctaAr : game.ctaEn}</span>
                  <span aria-hidden="true">{isAr ? '←' : '→'}</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Educational Framing & Stewardship Note */}
      <section className="card gc-stewardship-banner">
        <div className="gc-stewardship-grid">
          <div>
            <h2>
              🛡️{' '}
              {isAr
                ? 'لماذا نتعلم ترشيد المضادات الحيوية وسلامة المرضى عبر المحاكاة؟'
                : 'Why Learn Antibiotic Stewardship & Patient Safety Through Simulation?'}
            </h2>
            <p className="small muted" style={{ marginBottom: '10px' }}>
              {isAr
                ? 'توصي منظمة الصحة العالمية (WHO) والمراكز الأمريكية لمكافحة الأمراض (CDC) وهيئة الدواء المصرية (EDA) بالتدريب التفاعلي المبني على السيناريوهات لتقليل صرف المضادات الحيوية للعدوى الفيروسية ومنع الأخطاء الدوائية وحوادث الحساسية المتصالبة.'
                : 'WHO, CDC, and the Egyptian Drug Authority (EDA) emphasize scenario-based active learning to reduce unnecessary antibiotic use in viral infections, verify drug allergies, and uphold nursing medication safety checks.'}
            </p>
            <div className="gc-pill-row">
              <span className="badge approved">
                {isAr ? '✓ حالات تعليمية خيالية آمنة' : '✓ Safe Fictional Educational Cases'}
              </span>
              <span className="badge approved">
                {isAr ? '✓ حفظ سحابي لتقدم كل لعبة عبر أجهزتك' : '✓ Cloud Progress Sync Across Devices'}
              </span>
              <span className="badge approved">
                {isAr ? '✓ متوافق مع الهواتف والكمبيوتر' : '✓ Mobile & Desktop Ready'}
              </span>
            </div>
          </div>
          <div className="gc-quick-links">
            <Link to="/allergy-checker" className="btn ghost small">
              🛡️ {isAr ? 'فاحص الحساسية الذكي' : 'Allergy Checker'}
            </Link>
            <Link to="/green-prescription" className="btn ghost small">
              🌿 {isAr ? 'الروشتة الخضرا' : 'Green Prescription'}
            </Link>
            <Link to="/quiz" className="btn ghost small">
              📝 {isAr ? 'الاختبار التوعوي' : 'Stewardship Quiz'}
            </Link>
          </div>
        </div>
      </section>

      <div style={{ marginTop: '20px' }}>
        <Disclaimer />
      </div>
    </main>
  );
}
