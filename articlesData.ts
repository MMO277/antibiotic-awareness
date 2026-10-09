import { Bi } from './types';

export interface Article {
  id: string;
  title: Bi;
  summary: Bi;
  body: Bi; // paragraphs separated by a blank line
}

/**
 * General, non-product-specific education. Marked as "pending review" in the UI:
 * a qualified professional should review and adapt it before official publication.
 */
export const ARTICLES: Article[] = [
  {
    id: 'antibiotic-resistance',
    title: { ar: 'ما هي مقاومة المضادات الحيوية؟', en: 'What is antibiotic resistance?' },
    summary: {
      ar: 'كيف تصبح البكتيريا أقل استجابة للدواء، ولماذا يهمّنا ذلك جميعًا.',
      en: 'How bacteria become less responsive to medicines, and why it matters to everyone.',
    },
    body: {
      ar: 'تحدث مقاومة المضادات الحيوية عندما تتغيّر البكتيريا بحيث لا تعود الأدوية التي كانت تقتلها أو توقف نموها فعّالة كما كانت. البكتيريا هي التي تصبح مقاومة، وليس جسم الإنسان.\n\nفي كل مرة تُستخدم فيها المضادات الحيوية قد تتكاثر البكتيريا التي تنجو منها. واستخدام المضادات دون حاجة، أو تناولها بطريقة خاطئة، أو عدم اتباع تعليمات من وصفها يمنح البكتيريا المقاومة فرصًا أكبر للانتشار.\n\nقد تكون العدوى المقاومة أصعب في العلاج، وقد تحتاج إلى علاج أقوى أو أطول، ويمكن أن تنتقل إلى الآخرين. لذلك فإن استخدام المضاد الحيوي فقط عند وصفه من مقدّم الرعاية الصحية وكما هو موصوف تمامًا يساعد على حماية فعاليته للجميع.',
      en: 'Antibiotic resistance happens when bacteria change so that medicines that used to kill them or stop their growth no longer work as well. It is the bacteria that become resistant, not the person’s body.\n\nEvery time antibiotics are used, bacteria that survive can multiply. Using antibiotics when they are not needed, taking them incorrectly, or not following the prescriber’s instructions gives resistant bacteria more chances to spread.\n\nResistant infections can be harder to treat, may need stronger or longer treatment, and can spread to other people. Using antibiotics only when a healthcare professional prescribes them, exactly as instructed, helps protect these medicines for everyone.',
    },
  },
  {
    id: 'bacterial-vs-viral',
    title: { ar: 'العدوى البكتيرية مقابل الفيروسية', en: 'Bacterial vs viral infections' },
    summary: {
      ar: 'لماذا لا تنفع المضادات الحيوية في نزلات البرد والإنفلونزا.',
      en: 'Why antibiotics do not help with colds and influenza.',
    },
    body: {
      ar: 'البكتيريا كائنات حية دقيقة مكوّنة من خلية واحدة، أما الفيروسات فهي جراثيم أصغر بكثير تحتاج إلى خلايا حية لتتكاثر. تسبب كلٌّ منهما أنواعًا مختلفة من العدوى وتحتاج إلى أساليب علاج مختلفة.\n\nتعمل المضادات الحيوية ضد البكتيريا فقط. ولا تعالج الفيروسات، ولذلك لا تفيد في أمراض مثل نزلات البرد والإنفلونزا التي تسببها الفيروسات.\n\nلا تكفي الأعراض وحدها دائمًا لمعرفة سبب العدوى. الطبيب أو المختص المؤهل هو من يقرر إن كان المضاد الحيوي مناسبًا. عند ظهور أعراض استشر مختصًا ولا تختر مضادًا حيويًا بنفسك.',
      en: 'Bacteria are single-celled organisms, while viruses are much smaller germs that need living cells to multiply. They cause different kinds of infection and need different approaches.\n\nAntibiotics work against bacteria only. They do not treat viruses, so they do not help with illnesses such as the common cold or influenza, which are caused by viruses.\n\nSymptoms alone cannot always tell which germ is responsible. A doctor or other qualified professional decides whether an antibiotic is appropriate. If you have symptoms, ask a professional rather than choosing an antibiotic yourself.',
    },
  },
  {
    id: 'avoid-self-medication',
    title: { ar: 'لماذا نتجنب العلاج الذاتي بالمضادات الحيوية؟', en: 'Why avoid self-medicating with antibiotics?' },
    summary: {
      ar: 'مخاطر تناول المضاد دون وصفة أو استخدام بقايا الأدوية.',
      en: 'The risks of taking antibiotics without a prescription or using leftovers.',
    },
    body: {
      ar: 'قد لا يناسب المضاد الحيوي الذي تختاره بنفسك نوع العدوى، وقد لا تكون العدوى بكتيرية أصلًا. وقد يؤخر ذلك العلاج الصحيح ويعرّضك لآثار جانبية أو تحسس دون فائدة.\n\nتجنّب هذه السلوكيات: تناول مضاد حيوي دون وصفة أو استشارة، استخدام بقايا دواء من مرض سابق، مشاركة الدواء مع الآخرين، أو الضغط على الطبيب لوصف مضاد حيوي.\n\nإذا كنت قلقًا من أعراضك فاسأل الطبيب أو الصيدلي. وإذا لم يصف لك مضادًا حيويًا فقد يكون ذلك لأنه غير مناسب لحالتك.',
      en: 'An antibiotic you choose yourself may not suit the type of infection, and the illness may not be bacterial at all. This can delay the right treatment and expose you to side effects or allergy with no benefit.\n\nAvoid these behaviours: taking an antibiotic without a prescription or advice, using leftovers from a past illness, sharing medicines with others, or pressuring a prescriber for an antibiotic.\n\nIf you are worried about your symptoms, ask a doctor or pharmacist. If you are not given an antibiotic, it may be because it would not help your condition.',
    },
  },
  {
    id: 'safe-use',
    title: { ar: 'الاستخدام الآمن للمضادات الحيوية', en: 'Using antibiotics safely' },
    summary: {
      ar: 'نقاط عامة تساعدك على الالتزام بتعليمات العلاج.',
      en: 'General points to help you follow your treatment instructions.',
    },
    body: {
      ar: 'تناول الدواء تمامًا كما وُصف لك من حيث الجرعة والمواعيد والمدة. اسأل الصيدلي ماذا تفعل إذا نسيت جرعة. لا تغيّر الجرعة أو المدة ولا توقف الدواء من تلقاء نفسك؛ وإن أردت التوقف بسبب أعراض مزعجة فتحدث أولًا إلى من وصف لك الدواء.\n\nأخبر الطبيب أو الصيدلي بأي حساسية سابقة، وبكل الأدوية والمكملات التي تتناولها، وإن كنتِ حاملًا أو مرضعًا، وبأي مرض في الكلى أو الكبد.\n\nيساعد غسل اليدين والتطعيمات الموصى بها على الوقاية من العدوى، وبالتالي تقليل الحاجة إلى المضادات الحيوية.',
      en: 'Take the medicine exactly as prescribed: the dose, the timing, and the length of treatment. Ask the pharmacist what to do if you miss a dose. Do not change the dose or duration or stop on your own; if you want to stop because of troublesome symptoms, speak first to whoever prescribed it.\n\nTell the doctor or pharmacist about any past allergies, all medicines and supplements you take, if you are pregnant or breastfeeding, and any kidney or liver disease.\n\nHand washing and recommended vaccinations help prevent infections, which reduces the need for antibiotics.',
    },
  },
  {
    id: 'adverse-reactions',
    title: { ar: 'الأعراض الجانبية والتفاعلات التحسسية', en: 'Side effects and allergic reactions' },
    summary: {
      ar: 'ماذا تراقب ومتى تطلب المساعدة.',
      en: 'What to watch for and when to get help.',
    },
    body: {
      ar: 'قد تسبب المضادات الحيوية أعراضًا مثل الغثيان أو اضطراب المعدة أو الإسهال أو الطفح الجلدي. أخبر الطبيب أو الصيدلي بأي عرض جديد بعد بدء الدواء.\n\nاطلب مساعدة طبية عاجلة عند ظهور تورّم في الوجه أو الشفتين أو الحلق، أو صعوبة في التنفس، أو طفح جلدي شديد أو مؤلم، أو إسهال شديد أو مستمر أو دموي.\n\nيمكن الإبلاغ عن الأعراض الجانبية المشتبه بها إلى الطبيب أو الصيدلي أو إلى مركز اليقظة الدوائية في بلدك.',
      en: 'Antibiotics can cause symptoms such as nausea, stomach upset, diarrhoea, or a skin rash. Tell a doctor or pharmacist about any new symptom after starting a medicine.\n\nGet urgent medical help for swelling of the face, lips, or throat, difficulty breathing, a severe or painful skin rash, or severe, persistent, or bloody diarrhoea.\n\nSuspected side effects can be reported to your doctor, your pharmacist, or your national pharmacovigilance centre.',
    },
  },
];
