import { Bi } from './types';

export interface AssessmentQuestion {
  id: string;
  domain: 'bacteria_vs_virus' | 'resistance_mechanism' | 'self_medication' | 'course_completion' | 'prevention';
  question: Bi;
  options: Bi[];
  correctAnswer: number;
  explanation: Bi;
}

export const PRE_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'pre_q1',
    domain: 'bacteria_vs_virus',
    question: {
      ar: 'هل يفيد تناول المضاد الحيوي في علاج نزلات البرد والإنفلونزا الحادة؟',
      en: 'Does taking an antibiotic help treat acute colds and influenza?'
    },
    options: [
      { ar: 'نعم، يقضي على جميع أنواع العدوى سريعاً', en: 'Yes, it clears all infections quickly' },
      { ar: 'لا، لأن نزلات البرد والإنفلونزا تسببها فيروسات والمضاد يهاجم البكتيريا فقط', en: 'No, because colds and flu are viral and antibiotics only kill bacteria' },
      { ar: 'نعم، ولكن فقط إذا تم تناوله بجرعة مضاعفة', en: 'Yes, but only if taken in double doses' },
      { ar: 'يفيد فقط في تخفيف ألم الحلق المصاحب للفيروس', en: 'It only helps reduce viral throat soreness' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'المضادات الحيوية مخصصة للعدوى البكتيرية فقط، ولا تؤثر إطلاقاً على الفيروسات المسببة للبرد والإنفلونزا.',
      en: 'Antibiotics target bacteria only and have no efficacy against viruses causing colds and flu.'
    }
  },
  {
    id: 'pre_q2',
    domain: 'resistance_mechanism',
    question: {
      ar: 'ما المقصود بـ "مقاومة المضادات الحيوية" علمياً؟',
      en: 'What does "antibiotic resistance" scientifically mean?'
    },
    options: [
      { ar: 'جسم الإنسان أصبح معتاداً على الدواء ومكتسباً مناعة ضده', en: 'The human body becomes used to the drug and immune to it' },
      { ar: 'البكتيريا طوّرت آليات دفاعية تجعل المضاد الحيوي غير قادر على قتلها', en: 'Bacteria developed defense mechanisms making antibiotics unable to kill them' },
      { ar: 'المريض يعاني من حساسية مفرطة وطفح جلدي عند تناول الدواء', en: 'The patient suffers from an allergic drug rash' },
      { ar: 'انتهاء صلاحية المادة الفعالة داخل العبوة الدوائية', en: 'The active ingredients expired inside the medication box' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'البكتيريا هي التي تطور المقاومة وتصبح قادرة على البقاء والتكاثر رغم وجود الدواء، وليس جسم المريض.',
      en: 'Bacteria adapt and survive drug exposure; human tissues do not become resistant.'
    }
  },
  {
    id: 'pre_q3',
    domain: 'self_medication',
    question: {
      ar: 'إذا شعرت بنفس أعراض مرض سابق، هل من الآمن استخدام بقايا مضاد حيوي في صيدلية المنزل دون استشارة؟',
      en: 'If you feel symptoms similar to a past illness, is it safe to use leftover antibiotics at home without a consult?'
    },
    options: [
      { ar: 'نعم، لتوفير الوقت وتفادي زيارة الطبيب', en: 'Yes, to save time and avoid clinic visits' },
      { ar: 'لا، لأن كل عدوى تتطلب تشخيصاً دقيقاً واختياراً محدداً للدواء وجرعته', en: 'No, because each infection requires accurate diagnosis and targeted therapy' },
      { ar: 'آمن فقط إذا لم يتغير لون الكبسولات أو رائحتها', en: 'Safe only if capsule appearance and smell have not changed' },
      { ar: 'آمن بشرط ألا تزيد مدة الاستخدام عن يومين', en: 'Safe provided use does not exceed two days' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'العلاج الذاتي ومشاركة بقايا الأدوية يؤديان لاختيار مضاد خاطئ أو جرعة غير كافية، مما يسرّع ظهور السلالات المقاومة.',
      en: 'Self-medicating with leftovers risks incorrect drug selection and sub-therapeutic dosing, accelerating resistance.'
    }
  },
  {
    id: 'pre_q4',
    domain: 'course_completion',
    question: {
      ar: 'ما التصرف الصحيح إذا شعرت بتحسن كامل واختفاء الحرارة بعد يومين من كورس مدته 7 أيام؟',
      en: 'What is the correct action if fever disappears after 2 days of a prescribed 7-day antibiotic course?'
    },
    options: [
      { ar: 'إيقاف الدواء فوراً لحماية الكبد والكلى من المواد الكيميائية', en: 'Stop the drug immediately to spare liver and kidney strain' },
      { ar: 'الاستمرار في إكمال الكورس كاملاً بحسب تعليمات الطبيب الموصوفة بدقة', en: 'Continue completing the full course exactly as instructed by the prescriber' },
      { ar: 'تقليل الجرعة إلى النصف حتى نهاية الأسبوع', en: 'Halve the dose until the end of the week' },
      { ar: 'حفظ باقي الأقراص في الثلاجة لاستعمالها في المرض القادم', en: 'Store remainder in the fridge for future illnesses' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'اختفاء الأعراض لا يعني القضاء التام على كل الميكروبات؛ فإيقاف العلاج مبكراً يسمح للبكتيريا الأقوى بالبقاء والتحور.',
      en: 'Symptom relief does not equal complete bacterial clearance; early stopping lets surviving microbes develop resistance.'
    }
  },
  {
    id: 'pre_q5',
    domain: 'prevention',
    question: {
      ar: 'كيف يسهم غسل اليدين بانتظام وتلقي اللقاحات المقررة في مكافحة مقاومة المضادات الحيوية؟',
      en: 'How do regular hand hygiene and scheduled immunizations combat antibiotic resistance?'
    },
    options: [
      { ar: 'لا توجد أي علاقة بين النظافة والمضادات الحيوية', en: 'There is no link between hygiene and antibiotics' },
      { ar: 'يمنعان حدوث العدوى من الأساس، مما يقلل الحاجة المسبقة لوصف وتناول المضادات', en: 'They prevent initial infection, directly cutting the clinical need for antibiotic prescriptions' },
      { ar: 'يجعلان المضاد الحيوي يعمل بسرعة مضاعفة داخل الدم', en: 'They cause antibiotics to act twice as fast in bloodstream' },
      { ar: 'يغنيان عن استشارة الطبيب عند الإصابة بأي مرض بكتيري', en: 'They eliminate the need for doctors during any bacterial illness' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'الوقاية من العدوى باللقاحات والنظافة الشخصية هي خط الدفاع الأول الذي يقلل انتشار الميكروبات المقاومة واستخدام الأدوية.',
      en: 'Infection prevention through hygiene and vaccines is the primary line of defense reducing AMR propagation.'
    }
  }
];

export const POST_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'post_q1',
    domain: 'bacteria_vs_virus',
    question: {
      ar: 'عندما يصاب شخص بالتهاب رئوي فيروسي أو نزلة شعبية فيروسية، ما الأثر المتوقع للمضاد الحيوي؟',
      en: 'When someone contracts viral bronchitis or viral pneumonia, what is the expected effect of an antibiotic?'
    },
    options: [
      { ar: 'يقضي على الفيروس المسبب ويشفي المريض في ساعات', en: 'Eliminates the viral cause and cures the patient within hours' },
      { ar: 'لا يقضي على الفيروس، بل يعرض المريض لأعراض جانبية ويزيد فرص المقاومة دون فائدة', en: 'Has zero viral activity, risks side effects, and breeds resistance without therapeutic benefit' },
      { ar: 'يمنع انتقال العدوى الفيروسية للمخالطين في المنزل', en: 'Prevents transmission of viral particles to household members' },
      { ar: 'يخفض الحرارة بشكل أسرع من خافضات الحرارة المعتادة', en: 'Lowers fever faster than conventional antipyretics' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'المضاد الحيوي عديم الفعالية ضد الفيروسات؛ واستخدامه معها يعرّض المريض لآثار جانبية غير مبررة ويزيد خطر المقاومة.',
      en: 'Antibiotics are completely inactive against viral pathogens and expose patients to unnecessary risks and resistance.'
    }
  },
  {
    id: 'post_q2',
    domain: 'resistance_mechanism',
    question: {
      ar: 'إذا فقد مضاد حيوي فعاليته تماماً في القضاء على عدوى معينة، فما الحقيقة العلمية التي حدثت؟',
      en: 'If an antibiotic completely loses its efficacy against an infection, what scientific fact occurred?'
    },
    options: [
      { ar: 'خلايا المريض أصبحت محصنة ضد الدواء', en: 'The patient cells became immune against the drug' },
      { ar: 'سلالة البكتيريا طورت دروعاً وإنزيمات تعطّل الدواء وتنقله لبكتيريا أخرى', en: 'The bacterial strain developed defense enzymes neutralizing the drug and propagating traits' },
      { ar: 'المريض تناول طعاماً قلل مفعول الدواء دائماً', en: 'The patient ingested food permanently neutralizing the medicine' },
      { ar: 'مناعة المريض الطبيعية توقفت عن العمل تماماً', en: 'The patient natural immune system stopped functioning completely' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'المقاومة خاصية بكتيرية جينية؛ فالبكتيريا هي التي تكتسب جينات المقاومة وتفرز إنزيمات مبطلة للمضاد.',
      en: 'Resistance is a genetic bacterial phenomenon; the microbes evolve defenses neutralizing the antibiotic.'
    }
  },
  {
    id: 'post_q3',
    domain: 'self_medication',
    question: {
      ar: 'أوصى أحد الأقارب بتناول دواء مضاد حيوي متبقٍ لديه لعلاج احتقان الحلق لديك. ما هو الإجراء السليم القائم على الأدلة؟',
      en: 'A relative recommends taking their leftover antibiotic for your sore throat. What is the evidence-based action?'
    },
    options: [
      { ar: 'أخذه فوراً إذا كان تاريخ الصلاحية سارياً', en: 'Take it immediately if expiration date is valid' },
      { ar: 'الاعتذار واستشارة طبيب أو صيدلي لتحديد سبب الاحتقان أولاً وتجنب العلاج العشوائي', en: 'Decline and consult a healthcare professional to identify the etiology and avoid haphazard use' },
      { ar: 'تناول حبة واحدة للتجربة وملاحظة التحسن', en: 'Take a single test tablet and monitor relief' },
      { ar: 'تخفيف الجرعة عن طريق إذابة الكبسولة في الماء', en: 'Dilute the dosage by dissolving the capsule in water' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'أغلب حالات احتقان الحلق فيروسية لا تحتاج مضاداً، ومشاركة الأدوية ممارسة خطيرة تساهم في تفشي المقاومة الدوائية.',
      en: 'Most pharyngitis cases are viral; sharing prescription antibiotics is dangerous and drives microbial resistance.'
    }
  },
  {
    id: 'post_q4',
    domain: 'course_completion',
    question: {
      ar: 'لماذا يشدد الأطباء والصيادلة على استكمال كامل الجرعات المقررة للمضاد الحيوي حتى لو استعاد المريض نشاطه؟',
      en: 'Why do doctors and pharmacists insist on completing the full prescribed antibiotic course even after recovery?'
    },
    options: [
      { ar: 'فقط لزيادة مبيعات شركات الأدوية واستنفاد العلبة', en: 'Merely to finish the purchased medicine pack' },
      { ar: 'لضمان القضاء على أدق بقايا البكتيريا ومنع تكاثر الطفرات الأقوى المقاومة', en: 'To eradicate lingering bacterial sub-populations and prevent the multiplication of resistant mutants' },
      { ar: 'لأن التوقف المفاجئ يسبب الإدمان الدوائي', en: 'Because sudden cessation causes medication dependence' },
      { ar: 'حتى لا يفسد الدواء المتبقي في الصيدلية المنزلية', en: 'So that leftover drugs do not degrade at home' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'الاستمرار لكامل المدة المحددة يضمن استئصال البكتيريا الأشد ضراوة ويمنع عودة العدوى بشكل أشرس وأكثر مقاومة.',
      en: 'Completing the prescribed regimen eradicates the most resilient bacteria, preventing recurrent, refractory infections.'
    }
  },
  {
    id: 'post_q5',
    domain: 'prevention',
    question: {
      ar: 'ما الرابط المباشر بين الالتزام بجدول التطعيمات الموصى به وتقليل انتشار الميكروبات المقاومة للأدوية؟',
      en: 'What is the direct link between adherence to vaccination schedules and reducing drug-resistant microbes?'
    },
    options: [
      { ar: 'اللقاحات تحتوي على مضادات حيوية طبيعية تفرز في الدم', en: 'Vaccines contain natural antibiotics secreted into blood' },
      { ar: 'اللقاح يقي من الإصابة بالعدوى الأولية، مما يقلل استخدام المضادات ويمنع خلق بيئة محفزة للمقاومة', en: 'Vaccines prevent initial infections, minimizing antibiotic prescriptions and hostile selective pressure' },
      { ar: 'اللقاح يعالج الحساسية الدوائية الناتجة عن البنسلين', en: 'Vaccines treat penicillin-induced drug hypersensitivity' },
      { ar: 'اللقاح يمنح مناعة ضد التسمم الدوائي فقط', en: 'Vaccines only confer immunity against drug intoxication' }
    ],
    correctAnswer: 1,
    explanation: {
      ar: 'التطعيمات تمنع حدوث الأمراض البكتيرية والفيروسية، مما يحمي المجتمع من الاستهلاك المفرط للمضادات الحيوية.',
      en: 'Vaccines avert bacterial and viral diseases, significantly lowering population-level antibiotic exposure.'
    }
  }
];
