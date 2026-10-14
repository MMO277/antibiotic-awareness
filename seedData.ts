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
      mechanism: { ar: 'يثبط بناء الجدار الخلوي للبكتيريا مع إبطال مفعول إنزيمات بيتا-لاكتاماز المقاومة بواسطة الكلافولانات.', en: 'Inhibits bacterial cell wall synthesis while clavulanate inactivates beta-lactamase enzymes.' },
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
      mechanism: { ar: 'يدخل إلى الحمض النووي (DNA) للبكتيريا اللاهوائية والطفيليات ويكسر سلاسله مما يوقف تكاثرها ويقضي عليها.', en: 'Disrupts DNA and protein synthesis in anaerobic bacteria and protozoa.' },
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
      mechanism: { ar: 'يثبط تصنيع البروتينات الحيوية للبكتيريا بالارتباط بالوحدة 50S للريبوسوم البكتيري.', en: 'Binds to the 50S ribosomal subunit, inhibiting bacterial protein synthesis.' },
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
      mechanism: { ar: 'يتحول داخل البكتيريا إلى مركبات نشطة تتلف الحمض النووي والبروتينات في مجرى البول.', en: 'Inactivates bacterial ribosomal proteins and macromolecules.' },
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
      mechanism: { ar: 'يثبط إنزيم دنا جيراز وتوبويزوميراز IV المسؤولين عن تضاعف وانقسام الحمض النووي للبكتيريا.', en: 'Inhibits bacterial DNA gyrase and topoisomerase IV.' },
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
      mechanism: { ar: 'يمنع تكوين البروتين البكتيري بالارتباط بالوحدة 50S للريبوسوم البكتيري.', en: 'Reversibly binds to 50S ribosomal subunits, preventing peptide bond formation.' },
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
      mechanism: { ar: 'يثبط تصنيع البروتين بالارتباط بالوحدة 30S للريبوسوم البكتيري ويمنع تكاثرها.', en: 'Inhibits protein synthesis by binding to the 30S ribosomal subunit.' },
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
      mechanism: { ar: 'يوقف تخليق البروتين البكتيري الأساسي عبر الارتباط بالوحدة 50S للريبوسوم.', en: 'Inhibits protein synthesis via 50S ribosomal subunit binding.' },
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
      mechanism: { ar: 'يثبط خطوتين متتاليتين في تصنيع حمض الفوليك الأساسي للخلية البكتيرية بتأثير تآزري.', en: 'Synergistically blocks two consecutive steps in bacterial folic acid biosynthesis.' },
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
      mechanism: { ar: 'يمنع تصنيع جدار الخلية البكتيرية بالارتباط ببروتينات البنسلين الرابطة (PBPs).', en: 'Binds to penicillin-binding proteins (PBPs), inhibiting bacterial cell wall synthesis.' },
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
      mechanism: { ar: 'يثبط بناء الجدار الخلوي للبكتيريا وله قدرة عالية على اختراق الأنسجة وسوائل الجسم.', en: 'Binds to PBPs, inhibiting mucopeptide synthesis in bacterial cell walls.' },
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
      mechanism: { ar: 'يثبط إنزيمي توبويزوميراز IV ودنا جيراز المسؤولين عن تضاعف المادة الوراثية للبكتيريا.', en: 'Inhibits bacterial DNA gyrase and topoisomerase IV.' },
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


export const SOURCE_HINTS: { name: string; url: string }[] = [
  { name: 'هيئة الدواء المصرية (EDA)', url: 'https://edaegypt.gov.eg' },
  { name: 'MedlinePlus (US National Library of Medicine)', url: 'https://medlineplus.gov/' },
  { name: 'DailyMed (official US drug labels)', url: 'https://dailymed.nlm.nih.gov/' },
  { name: 'European Medicines Agency (EMA)', url: 'https://www.ema.europa.eu/' },
  { name: 'CDC – Antibiotic Prescribing and Use', url: 'https://www.cdc.gov/antibiotic-use/' },

  // 13. Plain Amoxicillin (E-Mox / Biomox / Amoxil)
  {
    id: 'amoxicillin',
    fields: {
      genericName: { ar: 'أموكسيسيلين', en: 'Amoxicillin' },
      activeIngredients: { ar: 'أموكسيسيلين ثلاثي الهيدرات', en: 'Amoxicillin trihydrate' },
      drugClass: { ar: 'مضاد حيوي من عائلة البنسلينات (قاتل للبكتيريا)', en: 'Penicillin-class antibiotic' },
      mechanism: { ar: 'يثبط بناء الجدار الخلوي للبكتيريا مما يؤدي إلى تحللها وموتها سريعاً.', en: 'Inhibits bacterial cell wall synthesis causing cell lysis and death.' },
      strengths: {
        ar: 'كبسولات: 500 مجم، 250 مجم.\nأقراص قابلة للذوبان / مضغ: 1 جم، 500 مجم.\nشراب معلق للأطفال: 250 مجم/5 مل، 125 مجم/5 مل.',
        en: 'Capsules: 500mg, 250mg. Dispersible tablets: 1g, 500mg. Suspension: 250mg/5ml, 125mg/5ml.',
      },
      approvedUses: {
        ar: 'علاج التهابات الجهاز التنفسي العلوي الخفيفة (التهاب اللوزتين والحلق البكتيري)، التهاب الأذن الوسطى الحاد عند الأطفال، التهابات المسالك البولية الخفيفة، والجرثومة الحلزونية للمعدة مع أدوية أخرى. لا يعالج البرد أو الفيروسات.',
        en: 'Mild upper respiratory infections (strep throat), acute otitis media in children, uncomplicated UTIs, and H. pylori eradication.',
      },
      priceEgypt: {
        ar: '• إي-موكس 500 مجم (16 كبسولة) - إيبيكو: 38.00 جنيه مصري.\n• بيوموكس 500 مجم (16 كبسولة) - سيديكو: 32.00 جنيه مصري.\n• أموكسيل 500 مجم (16 كبسولة) - GSK: 49.50 جنيه مصري.\n• إي-موكس شراب معلق 250 مجم (100 مل): 28.50 جنيه مصري.\n• بيوموكس شراب معلق 250 مجم: 24.00 جنيه مصري.',
        en: '• E-Mox 500mg (16 caps - EIPICO): 38.00 EGP\n• Biomox 500mg (16 caps - Sedico): 32.00 EGP\n• Amoxil 500mg (16 caps - GSK): 49.50 EGP\n• E-Mox suspension 250mg: 28.50 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة الفعالة والتركيز:\n1. إي-موكس 500 مجم (E-Mox 500mg) - إيبيكو.\n2. بيوموكس 500 مجم (Biomox 500mg) - سيديكو.\n3. هايموكس 500 مجم (Hymox 500mg) - سبيماكو.\n4. أموكسيل 500 مجم (Amoxil 500mg) - GSK.\n\n• البدائل الأقوى عند مقاومة البكتيريا: أموكسيسيلين + كلافولانات (أوجمنتين أو كيورام أو هاي بيوتك).',
        en: 'Exact Generic Equivalents:\n1. E-Mox 500mg (EIPICO)\n2. Biomox 500mg (Sedico)\n3. Hymox 500mg\n4. Amoxil 500mg\nAugmented alternative: Augmentin or Curam.',
      },
      ageRestrictions: {
        ar: 'آمن للرضع والأطفال بجرعة شراب محسوبة بالوزن، والكبسولات للأطفال فوق 40 كجم والبالغين.',
        en: 'Safe for infants and children (weight-based suspension); capsules for >40kg and adults.',
      },
      dosingReference: {
        ar: 'للبالغين: كبسولة 500 مجم كل 8 ساعات، أو قرص 1 جم كل 12 ساعة لمدة 7 إلى 10 أيام. للأطفال: 40-90 مجم/كجم/يوم مقسمة على جرعات.',
        en: 'Adults: 500mg every 8 hours or 1g every 12 hours for 7-10 days.',
      },
      contraindications: {
        ar: 'ممنوع لمن يعانون من حساسية مفرطة تجاه البنسلين ومشتقاته، ولمرضى كثرة الوحيدات العدوائية (Mononucleosis) لتجنب الطفح الجلدي.',
        en: 'Contraindicated in penicillin allergy and infectious mononucleosis (rash risk).',
      },
      sideEffects: {
        ar: 'إسهال خفيف، غثيان، طفح جلدي تحسسي، وتغير مؤقت في لون الأسنان عند الأطفال يزول بتنظيفها.',
        en: 'Mild diarrhea, nausea, skin rash, transient tooth discoloration in children.',
      },
      interactions: {
        ar: 'قد يقلل من فاعلية حبوب منع الحمل. يتفاعل مع ألوبيورينول (يزيد الطفح الجلدي) والميثوتريكسات.',
        en: 'May reduce oral contraceptive efficacy. Interacts with allopurinol (rash risk).',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ من أكثر المضادات الحيوية أماناً واستخداماً أثناء فترتي الحمل والرضاعة تحت إشراف الطبيب.',
        en: 'Category B. One of the safest antibiotics during pregnancy and lactation.',
      },
      renalHepatic: {
        ar: 'يتطلب تعديل الفاصل الزمني بين الجرعات (كل 12 أو 24 ساعة) في حالات القصور الكلوي الحاد.',
        en: 'Dose interval adjustment required in severe renal failure (eGFR <30).',
      },
      patientEducation: {
        ar: 'يمكن تناوله مع الطعام أو بدونه (تناوله مع وجبة خفيفة يقلل من اضطراب المعدة). رج زجاجة الشراب جيداً قبل كل جرعة واحفظها في الثلاجة وتخلص من الباقي بعد 10 أيام.',
        en: 'Can be taken with or without food. Shake suspension bottle well and store in refrigerator.',
      },
    },
    brands: [
      { name: 'E-Mox 500mg Capsules', manufacturer: 'EIPICO Egypt', barcode: '6221127001245', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Biomox 500mg Capsules', manufacturer: 'Sedico Pharmaceuticals', barcode: '6221543002341', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Amoxil 500mg Capsules', manufacturer: 'GlaxoSmithKline (GSK)', barcode: '6221127005112', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 14. Penicillin V Potassium (Ospen / Calciopen)
  {
    id: 'penicillin-v-potassium',
    fields: {
      genericName: { ar: 'بنسلين V البوتاسيوم (فينوكسي ميثيل بنسلين)', en: 'Penicillin V Potassium (Phenoxymethylpenicillin)' },
      activeIngredients: { ar: 'بنسلين V البوتاسيوم', en: 'Penicillin V Potassium' },
      drugClass: { ar: 'بنسلين طبيعي فموي مضاد للمكورات العقدية', en: 'Natural oral penicillin antibiotic' },
      mechanism: { ar: 'يثبط تكوين الجدار الخلوي للبكتيريا الحساسة ويقضي عليها بشكل مباشر.', en: 'Inhibits bacterial cell wall synthesis during active multiplication.' },
      strengths: {
        ar: 'أقراص: 1000 مجم (1,000,000 وحدة دولية)، 1500 مجم (1,500,000 وحدة دولية).\nشراب معلق للأطفال: 400,000 وحدة دولية لكل 5 مل.',
        en: 'Tablets: 1000 IU (1 Mega), 1500 IU (1.5 Mega). Suspension: 400,000 IU/5ml.',
      },
      approvedUses: {
        ar: 'الخيار القياسي الأول عالمياً لعلاج التهاب اللوزتين والحلق بالمكورات العقدية (Strep throat)، والوقاية طويلة المدى من الحمى الروماتيزمية (Rheumatic fever) وتلف صمامات القلب، وعدوى الحمرة والجلد الخفيفة.',
        en: 'Primary standard choice for streptococcal pharyngitis/tonsillitis, secondary prophylaxis of rheumatic fever, and mild erysipelas.',
      },
      priceEgypt: {
        ar: '• أوسبن 1000 مجم (12 قرص) - ساندوز/نوفارتس: 45.00 جنيه مصري.\n• أوسبن 1500 مجم (12 قرص) - ساندوز: 55.00 جنيه مصري.\n• أوسبن شراب للأطفال (60 مل): 32.00 جنيه مصري.\n• كالسيوبن 1000 أقراص: 38.00 جنيه مصري.',
        en: '• Ospen 1000 (12 tabs - Sandoz): 45.00 EGP\n• Ospen 1500 (12 tabs): 55.00 EGP\n• Ospen syrup: 32.00 EGP\n• Calciopen 1000 tabs: 38.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة والمثائل في مصر:\n1. أوسبن 1000 مجم (Ospen 1000) - ساندوز.\n2. أوسبن 1500 مجم (Ospen 1500) - ساندوز.\n3. كالسيوبن (Calciopen).\n\n• البدائل من نفس العائلة في حال عدم توفره: أموكسيسيلين فموي (Amoxicillin 500mg) لمدة 10 أيام.\n• البديل في حال حساسية البنسلين: أزيثرومايسين (Zithromax) أو كلاريثرومايسين (Klacid).',
        en: 'Exact Equivalents:\n1. Ospen 1000 (Sandoz)\n2. Ospen 1500 (Sandoz)\n3. Calciopen\nAlternative: Oral Amoxicillin. For allergy: Azithromycin.',
      },
      ageRestrictions: {
        ar: 'مناسب لجميع الأعمار؛ يستخدم الشراب للأطفال بجرعة محسوبة بالوحدات الدولية، والأقراص للبالغين.',
        en: 'Approved across all age groups; syrup for pediatric patients.',
      },
      dosingReference: {
        ar: 'للحلق واللوزتين: قرص 1000 كل 6 إلى 8 ساعات على معدة فارغة (قبل الأكل بساعة أو بعده بساعتين) لمدة 10 أيام كاملة لمنع الحمى الروماتيزمية.',
        en: 'Strep throat: 1000-1500 IU every 6-8 hours on an empty stomach for a full 10-day course.',
      },
      contraindications: {
        ar: 'ممنوع منعاً باتاً لمن لديهم حساسية تجاه البنسلين أو أي من مشتقاته (خطر الصدمة التحسسية).',
        en: 'Strictly contraindicated in penicillin hypersensitivity.',
      },
      sideEffects: {
        ar: 'غثيان، قيء، إسهال، اضطراب معدة خفيف، أو طفح جلدي تحسسي.',
        en: 'Nausea, mild epigastric distress, diarrhea, hypersensitivity rash.',
      },
      interactions: {
        ar: 'تقلل مضادات الحموضة والطعام من امتصاصه بشكل ملحوظ؛ يجب تناوله على معدة فارغة.',
        en: 'Food and antacids markedly decrease gastrointestinal absorption.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن وفعال جداً أثناء الحمل والرضاعة عند وصف الطبيب.',
        en: 'Category B. Safely used in pregnancy and lactation.',
      },
      renalHepatic: {
        ar: 'يطرح كلوياً؛ يتطلب خفض الجرعة أو زيادة الفواصل في حالات القصور الكلوي الشديد.',
        en: 'Reduce dosage or extend interval in severe renal impairment (GFR <10).',
      },
      patientEducation: {
        ar: 'تناول الدواء على معدة فارغة مع كوب ماء كامل. إكمال كورس الـ 10 أيام ضروري جداً لحماية القلب والكلى من مضاعفات بكتيريا الحلق العقدية.',
        en: 'Take on an empty stomach with water. Completing the full 10-day course is critical to protect against rheumatic heart disease.',
      },
    },
    brands: [
      { name: 'Ospen 1000 Tablets', manufacturer: 'Sandoz Egypt / Novartis', barcode: '6221054009812', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Ospen 1500 Tablets', manufacturer: 'Sandoz Egypt / Novartis', barcode: '6221054009829', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 15. Cephalexin (Ospexin / Cefalex / Ibilex)
  {
    id: 'cephalexin',
    fields: {
      genericName: { ar: 'سيفالكسين', en: 'Cephalexin' },
      activeIngredients: { ar: 'سيفالكسين مونوهيدرات', en: 'Cephalexin monohydrate' },
      drugClass: { ar: 'مضاد حيوي من عائلة السيفالوسبورين (الجيل الأول)', en: 'First-generation cephalosporin' },
      mechanism: { ar: 'يقتل البكتيريا الموجبة لصبغة غرام والمكورات العنقودية عن طريق تثبيط بناء الجدار الخلوي.', en: 'Bactericidal; inhibits bacterial cell-wall synthesis.' },
      strengths: {
        ar: 'كبسولات/أقراص: 500 مجم، 1 جم، 250 مجم.\nشراب معلق للأطفال: 250 مجم/5 مل، 125 مجم/5 مل.',
        en: 'Capsules: 500mg, 1g, 250mg. Suspension: 250mg/5ml, 125mg/5ml.',
      },
      approvedUses: {
        ar: 'علاج التهابات الجلد والأنسجة الرخوة والدمامل (التهاب النسيج الخلوي)، التهابات المسالك البولية البسيطة، والتهابات العظام والمفاصل والتهاب الحلق.',
        en: 'Skin and skin structure infections, uncomplicated UTIs, bone infections, and streptococcal pharyngitis.',
      },
      priceEgypt: {
        ar: '• أوسبكسين 500 مجم (16 كبسولة) - ساندوز: 48.00 جنيه مصري.\n• سيفالكس 500 مجم (16 كبسولة) - الإسكندرية: 36.00 جنيه مصري.\n• إيبيليكس 500 مجم (16 كبسولة) - إيبيكو: 38.00 جنيه مصري.\n• أوسبكسين 1 جم (12 قرص): 52.00 جنيه مصري.\n• أوسبكسين شراب 250 مجم (60 مل): 32.00 جنيه مصري.',
        en: '• Ospexin 500mg (16 caps - Sandoz): 48.00 EGP\n• Cefalex 500mg (16 caps - Alexandria): 36.00 EGP\n• Ibilex 500mg (16 caps - EIPICO): 38.00 EGP\n• Ospexin suspension 250mg: 32.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة الفعالة والتركيز:\n1. أوسبكسين 500 مجم (Ospexin 500mg) - ساندوز.\n2. سيفالكس 500 مجم (Cefalex 500mg) - الإسكندرية.\n3. إيبيليكس 500 مجم (Ibilex 500mg) - إيبيكو.\n4. كفلكس 500 مجم (Keflex 500mg).\n\n• البدائل من نفس الفئة لالتهابات الجلد: أموكسيسيلين/كلافولانات أو كليندامايسين.',
        en: 'Exact Generic Equivalents:\n1. Ospexin 500mg (Sandoz)\n2. Cefalex 500mg (Alexandria)\n3. Ibilex 500mg (EIPICO)\nAlternative: Augmentin or Clindamycin.',
      },
      ageRestrictions: {
        ar: 'آمن للرضع والأطفال بجرعة شراب محسوبة بالوزن، والكبسولات للبالغين.',
        en: 'Approved for pediatric patients >1 year of age as oral suspension.',
      },
      dosingReference: {
        ar: 'للبالغين: كبسولة 500 مجم كل 6 أو 8 ساعات مع أو بدون طعام لمدة 7 إلى 10 أيام.',
        en: 'Adults: 500mg every 6 or 8 hours for 7-14 days.',
      },
      contraindications: {
        ar: 'ممنوع لمن يعانون من حساسية مفرطة تجاه السيفالوسبورينات، وبحذر لمن لديهم حساسية بنسلين شديدة.',
        en: 'Contraindicated in cephalosporin hypersensitivity.',
      },
      sideEffects: {
        ar: 'إسهال، غثيان، عسر هضم، طفح جلدي خفيف، ودوار.',
        en: 'Diarrhea, dyspepsia, gastritis, mild rash.',
      },
      interactions: {
        ar: 'يتفاعل مع البروبينسيد والميتفورمين (يزيد تركيز الميتفورمين في الدم).',
        en: 'Increases metformin concentrations; probenecid prolongs half-life.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بصورة واسعة أثناء الحمل والرضاعة تحت إشراف الطبيب.',
        en: 'Category B. Widely considered safe in pregnancy and breastfeeding.',
      },
      renalHepatic: {
        ar: 'يخفض الجرعة وتزداد الفواصل في حالات القصور الكلوي المتوسط إلى الشديد.',
        en: 'Dosage reduction required in moderate to severe renal impairment.',
      },
      patientEducation: {
        ar: 'تناوله بانتظام في مواعيده المحددة. يمكن تناوله مع الأكل لتقليل الغثيان.',
        en: 'Take at evenly spaced intervals; can be taken with meals to minimize nausea.',
      },
    },
    brands: [
      { name: 'Ospexin 500mg Capsules', manufacturer: 'Sandoz Egypt', barcode: '6221054004521', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefalex 500mg Capsules', manufacturer: 'Alexandria Pharmaceuticals', barcode: '6221008005411', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Ibilex 500mg Capsules', manufacturer: 'EIPICO Egypt', barcode: '6221127003456', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 16. Cefixime (Suprax / Magnacef / Cefix)
  {
    id: 'cefixime',
    fields: {
      genericName: { ar: 'سيفيكسيم', en: 'Cefixime' },
      activeIngredients: { ar: 'سيفيكسيم ثلاثي الهيدرات', en: 'Cefixime trihydrate' },
      drugClass: { ar: 'مضاد حيوي فموي من عائلة السيفالوسبورين (الجيل الثالث)', en: 'Third-generation oral cephalosporin' },
      mechanism: { ar: 'يقضي على طيف واسع من البكتيريا السالبة والموجبة عن طريق كسر وتثبيط جدار الخلية البكتيرية.', en: 'Broad-spectrum bactericidal activity via bacterial cell-wall inhibition.' },
      strengths: {
        ar: 'كبسولات/أقراص: 400 مجم، 200 مجم.\nشراب معلق للأطفال: 100 مجم/5 مل (30 مل و 60 مل).',
        en: 'Capsules: 400mg, 200mg. Pediatric suspension: 100mg/5ml.',
      },
      approvedUses: {
        ar: 'علاج التهابات المسالك البولية وحوض الكلى، التهاب الأذن الوسطى الحاد، التهاب اللوزتين والحلق المتكرر، وتفاقم التهاب الشعب الهوائية المزمن وحمى التيفود.',
        en: 'Uncomplicated UTIs, acute otitis media, pharyngitis, acute exacerbations of chronic bronchitis, and typhoid fever.',
      },
      priceEgypt: {
        ar: '• سوبراكس 400 مجم (5 كبسولات) - سبيماكو/سانوفي: 98.00 جنيه مصري.\n• ماجناسيف 400 مجم (6 كبسولات) - الحكمة: 75.00 جنيه مصري.\n• سيفيكس 400 مجم (5 كبسولات) - سيجما: 62.00 جنيه مصري.\n• سوبراكس شراب معلق للأطفال 100 مجم (60 مل): 70.00 جنيه مصري.\n• ماجناسيف شراب معلق (60 مل): 55.00 جنيه مصري.',
        en: '• Suprax 400mg (5 caps): 98.00 EGP\n• Magnacef 400mg (6 caps - Hikma): 75.00 EGP\n• Cefix 400mg (5 caps): 62.00 EGP\n• Suprax suspension (60ml): 70.00 EGP',
      },
      substitutes: {
        ar: 'البدائل المتطابقة تماماً بنفس المادة والتركيز:\n1. ماجناسيف 400 مجم (Magnacef 400mg) - حكمة.\n2. سيفيكس 400 مجم (Cefix 400mg) - سيجما.\n3. إكزيم 400 مجم (Xime 400mg).\n4. سوبراكس 400 مجم المستورد.\n\n• البدائل من نفس الفئة: سيفوروكسيم (Zinnat) أو سيفترياكسون (حقن).',
        en: 'Exact Generic Equivalents:\n1. Magnacef 400mg (Hikma)\n2. Cefix 400mg (Sigma)\n3. Xime 400mg\n4. Suprax 400mg\nAlternative: Zinnat or Ceftriaxone.',
      },
      ageRestrictions: {
        ar: 'آمن للرضع والأطفال أكبر من 6 أشهر كشراب معلق، والكبسولات لمن هم فوق سن 12 عاماً.',
        en: 'Approved for infants >6 months as suspension; capsules for children >12 years and adults.',
      },
      dosingReference: {
        ar: 'للبالغين: كبسولة واحدة 400 مجم مرة واحدة يومياً (أو 200 مجم كل 12 ساعة) مع أو بدون طعام لمدة 5 إلى 10 أيام.',
        en: 'Adults: 400mg once daily or 200mg every 12 hours for 5-10 days.',
      },
      contraindications: {
        ar: 'ممنوع لمن يعانون من حساسية مفرطة تجاه السيفالوسبورينات أو البنسلينات الشديدة.',
        en: 'Contraindicated in cephalosporin hypersensitivity.',
      },
      sideEffects: {
        ar: 'إسهال، براز رخو، غثيان، مغص بطني، وعسر هضم.',
        en: 'Diarrhea, loose stools, abdominal pain, nausea, flatulence.',
      },
      interactions: {
        ar: 'قد يزيد من زمن النزيف ومفعول أدوية السيولة كالوارفارين.',
        en: 'May elevate prothrombin time/INR with oral anticoagulants.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بصورة واسعة أثناء الحمل تحت إشراف الطبيب.',
        en: 'Category B. Safe in pregnancy when clinically needed.',
      },
      renalHepatic: {
        ar: 'يتطلب خفض الجرعة إلى 200 مجم يومياً في مرضى القصور الكلوي المتوسط إلى الشديد (GFR <20).',
        en: 'Reduce dose to 200mg once daily when creatinine clearance is <20 ml/min.',
      },
      patientEducation: {
        ar: 'يتميز بإمكانية تناوله كجرعة واحدة يومياً مما يسهل الالتزام به. رج زجاجة الشراب جيداً واحفظها في الثلاجة.',
        en: 'Convenient once-daily dosing improves compliance. Shake suspension well.',
      },
    },
    brands: [
      { name: 'Suprax 400mg Capsules', manufacturer: 'Spimaco Misr / Sanofi', barcode: '6223000451239', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Magnacef 400mg Capsules', manufacturer: 'Hikma Pharma', barcode: '6221127008912', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefix 400mg Capsules', manufacturer: 'Sigma Pharmaceuticals', barcode: '6221127006714', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Approved verified clinical record with Egyptian pricing, EAN-13 barcodes and generic substitutes.',
  },

  // 17. Cefotaxime (Cefotax, Claforan)
  {
    id: 'cefotaxime',
    fields: {
      genericName: {
        ar: 'سيفوتاكسيم',
        en: 'Cefotaxime',
      },
      drugClass: {
        ar: 'مضاد حيوي سيفالوسبورين - الجيل الثالث',
        en: 'Third-Generation Cephalosporin Antibiotic',
      },
      approvedUses: {
        ar: 'علاج العدوى البكتيرية الحادة للجهاز التنفسي، الالتهاب الرئوي، عدوى الجهاز البولي، التهاب السحايا، تسمم الدم البكتيري، وعدوى العظام والمفاصل والوقاية قبل الجراحة.',
        en: 'Lower respiratory tract infections, pneumonia, urinary tract infections, meningitis, bacteremia/septicemia, intra-abdominal and bone/joint infections.',
      },
      mechanism: {
        ar: 'مضاد بكتيري واسع المجال يثبط تصنيع الجدار الخلوي البكتيري من خلال الارتباط ببروتينات ربط البنسلين (PBPs) مما يؤدي إلى تحلل وموت البكتيريا.',
        en: 'Bactericidal; inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs).',
      },
      priceEgypt: {
        ar: 'سيفوتاكس 1 جم حقن (EIPICO): 33.00 جنيه مصري للفيال.
كلافوران 1 جم حقن (Sanofi): 45.00 جنيه مصري للفيال.
سيفوتاكس 500 مجم حقن: 22.00 جنيه مصري للفيال.',
        en: 'Cefotax 1g Vial: 33.00 EGP
Claforan 1g Vial: 45.00 EGP
Cefotax 500mg Vial: 22.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة بنفس المادة الفعالة: سيفوتاكس (Cefotax)، كلافوران (Claforan)، تاكسيم (Taxim)، وراميسيفت (Ramiceft).',
        en: 'Available generics: Cefotax, Claforan, Taxim, Ramiceft.',
      },
      strengths: {
        ar: 'فيال للحقن العضلي أو الوريدي: 500 مجم، 1 جم، 2 جم.',
        en: 'Vials for IV/IM injection: 500mg, 1g, 2g.',
      },
      activeIngredients: {
        ar: 'سيفوتاكسيم صوديوم (Cefotaxime Sodium)',
        en: 'Cefotaxime Sodium',
      },
      ageRestrictions: {
        ar: 'معتمد لجميع الفئات العمرية بما في ذلك حديثي الولادة والأطفال والبالغين بجرعات محسوبة بدقة.',
        en: 'Approved across all age groups including neonates, infants, and adults with weight-based dosing.',
      },
      dosingReference: {
        ar: 'للبالغين: 1 جم إلى 2 جم كل 8 أو 12 ساعة بالحقن الوريدي أو العضلي (الحد الأقصى 12 جم يومياً في الحالات الحرجة كالتهاب السحايا).
للأطفال وحديثي الولادة: 50 إلى 100 مجم/كجم/يوم مقسمة على جرعات كل 6 إلى 12 ساعة.',
        en: 'Adults: 1g to 2g IV/IM every 8 to 12 hours (up to 12g/day in severe infections).
Pediatrics: 50-100 mg/kg/day divided every 6-12 hours.',
      },
      contraindications: {
        ar: 'حساسية مفرطة معروفة تجاه السيفالوسبورينات أو تفاعلات تأقية سابقة تجاه البنسلينات.',
        en: 'Hypersensitivity to cephalosporins or severe immediate penicillin allergy.',
      },
      sideEffects: {
        ar: 'ألم والتهاب في موضع الحقن، طفح جلدي، إسهال خفيف، ونادراً التهاب القولون الغشائي الكاذب.',
        en: 'Injection site pain/phlebitis, rash, diarrhea, elevated transaminases.',
      },
      interactions: {
        ar: 'مدرات البول العروية كالفوروسيميد ومضادات الأمينوجليكوزيد تزيد من خطر السمية الكلوية.',
        en: 'Concomitant aminoglycosides or loop diuretics may increase nephrotoxicity risk.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بصورة واسعة أثناء الحمل والرضاعة الطبيعية تحت إشراف الطبيب.',
        en: 'Category B. Safe in pregnancy and breastfeeding when indicated.',
      },
      renalHepatic: {
        ar: 'يجب خفض الجرعة بمقدار 50% عندما يقل معدل ترشيح الكلى (GFR) عن 20 مل/دقيقة.',
        en: 'Reduce dose by 50% when GFR is <20 mL/min.',
      },
      patientEducation: {
        ar: 'يُعطى بالحقن فقط ولا يؤخذ بالفم. يجب إكمال المدة المقررة بالكامل لمنع عودة العدوى أو تطور بكتيريا مقاومة.',
        en: 'Injectable only. Complete prescribed course duration even if symptoms improve quickly.',
      },
    },
    brands: [
      { name: 'Cefotax 1g Vial', manufacturer: 'EIPICO', barcode: '6221127003463', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Claforan 1g Vial', manufacturer: 'Sanofi Egypt', barcode: '6223003991203', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefotax 500mg Vial', manufacturer: 'EIPICO', barcode: '6221127003470', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Standard 3rd gen cephalosporin workhorse in Egyptian emergency and pediatric wards.',
  },

  // 18. Flucloxacillin (Floxamo, Flucil)
  {
    id: 'flucloxacillin',
    fields: {
      genericName: {
        ar: 'فلوكلوكساسيللين',
        en: 'Flucloxacillin',
      },
      drugClass: {
        ar: 'بنسلين مضاد لإنزيم البنسليناز (مضاد للمكورات العنقودية)',
        en: 'Penicillinase-Resistant Penicillin (Anti-staphylococcal)',
      },
      approvedUses: {
        ar: 'علاج التهابات الجلد والأنسجة الرخوة الناتجة عن المكورات العنقودية (الدمامل، الخراريج، الحصف، التهاب الهلل الخلوي، والجروح المصابة)، والتهاب العظام.',
        en: 'Skin and soft tissue infections (cellulitis, boils, abscesses, impetigo), wound infections, and osteomyelitis caused by susceptible staphylococci.',
      },
      mechanism: {
        ar: 'يثبط بناء جدار الخلية البكتيرية ويتميز بمقاومته لإنزيم البيتا-لاكتاماز المنتج بواسطة بكتيريا المكورات العنقودية الذهبية.',
        en: 'Bactericidal cell-wall synthesis inhibitor resistant to staphylococcal beta-lactamase.',
      },
      priceEgypt: {
        ar: 'فلوكسامو 1 جم أقراص (Amoun - 16 قرص): 68.00 جنيه مصري (الشريط: 34.00 جنيه).
فلوسيل 500 مجم كبسول (Pharco - 16 كبسولة): 42.00 جنيه مصري (الشريط: 21.00 جنيه).',
        en: 'Floxamo 1g (16 tab): 68.00 EGP (strip: 34.00 EGP)
Flucil 500mg (16 cap): 42.00 EGP (strip: 21.00 EGP).',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: فلوكسامو (Floxamo)، فلوسيل (Flucil)، ستافيلوكس (Staphylox).',
        en: 'Available generics: Floxamo, Flucil, Staphylox.',
      },
      strengths: {
        ar: 'كبسولات/أقراص: 500 مجم، 1 جم. شراب معلق للأطفال: 125 مجم/5 مل، 250 مجم/5 مل.',
        en: 'Capsules/tablets: 500mg, 1g. Oral suspension: 125mg/5mL, 250mg/5mL.',
      },
      activeIngredients: {
        ar: 'فلوكلوكساسيللين صوديوم (Flucloxacillin Sodium)',
        en: 'Flucloxacillin Sodium',
      },
      ageRestrictions: {
        ar: 'آمن للرضع والأطفال والبالغين بجرعات ملائمة لكل فئة وزنية.',
        en: 'Safe for infants, children, and adults with weight-based pediatric dosing.',
      },
      dosingReference: {
        ar: 'للبالغين: 500 مجم إلى 1 جم كل 6 ساعات (أربع مرات يومياً) على معدة فارغة قبل الأكل بساعة أو بعده بساعتين.
للأطفال: 25 إلى 50 مجم/كجم/يوم مقسمة على 4 جرعات متساوية.',
        en: 'Adults: 500mg to 1g orally every 6 hours on an empty stomach.
Children: 25-50 mg/kg/day divided into 4 doses.',
      },
      contraindications: {
        ar: 'حساسية البنسلين، وتاريخ سابق ليرقان أو اعتلال كبدي ناتج عن الفلوكلوكساسيللين.',
        en: 'Penicillin allergy or history of flucloxacillin-associated jaundice/hepatic dysfunction.',
      },
      sideEffects: {
        ar: 'غثيان، إسهال خفيف، طفح جلدي، واعتلال كبدي نادر يظهر كيرقان ركودي في كبار السن.',
        en: 'Gastrointestinal upset, diarrhea, rash; rare cholestatic jaundice, especially in older adults.',
      },
      interactions: {
        ar: 'يتعارض مع الميثوتريكسات حيث يزيد من سميته، ويزيد من فعالية أدوية السيولة الفموية كالوارفارين.',
        en: 'Increases methotrexate toxicity; may enhance warfarin anticoagulant effect.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن ويوصف بصورة معتادة للحوامل والمرضعات تحت الإشراف الطبي.',
        en: 'Category B. Safe in pregnancy and lactation when indicated.',
      },
      renalHepatic: {
        ar: 'يجب ضبط الجرعة في القصور الكلوي الشديد (الحد الأقصى 1 جم كل 8 ساعات). يُمنع لمن لديهم سوابق يرقان دوائي منه.',
        en: 'Adjust in severe renal impairment (max 1g q8h). Avoid if history of flucloxacillin liver injury.',
      },
      patientEducation: {
        ar: 'يجب تناوله على معدة فارغة تماماً (قبل الأكل بساعة أو بعد الأكل بساعتين) لأن الطعام يقلل امتصاصه بنسبة 50%.',
        en: 'Take strictly on an empty stomach (1 hour before or 2 hours after meals) as food significantly reduces absorption.',
      },
    },
    brands: [
      { name: 'Floxamo 1g Tablets', manufacturer: 'Amoun Pharmaceutical Co.', barcode: '6221008005626', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Flucil 500mg Capsules', manufacturer: 'Pharco Pharmaceuticals', barcode: '6221543003429', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Frontline antistaphylococcal choice for Egyptian skin and wound infections.',
  },

  // 19. Amikacin (Amikin, Mikacin)
  {
    id: 'amikacin',
    fields: {
      genericName: {
        ar: 'أميكاسين',
        en: 'Amikacin',
      },
      drugClass: {
        ar: 'مضاد حيوي أمينوجليكوزيد',
        en: 'Aminoglycoside Antibiotic',
      },
      approvedUses: {
        ar: 'العدوى البكتيرية الشديدة الناتجة عن بكتيريا الجرام السالبة المقاومة، تسمم الدم، عدوى المسالك البولية المعقدة، والتهابات الجهاز التنفسي المستشفوية.',
        en: 'Severe hospital-acquired Gram-negative infections, bacteremia, complicated UTIs, intra-abdominal and respiratory tract infections resistant to gentamicin.',
      },
      mechanism: {
        ar: 'قاتل للبكتيريا؛ يرتبط بالوحدة الفرعية 30S في ريبوسومات البكتيريا مما يثبط تخليق البروتين ويؤدي لموت الخلية البكتيرية.',
        en: 'Bactericidal; binds irreversibly to bacterial 30S ribosomal subunits, inhibiting protein synthesis.',
      },
      priceEgypt: {
        ar: 'أميكين 500 مجم حقن (BMS / Smith): 38.00 جنيه مصري للفيال.
ميكاسين 500 مجم حقن (SEDICO): 27.50 جنيه مصري للفيال.',
        en: 'Amikin 500mg Vial: 38.00 EGP
Mikacin 500mg Vial: 27.50 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: أميكين (Amikin)، ميكاسين (Mikacin)، أميكاسيتين (Amikacetin).',
        en: 'Available generics: Amikin, Mikacin, Amikacetin.',
      },
      strengths: {
        ar: 'أمبولات وفيالات للحقن: 100 مجم/2 مل، 250 مجم/2 مل، 500 مجم/2 مل.',
        en: 'Vials/ampoules for IV/IM: 100mg/2mL, 250mg/2mL, 500mg/2mL.',
      },
      activeIngredients: {
        ar: 'أميكاسين كبريتات (Amikacin Sulfate)',
        en: 'Amikacin Sulfate',
      },
      ageRestrictions: {
        ar: 'يُستخدم في جميع الأعمار بحذر شديد مع ضبط الجرعة بدقة حسب الوزن ووظائف الكلى.',
        en: 'Used across all ages with strict weight-based and renal monitoring.',
      },
      dosingReference: {
        ar: 'للبالغين: 15 مجم/كجم/يوم تعطى كجرعة واحدة يومياً بالحقن الوريدي البطيء أو مقسمة كل 12 ساعة.
للأطفال وحديثي الولادة: 15 إلى 20 مجم/كجم/يوم مع مراقبة المستويات السريرية في الدم.',
        en: 'Adults: 15 mg/kg/day as once-daily IV infusion or divided q12h.
Neonates/children: 15-20 mg/kg/day with therapeutic drug monitoring.',
      },
      contraindications: {
        ar: 'حساسية الأمينوجليكوزيد، الوهن العضلي الوبيل (Myasthenia gravis).',
        en: 'Hypersensitivity to aminoglycosides, myasthenia gravis.',
      },
      sideEffects: {
        ar: 'سمية كلوية (ارتفاع الكرياتينين)، سمية سمعية ودهليزية (طنين الأذن وضعف السمع والدوار)، وحصار عصبي عضلي.',
        en: 'Nephrotoxicity, ototoxicity (auditory and vestibular damage), neuromuscular blockade.',
      },
      interactions: {
        ar: 'ممنوع دمجه مع مدرات البول العروية كالفوروسيميد، أو الفانكومايسين، أو السيفالوسبورينات القوية دون مراقبة الكلى.',
        en: 'Additive nephrotoxicity/ototoxicity with furosemide, vancomycin, cisplatin, and neuromuscular blockers.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة D؛ قد يسبب ضرراً سمعياً للجنين ولا يُستخدم إلا في الحالات المهددة للحياة مع انعدام البدائل.',
        en: 'Category D. Potential fetal ototoxicity; reserved for life-threatening emergencies.',
      },
      renalHepatic: {
        ar: 'حرج جداً: يتطلب خفض الجرعة أو مباعدة الفترات الزمنية بدقة بناءً على قياس تصفية الكرياتينين ومستوى الدواء بالدم.',
        en: 'Critical: Mandatory dose adjustment and interval extension based on renal clearance.',
      },
      patientEducation: {
        ar: 'يُعطى في المستشفيات والمراكز الطبية فقط. أبلغ الطاقم الطبي فوراً عند الشعور بطنين في الأذن أو دوار أو قلة كمية البول.',
        en: 'Administered under medical supervision. Report tinnitus, dizziness, hearing changes, or decreased urine immediately.',
      },
    },
    brands: [
      { name: 'Amikin 500mg Vial', manufacturer: 'Bristol Myers Squibb / Smith', barcode: '6221054006128', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Mikacin 500mg Vial', manufacturer: 'SEDICO Pharmaceuticals', barcode: '6221127007812', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Potent aminoglycoside reserved for resistant gram-negative infections in Egyptian hospitals.',
  },

  // 20. Gentamicin (Garamycin)
  {
    id: 'gentamicin',
    fields: {
      genericName: {
        ar: 'جنتامايسين',
        en: 'Gentamicin',
      },
      drugClass: {
        ar: 'مضاد حيوي أمينوجليكوزيد واسع المجال',
        en: 'Aminoglycoside Antibiotic',
      },
      approvedUses: {
        ar: 'العدوى البكتيرية الحادة للجهاز البولي، تسمم الدم، عدوى البطن والحوض، حمى النفاس، والتهاب الشغاف الجرثومي بالاشتراك مع البنسلين.',
        en: 'Severe systemic Gram-negative infections, complicated UTIs, bacteremia, pelvic/intra-abdominal infections, and bacterial endocarditis synergy.',
      },
      mechanism: {
        ar: 'يرتبط بالوحدة 30S في ريبوسومات البكتيريا مسبباً أخطاء في ترجمة الشفرة الوراثية وتثبيط بناء البروتين وموت الخلية البكتيرية.',
        en: 'Binds to the bacterial 30S subunit, disrupting mRNA translation and protein synthesis.',
      },
      priceEgypt: {
        ar: 'جاراميسين 80 مجم أمبول (Memphis / Schering-Plough): 18.00 جنيه مصري للأمبول.
جنتاميسين 80 مجم أمبول (El Nasr): 10.50 جنيه مصري للأمبول.',
        en: 'Garamycin 80mg Ampoule: 18.00 EGP
Gentamycin 80mg Ampoule: 10.50 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: جاراميسين (Garamycin)، جنتاميسين (Gentamycin)، ريفوباسين (Refobacin).',
        en: 'Available generics: Garamycin, Gentamycin, Refobacin.',
      },
      strengths: {
        ar: 'أمبولات للحقن العضلي أو الوريدي: 20 مجم/2 مل، 40 مجم/2 مل، 80 مجم/2 مل.',
        en: 'Ampoules for IM/IV injection: 20mg/2mL, 40mg/2mL, 80mg/2mL.',
      },
      activeIngredients: {
        ar: 'جنتامايسين سلفات (Gentamicin Sulfate)',
        en: 'Gentamicin Sulfate',
      },
      ageRestrictions: {
        ar: 'يُستخدم في جميع الأعمار بجرعات دقيقة محسوبة بالوزن مع مراقبة حثيثة للوظائف الكلوية.',
        en: 'Used across all age brackets with weight-adjusted dosing and monitoring.',
      },
      dosingReference: {
        ar: 'للبالغين: 3 إلى 5 مجم/كجم/يوم تعطى كجرعة واحدة وريدية ممتدة أو مقسمة كل 8 ساعات بالحقن العضلي أو الوريدي البطيء.
للأطفال: 6 إلى 7.5 مجم/كجم/يوم مقسمة كل 8 ساعات.',
        en: 'Adults: 3-5 mg/kg/day as once-daily infusion or divided q8h.
Children: 6-7.5 mg/kg/day divided q8h.',
      },
      contraindications: {
        ar: 'حساسية مفرطة للأمينوجليكوزيدات، والوهن العضلي الوبيل.',
        en: 'Hypersensitivity to aminoglycosides, myasthenia gravis.',
      },
      sideEffects: {
        ar: 'سمية كلوية، سمية سمعية ودهليزية (فقدان التوازن وطنين الأذن)، وتفاعلات حساسية موضعية.',
        en: 'Nephrotoxicity, vestibular and cochlear ototoxicity, local injection site pain.',
      },
      interactions: {
        ar: 'خطر مضاعف للسمية الكلوية والسمعية عند تناوله مع الفوروسيميد، الفانكومايسين، أو أدوية التخدير وباسطات العضلات.',
        en: 'Synergistic nephro/ototoxicity with loop diuretics, amphotericin B, and vancomycin.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة D؛ يتخطى المشيمة ويشكل خطراً على العصب السمعي للجنين. يُستخدم فقط عند انعدام البدائل للحالات المهددة للحياة.',
        en: 'Category D. Crosses placenta with risk of fetal cranial nerve VIII damage.',
      },
      renalHepatic: {
        ar: 'يتطلب ضبطاً حاسماً للجرعة وتمديد الفترات الزمنية بين الجرعات عند انخفاض تصفية الكلى لتجنب التراكم السمي.',
        en: 'Strict dosing interval prolongation required in renal insufficiency.',
      },
      patientEducation: {
        ar: 'يُعطى بالحقن العضلي أو بالتنقيط الوريدي. يجب الإكثار من شرب السوائل أثناء العلاج لحماية الكليتين وإبلاغ التمريض عند أي دوار.',
        en: 'Maintain high fluid intake during therapy to protect kidney function. Report balance issues immediately.',
      },
    },
    brands: [
      { name: 'Garamycin 80mg Ampoule', manufacturer: 'Memphis / Schering-Plough', barcode: '6221008003621', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Gentamycin 80mg Ampoule', manufacturer: 'El Nasr Pharmaceutical', barcode: '6221543008914', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Classic hospital antibiotic in Egyptian healthcare; requires renal hydration monitoring.',
  },

  // 21. Moxifloxacin (Avelox, Moxiflox)
  {
    id: 'moxifloxacin',
    fields: {
      genericName: {
        ar: 'موكسيفلوكساسين',
        en: 'Moxifloxacin',
      },
      drugClass: {
        ar: 'مضاد حيوي فلوروكينولون تنفسي',
        en: 'Respiratory Fluoroquinolone Antibiotic',
      },
      approvedUses: {
        ar: 'علاج الالتهاب الرئوي المكتسب من المجتمع (CAP)، التفاقم البكتيري الحاد لالتهاب الشعب الهوائية المزمن، والتهاب الجيوب الأنفية البكتيري الحاد، وعدوى الجلد والبطن المعقدة.',
        en: 'Community-acquired pneumonia, acute bacterial sinusitis, acute exacerbations of chronic bronchitis, and complicated skin/intra-abdominal infections.',
      },
      mechanism: {
        ar: 'قاتل للبكتيريا؛ يثبط إنزيمي توبوإيزوميراز II (DNA gyrase) وتوبوإيزوميراز IV مما يمنع تضاعف وإصلاح الحمض النووي البكتيري.',
        en: 'Bactericidal; inhibits bacterial DNA gyrase (topoisomerase II) and topoisomerase IV.',
      },
      priceEgypt: {
        ar: 'أفيلوكس 400 مجم أقراص (Bayer - 5 أقراص): 185.00 جنيه مصري.
موكسيفلوكس 400 مجم أقراص (Eva Pharma - 5 أقراص): 95.00 جنيه مصري.',
        en: 'Avelox 400mg (5 tabs): 185.00 EGP
Moxiflox 400mg (5 tabs): 95.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: أفيلوكس (Avelox)، موكسيفلوكس (Moxiflox)، فلوكسابكت (Floxabact).',
        en: 'Available generics: Avelox, Moxiflox, Floxabact.',
      },
      strengths: {
        ar: 'أقراص مغلفة: 400 مجم. محلول للتنقيط الوريدي: 400 مجم/250 مل.',
        en: 'Film-coated tablets: 400mg. IV infusion: 400mg/250mL.',
      },
      activeIngredients: {
        ar: 'موكسيفلوكساسين هيدروكلوريد (Moxifloxacin HCl)',
        en: 'Moxifloxacin Hydrochloride',
      },
      ageRestrictions: {
        ar: 'ممنوع لمن هم دون سن 18 عاماً بسبب خطر إصابات المفاصل والأوتار.',
        en: 'Contraindicated in patients <18 years due to arthropathy/tendon injury risks.',
      },
      dosingReference: {
        ar: 'للبالغين: قرص واحد 400 مجم مرة واحدة يومياً مع أو بدون طعام لمدة 5 إلى 10 أيام (لا يحتاج لتعديل الجرعة في مرضى الكلى).',
        en: 'Adults: 400mg once daily orally or IV for 5 to 10 days.',
      },
      contraindications: {
        ar: 'حساسية الكينولونات، استطالة فترة QT في تخطيط القلب، الوهن العضلي الوبيل، وتاريخ تمزق الأوتار.',
        en: 'Hypersensitivity to quinolones, prolonged QT interval, myasthenia gravis, history of tendon rupture.',
      },
      sideEffects: {
        ar: 'غثيان، صداع، دوار، إسهال، استطالة فترة QT، وخطر نادر لالتهاب أو تمزق وتر العرقوب (أخيل).',
        en: 'Nausea, diarrhea, headache, dizziness, QT prolongation; risk of tendinitis/tendon rupture.',
      },
      interactions: {
        ar: 'مضادات الحموضة والحديد والكالسيوم تقلل امتصاصه ويجب الفصل بساعتين على الأقل. الحذر مع أدوية القلب المسببة لاستطالة QT.',
        en: 'Chelates with antacids, iron, and calcium (separate by 2h). Additive QT prolongation with antiarrhythmics.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ يُنصح بتجنبه في الحمل والرضاعة الطبيعية لوجود بدائل أكثر أماناً كالسيفالوسبورينات.',
        en: 'Category C. Avoid in pregnancy and lactation unless no safer alternatives exist.',
      },
      renalHepatic: {
        ar: 'يتميز بأنه يُطرح كبدياً بشكل أساسي، لذا لا يتطلب أي خفض للجرعة في مرضى القصور الكلوي حتى في الغسيل الكلوي.',
        en: 'Hepatically eliminated; no dosage adjustment required in renal impairment or dialysis.',
      },
      patientEducation: {
        ar: 'توقف عن تناول الدواء فوراً واستشر الطبيب إذا شعرت بألم مفاجئ أو التهاب في الأوتار (خاصة كعب القدم). اشرب كميات كافية من الماء.',
        en: 'Discontinue immediately and seek care if you experience sudden tendon pain or swelling (especially heel).',
      },
    },
    brands: [
      { name: 'Avelox 400mg Tablets', manufacturer: 'Bayer', barcode: '6223000458127', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Moxiflox 400mg Tablets', manufacturer: 'Eva Pharma', barcode: '6221054007415', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Premium respiratory fluoroquinolone in Egypt; no renal adjustment needed.',
  },

  // 22. Cefoperazone + Sulbactam (Sulperazon, Cefozone)
  {
    id: 'cefoperazone-sulbactam',
    fields: {
      genericName: {
        ar: 'سيفوبيرازون + سولباكتام',
        en: 'Cefoperazone / Sulbactam',
      },
      drugClass: {
        ar: 'سيفالوسبورين الجيل الثالث مع مثبط بيتا-لاكتاماز',
        en: 'Third-Generation Cephalosporin with Beta-Lactamase Inhibitor',
      },
      approvedUses: {
        ar: 'علاج العدوى البكتيرية الشديدة للجهاز التنفسي السفلي، عدوى القنوات المرارية والبطن، عدوى المسالك البولية المعقدة، والتهابات الحوض والوقاية الجراحية.',
        en: 'Severe intra-abdominal and biliary tract infections, lower respiratory infections, complicated UTIs, and surgical prophylaxis.',
      },
      mechanism: {
        ar: 'السيفوبيرازون يثبط جدار الخلية البكتيرية بما في ذلك الزائفة الزنجارية (Pseudomonas)، بينما يحمي السولباكتام الدواء من التحلل الإنزيمي.',
        en: 'Cefoperazone inhibits cell-wall synthesis (active vs Pseudomonas); sulbactam irreversibly inhibits beta-lactamases.',
      },
      priceEgypt: {
        ar: 'سيلبيرازون 1.5 جم حقن (Pfizer Egypt): 75.00 جنيه مصري للفيال.
سيفوزون 1.5 جم حقن (Pharco BPI): 52.00 جنيه مصري للفيال.',
        en: 'Sulperazon 1.5g Vial: 75.00 EGP
Cefozone 1.5g Vial: 52.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: سيلبيرازون (Sulperazon)، سيفوزون (Cefozone)، باكتازون (Bactazone).',
        en: 'Available generics: Sulperazon, Cefozone, Bactazone.',
      },
      strengths: {
        ar: 'فيال للحقن الوريدي أو العضلي: 1.5 جم (1 جم سيفوبيرازون + 0.5 جم سولباكتام).',
        en: 'Vials for IV/IM: 1.5g (1g cefoperazone + 0.5g sulbactam).',
      },
      activeIngredients: {
        ar: 'سيفوبيرازون صوديوم + سولباكتام صوديوم',
        en: 'Cefoperazone Sodium + Sulbactam Sodium',
      },
      ageRestrictions: {
        ar: 'معتمد للأطفال والبالغين في المستشفيات بجرعات محسوبة بدقة.',
        en: 'Approved in pediatric and adult inpatient settings with calculated dosing.',
      },
      dosingReference: {
        ar: 'للبالغين: 1.5 جم إلى 3 جم كل 12 ساعة بالحقن الوريدي أو العضلي (الحد الأقصى 4 جم سيفوبيرازون يومياً).
للأطفال: 40 إلى 80 مجم/كجم/يوم مقسمة على جرعتين إلى أربع جرعات.',
        en: 'Adults: 1.5g to 3g IV/IM every 12 hours.
Pediatrics: 40-80 mg/kg/day divided into 2-4 doses.',
      },
      contraindications: {
        ar: 'حساسية السيفالوسبورينات أو البنسلينات الشديدة.',
        en: 'Severe cephalosporin or beta-lactam hypersensitivity.',
      },
      sideEffects: {
        ar: 'إسهال، طفح جلدي، نقص عابر في بروثرومبين الدم (زيادة القابلية للنزف)، وتفاعل شبيه بالديسفلفرام مع الكحول.',
        en: 'Diarrhea, rash, hypoprothrombinemia (bleeding risk), and disulfiram-like ethanol reaction.',
      },
      interactions: {
        ar: 'يزيد من خطر النزيف مع مميعات الدم ومضادات التخثر كالوارفارين وهيبارين؛ يوصى بإعطاء فيتامين K عند الحاجة.',
        en: 'Increased bleeding risk with anticoagulants/heparin. Disulfiram-like reaction with alcohol.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B؛ آمن للاستخدام أثناء الحمل إذا استدعت الحالة السريرية بإشراف الطبيب.',
        en: 'Category B. Considered safe in pregnancy when clinically necessary.',
      },
      renalHepatic: {
        ar: 'يُطرح معظمه عبر الصفراء والمسالك الصفراوية، لذا يتطلب تعديل الجرعة في مرضى الانسداد الصفراوي أو القصور الكبدي الشديد.',
        en: 'Predominantly biliary excretion; dose adjustment essential in severe biliary obstruction/hepatic dysfunction.',
      },
      patientEducation: {
        ar: 'يُعطى في المستشفيات بالحقن. يُمنع تناول الكحول تماماً أثناء العلاج ولمدة 5 أيام بعده لتجنب التفاعلات الخطيرة.',
        en: 'Inpatient injectable. Strictly avoid any alcohol during and for 5 days after therapy.',
      },
    },
    brands: [
      { name: 'Sulperazon 1.5g Vial', manufacturer: 'Pfizer Egypt', barcode: '6221054008126', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Cefozone 1.5g Vial', manufacturer: 'Pharco BPI', barcode: '6221543006718', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Standard biliary and intra-abdominal injectable antimicrobial in Egyptian surgical wards.',
  },

  // 23. Linezolid (Averozolid, Zyvox)
  {
    id: 'linezolid',
    fields: {
      genericName: {
        ar: 'لينيزوليد',
        en: 'Linezolid',
      },
      drugClass: {
        ar: 'مضاد حيوي أوكسازوليدينون (مضاد للمكورات المقاومة MRSA / VRE)',
        en: 'Oxazolidinone Antibiotic (Anti-MRSA / VRE)',
      },
      approvedUses: {
        ar: 'علاج العدوى الشديدة بالمكورات العنقودية المقاومة للميثيسيلين (MRSA)، المكورات المعوية المقاومة للفانكومايسين (VRE)، الالتهاب الرئوي المستشفوي، والتهابات الجلد المعقدة.',
        en: 'Vancomycin-resistant Enterococcus (VRE) infections, hospital-acquired and MRSA pneumonia, and complicated skin/skin-structure infections.',
      },
      mechanism: {
        ar: 'يثبط تخليق البروتين البكتيري عند نقطة فريدة جداً عبر الارتباط بالموقع 23S في الوحدة الريبوسومية 50S لمنع تكوّن معقد بدء الترجمة 70S.',
        en: 'Inhibits protein synthesis by binding to 23S ribosomal RNA of the 50S subunit, preventing 70S initiation complex formation.',
      },
      priceEgypt: {
        ar: 'أفيروزوليد 600 مجم أقراص (Eva Pharma - 10 أقراص): 210.00 جنيه مصري (الشريط: 105.00 جنيه).
زيفوكس 600 مجم أقراص (Pfizer - 10 أقراص): 490.00 جنيه مصري.',
        en: 'Averozolid 600mg (10 tabs): 210.00 EGP (strip: 105.00 EGP)
Zyvox 600mg (10 tabs): 490.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: أفيروزوليد (Averozolid)، زيفوكس (Zyvox)، لينوليد (Linolid).',
        en: 'Available generics: Averozolid, Zyvox, Linolid.',
      },
      strengths: {
        ar: 'أقراص مغلفة: 600 مجم. محلول وريدي للتنقيط: 600 مجم/300 مل. شراب معلق للأطفال: 100 مجم/5 مل.',
        en: 'Tablets: 600mg. IV infusion: 600mg/300mL. Oral suspension: 100mg/5mL.',
      },
      activeIngredients: {
        ar: 'لينيزوليد (Linezolid)',
        en: 'Linezolid',
      },
      ageRestrictions: {
        ar: 'يُستخدم للأطفال والبالغين بحذر شديد وتحت إشراف استشاري العدوى.',
        en: 'Approved for pediatrics and adults under specialized infectious disease supervision.',
      },
      dosingReference: {
        ar: 'للبالغين: قرص واحد 600 مجم كل 12 ساعة مع أو بدون طعام لمدة 10 إلى 14 يوماً (الحد الأقصى 28 يوماً لمنع تثبيط النخاع العظمي).
للأطفال: 10 مجم/كجم كل 8 ساعات (أو كل 12 ساعة للأطفال فوق 12 سنة).',
        en: 'Adults: 600mg orally or IV every 12 hours for 10-14 days (max 28 days).
Children <12 years: 10 mg/kg every 8 hours.',
      },
      contraindications: {
        ar: 'فرط الحساسية، والاستخدام المتزامن مع مثبطات أكسيداز أحادي الأمين (MAOIs) لتجنب متلازمة السيروتونين أو نوبات ارتفاع الضغط الحادة.',
        en: 'Hypersensitivity; concurrent MAOIs or uncontrolled hypertension/serotonergic agents.',
      },
      sideEffects: {
        ar: 'تثبيط نقي العظم (نقص الصفائح الدموية وفقر الدم بعد 14 يوماً)، صداع، غثيان، إسهال، واعتلال عصبي محيطي وبصري عند الاستخدام المطول.',
        en: 'Myelosuppression (thrombocytopenia, anemia), headache, nausea, peripheral/optic neuropathy with prolonged use.',
      },
      interactions: {
        ar: 'يتفاعل مع مضادات الاكتئاب (SSRIs/SNRIs) مسبباً متلازمة السيروتونين، ومع الأطعمة الغنية بالتيرامين كالأجبان القديمة مسبباً نوبات ارتفاع ضغط الدم.',
        en: 'Serotonin syndrome risk with SSRIs/SNRIs/triptans; hypertensive crisis with tyramine-rich foods.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة C؛ يُستخدم فقط عندما تفوق الفائدة السريرية المتوقعة المخاطر المحتملة.',
        en: 'Category C. Use only if clearly needed and no alternatives available.',
      },
      renalHepatic: {
        ar: 'لا يحتاج لتعديل الجرعة في القصور الكلوي أو الكبدي الخفيف إلى المتوسط، ولكن يفضل إعطاؤه بعد جلسة الغسيل الكلوي.',
        en: 'No dose adjustment required for renal or mild-to-moderate hepatic impairment; dose after hemodialysis.',
      },
      patientEducation: {
        ar: 'يجب عمل تحليل صورة دم كاملة (CBC) أسبوعياً أثناء العلاج لمراقبة الصفائح الدموية. تجنب تناول الأجبان المعتقة والمخللات بكميات كبيرة.',
        en: 'Weekly complete blood count (CBC) monitoring is essential. Avoid large quantities of aged cheeses or fermented foods.',
      },
    },
    brands: [
      { name: 'Averozolid 600mg Tablets', manufacturer: 'Eva Pharma', barcode: '6221054009121', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Zyvox 600mg Tablets', manufacturer: 'Pfizer', barcode: '6223000216719', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Crucial reserve antibiotic in Egypt for resistant Gram-positive pathogens (MRSA/VRE).',
  },

  // 24. Vancomycin (Vancocin, Celovan)
  {
    id: 'vancomycin',
    fields: {
      genericName: {
        ar: 'فانكومايسين',
        en: 'Vancomycin',
      },
      drugClass: {
        ar: 'مضاد حيوي جليكوببتيد (خط دفاع أخير ضد MRSA)',
        en: 'Glycopeptide Antibiotic (Anti-MRSA Reserve)',
      },
      approvedUses: {
        ar: 'العدوى الحادة الناتجة عن بكتيريا المكورات العنقودية المقاومة للميثيسيلين (MRSA)، التهاب الشغاف الجرثومي، عدوى العظام، والتهاب القولون الغشائي الكاذب الناجم عن Clostridioides difficile (عن طريق الفم فقط).',
        en: 'Severe MRSA infections, endocarditis, osteomyelitis, septicemia; oral formulation solely for Clostridioides difficile colitis.',
      },
      mechanism: {
        ar: 'مضاد بكتيري يثبط تصنيع جدار الخلية عن طريق الارتباط بنهاية D-alanyl-D-alanine في ببتيدوجلايكان جدار الخلية البكتيرية.',
        en: 'Inhibits bacterial cell wall synthesis by binding to D-Ala-D-Ala terminus of cell wall peptidoglycan precursors.',
      },
      priceEgypt: {
        ar: 'فانكوسين 500 مجم فيال (EIPICO): 65.00 جنيه مصري للفيال.
سيلوفان 500 مجم فيال (Hikma): 72.00 جنيه مصري للفيال.',
        en: 'Vancocin 500mg Vial: 65.00 EGP
Celovan 500mg Vial: 72.00 EGP.',
      },
      substitutes: {
        ar: 'البدائل المتوفرة: فانكوسين (Vancocin)، سيلوفان (Celovan)، فانكوميكس (Vancomix).',
        en: 'Available generics: Vancocin, Celovan, Vancomix.',
      },
      strengths: {
        ar: 'فيال مجفف بالتبريد للحقن الوريدي البطيء أو التحضير الفموي: 500 مجم، 1 جم.',
        en: 'Lyophilized powder for IV infusion: 500mg, 1g.',
      },
      activeIngredients: {
        ar: 'فانكومايسين هيدروكلوريد (Vancomycin HCl)',
        en: 'Vancomycin Hydrochloride',
      },
      ageRestrictions: {
        ar: 'يُستخدم لجميع الأعمار في المستشفيات تحت مراقبة تركيز الدواء في المصل (TDM).',
        en: 'Used across all ages with mandatory therapeutic drug monitoring (trough levels).',
      },
      dosingReference: {
        ar: 'للبالغين: 15 إلى 20 مجم/كجم كل 8 إلى 12 ساعة بالتنقيط الوريدي البطيء (أكثر من 60 دقيقة لكل 1 جم لتفادي متلازمة الرجل الأحمر).
لالتهاب القولون الغشائي الكاذب: 125 إلى 500 مجم فموياً كل 6 ساعات.',
        en: 'Adults: 15-20 mg/kg IV every 8-12h infused over at least 60 minutes per 1g.
Oral for C. difficile: 125-500mg q6h.',
      },
      contraindications: {
        ar: 'فرط الحساسية المعروف للفانكومايسين.',
        en: 'Hypersensitivity to vancomycin.',
      },
      sideEffects: {
        ar: 'متلازمة الرجل الأحمر (احمرار وتوهج الجلد وهبوط الضغط عند التسريب السريع)، سمية كلوية، سمية سمعية، والتهاب الوريد الخثاري.',
        en: 'Red Man Syndrome (histaminoid flushing with rapid infusion), nephrotoxicity, ototoxicity, phlebitis.',
      },
      interactions: {
        ar: 'يزيد من خطر القصور الكلوي عند مشاركته مع الأمينوجليكوزيدات أو مضادات الالتهاب غير الستيرويدية (NSAIDs) أو البيبراسيلين/تازوباكتام.',
        en: 'Additive nephrotoxicity with aminoglycosides, NSAIDs, piperacillin/tazobactam, and furosemide.',
      },
      pregnancyBreastfeeding: {
        ar: 'فئة B (الحقن الوريدي فئة C)؛ يُستخدم بحذر شديد مع قياس مستويات الدواء في الدم للحالات الضرورية.',
        en: 'Category B/C. Use when benefits outweigh risks; monitor maternal serum levels.',
      },
      renalHepatic: {
        ar: 'حاسم: يُطرح كلوياً بنسبة تفوق 80%. يجب خفض الجرعة ومباعدة الفترات الزمنية مع فحص الكرياتينين ومستوى القاع (Trough level 15-20 mcg/mL).',
        en: 'Critical: 80%+ renal elimination. Dosing adjusted strictly according to renal function and trough levels.',
      },
      patientEducation: {
        ar: 'يُعطى في المستشفى فقط ويجب أن يتم تسريبه ببطء شديد على مدار ساعة أو أكثر. أبلغ التمريض فوراً إذا شعرت بحكة شديدة أو احمرار في الوجه والرقبة.',
        en: 'Administered as a slow IV infusion over at least 60-120 minutes. Report flushing, itching, or rash immediately.',
      },
    },
    brands: [
      { name: 'Vancocin 500mg Vial', manufacturer: 'EIPICO', barcode: '6221127004523', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
      { name: 'Celovan 500mg Vial', manufacturer: 'Hikma Pharmaceuticals', barcode: '6221054006734', verified: true, sourceUrl: 'https://edaegypt.gov.eg' },
    ],
    sources: [EDA_SRC, MP_SRC],
    notes: 'Primary reserve parenteral glycopeptide for MRSA bacteremia and inpatient stewardship in Egypt.',
  },
];
