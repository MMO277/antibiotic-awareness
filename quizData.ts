import { Bi } from './types';

export interface Question {
  q: Bi;
  options: Bi[];
  answer: number;
  why: Bi;
  level: 'easy' | 'medium' | 'hard';
}

const o = (ar: string, en: string, fr?: string, es?: string): Bi => ({ ar, en, fr, es });

export const QUESTIONS: Question[] = [
  // ============ EASY (8 questions) ============
  {
    level: 'easy',
    q: o('المضادات الحيوية فعّالة ضد:', 'Antibiotics are effective against:', 'Les antibiotiques sont efficaces contre :', 'Los antibióticos son eficaces contra:'),
    options: [
      o('العدوى البكتيرية', 'Bacterial infections', 'Les infections bactériennes', 'Las infecciones bacterianas'),
      o('العدوى الفيروسية مثل الإنفلونزا', 'Viral infections such as influenza', 'Les infections virales comme la grippe', 'Las infecciones virales como la gripe'),
      o('البكتيريا والفيروسات معًا', 'Both bacteria and viruses', 'Les bactéries et les virus à la fois', 'Tanto bacterias como virus'),
    ],
    answer: 0,
    why: o(
      'المضادات الحيوية تعمل ضد البكتيريا فقط ولا تعالج الفيروسات مطلقًا. استخدامها في حالات فيروسية مثل الزكام لا يفيد ويُسرّع ظهور المقاومة.',
      'Antibiotics only work against bacteria. Using them for viral infections like colds or flu has no benefit and accelerates resistance.',
      'Les antibiotiques agissent uniquement contre les bactéries. Les prendre pour un virus aggrave la résistance sans aucun bénéfice.',
      'Los antibióticos solo actúan contra bacterias. Usarlos para virus no tiene beneficio y acelera la resistencia.'
    ),
  },
  {
    level: 'easy',
    q: o('شعرت بتحسّن بعد يومين من مضاد حيوي موصوف لك. ما الصحيح؟', 'You feel better after two days of a prescribed antibiotic. What is correct?', 'Vous vous sentez mieux après deux jours d\'un antibiotique prescrit. Que devez-vous faire ?', 'Te sientes mejor después de dos días de tomar un antibiótico recetado. ¿Qué es lo correcto?'),
    options: [
      o('أتوقف فورًا من تلقاء نفسي', 'Stop right away on my own', 'Arrêter immédiatement de moi-même', 'Dejar de tomarlo inmediatamente por mi cuenta'),
      o('أتبع تعليمات من وصف الدواء حتى النهاية', 'Follow the prescriber\'s instructions to the end', 'Suivre la durée prescrite jusqu\'au bout', 'Seguir las instrucciones del médico hasta completar el ciclo'),
      o('أضاعف الجرعة لأشفى أسرع', 'Double the dose to recover faster', 'Doubler la dose pour guérir plus vite', 'Duplicar la dosis para recuperarme más rápido'),
    ],
    answer: 1,
    why: o(
      'إيقاف المضاد قبل انتهاء الدورة يسمح لبعض البكتيريا بالبقاء والتحول إلى بكتيريا مقاومة في المستقبل. أكمل الجرعات حتى لو أحسست بتحسن.',
      'Stopping early allows surviving bacteria to grow back stronger and become resistant. Complete the full course even when feeling better.',
      'Arrêter trop tôt permet aux bactéries survivantes de muter en souches résistantes. Terminez toujours votre traitement.',
      'Parar antes permite que las bacterias sobrevivientes se vuelvan resistentes. Completa siempre el tratamiento completo.'
    ),
  },
  {
    level: 'easy',
    q: o('أي علامة تستدعي مساعدة طبية عاجلة بعد تناول مضاد حيوي؟', 'Which sign after taking an antibiotic needs urgent medical help?', 'Quel signe après la prise d\'un antibiotique nécessite une aide médicale d\'urgence ?', '¿Qué signo después de tomar un antibiótico requiere atención médica urgente?'),
    options: [
      o('اضطراب بسيط في المعدة', 'Mild stomach upset', 'Un léger inconfort gastrique', 'Malestar estomacal leve'),
      o('تورّم الوجه أو الشفتين مع صعوبة التنفس', 'Swelling of face or lips with difficulty breathing', 'Gonflement du visage avec difficulté à respirer', 'Hinchazón de cara o labios con dificultad para respirar'),
      o('تغيّر طفيف في الطعم', 'A slight change in taste', 'Une légère modification du goût', 'Un ligero cambio en el sentido del gusto'),
    ],
    answer: 1,
    why: o(
      'تورم الوجه مع صعوبة التنفس علامات تحسس شديد (أنافيلاكسيس) تستدعي إسعافًا فوريًا. لا تتردد في الاتصال بالإسعاف على الفور.',
      'Facial swelling with breathing difficulty are signs of anaphylaxis — a life-threatening allergic reaction requiring emergency care immediately.',
      'Gonflement du visage avec difficulté respiratoire = anaphylaxie grave → urgences immédiates, n\'attendez pas.',
      'Hinchazón facial con dificultad respiratoria = anafilaxia grave → llama a emergencias de inmediato.'
    ),
  },
  {
    level: 'easy',
    q: o('أي سلوك يساعد على الحد من مقاومة المضادات الحيوية؟', 'Which behaviour helps reduce antibiotic resistance?', 'Quel comportement aide à freiner l\'antibiorésistance ?', '¿Qué comportamiento ayuda a reducir la resistencia a los antibióticos?'),
    options: [
      o('استخدام المضاد فقط عند وصفه وكما هو موصوف', 'Using antibiotics only when prescribed and exactly as directed', 'Utiliser les antibiotiques uniquement sur ordonnance et selon les instructions', 'Usar antibióticos solo cuando sean recetados y exactamente como se indique'),
      o('طلب مضاد حيوي لكل نزلة برد', 'Asking for an antibiotic for every cold', 'Demander un antibiotique à chaque rhume', 'Pedir un antibiótico para cada resfriado'),
      o('مشاركة المضاد مع أفراد الأسرة', 'Sharing antibiotics with family members', 'Partager ses antibiotiques avec sa famille', 'Compartir antibióticos con familiares'),
    ],
    answer: 0,
    why: o(
      'الاستخدام الصحيح — فقط بوصفة وبالجرعة الكاملة — هو أهم سلاح لدينا لإبطاء المقاومة البكتيرية وحماية الأجيال القادمة.',
      'Correct use only when prescribed and at the full dose is our most powerful tool to slow bacterial resistance and protect future generations.',
      'L\'usage correct sur ordonnance et à la dose complète est notre meilleur outil pour freiner la résistance bactérienne.',
      'El uso correcto solo con receta y a la dosis completa es nuestra herramienta más poderosa para frenar la resistencia bacteriana.'
    ),
  },
  {
    level: 'easy',
    q: o('شخص لديه رشح وسعال منذ ثلاثة أيام. هل تفيد المضادات الحيوية عادةً؟', 'A person has had a cold and cough for three days. Do antibiotics usually help?', 'Une personne a un rhume depuis trois jours. Les antibiotiques aident-ils habituellement ?', 'Una persona tiene resfriado desde hace tres días. ¿Suelen ayudar los antibióticos?'),
    options: [
      o('نعم، دائمًا تعجّل الشفاء', 'Yes, they always speed recovery', 'Oui, ils accélèrent toujours la guérison', 'Sí, siempre aceleran la recuperación'),
      o('لا، نزلات البرد تسببها فيروسات عادةً', 'No, colds are usually caused by viruses', 'Non, les rhumes sont causés par des virus', 'No, los resfriados suelen ser causados por virus'),
      o('نعم، إذا استمر السعال أكثر من يوم', 'Yes, if the cough lasts more than a day', 'Oui, si la toux dure plus d\'un jour', 'Sí, si la tos dura más de un día'),
    ],
    answer: 1,
    why: o(
      'أكثر من 90% من نزلات البرد والسعال سببها فيروسات. المضادات الحيوية لا تقتل الفيروسات وتناولها في هذه الحالة يُعرّضك لآثار جانبية دون أي فائدة.',
      'Over 90% of colds are viral. Antibiotics cannot kill viruses; taking them exposes you to side effects with zero benefit.',
      'Plus de 90% des rhumes sont viraux. Les antibiotiques ne tuent pas les virus — ils causent des effets secondaires sans aucun bénéfice.',
      'Más del 90% de los resfriados son virales. Los antibióticos no matan virus, solo causan efectos adversos sin ningún beneficio.'
    ),
  },
  {
    level: 'easy',
    q: o('أي مما يلي يساعد على الوقاية من العدوى وتقليل الحاجة للمضادات؟', 'Which of these helps prevent infections and reduce the need for antibiotics?', 'Qu\'est-ce qui aide à prévenir les infections ?', '¿Qué ayuda a prevenir infecciones?'),
    options: [
      o('غسل اليدين جيدًا والتطعيمات الموصى بها', 'Regular hand washing and recommended vaccinations', 'Lavage régulier des mains et vaccinations recommandées', 'Lavado de manos y vacunas recomendadas'),
      o('تناول مضاد حيوي «احتياطًا» دون حاجة', 'Taking an antibiotic "just in case"', 'Prendre un antibiotique « par précaution »', 'Tomar un antibiótico «por si acaso»'),
      o('مشاركة الأدوية مع الأسرة', 'Sharing medicines with family', 'Partager les médicaments en famille', 'Compartir medicamentos con la familia'),
    ],
    answer: 0,
    why: o(
      'غسل اليدين يمنع انتقال الجراثيم، والتطعيمات تحمي من أمراض بكتيرية خطيرة. كلاهما يقلل الحاجة للمضادات من الأساس.',
      'Hand washing prevents germ spread, and vaccines protect against serious bacterial diseases — both directly reduce the need for antibiotics.',
      'Le lavage des mains et les vaccins réduisent les infections et donc le besoin d\'antibiotiques à la source.',
      'El lavado de manos y las vacunas reducen infecciones y, por tanto, la necesidad de antibióticos desde el origen.'
    ),
  },
  {
    level: 'easy',
    q: o('من يقرر أنسب مضاد حيوي لحالتك؟', 'Who should decide which antibiotic suits your illness?', 'Qui doit décider quel antibiotique convient à votre maladie ?', '¿Quién debe decidir qué antibiótico es adecuado para tu enfermedad?'),
    options: [
      o('صديق استخدمه من قبل', 'A friend who used one before', 'Un ami qui l\'a déjà utilisé', 'Un amigo que usó uno antes'),
      o('طبيب أو مختص مؤهل بعد تقييم الحالة', 'A doctor or qualified clinician after assessing you', 'Un médecin qualifié après examen', 'Un médico cualificado tras evaluarte'),
      o('معلومات عشوائية من الإنترنت', 'Random information from the internet', 'Des informations trouvées sur internet', 'Información aleatoria de internet'),
    ],
    answer: 1,
    why: o(
      'اختيار المضاد الحيوي الصحيح يحتاج معرفة نوع البكتيريا والحالة الصحية والأدوية الأخرى والحساسية. هذا قرار طبي متخصص وليس تخمين.',
      'Choosing the right antibiotic requires knowing the bacteria type, your health status, other medications, and allergies — a specialist medical decision.',
      'Choisir le bon antibiotique nécessite de connaître la bactérie, l\'état de santé global et les interactions — c\'est une décision médicale spécialisée.',
      'Elegir el antibiótico correcto requiere conocer la bacteria, el estado de salud y las interacciones — es una decisión médica especializada.'
    ),
  },
  {
    level: 'easy',
    q: o('بقيت لديك أقراص بعد انتهاء دورة العلاج. ما الأنسب؟', 'You have tablets left after finishing the treatment course. What is best?', 'Il vous reste des comprimés après la fin de votre traitement. Que faire ?', 'Te quedaron comprimidos después de terminar el tratamiento. ¿Qué es lo mejor?'),
    options: [
      o('أحتفظ بها للمرة القادمة', 'Keep them for next time', 'Les garder pour la prochaine fois', 'Guardarlos para la próxima vez'),
      o('أعطيها لصديق', 'Give them to a friend', 'Les donner à un ami', 'Dárselos a un amigo'),
      o('أسأل الصيدلاني عن التخلص الآمن منها', 'Ask the pharmacist how to dispose of them safely', 'Demander au pharmacien comment les éliminer en toute sécurité', 'Preguntar al farmacéutico cómo desecharlos de forma segura'),
    ],
    answer: 2,
    why: o(
      'رمي المضادات الحيوية في القمامة أو الصرف الصحي يلوث البيئة ويُسهم في المقاومة. الصيدلاني يعرف أماكن التخلص الآمن.',
      'Throwing antibiotics in trash or drains pollutes the environment and contributes to resistance. A pharmacist knows the safe disposal points.',
      'Jeter les antibiotiques dans les ordures ou les égouts pollue l\'environnement. Demandez à votre pharmacien les points de collecte sécurisés.',
      'Tirar antibióticos a la basura o el desagüe contamina el medio ambiente. El farmacéutico conoce los puntos de eliminación segura.'
    ),
  },

  // ============ MEDIUM (8 questions) ============
  {
    level: 'medium',
    q: o('ماذا تعني «مقاومة المضادات الحيوية» بالتحديد؟', 'What exactly does "antibiotic resistance" mean?', 'Que signifie exactement « l\'antibiorésistance » ?', '¿Qué significa exactamente «resistencia a los antibióticos»?'),
    options: [
      o('جسم الإنسان يعتاد على الدواء', 'The human body gets used to the medicine', 'Le corps humain s\'habitue au médicament', 'El cuerpo humano se acostumbra al medicamento'),
      o('البكتيريا تتغيّر فلا يعود الدواء فعّالًا ضدها', 'Bacteria change so the medicine no longer works against them', 'Les bactéries mutent et le médicament cesse d\'être efficace', 'Las bacterias cambian y el medicamento deja de ser eficaz contra ellas'),
      o('المضاد الحيوي يسبب حساسية للمريض', 'The antibiotic causes an allergy in the patient', 'L\'antibiotique provoque une allergie chez le patient', 'El antibiótico provoca una alergia en el paciente'),
    ],
    answer: 1,
    why: o(
      'المقاومة تحدث في البكتيريا وليس في جسمك. البكتيريا تطور آليات جينية تجعلها غير مبالية بالمضاد، فيفشل العلاج. سبب التطور الأساسي هو الاستخدام المفرط وغير الصحيح.',
      'Resistance occurs in bacteria, not your body. Bacteria develop genetic mechanisms to survive antibiotics, causing treatment failure. The main driver is overuse and misuse.',
      'La résistance se développe dans les bactéries, pas dans l\'organisme. Elles acquièrent des mécanismes génétiques pour survivre aux antibiotiques. L\'abus et l\'usage inapproprié en sont la cause principale.',
      'La resistencia ocurre en las bacterias, no en tu cuerpo. Desarrollan mecanismos genéticos para sobrevivir a los antibióticos. El uso excesivo e inadecuado es la causa principal.'
    ),
  },
  {
    level: 'medium',
    q: o('لديك بقايا مضاد حيوي من مرض سابق وظهرت أعراض جديدة. ما الأنسب؟', 'You have leftover antibiotics from a past illness and new symptoms appear. What is best?', 'Il vous reste des antibiotiques d\'une maladie précédente et de nouveaux symptômes apparaissent. Que faire ?', 'Tienes antibióticos sobrantes de una enfermedad anterior y aparecen nuevos síntomas. ¿Qué es lo mejor?'),
    options: [
      o('أتناول البقايا فورًا', 'Take the leftovers right away', 'Prendre les comprimés restants immédiatement', 'Tomar los sobrantes de inmediato'),
      o('أراجع الطبيب أو الصيدلي أولًا', 'See a doctor or pharmacist first', 'Consulter d\'abord un médecin ou un pharmacien', 'Consultar primero a un médico o farmacéutico'),
      o('أعطيها لصديق لديه أعراض مشابهة', 'Give them to a friend with similar symptoms', 'Les donner à un proche ayant les mêmes symptômes', 'Dárselos a un amigo con síntomas similares'),
    ],
    answer: 1,
    why: o(
      'الأعراض المتشابهة قد تكون أمراضًا مختلفة تحتاج مضادات مختلفة. البقايا قد تكون انتهت صلاحيتها، أو الجرعة غير كافية، أو النوع غير المناسب — كل هذا يحدده المختص فقط.',
      'Similar symptoms may be different diseases requiring different antibiotics. Leftovers may be expired, insufficient in dose, or the wrong type — only a specialist can determine this.',
      'Des symptômes similaires peuvent être des maladies différentes. Les restes peuvent être périmés, insuffisants ou inadaptés — seul un professionnel peut évaluer.',
      'Síntomas similares pueden ser enfermedades diferentes. Los sobrantes pueden estar caducados, en dosis insuficientes o ser el tipo incorrecto — solo un profesional puede evaluarlo.'
    ),
  },
  {
    level: 'medium',
    q: o('نسيت جرعة من مضاد حيوي موصوف لك. ما الأنسب؟', 'You missed a dose of a prescribed antibiotic. What is best?', 'Vous avez oublié une dose de votre antibiotique. Que faire ?', 'Olvidaste una dosis de un antibiótico recetado. ¿Qué es lo mejor?'),
    options: [
      o('أضاعف الجرعة التالية لتعويض الفائتة', 'Double the next dose to make up for it', 'Doubler la dose suivante', 'Duplicar la siguiente dosis para compensar'),
      o('أتبع تعليمات النشرة أو أسأل الصيدلي ولا أضاعف الجرعة', 'Follow the leaflet or ask the pharmacist — never double the dose', 'Suivre la notice ou consulter le pharmacien sans jamais doubler la dose', 'Seguir el prospecto o preguntar al farmacéutico — nunca duplicar la dosis'),
      o('أوقف العلاج نهائيًا', 'Stop the treatment completely', 'Arrêter complètement le traitement', 'Suspender el tratamiento por completo'),
    ],
    answer: 1,
    why: o(
      'مضاعفة الجرعة تزيد الآثار الجانبية دون فائدة إضافية، وإيقاف العلاج يُعرّضك لفشل العلاج. النشرة توضح ماذا تفعل حسب نوع كل دواء.',
      'Doubling the dose increases side effects without extra benefit, and stopping risks treatment failure. The package leaflet specifies what to do per drug type.',
      'Doubler la dose augmente les effets secondaires sans bénéfice. Arrêter risque l\'échec thérapeutique. La notice précise la conduite à tenir.',
      'Duplicar la dosis aumenta los efectos adversos sin beneficio. Parar arriesga el fracaso terapéutico. El prospecto especifica qué hacer según el medicamento.'
    ),
  },
  {
    level: 'medium',
    q: o('مقاومة المضادات الحيوية تؤثر على الجميع، لا على الشخص الذي تناول المضاد فقط.', 'Antibiotic resistance affects everyone, not just the person who took the antibiotic.', 'L\'antibiorésistance affecte tout le monde, pas seulement la personne qui a pris l\'antibiotique.', 'La resistencia a los antibióticos afecta a todos, no solo a quien tomó el antibiótico.'),
    options: [
      o('صحيح', 'True', 'Vrai', 'Verdadero'),
      o('خطأ، تؤثر على الشخص الذي أساء استخدامه فقط', 'False, it only affects the person who misused it', 'Faux, cela n\'affecte que la personne qui en a abusé', 'Falso, solo afecta a quien lo usó mal'),
    ],
    answer: 0,
    why: o(
      'البكتيريا المقاومة تنتشر من شخص إلى آخر عبر اللمس والهواء والغذاء والمياه. شخص لم يتناول مضادًا حيويًا في حياته قد يُصاب ببكتيريا مقاومة بسبب إساءة استخدام شخص آخر!',
      'Resistant bacteria spread person to person through touch, air, food and water. Someone who never took an antibiotic can still catch resistant bacteria due to someone else\'s misuse!',
      'Les bactéries résistantes se transmettent entre personnes par contact, air, eau et aliments. Quelqu\'un n\'ayant jamais pris d\'antibiotique peut contracter une bactérie résistante.',
      'Las bacterias resistentes se transmiten entre personas por contacto, aire, agua y alimentos. Alguien que nunca tomó antibióticos puede infectarse por el mal uso de otros.'
    ),
  },
  {
    level: 'medium',
    q: o('لماذا يسأل الطبيب عن الحمل والرضاعة وأمراض الكلى والكبد قبل وصف مضاد؟', 'Why does a doctor ask about pregnancy, breastfeeding, and kidney or liver disease before prescribing?', 'Pourquoi le médecin pose-t-il des questions sur la grossesse et les reins avant de prescrire ?', '¿Por qué el médico pregunta sobre embarazo y riñón antes de prescribir?'),
    options: [
      o('لأسباب روتينية بلا فائدة', 'For routine reasons with no purpose', 'Pour des raisons de routine sans utilité', 'Por razones rutinarias sin utilidad'),
      o('لأن بعض المضادات قد لا تناسب هذه الحالات أو تحتاج تعديل جرعة', 'Because some antibiotics may not be suitable or may need dose adjustment', 'Parce que certains antibiotiques sont contre-indiqués ou nécessitent un ajustement', 'Porque algunos antibióticos no son seguros o requieren ajuste de dosis'),
      o('لتحديد سعر الدواء', 'To decide the price of the medicine', 'Pour fixer le prix du médicament', 'Para decidir el precio del medicamento'),
    ],
    answer: 1,
    why: o(
      'مثلاً: التيتراسيكلين ضار للجنين والأطفال الصغار، والفلوروكينولونات تُتجنب في الحمل، وبعض المضادات تُراكم في الفشل الكلوي. هذه المعلومات تنقذ حياة.',
      'For example: tetracyclines harm the fetus and young children, fluoroquinolones are avoided in pregnancy, and some antibiotics accumulate in kidney failure. This information saves lives.',
      'Par exemple : les tétracyclines nuisent au fœtus, les fluoroquinolones sont évitées en grossesse, certains antibiotiques s\'accumulent en cas d\'insuffisance rénale.',
      'Por ejemplo: las tetraciclinas dañan al feto, las fluoroquinolonas se evitan en el embarazo, y algunos antibióticos se acumulan en insuficiencia renal. Esta información salva vidas.'
    ),
  },
  {
    level: 'medium',
    q: o('ظهر إسهال مائي شديد أثناء العلاج بمضاد حيوي أو بعده بأسابيع. ما الأنسب؟', 'Severe watery diarrhoea appears during or weeks after antibiotic treatment. What is best?', 'Diarrhée liquide sévère pendant ou après le traitement antibiotique. Que faire ?', 'Diarrea acuosa intensa durante o semanas después del tratamiento. ¿Qué hacer?'),
    options: [
      o('أتجاهله، هذا طبيعي دائمًا', 'Ignore it — it\'s always normal', 'L\'ignorer, c\'est toujours normal', 'Ignorarlo, siempre es normal'),
      o('أتصل بالطبيب سريعًا', 'Contact a doctor promptly', 'Contacter rapidement un médecin', 'Contactar a un médico de inmediato'),
      o('أتناول بقايا مضاد حيوي قديم', 'Take an old leftover antibiotic', 'Prendre un ancien reste d\'antibiotique', 'Tomar un antibiótico sobrante antiguo'),
    ],
    answer: 1,
    why: o(
      'الإسهال الشديد بعد المضادات قد يكون علامة التهاب القولون بـ Clostridioides difficile — وهو مضاعفة خطيرة تحتاج علاجًا متخصصًا ومختلفًا، وليس مضادًا عشوائيًا آخر.',
      'Severe diarrhoea after antibiotics may indicate Clostridioides difficile colitis — a serious complication requiring specialist treatment, not another random antibiotic.',
      'Diarrhée sévère après antibiotiques peut signaler une colite à Clostridioides difficile — complication grave nécessitant un traitement spécialisé.',
      'Diarrea grave tras antibióticos puede indicar colitis por Clostridioides difficile — una complicación seria que requiere tratamiento especializado, no otro antibiótico al azar.'
    ),
  },
  {
    level: 'medium',
    q: o('استخدام المضادات الحيوية في تربية الحيوانات له علاقة بصحة الإنسان.', 'Antibiotic use in farm animals is related to human health.', 'L\'usage des antibiotiques en élevage est lié à la santé humaine.', 'El uso de antibióticos en ganadería está relacionado con la salud humana.'),
    options: [
      o('صحيح، البكتيريا المقاومة تنتقل للإنسان', 'True — resistant bacteria transfer to humans', 'Vrai — les bactéries résistantes se transmettent à l\'homme', 'Verdadero — las bacterias resistentes se transfieren a los humanos'),
      o('خطأ، لا علاقة له بصحة الإنسان إطلاقًا', 'False — it has nothing to do with human health', 'Faux — aucun rapport avec la santé humaine', 'Falso — no tiene ninguna relación con la salud humana'),
      o('صحيح فقط في المزارع المجاورة للمدن', 'True only for farms near cities', 'Vrai uniquement pour les élevages proches des villes', 'Verdadero solo para granjas cerca de ciudades'),
    ],
    answer: 0,
    why: o(
      'مفهوم «صحة واحدة» (One Health): البكتيريا المقاومة تنتقل من الحيوان للإنسان عبر الغذاء (اللحوم غير المطبوخة جيدًا) والمياه والتربة. الاستخدام المفرط في المزارع يُسرّع المقاومة العالمية.',
      '"One Health" concept: resistant bacteria transfer from animals to humans via food (undercooked meat), water, and soil. Overuse in farms accelerates global resistance.',
      'Concept « One Health » : les bactéries résistantes passent des animaux à l\'homme via l\'alimentation, l\'eau et le sol. L\'abus en élevage accélère la résistance mondiale.',
      'Concepto "Una Salud": las bacterias resistentes pasan de animales a humanos a través de alimentos, agua y suelo. El abuso en ganadería acelera la resistencia global.'
    ),
  },
  {
    level: 'medium',
    q: o('من يمكن أن يُصاب بعدوى بكتيريا مقاومة؟', 'Who can get an infection with resistant bacteria?', 'Qui peut contracter une infection causée par une bactérie résistante ?', '¿Quién puede contraer una infección por bacterias resistentes?'),
    options: [
      o('كبار السن وضعاف المناعة فقط', 'Only the elderly and immunocompromised', 'Uniquement les personnes âgées et immunodéprimées', 'Solo los ancianos y los inmunodeprimidos'),
      o('أي شخص في أي عمر', 'Anyone at any age', 'N\'importe qui à n\'importe quel âge', 'Cualquier persona a cualquier edad'),
      o('من تناولوا مضادات حيوية فقط', 'Only people who have taken antibiotics', 'Uniquement ceux qui ont pris des antibiotiques', 'Solo quienes han tomado antibióticos'),
    ],
    answer: 1,
    why: o(
      'أي شخص معرّض — أطفال، شباب، رياضيون. بعض الأشخاص أكثر عرضة للمضاعفات الخطيرة (كبار السن، مرضى السكر، حاملو القسطرة)، لكن الإصابة ممكنة للجميع.',
      'Anyone is susceptible — children, young adults, athletes. Some are at higher risk for serious complications (elderly, diabetics, catheter users), but infection is possible for everyone.',
      'Tout le monde est exposé — enfants, jeunes, sportifs. Certains risquent des complications graves (âgés, diabétiques), mais l\'infection peut toucher n\'importe qui.',
      'Todos estamos expuestos — niños, jóvenes, deportistas. Algunos tienen mayor riesgo de complicaciones graves, pero la infección puede afectar a cualquiera.'
    ),
  },

  // ============ HARD (8 questions) ============
  {
    level: 'hard',
    q: o('أحد أفراد أسرتك لديه أعراض مشابهة لأعراضك وطلب من مضادك. ما الصحيح؟', 'A family member has similar symptoms and asks for some of your antibiotic. What is correct?', 'Un membre de la famille a des symptômes similaires et demande votre antibiotique. Que faire ?', 'Un familiar tiene síntomas similares y pide parte de tu antibiótico. ¿Qué es lo correcto?'),
    options: [
      o('أعطيه جزءًا لأن الأعراض متشابهة', 'Give them some since the symptoms are similar', 'Lui en donner car les symptômes se ressemblent', 'Darle parte porque los síntomas son similares'),
      o('لا، يجب أن يراجع الطبيب أو الصيدلي بنفسه', 'No — they must see a doctor or pharmacist themselves', 'Non — il doit consulter un médecin ou pharmacien lui-même', 'No — debe consultar a un médico o farmacéutico por su cuenta'),
      o('أعطيه إذا كان وزنه قريبًا من وزني', 'Give it if their weight is close to mine', 'Lui en donner si son poids est proche du mien', 'Dárselo si su peso es parecido al mío'),
    ],
    answer: 1,
    why: o(
      'حتى لو كانت الأعراض متطابقة، السبب قد يكون مختلفًا تمامًا. الوصفة تخص شخصًا واحدًا فقط بناءً على فحصه وتاريخه المرضي. المشاركة قد تضر الطرفين وتُسرّع المقاومة.',
      'Even with identical symptoms, the cause may be completely different. A prescription is for one specific person based on their examination and medical history. Sharing harms both parties and accelerates resistance.',
      'Même avec des symptômes identiques, la cause peut différer. Une ordonnance est strictement personnelle. Le partage nuit aux deux et accélère la résistance.',
      'Incluso con síntomas idénticos, la causa puede ser completamente diferente. Una receta es solo para una persona. Compartir perjudica a ambos y acelera la resistencia.'
    ),
  },
  {
    level: 'hard',
    q: o('قال الطبيب إن مرضك فيروسي. أنت تصر على مضاد حيوي. ما الأصح؟', 'Your doctor says your illness is viral. You insist on an antibiotic. What is best?', 'Le médecin dit que votre maladie est virale. Vous insistez pour un antibiotique. Que faire ?', 'El médico dice que tu enfermedad es viral. Insistes en un antibiótico. ¿Qué es lo mejor?'),
    options: [
      o('أصر على الحصول عليه، فلن يضر', 'Insist — it won\'t cause harm', 'Insister — cela ne peut pas faire de mal', 'Insistir — no puede hacer daño'),
      o('أقبل رأي الطبيب وأسأل عما يخفف الأعراض', 'Accept the doctor\'s view and ask how to ease symptoms', 'Accepter l\'avis médical et demander comment soulager les symptômes', 'Aceptar el criterio médico y preguntar cómo aliviar los síntomas'),
      o('أذهب لطبيب آخر حتى أحصل عليه', 'Go to another doctor until I get it', 'Consulter un autre médecin jusqu\'à en obtenir un', 'Ir a otro médico hasta obtenerlo'),
    ],
    answer: 1,
    why: o(
      'المضاد الحيوي في حالة فيروسية لن يُقصّر مدة المرض، لكنه سيقتل بكتيريا نافعة في جسمك ويُهيئ البيئة لنمو بكتيريا مقاومة، فضلًا عن الآثار الجانبية كالإسهال والغثيان.',
      'An antibiotic in a viral illness won\'t shorten your illness, but will kill your beneficial gut bacteria and create conditions for resistant bacteria — plus side effects like diarrhoea and nausea.',
      'Un antibiotique dans une maladie virale n\'accélère pas la guérison, mais tue les bonnes bactéries intestinales et favorise les résistances — plus des effets indésirables.',
      'Un antibiótico en una enfermedad viral no acorta la enfermedad, pero mata bacterias beneficiosas y crea condiciones para la resistencia, además de efectos adversos como diarrea.'
    ),
  },
  {
    level: 'hard',
    q: o('أي عبارة عن شراء المضاد الحيوي بدون وصفة هي الأصح؟', 'Which statement about getting an antibiotic without a prescription is most accurate?', 'Quelle affirmation sur l\'achat d\'un antibiotique sans ordonnance est la plus juste ?', '¿Qué afirmación sobre obtener un antibiótico sin receta es más precisa?'),
    options: [
      o('مقبول إذا كنت تعرف الدواء من تجربة سابقة', 'Acceptable if you know the drug from past experience', 'Acceptable si vous connaissez le médicament d\'une expérience passée', 'Aceptable si conoces el medicamento de una experiencia anterior'),
      o('استخدمه فقط عندما ينصح به مختص صحي', 'Use it only when a healthcare professional advises it', 'L\'utiliser uniquement sur prescription d\'un professionnel de santé', 'Usarlo solo cuando lo indique un profesional de la salud'),
      o('مقبول في عطلات نهاية الأسبوع', 'Acceptable on weekends', 'Acceptable le week-end', 'Aceptable los fines de semana'),
    ],
    answer: 1,
    why: o(
      'استخدام مضاد من تجربة سابقة خطير لأن: (1) قد تكون البكتيريا مختلفة أو مقاومة لنفس الدواء، (2) قد تطورت حالتك، (3) قد تكون طورت حساسية جديدة منذ المرة الأخيرة.',
      'Using an antibiotic from past experience is dangerous because: (1) bacteria may differ or be resistant to the same drug, (2) your condition may have changed, (3) you may have developed new allergies since last time.',
      'Utiliser un antibiotique d\'une expérience passée est risqué car : (1) les bactéries peuvent être différentes ou résistantes, (2) votre état a pu évoluer, (3) vous pouvez avoir développé de nouvelles allergies.',
      'Usar un antibiótico de experiencia pasada es peligroso porque: (1) las bacterias pueden ser diferentes o resistentes, (2) tu estado puede haber cambiado, (3) puedes haber desarrollado nuevas alergias.'
    ),
  },
  {
    level: 'hard',
    q: o('ما أخطر نتيجة للمقاومة البكتيرية على المستوى العالمي؟', 'What is the most dangerous global consequence of antibiotic resistance?', 'Quelle est la conséquence mondiale la plus dangereuse de l\'antibiorésistance ?', '¿Cuál es la consecuencia global más peligrosa de la resistencia a los antibióticos?'),
    options: [
      o('ارتفاع أسعار الأدوية', 'Rising medicine prices', 'Augmentation du prix des médicaments', 'Aumento de los precios de los medicamentos'),
      o('فشل علاجات الأمراض البكتيرية الشائعة والوفاة من عدوى كانت قابلة للعلاج', 'Failure to treat common bacterial infections, causing death from once-treatable infections', 'Échec de traiter des infections bactériennes communes, mort d\'infections autrefois traitables', 'Incapacidad de tratar infecciones bacterianas comunes, muerte por infecciones antes tratables'),
      o('زيادة الآثار الجانبية للأدوية', 'Increased drug side effects', 'Augmentation des effets secondaires des médicaments', 'Aumento de los efectos secundarios de los medicamentos'),
    ],
    answer: 1,
    why: o(
      'منظمة الصحة العالمية تُصنّف المقاومة البكتيرية من أخطر التهديدات الصحية العالمية. تقديرات 2050: قد تتجاوز وفيات المقاومة وفيات السرطان عالميًا! جراحات بسيطة كاستئصال الزائدة ستصبح مميتة بدون مضادات فعّالة.',
      'The WHO classifies antibiotic resistance as one of the greatest global health threats. By 2050, resistance deaths may surpass cancer deaths worldwide. Simple surgeries like appendectomy will become deadly without effective antibiotics.',
      'L\'OMS classe l\'antibiorésistance parmi les plus grandes menaces mondiales. D\'ici 2050, les décès pourraient dépasser ceux du cancer. Des chirurgies simples deviendront mortelles sans antibiotiques efficaces.',
      'La OMS clasifica la resistencia antibiótica como una de las mayores amenazas globales. Para 2050, las muertes pueden superar las del cáncer. Cirugías simples como la apendicectomía serán mortales sin antibióticos eficaces.'
    ),
  },
  {
    level: 'hard',
    q: o('لماذا يُعدّ التشخيص الدقيق مهمًا قبل وصف المضاد؟', 'Why is accurate diagnosis important before prescribing an antibiotic?', 'Pourquoi le diagnostic précis est-il important avant de prescrire un antibiotique ?', '¿Por qué el diagnóstico preciso es importante antes de prescribir un antibiótico?'),
    options: [
      o('لأنه روتين طبي فقط', 'Because it\'s just medical routine', 'Parce que c\'est juste une routine médicale', 'Porque es solo una rutina médica'),
      o('لأن كل بكتيريا تحتاج مضادًا مختلفًا، والتشخيص الخاطئ يؤدي لفشل العلاج', 'Because each bacterium needs a different antibiotic, and misdiagnosis leads to treatment failure', 'Parce que chaque bactérie nécessite un antibiotique différent — un mauvais diagnostic mène à l\'échec', 'Porque cada bacteria necesita un antibiótico diferente, y el diagnóstico incorrecto conduce al fracaso del tratamiento'),
      o('لتقليل تكلفة العلاج فقط', 'Only to reduce treatment cost', 'Uniquement pour réduire le coût du traitement', 'Solo para reducir el costo del tratamiento'),
    ],
    answer: 1,
    why: o(
      'مثال: أموكسيسيلين فعّال ضد بعض أنواع الستربتوكوكاس لكن لا يعمل ضد كلبسيلا أو سودوموناس. استخدام المضاد الخاطئ يُعرّض المريض للخطر ويُسرّع المقاومة للمضاد الصحيح.',
      'Example: amoxicillin works against some streptococci but fails against Klebsiella or Pseudomonas. Using the wrong antibiotic endangers the patient and accelerates resistance to the correct one.',
      'Exemple : l\'amoxicilline est efficace contre certains streptocoques mais pas contre Klebsiella ou Pseudomonas. L\'antibiotique inapproprié met le patient en danger et accélère la résistance.',
      'Ejemplo: la amoxicilina funciona contra algunos estreptococos pero falla contra Klebsiella o Pseudomonas. Usar el antibiótico incorrecto pone en peligro al paciente y acelera la resistencia.'
    ),
  },
  {
    level: 'hard',
    q: o('ما مفهوم «الرعاية الدوائية» (Antibiotic Stewardship)؟', 'What does "Antibiotic Stewardship" mean?', 'Que signifie le concept de « bon usage des antibiotiques » (Antibiotic Stewardship) ?', '¿Qué significa el concepto de «uso responsable de antibióticos» (Antibiotic Stewardship)?'),
    options: [
      o('توزيع المضادات مجانًا على المرضى', 'Distributing antibiotics free to patients', 'Distribution gratuite d\'antibiotiques aux patients', 'Distribución gratuita de antibióticos a los pacientes'),
      o('برامج لضمان استخدام المضادات بالجرعة الصحيحة للحالة الصحيحة للمدة الصحيحة', 'Programs to ensure antibiotics are used at the right dose, for the right condition, for the right duration', 'Programmes assurant l\'usage au bon antibiotique, à la bonne dose, pour la bonne durée', 'Programas para garantizar el uso del antibiótico correcto, a la dosis correcta, para la duración correcta'),
      o('إنتاج مضادات حيوية جديدة', 'Manufacturing new antibiotics', 'Fabrication de nouveaux antibiotiques', 'Fabricación de nuevos antibióticos'),
    ],
    answer: 1,
    why: o(
      'Antibiotic Stewardship هو برنامج طبي مؤسسي يهدف لتحسين نتائج المرضى وتقليل الآثار الجانبية وإبطاء المقاومة عبر ضمان الاستخدام الأمثل. يُطبَّق في المستشفيات والعيادات ويشمل الأطباء والصيادلة والممرضين.',
      'Antibiotic Stewardship is an institutional medical programme to improve patient outcomes, reduce side effects, and slow resistance by ensuring optimal use. Applied in hospitals and clinics, involving doctors, pharmacists, and nurses.',
      'C\'est un programme médical visant à améliorer les résultats patients, réduire les effets indésirables et freiner la résistance via un usage optimal. Implique médecins, pharmaciens et infirmiers.',
      'Es un programa médico para mejorar resultados, reducir efectos adversos y frenar la resistencia mediante uso óptimo. Se aplica en hospitales e involucra médicos, farmacéuticos y enfermeros.'
    ),
  },
  {
    level: 'hard',
    q: o('ما الفرق بين المضادات الحيوية «ذات الطيف الضيق» و«ذات الطيف الواسع»؟', 'What is the difference between "narrow-spectrum" and "broad-spectrum" antibiotics?', 'Quelle est la différence entre antibiotiques « à spectre étroit » et « à large spectre » ?', '¿Cuál es la diferencia entre antibióticos «de espectro estrecho» y «de amplio espectro»?'),
    options: [
      o('لا فرق، كلها تعمل بنفس الطريقة', 'No difference — they all work the same way', 'Aucune différence — ils agissent de la même façon', 'Sin diferencia — todos funcionan de la misma manera'),
      o('الطيف الضيق يستهدف أنواعًا محددة من البكتيريا، والواسع يستهدف أنواعًا كثيرة', 'Narrow-spectrum targets specific bacteria; broad-spectrum targets many types', 'Spectre étroit cible des bactéries spécifiques ; large spectre en cible plusieurs types', 'Espectro estrecho apunta a bacterias específicas; amplio espectro apunta a muchos tipos'),
      o('الطيف الواسع أقوى دائمًا والأفضل للاستخدام', 'Broad-spectrum is always stronger and better to use', 'Le large spectre est toujours plus puissant et préférable', 'El amplio espectro es siempre más fuerte y mejor para usar'),
    ],
    answer: 1,
    why: o(
      'الطيف الضيق (مثل البنسلين) يستهدف بكتيريا معينة ويحافظ على البكتيريا النافعة. الطيف الواسع (مثل الأموكسيسيلين-كلافولانات) يقتل أنواعًا كثيرة. الأطباء يفضلون الطيف الضيق متى أمكن للحفاظ على البكتيريا النافعة وتقليل المقاومة.',
      'Narrow-spectrum (e.g. penicillin) targets specific bacteria and preserves beneficial flora. Broad-spectrum (e.g. amoxicillin-clavulanate) kills many types. Doctors prefer narrow-spectrum when possible to preserve beneficial bacteria and reduce resistance.',
      'Spectre étroit (ex. pénicilline) cible des bactéries précises. Large spectre (ex. amoxicilline-clavulanate) en cible plusieurs. Les médecins préfèrent le spectre étroit pour préserver la flore et réduire la résistance.',
      'Espectro estrecho (ej. penicilina) apunta a bacterias específicas. Amplio espectro (ej. amoxicilina-clavulanato) a muchas. Los médicos prefieren espectro estrecho cuando es posible para preservar bacterias beneficiosas.'
    ),
  },
  {
    level: 'hard',
    q: o('لماذا تحتاج بعض الأمراض البكتيرية إلى «مزرعة» (culture) قبل وصف المضاد؟', 'Why do some bacterial infections need a "culture" test before prescribing an antibiotic?', 'Pourquoi certaines infections nécessitent-elles une « culture » avant de prescrire un antibiotique ?', '¿Por qué algunas infecciones bacterianas necesitan un «cultivo» antes de prescribir un antibiótico?'),
    options: [
      o('لمجرد الروتين والبيروقراطية', 'Just for routine bureaucracy', 'Pour la simple bureaucratie de routine', 'Solo por burocracia rutinaria'),
      o('لتحديد نوع البكتيريا وأي مضاد تستجيب له (antibiogram)', 'To identify the bacterium type and which antibiotic it responds to (antibiogram)', 'Pour identifier la bactérie et l\'antibiotique auquel elle est sensible (antibiogramme)', 'Para identificar la bacteria y a qué antibiótico responde (antibiograma)'),
      o('لأن المضادات لا تعمل بدونها', 'Because antibiotics don\'t work without it', 'Parce que les antibiotiques ne fonctionnent pas sans cela', 'Porque los antibióticos no funcionan sin ella'),
    ],
    answer: 1,
    why: o(
      'المزرعة + الـ Antibiogram يحددان بدقة: (1) نوع البكتيريا المسببة، (2) قائمة المضادات الفعّالة ضدها وتلك التي طورت مقاومة لها. هذا يضمن وصف المضاد الصحيح وليس مضادًا عشوائيًا قد تكون البكتيريا مقاومة له بالفعل.',
      'Culture + antibiogram precisely identify: (1) the causative bacterium type, (2) which antibiotics it\'s sensitive to and which it\'s already resistant to. This ensures the right antibiotic is prescribed, not a random one the bacteria may already resist.',
      'Culture + antibiogramme identifient : (1) la bactérie responsable, (2) les antibiotiques efficaces et ceux auxquels elle résiste déjà. Cela garantit la prescription du bon antibiotique.',
      'Cultivo + antibiograma identifican: (1) la bacteria causante, (2) qué antibióticos son eficaces y cuáles ya resiste. Esto garantiza prescribir el antibiótico correcto.'
    ),
  },
];

// Helper to get questions by level
export const getQuestionsByLevel = (level: 'easy' | 'medium' | 'hard'): Question[] =>
  QUESTIONS.filter((q) => q.level === level);
