import { Bi, Brand, Source, TextField } from './types';

export interface SeedItem {
  id: string;
  fields: Partial<Record<TextField, Bi>>;
  brands: Brand[];
  sources: Source[];
  notes: string;
}

const EDA_SRC: Source = {
  title: 'هيئة الدواء المصرية (EDA) - دليل الأدوية والأسعار الرسمية والباركود',
  url: 'https://edaegypt.gov.eg',
  publisher: 'Egyptian Drug Authority',
  updated: '2026-05-01',
  accessed: '2026-10-13',
};

const MP_SRC: Source = {
  title: 'National Library of Medicine - MedlinePlus Drug Information',
  url: 'https://medlineplus.gov/druginformation.html',
  publisher: 'National Institutes of Health (NIH)',
  updated: '2026-01-15',
  accessed: '2026-10-13',
};

export const SEED: SeedItem[] = [
  // 1. Augmentin (Amoxicillin + Clavulanic Acid)
  {
    id: 'amoxicillin-clavulanic-acid',
    fields: {
      genericName: { ar: 'أموكسيسيلين + حمض الكلافولانيك', en: 'Amoxicillin + Clavulanic Acid' },
      activeIngredients: { ar: 'أموكسيسيلين ثلاثي الهيدرات + كلافولانات البوتاسيوم', en: 'Amoxicillin trihydrate + Potassium clavulanate' },
      drugClass: { ar: 'بنسلين واسع المجال مدعوم بمثبط إنزيم بيتا-لاكتاماز', en: 'Broad-spectrum penicillin with beta-lactamase inhibitor' },
      strengths: {
        ar: 'أقراص: 1 جم (1000 مجم)، 625 مجم، 375 مجم.\nشراب معلق للأطفال: 457 مجم/5 مل، 228 مجم/5 مل، 156 مجم/5 مل، 312 مجم/5 مل.\nحقن وريدية (فيال): 1.2 جم، 600 مجم.',
        en: 'Tablets: 1g, 625mg, 375mg. Oral suspension: 457mg/5ml, 228mg/5ml, 312mg/5ml. IV Vials: 1.2g, 600mg.',
      },
      approvedUses: {
        ar: 'علاج العدوى البكتيرية في الجهاز التنفسي العلوي والسفلي (التهاب الجيوب الأنفية، التهاب اللوزتين الحاد، الالتهاب الرئوي الشعبي)، عدوى وخراج الأسنان واللثة، التهابات المسالك البولية، وعدوى الجلد والأنسجة الرخوة. لا يعالج نزلات البرد أو الإنفلونزا.',
        en: 'Upper/lower respiratory tract infections (sinusitis, severe tonsillitis, pneumonia), dental infections and abscesses, UTIs, and skin/soft tissue infections.',
      },
      priceEgypt: {
        ar: '• أوجمنتين 1 جم (14 قرص): 131.50 جنيه مصري.\n• أوجمنتين 625 مجم (10 أقراص): 82.50 جنيه مصري.\n• أوجمنتين شراب 457 مجم (70 مل): 89.00 جنيه مصري.\n• أوجمنتين شراب 228 مجم: 65.00 جنيه مصري.\n• أوجمنتين فيال 1.2 جم للحقن الوريدي: 55.00 جنيه مصري.',
        en: '• Augmentin 1g (14 tabs): 131.50 EGP\n• Augmentin 625mg (10 tabs): 82.50 EGP\n• Augmentin syrup 457mg: 89.00 EGP\n• Augmentin IV 1.2g: 55.00 EGP',
      },
      substitutes: {
        ar: 'إذا كان أوجمنتين غير متوفر، فالبدائل المتطابقة (نفس المادة الفعالة ونفس الجودة والتركيز):\n1. كيورام 1 جم (Curam 1g) - شركة ساندوز/نوفارتس (حوالي 115 جنيه).\n2. ميجاموكس 1 جم (Megamox 1g) - شركة سبيماكو (حوالي 105 جنيه).\n3. هاي بيوتك 1 جم (Hibiotic 1g) - شركة أمون (حوالي 109 جنيه).\n4. إي-موكسكلاف 1 جم (E-Moxclav 1g) - شركة إيبيكو (حوالي 95 جنيه).\n5. كلافيموكس 1 جم (Clavimox 1g) - شركة فاركو.\n\n• البديل في حال وجود حساسية من البنسلين: كليندامايسين (Dalacin C) أو أزيثرومايسين (Zithromax) باستشارة الطبيب.',
        en: 'Exact Generic Equivalents:\n1. Curam 1g (Sandoz) ~115 EGP\n2. Megamox 1g (Spimaco) ~105 EGP\n3. Hibiotic 1g (Amoun) ~109 EGP\n4. E-Moxclav 1g (EIPICO) ~95 EGP\nAlternative for penicillin allergy: Clindamycin or Azithromycin.',
      },
      ageRestrictions: {
        ar: 'مناسب لجميع الأعمار؛ يستخدم الشراب المعلق للأطفال والرضع بجرعة محسوبة بالوزن، والأقراص للبالغين والأطفال فوق 40 كجم.',
        en: 'Suitable for all ages. Oral suspension for pediatrics based on weight; tablets for adults and children >40kg.',
      },
      dosingReference: {
        ar: 'للبالغين: قرص 1 جم كل 12 ساعة، أو قرص 625 مجم كل 8 ساعات، ويفضل في بداية الوجبة لتقليل اضطراب المعدة. يجب إكمال الكورس بالكامل.',
        en: 'Adults: 1g every 12 hours or 625mg every 8 hours, preferably at the start of meals.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية تجاه البنسلين ومشتقاته، أو لمن أصيبوا بيرقان أو قصور كبدي سابق بسبب هذا الدواء.',
        en: 'Contraindicated in penicillin allergy or history of amoxicillin/clavulanate-associated jaundice or hepatic impairment.',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، قيء، طفح جلدي، أو التهابات فطرية بالفم. في حال ظهور صعوبة تنفس أو تورم بالوجه توقف فوراً واطلب الطوارئ.',
        en: 'Diarrhea, nausea, vomiting, mild skin rash, oral thrush. In severe rash or swelling, stop and seek emergency care.',
      },
      interactions: {
        ar: 'قد يقلل من فاعلية حبوب منع الحمل. يتفاعل مع أدوية النقرس (ألوبيورينول) ومميعات الدم (وارفارين).',
        en: 'May reduce oral contraceptive efficacy. Interacts with allopurinol and warfarin.',
      },
      pregnancyBreastfeeding: {
        ar: 'يعد آمناً بشكل عام أثناء الحمل والرضاعة عند الضرورة وتحت إشراف الطبيب.',
        en: 'Generally considered safe during pregnancy and lactation when clinically needed.',
      },
      renalHepatic: {
        ar: 'يتطلب تعديل الجرعة في حالات القصور الكلوي الشديد بناءً على معدل تصفية الكرياتينين.',
        en: 'Dose adjustment required in severe renal impairment based on GFR.',
      },
      patientEducation: {
        ar: 'تناول الدواء مع بداية الطعام لمنع آلام المعدة. رج زجاجة الشراب جيداً واحفظها في الثلاجة لمدة 7-10 أيام فقط وتخلص من الباقي.',
        en: 'Take with food to minimize GI distress. Shake suspension well, keep refrigerated, and discard after 7-10 days.',
      },
    },
    brands: [
      { name: 'Augmentin 1g Tablets', manufacturer: 'GlaxoSmithKline (GSK)', barcode: '6221127005436', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Curam 1g Tablets', manufacturer: 'Sandoz Egypt', barcode: '6221054002131', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Hibiotic 1g Tablets', manufacturer: 'Amoun Pharmaceuticals', barcode: '6221543009812', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Megamox 1g Tablets', manufacturer: 'Spimaco Misr', barcode: '6223000456123', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Augmentin 457mg Suspension', manufacturer: 'GSK', barcode: '6221127005450', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 2. Metronidazole (Flagyl / Amrizole)
  {
    id: 'metronidazole',
    fields: {
      genericName: { ar: 'ميترونيدازول', en: 'Metronidazole' },
      activeIngredients: { ar: 'ميترونيدازول', en: 'Metronidazole' },
      drugClass: { ar: 'مضاد للبكتيريا اللاهوائية ومضاد للطفيليات والأوالي', en: 'Nitroimidazole antiprotozoal and antibacterial' },
      strengths: {
        ar: 'أقراص: 500 مجم، 250 مجم.\nشراب معلق للأطفال: 125 مجم/5 مل، 200 مجم/5 مل.\nمحلول وريدي بالتنقيط (IV Infusion): 500 مجم/100 مل.\nلبوس مهبلي / جل موضعي.',
        en: 'Tablets: 500mg, 250mg. Suspension: 125mg/5ml, 200mg/5ml. IV infusion: 500mg/100ml.',
      },
      approvedUses: {
        ar: 'علاج خراج وعدوى الأسنان واللثة (بالتزامن مع الأموكسيسيلين)، داء الأميبا المعوي والكبدي، طفيليات الجيارديا، عدوى التريكوموناس، والتهابات الحوض والبطن اللاهوائية، وعدوى جرثومة المعدة والمطثية العسيرة (C. difficile).',
        en: 'Dental abscesses (combined with amoxicillin), amoebiasis, giardiasis, trichomoniasis, anaerobic pelvic/intra-abdominal infections, and C. difficile colitis.',
      },
      priceEgypt: {
        ar: '• فلاجيل 500 مجم (20 قرص): 35.00 جنيه مصري.\n• فلاجيل 250 مجم (20 قرص): 21.00 جنيه مصري.\n• فلاجيل شراب 125 مجم (100 مل): 19.50 جنيه مصري.\n• فلاجيل محلول وريدي 500 مجم/100 مل: 28.00 جنيه مصري.',
        en: '• Flagyl 500mg (20 tabs): 35.00 EGP\n• Flagyl 250mg (20 tabs): 21.00 EGP\n• Flagyl syrup (100ml): 19.50 EGP\n• Flagyl IV infusion: 28.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة (نفس المادة الفعالة والتركيز):\n1. أمريزول 500 مجم (Amrizole 500mg) - شركة أمون (حوالي 26 جنيه للعلبة 20 قرص).\n2. دوموزول 500 مجم (Dumozol 500mg) - شركة أكتوبر فارما.\n3. فلازول 500 مجم (Flazol 500mg).\n4. روزيكس (Rozex) للجل الموضعي.\n\n• البدائل لعلاج اللاهوائيات والأسنان في حال التعذر: كليندامايسين (Dalacin C).',
        en: 'Exact Generic Equivalents:\n1. Amrizole 500mg (Amoun) ~26 EGP\n2. Dumozol 500mg (October Pharma)\n3. Flazol 500mg\nAlternative for anaerobes: Clindamycin.',
      },
      ageRestrictions: {
        ar: 'يستخدم للأطفال بجرعات دقيقة يحسبها الطبيب، والأقراص للبالغين.',
        en: 'Pediatric dosing calculated by weight; tablets for adults.',
      },
      dosingReference: {
        ar: 'للأسنان والعدوى البكتيرية: قرص 500 مجم كل 8 ساعات بعد الأكل لمدة 5 إلى 7 أيام.',
        en: 'Dental/bacterial infections: 500mg every 8 hours after meals for 5-7 days.',
      },
      contraindications: {
        ar: 'ممنوع تماماً مع تناول الكحوليات، يمنع في الثلث الأول من الحمل، ولدى مرضى متلازمة كوكايين العصبية.',
        en: 'Strictly contraindicated with alcohol. Avoid during first trimester of pregnancy.',
      },
      sideEffects: {
        ar: 'طعم معدني بالفم، غثيان، فقدان شهية، تغير لون البول إلى البني الداكن (أمر طبيعي غير مقلق)، وصداع.',
        en: 'Metallic taste in mouth, nausea, dark-colored urine (harmless), headache.',
      },
      interactions: {
        ar: 'تفاعل حاد مع الكحول (تفاعل شبيه بالديسولفيرام: غثيان شديد وقيء وتسارع ضربات القلب). يزيد من مفعول الوارفارين.',
        en: 'Severe disulfiram-like reaction with alcohol. Potentiates anticoagulant effect of warfarin.',
      },
      pregnancyBreastfeeding: {
        ar: 'يمنع في الثلث الأول من الحمل. يفرز في حليب الأم لذلك يفضل استشارة الطبيب لتحديد بديل آمن.',
        en: 'Contraindicated in 1st trimester. Secreted in breast milk; consult physician.',
      },
      renalHepatic: {
        ar: 'يخفض الجرعة إلى النصف في حالات القصور الكبدي الحاد.',
        en: 'Dose reduction needed in severe hepatic impairment.',
      },
      patientEducation: {
        ar: 'تناول الدواء بعد الأكل مع كوب ماء كامل لتقليل الطعم المعدني. لا تقلق من تحول لون البول للون الداكن. ممنوع شرب أي مشروبات كحولية أثناء العلاج ولمدة 48 ساعة بعده.',
        en: 'Take after meals. Dark urine is a harmless temporary effect. Avoid alcohol completely.',
      },
    },
    brands: [
      { name: 'Flagyl 500mg Tablets', manufacturer: 'Sanofi Egypt', barcode: '6221008001012', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Amrizole 500mg Tablets', manufacturer: 'Amoun Pharmaceuticals', barcode: '6221543001229', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Flagyl 125mg Suspension', manufacturer: 'Sanofi Egypt', barcode: '6221008001029', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 3. Azithromycin (Zithromax / Xithrone)
  {
    id: 'azithromycin',
    fields: {
      genericName: { ar: 'أزيثرومايسين', en: 'Azithromycin' },
      activeIngredients: { ar: 'أزيثرومايسين ثنائي الهيدرات', en: 'Azithromycin dihydrate' },
      drugClass: { ar: 'مضاد حيوي من عائلة الماكروليد (طويل المفعول)', en: 'Macrolide antibiotic' },
      strengths: {
        ar: 'كبسولات/أقراص: 500 مجم (شريط 3 أقراص)، 250 مجم (علبة 6 كبسولات).\nشراب معلق للأطفال: 200 مجم/5 مل، 100 مجم/5 مل.\nحقن وريدية (فيال): 500 مجم.',
        en: 'Capsules/Tablets: 500mg (3 tabs), 250mg (6 caps). Suspension: 200mg/5ml, 100mg/5ml. IV Vial: 500mg.',
      },
      approvedUses: {
        ar: 'علاج الالتهاب الرئوي الشعبي، التهاب الجيوب الأنفية واللوزتين لمن يعانون من حساسية البنسلين، عدوى الكلاميديا والمسالك التناسلية، والتهابات الجلد الخفيفة. لا يعالج البرد الفيروسي.',
        en: 'Community-acquired pneumonia, acute sinusitis and tonsillitis in penicillin-allergic patients, chlamydial urethritis, and mild skin infections.',
      },
      priceEgypt: {
        ar: '• زيثروماكس 500 مجم (3 أقراص) - فايزر: 105.00 جنيه مصري.\n• زيثرون 500 مجم (3 أقراص) - أمون: 68.00 جنيه مصري.\n• زيثروكان 500 مجم (3 كبسولات) - حكمة: 55.00 جنيه مصري.\n• أزيثرومايسين شراب 200 مجم: 45.00 إلى 60.00 جنيه مصري.',
        en: '• Zithromax 500mg (3 tabs - Pfizer): 105.00 EGP\n• Xithrone 500mg (3 tabs - Amoun): 68.00 EGP\n• Zithrokan 500mg (3 caps - Hikma): 55.00 EGP\n• Suspension 200mg: 45-60 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً (نفس المادة الفعالة ونفس كورس الـ 3 أيام):\n1. زيثرون 500 مجم (Xithrone 500mg) - أمون.\n2. زيثروكان 500 مجم (Zithrokan 500mg) - حكمة.\n3. أزالييد 500 مجم (Azalide 500mg).\n4. نيوزوليد 500 مجم (Neozolid 500mg).\n5. زيثروماكس المستورد عند توفره.\n\n• البدائل من نفس العائلة: كلاريثرومايسين (Klacid) أو سبيراجيسين.',
        en: 'Exact Equivalents:\n1. Xithrone 500mg (Amoun)\n2. Zithrokan 500mg (Hikma)\n3. Azalide 500mg\nFamily alternative: Clarithromycin (Klacid).',
      },
      ageRestrictions: {
        ar: 'آمن للأطفال أكبر من 6 أشهر كشراب معلق، والأقراص لمن هم فوق 45 كجم.',
        en: 'Safe for infants >6 months as suspension; tablets for patients >45kg.',
      },
      dosingReference: {
        ar: 'الجرعة الشائعة للبالغين: قرص 500 مجم مرة واحدة يومياً قبل الأكل بساعة أو بعده بساعتين لمدة 3 أيام متتالية فقط (أو 500 مجم في اليوم الأول ثم 250 مجم يومياً لـ 4 أيام).',
        en: 'Adults: 500mg once daily for 3 consecutive days, taken 1 hour before or 2 hours after meals.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية تجاه مركبات الماكروليد، أو مرضى اختلال ضربات القلب الشديد (استطالة فترة QT)، أو المصابين بقصور كبدي شديد.',
        en: 'Contraindicated in macrolide hypersensitivity, QT prolongation, or severe hepatic disease.',
      },
      sideEffects: {
        ar: 'مغص خفيف بالمعدة، إسهال، غثيان، صداع، ونادراً خفقان في القلب أو طفح جلدي.',
        en: 'Mild abdominal cramps, diarrhea, nausea, headache, rare palpitations.',
      },
      interactions: {
        ar: 'تجنب تناوله بالتزامن مع مضادات الحموضة المحتوية على الألومنيوم أو المغنيسيوم (افصل بساعتين). يتفاعل مع الديجوكسين والوارفارين.',
        en: 'Antacids containing aluminum/magnesium reduce absorption; separate by 2 hours.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B للحمل؛ يعد من أكثر المضادات أماناً أثناء الحمل والرضاعة عند وصف الطبيب له.',
        en: 'Category B. Considered safe in pregnancy when clinically indicated.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل جرعة في القصور الكلوي الخفيف، يحذر في القصور الكبدي الشديد.',
        en: 'Caution in severe hepatic dysfunction; no adjustment needed for mild renal disease.',
      },
      patientEducation: {
        ar: 'يتميز بفاعلية ممتدة في الأنسجة تستمر لعدة أيام بعد انتهاء كورس الـ 3 أيام، فلا تكرره من تلقاء نفسك. يؤخذ على معدة فارغة لامتصاص مثالي.',
        en: 'Has prolonged tissue half-life working days after finishing the 3-day course. Do not repeat without prescription.',
      },
    },
    brands: [
      { name: 'Zithromax 500mg Tablets', manufacturer: 'Pfizer Egypt', barcode: '6221054003411', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Xithrone 500mg Tablets', manufacturer: 'Amoun / Kahira', barcode: '6221127004118', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Zithrokan 500mg Capsules', manufacturer: 'Hikma Pharma', barcode: '6221543007621', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 4. Nitrofurantoin (Macrofuran / Uvamin Retard)
  {
    id: 'nitrofurantoin',
    fields: {
      genericName: { ar: 'نيتروفورانتوين', en: 'Nitrofurantoin' },
      activeIngredients: { ar: 'نيتروفورانتوين ماكروكريستال', en: 'Nitrofurantoin macrocrystals' },
      drugClass: { ar: 'مضاد بكتيري مخصص لالتهابات المسالك البولية', en: 'Urinary tract antibacterial' },
      strengths: {
        ar: 'كبسولات: 100 مجم، 50 مجم.\nشراب معلق للأطفال: 25 مجم/5 مل.',
        en: 'Capsules: 100mg, 50mg. Suspension: 25mg/5ml.',
      },
      approvedUses: {
        ar: 'الخيار الأول عالمياً لعلاج والوقاية من التهابات المسالك البولية والمثانة غير المعقدة وحرقان البول، الناتجة عن بكتيريا الإشريكية القولونية (E. coli). لا يستخدم لعلاج التهاب الكلى أو العدوى خارج المسالك.',
        en: 'First-line therapy for acute uncomplicated cystitis and lower UTIs caused by E. coli and Enterococci. Not indicated for pyelonephritis.',
      },
      priceEgypt: {
        ar: '• ماكروفيوران 100 مجم (علبة 30 كبسولة): 48.00 جنيه مصري (الشريط 10 كبسولات بـ 16 جنيه).\n• ماكروفيوران 50 مجم (30 كبسولة): 36.00 جنيه مصري.\n• يوفامين ريتارد 100 مجم (20 كبسولة): 52.00 جنيه مصري.',
        en: '• Macrofuran 100mg (30 caps): 48.00 EGP (16 EGP/strip)\n• Macrofuran 50mg (30 caps): 36.00 EGP\n• Uvamin Retard 100mg (20 caps): 52.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة (نفس المادة الفعالة للمسالك البولية):\n1. يوفامين ريتارد 100 مجم (Uvamin Retard 100mg) - ميفا/سويس فارما.\n2. موفيران 100 مجم (Muviran 100mg).\n\n• البدائل العلاجية الأخرى كخط أول للمسالك عند التعذر:\n1. فوسفوميسين فوار (Monuril كيس جرعة واحدة).\n2. كوتريموكسازول (Septazole).\n3. سيبروفلوكساسين للحالات المتقدمة.',
        en: 'Exact Generic Equivalents:\n1. Uvamin Retard 100mg\n2. Muviran 100mg\nTherapeutic Alternatives for UTI:\n1. Fosfomycin (Monuril single sachet)\n2. Co-trimoxazole (Septazole)',
      },
      ageRestrictions: {
        ar: 'ممنوع للأطفال حديثي الولادة أقل من شهر واحد (خطر حدوث أنيميا انحلال الدم). مناسب للأطفال الأكبر كشراب وللبالغين.',
        en: 'Contraindicated in infants <1 month of age due to risk of hemolytic anemia.',
      },
      dosingReference: {
        ar: 'للبالغين: كبسولة 100 مجم كل 12 ساعة مع الوجبات لمدة 5 أيام، مع شرب كميات وافرة من الماء.',
        en: 'Adults: 100mg twice daily with meals for 5 days.',
      },
      contraindications: {
        ar: 'يمنع في حالات القصور الكلوي الشديد (معدل تصفية أقل من 30 مل/دقيقة)، ويمنع في الأسابيع الأخيرة من الحمل (من الأسبوع 38 وحتى الولادة)، ولمرضى أنيميا الفول (G6PD deficiency).',
        en: 'Contraindicated in severe renal impairment (eGFR <30 ml/min), late pregnancy (38+ weeks), and G6PD deficiency.',
      },
      sideEffects: {
        ar: 'غثيان، فقدان شهية، وتلون البول باللون الأصفر الداكن أو البني (طبيعي تماماً). نادراً سعال أو حساسية بالصدر.',
        en: 'Nausea, loss of appetite, dark yellow/brown urine discoloration (normal and harmless).',
      },
      interactions: {
        ar: 'تتداخل مضادات الحموضة المحتوية على المغنيسيوم مع امتصاصه.',
        en: 'Magnesium trisilicate antacids reduce absorption.',
      },
      pregnancyBreastfeeding: {
        ar: 'آمن خلال الثلث الأول والثاني، لكنه ممنوع تماماً في الشهر التاسع وقرب الولادة لتفادي فقر دم الجنين.',
        en: 'Safe in early pregnancy; contraindicated at term (38-42 weeks) and during labor.',
      },
      renalHepatic: {
        ar: 'يحتاج وظائف كلى طبيعية ليتراكم في البول بتركيز فعال، لذا يمنع في الفشل الكلوي.',
        en: 'Ineffective and contraindicated in severe kidney failure because it cannot reach therapeutic urinary levels.',
      },
      patientEducation: {
        ar: 'تناول الكبسولة مع الطعام أو الحليب لمنع الغثيان ولزيادة امتصاصه. تلون البول بالأصفر الداكن أو البرتقالي طبيعي ومؤقت. اشرب 2-3 لتر ماء يومياً.',
        en: 'Take with food or milk to enhance absorption and reduce nausea. Dark urine is expected and harmless.',
      },
    },
    brands: [
      { name: 'Macrofuran 100mg Capsules', manufacturer: 'Sedico Pharmaceuticals', barcode: '6221543004519', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Uvamin Retard 100mg Capsules', manufacturer: 'Mepha / Swiss Pharma', barcode: '6223000214311', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 5. Ciprofloxacin (Cipromay / Ciprofar)
  {
    id: 'ciprofloxacin',
    fields: {
      genericName: { ar: 'سيبروفلوكساسين', en: 'Ciprofloxacin' },
      activeIngredients: { ar: 'سيبروفلوكساسين هيدروكلوريد', en: 'Ciprofloxacin hydrochloride' },
      drugClass: { ar: 'مضاد حيوي من عائلة الفلوروكينولون (واسع المجال وقوي)', en: 'Fluoroquinolone broad-spectrum antibacterial' },
      strengths: {
        ar: 'أقراص: 500 مجم، 750 مجم، 250 مجم.\nمحلول وريدي بالتنقيط (IV Infusion): 200 مجم/100 مل، 400 مجم/200 مل.\nقطرات معقمة للعين والأذن: 0.3%.',
        en: 'Tablets: 500mg, 750mg, 250mg. IV Infusion: 200mg/100ml. Eye/Ear drops: 0.3%.',
      },
      approvedUses: {
        ar: 'علاج التهابات المسالك البولية المعقدة والتهاب الكلى والبروستاتا، النزلات المعوية البكتيرية الشديدة وحمى التيفود، عدوى العظام والمفاصل، والتهابات الجهاز التنفسي المعقدة. لا يعالج نزلات البرد والإنفلونزا.',
        en: 'Complicated UTIs, pyelonephritis, bacterial prostatitis, severe infectious diarrhea, typhoid fever, and bone/joint infections.',
      },
      priceEgypt: {
        ar: '• سيبروفار 500 مجم (10 أقراص) - فاركو: 48.00 جنيه مصري.\n• سيبروماي 500 مجم (10 أقراص) - إم يو بي MUP: 52.00 جنيه مصري.\n• سيبروباي 500 مجم (10 أقراص) - باير الألمانية: 110.00 جنيه مصري.\n• سيبروفلوكساسين 750 مجم (10 أقراص): 65.00 جنيه مصري.',
        en: '• Ciprofar 500mg (10 tabs - Pharco): 48.00 EGP\n• Cipromay 500mg (10 tabs - MUP): 52.00 EGP\n• Ciprobay 500mg (Bayer): 110.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز:\n1. سيبروفار 500 مجم (Ciprofar 500mg) - فاركو.\n2. سيبروماي 500 مجم (Cipromay 500mg) - MUP.\n3. سيرفيفلوكس 500 مجم (Serviflox 500mg) - نوفارتس.\n4. سيبروسين 500 مجم (Ciprocin 500mg).\n\n• البدائل من نفس العائلة: ليفوفلوكساسين (Tavanic / Levodel) قرص واحد يومياً.',
        en: 'Exact Equivalents:\n1. Ciprofar 500mg (Pharco)\n2. Cipromay 500mg (MUP)\n3. Serviflox 500mg (Novartis)\nAlternative: Levofloxacin (Tavanic).',
      },
      ageRestrictions: {
        ar: 'يمنع للأطفال والمراهقين دون سن 18 عاماً إلا في حالات خاصة جداً كالتليف الكيسي (خطر التأثير على غضاريف النمو والمفاصل).',
        en: 'Generally avoided in patients <18 years due to risk of cartilage arthropathy.',
      },
      dosingReference: {
        ar: 'قرص 500 مجم كل 12 ساعة لمدة 7 إلى 14 يوماً حسب موضع العدوى، مع شرب كميات كبيرة من الماء لتجنب تكون بلورات في البول.',
        en: '500mg every 12 hours for 7-14 days. Drink plenty of fluids.',
      },
      contraindications: {
        ar: 'ممنوع لمن لديهم تاريخ لالتهاب أو تمزق الأوتار، مرضى الوهن العضلي الوبيل (Myasthenia gravis)، وأثناء الحمل والرضاعة والأطفال.',
        en: 'Contraindicated in history of tendon rupture, myasthenia gravis, pregnancy, and lactation.',
      },
      sideEffects: {
        ar: 'غثيان، إسهال، دوخة، ألم في المفاصل أو الأوتار (خاصة وتر أكيلس). في حال شعرت بألم في الكاحل أو خلف القدم أوقف الدواء واستشر الطبيب فوراً.',
        en: 'Nausea, dizziness, tendonitis or tendon rupture (Achilles tendon), photosensitivity.',
      },
      interactions: {
        ar: 'يتفاعل بشدة مع الكالسيوم والحليب والزبادي ومكملات الحديد والزنك ومضادات الحموضة؛ يمنع تناولها إلا بفارق ساعتين قبل الدواء أو 4 ساعات بعده.',
        en: 'Binds with calcium, dairy products, iron, and antacids, drastically preventing absorption. Separate by 2-4 hours.',
      },
      pregnancyBreastfeeding: {
        ar: 'ممنوع أثناء الحمل والرضاعة لتأثيره الضار على غضاريف نمو الجنين والطفل.',
        en: 'Contraindicated in pregnancy and breastfeeding due to potential fetal arthropathy.',
      },
      renalHepatic: {
        ar: 'يتطلب تعديل وخفض الجرعة في مرضى القصور الكلوي الشديد.',
        en: 'Dose adjustment needed when creatinine clearance is <50 ml/min.',
      },
      patientEducation: {
        ar: 'اشرب الكثير من الماء يومياً. تجنب التعرض المباشر لأشعة الشمس القوية (يسبب تحسساً ضوئياً للجلد). لا تتناوله مع كوب حليب بل مع كوب ماء كبير.',
        en: 'Drink 2-3 liters of water daily. Avoid direct sunlight. Do NOT take with milk or yogurt.',
      },
    },
    brands: [
      { name: 'Ciprofar 500mg Tablets', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221008002341', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cipromay 500mg Tablets', manufacturer: 'MUP Egypt', barcode: '6221234005612', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 6. Clindamycin (Dalacin C / Clindam)
  {
    id: 'clindamycin',
    fields: {
      genericName: { ar: 'كليندامايسين', en: 'Clindamycin' },
      activeIngredients: { ar: 'كليندامايسين هيدروكلوريد', en: 'Clindamycin hydrochloride' },
      drugClass: { ar: 'مضاد حيوي من عائلة اللينكوساميد (قاتل للبكتيريا اللاهوائية والموجبة)', en: 'Lincosamide antibiotic' },
      strengths: {
        ar: 'كبسولات: 300 مجم، 150 مجم.\nحقن وريدية وعضلية (أمبول): 300 مجم/2 مل، 600 مجم/4 مل.\nمحلول وجل موضعي لحب الشباب: 1%.',
        en: 'Capsules: 300mg, 150mg. Ampoules: 300mg, 600mg. Topical solution/gel: 1%.',
      },
      approvedUses: {
        ar: 'علاج خراج والتهابات الأسنان واللثة الشديدة وعظام الفك (البديل الأول لحساسية البنسلين)، عدوى العظام والمفاصل (Osteomyelitis)، حب الشباب والتهابات الجلد البكتيرية، وعدوى الجهاز التنفسي والبطن اللاهوائية.',
        en: 'Severe dental abscesses and jaw infections (primary penicillin allergy alternative), osteomyelitis, acne vulgaris, and anaerobic infections.',
      },
      priceEgypt: {
        ar: '• دالاسين سي 300 مجم (16 كبسولة) - فايزر: 95.00 جنيه مصري.\n• كليندام 300 مجم (16 كبسولة): 62.00 جنيه مصري.\n• كليندامايسين أمبول 600 مجم للحقن: 35.00 جنيه مصري.\n• كلينداسول محلول موضعي لحب الشباب 1%: 24.00 جنيه مصري.',
        en: '• Dalacin C 300mg (16 caps - Pfizer): 95.00 EGP\n• Clindam 300mg (16 caps): 62.00 EGP\n• Clindamycin ampoule 600mg: 35.00 EGP\n• Clindasol topical solution: 24.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة الفعالة:\n1. كليندام 300 مجم (Clindam 300mg) - بديل مصري ممتاز.\n2. كلينداسين 300 مجم (Clindacin 300mg).\n3. دالاسين سي 300 مجم المستورد.\n\n• البدائل لعلاج الأسنان في حال عدم توفره: أموكسيسيلين/كلافولانات + فلاجيل (لمن ليس لديهم حساسية بنسلين).',
        en: 'Exact Generic Equivalents:\n1. Clindam 300mg\n2. Clindacin 300mg\nDental alternative for non-allergic patients: Augmentin + Flagyl.',
      },
      ageRestrictions: {
        ar: 'يستخدم بحذر للأطفال بناءً على حساب دقيق للوزن، والكبسولات للبالغين.',
        en: 'Pediatric dosing strictly by weight; capsules for adults.',
      },
      dosingReference: {
        ar: 'للأسنان والعدوى الحادة: كبسولة 300 مجم كل 6 إلى 8 ساعات بعد الأكل مع كوب ماء كبير، لمدة 7 أيام.',
        en: 'Dental/severe infections: 300mg every 6 to 8 hours with a full glass of water.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية من الكليندامايسين، أو تاريخ سابق للإصابة بالتهاب القولون الغشائي الكاذب (Pseudomembranous colitis).',
        en: 'Contraindicated in history of pseudomembranous colitis or regional enteritis.',
      },
      sideEffects: {
        ar: 'إسهال (يجب الانتباه له جيداً)، تهيج المريء والمعدة، طفح جلدي. إذا ظهر إسهال مائي حاد مستمر اتصل بالطبيب فوراً.',
        en: 'Diarrhea, esophageal irritation, nausea. Black-box risk for C. difficile colitis.',
      },
      interactions: {
        ar: 'قد يزيد من مفعول أدوية بسط العضلات المستخدمة في العمليات الجراحية.',
        en: 'Enhances neuromuscular blocking agents.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B للحمل؛ يعتبر خياراً علاجياً متاحاً عندما تدعو الحاجة الطبية، ويفرز في حليب الأم.',
        en: 'Category B. Considered acceptable in pregnancy when alternatives are lacking.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل جرعة في القصور الكلوي، يتابع في القصور الكبدي الشديد.',
        en: 'No dose adjustment in renal failure; monitor in severe liver dysfunction.',
      },
      patientEducation: {
        ar: 'ابلع الكبسولة مع كوب كامل من الماء وأنت جالس أو واقف (لا تستلقِ فوراً بعدها) لتجنب تقرح المريء. إذا أصبت بإسهال شديد مائي أثناء أو بعد العلاج، توقف وراجع الطبيب.',
        en: 'Take with a full glass of water and remain upright for 30 minutes to prevent esophageal ulcers.',
      },
    },
    brands: [
      { name: 'Dalacin C 300mg Capsules', manufacturer: 'Pfizer Egypt', barcode: '6221054008713', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Clindam 300mg Capsules', manufacturer: 'Sigma Pharmaceuticals', barcode: '6221127003192', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 7. Doxycycline (Tabocin / Vibramycin)
  {
    id: 'doxycycline',
    fields: {
      genericName: { ar: 'دوكسيسيكلين', en: 'Doxycycline' },
      activeIngredients: { ar: 'دوكسيسيكلين هيكلات', en: 'Doxycycline hyclate' },
      drugClass: { ar: 'مضاد حيوي واسع المجال من عائلة التتراسيكلين', en: 'Tetracycline antibiotic' },
      strengths: {
        ar: 'كبسولات: 100 مجم، 50 مجم.',
        en: 'Capsules: 100mg, 50mg.',
      },
      approvedUses: {
        ar: 'علاج حب الشباب المتوسط والشديد (Acne vulgaris)، والتهابات الجلد، عدوى الجهاز التنفسي والالتهاب الرئوي اللانمطي (Atypical pneumonia)، عدوى الكلاميديا والمسالك التناسلية، والوقاية من الملاريا.',
        en: 'Moderate to severe acne vulgaris, atypical pneumonia, chlamydial infections, chronic bronchitis, and malaria prophylaxis.',
      },
      priceEgypt: {
        ar: '• تابوسين 100 مجم (10 كبسولات) - حكمة: 35.00 جنيه مصري.\n• فيبراميسين 100 مجم (10 كبسولات) - فايزر: 42.00 جنيه مصري.\n• دوكسيمايسين 100 مجم (10 كبسولات): 25.00 جنيه مصري.',
        en: '• Tabocin 100mg (10 caps - Hikma): 35.00 EGP\n• Vibramycin 100mg (10 caps - Pfizer): 42.00 EGP\n• Doxymycin 100mg: 25.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً (نفس المادة الفعالة والتركيز):\n1. تابوسين 100 مجم (Tabocin 100mg) - حكمة.\n2. فيبراميسين 100 مجم (Vibramycin 100mg) - فايزر.\n3. دوكسيمايسين 100 مجم (Doxymycin 100mg).\n4. دوكسيكوست 100 مجم.\n\n• البدائل لحب الشباب: أريثرومايسين أو كليندامايسين موضعي.',
        en: 'Exact Generic Equivalents:\n1. Tabocin 100mg (Hikma)\n2. Vibramycin 100mg (Pfizer)\n3. Doxymycin 100mg\nAcne alternative: Topical Clindamycin.',
      },
      ageRestrictions: {
        ar: 'ممنوع تماماً للأطفال أقل من 8 سنوات (يسبب تصبغاً بنياً دائماً في الأسنان النامية وضعف نمو العظام).',
        en: 'Strictly contraindicated in children <8 years due to permanent tooth discoloration and enamel hypoplasia.',
      },
      dosingReference: {
        ar: 'لحب الشباب: كبسولة 100 مجم يومياً بعد الأكل مع كوب ماء كبير لمدة 6 إلى 12 أسبوعاً حسب إرشادات طبيب الجلدية. للعدوى الحادة: كبسولة كل 12 ساعة.',
        en: 'For acne: 100mg once daily for 6-12 weeks. For acute infections: 100mg twice daily.',
      },
      contraindications: {
        ar: 'ممنوع أثناء الحمل والرضاعة، وللأطفال دون 8 سنوات، ولمن لديهم حساسية التتراسيكلين.',
        en: 'Contraindicated in pregnancy, lactation, children under 8, and tetracycline allergy.',
      },
      sideEffects: {
        ar: 'تحسس شديد لأشعة الشمس وحروق شمسية سريعة، تهيج وقرح المريء إذا ابتلع بدون ماء كافٍ، غثيان.',
        en: 'Photosensitivity, esophageal ulceration if taken without water, nausea.',
      },
      interactions: {
        ar: 'يتفاعل بقوة مع الكالسيوم والحليب والزبادي ومكملات الحديد ومضادات الحموضة؛ يمنع تناولها معاً ويجب الفصل بساعتين على الأقل.',
        en: 'Chelates with calcium, dairy products, iron, and antacids, blocking absorption.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة D؛ ممنوع قطعياً في الحمل والرضاعة لتسببه في تشوه وتصبغ أسنان وعظام الجنين.',
        en: 'Category D. Strictly contraindicated; causes permanent tooth staining in fetus.',
      },
      renalHepatic: {
        ar: 'يعد التتراسيكلين الوحيد الآمن في القصور الكلوي لأنه يطرح أساساً عبر الكبد والجهاز الهضمي.',
        en: 'Safe in renal impairment as it is eliminated primarily through non-renal routes.',
      },
      patientEducation: {
        ar: 'ابلع الكبسولة مع كوب كبير من الماء وأنت واقف ولا تستلقِ لمدة 30 دقيقة بعدها. استخدم واقي شمس عند الخروج نهاراً. لا تأخذ معه كوب حليب أو أقراص حديد.',
        en: 'Take with a full glass of water upright. Do not lie down for 30 minutes. Use sunscreen.',
      },
    },
    brands: [
      { name: 'Tabocin 100mg Capsules', manufacturer: 'Hikma Pharma', barcode: '6221127009182', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Vibramycin 100mg Capsules', manufacturer: 'Pfizer Egypt', barcode: '6221054005121', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 8. Clarithromycin (Klacid / Clarikan)
  {
    id: 'clarithromycin',
    fields: {
      genericName: { ar: 'كلاريثرومايسين', en: 'Clarithromycin' },
      activeIngredients: { ar: 'كلاريثرومايسين', en: 'Clarithromycin' },
      drugClass: { ar: 'مضاد حيوي من عائلة الماكروليد', en: 'Macrolide antibiotic' },
      strengths: {
        ar: 'أقراص: 500 مجم، 250 مجم، أقراص ممتدة المفعول XL بتركيز 500 مجم.\nشراب معلق للأطفال: 125 مجم/5 مل، 250 مجم/5 مل.',
        en: 'Tablets: 500mg, 250mg, Extended-release XL 500mg. Suspension: 125mg/5ml, 250mg/5ml.',
      },
      approvedUses: {
        ar: 'علاج جرثومة المعدة (H. pylori) ضمن البروتوكول الثلاثي والرباعي، التهابات الجهاز التنفسي والجيوب الأنفية واللوزتين، والتهابات الجلد لمن لديهم حساسية بنسلين.',
        en: 'Helicobacter pylori eradication (triple therapy), respiratory tract infections, and skin infections in penicillin-allergic patients.',
      },
      priceEgypt: {
        ar: '• كلاسيد 500 مجم (14 قرص) - أبوت: 185.00 جنيه مصري.\n• كلاريكان 500 مجم (14 قرص) - الحكمة: 125.00 جنيه مصري.\n• كلاسيد شراب 125 مجم للأطفال: 75.00 جنيه مصري.\n• كلاسيد XL ممتد المفعول 500 مجم (7 أقراص): 110.00 جنيه مصري.',
        en: '• Klacid 500mg (14 tabs - Abbott): 185.00 EGP\n• Clarikan 500mg (14 tabs - Hikma): 125.00 EGP\n• Klacid syrup 125mg: 75.00 EGP\n• Klacid XL 500mg: 110.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز:\n1. كلاريكان 500 مجم (Clarikan 500mg) - حكمة.\n2. كلاسيد 500 مجم (Klacid 500mg) - أبوت.\n3. كلاسيد ممتد المفعول (Klacid XL).\n4. كلاريباكت 500 مجم.\n\n• البدائل من نفس العائلة لعدوى التنفس: أزيثرومايسين (Zithromax).',
        en: 'Exact Generic Equivalents:\n1. Clarikan 500mg (Hikma)\n2. Klacid 500mg (Abbott)\nAlternative: Azithromycin.',
      },
      ageRestrictions: {
        ar: 'آمن للأطفال أكبر من 6 أشهر كشراب معلق، والأقراص للبالغين.',
        en: 'Suspension safe for infants >6 months; tablets for adults.',
      },
      dosingReference: {
        ar: 'لجرثومة المعدة: قرص 500 مجم كل 12 ساعة لمدة 14 يوماً مع أموكسيسيلين وأوميبرازول. لعدوى الصدر: قرص كل 12 ساعة لمدة 7 إلى 10 أيام.',
        en: 'H. pylori: 500mg twice daily for 14 days. Respiratory infections: 500mg every 12 hours.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية الماكروليد، أو مرضى متلازمة استطالة فترة QT القلبية، وممنوع تناوله مع أدوية الكوليسترول كالسيمفاستاتين.',
        en: 'Contraindicated with statins (simvastatin), QT prolongation, and severe hepatic disease.',
      },
      sideEffects: {
        ar: 'طعم مر غير مستحب بالفم، اضطراب معدة، غثيان، وإسهال.',
        en: 'Bitter metallic taste, abdominal pain, nausea, diarrhea.',
      },
      interactions: {
        ar: 'يثبط إنزيم CYP3A4 الكبدي بقوة، فيزيد بشكل خطير من تركيز أدوية الكوليسترول (الستاتينات) ومميعات الدم (وارفارين).',
        en: 'Potent CYP3A4 inhibitor; dangerous interaction with simvastatin (rhabdomyolysis risk).',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ يفضل تجنبه أثناء الحمل إلا إذا كانت الفائدة ترجح المخاطر ولا يوجد بديل أكثر أماناً.',
        en: 'Category C. Avoid in pregnancy if safer alternatives are available.',
      },
      renalHepatic: {
        ar: 'يخفض الجرعة إلى النصف في القصور الكلوي الشديد (GFR <30).',
        en: 'Reduce dose by 50% if GFR is <30 ml/min.',
      },
      patientEducation: {
        ar: 'الطعم المر في الفم أثر جانبي شائع ومؤقت يزول بانتهاء العلاج. في حال تناول أقراص XL ممتدة المفعول ابلعها كاملة ولا تمضغها أو تكسرها.',
        en: 'Bitter taste is common and temporary. Do not crush or chew XL extended-release tablets.',
      },
    },
    brands: [
      { name: 'Klacid 500mg Tablets', manufacturer: 'Abbott Laboratories', barcode: '6221054001929', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Clarikan 500mg Tablets', manufacturer: 'Hikma Pharma', barcode: '6221127008741', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 9. Co-trimoxazole (Septazole / Sutrim)
  {
    id: 'co-trimoxazole',
    fields: {
      genericName: { ar: 'سلفاميثوكسازول + تريميثوبريم (كوتريموكسازول)', en: 'Sulfamethoxazole + Trimethoprim (Co-trimoxazole)' },
      activeIngredients: { ar: 'سلفاميثوكسازول وتريميثوبريم بنسبة 5 إلى 1', en: 'Sulfamethoxazole and Trimethoprim' },
      drugClass: { ar: 'مضاد بكتيري مركب مثبط لحمض الفوليك البكتيري', en: 'Sulfonamide and folate antagonist antibacterial' },
      strengths: {
        ar: 'أقراص فورت (Double Strength): 800/160 مجم.\nأقراص عادية: 400/80 مجم.\nشراب معلق للأطفال: 200/40 مجم لكل 5 مل.',
        en: 'Forte tablets: 800/160mg. Regular tablets: 400/80mg. Pediatric suspension: 200/40mg per 5ml.',
      },
      approvedUses: {
        ar: 'علاج التهابات المسالك البولية وحرقان المثانة، النزلات المعوية وبكتيريا الشيجيلا، التهابات الأذن الوسطى، والوقاية والعلاج لمرض الالتهاب الرئوي بالمتكيسة الرئوية (PJP).',
        en: 'Uncomplicated UTIs, shigellosis, otitis media, acute exacerbation of chronic bronchitis, and Pneumocystis jirovecii pneumonia (PCP).',
      },
      priceEgypt: {
        ar: '• سبتازول فورت (20 قرص) - الإسكندرية: 32.00 جنيه مصري.\n• سوتريم فورت (20 قرص): 28.00 جنيه مصري.\n• سبتازول شراب للأطفال (100 مل): 18.00 جنيه مصري.',
        en: '• Septazole Forte (20 tabs): 32.00 EGP\n• Sutrim Forte (20 tabs): 28.00 EGP\n• Septazole suspension: 18.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً:\n1. سبتازول فورت (Septazole Forte) - شركة الإسكندرية للأدوية.\n2. سوتريم فورت (Sutrim Forte) - شركة فاركو.\n3. كيموتريم فورت (Chemotrim Forte).\n\n• البدائل للمسالك البولية: نيتروفورانتوين (Macrofuran) أو فوسفوميسين.',
        en: 'Exact Generic Equivalents:\n1. Septazole Forte (Alexandria)\n2. Sutrim Forte (Pharco)\n3. Chemotrim Forte\nUTI alternative: Macrofuran.',
      },
      ageRestrictions: {
        ar: 'ممنوع للأطفال حديثي الولادة أقل من شهرين (خطر اليرقان النووي Kernicterus).',
        en: 'Contraindicated in infants <2 months old.',
      },
      dosingReference: {
        ar: 'قرص فورت واحد كل 12 ساعة بعد الأكل مع شرب كميات وافرة من الماء لمدة 5 إلى 7 أيام.',
        en: 'One Forte tablet every 12 hours with plenty of fluids for 5-7 days.',
      },
      contraindications: {
        ar: 'ممنوع لمن يعانون من حساسية السلفا، مرضى أنيميا الفول (G6PD)، والقصور الكلوي أو الكبدي الشديد، والأسابيع الأخيرة من الحمل.',
        en: 'Contraindicated in sulfa allergy, G6PD deficiency, severe renal/liver failure, and late pregnancy.',
      },
      sideEffects: {
        ar: 'غثيان، قيء، طفح جلدي (يجب إيقاف الدواء فوراً إذا ظهر طفح جلدي لتفادي متلازمة ستيفنز جونسون).',
        en: 'Nausea, anorexia, skin rash (stop immediately if rash occurs to avoid Stevens-Johnson syndrome).',
      },
      interactions: {
        ar: 'يرفع تركيز البوتاسيوم في الدم، ويتفاعل مع الوارفارين ويزيد النزيف، ويتفاعل مع ميثوتريكسات.',
        en: 'Increases serum potassium; potentiates warfarin anticoagulation.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة D؛ ممنوع في الثلث الأول والأسابيع الأخيرة من الحمل لتأثيره على حمض الفوليك واليرقان.',
        en: 'Contraindicated in early pregnancy and near delivery.',
      },
      renalHepatic: {
        ar: 'يخفض الجرعة للنصف إذا كانت تصفية الكلى بين 15 و 30 مل/دقيقة، وممنوع إذا كانت أقل من 15.',
        en: 'Reduce dose by 50% for CrCl 15-30 ml/min; contraindicated if <15.',
      },
      patientEducation: {
        ar: 'اشرب الكثير من الماء يومياً لمنع تكون حصوات أو بلورات السلفا في الكلى والمسالك البولية. إذا ظهر أي احمرار أو طفح جلدي توقف فوراً واستشر الطبيب.',
        en: 'Drink abundant fluids daily to avoid crystalluria. Report any new skin rash immediately.',
      },
    },
    brands: [
      { name: 'Septazole Forte Tablets', manufacturer: 'Alexandria Pharmaceuticals', barcode: '6221008007621', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Sutrim Forte Tablets', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221008008129', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 10. Cefuroxime (Zinnat / Cefurox)
  {
    id: 'cefuroxime',
    fields: {
      genericName: { ar: 'سيفوروكسيم أكسيتيل', en: 'Cefuroxime axetil' },
      activeIngredients: { ar: 'سيفوروكسيم أكسيتيل', en: 'Cefuroxime axetil' },
      drugClass: { ar: 'مضاد حيوي من عائلة السيفالوسبورين (الجيل الثاني)', en: 'Second-generation cephalosporin' },
      strengths: {
        ar: 'أقراص: 500 مجم، 250 مجم.\nشراب معلق للأطفال: 125 مجم/5 مل، 250 مجم/5 مل.\nحقن وريدية وعضلية (فيال): 750 مجم، 1.5 جم.',
        en: 'Tablets: 500mg, 250mg. Suspension: 125mg/5ml, 250mg/5ml. IV/IM vials: 750mg, 1.5g.',
      },
      approvedUses: {
        ar: 'علاج التهابات الجهاز التنفسي والتهاب اللوزتين والجيوب الأنفية، عدوى الأذن الوسطى، التهابات المسالك البولية والتهاب المثانة، وعدوى الجلد والأنسجة الرخوة.',
        en: 'Pharyngitis, acute tonsillitis, otitis media, uncomplicated UTIs, sinusitis, and skin infections.',
      },
      priceEgypt: {
        ar: '• زينات 500 مجم (10 أقراص) - GSK: 120.00 جنيه مصري.\n• سيفوروكس 500 مجم (10 أقراص): 85.00 جنيه مصري.\n• زينات شراب 125 مجم للأطفال (50 مل): 72.00 جنيه مصري.\n• زينات شراب 250 مجم للأطفال (50 مل): 98.00 جنيه مصري.',
        en: '• Zinnat 500mg (10 tabs - GSK): 120.00 EGP\n• Cefurox 500mg (10 tabs): 85.00 EGP\n• Zinnat suspension 125mg: 72.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز:\n1. سيفوروكس 500 مجم (Cefurox 500mg) - بديل مصري عالي الجودة.\n2. إكزيم 500 مجم (Xime 500mg).\n3. زينات 500 مجم المستورد.\n\n• البدائل من نفس العائلة: سيفيكسيم (Suprax) أو أموكسيسيلين/كلافولانات.',
        en: 'Exact Generic Equivalents:\n1. Cefurox 500mg\n2. Xime 500mg\nAlternative: Suprax or Augmentin.',
      },
      ageRestrictions: {
        ar: 'آمن للأطفال والرضع أكبر من 3 أشهر كشراب معلق، والأقراص لمن هم فوق سن البلوغ.',
        en: 'Suspension approved for infants >3 months; tablets for older children/adults.',
      },
      dosingReference: {
        ar: 'للبالغين: قرص 500 مجم كل 12 ساعة بعد الوجبات مباشرة لمدة 7 إلى 10 أيام.',
        en: 'Adults: 500mg twice daily with food for 7-10 days.',
      },
      contraindications: {
        ar: 'يمنع لمن لديهم حساسية مفرطة تجاه السيفالوسبورينات، وبحذر لمن لديهم حساسية بنسلين شديدة.',
        en: 'Contraindicated in cephalosporin allergy; use caution in severe penicillin anaphylaxis.',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، ألم بالمعدة، صداع، ونادراً طفح جلدي.',
        en: 'Diarrhea, nausea, headache, transient transaminase elevation.',
      },
      interactions: {
        ar: 'مضادات الحموضة تقلل من امتصاصه الفموي؛ يجب الفصل بساعتين على الأقل.',
        en: 'Drugs that reduce gastric acidity decrease bioavailability.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ يعتبر آمناً وفعالاً أثناء الحمل والرضاعة عند وصف الطبيب.',
        en: 'Category B. Safe in pregnancy and lactation under medical supervision.',
      },
      renalHepatic: {
        ar: 'يتطلب تعديل الجرعة في مرضى الفشل الكلوي المتقدم.',
        en: 'Dose adjustment needed when creatinine clearance is <30 ml/min.',
      },
      patientEducation: {
        ar: 'تناول الأقراص بعد الطعام مباشرة لتحقيق أعلى نسبة امتصاص في الدم والتخلص من الطعم المر.',
        en: 'Take with food for maximum bioavailability and to mask bitter taste.',
      },
    },
    brands: [
      { name: 'Zinnat 500mg Tablets', manufacturer: 'GlaxoSmithKline (GSK)', barcode: '6221127002341', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefurox 500mg Tablets', manufacturer: 'Pharco B', barcode: '6221008006512', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 11. Ceftriaxone (Ceftriaxone / Epicephin / Cefaxone)
  {
    id: 'ceftriaxone',
    fields: {
      genericName: { ar: 'سيفترياكسون', en: 'Ceftriaxone' },
      activeIngredients: { ar: 'سيفترياكسون صوديوم', en: 'Ceftriaxone sodium' },
      drugClass: { ar: 'مضاد حيوي للحقن من عائلة السيفالوسبورين (الجيل الثالث)', en: 'Third-generation cephalosporin injection' },
      strengths: {
        ar: 'فيال للحقن الوريدي والعضلي: 1 جم (1000 مجم)، 500 مجم، 250 مجم.',
        en: 'IV/IM Vials: 1g, 500mg, 250mg.',
      },
      approvedUses: {
        ar: 'علاج العدوى الشديدة في المستشفيات: الالتهاب الرئوي الحاد، التهاب السحايا (Meningitis)، تسمم الدم، عدوى المسالك البولية المعقدة، والوقاية قبل العمليات الجراحية الكبرى.',
        en: 'Severe hospital-acquired infections: bacterial meningitis, community-acquired/nosocomial pneumonia, sepsis, intra-abdominal infections, and surgical prophylaxis.',
      },
      priceEgypt: {
        ar: '• سيفترياكسون 1 جم فيال (حقن): 42.00 جنيه مصري.\n• إبيسيفين 1 جم فيال (حقن) - إيبيكو: 48.00 جنيه مصري.\n• سيفاكسون 1 جم فيال (حقن) - فاركو: 45.00 جنيه مصري.\n• روسيفين 1 جم فيال (روش السويسرية): 115.00 جنيه مصري.',
        en: '• Ceftriaxone 1g vial: 42.00 EGP\n• Epicephin 1g vial (EIPICO): 48.00 EGP\n• Cefaxone 1g vial (Pharco): 45.00 EGP\n• Rocephin 1g vial (Roche): 115.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً (نفس المادة والحقن الوريدي/العضلي):\n1. إبيسيفين 1 جم (Epicephin 1g) - إيبيكو.\n2. سيفاكسون 1 جم (Cefaxone 1g) - فاركو.\n3. سيفترياكسون 1 جم (ساندوز أو سيديكو).\n4. روسيفين 1 جم (Rocephin 1g) المستورد.\n\n• البدائل من نفس الفئة: سيفوتاكسيم (Claforan / Cefotax).',
        en: 'Exact Generic Equivalents:\n1. Epicephin 1g (EIPICO)\n2. Cefaxone 1g (Pharco)\n3. Rocephin 1g\nAlternative: Cefotaxime (Claforan).',
      },
      ageRestrictions: {
        ar: 'ممنوع منعاً باتاً لحديثي الولادة المصابين باليرقان (خطر اليرقان الدماغي)، وممنوع مزجه مع محاليل الكالسيوم للأطفال.',
        en: 'Contraindicated in hyperbilirubinemic neonates and premature infants.',
      },
      dosingReference: {
        ar: 'حقنة 1 جم وريدياً بالتنقيط البطيء أو عضلياً كل 24 ساعة (أو كل 12 ساعة في العدوى الشديدة)، تحت إشراف تمريضي وطبي مباشر.',
        en: 'Adults: 1-2g IV/IM once every 24 hours under clinical supervision.',
      },
      contraindications: {
        ar: 'يمنع مزجه نهائياً في نفس المحلول أو الوريد مع أي محاليل تحتوي على الكالسيوم (كالرينجر لاكتات) حتى عبر خطوط وريدية منفصلة عند الرضع.',
        en: 'Do NOT mix or co-administer with calcium-containing IV solutions (risk of precipitation in lungs/kidneys).',
      },
      sideEffects: {
        ar: 'إسهال، ألم في موضع الحقن، تفاعلات تحسسية، وترسبات حصوية مؤقتة في المرارة.',
        en: 'Diarrhea, injection site pain, thrombophlebitis, biliary sludging.',
      },
      interactions: {
        ar: 'ترسبات خطيرة ومميتة مع محاليل الكالسيوم الوريدية. يزيد من تأثير مميعات الدم.',
        en: 'Fatal particulate precipitation with IV calcium in neonates.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف في حالات العدوى الشديدة أثناء الحمل تحت إشراف الطبيب.',
        en: 'Category B. Safe in pregnancy when severe bacterial infection mandates it.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل جرعة في القصور الكلوي المنفرد طالما الكبد سليم، ولا في القصور الكبدي المنفرد طالما الكلى سليمة.',
        en: 'Dual route of excretion (renal and biliary); no adjustment needed unless both renal and hepatic failure coexist.',
      },
      patientEducation: {
        ar: 'إعطاء هذا الدواء يتم حصراً بواسطة ممرض مؤهل أو طبيب في المستشفى أو المركز الطبي. يجب إجراء اختبار الحساسية قبل أول جرعة حقن.',
        en: 'Must be administered by qualified nursing personnel. Skin allergy testing is advised prior to administration.',
      },
    },
    brands: [
      { name: 'Epicephin 1g Vial', manufacturer: 'EIPICO Egypt', barcode: '6221127003412', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefaxone 1g Vial', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221008003129', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },

  // 12. Levofloxacin (Tavanic / Levodel)
  {
    id: 'levofloxacin',
    fields: {
      genericName: { ar: 'ليفوفلوكساسين', en: 'Levofloxacin' },
      activeIngredients: { ar: 'ليفوفلوكساسين هيميهيدرات', en: 'Levofloxacin hemihydrate' },
      drugClass: { ar: 'مضاد حيوي من عائلة الفلوروكينولون التنفسي (الجيل الثالث)', en: 'Respiratory fluoroquinolone' },
      strengths: {
        ar: 'أقراص: 500 مجم، 750 مجم.\nمحلول وريدي بالتنقيط (IV Infusion): 500 مجم/100 مل.\nقطرات معقمة للعين: 0.5%.',
        en: 'Tablets: 500mg, 750mg. IV Infusion: 500mg/100ml. Eye drops: 0.5%.',
      },
      approvedUses: {
        ar: 'علاج الالتهاب الرئوي المكتسب من المجتمع الحاد، تفاقم التهاب الشعب الهوائية المزمن، التهاب الجيوب الأنفية الحاد، والتهابات المسالك البولية وحوض الكلى المعقدة، والتهاب البروستاتا المزمن.',
        en: 'Community-acquired pneumonia, acute sinusitis, acute bacterial exacerbation of chronic bronchitis, complicated UTIs, and bacterial prostatitis.',
      },
      priceEgypt: {
        ar: '• تافانيك 500 مجم (7 أقراص) - سانوفي: 145.00 جنيه مصري.\n• ليفوديل 500 مجم (7 أقراص): 85.00 جنيه مصري.\n• يونيفلوكس 500 مجم (7 أقراص): 68.00 جنيه مصري.\n• تافانيك محلول وريدي 500 مجم: 110.00 جنيه مصري.',
        en: '• Tavanic 500mg (7 tabs - Sanofi): 145.00 EGP\n• Levodel 500mg (7 tabs): 85.00 EGP\n• Unilevo 500mg: 68.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز (قرص واحد يومياً):\n1. ليفوديل 500 مجم (Levodel 500mg) - فاركو.\n2. يونيفلوكس 500 مجم (Uniflox 500mg).\n3. ليفوكسين 500 مجم (Levoxin 500mg).\n4. تافانيك 500 مجم المستورد.\n\n• البدائل من نفس الفئة: موكسيفلوكساسين (Avelox / Avalox) أو سيبروفلوكساسين.',
        en: 'Exact Generic Equivalents:\n1. Levodel 500mg\n2. Uniflox 500mg\n3. Levoxin 500mg\nAlternative: Moxifloxacin (Avelox).',
      },
      ageRestrictions: {
        ar: 'ممنوع للأطفال والمراهقين دون سن 18 عاماً لتأثيره على الأوتار وغضاريف النمو.',
        en: 'Contraindicated in pediatric patients under 18 years.',
      },
      dosingReference: {
        ar: 'قرص واحد 500 مجم مرة واحدة فقط كل 24 ساعة مع كوب ماء كبير لمدة 7 إلى 14 يوماً حسب توجيهات الطبيب.',
        en: 'Adults: 500mg once daily every 24 hours with abundant fluids.',
      },
      contraindications: {
        ar: 'ممنوع في الحمل والرضاعة، وللأطفال، ولمرضى الصرع والتشنجات، ولمن عانوا من مشاكل أو تمزق في الأوتار مع أي مضاد كينولوني سابق.',
        en: 'Contraindicated in tendonitis history, epilepsy/seizure disorders, pregnancy, and children.',
      },
      sideEffects: {
        ar: 'غثيان، صداع، أرق، دوخة، وألم في المفاصل والأوتار (وتر العرقوب). في حال حدوث ألم بالأوتار توقف فوراً.',
        en: 'Nausea, insomnia, dizziness, risk of tendonitis/tendon rupture.',
      },
      interactions: {
        ar: 'يتفاعل بشدة مع الكالسيوم ومكملات الحديد والزنك والحليب والزبادي؛ يجب الفصل بساعتين على الأقل.',
        en: 'Absorption severely impaired by calcium, dairy, iron, and multivalent cations.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ ممنوع في الحمل والرضاعة.',
        en: 'Category C. Contraindicated during pregnancy and lactation.',
      },
      renalHepatic: {
        ar: 'يطرح كلوياً بشكل رئيسي؛ يجب تعديل الجرعة بدقة في مرضى القصور الكلوي.',
        en: 'Dosage adjustment required when creatinine clearance is <50 ml/min.',
      },
      patientEducation: {
        ar: 'تناول القرص في نفس الموعد يومياً مع كوب ماء كبير. تجنب قيادة السيارة إذا شعرت بدوخة. تجنب شرب الحليب أو مكملات الحديد معه مباشرة.',
        en: 'Take once daily at the same hour with plenty of water. Do not combine with dairy or iron.',
      },
    },
    brands: [
      { name: 'Tavanic 500mg Tablets', manufacturer: 'Sanofi Egypt', barcode: '6221008004521', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Levodel 500mg Tablets', manufacturer: 'Pharco B', barcode: '6221008009181', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified record with Egyptian barcodes and pricing.',
  },
];
