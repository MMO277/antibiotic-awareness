import type { SeedItem } from './seedData';
import type { Bi, Brand, Source } from './types';

/**
 * Completed starter records for the antibiotics that were still "name + class only", plus a few extra
 * common antibiotics so that every drug-class category on the site has data.
 * Every record is written in the app author's own words from ONE official MedlinePlus patient page
 * (read on 2026-10-10). All are saved as DRAFT: nothing is approved until a qualified reviewer checks it.
 * The Arabic text is an AI translation and must be checked. Milligram doses, strengths and age limits
 * are NOT in these pages and are left out on purpose: add them only from the official drug label.
 */
const b = (en: string, ar: string): Bi => ({ en, ar });
const NOTE =
  '[STARTER] Summarised in own words from the MedlinePlus patient page (read on the accessed date). Arabic is an AI translation: needs review. Milligram doses, strengths and age limits are NOT in this source and must be added from the official label. NOT yet reviewed by a clinician.';
const NOTE_BRANDS =
  ' Brand names listed are the US names shown on the source page; add local (Egyptian) brands, manufacturers and barcodes only from an official local source.';
const src = (name: string, id: string, updated: string): Source => ({
  title: `${name}: MedlinePlus Drug Information`,
  url: `https://medlineplus.gov/druginfo/meds/${id}.html`,
  publisher: 'National Library of Medicine (MedlinePlus); content from ASHP AHFS Patient Medication Information',
  updated,
  accessed: '2026-10-10',
});
const brands = (id: string, names: string[]): Brand[] =>
  names.map((name) => ({ name, manufacturer: '', barcode: '', verified: true, sourceUrl: `https://medlineplus.gov/druginfo/meds/${id}.html` }));

const AZITHROMYCIN: SeedItem = {
  id: 'azithromycin',
  fields: {
    genericName: b('Azithromycin', 'أزيثروميسين'),
    activeIngredients: b('Azithromycin', 'أزيثروميسين'),
    drugClass: b('Macrolide antibiotic (works by stopping bacteria from growing)', 'مضاد حيوي من فئة الماكروليدات (يوقف نمو البكتيريا)'),
    strengths: b(
      'Forms: tablet and oral suspension (liquid) taken by mouth; a 1-gram single-dose powder packet that is mixed with water is also described. Strengths (mg) are not given in this source: add them from the official label.',
      'الأشكال: قرص ومعلّق سائل يُؤخذ بالفم، كما يُذكر كيس مسحوق بجرعة واحدة (1 جرام) يُخلط بالماء. لا يذكر المصدر التراكيز (ملغ): تُضاف من النشرة الرسمية للدواء.',
    ),
    approvedUses: b(
      `Treats infections caused by bacteria. It is also used to treat and to prevent disseminated Mycobacterium avium complex (MAC) infection, a lung infection in people with a weakened immune system. Sometimes it is used for H. pylori, travelers' diarrhea, Legionnaires' disease, whooping cough, Lyme disease and babesiosis, and to prevent heart infection around dental procedures or sexually transmitted infection after sexual assault. It does not work for colds, flu, or other viral infections.\n(Summary of a US patient-information page: uses approved in your country may differ.)`,
      `يُستخدم لعلاج العدوى التي تسببها البكتيريا، ولعلاج عدوى المركّب المتفطر الطائري (MAC) والوقاية منها، وهي عدوى رئوية عند ضعاف المناعة. ويُستخدم أحيانًا لبكتيريا المعدة (H. pylori) وإسهال المسافرين ومرض الفيلق والسعال الديكي ومرض لايم والبابيزيا، وللوقاية من التهاب القلب قبل إجراءات الأسنان ومن الأمراض المنقولة جنسيًا بعد الاعتداء الجنسي. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.\n(ملخص لصفحة معلومات مرضى أمريكية: قد تختلف الاستخدامات المعتمدة في بلدك.)`,
    ),
    ageRestrictions: b(
      'This source page does not state an age limit. It mentions vomiting or irritability while feeding in infants under 6 weeks as a reason to call the doctor. Check the official label for age-specific information.',
      'لا تذكر صفحة المصدر حدًّا للعمر. وتذكر أن القيء أو الانزعاج أثناء الرضاعة عند الرضع أقل من 6 أسابيع سبب للاتصال بالطبيب. راجع النشرة الرسمية لمعلومات العمر.',
    ),
    dosingReference: b(
      `Usually taken once a day, with or without food, at about the same time each day, for the length of time your doctor says. For prevention of MAC infection the tablets are taken once a week. If you vomit within an hour after a dose, call your doctor; do not repeat the dose unless told to.\nThis source does not list milligram doses. The exact dose is decided by the doctor or pharmacist for each person.`,
      `يُؤخذ عادة مرة واحدة يوميًا، مع الطعام أو بدونه، في نفس الوقت تقريبًا، للمدة التي يحددها الطبيب. وللوقاية من عدوى MAC تُؤخذ الأقراص مرة أسبوعيًا. إذا تقيأت خلال ساعة من الجرعة فاتصل بالطبيب ولا تكرر الجرعة إلا بتوجيهه.\nلا يذكر المصدر جرعات بالملغ. يحدد الطبيب أو الصيدلي الجرعة الدقيقة لكل شخص.`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; have ever had jaundice or other liver problems while taking azithromycin (the doctor will probably tell you not to take it); or have or have had a prolonged QT interval or other heart rhythm problem, low blood magnesium or potassium, heart failure, cystic fibrosis, myasthenia gravis, a blood infection, or kidney or liver disease. The doctor decides whether it is suitable.\n(Patient-information summary, not a complete list of contraindications: see the official label.)`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو أصبت باليرقان أو بمشكلة في الكبد أثناء تناول أزيثروميسين (غالبًا سيطلب منك الطبيب عدم تناوله)؛ أو لديك أو كان لديك إطالة في فترة QT أو اضطراب في نظم القلب، أو نقص في المغنيسيوم أو البوتاسيوم، أو فشل في القلب، أو تليف كيسي، أو وهن عضلي وبيل، أو عدوى في الدم، أو مرض في الكلى أو الكبد. يقرر الطبيب مدى ملاءمته.\n(ملخص لمعلومات المرضى وليس قائمة كاملة بموانع الاستعمال: راجع النشرة الرسمية.)`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, diarrhea, stomach pain, headache.\nSerious (stop taking it and call your doctor immediately or get emergency care): fast, pounding or irregular heartbeat; rash with or without fever; blisters or peeling skin; hives, itching, wheezing, difficulty breathing or swallowing, or swelling of the face, throat, tongue, lips, eyes, hands or feet; severe watery or bloody diarrhea, which can happen up to 2 months or more after treatment; yellow skin or eyes, unusual bleeding or bruising, pain in the upper right stomach, dark urine, loss of appetite; extreme tiredness; unusual muscle weakness; pink and swollen eyes.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء وإسهال وألم في المعدة وصداع.\nالخطيرة (أوقف الدواء واتصل بالطبيب فورًا أو اطلب الطوارئ): خفقان سريع أو غير منتظم؛ طفح مع حمى أو بدونها؛ تقرّحات أو تقشّر في الجلد؛ شرى أو حكة أو أزيز أو صعوبة في التنفس أو البلع أو تورم الوجه أو الحلق أو اللسان أو الشفتين أو العينين أو اليدين أو القدمين؛ إسهال مائي أو دموي شديد قد يحدث حتى شهرين أو أكثر بعد العلاج؛ اصفرار الجلد أو العينين أو نزف أو كدمات غير معتادة أو ألم أعلى يمين المعدة أو بول داكن أو فقدان الشهية؛ إرهاق شديد؛ ضعف عضلي غير معتاد؛ احمرار وتورم العينين.`,
    ),
    interactions: b(
      `Tell your doctor and pharmacist about every prescription and non-prescription medicine, vitamin, supplement and herbal product you take or plan to take; doses may need to be changed or you may need closer monitoring.\nAntacids containing aluminum hydroxide or magnesium hydroxide must be taken at a different time from azithromycin tablets or liquid: ask your doctor or pharmacist how many hours apart.\nDrug-by-drug interactions are not listed in this source.`,
      `أخبر الطبيب والصيدلي بكل دواء بوصفة أو بدونها وبكل فيتامين ومكمل وعشب تتناوله أو تنوي تناوله؛ فقد تحتاج الجرعات إلى تعديل أو متابعة أدق.\nمضادات الحموضة المحتوية على هيدروكسيد الألمنيوم أو هيدروكسيد المغنيسيوم يجب تناولها في وقت مختلف عن أقراص أو سائل أزيثروميسين: اسأل الطبيب أو الصيدلي عن عدد الساعات الفاصلة.\nلا يذكر المصدر التداخلات دواءً بدواء.`,
    ),
    pregnancyBreastfeeding: b(
      'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor.',
      'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حملتِ أثناء تناوله فاتصلي بالطبيب.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have or have ever had kidney or liver disease, or liver problems such as jaundice after taking azithromycin. This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى أو الكبد، أو مشكلة في الكبد كاليرقان بعد تناول أزيثروميسين. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `• Take it exactly as directed and finish the prescription even if you feel better, unless you have the severe side effects above. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor.\n• Shake the liquid well before each use and measure it with a dosing spoon, oral syringe or measuring cup. Throw away leftover suspension after the last dose.\n• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.\n• Keep your normal diet unless your doctor says otherwise.\n• Storage: keep it in its container, tightly closed, at room temperature, away from heat and moisture (not in the bathroom) and out of reach of children. Do not flush medicine down the toilet: use a take-back program.\n• Do not let anyone else take your medicine. Antibiotics do not work for colds and flu, and using them when not needed raises the risk of a later infection that resists antibiotics.\n• Keep your appointments and lab tests, and carry a written list of all your medicines.`,
      `• تناوله تمامًا كما وُصف وأكمل العلاج حتى لو شعرت بتحسن، إلا إذا ظهرت الآثار الخطيرة المذكورة أعلاه. التوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• يُتوقع أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب.\n• رُجّ السائل جيدًا قبل كل استخدام وقِسه بملعقة أو حقنة فموية أو كوب قياس. تخلّص من السائل المتبقي بعد الجرعة الأخيرة.\n• نسيان جرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.\n• التخزين: احفظه في عبوته محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام) وبعيدًا عن الأطفال. لا تتخلص من الدواء بالمرحاض؛ استخدم برنامج استرجاع الأدوية.\n• لا تسمح لأحد بتناول دوائك. المضادات الحيوية لا تنفع في نزلات البرد والإنفلونزا، واستخدامها دون حاجة يزيد خطر عدوى لاحقة تقاوم المضادات.\n• التزم بمواعيدك وتحاليلك واحمل قائمة مكتوبة بكل أدويتك.`,
    ),
  },
  brands: brands('a697037', ['Zithromax']),
  sources: [src('Azithromycin', 'a697037', '2026-05-15')],
  notes: NOTE + NOTE_BRANDS,
};

const DOXYCYCLINE: SeedItem = {
  id: 'doxycycline',
  fields: {
    genericName: b('Doxycycline', 'دوكسيسيكلين'),
    activeIngredients: b('Doxycycline', 'دوكسيسيكلين'),
    drugClass: b('Tetracycline antibiotic (works by stopping bacteria from growing and spreading)', 'مضاد حيوي من فئة التتراسيكلين (يوقف نمو البكتيريا وانتشارها)'),
    strengths: b(
      'Forms: capsule, tablet, delayed-release tablet, and oral suspension (liquid) taken by mouth. One doxycycline product may not be substituted for another: use only the type your doctor prescribed. Strengths (mg) are not given in this source: add them from the official label.',
      'الأشكال: كبسولة، قرص، قرص بطيء التحرر، ومعلّق سائل يُؤخذ بالفم. لا يجوز استبدال منتج دوكسيسيكلين بآخر: استخدم النوع الذي وصفه الطبيب فقط. لا يذكر المصدر التراكيز (ملغ): تُضاف من النشرة الرسمية للدواء.',
    ),
    approvedUses: b(
      `Treats infections caused by bacteria and certain infections spread by ticks, lice, mites and infected animals. It is also used to prevent malaria and to treat acne and rosacea (it lowers inflammation in rosacea). Sometimes it is used to treat malaria, to treat or prevent Lyme disease after a tick bite, and to prevent some sexually transmitted infections in certain situations. It does not work for colds, flu, or other viral infections.\n(Summary of a US patient-information page: uses approved in your country may differ.)`,
      `يُستخدم لعلاج العدوى التي تسببها البكتيريا وبعض العدوى التي ينقلها القراد والقمل والعث والحيوانات المصابة، وللوقاية من الملاريا، ولعلاج حب الشباب والوردية (يقلل الالتهاب في الوردية). ويُستخدم أحيانًا لعلاج الملاريا، ولعلاج مرض لايم أو الوقاية منه بعد لدغة قرادة، وللوقاية من بعض الأمراض المنقولة جنسيًا في حالات معينة. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.\n(ملخص لصفحة معلومات مرضى أمريكية: قد تختلف الاستخدامات المعتمدة في بلدك.)`,
    ),
    ageRestrictions: b(
      'The source says it can permanently stain teeth and affect bone growth when used in pregnancy or in babies and children under 8 years old. It should not be used under 8 except for inhalational anthrax or Rocky Mountain spotted fever, or if the doctor decides it is needed.',
      'يذكر المصدر أنه قد يسبب تلوّنًا دائمًا للأسنان ويؤثر في نمو العظام عند استخدامه أثناء الحمل أو للرضع والأطفال دون 8 سنوات. لا يُستخدم تحت سن 8 سنوات إلا للجمرة الخبيثة الاستنشاقية أو الحمى المبقعة للجبال الصخرية أو إذا قرر الطبيب ضرورته.',
    ),
    dosingReference: b(
      `Taken once or twice a day depending on the product and the condition. Drink a full glass of water with each dose; if it upsets your stomach you may take it with food or milk. Swallow delayed-release tablets whole. For malaria prevention it is started 1 or 2 days before travel, taken each day in the area and for 4 weeks after leaving, and not for more than 4 months.\nThis source does not list milligram doses. The exact dose is decided by the doctor or pharmacist for each person.`,
      `يُؤخذ مرة أو مرتين يوميًا حسب المنتج والحالة. اشرب كوب ماء كاملًا مع كل جرعة؛ وإذا سبب اضطرابًا في المعدة يمكن تناوله مع الطعام أو الحليب. ابتلع الأقراص بطيئة التحرر كاملة. وللوقاية من الملاريا يبدأ قبل السفر بيوم أو يومين، ويؤخذ يوميًا أثناء الإقامة في المنطقة ولمدة 4 أسابيع بعد مغادرتها، ولا يتجاوز 4 أشهر.\nلا يذكر المصدر جرعات بالملغ. يحدد الطبيب أو الصيدلي الجرعة الدقيقة لكل شخص.`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; are pregnant or plan to become pregnant (it can harm the baby); are breastfeeding; or have or have had lupus, intracranial hypertension (high pressure in the skull), a mouth or vaginal yeast infection, stomach surgery, asthma, kidney or liver disease, or diarrhea. The doctor decides whether it is suitable.\n(Patient-information summary, not a complete list of contraindications: see the official label.)`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو كنتِ حاملًا أو تخططين للحمل (قد يضر الجنين)؛ أو ترضعين؛ أو لديك أو كان لديك الذئبة أو ارتفاع الضغط داخل الجمجمة أو عدوى فطرية في الفم أو المهبل أو جراحة في المعدة أو ربو أو مرض في الكلى أو الكبد أو إسهال. يقرر الطبيب مدى ملاءمته.\n(ملخص لمعلومات المرضى وليس قائمة كاملة بموانع الاستعمال: راجع النشرة الرسمية.)`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, diarrhea, loss of appetite, itching of the rectum, vaginal irritation or discharge, painful urination, sore throat, swollen tongue, dry mouth, anxiety, back pain, color changes of skin, scars, nails, eyes or mouth. It can make your skin sensitive to sunlight.\nSerious (call your doctor immediately): headache; blurred or double vision or vision loss; rash with fever or swollen glands; red, purple, peeling or blistering skin; difficulty breathing or swallowing, swelling of the eyes, face, throat, tongue or lips, hives; unusual bleeding or bruising; watery or bloody stools with cramps or fever during treatment or up to two or more months after; return of fever or other infection signs; joint pain; discoloration of adult teeth.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء وإسهال وفقدان الشهية وحكة في الشرج وتهيج أو إفرازات مهبلية وألم عند التبول والتهاب الحلق وتورم اللسان وجفاف الفم وقلق وألم في الظهر وتغيّر لون الجلد أو الندبات أو الأظافر أو العينين أو الفم. وقد يجعل جلدك حساسًا لأشعة الشمس.\nالخطيرة (اتصل بالطبيب فورًا): صداع؛ تشوش الرؤية أو ازدواجها أو فقدانها؛ طفح مع حمى أو تضخم الغدد؛ احمرار أو اسوداد أو تقشّر أو تقرّح الجلد؛ صعوبة في التنفس أو البلع أو تورم العينين أو الوجه أو الحلق أو اللسان أو الشفتين أو شرى؛ نزف أو كدمات غير معتادة؛ براز مائي أو دموي مع تقلصات أو حمى أثناء العلاج أو حتى شهرين أو أكثر بعده؛ عودة الحمى أو علامات العدوى؛ ألم المفاصل؛ تلوّن الأسنان الدائمة.`,
    ),
    interactions: b(
      `Tell your doctor and pharmacist about every prescription and non-prescription medicine, vitamin, supplement and herbal product you take or plan to take. Bismuth, omeprazole and lansoprazole may interact with it.\nTake antacids, calcium supplements and magnesium laxatives 1 to 2 hours before or after it. Take iron preparations and vitamins with iron 3 hours before or 2 hours after it.\nIt may make hormonal birth control (pills, patches, rings, injections) less effective, so another method is needed during treatment.\nTell the laboratory staff you are taking it before any lab test. Drug-by-drug interactions are not otherwise listed in this source.`,
      `أخبر الطبيب والصيدلي بكل دواء بوصفة أو بدونها وبكل فيتامين ومكمل وعشب تتناوله أو تنوي تناوله. قد يتداخل معه البزموت والأوميبرازول واللانسوبرازول.\nتناول مضادات الحموضة ومكملات الكالسيوم والملينات المحتوية على المغنيسيوم قبله أو بعده بساعة إلى ساعتين. وتناول مستحضرات الحديد والفيتامينات المحتوية عليه قبله بـ 3 ساعات أو بعده بساعتين.\nقد يقلل فاعلية وسائل منع الحمل الهرمونية (حبوب ولصقات وحلقات وحقن)، فيلزم استخدام وسيلة أخرى أثناء العلاج.\nأخبر العاملين في المختبر أنك تتناوله قبل أي تحليل. لا يذكر المصدر غير ذلك من التداخلات.`,
    ),
    pregnancyBreastfeeding: b(
      'It can harm the unborn baby. Tell your doctor if you are pregnant or plan to become pregnant, and call your doctor immediately if you become pregnant while taking it. Your doctor may tell you not to breastfeed during treatment.',
      'قد يضر الجنين. أخبري الطبيب إذا كنتِ حاملًا أو تخططين للحمل، واتصلي به فورًا إذا حملتِ أثناء تناوله. وقد يطلب منك الطبيب عدم الإرضاع أثناء العلاج.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have or have ever had kidney or liver disease. This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى أو الكبد. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `• Take it exactly as directed and continue until the medicine is finished even if you feel well, unless your doctor says otherwise.\n• Drink a full glass of water with each dose. Shake the liquid well before use. Do not split, chew or crush delayed-release tablets.\n• Avoid unnecessary or prolonged sun exposure and wear protective clothing, sunglasses and sunscreen.\n• For malaria prevention, also use insect repellent, mosquito nets and covering clothing: it does not give full protection.\n• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.\n• Storage: keep it in its container, tightly closed, at room temperature, away from light, heat and moisture (not in the bathroom) and out of reach of children. Do not flush medicine down the toilet: use a take-back program.\n• Do not let anyone else take your medicine. Antibiotics do not work for colds and flu, and using them when not needed raises the risk of a later infection that resists antibiotics.\n• Keep your appointments and lab tests, and carry a written list of all your medicines.`,
      `• تناوله تمامًا كما وُصف واستمر حتى ينتهي الدواء حتى لو شعرت بتحسن، ما لم يوجهك الطبيب بغير ذلك.\n• اشرب كوب ماء كاملًا مع كل جرعة. رُجّ السائل جيدًا قبل الاستخدام. لا تقسم الأقراص بطيئة التحرر ولا تمضغها ولا تسحقها.\n• تجنب التعرض غير الضروري أو الطويل للشمس وارتدِ ملابس واقية ونظارات شمسية وواقي شمس.\n• للوقاية من الملاريا استخدم أيضًا طاردًا للحشرات وناموسية وملابس تغطي الجسم: فهو لا يمنح حماية كاملة.\n• نسيان جرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.\n• التخزين: احفظه في عبوته محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الضوء والحرارة والرطوبة (وليس في الحمام) وبعيدًا عن الأطفال. لا تتخلص من الدواء بالمرحاض؛ استخدم برنامج استرجاع الأدوية.\n• لا تسمح لأحد بتناول دوائك. المضادات الحيوية لا تنفع في نزلات البرد والإنفلونزا، واستخدامها دون حاجة يزيد خطر عدوى لاحقة تقاوم المضادات.\n• التزم بمواعيدك وتحاليلك واحمل قائمة مكتوبة بكل أدويتك.`,
    ),
  },
  brands: brands('a682063', ['Acticlate', 'Doryx', 'Doryx MPC', 'Monodox', 'Oracea']),
  sources: [src('Doxycycline', 'a682063', '2026-05-15')],
  notes: NOTE + NOTE_BRANDS,
};

const CEPHALEXIN: SeedItem = {
  id: 'cephalexin',
  fields: {
    genericName: b('Cephalexin', 'سيفالكسين'),
    activeIngredients: b('Cephalexin', 'سيفالكسين'),
    drugClass: b('Cephalosporin antibiotic, 1st generation (works by killing bacteria)', 'مضاد حيوي من السيفالوسبورينات، الجيل الأول (يقتل البكتيريا)'),
    strengths: b(
      'Forms: capsule, tablet, and oral suspension (liquid) taken by mouth. Strengths (mg) are not given in this source: add them from the official label.',
      'الأشكال: كبسولة وقرص ومعلّق سائل يُؤخذ بالفم. لا يذكر المصدر التراكيز (ملغ): تُضاف من النشرة الرسمية للدواء.',
    ),
    approvedUses: b(
      `Treats certain infections caused by bacteria. It is also sometimes used in people who are allergic to penicillin and have a heart condition, to help prevent a heart valve infection before a dental or upper respiratory tract procedure. It does not work for colds, flu, or other viral infections.\n(Summary of a US patient-information page: uses approved in your country may differ.)`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا. ويُستخدم أحيانًا لمن لديهم حساسية من البنسلين ومرض في القلب للمساعدة في الوقاية من التهاب صمامات القلب قبل إجراءات الأسنان أو الجهاز التنفسي العلوي. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.\n(ملخص لصفحة معلومات مرضى أمريكية: قد تختلف الاستخدامات المعتمدة في بلدك.)`,
    ),
    ageRestrictions: b(
      'This source page does not state an age limit. It describes a liquid form; the doctor decides the dose. Check the official label for age-specific information.',
      'لا تذكر صفحة المصدر حدًّا للعمر. وتذكر شكلًا سائلًا؛ ويحدد الطبيب الجرعة. راجع النشرة الرسمية لمعلومات العمر.',
    ),
    dosingReference: b(
      `Usually taken with or without food every 6 or 12 hours for 7 to 14 days, depending on the condition, at about the same times every day, exactly as directed. Do not take more or less than prescribed, or more often.\nThis source does not list milligram doses. The exact dose is decided by the doctor or pharmacist for each person.`,
      `يُؤخذ عادة مع الطعام أو بدونه كل 6 أو 12 ساعة لمدة 7 إلى 14 يومًا حسب الحالة، في نفس الأوقات تقريبًا يوميًا وتمامًا كما وُصف. لا تأخذ أكثر أو أقل مما وُصف ولا بتكرار أكبر.\nلا يذكر المصدر جرعات بالملغ. يحدد الطبيب أو الصيدلي الجرعة الدقيقة لكل شخص.`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance (say what symptoms you had); or have or have had allergies of any kind, a stomach or intestinal disease especially colitis, or kidney or liver disease. The doctor decides whether it is suitable.\n(Patient-information summary, not a complete list of contraindications: see the official label.)`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة (اذكر الأعراض التي ظهرت)؛ أو لديك أو كان لديك أي نوع من الحساسية أو مرض في المعدة أو الأمعاء خاصة التهاب القولون أو مرض في الكلى أو الكبد. يقرر الطبيب مدى ملاءمته.\n(ملخص لمعلومات المرضى وليس قائمة كاملة بموانع الاستعمال: راجع النشرة الرسمية.)`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, diarrhea, heartburn, stomach pain, rectal or genital itching, extreme tiredness, agitation, confusion, dizziness, headache, joint pain.\nSerious (call your doctor immediately or get emergency care): watery or bloody stools, stomach cramps or fever during treatment or up to two or more months after; rash, itching, hives, swelling of the face, throat, tongue, lips or eyes, difficulty breathing or swallowing, wheezing; return of fever, sore throat, chills or other signs of infection; hallucinations.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء وإسهال وحرقة معدة وألم في المعدة وحكة في الشرج أو الأعضاء التناسلية وإرهاق شديد وهياج وارتباك ودوار وصداع وألم في المفاصل.\nالخطيرة (اتصل بالطبيب فورًا أو اطلب الطوارئ): براز مائي أو دموي أو تقلصات أو حمى أثناء العلاج أو حتى شهرين أو أكثر بعده؛ طفح وحكة وشرى وتورم الوجه أو الحلق أو اللسان أو الشفتين أو العينين وصعوبة في التنفس أو البلع وأزيز؛ عودة الحمى أو التهاب الحلق أو القشعريرة أو علامات العدوى؛ هلوسات.`,
    ),
    interactions: b(
      `Tell your doctor and pharmacist about every prescription and non-prescription medicine, vitamin, supplement and herbal product you take or plan to take; doses may need to be changed or you may need closer monitoring.\nIt may make hormonal birth control (pills, patches, rings, injections) less effective, so another method is needed during treatment.\nIf you have diabetes and test urine sugar, use Clinistix or TesTape (not Clinitest). Tell the laboratory staff you are taking it before any lab test.\nDrug-by-drug interactions are not otherwise listed in this source.`,
      `أخبر الطبيب والصيدلي بكل دواء بوصفة أو بدونها وبكل فيتامين ومكمل وعشب تتناوله أو تنوي تناوله؛ فقد تحتاج الجرعات إلى تعديل أو متابعة أدق.\nقد يقلل فاعلية وسائل منع الحمل الهرمونية (حبوب ولصقات وحلقات وحقن)، فيلزم استخدام وسيلة أخرى أثناء العلاج.\nإذا كنت مصابًا بالسكري وتفحص سكر البول فاستخدم Clinistix أو TesTape (وليس Clinitest). وأخبر العاملين في المختبر أنك تتناوله قبل أي تحليل.\nلا يذكر المصدر غير ذلك من التداخلات دواءً بدواء.`,
    ),
    pregnancyBreastfeeding: b(
      'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor.',
      'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حملتِ أثناء تناوله فاتصلي بالطبيب.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have or have ever had kidney or liver disease. This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى أو الكبد. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `• Take it exactly as directed and finish the prescription even if you feel better. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor.\n• Shake the liquid well before each use.\n• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.\n• Keep your normal diet unless your doctor says otherwise.\n• Storage: keep capsules and tablets in their container, tightly closed, at room temperature, away from heat and moisture (not in the bathroom). Keep the liquid in the refrigerator and throw away unused liquid after 14 days. Keep out of reach of children. Do not flush medicine down the toilet: use a take-back program.\n• Overdose signs can include nausea, vomiting, diarrhea, stomach pain and pink, red or dark brown urine: call the poison center or emergency services.\n• Do not let anyone else take your medicine. Antibiotics do not work for colds and flu, and using them when not needed raises the risk of a later infection that resists antibiotics.\n• Keep your appointments and lab tests, and carry a written list of all your medicines.`,
      `• تناوله تمامًا كما وُصف وأكمل العلاج حتى لو شعرت بتحسن. التوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• يُتوقع أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب.\n• رُجّ السائل جيدًا قبل كل استخدام.\n• نسيان جرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.\n• التخزين: احفظ الكبسولات والأقراص في عبوتها محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام). احفظ السائل في الثلاجة وتخلص من السائل غير المستخدم بعد 14 يومًا. بعيدًا عن الأطفال. لا تتخلص من الدواء بالمرحاض؛ استخدم برنامج استرجاع الأدوية.\n• من علامات الجرعة الزائدة: غثيان وقيء وإسهال وألم في المعدة وبول وردي أو أحمر أو بني داكن: اتصل بمركز السموم أو الطوارئ.\n• لا تسمح لأحد بتناول دوائك. المضادات الحيوية لا تنفع في نزلات البرد والإنفلونزا، واستخدامها دون حاجة يزيد خطر عدوى لاحقة تقاوم المضادات.\n• التزم بمواعيدك وتحاليلك واحمل قائمة مكتوبة بكل أدويتك.`,
    ),
  },
  brands: [],
  sources: [src('Cephalexin', 'a682733', '2026-06-15')],
  notes: NOTE + ' The brand names on the source page are discontinued in the US, so none are listed: add local (Egyptian) brands, manufacturers and barcodes only from an official local source.',
};

// ---- shared wording (same facts appear on every MedlinePlus antibiotic page) ----
const PREG = b(
  'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor.',
  'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حملتِ أثناء تناوله فاتصلي بالطبيب.',
);
const RENAL = b(
  'Tell your doctor if you have or have ever had kidney or liver disease. This source gives no dose-adjustment rules; the doctor decides.',
  'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى أو الكبد. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
);
const AGE_NONE = b(
  'This source page does not state an age limit; the doctor decides the dose. Check the official label for age-specific information.',
  'لا تذكر صفحة المصدر حدًّا للعمر؛ ويحدد الطبيب الجرعة. راجع النشرة الرسمية لمعلومات العمر.',
);
const INT_EN = 'Tell your doctor and pharmacist about every prescription and non-prescription medicine, vitamin, supplement and herbal product you take or plan to take; doses may need to be changed or you may need closer monitoring.';
const INT_AR = 'أخبر الطبيب والصيدلي بكل دواء بوصفة أو بدونها وبكل فيتامين ومكمل وعشب تتناوله أو تنوي تناوله؛ فقد تحتاج الجرعات إلى تعديل أو متابعة أدق.';
const BC_EN = 'It may make hormonal birth control (pills, patches, rings, injections) less effective, so another method is needed during treatment.';
const BC_AR = 'قد يقلل فاعلية وسائل منع الحمل الهرمونية (حبوب ولصقات وحلقات وحقن)، فيلزم استخدام وسيلة أخرى أثناء العلاج.';
const DIAB_EN = 'If you have diabetes and test your urine for sugar, use Clinistix or TesTape (not Clinitest); ask your doctor or pharmacist which product to use to test blood sugar.';
const DIAB_AR = 'إذا كنت مصابًا بالسكري وتفحص سكر البول فاستخدم Clinistix أو TesTape (وليس Clinitest)؛ واسأل الطبيب أو الصيدلي عن المنتج المناسب لفحص سكر الدم.';
const NOLIST_EN = 'Drug-by-drug interactions are not otherwise listed in this source.';
const NOLIST_AR = 'لا يذكر المصدر غير ذلك من التداخلات دواءً بدواء.';
const STR_EN = 'Strengths (mg) are not given in this source: add them from the official label.';
const STR_AR = 'لا يذكر المصدر التراكيز (ملغ): تُضاف من النشرة الرسمية للدواء.';
const VIRAL_EN = '\nIt does not work for colds, flu, or other viral infections.\n(Summary of a US patient-information page: uses approved in your country may differ.)';
const VIRAL_AR = '\nولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.\n(ملخص لصفحة معلومات مرضى أمريكية: قد تختلف الاستخدامات المعتمدة في بلدك.)';
const CONTRA_TAIL_EN = '\n(Patient-information summary, not a complete list of contraindications: see the official label.)';
const CONTRA_TAIL_AR = '\n(ملخص لمعلومات المرضى وليس قائمة كاملة بموانع الاستعمال: راجع النشرة الرسمية.)';
const NODOSE_EN = '\nThis source does not list milligram doses. The exact dose is decided by the doctor or pharmacist for each person.';
const NODOSE_AR = '\nلا يذكر المصدر جرعات بالملغ. يحدد الطبيب أو الصيدلي الجرعة الدقيقة لكل شخص.';
const EDU_FINISH_EN = '• Take it exactly as directed and finish the prescription even if you feel better. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor.';
const EDU_FINISH_AR = '• تناوله تمامًا كما وُصف وأكمل العلاج حتى لو شعرت بتحسن. التوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• يُتوقع أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب.';
const EDU_MISSED_EN = '\n• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.\n• Keep your normal diet unless your doctor says otherwise.';
const EDU_MISSED_AR = '\n• نسيان جرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.';
const EDU_TAIL_EN = '\n• Keep it out of reach of children. Do not flush medicine down the toilet: use a take-back program.\n• Do not let anyone else take your medicine. Antibiotics do not work for colds and flu, and using them when not needed raises the risk of a later infection that resists antibiotics.\n• Keep your appointments and lab tests, and carry a written list of all your medicines.';
const EDU_TAIL_AR = '\n• احفظه بعيدًا عن متناول الأطفال. لا تتخلص من الدواء بالمرحاض؛ استخدم برنامج استرجاع الأدوية.\n• لا تسمح لأحد بتناول دوائك. المضادات الحيوية لا تنفع في نزلات البرد والإنفلونزا، واستخدامها دون حاجة يزيد خطر عدوى لاحقة تقاوم المضادات.\n• التزم بمواعيدك وتحاليلك واحمل قائمة مكتوبة بكل أدويتك.';
const CDIFF_EN = 'watery or bloody stools, stomach cramps or fever during treatment or up to two or more months after stopping';
const CDIFF_AR = 'براز مائي أو دموي أو تقلصات في المعدة أو حمى أثناء العلاج أو حتى شهرين أو أكثر بعد التوقف';
const ALLERGY_EN = 'rash, itching, hives, difficulty breathing or swallowing, wheezing, or swelling of the face, throat, tongue, lips or eyes';
const ALLERGY_AR = 'طفح أو حكة أو شرى أو صعوبة في التنفس أو البلع أو أزيز أو تورم الوجه أو الحلق أو اللسان أو الشفتين أو العينين';

const CEFUROXIME: SeedItem = {
  id: 'cefuroxime',
  fields: {
    genericName: b('Cefuroxime', 'سيفوروكسيم'),
    activeIngredients: b('Cefuroxime', 'سيفوروكسيم'),
    drugClass: b('Cephalosporin antibiotic, 2nd generation (works by stopping bacteria from growing)', 'مضاد حيوي من السيفالوسبورينات، الجيل الثاني (يوقف نمو البكتيريا)'),
    strengths: b(`Form: tablet taken by mouth (swallow whole; do not crush because the crushed tablet tastes very bitter). ${STR_EN}`, `الشكل: قرص يُؤخذ بالفم (يُبتلع كاملًا ولا يُسحق لأن القرص المسحوق مرّ جدًا). ${STR_AR}`),
    approvedUses: b(
      `Treats certain infections caused by bacteria, Lyme disease (spread by ticks) and gonorrhea. It is also sometimes used to treat pneumonia.${VIRAL_EN}`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا ومرض لايم (ينقله القراد) والسيلان. ويُستخدم أحيانًا لعلاج الالتهاب الرئوي.${VIRAL_AR}`,
    ),
    ageRestrictions: AGE_NONE,
    dosingReference: b(
      `Usually taken every 12 hours for 5 to 20 days depending on the condition, with or without food, at about the same times every day. For gonorrhea it is taken as a single dose. Take it exactly as directed; do not take more or less, or more often.${NODOSE_EN}`,
      `يُؤخذ عادة كل 12 ساعة لمدة 5 إلى 20 يومًا حسب الحالة، مع الطعام أو بدونه، في نفس الأوقات تقريبًا يوميًا. وفي السيلان يُؤخذ بجرعة واحدة. تناوله تمامًا كما وُصف ولا تأخذ أكثر أو أقل ولا بتكرار أكبر.${NODOSE_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance (say what symptoms you had); or have or have had a stomach or intestinal disease especially colitis, or kidney or liver disease. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة (اذكر الأعراض التي ظهرت)؛ أو لديك أو كان لديك مرض في المعدة أو الأمعاء خاصة التهاب القولون، أو مرض في الكلى أو الكبد. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, diarrhea.\nSerious (call your doctor immediately or get emergency care): ${ALLERGY_EN}; ${CDIFF_EN}; a return of fever, sore throat, chills or other signs of infection. Seizures can be a sign of overdose.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء وإسهال.\nالخطيرة (اتصل بالطبيب فورًا أو اطلب الطوارئ): ${ALLERGY_AR}؛ ${CDIFF_AR}؛ عودة الحمى أو التهاب الحلق أو القشعريرة أو علامات العدوى. وقد تكون التشنجات علامة على جرعة زائدة.`,
    ),
    interactions: b(
      `${INT_EN}\nCimetidine, famotidine, omeprazole and ranitidine may interact with it. Take antacids containing magnesium or aluminum at least 1 hour before or 2 hours after it.\n${BC_EN}\n${DIAB_EN}\n${NOLIST_EN}`,
      `${INT_AR}\nقد يتداخل معه السيميتيدين والفاموتيدين والأوميبرازول والرانيتيدين. تناول مضادات الحموضة المحتوية على المغنيسيوم أو الألمنيوم قبله بساعة على الأقل أو بعده بساعتين.\n${BC_AR}\n${DIAB_AR}\n${NOLIST_AR}`,
    ),
    pregnancyBreastfeeding: PREG,
    renalHepatic: RENAL,
    patientEducation: b(
      `${EDU_FINISH_EN}\n• Swallow the tablets whole; do not crush them.${EDU_MISSED_EN}\n• Storage: keep it in its container, tightly closed, at room temperature, away from heat and moisture (not in the bathroom).${EDU_TAIL_EN}`,
      `${EDU_FINISH_AR}\n• ابتلع الأقراص كاملة ولا تسحقها.${EDU_MISSED_AR}\n• التخزين: احفظه في عبوته محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام).${EDU_TAIL_AR}`,
    ),
  },
  brands: brands('a601206', ['Ceftin']),
  sources: [src('Cefuroxime', 'a601206', '2026-06-15')],
  notes: NOTE + NOTE_BRANDS + ' This record is based on the oral (tablet) page; the injection has a separate page.',
};

const CEFTRIAXONE: SeedItem = {
  id: 'ceftriaxone',
  fields: {
    genericName: b('Ceftriaxone', 'سيفترياكسون'),
    activeIngredients: b('Ceftriaxone', 'سيفترياكسون'),
    drugClass: b('Cephalosporin antibiotic, 3rd generation (works by killing bacteria)', 'مضاد حيوي من السيفالوسبورينات، الجيل الثالث (يقتل البكتيريا)'),
    strengths: b(
      `Form: injection. A powder is mixed with liquid, or a premixed product is used, and it is given into a vein over 30 or 60 minutes or into a muscle. ${STR_EN}`,
      `الشكل: حقنة. يُخلط المسحوق بسائل أو يُستخدم منتج جاهز، ويُعطى في الوريد خلال 30 أو 60 دقيقة أو في العضل. ${STR_AR}`,
    ),
    approvedUses: b(
      `Treats certain infections caused by bacteria. It is also given before certain operations to prevent infection afterwards. Sometimes it is used to prevent infection in penicillin-allergic people with a heart condition having dental or upper respiratory procedures, in people with fever and very few white blood cells, in close contacts of someone with meningitis, and after sexual assault or human or animal bites.${VIRAL_EN}`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا، ويُعطى قبل بعض العمليات للوقاية من العدوى بعدها. ويُستخدم أحيانًا للوقاية من العدوى عند من لديهم حساسية من البنسلين ومرض في القلب قبل إجراءات الأسنان أو الجهاز التنفسي العلوي، وعند من لديهم حمى ونقص شديد في كريات الدم البيضاء، وللمخالطين لمريض التهاب السحايا، وبعد الاعتداء الجنسي أو عضّات البشر والحيوانات.${VIRAL_AR}`,
    ),
    ageRestrictions: b(
      'The source says to tell your doctor if your child was born prematurely or is younger than 4 weeks old, because the doctor may not want the baby to receive it. Check the official label for age-specific information.',
      'يذكر المصدر أن تخبر الطبيب إذا وُلد طفلك مبكرًا أو كان عمره أقل من 4 أسابيع، فقد لا يرغب الطبيب في إعطائه الدواء. راجع النشرة الرسمية لمعلومات العمر.',
    ),
    dosingReference: b(
      `Sometimes given as a single dose and sometimes once or twice a day for 4 to 14 days, depending on the infection. You may receive it in a hospital or doctor's office, or at home after your healthcare provider shows you how. Use every dose until the prescription is finished, even if you feel better.${NODOSE_EN}`,
      `يُعطى أحيانًا بجرعة واحدة وأحيانًا مرة أو مرتين يوميًا لمدة 4 إلى 14 يومًا حسب العدوى. قد تتلقاه في المستشفى أو عيادة الطبيب، أو في المنزل بعد أن يعلمك مقدم الرعاية الصحية. استخدم كل الجرعات حتى ينتهي العلاج حتى لو شعرت بتحسن.${NODOSE_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; or have or have had allergies, digestive problems especially colitis, malnutrition, vitamin K problems, or kidney or liver disease. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو لديك أو كان لديك حساسية أو مشكلات في الجهاز الهضمي خاصة التهاب القولون أو سوء تغذية أو مشكلات في فيتامين K أو مرض في الكلى أو الكبد. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): pain, tenderness, hardness or warmth where it was injected; pale skin, weakness or shortness of breath when exercising; diarrhea.\nSerious (call your doctor immediately): rash, difficulty swallowing or breathing, swelling of the throat or tongue, peeling or blistering skin; ${CDIFF_EN}; nausea and vomiting, stomach pain or bloating, heartburn, chest pain; passing urine more or less often than usual, pink, brown, red, cloudy or bad-smelling urine, painful urination, severe pain in the side and back; swelling of the legs and feet; a return of fever, sore throat, chills or other signs of infection; seizures.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): ألم أو حساسية أو تصلب أو دفء في مكان الحقن؛ شحوب الجلد أو ضعف أو ضيق نفس عند المجهود؛ إسهال.\nالخطيرة (اتصل بالطبيب فورًا): طفح أو صعوبة في البلع أو التنفس أو تورم الحلق أو اللسان أو تقشّر أو تقرّح الجلد؛ ${CDIFF_AR}؛ غثيان وقيء وألم أو انتفاخ في المعدة وحرقة وألم في الصدر؛ كثرة أو قلة التبول أو بول وردي أو بني أو أحمر أو عكر أو كريه الرائحة أو ألم عند التبول أو ألم شديد في الجنب والظهر؛ تورم الساقين والقدمين؛ عودة الحمى أو التهاب الحلق أو القشعريرة أو علامات العدوى؛ تشنجات.`,
    ),
    interactions: b(
      `${INT_EN}\nTell the laboratory staff you are receiving it before any lab test. If you have diabetes and test your urine for sugar, use Clinistix or TesTape (not Clinitest). It may interfere with some home blood-glucose tests: check your monitor's instructions or ask your doctor.\n${NOLIST_EN}`,
      `${INT_AR}\nأخبر العاملين في المختبر أنك تتلقاه قبل أي تحليل. وإذا كنت مصابًا بالسكري وتفحص سكر البول فاستخدم Clinistix أو TesTape (وليس Clinitest). وقد يؤثر في بعض أجهزة قياس سكر الدم المنزلية: راجع تعليمات جهازك أو اسأل الطبيب.\n${NOLIST_AR}`,
    ),
    pregnancyBreastfeeding: PREG,
    renalHepatic: RENAL,
    patientEducation: b(
      `• Use every dose as directed and finish the course even if you feel better. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor.\n• If you give it at home, make sure you understand your healthcare provider's directions, including how to store it.\n• Missed dose: use it as soon as you remember, unless it is almost time for the next dose; then skip it. Never use a double dose.\n• Keep your normal diet unless your doctor says otherwise.${EDU_TAIL_EN}`,
      `• استخدم كل جرعة كما وُصفت وأكمل العلاج حتى لو شعرت بتحسن. التوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• يُتوقع أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب.\n• إذا كنت تعطيه في المنزل فتأكد أنك فهمت تعليمات مقدم الرعاية الصحية، ومنها طريقة التخزين.\n• نسيان جرعة: استخدمها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تستخدم جرعة مضاعفة أبدًا.\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.${EDU_TAIL_AR}`,
    ),
  },
  brands: [],
  sources: [src('Ceftriaxone Injection', 'a685032', '2026-07-15')],
  notes: NOTE + ' This record is based on the injection page (the only form on MedlinePlus). The US brand name on the source page is discontinued, so none is listed: add local (Egyptian) brands, manufacturers and barcodes only from an official local source.',
};

const METRONIDAZOLE: SeedItem = {
  id: 'metronidazole',
  fields: {
    genericName: b('Metronidazole', 'ميترونيدازول'),
    activeIngredients: b('Metronidazole', 'ميترونيدازول'),
    drugClass: b('Nitroimidazole antimicrobial (works by stopping bacteria from growing)', 'مضاد ميكروبات من فئة النيتروإيميدازول (يوقف نمو البكتيريا)'),
    strengths: b(`Forms: tablet, capsule, and oral suspension (liquid) taken by mouth. ${STR_EN}`, `الأشكال: قرص وكبسولة ومعلّق سائل يُؤخذ بالفم. ${STR_AR}`),
    approvedUses: b(
      `Treats certain infections in the body caused by bacteria, including sexually transmitted infections and bacterial vaginosis in women. Important warning on the source page: metronidazole can cause cancer in laboratory animals, so talk to your doctor about the risks and benefits.${VIRAL_EN.replace('colds, flu', 'colds, flu')}`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا في الجسم ومنها الأمراض المنقولة جنسيًا والتهاب المهبل البكتيري عند النساء. تحذير مهم في صفحة المصدر: قد يسبب ميترونيدازول السرطان في حيوانات التجارب، لذلك ناقش مع الطبيب المخاطر والفوائد.${VIRAL_AR}`,
    ),
    ageRestrictions: b(
      'This source page does not state an age limit. It says people with Cockayne syndrome (a serious genetic disorder), including children, will probably be told not to take it. Check the official label for age-specific information.',
      'لا تذكر صفحة المصدر حدًّا للعمر. وتذكر أن المصابين بمتلازمة كوكاين (اضطراب وراثي خطير) ومنهم الأطفال سيُطلب منهم غالبًا عدم تناوله. راجع النشرة الرسمية لمعلومات العمر.',
    ),
    dosingReference: b(
      `Taken as a one-time dose (or split into two doses on one day) or two to four times a day, exactly as directed. Shake the liquid well and measure it with a dosing spoon, oral syringe or measuring cup, not a household spoon. Keep taking it even if you feel well and do not stop without talking to your doctor.${NODOSE_EN}`,
      `يُؤخذ بجرعة واحدة (أو مقسّمة على جرعتين في يوم واحد) أو من مرتين إلى أربع مرات يوميًا، تمامًا كما وُصف. رُجّ السائل جيدًا وقِسه بملعقة أو حقنة فموية أو كوب قياس وليس بملعقة منزلية. استمر في تناوله حتى لو شعرت بتحسن ولا تتوقف دون استشارة الطبيب.${NODOSE_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; take disulfiram or stopped it in the past two weeks; have Cockayne syndrome (you will probably be told not to take it); or have or have had Crohn's disease, blood problems, kidney or liver disease, a yeast infection, or a condition that affects the brain. Do not drink alcohol or use products containing alcohol or propylene glycol during treatment and for at least 3 days after the last dose. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو تتناول ديسولفيرام أو توقفت عنه خلال الأسبوعين الماضيين؛ أو لديك متلازمة كوكاين (غالبًا سيُطلب منك عدم تناوله)؛ أو لديك أو كان لديك داء كرون أو مشكلات في الدم أو مرض في الكلى أو الكبد أو عدوى فطرية أو حالة تؤثر في الدماغ. لا تشرب الكحول ولا تستخدم منتجات تحتوي على الكحول أو البروبيلين جليكول أثناء العلاج ولمدة 3 أيام على الأقل بعد آخر جرعة. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): vomiting, nausea, diarrhea, upset stomach, stomach cramps, constipation, loss of appetite, headache, dry mouth, furry tongue, mouth or tongue irritation, a sharp unpleasant metallic taste. With alcohol it can cause nausea, vomiting, cramps, headache, sweating and flushing.\nSerious (call your doctor immediately): numbness, pain, burning or tingling in the hands or feet; seizures, problems with coordination, confusion, dizziness; rash, itching, hives, flushing; peeling or blistering skin, blisters or sores in the mouth, redness or swelling of the face, hands or soles of the feet, muscle or joint aches; stuffy nose, fever, sore throat or other signs of infection; difficulty speaking.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): قيء وغثيان وإسهال واضطراب المعدة وتقلصات وإمساك وفقدان الشهية وصداع وجفاف الفم وطبقة على اللسان وتهيج الفم أو اللسان ومذاق معدني حاد وغير مستحب. ومع الكحول قد يسبب غثيانًا وقيئًا وتقلصات وصداعًا وتعرقًا واحمرارًا.\nالخطيرة (اتصل بالطبيب فورًا): تنميل أو ألم أو حرقان أو وخز في اليدين أو القدمين؛ تشنجات أو اضطراب في التوازن أو ارتباك أو دوار؛ طفح أو حكة أو شرى أو احمرار؛ تقشّر أو تقرّح الجلد أو قروح في الفم أو احمرار أو تورم الوجه أو اليدين أو باطن القدمين أو آلام في العضلات والمفاصل؛ انسداد الأنف أو حمى أو التهاب الحلق أو علامات عدوى؛ صعوبة في الكلام.`,
    ),
    interactions: b(
      `${INT_EN}\nDisulfiram (taken now or in the past two weeks) is named on the source page, and cimetidine may interact with it. Do not drink alcohol or take products with alcohol or propylene glycol during treatment and for at least 3 days after the last dose.\nTell the laboratory staff you are taking it before any lab test. ${NOLIST_EN}`,
      `${INT_AR}\nتذكر صفحة المصدر ديسولفيرام (الآن أو خلال الأسبوعين الماضيين)، وقد يتداخل معه السيميتيدين. لا تشرب الكحول ولا تتناول منتجات تحتوي على الكحول أو البروبيلين جليكول أثناء العلاج ولمدة 3 أيام على الأقل بعد آخر جرعة.\nأخبر العاملين في المختبر أنك تتناوله قبل أي تحليل. ${NOLIST_AR}`,
    ),
    pregnancyBreastfeeding: b(
      'Pregnant women generally should not take it during the first trimester (first 3 months). Tell your doctor if you are pregnant or plan to become pregnant, and call your doctor if you become pregnant while taking it. It passes into breast milk: your doctor may tell you to pump and discard your milk during treatment and for 48 hours after the last dose.',
      'لا ينبغي عمومًا للحوامل تناوله خلال الثلث الأول (أول 3 أشهر). أخبري الطبيب إذا كنتِ حاملًا أو تخططين للحمل، واتصلي به إذا حملتِ أثناء تناوله. وينتقل إلى حليب الأم: قد يطلب منك الطبيب شفط الحليب والتخلص منه أثناء العلاج ولمدة 48 ساعة بعد آخر جرعة.',
    ),
    renalHepatic: RENAL,
    patientEducation: b(
      `• Take it exactly as directed and keep taking it even if you feel well. Do not stop without talking to your doctor: stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.\n• Avoid alcohol and products with alcohol or propylene glycol during treatment and for at least 3 days after the last dose.${EDU_MISSED_EN.replace('\n• Keep your normal diet unless your doctor says otherwise.', '')}\n• Storage: keep it in its container, tightly closed, at room temperature, away from light, heat and moisture (not in the bathroom).${EDU_TAIL_EN}`,
      `• تناوله تمامًا كما وُصف واستمر فيه حتى لو شعرت بتحسن. لا تتوقف دون استشارة الطبيب: التوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالَجة جزئيًا وتصبح البكتيريا مقاومة.\n• تجنب الكحول والمنتجات التي تحتوي على الكحول أو البروبيلين جليكول أثناء العلاج ولمدة 3 أيام على الأقل بعد آخر جرعة.${EDU_MISSED_AR.replace('\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.', '')}\n• التخزين: احفظه في عبوته محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الضوء والحرارة والرطوبة (وليس في الحمام).${EDU_TAIL_AR}`,
    ),
  },
  brands: brands('a689011', ['Flagyl', 'Likmez']),
  sources: [src('Metronidazole', 'a689011', '2026-08-15')],
  notes: NOTE + NOTE_BRANDS,
};

const NITROFURANTOIN: SeedItem = {
  id: 'nitrofurantoin',
  fields: {
    genericName: b('Nitrofurantoin', 'نيتروفورانتوين'),
    activeIngredients: b('Nitrofurantoin', 'نيتروفورانتوين'),
    drugClass: b('Nitrofuran antibiotic (works by killing the bacteria that cause the infection)', 'مضاد حيوي من فئة النيتروفوران (يقتل البكتيريا المسببة للعدوى)'),
    strengths: b(`Forms: capsule and oral suspension (liquid) taken by mouth. ${STR_EN}`, `الأشكال: كبسولة ومعلّق سائل يُؤخذ بالفم. ${STR_AR}`),
    approvedUses: b(`Treats urinary tract infections.${VIRAL_EN}`, `يُستخدم لعلاج التهابات المسالك البولية.${VIRAL_AR}`),
    ageRestrictions: b(
      'This source page does not state an age limit. It does warn that it can cause problems in newborns if taken in the last month of pregnancy. Check the official label for age-specific information.',
      'لا تذكر صفحة المصدر حدًّا للعمر. لكنها تحذر من أنه قد يسبب مشكلات للمواليد إذا أُخذ في الشهر الأخير من الحمل. راجع النشرة الرسمية لمعلومات العمر.',
    ),
    dosingReference: b(
      `Usually taken with food two or four times a day for at least 7 days, at about the same times every day, exactly as directed. Shake the liquid well and measure it with a dose-measuring spoon or cup, not a household spoon. Take it until the prescription is finished, even if you feel better.${NODOSE_EN}`,
      `يُؤخذ عادة مع الطعام مرتين أو أربع مرات يوميًا لمدة 7 أيام على الأقل، في نفس الأوقات تقريبًا يوميًا وتمامًا كما وُصف. رُجّ السائل جيدًا وقِسه بملعقة أو كوب قياس وليس بملعقة منزلية. تناوله حتى ينتهي العلاج حتى لو شعرت بتحسن.${NODOSE_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or to any ingredient of the capsules or liquid; have ever had kidney disease, or jaundice or other liver problems while taking nitrofurantoin (you will probably be told not to take it); or have or have had anemia, diabetes, lung problems, nerve damage, an electrolyte imbalance, low vitamin B levels, or G-6-PD deficiency (an inherited blood disease). It should not be taken in the last month of pregnancy. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أحد مكونات الكبسولات أو السائل؛ أو أصبت من قبل بمرض في الكلى أو باليرقان أو بمشكلة في الكبد أثناء تناول نيتروفورانتوين (غالبًا سيُطلب منك عدم تناوله)؛ أو لديك أو كان لديك فقر دم أو سكري أو مشكلات في الرئة أو تلف في الأعصاب أو اختلال في الأملاح أو نقص في فيتامين ب أو نقص إنزيم G-6-PD (مرض دم وراثي). ولا ينبغي تناوله في الشهر الأخير من الحمل. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, loss of appetite, heartburn or gas, hair loss, headache.\nSerious (call your doctor immediately or get emergency care): rash, hives, difficulty breathing or swallowing, swelling of the eyes, face, mouth, lips, tongue or throat; fever or chills; chest pain; a persistent cough; numbness, tingling or pinprick feeling in the fingers and toes; muscle weakness; yellow skin or eyes, dark urine, fatigue or pain in the upper right stomach; confusion, dizziness, paleness; severe watery or bloody diarrhea, which can happen up to 2 months or more after treatment; eye pain or vision changes.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء وفقدان الشهية وحرقة أو غازات وتساقط الشعر وصداع.\nالخطيرة (اتصل بالطبيب فورًا أو اطلب الطوارئ): طفح أو شرى أو صعوبة في التنفس أو البلع أو تورم العينين أو الوجه أو الفم أو الشفتين أو اللسان أو الحلق؛ حمى أو قشعريرة؛ ألم في الصدر؛ سعال مستمر؛ تنميل أو وخز في الأصابع وأصابع القدمين؛ ضعف عضلي؛ اصفرار الجلد أو العينين أو بول داكن أو إرهاق أو ألم أعلى يمين المعدة؛ ارتباك أو دوار أو شحوب؛ إسهال مائي أو دموي شديد قد يحدث حتى شهرين أو أكثر بعد العلاج؛ ألم في العين أو تغيّر في الرؤية.`,
    ),
    interactions: b(
      `${INT_EN}\nAntacids may interact with it: do not start one without talking to your healthcare provider.\nIt can give false results on urine tests for glucose: if you have diabetes and test your urine, tell your doctor you are taking it.\n${NOLIST_EN}`,
      `${INT_AR}\nقد تتداخل معه مضادات الحموضة: لا تبدأ بأحدها دون استشارة مقدم الرعاية الصحية.\nقد يعطي نتائج خاطئة في فحوص سكر البول: إذا كنت مصابًا بالسكري وتفحص بولك فأخبر الطبيب أنك تتناوله.\n${NOLIST_AR}`,
    ),
    pregnancyBreastfeeding: b(
      'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding, and call your doctor if you become pregnant while taking it. It may cause problems in newborns if taken in the last month of pregnancy, so it should not be taken then.',
      'أخبري الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين، واتصلي به إذا حملتِ أثناء تناوله. قد يسبب مشكلات للمواليد إذا أُخذ في الشهر الأخير من الحمل، لذلك لا ينبغي تناوله حينها.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have ever had kidney disease, or jaundice or other liver problems while taking nitrofurantoin: you will probably be told not to take it. This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا أصبت من قبل بمرض في الكلى أو باليرقان أو بمشكلة في الكبد أثناء تناول نيتروفورانتوين: غالبًا سيُطلب منك عدم تناوله. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `${EDU_FINISH_EN.replace('even if you feel better.', 'even if you feel better (the infection may be harder to treat if you stop early).')}\n• Take it with food, and shake the liquid well before each use.\n• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it and take the rest of the day's doses at evenly spaced times. Never take a double dose.\n• Keep your normal diet unless your doctor says otherwise.\n• Storage: keep it in its container, tightly closed, at room temperature, away from heat and moisture (not in the bathroom).${EDU_TAIL_EN}`,
      `${EDU_FINISH_AR.replace('حتى لو شعرت بتحسن.', 'حتى لو شعرت بتحسن (قد تصبح العدوى أصعب في العلاج إذا توقفت مبكرًا).')}\n• تناوله مع الطعام، ورُجّ السائل جيدًا قبل كل استخدام.\n• نسيان جرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتخطَّها وتناول بقية جرعات اليوم على فترات متساوية. لا تأخذ جرعة مضاعفة أبدًا.\n• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.\n• التخزين: احفظه في عبوته محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام).${EDU_TAIL_AR}`,
    ),
  },
  brands: brands('a682291', ['Furadantin oral suspension', 'Macrobid', 'Macrodantin']),
  sources: [src('Nitrofurantoin', 'a682291', '2022-01-15')],
  notes: NOTE + NOTE_BRANDS + ' The source page was last revised in January 2022: check the official label for newer information.',
};

const CIPROFLOXACIN: SeedItem = {
  id: 'ciprofloxacin',
  fields: {
    genericName: b('Ciprofloxacin', 'سيبروفلوكساسين'),
    activeIngredients: b('Ciprofloxacin', 'سيبروفلوكساسين'),
    drugClass: b('Fluoroquinolone antibiotic (works by killing bacteria)', 'مضاد حيوي من فئة الفلوروكينولونات (يقتل البكتيريا)'),
    strengths: b(
      `Forms: tablet, extended-release tablet, and oral suspension (liquid) taken by mouth. One type cannot be substituted for another: use only the type your doctor prescribed. ${STR_EN}`,
      `الأشكال: قرص وقرص ممتد المفعول ومعلّق سائل يُؤخذ بالفم. لا يجوز استبدال نوع بآخر: استخدم النوع الذي وصفه الطبيب فقط. ${STR_AR}`,
    ),
    approvedUses: b(
      `Treats or prevents certain infections caused by bacteria, including plague and inhalation anthrax. Sometimes it is used for tularemia, cat scratch disease, Legionnaires' disease, chancroid, granuloma inguinale, tuberculosis and Crohn's disease (as part of treatment), to prevent travelers' diarrhea in some people, and to prevent infection in people with fever and very few white blood cells, in some surgeries, and in close contacts of someone with meningitis.\nThe source page carries an IMPORTANT WARNING (tendon, nerve and brain side effects, and worsening of myasthenia gravis): talk to your doctor about the risks.${VIRAL_EN}`,
      `يُستخدم لعلاج أو منع بعض العدوى التي تسببها البكتيريا ومنها الطاعون والجمرة الخبيثة الاستنشاقية. ويُستخدم أحيانًا للتولاريميا ومرض خدش القطة ومرض الفيلق والقرحة الرخوة والورم الحبيبي الأربي والسل ومرض كرون (ضمن العلاج)، وللوقاية من إسهال المسافرين عند البعض، وللوقاية من العدوى عند من لديهم حمى ونقص شديد في كريات الدم البيضاء وفي بعض الجراحات وللمخالطين لمريض التهاب السحايا.\nتحمل صفحة المصدر تحذيرًا مهمًا (آثار على الأوتار والأعصاب والدماغ وتفاقم الوهن العضلي الوبيل): ناقش المخاطر مع الطبيب.${VIRAL_AR}`,
    ),
    ageRestrictions: b(
      'The source says it should not normally be given to children and teens under 18 because it can cause bone, joint and joint-tissue problems, except for certain serious infections that cannot be treated with other antibiotics or exposure to plague or anthrax in the air. The risk of tendon problems is highest in people over 60.',
      'يذكر المصدر أنه لا يُعطى عادة للأطفال والمراهقين دون 18 سنة لأنه قد يسبب مشكلات في العظام والمفاصل وأنسجتها، إلا في بعض العدوى الخطيرة التي لا تُعالج بمضادات أخرى أو التعرض للطاعون أو الجمرة الخبيثة المحمولة بالهواء. وخطر مشكلات الأوتار أعلى عند من تجاوزوا 60 عامًا.',
    ),
    dosingReference: b(
      `Taken by mouth once or twice a day, with or without food, at about the same time(s) each day; for gonorrhea it is a single dose. The length of treatment depends on the infection. Do not take it with dairy products or calcium-fortified juice alone (a meal that includes them is fine). Swallow tablets whole; shake the suspension for 15 seconds before each use. Drink plenty of fluids. Do not take more than two doses of tablets or suspension, or more than one extended-release tablet, in a day.${NODOSE_EN}`,
      `يُؤخذ بالفم مرة أو مرتين يوميًا، مع الطعام أو بدونه، في نفس الأوقات تقريبًا يوميًا؛ وفي السيلان يُؤخذ بجرعة واحدة. وتعتمد مدة العلاج على العدوى. لا تتناوله مع منتجات الألبان أو العصائر المدعّمة بالكالسيوم وحدها (لا بأس بوجبة تتضمنها). ابتلع الأقراص كاملة ورُجّ المعلّق 15 ثانية قبل كل استخدام. اشرب سوائل كثيرة. لا تتجاوز جرعتين يوميًا من الأقراص أو المعلّق، ولا قرصًا ممتد المفعول واحدًا في اليوم.${NODOSE_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; have or have had a kidney, heart or lung transplant, kidney disease, a joint or tendon disorder such as rheumatoid arthritis, or take steroids such as dexamethasone, methylprednisolone or prednisone; have had nerve damage (peripheral neuropathy), seizures, epilepsy, stroke or narrowed brain blood vessels; have myasthenia gravis (the doctor may tell you not to take it); or have or have a family history of a prolonged QT interval, an irregular or slow heartbeat, heart failure, heart attack, aortic aneurysm, high blood pressure, poor circulation, Marfan or Ehlers-Danlos syndrome, low potassium or magnesium, diabetes or low blood sugar, or liver disease. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو لديك أو كان لديك زرع كلية أو قلب أو رئة أو مرض في الكلى أو اضطراب في المفاصل أو الأوتار كالتهاب المفاصل الروماتويدي، أو تتناول ستيرويدات مثل ديكساميثازون أو ميثيل بريدنيزولون أو بريدنيزون؛ أو أصبت بتلف الأعصاب الطرفية أو تشنجات أو صرع أو سكتة أو تضيق في أوعية الدماغ؛ أو لديك وهن عضلي وبيل (قد يطلب منك الطبيب عدم تناوله)؛ أو لديك أو في عائلتك إطالة في فترة QT أو اضطراب أو بطء في نظم القلب أو فشل القلب أو نوبة قلبية أو أم دم أبهرية أو ارتفاع ضغط أو ضعف الدورة الدموية أو متلازمة مارفان أو إهلرز-دانلوس أو نقص البوتاسيوم أو المغنيسيوم أو السكري أو انخفاض سكر الدم أو مرض في الكبد. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, diarrhea, stomach pain, heartburn, vaginal itching or discharge, pale skin, unusual tiredness or sleepiness. It can make skin very sensitive to sunlight and UV light.\nSerious (stop taking it and call your doctor immediately or get emergency care): tendon pain, swelling, tenderness or stiffness, or a snap or pop in a tendon area; numbness, tingling, burning, pain or weakness in the arms or legs; seizures, tremors, dizziness, lasting headaches, trouble sleeping, nightmares, hallucinations, confusion, anxiety, depression, memory changes or thoughts of harming yourself; muscle weakness or breathing difficulty (especially with myasthenia gravis); severe watery or bloody diarrhea, which can happen up to 2 months or more after treatment; ${ALLERGY_EN}; peeling or blistering skin; a lasting or worsening cough; yellow skin or eyes, dark urine or light stool; signs of low blood sugar (extreme hunger or thirst, shakiness, sweating, fast heartbeat, blurred vision); fainting; decreased urination; sudden pain in the chest, stomach or back.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء وإسهال وألم في المعدة وحرقة وحكة أو إفرازات مهبلية وشحوب وإرهاق أو نعاس غير معتاد. وقد يجعل الجلد شديد الحساسية للشمس والأشعة فوق البنفسجية.\nالخطيرة (أوقفه واتصل بالطبيب فورًا أو اطلب الطوارئ): ألم أو تورم أو حساسية أو تيبّس في وتر أو سماع طقطقة في منطقة وتر؛ تنميل أو وخز أو حرقان أو ألم أو ضعف في الذراعين أو الساقين؛ تشنجات أو رعشة أو دوار أو صداع مستمر أو صعوبة في النوم أو كوابيس أو هلوسات أو ارتباك أو قلق أو اكتئاب أو تغيّر في الذاكرة أو أفكار لإيذاء النفس؛ ضعف عضلي أو صعوبة في التنفس (خاصة مع الوهن العضلي الوبيل)؛ إسهال مائي أو دموي شديد قد يحدث حتى شهرين أو أكثر بعد العلاج؛ ${ALLERGY_AR}؛ تقشّر أو تقرّح الجلد؛ سعال مستمر أو متفاقم؛ اصفرار الجلد أو العينين أو بول داكن أو براز فاتح؛ علامات انخفاض سكر الدم (جوع أو عطش شديد أو رعشة أو تعرق أو خفقان أو تشوش الرؤية)؛ إغماء؛ قلة التبول؛ ألم مفاجئ في الصدر أو المعدة أو الظهر.`,
    ),
    interactions: b(
      `${INT_EN}\nTake antacids or multivitamins containing calcium, magnesium hydroxide, aluminum hydroxide, zinc or iron, and didanosine solution, sevelamer, lanthanum carbonate or sucralfate, at least 6 hours before or 2 hours after it. NSAIDs such as ibuprofen and naproxen may interact: do not start them without talking to your healthcare provider. Tell your doctor and pharmacist if you take steroids by mouth or injection.\nIf you have diabetes your doctor may ask you to check your blood sugar more often. ${NOLIST_EN}`,
      `${INT_AR}\nتناول مضادات الحموضة أو الفيتامينات المتعددة المحتوية على الكالسيوم أو هيدروكسيد المغنيسيوم أو هيدروكسيد الألمنيوم أو الزنك أو الحديد، ومحلول ديدانوزين أو سيفيلامير أو كربونات اللانثانوم أو سوكرالفات، قبله بـ 6 ساعات على الأقل أو بعده بساعتين. وقد تتداخل مضادات الالتهاب غير الستيرويدية مثل إيبوبروفين ونابروكسين: لا تبدأ بها دون استشارة مقدم الرعاية الصحية. وأخبر الطبيب والصيدلي إذا كنت تتناول ستيرويدات بالفم أو بالحقن.\nإذا كنت مصابًا بالسكري فقد يطلب منك الطبيب فحص سكر الدم أكثر. ${NOLIST_AR}`,
    ),
    pregnancyBreastfeeding: b(
      'Tell your doctor if you are pregnant or plan to become pregnant, and call your doctor if you become pregnant while taking it. Do not breastfeed while taking it and for at least 2 days after the last dose.',
      'أخبري الطبيب إذا كنتِ حاملًا أو تخططين للحمل، واتصلي به إذا حملتِ أثناء تناوله. لا تُرضعي أثناء تناوله ولمدة يومين على الأقل بعد آخر جرعة.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have kidney disease or a kidney transplant, or liver disease. This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا كان لديك مرض في الكلى أو زرع كلية أو مرض في الكبد. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `• Take it exactly as directed and finish the prescription even if you feel better, unless you get the serious side effects above: do not stop without talking to your doctor otherwise. Stopping too soon can let bacteria become resistant.\n• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor. With a urinary infection, call if fever or back pain develops.\n• Stop it and call your doctor at the first sign of tendon pain: rest the area.\n• Do not drive or do tasks needing alertness until you know how it affects you. Avoid caffeine in large amounts and drink plenty of fluids.\n• Avoid unnecessary sun and tanning beds; wear protective clothing and sunscreen.\n• Missed dose (tablets or suspension): if the next dose is 6 hours or more away take it now, otherwise skip it. Never take a double dose.\n• Storage: keep tablets at room temperature away from heat and moisture (not in the bathroom). Keep the suspension in the refrigerator or at room temperature for up to 14 days, never frozen, and discard leftovers after 14 days.${EDU_TAIL_EN}`,
      `• تناوله تمامًا كما وُصف وأكمل العلاج حتى لو شعرت بتحسن، إلا إذا ظهرت الآثار الخطيرة المذكورة أعلاه، ولا تتوقف دون استشارة الطبيب فيما عدا ذلك. التوقف مبكرًا قد يجعل البكتيريا مقاومة.\n• يُتوقع أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب. وفي التهاب المسالك البولية اتصل إذا ظهرت حمى أو ألم في الظهر.\n• أوقفه واتصل بالطبيب عند أول علامة لألم في وتر، وأرِح المنطقة.\n• لا تقد السيارة ولا تؤدِّ مهام تحتاج يقظة حتى تعرف تأثيره عليك. تجنب الكافيين بكثرة واشرب سوائل كثيرة.\n• تجنب التعرض غير الضروري للشمس وأجهزة التسمير؛ وارتدِ ملابس واقية وواقي شمس.\n• نسيان جرعة (أقراص أو معلّق): إذا كان موعد الجرعة التالية بعد 6 ساعات أو أكثر فتناولها الآن، وإلا فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.\n• التخزين: احفظ الأقراص في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام). واحفظ المعلّق في الثلاجة أو في درجة حرارة الغرفة لمدة حتى 14 يومًا دون تجميد، وتخلص من المتبقي بعد 14 يومًا.${EDU_TAIL_AR}`,
    ),
  },
  brands: brands('a688016', ['Cipro oral suspension', 'Cipro tablets']),
  sources: [src('Ciprofloxacin', 'a688016', '2026-08-15')],
  notes: NOTE + NOTE_BRANDS + ' The source page opens with an IMPORTANT WARNING: reviewers should check this record against the official label before approval.',
};

const CLINDAMYCIN: SeedItem = {
  id: 'clindamycin',
  fields: {
    genericName: b('Clindamycin', 'كليندامايسين'),
    activeIngredients: b('Clindamycin', 'كليندامايسين'),
    drugClass: b('Lincosamide (lincomycin-type) antibiotic (works by slowing or stopping the growth of bacteria)', 'مضاد حيوي من فئة اللينكوزاميدات (يبطّئ نمو البكتيريا أو يوقفه)'),
    strengths: b(`Forms: capsule and oral solution (liquid) taken by mouth. ${STR_EN}`, `الأشكال: كبسولة ومحلول سائل يُؤخذ بالفم. ${STR_AR}`),
    approvedUses: b(
      `Treats certain types of bacterial infections. It is also used for anthrax and malaria, and sometimes for acne, for toxoplasmosis when other medicines cannot be used, and to prevent heart-valve infection (endocarditis) after dental procedures in people at risk.\nThe source page carries an IMPORTANT WARNING: antibiotics like clindamycin can let dangerous bacteria overgrow in the large intestine and cause mild diarrhea or a life-threatening colitis, during treatment or up to several months after. Talk to your doctor about the risks.${VIRAL_EN}`,
      `يُستخدم لعلاج بعض أنواع العدوى البكتيرية، ولعلاج الجمرة الخبيثة والملاريا، وأحيانًا لحب الشباب وللتوكسوبلازما عند تعذّر استخدام أدوية أخرى، وللوقاية من التهاب صمامات القلب (التهاب الشغاف) بعد إجراءات الأسنان عند المعرّضين للخطر.\nتحمل صفحة المصدر تحذيرًا مهمًا: المضادات الحيوية مثل كليندامايسين قد تسمح بتكاثر بكتيريا خطيرة في الأمعاء الغليظة فتسبب إسهالًا خفيفًا أو التهاب قولون مهددًا للحياة، أثناء العلاج أو حتى عدة أشهر بعده. ناقش المخاطر مع الطبيب.${VIRAL_AR}`,
    ),
    ageRestrictions: AGE_NONE,
    dosingReference: b(
      `Taken by mouth three to four times a day, at about the same times each day, for as long as the doctor says. Swallow capsules whole with a full glass (180 to 240 mL) of water so they do not irritate the throat, and stay upright for at least 30 minutes afterward.${NODOSE_EN}`,
      `يُؤخذ بالفم ثلاث إلى أربع مرات يوميًا، في نفس الأوقات تقريبًا، للمدة التي يحددها الطبيب. ابتلع الكبسولات كاملة مع كوب ماء كامل (180 إلى 240 مل) كي لا تهيّج الحلق، وابقَ جالسًا أو واقفًا 30 دقيقة على الأقل بعدها.${NODOSE_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; have or have had colitis or other stomach or intestinal conditions; or have or have had asthma, allergies, eczema, or kidney or liver disease. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو لديك أو كان لديك التهاب القولون أو أمراض أخرى في المعدة أو الأمعاء؛ أو لديك أو كان لديك ربو أو حساسية أو أكزيما أو مرض في الكلى أو الكبد. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, an unpleasant or metallic taste, joint pain, thick white vaginal discharge, vaginal burning, itching or swelling.\nSerious (call your doctor immediately or get emergency care): watery or bloody stools, diarrhea, stomach cramps or fever during treatment or in the first several months after; rash, hives, itching, peeling or blistering skin; hoarseness, difficulty breathing or swallowing, or swelling of the face, throat, tongue, lips, eyes, hands, feet, ankles or lower legs; yellow skin or eyes; decreased urination; new or worsening heartburn; painful swallowing.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء ومذاق غير مستحب أو معدني وألم في المفاصل وإفرازات مهبلية بيضاء سميكة وحرقان أو حكة أو تورم في المهبل.\nالخطيرة (اتصل بالطبيب فورًا أو اطلب الطوارئ): براز مائي أو دموي أو إسهال أو تقلصات أو حمى أثناء العلاج أو في الأشهر الأولى بعده؛ طفح أو شرى أو حكة أو تقشّر أو تقرّح الجلد؛ بحّة أو صعوبة في التنفس أو البلع أو تورم الوجه أو الحلق أو اللسان أو الشفتين أو العينين أو اليدين أو القدمين أو الكاحلين أو أسفل الساقين؛ اصفرار الجلد أو العينين؛ قلة التبول؛ حرقة جديدة أو متفاقمة؛ ألم عند البلع.`,
    ),
    interactions: b(`${INT_EN}\n${NOLIST_EN}`, `${INT_AR}\n${NOLIST_AR}`),
    pregnancyBreastfeeding: PREG,
    renalHepatic: RENAL,
    patientEducation: b(
      `${EDU_FINISH_EN}\n• Swallow capsules whole with a full glass of water and stay upright for at least 30 minutes.\n• Call your doctor if you get watery or bloody stools, diarrhea, cramps or fever, even months after you finish.${EDU_MISSED_EN}\n• Storage: keep it in its container, tightly closed, at room temperature, away from heat and moisture (not in the bathroom). Do not refrigerate the liquid because it may thicken; throw away unused liquid after 2 weeks.${EDU_TAIL_EN}`,
      `${EDU_FINISH_AR}\n• ابتلع الكبسولات كاملة مع كوب ماء كامل وابقَ جالسًا أو واقفًا 30 دقيقة على الأقل.\n• اتصل بالطبيب إذا ظهر براز مائي أو دموي أو إسهال أو تقلصات أو حمى حتى بعد أشهر من انتهاء العلاج.${EDU_MISSED_AR}\n• التخزين: احفظه في عبوته محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام). لا تضع السائل في الثلاجة لأنه قد يتكاثف؛ وتخلص من السائل غير المستخدم بعد أسبوعين.${EDU_TAIL_AR}`,
    ),
  },
  brands: brands('a682399', ['Cleocin']),
  sources: [src('Clindamycin', 'a682399', '2026-04-15')],
  notes: NOTE + NOTE_BRANDS + ' The source page opens with an IMPORTANT WARNING about colitis: reviewers should check this record against the official label before approval.',
};

const COTRIMOXAZOLE: SeedItem = {
  id: 'co-trimoxazole',
  fields: {
    genericName: b('Co-trimoxazole (sulfamethoxazole and trimethoprim)', 'كوتريموكسازول (سلفاميثوكسازول وتريميثوبريم)'),
    activeIngredients: b('Sulfamethoxazole and trimethoprim', 'سلفاميثوكسازول وتريميثوبريم'),
    drugClass: b('Sulfonamide antibiotic combination (works by stopping bacteria from growing)', 'تركيبة مضاد حيوي من فئة السلفوناميدات (توقف نمو البكتيريا)'),
    strengths: b(`Forms: tablet (including double-strength tablets) and oral suspension (liquid) taken by mouth. ${STR_EN}`, `الأشكال: قرص (ومنه الأقراص مضاعفة التركيز) ومعلّق سائل يُؤخذ بالفم. ${STR_AR}`),
    approvedUses: b(
      `Treats certain infections caused by bacteria and travelers' diarrhea. The source page says antibiotics will not work to kill viruses.\n(Summary of a US patient-information page: uses approved in your country may differ.)`,
      `يُستخدم لعلاج بعض العدوى التي تسببها البكتيريا وإسهال المسافرين. وتذكر صفحة المصدر أن المضادات الحيوية لا تقتل الفيروسات.\n(ملخص لصفحة معلومات مرضى أمريكية: قد تختلف الاستخدامات المعتمدة في بلدك.)`,
    ),
    ageRestrictions: AGE_NONE,
    dosingReference: b(
      `Taken by mouth two to four times a day, at about the same times each day; the doctor decides how often and for how long based on the infection. Shake the liquid well before each use. Drink plenty of fluids during treatment.${NODOSE_EN}`,
      `يُؤخذ بالفم من مرتين إلى أربع مرات يوميًا، في نفس الأوقات تقريبًا؛ ويقرر الطبيب عدد المرات والمدة حسب العدوى. رُجّ السائل جيدًا قبل كل استخدام. اشرب سوائل كثيرة أثناء العلاج.${NODOSE_AR}`,
    ),
    contraindications: b(
      `Tell your doctor or pharmacist before using it if you: are allergic to it or any other medicine, food, or substance; have had a low platelet count caused by sulfonamides or trimethoprim, abnormal red blood cells from low folic acid, phenylketonuria (PKU), or liver or kidney disease (you may be told not to take it); or have or have had severe allergies, asthma, low folic acid, HIV infection, porphyria, thyroid disease, or G-6-PD deficiency. It can harm an unborn baby. The doctor decides whether it is suitable.${CONTRA_TAIL_EN}`,
      `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كانت لديك حساسية منه أو من أي دواء أو غذاء أو مادة؛ أو أصبت بانخفاض الصفائح الدموية بسبب السلفوناميدات أو التريميثوبريم أو بخلل في كريات الدم الحمراء من نقص حمض الفوليك أو ببيلة الفينيل كيتون أو بمرض في الكبد أو الكلى (قد يُطلب منك عدم تناوله)؛ أو لديك أو كان لديك حساسية شديدة أو ربو أو نقص حمض الفوليك أو عدوى فيروس نقص المناعة أو بورفيريا أو مرض في الغدة الدرقية أو نقص إنزيم G-6-PD. وقد يضر الجنين. يقرر الطبيب مدى ملاءمته.${CONTRA_TAIL_AR}`,
    ),
    sideEffects: b(
      `Common (tell your doctor if severe or they do not go away): nausea, vomiting, loss of appetite. It can make skin sensitive to sunlight.\nSerious (call your doctor immediately or get emergency care): rash, itching, redness, peeling or blistering skin; sore throat; loss of consciousness; fever or chills; severe watery or bloody diarrhea, which can happen up to 2 months or more after treatment; shortness of breath, cough or difficulty breathing; unusual bruising or bleeding, red or purple skin spots; fever with rash, yellow skin or eyes, abdominal tenderness, nausea, vomiting, diarrhea or swollen lymph nodes.`,
      `الشائعة (أخبر الطبيب إذا كانت شديدة أو لا تزول): غثيان وقيء وفقدان الشهية. وقد يجعل الجلد حساسًا للشمس.\nالخطيرة (اتصل بالطبيب فورًا أو اطلب الطوارئ): طفح أو حكة أو احمرار أو تقشّر أو تقرّح الجلد؛ التهاب الحلق؛ فقدان الوعي؛ حمى أو قشعريرة؛ إسهال مائي أو دموي شديد قد يحدث حتى شهرين أو أكثر بعد العلاج؛ ضيق نفس أو سعال أو صعوبة في التنفس؛ كدمات أو نزف غير معتاد أو بقع حمراء أو بنفسجية في الجلد؛ حمى مع طفح أو اصفرار الجلد أو العينين أو ألم في البطن أو غثيان أو قيء أو إسهال أو تضخم الغدد الليمفاوية.`,
    ),
    interactions: b(`${INT_EN}\nTell the laboratory staff you are taking it before any lab test.\n${NOLIST_EN}`, `${INT_AR}\nأخبر العاملين في المختبر أنك تتناوله قبل أي تحليل.\n${NOLIST_AR}`),
    pregnancyBreastfeeding: b(
      'It can harm the unborn baby. Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding, and call your doctor immediately if you become pregnant while taking it.',
      'قد يضر الجنين. أخبري الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين، واتصلي به فورًا إذا حملتِ أثناء تناوله.',
    ),
    renalHepatic: b(
      'Tell your doctor if you have or have ever had liver or kidney disease: you may be told not to take it. This source gives no dose-adjustment rules; the doctor decides.',
      'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكبد أو الكلى: وقد يُطلب منك عدم تناوله. لا يذكر المصدر قواعد لتعديل الجرعة؛ يقرر الطبيب.',
    ),
    patientEducation: b(
      `${EDU_FINISH_EN}\n• Drink plenty of fluids. Shake the liquid well before each use.\n• Avoid unnecessary or prolonged sun exposure and wear protective clothing, sunglasses and sunscreen.${EDU_MISSED_EN}\n• Storage: keep it in its container, tightly closed, at room temperature, away from heat and moisture (not in the bathroom).${EDU_TAIL_EN}`,
      `${EDU_FINISH_AR}\n• اشرب سوائل كثيرة. ورُجّ السائل جيدًا قبل كل استخدام.\n• تجنب التعرض غير الضروري أو الطويل للشمس وارتدِ ملابس واقية ونظارات شمسية وواقي شمس.${EDU_MISSED_AR}\n• التخزين: احفظه في عبوته محكمة الإغلاق في درجة حرارة الغرفة بعيدًا عن الحرارة والرطوبة (وليس في الحمام).${EDU_TAIL_AR}`,
    ),
  },
  brands: brands('a684026', ['Bactrim', 'Bactrim DS', 'Septra', 'Septra DS', 'Sulfatrim suspension']),
  sources: [src('Co-trimoxazole', 'a684026', '2025-05-15')],
  notes: NOTE + NOTE_BRANDS + ' The source page was last revised in May 2025: check the official label for newer information.',
};

export const MORE: SeedItem[] = [
  AZITHROMYCIN,
  DOXYCYCLINE,
  CEPHALEXIN,
  CEFUROXIME,
  CEFTRIAXONE,
  METRONIDAZOLE,
  NITROFURANTOIN,
  CIPROFLOXACIN,
  CLINDAMYCIN,
  COTRIMOXAZOLE,
];
