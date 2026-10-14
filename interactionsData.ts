import { Bi } from './types';

export type Severity = 'severe' | 'moderate' | 'safe';

export interface InteractingItem {
  id: string;
  name: Bi;
  category: 'food' | 'supplement' | 'drug';
  icon: string;
}

export interface InteractionRule {
  antibioticId: string;
  targetId: string;
  severity: Severity;
  title: Bi;
  mechanism: Bi;
  management: Bi;
  nursingTip: Bi;
}

export const TARGETS: InteractingItem[] = [
  // Foods
  { id: 'dairy', name: { ar: 'الحليب ومشتقات الألبان (الكالسيوم الغذائي)', en: 'Milk & Dairy Products (Dietary Calcium)' }, category: 'food', icon: '🥛' },
  { id: 'alcohol', name: { ar: 'المشروبات الكحولية', en: 'Alcoholic Beverages' }, category: 'food', icon: '🍷' },
  { id: 'meals', name: { ar: 'الطعام العام والوجبات', en: 'General Food & Meals' }, category: 'food', icon: '🍽️' },
  
  // Supplements
  { id: 'iron', name: { ar: 'مكملات الحديد وعلاج فقر الدم', en: 'Iron Supplements' }, category: 'supplement', icon: '💊' },
  { id: 'calcium_antacids', name: { ar: 'مكملات الكالسيوم ومضادات الحموضة', en: 'Calcium / Magnesium Antacids' }, category: 'supplement', icon: '🧪' },
  { id: 'probiotics', name: { ar: 'مكملات البروبيوتيك والزبادي (البكتيريا النافعة)', en: 'Probiotics & Yogurt (Beneficial Flora)' }, category: 'supplement', icon: '🥣' },

  // Drugs
  { id: 'birth_control', name: { ar: 'حبوب منع الحمل الهرمونية', en: 'Oral Contraceptive Pills' }, category: 'drug', icon: '🌸' },
  { id: 'warfarin', name: { ar: 'أدوية السيولة ومميعات الدم (الوارفارين/ماريفان)', en: 'Blood Thinners (Warfarin / Coumadin)' }, category: 'drug', icon: '🩸' },
  { id: 'nsaids', name: { ar: 'المسكنات ومضادات الالتهاب (بروفين، كتافلام، فولتارين)', en: 'NSAIDs (Ibuprofen, Diclofenac)' }, category: 'drug', icon: '⚡' },
  { id: 'statins', name: { ar: 'أدوية الكوليسترول والدهون (سيمفاستاتين، أتورفاستاتين)', en: 'Statins (Simvastatin, Atorvastatin)' }, category: 'drug', icon: '🫀' },
  { id: 'allopurinol', name: { ar: 'أدوية النقرس وحمض اليوريك (ألوبيورينول / زيلوريك)', en: 'Gout Medicine (Allopurinol)' }, category: 'drug', icon: '🦶' },
];

export const RULES: InteractionRule[] = [
  // Ciprofloxacin / Fluoroquinolones
  {
    antibioticId: 'ciprofloxacin',
    targetId: 'dairy',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: ارتباط الكالسيوم ومنع الامتصاص', en: 'Moderate: Calcium Chelation Inhibiting Absorption' },
    mechanism: {
      ar: 'يرتبط الكالسيوم الموجود في الحليب والزبادي مع السيبروفلوكساسين في المعدة مكوناً مركباً غير قابل للذوبان، مما يقلل امتصاص المضاد في الدم بنسبة تصل إلى 60% ويفشل العلاج.',
      en: 'Calcium ions bind to ciprofloxacin, forming an insoluble chelate that decreases drug bioavailability by up to 60%.',
    },
    management: {
      ar: 'يجب الفصل التام: تناول السيبروفلوكساسين بساعتين قبل شرب الحليب أو تناول منتجات الألبان، أو بعد تناولها بـ 4 ساعات على الأقل.',
      en: 'Strictly separate: take ciprofloxacin 2 hours before or 4 hours after consuming dairy products.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: نبّه المريض بتناول القرص مع كوب ماء كبير وليس مع كوب حليب أو عصير مدعم بالكالسيوم، واسأله عن وجبات الإفطار.',
      en: 'Nursing Stewardship: Instruct the patient to take the tablet with a full glass of water, never with milk or calcium-fortified juice.',
    },
  },
  {
    antibioticId: 'ciprofloxacin',
    targetId: 'iron',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: ارتباط الحديد وإلغاء فاعلية المضاد', en: 'Moderate: Iron Chelation Inhibiting Absorption' },
    mechanism: {
      ar: 'أيونات الحديد الثنائية ترتبط بجزيئات الفلوروكينولون في الجهاز الهضمي وتمنع امتصاصها بصورة شبه تامة.',
      en: 'Iron salts chelate with ciprofloxacin in the gut, severely decreasing its clinical efficacy.',
    },
    management: {
      ar: 'افصل بين كبسولات الحديد والسيبروفلوكساسين بساعتين على الأقل قبل المضاد أو 4 ساعات بعده.',
      en: 'Separate iron administration by at least 2 hours before or 4 hours after ciprofloxacin.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: راجع قائمة أدوية المريض بحثاً عن مكملات علاج الأنيميا ونظم جدول إعطائها في مواعيد متباعدة.',
      en: 'Nursing Assessment: Screen the patient for anemia supplements and reschedule medication timing.',
    },
  },
  {
    antibioticId: 'ciprofloxacin',
    targetId: 'nsaids',
    severity: 'severe',
    title: { ar: 'تعارض خطير: زيادة خطر التشنجات العصبية والصرع', en: 'Severe: Elevated Seizure and Neurotoxicity Risk' },
    mechanism: {
      ar: 'الجمع بين الفلوروكينولونات ومضادات الالتهاب غير الستيرويدية (NSAIDs) يزيد من تثبيط مستقبلات GABA في الدماغ، مما قد يحفز تشنجات صرعية حادة.',
      en: 'Concurrent use increases GABA antagonism in the CNS, significantly lowering the seizure threshold.',
    },
    management: {
      ar: 'تجنب تناول المسكنات القوية (كالإيبوبروفين والديكلوفيناك) بالتزامن مع السيبروفلوكساسين، واستخدم الباراسيتامول (بنادول) كمسكن آمن عند الحاجة.',
      en: 'Avoid concurrent NSAIDs; recommend paracetamol as the safer analgesic alternative.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: اسأل المريض إذا كان لديه تاريخ مرضي للتشنجات العصبية ووجهه لاستخدام الباراسيتامول لتسكين الألم.',
      en: 'Nursing Tip: Check patient history for epilepsy and advocate for paracetamol for pain control.',
    },
  },

  // Metronidazole (Flagyl)
  {
    antibioticId: 'metronidazole',
    targetId: 'alcohol',
    severity: 'severe',
    title: { ar: 'تعارض خطير جداً: تفاعل ديسولفيرام الحاد والتسمم الكحولي', en: 'Severe: Severe Disulfiram-like Reaction' },
    mechanism: {
      ar: 'يثبط الميترونيدازول إنزيم ألديهيد ديهيدروجيناز الكبدي، مما يؤدي لتراكم مادة الأسيتالديهيد السامة في الدم مسبباً قيئاً مستمراً، تسارع ضربات القلب، وهبوط ضغط حاد.',
      en: 'Inhibits acetaldehyde dehydrogenase, causing toxic accumulation of acetaldehyde with flushing, vomiting, tachycardia and hypotension.',
    },
    management: {
      ar: 'ممنوع منعاً باتاً تناول أي مشروبات كحولية أو أدوية تحتوي على كحول أثناء العلاج بالميترونيدازول ولمدة 48 ساعة كاملة بعد انتهاء آخر جرعة.',
      en: 'Strictly avoid any alcohol consumption during therapy and for at least 48 hours after discontinuation.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: حذر المريض بوضوح شديد، وتأكد من خلو غسول الفم أو أدوية السعال التي يتناولها من نسب الكحول.',
      en: 'Nursing Alert: Emphasize complete alcohol abstinence, including alcohol-containing mouthwashes and cough syrups.',
    },
  },
  {
    antibioticId: 'metronidazole',
    targetId: 'warfarin',
    severity: 'severe',
    title: { ar: 'تعارض خطير: زيادة مفعول الوارفارين وخطر النزيف', en: 'Severe: Potentiation of Warfarin & Hemorrhage Risk' },
    mechanism: {
      ar: 'يثبط الميترونيدازول استقلاب الوارفارين في الكبد، مما يؤدي إلى تراكمه وارتفاع حاد في نسبة السيولة (INR) وحدوث نزيف.',
      en: 'Inhibits CYP2C9 metabolism of S-warfarin, dramatically increasing INR and bleeding risk.',
    },
    management: {
      ar: 'يجب تخفيض جرعة الوارفارين بنسبة 30-50% ومراقبة تحليل السيولة (INR) بدقة تحت إشراف الطبيب.',
      en: 'Requires warfarin dose reduction by 30-50% and frequent INR monitoring.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: راقب علامات النزيف لدى المريض (نزيف اللثة، كدمات غير مبررة، أو تحول لون البراز للأسود).',
      en: 'Nursing Assessment: Monitor for signs of bleeding (ecchymosis, hematuria, melena).',
    },
  },

  // Doxycycline
  {
    antibioticId: 'doxycycline',
    targetId: 'dairy',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: ارتباط الكالسيوم وضعف الامتصاص', en: 'Moderate: Calcium Binding & Reduced Bioavailability' },
    mechanism: {
      ar: 'يرتبط التتراسيكلين مع أيونات الكالسيوم في منتجات الألبان مكوناً مركباً مخلبياً يمنع امتصاص الدواء عبر جدار الأمعاء.',
      en: 'Doxycycline chelates with calcium ions in dairy, impairing intestinal absorption.',
    },
    management: {
      ar: 'تناول الدوكسيسيكلين مع كوب ماء كبير بساعتين قبل أو بعد تناول الحليب أو مشتقات الألبان.',
      en: 'Administer doxycycline at least 2 hours before or after dairy ingestion.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: ذكر مريض حب الشباب بعدم تناول الكبسولة مع كوب حليب الإفطار لضمان فاعلية العلاج.',
      en: 'Nursing Tip: Instruct acne patients never to swallow capsules with morning milk.',
    },
  },
  {
    antibioticId: 'doxycycline',
    targetId: 'iron',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: ارتباط الحديد وإلغاء امتصاص الدواء', en: 'Moderate: Iron Chelation Inhibiting Efficacy' },
    mechanism: {
      ar: 'مكملات الحديد ترتبط بشدة مع الدوكسيسيكلين وتقلل تركيزه في مجرى الدم بدرجة كبيرة.',
      en: 'Iron salts significantly reduce doxycycline absorption through heavy chelation.',
    },
    management: {
      ar: 'افصل بين كبسولة الدوكسيسيكلين وأقراص الحديد بفارق زمني لا يقل عن 2 إلى 3 ساعات.',
      en: 'Space iron supplements and doxycycline by at least 2-3 hours.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: تحقق من أدوية الفيتامينات والحديد التي يتناولها المريض وافصل مواعيدها في كارت المواعيد.',
      en: 'Nursing Stewardship: Review multivitamin/iron intake and reschedule doses.',
    },
  },

  // Amoxicillin / Clavulanate (Augmentin)
  {
    antibioticId: 'amoxicillin-clavulanic-acid',
    targetId: 'birth_control',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: احتمالية تقليل فاعلية حبوب منع الحمل', en: 'Moderate: Possible Reduction in Contraceptive Efficacy' },
    mechanism: {
      ar: 'المضادات واسعة المجال تقضي على بكتيريا الأمعاء النافعة المسؤولة عن تنشيط وإعادة امتصاص هرمون الإستروجين، مما قد يقلل مستواه في الدم.',
      en: 'Broad-spectrum antibiotics alter gut microbiome, potentially impairing enterohepatic circulation of estrogen.',
    },
    management: {
      ar: 'يُنصح باستخدام وسيلة حماية مانعة للحمل إضافية (كالواقي الذكري) أثناء كورس المضاد الحيوي ولمدة 7 أيام بعد انتهائه.',
      en: 'Recommend using an additional non-hormonal barrier method (condoms) during the course and for 7 days post-therapy.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: قدم التثقيف الصحي اللازم للسيدات في سن الإنجاب لحمايتهن من حدوث حمل غير مخطط له أثناء كورس العلاج.',
      en: 'Nursing Patient Education: Counsel female patients of childbearing age regarding backup contraception.',
    },
  },
  {
    antibioticId: 'amoxicillin-clavulanic-acid',
    targetId: 'meals',
    severity: 'safe',
    title: { ar: 'آمن وموصى به: تناوله مع بداية الطعام لتقليل اضطراب المعدة', en: 'Safe: Take with Food to Minimize GI Upset' },
    mechanism: {
      ar: 'تناول الأوجمنتين مع بداية وجبة خفيفة يحسن امتصاص حمض الكلافولانيك ويقلل كثيراً من الغثيان والإسهال وآلام المعدة.',
      en: 'Administering at the start of a meal optimizes clavulanate absorption and minimizes GI intolerance.',
    },
    management: {
      ar: 'تناول الجرعة دائماً مع أول لقمة من الوجبة مع كوب ماء كامل.',
      en: 'Take with the first bites of a meal or light snack with water.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: درب المريض أو الأم على إعطاء الجرعة للطفل مع بداية الطعام لمنع القيء والمغص.',
      en: 'Nursing Tip: Instruct parents to give pediatric doses with food to avoid gastric irritation.',
    },
  },
  {
    antibioticId: 'amoxicillin-clavulanic-acid',
    targetId: 'allopurinol',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: زيادة حادة في خطر الطفح الجلدي التحسسي', en: 'Moderate: Increased Incidence of Drug Rash' },
    mechanism: {
      ar: 'الجمع بين الأموكسيسيلين وألوبيورينول يزيد بشكل كبير من احتمالية ظهور طفح جلدي تحسسي واسع الانتشار.',
      en: 'Concomitant administration significantly increases the frequency of erythematous skin rashes.',
    },
    management: {
      ar: 'يراقب المريض ظهور أي احمرار أو حكة بالجلد، واستشر الطبيب لتقييم الحاجة لبديل إذا ظهر طفح جلدي.',
      en: 'Monitor skin closely; discontinue and consult physician if rash develops.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: فحص جلد المريض والتأكد من عدم الخلط بين الطفح الدوائي والحساسية المفرطة للبنسلين.',
      en: 'Nursing Assessment: Differentiate between ampicillin-like rash and true penicillin anaphylaxis.',
    },
  },

  // Clarithromycin (Klacid)
  {
    antibioticId: 'clarithromycin',
    targetId: 'statins',
    severity: 'severe',
    title: { ar: 'تعارض خطير جداً: تكسير العضلات الحاد والفشل الكلوي', en: 'Severe: High Risk of Rhabdomyolysis and Acute Renal Failure' },
    mechanism: {
      ar: 'الكلاريثرومايسين مثبط قوي لإنزيم CYP3A4 الكبدي، مما يؤدي لتراكم أدوية الكوليسترول (سيمفاستاتين وأتورفاستاتين) لدرجات سمية تسبب انحلال العضلات.',
      en: 'Potent CYP3A4 inhibition elevates statin plasma levels, precipitating severe rhabdomyolysis.',
    },
    management: {
      ar: 'ممنوع الجمع بينهما نهائياً؛ يجب إيقاف دواء الكوليسترول مؤقتاً طوال فترة علاج الكلاريثرومايسين، أو استخدام مضاد حيوي بديل كالأزيثرومايسين.',
      en: 'Contraindicated; temporarily suspend statin therapy during clarithromycin treatment or choose azithromycin.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي حرج: راجع أدوية المريض لكبار السن للتأكد من عدم تناول السيمفاستاتين، ونبههم بمراجعة الطبيب عند ألم العضلات الشديد.',
      en: 'Critical Nursing Check: Screen geriatric patients for statins; advise immediate reporting of unexplained muscle pain or dark urine.',
    },
  },

  // Universal Probiotics Rule
  {
    antibioticId: 'amoxicillin-clavulanic-acid',
    targetId: 'probiotics',
    severity: 'safe',
    title: { ar: 'آمن ومفيد جداً: تعويض البكتيريا النافعة وتقليل الإسهال', en: 'Safe & Highly Recommended: Restoring Gut Flora' },
    mechanism: {
      ar: 'تناول البروبيوتيك أو الزبادي يساعد على استعادة توازن ميكروبيوم الأمعاء والوقاية من الإسهال المرتبط بالمضادات وعدوى المطثية العسيرة.',
      en: 'Probiotics replenish beneficial intestinal microbiota disrupted by broad-spectrum antibiotic therapy.',
    },
    management: {
      ar: 'يوصى بتناولهما معاً ولكن بفارق زمني ساعتين على الأقل عن موعد جرعة المضاد، حتى لا يقتل المضاد الحيوي بكتيريا البروبيوتيك الحية.',
      en: 'Administer probiotics spaced at least 2 hours away from the antibiotic dose.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: انصح المريض بتناول الزبادي الطبيعي الغني بالخمائر النافعة يومياً طوال فترة كورس العلاج.',
      en: 'Nursing Recommendation: Encourage daily yogurt or probiotic intake spaced 2 hours from doses.',
    },
  },
  {
    antibioticId: 'doxycycline',
    targetId: 'probiotics',
    severity: 'safe',
    title: { ar: 'آمن ومفيد: حماية الجهاز الهضمي بالفصل ساعتين', en: 'Safe: Gastrointestinal Protection (Space 2 Hours)' },
    mechanism: {
      ar: 'يساعد البروبيوتيك في حماية الأمعاء؛ يفصل بساعتين لضمان بقاء البكتيريا النافعة حية.',
      en: 'Supports digestive health during treatment; space 2 hours away.',
    },
    management: {
      ar: 'افصل بين جرعة المضاد والزبادي أو البروبيوتيك بساعتين.',
      en: 'Space probiotic ingestion 2 hours apart from the antibiotic.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: تنظيم مواعيد الوجبات والمكملات بدقة.',
      en: 'Nursing Tip: Organize schedule for optimal spacing.',
    },
  },

  // Nitrofurantoin
  {
    antibioticId: 'nitrofurantoin',
    targetId: 'calcium_antacids',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: مضادات الحموضة تقلل امتصاص الدواء', en: 'Moderate: Antacids Inhibit Absorption' },
    mechanism: {
      ar: 'مضادات الحموضة المحتوية على ثلاثي سيليكات المغنيسيوم ترتبط بالنيتروفورانتوين وتقلل وصوله للمسالك البولية.',
      en: 'Magnesium-containing antacids bind nitrofurantoin, impairing urinary concentration.',
    },
    management: {
      ar: 'تجنب تناول مضادات الحموضة المحتوية على المغنيسيوم أثناء كورس علاج المسالك، أو افصل بـ 3 ساعات.',
      en: 'Avoid magnesium trisilicate antacids or space by at least 3 hours.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: شرب كميات وافرة من الماء وتجنب الفوار القلوي دون استشارة.',
      en: 'Nursing Tip: Encourage generous fluid intake and avoid urinary alkalinizers unless prescribed.',
    },
  },
  {
    antibioticId: 'nitrofurantoin',
    targetId: 'meals',
    severity: 'safe',
    title: { ar: 'آمن وموصى به بقوة: تناوله مع الطعام يزيد الامتصاص ويمنع الغثيان', en: 'Safe & Recommended: Take with Food' },
    mechanism: {
      ar: 'تناول النيتروفورانتوين مع وجبة طعام أو كوب حليب يزيد من التوافر الحيوي للدواء بنسبة 40% ويقلل اضطراب المعدة.',
      en: 'Food significantly enhances drug absorption and substantially mitigates nausea.',
    },
    management: {
      ar: 'تناول الكبسولة دائماً في منتصف أو نهاية الوجبة مع كوب ماء كبير.',
      en: 'Always take capsules with food or milk.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: التأكيد على تناول الدواء مع وجبتي الإفطار والعشاء لمنع فقدان الشهية.',
      en: 'Nursing Tip: Align administration with breakfast and dinner to prevent anorexia.',
    },
  },

  // Co-trimoxazole (Septazole)
  {
    antibioticId: 'co-trimoxazole',
    targetId: 'warfarin',
    severity: 'severe',
    title: { ar: 'تعارض خطير: زيادة حادة في سيولة الدم وخطر النزيف', en: 'Severe: Marked Increase in Bleeding Risk' },
    mechanism: {
      ar: 'يثبط السلفاميثوكسازول استقلاب الوارفارين ويزيحه من بروتينات البلازما، مما يرفع INR لدرجات خطيرة مهددة للحياة.',
      en: 'Inhibits warfarin clearance and displaces it from albumin, risking catastrophic hemorrhage.',
    },
    management: {
      ar: 'مراقبة تحليل INR بعد 2-3 أيام من بدء العلاج وخفض جرعة الوارفارين تحت إشراف طبي دقيق.',
      en: 'Monitor INR within 48-72 hours and proactively reduce anticoagulant dosage.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي حرج: تنبيه المريض لمراقبة أي كدمات أو رعاف أو نزيف أثناء غسيل الأسنان.',
      en: 'Critical Nursing Check: Instruct patient to immediately report epistaxis, gingival bleeding, or hematomas.',
    },
  },

  // Ceftriaxone
  {
    antibioticId: 'ceftriaxone',
    targetId: 'calcium_antacids',
    severity: 'severe',
    title: { ar: 'تعارض خطير: ترسبات بلورية غير قابلة للذوبان مع الكالسيوم', en: 'Severe: Calcium-Ceftriaxone Particulate Precipitation' },
    mechanism: {
      ar: 'مزج أو إعطاء السيفترياكسون بالتزامن مع محاليل الكالسيوم الوريدية (كالرينجر لاكتات) يؤدي لتكون ترسبات صلبة قاتلة في الرئتين والكلى لدى حديثي الولادة والأطفال.',
      en: 'Co-administration with IV calcium forms fatal precipitates in the pulmonary and renal vasculature.',
    },
    management: {
      ar: 'ممنوع منعاً باتاً خلط أو إعطاء محاليل الكالسيوم الوريدية مع السيفترياكسون عبر نفس الخط الوريدي أو حتى عبر خطوط منفصلة للأطفال.',
      en: 'Strictly contraindicated with calcium-containing IV solutions in neonates and pediatric lines.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي حرج للمستشفيات: غسل الخط الوريدي جيداً بمحلول ملحي طبيعي (Normal Saline) قبل وبعد تسريب أي مضاد حيوي.',
      en: 'Hospital Nursing Standard: Thoroughly flush lines with normal saline before and after IV antibiotic infusions.',
    },
  },

  // Moxifloxacin
  {
    antibioticId: 'moxifloxacin',
    targetId: 'calcium_antacids',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: مضادات الحموضة تعطل امتصاص الموكسيفلوكساسين', en: 'Moderate: Antacid Chelation Impairing Moxifloxacin' },
    mechanism: {
      ar: 'أيونات الكالسيوم والمغنيسيوم والألومنيوم في مضادات الحموضة ترتبط بالموكسيفلوكساسين وتمنع امتصاصه في الجهاز الهضمي بنسبة تزيد عن 60%.',
      en: 'Polyvalent cations (Mg, Al, Ca) chelate moxifloxacin, reducing bioavailability significantly.',
    },
    management: {
      ar: 'تناول موكسيفلوكساسين قبل أدوية الحموضة بساعتين على الأقل أو بعدها بـ 4 ساعات.',
      en: 'Take moxifloxacin 2 hours before or 4 hours after antacids.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي: اسأل المريض إذا كان يتناول فوار أو أقراص لعلاج حرقان المعدة ونبهه لمواعيد الفصل.',
      en: 'Nursing Guidance: Screen for OTC antacid use and educate patient on separated administration times.',
    },
  },

  // Vancomycin
  {
    antibioticId: 'vancomycin',
    targetId: 'nsaids',
    severity: 'severe',
    title: { ar: 'تعارض حرج: سمية كلوية مضاعفة مع المسكنات القوية', en: 'Severe: Synergistic Nephrotoxicity with NSAIDs' },
    mechanism: {
      ar: 'مضادات الالتهاب غير الستيرويدية كالكتافلام والبروفين تقلل تدفق الدم الكلوي وتضاعف خطر القصور الكلوي الحاد الناتج عن الفانكومايسين.',
      en: 'NSAIDs constrict renal afferent arterioles and synergistically exacerbate vancomycin nephrotoxicity.',
    },
    management: {
      ar: 'تجنب استخدام المسكنات غير الستيرويدية بالتزامن مع الفانكومايسين واستبدالها بالباراسيتامول الآمن عند الحاجة.',
      en: 'Avoid concurrent NSAIDs; utilize paracetamol for analgesia during vancomycin therapy.',
    },
    nursingTip: {
      ar: 'إرشاد تمريضي سريري: مراقبة كمية البول اليومية ومستوى الكرياتينين في الدم بانتظام.',
      en: 'Clinical Nursing Metric: Monitor daily urine output and serum creatinine rigorously.',
    },
  },

  // Flucloxacillin
  {
    antibioticId: 'flucloxacillin',
    targetId: 'meals',
    severity: 'moderate',
    title: { ar: 'تفاعل متوسط: الطعام يقلل امتصاص الفلوكلوكساسيللين إلى النصف', en: 'Moderate: Food Significantly Reduces Absorption' },
    mechanism: {
      ar: 'وجود الطعام في المعدة يعيق امتصاص فلوكلوكساسيللين (فلوكسامو/فلوسيل) بنسبة تفوق 50% مما يؤدي لفشل القضاء على العدوى.',
      en: 'Food delays gastric emptying and reduces flucloxacillin absorption by over 50%.',
    },
    management: {
      ar: 'تناول الكبسولات أو الأقراص على معدة فارغة تماماً (قبل الأكل بساعة أو بعد الأكل بساعتين).',
      en: 'Take strictly on an empty stomach (1 hour before or 2 hours after meals).',
    },
    nursingTip: {
      ar: 'إرشاد للمريض: لا تتناول الدواء وسط الأكل، بل تناوله مع كوب ماء على معدة فارغة.',
      en: 'Patient Instruction: Always take with a glass of water on an empty stomach, never during meals.',
    },  },
];

export const COMMON_QUICK_CHECKS = [
  { antibioticId: 'ciprofloxacin', targetId: 'dairy', label: { ar: 'سيبروفلوكساسين + الحليب ومنتجات الألبان', en: 'Ciprofloxacin + Dairy' } },
  { antibioticId: 'metronidazole', targetId: 'alcohol', label: { ar: 'فلاجيل (ميترونيدازول) + المشروبات الكحولية', en: 'Flagyl + Alcohol' } },
  { antibioticId: 'amoxicillin-clavulanic-acid', targetId: 'birth_control', label: { ar: 'أوجمنتين + حبوب منع الحمل', en: 'Augmentin + Birth Control' } },
  { antibioticId: 'doxycycline', targetId: 'iron', label: { ar: 'دوكسيسيكلين + مكملات الحديد', en: 'Doxycycline + Iron' } },
  { antibioticId: 'clarithromycin', targetId: 'statins', label: { ar: 'كلاسيد + أدوية الكوليسترول (الستاتينات)', en: 'Klacid + Statins' } },
  { antibioticId: 'amoxicillin-clavulanic-acid', targetId: 'probiotics', label: { ar: 'أوجمنتين + الزبادي والبروبيوتيك', en: 'Augmentin + Probiotics' } },
];
