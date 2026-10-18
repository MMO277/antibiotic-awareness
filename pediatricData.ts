import { Bi } from './types';

export interface PediatricSuspension {
  id: string;
  tradeName: Bi;
  genericName: Bi;
  concentrationMgPer5ml: number; // e.g. 457, 228, 200, 100
  mgPerMl: number; // e.g. 91.4, 45.6, 40, 20
  standardDoseMgPerKgPerDay: number; // e.g. 45 for amoxicillin
  highDoseMgPerKgPerDay?: number; // e.g. 90 for otitis media
  dosesPerDay: number; // 1, 2, 3, or 4
  frequencyHours: number; // 24, 12, 8, or 6
  shelfLifeDays: number; // 7, 10, 14
  storageCondition: 'fridge' | 'room_temp';
  storageNote: Bi;
  reconstitutionWaterVolMl: number; // water needed to reach the mark (e.g. 60ml, 70ml)
  specialNursingTip: Bi;
}

export const PEDIATRIC_SUSPENSIONS: PediatricSuspension[] = [
  {
    id: 'augmentin_457',
    tradeName: { ar: 'أوجمنتين 457 مجم شراب معلق (Augmentin 457)', en: 'Augmentin 457mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين + كلافولانات', en: 'Amoxicillin + Clavulanate' },
    concentrationMgPer5ml: 457,
    mgPerMl: 80, // based on 400mg amoxicillin component per 5ml
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 7,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يجب حفظه في باب الثلاجة (2 إلى 8 درجات مئوية) وصلاحيته 7 أيام فقط بعد الحل بالماء!',
      en: 'Store strictly in the refrigerator (2-8°C). Discard after 7 days.',
    },
    reconstitutionWaterVolMl: 64,
    specialNursingTip: {
      ar: 'يعطى مع بداية وجبة طعام خفيفة لتقليل اضطراب المعدة والإسهال. رج الزجاجة جيداً قبل كل جرعة.',
      en: 'Give at the start of a meal to reduce nausea and diarrhea. Shake bottle vigorously before each dose.',
    },
  },
  {
    id: 'curam_457',
    tradeName: { ar: 'كيورام 457 مجم شراب معلق (Curam 457)', en: 'Curam 457mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين + كلافولانات', en: 'Amoxicillin + Clavulanate' },
    concentrationMgPer5ml: 457,
    mgPerMl: 80,
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 7,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ في الثلاجة (2 إلى 8 درجات مئوية) وصلاحيته 7 أيام فقط بعد الحل.',
      en: 'Refrigerate (2-8°C); strictly discard after 7 days.',
    },
    reconstitutionWaterVolMl: 64,
    specialNursingTip: {
      ar: 'عند نسيان جرعة الطفل، لا تضاعف الجرعة أبداً ولا تعطِ جرعة إضافية أو تتخطَّها تلقائياً؛ استشر الطبيب أو الصيدلي لمعرفة التصرف الآمن المخصص لوزن الطفل ودوائه.',
      en: 'If a dose is missed, never double the dose, give an extra dose, or automatically skip/replace it; consult the prescribing doctor or pharmacist for medicine-specific instructions.',
    },
  },
  {
    id: 'hibiotic_457',
    tradeName: { ar: 'هاي بيوتك 457 مجم شراب معلق (Hibiotic 457)', en: 'Hibiotic 457mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين + كلافولانات', en: 'Amoxicillin + Clavulanate' },
    concentrationMgPer5ml: 457,
    mgPerMl: 80,
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 7,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ في الثلاجة لمدة 7 أيام فقط بعد حله بالماء المقطر.',
      en: 'Store in refrigerator; valid for 7 days post-reconstitution.',
    },
    reconstitutionWaterVolMl: 64,
    specialNursingTip: {
      ar: 'استخدم سرنجة القياس المدرجة بالملليلتر، وممنوع استخدام ملاعق الطعام المنزلية.',
      en: 'Always use an oral dosing syringe marked in milliliters. Never use kitchen spoons.',
    },
  },
  {
    id: 'augmentin_228',
    tradeName: { ar: 'أوجمنتين 228 مجم شراب معلق (Augmentin 228)', en: 'Augmentin 228mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين + كلافولانات', en: 'Amoxicillin + Clavulanate' },
    concentrationMgPer5ml: 228,
    mgPerMl: 40, // 200mg amoxicillin per 5ml
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 7,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ في الثلاجة لمدة 7 إلى 10 أيام فقط.',
      en: 'Keep refrigerated; discard after 7-10 days.',
    },
    reconstitutionWaterVolMl: 64,
    specialNursingTip: {
      ar: 'مناسب للأوزان الخفيفة والأطفال الصغار لضبط كمية السائل بسهولة.',
      en: 'Ideal for younger infants to achieve manageable dosing volume.',
    },
  },
  {
    id: 'emox_250',
    tradeName: { ar: 'إي-موكس 250 مجم شراب معلق (E-Mox 250)', en: 'E-Mox 250mg/5ml Suspension' },
    genericName: { ar: 'أموكسيسيلين نقي', en: 'Pure Amoxicillin' },
    concentrationMgPer5ml: 250,
    mgPerMl: 50,
    standardDoseMgPerKgPerDay: 45,
    highDoseMgPerKgPerDay: 90,
    dosesPerDay: 3,
    frequencyHours: 8,
    shelfLifeDays: 10,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ في الثلاجة ومدة صلاحيته 10 إلى 14 يوماً بعد الحل.',
      en: 'Refrigerate after mixing; good for 10-14 days.',
    },
    reconstitutionWaterVolMl: 60,
    specialNursingTip: {
      ar: 'يقسم على 3 جرعات كل 8 ساعات (مثلاً 8 صباحاً، 4 عصراً، 12 منتصف الليل).',
      en: 'Divide into 3 doses every 8 hours for consistent blood levels.',
    },
  },
  {
    id: 'zithromax_200',
    tradeName: { ar: 'زيثروماكس 200 مجم شراب (Zithromax 200)', en: 'Zithromax 200mg/5ml Suspension' },
    genericName: { ar: 'أزيثرومايسين', en: 'Azithromycin' },
    concentrationMgPer5ml: 200,
    mgPerMl: 40,
    standardDoseMgPerKgPerDay: 10, // 10 mg/kg once daily for 3 days
    dosesPerDay: 1,
    frequencyHours: 24,
    shelfLifeDays: 10,
    storageCondition: 'room_temp',
    storageNote: {
      ar: '⚠️ تنبيه سريري مهم: يحفظ في درجة حرارة الغرفة (لا يوضع في الثلاجة حتى لا تزيد لزوجته وتزداد مرارته)! وصلاحيته 10 أيام.',
      en: '⚠️ Important: Store at ROOM TEMPERATURE (Do NOT refrigerate; chilling increases bitterness and viscosity). Valid 10 days.',
    },
    reconstitutionWaterVolMl: 15,
    specialNursingTip: {
      ar: 'يُعطى مرة واحدة فقط يومياً على معدة فارغة (قبل الأكل بساعة أو بعده بساعتين) لمدة 3 أيام فقط.',
      en: 'Administer once daily on an empty stomach for 3 consecutive days only.',
    },
  },
  {
    id: 'xithrone_200',
    tradeName: { ar: 'زيثرون 200 مجم شراب معلق (Xithrone 200)', en: 'Xithrone 200mg/5ml Suspension' },
    genericName: { ar: 'أزيثرومايسين', en: 'Azithromycin' },
    concentrationMgPer5ml: 200,
    mgPerMl: 40,
    standardDoseMgPerKgPerDay: 10,
    dosesPerDay: 1,
    frequencyHours: 24,
    shelfLifeDays: 10,
    storageCondition: 'room_temp',
    storageNote: {
      ar: 'يحفظ في درجة حرارة الغرفة (أقل من 25 درجة) ولا يوضع في الثلاجة.',
      en: 'Store at room temperature below 25°C. Do NOT refrigerate.',
    },
    reconstitutionWaterVolMl: 15,
    specialNursingTip: {
      ar: 'كورس العلاج 3 أيام فقط ويبقى مفعوله في أنسجة الطفل لعدة أيام بعد التوقف.',
      en: 'Course is only 3 days; drug half-life remains therapeutically active for days after.',
    },
  },
  {
    id: 'flagyl_125',
    tradeName: { ar: 'فلاجيل 125 مجم شراب معلق (Flagyl 125)', en: 'Flagyl 125mg/5ml Suspension' },
    genericName: { ar: 'ميترونيدازول بنزوات', en: 'Metronidazole benzoate' },
    concentrationMgPer5ml: 125,
    mgPerMl: 25,
    standardDoseMgPerKgPerDay: 30,
    dosesPerDay: 3,
    frequencyHours: 8,
    shelfLifeDays: 30, // premixed liquid
    storageCondition: 'room_temp',
    storageNote: {
      ar: 'محلول معلق جاهز؛ يحفظ في درجة حرارة الغرفة بعيداً عن الضوء الشديد.',
      en: 'Premixed suspension; store at room temperature away from direct light.',
    },
    reconstitutionWaterVolMl: 0,
    specialNursingTip: {
      ar: 'يُعطى بعد الأكل لتقليل الطعم المعدني واضطراب المعدة. تلون البول بلون داكن طبيعي ومؤقت.',
      en: 'Administer after feeding to minimize metallic taste. Dark urine is harmless.',
    },
  },
  {
    id: 'suprax_100',
    tradeName: { ar: 'سوبراكس 100 مجم شراب معلق (Suprax 100)', en: 'Suprax 100mg/5ml Suspension' },
    genericName: { ar: 'سيفيكسيم', en: 'Cefixime' },
    concentrationMgPer5ml: 100,
    mgPerMl: 20,
    standardDoseMgPerKgPerDay: 8,
    dosesPerDay: 1, // or divided twice daily
    frequencyHours: 24,
    shelfLifeDays: 14,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يمكن حفظه في الثلاجة أو بحرارة الغرفة المعتدلة وصلاحيته 14 يوماً بعد الحل.',
      en: 'Store in refrigerator or controlled room temperature; valid for 14 days.',
    },
    reconstitutionWaterVolMl: 40,
    specialNursingTip: {
      ar: 'يتميز بإمكانية إعطائه كجرعة واحدة يومياً مما يسهل جداً التزام الطفل بالعلاج.',
      en: 'Convenient single daily dose significantly improves pediatric compliance.',
    },
  },
  {
    id: 'zinnat_125',
    tradeName: { ar: 'زينات 125 مجم شراب معلق (Zinnat 125)', en: 'Zinnat 125mg/5ml Suspension' },
    genericName: { ar: 'سيفوروكسيم أكسيتيل', en: 'Cefuroxime axetil' },
    concentrationMgPer5ml: 125,
    mgPerMl: 25,
    standardDoseMgPerKgPerDay: 20,
    highDoseMgPerKgPerDay: 30,
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 10,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ حصراً في الثلاجة (2 إلى 8 درجات) وصلاحيته 10 أيام فقط.',
      en: 'Must be kept in refrigerator (2-8°C); strictly good for 10 days.',
    },
    reconstitutionWaterVolMl: 37,
    specialNursingTip: {
      ar: 'يجب تناوله بعد الطعام مباشرة لزيادة الامتصاص وتقليل الطعم المر الشديد للسيفوروكسيم.',
      en: 'Give immediately after feeding to enhance absorption and mask strong bitter taste.',
    },
  },
  {
    id: 'ospexin_250',
    tradeName: { ar: 'أوسبكسين 250 مجم شراب معلق (Ospexin 250)', en: 'Ospexin 250mg/5ml Suspension' },
    genericName: { ar: 'سيفالكسين', en: 'Cephalexin' },
    concentrationMgPer5ml: 250,
    mgPerMl: 50,
    standardDoseMgPerKgPerDay: 30,
    highDoseMgPerKgPerDay: 50,
    dosesPerDay: 3,
    frequencyHours: 8,
    shelfLifeDays: 14,
    storageCondition: 'fridge',
    storageNote: {
      ar: 'يحفظ في الثلاجة ومدة صلاحيته 14 يوماً بعد الحل.',
      en: 'Store in refrigerator; valid for 14 days after reconstitution.',
    },
    reconstitutionWaterVolMl: 45,
    specialNursingTip: {
      ar: 'رج الزجاجة جيداً قبل كل جرعة لضمان توزيع جزيئات السيفالكسين بالتساوي.',
      en: 'Shake well prior to each dose to ensure uniform drug dispersion.',
    },
  },
  {
    id: 'septazole_ped',
    tradeName: { ar: 'سبتازول شراب معلق للأطفال (Septazole)', en: 'Septazole Pediatric Suspension' },
    genericName: { ar: 'سلفاميثوكسازول + تريميثوبريم', en: 'Co-trimoxazole' },
    concentrationMgPer5ml: 240, // 200mg sulfa + 40mg trimethoprim
    mgPerMl: 8, // based on trimethoprim component (8mg/ml)
    standardDoseMgPerKgPerDay: 8, // 8mg/kg/day of trimethoprim
    dosesPerDay: 2,
    frequencyHours: 12,
    shelfLifeDays: 30,
    storageCondition: 'room_temp',
    storageNote: {
      ar: 'يحفظ في درجة حرارة الغرفة بعيداً عن الحرارة المباشرة.',
      en: 'Store at room temperature away from excessive heat.',
    },
    reconstitutionWaterVolMl: 0,
    specialNursingTip: {
      ar: 'ممنوع للرضع أقل من شهرين. احرصي على شرب الطفل لكميات وافرة من الماء لمنع تكون بلورات السلفا.',
      en: 'Contraindicated in infants <2 months. Ensure high fluid intake to prevent crystalluria.',
    },
  },
];

export interface ReconstitutionStep {
  stepNumber: number;
  title: Bi;
  instruction: Bi;
  nursingWarning: Bi;
  icon: string;
}

export const RECONSTITUTION_STEPS: ReconstitutionStep[] = [
  {
    stepNumber: 1,
    title: { ar: 'تفكيك البودرة الجافة أولاً', en: 'Loosen the Dry Powder' },
    instruction: {
      ar: 'قبل إضافة أي ماء، اقلبي الزجاجة ورجيها بلطف وهي جافة، أو اضغطي بأصابعك على قاع الزجاجة لتفكيك البودرة المتكتلة في القاع.',
      en: 'Before adding water, turn the bottle upside down and tap the base to loosen the compacted dry powder.',
    },
    nursingWarning: {
      ar: 'خطأ شائع: إذا لم تفكك البودرة، ستلتصق في القاع كالعجين ولن تذوب، مما يفسد تركيز الجرعة.',
      en: 'Common Error: Unloosened powder clumps at the bottom, resulting in inaccurate dosing.',
    },
    icon: '🌪️',
  },
  {
    stepNumber: 2,
    title: { ar: 'إضافة ثلثي كمية الماء المقطر', en: 'Add Two-Thirds of Water' },
    instruction: {
      ar: 'استخدمي فقط أمبولات الماء المقطر المرفقة مع الدواء وبدرجة حرارة الغرفة (ممنوع استخدام ماء ساخن أو مغلي أو ماء الصنبور!). صبي ثلثي كمية الماء فقط.',
      en: 'Use only purified distilled water at room temperature (never warm, boiled, or tap water!). Pour approximately two-thirds first.',
    },
    nursingWarning: {
      ar: 'تحذير تمريضي حرج: الماء الدافئ أو الساخن يفكك جزيئات المضاد الحيوي ويجعله غير فعال تماماً!',
      en: 'Critical Nursing Alert: Warm or hot water chemically degrades the antibiotic molecule!',
    },
    icon: '💧',
  },
  {
    stepNumber: 3,
    title: { ar: 'الرج العنيف ثم إكمال الماء للعلامة', en: 'Shake Vigorously & Fill to the Mark' },
    instruction: {
      ar: 'أغلقي الغطاء جيداً ورجي الزجاجة بقوة لمدة 15 إلى 30 ثانية. ثم افتحي الغطاء وأكملي إضافة الماء المقطر بحذر شديد حتى يصل مستوى السائل تماماً إلى السهم أو العلامة المحفورة على الزجاجة، ثم رجي مرة ثانية.',
      en: 'Close tightly and shake vigorously for 20-30 seconds. Then carefully add remaining water precisely to the indicator ring/arrow mark, and shake again.',
    },
    nursingWarning: {
      ar: 'تنبيه: زيادة الماء عن العلامة تخفف الدواء وتقلل مفعوله، ونقصان الماء يركز الدواء ويزيد التسمم.',
      en: 'Warning: Overfilling dilutes potency, while underfilling increases toxicity risk.',
    },
    icon: '📏',
  },
  {
    stepNumber: 4,
    title: { ar: 'تهدئة الرغوة والتخزين في الثلاجة', en: 'Settle Foam & Refrigerate' },
    instruction: {
      ar: 'اتركي الزجاجة لمدة 5 دقائق لتهدأ الرغوة الهوائية، ثم ضعيها مباشرة في باب الثلاجة (بين 2 و 8 درجات مئوية). اكتبي تاريخ اليوم على الزجاجة بالقلم.',
      en: 'Allow 5 minutes for air bubbles to dissipate, then immediately place in the refrigerator door (2-8°C). Write today’s date on the bottle.',
    },
    nursingWarning: {
      ar: 'قاعدة ذهبية: تركه خارج الثلاجة في حرارة الصيف يفسد الدواء خلال 48 ساعة ويتحول لمادة مجهدة للكلى.',
      en: 'Golden Rule: Leaving reconstituted amoxicillin at summer room temperatures degrades it within 48 hours.',
    },
    icon: '🧊',
  },
];
