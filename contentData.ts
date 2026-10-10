import { Bi } from './types';

/**
 * Sources that were actually opened and read when this content was written.
 * Statements below are in the app author's own words and only claim what these pages say.
 * Arabic text is an AI translation and needs review. Nothing here has been reviewed by a clinician yet.
 */
export interface Src { title: string; url: string; publisher: string; date: string; accessed: string }

export const CDC_FACTS: Src = {
  title: 'Antibiotic Use and Antimicrobial Resistance Facts',
  url: 'https://www.cdc.gov/antibiotic-use/data-research/facts-stats/index.html',
  publisher: 'CDC – Antibiotic Prescribing and Use',
  date: '2024-04-22',
  accessed: '2026-10-10',
};
export const MP_AMOX: Src = {
  title: 'Amoxicillin: MedlinePlus Drug Information',
  url: 'https://medlineplus.gov/druginfo/meds/a685001.html',
  publisher: 'National Library of Medicine (MedlinePlus)',
  date: '2026-05-15',
  accessed: '2026-10-10',
};
export const CDC_PREVENTION_FURTHER: Src = {
  title: 'CDC – Antimicrobial resistance: prevention (further reading, not used as a source for the text)',
  url: 'https://www.cdc.gov/antimicrobial-resistance/prevention/index.html',
  publisher: 'CDC',
  date: '',
  accessed: '',
};

const o = (ar: string, en: string): Bi => ({ ar, en });

// ---------------- Myth or fact ----------------
export interface Myth { statement: Bi; isFact: boolean; why: Bi; source: Src }

export const MYTHS: Myth[] = [
  {
    statement: o('المضادات الحيوية تعالج نزلات البرد والإنفلونزا.', 'Antibiotics can treat colds and flu.'),
    isFact: false,
    why: o('نزلات البرد والإنفلونزا تسببها فيروسات، والمضادات الحيوية لا تعالج العدوى الفيروسية.', 'Colds and flu are caused by viruses, and antibiotics do not treat infections caused by viruses.'),
    source: CDC_FACTS,
  },
  {
    statement: o('مقاومة المضادات تعني أن جسم الإنسان يصبح مقاومًا للدواء.', 'Antibiotic resistance means the human body becomes resistant to the medicine.'),
    isFact: false,
    why: o('المقاومة تعني أن الجراثيم هي التي تكتسب القدرة على هزيمة الدواء، وليس جسمك.', 'Resistance means the germs develop the ability to defeat the drug. It does not mean your body is resistant.'),
    source: CDC_FACTS,
  },
  {
    statement: o('كلما استُخدمت المضادات الحيوية فقد تسبب آثارًا جانبية وتسهم في المقاومة.', 'Any time antibiotics are used, they can cause side effects and contribute to resistance.'),
    isFact: true,
    why: o('هذا ما تذكره CDC. وعند الحاجة الفعلية للمضاد فإن فوائده تفوق عادةً مخاطر المقاومة، لذلك يُستخدم عند الحاجة فقط.', 'This is what CDC states. When an antibiotic is really needed, the benefits usually outweigh the risk of resistance, which is why it should be used only when needed.'),
    source: CDC_FACTS,
  },
  {
    statement: o('لا مشكلة في الاحتفاظ ببقايا المضاد الحيوي لاستخدامها عند المرض مرة أخرى.', 'It is fine to save leftover antibiotics for the next time you are sick.'),
    isFact: false,
    why: o('تنصح CDC بعدم الاحتفاظ بالمضادات الحيوية لوقت لاحق.', 'CDC advises not to save antibiotics for later.'),
    source: CDC_FACTS,
  },
  {
    statement: o('إذا كنت متعبًا فعليّ أن أضغط على الطبيب ليصف لي مضادًا حيويًا.', 'If I feel unwell I should pressure my doctor to prescribe an antibiotic.'),
    isFact: false,
    why: o('تنصح CDC بعدم الضغط على الطبيب لوصف مضاد حيوي، وبالتحدث معه عن أفضل علاج لحالتك.', 'CDC says never to pressure your doctor for an antibiotic; talk to them about the best treatment for your illness.'),
    source: CDC_FACTS,
  },
  {
    statement: o('تناول جرعة خاطئة أو لمدة غير مناسبة يُعدّ سوء استخدام للمضاد الحيوي.', 'Taking the wrong dose, or taking an antibiotic for the wrong length of time, is misuse.'),
    isFact: true,
    why: o('تعرّف CDC سوء الاستخدام بأنه تناول المضاد الخطأ أو الجرعة الخطأ أو لمدة خطأ.', 'CDC defines misuse as taking the wrong antibiotic, the wrong dose, or an antibiotic for the wrong length of time.'),
    source: CDC_FACTS,
  },
  {
    statement: o('المقاومة لمضاد حيوي واحد فقط لا تُعتبر مشكلة خطيرة.', 'Resistance to just one antibiotic is not a serious problem.'),
    isFact: false,
    why: o('تذكر CDC أن البكتيريا لا يلزم أن تكون مقاومة لكل المضادات لتكون خطيرة؛ فالمقاومة لمضاد واحد قد تعني مشاكل جسيمة.', 'CDC notes that germs do not have to resist every antibiotic to be dangerous; resistance to even one can mean serious problems.'),
    source: CDC_FACTS,
  },
  {
    statement: o('قد تكون العدوى المقاومة صعبة العلاج، وأحيانًا مستحيلة العلاج.', 'Resistant infections can be difficult, and sometimes impossible, to treat.'),
    isFact: true,
    why: o('هذا ما تذكره CDC، وقد تتطلب إقامة أطول في المستشفى وعلاجات بديلة مكلفة وسامة.', 'This is what CDC states; such infections can need longer hospital stays and costly, toxic alternative treatments.'),
    source: CDC_FACTS,
  },
  {
    statement: o('إذا أوقفت أموكسيسيلين مبكرًا أو فوّتّ جرعات فقد تصبح البكتيريا مقاومة.', 'If you stop amoxicillin too soon or skip doses, bacteria may become resistant.'),
    isFact: true,
    why: o('تذكر MedlinePlus أن ذلك قد يترك العدوى غير معالجة بالكامل وقد تصبح البكتيريا مقاومة، ولذلك يُكمل المريض الوصفة كما وجّهه الطبيب.', 'MedlinePlus states this can leave the infection not completely treated and let bacteria become resistant, so follow the prescriber’s directions for the whole course.'),
    source: MP_AMOX,
  },
  {
    statement: o('مقاومة المضادات الحيوية لا تهم إلا من يدخلون المستشفيات.', 'Antibiotic resistance only matters to people who go to hospital.'),
    isFact: false,
    why: o('تذكر CDC أن المقاومة قد تصيب أي شخص في أي مرحلة من العمر، وإن كان من يتلقون الرعاية الصحية أو ضعيفو المناعة أكثر عرضة للعدوى.', 'CDC says resistance can affect any person at any stage of life, although people receiving health care or with weakened immune systems are often at higher risk of infection.'),
    source: CDC_FACTS,
  },
];

// ---------------- Learning journey ----------------
export interface Step {
  id: string;
  title: Bi;
  body: Bi; // paragraphs separated by a blank line
  check: { q: Bi; options: Bi[]; answer: number; why: Bi };
  sources: Src[];
}

export const STEPS: Step[] = [
  {
    id: 'what',
    title: o('ما هي المضادات الحيوية؟', 'What are antibiotics?'),
    body: o(
      'المضادات الحيوية أدوية تقتل أنواعًا معينة من الجراثيم تُسمى البكتيريا وتوقف نموها. وهي أدوات مهمة للوقاية من العدوى التي تسببها بكتيريا محددة وعلاجها.\n\nمعظم البكتيريا غير ضارة وبعضها مفيد للإنسان، لكن بعضها قد يسبب التهابات مثل التهاب الحلق العقدي والتهابات المسالك البولية.',
      'Antibiotics are drugs that kill certain kinds of germs called bacteria and stop their growth. They are critical tools for preventing and treating infections caused by specific bacteria.\n\nMost bacteria are harmless and some are helpful to humans, but bacteria can cause infections such as strep throat and urinary tract infections.',
    ),
    check: {
      q: o('المضادات الحيوية تعمل ضد:', 'Antibiotics act against:'),
      options: [o('البكتيريا', 'Bacteria'), o('الفيروسات', 'Viruses'), o('كل أنواع الجراثيم', 'All kinds of germs')],
      answer: 0,
      why: o('هي أدوية ضد أنواع معينة من البكتيريا.', 'They are drugs against certain kinds of bacteria.'),
    },
    sources: [CDC_FACTS],
  },
  {
    id: 'bacteria-virus',
    title: o('البكتيريا مقابل الفيروسات', 'Bacteria versus viruses'),
    body: o(
      'الفيروسات جراثيم تختلف عن البكتيريا، وهي تسبب عدوى مثل نزلات البرد والإنفلونزا. والمضادات الحيوية لا تعالج العدوى التي تسببها الفيروسات.\n\nلذلك ليست المضادات الحيوية هي الحل في كل مرة تمرض فيها.',
      'Viruses are germs different from bacteria. They cause infections such as colds and flu. Antibiotics do not treat infections caused by viruses.\n\nThat is why antibiotics are not the answer every time you are sick.',
    ),
    check: {
      q: o('أي مما يلي تسببه فيروسات ولا تعالجه المضادات الحيوية؟', 'Which of these is caused by viruses and is not treated by antibiotics?'),
      options: [o('نزلة البرد أو الإنفلونزا', 'A cold or flu'), o('التهاب الحلق العقدي', 'Strep throat'), o('التهاب المسالك البولية', 'A urinary tract infection')],
      answer: 0,
      why: o('التهاب الحلق العقدي والتهاب المسالك البولية مثالان على عدوى قد تسببها البكتيريا.', 'Strep throat and urinary tract infections are examples of infections that bacteria can cause.'),
    },
    sources: [CDC_FACTS],
  },
  {
    id: 'resistance',
    title: o('ما هي مقاومة المضادات؟', 'What is antimicrobial resistance?'),
    body: o(
      'تحدث المقاومة عندما تكتسب جراثيم مثل البكتيريا والفطريات القدرة على هزيمة الأدوية المصممة لقتلها، فتواصل الجراثيم النمو.\n\nلا تعني المقاومة أن جسمك أصبح مقاومًا للمضاد؛ فالجراثيم هي التي تتغير.\n\nقد تكون العدوى المقاومة صعبة العلاج وأحيانًا مستحيلة. والمقاومة لمضاد واحد فقط قد تعني مشاكل جسيمة، وقد تصيب أي شخص في أي مرحلة من العمر.',
      'Resistance happens when germs such as bacteria and fungi develop the ability to defeat the drugs designed to kill them, so the germs continue to grow.\n\nIt does not mean your body is resistant to the antibiotic: the germs are the ones that change.\n\nResistant infections can be difficult, and sometimes impossible, to treat. Resistance to even one antibiotic can mean serious problems, and it can affect any person at any stage of life.',
    ),
    check: {
      q: o('من الذي يصبح مقاومًا؟', 'What becomes resistant?'),
      options: [o('الجراثيم', 'The germs'), o('جسم المريض', 'The patient’s body'), o('الطبيب', 'The doctor')],
      answer: 0,
      why: o('الجراثيم هي التي تكتسب القدرة على هزيمة الدواء.', 'The germs develop the ability to defeat the drug.'),
    },
    sources: [CDC_FACTS],
  },
  {
    id: 'misuse',
    title: o('كيف يسهم سوء الاستخدام في المقاومة؟', 'How does misuse contribute?'),
    body: o(
      'في كل مرة تُستخدم فيها المضادات الحيوية قد تسهم في المقاومة، ولذلك يجب استخدامها عند الحاجة فقط.\n\nالاستخدام غير الضروري هو تناول مضاد لا تحتاجه، مثل نزلات البرد والإنفلونزا، أو لعدوى لا تحتاج دائمًا إلى مضاد مثل كثير من التهابات الجيوب الأنفية وبعض التهابات الأذن.\n\nأما سوء الاستخدام فهو تناول المضاد الخطأ أو الجرعة الخطأ أو لمدة خطأ.',
      'Any time antibiotics are used they can contribute to resistance, so they should be used only when needed.\n\nUnnecessary use means taking antibiotics you do not need, such as for colds and flu, or for infections that do not always need them, such as many sinus infections and some ear infections.\n\nMisuse means taking the wrong antibiotic, the wrong dose, or an antibiotic for the wrong length of time.',
    ),
    check: {
      q: o('أي مما يلي يُعدّ سوء استخدام؟', 'Which of these is misuse?'),
      options: [
        o('تناول الجرعة الخطأ أو لمدة غير مناسبة', 'Taking the wrong dose or for the wrong length of time'),
        o('تناول الدواء كما وصفه الطبيب', 'Taking it exactly as the prescriber directed'),
        o('سؤال الصيدلي عن الدواء', 'Asking the pharmacist about the medicine'),
      ],
      answer: 0,
      why: o('الجرعة أو المدة الخطأ من صور سوء الاستخدام.', 'A wrong dose or wrong duration is a form of misuse.'),
    },
    sources: [CDC_FACTS],
  },
  {
    id: 'safe-use',
    title: o('الاستخدام الآمن', 'Using antibiotics safely'),
    body: o(
      'تحدث مع طبيبك عن أفضل علاج لحالتك، ولا تضغط على الطبيب لوصف مضاد حيوي. لا تحتفظ بالمضادات الحيوية لوقت لاحق، ولا تسمح لأحد بتناول دوائك.\n\nإذا وُصف لك مضاد فتناوله تمامًا كما هو مطلوب. وبالنسبة للأموكسيسيلين تذكر MedlinePlus أن تُكمل الوصفة حتى لو شعرت بتحسن، لأن التوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالجة جزئيًا وقد تصبح البكتيريا مقاومة.\n\nإذا كانت لديك أسئلة عن مضادك الحيوي فاسأل طبيبك أو الصيدلي.',
      'Talk to your doctor about the best treatment for your illness, and never pressure your doctor to prescribe an antibiotic. Do not save antibiotics for later, and do not let anyone else take your medicine.\n\nIf an antibiotic is prescribed, take it exactly as directed. For amoxicillin, MedlinePlus says to finish the prescription even if you feel better, because stopping too soon or skipping doses may leave the infection only partly treated and let bacteria become resistant.\n\nIf you have questions about your antibiotic, ask your doctor or pharmacist.',
    ),
    check: {
      q: o('شعرت بتحسن بعد يومين من وصفة مضاد حيوي. ما الأنسب؟', 'You feel better after two days of an antibiotic prescription. What is best?'),
      options: [
        o('اتباع تعليمات من وصف الدواء والسؤال إذا لم أكن متأكدًا', 'Follow the prescriber’s directions and ask if unsure'),
        o('التوقف فورًا', 'Stop immediately'),
        o('الاحتفاظ بالباقي لوقت لاحق', 'Save the rest for later'),
      ],
      answer: 0,
      why: o('لا تغيّر مدة العلاج من تلقاء نفسك، ولا تحتفظ بالدواء لوقت لاحق.', 'Do not change the treatment length on your own, and do not save medicine for later.'),
    },
    sources: [CDC_FACTS, MP_AMOX],
  },
  {
    id: 'roles',
    title: o('دور كل شخص', 'Everyone has a role'),
    body: o(
      'تشير CDC إلى أن لكل شخص دورًا في تحسين استخدام المضادات الحيوية. وتناول المضاد عند الحاجة فقط يحميك ويحمي أسرتك ويساعد في مواجهة المقاومة.\n\nتؤثر المقاومة أيضًا في الطب البيطري والزراعة، ومن يتلقون الرعاية الصحية أو ضعيفو المناعة أكثر عرضة للعدوى، ومنها العدوى المقاومة.',
      'CDC notes that everyone has a role to play in improving antibiotic use. Taking antibiotics only when needed protects you and your family and helps combat resistance.\n\nResistance also affects veterinary medicine and agriculture, and people receiving health care or with weakened immune systems are often at higher risk of infection, including resistant infections.',
    ),
    check: {
      q: o('من له دور في تحسين استخدام المضادات الحيوية؟', 'Who has a role in improving antibiotic use?'),
      options: [o('الجميع', 'Everyone'), o('الأطباء فقط', 'Only doctors'), o('الصيادلة فقط', 'Only pharmacists')],
      answer: 0,
      why: o('الجميع: المرضى والأسر ومقدمو الرعاية.', 'Everyone: patients, families, and care providers.'),
    },
    sources: [CDC_FACTS, CDC_PREVENTION_FURTHER],
  },
];
