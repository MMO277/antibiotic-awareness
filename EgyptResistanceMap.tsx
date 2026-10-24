import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';

type RegionId = 'delta' | 'cairo' | 'alex' | 'canal' | 'upper';
type MobileTab = 'radar' | 'bacteria' | 'guide';

interface PathogenMetric {
  id: string;
  name: string;
  shape: 'rod' | 'cocci' | 'cluster';
  antibiotic: Bi;
  base2026: number;
  whoClass: 'Access' | 'Watch' | 'Reserve';
}

interface RadarAxis {
  key: string;
  label: Bi;
  shortLabel: Bi;
  base2026: number;
}

interface RegionSpec {
  id: RegionId;
  name: Bi;
  cities: Bi;
  hospitals: Bi;
  cx: number;
  cy: number;
  labelX: number;
  labelY: number;
  territoryPath: string;
  color: string;
  alertLabel: Bi;
  summary: Bi;
  driver: Bi;
  stewardshipAction: Bi;
  baseOverall2026: number;
  pathogens: PathogenMetric[];
  radar: RadarAxis[];
}

const YEARS = [2018, 2020, 2022, 2024, 2026] as const;

const YEAR_FACTORS: Record<number, number> = {
  2018: 0.76,
  2020: 0.84,
  2022: 0.90,
  2024: 0.95,
  2026: 1.0,
};

/**
 * Geographic Coordinate Projection for Egypt (ViewBox 0 0 440 375):
 * Longitude 24.7°E..36.9°E -> X: 42 + (lon - 24.5) * 28.5
 * Latitude  31.6°N..21.7°N -> Y: 40 + (31.8 - lat) * 29.0
 *
 * Includes:
 * 1. Full Mediterranean Coast (Salloum, Matrouh, Ras El-Hekma, Alexandria, Abu Qir, Burullus, Damietta, Port Said, Bardawil, Arish, Rafah).
 * 2. Full Sinai Peninsula with BOTH Gulf of Suez AND Gulf of Aqaba clearly separated, plus Tiran & Sanafir islands at the Strait of Tiran, and Shadwan island.
 * 3. Full Red Sea Coast down to Ras Hadarba (22°N) with the complete Halayeb, Abu Ramad & Shalateen triangle and Bir Tawil administrative trapezoid.
 * 4. Full Southern 22°N border with Sudan (including complete Lake Nasser & Khor Halfa) and Full Western 25°E border with Libya (Siwa Oasis curve to Salloum).
 */

const EGYPT_UNIFIED_TERRITORY_PATH =
  // Start at Salloum (25.16E, 31.55N) -> Mediterranean Coast Eastward
  'M 61,47 L 85,49 L 118,54 L 145,59 L 166,64 L 184,58 L 196,49 L 210,45 L 228,48 L 243,49 ' +
  // Port Said (32.30E, 31.26N) -> North Sinai Coast (Lake Bardawil, Arish, Rafah 34.25E, 31.30N)
  'L 264,56 L 288,58 L 306,59 L 320,55 ' +
  // Eastern Border (Rafah -> Taba 34.89E, 29.49N)
  'L 338,107 ' +
  // Gulf of Aqaba Western Shore (Taba -> Nuweiba -> Dahab -> Nabq -> Ras Mohammed 34.25E, 27.73N)
  'L 331,128 L 327,142 L 320,158 ' +
  // Gulf of Suez Eastern Shore UP to Suez City (Ras Mohammed -> El-Tor -> Ras Sudr -> Suez 32.55E, 29.96N)
  'L 304,136 L 286,112 L 271,94 ' +
  // Gulf of Suez Western Shore DOWN (Ain Sokhna -> Zafarana -> Ras Gharib -> Hurghada 33.81E, 27.25N)
  'L 265,96 L 274,118 L 288,144 L 307,172 ' +
  // Red Sea Coast Southward (Safaga -> Quseir -> Marsa Alam -> Ras Banas 35.78E, 23.91N)
  'L 318,192 L 336,225 L 363,269 L 355,274 ' +
  // SHALATEEN, ABU RAMAD & HALAYEB TRIANGLE down to Ras Hadarba (36.86E, 22.00N)
  'L 377,298 L 394,324 ' +
  // Southern 22°N International Border (Ras Hadarba -> Halaib Southern Border -> Bir Tawil / 22°N Line -> Lake Nasser -> Jebel Uweinat 25.00E, 22.00N)
  'L 334,324 L 324,332 L 311,332 L 304,324 L 235,324 L 228,330 L 221,324 L 56,324 ' +
  // Western 25°E Border Northward (Jebel Uweinat -> Gilf Kebir -> Great Sand Sea -> Siwa Oasis Curve -> Jaghbub -> Salloum)
  'L 56,195 L 54,158 L 46,125 L 52,102 L 58,76 Z';

const REGIONS: RegionSpec[] = [
  {
    id: 'delta',
    name: {
      ar: 'إقليم الدلتا (الدقهلية والغربية والشرقية وكفر الشيخ ودمياط والمنوفية)',
      en: 'Nile Delta (Mansoura, Tanta, Zagazig, Kafr El-Sheikh & Damietta)',
      fr: 'Delta du Nil (Mansourah, Tanta, Zagazig & Damiette)',
      es: 'Delta del Nilo (Mansura, Tanta, Zagazig y Damieta)',
    },
    cities: {
      ar: 'المنصورة • طنطا • الزقازيق • كفر الشيخ • شبين الكوم • دمياط',
      en: 'Mansoura • Tanta • Zagazig • Kafr El-Sheikh • Shibin El-Kom • Damietta',
      fr: 'Mansourah • Tanta • Zagazig • Kafr El-Cheikh • Damiette',
      es: 'Mansura • Tanta • Zagazig • Kafr el-Sheij • Damieta',
    },
    hospitals: {
      ar: 'مراكز ومستشفيات جامعات المنصورة وطنطا والزقازيق والمنوفية',
      en: 'Mansoura, Tanta, Zagazig & Menoufia University Hospitals',
      fr: 'CHU de Mansourah, Tanta & Zagazig',
      es: 'Hospitales Universitarios de Mansura, Tanta y Zagazig',
    },
    cx: 226,
    cy: 72,
    labelX: 226,
    labelY: 32,
    territoryPath: 'M 196,49 L 210,45 L 228,48 L 243,49 L 260,56 L 248,96 L 226,102 L 204,88 Z',
    color: '#f59e0b',
    alertLabel: {
      ar: 'بؤرة رصد نشطة — بكتيريا معوية منتجة لـ ESBL',
      en: 'High Priority — ESBL Enterobacterales Hotspot',
      fr: 'Priorité Élevée — Foyer Entérobactéries BLSE',
      es: 'Alta Prioridad — Foco de Enterobacterias BLEE',
    },
    summary: {
      ar: 'ترصد دراسات الميكروبيولوجيا في مستشفيات جامعات الدلتا (المنصورة وطنطا والزقازيق) ارتفاع مقاومة الإشريكية القولونية (E. coli) والكلبسيلة الرئوية للجيل الثالث من السيفالوسبورينات والفلوروكينولونات نتيجة الاستخدام التجريبي المتكرر بدون مزرعة.',
      en: 'Surveillance across Nile Delta university hospitals (Mansoura, Tanta, Zagazig) highlights elevated E. coli and Klebsiella resistance to 3rd-generation cephalosporins driven by empiric broad-spectrum use.',
      fr: 'La surveillance dans les CHU du Delta (Mansourah, Tanta, Zagazig) révèle une forte résistance d’E. coli et Klebsiella aux céphalosporines de 3e génération.',
      es: 'La vigilancia en hospitales universitarios del Delta muestra alta resistencia de E. coli y Klebsiella a cefalosporinas de 3.ª generación.',
    },
    driver: {
      ar: 'صرف حقن السيفترياكسون والسيفوتاكسيم والمضادات واسعة الطيف بدون مزرعة بكتيرية في عدوى المسالك والتهاب الحلق.',
      en: 'Empiric injectable Ceftriaxone/Cefotaxime and broad-spectrum beta-lactams without culture in UTIs and pharyngitis.',
      fr: 'Usage empirique de Ceftriaxone injectable et bêta-lactamines sans antibiogramme préalable.',
      es: 'Uso empírico de Ceftriaxona inyectable y betalactámicos sin cultivo previo.',
    },
    stewardshipAction: {
      ar: 'الالتزام بمضادات فئة Access كخط أول، وإجراء مزرعة وحساسية (Antibiogram) قبل وصف السيفالوسبورينات أو الكينولونات.',
      en: 'Use WHO Access antibiotics first-line and obtain culture & sensitivity before starting cephalosporins or fluoroquinolones.',
      fr: 'Privilégier les antibiotiques Access en 1re intention et réaliser un antibiogramme ciblé.',
      es: 'Priorizar antibióticos Access en primera línea y realizar cultivo con antibiograma.',
    },
    baseOverall2026: 66,
    pathogens: [
      {
        id: 'ecoli',
        name: 'Escherichia coli (ESBL+)',
        shape: 'rod',
        antibiotic: {
          ar: 'مقاومة السيفالوسبورينات جيل 3 (سيفترياكسون / سيفوتاكسيم)',
          en: '3rd-Gen Cephalosporin Resistance (Ceftriaxone / Cefotaxime)',
          fr: 'Résistance aux Céphalosporines 3G (Ceftriaxone)',
          es: 'Resistencia a Cefalosporinas 3G (Ceftriaxona)',
        },
        base2026: 68,
        whoClass: 'Watch',
      },
      {
        id: 'kleb',
        name: 'Klebsiella pneumoniae',
        shape: 'rod',
        antibiotic: {
          ar: 'مقاومة الفلوروكينولونات (سيبروفلوكساسين / ليفوفلوكساسين)',
          en: 'Fluoroquinolone Resistance (Ciprofloxacin / Levofloxacin)',
          fr: 'Résistance aux Fluoroquinolones (Ciprofloxacine)',
          es: 'Resistencia a Fluoroquinolonas (Ciprofloxacino)',
        },
        base2026: 61,
        whoClass: 'Watch',
      },
      {
        id: 'mrsa',
        name: 'Staphylococcus aureus (MRSA)',
        shape: 'cluster',
        antibiotic: {
          ar: 'مقاومة البيتا-لاكتام والبنسلينات المضادة للمكورات',
          en: 'Methicillin & Beta-Lactam Resistance (MRSA)',
          fr: 'Résistance à la Méthicilline (SARM)',
          es: 'Resistencia a Meticilina y Betalactámicos (SARM)',
        },
        base2026: 55,
        whoClass: 'Watch',
      },
    ],
    radar: [
      { key: 'ceph3', label: { ar: 'سيفالوسبورينات ج3', en: '3rd-Gen Ceph', fr: 'Céph 3G', es: 'Cef 3G' }, shortLabel: { ar: 'سيفالوسبورين', en: 'Ceph 3G', fr: 'Céph 3G', es: 'Cef 3G' }, base2026: 68 },
      { key: 'pen', label: { ar: 'بنسلينات وأموكسيسيلين', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, shortLabel: { ar: 'بنسلينات', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, base2026: 74 },
      { key: 'fq', label: { ar: 'فلوروكينولونات', en: 'Fluoroquinolones', fr: 'Quinolones', es: 'Quinolonas' }, shortLabel: { ar: 'كينولونات', en: 'Quinolones', fr: 'Quinolones', es: 'Quinolonas' }, base2026: 59 },
      { key: 'mac', label: { ar: 'ماكروليدات (أزيثرومايسين)', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, shortLabel: { ar: 'ماكروليدات', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, base2026: 57 },
      { key: 'amino', label: { ar: 'أمينوجليكوزيدات', en: 'Aminoglycosides', fr: 'Aminosides', es: 'Aminoglucósidos' }, shortLabel: { ar: 'أمينوجليكوزيد', en: 'Aminoglyc.', fr: 'Aminosides', es: 'Aminogluc.' }, base2026: 42 },
      { key: 'carb', label: { ar: 'كاربابينيمات (ملاذ أخير)', en: 'Carbapenems', fr: 'Carbapénèmes', es: 'Carbapenémicos' }, shortLabel: { ar: 'كاربابينيم', en: 'Carbapenem', fr: 'Carbapénème', es: 'Carbapenem' }, base2026: 29 },
    ],
  },
  {
    id: 'cairo',
    name: {
      ar: 'إقليم القاهرة الكبرى (القاهرة والجيزة والقليوبية)',
      en: 'Greater Cairo (Cairo, Giza & Qalyubia)',
      fr: 'Grand Caire (Le Caire, Gizeh & Qalyubia)',
      es: 'Gran El Cairo (El Cairo, Guiza y Caliubia)',
    },
    cities: {
      ar: 'القاهرة • الجيزة • شبرا الخيمة • بنها • 6 أكتوبر • العاصمة الإدارية',
      en: 'Cairo • Giza • Shubra El-Kheima • Banha • 6th of October • New Capital',
      fr: 'Le Caire • Gizeh • Choubra El-Kheima • Banha • 6 Octobre',
      es: 'El Cairo • Guiza • Shubra El-Kheima • Banha • 6 de Octubre',
    },
    hospitals: {
      ar: 'مستشفيات القصر العيني وعين شمس التخصصي والأزهر',
      en: 'Kasr Al-Ainy, Ain Shams & Al-Azhar Tertiary Hospitals',
      fr: 'Hôpitaux Universitaires Kasr Al-Ainy & Ain Shams',
      es: 'Hospitales Universitarios Kasr Al-Ainy y Ain Shams',
    },
    cx: 224,
    cy: 102,
    labelX: 138,
    labelY: 112,
    territoryPath: 'M 200,90 L 252,94 L 256,122 L 194,124 Z',
    color: '#ef4444',
    alertLabel: {
      ar: 'مؤشر حرج — كثافة حضرية وإحالات الرعايات المركزة',
      en: 'Critical Hub — High Urban & Tertiary ICU Load',
      fr: 'Niveau Critique — Forte Densité & Réanimations',
      es: 'Nivel Crítico — Alta Carga Urbana y UCI',
    },
    summary: {
      ar: 'بسبب الكثافة السكانية العالية وإحالة الحالات المعقدة لمستشفيات القصر العيني وعين شمس، تسجل العزلات السريرية معدلات مرتفعة من الكلبسيلة متعددة المقاومة (MDR) ومقاومة الماكروليدات (الأزيثرومايسين) في عدوى الجهاز التنفسي.',
      en: 'High urban density and tertiary referrals to Kasr Al-Ainy and Ain Shams ICUs drive elevated MDR Klebsiella and respiratory macrolide resistance.',
      fr: 'La forte densité urbaine et les références tertiaires entraînent une résistance élevée de Klebsiella MDR et aux macrolides.',
      es: 'La alta densidad urbana y las derivaciones terciarias impulsan una elevada resistencia en Klebsiella MDR y macrólidos.',
    },
    driver: {
      ar: 'التداوي الذاتي بالأزيثرومايسين وأوجمنتين في نزلات البرد الفيروسية، وضغط المضادات واسعة المجال داخل الرعايات المركزة.',
      en: 'Community self-medication with Azithromycin/Augmentin for viral colds alongside intensive broad-spectrum ICU pressure.',
      fr: 'Automédication par Azithromycine/Augmentin lors de rhumes viraux et pression antibiotique en réanimation.',
      es: 'Automedicación con Azitromicina/Augmentin en resfriados virales y alta presión antibiótica en UCI.',
    },
    stewardshipAction: {
      ar: 'تطبيق بروتوكولات ترشيد المضادات بالمستشفيات، وحماية الكاربابينيمات واللينيزوليد، ومنع صرف المضادات لنزلات البرد.',
      en: 'Enforce hospital antimicrobial stewardship, protect Carbapenems/Linezolid, and use Green Rx for viral respiratory illnesses.',
      fr: 'Appliquer les protocoles hospitaliers de bon usage et protéger les Carbapénèmes et le Linézolide.',
      es: 'Aplicar programas hospitalarios de optimización de antibióticos y proteger Carbapenémicos y Linezolid.',
    },
    baseOverall2026: 71,
    pathogens: [
      {
        id: 'kleb-mdr',
        name: 'Klebsiella pneumoniae (MDR)',
        shape: 'rod',
        antibiotic: {
          ar: 'مقاومة السيفالوسبورينات والبيتا-لاكتام واسعة الطيف',
          en: 'Extended-Spectrum Beta-Lactam Resistance',
          fr: 'Résistance aux Bêta-lactamines à large spectre',
          es: 'Resistencia a Betalactámicos de espectro extendido',
        },
        base2026: 73,
        whoClass: 'Watch',
      },
      {
        id: 'strep-mac',
        name: 'Respiratory Pathogens (S. pneumoniae)',
        shape: 'cocci',
        antibiotic: {
          ar: 'مقاومة الماكروليدات (أزيثرومايسين / كلاريثرومايسين)',
          en: 'Macrolide Resistance (Azithromycin / Clarithromycin)',
          fr: 'Résistance aux Macrolides (Azithromycine)',
          es: 'Resistencia a Macrólidos (Azitromicina)',
        },
        base2026: 64,
        whoClass: 'Watch',
      },
      {
        id: 'acineto',
        name: 'Acinetobacter & ICU Gram-Negatives',
        shape: 'cocci',
        antibiotic: {
          ar: 'مقاومة مضادات الرعاية المركزة (تتطلب فئة Reserve)',
          en: 'Hospital ICU Multidrug Resistance (Reserve Tier)',
          fr: 'Multirésistance en USI (Catégorie Réserve)',
          es: 'Multirresistencia en UCI (Categoría Reserva)',
        },
        base2026: 58,
        whoClass: 'Reserve',
      },
    ],
    radar: [
      { key: 'ceph3', label: { ar: 'سيفالوسبورينات ج3', en: '3rd-Gen Ceph', fr: 'Céph 3G', es: 'Cef 3G' }, shortLabel: { ar: 'سيفالوسبورين', en: 'Ceph 3G', fr: 'Céph 3G', es: 'Cef 3G' }, base2026: 73 },
      { key: 'pen', label: { ar: 'بنسلينات وأموكسيسيلين', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, shortLabel: { ar: 'بنسلينات', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, base2026: 78 },
      { key: 'fq', label: { ar: 'فلوروكينولونات', en: 'Fluoroquinolones', fr: 'Quinolones', es: 'Quinolonas' }, shortLabel: { ar: 'كينولونات', en: 'Quinolones', fr: 'Quinolones', es: 'Quinolonas' }, base2026: 65 },
      { key: 'mac', label: { ar: 'ماكروليدات (أزيثرومايسين)', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, shortLabel: { ar: 'ماكروليدات', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, base2026: 66 },
      { key: 'amino', label: { ar: 'أمينوجليكوزيدات', en: 'Aminoglycosides', fr: 'Aminosides', es: 'Aminoglucósidos' }, shortLabel: { ar: 'أمينوجليكوزيد', en: 'Aminoglyc.', fr: 'Aminosides', es: 'Aminogluc.' }, base2026: 48 },
      { key: 'carb', label: { ar: 'كاربابينيمات (ملاذ أخير)', en: 'Carbapenems', fr: 'Carbapénèmes', es: 'Carbapenémicos' }, shortLabel: { ar: 'كاربابينيم', en: 'Carbapenem', fr: 'Carbapénème', es: 'Carbapenem' }, base2026: 38 },
    ],
  },
  {
    id: 'alex',
    name: {
      ar: 'إقليم الإسكندرية والبحيرةومطروح والساحل الشمالي',
      en: 'Alexandria, Beheira, Matrouh & North Coast',
      fr: 'Alexandrie, Beheira, Matrouh & Côte Nord',
      es: 'Alejandría, Beheira, Matruh y Costa Norte',
    },
    cities: {
      ar: 'الإسكندرية • دمنهور • كفر الدوار • العلمين • مرسى مطروح • السلوم • سيوة',
      en: 'Alexandria • Damanhour • Alamein • Marsa Matrouh • Salloum • Siwa',
      fr: 'Alexandrie • Damanhour • El-Alamein • Marsa Matrouh • Siwa',
      es: 'Alejandría • Damanhur • El-Alamein • Marsa Matruh • Siwa',
    },
    hospitals: {
      ar: 'المستشفى الرئيسي الجامعي بالإسكندرية (الأميري) والشاطبي ودمنهور',
      en: 'Alexandria Main University Hospital, El-Shatby & Damanhour',
      fr: 'CHU Principal d’Alexandrie & Hôpital El-Shatby',
      es: 'Hospital Universitario Principal de Alejandría y El-Shatby',
    },
    cx: 184,
    cy: 62,
    labelX: 114,
    labelY: 42,
    territoryPath: 'M 61,47 L 85,49 L 118,54 L 145,59 L 166,64 L 184,58 L 196,49 L 204,88 L 194,124 L 52,124 L 46,125 L 52,102 L 58,76 Z',
    color: '#22d3ee',
    alertLabel: {
      ar: 'رصد ساحلي نشط — عدوى المجتمع والمسالك والجلد',
      en: 'Active Coastal Watch — Community UTI & MRSA',
      fr: 'Surveillance Côtière — ITU Communautaires & SARM',
      es: 'Vigilancia Costera — ITU Comunitarias y SARM',
    },
    summary: {
      ar: 'تُظهر بيانات الترصد في مستشفيات جامعة الإسكندرية والبحيرة معدلات ملحوظة من المكورات العنقودية المقاومة للميثيسيلين (MRSA) في التهابات الجلد والجروح، مع تزايد مقاومة بكتيريا المسالك البولية للكينولونات.',
      en: 'Surveillance from Alexandria University Hospitals shows notable community and wound MRSA rates alongside rising fluoroquinolone resistance in urinary isolates.',
      fr: 'Les données du CHU d’Alexandrie montrent des taux notables de SARM cutané et une résistance croissante aux fluoroquinolones.',
      es: 'Los datos del Hospital Universitario de Alejandría muestran tasas notables de SARM y resistencia creciente a fluoroquinolonas.',
    },
    driver: {
      ar: 'إيقاف المضاد الحيوي فور اختفاء الأعراض بعد 48 ساعة، وتكرار استخدام بواقي الشراب والأقراص المخزنة بالمنزل.',
      en: 'Stopping antibiotic courses early after 48 hours of symptom relief and reusing leftover household antibiotics.',
      fr: 'Arrêt prématuré du traitement après 48 heures d’amélioration et réutilisation des restes d’antibiotiques.',
      es: 'Suspensión prematura del tratamiento tras 48 horas de mejoría y reutilización de antibióticos sobrantes.',
    },
    stewardshipAction: {
      ar: 'إتمام الكورس العلاجي كاملاً باستخدام «متابع الجرعات» والتخلص الآمن من بواقي المضادات السائلة.',
      en: 'Complete the full prescribed regimen using the Dose Tracker and safely dispose of leftover reconstituted syrups.',
      fr: 'Terminer l’intégralité du traitement prescrit et éliminer les sirops entamés en toute sécurité.',
      es: 'Completar todo el régimen prescrito y desechar de forma segura los jarabes reconstituidos sobrantes.',
    },
    baseOverall2026: 59,
    pathogens: [
      {
        id: 'alex-ecoli',
        name: 'E. coli (Uropathogenic)',
        shape: 'rod',
        antibiotic: {
          ar: 'مقاومة الأموكسيسيلين/كلافولانات والسيفالوسبورينات',
          en: 'Amoxicillin-Clavulanate & Cephalosporin Resistance',
          fr: 'Résistance à l’Amoxicilline-Clavulanate et Céphalosporines',
          es: 'Resistencia a Amoxicilina-Clavulanato y Cefalosporinas',
        },
        base2026: 62,
        whoClass: 'Access',
      },
      {
        id: 'alex-mrsa',
        name: 'Staphylococcus aureus (MRSA)',
        shape: 'cluster',
        antibiotic: {
          ar: 'مقاومة الأوكساسيلين والبيتا-لاكتام في عدوى الجلد',
          en: 'Oxacillin / Beta-Lactam Resistance in Skin Infections',
          fr: 'Résistance à l’Oxacilline dans les infections cutanées',
          es: 'Resistencia a Oxacilina en infecciones cutáneas',
        },
        base2026: 53,
        whoClass: 'Watch',
      },
      {
        id: 'alex-pseudo',
        name: 'Pseudomonas aeruginosa',
        shape: 'rod',
        antibiotic: {
          ar: 'تراجع الحساسية للسيبروفلوكساسين ومضادات الزوائف',
          en: 'Reduced Susceptibility to Ciprofloxacin & Antipseudomonals',
          fr: 'Sensibilité réduite à la Ciprofloxacine',
          es: 'Sensibilidad reducida a Ciprofloxacino',
        },
        base2026: 46,
        whoClass: 'Watch',
      },
    ],
    radar: [
      { key: 'ceph3', label: { ar: 'سيفالوسبورينات ج3', en: '3rd-Gen Ceph', fr: 'Céph 3G', es: 'Cef 3G' }, shortLabel: { ar: 'سيفالوسبورين', en: 'Ceph 3G', fr: 'Céph 3G', es: 'Cef 3G' }, base2026: 61 },
      { key: 'pen', label: { ar: 'بنسلينات وأموكسيسيلين', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, shortLabel: { ar: 'بنسلينات', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, base2026: 69 },
      { key: 'fq', label: { ar: 'فلوروكينولونات', en: 'Fluoroquinolones', fr: 'Quinolones', es: 'Quinolonas' }, shortLabel: { ar: 'كينولونات', en: 'Quinolones', fr: 'Quinolones', es: 'Quinolonas' }, base2026: 54 },
      { key: 'mac', label: { ar: 'ماكروليدات (أزيثرومايسين)', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, shortLabel: { ar: 'ماكروليدات', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, base2026: 56 },
      { key: 'amino', label: { ar: 'أمينوجليكوزيدات', en: 'Aminoglycosides', fr: 'Aminosides', es: 'Aminoglucósidos' }, shortLabel: { ar: 'أمينوجليكوزيد', en: 'Aminoglyc.', fr: 'Aminosides', es: 'Aminogluc.' }, base2026: 39 },
      { key: 'carb', label: { ar: 'كاربابينيمات (ملاذ أخير)', en: 'Carbapenems', fr: 'Carbapénèmes', es: 'Carbapenémicos' }, shortLabel: { ar: 'كاربابينيم', en: 'Carbapenem', fr: 'Carbapénème', es: 'Carbapenem' }, base2026: 25 },
    ],
  },
  {
    id: 'canal',
    name: {
      ar: 'إقليم قناة السويس وشبه جزيرة سيناء',
      en: 'Suez Canal & Sinai Peninsula Region',
      fr: 'Canal de Suez & Péninsule du Sinaï',
      es: 'Canal de Suez y Península del Sinaí',
    },
    cities: {
      ar: 'بورسعيد • الإسماعيلية • السويس • العريش • رفح • طابا • شرم الشيخ • الطور',
      en: 'Port Said • Ismailia • Suez • Arish • Rafah • Taba • Sharm El-Sheikh',
      fr: 'Port-Saïd • Ismaïlia • Suez • El-Arich • Taba • Charm el-Cheikh',
      es: 'Puerto Saíd • Ismailía • Suez • El-Arish • Taba • Sharm el-Sheij',
    },
    hospitals: {
      ar: 'مستشفيات جامعة قناة السويس ومجمعات التأمين الصحي الشامل',
      en: 'Suez Canal University Hospitals & Universal Health Insurance Hubs',
      fr: 'CHU du Canal de Suez & Centres d’Assurance Maladie Universelle',
      es: 'Hospitales de la Universidad del Canal de Suez',
    },
    cx: 298,
    cy: 95,
    labelX: 356,
    labelY: 64,
    territoryPath: 'M 264,56 L 288,58 L 306,59 L 320,55 L 338,107 L 331,128 L 327,142 L 320,158 L 304,136 L 286,112 L 271,94 L 265,96 L 252,94 L 260,56 Z',
    color: '#10b981',
    alertLabel: {
      ar: 'حوكمة دوائية متقدمة — منظومة التأمين الصحي الشامل',
      en: 'Structured Stewardship — Universal Health Insurance Network',
      fr: 'Gouvernance Structurée — Réseau d’Assurance Universelle',
      es: 'Gobernanza Estructurada — Red de Seguro Universal',
    },
    summary: {
      ar: 'تتميز محافظات القناة وسيناء بتطبيق برامج حوكمة الوصفات الطبية إلكترونياً داخل منشآت التأمين الصحي الشامل ومستشفيات جامعة قناة السويس، مما يساهم في ضبط صرف المضادات مقارنةً بالمعدلات المفتوحة.',
      en: 'Suez Canal and Sinai governorates benefit from electronic prescribing governance within Universal Health Insurance facilities and Suez Canal University Hospitals.',
      fr: 'Les gouvernorats du Canal et du Sinaï bénéficient d’une gouvernance électronique des prescriptions dans le réseau d’assurance universelle.',
      es: 'Las gobernaciones del Canal y Sinaí se benefician de la prescripción electrónica estructurada en la red de seguro universal.',
    },
    driver: {
      ar: 'استخدام الفلوروكينولونات (سيبروفار) والميترونيدازول عشوائياً في النزلات المعوية الصيفية البسيطة خارج المستشفيات.',
      en: 'Outpatient empiric use of Ciprofloxacin and Metronidazole for uncomplicated summer viral gastroenteritis.',
      fr: 'Usage ambulatoire empirique de Ciprofloxacine et Métronidazole lors de gastro-entérites virales.',
      es: 'Uso ambulatorio empírico de Ciprofloxacino y Metronidazol en gastroenteritis virales de verano.',
    },
    stewardshipAction: {
      ar: 'الاعتماد على محاليل الإرواء الفموي (ORS) في الإسهال المائي البسيط وعدم الجمع بين مضادين بدون استشارة.',
      en: 'Use Oral Rehydration Salts (ORS) first-line for uncomplicated watery diarrhea and avoid unprescribed antibiotic combinations.',
      fr: 'Privilégier les sels de réhydratation orale (SRO) pour les diarrhées aqueuses simples.',
      es: 'Priorizar las sales de rehidratación oral (SRO) en diarreas acuosas simples.',
    },
    baseOverall2026: 52,
    pathogens: [
      {
        id: 'canal-ent',
        name: 'Enterobacterales (UTI & Enteric)',
        shape: 'rod',
        antibiotic: {
          ar: 'مقاومة السيفالوسبورينات في العيادات الخارجية',
          en: 'Outpatient Cephalosporin Resistance',
          fr: 'Résistance ambulatoire aux Céphalosporines',
          es: 'Resistencia ambulatoria a Cefalosporinas',
        },
        base2026: 55,
        whoClass: 'Watch',
      },
      {
        id: 'canal-fq',
        name: 'Enteric E. coli & Shigella spp.',
        shape: 'rod',
        antibiotic: {
          ar: 'مقاومة السيبروفلوكساسين والكو-تريموكسازول',
          en: 'Ciprofloxacin & Co-trimoxazole Resistance',
          fr: 'Résistance à la Ciprofloxacine et au Cotrimoxazole',
          es: 'Resistencia a Ciprofloxacino y Cotrimoxazol',
        },
        base2026: 48,
        whoClass: 'Watch',
      },
      {
        id: 'canal-resp',
        name: 'Streptococcus & Haemophilus spp.',
        shape: 'cocci',
        antibiotic: {
          ar: 'مقاومة الأمبيسيلين والماكروليدات التنفسية',
          en: 'Ampicillin & Respiratory Macrolide Resistance',
          fr: 'Résistance à l’Ampicilline et aux Macrolides',
          es: 'Resistencia a Ampicilina y Macrólidos',
        },
        base2026: 45,
        whoClass: 'Access',
      },
    ],
    radar: [
      { key: 'ceph3', label: { ar: 'سيفالوسبورينات ج3', en: '3rd-Gen Ceph', fr: 'Céph 3G', es: 'Cef 3G' }, shortLabel: { ar: 'سيفالوسبورين', en: 'Ceph 3G', fr: 'Céph 3G', es: 'Cef 3G' }, base2026: 55 },
      { key: 'pen', label: { ar: 'بنسلينات وأموكسيسيلين', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, shortLabel: { ar: 'بنسلينات', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, base2026: 62 },
      { key: 'fq', label: { ar: 'فلوروكينولونات', en: 'Fluoroquinolones', fr: 'Quinolones', es: 'Quinolonas' }, shortLabel: { ar: 'كينولونات', en: 'Quinolones', fr: 'Quinolones', es: 'Quinolonas' }, base2026: 48 },
      { key: 'mac', label: { ar: 'ماكروليدات (أزيثرومايسين)', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, shortLabel: { ar: 'ماكروليدات', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, base2026: 47 },
      { key: 'amino', label: { ar: 'أمينوجليكوزيدات', en: 'Aminoglycosides', fr: 'Aminosides', es: 'Aminoglucósidos' }, shortLabel: { ar: 'أمينوجليكوزيد', en: 'Aminoglyc.', fr: 'Aminosides', es: 'Aminogluc.' }, base2026: 34 },
      { key: 'carb', label: { ar: 'كاربابينيمات (ملاذ أخير)', en: 'Carbapenems', fr: 'Carbapénèmes', es: 'Carbapenémicos' }, shortLabel: { ar: 'كاربابينيم', en: 'Carbapenem', fr: 'Carbapénème', es: 'Carbapenem' }, base2026: 21 },
    ],
  },
  {
    id: 'upper',
    name: {
      ar: 'إقليم صعيد مصر والبحر الأحمر وحلايب وشلاتين',
      en: 'Upper Egypt, Red Sea & Halayeb-Shalateen',
      fr: 'Haute-Égypte, Mer Rouge & Halayeb-Chalateen',
      es: 'Alto Egipto, Mar Rojo y Halayeb-Shalateen',
    },
    cities: {
      ar: 'الفيوم • المنيا • أسيوط • سوهاج • قنا • الأقصر • أسوان • الغردقة • شلاتين • حلايب',
      en: 'Fayoum • Minya • Assiut • Sohag • Qena • Luxor • Aswan • Hurghada • Halayeb',
      fr: 'Fayoum • Minya • Assiout • Sohag • Louxor • Assouan • Hurghada • Halayeb',
      es: 'Fayún • Minya • Asiut • Sohag • Lúxor • Asuán • Hurgada • Halayeb',
    },
    hospitals: {
      ar: 'مستشفيات جامعات أسيوط والمنيا وسوهاج وجنوب الوادي وأسوان',
      en: 'Assiut, Minya, Sohag, South Valley & Aswan University Hospitals',
      fr: 'CHU d’Assiout, Minya, Sohag & Assouan',
      es: 'Hospitales Universitarios de Asiut, Minya, Sohag y Asuán',
    },
    cx: 230,
    cy: 200,
    labelX: 136,
    labelY: 205,
    territoryPath: 'M 52,124 L 256,122 L 274,118 L 288,144 L 307,172 L 318,192 L 336,225 L 363,269 L 355,274 L 377,298 L 394,324 L 334,324 L 324,332 L 311,332 L 304,324 L 56,324 L 56,195 L 54,158 Z',
    color: '#f97316',
    alertLabel: {
      ar: 'مؤشر مرتفع — خطورة «حقنة البرد» والحقن التجريبية',
      en: 'High Alert — Empiric Injectables & "Cold Mix" Hazard',
      fr: 'Alerte Élevée — Injectables Empiriques & « Mélange Rhume »',
      es: 'Alerta Alta — Inyectables Empíricos y «Mezcla para Resfriado»',
    },
    summary: {
      ar: 'تبرز أبحاث مستشفيات جامعات الصعيد (أسيوط والمنيا وسوهاج وأسوان) خطورة الانتشار الشعبي لما يُعرف بـ «حقنة البرد الثلاثية» (مضاد حيوي سيفترياكسون/سيفوتاكسيم + كورتيزون + مسكن) وصرف الحقن دون اختبار حساسية.',
      en: 'Research across Upper Egypt university hospitals (Assiut, Minya, Sohag, Aswan) warns against the unprescribed "triple cold injection" (3rd-gen cephalosporin + corticosteroid + NSAID).',
      fr: 'Les recherches des CHU de Haute-Égypte (Assiout, Minya, Sohag) alertent sur le danger de « l’injection triple contre le rhume ».',
      es: 'Los estudios en hospitales universitarios del Alto Egipto advierten contra la peligrosa «inyección triple para el resfriado».',
    },
    driver: {
      ar: 'الطلب المباشر على «حقنة البرد» وحقن السيفالوسبورينات السريعة لعلاج الحمى والتهاب الحلق الفيروسي.',
      en: 'Direct demand for the hazardous "cold injection mix" and rapid injectable cephalosporins for acute viral fever.',
      fr: 'Demande directe d’injections combinées contre le rhume et de céphalosporines injectables pour des fièvres virales.',
      es: 'Demanda directa de la «inyección para el resfriado» y cefalosporinas inyectables para fiebres virales.',
    },
    stewardshipAction: {
      ar: 'الامتناع التام عن «حقنة البرد» لخطورتها القاتلة (الحساسية المفرطة والفشل الكلوي)، وفحص الحساسية وحساب جرعة الأطفال بالوزن.',
      en: 'Strictly avoid the "cold injection mix" to prevent fatal anaphylaxis, and always verify allergy history and weight-based pediatric dosing.',
      fr: 'Proscrire totalement « l’injection contre le rhume » et vérifier systématiquement les allergies et doses pédiatriques.',
      es: 'Evitar por completo la «inyección para el resfriado» y verificar siempre alergias y dosis pediátricas por peso.',
    },
    baseOverall2026: 64,
    pathogens: [
      {
        id: 'upper-esbl',
        name: 'E. coli & Klebsiella (ESBL+)',
        shape: 'rod',
        antibiotic: {
          ar: 'مقاومة حقن السيفترياكسون والسيفوتاكسيم (جيل 3)',
          en: 'Injectable Ceftriaxone & Cefotaxime Resistance (3G)',
          fr: 'Résistance à la Ceftriaxone et au Céfotaxime injectables',
          es: 'Resistencia a Ceftriaxona y Cefotaxima inyectables',
        },
        base2026: 66,
        whoClass: 'Watch',
      },
      {
        id: 'upper-mrsa',
        name: 'Staphylococcus aureus (MRSA)',
        shape: 'cluster',
        antibiotic: {
          ar: 'مقاومة البيتا-لاكتام في عدوى الجروح والعمليات',
          en: 'Beta-Lactam Resistance in Surgical & Wound Isolates',
          fr: 'Résistance aux Bêta-lactamines dans les plaies chirurgicales',
          es: 'Resistencia a Betalactámicos en heridas quirúrgicas',
        },
        base2026: 56,
        whoClass: 'Watch',
      },
      {
        id: 'upper-salm',
        name: 'Salmonella & Enteric Pathogens',
        shape: 'rod',
        antibiotic: {
          ar: 'تراجع الحساسية للأمبيسيلين والسيبروفلوكساسين',
          en: 'Reduced Susceptibility to Ampicillin & Ciprofloxacin',
          fr: 'Sensibilité réduite à l’Ampicilline et Ciprofloxacine',
          es: 'Sensibilidad reducida a Ampicilina y Ciprofloxacino',
        },
        base2026: 51,
        whoClass: 'Watch',
      },
    ],
    radar: [
      { key: 'ceph3', label: { ar: 'سيفالوسبورينات ج3', en: '3rd-Gen Ceph', fr: 'Céph 3G', es: 'Cef 3G' }, shortLabel: { ar: 'سيفالوسبورين', en: 'Ceph 3G', fr: 'Céph 3G', es: 'Cef 3G' }, base2026: 67 },
      { key: 'pen', label: { ar: 'بنسلينات وأموكسيسيلين', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, shortLabel: { ar: 'بنسلينات', en: 'Penicillins', fr: 'Pénicillines', es: 'Penicilinas' }, base2026: 72 },
      { key: 'fq', label: { ar: 'فلوروكينولونات', en: 'Fluoroquinolones', fr: 'Quinolones', es: 'Quinolonas' }, shortLabel: { ar: 'كينولونات', en: 'Quinolones', fr: 'Quinolones', es: 'Quinolonas' }, base2026: 55 },
      { key: 'mac', label: { ar: 'ماكروليدات (أزيثرومايسين)', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, shortLabel: { ar: 'ماكروليدات', en: 'Macrolides', fr: 'Macrolides', es: 'Macrólidos' }, base2026: 58 },
      { key: 'amino', label: { ar: 'أمينوجليكوزيدات', en: 'Aminoglycosides', fr: 'Aminosides', es: 'Aminoglucósidos' }, shortLabel: { ar: 'أمينوجليكوزيد', en: 'Aminoglyc.', fr: 'Aminosides', es: 'Aminogluc.' }, base2026: 41 },
      { key: 'carb', label: { ar: 'كاربابينيمات (ملاذ أخير)', en: 'Carbapenems', fr: 'Carbapénèmes', es: 'Carbapenémicos' }, shortLabel: { ar: 'كاربابينيم', en: 'Carbapenem', fr: 'Carbapénème', es: 'Carbapenem' }, base2026: 27 },
    ],
  },
];

function getRadarPoint(index: number, pct: number, cx = 130, cy = 120, maxR = 74): [number, number] {
  const angleDeg = -90 + index * 60;
  const rad = (angleDeg * Math.PI) / 180;
  const r = (Math.max(5, Math.min(100, pct)) / 100) * maxR;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

export default function EgyptResistanceMap() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedId, setSelectedId] = useState<RegionId>('delta');
  const [yearIdx, setYearIdx] = useState<number>(4);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [stewardshipMode, setStewardshipMode] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('radar');

  const currentYear = YEARS[yearIdx];
  const activeRegion = useMemo(
    () => REGIONS.find((r) => r.id === selectedId) || REGIONS[0],
    [selectedId]
  );

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setYearIdx((prev) => {
        if (prev + 1 >= YEARS.length) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1350);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const yearFactor = YEAR_FACTORS[currentYear] || 1;
  const simMultiplier = stewardshipMode ? 0.76 : 1;

  const overallPct = Math.round(activeRegion.baseOverall2026 * yearFactor * simMultiplier);
  const activeAccent = stewardshipMode ? '#10b981' : activeRegion.color;

  const radarPolygonPoints = useMemo(() => {
    return activeRegion.radar
      .map((axis, idx) => {
        const val = Math.round(axis.base2026 * yearFactor * simMultiplier);
        const [x, y] = getRadarPoint(idx, val);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activeRegion, yearFactor, simMultiplier]);

  const baselinePolygonPoints = useMemo(() => {
    return activeRegion.radar
      .map((axis, idx) => {
        const [x, y] = getRadarPoint(idx, axis.base2026);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activeRegion]);

  const gaugeAngle = -90 + (Math.min(100, Math.max(0, overallPct)) / 100) * 180;

  return (
    <section className="eg-amr-command">
      <style>{`
        .eg-amr-command {
          position: relative;
          border-radius: 20px;
          background: radial-gradient(circle at 18% 15%, #113a52 0%, #071925 55%, #041018 100%);
          color: #ecfeff;
          border: 1.5px solid rgba(34, 211, 238, 0.32);
          box-shadow: 0 20px 45px rgba(4, 16, 24, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          padding: 22px 18px;
          overflow: hidden;
        }
        .eg-amr-command::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(34, 211, 238, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        @keyframes egNileFlow {
          0% { stroke-dashoffset: 180; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes egArcFlow {
          0% { stroke-dashoffset: 120; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes egPulseRing {
          0% { transform: scale(0.75); opacity: 0.9; }
          70% { transform: scale(1.95); opacity: 0.15; }
          100% { transform: scale(2.35); opacity: 0; }
        }
        @keyframes egMicrobeFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(8deg); }
        }
        @keyframes egScanSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .eg-nile-stream {
          stroke-dasharray: 10 14;
          animation: egNileFlow 4.2s linear infinite;
        }
        .eg-fiber-arc {
          stroke-dasharray: 6 10;
          animation: egArcFlow 3s linear infinite;
        }
        .eg-pulse-circle {
          transform-box: fill-box;
          transform-origin: center;
          animation: egPulseRing 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .eg-microbe-icon {
          animation: egMicrobeFloat 3.4s ease-in-out infinite;
        }
        .eg-radar-sweep {
          transform-origin: 130px 120px;
          animation: egScanSweep 7s linear infinite;
        }
        .eg-glass-panel {
          background: rgba(11, 35, 51, 0.75);
          backdrop-filter: blur(14px) saturate(150%);
          -webkit-backdrop-filter: blur(14px) saturate(150%);
          border: 1px solid rgba(56, 189, 248, 0.24);
          border-radius: 16px;
          padding: 16px;
          position: relative;
          z-index: 1;
        }
        .eg-region-strip {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .eg-region-tab {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(15, 39, 56, 0.78);
          color: #cbd5e1;
          font: inherit;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: all 0.22s ease;
        }
        .eg-region-tab:hover {
          border-color: rgba(34, 211, 238, 0.65);
          color: #ffffff;
        }
        .eg-region-tab.active {
          color: #041018;
          font-weight: 800;
          box-shadow: 0 0 18px rgba(34, 211, 238, 0.35);
        }
        .eg-territory {
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .eg-territory:hover {
          filter: brightness(1.25);
        }
        .eg-territory.active-zone {
          transform: translateY(-2.5px);
        }
        .eg-main-deck {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 18px;
          grid-template-columns: 1.02fr 1.15fr;
          align-items: stretch;
        }
        .eg-radar-gauge-row {
          display: grid;
          gap: 12px;
          grid-template-columns: 1.12fr 0.88fr;
          align-items: center;
          background: rgba(4, 16, 24, 0.58);
          border-radius: 14px;
          padding: 12px;
          border: 1px solid rgba(56, 189, 248, 0.16);
        }
        /* Mobile-only sub-navigation tabs to eliminate long vertical stacking */
        .eg-mobile-subtabs {
          display: none;
        }
        @media (max-width: 860px) {
          .eg-amr-command {
            padding: 16px 12px;
            border-radius: 16px;
          }
          .eg-region-strip {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 6px;
            margin-bottom: 12px;
            scrollbar-width: none;
          }
          .eg-region-strip::-webkit-scrollbar {
            display: none;
          }
          .eg-region-tab {
            padding: 7px 12px;
            font-size: 0.79rem;
            flex-shrink: 0;
          }
          .eg-main-deck {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .eg-glass-panel {
            padding: 12px;
          }
          /* Keep Radar + Speedometer SIDE BY SIDE even on mobile screens! */
          .eg-radar-gauge-row {
            grid-template-columns: 1.08fr 0.92fr;
            gap: 8px;
            padding: 10px 8px;
          }
          .eg-mobile-subtabs {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            background: rgba(4, 16, 24, 0.85);
            padding: 5px;
            border-radius: 12px;
            border: 1px solid rgba(56, 189, 248, 0.25);
          }
          .eg-mobile-subtab-btn {
            background: transparent;
            color: #94a3b8;
            border: none;
            border-radius: 8px;
            padding: 7px 6px;
            font: inherit;
            font-size: 0.76rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }
          .eg-mobile-subtab-btn.on {
            background: #0e9aa7;
            color: #ffffff;
            box-shadow: 0 2px 10px rgba(14, 154, 167, 0.4);
          }
          .eg-hide-on-mobile {
            display: none !important;
          }
        }
        @media (max-width: 380px) {
          .eg-radar-gauge-row {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .eg-nile-stream, .eg-fiber-arc, .eg-pulse-circle, .eg-microbe-icon, .eg-radar-sweep {
            animation: none !important;
          }
        }
      `}</style>

      {/* Top Executive Header */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 211, 238, 0.14)', border: '1px solid rgba(34, 211, 238, 0.35)', color: '#67e8f9', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
            <span>🛰️</span>
            <span>
              {tr(
                lang,
                'مرصد مقاومة المضادات الحيوية بجمهورية مصر العربية • WHO GLASS & NAP-AMR',
                'Egypt Interactive AMR Surveillance Observatory • WHO GLASS & NAP-AMR',
                'Observatoire Interactif de l’Antibiorésistance en Égypte',
                'Observatorio Interactivo de Resistencia en Egipto'
              )}
            </span>
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 'clamp(1.15rem, 2.8vw, 1.55rem)', color: '#ffffff' }}>
            🇪🇬{' '}
            {tr(
              lang,
              'خريطة مقاومة المضادات الحيوية في مصر (الأطلس التفاعلي الحي)',
              'Egypt Antibiotic Resistance Interactive Live Atlas',
              'Atlas Interactif en Temps Réel de l’Antibiorésistance en Égypte',
              'Atlas Interactivo en Vivo de Resistencia a los Antibióticos en Egipto'
            )}
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', maxWidth: '75ch', lineHeight: 1.55 }}>
            {tr(
              lang,
              'اضغط على أي إقليم على الخريطة لاستكشاف نسب المقاومة ومخطط الرادار السداسي للمضادات الحيوية وتطورها الزمني:',
              'Tap any region on the map to explore resistance rates, the 6-axis antibiogram radar, and timeline progression:',
              'Touchez une région sur la carte pour explorer les taux de résistance et le radar à 6 axes :',
              'Toque cualquier región en el mapa para explorar las tasas de resistencia y el radar de 6 ejes:'
            )}
          </p>
        </div>

        {/* Simulation Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setStewardshipMode((v) => !v)}
          style={{
            padding: '8px 14px',
            borderRadius: '12px',
            border: stewardshipMode ? '2px solid #10b981' : '1.5px solid rgba(245, 158, 11, 0.5)',
            background: stewardshipMode
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))'
              : 'rgba(15, 39, 56, 0.85)',
            color: stewardshipMode ? '#6ee7b7' : '#fde68a',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: stewardshipMode ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <span>{stewardshipMode ? '🌿' : '⚡'}</span>
          <span>
            {stewardshipMode
              ? tr(lang, 'محاكاة الروشتة الخضرا: مفعّلة (-24%)', 'Green Rx Sim: ON (-24%)', 'Sim. Verte : ACTIVE (-24%)', 'Sim. Verde: ACTIVA (-24%)')
              : tr(lang, 'جرب محاكاة أثر «الروشتة الخضرا» 🌿', 'Simulate "Green Rx" Impact 🌿', 'Simuler l’Ordonnance Verte 🌿', 'Simular Receta Verde 🌿')}
          </span>
        </button>
      </div>

      {/* Horizontal Swipeable Region Selector Strip */}
      <div className="eg-region-strip" role="tablist">
        {REGIONS.map((r) => {
          const isSelected = r.id === selectedId;
          const pillColor = stewardshipMode ? '#10b981' : r.color;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedId(r.id)}
              className={`eg-region-tab ${isSelected ? 'active' : ''}`}
              style={
                isSelected
                  ? {
                      background: pillColor,
                      borderColor: '#ffffff',
                    }
                  : undefined
              }
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isSelected ? '#041018' : pillColor,
                  boxShadow: isSelected ? 'none' : `0 0 8px ${pillColor}`,
                }}
              />
              {r.id === 'delta' && tr(lang, 'الدلتا والمنصورة', 'Nile Delta', 'Delta du Nil', 'Delta del Nilo')}
              {r.id === 'cairo' && tr(lang, 'القاهرة الكبرى', 'Greater Cairo', 'Grand Caire', 'Gran El Cairo')}
              {r.id === 'alex' && tr(lang, 'الإسكندريةومطروح', 'Alexandria & West', 'Alexandrie', 'Alejandría')}
              {r.id === 'canal' && tr(lang, 'القناة وسيناء', 'Canal & Sinai', 'Canal & Sinaï', 'Canal y Sinaí')}
              {r.id === 'upper' && tr(lang, 'الصعيد وحلايب', 'Upper Egypt & Halayeb', 'Haute-Égypte', 'Alto Egipto')}
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Command Deck */}
      <div className="eg-main-deck">
        {/* COLUMN 1: Complete Geographic Map of Egypt + Compact Timeline Slider */}
        <div className="eg-glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#7dd3fc', fontWeight: 600 }}>
              🧭 {tr(lang, 'خريطة جمهورية مصر العربية الكاملة — اضغط على الإقليم', 'Complete Map of Egypt — Tap any Region', 'Carte Complète d’Égypte', 'Mapa Completo de Egipto')}
            </span>
            <span style={{ fontSize: '0.74rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', padding: '2px 9px', borderRadius: '999px', fontWeight: 700 }}>
              {currentYear}
            </span>
          </div>

          {/* Complete High-Precision Geographic SVG Map of Egypt */}
          <div style={{ width: '100%', maxWidth: '410px', marginInline: 'auto' }}>
            <svg
              viewBox="0 0 440 365"
              style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 10px 22px rgba(0, 0, 0, 0.55))' }}
              role="img"
              aria-label={tr(lang, 'خريطة جمهورية مصر العربية الكاملة شاملة سيناء وتيران وصنافير وحلايب وشلاتين', 'Complete map of Egypt including Sinai, Tiran & Sanafir, and Halayeb & Shalateen', 'Carte complète de l’Égypte', 'Mapa completo de Egipto')}
            >
              <defs>
                <linearGradient id="egBaseLand" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#102c3f" />
                  <stop offset="55%" stopColor="#091d2b" />
                  <stop offset="100%" stopColor="#05121c" />
                </linearGradient>
                <linearGradient id="egDeltaGlow" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={stewardshipMode ? 'rgba(16, 185, 129, 0.5)' : 'rgba(251, 191, 36, 0.55)'} />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 0.08)" />
                </linearGradient>
                <linearGradient id="egNileGolden" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="45%" stopColor="#38bdf8" />
                  <stop offset="80%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
                <filter id="egNeonGlow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Lat/Long Coordinate Grid */}
              <g stroke="rgba(56, 189, 248, 0.07)" strokeWidth="1" strokeDasharray="3 3">
                <line x1="20" y1="55" x2="420" y2="55" />
                <line x1="20" y1="125" x2="420" y2="125" />
                <line x1="20" y1="195" x2="420" y2="195" />
                <line x1="20" y1="265" x2="420" y2="265" />
                <line x1="20" y1="324" x2="420" y2="324" />
                <line x1="90" y1="20" x2="90" y2="350" />
                <line x1="190" y1="20" x2="190" y2="350" />
                <line x1="290" y1="20" x2="290" y2="350" />
                <line x1="390" y1="20" x2="390" y2="350" />
              </g>

              {/* Sea & Border Labels */}
              <text x="175" y="22" fill="#64a6bd" fontSize="9.5" fontWeight="600" textAnchor="middle" opacity="0.85">
                {isAr ? 'البحر الأبيض المتوسط' : 'Mediterranean Sea'}
              </text>
              <text x="366" y="212" fill="#64a6bd" fontSize="9.5" fontWeight="600" textAnchor="middle" opacity="0.82" transform="rotate(55 366 212)">
                {isAr ? 'البحر الأحمر' : 'Red Sea'}
              </text>
              <text x="360" y="346" fill="#7dd3fc" fontSize="8.5" fontWeight="700" textAnchor="middle" opacity="0.9">
                {isAr ? 'مثلث حلايب وشلاتين وأبو رماد (22° شمالاً)' : 'Halayeb, Abu Ramad & Shalateen (22°N)'}
              </text>

              {/* 3D Extruded Depth Shadow of Unified Egypt Territory */}
              <path
                d={EGYPT_UNIFIED_TERRITORY_PATH}
                transform="translate(0, 6)"
                fill="#020a10"
                stroke="rgba(34, 211, 238, 0.22)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* COMPLETE UNIFIED EGYPT TERRITORY (Mainland + Sinai + Gulf of Suez + Gulf of Aqaba + Full Halayeb & Shalateen Triangle + 22°N Southern Border) */}
              <path
                d={EGYPT_UNIFIED_TERRITORY_PATH}
                fill="url(#egBaseLand)"
                stroke="#22d3ee"
                strokeWidth="1.9"
                strokeLinejoin="round"
              />

              {/* Red Sea Egyptian Islands: Tiran, Sanafir (Strait of Tiran), and Shadwan */}
              <ellipse cx="323" cy="160" rx="3.2" ry="2" fill="#102c3f" stroke="#22d3ee" strokeWidth="1.1" />
              <ellipse cx="329" cy="161" rx="2.5" ry="1.6" fill="#102c3f" stroke="#22d3ee" strokeWidth="1.1" />
              <ellipse cx="305" cy="165" rx="2.6" ry="1.5" fill="#102c3f" stroke="#22d3ee" strokeWidth="1" />

              {/* Suez Canal Connecting Port Said (Med) to Suez (Gulf of Suez) through Bitter Lakes */}
              <path
                d="M 264,56 L 265,76 L 268,94"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="3 1.5"
              />

              {/* Qattara Depression Subtle Topographic Contour in Western Desert */}
              <path
                d="M 105,86 Q 132,78 152,85 Q 146,105 118,112 Q 96,106 105,86 Z"
                fill="rgba(14, 154, 167, 0.08)"
                stroke="rgba(56, 189, 248, 0.16)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Siwa Oasis */}
              <ellipse cx="68" cy="118" rx="6" ry="3.2" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="0.9" />

              {/* Interactive Regional Territory Zones */}
              {REGIONS.map((r) => {
                const isZoneActive = r.id === selectedId;
                const zoneColor = stewardshipMode ? '#10b981' : r.color;
                return (
                  <path
                    key={`zone-${r.id}`}
                    d={r.territoryPath}
                    className={`eg-territory ${isZoneActive ? 'active-zone' : ''}`}
                    fill={isZoneActive ? `${zoneColor}38` : `${zoneColor}0d`}
                    stroke={isZoneActive ? zoneColor : 'rgba(148, 163, 184, 0.18)'}
                    strokeWidth={isZoneActive ? '2.1' : '0.9'}
                    onClick={() => setSelectedId(r.id)}
                  />
                );
              })}

              {/* Nile Delta Illuminated Fan (Alexandria/Rosetta to Port Said/Damietta) */}
              <path
                d="M 196,49 L 224,102 L 260,56 Q 228,42 196,49 Z"
                fill="url(#egDeltaGlow)"
                stroke={stewardshipMode ? '#10b981' : '#fbbf24'}
                strokeWidth="1.3"
                strokeDasharray="3 2"
                onClick={() => setSelectedId('delta')}
                style={{ cursor: 'pointer' }}
              />

              {/* Complete Lake Nasser (High Dam Aswan down to Abu Simbel & Wadi Halfa across 22°N) + Toshka Lakes */}
              <path
                d="M 254,266 C 250,278 244,290 238,302 C 234,312 228,322 224,330"
                fill="none"
                stroke="#0284c7"
                strokeWidth="6.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <ellipse cx="198" cy="296" rx="7" ry="3.5" fill="rgba(2, 132, 199, 0.55)" />
              <ellipse cx="184" cy="299" rx="5" ry="2.5" fill="rgba(2, 132, 199, 0.45)" />

              {/* Faiyum Oasis & Lake Qarun */}
              <ellipse cx="208" cy="122" rx="7.5" ry="4.5" fill="rgba(56, 189, 248, 0.38)" stroke="#38bdf8" strokeWidth="1" />

              {/* Nile River Main Artery (Aswan -> Luxor -> Qena Bend -> Sohag -> Assiut -> Minya -> Beni Suef -> Cairo) */}
              <path
                d="M 254,266 C 256,248 262,232 254,218 C 244,206 232,212 226,196 C 218,178 214,160 218,142 C 222,126 224,112 224,102"
                fill="none"
                stroke="url(#egNileGolden)"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#egNeonGlow)"
              />
              {/* Rosetta (Rashid) & Damietta Branches */}
              <path
                d="M 224,102 Q 208,76 196,49 M 224,102 Q 236,75 243,49"
                fill="none"
                stroke="url(#egNileGolden)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#egNeonGlow)"
              />

              {/* Animated Luminous Energy Stream Flowing Along the Nile */}
              <path
                d="M 226,326 L 254,266 C 256,248 262,232 254,218 C 244,206 232,212 226,196 C 218,178 214,160 218,142 L 224,102 L 243,49"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="eg-nile-stream"
                opacity="0.88"
              />

              {/* Fiber-Optic Surveillance Connection Arcs */}
              <g fill="none" stroke="rgba(103, 232, 249, 0.45)" strokeWidth="1.2">
                <path d="M 184,62 Q 205,46 226,72" className="eg-fiber-arc" />
                <path d="M 226,72 Q 234,88 224,102" className="eg-fiber-arc" />
                <path d="M 226,72 Q 262,74 298,95" className="eg-fiber-arc" />
                <path d="M 224,102 Q 204,155 230,200" className="eg-fiber-arc" />
                <path d="M 230,200 Q 305,255 372,308" className="eg-fiber-arc" />
              </g>

              {/* Key Geographic Reference Cities (Matrouh, Siwa, Arish, Sharm, Hurghada, Aswan, Halayeb & Shalateen) */}
              {[
                { x: 118, y: 57, nameAr: 'مطروح', nameEn: 'Matrouh', target: 'alex' as RegionId },
                { x: 68, y: 118, nameAr: 'سيوة', nameEn: 'Siwa', target: 'alex' as RegionId },
                { x: 306, y: 61, nameAr: 'العريش', nameEn: 'Arish', target: 'canal' as RegionId },
                { x: 320, y: 156, nameAr: 'شرم الشيخ', nameEn: 'Sharm', target: 'canal' as RegionId },
                { x: 307, y: 172, nameAr: 'الغردقة', nameEn: 'Hurghada', target: 'upper' as RegionId },
                { x: 254, y: 266, nameAr: 'أسوان', nameEn: 'Aswan', target: 'upper' as RegionId },
                { x: 355, y: 274, nameAr: 'شلاتين', nameEn: 'Shalateen', target: 'upper' as RegionId },
                { x: 377, y: 310, nameAr: 'حلايب', nameEn: 'Halayeb', target: 'upper' as RegionId },
              ].map((c, i) => (
                <g key={i} onClick={() => setSelectedId(c.target)} style={{ cursor: 'pointer' }}>
                  <circle cx={c.x} cy={c.y} r="3" fill="#7dd3fc" stroke="#041018" strokeWidth="0.8" />
                  <text x={c.x} y={c.y - 5} fill="#cbd5e1" fontSize="7.8" fontWeight="600" textAnchor="middle">
                    {isAr ? c.nameAr : c.nameEn}
                  </text>
                </g>
              ))}

              {/* Primary Interactive Regional Hotspots with Animated Radar Pulse Rings */}
              {REGIONS.map((r) => {
                const isActive = r.id === selectedId;
                const nodeColor = stewardshipMode ? '#10b981' : r.color;
                const regionPct = Math.round(r.baseOverall2026 * yearFactor * simMultiplier);
                const shortName =
                  r.id === 'delta'
                    ? isAr ? 'الدلتا والمنصورة' : 'Delta'
                    : r.id === 'cairo'
                    ? isAr ? 'القاهرة الكبرى' : 'Cairo'
                    : r.id === 'alex'
                    ? isAr ? 'الإسكندرية' : 'Alexandria'
                    : r.id === 'canal'
                    ? isAr ? 'القناة وسيناء' : 'Canal & Sinai'
                    : isAr ? 'الصعيد وحلايب' : 'Upper Egypt';

                return (
                  <g
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(r.id);
                      }
                    }}
                  >
                    {isActive && (
                      <>
                        <circle
                          cx={r.cx}
                          cy={r.cy}
                          r="17"
                          fill="none"
                          stroke={nodeColor}
                          strokeWidth="2.2"
                          className="eg-pulse-circle"
                        />
                        <circle cx={r.cx} cy={r.cy} r="12" fill={nodeColor} opacity="0.28" />
                      </>
                    )}

                    <line
                      x1={r.cx}
                      y1={r.cy}
                      x2={r.labelX}
                      y2={r.labelY}
                      stroke={isActive ? nodeColor : 'rgba(148, 163, 184, 0.45)'}
                      strokeWidth={isActive ? '1.5' : '1'}
                      strokeDasharray={isActive ? undefined : '2 2'}
                    />

                    <circle
                      cx={r.cx}
                      cy={r.cy}
                      r={isActive ? '7' : '5.2'}
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth={isActive ? '2.2' : '1.4'}
                    />

                    <g transform={`translate(${r.labelX - 48}, ${r.labelY - 11})`}>
                      <rect
                        width="96"
                        height="21"
                        rx="10.5"
                        fill={isActive ? nodeColor : 'rgba(6, 20, 31, 0.92)'}
                        stroke={isActive ? '#ffffff' : nodeColor}
                        strokeWidth={isActive ? '1.5' : '1'}
                      />
                      <text
                        x="48"
                        y="14"
                        fill={isActive ? '#041018' : '#f8fafc'}
                        fontSize="8.8"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {shortName} • {regionPct}%
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Compact Timeline Slider Bar (2018 -> 2026) */}
          <div
            style={{
              background: 'rgba(4, 16, 24, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '10px 12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  style={{
                    background: isPlaying ? '#ef4444' : '#0e9aa7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '4px 11px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{isPlaying ? '⏸' : '▶'}</span>
                  <span>
                    {isPlaying
                      ? tr(lang, 'إيقاف', 'Pause', 'Pause', 'Pausa')
                      : tr(lang, 'تشغيل التطور الزمني', 'Play Timeline', 'Animer', 'Animar')}
                  </span>
                </button>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {tr(lang, 'تطور المقاومة (2018–2026):', 'AMR Timeline (2018–2026):', 'Évolution :', 'Evolución:')}
                </span>
              </div>
              <strong style={{ color: activeAccent, fontSize: '0.9rem' }}>{currentYear}</strong>
            </div>

            <input
              type="range"
              min={0}
              max={YEARS.length - 1}
              step={1}
              value={yearIdx}
              onChange={(e) => {
                setIsPlaying(false);
                setYearIdx(Number(e.target.value));
              }}
              aria-label={tr(lang, 'شريط الزمن لمقاومة المضادات الحيوية', 'Antibiotic resistance timeline slider', 'Curseur temporel', 'Control deslizante de tiempo')}
              style={{
                width: '100%',
                accentColor: activeAccent,
                cursor: 'pointer',
                height: '6px',
                padding: 0,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
              {YEARS.map((yr, idx) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setYearIdx(idx);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: idx === yearIdx ? activeAccent : '#94a3b8',
                    fontWeight: idx === yearIdx ? 800 : 500,
                    cursor: 'pointer',
                    padding: '1px 4px',
                    fontSize: '0.74rem',
                  }}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Analytics Deck (Tabbed on Mobile so it NEVER stacks into a long page, Full on Desktop) */}
        <div className="eg-glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
          {/* Region Title & Hospital Network Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid rgba(56, 189, 248, 0.18)', paddingBottom: '8px' }}>
            <div>
              <h3 style={{ margin: '0 0 2px', fontSize: '1.08rem', color: '#ffffff' }}>
                📍 {pick(activeRegion.name, lang)}
              </h3>
              <div style={{ fontSize: '0.76rem', color: '#7dd3fc', fontWeight: 600 }}>
                🏥 {pick(activeRegion.hospitals, lang)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                {pick(activeRegion.cities, lang)}
              </div>
            </div>

            <span
              style={{
                background: `${activeAccent}22`,
                color: activeAccent,
                border: `1px solid ${activeAccent}66`,
                borderRadius: '999px',
                padding: '3px 10px',
                fontSize: '0.73rem',
                fontWeight: 700,
              }}
            >
              {stewardshipMode
                ? tr(lang, '🌿 مع الروشتة الخضرا', '🌿 With Green Rx', '🌿 Avec Ordonnance Verte', '🌿 Con Receta Verde')
                : pick(activeRegion.alertLabel, lang)}
            </span>
          </div>

          {/* Mobile Interactive Sub-Tabs (Hidden on Desktop, Shown on Mobile to prevent vertical clutter) */}
          <div className="eg-mobile-subtabs" role="tablist">
            <button
              type="button"
              className={`eg-mobile-subtab-btn ${mobileTab === 'radar' ? 'on' : ''}`}
              onClick={() => setMobileTab('radar')}
            >
              🕸️ {tr(lang, 'الرادار والمؤشر', 'Radar & Index', 'Radar & Indice', 'Radar e Índice')}
            </button>
            <button
              type="button"
              className={`eg-mobile-subtab-btn ${mobileTab === 'bacteria' ? 'on' : ''}`}
              onClick={() => setMobileTab('bacteria')}
            >
              🦠 {tr(lang, 'السلالات (3)', 'Pathogens (3)', 'Bactéries (3)', 'Bacterias (3)')}
            </button>
            <button
              type="button"
              className={`eg-mobile-subtab-btn ${mobileTab === 'guide' ? 'on' : ''}`}
              onClick={() => setMobileTab('guide')}
            >
              🛡️ {tr(lang, 'السبب والحل', 'Cause & Action', 'Cause & Solution', 'Causa y Acción')}
            </button>
          </div>

          {/* PANEL A: 6-Axis Spider Radar + Semi-Circular Speedometer (Side-by-Side on BOTH Desktop & Mobile!) */}
          <div className={`eg-radar-gauge-row ${mobileTab !== 'radar' ? 'eg-hide-on-mobile' : ''}`}>
            {/* 6-Axis Antibiogram Spider Radar Chart */}
            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, marginBottom: '2px' }}>
                🕸️ {tr(lang, 'رادار 6 عائلات مضادات', '6-Class Antibiogram Radar', 'Radar 6 Classes', 'Radar 6 Clases')}
              </div>
              <svg viewBox="0 0 260 232" style={{ width: '100%', maxWidth: '220px', height: 'auto', marginInline: 'auto', display: 'block' }}>
                {[25, 50, 75, 100].map((lvl) => {
                  const pts = [0, 1, 2, 3, 4, 5]
                    .map((i) => getRadarPoint(i, lvl).join(','))
                    .join(' ');
                  return (
                    <polygon
                      key={lvl}
                      points={pts}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.2)"
                      strokeWidth="1"
                    />
                  );
                })}

                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const [x, y] = getRadarPoint(i, 100);
                  return (
                    <line
                      key={i}
                      x1="130"
                      y1="120"
                      x2={x}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.25)"
                      strokeWidth="1"
                    />
                  );
                })}

                <line
                  x1="130"
                  y1="120"
                  x2="130"
                  y2="46"
                  stroke={activeAccent}
                  strokeWidth="1.5"
                  opacity="0.45"
                  className="eg-radar-sweep"
                />

                <polygon
                  points={baselinePolygonPoints}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.4)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />

                <polygon
                  points={radarPolygonPoints}
                  fill={`${activeAccent}38`}
                  stroke={activeAccent}
                  strokeWidth="2.4"
                  style={{ transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />

                {activeRegion.radar.map((axis, idx) => {
                  const val = Math.round(axis.base2026 * yearFactor * simMultiplier);
                  const [vx, vy] = getRadarPoint(idx, val);
                  const [lx, ly] = getRadarPoint(idx, 122);
                  return (
                    <g key={axis.key}>
                      <circle
                        cx={vx}
                        cy={vy}
                        r="3.8"
                        fill="#ffffff"
                        stroke={activeAccent}
                        strokeWidth="2"
                        style={{ transition: 'all 0.45s ease' }}
                      />
                      <text
                        x={lx}
                        y={ly + 3}
                        fill="#e2e8f0"
                        fontSize="8.6"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {pick(axis.shortLabel, lang)} {val}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Semi-Circular Risk Speedometer Gauge + Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px', minWidth: 0 }}>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>
                🎯 {tr(lang, 'متوسط مؤشر المقاومة', 'Composite AMR Index', 'Indice Moyen', 'Índice Promedio')}
              </div>

              <svg viewBox="0 0 180 105" style={{ width: '100%', maxWidth: '155px', height: 'auto' }}>
                <defs>
                  <linearGradient id="egGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20,88 A 70,70 0 0,1 160,88"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 20,88 A 70,70 0 0,1 160,88"
                  fill="none"
                  stroke="url(#egGaugeGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="220"
                  strokeDashoffset={220 - (220 * Math.min(100, overallPct)) / 100}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <g
                  transform={`translate(90, 88) rotate(${gaugeAngle})`}
                  style={{ transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <polygon points="-3,0 0,-60 3,0" fill="#ffffff" />
                  <circle cx="0" cy="0" r="5.5" fill={activeAccent} stroke="#ffffff" strokeWidth="2" />
                </g>
                <text x="90" y="74" fill="#ffffff" fontSize="19" fontWeight="800" textAnchor="middle">
                  {overallPct}%
                </text>
              </svg>

              <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {pick(activeRegion.summary, lang)}
              </p>
            </div>
          </div>

          {/* PANEL B: Microscopic Pathogen Cards with Segmented Glowing Bars */}
          <div className={mobileTab !== 'bacteria' ? 'eg-hide-on-mobile' : ''} style={{ display: 'grid', gap: '8px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7dd3fc' }}>
              🦠 {tr(lang, 'أهم السلالات البكتيرية المرصودة ونسب مقاومتها:', 'Key Monitored Bacterial Pathogens & Resistance:', 'Principales Souches Bactériennes Surveillées :', 'Principales Cepas Bacterianas Monitoreadas:')}
            </div>

            {activeRegion.pathogens.map((p) => {
              const pct = Math.round(p.base2026 * yearFactor * simMultiplier);
              const barColor =
                stewardshipMode
                  ? '#10b981'
                  : pct >= 65
                  ? '#ef4444'
                  : pct >= 52
                  ? '#f59e0b'
                  : '#22d3ee';
              const filledSegments = Math.round((pct / 100) * 16);

              return (
                <div
                  key={p.id}
                  style={{
                    background: 'rgba(6, 22, 33, 0.78)',
                    border: '1px solid rgba(56, 189, 248, 0.18)',
                    borderRadius: '12px',
                    padding: '9px 11px',
                    display: 'grid',
                    gap: '5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="26" height="26" viewBox="0 0 32 32" className="eg-microbe-icon" style={{ flexShrink: 0 }}>
                        <circle cx="16" cy="16" r="14" fill={`${barColor}22`} stroke={barColor} strokeWidth="1.2" />
                        {p.shape === 'rod' && (
                          <>
                            <rect x="8" y="11" width="11" height="5" rx="2.5" fill={barColor} transform="rotate(-18 13 13)" />
                            <rect x="13" y="17" width="11" height="5" rx="2.5" fill={barColor} transform="rotate(14 18 19)" opacity="0.85" />
                          </>
                        )}
                        {p.shape === 'cluster' && (
                          <>
                            <circle cx="13" cy="13" r="3.5" fill={barColor} />
                            <circle cx="19" cy="14" r="3.5" fill={barColor} opacity="0.9" />
                            <circle cx="15" cy="19" r="3.5" fill={barColor} opacity="0.8" />
                          </>
                        )}
                        {p.shape === 'cocci' && (
                          <>
                            <circle cx="11" cy="16" r="3.2" fill={barColor} />
                            <circle cx="17" cy="14" r="3.2" fill={barColor} />
                            <circle cx="22" cy="18" r="3.2" fill={barColor} />
                          </>
                        )}
                      </svg>
                      <div>
                        <b dir="ltr" style={{ fontSize: '0.83rem', color: '#ffffff', display: 'block' }}>
                          {p.name}
                        </b>
                        <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                          {pick(p.antibiotic, lang)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '999px',
                          background: p.whoClass === 'Reserve' ? 'rgba(239,68,68,0.2)' : p.whoClass === 'Watch' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                          color: p.whoClass === 'Reserve' ? '#fca5a5' : p.whoClass === 'Watch' ? '#fcd34d' : '#6ee7b7',
                          border: '1px solid currentColor',
                          fontWeight: 700,
                        }}
                      >
                        WHO {p.whoClass}
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: barColor, minWidth: '36px', textAlign: 'end' }}>
                        {pct}%
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '3px', height: '6px' }}>
                    {Array.from({ length: 16 }).map((_, segIdx) => {
                      const activeSeg = segIdx < filledSegments;
                      return (
                        <span
                          key={segIdx}
                          style={{
                            borderRadius: '2px',
                            background: activeSeg ? barColor : 'rgba(148, 163, 184, 0.16)',
                            boxShadow: activeSeg ? `0 0 6px ${barColor}88` : 'none',
                            transition: 'background 0.25s ease',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PANEL C: Behavioral Driver & Stewardship Action Cards */}
          <div
            className={mobileTab !== 'guide' ? 'eg-hide-on-mobile' : ''}
            style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}
          >
            <div style={{ padding: '9px 11px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
              <b style={{ display: 'block', fontSize: '0.76rem', color: '#fcd34d', marginBottom: '2px' }}>
                ⚠️ {tr(lang, 'أهم مسبب سلوكي مرصود:', 'Primary Behavioral Driver:', 'Facteur Comportemental :', 'Factor Conductual:')}
              </b>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#fef3c7', lineHeight: 1.5 }}>
                {pick(activeRegion.driver, lang)}
              </p>
            </div>

            <div style={{ padding: '9px 11px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
              <b style={{ display: 'block', fontSize: '0.76rem', color: '#6ee7b7', marginBottom: '2px' }}>
                🛡️ {tr(lang, 'الحل الإكلينيكي والتمريضي:', 'Clinical Stewardship Solution:', 'Solution Clinique :', 'Solución Clínica:')}
              </b>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#d1fae5', lineHeight: 1.5 }}>
                {pick(activeRegion.stewardshipAction, lang)}
              </p>
            </div>
          </div>

          {/* Footer Attribution & Quick Links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(56, 189, 248, 0.16)', paddingTop: '8px', fontSize: '0.71rem', color: '#94a3b8' }}>
            <span>
              📚 {tr(lang, 'المرجع: تقارير WHO GLASS • الخطة الوطنية المصرية NAP-AMR • دراسات الجامعات المصرية.', 'Refs: WHO GLASS • Egypt NAP-AMR • Egyptian University Hospital Studies.', 'Réf : OMS GLASS • Plan National Égyptien NAP-AMR.', 'Ref: OMS GLASS • Plan Nacional de Egipto NAP-AMR.')}
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Link to="/green-prescription" className="btn small" style={{ background: '#10b981', borderColor: '#10b981', color: '#041018', fontWeight: 800 }}>
                🌿 {tr(lang, 'الروشتة الخضرا', 'Green Rx', 'Ordonnance Verte', 'Receta Verde')}
              </Link>
              <Link to="/allergy-checker" className="btn small ghost" style={{ color: '#67e8f9', borderColor: 'rgba(103,232,249,0.4)' }}>
                🛡️ {tr(lang, 'فاحص الحساسية', 'Allergy Checker', 'Allergies', 'Alergias')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
