import { Bi } from './types';

export interface Question {
  q: Bi;
  options: Bi[];
  answer: number; // index of the correct option
  why: Bi;
}

const o = (ar: string, en: string, fr?: string, es?: string): Bi => ({ ar, en, fr, es });

/** General knowledge questions in 4 languages (AR, EN, FR, ES). */
export const QUESTIONS: Question[] = [
  {
    q: o(
      'المضادات الحيوية فعّالة ضد:',
      'Antibiotics are effective against:',
      'Les antibiotiques sont efficaces contre :',
      'Los antibióticos son eficaces contra:'
    ),
    options: [
      o('العدوى البكتيرية', 'Bacterial infections', 'Les infections bactériennes', 'Las infecciones bacterianas'),
      o('العدوى الفيروسية مثل الإنفلونزا', 'Viral infections such as influenza', 'Les infections virales comme la grippe', 'Las infecciones virales como la gripe'),
      o('البكتيريا والفيروسات معًا', 'Both bacteria and viruses', 'Les bactéries et les virus à la fois', 'Tanto bacterias como virus'),
    ],
    answer: 0,
    why: o(
      'المضادات الحيوية تعمل ضد البكتيريا فقط ولا تعالج الفيروسات.',
      'Antibiotics work against bacteria only; they do not treat viruses.',
      'Les antibiotiques agissent uniquement contre les bactéries et n’ont aucun effet sur les virus.',
      'Los antibióticos solo actúan contra las bacterias y no curan los virus.'
    ),
  },
  {
    q: o(
      'ماذا تعني «مقاومة المضادات الحيوية»؟',
      'What does “antibiotic resistance” mean?',
      'Que signifie « l’antibiorésistance » ?',
      '¿Qué significa «resistencia a los antibióticos»?'
    ),
    options: [
      o('جسم الإنسان يعتاد على الدواء', 'The human body gets used to the medicine', 'Le corps humain s’habitue au médicament', 'El cuerpo humano se acostumbra al medicamento'),
      o('البكتيريا تتغيّر فلا يعود الدواء فعّالًا ضدها', 'Bacteria change so the medicine no longer works well against them', 'Les bactéries mutent et le médicament ne parvient plus à les éliminer', 'Las bacterias cambian y el medicamento deja de ser eficaz contra ellas'),
      o('المضاد الحيوي يسبب حساسية', 'The antibiotic causes an allergy', 'L’antibiotique provoque une allergie', 'El antibiótico provoca una alergia'),
    ],
    answer: 1,
    why: o(
      'البكتيريا هي التي تصبح مقاومة وليس جسم الإنسان.',
      'It is the bacteria that become resistant, not the person’s body.',
      'Ce sont les bactéries elles-mêmes qui deviennent résistantes, et non le corps humain.',
      'Son las bacterias las que se vuelven resistentes, no el cuerpo de la persona.'
    ),
  },
  {
    q: o(
      'لديك بقايا مضاد حيوي من مرض سابق وظهرت أعراض جديدة. ما الأنسب؟',
      'You have leftover antibiotics from a past illness and new symptoms. What is best?',
      'Il vous reste des antibiotiques d’une maladie précédente et de nouveaux symptômes apparaissent. Que faire ?',
      'Tienes antibióticos sobrantes de una enfermedad anterior y aparecen nuevos síntomas. ¿Qué es lo mejor?'
    ),
    options: [
      o('تناول البقايا', 'Take the leftovers', 'Prendre les comprimés restants', 'Tomar los medicamentos sobrantes'),
      o('مراجعة الطبيب أو الصيدلي', 'Ask a doctor or pharmacist', 'Consulter un médecin ou un pharmacien', 'Consultar a un médico o farmacéutico'),
      o('إعطاؤها لصديق لديه أعراض مشابهة', 'Give them to a friend with similar symptoms', 'Les donner à un proche ayant les mêmes symptômes', 'Dárselos a un amigo con síntomas similares'),
    ],
    answer: 1,
    why: o(
      'قد لا يناسب الدواء الحالة الجديدة، وقد يضر. القرار للمختص.',
      'The medicine may not suit the new problem and may cause harm. A professional should decide.',
      'Le médicament peut être inadapté ou périmé. Seul un professionnel de santé peut évaluer le besoin réel.',
      'El medicamento puede no ser adecuado para el nuevo problema y causar daño. Un profesional debe decidir.'
    ),
  },
  {
    q: o(
      'شعرت بتحسّن بعد يومين من مضاد حيوي موصوف لك. ما الصحيح؟',
      'You feel better after two days of a prescribed antibiotic. What is correct?',
      'Vous vous sentez mieux après deux jours d’un antibiotique prescrit. Que devez-vous faire ?',
      'Te sientes mejor después de dos días de tomar un antibiótico recetado. ¿Qué es lo correcto?'
    ),
    options: [
      o('أتوقف فورًا من تلقاء نفسي', 'Stop right away on my own', 'Arrêter immédiatement de moi-même', 'Dejar de tomarlo inmediatamente por mi cuenta'),
      o('أتبع تعليمات من وصف الدواء، وأسأله أو أسأل الصيدلي إن كنت غير متأكد', 'Follow the prescriber’s instructions, and ask them or the pharmacist if unsure', 'Suivre la durée prescrite jusqu’au bout et demander conseil en cas de doute', 'Seguir las instrucciones del médico hasta completar el ciclo y consultar si tengo dudas'),
      o('أضاعف الجرعة', 'Double the dose', 'Doubler la dose', 'Duplicar la dosis'),
    ],
    answer: 1,
    why: o(
      'لا تغيّر الجرعة أو المدة من تلقاء نفسك؛ استشر من وصف الدواء.',
      'Do not change the dose or duration on your own; check with whoever prescribed it.',
      'Arrêter trop tôt permet aux bactéries survivantes de redevenir actives et résistantes.',
      'No cambies la dosis ni la duración por tu cuenta; suspender antes de tiempo favorece la resistencia.'
    ),
  },
  {
    q: o(
      'أي علامة بعد تناول مضاد حيوي تستدعي مساعدة طبية عاجلة؟',
      'Which sign after taking an antibiotic needs urgent medical help?',
      'Quel signe après la prise d’un antibiotique nécessite une aide médicale d’urgence ?',
      '¿Qué signo después de tomar un antibiótico requiere atención médica urgente?'
    ),
    options: [
      o('اضطراب بسيط في المعدة', 'Mild stomach upset', 'Un léger inconfort gastrique', 'Malestar estomacal leve'),
      o('تورّم الوجه أو الشفتين مع صعوبة في التنفس', 'Swelling of the face or lips with difficulty breathing', 'Gonflement du visage ou des lèvres avec difficulté à respirer', 'Hinchazón de la cara o los labios con dificultad para respirar'),
      o('تغيّر طفيف في الطعم', 'A slight change in taste', 'Une légère modification du goût', 'Un ligero cambio en el sentido del gusto'),
    ],
    answer: 1,
    why: o(
      'قد تكون علامات تحسس شديد وتحتاج إسعافًا فوريًا.',
      'These may be signs of a severe allergic reaction and need emergency care.',
      'Ce sont des signes d’anaphylaxie (allergie grave) nécessitant les urgences immédiates.',
      'Estos pueden ser signos de una reacción alérgica grave (anafilaxia) y requieren urgencias inmediatas.'
    ),
  },
  {
    q: o(
      'أي سلوك يساعد على الحد من انتشار المقاومة؟',
      'Which behaviour helps reduce the spread of resistance?',
      'Quel comportement aide à freiner la propagation de l’antibiorésistance ?',
      '¿Qué comportamiento ayuda a reducir la propagación de la resistencia?'
    ),
    options: [
      o('استخدام المضاد فقط عند وصفه وكما هو موصوف', 'Using antibiotics only when prescribed and exactly as directed', 'Utiliser les antibiotiques uniquement sur ordonnance et selon les instructions', 'Usar antibióticos solo cuando sean recetados y exactamente como se indique'),
      o('طلب مضاد حيوي لكل نزلة برد', 'Asking for an antibiotic for every cold', 'Demander un antibiotique à chaque rhume', 'Pedir un antibiótico para cada resfriado'),
      o('مشاركة المضاد مع أفراد الأسرة', 'Sharing antibiotics with family members', 'Partager ses antibiotiques avec sa famille', 'Compartir antibióticos con familiares'),
    ],
    answer: 0,
    why: o(
      'الاستخدام الصحيح فقط عند الحاجة يحمي فعالية هذه الأدوية.',
      'Correct use only when needed protects how well these medicines work.',
      'Le bon usage préserve l’efficacité des antibiotiques pour les infections graves.',
      'El uso adecuado solo cuando es necesario protege la eficacia de estos medicamentos.'
    ),
  },
  {
    q: o(
      'أي مما يلي يساعد على الوقاية من العدوى وتقليل الحاجة إلى المضادات الحيوية؟',
      'Which of these helps prevent infections and reduce the need for antibiotics?',
      'Qu’est-ce qui aide à prévenir les infections et à réduire le besoin d’antibiotiques ?',
      '¿Qué ayuda a prevenir infecciones y reducir la necesidad de antibióticos?'
    ),
    options: [
      o('غسل اليدين والتطعيمات الموصى بها', 'Hand washing and recommended vaccinations', 'Le lavage régulier des mains et les vaccinations recommandées', 'El lavado de manos y las vacunas recomendadas'),
      o('تناول مضاد حيوي «احتياطًا» دون حاجة', 'Taking an antibiotic “just in case”', 'Prendre un antibiotique « par précaution »', 'Tomar un antibiótico «por si acaso»'),
      o('مشاركة الأدوية مع الأسرة', 'Sharing medicines with family', 'Partager les médicaments en famille', 'Compartir medicamentos con la familia'),
    ],
    answer: 0,
    why: o(
      'الوقاية من العدوى تقلل الحاجة إلى المضادات الحيوية.',
      'Preventing infections reduces the need for antibiotics.',
      'Prévenir les infections grâce à l’hygiène et aux vaccins évite d’avoir recours aux antibiotiques.',
      'Prevenir las infecciones reduce directamente la necesidad de tomar antibióticos.'
    ),
  },
  {
    q: o(
      'البكتيريا المقاومة للمضادات يمكن أن تنتقل من شخص إلى آخر.',
      'Resistant bacteria can spread from one person to another.',
      'Les bactéries résistantes aux antibiotiques peuvent se transmettre d’une personne à une autre.',
      'Las bacterias resistentes a los antibióticos pueden transmitirse de una persona a otra.'
    ),
    options: [
      o('صحيح', 'True', 'Vrai', 'Verdadero'),
      o('خطأ', 'False', 'Faux', 'Falso'),
    ],
    answer: 0,
    why: o(
      'قد تنتقل البكتيريا المقاومة بين الأشخاص وفي المجتمع، لذلك المقاومة تهم الجميع.',
      'Resistant bacteria can spread between people and communities, so resistance concerns everyone.',
      'Les bactéries résistantes peuvent se propager entre les personnes, à l’hôpital comme dans la communauté.',
      'Las bacterias resistentes pueden propagarse entre personas y comunidades, por lo que nos afecta a todos.'
    ),
  },
  {
    q: o(
      'نسيت جرعة من مضاد حيوي موصوف لك. ما الأنسب؟',
      'You missed a dose of a prescribed antibiotic. What is best?',
      'Vous avez oublié une dose de votre antibiotique prescrit. Que faire ?',
      'Olvidaste una dosis de un antibiótico recetado. ¿Qué es lo mejor?'
    ),
    options: [
      o('أضاعف الجرعة التالية', 'Double the next dose', 'Doubler la dose suivante', 'Duplicar la siguiente dosis'),
      o('أتبع تعليمات النشرة أو أسأل الصيدلي، ولا أضاعف الجرعة', 'Follow the leaflet or ask the pharmacist, and never double the dose', 'Suivre les consignes de la notice ou demander au pharmacien sans jamais doubler la dose', 'Seguir el prospecto o preguntar al farmacéutico, y nunca duplicar la dosis'),
      o('أوقف العلاج نهائيًا', 'Stop the treatment completely', 'Arrêter complètement le traitement', 'Suspender el tratamiento por completo'),
    ],
    answer: 1,
    why: o(
      'لا تُضاعَف الجرعة لتعويض ما فات. اسأل الصيدلي أو راجع النشرة.',
      'Do not double a dose to make up for a missed one. Ask the pharmacist or check the leaflet.',
      'Ne doublez jamais une dose pour compenser un oubli ; demandez conseil à votre pharmacien.',
      'Nunca dupliques una dosis para compensar un olvido; consulta al farmacéutico o el prospecto.'
    ),
  },
  {
    q: o(
      'من يقرر أنسب مضاد حيوي لحالتك؟',
      'Who should decide which antibiotic suits your illness?',
      'Qui doit décider quel antibiotique convient à votre maladie ?',
      '¿Quién debe decidir qué antibiótico es adecuado para tu enfermedad?'
    ),
    options: [
      o('صديق استخدمه من قبل', 'A friend who used one before', 'Un ami qui l’a déjà utilisé', 'Un amigo que usó uno antes'),
      o('طبيب أو مختص مؤهل بعد تقييم الحالة', 'A doctor or qualified clinician after assessing you', 'Un médecin ou professionnel de santé qualifié après examen', 'Un médico o profesional sanitario cualificado tras evaluarte'),
      o('معلومات عشوائية من الإنترنت', 'Random information from the internet', 'Des informations trouvées au hasard sur Internet', 'Información aleatoria de internet'),
    ],
    answer: 1,
    why: o(
      'اختيار الدواء يتطلب تقييمًا طبيًا وقد يحتاج إلى فحوصات.',
      'Choosing a medicine needs a clinical assessment and sometimes tests.',
      'Le choix d’un antibiotique nécessite un diagnostic médical précis et parfois des analyses.',
      'Elegir un antibiótico requiere una evaluación clínica y, en ocasiones, pruebas de laboratorio.'
    ),
  },
  {
    q: o(
      'لماذا نخبر الطبيب أو الصيدلي بأي حساسية سابقة من الأدوية؟',
      'Why tell the doctor or pharmacist about any past medicine allergy?',
      'Pourquoi signaler toute allergie médicamenteuse antérieure au médecin ou au pharmacien ?',
      '¿Por qué informar al médico o farmacéutico sobre cualquier alergia previa a medicamentos?'
    ),
    options: [
      o('لتجنّب وصف دواء قد يسبب تفاعلًا تحسسيًا', 'To avoid giving a medicine that may cause an allergic reaction', 'Pour éviter la prescription d’un médicament pouvant provoquer une réaction allergique', 'Para evitar un medicamento que pueda causar una reacción alérgica'),
      o('لأن الأمر غير مهم', 'Because it does not matter', 'Parce que cela n’a pas d’importance', 'Porque no tiene importancia'),
      o('فقط عند أخذ الحقن', 'Only when taking injections', 'Uniquement pour les injections', 'Solo cuando se administran inyecciones'),
    ],
    answer: 0,
    why: o(
      'معرفة الحساسية تساعد على اختيار دواء أكثر أمانًا لك.',
      'Knowing about allergies helps choose a safer medicine for you.',
      'Connaître vos antécédents d’allergie permet de choisir un antibiotique sûr sans allergie croisée.',
      'Conocer tus alergias ayuda a elegir un medicamento seguro y evitar reacciones cruzadas.'
    ),
  },
  {
    q: o(
      'مقاومة المضادات الحيوية تؤثر فقط على الشخص الذي تناول المضاد.',
      'Antibiotic resistance only affects the person who took the antibiotic.',
      'L’antibiorésistance n’affecte que la personne qui a pris l’antibiotique.',
      'La resistencia a los antibióticos solo afecta a la persona que tomó el antibiótico.'
    ),
    options: [
      o('صحيح', 'True', 'Vrai', 'Verdadero'),
      o('خطأ', 'False', 'Faux', 'Falso'),
    ],
    answer: 1,
    why: o(
      'قد تنتشر البكتيريا المقاومة إلى الآخرين، فتؤثر على الأسرة والمجتمع.',
      'Resistant bacteria can spread to others, affecting family and community.',
      'Les bactéries devenues résistantes peuvent se transmettre à d’autres personnes de l’entourage.',
      'Las bacterias resistentes pueden propagarse a otras personas, afectando a la familia y la comunidad.'
    ),
  },
  {
    q: o(
      'استخدام المضادات الحيوية دون حاجة قد:',
      'Using antibiotics when they are not needed can:',
      'Utiliser des antibiotiques sans nécessité médicale peut :',
      'Usar antibióticos cuando no se necesitan puede:'
    ),
    options: [
      o('يزيد خطر الإصابة لاحقًا بعدوى تقاوم المضادات', 'Raise your risk of a later infection that resists antibiotics', 'Augmenter le risque d’une infection ultérieure résistante aux traitements', 'Aumentar el riesgo de sufrir más adelante una infección resistente'),
      o('يمنحك مناعة دائمة', 'Give you lasting immunity', 'Vous donner une immunité permanente', 'Darte inmunidad duradera'),
      o('يقوّي جهاز المناعة', 'Strengthen your immune system', 'Renforcer votre système immunitaire', 'Fortalecer tu sistema inmunitario'),
    ],
    answer: 0,
    why: o(
      'الاستخدام غير الضروري يعطي البكتيريا فرصة لتصبح مقاومة.',
      'Unnecessary use gives bacteria a chance to become resistant.',
      'L’usage abusif sélectionne des souches bactériennes résistantes difficiles à traiter.',
      'El uso innecesario da a las bacterias la oportunidad de volverse resistentes.'
    ),
  },
  {
    q: o(
      'ظهر إسهال مائي شديد أو دموي أثناء العلاج بمضاد حيوي أو بعده بأسابيع. ما الأنسب؟',
      'Severe watery or bloody diarrhoea appears during or weeks after an antibiotic. What is best?',
      'Une diarrhée liquide sévère ou sanglante apparaît pendant ou après un traitement antibiotique. Que faire ?',
      'Aparece diarrea acuosa intensa o con sangre durante o semanas después de tomar un antibiótico. ¿Qué hacer?'
    ),
    options: [
      o('تجاهله', 'Ignore it', 'L’ignorer', 'Ignorarlo'),
      o('الاتصال بالطبيب سريعًا', 'Contact a doctor promptly', 'Contacter rapidement un médecin', 'Contactar a un médico de inmediato'),
      o('تناول بقايا مضاد حيوي قديم', 'Take an old leftover antibiotic', 'Prendre un ancien reste d’antibiotique', 'Tomar un antibiótico sobrante antiguo'),
    ],
    answer: 1,
    why: o(
      'قد يدل على مضاعفات تحتاج تقييمًا طبيًا.',
      'It may signal a complication that needs medical assessment.',
      'Cela peut être le signe d’une colite à Clostridioides difficile nécessitant une prise en charge médicale.',
      'Puede indicar una complicación intestinal importante que requiere evaluación médica.'
    ),
  },
  {
    q: o(
      'شخص لديه رشح وسعال منذ ثلاثة أيام. هل تفيد المضادات الحيوية عادةً؟',
      'A person has had a cold with a runny nose and cough for three days. Do antibiotics usually help?',
      'Une personne a un rhume avec nez qui coule et toux depuis trois jours. Les antibiotiques aident-ils habituellement ?',
      'Una persona tiene resfriado con congestión y tos desde hace tres días. ¿Suelen ayudar los antibióticos?'
    ),
    options: [
      o('نعم، دائمًا', 'Yes, always', 'Oui, toujours', 'Sí, siempre'),
      o('لا، فنزلات البرد تسببها الفيروسات عادةً', 'No, colds are usually caused by viruses', 'Non, les rhumes sont causés par des virus', 'No, los resfriados suelen ser causados por virus'),
      o('نعم، إذا استمر السعال أكثر من يوم', 'Yes, if the cough lasts more than a day', 'Oui, si la toux dure plus d’un jour', 'Sí, si la tos dura más de un día'),
    ],
    answer: 1,
    why: o(
      'المضادات الحيوية لا تعمل ضد الفيروسات.',
      'Antibiotics do not work against viruses.',
      'Les antibiotiques sont inefficaces contre les virus du rhume.',
      'Los antibióticos no tienen efecto contra los virus que causan el resfriado.'
    ),
  },
  {
    q: o(
      'أحد أفراد أسرتك لديه أعراض مشابهة لأعراضك. هل تعطيه من مضادك الحيوي الموصوف لك؟',
      'A family member has symptoms like yours. Should you give them some of your prescribed antibiotic?',
      'Un membre de votre famille a des symptômes similaires aux vôtres. Devez-vous lui donner votre antibiotique ?',
      'Un familiar tiene síntomas parecidos a los tuyos. ¿Deberías darle parte de tu antibiótico recetado?'
    ),
    options: [
      o('نعم، فالأعراض متشابهة', 'Yes, the symptoms are similar', 'Oui, car les symptômes se ressemblent', 'Sí, los síntomas son similares'),
      o('لا، يجب أن يراجع هو الطبيب أو الصيدلي', 'No, they should see a doctor or pharmacist themselves', 'Non, il doit consulter un médecin ou un pharmacien', 'No, debe consultar a un médico o farmacéutico por su cuenta'),
      o('نعم، إذا كان وزنه قريبًا من وزني', 'Yes, if their weight is close to mine', 'Oui, si son poids est proche du mien', 'Sí, si su peso es parecido al mío'),
    ],
    answer: 1,
    why: o(
      'الدواء وُصف لشخص محدد ولحالة محددة.',
      'The medicine was prescribed for one person and one condition.',
      'Une ordonnance est strictement individuelle et adaptée à un patient précis.',
      'El medicamento fue recetado para una persona y una afección específicas.'
    ),
  },
  {
    q: o(
      'أي عبارة هي الأنسب بشأن شراء المضاد الحيوي؟',
      'Which statement about getting an antibiotic is best?',
      'Quelle affirmation concernant l’obtention d’un antibiotique est la plus juste ?',
      '¿Qué afirmación sobre cómo obtener un antibiótico es la más adecuada?'
    ),
    options: [
      o('أشتريه متى شعرت بأعراض', 'I buy one whenever I have symptoms', 'J’en achète dès que j’ai des symptômes', 'Lo compro cada vez que tengo síntomas'),
      o('أستخدمه فقط عندما ينصح به مختص صحي', 'I use one only when a healthcare professional advises it', 'Je l’utilise uniquement sur prescription d’un professionnel de santé', 'Lo uso solo cuando lo indica un profesional de la salud'),
      o('أطلب الاسم الذي استخدمه جاري', 'I ask for the one my neighbour used', 'Je demande le même que mon voisin', 'Pido el mismo que usó mi vecino'),
    ],
    answer: 1,
    why: o(
      'اختيار المضاد الحيوي وتحديد الحاجة إليه قرار مختص.',
      'Deciding whether an antibiotic is needed, and which one, is a professional decision.',
      'La décision de prescrire un antibiotique relève exclusivement d’un professionnel de santé.',
      'Decidir si se necesita un antibiótico y cuál elegir es una decisión médica profesional.'
    ),
  },
  {
    q: o(
      'قال الطبيب إن مرضك فيروسي ولا يحتاج إلى مضاد حيوي. ما الأنسب؟',
      'The doctor says your illness is viral and does not need an antibiotic. What is best?',
      'Le médecin indique que votre infection est virale et ne nécessite pas d’antibiotique. Que faire ?',
      'El médico dice que tu enfermedad es viral y no necesita antibiótico. ¿Qué es lo mejor?'
    ),
    options: [
      o('أطلب مضادًا حيويًا على أي حال', 'Ask for an antibiotic anyway', 'Insister pour avoir un antibiotique quand même', 'Pedir un antibiótico de todos modos'),
      o('أسأل عمّا يخفف الأعراض ومتى أعود إن ساءت', 'Ask how to ease the symptoms and when to return if they get worse', 'Demander comment soulager les symptômes et quand reconsulter si cela s’aggrave', 'Preguntar cómo aliviar los síntomas y cuándo volver si empeoran'),
      o('أذهب إلى طبيب آخر لأحصل على واحد', 'Go to another doctor to get one', 'Aller voir un autre médecin pour en obtenir un', 'Ir a otro médico para conseguir uno'),
    ],
    answer: 1,
    why: o(
      'المضاد الحيوي لن يفيد في عدوى فيروسية وقد يضر.',
      'An antibiotic will not help a viral infection and may cause harm.',
      'Un antibiotique est inutile contre un virus et vous expose inutilement à des effets indésirables.',
      'Un antibiótico no ayudará en una infección viral y puede causar efectos adversos.'
    ),
  },
  {
    q: o(
      'استخدام المضادات الحيوية لدى الحيوانات قد يساهم أيضًا في ظهور المقاومة.',
      'Antibiotic use in animals can also contribute to resistance.',
      'L’utilisation d’antibiotiques chez les animaux peut aussi contribuer à l’antibiorésistance.',
      'El uso de antibióticos en animales también puede contribuir a la resistencia.'
    ),
    options: [
      o('صحيح', 'True', 'Vrai', 'Verdadero'),
      o('خطأ', 'False', 'Faux', 'Falso'),
      o('لا علاقة له بصحة الإنسان إطلاقًا', 'It has nothing to do with human health at all', 'Aucun rapport avec la santé humaine', 'No tiene ninguna relación con la salud humana'),
    ],
    answer: 0,
    why: o(
      'يمكن للبكتيريا المقاومة أن تنتقل بين الحيوان والإنسان والغذاء والبيئة.',
      'Resistant bacteria can move between animals, people, food and the environment.',
      'Les bactéries résistantes circulent entre les humains, les animaux, les aliments et l’environnement (One Health).',
      'Las bacterias resistentes pueden transmitirse entre animales, personas, alimentos y el medio ambiente (One Health).'
    ),
  },
  {
    q: o(
      'البكتيريا المقاومة توجد في المستشفيات فقط.',
      'Resistant bacteria are found only in hospitals.',
      'Les bactéries résistantes ne se trouvent que dans les hôpitaux.',
      'Las bacterias resistentes se encuentran únicamente en los hospitales.'
    ),
    options: [
      o('صحيح', 'True', 'Vrai', 'Verdadero'),
      o('خطأ', 'False', 'Faux', 'Falso'),
    ],
    answer: 1,
    why: o(
      'قد توجد في المجتمع وفي أماكن الرعاية الصحية على حد سواء.',
      'They can be found in the community as well as in healthcare settings.',
      'Elles sont présentes aussi bien dans la communauté que dans les établissements de santé.',
      'Pueden encontrarse tanto en la comunidad como en los centros de atención médica.'
    ),
  },
  {
    q: o(
      'بقيت لديك أقراص بعد انتهاء العلاج. ما الأنسب؟',
      'You have some tablets left after the treatment ended. What is best?',
      'Il vous reste des comprimés après la fin de votre traitement. Que faire ?',
      'Te quedaron algunos comprimidos después de terminar el tratamiento. ¿Qué es lo mejor?'
    ),
    options: [
      o('أحتفظ بها للمرة القادمة', 'Keep them for next time', 'Les garder pour la prochaine fois', 'Guardarlos para la próxima vez'),
      o('أعطيها لصديق', 'Give them to a friend', 'Les donner à un ami', 'Dárselos a un amigo'),
      o('أسأل الصيدلاني عن التخلص الآمن منها', 'Ask the pharmacist how to dispose of them safely', 'Demander au pharmacien comment les éliminer en toute sécurité', 'Preguntar al farmacéutico cómo desecharlos de forma segura'),
    ],
    answer: 2,
    why: o(
      'لا يُحتفظ ببقايا المضاد الحيوي ولا تُشارك مع الآخرين.',
      'Leftover antibiotics should not be kept or shared.',
      'Les restes d’antibiotiques ne doivent être ni conservés ni partagés, ni jetés dans l’eau.',
      'Los antibióticos sobrantes no deben guardarse ni compartirse con otras personas.'
    ),
  },
  {
    q: o(
      'شعرت باضطراب بسيط في المعدة بعد بدء المضاد الحيوي. ما الخطوة الأولى الأنسب؟',
      'You feel a mild upset stomach after starting an antibiotic. What is a good first step?',
      'Vous ressentez un léger trouble digestif après avoir commencé un antibiotique. Quelle est la bonne première étape ?',
      'Sientes un leve malestar estomacal tras iniciar un antibiótico. ¿Cuál es el mejor primer paso?'
    ),
    options: [
      o('أتوقف فورًا ولا أتناوله مجددًا', 'Stop at once and never take it again', 'Arrêter tout de suite sans avis médical', 'Dejarlo de inmediato y no volver a tomarlo'),
      o('أسأل الصيدلاني أو من وصف الدواء', 'Ask the pharmacist or the prescriber', 'Demander conseil au pharmacien ou au médecin prescripteur', 'Consultar al farmacéutico o al médico que lo recetó'),
      o('أضاعف الجرعة لأتخلص من العرض', 'Double the dose to get rid of it', 'Doubler la dose', 'Duplicar la dosis'),
    ],
    answer: 1,
    why: o(
      'يستطيع المختص إرشادك، وقد يكون العرض شائعًا وبسيطًا.',
      'A professional can advise you; the symptom may be common and mild.',
      'Le pharmacien ou le médecin peut vous conseiller (ex. prise pendant le repas si approprié).',
      'Un profesional puede orientarte; el síntoma puede ser leve y manejable sin interrumpir el tratamiento.'
    ),
  },
  {
    q: o(
      'من يمكن أن يُصاب بعدوى بكتيريا مقاومة؟',
      'Who can get an infection with resistant bacteria?',
      'Qui peut contracter une infection causée par une bactérie résistante ?',
      '¿Quién puede contraer una infección por bacterias resistentes?'
    ),
    options: [
      o('كبار السن فقط', 'Only older people', 'Uniquement les personnes âgées', 'Solo las personas mayores'),
      o('أي شخص', 'Anyone', 'N’importe qui', 'Cualquier persona'),
      o('من تناولوا مضادات حيوية فقط', 'Only people who have taken antibiotics', 'Uniquement ceux qui ont pris des antibiotiques', 'Solo quienes han tomado antibióticos'),
    ],
    answer: 1,
    why: o(
      'يمكن لأي شخص أن يُصاب، وإن كان بعض الأشخاص أكثر عرضة من غيرهم.',
      'Anyone can be infected, although some people are at higher risk than others.',
      'Tout le monde peut être infecté par une bactérie résistante, à tout âge.',
      'Cualquier persona puede infectarse, aunque algunos grupos tengan mayor riesgo.'
    ),
  },
  {
    q: o(
      'لماذا يسأل الطبيب أو الصيدلاني عن الحمل والرضاعة وأمراض الكلى والكبد؟',
      'Why does a doctor or pharmacist ask about pregnancy, breastfeeding, and kidney or liver disease?',
      'Pourquoi le médecin ou le pharmacien pose-t-il des questions sur la grossesse, l’allaitement et les reins ou le foie ?',
      '¿Por qué el médico o farmacéutico pregunta sobre embarazo, lactancia y enfermedades renales o hepáticas?'
    ),
    options: [
      o('هذه أسئلة روتينية بلا فائدة', 'These are routine questions with no purpose', 'Ce sont des questions de routine sans utilité', 'Son preguntas rutinarias sin utilidad'),
      o('لأن بعض المضادات الحيوية قد لا تناسب هذه الحالات أو تحتاج إلى تعديل', 'Because some antibiotics may not suit these situations or may need adjusting', 'Parce que certains antibiotiques sont contre-indiqués ou nécessitent un ajustement de dose', 'Porque algunos antibióticos no son seguros en estas situaciones o requieren ajuste de dosis'),
      o('لتحديد سعر الدواء', 'To decide the price of the medicine', 'Pour fixer le prix du médicament', 'Para decidir el precio del medicamento'),
    ],
    answer: 1,
    why: o(
      'هذه المعلومات تساعد على اختيار دواء آمن ومناسب.',
      'This information helps choose a safe and suitable medicine.',
      'Ces informations sont essentielles pour choisir un antibiotique sûr et adapter la posologie.',
      'Esta información es esencial para elegir un medicamento seguro y ajustar la dosis si es necesario.'
    ),
  },
];
