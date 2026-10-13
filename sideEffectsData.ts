import { Bi } from './types';

export type SymptomSeverity = 'emergency' | 'prompt' | 'mild';

export interface SymptomDetail {
  id: string;
  name: Bi;
  severity: SymptomSeverity;
  category: 'digestive' | 'allergic' | 'skin' | 'musculoskeletal' | 'general';
  description: Bi;
  immediateAction: Bi;
  nursingAdvice: Bi;
  commonOffenders: Bi;
}

export const EMERGENCY_WARNINGS: Bi = {
  ar: 'إذا ظهرت أي من هذه الأعراض: صعوبة في التنفس أو صفير، تورم في الوجه أو الشفتين أو اللسان أو الحلق، طفح جلدي حاد مع فقاعات وتقشر، أو إغماء وهبوط حاد — توقف فوراً واطلب الإسعاف (123 في مصر) أو توجه لأقرب قسم طوارئ الآن!',
  en: 'If any of these warning signs occur: difficulty breathing or wheezing, swelling of face, lips, tongue, or throat, severe blistering rash, or fainting/collapse — stop immediately and seek emergency medical assistance (call ambulance or go to nearest ER)!',
};

export const SYMPTOMS_LIST: SymptomDetail[] = [
  {
    id: 'anaphylaxis_breathing',
    name: { ar: 'صعوبة التنفس، الصفير، أو ضيق الصدر الحاد', en: 'Difficulty breathing, wheezing, or chest tightness' },
    severity: 'emergency',
    category: 'allergic',
    description: {
      ar: 'علامة كلاسيكية لصدمة الحساسية المفرطة (Anaphylaxis)؛ انقباض في القصبات الهوائية يهدد مجرى الهواء بالحظر التام.',
      en: 'Classic hallmark of anaphylaxis; acute bronchospasm threatening airway patency.',
    },
    immediateAction: {
      ar: 'طوارئ فورية! اتصل بالإسعاف فوراً (123). لا تتناول أي جرعة أخرى من الدواء ولا تنتظر، واجلس في وضع مستقيم لتسهيل التنفس.',
      en: 'Immediate Emergency! Call emergency services immediately. Do not take any further doses and remain upright.',
    },
    nursingAdvice: {
      ar: 'أولوية تمريضية قصوى: تأمين مجرى التنفس، مراقبة العلامات الحيوية، وتجهيز الإبينفرين (الأدرينالين) فور وصول الطاقم الطبي.',
      en: 'Highest Nursing Priority: Maintain airway, monitor vitals, prepare IM epinephrine immediately.',
    },
    commonOffenders: { ar: 'البنسلين، السيفالوسبورينات، وكافة المضادات الحيوية', en: 'Penicillins, cephalosporins, and any antibiotic' },
  },
  {
    id: 'angioedema_swelling',
    name: { ar: 'تورم اللسان، الشفتين، الحلق، أو الوجه (الوذمة الوعائية)', en: 'Swelling of the tongue, lips, throat, or face (Angioedema)' },
    severity: 'emergency',
    category: 'allergic',
    description: {
      ar: 'تورم الأنسجة الرخوة في الحلق واللسان قد يغلق مجرى الهواء خلال دقائق ويمنع البلع والتنفس.',
      en: 'Rapid swelling of mucosal tissues that can obstruct the upper airway within minutes.',
    },
    immediateAction: {
      ar: 'طوارئ فورية! توجه لأقرب قسم طوارئ في المستشفى فوراً أو اطلب الإسعاف دون أي تأخير.',
      en: 'Immediate Emergency! Proceed to the nearest hospital emergency room immediately.',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي: مراقبة القدرة على البلع والصوت، وتوثيق اسم الدواء المشتبه به كحساسية دوائية خطيرة في ملف المريض.',
      en: 'Nursing Note: Assess swallowing and stridor; document suspect drug as a severe allergy in chart.',
    },
    commonOffenders: { ar: 'البنسلينات ومشتقاتها، ومضادات بيتا-لاكتام', en: 'Penicillins and beta-lactams' },
  },
  {
    id: 'severe_diarrhea_cdiff',
    name: { ar: 'إسهال مائي شديد ومستمر (أكثر من 4-6 مرات يومياً) أو مصحوب بدم', en: 'Severe, watery, or bloody diarrhea (>4-6 times/day)' },
    severity: 'prompt',
    category: 'digestive',
    description: {
      ar: 'قد يشير إلى التهاب القولون الغشائي الكاذب وعدوى بكتيريا المطثية العسيرة (C. difficile) الناتجة عن تدمير البكتيريا النافعة بالأمعاء.',
      en: 'May indicate Clostridioides difficile colitis secondary to disruption of the gut microbiome.',
    },
    immediateAction: {
      ar: 'استشارة طبية عاجلة خلال ساعات! اتصل بالطبيب فوراً. لا تأخذ أدوية مضادة للإسهال (مثل إيموديوم) من تلقاء نفسك لأنها تحبس السموم في الأمعاء!',
      en: 'Prompt medical attention! Contact your doctor promptly. Do NOT take OTC anti-motility drugs (loperamide) as they trap toxins.',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي: تعويض السوائل والأملاح لمنع الجفاف، عزل المريض وغسل اليدين بالماء والصابون (الكحول لا يقتل أبواغ C. diff).',
      en: 'Nursing Stewardship: Rehydrate, isolate, and use soap and water (alcohol rubs do not kill C. difficile spores).',
    },
    commonOffenders: { ar: 'كليندامايسين، سيبروفلوكساسين، أموكسيسيلين/كلافولانات، السيفالوسبورينات', en: 'Clindamycin, fluoroquinolones, Augmentin, cephalosporins' },
  },
  {
    id: 'tendon_pain',
    name: { ar: 'ألم مفاجئ، تورم، أو التهاب في الأوتار (خاصة كعب القدم / وتر أكيلس)', en: 'Sudden tendon pain, swelling, or tenderness (Achilles tendon)' },
    severity: 'prompt',
    category: 'musculoskeletal',
    description: {
      ar: 'أثر جانبي خطير معروف لمضادات الفلوروكينولون يسبب التهاب أو تمزق الأوتار حتى بعد انتهاء العلاج.',
      en: 'Known serious adverse effect of fluoroquinolones risking tendonitis or tendon rupture.',
    },
    immediateAction: {
      ar: 'استشارة طبية عاجلة! أوقف الجرعة فوراً وتجنب المشي أو إجهاد القدم أو ممارسة الرياضة، واتصل بالطبيب لاستبدال الدواء.',
      en: 'Prompt medical evaluation! Rest the affected limb, avoid exercise, and contact doctor to switch antibiotics.',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي: تنبيه المرضى وخاصة كبار السن ومن يتناولون الكورتيزون بتجنب المجهود البدني والتبليغ الفوري عن أي ألم بالكاحل.',
      en: 'Nursing Note: Screen geriatric patients and those on steroids; caution against strenuous weight-bearing.',
    },
    commonOffenders: { ar: 'سيبروفلوكساسين (سيبروفار)، ليفوفلوكساسين (تافانيك)، موكسيفلوكساسين', en: 'Ciprofloxacin, Levofloxacin, Moxifloxacin' },
  },
  {
    id: 'jaundice_dark_urine',
    name: { ar: 'اصفرار العينين والجلد (يرقان) أو بول بني داكن مع إجهاد', en: 'Yellowing of eyes/skin (Jaundice) or dark urine with fatigue' },
    severity: 'prompt',
    category: 'general',
    description: {
      ar: 'قد يشير إلى التهاب كبدي دوائي أو ركود صفراوي ناتج عن بعض المضادات كالأوجمنتين.',
      en: 'May indicate drug-induced cholestasis or hepatotoxicity (common with amoxicillin-clavulanate).',
    },
    immediateAction: {
      ar: 'استشارة طبية عاجلة! راجع الطبيب لفحص وظائف الكبد (ALT/AST والبيليروبين) وتغيير العلاج.',
      en: 'Prompt medical review! Consult physician to evaluate liver function tests (LFTs) and change therapy.',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي: مراقبة بياض العين ولون البول والبراز والتحقق من التاريخ الكبدي السابق للمريض.',
      en: 'Nursing Check: Inspect sclera for icterus, check urine color, and review liver history.',
    },
    commonOffenders: { ar: 'أموكسيسيلين/كلافولانات (أوجمنتين)، كلاريثرومايسين، كوتريموكسازول', en: 'Augmentin, Clarithromycin, Co-trimoxazole' },
  },
  {
    id: 'severe_skin_peeling',
    name: { ar: 'طفح جلدي واسع، تقرحات في الفم، أو تقشر في الجلد مع حمى', en: 'Spreading rash, mouth sores, or skin peeling with fever' },
    severity: 'emergency',
    category: 'skin',
    description: {
      ar: 'قد تكون علامة على متلازمة ستيفنز جونسون (SJS) أو تقشر الأنسجة المتموتة البشروية التسممي (TEN)، وهي طوارئ جلدية مهددة للحياة.',
      en: 'Warning sign of Stevens-Johnson syndrome (SJS) or toxic epidermal necrolysis (TEN).',
    },
    immediateAction: {
      ar: 'طوارئ فورية! أوقف الدواء واذهب لطوارئ المستشفى على الفور لتلقي العلاج المتخصص في العناية المركزة أو الحروق.',
      en: 'Immediate Emergency! Stop medication and seek immediate emergency department admission.',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي حرج: رعاية الجلد كالحروق، مراقبة توازن السوائل والأملاح والحرارة بدقة.',
      en: 'Critical Nursing Care: Treat as burn injury; monitor barrier integrity and fluid loss.',
    },
    commonOffenders: { ar: 'كوتريموكسازول (سبتازول/السلفا)، البنسلينات، والفلوروكينولونات', en: 'Co-trimoxazole (sulfonamides), penicillins, fluoroquinolones' },
  },
  {
    id: 'mild_nausea_stomach',
    name: { ar: 'غثيان خفيف أو ألم واضطراب بالمعدة', en: 'Mild nausea, stomach ache, or discomfort' },
    severity: 'mild',
    category: 'digestive',
    description: {
      ar: 'أثر جانبي شائع جداً ينتج عن تأثير المضاد المباشر على بطانة المعدة.',
      en: 'Very common side effect caused by direct irritation of the gastric mucosa.',
    },
    immediateAction: {
      ar: 'رعاية منزلية خفيفة: تناول المضاد مع بداية الوجبة أو بعد الطعام (إذا لم يكن من الأدوية التي تشترط معدة فارغة). استشر الصيدلي إذا لم يزل.',
      en: 'Home Care: Take with food or light snack (if drug allows). Consult pharmacist if persistent.',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي: التحقق من إرشادات تناول الدواء وتناول وجبات صغيرة منتظمة وشرب الماء.',
      en: 'Nursing Tip: Verify food compatibility and suggest small frequent bland meals.',
    },
    commonOffenders: { ar: 'أوجمنتين، إريثرومايسين، دوكسيسيكلين، ميترونيدازول', en: 'Augmentin, erythromycin, doxycycline, Flagyl' },
  },
  {
    id: 'mild_loose_stool',
    name: { ar: 'إسهال خفيف أو براز لين (1-2 مرة يومياً بدون دم أو مغص حاد)', en: 'Mild loose stools (1-2 times daily without fever/blood)' },
    severity: 'mild',
    category: 'digestive',
    description: {
      ar: 'ينتج عن تغير مؤقت في البكتيريا النافعة للأمعاء دون التهاب حاد.',
      en: 'Results from mild transient alteration in normal intestinal flora without severe colitis.',
    },
    immediateAction: {
      ar: 'رعاية منزلية: شرب سوائل وافرة لتجنب الجفاف، وتناول الزبادي والأطعمة المخمرة أو البروبيوتيك (بفارق ساعتين عن جرعة المضاد).',
      en: 'Home Care: Stay hydrated, consume yogurt or probiotics (spaced 2 hours away from antibiotic dose).',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي: التأكيد على شرب السوائل ومراقبة عدد المرات؛ إذا زاد عن 4 مرات أو ظهر صديد راجع الطبيب فوراً.',
      en: 'Nursing Note: Encourage hydration and monitor frequency; escalate if stools become watery or frequent.',
    },
    commonOffenders: { ar: 'أموكسيسيلين/كلافولانات، أموكسيسيلين، سيفيكسيم', en: 'Augmentin, amoxicillin, Suprax' },
  },
  {
    id: 'mild_rash_itching',
    name: { ar: 'طفح جلدي خفيف أو حكة موضعية بسيطة دون تورم أو ضيق تنفس', en: 'Mild skin rash or itching without swelling or wheezing' },
    severity: 'prompt',
    category: 'allergic',
    description: {
      ar: 'قد يكون تفاعلاً تحسسياً خفيفاً أو طفحاً دوائياً حميداً، ولكن يجب تقييمه لمنع تطوره لحساسية مفرطة.',
      en: 'May indicate mild hypersensitivity; requires assessment to rule out progressive allergic response.',
    },
    immediateAction: {
      ar: 'استشارة طبية! اتصل بالطبيب أو الصيدلي قبل تناول الجرعة التالية؛ قد يقرر استبدال الدواء بمضاد من عائلة أخرى.',
      en: 'Contact your doctor or pharmacist promptly before taking the next dose for alternative prescription.',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي: فحص مدى انتشار الطفح، وتأكيد عدم وجود تورم بالوجه أو صعوبة بالتنفس.',
      en: 'Nursing Assessment: Check rash distribution; verify absence of facial swelling or airway symptoms.',
    },
    commonOffenders: { ar: 'الأموكسيسيلين، البنسلينات، السلفا (سبتازول)', en: 'Amoxicillin, penicillins, co-trimoxazole' },
  },
  {
    id: 'metallic_taste_discoloration',
    name: { ar: 'طعم معدني بالفم أو تغير مؤقت في لون البول أو الأسنان', en: 'Metallic taste or harmless urine/teeth discoloration' },
    severity: 'mild',
    category: 'general',
    description: {
      ar: 'أثر جانبي دوائي مؤقت غير ضار؛ مثل تحول البول للون البني مع الفلاجيل أو الأصفر مع ماكروفيوران.',
      en: 'Harmless temporary pharmacological effect (e.g. dark urine with Flagyl, bright yellow with nitrofurantoin).',
    },
    immediateAction: {
      ar: 'اطمئن: هذا أثر طبيعي ومؤقت يزول تماماً بعد انتهاء كورس العلاج. نظف أسنانك بالفرشاة واشرب ماءً كافياً.',
      en: 'Reassurance: Harmless and temporary; completely resolves after finishing the medication course.',
    },
    nursingAdvice: {
      ar: 'إرشاد تمريضي: طمأنة المريض مسبقاً قبل بدء العلاج بأن تغير لون البول طبيعي وغير ناتج عن نزيف.',
      en: 'Nursing Reassurance: Pre-counsel patient that urine color change is expected and not hematuria.',
    },
    commonOffenders: { ar: 'ميترونيدازول (فلاجيل)، نيتروفورانتوين (ماكروفيوران)، كلاريثرومايسين', en: 'Flagyl, Macrofuran, Klacid' },
  },
];
