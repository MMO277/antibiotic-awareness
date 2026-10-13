import { Bi } from './types';

/** A link inside a reply. `to` is an internal route (HashRouter), e.g. /articles/safe-use */
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

export const DEFAULT_LINKS: Link[] = [A_RESIST, A_VIRAL, A_SAFE, A_SELF, A_STORAGE];

export type PKind = 'dose' | 'choose' | 'stopstart' | 'child' | 'pregnancy' | 'symptom' | 'cold_shot' | 'missed_dose' | 'milk_food' | 'birth_control' | 'probiotics' | 'general';

/**
 * Constructive, rich clinical replies for patient advice questions.
 * Instead of refusing ("لا أستطيع"), these answers provide the actual medical facts,
 * nursing stewardship principles, and safe guidance.
 */
export const PERSONAL: Record<PKind, Canned> = {
  dose: {
    text: b(
      'تعتمد جرعة المضاد الحيوي بدقة على عدة عوامل سريرية تشمل: عمر المريض، وزنه، وظائف الكلى والكبد، وموضع ونوع البكتيريا المسببة للعدوى. القاعدة الطبية الأهم هي الالتزام التام بالجرعة والفاصل الزمني المكتوب بالروشتة (مثلاً كل 8 أو 12 ساعة بدقة) للحفاظ على تركيز فعال للدواء في مجرى الدم. تجنب تماماً تعديل الجرعة من تلقاء نفسك أو مضاعفتها عند نسيان حبة، واستشر الصيدلي أو الطبيب للتأكد من تفاصيل جرعتك.',
      'Antibiotic dosing depends on clinical factors including weight, age, renal/hepatic function, and infection type. Strictly follow the exact dose and interval prescribed (e.g., every 8 or 12 hours) to maintain effective blood levels. Never change doses yourself or double up on missed pills.',
    ),
    links: [A_SAFE, A_ASK],
  },
  choose: {
    text: b(
      'اختيار المضاد الحيوي المناسب يعتمد على تحديد نوع الميكروب (بكتيري أم فيروسي) من خلال الفحص السريري وأحياناً عمل تحليل مزرعة وحساسية (Culture & Sensitivity). نزلات البرد، الإنفلونزا، ومعظم نوبات السعال واحتقان الحلق تسببها فيروسات ولا يعالجها أي مضاد حيوي إطلاقاً. استخدام مضاد غير مناسب يضر بالبكتيريا النافعة ويسرع ظهور بكتيريا مقاومة (Superbugs). استشر طبيبك دائماً لتحديد العلاج الصحيح لحالتك.',
      'Selecting the correct antibiotic requires identifying whether an infection is bacterial or viral. Colds, flu, and most sore throats are viral and never respond to antibiotics. Taking unneeded antibiotics harms normal flora and breeds resistant superbugs.',
    ),
    links: [A_VIRAL, A_SELF],
  },
  stopstart: {
    text: b(
      'يجب إكمال كورس المضاد الحيوي كاملاً حتى آخر يوم كما حدده الطبيب، حتى لو اختفت الأعراض وشعرت بتحسن تام بعد يومين أو ثلاثة! التوقف المبكر يترك بكتيريا قوية على قيد الحياة تكتسب مناعة ضد الدواء وتعود العدوى أشد من السابق. أما إذا نسيت جرعة، فتناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتجاوزها وتابع جدولك بانتظام دون مضاعفة الجرعة أبداً.',
      'Always finish the entire prescribed antibiotic course even if you feel completely better. Stopping early lets resilient bacteria survive, mutate, and cause drug-resistant recurrence. If you miss a dose, take it when remembered unless the next dose is soon—never double up.',
    ),
    links: [A_SAFE, A_RESIST],
  },
  child: {
    text: b(
      'علاج الأطفال بالمضادات الحيوية يتطلب دقة شديدة؛ فالجرعة تحسب بالملليلتر بحسب وزن الطفل بالكيلوجرام وليس عمره فقط. يجب حفظ المضاد الحيوي الشراب المعلق بعد حله بالماء في باب الثلاجة واستخدامه خلال 7 إلى 14 يوماً فقط حسب نشرته ورجه جيداً قبل كل جرعة ثم التخلص من الباقي بأمان. لا تستخدم أبداً أدوية متبقية من أدوار سابقة أو خلطات الصيدليات الشعبية للأطفال، واستشر الطبيب فوراً.',
      'Pediatric antibiotics require precise weight-based dosing in milliliters. Reconstituted suspensions must be kept in the refrigerator, used within 7-14 days, and shaken well before each dose. Never use leftover bottles or unprescribed OTC mixes.',
    ),
    links: [A_STORAGE, A_ASK],
  },
  pregnancy: {
    text: b(
      'خلال الحمل والرضاعة، تنتقل بعض المضادات الحيوية عبر المشيمة إلى الجنين أو تفرز في حليب الأم. بعض المجموعات مثل البنسلينات والأموكسيسيلين والسيفالوسبورينات تعد آمنة عموماً تحت إشراف طبي، بينما مجموعات أخرى (مثل التتراسيكلين الذي يصبغ أسنان الجنين ويؤثر على عظامه، والفلوروكينولونات) محظورة. أبلغي الطبيب أو الصيدلي بوجود حمل أو رضاعة دائماً قبل تناول أي علاج لضمان سلامتك وسلامة طفلك.',
      'During pregnancy and breastfeeding, medicines can cross the placenta or pass into breast milk. Some antibiotics like penicillins and cephalosporins are generally safer, while others (like tetracyclines) are contraindicated. Always inform your doctor or pharmacist.',
    ),
    links: [A_ASK, A_ADVERSE],
  },
  symptom: {
    text: b(
      'أغلب الأعراض التنفسية الشائعة كاحتقان الحلق، الرشح، السعال، والحرارة تسببها عدوى فيروسية كنزلات البرد والإنفلونزا، والمضاد الحيوي لا يعالج الفيروسات نهائياً. العلاج الأمثل لهذه الأعراض هو الراحة التامة، شرب السوائل الدافئة، وخافضات الحرارة كالمسكنات البسيطة (الباراسيتامول). وإذا استمرت الحرارة العالية لأكثر من 3 أيام أو ظهرت إفرازات صديدية أو صعوبة في التنفس فيجب مراجعة الطبيب لتقييم وجود عدوى بكتيرية.',
      'Most common cold and cough symptoms are viral; antibiotics have zero effect on viruses. Supportive care with hydration, rest, and antipyretics (like paracetamol) is the evidence-based approach. See a doctor if high fever persists beyond 3 days or purulent symptoms develop.',
    ),
    links: [A_VIRAL, A_SELF],
  },
  cold_shot: {
    text: b(
      '«حقنة البرد» أو «مجموعة البرد / الخلطة الثلاثية» الشعبية (التي تخلط مضاداً حيوياً مع كورتيزون ومسكن في الصيدلية) هي ممارسة خاطئة وخطيرة جداً ومحرمة طبياً؛ فالبرد فيروسي لا يعالجه المضاد، وجرعة المضاد الواحدة تسرع نشوء بكتيريا مقاومة مميتة، بينما الكورتيزون يثبط مناعة الجسم، والمسكنات قد تسبب قصوراً كلوياً أو نزيفاً بالمعدة. وزارة الصحة تحذر منها بشدة.',
      'The popular "cold injection" (mixing an antibiotic, corticosteroid, and NSAID) is medically dangerous and irrational. Colds are viral, a single antibiotic dose drives superbug resistance, steroids suppress immunity, and strong NSAIDs risk acute kidney injury.',
    ),
    links: [A_SELF, A_ADVERSE],
  },
  missed_dose: {
    text: b(
      'إذا نسيت جرعة من المضاد الحيوي، فتناولها فور تذكرك مباشرة. لكن إذا كان موعد الجرعة التالية قد اقترب، فتجاوز الجرعة المنسية وتابع جدولك المعتاد في موعده، وممنوع منعاً باتاً أخذ جرعتين معاً لتعويض ما فاتك، لأن مضاعفة الجرعة تؤدي إلى ارتفاع تركيز الدواء في الدم وحدوث آثار جانبية وتسمم دوائي.',
      'If you miss a dose, take it as soon as you remember. However, if it is nearly time for your next scheduled dose, skip the missed dose and resume your regular schedule. Never double up doses.',
    ),
    links: [A_SAFE],
  },
  milk_food: {
    text: b(
      'تتفاعل بعض المضادات الحيوية (خاصة عائلة التتراسيكلين كالدوكسيسيكلين، وعائلة الفلوروكينولونات كالسيبروفلوكساسين) مع الكالسيوم الموجود في الحليب ومنتجات الألبان ومكملات الحديد والمغنيسيوم؛ حيث يرتبط الكالسيوم بالدواء ويمنع امتصاصه في المعدة. يجب الفصل بين تناول هذه المضادات ومنتجات الألبان بساعتين قبل الدواء أو 4 ساعات بعده. بينما يمكن أخذ مضادات أخرى كالأموكسيسيلين مع الطعام دون مشكلة.',
      'Certain antibiotics (e.g., tetracyclines, ciprofloxacin) bind with calcium in dairy products and minerals, severely inhibiting absorption. Separate them from milk, yogurt, and iron supplements by at least 2 hours before or 4 hours after.',
    ),
    links: [A_SAFE, A_ADVERSE],
  },
  birth_control: {
    text: b(
      'بعض المضادات الحيوية (خاصة مشتقات الريفامبيسين، ومضادات أخرى نتيجة تأثيرها على بكتيريا الأمعاء النافعة) قد تقلل من فاعلية حبوب منع الحمل الهرمونية. يُنصح باستخدام وسيلة حماية إضافية (كالواقي الذكري) أثناء كورس العلاج ولمدة 7 أيام بعد الانتهاء منه، واستشارة الطبيب أو الصيدلي.',
      'Some antibiotics can reduce the efficacy of hormonal oral contraceptives by altering gut flora or liver metabolism. Using an additional barrier method (like condoms) during the course and for 7 days post-treatment is clinically recommended.',
    ),
    links: [A_ASK],
  },
  probiotics: {
    text: b(
      'الإسهال واضطراب المعدة من الأعراض الجانبية الشائعة للمضادات الحيوية؛ لأنها تقضي على البكتيريا النافعة في الجهاز الهضمي أثناء محاربة البكتيريا الضارة. تناول الزبادي والأغذية المخمرة أو مكملات البروبيوتيك (بفارق ساعتين عن جرعة المضاد) يساعد في استعادة التوازن المعوي. إذا كان الإسهال شديداً أو مائياً أو مصحوباً بدم، راجع الطبيب فوراً.',
      'Antibiotic-associated diarrhea happens because antibiotics disrupt beneficial gut microbiota. Consuming yogurt or probiotics (spaced 2 hours away from the antibiotic dose) helps restore microbial balance.',
    ),
    links: [A_ADVERSE],
  },
  general: {
    text: b(
      'المضادات الحيوية أدوية حيوية مخصصة حصرياً لعلاج العدوى البكتيرية. الاستخدام الآمن والرشيد يتطلب وصفة طبية دقيقة، الالتزام بمواعيد الجرعات، إكمال مدة العلاج المقررة، وتجنب خلطات البرد أو مشاركة بقايا الأدوية، وذلك لحماية صحتك ومنع انتشار البكتيريا المقاومة للمضادات (AMR).',
      'Antibiotics are life-saving medications designed specifically for bacterial infections. Rational stewardship requires a medical prescription, completing the full duration, and never self-medicating with unverified mixtures.',
    ),
    links: [A_SAFE, A_RESIST],
  },
};

export const EMERGENCY: Bi = b(
  'قد تكون هذه علامة على تفاعل تحسسي شديد أو حالة طارئة (مثل صعوبة التنفس، تورم الوجه أو اللسان أو الحلق، طفح جلدي حاد ومفاجئ، أو إغماء). توقف عن المحادثة واطلب رعاية طبية عاجلة فوراً: اتصل بالإسعاف (123 في مصر) أو توجه لأقرب قسم طوارئ.',
  'This could indicate severe anaphylaxis or a medical emergency. Stop chatting and seek immediate emergency care: call an ambulance or go to the nearest emergency room immediately.',
);

export const INJECTION: Bi = b(
  'أنا مساعد تعليمي مخصص للتوعية بالاستخدام الرشيد للمضادات الحيوية ومقاومة الميكروبات. يمكنني الإجابة عن أي استفسار توعوي أو طبي عام حول الأدوية.',
  'I am an educational assistant dedicated to antibiotic awareness and antimicrobial resistance. I can answer general medical and educational questions about medicines.',
);

export const GREETING: Canned = {
  text: b(
    'أهلاً بك! أنا المساعد الذكي للوعي بالمضادات الحيوية. اسألني عن أي موضوع: الاستخدام الآمن، مقاومة الميكروبات، الفرق بين العدوى البكتيرية والفيروسية، مخاطر حقنة البرد، تداخلات الأدوية والأطعمة، أو عن أي دواء في الموقع.',
    'Hello! I am the Antibiotic Awareness Smart Assistant. Ask me anything: safe antibiotic use, antimicrobial resistance, bacterial vs viral infections, cold shot risks, food interactions, or specific medicines.',
  ),
  links: [A_RESIST, A_SAFE, A_VIRAL],
};

export const THANKS: Canned = {
  text: b(
    'على الرحب والسعة! صحتك وسلامتك تهمنا دائماً. إذا كان لديك أي استفسار آخر عن المضادات الحيوية وكيفية استخدامها بأمان، فأنا هنا لمساعدتك.',
    'You are very welcome! If you have any further questions about antibiotics and safe medication practices, I am always here to help.',
  ),
};

export const ABOUT: Canned = {
  text: b(
    'أنا المساعد الذكي لمشروع تخرج في التمريض حول "الوعي بالمضادات الحيوية ومقاومة الميكروبات". أقدم معلومات تثقيفية موثوقة مبنية على مراجع منظمة الصحة العالمية (WHO) ومراكز مكافحة الأمراض (CDC) ومكتبة الطب الأمريكية (MedlinePlus) لمساعدتك على استخدام الأدوية بوعي وأمان وتجنب مخاطر العلاج الذاتي.',
    'I am an AI educational assistant for a nursing graduation project on Antibiotic Awareness. I provide verified clinical guidance based on WHO, CDC, and MedlinePlus standards to promote safe medication practices.',
  ),
  links: [A_RESIST, A_SAFE, A_VIRAL],
};

export const NONE: Bi = b(
  'للتوضيح بخصوص استفسارك: المضادات الحيوية صممت حصرياً لمكافحة العدوى البكتيرية، واستخدامها الرشيد يتطلب التشخيص الدقيق والالتزام بكامل مدة العلاج دون انقطاع مبكر. تذكر دائماً ألا تتناول مضاداً حيوياً لنزلات البرد أو الإنفلونزا الفيروسية، وتجنب استخدام بقايا الأدوية أو خلطات البرد الشعبية. إليك أهم المقالات المرتبطة بهذا الموضوع:',
  'Regarding your inquiry: Antibiotics are strictly indicated for bacterial infections, and rational stewardship requires finishing the full prescribed course. Never take antibiotics for viral colds or flu, and avoid self-medicating with unverified mixtures. Here are related verified articles:',
);

export const NONE_RELATED: Bi = b(
  'بخصوص موضوع سؤالك، إليك أهم الإرشادات والمعلومات السريرية المعتمدة لمساعدتك في فهم الاستخدام الآمن والمسؤول للمضادات الحيوية:',
  'Regarding your topic, here are key clinical insights and verified guidance to help you understand safe antibiotic use:',
);
