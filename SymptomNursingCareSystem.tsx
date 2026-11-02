import React, { useMemo, useState } from 'react';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';

export type SymptomId =
  | 'cough'
  | 'sputum'
  | 'chest_congestion'
  | 'fever'
  | 'body_pain'
  | 'headache_sinus';

export type NursingDomainId =
  | 'heat_cold'
  | 'chest_physiotherapy'
  | 'pain_relief';

export interface SymptomOption {
  id: SymptomId;
  icon: string;
  label: Bi;
  subLabel: Bi;
  nonPharmQuickTips: Bi[];
}

export interface NursingProcedureRecord {
  id: string;
  domainId: NursingDomainId;
  domainBadge: Bi;
  domainColor: string;
  icon: string;
  title: Bi;
  subtitle: Bi;
  linkedSymptoms: SymptomId[];
  indications: Bi[];
  contraindications: Bi[];
  steps: Bi[];
  precautions: Bi[];
  warningSigns: Bi[];
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  {
    id: 'cough',
    icon: '🗣️',
    label: {
      ar: 'الكحة وتهيج الحلق',
      en: 'Cough & Throat Irritation',
    },
    subLabel: {
      ar: 'كحة جافة أو مصحوبة بخشونة وشرقة بالحلق',
      en: 'Dry or ticklish cough with pharyngeal irritation',
    },
    nonPharmQuickTips: [
      {
        ar: 'شرب السوائل الدافئة (ينسون، تليو، ماء دافئ بالعسل لمن هم فوق سنة) لترطيب الغشاء المخاطي وتهدئة مستقبلات الكحة.',
        en: 'Sip warm fluids (herbal tea, warm water with honey for ages >1 year) to soothe mucosal cough receptors.',
      },
      {
        ar: 'رفع الرأس والكتفين بوسادتين عند النوم (زاوية 30–45 درجة) لمنع ارتجاع الإفرازات الأنفية الخلفية المسببة للكحة الليلية.',
        en: 'Elevate head and shoulders at 30–45 degrees during sleep to reduce post-nasal drip cough reflex.',
      },
    ],
  },
  {
    id: 'sputum',
    icon: '🫁',
    label: {
      ar: 'البلغم وتراكم الإفرازات',
      en: 'Sputum & Mucus Accumulation',
    },
    subLabel: {
      ar: 'إفرازات مخاطية كثيفة تحتاج إلى ترطيب وتصريف آمن',
      en: 'Thick respiratory secretions requiring hydration and mobilization',
    },
    nonPharmQuickTips: [
      {
        ar: 'الإكثار من شرب الماء (8–10 أكواب يومياً ما لم يوجد مانع طبي) لأن الماء هو أفضل مذيب طبيعي للبلغم ويقلل لزوجته.',
        en: 'Maintain generous oral hydration (8–10 glasses/day unless fluid-restricted) to naturally thin mucus viscosity.',
      },
      {
        ar: 'تجنب الكافيين الزائد والتدخين السلبي أو الإيجابي لأنهما يوقفان حركة الأهداب التنفسية الطاردة للبلغم.',
        en: 'Avoid smoke exposure and excess caffeine which impair mucociliary clearance.',
      },
    ],
  },
  {
    id: 'chest_congestion',
    icon: '🌬️',
    label: {
      ar: 'احتقان الصدر وصعوبة طرد البلغم',
      en: 'Chest Congestion & Airway Clearance',
    },
    subLabel: {
      ar: 'شعور بثقل في الصدر وتراكم الإفرازات بالشعب الهوائية',
      en: 'Bronchial mucus retention and chest heaviness',
    },
    nonPharmQuickTips: [
      {
        ar: 'تطبيق جلسات العلاج الطبيعي للصدر (Chest Physiotherapy) والتنفس العميق مع السعال الموجّه (Huff Coughing).',
        en: 'Perform structured Chest Physiotherapy (CPT), deep diaphragmatic breathing, and Huff coughing.',
      },
      {
        ar: 'استنشاق بخار الماء الدافئ أثناء الاستحمام لتوسيع الممرات الهوائية وتفكيك الإفرازات المتراكمة.',
        en: 'Use warm shower steam inhalation to humidify airways and loosen retained bronchial secretions.',
      },
    ],
  },
  {
    id: 'fever',
    icon: '🌡️',
    label: {
      ar: 'ارتفاع درجة الحرارة (الحمى)',
      en: 'Fever & Elevated Temperature',
    },
    subLabel: {
      ar: 'سخونية ورعشة خفيفة مصاحبة للعدوى الفيروسية',
      en: 'Low-to-moderate febrile response during viral illness',
    },
    nonPharmQuickTips: [
      {
        ar: 'تطبيق الكمادات الفاترة (Tepid Sponge / Cold Applications) على الجبهة وجانبي الرقبة وتحت الإبطين وأعلى الفخذين.',
        en: 'Apply cool/tepid compresses to forehead, lateral neck, axillae, and groin areas.',
      },
      {
        ar: 'ارتداء طبقة واحدة من الملابس القطنية الخفيفة وتهوية الغرفة جيداً وتجنب تغطية المريض ببطاطين ثقيلة تحبس الحرارة.',
        en: 'Wear light breathable cotton clothing and keep room ventilated; avoid heavy blankets that trap heat.',
      },
    ],
  },
  {
    id: 'body_pain',
    icon: '⚡',
    label: {
      ar: 'الألم العضلي والتهاب الحلق',
      en: 'Body Aches, Myalgia & Sore Throat',
    },
    subLabel: {
      ar: 'تكسير بالجسم، إجهاد عضلي، أو ألم عند البلع',
      en: 'Generalized viral myalgia, fatigue, or odynophagia',
    },
    nonPharmQuickTips: [
      {
        ar: 'الغرغرة بمحلول ملحي دافئ (نصف ملعقة صغيرة ملح في كوب ماء دافئ) كل 4–6 ساعات لسحب التورم من أنسجة الحلق.',
        en: 'Gargle with warm isotonic saline (1/2 tsp salt in warm water) every 4–6 hours to reduce pharyngeal edema.',
      },
      {
        ar: 'الراحة الجسدية وتطبيق تقنيات الاسترخاء العضلي التدريجي والكمادات الدافئة على العضلات المجهدة.',
        en: 'Rest and apply Progressive Muscle Relaxation (PMR) and warm packs to sore muscle groups.',
      },
    ],
  },
  {
    id: 'headache_sinus',
    icon: '🧠',
    label: {
      ar: 'الصداع واحتقان الجيوب الأنفية',
      en: 'Headache & Sinus Pressure',
    },
    subLabel: {
      ar: 'صداع بالجبهة أو ثقل حول العينين والأنف',
      en: 'Frontal headache, facial fullness, or nasal congestion',
    },
    nonPharmQuickTips: [
      {
        ar: 'عمل كمادات دافئة رطبة على عظام الوجه والجبهة لمدة 10–15 دقيقة لتصريف احتقان الجيوب الأنفية، أو كمادات باردة للجبهة للصداع.',
        en: 'Apply warm moist facial compresses for 10–15 min to drain sinus pressure, or cool forehead compresses for headache.',
      },
      {
        ar: 'غسيل الأنف بمحلول الملح الطبي المعقم وتخفيف إضاءة الغرفة والابتعاد عن الشاشات.',
        en: 'Perform isotonic saline nasal irrigation and rest in a quiet, dimly lit room.',
      },
    ],
  },
];

export const NURSING_PROCEDURES: NursingProcedureRecord[] = [
  {
    id: 'heat-cold-fever-sponge',
    domainId: 'heat_cold',
    domainBadge: {
      ar: 'تطبيقات الحرارة والبرودة (Heat & Cold Applications)',
      en: 'Heat & Cold Nursing Applications',
    },
    domainColor: '#0284c7',
    icon: '🧊',
    title: {
      ar: 'الكمادات الفاترة والباردة لخفض الحرارة وتسكين الصداع (Tepid Sponge & Cold Compress)',
      en: 'Tepid Sponge Bath & Cool Compress Application (Fever & Headache)',
    },
    subtitle: {
      ar: 'إجراء تمريضي قياسي لخفض حرارة الجسم بالتبخر والتوصيل الحراري الآمن دون التسبب في رعشة ارتدادية',
      en: 'Evidence-based nursing procedure to reduce core temperature via conductive and evaporative heat loss',
    },
    linkedSymptoms: ['fever', 'headache_sinus'],
    indications: [
      {
        ar: 'ارتفاع درجة حرارة الجسم (38.0°C – 39.0°C) المصاحب لنزلات البرد والعدوى الفيروسية.',
        en: 'Mild-to-moderate fever (38.0°C – 39.0°C) associated with viral upper respiratory infections.',
      },
      {
        ar: 'الصداع الجبهي النابض والإحساس بسخونة الرأس والوجه.',
        en: 'Throbbing frontal headache and facial flushing.',
      },
    ],
    contraindications: [
      {
        ar: 'يُمنع منعاً باتاً استخدام الماء المثلج أو الثلج المباشر أو الكحول الطبي على الجلد (يسبب انقباض الأوعية الدموية ورعشة ترفع حرارة الأعضاء الداخلية، والكحول يسبب تسمماً بالامتصاص).',
        en: 'Strictly contraindicated: Ice-cold water or rubbing alcohol (causes peripheral vasoconstriction, shivering, rebound core hyperthermia, and alcohol toxicity).',
      },
      {
        ar: 'وجود قصور شديد بالدورة الدموية الطرفية أو متلازمة رينود أو جروح مفتوحة في موضع الكمادات.',
        en: 'Severe peripheral vascular disease, Raynaud phenomenon, or open skin lesions at the application site.',
      },
    ],
    steps: [
      {
        ar: '1. تحضير ماء فاتر يميل للبرودة الخفيفة (درجة حرارة 29°C – 32°C، يُختبر بظهر اليد) مع فوط قطنية نظيفة.',
        en: '1. Prepare tepid water (29°C – 32°C, comfortable to the back of the wrist) and clean cotton washcloths.',
      },
      {
        ar: '2. عصر الفوطة جيداً ووضعها على مناطق مرور الأوعية الدموية السطحية الكبرى: (الجبهة، جانبي الرقبة، تحت الإبطين، وأعلى الفخذين).',
        en: '2. Wring out washcloths and place over major superficial blood vessels: forehead, lateral neck, axillae, and groin.',
      },
      {
        ar: '3. تغيير الفوطة كل 3–5 دقائق عندما تكتسب حرارة الجسم، ولمدة إجمالية من 15 إلى 20 دقيقة فقط في الجلسة الواحدة.',
        en: '3. Refresh cloths every 3–5 minutes as they warm, continuing for a total session of 15–20 minutes.',
      },
      {
        ar: '4. تجفيف الجلد بلطف بالتربيت (بدون فرك) وإلباس المريض ملابس قطنية خفيفة وإعادة قياس الحرارة بعد 30 دقيقة.',
        en: '4. Pat skin dry gently (do not rub), dress patient in light cotton, and recheck temperature after 30 minutes.',
      },
    ],
    precautions: [
      {
        ar: 'إيقاف الكمادات فوراً إذا بدأ المريض في الارتعاش (Shivering)، لأن الرعشة نشاط عضلي يرفع حرارة الجسم الداخلية.',
        en: 'Stop immediately if shivering occurs, as muscular shivering increases metabolic heat production.',
      },
      {
        ar: 'عدم وضع الكمادات الباردة على منطقة الصدر مباشرة لتجنب تحفيز نوبات السعال.',
        en: 'Avoid placing cold compresses directly over the anterior chest wall.',
      },
    ],
    warningSigns: [
      {
        ar: 'ارتفاع الحرارة فوق 39.5°C، أو استمرار الحمى لأكثر من 3 أيام متواصلة دون تحسن.',
        en: 'Temperature exceeding 39.5°C or fever persisting beyond 3 consecutive days.',
      },
      {
        ar: 'ظهور تيبس بالرقبة، تشنجات حرارية، خمول شديد، أو صعوبة في الإيقاظ.',
        en: 'Neck stiffness, febrile seizures, confusion, or extreme lethargy.',
      },
    ],
  },
  {
    id: 'heat-cold-warm-sinus',
    domainId: 'heat_cold',
    domainBadge: {
      ar: 'تطبيقات الحرارة والبرودة (Heat & Cold Applications)',
      en: 'Heat & Cold Nursing Applications',
    },
    domainColor: '#0284c7',
    icon: '♨️',
    title: {
      ar: 'الكمادات الدافئة الرطبة للجيوب الأنفية والعضلات (Moist Heat Application)',
      en: 'Moist Warm Compress for Sinus Congestion & Myalgia',
    },
    subtitle: {
      ar: 'توسيع الأوعية الدموية الموضعية (Vasodilation) لتقليل احتقان الجيوب الأنفية وفك التيبس العضلي',
      en: 'Local vasodilation therapy to promote sinus ostia drainage and relieve muscular spasm',
    },
    linkedSymptoms: ['headache_sinus', 'body_pain', 'chest_congestion'],
    indications: [
      {
        ar: 'احتقان وضغط الجيوب الأنفية بالجبهة وعظام الوجنتين وحول العينين.',
        en: 'Sinus pressure, facial fullness, and thick nasal congestion.',
      },
      {
        ar: 'الشد والألم العضلي في الرقبة والكتفين والظهر المصاحب لنزلات البرد.',
        en: 'Cervical and shoulder muscle tension or viral myalgia.',
      },
    ],
    contraindications: [
      {
        ar: 'فقدان الإحساس الحراري بالجلد (مثل اعتلال الأعصاب السكري المتقدم) لتجنب الحروق غير المحسوسة.',
        en: 'Impaired cutaneous thermal sensation (e.g., peripheral neuropathy) due to burn risk.',
      },
      {
        ar: 'وجود نزيف أنفي نشط (Epistaxis) أو التهاب جلدي صديدي أو ورم حاد في موضع الكمادة.',
        en: 'Active epistaxis (nosebleed), acute local hemorrhage, or open skin inflammation.',
      },
    ],
    steps: [
      {
        ar: '1. غمر منشفة قطنية في ماء دافئ مريح (40°C – 43°C) وعصرها جيداً، أو لف قربة ماء دافئ داخل فوطة جافة.',
        en: '1. Soak a clean towel in warm water (40°C – 43°C) and wring out excess moisture, or wrap a warm pack in a towel.',
      },
      {
        ar: '2. وضع الكمادة الدافئة على عظام الوجنتين والجبهة (للجيوب الأنفية) أو على عضلات الرقبة والكتفين لمدة 10–15 دقيقة.',
        en: '2. Apply over maxillary/frontal sinuses or sore neck/shoulder muscles for 10–15 minutes.',
      },
      {
        ar: '3. إتباع الكمادة بغسيل الأنف بمحلول ملحي متعادل لتصريف الإفرازات التي تم تليينها بالحرارة.',
        en: '3. Follow with isotonic saline nasal rinse to clear mobilized secretions.',
      },
    ],
    precautions: [
      {
        ar: 'اختبار حرارة الكمادة دائماً على باطن الرسغ قبل وضعها على الوجه، وعدم تجاوز 15 دقيقة في المرة الواحدة.',
        en: 'Always test temperature on the inner wrist first; never apply uninsulated heat packs directly to skin.',
      },
      {
        ar: 'ملاحظة الجلد بعد 5 دقائق للتأكد من عدم حدوث احمرار شديد أو ألم.',
        en: 'Inspect skin after 5 minutes for excessive erythema or discomfort.',
      },
    ],
    warningSigns: [
      {
        ar: 'تورم واحمرار حول العين أو الجفون، أو تغير في الرؤية أو ازدواجيتها.',
        en: 'Periorbital swelling/redness, visual changes, or severe unilateral facial swelling.',
      },
      {
        ar: 'صداع حاد مفاجئ غير معتاد لا يستجيب للراحة أو يصاحبه قيء مستمر.',
        en: 'Sudden severe headache unresponsive to rest or accompanied by persistent vomiting.',
      },
    ],
  },
  {
    id: 'cpt-postural-percussion',
    domainId: 'chest_physiotherapy',
    domainBadge: {
      ar: 'العلاج الطبيعي للصدر (Chest Physiotherapy - CPT)',
      en: 'Chest Physiotherapy (CPT) & Airway Clearance',
    },
    domainColor: '#0d9488',
    icon: '🫁',
    title: {
      ar: 'العلاج الطبيعي للصدر: الأوضاع التصريفية والتربيت الكفي والسعال الموجّه (CPT & Huff Coughing)',
      en: 'Chest Physiotherapy: Postural Drainage, Cupped Percussion & Huff Coughing',
    },
    subtitle: {
      ar: 'تقنيات تمريضية وتنفسية لتحريك البلغم اللزج من الشعب الهوائية الصغيرة إلى القصبة الهوائية لطرده بسهولة',
      en: 'Respiratory nursing interventions to mobilize retained secretions from peripheral airways to central bronchi',
    },
    linkedSymptoms: ['sputum', 'chest_congestion', 'cough'],
    indications: [
      {
        ar: 'تراكم البلغم الكثيف في الصدر وصعوبة إخراجه بالكحة العادية المجهدة.',
        en: 'Retained, viscous bronchial secretions and ineffective exhausting cough.',
      },
      {
        ar: 'احتقان الشعب الهوائية المصاحب لنزلات البرد والتهاب الشعب الفيروسي.',
        en: 'Bronchial congestion during recovery from viral respiratory tract infections.',
      },
    ],
    contraindications: [
      {
        ar: 'يُمنع التربيت الصدري في حالات: الكحة المدممة (Hemoptysis)، كسور الضلوع، هشاشة العظام الشديدة، أو الاشتباه بجلطة رئوية.',
        en: 'Contraindicated in: active hemoptysis, rib fractures, severe osteoporosis, unstable angina, or pulmonary embolism.',
      },
      {
        ar: 'يُمنع إجراء الجلسة بعد تناول الطعام مباشرة (يجب الانتظار ساعة ونصف إلى ساعتين بعد الأكل لتجنب القيء والارتجاع).',
        en: 'Never perform immediately after meals (wait at least 1.5–2 hours post-meal to prevent aspiration/vomiting).',
      },
    ],
    steps: [
      {
        ar: '1. الترطيب أولاً: شرب كوب ماء دافئ أو استنشاق بخار دافئ لمدة 5 دقائق لتقليل لزوجة البلغم قبل البدء.',
        en: '1. Pre-hydrate: Drink warm water or inhale warm mist for 5 minutes to loosen mucus viscosity.',
      },
      {
        ar: '2. الوضع التصريفي (Postural Positioning): الجلوس مع الميل قليلاً للأمام مع إسناد الذراعين على وسادة فوق الطاولة (Tripod / High-Fowler).',
        en: '2. Positioning: Sit upright leaning slightly forward supported on a pillow, or lie on side to drain affected lung zones.',
      },
      {
        ar: '3. التربيت بالكف المقعرة (Cupped Hand Percussion): ضم أصابع اليد لتأخذ شكل الفنجان (Cupped Hand) والتربيت الإيقاعي الخفيف على جدار الصدر الخلفي لمدة 3–5 دقائق (يُسمع صوت مكتوم أجوف وليس صوت صفع مؤلم).',
        en: '3. Cupped Percussion: Cup the hand (creating an air cushion) and rhythmically percuss over the ribcage for 3–5 min (produces a hollow sound, never a painful slap).',
      },
      {
        ar: '4. تقنية التنفس العميق والـ Huff Coughing: أخذ شهيق بطني عميق من الأنف، حبسه لثانيتين، ثم الزفير بقوة والفم مفتوح كأنك تخرج بخاراً على مرآة (Huff!) مرتين لطرد البلغم دون إجهاد الحنجرة.',
        en: '4. Active Cycle Breathing & Huff Cough: Inhale deeply through nose, hold 2 seconds, then exhale forcefully with open glottis ("Huff!") to clear mucus without airway collapse.',
      },
    ],
    precautions: [
      {
        ar: 'وضع طبقة قماش رقيقة (تيشيرت قطني أو فوطة) على ظهر المريض؛ يُمنع التربيت على الجلد العاري مباشرة.',
        en: 'Always percuss over a thin layer of clothing or towel; never slap bare skin.',
      },
      {
        ar: 'تجنب التربيت تماماً فوق العمود الفقري، عظمة القص، منطقة الكليتين أسفل الظهر، أو الثديين.',
        en: 'Strictly avoid percussing over the spine, sternum, kidneys (costovertebral angle), or breast tissue.',
      },
    ],
    warningSigns: [
      {
        ar: 'ضيق تنفس حاد أو نهجان أثناء الراحة، أو انخفاض تشبع الأكسجين، أو ازرقاق الشفاه.',
        en: 'Shortness of breath at rest, tachypnea, cyanosis of lips, or chest retractions.',
      },
      {
        ar: 'خروج دم مع البلغم، أو ألم حاد بالصدر يزداد مع أخذ النفس العميق.',
        en: 'Blood-streaked sputum (hemoptysis) or sharp pleuritic chest pain.',
      },
    ],
  },
  {
    id: 'pain-relief-non-pharm',
    domainId: 'pain_relief',
    domainBadge: {
      ar: 'تسكين الألم غير الدوائي (Non-Pharmacological Pain Relief)',
      en: 'Non-Pharmacological Pain Relief Techniques',
    },
    domainColor: '#7c3aed',
    icon: '🧘',
    title: {
      ar: 'تقنيات تسكين الألم غير الدوائية: الاسترخاء التدريجي، الغرغرة الملحية، والوضعيات المريحة',
      en: 'Non-Pharmacological Pain Relief: Progressive Relaxation, Saline Gargle & Positioning',
    },
    subtitle: {
      ar: 'تدخلات تمريضية آمنة لتقليل إشارات الألم والالتهاب الموضعي دون الإفراط في المسكنات المضرة بالكلى والمعدة',
      en: 'Safe nursing interventions to modulate pain perception and mucosal edema without NSAID overuse',
    },
    linkedSymptoms: ['body_pain', 'headache_sinus', 'cough'],
    indications: [
      {
        ar: 'التهاب واحتقان الحلق المؤلم عند البلع، والصداع التوتري المصاحب للعدوى الفيروسية.',
        en: 'Acute viral pharyngitis (sore throat), tension headache, and generalized body aches.',
      },
      {
        ar: 'رغبة المريض في تخفيف الألم بطرق آمنة خاصة لمرضى قرحة المعدة أو الكلى أو الضغط الذين يُمنعون من المسكنات (NSAIDs).',
        en: 'Pain relief for patients with gastric ulcers, renal disease, or hypertension who must avoid NSAIDs.',
      },
    ],
    contraindications: [
      {
        ar: 'تُمنع الغرغرة في الأطفال الصغار (أقل من 6 سنوات) أو المرضى الذين يعانون من صعوبة البلع خشية الشرقة والاختناق.',
        en: 'Saline gargling is contraindicated in children under 6 years or patients with impaired gag/swallowing reflex.',
      },
      {
        ar: 'لا تُستخدم كبديل للفحص الطبي عند وجود ألم حاد مفاجئ في الصدر أو البطن أو الأذن.',
        en: 'Do not delay medical evaluation in cases of acute severe chest, abdominal, or ear pain.',
      },
    ],
    steps: [
      {
        ar: '1. الغرغرة الملحية الاسموزية (Hypertonic/Isotonic Gargle): إذابة نصف ملعقة صغيرة من الملح في كوب ماء دافئ (200 مل)، الغرغرة لمدة 20 ثانية في مؤخرة الحلق ثم بصقها (تكرر 3–4 مرات يومياً لسحب السوائل من الأنسجة المتورمة).',
        en: '1. Osmotic Saline Gargle: Dissolve 1/2 tsp salt in 200 mL warm water, gargle for 20s at back of throat, and spit out (draws edema fluid out of inflamed mucosa).',
      },
      {
        ar: '2. وضعية نصف الجلوس (Semi-Fowler’s Position): رفع الرأس والظهر بزاوية 30–45 درجة لتقليل ضغط الاحتقان الوريدي في الرأس والجيوب الأنفية والحلق.',
        en: '2. Semi-Fowler Positioning: Elevate head of bed 30–45 degrees to reduce venous congestion in cranial and pharyngeal tissues.',
      },
      {
        ar: '3. الاسترخاء العضلي التدريجي والتنفس البطني (4-7-8 Breathing): أخذ شهيق هادئ في 4 ثوانٍ، وإخراج زفير بطيء لتقليل توتر العضلات وتنشيط العصب الحائر المسكن للألم.',
        en: '3. Paced Diaphragmatic Breathing & PMR: Slow inhalation (4s) and extended exhalation to activate parasympathetic pain modulation.',
      },
    ],
    precautions: [
      {
        ar: 'التأكد من عدم ابتلاع ماء الغرغرة المملح خاصة لمرضى ارتفاع ضغط الدم.',
        en: 'Do not swallow saline gargle solution, especially in patients with hypertension.',
      },
      {
        ar: 'عدم زيادة كمية الملح عن نصف ملعقة صغيرة حتى لا تسبب جفافاً وتهيجاً عكسياً بالحلق.',
        en: 'Do not exceed 1/2 teaspoon of salt per cup, as overly concentrated brine irritates mucosa.',
      },
    ],
    warningSigns: [
      {
        ar: 'عدم القدرة على بلع اللعاب أو السوائل، أو سيلان اللعاب، أو تغير الصوت ليصبح مكتوماً (Hot Potato Voice).',
        en: 'Inability to swallow saliva, drooling, muffled "hot potato" voice, or trismus (peritonsillar abscess risk).',
      },
      {
        ar: 'تورم ظاهر في جانب واحد من الرقبة أو اللوزتين مع حمى شديدة فوق 38.5°C بدون كحة.',
        en: 'Unilateral tonsillar swelling/exudate with high fever >38.5°C and absence of cough (warrants clinical strep evaluation).',
      },
    ],
  },
];

export default function SymptomNursingCareSystem() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomId[]>([
    'cough',
    'sputum',
    'chest_congestion',
  ]);
  const [activeDomainFilter, setActiveDomainFilter] = useState<NursingDomainId | 'all'>('all');

  const toggleSymptom = (id: SymptomId) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const matchedSymptoms = useMemo(
    () => SYMPTOM_OPTIONS.filter((s) => selectedSymptoms.includes(s.id)),
    [selectedSymptoms]
  );

  const matchedProcedures = useMemo(() => {
    const bySymptom =
      selectedSymptoms.length === 0
        ? NURSING_PROCEDURES
        : NURSING_PROCEDURES.filter((proc) =>
            proc.linkedSymptoms.some((s) => selectedSymptoms.includes(s))
          );
    if (activeDomainFilter === 'all') return bySymptom;
    return bySymptom.filter((proc) => proc.domainId === activeDomainFilter);
  }, [selectedSymptoms, activeDomainFilter]);

  return (
    <div className="stack" dir={isAr ? 'rtl' : 'ltr'} style={{ gap: '20px' }}>
      {/* STEP 1: Interactive Multi-Symptom Selector Card */}
      <section
        className="card"
        style={{
          borderRadius: '20px',
          border: '2px solid #059669',
          background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
          padding: '22px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          <div>
            <span
              style={{
                background: '#059669',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              🩺 {tr(lang, 'نظام الرعاية غير الدوائية والتدخلات التمريضية المبني على الأعراض', 'SYMPTOM-BASED NON-PHARMACOLOGICAL & NURSING CARE SYSTEM')}
            </span>
            <h2 style={{ margin: '8px 0 4px', color: '#064e3b', fontSize: '1.38rem' }}>
              {tr(
                lang,
                '1. اختر الأعراض التي تعاني منها لعرض خطة الرعاية غير الدوائية والإجراءات التمريضية:',
                '1. Select Your Current Symptoms to Generate Non-Pharmacological & Nursing Care Procedures:'
              )}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'يمكنك اختيار عرض واحد أو أكثر (مثل: الكحة + البلغم + احتقان الصدر + الحرارة + الألم والصداع) ليقوم النظام بربطها بالتدخلات التمريضية الآمنة.',
                'Select one or more symptoms below to view targeted non-pharmacological care and step-by-step clinical nursing procedures.'
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn small ghost"
              onClick={() => setSelectedSymptoms(SYMPTOM_OPTIONS.map((s) => s.id))}
            >
              ✓ {tr(lang, 'تحديد كل الأعراض', 'Select All')}
            </button>
            <button
              type="button"
              className="btn small ghost"
              onClick={() => setSelectedSymptoms(['cough'])}
            >
              ↺ {tr(lang, 'إعادة ضبط', 'Reset')}
            </button>
          </div>
        </div>

        {/* 6 Symptom Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
            gap: '12px',
            marginTop: '14px',
          }}
        >
          {SYMPTOM_OPTIONS.map((sym) => {
            const active = selectedSymptoms.includes(sym.id);
            return (
              <button
                key={sym.id}
                type="button"
                onClick={() => toggleSymptom(sym.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '16px',
                  background: active ? '#ecfdf5' : '#ffffff',
                  border: active ? '2.5px solid #059669' : '1.5px solid #cbd5e1',
                  boxShadow: active ? '0 8px 20px rgba(5, 150, 105, 0.14)' : 'none',
                  cursor: 'pointer',
                  textAlign: isAr ? 'right' : 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <span
                  style={{
                    fontSize: '1.65rem',
                    background: active ? '#d1fae5' : '#f1f5f9',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {sym.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <b style={{ fontSize: '0.98rem', color: '#0f172a' }}>{pick(sym.label, lang)}</b>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: active ? '#059669' : '#e2e8f0',
                        color: active ? '#fff' : 'transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                  </div>
                  <div className="small muted" style={{ marginTop: '4px', lineHeight: 1.45 }}>
                    {pick(sym.subLabel, lang)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 2: Immediate Symptom-Specific Non-Pharmacological Self-Care Summary */}
      {matchedSymptoms.length > 0 && (
        <section
          className="card"
          style={{
            borderRadius: '18px',
            borderTop: '4px solid #0d9488',
            padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '1.2rem' }}>
            🌿 {tr(lang, '2. وسائل الرعاية غير الدوائية المباشرة للأعراض المختارة:', '2. Direct Non-Pharmacological Care Measures for Your Selected Symptoms:')}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {matchedSymptoms.map((sym) => (
              <div
                key={sym.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <div style={{ fontWeight: 900, color: '#0f766e', fontSize: '0.96rem', marginBottom: '8px' }}>
                  {sym.icon} {pick(sym.label, lang)}
                </div>
                <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '0.86rem', color: '#334155', lineHeight: 1.65 }}>
                  {sym.nonPharmQuickTips.map((tip, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      {pick(tip, lang)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STEP 3: Evidence-Based Nursing Procedures (Heat & Cold / Chest Physiotherapy / Non-Pharm Pain Relief) */}
      <section className="stack" style={{ gap: '14px' }}>
        <div
          className="card"
          style={{
            background: '#0f172a',
            color: '#fff',
            borderRadius: '18px',
            padding: '18px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#5eead4', fontSize: '1.25rem' }}>
              🏥 {tr(lang, '3. الإجراءات التمريضية المرتبطة بالأعراض (Clinical Nursing Procedures)', '3. Evidence-Based Clinical Nursing Procedures')}
            </h3>
            <p className="small" style={{ margin: '4px 0 0', color: '#cbd5e1' }}>
              {tr(
                lang,
                'يشمل كل إجراء تمريضي: دواعي الاستخدام، موانع الاستخدام، خطوات التنفيذ، الاحتياطات، والعلامات التحذيرية لمراجعة الطبيب.',
                'Each procedure details Indications, Contraindications, Step-by-Step Execution, Nursing Precautions, and Red-Flag Warning Signs.'
              )}
            </p>
          </div>

          {/* Domain Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all' as const, ar: 'كل الإجراءات', en: 'All Procedures' },
              { id: 'heat_cold' as const, ar: '🧊 الحرارة والبرودة', en: '🧊 Heat & Cold' },
              { id: 'chest_physiotherapy' as const, ar: '🫁 العلاج الطبيعي للصدر', en: '🫁 Chest Physiotherapy' },
              { id: 'pain_relief' as const, ar: '🧘 تسكين الألم غير الدوائي', en: '🧘 Pain Relief' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDomainFilter(tab.id)}
                style={{
                  background: activeDomainFilter === tab.id ? '#14b8a6' : '#1e293b',
                  color: activeDomainFilter === tab.id ? '#0f172a' : '#e2e8f0',
                  border: '1px solid #334155',
                  borderRadius: '99px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isAr ? tab.ar : tab.en}
              </button>
            ))}
          </div>
        </div>

        {/* Procedure Cards */}
        {matchedProcedures.map((proc) => (
          <article
            key={proc.id}
            className="card"
            style={{
              borderRadius: '20px',
              borderTop: `5px solid ${proc.domainColor}`,
              padding: '22px',
              boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <span
                  style={{
                    background: `${proc.domainColor}18`,
                    color: proc.domainColor,
                    padding: '4px 12px',
                    borderRadius: '99px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                  }}
                >
                  {proc.icon} {pick(proc.domainBadge, lang)}
                </span>
                <h3 style={{ margin: '8px 0 4px', fontSize: '1.28rem', color: '#0f172a' }}>
                  {pick(proc.title, lang)}
                </h3>
                <p className="small muted" style={{ margin: 0 }}>
                  {pick(proc.subtitle, lang)}
                </p>
              </div>
              <button
                type="button"
                className="btn small ghost no-print"
                onClick={() => window.print()}
              >
                🖨️ {tr(lang, 'طباعة الإجراء', 'Print Procedure')}
              </button>
            </div>

            {/* 5 Structured Clinical Sections Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {/* 1. Indications */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <b style={{ color: '#166534', fontSize: '0.95rem', display: 'block', marginBottom: '6px' }}>
                  ✅ {tr(lang, '1. دواعي الاستخدام (Indications):', '1. Clinical Indications:')}
                </b>
                <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '0.86rem', color: '#14532d', lineHeight: 1.6 }}>
                  {proc.indications.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{pick(item, lang)}</li>
                  ))}
                </ul>
              </div>

              {/* 2. Contraindications */}
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <b style={{ color: '#991b1b', fontSize: '0.95rem', display: 'block', marginBottom: '6px' }}>
                  🚫 {tr(lang, '2. موانع الاستخدام (Contraindications):', '2. Contraindications:')}
                </b>
                <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '0.86rem', color: '#7f1d1d', lineHeight: 1.6 }}>
                  {proc.contraindications.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{pick(item, lang)}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. Step-by-Step Execution */}
            <div
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '16px',
                marginTop: '12px',
              }}
            >
              <b style={{ color: '#0f172a', fontSize: '0.98rem', display: 'block', marginBottom: '8px' }}>
                📋 {tr(lang, '3. خطوات التنفيذ التمريضية خطوة بخطوة (Step-by-Step Procedure):', '3. Step-by-Step Nursing Procedure Execution:')}
              </b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {proc.steps.map((stepItem, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '0.88rem',
                      color: '#1e293b',
                      fontWeight: 600,
                      lineHeight: 1.55,
                    }}
                  >
                    {pick(stepItem, lang)}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                marginTop: '12px',
              }}
            >
              {/* 4. Nursing Precautions */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <b style={{ color: '#1e40af', fontSize: '0.95rem', display: 'block', marginBottom: '6px' }}>
                  🛡️ {tr(lang, '4. الاحتياطات ومعايير الأمان (Precautions):', '4. Nursing Precautions & Safety:')}
                </b>
                <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '0.86rem', color: '#1e3a8a', lineHeight: 1.6 }}>
                  {proc.precautions.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{pick(item, lang)}</li>
                  ))}
                </ul>
              </div>

              {/* 5. Warning Signs Requiring Physician Review */}
              <div
                style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fcd34d',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <b style={{ color: '#b45309', fontSize: '0.95rem', display: 'block', marginBottom: '6px' }}>
                  🚨 {tr(lang, '5. العلامات التحذيرية التي تستدعي مراجعة الطبيب (Red Flags):', '5. Warning Signs Requiring Physician Evaluation:')}
                </b>
                <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '0.86rem', color: '#92400e', lineHeight: 1.6, fontWeight: 700 }}>
                  {proc.warningSigns.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{pick(item, lang)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>
      {/* Academic Nursing & Clinical References Box */}
      <section
        className="card"
        style={{
          borderRadius: '18px',
          border: '1.5px solid #cbd5e1',
          background: '#f8fafc',
          padding: '18px 20px',
        }}
      >
        <b style={{ fontSize: '1rem', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
          📚 {tr(lang, 'المراجع العلمية والتمريضية المعتمدة لهذا النظام (Evidence-Based Nursing References):', 'Evidence-Based Nursing & Clinical References:')}
        </b>
        <ul style={{ margin: 0, paddingInlineStart: '20px', fontSize: '0.85rem', color: '#334155', lineHeight: 1.7 }}>
          <li>
            <b>Perry, A. G., &amp; Potter, P. A.</b> — <i>Clinical Nursing Skills &amp; Techniques</i> (10th Ed., Elsevier): Heat &amp; Cold Applications, Tepid Sponge Bath, and Chest Physiotherapy (Postural Drainage, Percussion &amp; Huff Coughing).
          </li>
          <li>
            <b>Hinkle, J. L., &amp; Cheever, K. H. (Brunner &amp; Suddarth)</b> — <i>Textbook of Medical-Surgical Nursing</i> (15th Ed., Wolters Kluwer): Non-Pharmacological Pain Management, Upper Respiratory Viral Care, and Airway Clearance.
          </li>
          <li>
            <b>World Health Organization (WHO) &amp; NICE Guideline NG15</b> — <i>The WHO AWaRe Antibiotic Book &amp; Delayed/Non-Antibiotic Prescribing Protocols</i>.
          </li>
        </ul>
      </section>
    </div>
  );
}
