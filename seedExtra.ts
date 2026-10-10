import type { SeedItem } from './seedData';
import type { Bi, Brand, Source } from './types';

/**
 * Additional common antibiotics (update 6). Same structure and level of detail as the first records
 * (amoxicillin, amoxicillin/clavulanic acid, azithromycin): every one of the 14 text fields is filled in
 * Arabic and English, with brands and an official source.
 * Each record is written in the app author's own words from ONE official MedlinePlus patient page
 * that was opened and read on the "accessed" date. All are saved as DRAFT: nothing is approved until a
 * qualified reviewer checks it. The Arabic text is an AI translation and must be checked.
 * Milligram doses, strengths and age limits that the page does not state are left out on purpose.
 */
const b = (en: string, ar: string): Bi => ({ en, ar });
const NOTE =
  '[STARTER] Summarised in own words from the MedlinePlus patient page (read on the accessed date). Arabic is an AI translation: needs review. Milligram doses, strengths and age limits are NOT in this source and must be added from the official label. NOT yet reviewed by a clinician.';
const NOTE_BRANDS =
  ' Brand names listed are the US names shown on the source page; add local (Egyptian) brands, manufacturers and barcodes only from an official local source.';
const ACCESSED = '2026-10-10';
const PUBLISHER = 'National Library of Medicine (MedlinePlus); content from ASHP AHFS Patient Medication Information';
const src = (name: string, id: string, updated: string): Source => ({
  title: `${name}: MedlinePlus Drug Information`,
  url: `https://medlineplus.gov/druginfo/meds/${id}.html`,
  publisher: PUBLISHER,
  updated,
  accessed: ACCESSED,
});
const brand = (id: string, name: string): Brand => ({
  name, manufacturer: '', barcode: '', verified: true, sourceUrl: `https://medlineplus.gov/druginfo/meds/${id}.html`,
});

const STR_EN = 'Strengths (mg) are not given in this source: add them from the official label.';
const STR_AR = 'لا يذكر المصدر التراكيز (ملغ): تُضاف من النشرة الرسمية للدواء.';
const USES_NOTE_EN = '\n(Summary of a US patient-information page: uses approved in your country may differ.)';
const USES_NOTE_AR = '\n(ملخص لصفحة معلومات مرضى أمريكية: قد تختلف الاستخدامات المعتمدة في بلدك.)';
const CONTRA_TAIL_EN = '\n(Patient-information summary, not a complete list of contraindications: see the official label.)';
const CONTRA_TAIL_AR = '\n(ملخص لمعلومات المرضى وليس قائمة كاملة بموانع الاستعمال: راجع النشرة الرسمية.)';
const DOSE_TAIL_EN = '\nThis source does not list milligram doses. The exact dose is decided by the doctor or pharmacist for each person.';
const DOSE_TAIL_AR = '\nلا يذكر المصدر جرعات بالملغ. يحدد الطبيب أو الصيدلي الجرعة الدقيقة لكل شخص.';
const INTERACT_GEN_EN = 'Tell your doctor and pharmacist about every prescription and non-prescription medicine, vitamin, supplement and herbal product you take or plan to take; doses may need to be changed or you may need closer monitoring.';
const INTERACT_GEN_AR = 'أخبر الطبيب والصيدلي بكل دواء بوصفة أو بدونها وبكل فيتامين ومكمل وعشب تتناوله أو تنوي تناوله؛ فقد تحتاج الجرعات إلى تعديل أو متابعة أدق.';
const INTERACT_TAIL_EN = '\nDrug-by-drug interactions are not listed in this source.';
const INTERACT_TAIL_AR = '\nلا يذكر المصدر التداخلات دواءً بدواء.';
const EDU_TAIL_EN =
  '\n• Do not flush medicine down the toilet: use a take-back program. Keep it out of reach of children.\n• Do not let anyone else take your medicine. Antibiotics do not work for colds and flu, and using them when not needed raises the risk of a later infection that resists antibiotics.\n• Keep your appointments and lab tests, and carry a written list of all your medicines.';
const EDU_TAIL_AR =
  '\n• لا تتخلص من الدواء بالمرحاض: استخدم برنامج استرجاع الأدوية. واحفظه بعيدًا عن متناول الأطفال.\n• لا تسمح لأحد بتناول دوائك. المضادات الحيوية لا تنفع في نزلات البرد والإنفلونزا، واستخدامها دون حاجة يزيد خطر عدوى لاحقة تقاوم المضادات.\n• التزم بمواعيدك وتحاليلك واحمل قائمة مكتوبة بكل أدويتك.';

const CEFIXIME: SeedItem = {
  id: 'cefixime',
  fields: {
    genericName: b('Cefixime', 'سيفيكسيم'),
    activeIngredients: b('Cefixime', 'سيفيكسيم'),
    drugClass: b('Cephalosporin antibiotic, 3rd generation (works by killing bacteria)', 'مضاد حيوي من السيفالوسبورينات، الجيل الثالث (يقتل البكتيريا)'),
    mechanism: b(
      'As stated by the source: it works by killing bacteria. The detailed molecular mechanism is not described in this patient-information source: add it from the official drug label.',
      'كما يذكر المصدر: يعمل عن طريق قتل البكتيريا. لا تُشرح الآلية الجزيئية التفصيلية في هذا المصدر الموجّه للمرضى: تُضاف من النشرة الرسمية للدواء.',
    ),
    strengths: b(
      `Forms: tablet, chewable tablet, capsule, and suspension (liquid) taken by mouth. Different cefixime products are absorbed differently and cannot be swapped for one another. ${STR_EN}`,
      `الأشكال: قرص وقرص للمضغ وكبسولة ومعلّق سائل يُؤخذ بالفم. تُمتص منتجات سيفيكسيم المختلفة بطرق مختلفة ولا يجوز استبدال أحدها بالآخر. ${STR_AR}`,
    ),
    approvedUses: b(
      `Treats certain infections caused by bacteria. Sometimes it is also used for sinus infections in people who are allergic to penicillin, for pneumonia, for shigella and salmonella (infections that cause severe diarrhea) and for typhoid fever. When used for gonorrhea it may be given as a single dose. It does not work for colds, flu, or other viral infections.${USES_NOTE_EN}`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا. ويُستخدم أحيانًا لالتهاب الجيوب عند من لديهم حساسية من البنسلين، وللالتهاب الرئوي، وللشيغيلا والسالمونيلا (عدوى تسبب إسهالًا شديدًا) وللحمى التيفية. وعند استخدامه للسيلان قد يُعطى بجرعة واحدة. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.${USES_NOTE_AR}`,
    ),
    ageRestrictions: b(
      'This source page does not state an age limit. It describes chewable tablets and a liquid suspension. Check the official label for age-specific information.',
      'لا تذكر صفحة المصدر حدًّا للعمر. وتذكر أقراص المضغ والمعلّق السائل. راجع النشرة الرسمية لمعلومات العمر.',
    ),
    dosingReference: b(
      `Usually taken every 12 or 24 hours, with or without food, at about the same times every day, exactly as directed (not more, not less, not more often). Chew the chewable tablets completely before swallowing (they may be crushed if chewing is difficult). Shake the suspension well before each use. Tablets have a line in the middle: if the doctor says to take half a tablet, break it carefully on the line and save the other half for the next dose. If you switch from one cefixime product to another, the doctor may need to adjust the dose.${DOSE_TAIL_EN}`,
      `يُؤخذ عادة كل 12 أو 24 ساعة، مع الطعام أو بدونه، في أوقات متقاربة كل يوم وتمامًا كما وُصف (لا أكثر ولا أقل ولا بوتيرة أكبر). امضغ أقراص المضغ جيدًا قبل البلع (ويمكن سحقها إذا صعب المضغ). رُجّ المعلّق جيدًا قبل كل استخدام. في منتصف القرص خط: إذا طلب الطبيب نصف قرص فاكسره بحذر على الخط واحتفظ بالنصف الآخر للجرعة التالية. وعند التحويل من منتج سيفيكسيم إلى آخر قد يحتاج الطبيب إلى تعديل الجرعة.${DOSE_TAIL_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it, to any part of it, or to any other medicine, food, or substance (say what symptoms you had); have or have had a stomach or intestinal (gastrointestinal) disease, especially colitis (swelling of the lining of the colon); have or have had kidney or liver disease; or have phenylketonuria (PKU), because the chewable tablets are sweetened with aspartame, which forms phenylalanine. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي مكوّن فيه أو من أي دواء أو غذاء أو مادة أخرى (واذكر الأعراض التي ظهرت)؛ أو لديك أو كان لديك مرض في المعدة أو الأمعاء، خاصة التهاب القولون (تورم بطانة القولون)؛ أو لديك أو كان لديك مرض في الكلى أو الكبد؛ أو لديك بيلة الفينيل كيتون (PKU) لأن أقراص المضغ محلّاة بالأسبارتام الذي يتحول إلى فينيل ألانين. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): diarrhea, nausea, vomiting, stomach pain, gas, heartburn.\nSerious (call your doctor immediately or get emergency care): watery or bloody stools, stomach cramps or fever, during treatment or for up to two or more months after stopping; rash, itching, hives, difficulty breathing or swallowing, wheezing, or swelling of the face, throat, tongue, lips or eyes; a return of sore throat, fever, chills or other signs of infection.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): إسهال وغثيان وقيء وألم في المعدة وغازات وحرقة.\nالخطيرة (اتصل بالطبيب فورًا أو اطلب الطوارئ): براز مائي أو دموي أو تقلصات في المعدة أو حمى أثناء العلاج أو حتى شهرين أو أكثر بعد التوقف؛ طفح أو حكة أو شرى أو صعوبة في التنفس أو البلع أو أزيز أو تورم الوجه أو الحلق أو اللسان أو الشفتين أو العينين؛ عودة التهاب الحلق أو الحمى أو القشعريرة أو علامات عدوى أخرى.`,
    ),
    interactions: b(
      `${INTERACT_GEN_EN}\nIt may make hormonal contraceptives (pills, patches, rings, injections) less effective: use another method of birth control while taking it and ask your doctor.\nIf you have diabetes and test your urine for sugar, use Clinistix or TesTape, not Clinitest, while taking it.${INTERACT_TAIL_EN}`,
      `${INTERACT_GEN_AR}\nقد يقلل فعالية وسائل منع الحمل الهرمونية (الحبوب واللصقات والحلقات والحقن): استخدم وسيلة أخرى لمنع الحمل أثناء تناوله واسأل الطبيب.\nإذا كنت مصابًا بالسكري وتفحص السكر في البول فاستخدم Clinistix أو TesTape وليس Clinitest أثناء تناوله.${INTERACT_TAIL_AR}`,
    ),
    pregnancyBreastfeeding: b(
      'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor. It may also make hormonal birth control less effective.',
      'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حملتِ أثناء تناوله فاتصلي بالطبيب. وقد يقلل أيضًا فعالية وسائل منع الحمل الهرمونية.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have or have ever had kidney or liver disease. This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى أو الكبد. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `• Take it exactly as directed at about the same times every day, and finish the prescription even if you feel better. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor.\n• Shake the liquid well before each use. Chew chewable tablets completely.\n• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.\n• Keep your normal diet unless your doctor says otherwise.\n• Storage: keep it in its container, tightly closed. Tablets, chewable tablets and capsules go at room temperature, away from heat and moisture (not in the bathroom). The liquid may be kept at room temperature or in the refrigerator; throw away unused liquid after 14 days.\n• If you still have symptoms of infection after finishing it, call your doctor.${EDU_TAIL_EN}`,
      `• تناوله تمامًا كما وُصف في أوقات متقاربة كل يوم وأكمل الوصفة حتى لو شعرت بتحسن. فالتوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• يُتوقع أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب.\n• رُجّ السائل جيدًا قبل كل استخدام. وامضغ أقراص المضغ جيدًا.\n• نسيان جرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.\n• التخزين: احفظه في عبوته محكمة الإغلاق. تُحفظ الأقراص وأقراص المضغ والكبسولات في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام). ويمكن حفظ السائل في درجة حرارة الغرفة أو في الثلاجة؛ وتخلّص من السائل غير المستخدم بعد 14 يومًا.\n• إذا استمرت أعراض العدوى بعد إنهائه فاتصل بالطبيب.${EDU_TAIL_AR}`,
    ),
  },
  brands: [brand('a690007', 'Suprax')],
  sources: [src('Cefixime', 'a690007', '2026-07-15')],
  notes: NOTE + NOTE_BRANDS,
};

const LEVOFLOXACIN: SeedItem = {
  id: 'levofloxacin',
  fields: {
    genericName: b('Levofloxacin', 'ليفوفلوكساسين'),
    activeIngredients: b('Levofloxacin', 'ليفوفلوكساسين'),
    drugClass: b('Fluoroquinolone antibiotic (works by killing bacteria)', 'مضاد حيوي من فئة الفلوروكينولونات (يقتل البكتيريا)'),
    mechanism: b(
      'As stated by the source: it works by killing the bacteria that cause infections. The detailed molecular mechanism is not described in this patient-information source: add it from the official drug label.',
      'كما يذكر المصدر: يعمل عن طريق قتل البكتيريا المسببة للعدوى. لا تُشرح الآلية الجزيئية التفصيلية في هذا المصدر الموجّه للمرضى: تُضاف من النشرة الرسمية للدواء.',
    ),
    strengths: b(
      `Forms: tablet and solution (liquid) taken by mouth. ${STR_EN}`,
      `الأشكال: قرص ومحلول سائل يُؤخذ بالفم. ${STR_AR}`,
    ),
    approvedUses: b(
      `Treats certain infections caused by bacteria. It is also used to prevent anthrax in people who may have breathed in anthrax germs, and to treat and prevent plague. Sometimes it is used to prevent or treat traveler's diarrhea. It does not work for colds, flu, or other viral infections.${USES_NOTE_EN}`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا، وللوقاية من الجمرة الخبيثة عند من ربما استنشقوا جراثيمها، ولعلاج الطاعون والوقاية منه. ويُستخدم أحيانًا للوقاية من إسهال المسافرين أو علاجه. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.${USES_NOTE_AR}`,
    ),
    ageRestrictions: b(
      'The source says it should not normally be given to children and teens under 18 because it can cause bone, joint and joint-tissue problems, except for plague or exposure to plague or anthrax in the air. The risk of tendon problems is highest in people over 60. If a child is prescribed it, tell the doctor about any past joint problems and call the doctor if the child has joint pain or swelling.',
      'يذكر المصدر أنه لا يُعطى عادة للأطفال والمراهقين دون 18 سنة لأنه قد يسبب مشكلات في العظام والمفاصل وأنسجتها، إلا في حالات الطاعون أو التعرض للطاعون أو للجمرة الخبيثة المحمولة بالهواء. وخطر مشكلات الأوتار أعلى عند من تجاوزوا 60 عامًا. وإذا وُصف لطفل فأخبر الطبيب بأي مشكلات سابقة في المفاصل واتصل به إذا ظهر ألم أو تورم في مفاصل الطفل.',
    ),
    dosingReference: b(
      `Taken by mouth every 24 to 48 hours, for the length of time the doctor says (it depends on the infection), at about the same time of day. The tablet may be taken with or without food. The liquid solution is taken 1 hour before or 2 hours after eating. Take it exactly as directed (not more, not less, not more often). Finish the prescription even if you feel better; do not stop without talking to your doctor unless you get one of the serious side effects listed.${DOSE_TAIL_EN}`,
      `يُؤخذ بالفم كل 24 إلى 48 ساعة، للمدة التي يحددها الطبيب (وتعتمد على نوع العدوى)، في نفس الوقت تقريبًا من اليوم. يمكن تناول القرص مع الطعام أو بدونه. ويُؤخذ المحلول السائل قبل الأكل بساعة أو بعده بساعتين. تناوله تمامًا كما وُصف (لا أكثر ولا أقل ولا بوتيرة أكبر). وأكمل الوصفة حتى لو شعرت بتحسن؛ ولا تتوقف دون استشارة الطبيب إلا إذا ظهرت إحدى الآثار الجانبية الخطيرة المذكورة.${DOSE_TAIL_AR}`,
    ),
    contraindications: b(
      `The source starts with an IMPORTANT WARNING about tendon damage, nerve damage, effects on the brain and nervous system, and worsening muscle weakness.\nTell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; have or have had a kidney, heart or lung transplant, kidney disease, a joint or tendon disorder such as rheumatoid arthritis, or take steroids such as dexamethasone, methylprednisolone or prednisone; have had nerve damage (peripheral neuropathy), seizures, epilepsy, stroke, narrowed brain blood vessels or changed brain structure; have myasthenia gravis (the doctor may tell you not to take it); or have or have a family history of a prolonged QT interval, a slow or irregular heartbeat, a recent heart attack, aortic aneurysm, high blood pressure, poor circulation, Marfan or Ehlers-Danlos syndrome, low potassium or magnesium, diabetes or low blood sugar, or liver disease. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `يبدأ المصدر بتحذير مهم عن تلف الأوتار وتلف الأعصاب والتأثير على الدماغ والجهاز العصبي وتفاقم الضعف العضلي.\nأخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو لديك أو كان لديك زرع كلية أو قلب أو رئة أو مرض في الكلى أو اضطراب في المفاصل أو الأوتار كالتهاب المفاصل الروماتويدي، أو تتناول ستيرويدات مثل ديكساميثازون أو ميثيل بريدنيزولون أو بريدنيزون؛ أو أصبت بتلف الأعصاب الطرفية أو تشنجات أو صرع أو سكتة أو تضيق في أوعية الدماغ أو تغيّر في بنية الدماغ؛ أو لديك وهن عضلي وبيل (قد يطلب منك الطبيب عدم تناوله)؛ أو لديك أو في عائلتك إطالة في فترة QT أو بطء أو اضطراب في نظم القلب أو نوبة قلبية حديثة أو أم دم أبهرية أو ارتفاع ضغط أو ضعف الدورة الدموية أو متلازمة مارفان أو إهلرز-دانلوس أو نقص البوتاسيوم أو المغنيسيوم أو السكري أو انخفاض سكر الدم أو مرض في الكبد. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, diarrhea, stomach pain, constipation, heartburn, vaginal itching or discharge. It can make skin sensitive to sunlight and UV light.\nSerious (stop taking it and call your doctor immediately or get emergency care): tendon pain, swelling, tenderness or stiffness, or a snap or pop in a tendon area, or being unable to move or put weight on an area; numbness, tingling, burning, pain or weakness in the arms or legs, or a change in the ability to feel touch, heat or cold; seizures, tremors, dizziness, headaches that will not go away, trouble sleeping, nightmares, feeling that others want to hurt you, hallucinations, restlessness, anxiety, depression, memory problems, confusion, or thoughts of harming or killing yourself; muscle weakness or difficulty breathing (especially with myasthenia gravis); severe watery or bloody diarrhea, which can happen up to 2 months or more after treatment; rash, itching, hives, swelling of the eyes, face, mouth, lips, tongue, throat, hands, feet or lower legs, hoarseness, throat tightness, or difficulty breathing or swallowing; peeling or blistering skin; fever; an ongoing or worsening cough; signs of low blood sugar (extreme thirst or hunger, pale skin, shakiness, sweating, fast or fluttering heartbeat, frequent urination, blurred vision, unusual anxiety); fainting; yellow skin or eyes, dark urine or light-colored stool; unusual bruising or bleeding; sudden pain in the chest, stomach or back.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء وإسهال وألم في المعدة وإمساك وحرقة وحكة أو إفرازات مهبلية. وقد يجعل الجلد حساسًا للشمس والأشعة فوق البنفسجية.\nالخطيرة (أوقفه واتصل بالطبيب فورًا أو اطلب الطوارئ): ألم أو تورم أو حساسية أو تيبّس في وتر أو سماع طقطقة في منطقة وتر أو عدم القدرة على تحريك منطقة أو الاتكاء عليها؛ تنميل أو وخز أو حرقان أو ألم أو ضعف في الذراعين أو الساقين أو تغيّر في الإحساس باللمس أو الحرارة أو البرودة؛ تشنجات أو رعشة أو دوار أو صداع مستمر أو صعوبة في النوم أو كوابيس أو شعور بأن الآخرين يريدون إيذاءك أو هلوسات أو توتر أو قلق أو اكتئاب أو مشكلات في الذاكرة أو ارتباك أو أفكار لإيذاء النفس أو قتلها؛ ضعف عضلي أو صعوبة في التنفس (خاصة مع الوهن العضلي الوبيل)؛ إسهال مائي أو دموي شديد قد يحدث حتى شهرين أو أكثر بعد العلاج؛ طفح أو حكة أو شرى أو تورم العينين أو الوجه أو الفم أو الشفتين أو اللسان أو الحلق أو اليدين أو القدمين أو أسفل الساقين أو بحة أو ضيق في الحلق أو صعوبة في التنفس أو البلع؛ تقشّر الجلد أو ظهور فقاعات؛ حمى؛ سعال مستمر أو متزايد؛ علامات انخفاض سكر الدم (عطش أو جوع شديد أو شحوب أو رعشة أو تعرق أو خفقان سريع أو تبول متكرر أو تشوش الرؤية أو قلق غير معتاد)؛ إغماء؛ اصفرار الجلد أو العينين أو بول داكن أو براز فاتح؛ كدمات أو نزف غير معتاد؛ ألم مفاجئ في الصدر أو المعدة أو الظهر.`,
    ),
    interactions: b(
      `${INTERACT_GEN_EN}\nAntacids, vitamins or mineral supplements containing aluminum hydroxide, magnesium hydroxide, iron or zinc, and medicines such as didanosine solution or sucralfate must be taken at least 2 hours before or after levofloxacin.\nNon-prescription pain relievers of the NSAID type (such as ibuprofen and naproxen) may interact: tell your doctor and pharmacist and do not start one while taking levofloxacin without asking.\nTell your doctor if you take oral or injectable steroids (such as dexamethasone, methylprednisolone or prednisone). If you have diabetes, the doctor may ask you to check your blood sugar more often. Tell the laboratory staff that you are taking it before any lab test.${INTERACT_TAIL_EN}`,
      `${INTERACT_GEN_AR}\nمضادات الحموضة والفيتامينات والمكملات المعدنية المحتوية على هيدروكسيد الألمنيوم أو هيدروكسيد المغنيسيوم أو الحديد أو الزنك، وأدوية مثل محلول ديدانوزين أو سوكرالفات، يجب تناولها قبل ليفوفلوكساسين أو بعده بساعتين على الأقل.\nقد تتداخل مسكنات الألم من نوع مضادات الالتهاب غير الستيرويدية (مثل إيبوبروفين ونابروكسين): أخبر الطبيب والصيدلي ولا تبدأ بأي منها أثناء تناوله دون استشارة.\nأخبر الطبيب إذا كنت تتناول ستيرويدات فموية أو بالحقن (مثل ديكساميثازون أو ميثيل بريدنيزولون أو بريدنيزون). وإذا كنت مصابًا بالسكري فقد يطلب منك الطبيب قياس سكر الدم بوتيرة أكبر. وأخبر العاملين في المختبر أنك تتناوله قبل أي تحليل.${INTERACT_TAIL_AR}`,
    ),
    pregnancyBreastfeeding: b(
      'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor.',
      'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حملتِ أثناء تناوله فاتصلي بالطبيب.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have or have ever had kidney disease (it is listed among the risk factors for tendon and brain/nervous-system side effects) or liver disease. This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى (وهو مذكور ضمن عوامل الخطر لمشكلات الأوتار والدماغ والجهاز العصبي) أو مرض في الكبد. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `• Read the Medication Guide that the pharmacy gives you. Stop it and call your doctor immediately if you notice tendon pain, nerve symptoms, or mood or brain-related changes.\n• Take it exactly as directed and finish the prescription even if you feel better. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• Drink plenty of water or other fluids.\n• Avoid unnecessary or prolonged sun and UV light (tanning beds, sunlamps); wear protective clothing, sunglasses and sunscreen. Call your doctor if your skin becomes red, swollen or blistered like a bad sunburn.\n• Do not drive or do tasks that need alertness until you know how it affects you.\n• Missed dose: take it as soon as you remember, if there are more than 8 hours before the next dose; if less than 8 hours remain, wait for the next dose. Never take a double dose.\n• Storage: keep it in its container, tightly closed, at room temperature, away from heat and moisture (not in the bathroom).${EDU_TAIL_EN}`,
      `• اقرأ دليل الدواء الذي تعطيه لك الصيدلية. أوقفه واتصل بالطبيب فورًا إذا لاحظت ألمًا في الأوتار أو أعراضًا عصبية أو تغيّرات في المزاج أو الدماغ.\n• تناوله تمامًا كما وُصف وأكمل الوصفة حتى لو شعرت بتحسن. فالتوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• اشرب كمية كبيرة من الماء أو السوائل.\n• تجنب التعرض غير الضروري أو الطويل للشمس والأشعة فوق البنفسجية (أسرّة التسمير ومصابيح الشمس)؛ وارتدِ ملابس واقية ونظارات شمسية وواقي شمس. واتصل بالطبيب إذا احمر جلدك أو تورم أو ظهرت فيه فقاعات كحروق الشمس الشديدة.\n• لا تقد السيارة ولا تقم بمهام تحتاج إلى يقظة حتى تعرف تأثيره عليك.\n• نسيان جرعة: تناولها فور تذكرك إذا بقي أكثر من 8 ساعات على الجرعة التالية؛ وإذا بقي أقل من 8 ساعات فانتظر الجرعة التالية. لا تأخذ جرعة مضاعفة أبدًا.\n• التخزين: احفظه في عبوته محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام).${EDU_TAIL_AR}`,
    ),
  },
  brands: [brand('a697040', 'Levaquin (no longer marketed in the US)')],
  sources: [src('Levofloxacin', 'a697040', '2026-08-15')],
  notes: NOTE + NOTE_BRANDS + ' The source page starts with an IMPORTANT WARNING (tendons, nerves, brain/nervous system, myasthenia gravis): the reviewer must check this record against the official label with extra care.',
};

const CLARITHROMYCIN: SeedItem = {
  id: 'clarithromycin',
  fields: {
    genericName: b('Clarithromycin', 'كلاريثروميسين'),
    activeIngredients: b('Clarithromycin', 'كلاريثروميسين'),
    drugClass: b('Macrolide antibiotic (works by stopping bacteria from growing)', 'مضاد حيوي من فئة الماكروليدات (يوقف نمو البكتيريا)'),
    mechanism: b(
      'As stated by the source: it works by stopping the growth of bacteria. The detailed molecular mechanism is not described in this patient-information source: add it from the official drug label.',
      'كما يذكر المصدر: يعمل عن طريق إيقاف نمو البكتيريا. لا تُشرح الآلية الجزيئية التفصيلية في هذا المصدر الموجّه للمرضى: تُضاف من النشرة الرسمية للدواء.',
    ),
    strengths: b(
      `Forms: tablet, extended-release (long-acting) tablet, and suspension (liquid) taken by mouth. ${STR_EN}`,
      `الأشكال: قرص وقرص ممتد المفعول (طويل الأمد) ومعلّق سائل يُؤخذ بالفم. ${STR_AR}`,
    ),
    approvedUses: b(
      `Treats certain infections caused by bacteria. It is also used to treat and prevent disseminated Mycobacterium avium complex (MAC) infection, a lung infection in people with a weakened immune system, and to get rid of H. pylori, a bacterium that causes ulcers. Sometimes it is used for Lyme disease, cryptosporidiosis, cat scratch disease, Legionnaires' disease and whooping cough, and to prevent heart infection around dental or other procedures. It does not work for colds, flu, or other viral infections.${USES_NOTE_EN}`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا، ولعلاج عدوى المركّب المتفطر الطائري (MAC) والوقاية منها وهي عدوى رئوية عند ضعاف المناعة، وللقضاء على بكتيريا المعدة (H. pylori) المسببة للقرحة. ويُستخدم أحيانًا لمرض لايم والإسهال الناتج عن الكريبتوسبوريديوم ومرض خدش القط ومرض الفيلق والسعال الديكي، وللوقاية من التهاب القلب حول إجراءات الأسنان وغيرها. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.${USES_NOTE_AR}`,
    ),
    ageRestrictions: b(
      'This source page does not state an age limit. It describes a liquid suspension form. Check the official label for age-specific information.',
      'لا تذكر صفحة المصدر حدًّا للعمر. وتذكر شكل المعلّق السائل. راجع النشرة الرسمية لمعلومات العمر.',
    ),
    dosingReference: b(
      `The regular tablet and the liquid are usually taken with or without food every 8 hours (three times a day) to 12 hours (twice a day) for 7 to 14 days. The extended-release tablet is taken with food every 24 hours (once a day) for 7 to 14 days. The doctor may prescribe a longer course depending on the condition. Take it at about the same times every day, exactly as directed. Shake the suspension well before each use. Swallow the long-acting tablets whole: do not split, chew or crush them.${DOSE_TAIL_EN}`,
      `يُؤخذ القرص العادي والسائل عادة مع الطعام أو بدونه كل 8 ساعات (ثلاث مرات يوميًا) إلى 12 ساعة (مرتين يوميًا) لمدة 7 إلى 14 يومًا. ويُؤخذ القرص ممتد المفعول مع الطعام كل 24 ساعة (مرة يوميًا) لمدة 7 إلى 14 يومًا. وقد يصف الطبيب مدة أطول حسب الحالة. تناوله في أوقات متقاربة كل يوم وتمامًا كما وُصف. رُجّ المعلّق جيدًا قبل كل استخدام. وابلع الأقراص طويلة الأمد كاملة: لا تقسمها ولا تمضغها ولا تسحقها.${DOSE_TAIL_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; have ever had jaundice or other liver problems while taking clarithromycin (the doctor will probably tell you not to take it); take any medicine that must not be combined with it; or have or have had a prolonged QT interval, abnormal heart rhythms (ventricular arrhythmia), low blood magnesium or potassium, myasthenia gravis, an irregular heartbeat, coronary artery disease, or kidney or liver disease. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو أصبت باليرقان أو بمشكلة في الكبد أثناء تناول كلاريثروميسين (غالبًا سيطلب منك الطبيب عدم تناوله)؛ أو تتناول دواءً لا يجوز تناوله معه؛ أو لديك أو كان لديك إطالة في فترة QT أو اضطراب في نظم القلب (عدم انتظام بطيني) أو نقص في المغنيسيوم أو البوتاسيوم أو وهن عضلي وبيل أو عدم انتظام في ضربات القلب أو مرض الشريان التاجي أو مرض في الكلى أو الكبد. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): diarrhea, nausea, vomiting, stomach pain, heartburn, gas, change in taste, headache. It may make you dizzy, confused or disoriented.\nSerious (call your doctor immediately or get emergency care): chest pain, shortness of breath or trouble breathing, pain or weakness on one side of the body, slurred speech; severe watery or bloody diarrhea, which can happen up to 2 months after treatment; rash, itching, hives, swelling of the face, throat, tongue, lips, eyes, hands, feet, ankles or lower legs, hoarseness, or difficulty breathing or swallowing; peeling or blistering skin; fever; yellow skin or eyes, unusual bleeding or bruising, pain in the upper right stomach, dark urine; extreme tiredness, lack of energy, loss of appetite, flu-like symptoms; fast, pounding or irregular heartbeat; muscle weakness such as difficulty chewing, talking or doing daily activities; double vision.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): إسهال وغثيان وقيء وألم في المعدة وحرقة وغازات وتغيّر في التذوق وصداع. وقد يسبب دوارًا أو ارتباكًا أو تشوشًا في الإدراك.\nالخطيرة (اتصل بالطبيب فورًا أو اطلب الطوارئ): ألم في الصدر أو ضيق في النفس أو صعوبة في التنفس أو ألم أو ضعف في جانب واحد من الجسم أو ثقل أو غموض في الكلام؛ إسهال مائي أو دموي شديد قد يحدث حتى شهرين بعد العلاج؛ طفح أو حكة أو شرى أو تورم الوجه أو الحلق أو اللسان أو الشفتين أو العينين أو اليدين أو القدمين أو الكاحلين أو أسفل الساقين أو بحة أو صعوبة في التنفس أو البلع؛ تقشّر الجلد أو ظهور فقاعات؛ حمى؛ اصفرار الجلد أو العينين أو نزف أو كدمات غير معتادة أو ألم أعلى يمين المعدة أو بول داكن؛ إرهاق شديد أو قلة طاقة أو فقدان الشهية أو أعراض شبيهة بالإنفلونزا؛ خفقان سريع أو غير منتظم؛ ضعف عضلي كصعوبة في المضغ أو الكلام أو أداء الأنشطة اليومية؛ ازدواج الرؤية.`,
    ),
    interactions: b(
      `${INTERACT_GEN_EN}\nSome medicines must not be taken together with clarithromycin, and others may need dose changes or extra monitoring: before starting, stopping or changing any medicine while taking it, ask your doctor or pharmacist.\nThe non-prescription or herbal products St. John's wort and omeprazole may interact: tell your doctor and pharmacist and do not start them while taking it without asking.${INTERACT_TAIL_EN}`,
      `${INTERACT_GEN_AR}\nبعض الأدوية لا يجوز تناولها مع كلاريثروميسين، وبعضها الآخر قد يحتاج إلى تعديل الجرعة أو متابعة إضافية: قبل بدء أي دواء أو إيقافه أو تغييره أثناء تناوله اسأل الطبيب أو الصيدلي.\nقد تتداخل المنتجات العشبية أو التي تُباع دون وصفة مثل نبتة سانت جون (St. John's wort) وأوميبرازول: أخبر الطبيب والصيدلي ولا تبدأ بها أثناء تناوله دون استشارة.${INTERACT_TAIL_AR}`,
    ),
    pregnancyBreastfeeding: b(
      'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor: the source says it may harm the fetus.',
      'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حملتِ أثناء تناوله فاتصلي بالطبيب: يذكر المصدر أنه قد يضر الجنين.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have or have ever had kidney or liver disease, or jaundice or other liver problems while taking clarithromycin (you may be told not to take it). This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى أو الكبد، أو يرقان أو مشكلة في الكبد أثناء تناول كلاريثروميسين (وقد يُطلب منك عدم تناوله). لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `• Take it exactly as directed and finish the prescription even if you feel better. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor.\n• Shake the liquid well before each use. Swallow long-acting tablets whole. The coating of a long-acting tablet may appear in the stool: this is normal and does not mean you missed the dose.\n• It may make you dizzy or confused: do not drive or use machinery until you know how it affects you.\n• If you are having surgery, including dental surgery, tell the doctor or dentist that you are taking it.\n• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.\n• Keep your normal diet unless your doctor says otherwise.\n• Storage: keep it in its container, tightly closed. Tablets go at room temperature away from light, heat and moisture (not in the bathroom). Do not refrigerate the liquid; keep it at room temperature and discard unused liquid after 14 days.${EDU_TAIL_EN}`,
      `• تناوله تمامًا كما وُصف وأكمل الوصفة حتى لو شعرت بتحسن. فالتوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• يُتوقع أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب.\n• رُجّ السائل جيدًا قبل كل استخدام. وابلع الأقراص طويلة الأمد كاملة. وقد يظهر غلاف القرص طويل الأمد في البراز: هذا طبيعي ولا يعني أنك لم تحصل على الجرعة.\n• قد يسبب دوارًا أو ارتباكًا: لا تقد السيارة ولا تشغّل آلات حتى تعرف تأثيره عليك.\n• إذا كنت ستخضع لجراحة، بما فيها جراحة الأسنان، فأخبر الطبيب أو طبيب الأسنان أنك تتناوله.\n• نسيان جرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.\n• التخزين: احفظه في عبوته محكمة الإغلاق. تُحفظ الأقراص في درجة حرارة الغرفة بعيدًا عن الضوء والحرارة والرطوبة (وليس في الحمام). لا تحفظ السائل في الثلاجة؛ احفظه في درجة حرارة الغرفة وتخلّص من السائل غير المستخدم بعد 14 يومًا.${EDU_TAIL_AR}`,
    ),
  },
  brands: [brand('a692005', 'Biaxin (no longer marketed in the US)')],
  sources: [src('Clarithromycin', 'a692005', '2026-05-15')],
  notes: NOTE + NOTE_BRANDS + ' Several medicines must not be combined with clarithromycin: the reviewer should add the exact interaction list from the official label.',
};

const PENICILLIN_V: SeedItem = {
  id: 'penicillin-v-potassium',
  fields: {
    genericName: b('Penicillin V potassium', 'بنسلين V البوتاسيوم'),
    activeIngredients: b('Penicillin V potassium', 'بنسلين V البوتاسيوم'),
    drugClass: b('Penicillin antibiotic (works by killing bacteria)', 'مضاد حيوي من فئة البنسلينات (يقتل البكتيريا)'),
    mechanism: b(
      'As stated by the source: it works by killing bacteria. The detailed molecular mechanism is not described in this patient-information source: add it from the official drug label.',
      'كما يذكر المصدر: يعمل عن طريق قتل البكتيريا. لا تُشرح الآلية الجزيئية التفصيلية في هذا المصدر الموجّه للمرضى: تُضاف من النشرة الرسمية للدواء.',
    ),
    strengths: b(
      `Forms: tablet and oral solution (liquid) taken by mouth. ${STR_EN}`,
      `الأشكال: قرص ومحلول فموي (سائل) يُؤخذ بالفم. ${STR_AR}`,
    ),
    approvedUses: b(
      `Treats certain infections caused by bacteria, such as pneumonia and other respiratory tract infections, scarlet fever, and ear, skin, gum, mouth and throat infections. It is also used to prevent rheumatic fever (a serious illness that can follow strep throat or scarlet fever and can damage the heart) from coming back. Sometimes it is used for certain anthrax infections of the skin, together with other medicines for diphtheria, and to prevent a heart valve infection in certain patients. It does not work for colds, flu, or other viral infections.${USES_NOTE_EN}`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا مثل الالتهاب الرئوي وعدوى الجهاز التنفسي الأخرى والحمى القرمزية والتهابات الأذن والجلد واللثة والفم والحلق. ويُستخدم أيضًا للوقاية من عودة الحمى الروماتيزمية (مرض خطير قد يلي التهاب الحلق العقدي أو الحمى القرمزية وقد يضر القلب). ويُستخدم أحيانًا لبعض عدوى الجمرة الخبيثة الجلدية، ومع أدوية أخرى للدفتيريا، وللوقاية من عدوى صمامات القلب عند بعض المرضى. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.${USES_NOTE_AR}`,
    ),
    ageRestrictions: b(
      'This source page does not state an age limit. It describes an oral liquid form. Check the official label for age-specific information.',
      'لا تذكر صفحة المصدر حدًّا للعمر. وتذكر شكل المحلول الفموي السائل. راجع النشرة الرسمية لمعلومات العمر.',
    ),
    dosingReference: b(
      `For treating infections it is usually taken every 6 to 8 hours; to prevent rheumatic fever it is taken twice a day. The length of treatment depends on the type of infection. Take it at about the same times every day, exactly as directed (not more, not less, not more often). Shake the liquid well before each use. Do not stop without talking to your doctor.${DOSE_TAIL_EN}`,
      `لعلاج العدوى يُؤخذ عادة كل 6 إلى 8 ساعات؛ وللوقاية من الحمى الروماتيزمية يُؤخذ مرتين يوميًا. وتعتمد مدة العلاج على نوع العدوى. تناوله في أوقات متقاربة كل يوم وتمامًا كما وُصف (لا أكثر ولا أقل ولا بوتيرة أكبر). رُجّ السائل جيدًا قبل كل استخدام. ولا تتوقف دون استشارة الطبيب.${DOSE_TAIL_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it, to any part of it, or to any other medicine, food, or substance (say what symptoms you had); currently have nausea or vomiting; or have or have had allergies, asthma, hay fever, or kidney disease. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي مكوّن فيه أو من أي دواء أو غذاء أو مادة أخرى (واذكر الأعراض التي ظهرت)؛ أو تعاني حاليًا من غثيان أو قيء؛ أو لديك أو كان لديك حساسية أو ربو أو حمى القش أو مرض في الكلى. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): diarrhea, nausea, vomiting, abdominal pain, black hairy tongue.\nSerious (call your doctor immediately or get emergency care): rash, hives, itching; hoarseness, wheezing, difficulty swallowing or breathing, or swelling of the throat, tongue or lips; joint pain; a return of fever, sore throat, chills or other signs of infection; severe watery or bloody diarrhea, with or without fever and stomach cramps, which can happen up to 2 months or more after treatment.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): إسهال وغثيان وقيء وألم في البطن ولسان أسود مشعّر.\nالخطيرة (اتصل بالطبيب فورًا أو اطلب الطوارئ): طفح أو شرى أو حكة؛ بحة أو أزيز أو صعوبة في البلع أو التنفس أو تورم الحلق أو اللسان أو الشفتين؛ ألم في المفاصل؛ عودة الحمى أو التهاب الحلق أو القشعريرة أو علامات عدوى أخرى؛ إسهال مائي أو دموي شديد، مع حمى وتقلصات في المعدة أو بدونها، وقد يحدث حتى شهرين أو أكثر بعد العلاج.`,
    ),
    interactions: b(
      `${INTERACT_GEN_EN}${INTERACT_TAIL_EN}`,
      `${INTERACT_GEN_AR}${INTERACT_TAIL_AR}`,
    ),
    pregnancyBreastfeeding: b(
      'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor.',
      'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حملتِ أثناء تناوله فاتصلي بالطبيب.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have or have ever had kidney disease. This source gives no dose-adjustment rules and does not mention liver precautions; the doctor decides.',
      'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى. لا يذكر المصدر قواعد لتعديل الجرعة ولا يذكر احتياطات خاصة بالكبد؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `• Take it exactly as directed at about the same times every day, and finish the prescription even if you feel better. Do not stop without talking to your doctor. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• Shake the liquid well before each use.\n• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.\n• Keep your normal diet unless your doctor says otherwise.\n• Storage: keep it in its container, tightly closed. Tablets go at room temperature away from heat and moisture (not in the bathroom). Keep the liquid in the refrigerator, do not freeze it, and throw away unused liquid after 14 days.\n• If you still have symptoms of infection after finishing it, call your doctor.${EDU_TAIL_EN}`,
      `• تناوله تمامًا كما وُصف في أوقات متقاربة كل يوم وأكمل الوصفة حتى لو شعرت بتحسن. ولا تتوقف دون استشارة الطبيب. فالتوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• رُجّ السائل جيدًا قبل كل استخدام.\n• نسيان جرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.\n• التخزين: احفظه في عبوته محكمة الإغلاق. تُحفظ الأقراص في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام). ويُحفظ السائل في الثلاجة دون تجميد، وتخلّص من السائل غير المستخدم بعد 14 يومًا.\n• إذا استمرت أعراض العدوى بعد إنهائه فاتصل بالطبيب.${EDU_TAIL_AR}`,
    ),
  },
  brands: ['Beepen-VK', 'Betapen-VK', 'Ledercillin VK', 'Pen-Vee K', 'Penapar-VK', 'Uticillin VK', 'V-Cillin K', 'Veetids'].map((n) =>
    brand('a685015', `${n} (no longer marketed in the US)`),
  ),
  sources: [src('Penicillin V Potassium', 'a685015', '2026-04-15')],
  notes: NOTE + NOTE_BRANDS + ' All brand names shown on the source page are marked there as no longer on the market: add current local brands only from an official local source.',
};

export const EXTRA: SeedItem[] = [
  CEFIXIME,
  LEVOFLOXACIN,
  CLARITHROMYCIN,
  PENICILLIN_V,
];
