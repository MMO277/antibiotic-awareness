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

  {
    id: 'how-resistance-spreads',
    title: { ar: 'كيف تنتشر البكتيريا المقاومة؟', en: 'How resistant bacteria spread' },
    summary: {
      ar: 'في المستشفيات والمجتمع: طرق الانتقال وكيف نحدّ منها.',
      en: 'In hospitals and in the community: how they pass between people and how to limit it.',
    },
    body: {
      ar: 'تنتشر البكتيريا المقاومة بالطرق نفسها التي تنتشر بها البكتيريا الأخرى: الاتصال المباشر بشخص مصاب، أو عبر الأيدي والأسطح والأدوات الملوثة، وأحيانًا عبر الطعام أو الماء الملوث.\n\nيمكن أن تنتشر في المجتمع وفي أماكن الرعاية الصحية مثل المستشفيات ودور الرعاية، حيث يوجد قرب بين أشخاص كثيرين لديهم مناعة ضعيفة. لذلك تُعدّ نظافة اليدين ونظافة الأدوات واتباع قواعد مكافحة العدوى أمرًا مهمًا جدًا هناك.\n\nيمكنك المساعدة بغسل اليدين جيدًا، وتغطية الجروح بضماد نظيف، والبقاء في المنزل عند الإصابة بعدوى قابلة للانتقال، واتباع نصائح التطعيم.',
      en: 'Resistant bacteria spread in the same ways as other bacteria: through direct contact with an infected person, through contaminated hands, surfaces or equipment, and sometimes through contaminated food or water.\n\nThey can spread in the community and in healthcare settings such as hospitals and care homes, where many people with weakened defences are close together. Clean hands, clean equipment, and following infection-control rules are very important there.\n\nYou can help by washing your hands properly, covering wounds with a clean dressing, staying at home when you have an infection that can pass to others, and following vaccination advice.',
    },
  },
  {
    id: 'prevent-infections',
    title: { ar: 'الوقاية من العدوى: اليدان واللقاحات والنظافة', en: 'Preventing infections: hands, vaccines and hygiene' },
    summary: {
      ar: 'أفضل مضاد حيوي هو الذي لا تحتاج إليه أصلًا.',
      en: 'The best antibiotic is the one you never need.',
    },
    body: {
      ar: 'الوقاية من العدوى تقلل الحاجة إلى المضادات الحيوية وتبطئ ظهور المقاومة.\n\nاغسل يديك بالماء والصابون: بعد استخدام المرحاض، وقبل تحضير الطعام أو تناوله، وبعد السعال أو العطاس، وبعد العناية بشخص مريض. وإذا لم يتوفر الماء والصابون فيمكن استخدام معقّم اليدين الكحولي إن لم تكن اليدان متسختين بشكل واضح.\n\nالتزم بالتطعيمات الموصى بها في برنامج الصحة الوطني في بلدك. وحضّر الطعام وخزّنه بطريقة آمنة، واشرب ماءً آمنًا، وحافظ على الجروح نظيفة ومغطاة.',
      en: 'Preventing infection reduces the need for antibiotics and slows resistance.\n\nWash your hands with soap and water: after using the toilet, before preparing or eating food, after coughing or sneezing, and after caring for someone who is ill. When soap and water are not available, an alcohol-based hand rub can be used if your hands are not visibly dirty.\n\nKeep up with the vaccinations recommended by your national health programme. Prepare and store food safely, drink safe water, and keep cuts clean and covered.',
    },
  },
  {
    id: 'one-health',
    title: { ar: 'نهج الصحة الواحدة: الإنسان والحيوان والبيئة', en: 'One Health: people, animals and the environment' },
    summary: {
      ar: 'لماذا تُعدّ المقاومة مشكلة مشتركة تتجاوز المستشفيات.',
      en: 'Why resistance is a shared problem that goes beyond hospitals.',
    },
    body: {
      ar: 'تُستخدم المضادات الحيوية للإنسان وللحيوان وأحيانًا في الزراعة. ويمكن للبكتيريا المقاومة أن تنتقل بين البشر والحيوانات والغذاء والبيئة، ولذلك فالمقاومة مشكلة مشتركة.\n\nنهج «الصحة الواحدة» يربط بين صحة الإنسان وصحة الحيوان والبيئة، ويشجّع على الاستخدام الحذر للمضادات الحيوية في كل هذه المجالات وليس في المستشفيات فقط.\n\nما يمكن للأفراد فعله: استخدام المضادات الحيوية كما وُصفت فقط، وتداول الطعام وطهيه بأمان، وغسل اليدين بعد ملامسة الحيوانات، ودعم الجهود الداعية إلى الاستخدام المسؤول للمضادات الحيوية لدى الحيوانات.',
      en: 'Antibiotics are used for people, for animals, and sometimes in agriculture. Resistant bacteria can move between people, animals, food and the environment, so resistance is a shared problem.\n\nOne Health is an approach that links human health, animal health and the environment. It encourages careful antibiotic use in all of these areas, not only in hospitals.\n\nWhat individuals can do: use antibiotics only as prescribed, handle and cook food safely, wash hands after contact with animals, and support efforts for the responsible use of antibiotics in animals.',
    },
  },
  {
    id: 'questions-to-ask',
    title: { ar: 'أسئلة تسألها لطبيبك أو صيدلانيك', en: 'Questions to ask your doctor or pharmacist' },
    summary: {
      ar: 'من حقك أن تسأل. إليك أسئلة تساعدك على فهم علاجك.',
      en: 'It is your right to ask. These questions help you understand your treatment.',
    },
    body: {
      ar: 'من حقك أن تسأل. من الأسئلة المفيدة: هل مرضي ناتج عن بكتيريا أم فيروس؟ هل أحتاج فعلًا إلى مضاد حيوي؟ ما اسم الدواء ولماذا يُوصف؟ كيف ومتى أتناوله، مع الطعام أو بدونه، ولكم من الوقت؟ ماذا أفعل إذا نسيت جرعة؟ ما الأعراض الجانبية التي أراقبها ومتى أطلب المساعدة؟ هل يمكن تناوله مع أدويتي الأخرى والمكملات؟\n\nأحضر معك في كل زيارة قائمة بأدويتك وبأي حساسية لديك.\n\nإذا لم يُوصف لك مضاد حيوي فاسأل عمّا يمكنك فعله لتشعر بتحسّن، ومتى تعود إذا ساءت الأعراض.',
      en: 'It is your right to ask. Useful questions include: Is my illness caused by bacteria or a virus? Do I really need an antibiotic? What is the medicine called and what is it for? How and when should I take it, with or without food, and for how long? What should I do if I miss a dose? What side effects should I watch for, and when should I get help? Can I take it with my other medicines or supplements?\n\nBring a list of your medicines and allergies to every visit.\n\nIf you are not prescribed an antibiotic, ask what you can do to feel better and when to come back if symptoms get worse.',
    },
  },
  {
    id: 'storage-and-disposal',
    title: { ar: 'تخزين الأدوية والتخلص من بقاياها', en: 'Storing and disposing of leftover medicines' },
    summary: {
      ar: 'لماذا لا نحتفظ ببقايا المضاد الحيوي، وكيف نتخلص منها بأمان.',
      en: 'Why we do not keep leftover antibiotics, and how to dispose of them safely.',
    },
    body: {
      ar: 'يُوصف المضاد الحيوي لمرض واحد ولشخص واحد. قد يبدو الاحتفاظ بالبقايا للمرة القادمة مغريًا لكنه غير آمن: فقد لا يناسب الدواء المرض الجديد، وقد تنتهي صلاحية الدواء القديم.\n\nخزّن الأدوية كما هو مكتوب على العبوة أو النشرة، وغالبًا في مكان بارد وجاف وبعيدًا عن متناول الأطفال ونظرهم. وتحقق من تاريخ انتهاء الصلاحية.\n\nلا ترمِ الأدوية في المغسلة أو المرحاض إلا إذا طُلب منك ذلك. اسأل الصيدلاني عن خدمة استرجاع الأدوية أو عن طريقة التخلص الآمن في منطقتك.',
      en: 'Antibiotics are prescribed for one illness and one person. Keeping leftovers for later is tempting but not safe: the medicine may not suit the next illness, and old medicine may be out of date.\n\nStore medicines as written on the label or leaflet, usually in a cool, dry place and out of reach and sight of children. Check the expiry date.\n\nDo not throw medicines in the sink or toilet unless you are told to. Ask your pharmacist about a take-back service or about safe disposal in your area.',
    },
  },
  {
    id: 'nurse-role',
    title: { ar: 'دور التمريض في الوعي بالمضادات الحيوية', en: 'The nurse’s role in antibiotic awareness' },
    summary: {
      ar: 'كيف يساهم الممرضون في الاستخدام الرشيد للمضادات الحيوية.',
      en: 'How nurses help antibiotics to be used wisely.',
    },
    body: {
      ar: 'يقضي الممرضون وقتًا مع المرضى أكثر من معظم المهنيين الآخرين، ما يجعلهم شركاء أساسيين في الاستخدام الرشيد للمضادات الحيوية.\n\nمن مساهماتهم المعتادة: شرح سبب الحاجة أو عدم الحاجة إلى المضاد الحيوي للمرضى وأسرهم، والتحقق من الحساسية والتفاعلات السابقة وتوثيقها، وإعطاء الأدوية في موعدها وكما هو مطلوب، ومراقبة الأعراض الجانبية والتفاعلات التحسسية والإبلاغ عنها، وتعزيز نظافة اليدين وإجراءات مكافحة العدوى، وتعليم المرضى كيف يتناولون دواءهم وماذا يفعلون عند نسيان جرعة.\n\nتختلف المسؤوليات الدقيقة باختلاف البلد ومكان العمل والسياسات المحلية.',
      en: 'Nurses spend more time with patients than most other professionals, which makes them key partners in using antibiotics wisely.\n\nTypical contributions: explaining to patients and families why an antibiotic is or is not needed; checking and recording allergies and previous reactions; giving medicines on time and as ordered; watching for and reporting side effects and allergic reactions; promoting hand hygiene and infection-control measures; and teaching patients how to take their medicine and what to do if they miss a dose.\n\nThe exact responsibilities depend on the country, the workplace and local policy.',
    },
  },
  {
    id: 'antibiotic-allergy',
    title: { ar: 'الحساسية من المضادات الحيوية', en: 'Allergy to antibiotics' },
    summary: {
      ar: 'الفرق بين الحساسية والأثر الجانبي، وماذا تقول للمختصين.',
      en: 'The difference between an allergy and a side effect, and what to tell professionals.',
    },
    body: {
      ar: 'يُصاب بعض الأشخاص بتفاعل تحسسي تجاه مضادات حيوية معينة. وقد تشمل العلامات طفحًا جلديًا، وحكة، وتورّم الوجه أو الشفتين أو الحلق، وأزيزًا، وصعوبة في التنفس. التفاعلات الشديدة تحتاج إلى مساعدة طارئة.\n\nأخبر كل طبيب وصيدلاني وممرض بأي تفاعل حدث لك مع دواء وماذا حدث بالضبط. لا تصنّف نفسك «حساسًا» بسبب اضطراب بسيط في المعدة: فالأثر الجانبي ليس هو الحساسية.\n\nإذا قيل لك إنك حساس لكنك غير متأكد فاسأل طبيبك إن كان إجراء فحص أو مراجعة مناسبًا. ولا تجرّب الدواء بنفسك في المنزل للتأكد.',
      en: 'Some people have allergic reactions to certain antibiotics. Signs can include a skin rash, itching, swelling of the face, lips or throat, wheezing, or difficulty breathing. Severe reactions need emergency help.\n\nTell every doctor, pharmacist and nurse about any reaction you have had to a medicine and what exactly happened. Do not label yourself allergic because of a mild upset stomach: a side effect is not the same as an allergy.\n\nIf you have been told you are allergic but are not sure, ask your doctor whether testing or a review is appropriate. Do not test yourself by taking the medicine at home.',
    },
  },
  {
    id: 'antibiotic-diarrhoea',
    title: { ar: 'الإسهال المرتبط بالمضادات الحيوية', en: 'Diarrhoea linked to antibiotics' },
    summary: {
      ar: 'متى يكون الإسهال بسيطًا ومتى يحتاج إلى استشارة طبية.',
      en: 'When diarrhoea is mild and when it needs medical advice.',
    },
    body: {
      ar: 'قد تُخلّ المضادات الحيوية بالتوازن الطبيعي للبكتيريا في الأمعاء وتسبب براز لينًا لدى بعض الأشخاص. وغالبًا ما يكون ذلك خفيفًا ويزول بعد انتهاء العلاج.\n\nالإسهال المائي الشديد أو الدموي، أو ألم البطن القوي، أو الحمّى، أو الإسهال الذي يستمر أيامًا أو يبدأ بعد أسابيع من العلاج يحتاج إلى استشارة طبية لأنه قد يدل على عدوى أكثر خطورة. اشرب السوائل لتجنب الجفاف.\n\nلا تتناول أدوية إيقاف الإسهال دون سؤال الصيدلاني أو الطبيب.',
      en: 'Antibiotics can upset the normal balance of bacteria in the gut and cause loose stools in some people. This is often mild and settles after the course ends.\n\nSevere, watery or bloody diarrhoea, strong stomach pain, fever, or diarrhoea that lasts for days or starts weeks after treatment needs medical advice, because it can be a sign of a more serious infection. Drink fluids to avoid dehydration.\n\nDo not take anti-diarrhoea medicines without asking a pharmacist or doctor.',
    },
  },
];
