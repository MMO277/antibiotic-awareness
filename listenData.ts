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
    title: {
      ar: 'ما هي المضادات الحيوية وكيف تعمل؟',
      en: 'What Are Antibiotics & How Do They Work?',
      de: 'Was sind Antibiotika und wie wirken sie?',
    },
    icon: '💊',
    durationEst: { ar: 'دقيقتان', en: '2 mins', de: '2 Min.' },
    summary: {
      ar: 'المضادات الحيوية أدوية قوية تقتل البكتيريا الضارة أو توقف تكاثرها، ولا تؤثر إطلاقاً على الفيروسات.',
      en: 'Antibiotics are powerful medications that kill harmful bacteria or inhibit their growth; they have zero effect on viruses.',
      de: 'Antibiotika sind hochwirksame Medikamente, die schädliche Bakterien abtöten oder deren Vermehrung hemmen; gegen Viren sind sie völlig wirkungslos.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'المضادات الحيوية هي أدوية منقذة للحياة، صممت خصيصاً لمحاربة العدوى التي تسببها البكتيريا في جسم الإنسان.',
          en: 'Antibiotics are life-saving medicines specifically designed to fight infections caused by bacteria in the human body.',
          de: 'Antibiotika sind lebensrettende Medikamente, die speziell zur Bekämpfung bakterieller Infektionen im menschlichen Körper entwickelt wurden.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'تعمل المضادات الحيوية بطريقتين رئيسيتين: إما بالقضاء المباشر على البكتيريا عبر تدمير جدارها الخلوي، أو بمنعها من التكاثر والنمو حتى يتغلب عليها جهاز المناعة.',
          en: 'They work in two primary ways: either by directly killing bacteria through disrupting their cell wall, or by stopping them from reproducing until your immune system clears them.',
          de: 'Sie wirken auf zwei Hauptwegen: Entweder töten sie Bakterien direkt ab, indem sie deren Zellwand zerstören, oder sie hemmen deren Vermehrung, bis das eigene Immunsystem die Erreger beseitigt.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'من المهم جداً أن نتذكر أن المضادات الحيوية لا تعالج العدوى الفيروسية نهائياً. تناول المضاد لنزلة برد أو إنفلونزا لا يقدم أي فائدة، بل قد يسبب ضرراً للجسم.',
          en: 'It is critical to remember that antibiotics never cure viral infections. Taking an antibiotic for a cold or the flu offers zero benefit and can cause harm.',
          de: 'Es ist entscheidend zu wissen, dass Antibiotika niemals Virusinfektionen heilen. Die Einnahme eines Antibiotikums bei einer Erkältung oder Grippe bringt keinerlei Nutzen und kann dem Körper schaden.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
  {
    id: 'bacterial-vs-viral',
    title: {
      ar: 'متى يفيدك المضاد ومتى لا يفيدك؟ (بكتيريا أم فيروس)',
      en: 'When Antibiotics Work & When They Do Not (Bacteria vs Viruses)',
      de: 'Wann Antibiotika helfen und wann nicht (Bakterien vs. Viren)',
    },
    icon: '🦠',
    durationEst: { ar: 'دقيقتان ونصف', en: '2.5 mins', de: '2,5 Min.' },
    summary: {
      ar: 'الفرق الحاسم بين العدوى البكتيرية والفيروسية ولماذا لا يعالج المضاد نزلات البرد والسعال.',
      en: 'The critical difference between bacterial and viral infections and why antibiotics do not cure colds or coughs.',
      de: 'Der entscheidende Unterschied zwischen bakteriellen und viralen Infektionen und warum Antibiotika nicht gegen Erkältungen oder Husten helfen.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'أكثر من 80 في المائة من حالات التهاب الحلق، ونزلات البرد، والإنفلونزا، والكحة، وسيلان الأنف تسببها فيروسات وليست بكتيريا.',
          en: 'More than 80 percent of sore throats, colds, flu, coughs, and runny noses are caused by viruses, not bacteria.',
          de: 'Mehr als 80 Prozent aller Halsschmerzen, Erkältungen, Grippeerkrankungen, Hustenanfälle und Schnupfen werden durch Viren verursacht – nicht durch Bakterien.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'المضادات الحيوية لا تقتل الفيروسات مطلقاً. عندما تأخذ مضاداً حيوياً لعدوى فيروسية، فأنت تعرض نفسك للآثار الجانبية كالإسهال والحساسية دون أي تحسن في الأعراض.',
          en: 'Antibiotics cannot kill viruses. When you take an antibiotic for a viral illness, you risk side effects like diarrhea and allergy without improving symptoms.',
          de: 'Antibiotika können Viren nicht abtöten. Wenn Sie bei einer Virusinfektion ein Antibiotikum einnehmen, setzen Sie sich Nebenwirkungen wie Durchfall und Allergien aus, ohne Ihre Symptome zu lindern.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'علاج العدوى الفيروسية يعتمد على الراحة، وشرب السوائل الدافئة، وتناول خافضات الحرارة البسيطة مثل الباراسيتامول، حتى يتغلب جسمك على الفيروس تلقائياً.',
          en: 'Treatment for viral infections focuses on rest, warm fluids, and simple antipyretics like paracetamol, allowing your immune system to overcome the virus naturally.',
          de: 'Die Behandlung viraler Infekte stützt sich auf körperliche Ruhe, reichlich Flüssigkeit und einfache fiebersenkende Mittel wie Paracetamol, damit Ihr Immunsystem das Virus auf natürliche Weise bekämpfen kann.',
        },
      },
    ],
    sources: [CDC_SRC, WHO_SRC],
  },
  {
    id: 'antibiotic-resistance',
    title: {
      ar: 'ما هي مقاومة المضادات ولماذا هي خطيرة؟',
      en: 'What Is Antibiotic Resistance & Why Does It Matter?',
      de: 'Was ist Antibiotikaresistenz und warum ist sie gefährlich?',
    },
    icon: '🛡️',
    durationEst: { ar: 'دقيقتان', en: '2 mins', de: '2 Min.' },
    summary: {
      ar: 'المقاومة تعني أن البكتيريا تكتسب القدرة على هزيمة الدواء، مما يجعل الأمراض البسيطة مستعصية على العلاج.',
      en: 'Resistance means bacteria develop the ability to defeat the drugs designed to kill them, making simple infections dangerous.',
      de: 'Resistenz bedeutet, dass Bakterien lernen, Medikamente abzuwehren, wodurch selbst einfache Infektionen lebensbedrohlich werden können.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'مقاومة المضادات الحيوية لا تعني أن جسمك أنت أصبح مقاوماً للدواء، بل تعني أن البكتيريا نفسها طورت دفاعات تجعل المضاد الحيوي غير قادر على قتلها.',
          en: 'Antibiotic resistance does not mean your body becomes resistant. It means the bacteria develop defenses making the antibiotic ineffective.',
          de: 'Antibiotikaresistenz bedeutet nicht, dass Ihr Körper resistent wird, sondern dass die Bakterien selbst Abwehrmechanismen entwickeln, durch die das Antibiotikum seine Wirkung verliert.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'السبب الأكبر لنشوء هذه المقاومة هو الاستخدام المفرط وغير الصحيح للمضادات الحيوية، مثل أخذها دون وصفة طبية أو التوقف عن العلاج بمجرد الشعور بالتحسن.',
          en: 'The leading cause of resistance is overuse and incorrect use of antibiotics, such as taking them without a prescription or stopping therapy early upon feeling better.',
          de: 'Die Hauptursache für die Entstehung von Resistenzen ist der übermäßige und falsche Einsatz von Antibiotika – etwa die Einnahme ohne Rezept oder das vorzeitige Absetzen bei erster Besserung.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'انتشار البكتيريا المقاومة يهدد بعودة العالم إلى عصر تصبح فيه العمليات الجراحية البسيطة والعدوى العادية مهددة للحياة لعدم توفر دواء فعال.',
          en: 'The spread of resistant superbugs threatens modern medicine, making routine surgeries and common infections potentially life-threatening due to lack of effective drugs.',
          de: 'Die Ausbreitung multiresistenter Erreger gefährdet die moderne Medizin, sodass Routineoperationen und gewöhnliche Infektionen mangels wirksamer Medikamente wieder lebensbedrohlich werden können.',
        },
      },
    ],
    sources: [WHO_SRC, CDC_SRC],
  },
  {
    id: 'safe-use',
    title: {
      ar: 'الاستخدام الآمن وإكمال الكورس العلاجي كاملاً',
      en: 'Safe Antibiotic Use & Finishing Your Course',
      de: 'Sichere Anwendung & vollständiger Abschluss der Therapie',
    },
    icon: '✅',
    durationEst: { ar: 'دقيقتان ونصف', en: '2.5 mins', de: '2,5 Min.' },
    summary: {
      ar: 'لماذا يجب ألا تتوقف عن تناول الدواء عند الشعور بالتحسن، وكيف تلتزم بمواعيد الجرعات بدقة.',
      en: 'Why you must not stop antibiotics when feeling better and how to adhere strictly to scheduled dosing.',
      de: 'Warum Sie Antibiotika bei Besserung nicht vorzeitig absetzen dürfen und wie Sie Einnahmezeiten exakt einhalten.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'القاعدة الذهبية في المضادات الحيوية هي: أكمل دائماً الكورس العلاجي الموصوف كاملاً حتى آخر يوم، حتى لو اختفت الأعراض تماماً وشعرت بالشفاء بعد يومين أو ثلاثة.',
          en: 'The golden rule of antibiotics: always complete the entire prescribed course, even if all symptoms completely vanish after two or three days.',
          de: 'Die goldene Regel bei Antibiotika lautet: Nehmen Sie die verordnete Therapie immer bis zum letzten Tag vollständig ein, selbst wenn alle Symptome schon nach zwei oder drei Tagen verschwunden sind.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'الشعور بالتحسن يعني فقط أن البكتيريا الضعيفة قد ماتت، بينما تظل البكتيريا الأقوى حية في جسمك. إذا توقفت مبكراً، ستتكاثر هذه البكتيريا الشرسة وتسبب انتكاسة مرضية شديدة.',
          en: 'Feeling better only means the weakest bacteria have died, while the most resilient survive. Stopping early allows these super-bacteria to multiply and cause severe recurrence.',
          de: 'Sich besser zu fühlen bedeutet nur, dass die schwächsten Bakterien abgetötet wurden, während die widerstandsfähigsten noch im Körper überleben. Ein vorzeitiger Abbruch ermöglicht diesen Keimen, sich erneut zu vermehren und einen schweren Rückfall auszulösen.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'احرص على تناول جرعاتك في نفس المواعيد المحددة يومياً، وتجنب تماماً مشاركة دوائك مع أي شخص آخر، ولا تستخدم عبوات قديمة متبقية في منزلك.',
          en: 'Take your doses at the exact scheduled intervals every day. Never share your medicine with others or save leftover boxes for future illnesses.',
          de: 'Nehmen Sie Ihre Dosen täglich genau in den vorgeschriebenen Zeitabständen ein. Teilen Sie Ihr Medikament niemals mit anderen und bewahren Sie keine Restpackungen für spätere Erkrankungen auf.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
  {
    id: 'cold-injection',
    title: {
      ar: 'مخاطر حقنة ومجموعة البرد الشعبية',
      en: 'Dangers of the "Cold Shot" Mixture',
      de: 'Gefahren der sogenannten „3-in-1-Erkältungsspritze“',
    },
    icon: '⚠️',
    durationEst: { ar: 'دقيقتان', en: '2 mins', de: '2 Min.' },
    summary: {
      ar: 'تحذير طبي عاجل من خلطة البرد الشعبية وأضرارها البالغة على الكلى والمناعة.',
      en: 'Urgent clinical warning regarding the popular OTC cold injection and its severe renal and immune risks.',
      de: 'Dringende medizinische Warnung vor dem gefährlichen 3-in-1-Erkältungscocktail und seinen schweren Risiken für Nieren und Immunsystem.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'حقنة البرد أو مجموعة البرد الشعبية المنتشرة في الصيدليات، والتي تخلط مضاداً حيوياً مع كورتيزون ومسكن قوي، هي ممارسة خاطئة وخطيرة جداً ومحرمة طبياً.',
          en: 'The popular "cold injection" or cold pack mixing an antibiotic with a corticosteroid and high-dose NSAID is dangerous and medically irrational.',
          de: 'Die verbreitete „Erkältungsspritze“, bei der ein Antibiotikum mit Kortison und einem starken Schmerzmittel gemischt wird, ist medizinisch unbegründet und lebensgefährlich.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'أولاً: نزلات البرد فيروسية ولا يفيدها المضاد. ثانياً: جرعة المضاد الواحدة لا تعالج العدوى بل تسرع نشوء بكتيريا مقاومة. ثالثاً: الكورتيزون يضعف المناعة ويزيد انتشار العدوى.',
          en: 'First, colds are viral. Second, a single antibiotic dose drives superbug resistance. Third, corticosteroids suppress natural immunity, worsening infection spread.',
          de: 'Erstens sind Erkältungen viral bedingt. Zweitens heilt eine einzelne Antibiotikadosis keine Infektion, sondern fördert multiresistente Keime. Drittens unterdrückt Kortison die natürliche Immunabwehr.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'المسكنات القوية في الحقنة قد تسبب قصوراً حاداً في الكلى أو نزيفاً بالمعدة. وزارة الصحة المصرية تحذر منها بشدة لخطورتها على حياة المرضى.',
          en: 'High-dose injectable NSAIDs risk acute kidney failure and gastric bleeding. Public health authorities strictly warn against this practice.',
          de: 'Hochdosierte injizierbare Schmerzmittel können akutes Nierenversagen, Magenblutungen oder einen tödlichen allergischen Schock auslösen. Gesundheitsbehörden warnen eindringlich vor dieser Praxis.',
        },
      },
    ],
    sources: [CDC_SRC],
  },
  {
    id: 'side-effects',
    title: {
      ar: 'الآثار الجانبية الشائعة وكيفية التعامل معها',
      en: 'Common Side Effects & What To Do',
      de: 'Häufige Nebenwirkungen & richtiges Verhalten',
    },
    icon: '🥣',
    durationEst: { ar: 'دقيقتان ونصف', en: '2.5 mins', de: '2,5 Min.' },
    summary: {
      ar: 'كيف تتعامل مع اضطراب المعدة والإسهال الخفيف ودور الزبادي والبروبيوتيك.',
      en: 'Managing mild stomach upset, diarrhea, and the restorative role of yogurt and probiotics.',
      de: 'Umgang mit leichten Magenbeschwerden und Durchfall sowie die unterstützende Rolle von Joghurt und Probiotika.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'معظم المضادات الحيوية قد تسبب آثاراً جانبية خفيفة على الجهاز الهضمي، مثل الغثيان، أو ألم خفيف بالمعدة، أو ليونة البراز.',
          en: 'Most antibiotics can cause mild gastrointestinal effects, such as mild nausea, stomach discomfort, or loose stools.',
          de: 'Die meisten Antibiotika können leichte Magen-Darm-Beschwerden wie leichte Übelkeit, Magendrücken oder weichen Stuhl verursachen.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'يمكن تخفيف هذه الأعراض بتناول الدواء مع وجبة خفيفة (إذا لم يكن من الأدوية التي تشترط معدة فارغة). تناول الزبادي والأغذية المخمرة أو مكملات البروبيوتيك بفارق ساعتين عن جرعة المضاد يعوض البكتيريا النافعة.',
          en: 'Taking medicine with light meals (if permitted) reduces irritation. Consuming yogurt or probiotics spaced 2 hours away replenishes beneficial flora.',
          de: 'Die Einnahme mit einer leichten Mahlzeit (sofern laut Packungsbeilage erlaubt) lindert Magenreizungen. Naturjoghurt oder Probiotika im Abstand von zwei Stunden zur Antibiotikadosis helfen, die gesunde Darmflora wiederherzustellen.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'إذا كان الإسهال شديداً ومائياً جداً أو مصحوباً بدم أو تقلصات حادة، فهذا يستدعي الاتصال بالطبيب فوراً لاحتمال الإصابة بعدوى المطثية العسيرة، ولا تأخذ أدوية توقف الإسهال من تلقاء نفسك.',
          en: 'If diarrhea is watery, persistent, or bloody, contact your doctor promptly; this may indicate C. difficile. Never take OTC anti-diarrheal pills without advice.',
          de: 'Bei starkem, wässrigem oder blutigem Durchfall und heftigen Krämpfen sollten Sie sofort einen Arzt kontaktieren, da eine Clostridioides-difficile-Infektion vorliegen kann. Nehmen Sie keine durchfallhemmenden Mittel ohne ärztlichen Rat ein.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
  {
    id: 'emergency-signs',
    title: {
      ar: 'علامات الطوارئ الخطيرة: متى تطلب الإسعاف فوراً؟',
      en: 'Emergency Warning Signs: When To Seek Immediate Help',
      de: 'Notfall-Warnzeichen: Wann Sie sofort den Notruf wählen müssen',
    },
    icon: '🚨',
    durationEst: { ar: 'دقيقة ونصف', en: '1.5 mins', de: '1,5 Min.' },
    summary: {
      ar: 'أعراض الصدمة التحسسية الحادة التي تتطلب التوجه للطوارئ والاتصال بالإسعاف (123) على الفور.',
      en: 'Acute anaphylactic warning signs requiring immediate emergency medical care and ambulance call (123).',
      de: 'Warnzeichen eines akuten anaphylaktischen Schocks, die sofortige Notfallhilfe und den Rettungsdienst erfordern.',
    },
    emergencyNote: {
      ar: 'في حالات الطوارئ الحادة اتصل بالإسعاف (123 في مصر) أو توجه فوراً لأقرب قسم طوارئ بمستشفى ولا تنتظر!',
      en: 'In acute emergencies, call ambulance services immediately or go to the nearest emergency department!',
      de: 'Rufen Sie in akuten Notfällen sofort den Rettungsdienst (123 in Ägypten / 112 in Europa) oder suchen Sie umgehend die nächste Notaufnahme auf!',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'إذا ظهرت عليك بعد تناول المضاد الحيوي صعوبة مفاجئة في التنفس، أو صفير حاد بالصدر، أو تورم في اللسان أو الحلق أو الشفتين، فهذه علامة على تفاعل تحسسي مهدد للحياة.',
          en: 'If you develop sudden difficulty breathing, wheezing, or swelling of the tongue, throat, or lips after taking an antibiotic, this is a life-threatening allergic emergency.',
          de: 'Wenn nach der Einnahme eines Antibiotikums plötzlich Atemnot, pfeifende Atmung oder eine Schwellung von Zunge, Rachen oder Lippen auftritt, handelt es sich um einen lebensbedrohlichen allergischen Notfall.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'كذلك إذا شعرت بدوار شديد وإغماء، أو ظهر طفح جلدي واسع مع تقرحات وفقاعات في الجلد، توقف فوراً عن تناول أي دواء واطلب رعاية طبية عاجلة.',
          en: 'Likewise, severe dizziness, collapse, or a spreading blistering rash requires immediate cessation of medication and urgent emergency assistance.',
          de: 'Ebenso erfordern starker Schwindel, Kreislaufkollaps oder ein sich ausbreitender, blasenbildender Hautausschlag das sofortige Absetzen des Medikaments und notärztliche Hilfe.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'اتصل بالإسعاف فوراً (123 في مصر) أو اطلب من شخص نقلك لأقرب طوارئ. أبلغ الفريق الطبي فور وصولك باسم المضاد الحيوي الذي تناولته.',
          en: 'Call emergency services (123 in Egypt) or have someone take you to the nearest ER. Tell the medical team the exact antibiotic you ingested.',
          de: 'Rufen Sie sofort den Notruf (123 in Ägypten / 112 in Europa) oder lassen Sie sich in die nächste Notaufnahme bringen. Teilen Sie dem Ärzteteam sofort den genauen Namen des eingenommenen Antibiotikums mit.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
  {
    id: 'storage-disposal',
    title: {
      ar: 'التخزين الصحيح للأدوية والشراب المعلق',
      en: 'Safe Medicine Storage & Suspension Disposal',
      de: 'Richtige Lagerung von Medikamenten & Suspensionen',
    },
    icon: '🧊',
    durationEst: { ar: 'دقيقتان', en: '2 mins', de: '2 Min.' },
    summary: {
      ar: 'كيف تحفظ المضاد الحيوي الشراب للأطفال في الثلاجة وصلاحيته المحدودة، والتخلص الآمن من البقايا.',
      en: 'Storing pediatric antibiotic oral suspensions in the refrigerator, strict shelf-life, and safe disposal.',
      de: 'Lagerung von zubereiteten Kinder-Antibiotikasäften im Kühlschrank, begrenzte Haltbarkeit und sichere Entsorgung.',
    },
    paragraphs: [
      {
        id: 'p1',
        text: {
          ar: 'المضاد الحيوي الشراب المعلق للأطفال (الذي يتم حله بالماء في الصيدلية) يجب حفظه دائماً في باب الثلاجة في درجة حرارة بين 2 و 8 درجات مئوية لحمايته من التلف.',
          en: 'Reconstituted pediatric antibiotic suspensions must always be stored in the refrigerator (2-8°C) to prevent degradation.',
          de: 'Mit Wasser zubereitete Antibiotika-Suspensionen für Kinder müssen in der Regel im Kühlschrank bei 2 bis 8 Grad Celsius gelagert werden, um den Wirkstoff vor dem Verfall zu schützen.',
        },
      },
      {
        id: 'p2',
        text: {
          ar: 'مدة صلاحية الشراب المعلق بعد حله تتراوح بين 7 إلى 14 يوماً فقط حسب نوع الدواء المكتوب في النشرة. بعد انتهاء هذه المدة، يصبح الدواء غير فعال وقد يسبب ضرراً، ويجب التخلص منه فوراً.',
          en: 'Shelf-life after reconstitution is strictly 7 to 14 days depending on product label. Afterwards, the medicine loses efficacy and must be discarded immediately.',
          de: 'Die Haltbarkeit einer zubereiteten Suspension beträgt je nach Packungsbeilage strikt nur 7 bis 14 Tage. Nach Ablauf dieser Frist verliert das Medikament seine Wirksamkeit und muss umgehend sicher entsorgt werden.',
        },
      },
      {
        id: 'p3',
        text: {
          ar: 'احفظ الأقراص والكبسولات في مكان جاف وبارد بعيداً عن حرارة المطبخ ورطوبة الحمام، وبعيداً تماماً عن متناول أيدي الأطفال.',
          en: 'Store tablets and capsules in a cool, dry place away from bathroom moisture and kitchen heat, safely out of reach of children.',
          de: 'Bewahren Sie Tabletten und Kapseln an einem kühlen, trockenen Ort fern von Badezimmerfeuchtigkeit und Küchenwärme sowie stets außerhalb der Reichweite von Kindern auf.',
        },
      },
    ],
    sources: [CDC_SRC, MP_SRC],
  },
];
