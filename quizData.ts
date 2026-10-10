import { Bi } from './types';

export interface Question {
  q: Bi;
  options: Bi[];
  answer: number; // index of the correct option
  why: Bi;
}

const o = (ar: string, en: string): Bi => ({ ar, en });

/** General knowledge questions. Have a qualified reviewer confirm them (and the ethics board confirm the research instrument). */
export const QUESTIONS: Question[] = [
  {
    q: o('المضادات الحيوية فعّالة ضد:', 'Antibiotics are effective against:'),
    options: [
      o('العدوى البكتيرية', 'Bacterial infections'),
      o('العدوى الفيروسية مثل الإنفلونزا', 'Viral infections such as influenza'),
      o('البكتيريا والفيروسات معًا', 'Both bacteria and viruses'),
    ],
    answer: 0,
    why: o('المضادات الحيوية تعمل ضد البكتيريا فقط ولا تعالج الفيروسات.', 'Antibiotics work against bacteria only; they do not treat viruses.'),
  },
  {
    q: o('ماذا تعني «مقاومة المضادات الحيوية»؟', 'What does “antibiotic resistance” mean?'),
    options: [
      o('جسم الإنسان يعتاد على الدواء', 'The human body gets used to the medicine'),
      o('البكتيريا تتغيّر فلا يعود الدواء فعّالًا ضدها', 'Bacteria change so the medicine no longer works well against them'),
      o('المضاد الحيوي يسبب حساسية', 'The antibiotic causes an allergy'),
    ],
    answer: 1,
    why: o('البكتيريا هي التي تصبح مقاومة وليس جسم الإنسان.', 'It is the bacteria that become resistant, not the person’s body.'),
  },
  {
    q: o('لديك بقايا مضاد حيوي من مرض سابق وظهرت أعراض جديدة. ما الأنسب؟', 'You have leftover antibiotics from a past illness and new symptoms. What is best?'),
    options: [
      o('تناول البقايا', 'Take the leftovers'),
      o('مراجعة الطبيب أو الصيدلي', 'Ask a doctor or pharmacist'),
      o('إعطاؤها لصديق لديه أعراض مشابهة', 'Give them to a friend with similar symptoms'),
    ],
    answer: 1,
    why: o('قد لا يناسب الدواء الحالة الجديدة، وقد يضر. القرار للمختص.', 'The medicine may not suit the new problem and may cause harm. A professional should decide.'),
  },
  {
    q: o('شعرت بتحسّن بعد يومين من مضاد حيوي موصوف لك. ما الصحيح؟', 'You feel better after two days of a prescribed antibiotic. What is correct?'),
    options: [
      o('أتوقف فورًا من تلقاء نفسي', 'Stop right away on my own'),
      o('أتبع تعليمات من وصف الدواء، وأسأله أو أسأل الصيدلي إن كنت غير متأكد', 'Follow the prescriber’s instructions, and ask them or the pharmacist if unsure'),
      o('أضاعف الجرعة', 'Double the dose'),
    ],
    answer: 1,
    why: o('لا تغيّر الجرعة أو المدة من تلقاء نفسك؛ استشر من وصف الدواء.', 'Do not change the dose or duration on your own; check with whoever prescribed it.'),
  },
  {
    q: o('أي علامة بعد تناول مضاد حيوي تستدعي مساعدة طبية عاجلة؟', 'Which sign after taking an antibiotic needs urgent medical help?'),
    options: [
      o('اضطراب بسيط في المعدة', 'Mild stomach upset'),
      o('تورّم الوجه أو الشفتين مع صعوبة في التنفس', 'Swelling of the face or lips with difficulty breathing'),
      o('تغيّر طفيف في الطعم', 'A slight change in taste'),
    ],
    answer: 1,
    why: o('قد تكون علامات تحسس شديد وتحتاج إسعافًا فوريًا.', 'These may be signs of a severe allergic reaction and need emergency care.'),
  },
  {
    q: o('أي سلوك يساعد على الحد من انتشار المقاومة؟', 'Which behaviour helps reduce the spread of resistance?'),
    options: [
      o('استخدام المضاد فقط عند وصفه وكما هو موصوف', 'Using antibiotics only when prescribed and exactly as directed'),
      o('طلب مضاد حيوي لكل نزلة برد', 'Asking for an antibiotic for every cold'),
      o('مشاركة المضاد مع أفراد الأسرة', 'Sharing antibiotics with family members'),
    ],
    answer: 0,
    why: o('الاستخدام الصحيح فقط عند الحاجة يحمي فعالية هذه الأدوية.', 'Correct use only when needed protects how well these medicines work.'),
  },
  {
    q: o('أي مما يلي يساعد على الوقاية من العدوى وتقليل الحاجة إلى المضادات الحيوية؟', 'Which of these helps prevent infections and reduce the need for antibiotics?'),
    options: [
      o('غسل اليدين والتطعيمات الموصى بها', 'Hand washing and recommended vaccinations'),
      o('تناول مضاد حيوي «احتياطًا» دون حاجة', 'Taking an antibiotic “just in case”'),
      o('مشاركة الأدوية مع الأسرة', 'Sharing medicines with family'),
    ],
    answer: 0,
    why: o('الوقاية من العدوى تقلل الحاجة إلى المضادات الحيوية.', 'Preventing infections reduces the need for antibiotics.'),
  },
  {
    q: o('البكتيريا المقاومة للمضادات يمكن أن تنتقل من شخص إلى آخر.', 'Resistant bacteria can spread from one person to another.'),
    options: [o('صحيح', 'True'), o('خطأ', 'False')],
    answer: 0,
    why: o('قد تنتقل البكتيريا المقاومة بين الأشخاص وفي المجتمع، لذلك المقاومة تهم الجميع.', 'Resistant bacteria can spread between people and communities, so resistance concerns everyone.'),
  },
  {
    q: o('نسيت جرعة من مضاد حيوي موصوف لك. ما الأنسب؟', 'You missed a dose of a prescribed antibiotic. What is best?'),
    options: [
      o('أضاعف الجرعة التالية', 'Double the next dose'),
      o('أتبع تعليمات النشرة أو أسأل الصيدلي، ولا أضاعف الجرعة', 'Follow the leaflet or ask the pharmacist, and never double the dose'),
      o('أوقف العلاج نهائيًا', 'Stop the treatment completely'),
    ],
    answer: 1,
    why: o('لا تُضاعَف الجرعة لتعويض ما فات. اسأل الصيدلي أو راجع النشرة.', 'Do not double a dose to make up for a missed one. Ask the pharmacist or check the leaflet.'),
  },
  {
    q: o('من يقرر أنسب مضاد حيوي لحالتك؟', 'Who should decide which antibiotic suits your illness?'),
    options: [
      o('صديق استخدمه من قبل', 'A friend who used one before'),
      o('طبيب أو مختص مؤهل بعد تقييم الحالة', 'A doctor or qualified clinician after assessing you'),
      o('معلومات عشوائية من الإنترنت', 'Random information from the internet'),
    ],
    answer: 1,
    why: o('اختيار الدواء يتطلب تقييمًا طبيًا وقد يحتاج إلى فحوصات.', 'Choosing a medicine needs a clinical assessment and sometimes tests.'),
  },
  {
    q: o('لماذا نخبر الطبيب أو الصيدلي بأي حساسية سابقة من الأدوية؟', 'Why tell the doctor or pharmacist about any past medicine allergy?'),
    options: [
      o('لتجنّب وصف دواء قد يسبب تفاعلًا تحسسيًا', 'To avoid giving a medicine that may cause an allergic reaction'),
      o('لأن الأمر غير مهم', 'Because it does not matter'),
      o('فقط عند أخذ الحقن', 'Only when taking injections'),
    ],
    answer: 0,
    why: o('معرفة الحساسية تساعد على اختيار دواء أكثر أمانًا لك.', 'Knowing about allergies helps choose a safer medicine for you.'),
  },
  {
    q: o('مقاومة المضادات الحيوية تؤثر فقط على الشخص الذي تناول المضاد.', 'Antibiotic resistance only affects the person who took the antibiotic.'),
    options: [o('صحيح', 'True'), o('خطأ', 'False')],
    answer: 1,
    why: o('قد تنتشر البكتيريا المقاومة إلى الآخرين، فتؤثر على الأسرة والمجتمع.', 'Resistant bacteria can spread to others, affecting family and community.'),
  },
  {
    q: o('استخدام المضادات الحيوية دون حاجة قد:', 'Using antibiotics when they are not needed can:'),
    options: [
      o('يزيد خطر الإصابة لاحقًا بعدوى تقاوم المضادات', 'Raise your risk of a later infection that resists antibiotics'),
      o('يمنحك مناعة دائمة', 'Give you lasting immunity'),
      o('يقوّي جهاز المناعة', 'Strengthen your immune system'),
    ],
    answer: 0,
    why: o('الاستخدام غير الضروري يعطي البكتيريا فرصة لتصبح مقاومة.', 'Unnecessary use gives bacteria a chance to become resistant.'),
  },
  {
    q: o('ظهر إسهال مائي شديد أو دموي أثناء العلاج بمضاد حيوي أو بعده بأسابيع. ما الأنسب؟', 'Severe watery or bloody diarrhoea appears during or weeks after an antibiotic. What is best?'),
    options: [
      o('تجاهله', 'Ignore it'),
      o('الاتصال بالطبيب سريعًا', 'Contact a doctor promptly'),
      o('تناول بقايا مضاد حيوي قديم', 'Take an old leftover antibiotic'),
    ],
    answer: 1,
    why: o('قد يدل على مضاعفات تحتاج تقييمًا طبيًا.', 'It may signal a complication that needs medical assessment.'),
  },
];
