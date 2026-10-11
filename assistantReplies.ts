import { Bi } from './types';

/** A link inside a reply. `to` is an internal route (HashRouter), e.g. /articles/safe-use */
export interface Link { to: string; label: Bi }
export interface Canned { text: Bi; links?: Link[] }

const b = (ar: string, en: string): Bi => ({ ar, en });
const L = (to: string, ar: string, en: string): Link => ({ to, label: b(ar, en) });

const A_SAFE = L('/articles/safe-use', 'الاستخدام الآمن للمضادات الحيوية', 'Using antibiotics safely');
const A_VIRAL = L('/articles/bacterial-vs-viral', 'العدوى البكتيرية مقابل الفيروسية', 'Bacterial vs viral infections');
const A_SELF = L('/articles/avoid-self-medication', 'لماذا نتجنب العلاج الذاتي؟', 'Why avoid self-medicating?');
const A_ADVERSE = L('/articles/adverse-reactions', 'الأعراض الجانبية والتفاعلات التحسسية', 'Side effects and allergic reactions');
const A_ASK = L('/articles/questions-to-ask', 'أسئلة تسألها لطبيبك أو صيدلانيك', 'Questions to ask your doctor or pharmacist');
const A_RESIST = L('/articles/antibiotic-resistance', 'ما هي مقاومة المضادات الحيوية؟', 'What is antibiotic resistance?');

/** Used when nothing matches: starting points. */
export const DEFAULT_LINKS: Link[] = [A_RESIST, A_VIRAL, A_SAFE, A_SELF];

export type PKind = 'dose' | 'choose' | 'stopstart' | 'child' | 'pregnancy' | 'symptom' | 'general';

/** One tailored reply for each kind of personal-advice question (instead of one reply for all). */
export const PERSONAL: Record<PKind, Canned> = {
  dose: {
    text: b(
      'لا أستطيع تحديد جرعة أو عدد مرات أو مدة العلاج لك، لأنها تختلف حسب العمر والوزن ووظائف الكلى والكبد ونوع العدوى. اتبع ما كتبه الطبيب أو ما يقوله الصيدلي، ولا تغيّر الجرعة بنفسك.',
      'I cannot set a dose, how often to take it or for how long, because that depends on age, weight, kidney and liver function and the type of infection. Follow what your doctor wrote or your pharmacist says, and do not change the dose yourself.',
    ),
    links: [A_SAFE, A_ASK],
  },
  choose: {
    text: b(
      'اختيار المضاد الحيوي يحتاج فحصًا وأحيانًا تحاليل، وقد لا تحتاج حالتك مضادًا حيويًا أصلًا. لذلك لا أرشّح دواءً بعينه. الذي أستطيع شرحه هو الفرق بين العدوى البكتيرية والفيروسية، ولماذا نتجنب العلاج الذاتي.',
      'Choosing an antibiotic needs an examination and sometimes tests, and your condition may not need an antibiotic at all. So I do not recommend a specific medicine. What I can explain is the difference between bacterial and viral infections, and why self-medication is avoided.',
    ),
    links: [A_VIRAL, A_SELF],
  },
  stopstart: {
    text: b(
      'لا أستطيع أن أنصحك بإيقاف مضاد حيوي أو بدئه أو تعويض جرعة فائتة، فهذا يتوقف على نوع الدواء وحالتك. اتصل بالطبيب أو الصيدلي ليخبرك بالتصرف المناسب. وإن ظهرت أعراض شديدة فاطلب رعاية عاجلة.',
      'I cannot advise you to stop or start an antibiotic, or what to do about a missed dose, because it depends on the medicine and your condition. Contact your doctor or pharmacist for the right step. If severe symptoms appear, get urgent care.',
    ),
    links: [A_SAFE, A_ADVERSE],
  },
  child: {
    text: b(
      'الأطفال لهم اعتبارات خاصة في اختيار الدواء وجرعته، ولا أستطيع تقييم حالة طفل. اعرض الطفل على الطبيب أو اسأل الصيدلي. وإذا ظهر عليه ضيق في التنفس أو تورم في الوجه أو إغماء أو تشنج فاذهب إلى أقرب طوارئ فورًا.',
      'Children have special considerations for choosing a medicine and its dose, and I cannot assess a child’s condition. Take the child to a doctor or ask a pharmacist. If the child has trouble breathing, a swollen face, fainting or a seizure, go to the nearest emergency department right away.',
    ),
    links: [A_ASK],
  },
  pregnancy: {
    text: b(
      'الحمل والرضاعة يغيّران اختيار الدواء، ولا أستطيع تقييم حالتك. أخبري الطبيب أو الصيدلي بأنك حامل أو مرضع قبل أخذ أي دواء، واسأليهما عن المناسب لك.',
      'Pregnancy and breastfeeding change which medicine is suitable, and I cannot assess your situation. Tell your doctor or pharmacist that you are pregnant or breastfeeding before taking any medicine, and ask what is suitable for you.',
    ),
    links: [A_ASK],
  },
  symptom: {
    text: b(
      'لا أستطيع تشخيص الأعراض ولا تحديد إن كنت تحتاج مضادًا حيويًا. كثير من العدوى، مثل نزلات البرد، تسببها فيروسات ولا يعالجها المضاد الحيوي. راجع الطبيب ليقيّم حالتك.',
      'I cannot diagnose symptoms or say whether you need an antibiotic. Many infections, such as colds, are caused by viruses, and antibiotics do not treat them. See a doctor to assess your condition.',
    ),
    links: [A_VIRAL, A_SELF],
  },
  general: {
    text: b(
      'لا أستطيع اختيار مضاد حيوي أو جرعة أو مدة أو إيقاف دواء لك، فهذا يعتمد على الفحص وأحيانًا التحاليل. من فضلك استشر الطبيب أو الصيدلي واتبع تعليماتهما.',
      'I cannot choose an antibiotic, dose or duration, or tell you to stop a medicine. That depends on an examination and sometimes tests. Please ask a doctor or pharmacist and follow their instructions.',
    ),
    links: [A_ASK],
  },
};

export const EMERGENCY: Bi = b(
  'قد تكون هذه حالة طارئة. توقف عن المحادثة واطلب رعاية طبية عاجلة الآن: اتصل بالإسعاف أو اذهب لأقرب طوارئ.',
  'This could be an emergency. Stop chatting and get urgent medical care now: call the ambulance or go to the nearest emergency department.',
);
export const INJECTION: Bi = b(
  'لا أستطيع تغيير قواعد السلامة أو كشف تفاصيل النظام. يمكنني الإجابة عن أسئلة عامة حول المضادات الحيوية.',
  'I cannot change my safety rules or reveal system details. I can answer general questions about antibiotics.',
);

export const GREETING: Canned = {
  text: b(
    'أهلًا بك! اسألني عن المضادات الحيوية: المقاومة، الاستخدام الآمن، الفرق بين العدوى البكتيرية والفيروسية، أو عن دواء من قائمة الأدوية في الموقع.',
    'Hello! Ask me about antibiotics: resistance, safe use, the difference between bacterial and viral infections, or a medicine from the site’s medicine list.',
  ),
  links: [A_RESIST, A_SAFE],
};
export const THANKS: Canned = {
  text: b(
    'على الرحب والسعة! إذا كان لديك سؤال آخر عن المضادات الحيوية فأنا هنا.',
    'You are welcome! If you have another question about antibiotics, I am here.',
  ),
};
export const ABOUT: Canned = {
  text: b(
    'أنا مساعد تعليمي. أجيب فقط من محتوى هذا الموقع (المقالات، خرافة أم حقيقة، وملفات الأدوية المنشورة)، وأذكر مصدر كل إجابة. لا أشخّص ولا أصف دواءً ولا أحدد جرعة.',
    'I am a learning assistant. I answer only from this site’s content (articles, myth or fact, and the published medicine pages) and I show the source of each answer. I do not diagnose, prescribe or set doses.',
  ),
  links: [A_RESIST, A_VIRAL, A_SAFE],
};

export const NONE: Bi = b(
  'لم أجد إجابة لهذا السؤال في محتوى الموقع، ولن أخمّن. جرّب صياغة أخرى، أو اسأل الصيدلي أو الطبيب. هذه صفحات قد تفيدك:',
  'I could not find an answer to this in the site content, and I will not guess. Try different wording, or ask a pharmacist or doctor. These pages may help:',
);
export const NONE_RELATED: Bi = b(
  'لم أجد إجابة مباشرة عن سؤالك، ولن أخمّن. ربما تقصد أحد هذه المواضيع:',
  'I did not find a direct answer to your question, and I will not guess. Maybe you mean one of these topics:',
);
