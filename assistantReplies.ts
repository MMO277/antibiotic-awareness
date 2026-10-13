import { Bi } from './types';

export interface Link { to: string; label: Bi }
export interface Canned { text: Bi; links?: Link[] }

const b = (ar: string, en: string): Bi => ({ ar, en });
const L = (to: string, ar: string, en: string): Link => ({ to, label: b(ar, en) });

const A_SAFE = L('/articles/safe-use', 'الاستخدام الآمن للمضادات الحيوية', 'Using antibiotics safely');
const A_VIRAL = L('/articles/bacterial-vs-viral', 'العدوى البكتيرية مقابل الفيروسية', 'Bacterial vs viral infections');
const A_SELF = L('/articles/avoid-self-medication', 'تجنب العلاج الذاتي وخلطات البرد', 'Why avoid self-medicating?');
const A_ADVERSE = L('/articles/adverse-reactions', 'الأعراض الجانبية والتفاعلات التحسسية', 'Side effects and allergic reactions');
const A_ASK = L('/articles/questions-to-ask', 'أسئلة تسألها لطبيبك أو صيدلانيك', 'Questions to ask your doctor or pharmacist');
const A_RESIST = L('/articles/antibiotic-resistance', 'ما هي مقاومة المضادات الحيوية؟', 'What is antibiotic resistance?');
const A_STORAGE = L('/articles/storage-and-disposal', 'تخزين الأدوية والتخلص من بقاياها', 'Storing and disposing medicines');

// Medicine internal links
const M_AMOX_CLAV = L('/medicine/amoxicillin-clavulanic-acid', 'أموكسيسيلين + كلافولانات (أوجمنتين)', 'Amoxicillin/Clavulanate');
const M_AMOX = L('/medicine/amoxicillin', 'أموكسيسيلين', 'Amoxicillin');
const M_METRO = L('/medicine/metronidazole', 'ميترونيدازول (فلاجيل)', 'Metronidazole (Flagyl)');
const M_CLINDA = L('/medicine/clindamycin', 'كليندامايسين (دالاسين)', 'Clindamycin');
const M_AZITH = L('/medicine/azithromycin', 'أزيثرومايسين (زيثروماكس)', 'Azithromycin');
const M_NITRO = L('/medicine/nitrofurantoin', 'نيتروفورانتوين (ماكروفيوران)', 'Nitrofurantoin');
const M_COTRIM = L('/medicine/co-trimoxazole', 'كوتريموكسازول (سبتازول)', 'Co-trimoxazole');
const M_CIPRO = L('/medicine/ciprofloxacin', 'سيبروفلوكساسين', 'Ciprofloxacin');
const M_DOXY = L('/medicine/doxycycline', 'دوكسيسيكلين', 'Doxycycline');
const M_CEPH = L('/medicine/cephalexin', 'سيفالكسين', 'Cephalexin');
const M_CLARI = L('/medicine/clarithromycin', 'كلاريثرومايسين', 'Clarithromycin');
const M_PENV = L('/medicine/penicillin-v-potassium', 'بنسلين فموي (Penicillin V)', 'Penicillin V');

export const DEFAULT_LINKS: Link[] = [A_RESIST, A_VIRAL, A_SAFE, A_SELF, A_STORAGE];

export type ConditionKind = 'dental' | 'throat' | 'uti' | 'skin' | 'sinus' | 'chest' | 'stomach' | 'ear';

/** Rich condition guidance: names the best first-line antibiotics and emphasizes doctor consultation */
export const CONDITIONS: Record<ConditionKind, Canned> = {
  dental: {
    text: b(
      'أفضل وأشهر المضادات الحيوية المستخدمة علمياً كخط أول لعلاج عدوى وخراج الأسنان واللثة:\n\n' +
      '1. أموكسيسيلين مع حمض الكلافولانيك (Augmentin أو Curam أو Megamox):\n' +
      'يعد الخيار الأول والشائع جداً، لأن حمض الكلافولانيك يحمي المضاد من الإنزيمات المقاومة التي تفرزها بكتيريا الفم.\n\n' +
      '2. ميترونيدازول (Flagyl):\n' +
      'يُضاف غالباً مع الأموكسيسيلين في حالات الخراج الشديد لاستهداف البكتيريا اللاهوائية العميقة في جذور الأسنان.\n\n' +
      '3. كليندامايسين (Dalacin C) أو أزيثرومايسين (Zithromax):\n' +
      'يستخدمان كبديل ممتاز وفعال للأشخاص الذين يعانون من حساسية تجاه البنسلين ومشتقاته.\n\n' +
      '⚠️ إرشاد وتنبيه طبي مهم:\n' +
      '• المضاد الحيوي لا يعتبر مسكناً للألم، ولن يعالج ألم عصب السن أو التسوس بمفرده.\n' +
      '• العلاج الجذري والنهائي يتطلب فحص طبيب الأسنان لإجراء حشو العصب أو تصريف وتنظيف الخراج.\n' +
      '• يجب استشارة طبيب الأسنان ليحدد الدواء والجرعة المناسبة بناءً على حالتك ووزنك وتاريخك التحسسي.',
      'The standard first-line antibiotics for dental infections and abscesses:\n' +
      '1. Amoxicillin/Clavulanate (Augmentin): First-line choice covering beta-lactamase oral bacteria.\n' +
      '2. Metronidazole (Flagyl): Commonly combined to eradicate deep oral anaerobes.\n' +
      '3. Clindamycin (Dalacin C) or Azithromycin: Recommended alternatives for penicillin-allergic patients.\n\n' +
      'Important Note: Antibiotics do not substitute dental intervention. Root canal treatment or drainage by a dentist is required.'
    ),
    links: [M_AMOX_CLAV, M_METRO, M_CLINDA],
  },
  throat: {
    text: b(
      'أفضل المضادات الحيوية لعلاج التهاب الحلق واللوزتين البكتيري:\n\n' +
      '1. بنسلين فموي (Penicillin V) أو أموكسيسيلين (Amoxicillin):\n' +
      'الخيار الأول الموصى به عالمياً لعلاج بكتيريا الحلق العقدية (Strep Throat)، وعادة ما يستمر كورس العلاج 10 أيام.\n\n' +
      '2. أزيثرومايسين (Zithromax) أو كلاريثرومايسين (Klacid):\n' +
      'يستخدمان كبديل لمن لديهم حساسية من البنسلين.\n\n' +
      '⚠️ إرشاد طبي مهم:\n' +
      '• أكثر من 80% من حالات التهاب الحلق تسببها فيروسات (نزلات برد) ولا تحتاج لأي مضاد حيوي نهائياً.\n' +
      '• لا تتناول المضاد إلا إذا فحصك الطبيب وتأكد من وجود صديد بكتيري على اللوزتين أو ارتفاع شديد في الحرارة.',
      'First-line antibiotics for confirmed bacterial streptococcal pharyngitis:\n' +
      '1. Penicillin V or Amoxicillin: Standard 10-day first-line therapy.\n' +
      '2. Azithromycin or Clarithromycin: For penicillin-allergic individuals.\n' +
      'Note: Over 80% of sore throats are viral and do not benefit from antibiotics. See a doctor for throat examination.'
    ),
    links: [M_AMOX, M_PENV, M_AZITH],
  },
  uti: {
    text: b(
      'أفضل المضادات الحيوية المستخدمة لعلاج التهابات المسالك البولية وحرقان البول (UTI):\n\n' +
      '1. نيتروفورانتوين (Macrofuran أو Uvamin retard):\n' +
      'الخيار الأول لالتهابات المثانة البسيطة لأنه يتركز بقوة في البول دون التأثير على بكتيريا الجسم الأخرى.\n\n' +
      '2. فوسفوميسين (Fosfomycin) أو كوتريموكسازول (Septazole):\n' +
      'خيارات معتمدة كخط أول حسب البروتوكولات الطبية.\n\n' +
      '3. سيبروفلوكساسين (Cipromay) أو ليفوفلوكساسين:\n' +
      'تستخدم في الحالات الأكثر تعقيداً أو إذا وصلت العدوى للكلى.\n\n' +
      '⚠️ إرشاد طبي مهم:\n' +
      '• ينصح دائماً بعمل تحليل بول ومزرعة (Urine Culture) قبل بدء العلاج لاختيار المضاد الفعال بدقة.\n' +
      '• اشرب كميات وافرة من الماء يومياً (2-3 لتر) واستشر الطبيب لتحديد مدة العلاج.',
      'First-line antibiotics for uncomplicated urinary tract infections (UTIs):\n' +
      '1. Nitrofurantoin (Macrofuran): Preferred first-line due to high urinary concentration.\n' +
      '2. Fosfomycin or Co-trimoxazole: Standard first-line alternatives.\n' +
      '3. Fluoroquinolones (Ciprofloxacin): Reserved for complicated cases.\n' +
      'Note: Perform a urine analysis and culture, stay well hydrated, and consult your physician.'
    ),
    links: [M_NITRO, M_COTRIM, M_CIPRO],
  },
  skin: {
    text: b(
      'المضادات الحيوية الشائعة لالتهابات الجلد وحب الشباب والدمامل:\n\n' +
      '1. لحب الشباب المتوسط والشديد:\n' +
      'دوكسيسيكلين (Doxycycline) مثل تابوسين أو فيبراميسين، أو كبسولات كليندامايسين.\n\n' +
      '2. للدمامل والتهابات الجلد البكتيرية (التهاب النسيج الخلوي):\n' +
      'سيفالكسين (Cephalexin) أو أموكسيسيلين/كلافولانات لتغطية بكتيريا المكورات العنقودية الجلدية.\n\n' +
      '⚠️ إرشاد طبي مهم:\n' +
      '• يفضل دائماً استخدام العلاجات الموضعية (المراهم وغسول الجلد) أولاً قبل اللجوء للحبوب الفموية.\n' +
      '• استشر طبيب الأمراض الجلدية لتحديد الجرعة والفترة الآمنة (خاصة مع الدوكسيسيكلين لتجنب تحسس الشمس).',
      'Common antibiotics for skin infections and acne:\n' +
      '1. Acne vulgaris: Oral Doxycycline or topical Clindamycin.\n' +
      '2. Cellulitis and furuncles: Cephalexin or Amoxicillin/Clavulanate covering Staphylococci.\n' +
      'Note: Consult a dermatologist to evaluate whether topical therapy is sufficient.'
    ),
    links: [M_DOXY, M_CEPH, M_CLINDA],
  },
  sinus: {
    text: b(
      'المضادات الحيوية الشائعة لالتهاب الجيوب الأنفية البكتيري:\n\n' +
      '1. أموكسيسيلين مع كلافولانات (Augmentin / Curam):\n' +
      'الخيار الأول عالمياً لالتهاب الجيوب الأنفية الحاد إذا ثبت أنه بكتيري.\n\n' +
      '2. أزيثرومايسين أو ليفوفلوكساسين:\n' +
      'بدائل لمن يعانون من حساسية البنسلين.\n\n' +
      '⚠️ إرشاد طبي مهم:\n' +
      '• أكثر من 90% من التهابات الجيوب الأنفية تكون فيروسية في أول 7 إلى 10 أيام ولا تحتاج لمضاد حيوي.\n' +
      '• يوصى باستخدام بخاخات المحلول الملحي ومسكنات الألم البسيطة، واستشر الطبيب إذا استمرت الأعراض أكثر من 10 أيام.',
      'Antibiotics for bacterial acute rhinosinusitis:\n' +
      '1. Amoxicillin/Clavulanate: Gold standard first-line.\n' +
      '2. Azithromycin or Levofloxacin: For penicillin allergy.\n' +
      'Note: Most sinusitis is viral during the first 10 days. Use saline rinses and consult a physician.'
    ),
    links: [M_AMOX_CLAV, M_AZITH],
  },
  chest: {
    text: b(
      'المضادات الحيوية لعدوى الجهاز التنفسي السفلي والشعب الهوائية:\n\n' +
      '1. أموكسيسيلين/كلافولانات أو أزيثرومايسين (Zithromax):\n' +
      'من أشهر الأدوية المستخدمة لحالات الالتهاب الرئوي الشعبي البكتيري.\n\n' +
      '2. ليفوفلوكساسين أو موكسيفلوكساسين (كينولونات تنفسية):\n' +
      'تستخدم في الحالات الأكثر شدة أو عند كبار السن.\n\n' +
      '⚠️ إرشاد طبي مهم:\n' +
      '• التهاب الشعب الهوائية الحاد ونوبات السعال المصاحبة للبرد تكون فيروسية بنسبة 95%، والمضاد لا يوقف السعال.\n' +
      '• إذا صاحب السعال بلغم صديدي مائل للخضرة أو حرارة عالية مستمرة أو ضيق بالتنفس، يجب فحص الصدر بالسماعة عند الطبيب فوراً.',
      'Common antibiotics for bacterial respiratory infections:\n' +
      '1. Amoxicillin/Clavulanate or Azithromycin: Standard outpatient choices.\n' +
      '2. Respiratory fluoroquinolones: For complicated community-acquired pneumonia.\n' +
      'Note: Acute bronchitis is viral in over 90% of cases. Clinical chest auscultation is mandatory.'
    ),
    links: [M_AMOX_CLAV, M_AZITH],
  },
  stomach: {
    text: b(
      'المضادات الحيوية المستخدمة لعلاج جرثومة المعدة (Helicobacter pylori):\n\n' +
      'تعتمد على «العلاج الثلاثي أو الرباعي» المعتمد من الجمعيات الطبية لمدة 14 يوماً:\n' +
      '1. كلاريثرومايسين (Klacid) بجرعة 500 مجم.\n' +
      '2. أموكسيسيلين (1000 مجم) أو ميترونيدازول (Flagyl).\n' +
      '3. دواء مثبط لحموضة المعدة (مثل أوميبرازول أو إيسوميبرازول) لتهيئة بيئة المعدة لعمل المضادات.\n\n' +
      '⚠️ إرشاد طبي مهم:\n' +
      '• يجب الالتزام التام بكامل فترة العلاج (14 يوماً) دون تفويت جرعة واحدة لضمان القضاء التام على الجرثومة ومنع عودتها.\n' +
      '• استشر طبيب الجهاز الهضمي لوصف البروتوكول المناسب لك بدقة.',
      'Standard eradication therapy for H. pylori infection (14 days):\n' +
      '1. Clarithromycin (500mg).\n' +
      '2. Amoxicillin (1000mg) or Metronidazole (500mg).\n' +
      '3. Proton pump inhibitor (PPI) twice daily.\n' +
      'Note: Strictly complete the 14-day protocol under gastroenterologist supervision.'
    ),
    links: [M_CLARI, M_AMOX, M_METRO],
  },
  ear: {
    text: b(
      'المضادات الحيوية لالتهاب الأذن الوسطى الحاد:\n\n' +
      '1. أموكسيسيلين (Amoxicillin) بجرعة عالية، أو أموكسيسيلين/كلافولانات (Augmentin):\n' +
      'الخيار الأول لعلاج بكتيريا الأذن الشائعة (المكورات الرئوية والمستدمية النزلية).\n\n' +
      '2. أزيثرومايسين أو سيفورروكسيم:\n' +
      'بدائل معتمدة في حال وجود حساسية من البنسلين.\n\n' +
      '⚠️ إرشاد طبي مهم:\n' +
      '• يجب فحص طبلة الأذن بمنظار الأذن لدى طبيب الأنف والأذن والحنجرة لتشخيص الالتهاب بدقة، ولا تضع أي قطرات في الأذن دون فحص للتأكد من عدم وجود ثقب في طبلة الأذن.',
      'First-line antibiotics for acute otitis media:\n' +
      '1. High-dose Amoxicillin or Amoxicillin/Clavulanate: First-line standard.\n' +
      '2. Azithromycin or Cefuroxime: In penicillin allergy.\n' +
      'Note: Otoscopic examination of the tympanic membrane by an ENT specialist is essential.'
    ),
    links: [M_AMOX_CLAV, M_AMOX, M_AZITH],
  },
};

export type PKind = 'dose' | 'choose' | 'stopstart' | 'child' | 'pregnancy' | 'symptom' | 'cold_shot' | 'missed_dose' | 'milk_food' | 'birth_control' | 'probiotics' | 'general';

export const PERSONAL: Record<PKind, Canned> = {
  dose: {
    text: b(
      'تعتمد جرعة المضاد الحيوي بدقة على عدة عوامل سريرية تشمل: عمر المريض، وزنه، وظائف الكلى والكبد، وموضع ونوع البكتيريا المسببة للعدوى. القاعدة الطبية الأهم هي الالتزام التام بالجرعة والفاصل الزمني المكتوب بالروشتة (مثلاً كل 8 أو 12 ساعة بدقة) للحفاظ على تركيز فعال للدواء في مجرى الدم. تجنب تماماً تعديل الجرعة من تلقاء نفسك أو مضاعفتها عند نسيان حبة، واستشر الصيدلي أو الطبيب للتأكد من تفاصيل جرعتك.',
      'Antibiotic dosing depends on clinical factors including weight, age, renal/hepatic function, and infection type. Strictly follow the prescribed dose and interval. Never change doses yourself.',
    ),
    links: [A_SAFE, A_ASK],
  },
  choose: {
    text: b(
      'اختيار المضاد الحيوي المناسب يعتمد على موضع العدوى ونوع البكتيريا المسببة لها. لكل نوع من العدوى (مثل الأسنان، المسالك البولية، الحلق، أو الجلد) خط علاجي أول معتمد عالمياً. يرجى توضيح موضع المشكلة (مثلاً: أسنان، مسالك، لوز) لأوضح لك الخيارات المعتمدة علمياً بالتفصيل، وتذكر دائماً ضرورة استشارة الطبيب للفحص.',
      'Selecting the right antibiotic depends on the infection site (dental, urinary, throat, skin, etc.). Each condition has distinct first-line choices. Tell me the specific area of infection for detailed clinical guidelines.',
    ),
    links: [A_VIRAL, A_SELF],
  },
  stopstart: {
    text: b(
      'يجب إكمال كورس المضاد الحيوي كاملاً حتى آخر يوم كما حدده الطبيب، حتى لو اختفت الأعراض وشعرت بتحسن تام بعد يومين أو ثلاثة! التوقف المبكر يترك بكتيريا قوية على قيد الحياة تكتسب مناعة ضد الدواء وتعود العدوى أشد من السابق. أما إذا نسيت جرعة، فتناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتجاوزها وتابع جدولك بانتظام دون مضاعفة الجرعة أبداً.',
      'Always finish the entire prescribed antibiotic course even if you feel completely better. Stopping early lets resilient bacteria survive and cause resistant recurrence.',
    ),
    links: [A_SAFE, A_RESIST],
  },
  child: {
    text: b(
      'علاج الأطفال بالمضادات الحيوية يتطلب دقة شديدة؛ فالجرعة تحسب بالملليلتر بحسب وزن الطفل بالكيلوجرام وليس عمره فقط. يجب حفظ المضاد الحيوي الشراب المعلق بعد حله بالماء في باب الثلاجة واستخدامه خلال 7 إلى 14 يوماً فقط حسب نشرته ورجه جيداً قبل كل جرعة ثم التخلص من الباقي بأمان. لا تستخدم أبداً أدوية متبقية من أدوار سابقة أو خلطات الصيدليات الشعبية للأطفال، واستشر الطبيب فوراً.',
      'Pediatric antibiotics require precise weight-based dosing. Suspensions must be kept refrigerated for 7-14 days only and shaken well before use.',
    ),
    links: [A_STORAGE, A_ASK],
  },
  pregnancy: {
    text: b(
      'خلال الحمل والرضاعة، تنتقل بعض المضادات الحيوية عبر المشيمة إلى الجنين أو تفرز في حليب الأم. بعض المجموعات مثل البنسلينات والأموكسيسيلين والسيفالوسبورينات تعد آمنة عموماً تحت إشراف طبي، بينما مجموعات أخرى (مثل التتراسيكلين الذي يصبغ أسنان الجنين ويؤثر على عظامه، والفلوروكينولونات) محظورة. أبلغي الطبيب أو الصيدلي بوجود حمل أو رضاعة دائماً قبل تناول أي علاج لضمان سلامتك وسلامة طفلك.',
      'During pregnancy, antibiotics like penicillins and cephalosporins are generally safer, while tetracyclines and fluoroquinolones are contraindicated. Always inform your doctor.',
    ),
    links: [A_ASK, A_ADVERSE],
  },
  symptom: {
    text: b(
      'أغلب الأعراض التنفسية الشائعة كاحتقان الحلق، الرشح، السعال، والحرارة تسببها عدوى فيروسية كنزلات البرد والإنفلونزا، والمضاد الحيوي لا يعالج الفيروسات نهائياً. العلاج الأمثل لهذه الأعراض هو الراحة التامة، شرب السوائل الدافئة، وخافضات الحرارة كالمسكنات البسيطة (الباراسيتامول). وإذا استمرت الحرارة العالية لأكثر من 3 أيام أو ظهرت إفرازات صديدية أو صعوبة في التنفس فيجب مراجعة الطبيب لتقييم وجود عدوى بكتيرية.',
      'Most common respiratory symptoms are viral; antibiotics have zero effect on viruses. Supportive care is the proper evidence-based treatment.',
    ),
    links: [A_VIRAL, A_SELF],
  },
  cold_shot: {
    text: b(
      '«حقنة البرد» أو «مجموعة البرد / الخلطة الثلاثية» الشعبية (التي تخلط مضاداً حيوياً مع كورتيزون ومسكن في الصيدلية) هي ممارسة خاطئة وخطيرة جداً ومحرمة طبياً؛ فالبرد فيروسي لا يعالجه المضاد، وجرعة المضاد الواحدة تسرع نشوء بكتيريا مقاومة مميتة، بينما الكورتيزون يثبط مناعة الجسم، والمسكنات قد تسبب قصوراً كلوياً أو نزيفاً بالمعدة. وزارة الصحة تحذر منها بشدة.',
      'The "cold injection" mixing antibiotics, steroids, and NSAIDs is dangerous and medically irrational. Colds are viral, and single doses breed superbugs.',
    ),
    links: [A_SELF, A_ADVERSE],
  },
  missed_dose: {
    text: b(
      'إذا نسيت جرعة من المضاد الحيوي، فتناولها فور تذكرك مباشرة. لكن إذا كان موعد الجرعة التالية قد اقترب، فتجاوز الجرعة المنسية وتابع جدولك المعتاد في موعده، وممنوع منعاً باتاً أخذ جرعتين معاً لتعويض ما فاتك، لأن مضاعفة الجرعة تؤدي إلى ارتفاع تركيز الدواء في الدم وحدوث آثار جانبية وتسمم دوائي.',
      'If you miss a dose, take it when remembered unless the next dose is near. Never take two doses together.',
    ),
    links: [A_SAFE],
  },
  milk_food: {
    text: b(
      'تتفاعل بعض المضادات الحيوية (خاصة عائلة التتراسيكلين كالدوكسيسيكلين، وعائلة الفلوروكينولونات كالسيبروفلوكساسين) مع الكالسيوم الموجود في الحليب ومنتجات الألبان ومكملات الحديد والمغنيسيوم؛ حيث يرتبط الكالسيوم بالدواء ويمنع امتصاصه في المعدة. يجب الفصل بين تناول هذه المضادات ومنتجات الألبان بساعتين قبل الدواء أو 4 ساعات بعده. بينما يمكن أخذ مضادات أخرى كالأموكسيسيلين مع الطعام دون مشكلة.',
      'Certain antibiotics bind with calcium in dairy, preventing absorption. Separate them from milk and dairy by 2 hours before or 4 hours after.',
    ),
    links: [A_SAFE, A_ADVERSE],
  },
  birth_control: {
    text: b(
      'بعض المضادات الحيوية (خاصة مشتقات الريفامبيسين، ومضادات أخرى نتيجة تأثيرها على بكتيريا الأمعاء النافعة) قد تقلل من فاعلية حبوب منع الحمل الهرمونية. يُنصح باستخدام وسيلة حماية إضافية (كالواقي الذكري) أثناء كورس العلاج ولمدة 7 أيام بعد الانتهاء منه، واستشارة الطبيب أو الصيدلي.',
      'Some antibiotics reduce birth control pill efficacy. Using an additional barrier method is recommended.',
    ),
    links: [A_ASK],
  },
  probiotics: {
    text: b(
      'الإسهال واضطراب المعدة من الأعراض الجانبية الشائعة للمضادات الحيوية؛ لأنها تقضي على البكتيريا النافعة في الجهاز الهضمي أثناء محاربة البكتيريا الضارة. تناول الزبادي والأغذية المخمرة أو مكملات البروبيوتيك (بفارق ساعتين عن جرعة المضاد) يساعد في استعادة التوازن المعوي. إذا كان الإسهال شديداً أو مائياً أو مصحوباً بدم، راجع الطبيب فوراً.',
      'Antibiotics disrupt beneficial gut flora. Probiotics and yogurt help restore microbiome balance.',
    ),
    links: [A_ADVERSE],
  },
  general: {
    text: b(
      'المضادات الحيوية أدوية حيوية مخصصة حصرياً لعلاج العدوى البكتيرية. الاستخدام الآمن والرشيد يتطلب وصفة طبية دقيقة، الالتزام بمواعيد الجرعات، إكمال مدة العلاج المقررة، وتجنب خلطات البرد أو مشاركة بقايا الأدوية، وذلك لحماية صحتك ومنع انتشار البكتيريا المقاومة للمضادات (AMR).',
      'Antibiotics treat bacterial infections only. Rational use requires professional prescription and completing the full course.',
    ),
    links: [A_SAFE, A_RESIST],
  },
};

export const EMERGENCY: Bi = b(
  'قد تكون هذه علامة على تفاعل تحسسي شديد أو حالة طارئة (مثل صعوبة التنفس، تورم الوجه أو اللسان أو الحلق، طفح جلدي حاد ومفاجئ، أو إغماء). توقف عن المحادثة واطلب رعاية طبية عاجلة فوراً: اتصل بالإسعاف (123 في مصر) أو توجه لأقرب قسم طوارئ.',
  'This could indicate severe anaphylaxis. Stop chatting and seek emergency care immediately.',
);

export const INJECTION: Bi = b(
  'أنا مساعد تعليمي مخصص للتوعية بالاستخدام الرشيد للمضادات الحيوية ومقاومة الميكروبات. يمكنني الإجابة عن أي استفسار توعوي أو طبي عام حول الأدوية.',
  'I am an educational assistant dedicated to antibiotic awareness.',
);

export const GREETING: Canned = {
  text: b(
    'أهلاً بك! أنا المساعد الذكي للوعي بالمضادات الحيوية. اسألني عن أي موضوع: أفضل مضاد لعدوى معينة (كالأسنان، المسالك، اللوز)، الاستخدام الآمن، تداخلات الأدوية والأطعمة، أو تفاصيل أي دواء في الموقع.',
    'Hello! Ask me about antibiotics: first-line choices for infections (dental, UTI, throat), safe use, interactions, or specific drugs.',
  ),
  links: [A_RESIST, A_SAFE, A_VIRAL],
};

export const THANKS: Canned = {
  text: b(
    'على الرحب والسعة! صحتك وسلامتك تهمنا دائماً. إذا كان لديك أي استفسار آخر عن المضادات الحيوية وكيفية استخدامها بأمان، فأنا هنا لمساعدتك.',
    'You are very welcome! I am always here to help.',
  ),
};

export const ABOUT: Canned = {
  text: b(
    'أنا المساعد الذكي لمشروع تخرج في التمريض حول "الوعي بالمضادات الحيوية ومقاومة الميكروبات". أقدم معلومات تثقيفية موثوقة مبنية على مراجع منظمة الصحة العالمية (WHO) ومراكز مكافحة الأمراض (CDC) ومكتبة الطب الأمريكية (MedlinePlus) لمساعدتك على استخدام الأدوية بوعي وأمان وتجنب مخاطر العلاج الذاتي.',
    'Educational assistant providing verified clinical guidelines based on WHO and CDC standards.',
  ),
  links: [A_RESIST, A_SAFE, A_VIRAL],
};

export const NONE: Bi = b(
  'للتوضيح بخصوص استفسارك: المضادات الحيوية صممت حصرياً لمكافحة العدوى البكتيرية، واستخدامها الرشيد يتطلب التشخيص الدقيق والالتزام بكامل مدة العلاج دون انقطاع مبكر. تذكر دائماً ألا تتناول مضاداً حيوياً لنزلات البرد أو الإنفلونزا الفيروسية، وتجنب استخدام بقايا الأدوية أو خلطات البرد الشعبية. إليك أهم المقالات المرتبطة بهذا الموضوع:',
  'Antibiotics are strictly indicated for bacterial infections. Always complete your full course and consult a doctor.',
);

export const NONE_RELATED: Bi = b(
  'بخصوص موضوع سؤالك، إليك أهم الإرشادات والمعلومات السريرية المعتمدة لمساعدتك في فهم الاستخدام الآمن والمسؤول للمضادات الحيوية:',
  'Regarding your topic, here are key clinical insights and guidance:',
);
