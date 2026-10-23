import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';

type RegionId = 'delta' | 'cairo' | 'alex' | 'canal' | 'upper';

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

// Year progression multipliers relative to 2026 baseline
const YEAR_FACTORS: Record<number, number> = {
  2018: 0.76,
  2020: 0.84,
  2022: 0.90,
  2024: 0.95,
  2026: 1.0,
};

const REGIONS: RegionSpec[] = [
  {
    id: 'delta',
    name: {
      ar: 'إقليم الدلتا (المنصورة وطنطا والزقازيق)',
      en: 'Nile Delta (Mansoura, Tanta & Zagazig)',
      fr: 'Delta du Nil (Mansourah, Tanta & Zagazig)',
      es: 'Delta del Nilo (Mansura, Tanta y Zagazig)',
    },
    cities: {
      ar: 'الدقهلية • الغربية • الشرقية • كفر الشيخ • المنوفية • دمياط',
      en: 'Dakahlia • Gharbia • Sharqia • Kafr El-Sheikh • Monufia • Damietta',
      fr: 'Dakahlia • Gharbia • Charqia • Kafr El-Cheikh • Ménoufia • Damiette',
      es: 'Dacalia • Garbía • الشرقية • Kafr el-Sheij • Menufia • Damieta',
    },
    hospitals: {
      ar: 'مراكز ومستشفيات جامعة المنصورة وطنطا والزقازيق',
      en: 'Mansoura, Tanta & Zagazig University Hospitals',
      fr: 'CHU de Mansourah, Tanta & Zagazig',
      es: 'Hospitales Universitarios de Mansura, Tanta y Zagazig',
    },
    cx: 242,
    cy: 76,
    labelX: 242,
    labelY: 42,
    territoryPath: 'M 196,52 L 222,42 L 258,45 L 274,55 L 256,105 L 234,112 L 210,96 Z',
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
      ar: 'القاهرة • الجيزة • شبرا الخيمة • بنها • 6 أكتوبر • العاصمة',
      en: 'Cairo • Giza • Shubra El-Kheima • Banha • 6th of October',
      fr: 'Le Caire • Gizeh • Choubra El-Kheima • Banha • 6 Octobre',
      es: 'El Cairo • Guiza • Shubra El-Kheima • Banha • 6 de Octubre',
    },
    hospitals: {
      ar: 'مستشفيات القصر العيني وعين شمس التخصصي والأزهر',
      en: 'Kasr Al-Ainy, Ain Shams & Al-Azhar Tertiary Hospitals',
      fr: 'Hôpitaux Universitaires Kasr Al-Ainy & Ain Shams',
      es: 'Hospitales Universitarios Kasr Al-Ainy y Ain Shams',
    },
    cx: 236,
    cy: 112,
    labelX: 162,
    labelY: 115,
    territoryPath: 'M 214,98 L 256,104 L 260,132 L 216,134 L 204,114 Z',
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
      ar: 'إقليم الإسكندرية والساحل الشمالي والبحيرة',
      en: 'Alexandria, Beheira & North Coast',
      fr: 'Alexandrie, Beheira & Côte Nord',
      es: 'Alejandría, Beheira y Costa Norte',
    },
    cities: {
      ar: 'الإسكندرية • دمنهور • كفر الدوار • العلمين • مرسى مطروح',
      en: 'Alexandria • Damanhour • Kafr El-Dawar • Alamein • Matrouh',
      fr: 'Alexandrie • Damanhour • Kafr El-Dawar • El-Alamein • Matrouh',
      es: 'Alejandría • Damanhur • Kafr El-Dawar • El-Alamein • Matruh',
    },
    hospitals: {
      ar: 'المستشفى الرئيسي الجامعي بالإسكندرية (الأميري) والشاطبي',
      en: 'Alexandria Main University Hospital & El-Shatby Hospital',
      fr: 'CHU Principal d’Alexandrie & Hôpital El-Shatby',
      es: 'Hospital Universitario Principal de Alejandría y El-Shatby',
    },
    cx: 186,
    cy: 64,
    labelX: 122,
    labelY: 46,
    territoryPath: 'M 64,58 L 128,62 L 166,52 L 196,52 L 210,96 L 164,108 L 62,108 Z',
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
      ar: 'إقليم قناة السويس وسيناء والبحر الأحمر',
      en: 'Suez Canal, Sinai & Red Sea Region',
      fr: 'Canal de Suez, Sinaï & Mer Rouge',
      es: 'Canal de Suez, Sinaí y Mar Rojo',
    },
    cities: {
      ar: 'بورسعيد • الإسماعيلية • السويس • العريش • الطور • الغردقة • شلاتين • حلايب',
      en: 'Port Said • Ismailia • Suez • Arish • Hurghada • Shalateen • Halayeb',
      fr: 'Port-Saïd • Ismaïlia • Suez • El-Arich • Hurghada • Halayeb',
      es: 'Puerto Saíd • Ismailía • Suez • El-Arish • Hurgada • Halayeb',
    },
    hospitals: {
      ar: 'مستشفيات جامعة قناة السويس ومجمعات التأمين الصحي الشامل',
      en: 'Suez Canal University Hospitals & Universal Health Insurance Hubs',
      fr: 'CHU du Canal de Suez & Centres d’Assurance Maladie Universelle',
      es: 'Hospitales de la Universidad del Canal de Suez',
    },
    cx: 286,
    cy: 98,
    labelX: 332,
    labelY: 72,
    territoryPath: 'M 274,55 L 334,62 L 346,105 L 312,165 L 286,122 L 260,96 Z',
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
      ar: 'إقليم صعيد مصر (المنيا وأسيوط وسوهاج والأقصر وأسوان)',
      en: 'Upper Egypt (Minya, Assiut, Sohag, Luxor & Aswan)',
      fr: 'Haute-Égypte (Minya, Assiout, Sohag, Louxor & Assouan)',
      es: 'Alto Egipto (Minya, Asiut, Sohag, Lúxor y Asuán)',
    },
    cities: {
      ar: 'الفيوم • بني سويف • المنيا • أسيوط • سوهاج • قنا • الأقصر • أسوان',
      en: 'Fayoum • Beni Suef • Minya • Assiut • Sohag • Qena • Luxor • Aswan',
      fr: 'Fayoum • Beni Suef • Minya • Assiout • Sohag • Qena • Louxor • Assouan',
      es: 'Fayún • Beni Suef • Minya • Asiut • Sohag • Qena • Lúxor • Asuán',
    },
    hospitals: {
      ar: 'مستشفيات جامعات أسيوط والمنيا وسوهاج وجنوب الوادي وأسوان',
      en: 'Assiut, Minya, Sohag & Aswan University Hospitals',
      fr: 'CHU d’Assiout, Minya, Sohag & Assouan',
      es: 'Hospitales Universitarios de Asiut, Minya, Sohag y Asuán',
    },
    cx: 238,
    cy: 215,
    labelX: 162,
    labelY: 215,
    territoryPath: 'M 178,134 L 262,134 L 302,220 L 356,298 L 368,322 L 74,322 L 66,180 Z',
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

// Helper to compute 6-axis radar polygon coordinates
function getRadarPoint(index: number, pct: number, cx = 130, cy = 125, maxR = 78): [number, number] {
  const angleDeg = -90 + index * 60;
  const rad = (angleDeg * Math.PI) / 180;
  const r = (Math.max(5, Math.min(100, pct)) / 100) * maxR;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

export default function EgyptResistanceMap() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [selectedId, setSelectedId] = useState<RegionId>('delta');
  const [yearIdx, setYearIdx] = useState<number>(4); // Default 2026
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [stewardshipMode, setStewardshipMode] = useState<boolean>(false);

  const currentYear = YEARS[yearIdx];
  const activeRegion = useMemo(
    () => REGIONS.find((r) => r.id === selectedId) || REGIONS[0],
    [selectedId]
  );

  // Auto-play timeline animation
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
  // When Green Rx Stewardship simulation is toggled ON, project a 24% reduction in preventable resistance
  const simMultiplier = stewardshipMode ? 0.76 : 1;

  const overallPct = Math.round(activeRegion.baseOverall2026 * yearFactor * simMultiplier);
  const activeAccent = stewardshipMode ? '#10b981' : activeRegion.color;

  // Radar polygon points string
  const radarPolygonPoints = useMemo(() => {
    return activeRegion.radar
      .map((axis, idx) => {
        const val = Math.round(axis.base2026 * yearFactor * simMultiplier);
        const [x, y] = getRadarPoint(idx, val);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activeRegion, yearFactor, simMultiplier]);

  // Baseline 2026 ghost polygon for comparison when in stewardship mode or earlier year
  const baselinePolygonPoints = useMemo(() => {
    return activeRegion.radar
      .map((axis, idx) => {
        const [x, y] = getRadarPoint(idx, axis.base2026);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activeRegion]);

  // Semi-circular speedometer arc calculation
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
          padding: 24px 20px;
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
          transform-origin: 130px 125px;
          animation: egScanSweep 7s linear infinite;
        }
        .eg-glass-panel {
          background: rgba(11, 35, 51, 0.72);
          backdrop-filter: blur(14px) saturate(150%);
          -webkit-backdrop-filter: blur(14px) saturate(150%);
          border: 1px solid rgba(56, 189, 248, 0.24);
          border-radius: 16px;
          padding: 16px;
          position: relative;
          z-index: 1;
        }
        .eg-region-tab {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(15, 39, 56, 0.78);
          color: #cbd5e1;
          font: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all 0.22s ease;
        }
        .eg-region-tab:hover {
          border-color: rgba(34, 211, 238, 0.65);
          color: #ffffff;
          transform: translateY(-1px);
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
          transform: translateY(-3px);
        }
        @media (prefers-reduced-motion: reduce) {
          .eg-nile-stream, .eg-fiber-arc, .eg-pulse-circle, .eg-microbe-icon, .eg-radar-sweep {
            animation: none !important;
          }
        }
      `}</style>

      {/* Top Executive Header */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 211, 238, 0.14)', border: '1px solid rgba(34, 211, 238, 0.35)', color: '#67e8f9', padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
            <span>🛰️</span>
            <span>
              {tr(
                lang,
                'المرصد التفاعلي لمقاومة المضادات الحيوية بجمهورية مصر العربية • WHO GLASS & NAP-AMR',
                'Egypt Interactive AMR Surveillance Observatory • WHO GLASS & NAP-AMR',
                'Observatoire Interactif de l’Antibiorésistance en Égypte • OMS GLASS',
                'Observatorio Interactivo de Resistencia en Egipto • OMS GLASS'
              )}
            </span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', color: '#ffffff' }}>
            🇪🇬{' '}
            {tr(
              lang,
              'خريطة مقاومة المضادات الحيوية في مصر (الأطلس التفاعلي الحي)',
              'Egypt Antibiotic Resistance Interactive Live Atlas',
              'Atlas Interactif en Temps Réel de l’Antibiorésistance en Égypte',
              'Atlas Interactivo en Vivo de Resistencia a los Antibióticos en Egipto'
            )}
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8', maxWidth: '75ch', lineHeight: 1.6 }}>
            {tr(
              lang,
              'استكشف الخريطة الكاملة لمصر (شاملة الدلتا، القاهرة الكبرى، الإسكندرية، سيناء والقناة، الصعيد، وحلايب وشلاتين) وتابع تطور مقاومة السلالات البكتيرية عبر السنين ومخطط الرادار السداسي للمضادات:',
              'Explore the complete map of Egypt (including the Nile Delta, Greater Cairo, Alexandria, Sinai & Canal, Upper Egypt, and Halayeb & Shalateen) with animated timeline projections and 6-axis antibiogram radar:',
              'Explorez la carte complète de l’Égypte avec l’évolution temporelle de la résistance bactérienne et le radar d’antibiogramme à 6 axes :',
              'Explore el mapa completo de Egipto con la evolución temporal de la resistencia bacteriana y el radar de antibiograma de 6 ejes:'
            )}
          </p>
        </div>

        {/* Simulation Mode Toggle Button: "What if we apply Stewardship?" */}
        <button
          type="button"
          onClick={() => setStewardshipMode((v) => !v)}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: stewardshipMode ? '2px solid #10b981' : '1.5px solid rgba(245, 158, 11, 0.5)',
            background: stewardshipMode
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))'
              : 'rgba(15, 39, 56, 0.85)',
            color: stewardshipMode ? '#6ee7b7' : '#fde68a',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: stewardshipMode ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{stewardshipMode ? '🌿' : '⚡'}</span>
          <span>
            {stewardshipMode
              ? tr(lang, 'محاكاة الترشيد والروشتة الخضرا: مفعّلة (-24% مقاومة)', 'Stewardship Simulation: ACTIVE (-24% AMR)', 'Simulation Bon Usage : ACTIVE (-24%)', 'Simulación Uso Prudente: ACTIVA (-24%)')
              : tr(lang, 'جرب محاكاة أثر «الروشتة الخضرا» وترشيد المضادات', 'Simulate "Green Rx" Stewardship Impact', 'Simuler l’impact de l’Ordonnance Verte', 'Simular impacto de la Receta Verde')}
          </span>
        </button>
      </div>

      {/* Interactive Region Selector Pills */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }} role="tablist">
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
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: isSelected ? '#041018' : pillColor,
                  boxShadow: isSelected ? 'none' : `0 0 8px ${pillColor}`,
                }}
              />
              {r.id === 'delta' && tr(lang, 'إقليم الدلتا والمنصورة', 'Nile Delta (Mansoura)', 'Delta du Nil', 'Delta del Nilo')}
              {r.id === 'cairo' && tr(lang, 'القاهرة الكبرى', 'Greater Cairo', 'Grand Caire', 'Gran El Cairo')}
              {r.id === 'alex' && tr(lang, 'الإسكندرية والساحل', 'Alexandria & Coast', 'Alexandrie', 'Alejandría')}
              {r.id === 'canal' && tr(lang, 'قناة السويس وسيناء', 'Suez Canal & Sinai', 'Canal & Sinaï', 'Canal y Sinaí')}
              {r.id === 'upper' && tr(lang, 'صعيد مصر والبحر الأحمر', 'Upper Egypt & South', 'Haute-Égypte', 'Alto Egipto')}
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Command Deck */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gap: '18px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
          alignItems: 'stretch',
        }}
      >
        {/* COLUMN 1: Complete Geographic Map of Egypt + Animated Nile + Time Slider */}
        <div className="eg-glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#7dd3fc', fontWeight: 600 }}>
              ✨ {tr(lang, 'خريطة مصر الكاملة — اضغط على أي إقليم أو نقطة رصد', 'Full Map of Egypt — Click any Region or Node', 'Carte Complète d’Égypte — Cliquez sur une Région', 'Mapa Completo de Egipto — Toque cualquier Región')}
            </span>
            <span style={{ fontSize: '0.76rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', padding: '2px 10px', borderRadius: '999px', fontWeight: 700 }}>
              {tr(lang, `بيانات عام ${currentYear}`, `Year ${currentYear}`, `Année ${currentYear}`, `Año ${currentYear}`)}
            </span>
          </div>

          {/* Complete SVG Map of Egypt including Sinai, Red Sea Coast, Lake Nasser, and Halayeb & Shalateen */}
          <div style={{ width: '100%', maxWidth: '430px', marginInline: 'auto' }}>
            <svg
              viewBox="0 0 420 355"
              style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.55))' }}
              role="img"
              aria-label={tr(lang, 'خريطة جمهورية مصر العربية الكاملة لمقاومة المضادات الحيوية', 'Complete map of the Arab Republic of Egypt showing antibiotic resistance surveillance', 'Carte complète de la République arabe d’Égypte', 'Mapa completo de la República Árabe de Egipto')}
            >
              <defs>
                <linearGradient id="egBaseLand" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f293a" />
                  <stop offset="60%" stopColor="#091d2b" />
                  <stop offset="100%" stopColor="#06131d" />
                </linearGradient>
                <linearGradient id="egDeltaGlow" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={stewardshipMode ? 'rgba(16, 185, 129, 0.48)' : 'rgba(251, 191, 36, 0.52)'} />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 0.08)" />
                </linearGradient>
                <linearGradient id="egNileGolden" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="45%" stopColor="#38bdf8" />
                  <stop offset="80%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
                <filter id="egNeonGlow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Subtle Geographic Lat/Long Grid */}
              <g stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" strokeDasharray="3 3">
                <line x1="20" y1="60" x2="400" y2="60" />
                <line x1="20" y1="130" x2="400" y2="130" />
                <line x1="20" y1="200" x2="400" y2="200" />
                <line x1="20" y1="270" x2="400" y2="270" />
                <line x1="20" y1="322" x2="400" y2="322" />
                <line x1="100" y1="20" x2="100" y2="340" />
                <line x1="200" y1="20" x2="200" y2="340" />
                <line x1="300" y1="20" x2="300" y2="340" />
              </g>

              {/* Sea & Geographic Reference Labels */}
              <text x="165" y="24" fill="#64a6bd" fontSize="10" fontWeight="600" textAnchor="middle" opacity="0.85">
                {isAr ? 'البحر الأبيض المتوسط' : 'Mediterranean Sea'}
              </text>
              <text x="348" y="218" fill="#64a6bd" fontSize="9.5" fontWeight="600" textAnchor="middle" opacity="0.8" transform="rotate(56 348 218)">
                {isAr ? 'البحر الأحمر' : 'Red Sea'}
              </text>
              <text x="346" y="336" fill="#94a3b8" fontSize="8.5" fontWeight="600" textAnchor="middle" opacity="0.85">
                {isAr ? 'حلايب وشلاتين (خط عرض 22°)' : 'Halayeb & Shalateen (22°N)'}
              </text>

              {/* 3D Extruded Shadow Base of Complete Egypt Mainland + Halayeb & Shalateen */}
              <path
                d="M 64,64 L 105,68 L 145,62 L 182,58 L 198,56 L 222,48 L 258,51 L 274,61 L 284,102 L 266,116 L 298,176 L 328,238 L 356,294 L 372,316 L 364,328 L 74,328 L 68,218 L 56,126 Z"
                fill="#020b12"
                stroke="rgba(34, 211, 238, 0.2)"
                strokeWidth="1.5"
              />
              {/* 3D Shadow Base of Complete Sinai Peninsula (Gulf of Suez & Gulf of Aqaba) */}
              <path
                d="M 278,60 L 314,56 L 336,66 L 348,108 L 314,170 L 298,136 L 284,100 Z"
                fill="#020b12"
                stroke="rgba(34, 211, 238, 0.2)"
                strokeWidth="1.5"
              />

              {/* COMPLETE EGYPT MAINLAND POLYGON (Salloum to Rafah, South to 22°N including Full Halayeb & Shalateen Triangle on Red Sea) */}
              <path
                d="M 64,58 L 105,62 L 145,56 L 182,52 L 198,50 L 222,42 L 258,45 L 274,55 L 284,96 L 266,110 L 298,170 L 328,232 L 356,288 L 372,310 L 364,322 L 74,322 L 68,212 L 56,120 Z"
                fill="url(#egBaseLand)"
                stroke="#22d3ee"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* COMPLETE SINAI PENINSULA POLYGON (Mediterranean Coast, Rafah-Taba Border, Gulf of Aqaba, Ras Mohammed, Gulf of Suez) */}
              <path
                d="M 278,54 L 314,50 L 336,60 L 348,102 L 314,164 L 298,130 L 284,94 Z"
                fill="url(#egBaseLand)"
                stroke="#22d3ee"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Interactive Clickable Regional Territory Overlays (3D Levitation Effect when Active) */}
              {REGIONS.map((r) => {
                const isZoneActive = r.id === selectedId;
                const zoneColor = stewardshipMode ? '#10b981' : r.color;
                return (
                  <path
                    key={`zone-${r.id}`}
                    d={r.territoryPath}
                    className={`eg-territory ${isZoneActive ? 'active-zone' : ''}`}
                    fill={isZoneActive ? `${zoneColor}38` : `${zoneColor}10`}
                    stroke={isZoneActive ? zoneColor : 'rgba(148, 163, 184, 0.22)'}
                    strokeWidth={isZoneActive ? '2.2' : '1'}
                    onClick={() => setSelectedId(r.id)}
                  />
                );
              })}

              {/* Nile Delta Illuminated Golden/Cyan Fan */}
              <path
                d="M 196,52 L 236,110 L 272,54 Q 236,38 196,52 Z"
                fill="url(#egDeltaGlow)"
                stroke={stewardshipMode ? '#10b981' : '#fbbf24'}
                strokeWidth="1.3"
                strokeDasharray="3 2"
                onClick={() => setSelectedId('delta')}
                style={{ cursor: 'pointer' }}
              />

              {/* Lake Nasser & Toshka Lakes in Southern Upper Egypt */}
              <path
                d="M 226,322 L 234,308 L 246,294 L 240,280 L 248,268"
                fill="none"
                stroke="#0284c7"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
              {/* Faiyum Oasis Depression */}
              <ellipse cx="218" cy="132" rx="8" ry="5" fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth="1" />

              {/* Nile River Main Artery (Aswan -> Luxor -> Qena Bend -> Assiut -> Minya -> Cairo) */}
              <path
                d="M 248,268 C 252,250 264,234 256,220 C 246,206 234,212 228,196 C 222,180 226,162 232,144 C 236,130 236,118 236,110"
                fill="none"
                stroke="url(#egNileGolden)"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#egNeonGlow)"
              />
              {/* Rosetta (Rashid) & Damietta Branches */}
              <path
                d="M 236,110 Q 214,82 198,51 M 236,110 Q 250,80 260,47"
                fill="none"
                stroke="url(#egNileGolden)"
                strokeWidth="2.6"
                strokeLinecap="round"
                filter="url(#egNeonGlow)"
              />

              {/* Animated Luminous Energy Stream Flowing Along the Nile */}
              <path
                d="M 230,320 L 248,268 C 252,250 264,234 256,220 C 246,206 234,212 228,196 C 222,180 226,162 232,144 L 236,110 L 258,48"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="eg-nile-stream"
                opacity="0.85"
              />

              {/* Fiber-Optic Surveillance Connection Arcs Between University Hospital Nodes */}
              <g fill="none" stroke="rgba(103, 232, 249, 0.45)" strokeWidth="1.3">
                <path d="M 186,64 Q 214,48 242,76" className="eg-fiber-arc" />
                <path d="M 242,76 Q 248,95 236,112" className="eg-fiber-arc" />
                <path d="M 242,76 Q 268,78 286,98" className="eg-fiber-arc" />
                <path d="M 236,112 Q 212,165 238,215" className="eg-fiber-arc" />
                <path d="M 238,215 Q 295,255 348,298" className="eg-fiber-arc" />
              </g>

              {/* Secondary Reference City Dots (Aswan, Matrouh, Arish, Halayeb) */}
              {[
                { x: 96, y: 66, nameAr: 'مطروح', nameEn: 'Matrouh', target: 'alex' as RegionId },
                { x: 322, y: 60, nameAr: 'العريش', nameEn: 'Arish', target: 'canal' as RegionId },
                { x: 312, y: 158, nameAr: 'شرم الشيخ', nameEn: 'Sharm', target: 'canal' as RegionId },
                { x: 248, y: 268, nameAr: 'أسوان', nameEn: 'Aswan', target: 'upper' as RegionId },
                { x: 348, y: 298, nameAr: 'حلايب وشلاتين', nameEn: 'Halayeb', target: 'upper' as RegionId },
              ].map((c, i) => (
                <g
                  key={i}
                  onClick={() => setSelectedId(c.target)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={c.x} cy={c.y} r="3.2" fill="#7dd3fc" opacity="0.85" />
                  <text x={c.x} y={c.y - 6} fill="#cbd5e1" fontSize="8" textAnchor="middle" opacity="0.85">
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
                    : isAr ? 'الصعيد' : 'Upper Egypt';

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
                    {/* Animated Pulse Rings */}
                    {isActive && (
                      <>
                        <circle
                          cx={r.cx}
                          cy={r.cy}
                          r="18"
                          fill="none"
                          stroke={nodeColor}
                          strokeWidth="2.2"
                          className="eg-pulse-circle"
                        />
                        <circle
                          cx={r.cx}
                          cy={r.cy}
                          r="13"
                          fill={nodeColor}
                          opacity="0.28"
                        />
                      </>
                    )}

                    {/* Leader Line to Floating Badge */}
                    <line
                      x1={r.cx}
                      y1={r.cy}
                      x2={r.labelX}
                      y2={r.labelY}
                      stroke={isActive ? nodeColor : 'rgba(148, 163, 184, 0.45)'}
                      strokeWidth={isActive ? '1.6' : '1'}
                      strokeDasharray={isActive ? undefined : '2 2'}
                    />

                    {/* Hotspot Core Beacon */}
                    <circle
                      cx={r.cx}
                      cy={r.cy}
                      r={isActive ? '7.5' : '5.5'}
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth={isActive ? '2.4' : '1.5'}
                    />

                    {/* Floating HUD Callout Pill on Map */}
                    <g transform={`translate(${r.labelX - 48}, ${r.labelY - 12})`}>
                      <rect
                        width="96"
                        height="22"
                        rx="11"
                        fill={isActive ? nodeColor : 'rgba(6, 20, 31, 0.92)'}
                        stroke={isActive ? '#ffffff' : nodeColor}
                        strokeWidth={isActive ? '1.6' : '1'}
                      />
                      <text
                        x="48"
                        y="14.5"
                        fill={isActive ? '#041018' : '#f8fafc'}
                        fontSize="9.2"
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

          {/* Interactive Timeline Slider Bar (2018 -> 2026) with Auto-Play */}
          <div
            style={{
              background: 'rgba(4, 16, 24, 0.78)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              borderRadius: '14px',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  style={{
                    background: isPlaying ? '#ef4444' : '#0e9aa7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span>{isPlaying ? '⏸' : '▶'}</span>
                  <span>
                    {isPlaying
                      ? tr(lang, 'إيقاف العرض', 'Pause', 'Pause', 'Pausa')
                      : tr(lang, 'تشغيل التطور الزمني', 'Play Timeline', 'Animer', 'Animar')}
                  </span>
                </button>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {tr(lang, 'حرك المؤشر لمقارنة تطور المقاومة (2018–2026):', 'Slide to compare AMR progression (2018–2026):', 'Évolution 2018–2026 :', 'Evolución 2018–2026:')}
                </span>
              </div>
              <strong style={{ color: activeAccent, fontSize: '0.95rem' }}>{currentYear}</strong>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
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
                    padding: '2px 4px',
                    fontSize: '0.76rem',
                  }}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Morphing 6-Axis Spider Radar + Arc Gauge + Animated Microscopic Pathogens */}
        <div className="eg-glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
          {/* Active Region Title & Hospital Network Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid rgba(56, 189, 248, 0.18)', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ margin: '0 0 3px', fontSize: '1.15rem', color: '#ffffff' }}>
                📍 {pick(activeRegion.name, lang)}
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#7dd3fc', fontWeight: 600 }}>
                🏥 {pick(activeRegion.hospitals, lang)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                {pick(activeRegion.cities, lang)}
              </div>
            </div>

            <span
              style={{
                background: `${activeAccent}22`,
                color: activeAccent,
                border: `1px solid ${activeAccent}66`,
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '0.76rem',
                fontWeight: 700,
              }}
            >
              {stewardshipMode
                ? tr(lang, '🌿 بعد تطبيق الروشتة الخضرا والترشيد', '🌿 With Green Rx Stewardship', '🌿 Avec Ordonnance Verte', '🌿 Con Receta Verde')
                : pick(activeRegion.alertLabel, lang)}
            </span>
          </div>

          {/* Sub-Grid: 6-Axis Morphing Spider Radar + Semi-Circular Risk Speedometer */}
          <div
            style={{
              display: 'grid',
              gap: '12px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
              alignItems: 'center',
              background: 'rgba(4, 16, 24, 0.55)',
              borderRadius: '14px',
              padding: '12px',
              border: '1px solid rgba(56, 189, 248, 0.16)',
            }}
          >
            {/* 6-Axis Antibiogram Spider Radar Chart */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                🕸️ {tr(lang, 'رادار المقاومة لـ 6 عائلات مضادات', '6-Class Antibiogram Spider Radar', 'Radar d’Antibiogramme (6 Classes)', 'Radar de Antibiograma (6 Clases)')}
              </div>
              <svg viewBox="0 0 260 240" style={{ width: '100%', maxWidth: '235px', height: 'auto', marginInline: 'auto', display: 'block' }}>
                {/* Concentric Hexagonal Radar Webs (25%, 50%, 75%, 100%) */}
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

                {/* 6 Axis Spokes */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const [x, y] = getRadarPoint(i, 100);
                  return (
                    <line
                      key={i}
                      x1="130"
                      y1="125"
                      x2={x}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.25)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Rotating Subtle Radar Sweep Line */}
                <line
                  x1="130"
                  y1="125"
                  x2="130"
                  y2="47"
                  stroke={activeAccent}
                  strokeWidth="1.5"
                  opacity="0.45"
                  className="eg-radar-sweep"
                />

                {/* 2026 Baseline Ghost Polygon for Reference */}
                <polygon
                  points={baselinePolygonPoints}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.4)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />

                {/* Active Morphing Data Polygon */}
                <polygon
                  points={radarPolygonPoints}
                  fill={`${activeAccent}38`}
                  stroke={activeAccent}
                  strokeWidth="2.4"
                  style={{ transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />

                {/* Vertex Nodes & Axis Labels */}
                {activeRegion.radar.map((axis, idx) => {
                  const val = Math.round(axis.base2026 * yearFactor * simMultiplier);
                  const [vx, vy] = getRadarPoint(idx, val);
                  const [lx, ly] = getRadarPoint(idx, 122);
                  return (
                    <g key={axis.key}>
                      <circle
                        cx={vx}
                        cy={vy}
                        r="4"
                        fill="#ffffff"
                        stroke={activeAccent}
                        strokeWidth="2"
                        style={{ transition: 'all 0.45s ease' }}
                      />
                      <text
                        x={lx}
                        y={ly + 3}
                        fill="#e2e8f0"
                        fontSize="8.8"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {pick(axis.shortLabel, lang)} ({val}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Semi-Circular Risk Speedometer Gauge + Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px' }}>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700 }}>
                🎯 {tr(lang, 'متوسط مؤشر المقاومة بالإقليم', 'Regional Composite AMR Index', 'Indice Régional Moyen', 'Índice Regional Promedio')}
              </div>

              <svg viewBox="0 0 180 110" style={{ width: '165px', height: 'auto' }}>
                <defs>
                  <linearGradient id="egGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                {/* Background Track Arc */}
                <path
                  d="M 20,90 A 70,70 0 0,1 160,90"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Colored Gradient Arc */}
                <path
                  d="M 20,90 A 70,70 0 0,1 160,90"
                  fill="none"
                  stroke="url(#egGaugeGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="220"
                  strokeDashoffset={220 - (220 * Math.min(100, overallPct)) / 100}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                {/* Animated Speedometer Needle */}
                <g
                  transform={`translate(90, 90) rotate(${gaugeAngle})`}
                  style={{ transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <polygon points="-3,0 0,-62 3,0" fill="#ffffff" />
                  <circle cx="0" cy="0" r="6" fill={activeAccent} stroke="#ffffff" strokeWidth="2" />
                </g>
                <text x="90" y="76" fill="#ffffff" fontSize="20" fontWeight="800" textAnchor="middle">
                  {overallPct}%
                </text>
              </svg>

              <p style={{ margin: 0, fontSize: '0.79rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                {pick(activeRegion.summary, lang)}
              </p>
            </div>
          </div>

          {/* Microscopic Pathogen Cards with Segmented Glowing Bars */}
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7dd3fc' }}>
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
                    padding: '10px 12px',
                    display: 'grid',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Animated Microscopic Bacteria SVG Icon */}
                      <svg width="28" height="28" viewBox="0 0 32 32" className="eg-microbe-icon" style={{ flexShrink: 0 }}>
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
                        <b dir="ltr" style={{ fontSize: '0.86rem', color: '#ffffff', display: 'block' }}>
                          {p.name}
                        </b>
                        <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                          {pick(p.antibiotic, lang)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '1px 7px',
                          borderRadius: '999px',
                          background: p.whoClass === 'Reserve' ? 'rgba(239,68,68,0.2)' : p.whoClass === 'Watch' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                          color: p.whoClass === 'Reserve' ? '#fca5a5' : p.whoClass === 'Watch' ? '#fcd34d' : '#6ee7b7',
                          border: '1px solid currentColor',
                          fontWeight: 700,
                        }}
                      >
                        WHO {p.whoClass}
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: barColor, minWidth: '38px', textAlign: 'end' }}>
                        {pct}%
                      </strong>
                    </div>
                  </div>

                  {/* 16-Segment Sci-Fi Illuminated Meter Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '3px', height: '7px' }}>
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

          {/* Behavioral Driver & Stewardship Action Cards */}
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))' }}>
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
              <b style={{ display: 'block', fontSize: '0.78rem', color: '#fcd34d', marginBottom: '3px' }}>
                ⚠️ {tr(lang, 'أهم مسبب سلوكي مرصود:', 'Primary Behavioral Driver:', 'Facteur Comportemental :', 'Factor Conductual:')}
              </b>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#fef3c7', lineHeight: 1.5 }}>
                {pick(activeRegion.driver, lang)}
              </p>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
              <b style={{ display: 'block', fontSize: '0.78rem', color: '#6ee7b7', marginBottom: '3px' }}>
                🛡️ {tr(lang, 'الحل الإكلينيكي والتمريضي:', 'Clinical Stewardship Solution:', 'Solution Clinique :', 'Solución Clínica:')}
              </b>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#d1fae5', lineHeight: 1.5 }}>
                {pick(activeRegion.stewardshipAction, lang)}
              </p>
            </div>
          </div>

          {/* Footer Attribution & Quick Links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(56, 189, 248, 0.16)', paddingTop: '8px', fontSize: '0.73rem', color: '#94a3b8' }}>
            <span>
              📚 {tr(lang, 'المرجع: تقارير WHO GLASS • الخطة الوطنية المصرية NAP-AMR • دراسات الجامعات المصرية.', 'Refs: WHO GLASS • Egypt NAP-AMR • Egyptian University Hospital Studies.', 'Réf : OMS GLASS • Plan National Égyptien NAP-AMR.', 'Ref: OMS GLASS • Plan Nacional de Egipto NAP-AMR.')}
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
