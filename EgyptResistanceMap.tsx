import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';

interface PathogenBar {
  name: string;
  antibiotic: Bi;
  pct: number;
  risk: 'high' | 'critical' | 'moderate';
}

interface RegionData {
  id: 'delta' | 'cairo' | 'alex' | 'canal' | 'upper';
  name: Bi;
  cities: Bi;
  cx: number;
  cy: number;
  badgeColor: string;
  alertLevel: Bi;
  summary: Bi;
  mainDriver: Bi;
  stewardshipTip: Bi;
  pathogens: PathogenBar[];
}

const REGIONS: RegionData[] = [
  {
    id: 'delta',
    name: {
      ar: 'إقليم الدلتا (المنصورة وطنطا والزقازيق)',
      en: 'Nile Delta (Mansoura, Tanta & Zagazig)',
      fr: 'Delta du Nil (Mansourah, Tanta & Zagazig)',
      es: 'Delta del Nilo (Mansura, Tanta y Zagazig)',
    },
    cities: {
      ar: 'الدقهلية • الغربية • الشرقية • كفر الشيخ • دمياط',
      en: 'Dakahlia • Gharbia • Sharqia • Kafr El-Sheikh • Damietta',
      fr: 'Dakahlia • Gharbia • Charqia • Kafr El-Cheikh • Damiette',
      es: 'Dacalia • Garbía • الشرقية • Kafr el-Sheij • Damieta',
    },
    cx: 218,
    cy: 72,
    badgeColor: '#dc2626',
    alertLevel: {
      ar: 'مؤشر مرتفع — بكتيريا معوية منتجة لـ ESBL',
      en: 'High Alert — ESBL Enterobacterales',
      fr: 'Alerte Élevée — Entérobactéries BLSE',
      es: 'Alerta Alta — Enterobacterias BLEE',
    },
    summary: {
      ar: 'تُظهر دراسات الترصد الميكروبيولوجي في مستشفيات جامعات الدلتا والمراكز الطبية ارتفاع مقاومة الإشريكية القولونية (E. coli) والكلبسيلة الرئوية للجيل الثالث من السيفالوسبورينات بسبب الإفراط في صرف المضادات واسعة الطيف.',
      en: 'Microbiological surveillance across Delta university hospitals highlights elevated E. coli and Klebsiella resistance to 3rd-generation cephalosporins driven by empirical broad-spectrum overuse.',
      fr: 'La surveillance microbiologique dans les hôpitaux universitaires du Delta montre une résistance élevée d’E. coli et de Klebsiella aux céphalosporines de 3e génération.',
      es: 'La vigilancia microbiológica en hospitales universitarios del Delta muestra alta resistencia de E. coli y Klebsiella a cefalosporinas de 3.ª generación.',
    },
    mainDriver: {
      ar: 'استخدام حقن السيفترياكسون والسيفوتاكسيم والأموكسيسيلين/كلافولانات بدون مزرعة بكتيرية في عدوى المسالك والجهاز التنفسي.',
      en: 'Empiric use of injectable Ceftriaxone/Cefotaxime and Amoxicillin-Clavulanate without culture in respiratory and urinary infections.',
      fr: 'Usage empirique de la Ceftriaxone injectable et de l’Amoxicilline-Acide clavulanique sans antibiogramme préalable.',
      es: 'Uso empírico de Ceftriaxona inyectable y Amoxicilina-Clavulanato sin cultivo previo.',
    },
    stewardshipTip: {
      ar: 'الالتزام بمضادات فئة Access كخط أول، وطلب مزرعة بول قبل صرف السيفالوسبورينات أو الفلوروكينولونات.',
      en: 'Prioritize WHO Access antibiotics first-line and request urine culture before starting cephalosporins or fluoroquinolones.',
      fr: 'Privilégier les antibiotiques de la catégorie Access et demander un ECBU avant toute céphalosporine ou fluoroquinolone.',
      es: 'Priorizar antibióticos de la categoría Access y solicitar urocultivo antes de iniciar cefalosporinas o fluoroquinolonas.',
    },
    pathogens: [
      {
        name: 'E. coli (ESBL)',
        antibiotic: { ar: 'مقاومة السيفالوسبورينات جيل 3 (سيفترياكسون/سيفوتاكسيم)', en: '3rd-Gen Cephalosporin Resistance (Ceftriaxone)', fr: 'Résistance aux Céphalosporines 3G', es: 'Resistencia a Cefalosporinas 3G' },
        pct: 68,
        risk: 'critical',
      },
      {
        name: 'Klebsiella pneumoniae',
        antibiotic: { ar: 'مقاومة الفلوروكينولونات (سيبروفلوكساسين/ليفوفلوكساسين)', en: 'Fluoroquinolone Resistance (Ciprofloxacin)', fr: 'Résistance aux Fluoroquinolones', es: 'Resistencia a Fluoroquinolonas' },
        pct: 59,
        risk: 'high',
      },
      {
        name: 'Staphylococcus aureus (MRSA)',
        antibiotic: { ar: 'مقاومة البنسلينات المضادة للمكورات والبيتا-لاكتام', en: 'Methicillin / Beta-Lactam Resistance (MRSA)', fr: 'Résistance à la Méthicilline (SARM)', es: 'Resistencia a Meticilina (SARM)' },
        pct: 54,
        risk: 'high',
      },
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
      ar: 'القاهرة • الجيزة • شبرا الخيمة • بنها • حلوان',
      en: 'Cairo • Giza • Shubra El-Kheima • Banha • Helwan',
      fr: 'Le Caire • Gizeh • Choubra El-Kheima • Banha • Hélouan',
      es: 'El Cairo • Guiza • Shubra El-Kheima • Banha • Helwan',
    },
    cx: 214,
    cy: 112,
    badgeColor: '#dc2626',
    alertLevel: {
      ar: 'مؤشر حرج — بكتيريا المستشفيات والمجتمع',
      en: 'Critical Hub — High Urban & ICU Load',
      fr: 'Niveau Critique — Forte Densité Urbaine & USI',
      es: 'Nivel Crítico — Alta Carga Urbana y UCI',
    },
    summary: {
      ar: 'بسبب الكثافة السكانية العالية وإحالة الحالات الحرجة للمستشفيات المرجعية الكبرى، يظهر ارتفاع في مقاومة البكتيريا التنفسية للماكروليدات (أزيثرومايسين) ومقاومة الكلبسيلة والـ Acinetobacter في الرعايات المركزة.',
      en: 'High population density and tertiary ICU referrals drive elevated macrolide resistance in respiratory pathogens alongside multidrug-resistant Klebsiella in hospital settings.',
      fr: 'La forte densité urbaine et les soins intensifs tertiaires entraînent une résistance accrue aux macrolides et aux bêta-lactamines.',
      es: 'La alta densidad urbana y las derivaciones a UCI impulsan una elevada resistencia a macrólidos y betalactámicos.',
    },
    mainDriver: {
      ar: 'صرف الأزيثرومايسين وأوجمنتين لنزلات البرد الفيروسية وتكرار الكورسات دون استشارة طبية.',
      en: 'Self-medication with Azithromycin and Amoxicillin-Clavulanate for viral colds and sore throats.',
      fr: 'Automédication par Azithromycine et Amoxicilline-Clavulanate lors d’infections respiratoires virales.',
      es: 'Automedicación con Azitromicina y Amoxicilina-Clavulanato para resfriados virales.',
    },
    stewardshipTip: {
      ar: 'استخدام الروشتة الخضرا في نزلات البرد والإنفلونزا، وحماية مضادات الملاذ الأخير (ميرونيم/لينيزوليد) داخل المستشفيات فقط.',
      en: 'Use the Green Prescription for viral colds and strictly reserve Carbapenems and Linezolid for confirmed hospital MDR cases.',
      fr: 'Utiliser l’Ordonnance Verte pour les rhumes viraux et réserver les Carbapénèmes/Linézolide aux cas hospitaliers confirmés.',
      es: 'Usar la Receta Verde para resfriados virales y reservar Carbapenémicos/Linezolid para casos hospitalarios confirmados.',
    },
    pathogens: [
      {
        name: 'Klebsiella pneumoniae (MDR)',
        antibiotic: { ar: 'مقاومة السيفالوسبورينات واسعة الطيف', en: 'Broad-Spectrum Cephalosporin Resistance', fr: 'Résistance aux Céphalosporines', es: 'Resistencia a Cefalosporinas' },
        pct: 72,
        risk: 'critical',
      },
      {
        name: 'Streptococcus & Respiratory spp.',
        antibiotic: { ar: 'مقاومة الماكروليدات (أزيثرومايسين / كلاريثرومايسين)', en: 'Macrolide Resistance (Azithromycin)', fr: 'Résistance aux Macrolides (Azithromycine)', es: 'Resistencia a Macrólidos (Azitromicina)' },
        pct: 61,
        risk: 'high',
      },
      {
        name: 'E. coli (Community UTI)',
        antibiotic: { ar: 'مقاومة الأمبيسيلين/سولباكتام والكو-تريموكسازول', en: 'Aminopenicillin & Co-trimoxazole Resistance', fr: 'Résistance aux Aminopénicillines', es: 'Resistencia a Aminopenicilinas' },
        pct: 66,
        risk: 'high',
      },
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
      ar: 'الإسكندرية • دمنهور • كفر الدوار • مرسى مطروح',
      en: 'Alexandria • Damanhour • Kafr El-Dawar • Marsa Matrouh',
      fr: 'Alexandrie • Damanhour • Kafr El-Dawar • Marsa Matrouh',
      es: 'Alejandría • Damanhur • Kafr El-Dawar • Marsa Matruh',
    },
    cx: 165,
    cy: 66,
    badgeColor: '#d97706',
    alertLevel: {
      ar: 'مؤشر مرتفع — مقاومة تنفسية ومجتمعية',
      en: 'Elevated Alert — Community Respiratory & UTI AMR',
      fr: 'Alerte Élevée — Résistance Communautaire',
      es: 'Alerta Elevada — Resistencia Comunitaria',
    },
    summary: {
      ar: 'ترصد دراسات الإسكندرية والبحيرة معدلات ملحوظة من المكورات العنقودية الذهبية المقاومة للميثيسيلين (MRSA) في التهابات الجلد والجروح، مع زيادة مقاومة بكتيريا المسالك للفلوروكينولونات.',
      en: 'Regional surveillance in Alexandria and Beheira documents notable MRSA rates in skin/soft-tissue infections alongside rising fluoroquinolone resistance in community UTIs.',
      fr: 'Les études régionales à Alexandrie montrent des taux notables de SARM cutané et une résistance croissante aux fluoroquinolones.',
      es: 'Los estudios regionales en Alejandría muestran tasas notables de SARM cutáneo y creciente resistencia a fluoroquinolonas.',
    },
    mainDriver: {
      ar: 'إيقاف كورس المضاد الحيوي فور تحسن الأعراض بعد يومين أو ثلاثة، واستخدام بواقي المضادات المنزلية.',
      en: 'Prematurely stopping antibiotic courses after 2–3 days and sharing leftover household antibiotics.',
      fr: 'Arrêt prématuré du traitement après 2 ou 3 jours et réutilisation des boîtes entamées à domicile.',
      es: 'Suspensión prematura del tratamiento tras 2–3 días y reutilización de antibióticos sobrantes en casa.',
    },
    stewardshipTip: {
      ar: 'إكمال كورس العلاج للنهاية عبر «متابع كورس العلاج» والتخلص الآمن من بواقي الشراب والأقراص.',
      en: 'Complete the full prescribed course using the Treatment Tracker and safely dispose of leftover syrups.',
      fr: 'Terminer l’intégralité du traitement prescrit et éliminer les restes de sirops en toute sécurité.',
      es: 'Completar todo el tratamiento prescrito y desechar de forma segura los jarabes sobrantes.',
    },
    pathogens: [
      {
        name: 'E. coli (UTI Isolates)',
        antibiotic: { ar: 'مقاومة السيفالوسبورينات والأموكسيسيلين/كلافولانات', en: 'Beta-Lactam / Cephalosporin Resistance', fr: 'Résistance aux Bêta-lactamines', es: 'Resistencia a Betalactámicos' },
        pct: 63,
        risk: 'high',
      },
      {
        name: 'Staphylococcus aureus (MRSA)',
        antibiotic: { ar: 'مقاومة الميثيسيلين والأوكساسيلين', en: 'Methicillin / Oxacillin Resistance', fr: 'Résistance à l’Oxacilline (SARM)', es: 'Resistencia a Oxacilina (SARM)' },
        pct: 52,
        risk: 'high',
      },
      {
        name: 'Pseudomonas aeruginosa',
        antibiotic: { ar: 'مقاومة مضادات الزوائف في العدوى المكتسبة', en: 'Antipseudomonal Resistance in Wards', fr: 'Résistance de Pseudomonas', es: 'Resistencia de Pseudomonas' },
        pct: 44,
        risk: 'moderate',
      },
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
      ar: 'بورسعيد • الإسماعيلية • السويس • العريش • الغردقة',
      en: 'Port Said • Ismailia • Suez • Arish • Hurghada',
      fr: 'Port-Saïd • Ismaïlia • Suez • El-Arich • Hurghada',
      es: 'Puerto Saíd • Ismailía • Suez • El-Arish • Hurgada',
    },
    cx: 262,
    cy: 98,
    badgeColor: '#0e9aa7',
    alertLevel: {
      ar: 'مؤشر متوسط إلى مرتفع — تطبيق منظومة التأمين الشامل',
      en: 'Moderate-High — Active Stewardship Monitoring',
      fr: 'Modéré à Élevé — Surveillance Active du Bon Usage',
      es: 'Moderado-Alto — Vigilancia Activa del Uso Prudente',
    },
    summary: {
      ar: 'تشهد محافظات القناة تحسناً تدريجياً في حوكمة صرف المضادات داخل منشآت التأمين الصحي الشامل، مع استمرار الحاجة لترشيد صرف المضادات في الصيدليات العامة والعيادات الخارجية.',
      en: 'Canal governorates benefit from structured prescribing protocols in Universal Health Insurance facilities, though community outpatient stewardship remains essential.',
      fr: 'Les gouvernorats du Canal bénéficient de protocoles structurés d’assurance maladie universelle, mais la vigilance communautaire reste essentielle.',
      es: 'Las gobernaciones del Canal cuentan con protocolos estructurados, aunque sigue siendo clave evitar la automedicación comunitaria.',
    },
    mainDriver: {
      ar: 'الخلط بين النزلات المعوية الفيروسية أو الصيفية البسيطة والعدوى البكتيرية واستخدام السيبروفلوكساسين والفلاجيل عشوائياً.',
      en: 'Treating self-limiting viral summer gastroenteritis empirically with Ciprofloxacin and Metronidazole.',
      fr: 'Traitement empirique des gastro-entérites estivales virales par Ciprofloxacine et Métronidazole.',
      es: 'Tratamiento empírico de gastroenteritis virales de verano con Ciprofloxacino y Metronidazol.',
    },
    stewardshipTip: {
      ar: 'الاعتماد على محاليل الجفاف الفموية (ORS) في النزلات المعوية البسيطة وعدم البدء بمضاد حيوي إلا بتقييم طبي.',
      en: 'Rely on oral rehydration salts (ORS) for uncomplicated acute diarrhea and avoid empiric antibiotics without clinical evaluation.',
      fr: 'Privilégier la réhydratation orale (SRO) lors de diarrhées aiguës simples sans antibiotique systématique.',
      es: 'Priorizar sales de rehidratación oral (SRO) en diarreas agudas simples sin antibióticos empíricos.',
    },
    pathogens: [
      {
        name: 'Enterobacterales (ESBL)',
        antibiotic: { ar: 'مقاومة السيفالوسبورينات في عدوى المسالك', en: 'Cephalosporin Resistance in UTIs', fr: 'Résistance aux Céphalosporines (ITU)', es: 'Resistencia a Cefalosporinas (ITU)' },
        pct: 56,
        risk: 'high',
      },
      {
        name: 'Enteric Pathogens & E. coli',
        antibiotic: { ar: 'مقاومة الفلوروكينولونات (سيبروفار/سيبروباي)', en: 'Fluoroquinolone Resistance (Ciprofloxacin)', fr: 'Résistance aux Fluoroquinolones', es: 'Resistencia a Fluoroquinolonas' },
        pct: 49,
        risk: 'moderate',
      },
      {
        name: 'S. pneumoniae & Respiratory',
        antibiotic: { ar: 'نقص الحساسية للبنسلينات والماكروليدات', en: 'Reduced Penicillin / Macrolide Susceptibility', fr: 'Sensibilité réduite aux Macrolides', es: 'Sensibilidad reducida a Macrólidos' },
        pct: 45,
        risk: 'moderate',
      },
    ],
  },
  {
    id: 'upper',
    name: {
      ar: 'إقليم صعيد مصر (أسيوط والمنيا وسوهاج وأسوان)',
      en: 'Upper Egypt (Assiut, Minya, Sohag & Aswan)',
      fr: 'Haute-Égypte (Assiout, Minya, Sohag & Assouan)',
      es: 'Alto Egipto (Asiut, Minya, Sohag y Asuán)',
    },
    cities: {
      ar: 'الفيوم • بني سويف • المنيا • أسيوط • سوهاج • قنا • الأقصر • أسوان',
      en: 'Fayoum • Beni Suef • Minya • Assiut • Sohag • Qena • Luxor • Aswan',
      fr: 'Fayoum • Beni Suef • Minya • Assiout • Sohag • Qena • Louxor • Assouan',
      es: 'Fayún • Beni Suef • Minya • Asiut • Sohag • Qena • Lúxor • Asuán',
    },
    cx: 222,
    cy: 225,
    badgeColor: '#d97706',
    alertLevel: {
      ar: 'مؤشر مرتفع — استعمال الحقن وتركيبات البرد',
      en: 'High Alert — Empiric Injectables & Cold Mixes',
      fr: 'Alerte Élevée — Injectables Empiriques',
      es: 'Alerta Alta — Inyectables Empíricos',
    },
    summary: {
      ar: 'توضح دراسات مستشفيات جامعات الصعيد (أسيوط والمنيا وسوهاج) خطورة انتشار ما يُعرف شعبياً بـ «حقنة البرد» (خليط مضاد حيوي + كورتيزون + مسكن) وصرف حقن السيفالوسبورينات دون اختبار حساسية أو وصفة طبية.',
      en: 'Studies from Upper Egypt university hospitals highlight the danger of the non-prescribed "cold injection mix" (antibiotic + steroid + NSAID) and unmonitored injectable cephalosporin use.',
      fr: 'Les études des hôpitaux universitaires de Haute-Égypte soulignent le danger des mélanges injectables contre le rhume (antibiotique + corticoïde + AINS).',
      es: 'Los estudios de hospitales universitarios del Alto Egipto destacan el peligro de la «inyección para el resfriado» (antibiótico + corticoide + AINE).',
    },
    mainDriver: {
      ar: 'الطلب الشعبي على «حقنة البرد الثلاثية» وحقن المضادات الحيوية السريعة في نزلات البرد والتهاب الحلق للأطفال والبالغين.',
      en: 'Widespread demand for the hazardous "triple cold injection" and rapid injectable antibiotics for viral upper respiratory infections.',
      fr: 'Demande fréquente d’injections combinées contre le rhume et d’antibiotiques injectables pour des infections virales.',
      es: 'Demanda frecuente de la «inyección triple para el resfriado» y antibióticos inyectables para infecciones virales.',
    },
    stewardshipTip: {
      ar: 'الامتناع التام عن «حقنة البرد» لخطورتها البالغة على المناعة والكلى والقلب، ومراجعة فاحص الحساسية وحاسبة الأطفال قبل أي دواء.',
      en: 'Strictly avoid the "cold injection mix" due to severe anaphylaxis and organ risks, and always verify pediatric dosing by weight.',
      fr: 'Éviter strictement les injections combinées contre le rhume en raison du risque d’anaphylaxie grave.',
      es: 'Evitar estrictamente la «inyección para el resfriado» por su alto riesgo de choque anafiláctico.',
    },
    pathogens: [
      {
        name: 'E. coli & Klebsiella (ESBL)',
        antibiotic: { ar: 'مقاومة السيفالوسبورينات جيل 3 (سيفترياكسون/سيفوتاكسيم)', en: '3rd-Gen Cephalosporin Resistance', fr: 'Résistance aux Céphalosporines 3G', es: 'Resistencia a Cefalosporinas 3G' },
        pct: 65,
        risk: 'critical',
      },
      {
        name: 'Staphylococcus aureus (MRSA)',
        antibiotic: { ar: 'مقاومة البيتا-لاكتام في عدوى الجروح والجلد', en: 'Beta-Lactam Resistance in Wound Infections', fr: 'Résistance aux Bêta-lactamines (SARM)', es: 'Resistencia a Betalactámicos (SARM)' },
        pct: 55,
        risk: 'high',
      },
      {
        name: 'Salmonella & Enteric spp.',
        antibiotic: { ar: 'تراجع الحساسية للأمبيسيلين والسيبروفلوكساسين', en: 'Reduced Ampicillin & Ciprofloxacin Susceptibility', fr: 'Sensibilité réduite à la Ciprofloxacine', es: 'Sensibilidad reducida a Ciprofloxacino' },
        pct: 48,
        risk: 'moderate',
      },
    ],
  },
];

export default function EgyptResistanceMap() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [selectedId, setSelectedId] = useState<RegionData['id']>('delta');

  const activeRegion = REGIONS.find((r) => r.id === selectedId) || REGIONS[0];

  return (
    <section
      className="card"
      style={{
        border: '1.5px solid rgba(14, 154, 167, 0.35)',
        background: 'linear-gradient(145deg, var(--card-bg) 0%, var(--tint) 100%)',
        padding: '22px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="head" style={{ marginBottom: '14px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(14, 154, 167, 0.14)', color: 'var(--teal-dark)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
            <span>🗺️</span>
            <span>
              {tr(
                lang,
                'مرصد المقاومة البكتيرية الإقليمي • بيانات توعوية استرشادية',
                'Regional AMR Surveillance Atlas • Educational Infographic',
                'Atlas Régional de Surveillance AMR • Infographie Éducative',
                'Atlas Regional de Vigilancia RAM • Infografía Educativa'
              )}
            </span>
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem' }}>
            🇪🇬{' '}
            {tr(
              lang,
              'خريطة مقاومة المضادات الحيوية في مصر (صورة بيانية تفاعلية)',
              'Egypt Antibiotic Resistance Interactive Infographic Map',
              'Carte Infographique Interactive de l’Antibiorésistance en Égypte',
              'Mapa Infográfico Interactivo de Resistencia a los Antibióticos en Egipto'
            )}
          </h2>
          <p className="small muted" style={{ margin: 0, maxWidth: '72ch' }}>
            {tr(
              lang,
              'اضغط على أي إقليم على خريطة مصر أو من الأزرار أدناه لاستكشاف أبرز أنماط البكتيريا المقاومة المسجلة في الدراسات الجامعية المصرية، وأهم مسبباتها السلوكية، وكيف نحمي مجتمعنا منها:',
              'Click any region on the Egypt map or the tabs below to explore key resistant bacteria patterns reported in Egyptian university hospital surveillance studies, primary drivers, and stewardship actions:',
              'Cliquez sur une région de la carte d’Égypte pour explorer les principaux profils de résistance bactérienne rapportés dans les études hospitalières universitaires :',
              'Haga clic en cualquier región del mapa de Egipto para explorar los principales patrones de resistencia bacteriana reportados en estudios hospitalarios universitarios:'
            )}
          </p>
        </div>
      </div>

      {/* Region Selector Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }} role="tablist">
        {REGIONS.map((r) => {
          const isSelected = r.id === selectedId;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedId(r.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: isSelected ? `2px solid ${r.badgeColor}` : '1px solid var(--line)',
                background: isSelected ? r.badgeColor : 'var(--card-bg)',
                color: isSelected ? '#ffffff' : 'var(--ink)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isSelected ? '#ffffff' : r.badgeColor,
                  display: 'inline-block',
                }}
              />
              {r.id === 'delta' && tr(lang, 'الدلتا والمنصورة', 'Nile Delta', 'Delta du Nil', 'Delta del Nilo')}
              {r.id === 'cairo' && tr(lang, 'القاهرة الكبرى', 'Greater Cairo', 'Grand Caire', 'Gran El Cairo')}
              {r.id === 'alex' && tr(lang, 'الإسكندرية والبحيرة', 'Alexandria & Coast', 'Alexandrie', 'Alejandría')}
              {r.id === 'canal' && tr(lang, 'قناة السويس وسيناء', 'Suez Canal & Sinai', 'Canal de Suez & Sinaï', 'Canal de Suez y Sinaí')}
              {r.id === 'upper' && tr(lang, 'صعيد مصر', 'Upper Egypt', 'Haute-Égypte', 'Alto Egipto')}
            </button>
          );
        })}
      </div>

      {/* Interactive Grid: Map SVG + Data Panel */}
      <div
        style={{
          display: 'grid',
          gap: '18px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          alignItems: 'stretch',
        }}
      >
        {/* Left/Right Column: Interactive Stylized Map of Egypt */}
        <div
          className="card"
          style={{
            background: '#091e2c',
            color: '#e2f1f8',
            border: '1px solid rgba(23, 184, 196, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px',
            borderRadius: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: '#90cad8', fontWeight: 600 }}>
              🧭 {tr(lang, 'خريطة الرصد التفاعلية — اضغط على النقاط المضيئة', 'Interactive Surveillance Map — Click Hotspots', 'Carte Interactive — Cliquez sur les Points', 'Mapa Interactivo — Toque los Puntos')}
            </span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(23,184,196,0.18)', color: '#22d3ee', padding: '2px 8px', borderRadius: '999px' }}>
              WHO GLASS / NAP-AMR
            </span>
          </div>

          <div style={{ width: '100%', maxWidth: '370px', marginInline: 'auto' }}>
            <svg
              viewBox="0 0 380 340"
              style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))' }}
              role="img"
              aria-label={tr(lang, 'خريطة مصر التفاعلية لمقاومة المضادات الحيوية', 'Interactive map of Egypt showing antibiotic resistance regions', 'Carte interactive de l’Égypte', 'Mapa interactivo de Egipto')}
            >
              <defs>
                <linearGradient id="egyptLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#12384f" />
                  <stop offset="100%" stopColor="#0b2434" />
                </linearGradient>
                <linearGradient id="deltaFanGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.35)" />
                  <stop offset="100%" stopColor="rgba(14, 154, 167, 0.08)" />
                </linearGradient>
              </defs>

              {/* Subtle Coordinate Grid Lines */}
              <g stroke="rgba(144, 202, 216, 0.08)" strokeWidth="1">
                <line x1="0" y1="70" x2="380" y2="70" />
                <line x1="0" y1="140" x2="380" y2="140" />
                <line x1="0" y1="210" x2="380" y2="210" />
                <line x1="0" y1="280" x2="380" y2="280" />
                <line x1="90" y1="0" x2="90" y2="340" />
                <line x1="180" y1="0" x2="180" y2="340" />
                <line x1="270" y1="0" x2="270" y2="340" />
              </g>

              {/* Mediterranean & Red Sea Labels */}
              <text x="155" y="26" fill="#64a6bd" fontSize="10" fontWeight="600" textAnchor="middle" opacity="0.8">
                {isAr ? 'البحر الأبيض المتوسط' : 'Mediterranean Sea'}
              </text>
              <text x="328" y="235" fill="#64a6bd" fontSize="9.5" fontWeight="600" textAnchor="middle" opacity="0.75" transform="rotate(62 328 235)">
                {isAr ? 'البحر الأحمر' : 'Red Sea'}
              </text>

              {/* Main Egypt Border Polygon */}
              <path
                d="M 52,54 L 118,58 L 160,48 L 200,40 L 245,48 L 272,54 L 260,96 L 246,118 L 265,152 L 295,212 L 322,292 L 328,312 L 70,312 L 62,215 L 48,118 Z"
                fill="url(#egyptLandGrad)"
                stroke="#22d3ee"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Sinai Peninsula Polygon */}
              <path
                d="M 274,54 L 336,62 L 342,102 L 306,162 L 284,126 L 266,94 Z"
                fill="url(#egyptLandGrad)"
                stroke="#22d3ee"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Nile Delta Fan Highlight */}
              <path
                d="M 168,52 L 214,108 L 254,54 Q 212,38 168,52 Z"
                fill="url(#deltaFanGrad)"
                stroke="rgba(34, 211, 238, 0.45)"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />

              {/* Nile River Path (Aswan to Delta Branches) */}
              <path
                d="M 235,312 C 242,282 238,255 228,232 C 216,205 198,182 206,154 C 212,135 214,122 214,108"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Rosetta & Damietta Nile Branches */}
              <path
                d="M 214,108 Q 192,80 176,50 M 214,108 Q 232,78 242,48"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Lake Nasser */}
              <path
                d="M 222,312 Q 232,296 238,284"
                fill="none"
                stroke="#0284c7"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Interactive Region Hotspots */}
              {REGIONS.map((r) => {
                const active = r.id === selectedId;
                const labelShort =
                  r.id === 'delta'
                    ? isAr ? 'الدلتا (المنصورة)' : 'Delta'
                    : r.id === 'cairo'
                    ? isAr ? 'القاهرة الكبرى' : 'Cairo'
                    : r.id === 'alex'
                    ? isAr ? 'الإسكندرية' : 'Alexandria'
                    : r.id === 'canal'
                    ? isAr ? 'القناة وسيناء' : 'Canal & Sinai'
                    : isAr ? 'صعيد مصر' : 'Upper Egypt';

                const labelOffsetY = r.id === 'cairo' ? 24 : r.id === 'delta' ? -15 : -14;
                const labelOffsetX = r.id === 'alex' ? -12 : r.id === 'canal' ? 14 : 0;

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
                    {/* Outer Pulse Ring for Selected Region */}
                    {active && (
                      <>
                        <circle
                          cx={r.cx}
                          cy={r.cy}
                          r={22}
                          fill="none"
                          stroke={r.badgeColor}
                          strokeWidth="2"
                          opacity="0.45"
                        />
                        <circle
                          cx={r.cx}
                          cy={r.cy}
                          r={15}
                          fill={r.badgeColor}
                          opacity="0.25"
                        />
                      </>
                    )}

                    {/* Main Interactive Node */}
                    <circle
                      cx={r.cx}
                      cy={r.cy}
                      r={active ? 9.5 : 7}
                      fill={active ? r.badgeColor : '#1e293b'}
                      stroke="#ffffff"
                      strokeWidth={active ? 2.5 : 1.8}
                    />

                    {/* Region Map Label */}
                    <rect
                      x={r.cx + labelOffsetX - 44}
                      y={r.cy + labelOffsetY - 11}
                      width="88"
                      height="17"
                      rx="8.5"
                      fill={active ? r.badgeColor : 'rgba(15, 23, 42, 0.85)'}
                      stroke={active ? '#ffffff' : 'rgba(148, 163, 184, 0.4)'}
                      strokeWidth="1"
                    />
                    <text
                      x={r.cx + labelOffsetX}
                      y={r.cy + labelOffsetY + 1}
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight={active ? '700' : '500'}
                      textAnchor="middle"
                    >
                      {labelShort}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid rgba(144,202,216,0.18)', paddingTop: '10px', marginTop: '8px', fontSize: '0.76rem', color: '#cbd5e1' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
              {tr(lang, 'أولوية قصوى (>60%)', 'Critical (>60%)', 'Critique (>60%)', 'Crítico (>60%)')}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
              {tr(lang, 'مرتفع (50–60%)', 'High (50–60%)', 'Élevé (50–60%)', 'Alto (50–60%)')}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0e9aa7', display: 'inline-block' }} />
              {tr(lang, 'متوسط المراقبة', 'Active Watch', 'Surveillance', 'Vigilancia')}
            </span>
          </div>
        </div>

        {/* Right/Left Column: Detailed Regional Infographic Card */}
        <div className="card stack" style={{ margin: 0, justifyContent: 'space-between' }}>
          <div className="stack" style={{ gap: '12px' }}>
            <div className="head" style={{ alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: '1.15rem', color: 'var(--navy)' }}>
                  📍 {pick(activeRegion.name, lang)}
                </h3>
                <p className="small muted" style={{ margin: 0 }}>
                  {pick(activeRegion.cities, lang)}
                </p>
              </div>
              <span
                className="badge"
                style={{
                  background: `${activeRegion.badgeColor}18`,
                  color: activeRegion.badgeColor,
                  borderColor: `${activeRegion.badgeColor}45`,
                  fontWeight: 700,
                  padding: '4px 10px',
                }}
              >
                {pick(activeRegion.alertLevel, lang)}
              </span>
            </div>

            <p className="small" style={{ margin: 0, lineHeight: 1.65 }}>
              {pick(activeRegion.summary, lang)}
            </p>

            {/* Pathogen Resistance Bars */}
            <div className="subcard" style={{ background: 'var(--bg)', gap: '10px', padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--navy)' }}>
                🔬{' '}
                {tr(
                  lang,
                  'متوسط نسب المقاومة المسجلة في الدراسات المرجعية بالإقليم:',
                  'Estimated Resistance Rates in Regional Surveillance Studies:',
                  'Taux de Résistance Estimés dans les Études Régionales :',
                  'Tasas de Resistencia Estimadas en Estudios Regionales:'
                )}
              </div>

              {activeRegion.pathogens.map((p, idx) => {
                const barColor =
                  p.risk === 'critical' ? '#dc2626' : p.risk === 'high' ? '#d97706' : '#0e9aa7';
                return (
                  <div key={idx} style={{ display: 'grid', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                      <span>
                        <b dir="ltr" style={{ color: 'var(--ink)' }}>{p.name}</b> —{' '}
                        <span className="muted">{pick(p.antibiotic, lang)}</span>
                      </span>
                      <b style={{ color: barColor, whiteSpace: 'nowrap' }}>{p.pct}%</b>
                    </div>
                    <div style={{ height: '8px', background: 'var(--line)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${p.pct}%`,
                          background: barColor,
                          borderRadius: '999px',
                          transition: 'width 0.35s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Key Driver & Stewardship Action */}
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--warn-bg)', border: '1px solid var(--warn-line)' }}>
                <b style={{ display: 'block', fontSize: '0.82rem', marginBottom: '3px', color: '#92400e' }}>
                  ⚠️ {tr(lang, 'أهم سبب سلوكي مرصود:', 'Primary Behavioral Driver:', 'Facteur Comportemental Principal :', 'Factor Conductual Principal:')}
                </b>
                <p className="small" style={{ margin: 0 }}>
                  {pick(activeRegion.mainDriver, lang)}
                </p>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--tint)', border: '1px solid var(--teal)' }}>
                <b style={{ display: 'block', fontSize: '0.82rem', marginBottom: '3px', color: 'var(--teal-dark)' }}>
                  🛡️ {tr(lang, 'توصية ترشيد المضادات:', 'Stewardship Action:', 'Action de Bon Usage :', 'Acción de Uso Prudente:')}
                </b>
                <p className="small" style={{ margin: 0 }}>
                  {pick(activeRegion.stewardshipTip, lang)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Sources & Quick Action */}
          <div className="head" style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', marginTop: '6px' }}>
            <span className="small muted" style={{ fontSize: '0.76rem' }}>
              📚{' '}
              {tr(
                lang,
                'المصادر: تقارير منظمة الصحة العالمية (WHO GLASS) • الخطة الوطنية المصرية لمكافحة المقاومة (NAP-AMR) • أبحاث المستشفيات الجامعية المصرية.',
                'Sources: WHO GLASS Reports • Egypt National Action Plan for AMR (NAP-AMR) • Egyptian University Hospital Surveillance.',
                'Sources : Rapports OMS GLASS • Plan d’Action National Égyptien (NAP-AMR) • Études Universitaires.',
                'Fuentes: Informes OMS GLASS • Plan de Acción Nacional de Egipto (NAP-AMR) • Estudios Universitarios.'
              )}
            </span>
            <Link to="/green-prescription" className="btn small" style={{ whiteSpace: 'nowrap' }}>
              🌿 {tr(lang, 'جرب الروشتة الخضرا', 'Try Green Rx', 'Ordonnance Verte', 'Receta Verde')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
