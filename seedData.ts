import { Bi, Brand, Source, TextField } from './types';
import { MORE } from './seedMore';

/**
 * Starter content. IMPORTANT:
 * - Everything here is saved as DRAFT. Nothing is public until a qualified reviewer approves it.
 * - Filled records were written in the app author's own words from ONE official patient-information page
 *   (MedlinePlus), read on the "accessed" date. The Arabic text is an AI translation and must be checked.
 * - Milligram doses, strengths and age-specific limits are NOT in these pages, so they are left out on purpose.
 *   Add them only from the official drug label and have them reviewed.
 * - Records with only a name and class are still waiting for their source page to be read.
 */
export interface SeedItem {
  id: string;
  fields: Partial<Record<TextField, Bi>>;
  brands: Brand[];
  sources: Source[];
  notes: string;
}

const bare = (id: string, nameEn: string, nameAr: string, clsEn: string, clsAr: string): SeedItem => ({
  id,
  fields: {
    genericName: { en: nameEn, ar: nameAr },
    activeIngredients: { en: nameEn, ar: nameAr },
    drugClass: { en: clsEn, ar: clsAr },
  },
  brands: [],
  sources: [],
  notes:
    '[STARTER] Only the name and broad class are filled and they are UNVERIFIED. All other fields must be entered from official sources and reviewed by a qualified clinician before approval.',
});

const NOTE_FILLED =
  '[STARTER] Summarised in own words from the MedlinePlus patient page (read on the accessed date). Arabic is an AI translation: needs review. Milligram doses, strengths and age limits are NOT in this source and must be added from the official label. NOT yet reviewed by a clinician.';

const AMOXICILLIN: SeedItem = {
  id: 'amoxicillin',
  fields: {
    genericName: { en: 'Amoxicillin', ar: 'أموكسيسيلين' },
    activeIngredients: { en: 'Amoxicillin', ar: 'أموكسيسيلين' },
    drugClass: {
      en: 'Penicillin-like antibiotic (works by stopping bacteria from growing)',
      ar: 'مضاد حيوي من عائلة البنسيلين (يوقف نمو البكتيريا)',
    },
    strengths: {
      en: 'Forms: capsule, tablet, chewable tablet, and liquid suspension taken by mouth. Strengths (mg) are not given in this source: add them from the official label.',
      ar: 'الأشكال: كبسولة، قرص، قرص للمضغ، ومعلّق سائل يُؤخذ بالفم. لا يذكر المصدر التراكيز (ملغ): تُضاف من النشرة الرسمية للدواء.',
    },
    approvedUses: {
      en: `Treats certain bacterial infections, such as pneumonia, skin infections, and urinary tract infections. It is also used, together with other medicines, to get rid of H. pylori, a bacteria that causes ulcers. Sometimes it is used for Lyme disease and to prevent or treat anthrax. It does not work for colds, flu, or other viral infections.
(Summary of a US patient-information page: uses approved in your country may differ.)`,
      ar: `يُستخدم لعلاج بعض الالتهابات البكتيرية مثل الالتهاب الرئوي والتهابات الجلد والتهابات المسالك البولية. ويُستخدم أيضًا مع أدوية أخرى للقضاء على بكتيريا الملوية البوابية (H. pylori) المسببة للقرحة. وأحيانًا يُستخدم في مرض لايم وللوقاية من الجمرة الخبيثة وعلاجها. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.
(ملخص لصفحة معلومات مرضى أمريكية: قد تختلف الاستخدامات المعتمدة في بلدك.)`,
    },
    ageRestrictions: {
      en: 'This source page does not state an age limit. It describes a liquid form that can be given to children; the doctor decides the dose. Check the official label for age-specific information.',
      ar: 'لا تذكر صفحة المصدر حدًّا للعمر. وتذكر شكلًا سائلًا يمكن إعطاؤه للأطفال، والطبيب هو من يحدد الجرعة. راجع النشرة الرسمية لمعرفة التفاصيل الخاصة بالعمر.',
    },
    dosingReference: {
      en: `Usually taken every 8 or 12 hours, with or without food (taking it with food may prevent stomach upset). How long treatment lasts depends on the type of infection. Take it at about the same times every day, exactly as directed. Do not take more or less than prescribed, or more often.
This source does not list milligram doses. The exact dose is decided by the doctor or pharmacist for each person.`,
      ar: `يُؤخذ عادةً كل 8 أو 12 ساعة، مع الطعام أو بدونه (وتناوله مع الطعام قد يمنع اضطراب المعدة). وتعتمد مدة العلاج على نوع العدوى. تناوله في مواعيد متقاربة كل يوم وتمامًا كما وُصف لك، ولا تأخذ أكثر أو أقل مما هو موصوف ولا تأخذه بوتيرة أكبر.
لا يذكر هذا المصدر جرعات بالمليغرام. الجرعة الدقيقة يحددها الطبيب أو الصيدلي لكل شخص.`,
    },
    contraindications: {
      en: `Tell your doctor or pharmacist before using it if you: are allergic to amoxicillin, to any part of it, or to any other medicine, food, or substance (say what symptoms you had); have mononucleosis ("mono"); or have or have had kidney or liver disease, allergies, asthma, hay fever, or hives. The doctor decides whether it is suitable.
(Patient-information summary, not a complete list of contraindications: see the official label.)`,
      ar: `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كنت تعاني من حساسية تجاه الأموكسيسيلين أو أي مكوّن فيه أو أي دواء أو طعام أو مادة أخرى (واذكر الأعراض التي ظهرت)، أو كنت مصابًا بداء كثرة الوحيدات (mononucleosis)، أو لديك أو كان لديك مرض في الكلى أو الكبد أو حساسية أو ربو أو حمّى القش أو أرتيكاريا (شرى). والطبيب هو من يقرر مدى ملاءمته.
(ملخص من معلومات المرضى وليس قائمة كاملة بموانع الاستعمال: راجع النشرة الرسمية.)`,
    },
    sideEffects: {
      en: `Common (tell your doctor if severe or they do not go away): nausea, vomiting, diarrhea; temporary yellow, brown, or gray discoloration of the teeth.
Serious (stop taking it and call your doctor immediately or get emergency care): rash, itching, hives; skin blisters or peeling; wheezing, difficulty swallowing or breathing, or swelling of the face, throat, tongue, lips, or eyes; prolonged vomiting 1 to 4 hours after taking it together with diarrhea, extreme tiredness, and paleness within 24 hours; severe watery or bloody diarrhea, with or without fever and stomach cramps, which can happen up to 2 months or more after treatment.`,
      ar: `شائعة (أخبر الطبيب إذا كانت شديدة أو لم تزل): غثيان، قيء، إسهال؛ تغيّر مؤقت في لون الأسنان إلى الأصفر أو البني أو الرمادي.
خطيرة (أوقف الدواء واتصل بالطبيب فورًا أو اطلب رعاية طارئة): طفح جلدي أو حكة أو شرى؛ تقرّحات أو تقشّر في الجلد؛ صفير في الصدر أو صعوبة في البلع أو التنفس أو تورّم في الوجه أو الحلق أو اللسان أو الشفتين أو العينين؛ قيء مطوّل بعد 1 إلى 4 ساعات من تناول الدواء مع إسهال وتعب شديد وشحوب خلال 24 ساعة؛ إسهال مائي أو دموي شديد مع حمّى وتقلّصات في المعدة أو بدونهما، وقد يحدث بعد انتهاء العلاج بشهرين أو أكثر.`,
    },
    interactions: {
      en: `Tell your doctor and pharmacist about every prescription and non-prescription medicine, vitamin, supplement, and herbal product you take or plan to take; doses may need to be changed or you may need closer monitoring.
It may make hormonal birth control (pills, patches, rings, injections) less effective, so another method is needed during treatment.
If you have diabetes, use Clinistix or TesTape (not Clinitest) to test urine sugar while taking it.
Drug-by-drug interactions are not listed in this source.`,
      ar: `أخبر الطبيب والصيدلي بكل دواء تتناوله أو تنوي تناوله (بوصفة أو بدونها) وبالفيتامينات والمكملات والأعشاب؛ فقد تحتاج الجرعات إلى تعديل أو تحتاج إلى متابعة أدق.
قد يقلل فعالية وسائل منع الحمل الهرمونية (الأقراص واللصقات والحلقات والحقن)، لذلك يلزم استخدام وسيلة أخرى أثناء العلاج.
إذا كنت مصابًا بالسكري فاستخدم Clinistix أو TesTape (وليس Clinitest) لفحص سكر البول أثناء تناول الدواء.
لا يذكر هذا المصدر التداخلات مع كل دواء على حدة.`,
    },
    pregnancyBreastfeeding: {
      en: 'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor.',
      ar: 'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حدث حمل أثناء تناول الدواء فاتصلي بالطبيب.',
    },
    renalHepatic: {
      en: 'Tell your doctor if you have or have ever had kidney or liver disease. This source gives no dose-adjustment rules; the doctor decides.',
      ar: 'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى أو الكبد. لا يذكر المصدر قواعد لتعديل الجرعة؛ والطبيب هو من يقرر.',
    },
    patientEducation: {
      en: `• Take it exactly as directed and finish the prescription even if you feel better. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.
• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor.
• Chew chewable tablets completely before swallowing. Shake the liquid well before each use and measure it with a medicine spoon or oral syringe, not a household spoon.
• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.
• Keep your normal diet unless your doctor says otherwise.
• Storage: keep it in its tightly closed container, away from heat and moisture (not in the bathroom) and out of children's reach. The liquid is best kept in the refrigerator (do not freeze); throw away unused liquid after 14 days. Do not flush unused medicine; use a take-back program.
• Do not let anyone else take your medicine. Antibiotics do not work for colds or flu, and using them when they are not needed raises your risk of a later infection that resists antibiotics.
• Keep your appointments and any lab tests, and carry a written list of all your medicines.
• Possible signs of overdose include cloudy or bloody urine and passing less urine: get urgent help.`,
      ar: `• تناوله تمامًا كما وُصف لك وأكمل الوصفة حتى لو شعرت بتحسن. فالتوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالجة جزئيًا وقد تصبح البكتيريا مقاومة.
• يُفترض أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب.
• امضغ الأقراص القابلة للمضغ جيدًا قبل البلع. رجّ السائل جيدًا قبل كل استخدام وقِسه بملعقة دواء أو محقنة فموية وليس بملعقة المنزل.
• نسيان جرعة: خذها فور تذكرك، إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.
• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.
• التخزين: احفظه في عبوته محكمة الإغلاق بعيدًا عن الحرارة والرطوبة (وليس في الحمام) وبعيدًا عن متناول الأطفال. يُفضّل حفظ السائل في الثلاجة (دون تجميد) والتخلص من السائل غير المستخدم بعد 14 يومًا. لا تتخلص من الدواء بالمرحاض؛ استخدم برنامج استرجاع الأدوية.
• لا تسمح لأحد بتناول دوائك. المضادات الحيوية لا تنفع في نزلات البرد والإنفلونزا، واستخدامها دون حاجة يزيد خطر الإصابة لاحقًا بعدوى تقاوم المضادات الحيوية.
• التزم بمواعيد الطبيب وتحاليل المختبر، واحمل قائمة مكتوبة بكل أدويتك.
• من علامات الجرعة الزائدة المحتملة بول عكر أو دموي وقلّة التبول: اطلب مساعدة عاجلة.`,
    },
  },
  brands: [
    { name: 'Amoxil', manufacturer: '', barcode: '', verified: true, sourceUrl: 'https://medlineplus.gov/druginfo/meds/a685001.html' },
    { name: 'Larotid (suspension)', manufacturer: '', barcode: '', verified: true, sourceUrl: 'https://medlineplus.gov/druginfo/meds/a685001.html' },
  ],
  sources: [
    {
      title: 'Amoxicillin: MedlinePlus Drug Information',
      url: 'https://medlineplus.gov/druginfo/meds/a685001.html',
      publisher: 'National Library of Medicine (MedlinePlus); content from ASHP AHFS Patient Medication Information',
      updated: '2026-05-15',
      accessed: '2026-10-10',
    },
  ],
  notes: NOTE_FILLED + ' Brand names listed are the US names shown on the source page; add local (Egyptian) brands, manufacturers and barcodes only from an official local source.',
};

const AMOX_CLAV: SeedItem = {
  id: 'amoxicillin-clavulanic-acid',
  fields: {
    genericName: { en: 'Amoxicillin / clavulanic acid', ar: 'أموكسيسيلين / حمض الكلافولانيك' },
    activeIngredients: { en: 'Amoxicillin; clavulanic acid', ar: 'أموكسيسيلين؛ حمض الكلافولانيك' },
    drugClass: {
      en: 'Penicillin-like antibiotic (amoxicillin) + beta-lactamase inhibitor (clavulanic acid stops bacteria from breaking down amoxicillin)',
      ar: 'مضاد حيوي من عائلة البنسيلين (أموكسيسيلين) + مثبّط لإنزيم بيتا-لاكتاماز (حمض الكلافولانيك يمنع البكتيريا من تحطيم الأموكسيسيلين)',
    },
    strengths: {
      en: 'Forms: tablet, chewable tablet, and oral suspension (liquid). Strengths (mg) are not given in this source: add them from the official label.',
      ar: 'الأشكال: قرص، قرص للمضغ، ومعلّق فموي (سائل). لا يذكر المصدر التراكيز (ملغ): تُضاف من النشرة الرسمية للدواء.',
    },
    approvedUses: {
      en: `Treats certain bacterial infections, including infections of the ears, lungs, sinuses, skin, and urinary tract. It does not work for colds, flu, or other viral infections.
(Summary of a US patient-information page: uses approved in your country may differ.)`,
      ar: `يُستخدم لعلاج بعض الالتهابات البكتيرية، منها التهابات الأذن والرئتين والجيوب الأنفية والجلد والمسالك البولية. ولا يعمل ضد نزلات البرد أو الإنفلونزا أو العدوى الفيروسية الأخرى.
(ملخص لصفحة معلومات مرضى أمريكية: قد تختلف الاستخدامات المعتمدة في بلدك.)`,
    },
    ageRestrictions: {
      en: 'This source page does not state an age limit. It describes a liquid form; the doctor decides the dose. Check the official label for age-specific information.',
      ar: 'لا تذكر صفحة المصدر حدًّا للعمر. وتذكر شكلًا سائلًا؛ والطبيب هو من يحدد الجرعة. راجع النشرة الرسمية لمعرفة التفاصيل الخاصة بالعمر.',
    },
    dosingReference: {
      en: `Usually taken with a meal or snack every 8 to 12 hours (2 to 3 times a day), at about the same times every day, exactly as directed. Do not take more or less than prescribed, or more often.
This source does not list milligram doses. The exact dose is decided by the doctor or pharmacist for each person.`,
      ar: `يُؤخذ عادةً مع وجبة أو وجبة خفيفة كل 8 إلى 12 ساعة (2 إلى 3 مرات يوميًا)، في مواعيد متقاربة كل يوم وتمامًا كما وُصف لك. لا تأخذ أكثر أو أقل مما هو موصوف ولا تأخذه بوتيرة أكبر.
لا يذكر هذا المصدر جرعات بالمليغرام. الجرعة الدقيقة يحددها الطبيب أو الصيدلي لكل شخص.`,
    },
    contraindications: {
      en: `Tell your doctor or pharmacist before using it if you: are allergic to it, to any part of it, or to any other medicine, food, or substance; have ever had liver problems after taking amoxicillin and clavulanic acid before (your doctor may tell you not to take it); have mononucleosis ("mono"); or have or have had kidney or liver disease, allergies, asthma, hay fever, or hives. If you have phenylketonuria (PKU), know that the chewable tablets and oral suspension contain aspartame, which forms phenylalanine.
(Patient-information summary, not a complete list of contraindications: see the official label.)`,
      ar: `أخبر الطبيب أو الصيدلي قبل استخدامه إذا: كنت تعاني من حساسية تجاهه أو تجاه أي مكوّن فيه أو أي دواء أو طعام أو مادة أخرى؛ أو أصبت من قبل بمشاكل في الكبد بعد تناول الأموكسيسيلين مع حمض الكلافولانيك (وقد يطلب منك الطبيب عدم تناوله)؛ أو كنت مصابًا بداء كثرة الوحيدات؛ أو لديك أو كان لديك مرض في الكلى أو الكبد أو حساسية أو ربو أو حمّى القش أو شرى. وإذا كنت مصابًا ببيلة الفينيل كيتون (PKU) فاعلم أن الأقراص القابلة للمضغ والمعلّق الفموي تحتوي على الأسبارتام الذي يتحول إلى فينيل ألانين.
(ملخص من معلومات المرضى وليس قائمة كاملة بموانع الاستعمال: راجع النشرة الرسمية.)`,
    },
    sideEffects: {
      en: `Common (tell your doctor if severe or they do not go away): diarrhea, upset stomach, vomiting; vaginal itching and/or discharge.
Serious (call your doctor immediately): watery or bloody stools, stomach cramps, or fever during treatment or for up to two or more months after stopping; severe vomiting 1 to 4 hours after a dose; rash, itching, hives; difficulty breathing or swallowing, wheezing, or swelling of the face, throat, tongue, lips, and eyes; peeling, blistering, or shedding skin; return of fever, sore throat, chills, or other signs of infection; yellowing of the skin or eyes, pain in the right upper stomach area, fatigue, loss of appetite, easier bleeding or bruising, or dark urine.`,
      ar: `شائعة (أخبر الطبيب إذا كانت شديدة أو لم تزل): إسهال، اضطراب في المعدة، قيء؛ حكة و/أو إفرازات مهبلية.
خطيرة (اتصل بالطبيب فورًا): براز مائي أو دموي أو تقلّصات في المعدة أو حمّى أثناء العلاج أو لمدة شهرين أو أكثر بعد التوقف؛ قيء شديد بعد 1 إلى 4 ساعات من الجرعة؛ طفح جلدي أو حكة أو شرى؛ صعوبة في التنفس أو البلع أو صفير أو تورّم في الوجه والحلق واللسان والشفتين والعينين؛ تقشّر أو تقرّح في الجلد؛ عودة الحمّى أو التهاب الحلق أو القشعريرة أو علامات عدوى أخرى؛ اصفرار الجلد أو العينين أو ألم في أعلى البطن من الجهة اليمنى أو تعب أو فقدان الشهية أو سهولة النزف أو الكدمات أو بول داكن.`,
    },
    interactions: {
      en: `Tell your doctor and pharmacist about every prescription and non-prescription medicine, vitamin, supplement, and herbal product you take or plan to take; doses may need to be changed or you may need closer monitoring.
It may make hormonal birth control (pills, patches, rings, injections) less effective, so another method is needed during treatment.
If you have diabetes, use Clinistix or TesTape (not Clinitest) to test urine sugar while taking it.
Drug-by-drug interactions are not listed in this source.`,
      ar: `أخبر الطبيب والصيدلي بكل دواء تتناوله أو تنوي تناوله (بوصفة أو بدونها) وبالفيتامينات والمكملات والأعشاب؛ فقد تحتاج الجرعات إلى تعديل أو تحتاج إلى متابعة أدق.
قد يقلل فعالية وسائل منع الحمل الهرمونية (الأقراص واللصقات والحلقات والحقن)، لذلك يلزم استخدام وسيلة أخرى أثناء العلاج.
إذا كنت مصابًا بالسكري فاستخدم Clinistix أو TesTape (وليس Clinitest) لفحص سكر البول أثناء تناول الدواء.
لا يذكر هذا المصدر التداخلات مع كل دواء على حدة.`,
    },
    pregnancyBreastfeeding: {
      en: 'Tell your doctor if you are pregnant, plan to become pregnant, or are breastfeeding. If you become pregnant while taking it, call your doctor.',
      ar: 'أخبر الطبيب إذا كنتِ حاملًا أو تخططين للحمل أو ترضعين. وإذا حدث حمل أثناء تناول الدواء فاتصلي بالطبيب.',
    },
    renalHepatic: {
      en: 'Tell your doctor if you have or have ever had kidney or liver disease, or liver problems after earlier use of this medicine. Watch for signs of liver trouble (yellow skin or eyes, dark urine, pain in the right upper stomach). This source gives no dose-adjustment rules; the doctor decides.',
      ar: 'أخبر الطبيب إذا كان لديك أو كان لديك مرض في الكلى أو الكبد، أو مشاكل في الكبد بعد استخدام سابق لهذا الدواء. انتبه لعلامات مشاكل الكبد (اصفرار الجلد أو العينين، بول داكن، ألم أعلى البطن من اليمين). لا يذكر المصدر قواعد لتعديل الجرعة؛ والطبيب هو من يقرر.',
    },
    patientEducation: {
      en: `• Take it exactly as directed, with a meal or snack, and finish the prescription even if you feel better. Stopping too soon or skipping doses can leave the infection only partly treated and let bacteria become resistant.
• You should start to feel better within the first few days. If symptoms do not improve or get worse, call your doctor.
• Chew chewable tablets completely before swallowing. Shake the liquid well before each use and measure it with a medicine spoon or oral syringe, not a household spoon.
• Missed dose: take it as soon as you remember, unless it is almost time for the next dose; then skip it. Never take a double dose.
• Keep your normal diet unless your doctor says otherwise.
• Storage: keep tablets in the tightly closed container away from heat and moisture (not in the bathroom), out of children's reach. Keep the liquid in the refrigerator and throw away unused liquid after 10 days. Do not flush unused medicine; use a take-back program.
• Do not let anyone else take your medicine. Antibiotics do not work for colds or flu, and using them when they are not needed raises your risk of a later infection that resists antibiotics.
• Keep your appointments and any lab tests, and carry a written list of all your medicines.`,
      ar: `• تناوله تمامًا كما وُصف لك، مع وجبة أو وجبة خفيفة، وأكمل الوصفة حتى لو شعرت بتحسن. فالتوقف مبكرًا أو تفويت الجرعات قد يترك العدوى معالجة جزئيًا وقد تصبح البكتيريا مقاومة.
• يُفترض أن تبدأ بالتحسن خلال الأيام الأولى. إذا لم تتحسن الأعراض أو ساءت فاتصل بالطبيب.
• امضغ الأقراص القابلة للمضغ جيدًا قبل البلع. رجّ السائل جيدًا قبل كل استخدام وقِسه بملعقة دواء أو محقنة فموية وليس بملعقة المنزل.
• نسيان جرعة: خذها فور تذكرك، إلا إذا اقترب موعد الجرعة التالية فتخطَّها. لا تأخذ جرعة مضاعفة أبدًا.
• استمر في نظامك الغذائي المعتاد ما لم يوجهك الطبيب بغير ذلك.
• التخزين: احفظ الأقراص في عبوتها محكمة الإغلاق بعيدًا عن الحرارة والرطوبة (وليس في الحمام) وبعيدًا عن متناول الأطفال. احفظ السائل في الثلاجة وتخلص من السائل غير المستخدم بعد 10 أيام. لا تتخلص من الدواء بالمرحاض؛ استخدم برنامج استرجاع الأدوية.
• لا تسمح لأحد بتناول دوائك. المضادات الحيوية لا تنفع في نزلات البرد والإنفلونزا، واستخدامها دون حاجة يزيد خطر الإصابة لاحقًا بعدوى تقاوم المضادات الحيوية.
• التزم بمواعيد الطبيب وتحاليل المختبر، واحمل قائمة مكتوبة بكل أدويتك.`,
    },
  },
  brands: [
    { name: 'Augmentin', manufacturer: '', barcode: '', verified: true, sourceUrl: 'https://medlineplus.gov/druginfo/meds/a685024.html' },
  ],
  sources: [
    {
      title: 'Amoxicillin and Clavulanic Acid: MedlinePlus Drug Information',
      url: 'https://medlineplus.gov/druginfo/meds/a685024.html',
      publisher: 'National Library of Medicine (MedlinePlus); content from ASHP AHFS Patient Medication Information',
      updated: '2026-04-15',
      accessed: '2026-10-10',
    },
  ],
  notes: NOTE_FILLED + ' Brand name listed is the US name shown on the source page; add local brands, manufacturers and barcodes only from an official local source.',
};

export const SEED: SeedItem[] = [
  AMOXICILLIN,
  AMOX_CLAV,
  ...MORE,
];

/** Starting points for reviewers. Always paste the EXACT page URL of the monograph you used. */
export const SOURCE_HINTS: { name: string; url: string }[] = [
  { name: 'MedlinePlus (US National Library of Medicine)', url: 'https://medlineplus.gov/' },
  { name: 'DailyMed (official US drug labels)', url: 'https://dailymed.nlm.nih.gov/' },
  { name: 'European Medicines Agency (EMA)', url: 'https://www.ema.europa.eu/' },
  { name: 'CDC – Antibiotic Prescribing and Use', url: 'https://www.cdc.gov/antibiotic-use/' },
];
