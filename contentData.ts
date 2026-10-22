import { Bi } from './types';

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
  title: 'CDC – Antimicrobial resistance: prevention',
  url: 'https://www.cdc.gov/antimicrobial-resistance/prevention/index.html',
  publisher: 'CDC',
  date: '',
  accessed: '',
};

const o = (ar: string, en: string, fr?: string, es?: string): Bi => ({ ar, en, fr, es });

// ---------------- Myth or fact ----------------
export interface Myth { statement: Bi; isFact: boolean; why: Bi; source: Src }

export const MYTHS: Myth[] = [
  {
    statement: o(
      'المضادات الحيوية تعالج نزلات البرد والإنفلونزا.',
      'Antibiotics can treat colds and flu.',
      'Les antibiotiques peuvent soigner le rhume et la grippe.',
      'Los antibióticos pueden curar los resfriados y la gripe.'
    ),
    isFact: false,
    why: o(
      'نزلات البرد والإنفلونزا تسببها فيروسات، والمضادات الحيوية لا تعالج العدوى الفيروسية.',
      'Colds and flu are caused by viruses, and antibiotics do not treat infections caused by viruses.',
      'Le rhume et la grippe sont causés par des virus, et les antibiotiques ne traitent pas les infections virales.',
      'Los resfriados y la gripe son causados por virus, y los antibióticos no tratan infecciones virales.'
    ),
    source: CDC_FACTS,
  },
  {
    statement: o(
      'مقاومة المضادات تعني أن جسم الإنسان يصبح مقاومًا للدواء.',
      'Antibiotic resistance means the human body becomes resistant to the medicine.',
      'L’antibiorésistance signifie que le corps humain devient résistant au médicament.',
      'La resistencia a los antibióticos significa que el cuerpo humano se vuelve resistente al medicamento.'
    ),
    isFact: false,
    why: o(
      'المقاومة تعني أن الجراثيم هي التي تكتسب القدرة على هزيمة الدواء، وليس جسمك.',
      'Resistance means the germs develop the ability to defeat the drug. It does not mean your body is resistant.',
      'La résistance signifie que ce sont les bactéries qui développent la capacité de vaincre le médicament, et non votre corps.',
      'La resistencia significa que las bacterias desarrollan la capacidad de vencer al fármaco, no tu cuerpo.'
    ),
    source: CDC_FACTS,
  },
  {
    statement: o(
      'كلما استُخدمت المضادات الحيوية فقد تسبب آثارًا جانبية وتسهم في المقاومة.',
      'Any time antibiotics are used, they can cause side effects and contribute to resistance.',
      'Chaque fois que des antibiotiques sont utilisés, ils peuvent causer des effets secondaires et contribuer à la résistance.',
      'Cada vez que se usan antibióticos, pueden causar efectos secundarios y contribuir a la resistencia.'
    ),
    isFact: true,
    why: o(
      'هذا ما تذكره CDC. وعند الحاجة الفعلية للمضاد فإن فوائده تفوق عادةً مخاطر المقاومة، لذلك يُستخدم عند الحاجة فقط.',
      'This is what CDC states. When an antibiotic is really needed, the benefits usually outweigh the risk of resistance, which is why it should be used only when needed.',
      'Lorsqu’un antibiotique est réellement nécessaire, ses bénéfices l’emportent sur les risques ; il ne doit donc être utilisé qu’en cas de besoin médical avéré.',
      'Cuando realmente se necesita un antibiótico, los beneficios superan el riesgo; por eso debe usarse solo cuando sea necesario.'
    ),
    source: CDC_FACTS,
  },
  {
    statement: o(
      'لا مشكلة في الاحتفاظ ببقايا المضاد الحيوي لاستخدامها عند المرض مرة أخرى.',
      'It is fine to save leftover antibiotics for the next time you are sick.',
      'On peut conserver les restes d’antibiotiques pour la prochaine fois qu’on tombe malade.',
      'Está bien guardar los antibióticos sobrantes para la próxima vez que te enfermes.'
    ),
    isFact: false,
    why: o(
      'تنصح CDC بعدم الاحتفاظ بالمضادات الحيوية لوقت لاحق.',
      'CDC advises not to save antibiotics for later.',
      'Les autorités sanitaires déconseillent formellement de conserver des restes d’antibiotiques pour un usage ultérieur.',
      'Las autoridades sanitarias aconsejan no guardar nunca antibióticos sobrantes para usarlos más tarde.'
    ),
    source: CDC_FACTS,
  },
  {
    statement: o(
      'إذا كنت متعبًا فعليّ أن أضغط على الطبيب ليصف لي مضادًا حيويًا.',
      'If I feel unwell I should pressure my doctor to prescribe an antibiotic.',
      'Si je me sens malade, je dois insister auprès de mon médecin pour obtenir un antibiotique.',
      'Si me siento mal, debo presionar a mi médico para que me recete un antibiótico.'
    ),
    isFact: false,
    why: o(
      'تنصح CDC بعدم الضغط على الطبيب لوصف مضاد حيوي، وبالتحدث معه عن أفضل علاج لحالتك.',
      'CDC says never to pressure your doctor for an antibiotic; talk to them about the best treatment for your illness.',
      'N’insistez jamais pour obtenir un antibiotique ; discutez avec votre médecin ou pharmacien du meilleur traitement pour soulager vos symptômes.',
      'Nunca presiones a tu médico para obtener un antibiótico; pregúntale cuál es el mejor tratamiento para tu afección.'
    ),
    source: CDC_FACTS,
  },
  {
    statement: o(
      'تناول جرعة خاطئة أو لمدة غير مناسبة يُعدّ سوء استخدام للمضاد الحيوي.',
      'Taking the wrong dose, or taking an antibiotic for the wrong length of time, is misuse.',
      'Prendre une mauvaise dose ou une durée inadaptée constitue un mésusage de l’antibiotique.',
      'Tomar una dosis incorrecta o durante un tiempo inadecuado es un mal uso del antibiótico.'
    ),
    isFact: true,
    why: o(
      'تعرّف CDC سوء الاستخدام بأنه تناول المضاد الخطأ أو الجرعة الخطأ أو لمدة خطأ.',
      'CDC defines misuse as taking the wrong antibiotic, the wrong dose, or an antibiotic for the wrong length of time.',
      'Le mésusage comprend la prise du mauvais antibiotique, d’une dose inadaptée ou d’une durée incorrecte.',
      'El mal uso incluye tomar el antibiótico equivocado, la dosis incorrecta o durante una duración inadecuada.'
    ),
    source: CDC_FACTS,
  },
  {
    statement: o(
      'المقاومة لمضاد حيوي واحد فقط لا تُعتبر مشكلة خطيرة.',
      'Resistance to just one antibiotic is not a serious problem.',
      'La résistance à un seul antibiotique n’est pas un problème grave.',
      'La resistencia a un solo antibiótico no es un problema grave.'
    ),
    isFact: false,
    why: o(
      'تذكر CDC أن البكتيريا لا يلزم أن تكون مقاومة لكل المضادات لتكون خطيرة؛ فالمقاومة لمضاد واحد قد تعني مشاكل جسيمة.',
      'CDC notes that germs do not have to resist every antibiotic to be dangerous; resistance to even one can mean serious problems.',
      'Les bactéries n’ont pas besoin de résister à tous les antibiotiques pour être dangereuses ; la résistance à un seul traitement de première ligne peut entraîner de graves complications.',
      'Las bacterias no necesitan resistir a todos los antibióticos para ser peligrosas; la resistencia a uno solo puede causar problemas graves.'
    ),
    source: CDC_FACTS,
  },
  {
    statement: o(
      'قد تكون العدوى المقاومة صعبة العلاج، وأحيانًا مستحيلة العلاج.',
      'Resistant infections can be difficult, and sometimes impossible, to treat.',
      'Les infections résistantes peuvent être difficiles, voire parfois impossibles à traiter.',
      'Las infecciones resistentes pueden ser difíciles y, a veces, imposibles de tratar.'
    ),
    isFact: true,
    why: o(
      'هذا ما تذكره CDC، وقد تتطلب إقامة أطول في المستشفى وعلاجات بديلة مكلفة وسامة.',
      'This is what CDC states; such infections can need longer hospital stays and costly, toxic alternative treatments.',
      'Ces infections nécessitent souvent des hospitalisations prolongées et des traitements de réserve plus coûteux et potentiellement plus toxiques.',
      'Estas infecciones pueden requerir estancias hospitalarias más largas y tratamientos alternativos costosos y con más efectos adversos.'
    ),
    source: CDC_FACTS,
  },
  {
    statement: o(
      'إذا أوقفت أموكسيسيلين مبكرًا أو فوّتّ جرعات فقد تصبح البكتيريا مقاومة.',
      'If you stop amoxicillin too soon or skip doses, bacteria may become resistant.',
      'Si vous arrêtez l’amoxicilline trop tôt ou oubliez des doses, les bactéries peuvent devenir résistantes.',
      'Si suspendes la amoxicilina demasiado pronto u omites dosis, las bacterias pueden volverse resistentes.'
    ),
    isFact: true,
    why: o(
      'تذكر MedlinePlus أن ذلك قد يترك العدوى غير معالجة بالكامل وقد تصبح البكتيريا مقاومة، ولذلك يُكمل المريض الوصفة كما وجّهه الطبيب.',
      'MedlinePlus states this can leave the infection not completely treated and let bacteria become resistant, so follow the prescriber’s directions for the whole course.',
      'Cela peut laisser l’infection partiellement traitée et favoriser l’émergence de bactéries résistantes ; suivez toujours l’ordonnance jusqu’au bout.',
      'Esto puede dejar la infección sin tratar por completo y permitir que las bacterias se vuelvan resistentes; sigue siempre las indicaciones médicas.'
    ),
    source: MP_AMOX,
  },
  {
    statement: o(
      'مقاومة المضادات الحيوية لا تهم إلا من يدخلون المستشفيات.',
      'Antibiotic resistance only matters to people who go to hospital.',
      'L’antibiorésistance ne concerne que les personnes hospitalisées.',
      'La resistencia a los antibióticos solo afecta a las personas hospitalizadas.'
    ),
    isFact: false,
    why: o(
      'تذكر CDC أن المقاومة قد تصيب أي شخص في أي مرحلة من العمر، وإن كان من يتلقون الرعاية الصحية أو ضعيفو المناعة أكثر عرضة للعدوى.',
      'CDC says resistance can affect any person at any stage of life, although people receiving health care or with weakened immune systems are often at higher risk of infection.',
      'L’antibiorésistance peut toucher n’importe qui, à tout âge, même en dehors de l’hôpital.',
      'La resistencia puede afectar a cualquier persona en cualquier etapa de la vida, incluso fuera del hospital.'
    ),
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
    title: o(
      'ما هي المضادات الحيوية؟',
      'What are antibiotics?',
      'Que sont les antibiotiques ?',
      '¿Qué son los antibióticos?'
    ),
    body: o(
      'المضادات الحيوية أدوية تقتل أنواعًا معينة من الجراثيم تُسمى البكتيريا وتوقف نموها. وهي أدوات مهمة للوقاية من العدوى التي تسببها بكتيريا محددة وعلاجها.\n\nمعظم البكتيريا غير ضارة وبعضها مفيد للإنسان، لكن بعضها قد يسبب التهابات مثل التهاب الحلق العقدي والتهابات المسالك البولية.',
      'Antibiotics are drugs that kill certain kinds of germs called bacteria and stop their growth. They are critical tools for preventing and treating infections caused by specific bacteria.\n\nMost bacteria are harmless and some are helpful to humans, but bacteria can cause infections such as strep throat and urinary tract infections.',
      'Les antibiotiques sont des médicaments qui détruisent certains types de microbes appelés bactéries ou bloquent leur multiplication. Ce sont des outils essentiels pour prévenir et traiter les infections bactériennes.\n\nLa plupart des bactéries sont inoffensives et certaines sont utiles à l’organisme (flore intestinale), mais d’autres causent des infections comme l’angine bactérienne ou les infections urinaires.',
      'Los antibióticos son medicamentos que eliminan ciertos tipos de gérmenes llamados bacterias o detienen su crecimiento. Son herramientas fundamentales para prevenir y tratar infecciones bacterianas específicas.\n\nLa mayoría de las bacterias son inofensivas y algunas son beneficiosas para el ser humano, pero otras pueden causar infecciones como faringitis estreptocócica o infecciones urinarias.'
    ),
    check: {
      q: o(
        'المضادات الحيوية تعمل ضد:',
        'Antibiotics act against:',
        'Les antibiotiques agissent contre :',
        'Los antibióticos actúan contra:'
      ),
      options: [
        o('البكتيريا', 'Bacteria', 'Les bactéries', 'Las bacterias'),
        o('الفيروسات', 'Viruses', 'Les virus', 'Los virus'),
        o('كل أنواع الجراثيم', 'All kinds of germs', 'Tous les types de microbes', 'Todo tipo de gérmenes'),
      ],
      answer: 0,
      why: o(
        'هي أدوية ضد أنواع معينة من البكتيريا.',
        'They are drugs against certain kinds of bacteria.',
        'Ce sont des médicaments ciblant uniquement les bactéries.',
        'Son medicamentos que actúan específicamente contra las bacterias.'
      ),
    },
    sources: [CDC_FACTS],
  },
  {
    id: 'bacteria-virus',
    title: o(
      'البكتيريا مقابل الفيروسات',
      'Bacteria versus viruses',
      'Bactéries contre virus',
      'Bacterias frente a virus'
    ),
    body: o(
      'الفيروسات جراثيم تختلف عن البكتيريا، وهي تسبب عدوى مثل نزلات البرد والإنفلونزا. والمضادات الحيوية لا تعالج العدوى التي تسببها الفيروسات.\n\nلذلك ليست المضادات الحيوية هي الحل في كل مرة تمرض فيها.',
      'Viruses are germs different from bacteria. They cause infections such as colds and flu. Antibiotics do not treat infections caused by viruses.\n\nThat is why antibiotics are not the answer every time you are sick.',
      'Les virus sont des agents infectieux très différents des bactéries. Ils provoquent des maladies comme le rhume, la grippe et la plupart des toux aiguës. Les antibiotiques sont totalement inefficaces contre les virus.\n\nC’est pourquoi les antibiotiques ne sont pas la solution chaque fois que vous êtes malade.',
      'Los virus son gérmenes diferentes de las bacterias. Causan infecciones como el resfriado común y la gripe. Los antibióticos no curan las infecciones causadas por virus.\n\nPor eso los antibióticos no son la respuesta cada vez que estás enfermo.'
    ),
    check: {
      q: o(
        'أي مما يلي تسببه فيروسات ولا تعالجه المضادات الحيوية؟',
        'Which of these is caused by viruses and is not treated by antibiotics?',
        'Lequel de ces troubles est causé par un virus et ne se traite pas par antibiotique ?',
        '¿Cuál de estas afecciones es causada por virus y no se trata con antibióticos?'
      ),
      options: [
        o('نزلة البرد أو الإنفلونزا', 'A cold or flu', 'Un rhume ou une grippe', 'Un resfriado o gripe'),
        o('التهاب الحلق العقدي', 'Strep throat', 'Une angine bactérienne à streptocoque', 'Faringitis estreptocócica'),
        o('التهاب المسالك البولية', 'A urinary tract infection', 'Une infection urinaire bactérienne', 'Una infección urinaria'),
      ],
      answer: 0,
      why: o(
        'التهاب الحلق العقدي والتهاب المسالك البولية مثالان على عدوى قد تسببها البكتيريا.',
        'Strep throat and urinary tract infections are examples of infections that bacteria can cause.',
        'Le rhume et la grippe sont d’origine virale.',
        'El resfriado y la gripe son infecciones virales.'
      ),
    },
    sources: [CDC_FACTS],
  },
  {
    id: 'resistance',
    title: o(
      'ما هي مقاومة المضادات؟',
      'What is antimicrobial resistance?',
      'Qu’est-ce que la résistance aux antimicrobiens ?',
      '¿Qué es la resistencia a los antimicrobianos?'
    ),
    body: o(
      'تحدث المقاومة عندما تكتسب جراثيم مثل البكتيريا والفطريات القدرة على هزيمة الأدوية المصممة لقتلها، فتواصل الجراثيم النمو.\n\nلا تعني المقاومة أن جسمك أصبح مقاومًا للمضاد؛ فالجراثيم هي التي تتغير.\n\nقد تكون العدوى المقاومة صعبة العلاج وأحيانًا مستحيلة. والمقاومة لمضاد واحد فقط قد تعني مشاكل جسيمة، وقد تصيب أي شخص في أي مرحلة من العمر.',
      'Resistance happens when germs such as bacteria and fungi develop the ability to defeat the drugs designed to kill them, so the germs continue to grow.\n\nIt does not mean your body is resistant to the antibiotic: the germs are the ones that change.\n\nResistant infections can be difficult, and sometimes impossible, to treat. Resistance to even one antibiotic can mean serious problems, and it can affect any person at any stage of life.',
      'La résistance survient lorsque des micro-organismes comme les bactéries développent la capacité de résister aux médicaments conçus pour les détruire, et continuent à se multiplier.\n\nCela ne signifie pas que votre corps devient résistant : ce sont les bactéries elles-mêmes qui mutent et s’adaptent.\n\nLes infections résistantes sont difficiles à guérir et peuvent toucher toute personne, à tout âge.',
      'La resistencia ocurre cuando gérmenes como las bacterias desarrollan la capacidad de vencer a los medicamentos diseñados para eliminarlos, por lo que continúan multiplicándose.\n\nNo significa que tu cuerpo sea resistente al antibiótico: son las bacterias las que cambian.\n\nLas infecciones resistentes pueden ser difíciles de tratar y afectar a cualquier persona en cualquier etapa de la vida.'
    ),
    check: {
      q: o(
        'من الذي يصبح مقاومًا؟',
        'What becomes resistant?',
        'Qui devient résistant ?',
        '¿Qué se vuelve resistente?'
      ),
      options: [
        o('الجراثيم', 'The germs', 'Les bactéries / microbes', 'Las bacterias / gérmenes'),
        o('جسم المريض', 'The patient’s body', 'Le corps du patient', 'El cuerpo del paciente'),
        o('الطبيب', 'The doctor', 'Le médecin', 'El médico'),
      ],
      answer: 0,
      why: o(
        'الجراثيم هي التي تكتسب القدرة على هزيمة الدواء.',
        'The germs develop the ability to defeat the drug.',
        'Ce sont les bactéries qui développent des mécanismes de défense contre le médicament.',
        'Son las bacterias las que desarrollan la capacidad de vencer al fármaco.'
      ),
    },
    sources: [CDC_FACTS],
  },
  {
    id: 'misuse',
    title: o(
      'كيف يسهم سوء الاستخدام في المقاومة؟',
      'How does misuse contribute?',
      'Comment le mésusage favorise-t-il la résistance ?',
      '¿Cómo contribuye el mal uso a la resistencia?'
    ),
    body: o(
      'في كل مرة تُستخدم فيها المضادات الحيوية قد تسهم في المقاومة، ولذلك يجب استخدامها عند الحاجة فقط.\n\nالاستخدام غير الضروري هو تناول مضاد لا تحتاجه، مثل نزلات البرد والإنفلونزا، أو لعدوى لا تحتاج دائمًا إلى مضاد مثل كثير من التهابات الجيوب الأنفية وبعض التهابات الأذن.\n\nأما سوء الاستخدام فهو تناول المضاد الخطأ أو الجرعة الخطأ أو لمدة خطأ.',
      'Any time antibiotics are used they can contribute to resistance, so they should be used only when needed.\n\nUnnecessary use means taking antibiotics you do not need, such as for colds and flu, or for infections that do not always need them, such as many sinus infections and some ear infections.\n\nMisuse means taking the wrong antibiotic, the wrong dose, or an antibiotic for the wrong length of time.',
      'Chaque prise d’antibiotique exerce une pression de sélection sur les bactéries. Ils ne doivent donc être utilisés que lorsqu’ils sont indispensables.\n\nL’usage inutile consiste à prendre un antibiotique pour une infection virale (rhume, grippe). Le mésusage consiste à prendre le mauvais antibiotique, une dose inadaptée ou une durée incorrecte.',
      'Cada vez que se usan antibióticos se puede favorecer la resistencia, por lo que solo deben emplearse cuando sean necesarios.\n\nEl uso innecesario es tomar antibióticos para resfriados o gripe. El mal uso consiste en tomar el antibiótico equivocado, la dosis incorrecta o durante un tiempo inadecuado.'
    ),
    check: {
      q: o(
        'أي مما يلي يُعدّ سوء استخدام؟',
        'Which of these is misuse?',
        'Lequel de ces cas constitue un mésusage ?',
        '¿Cuál de estos casos es un mal uso?'
      ),
      options: [
        o('تناول الجرعة الخطأ أو لمدة غير مناسبة', 'Taking the wrong dose or for the wrong length of time', 'Prendre une dose incorrecte ou une durée inadaptée', 'Tomar una dosis incorrecta o durante un tiempo inadecuado'),
        o('تناول الدواء كما وصفه الطبيب', 'Taking it exactly as the prescriber directed', 'Prendre le médicament exactement comme prescrit', 'Tomarlo exactamente como lo indicó el médico'),
        o('سؤال الصيدلي عن الدواء', 'Asking the pharmacist about the medicine', 'Demander conseil au pharmacien', 'Preguntar al farmacéutico sobre el medicamento'),
      ],
      answer: 0,
      why: o(
        'الجرعة أو المدة الخطأ من صور سوء الاستخدام.',
        'A wrong dose or wrong duration is a form of misuse.',
        'Une mauvaise posologie ou une durée non respectée favorise la survie des bactéries résistantes.',
        'Una dosis o duración incorrecta es una forma de mal uso que favorece la resistencia.'
      ),
    },
    sources: [CDC_FACTS],
  },
  {
    id: 'safe-use',
    title: o(
      'الاستخدام الآمن',
      'Using antibiotics safely',
      'Utiliser les antibiotiques en toute sécurité',
      'Uso seguro de los antibióticos'
    ),
    body: o(
      'تحدث مع طبيبك عن أفضل علاج لحالتك، ولا تضغط على الطبيب لوصف مضاد حيوي. لا تحتفظ بالمضادات الحيوية لوقت لاحق، ولا تسمح لأحد بتناول دوائك.\n\nإذا وُصف لك مضاد فتناوله تمامًا كما هو مطلوب. وبالنسبة للأموكسيسيلين تذكر MedlinePlus أن تُكمل الوصفة حتى لو شعرت بتحسن، لأن التوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالجة جزئيًا وقد تصبح البكتيريا مقاومة.\n\nإذا كانت لديك أسئلة عن مضادك الحيوي فاسأل طبيبك أو الصيدلي.',
      'Talk to your doctor about the best treatment for your illness, and never pressure your doctor to prescribe an antibiotic. Do not save antibiotics for later, and do not let anyone else take your medicine.\n\nIf an antibiotic is prescribed, take it exactly as directed. For amoxicillin, MedlinePlus says to finish the prescription even if you feel better, because stopping too soon or skipping doses may leave the infection only partly treated and let bacteria become resistant.\n\nIf you have questions about your antibiotic, ask your doctor or pharmacist.',
      'Discutez avec votre médecin du traitement adapté sans insister pour obtenir un antibiotique. Ne conservez pas les restes d’antibiotiques et ne partagez jamais votre traitement.\n\nSi un antibiotique vous est prescrit, respectez la dose, les horaires et la durée complète, même si vous vous sentez mieux après quelques jours.',
      'Hable con su médico sobre el mejor tratamiento y nunca lo presione para que le recete un antibiótico. No guarde sobrantes ni comparta su medicación.\n\nSi le recetan un antibiótico, tómelo exactamente según las indicaciones y complete todo el tratamiento aunque se sienta mejor.'
    ),
    check: {
      q: o(
        'شعرت بتحسن بعد يومين من وصفة مضاد حيوي. ما الأنسب؟',
        'You feel better after two days of an antibiotic prescription. What is best?',
        'Vous vous sentez mieux après deux jours de traitement antibiotique. Que faire ?',
        'Te sientes mejor después de dos días de tomar un antibiótico recetado. ¿Qué es lo mejor?'
      ),
      options: [
        o('اتباع تعليمات من وصف الدواء والسؤال إذا لم أكن متأكدًا', 'Follow the prescriber’s directions and ask if unsure', 'Suivre les instructions du prescripteur jusqu’au bout', 'Seguir las indicaciones del médico y preguntar si hay dudas'),
        o('التوقف فورًا', 'Stop immediately', 'Arrêter immédiatement le traitement', 'Suspender el tratamiento de inmediato'),
        o('الاحتفاظ بالباقي لوقت لاحق', 'Save the rest for later', 'Garder le reste pour une prochaine fois', 'Guardar el resto para más adelante'),
      ],
      answer: 0,
      why: o(
        'لا تغيّر مدة العلاج من تلقاء نفسك، ولا تحتفظ بالدواء لوقت لاحق.',
        'Do not change the treatment length on your own, and do not save medicine for later.',
        'Ne modifiez jamais la durée du traitement sans avis médical.',
        'No cambies la duración del tratamiento por tu cuenta ni guardes sobrantes.'
      ),
    },
    sources: [CDC_FACTS, MP_AMOX],
  },
  {
    id: 'roles',
    title: o(
      'دور كل شخص',
      'Everyone has a role',
      'Chacun a un rôle à jouer',
      'Todos tenemos un papel'
    ),
    body: o(
      'تشير CDC إلى أن لكل شخص دورًا في تحسين استخدام المضادات الحيوية. وتناول المضاد عند الحاجة فقط يحميك ويحمي أسرتك ويساعد في مواجهة المقاومة.\n\nتؤثر المقاومة أيضًا في الطب البيطري والزراعة، ومن يتلقون الرعاية الصحية أو ضعيفو المناعة أكثر عرضة للعدوى، ومنها العدوى المقاومة.',
      'CDC notes that everyone has a role to play in improving antibiotic use. Taking antibiotics only when needed protects you and your family and helps combat resistance.\n\nResistance also affects veterinary medicine and agriculture, and people receiving health care or with weakened immune systems are often at higher risk of infection, including resistant infections.',
      'Chacun a un rôle à jouer pour préserver l’efficacité des antibiotiques. Les utiliser uniquement en cas de nécessité protège votre santé, votre famille et la communauté.\n\nLa résistance concerne aussi la santé animale et l’environnement (approche Une Seule Santé / One Health).',
      'Todos tenemos un papel importante para mejorar el uso de los antibióticos. Usarlos solo cuando es necesario te protege a ti, a tu familia y a la comunidad.\n\nLa resistencia también involucra la salud animal y el medio ambiente (enfoque Una Sola Salud / One Health).'
    ),
    check: {
      q: o(
        'من له دور في تحسين استخدام المضادات الحيوية؟',
        'Who has a role in improving antibiotic use?',
        'Qui a un rôle à jouer dans le bon usage des antibiotiques ?',
        '¿Quién tiene un papel en mejorar el uso de los antibióticos?'
      ),
      options: [
        o('الجميع', 'Everyone', 'Tout le monde', 'Todos'),
        o('الأطباء فقط', 'Only doctors', 'Les médecins uniquement', 'Solo los médicos'),
        o('الصيادلة فقط', 'Only pharmacists', 'Les pharmaciens uniquement', 'Solo los farmacéuticos'),
      ],
      answer: 0,
      why: o(
        'الجميع: المرضى والأسر ومقدمو الرعاية.',
        'Everyone: patients, families, and care providers.',
        'Tout le monde : patients, familles et professionnels de santé.',
        'Todos: pacientes, familias y profesionales de la salud.'
      ),
    },
    sources: [CDC_FACTS, CDC_PREVENTION_FURTHER],
  },
];
