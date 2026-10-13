import { Bi, Source } from './types';

export interface AudioParagraph {
  id: string;
  text: Bi;
}

export interface ListenTopic {
  id: string;
  title: Bi;
  icon: string;
  durationEst: Bi; // Estimated listen time, e.g. "دقيقتان"
  summary: Bi;
  paragraphs: AudioParagraph[];
  emergencyNote?: Bi;
  sources: Source[];
}

const CDC_SRC: Source = {
  title: 'CDC — Antibiotic Use and Stewardship Guidelines',
  url: 'https://www.cdc.gov/antibiotic-use/',
  publisher: 'Centers for Disease Control and Prevention',
  updated: '2026-04-01',
  accessed: '2026-10-13',
};

const WHO_SRC: Source = {
  title: 'WHO — Antimicrobial Resistance Fact Sheet',
  url: 'https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance',
  publisher: 'World Health Organization',
  updated: '2025-11-20',
  accessed: '2026-10-13',
};

const MP_SRC: Source = {
  title: 'MedlinePlus — Antibiotics Patient Instructions',
  url: 'https://medlineplus.gov/antibiotics.html',
  publisher: 'National Library of Medicine (NIH)',
  updated: '2026-05-15',
  accessed: '2026-10-13',
};

export const LISTEN_TOPICS: ListenTopic[] = [
  {
    id: 'what-are-antibiotics',
    title: { ar: 'ما هي المضادات الحيوية وكيف تعمل؟', en: 'What Are Antibiotics & How Do They Work?' },
    icon: '💊',
    durationEst: { ar: 'دقيقتان', en: '2 mins' },
    summary: {
      ar: 'المضادات الحيوية أدوية قوية تقتل البكتيريا الضارة أو توقف تكاثرها، ولا تؤثر إطلاقاً على الفيروسات.',
      en: 'Antibiotics are powerful medications that kill harmful bacteria or inhibit their growth; they have zero effect on viruses.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'المضادات الحيوية هي أدوية منقذة للحياة، صممت خصيصاً لمحاربة العدوى التي تسببها البكتيريا في جسم الإنسان.',
          en: 'Antibiotics are life-saving medicines specifically designed to fight infections caused by bacteria in the human body.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'تعمل المضادات الحيوية بطريقتين رئيسيتين: إما بالقضاء المباشر على البكتيريا عبر تدمير جدارها الخلوي، أو بمنعها من التكاثر والنمو حتى يتغلب عليها جهاز المناعة.',
          en: 'They work in two primary ways: either by directly killing bacteria through disrupting their cell wall, or by stopping them from reproducing until your immune system clears them.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'من المهم جداً أن نتذكر أن المضادات الحيوية لا تعالج العدوى الفيروسية نهائياً. تناول المضاد لنزلة برد أو إنفلونزا لا يقدم أي فائدة، بل قد يسبب ضرراً للجسم.',
          en: 'It is critical to remember that antibiotics never cure viral infections. Taking an antibiotic for a cold or the flu offers zero benefit and can cause harm.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
  {
    id: 'bacterial-vs-viral',
    title: { ar: 'متى يفيدك المضاد ومتى لا يفيدك؟ (بكتيريا أم فيروس)', en: 'When Antibiotics Work & When They Do Not (Bacteria vs Viruses)' },
    icon: '🦠',
    durationEst: { ar: 'دقيقتان ونصف', en: '2.5 mins' },
    summary: {
      ar: 'الفرق الحاسم بين العدوى البكتيرية والفيروسية ولماذا لا يعالج المضاد نزلات البرد والسعال.',
      en: 'The critical difference between bacterial and viral infections and why antibiotics do not cure colds or coughs.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'أكثر من 80 في المائة من حالات التهاب الحلق، ونزلات البرد، والإنفلونزا، والكحة، وسيلان الأنف تسببها فيروسات وليست بكتيريا.',
          en: 'More than 80 percent of sore throats, colds, flu, coughs, and runny noses are caused by viruses, not bacteria.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'المضادات الحيوية لا تقتل الفيروسات مطلقاً. عندما تأخذ مضاداً حيوياً لعدوى فيروسية، فأنت تعرض نفسك للآثار الجانبية كالإسهال والحساسية دون أي تحسن في الأعراض.',
          en: 'Antibiotics cannot kill viruses. When you take an antibiotic for a viral illness, you risk side effects like diarrhea and allergy without improving symptoms.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'علاج العدوى الفيروسية يعتمد على الراحة، وشرب السوائل الدافئة، وتناول خافضات الحرارة البسيطة مثل الباراسيتامول، حتى يتغلب جسمك على الفيروس تلقائياً.',
          en: 'Treatment for viral infections focuses on rest, warm fluids, and simple antipyretics like paracetamol, allowing your immune system to overcome the virus naturally.',
        },
      },
    ],
    sources: [CDC_SRC, WHO_SRC],
  },
  {
    id: 'antibiotic-resistance',
    title: { ar: 'ما هي مقاومة المضادات ولماذا هي خطيرة؟', en: 'What Is Antibiotic Resistance & Why Does It Matter?' },
    icon: '🛡️',
    durationEst: { ar: 'دقيقتان', en: '2 mins' },
    summary: {
      ar: 'المقاومة تعني أن البكتيريا تكتسب القدرة على هزيمة الدواء، مما يجعل الأمراض البسيطة مستعصية على العلاج.',
      en: 'Resistance means bacteria develop the ability to defeat the drugs designed to kill them, making simple infections dangerous.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'مقاومة المضادات الحيوية لا تعني أن جسمك أنت أصبح مقاوماً للدواء، بل تعني أن البكتيريا نفسها طورت دفاعات تجعل المضاد الحيوي غير قادر على قتلها.',
          en: 'Antibiotic resistance does not mean your body becomes resistant. It means the bacteria develop defenses making the antibiotic ineffective.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'السبب الأكبر لنشوء هذه المقاومة هو الاستخدام المفرط وغير الصحيح للمضادات الحيوية، مثل أخذها دون وصفة طبية أو التوقف عن العلاج بمجرد الشعور بالتحسن.',
          en: 'The leading cause of resistance is overuse and incorrect use of antibiotics, such as taking them without a prescription or stopping therapy early upon feeling better.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'انتشار البكتيريا المقاومة يهدد بعودة العالم إلى عصر تصبح فيه العمليات الجراحية البسيطة والعدوى العادية مهددة للحياة لعدم توفر دواء فعال.',
          en: 'The spread of resistant superbugs threatens modern medicine, making routine surgeries and common infections potentially life-threatening due to lack of effective drugs.',
        },
      },
    ],
    sources: [WHO_SRC, CDC_SRC],
  },
  {
    id: 'safe-use',
    title: { ar: 'الاستخدام الآمن وإكمال الكورس العلاجي كاملاً', en: 'Safe Antibiotic Use & Finishing Your Course' },
    icon: '✅',
    durationEst: { ar: 'دقيقتان ونصف', en: '2.5 mins' },
    summary: {
      ar: 'لماذا يجب ألا تتوقف عن تناول الدواء عند الشعور بالتحسن، وكيف تلتزم بمواعيد الجرعات بدقة.',
      en: 'Why you must not stop antibiotics when feeling better and how to adhere strictly to scheduled dosing.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'القاعدة الذهبية في المضادات الحيوية هي: أكمل دائماً الكورس العلاجي الموصوف كاملاً حتى آخر يوم، حتى لو اختفت الأعراض تماماً وشعرت بالشفاء بعد يومين أو ثلاثة.',
          en: 'The golden rule of antibiotics: always complete the entire prescribed course, even if all symptoms completely vanish after two or three days.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'الشعور بالتحسن يعني فقط أن البكتيريا الضعيفة قد ماتت، بينما تظل البكتيريا الأقوى حية في جسمك. إذا توقفت مبكراً، ستتكاثر هذه البكتيريا الشرسة وتسبب انتكاسة مرضية شديدة.',
          en: 'Feeling better only means the weakest bacteria have died, while the most resilient survive. Stopping early allows these super-bacteria to multiply and cause severe recurrence.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'احرص على تناول جرعاتك في نفس المواعيد المحددة يومياً، وتجنب تماماً مشاركة دوائك مع أي شخص آخر، ولا تستخدم عبوات قديمة متبقية في منزلك.',
          en: 'Take your doses at the exact scheduled intervals every day. Never share your medicine with others or save leftover boxes for future illnesses.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
  {
    id: 'cold-injection',
    title: { ar: 'مخاطر حقنة ومجموعة البرد الشعبية', en: 'Dangers of the "Cold Shot" Mixture' },
    icon: '⚠️',
    durationEst: { ar: 'دقيقتان', en: '2 mins' },
    summary: {
      ar: 'تحذير طبي عاجل من خلطة البرد الشعبية وأضرارها البالغة على الكلى والمناعة.',
      en: 'Urgent clinical warning regarding the popular OTC cold injection and its severe renal and immune risks.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'حقنة البرد أو مجموعة البرد الشعبية المنتشرة في الصيدليات، والتي تخلط مضاداً حيوياً مع كورتيزون ومسكن قوي، هي ممارسة خاطئة وخطيرة جداً ومحرمة طبياً.',
          en: 'The popular "cold injection" or cold pack mixing an antibiotic with a corticosteroid and high-dose NSAID is dangerous and medically irrational.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'أولاً: نزلات البرد فيروسية ولا يفيدها المضاد. ثانياً: جرعة المضاد الواحدة لا تعالج العدوى بل تسرع نشوء بكتيريا مقاومة. ثالثاً: الكورتيزون يضعف المناعة ويزيد انتشار العدوى.',
          en: 'First, colds are viral. Second, a single antibiotic dose drives superbug resistance. Third, corticosteroids suppress natural immunity, worsening infection spread.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'المسكنات القوية في الحقنة قد تسبب قصوراً حاداً في الكلى أو نزيفاً بالمعدة. وزارة الصحة المصرية تحذر منها بشدة لخطورتها على حياة المرضى.',
          en: 'High-dose injectable NSAIDs risk acute kidney failure and gastric bleeding. Public health authorities strictly warn against this practice.',
        },
      },
    ],
    sources: [CDC_SRC],
  },
  {
    id: 'side-effects',
    title: { ar: 'الآثار الجانبية الشائعة وكيفية التعامل معها', en: 'Common Side Effects & What To Do' },
    icon: '🥣',
    durationEst: { ar: 'دقيقتان ونصف', en: '2.5 mins' },
    summary: {
      ar: 'كيف تتعامل مع اضطراب المعدة والإسهال الخفيف ودور الزبادي والبروبيوتيك.',
      en: 'Managing mild stomach upset, diarrhea, and the restorative role of yogurt and probiotics.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'معظم المضادات الحيوية قد تسبب آثاراً جانبية خفيفة على الجهاز الهضمي، مثل الغثيان، أو ألم خفيف بالمعدة، أو ليونة البراز.',
          en: 'Most antibiotics can cause mild gastrointestinal effects, such as mild nausea, stomach discomfort, or loose stools.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'يمكن تخفيف هذه الأعراض بتناول الدواء مع وجبة خفيفة (إذا لم يكن من الأدوية التي تشترط معدة فارغة). تناول الزبادي والأغذية المخمرة أو مكملات البروبيوتيك بفارق ساعتين عن جرعة المضاد يعوض البكتيريا النافعة.',
          en: 'Taking medicine with light meals (if permitted) reduces irritation. Consuming yogurt or probiotics spaced 2 hours away replenishes beneficial flora.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'إذا كان الإسهال شديداً ومائياً جداً أو مصحوباً بدم أو تقلصات حادة، فهذا يستدعي الاتصال بالطبيب فوراً لاحتمال الإصابة بعدوى المطثية العسيرة، ولا تأخذ أدوية توقف الإسهال من تلقاء نفسك.',
          en: 'If diarrhea is watery, persistent, or bloody, contact your doctor promptly; this may indicate C. difficile. Never take OTC anti-diarrheal pills without advice.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
  {
    id: 'emergency-signs',
    title: { ar: 'علامات الطوارئ الخطيرة: متى تطلب الإسعاف فوراً؟', en: 'Emergency Warning Signs: When To Seek Immediate Help' },
    icon: '🚨',
    durationEst: { ar: 'دقيقة ونصف', en: '1.5 mins' },
    summary: {
      ar: 'أعراض الصدمة التحسسية الحادة التي تتطلب التوجه للطوارئ والاتصال بالإسعاف (123) على الفور.',
      en: 'Acute anaphylactic warning signs requiring immediate emergency medical care and ambulance call (123).',
    },
    emergencyNote: {
      ar: 'في حالات الطوارئ الحادة اتصل بالإسعاف (123 في مصر) أو توجه فوراً لأقرب قسم طوارئ بمستشفى ولا تنتظر!',
      en: 'In acute emergencies, call ambulance services immediately or go to the nearest emergency department!',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'إذا ظهرت عليك بعد تناول المضاد الحيوي صعوبة مفاجئة في التنفس، أو صفير حاد بالصدر، أو تورم في اللسان أو الحلق أو الشفتين، فهذه علامة على تفاعل تحسسي مهدد للحياة.',
          en: 'If you develop sudden difficulty breathing, wheezing, or swelling of the tongue, throat, or lips after taking an antibiotic, this is a life-threatening allergic emergency.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'كذلك إذا شعرت بدوار شديد وإغماء، أو ظهر طفح جلدي واسع مع تقرحات وفقاعات في الجلد، توقف فوراً عن تناول أي دواء واطلب رعاية طبية عاجلة.',
          en: 'Likewise, severe dizziness, collapse, or a spreading blistering rash requires immediate cessation of medication and urgent emergency assistance.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'اتصل بالإسعاف فوراً (123 في مصر) أو اطلب من شخص نقلك لأقرب طوارئ. أبلغ الفريق الطبي فور وصولك باسم المضاد الحيوي الذي تناولته.',
          en: 'Call emergency services (123 in Egypt) or have someone take you to the nearest ER. Tell the medical team the exact antibiotic you ingested.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
  {
    id: 'storage-disposal',
    title: { ar: 'التخزين الصحيح للأدوية والشراب المعلق', en: 'Safe Medicine Storage & Suspension Disposal' },
    icon: '🧊',
    durationEst: { ar: 'دقيقتان', en: '2 mins' },
    summary: {
      ar: 'كيف تحفظ المضاد الحيوي الشراب للأطفال في الثلاجة وصلاحيته المحدودة، والتخلص الآمن من البقايا.',
      en: 'Storing pediatric antibiotic oral suspensions in the refrigerator, strict shelf-life, and safe disposal.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'المضاد الحيوي الشراب المعلق للأطفال (الذي يتم حله بالماء في الصيدلية) يجب حفظه دائماً في باب الثلاجة في درجة حرارة بين 2 و 8 درجات مئوية لحمايته من التلف.',
          en: 'Reconstituted pediatric antibiotic suspensions must always be stored in the refrigerator (2-8°C) to prevent degradation.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'مدة صلاحية الشراب المعلق بعد حله تتراوح بين 7 إلى 14 يوماً فقط حسب نوع الدواء المكتوب في النشرة. بعد انتهاء هذه المدة، يصبح الدواء غير فعال وقد يسبب ضرراً، ويجب التخلص منه فوراً.',
          en: 'Shelf-life after reconstitution is strictly 7 to 14 days depending on product label. Afterwards, the medicine loses efficacy and must be discarded immediately.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'احفظ الأقراص والكبسولات في مكان جاف وبارد بعيداً عن حرارة المطبخ ورطوبة الحمام، وبعيداً تماماً عن متناول أيدي الأطفال.',
          en: 'Store tablets and capsules in a cool, dry place away from bathroom moisture and kitchen heat, safely out of reach of children.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
];
