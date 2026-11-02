import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

type SourceCategoryId =
  | 'all'
  | 'nursing'
  | 'egypt_who'
  | 'pharmacology'
  | 'peds_allergy'
  | 'games_research';

interface ScientificSourceItem {
  id: string;
  category: SourceCategoryId;
  categoryLabelAr: string;
  categoryLabelEn: string;
  color: string;
  usedInPagesAr: string;
  usedInPagesEn: string;
  pageRoute: string;
  title: string;
  apaCitation: string;
  summaryAr: string;
  summaryEn: string;
  url: string;
}

const ALL_WEBSITE_SOURCES: ScientificSourceItem[] = [
  // 1. NURSING & GREEN PRESCRIPTION
  {
    id: 'perry-potter-10',
    category: 'nursing',
    categoryLabelAr: 'المراجع التمريضية والروشتة الخضراء',
    categoryLabelEn: 'Nursing Procedures & Green Rx',
    color: '#059669',
    usedInPagesAr: 'الروشتة الخضراء (/green-prescription) • أكاديمية التمريض (/nurse-academy)',
    usedInPagesEn: 'Green Prescription (/green-prescription) • Nurse Academy (/nurse-academy)',
    pageRoute: '/green-prescription',
    title: 'Perry & Potter: Clinical Nursing Skills & Techniques (10th Edition)',
    apaCitation:
      'Perry, A. G., Potter, P. A., Ostendorf, W., & Laplante, N. (2021). Clinical nursing skills & techniques (10th ed.). Elsevier Health Sciences.',
    summaryAr:
      'المرجع الأساسي لإجراءات تطبيقات الحرارة والبرودة (Heat & Cold Applications / Tepid Sponge Bath)، والعلاج الطبيعي للصدر (Chest Physiotherapy: Postural Drainage, Cupped Hand Percussion & Huff Coughing)، وحاسبة معدل التنقيط الوريدي (IV Drip Rate gtt/min)، والوصايا العشر لإعطاء الأدوية.',
    summaryEn:
      'Primary reference for Heat & Cold Applications, Tepid Sponge Bath, Chest Physiotherapy (Postural Drainage, Cupped Percussion, Huff Coughing), IV Drip Rate calculations, and the 10 Medication Rights.',
    url: 'https://evolve.elsevier.com/',
  },
  {
    id: 'brunner-suddarth-15',
    category: 'nursing',
    categoryLabelAr: 'المراجع التمريضية والروشتة الخضراء',
    categoryLabelEn: 'Nursing Procedures & Green Rx',
    color: '#059669',
    usedInPagesAr: 'الروشتة الخضراء (/green-prescription) • مناوبة الطوارئ (/emergency-shift)',
    usedInPagesEn: 'Green Prescription (/green-prescription) • Emergency Shift (/emergency-shift)',
    pageRoute: '/green-prescription',
    title: 'Brunner & Suddarth’s Textbook of Medical-Surgical Nursing (15th Edition)',
    apaCitation:
      'Hinkle, J. L., Cheever, K. H., & Overbaugh, K. (2022). Brunner & Suddarth’s textbook of medical-surgical nursing (15th ed.). Wolters Kluwer.',
    summaryAr:
      'مرجع تقنيات تسكين الألم غير الدوائية (Non-Pharmacological Pain Relief: Progressive Muscle Relaxation, Osmotic Saline Gargle & Semi-Fowler’s Positioning)، ورعاية عدوى الجهاز التنفسي، وبروتوكول سحب مزارع الدم قبل أول جرعة مضاد حيوي في الإنتان (Sepsis Bundle).',
    summaryEn:
      'Reference for Non-Pharmacological Pain Management, Semi-Fowler positioning, respiratory airway clearance, and drawing blood cultures prior to empiric antimicrobial administration.',
    url: 'https://shop.lww.com/',
  },
  {
    id: 'kozier-erb-11',
    category: 'nursing',
    categoryLabelAr: 'المراجع التمريضية والروشتة الخضراء',
    categoryLabelEn: 'Nursing Procedures & Green Rx',
    color: '#059669',
    usedInPagesAr: 'الروشتة الخضراء (/green-prescription) • التثقيف الصوتي (/listen)',
    usedInPagesEn: 'Green Prescription (/green-prescription) • Audio Guides (/listen)',
    pageRoute: '/green-prescription',
    title: 'Kozier & Erb’s Fundamentals of Nursing (11th Edition)',
    apaCitation:
      'Berman, A., Snyder, S., & Frandsen, G. (2021). Kozier & Erb’s fundamentals of nursing: Concepts, process, and practice (11th ed.). Pearson.',
    summaryAr:
      'مرجع التقييم التمريضي الشامل للأعراض (الحمى، السعال، البلغم، الألم)، معايير الأمان التمريضي، ومبادئ التثقيف الصحي للمريض والأسرة.',
    summaryEn:
      'Reference for systematic symptom assessment (fever, cough, sputum, pain), patient safety precautions, and health literacy education.',
    url: 'https://www.pearson.com/',
  },
  {
    id: 'nice-ng15-cks',
    category: 'nursing',
    categoryLabelAr: 'المراجع التمريضية والروشتة الخضراء',
    categoryLabelEn: 'Nursing Procedures & Green Rx',
    color: '#059669',
    usedInPagesAr: 'الروشتة الخضراء (/green-prescription)',
    usedInPagesEn: 'Green Prescription (/green-prescription)',
    pageRoute: '/green-prescription',
    title: 'NICE Guideline NG15 & NICE RTIs (Self-Limiting Respiratory Tract Infections)',
    apaCitation:
      'National Institute for Health and Care Excellence (NICE). (2015, updated 2023). Antimicrobial stewardship: Systems and processes for effective antimicrobial medicine use (NG15) & Respiratory tract infections (CG69).',
    summaryAr:
      'المرجع الإكلينيكي لنظام فرز الأعراض غير الدوائي (Green Prescription Triage)، علامات الخطر التحذيرية (Red Flags)، ومتوسط المدة الطبيعية للتعافي من العدوى الفيروسية بدون مضادات حيوية.',
    summaryEn:
      'Clinical standard for non-antibiotic symptom triage, expected viral symptom duration, and red-flag escalation criteria.',
    url: 'https://www.nice.org.uk/guidance/ng15',
  },

  // 2. EGYPTIAN DRUG AUTHORITY & WHO AWARE
  {
    id: 'who-aware-book',
    category: 'egypt_who',
    categoryLabelAr: 'منظمة الصحة العالمية وهيئة الدواء المصرية',
    categoryLabelEn: 'WHO AWaRe & Egyptian Drug Authority',
    color: '#0d9488',
    usedInPagesAr: 'دليل الأدوية (/medicines) • الصفحة الرئيسية (/)',
    usedInPagesEn: 'Drug Registry (/medicines) • Homepage (/)',
    pageRoute: '/medicines',
    title: 'World Health Organization (WHO) — The WHO AWaRe Antibiotic Book',
    apaCitation:
      'World Health Organization. (2022). The WHO AWaRe (Access, Watch, Reserve) antibiotic book. World Health Organization. https://www.who.int/publications/i/item/9789240062382',
    summaryAr:
      'المرجع العالمي لتصنيف الـ 32 مادة فعالة في المنصة إلى فئات الإتاحة الأساسية (Access - 16 مادة)، فئة المراقبة والحذر (Watch - 16 مادة)، وفئة الملاذ الأخير (Reserve)، وبروتوكولات خط العلاج الأول.',
    summaryEn:
      'Global authority classifying our 32 active ingredients into Access, Watch, and Reserve stewardship tiers and empirical therapy guidance.',
    url: 'https://www.who.int/publications/i/item/9789240062382',
  },
  {
    id: 'eda-egypt-registry',
    category: 'egypt_who',
    categoryLabelAr: 'منظمة الصحة العالمية وهيئة الدواء المصرية',
    categoryLabelEn: 'WHO AWaRe & Egyptian Drug Authority',
    color: '#0d9488',
    usedInPagesAr: 'السجل الدوائي (206 عبوات) • موفر التكلفة (/cost-saver) • تحذير حقنة البرد (/cold-shot-warning)',
    usedInPagesEn: 'Egyptian Registry (206 Packs) • Cost Saver (/cost-saver) • Cold Shot Warning',
    pageRoute: '/cost-saver',
    title: 'هيئة الدواء المصرية (Egyptian Drug Authority — EDA) والدليل القومي للمستحضرات',
    apaCitation:
      'Egyptian Drug Authority (EDA). (2024). Egyptian national drug database, bioequivalence guidelines, and official public safety warnings on the 3-in-1 cold injection. Cairo, Egypt.',
    summaryAr:
      'مصدر توثيق الـ 206 مستحضرات تجارية مصرية، التركيزات، الأشكال الصيدلانية، الشركات المصنعة، قوائم المثائل المصرية المتكافئة حيوياً (Bioequivalent Generics)، والتحذيرات الرسمية من خطورة «حقنة البرد الثلاثية 3×1».',
    summaryEn:
      'Official source for the 206 licensed Egyptian commercial preparations, bioequivalent local generics, EGP pricing, and national safety alerts against the 3-in-1 Cold Shot cocktail.',
    url: 'https://edaegypt.gov.eg/',
  },
  {
    id: 'egypt-nap-amr',
    category: 'egypt_who',
    categoryLabelAr: 'منظمة الصحة العالمية وهيئة الدواء المصرية',
    categoryLabelEn: 'WHO AWaRe & Egyptian Drug Authority',
    color: '#0d9488',
    usedInPagesAr: 'خريطة مقاومة البكتيريا في مصر (Egypt AMR Map) • عداد المقاومة',
    usedInPagesEn: 'Egypt AMR Surveillance Map • Resistance Counter',
    pageRoute: '/',
    title: 'وزارة الصحة والسكان المصرية — الخطة الوطنية لمكافحة مقاومة الميكروبات (Egypt NAP-AMR & WHO GLASS)',
    apaCitation:
      'Ministry of Health and Population (Egypt) & World Health Organization. (2018–2024). Egypt National Action Plan for Antimicrobial Resistance & WHO GLASS Country Surveillance Reports.',
    summaryAr:
      'مصدر إحصائيات وخريطة ترصد المقاومة البكتيرية في المستشفيات المصرية (ارتفاع معدلات البكتيريا المعوية المنتجة لإنزيمات ESBL فوق 62% ومعدلات MRSA فوق 54%).',
    summaryEn:
      'Source for national Egyptian hospital resistance rates (>62% ESBL-producing Enterobacterales and >54% MRSA) displayed on the interactive Egypt AMR Map.',
    url: 'https://www.who.int/publications/m/item/egypt-national-action-plan-for-antimicrobial-resistance',
  },
  {
    id: 'gs1-whocc-atc',
    category: 'egypt_who',
    categoryLabelAr: 'منظمة الصحة العالمية وهيئة الدواء المصرية',
    categoryLabelEn: 'WHO AWaRe & Egyptian Drug Authority',
    color: '#0d9488',
    usedInPagesAr: 'ماسح الباركود بالكاميرا (/scan) • السجل الدوائي (/medicines)',
    usedInPagesEn: 'Camera Barcode Scanner (/scan) • Drug Registry (/medicines)',
    pageRoute: '/scan',
    title: 'WHO Collaborating Centre for Drug Statistics (ATC/DDD Index) & GS1 Egypt (Prefix 622)',
    apaCitation:
      'WHO Collaborating Centre for Drug Statistics Methodology. (2024). ATC/DDD Index 2024 (J01 Antibacterials for systemic use). Norwegian Institute of Public Health & GS1 Egypt.',
    summaryAr:
      'مرجع الأكواد التشريحية الكيميائية العلاجية القياسية (ATC Codes مثل J01CR02 و J01DD04) والباركود الخطي المصري الموثق الذي يبدأ بالكود القومي (622).',
    summaryEn:
      'Standardized Anatomical Therapeutic Chemical (ATC) codes and GS1 Egypt EAN-13 (622) carton barcodes used by the live camera scanner.',
    url: 'https://atcddd.fhi.no/atc_ddd_index/',
  },

  // 3. CLINICAL PHARMACOLOGY, PK/PD, RENAL & INTERACTIONS
  {
    id: 'sanford-idsa',
    category: 'pharmacology',
    categoryLabelAr: 'الفارماكولوجي الإكلينيكي وتعديل جرعات الكلى والتداخلات',
    categoryLabelEn: 'Clinical Pharmacology, PK/PD & Renal Dosing',
    color: '#2563eb',
    usedInPagesAr: 'وضع الممارس الصحي (Clinical Pro Mode) • البطاقات الإكلينيكية (/medicine/:id)',
    usedInPagesEn: 'Clinical Pro Mode • Drug Monographs (/medicine/:id)',
    pageRoute: '/medicines',
    title: 'The Sanford Guide to Antimicrobial Therapy (54th Ed.) & IDSA Practice Guidelines',
    apaCitation:
      'Gilbert, D. N., Chambers, H. F., Saag, M. S., Pavia, A. T., & Boucher, H. W. (2024). The Sanford guide to antimicrobial therapy (54th ed.). Antimicrobial Therapy, Inc.',
    summaryAr:
      'مرجع مصفوفة الطيف البكتيري الرباعية (Gram+, Gram-, Anaerobes, Atypicals)، ومعايير الحرائك الدوائية (PK/PD Drivers: %T>MIC و AUC24/MIC)، وجداول تعديل الجرعات حسب تصفية الكرياتينين (CrCl Renal Cutoffs).',
    summaryEn:
      'Authoritative clinical reference for 4-domain pathogen spectrum matrices, PK/PD bactericidal targets, and creatinine clearance (CrCl) renal dosing adjustments.',
    url: 'https://www.sanfordguide.com/',
  },
  {
    id: 'goodman-gilman-moa',
    category: 'pharmacology',
    categoryLabelAr: 'الفارماكولوجي الإكلينيكي وتعديل جرعات الكلى والتداخلات',
    categoryLabelEn: 'Clinical Pharmacology, PK/PD & Renal Dosing',
    color: '#2563eb',
    usedInPagesAr: 'المحاكي البصري ثلاثي الأبعاد لآلية عمل الدواء (3D MOA Viewer) • مقارنة دواءين (/compare)',
    usedInPagesEn: '3D Mechanism of Action Viewer • Compare Drugs (/compare)',
    pageRoute: '/complete-checkup',
    title: 'Goodman & Gilman’s: The Pharmacological Basis of Therapeutics (14th Edition)',
    apaCitation:
      'Brunton, L. L., & Knollmann, B. C. (2023). Goodman & Gilman’s: The pharmacological basis of therapeutics (14th ed.). McGraw Hill.',
    summaryAr:
      'مرجع الآليات الجزيئية لعمل المضادات الحيوية (تفجير الجدار الخلوي عبر إنزيمات PBPs، تثبيط إنزيم DNA Gyrase و Topoisomerase IV، وقفل الريبوسوم البكتيري 50S/30S)، ونصف العمر الحيوي ونسب الارتباط ببروتينات البلازما.',
    summaryEn:
      'Reference for molecular mechanisms of action (PBP cell wall lysis, DNA gyrase blockade, 50S/30S ribosomal arrest), elimination half-life, and plasma protein binding.',
    url: 'https://accessmedicine.mhmedical.com/',
  },
  {
    id: 'lexicomp-bnf-interactions',
    category: 'pharmacology',
    categoryLabelAr: 'الفارماكولوجي الإكلينيكي وتعديل جرعات الكلى والتداخلات',
    categoryLabelEn: 'Clinical Pharmacology, PK/PD & Renal Dosing',
    color: '#2563eb',
    usedInPagesAr: 'رادار الروشتة 24 ساعة (/prescription-radar) • فاحص التداخلات (/interactions)',
    usedInPagesEn: 'Prescription Radar 24h (/prescription-radar) • Interactions (/interactions)',
    pageRoute: '/prescription-radar',
    title: 'British National Formulary (BNF 86) & Stockley’s Drug Interactions',
    apaCitation:
      'Joint Formulary Committee. (2024). British National Formulary (BNF 86). BMJ Group and Pharmaceutical Press; Preston, C. L. (2023). Stockley’s Drug Interactions.',
    summaryAr:
      'مرجع تفاعلات الاستخلاب الكيميائي (Divalent Cation Chelation) بين الكينولونات/التتراسيكلين ومكملات الكالسيوم والحديد والألبان، وتداخلات الوارفارين (INR Surge)، وإطالة فترة QTc، وقواعد المباعدة الزمنية (2–4 ساعات).',
    summaryEn:
      'Reference for divalent cation chelation (Ca/Fe/Mg/Zn), Warfarin INR potentiation, additive QTc prolongation, and 24-hour dose spacing algorithms.',
    url: 'https://bnf.nice.org.uk/',
  },
  {
    id: 'fda-medlineplus-monographs',
    category: 'pharmacology',
    categoryLabelAr: 'الفارماكولوجي الإكلينيكي وتعديل جرعات الكلى والتداخلات',
    categoryLabelEn: 'Clinical Pharmacology, PK/PD & Renal Dosing',
    color: '#2563eb',
    usedInPagesAr: 'تحذيرات الخلط الوريدي • دليل الأعراض الجانبية (/side-effects)',
    usedInPagesEn: 'IV Incompatibility Alerts • Side Effects Triage (/side-effects)',
    pageRoute: '/side-effects',
    title: 'US FDA Drug Safety Communications & NIH MedlinePlus Drug Information',
    apaCitation:
      'U.S. Food and Drug Administration (FDA) & U.S. National Library of Medicine (MedlinePlus). (2024). Ceftriaxone calcium precipitation alerts, fluoroquinolone tendon warnings, and patient medication guides.',
    summaryAr:
      'مرجع التحذيرات الصندوقية (Black Box Warnings) مثل منع خلط السيفترياكسون مع محاليل الكالسيوم أو رينجر لاكتات في حديثي الولادة، وتحذير التهاب وتر أكيلس مع الكينولونات، وفرز التهاب القولون البكتيري (C. difficile).',
    summaryEn:
      'Source for Black-Box warnings including fatal neonatal Ceftriaxone-Calcium precipitation, fluoroquinolone tendinopathy, and Clostridioides difficile diarrhea triage.',
    url: 'https://medlineplus.gov/druginformation.html',
  },

  // 4. PEDIATRICS, ALLERGY MATRIX & SAFE DISPOSAL
  {
    id: 'bnfc-harriet-lane',
    category: 'peds_allergy',
    categoryLabelAr: 'جرعات الأطفال، مصفوفة الحساسية، والتخلص الآمن',
    categoryLabelEn: 'Pediatrics, Allergy R1 Matrix & Safe Disposal',
    color: '#7c3aed',
    usedInPagesAr: 'حاسبة شراب الأطفال ومحاكي السرنجة (/pediatric-helper)',
    usedInPagesEn: 'Pediatric Dosage & Syringe Simulator (/pediatric-helper)',
    pageRoute: '/pediatric-helper',
    title: 'BNF for Children (BNFC) & The Johns Hopkins Harriet Lane Handbook (23rd Edition)',
    apaCitation:
      'Paediatric Formulary Committee. (2024). BNF for Children (BNFC). Pharmaceutical Press; Kleinman, K., McDaniel, L., & Molloy, M. (2023). The Harriet Lane Handbook (23rd ed.). Elsevier.',
    summaryAr:
      'مرجع معادلات حساب جرعات شراب الأطفال بالوزن (mg/kg/day) حسب شدة العدوى، سقف الأمان الأقصى لجرعة البالغين، دقة القياس بالسرنجة الفموية المدرجة بدلاً من ملاعق الطعام، ومدد صلاحية المعلقات بعد الحل بالماء.',
    summaryEn:
      'Reference for weight-based pediatric suspension dosing (mg/kg/day), maximum adult dose ceilings, oral syringe accuracy vs. household spoons, and reconstitution shelf-life.',
    url: 'https://bnfc.nice.org.uk/',
  },
  {
    id: 'aaaai-r1-allergy',
    category: 'peds_allergy',
    categoryLabelAr: 'جرعات الأطفال، مصفوفة الحساسية، والتخلص الآمن',
    categoryLabelEn: 'Pediatrics, Allergy R1 Matrix & Safe Disposal',
    color: '#7c3aed',
    usedInPagesAr: 'فاحص الحساسية والتفاعلات المتصالبة (/allergy-checker)',
    usedInPagesEn: 'Drug Allergy & Cross-Reactivity Checker (/allergy-checker)',
    pageRoute: '/allergy-checker',
    title: 'AAAAI / ACAAI Joint Task Force Drug Allergy Practice Parameter (2022) — R1 Side-Chain Matrix',
    apaCitation:
      'Khan, D. A., Banerji, A., Blumenthal, K. G., et al. (2022). Drug allergy: A 2022 practice parameter update. Journal of Allergy and Clinical Immunology, 150(6), 1333–1393.',
    summaryAr:
      'المرجع العلمي الحديث لتحليل الحساسية المتصالبة بين البنسلينات والسيفالوسبورينات بناءً على تطابق السلسلة الكيميائية الجانبية (R1 Side-Chain Identity مثل تطابق Amoxicillin مع Cephalexin/Cefadroxil) بدلاً من القاعدة القديمة الخاطئة (10%).',
    summaryEn:
      'Evidence-based clinical standard for evaluating beta-lactam cross-reactivity via exact chemical R1 side-chain structural similarity.',
    url: 'https://www.jacionline.org/',
  },
  {
    id: 'who-fda-safe-disposal',
    category: 'peds_allergy',
    categoryLabelAr: 'جرعات الأطفال، مصفوفة الحساسية، والتخلص الآمن',
    categoryLabelEn: 'Pediatrics, Allergy R1 Matrix & Safe Disposal',
    color: '#7c3aed',
    usedInPagesAr: 'دليل التخلص الآمن وحماية البيئة (/safe-disposal)',
    usedInPagesEn: 'Safe Antibiotic Disposal Guide (/safe-disposal)',
    pageRoute: '/safe-disposal',
    title: 'WHO & US FDA Guidelines for Safe Disposal of Unwanted Pharmaceuticals (One Health AMR)',
    apaCitation:
      'World Health Organization & U.S. Food and Drug Administration. (2023). Guidelines for safe disposal of unwanted pharmaceuticals in households and prevention of environmental antimicrobial resistance.',
    summaryAr:
      'مرجع بروتوكول العزل والتخلص المنزلي الآمن من بواقي المضادات الحيوية، ومنع سكب الشراب أو الأقراص في الصرف الصحي لحماية مياه النيل والتربة من التلوث البكتيري المقاوم (One Health Approach).',
    summaryEn:
      'Reference for household containment and safe disposal of leftover antibiotics to prevent environmental water and soil AMR selection.',
    url: 'https://www.fda.gov/drugs/safe-disposal-medicines',
  },

  // 5. SIMULATION, GAMIFICATION & KAP RESEARCH
  {
    id: 'who-kap-survey-methodology',
    category: 'games_research',
    categoryLabelAr: 'منهجية البحث العلمي والمحاكاة الإكلينيكية',
    categoryLabelEn: 'KAP Research Methodology & Clinical Simulation',
    color: '#d97706',
    usedInPagesAr: 'الاستبيان البحثي وقياس الأثر القبلي والبعدي (/research) • الكويز والشهادة (/quiz)',
    usedInPagesEn: 'Research Survey & Pre/Post Impact (/research) • Quiz & Certificate (/quiz)',
    pageRoute: '/research',
    title: 'WHO Multi-Country Public Awareness Survey on Antimicrobial Resistance & KAP Methodology',
    apaCitation:
      'World Health Organization. (2015–2023). Antibiotic resistance: Multi-country public awareness survey & Guide to developing Knowledge, Attitude and Practice (KAP) surveys.',
    summaryAr:
      'مرجع تصميم أسئلة التقييم المعرفي القبلي والبعدي (Pre/Post Assessment) واستبيان المعرفة والاتجاهات والممارسات (KAP Survey) لقياس أثر التثقيف الصحي الرقمي.',
    summaryEn:
      'Methodological framework for the Pre/Post knowledge assessment and anonymized KAP survey instrument.',
    url: 'https://www.who.int/publications/i/item/9789241509817',
  },
  {
    id: 'inacsl-simulation-standards',
    category: 'games_research',
    categoryLabelAr: 'منهجية البحث العلمي والمحاكاة الإكلينيكية',
    categoryLabelEn: 'KAP Research Methodology & Clinical Simulation',
    color: '#d97706',
    usedInPagesAr: 'محاكي المستشفى ثلاثي الأبعاد (/life-simulator) • مركز الألعاب الـ 7 (/games)',
    usedInPagesEn: '3D Hospital Ward Simulator (/life-simulator) • 7 Clinical Games (/games)',
    pageRoute: '/games',
    title: 'Healthcare Simulation Standards of Best Practice (INACSL) & Gamified Stewardship Education',
    apaCitation:
      'INACSL Standards Committee. (2021). Healthcare Simulation Standards of Best Practice. Clinical Simulation in Nursing, 58, 1–66.',
    summaryAr:
      'المرجع التربوي لتصميم السيناريوهات السريرية التفاعلية داخل محاكي المستشفى ثلاثي الأبعاد (تضييق الطيف De-escalation، التحويل من وريدي لفموي، وحساب تنقيط الفانكومايسين) ومختبر الطفرات البكتيرية.',
    summaryEn:
      'Pedagogical standard for clinical scenario design in the 3D Hospital Simulator, Virtual Bacteria Lab, and Nurse Academy.',
    url: 'https://www.inacsl.org/',
  },
];

export default function Methodology() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedCat, setSelectedCat] = useState<SourceCategoryId>('all');
  const [searchQ, setSearchQ] = useState('');
  const [copiedApa, setCopiedApa] = useState(false);

  const filteredSources = useMemo(() => {
    return ALL_WEBSITE_SOURCES.filter((item) => {
      const matchCat = selectedCat === 'all' || item.category === selectedCat;
      if (!matchCat) return false;
      if (!searchQ.trim()) return true;
      const hay = `${item.title} ${item.apaCitation} ${item.summaryAr} ${item.summaryEn} ${item.usedInPagesAr} ${item.usedInPagesEn}`.toLowerCase();
      return hay.includes(searchQ.trim().toLowerCase());
    });
  }, [selectedCat, searchQ]);

  const handleCopyAllApa = () => {
    const text = ALL_WEBSITE_SOURCES.map((s, idx) => `[${idx + 1}] ${s.apaCitation}`).join('

');
    navigator.clipboard?.writeText(text);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 3000);
  };

  const categories: { id: SourceCategoryId; icon: string; ar: string; en: string }[] = [
    { id: 'all', icon: '📚', ar: 'كل مصادر الموقع (17 مرجعاً قياسياً)', en: 'All Website References (17)' },
    { id: 'nursing', icon: '🩺', ar: 'مراجع التمريض والروشتة الخضراء', en: 'Nursing & Green Prescription' },
    { id: 'egypt_who', icon: '🇪🇬', ar: 'هيئة الدواء المصرية و WHO AWaRe', en: 'EDA Egypt & WHO AWaRe' },
    { id: 'pharmacology', icon: '💊', ar: 'الفارماكولوجي والكلى والتداخلات', en: 'Pharmacology, Renal & Interactions' },
    { id: 'peds_allergy', icon: '👶', ar: 'الأطفال، الحساسية، والتخلص الآمن', en: 'Pediatrics, Allergy & Disposal' },
    { id: 'games_research', icon: '🔬', ar: 'منهجية البحث والمحاكاة 3D', en: 'KAP Research & 3D Simulation' },
  ];

  return (
    <main className="wrap stack" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingBottom: '48px', gap: '20px' }}>
      {/* Hero Banner */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
          color: '#fff',
          borderRadius: '22px',
          padding: '26px',
          borderBottom: '4px solid #14b8a6',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ maxWidth: '780px' }}>
            <span
              style={{
                background: '#14b8a6',
                color: '#0f172a',
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '0.8rem',
                fontWeight: 900,
              }}
            >
              📚 {tr(lang, 'موسوعة المصادر والمراجع العلمية للموقع بالكامل (APA 7th Edition)', 'COMPLETE WEBSITE SCIENTIFIC REFERENCES & APA BIBLIOGRAPHY')}
            </span>
            <h1 style={{ margin: '10px 0 6px', color: '#fff', fontSize: '1.75rem' }}>
              {tr(
                lang,
                'المصادر والمراجع العلمية والتمريضية المعتمدة لجميع أقسام المنصة',
                'Official Nursing, Clinical & Regulatory References for All Platform Modules'
              )}
            </h1>
            <p className="small" style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.65 }}>
              {tr(
                lang,
                'توثيق أكاديمي شامل يربط كل أداة، حاسبة، إجراء تمريضي، وبطاقة دواء داخل الموقع بمصدره العلمي المعتمد من الكتب التمريضية القياسية (Perry & Potter و Brunner & Suddarth) ومنظمة الصحة العالمية (WHO AWaRe) وهيئة الدواء المصرية (EDA).',
                'Comprehensive academic bibliography mapping every clinical calculator, nursing procedure, and drug monograph on this website to its authoritative textbook or regulatory source.'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyAllApa}
            style={{
              background: copiedApa ? '#10b981' : '#ffffff',
              color: '#0f172a',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 16px',
              fontWeight: 900,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            }}
          >
            {copiedApa
              ? tr(lang, '✓ تم نسخ جميع المراجع بصيغة APA!', '✓ Copied All APA Citations!')
              : tr(lang, '📋 نسخ قائمة المراجع الكاملة (APA)', '📋 Copy Full APA Bibliography')}
          </button>
        </div>

        {/* Summary KPI Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '18px',
          }}
        >
          <div style={{ background: 'rgba(15,23,42,0.65)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#5eead4' }}>{ALL_WEBSITE_SOURCES.length}</div>
            <div className="small" style={{ color: '#cbd5e1', fontWeight: 700 }}>{tr(lang, 'مرجعاً علمياً وتمريضياً قياسياً', 'Core Textbooks & Official Guidelines')}</div>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.65)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8' }}>100%</div>
            <div className="small" style={{ color: '#cbd5e1', fontWeight: 700 }}>{tr(lang, 'توثيق بصيغة APA 7th القياسية', 'Standardized APA 7th Citations')}</div>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.65)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24' }}>32 / 206</div>
            <div className="small" style={{ color: '#cbd5e1', fontWeight: 700 }}>{tr(lang, 'مادة فعالة وعبوة موثقة بالمصادر', 'Verified Ingredients & EDA Packs')}</div>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.65)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a78bfa' }}>18+</div>
            <div className="small" style={{ color: '#cbd5e1', fontWeight: 700 }}>{tr(lang, 'أداة إكلينيكية وتمريضية مغطاة', 'Clinical & Nursing Tools Covered')}</div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="card" style={{ borderRadius: '18px', padding: '18px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {categories.map((cat) => {
            const active = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                style={{
                  background: active ? '#0d9488' : '#f1f5f9',
                  color: active ? '#ffffff' : '#0f172a',
                  border: active ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                  borderRadius: '99px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {cat.icon} {isAr ? cat.ar : cat.en}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={tr(
            lang,
            'ابحث داخل المراجع (مثال: Perry, Brunner, WHO AWaRe, هيئة الدواء، الكلى، الأطفال، الكمادات)...',
            'Search references (e.g., Perry, Brunner, WHO AWaRe, EDA, renal, pediatric, chest physiotherapy)...'
          )}
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: '12px',
            border: '1.5px solid #cbd5e1',
            fontSize: '0.92rem',
            fontWeight: 600,
          }}
        />
      </section>

      {/* Detailed Reference Cards */}
      <section className="stack" style={{ gap: '14px' }}>
        {filteredSources.map((src, idx) => (
          <article
            key={src.id}
            className="card"
            style={{
              borderRadius: '18px',
              borderTop: `5px solid ${src.color}`,
              padding: '20px',
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: `${src.color}18`,
                      color: src.color,
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                    }}
                  >
                    #{idx + 1} • {isAr ? src.categoryLabelAr : src.categoryLabelEn}
                  </span>
                  <Link
                    to={src.pageRoute}
                    style={{
                      background: '#f1f5f9',
                      color: '#0f172a',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    📍 {tr(lang, 'مستخدم في:', 'Used in:')} {isAr ? src.usedInPagesAr : src.usedInPagesEn}
                  </Link>
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: '1.18rem', color: '#0f172a', direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}>
                  {src.title}
                </h3>
              </div>

              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn small ghost"
                style={{ fontWeight: 800, flexShrink: 0 }}
              >
                🔗 {tr(lang, 'المصدر الرسمي ↗', 'Official Link ↗')}
              </a>
            </div>

            <p className="small" style={{ margin: '0 0 10px', color: '#1e293b', lineHeight: 1.65, fontSize: '0.92rem' }}>
              {isAr ? src.summaryAr : src.summaryEn}
            </p>

            {/* APA 7th Citation Block */}
            <div
              dir="ltr"
              style={{
                background: '#f8fafc',
                border: '1px dashed #94a3b8',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.82rem',
                color: '#334155',
                fontFamily: 'monospace',
                textAlign: 'left',
              }}
            >
              <b style={{ color: '#0f766e' }}>APA 7th Citation:</b> {src.apaCitation}
            </div>
          </article>
        ))}
      </section>

      {/* Quick Mapping Table: Website Page -> Scientific Source */}
      <section className="card" style={{ borderRadius: '20px', padding: '22px', borderTop: '4px solid #0f172a' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.28rem', color: '#0f172a' }}>
          🗺️ {tr(lang, 'خريطة ربط أقسام الموقع بمصادرها العلمية (Quick Page-to-Reference Map)', 'Website Module-to-Reference Mapping Table')}
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{tr(lang, 'القسم أو الأداة داخل الموقع', 'Website Module / Tool')}</th>
                <th>{tr(lang, 'المصادر العلمية والتمريضية المعتمدة', 'Authoritative Scientific & Nursing Sources')}</th>
                <th>{tr(lang, 'الرابط المباشر', 'Open Page')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>🌿 {tr(lang, 'الروشتة الخضراء والإجراءات التمريضية', 'Green Prescription & Nursing Procedures')}</b></td>
                <td>Perry &amp; Potter (10th Ed.) • Brunner &amp; Suddarth (15th Ed.) • Kozier &amp; Erb • NICE NG15</td>
                <td><Link to="/green-prescription" className="btn small ghost">{tr(lang, 'فتح القسم', 'Open')}</Link></td>
              </tr>
              <tr>
                <td><b>💊 {tr(lang, 'السجل الدوائي المصري (32 مادة / 206 عبوات)', 'Egyptian Drug Registry (32 / 206 Packs)')}</b></td>
                <td>WHO AWaRe Antibiotic Book (2023) • Egyptian Drug Authority (EDA) • WHOCC ATC Index</td>
                <td><Link to="/medicines" className="btn small ghost">{tr(lang, 'فتح القسم', 'Open')}</Link></td>
              </tr>
              <tr>
                <td><b>🩺 {tr(lang, 'وضع الممارس الصحي (PK/PD & CrCl Renal)', 'Doctor Clinical Pro Mode (PK/PD & CrCl)')}</b></td>
                <td>The Sanford Guide to Antimicrobial Therapy (54th Ed.) • IDSA Guidelines • Goodman &amp; Gilman</td>
                <td><Link to="/medicines" className="btn small ghost">{tr(lang, 'فتح القسم', 'Open')}</Link></td>
              </tr>
              <tr>
                <td><b>📡 {tr(lang, 'رادار الروشتة 24 ساعة وفاحص التداخلات', 'Prescription Radar 24h & Interactions')}</b></td>
                <td>British National Formulary (BNF 86) • Stockley’s Drug Interactions • Lexicomp</td>
                <td><Link to="/prescription-radar" className="btn small ghost">{tr(lang, 'فتح القسم', 'Open')}</Link></td>
              </tr>
              <tr>
                <td><b>🛡️ {tr(lang, 'مصفوفة الحساسية المتصالبة (R1 Matrix)', 'Beta-Lactam Allergy Cross-Reactivity')}</b></td>
                <td>AAAAI / ACAAI 2022 Drug Allergy Practice Parameter (R1 Side-Chain Structural Matrix)</td>
                <td><Link to="/allergy-checker" className="btn small ghost">{tr(lang, 'فتح القسم', 'Open')}</Link></td>
              </tr>
              <tr>
                <td><b>👶 {tr(lang, 'حاسبة شراب الأطفال ومحاكي السرنجة', 'Pediatric Dosage & Syringe Simulator')}</b></td>
                <td>BNF for Children (BNFC) • Johns Hopkins Harriet Lane Handbook (23rd Ed.)</td>
                <td><Link to="/pediatric-helper" className="btn small ghost">{tr(lang, 'فتح القسم', 'Open')}</Link></td>
              </tr>
              <tr>
                <td><b>🚨 {tr(lang, 'مختبر مخاطر «حقنة البرد الثلاثية 3×1»', '3-in-1 Cold Shot Cocktail Hazard Lab')}</b></td>
                <td>Egyptian Drug Authority (EDA) &amp; Ministry of Health Official Warnings • WHO Viral Guidance</td>
                <td><Link to="/cold-shot-warning" className="btn small ghost">{tr(lang, 'فتح القسم', 'Open')}</Link></td>
              </tr>
              <tr>
                <td><b>🏥 {tr(lang, 'أكاديمية التمريض ومحاكي المستشفى 3D', 'Nurse Academy & 3D Hospital Simulator')}</b></td>
                <td>Perry &amp; Potter Clinical Nursing Skills • Surviving Sepsis Campaign • INACSL Simulation Standards</td>
                <td><Link to="/nurse-academy" className="btn small ghost">{tr(lang, 'فتح القسم', 'Open')}</Link></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
