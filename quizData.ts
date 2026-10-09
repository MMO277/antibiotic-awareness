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
];
