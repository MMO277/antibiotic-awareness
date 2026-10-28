import { CSSProperties, FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES } from './articlesData';
import { pick, tr } from './types';
import Disclaimer from './Disclaimer';
import DidYouKnow from './DidYouKnow';
import ResistanceCounter from './ResistanceCounter';
import EgyptResistanceMap from './EgyptResistanceMap';
import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
} from './egyptianDrugDatabase';
import { norm } from './search';

export default function Home() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [showAllClinicalTools, setShowAllClinicalTools] = useState(false);

  const go = (e: FormEvent) => {
    e.preventDefault();
    nav(`/medicines?q=${encodeURIComponent(q)}`);
  };

  // Instant live autocomplete results from the 206 commercial packages & 32 active ingredients
  const quickMatches = useMemo(() => {
    const clean = norm(q);
    if (clean.length < 2) return [];
    return EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => {
      const hay = norm(
        `${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.barcode || ''} ${p.manufacturer}`
      );
      return hay.includes(clean);
    }).slice(0, 6);
  }, [q]);

  const { verifiedBarcodesCount, manufacturersCount } = useMemo(() => {
    let verified = 0;
    const makers = new Set<string>();
    for (const p of EGYPTIAN_COMMERCIAL_PRODUCTS) {
      if (p.barcode) verified++;
      if (p.manufacturer) makers.add(p.manufacturer);
    }
    return { verifiedBarcodesCount: verified, manufacturersCount: makers.size };
  }, []);

  const clinicalTools = [
    {
      to: '/cost-saver',
      icon: '💰',
      badge: tr(lang, 'جديد • توفير ونواقص', 'NEW • Cost Saver', 'NOUVEAU • Économies', 'NUEVO • Ahorro'),
      title: tr(
        lang,
        'حاسبة «البديل الأرخص بنفس الكفاءة» والمثائل المتطابقة',
        'Smart Generic Cost Saver & Identical Equivalents',
        'Calculateur d’Économies Génériques & Équivalents Exactes',
        'Calculadora de Ahorro en Genéricos y Equivalentes Exactos'
      ),
      desc: tr(
        lang,
        'ابحث عن الدواء الموصوف لك لعرض البدائل المصرية المرخصة المتطابقة 100% في المادة الفعالة والتركيز وحساب قيمة التوفير بالجنيه.',
        'Find 100% identical EDA-licensed generic equivalents with the exact same active ingredient and strength and calculate your EGP savings.',
        'Trouvez les génériques homologués 100% identiques et calculez vos économies immédiates.',
        'Encuentra genéricos autorizados 100% idénticos y calcula tu ahorro inmediato en EGP.'
      ),
      color: '#16a34a',
    },
    {
      to: '/cold-shot-warning',
      icon: '💉',
      badge: tr(lang, 'تحذير عاجل • 3×1', 'URGENT • 3-in-1 Myth', 'ALERTE • Injection 3-en-1', 'ALERTA • Inyección 3 en 1'),
      title: tr(
        lang,
        'فاحص خطر «حقنة البرد / الخلطة السحرية 3×1»',
        'The 3-in-1 "Cold Shot" Cocktail Mythbuster',
        'Dangers de « l’Injection Miracle 3-en-1 » contre le Rhume',
        'Peligros de la «Inyección Mágica 3 en 1» para el Resfriado'
      ),
      desc: tr(
        lang,
        'اكشف بالتفصيل العلمي ومختبر المحاكاة التفاعلي لماذا يُعد خلط المضاد الحيوي والكورتيزون والمسكن في سرنجة واحدة خطراً قاتلاً.',
        'Interactive simulation revealing why mixing Ceftriaxone, Dexamethasone, and NSAIDs for viral colds can cause fatal anaphylaxis and kidney failure.',
        'Simulation interactive expliquant pourquoi mélanger antibiotique, corticoïde et AINS dans une seringue est mortel.',
        'Simulación interactiva que explica por qué mezclar antibiótico, corticoide y AINE en una jeringa puede ser mortal.'
      ),
      color: '#dc2626',
    },
    {
      to: '/daily-schedule',
      icon: '📅',
      badge: tr(lang, 'جديد • واتساب وطباعة', 'NEW • PNG & WhatsApp', 'NOUVEAU • PNG & WhatsApp', 'NUEVO • PNG y WhatsApp'),
      title: tr(
        lang,
        'مولّد جدول الجرعات اليومي (حفظ كصورة، واتساب، وطباعة)',
        'Daily Dose Schedule Generator (PNG Image, WhatsApp & Print)',
        'Générateur de Planning Quotidien (Image PNG, WhatsApp & Impression)',
        'Generador de Horario Diario (Imagen PNG, WhatsApp e Impresión)'
      ),
      desc: tr(
        lang,
        'حدد موعد استيقاظك وأدويتك ليصمم الموقع جدولاً ملوناً بمواعيد كل قرص وتعليمات الطعام جاهزاً للحفظ كصورة أو الإرسال على واتساب.',
        'Enter your wake-up time and medications to generate a color-coded schedule with meal rules ready to download as PNG or share on WhatsApp.',
        'Créez un calendrier horaire coloré téléchargeable en image PNG ou partageable sur WhatsApp.',
        'Crea un horario diario en imagen PNG o compártelo directamente por WhatsApp.'
      ),
      color: '#0d9488',
    },
    {
      to: '/games',
      icon: '🎮',
      badge: tr(lang, 'جديد • 3D & 2D', 'NEW • 3D & 2D', 'NOUVEAU • 3D & 2D', 'NUEVO • 3D y 2D'),
      title: tr(
        lang,
        'مركز الألعاب ومحاكي الحياة الطبية ثلاثي الأبعاد (3D)',
        'Game Center & 3D Medical Life Simulator',
        'Centre de Jeux & Simulateur Médical 3D',
        'Centro de Juegos y Simulador Médico 3D'
      ),
      desc: tr(
        lang,
        'تجول داخل جناح المستشفى ثلاثي الأبعاد (WebGL 3D) وتفاعل مع الطبيب والممرضة والصيدلي في 5 سيناريوهات سريرية، أو العب صائد البكتيريا.',
        'Explore a genuine 3D cartoon hospital ward with 5 branching clinical stewardship scenarios, or play Bacteria Hunter.',
        'Explorez un service hospitalier 3D interactif avec 5 scénarios cliniques de bon usage des antibiotiques, ou jouez à Chasseur de Bactéries.',
        'Explora una planta hospitalaria 3D interactiva con 5 escenarios clínicos de uso prudente de antibióticos o juega al Cazador de Bacterias.'
      ),
      color: '#0e9aa7',
    },
    {
      to: '/prescription-radar',
      icon: '📡',
      badge: tr(lang, 'رادار ومواعيد 24س', 'Rx Radar 24h', 'Radar Rx 24h', 'Radar Rx 24h'),
      title: tr(
        lang,
        'رادار فحص الروشتة الكاملة ومنظم مواعيد اليوم',
        'Full Prescription Radar & 24h Smart Scheduler',
        'Radar d’Ordonnance Complète & Planificateur 24h',
        'Radar de Receta Completa y Horario Inteligente 24h'
      ),
      desc: tr(
        lang,
        'افحص تعارض المضاد الحيوي مع باقي أدوية الروشتة والمكملات واحصل على جدول زمني يومي يفصل بينها بالساعة.',
        'Screen your full prescription for multi-drug conflicts and get an optimized 24-hour daily schedule.',
        'Analysez votre ordonnance pour détecter les interactions médicamenteuses et obtenez un calendrier horaire sur 24 heures.',
        'Analiza tu receta completa para detectar conflictos entre medicamentos y obtén un horario diario optimizado de 24 horas.'
      ),
      color: '#0284c7',
    },
    {
      to: '/green-prescription',
      icon: '🌿',
      badge: tr(lang, 'رعاية ذاتية', 'Green Rx', 'Ordonnance Verte', 'Receta Verde'),
      title: tr(
        lang,
        'الروشتة الخضرا الذكية (بديل المضاد الحيوي)',
        'Green Prescription (Self-Care Plan)',
        'Ordonnance Verte Intelligente (Soins sans antibiotique)',
        'Receta Verde Inteligente (Plan de Autocuidado)'
      ),
      desc: tr(
        lang,
        'تقييم آمن للأعراض البسيطة (برد، كحة، احتقان حلق، إسهال) وإصدار بطاقة رعاية ذاتية قابلة للطباعة بدون مضاد حيوي.',
        'Safe symptom triage and printable non-antibiotic self-care plan for colds, cough, sore throat, and diarrhea.',
        'Évaluation sûre des symptômes courants (rhume, toux, mal de gorge) et plan de soins imprimable sans antibiotique.',
        'Evaluación segura de síntomas leves (resfriado, tos, dolor de garganta) y plan imprimible de alivio sin antibióticos.'
      ),
      color: '#15803d',
    },
    {
      to: '/medicines',
      icon: '💊',
      badge: tr(lang, '206 مستحضرات', '206 Packages', '206 Spécialités', '206 Envases'),
      title: tr(
        lang,
        'السجل الدوائي المصري والبدائل',
        'Egyptian Drug Registry & Alternatives',
        'Registre des Antibiotiques & Équivalents Génériques',
        'Registro de Antibióticos y Alternativas Genéricas'
      ),
      desc: tr(
        lang,
        'قاعدة بيانات موسعة للمضادات الحيوية في مصر بالأسعار الرسمية والبدائل المتطابقة والباركود.',
        'Comprehensive directory of Egyptian antibiotics with official prices, exact generics, and barcodes.',
        'Répertoire complet de 32 principes actifs et 206 présentations avec équivalents génériques, codes-barres et prix indicatifs.',
        'Directorio completo de 32 principios activos y 206 presentaciones con genéricos equivalentes, códigos de barras y precios.'
      ),
      color: '#0284c7',
    },
    {
      to: '/compare',
      icon: '⚖️',
      badge: tr(lang, 'مقارنة فورية', 'Side-by-Side', 'Comparaison', 'Comparación'),
      title: tr(
        lang,
        'مقارنة دواءين أو عبوتين جنباً إلى جنب',
        'Compare 2 Antibiotics Side-by-Side',
        'Comparer 2 Antibiotiques Côte à Côte',
        'Comparar 2 Antibióticos Lado a Lado'
      ),
      desc: tr(
        lang,
        'قارن بين أي عبوتين تجاريتين في السعر والتكافؤ، أو قارن مادتين فعالتين في الطيف والجرعة والحمل والكلى.',
        'Compare any two packages for equivalence and savings, or two active ingredients across 12 clinical rows.',
        'Comparez deux spécialités commerciales ou deux principes actifs sur 12 critères cliniques (spectre, grossesse, reins).',
        'Compara dos presentaciones comerciales o dos principios activos en 12 criterios clínicos (espectro, embarazo, riñón).'
      ),
      color: '#4f46e5',
    },
    {
      to: '/scan',
      icon: '📷',
      badge: tr(lang, 'كاميرا ذكية', 'Smart Scanner', 'Scanner Intelligent', 'Escáner Inteligente'),
      title: tr(
        lang,
        'ماسح الباركود الخطي للعلبة',
        'Carton Barcode & QR Scanner',
        'Scanner de Code-Barres & QR sur Boîte',
        'Escáner de Código de Barras y QR del Envase'
      ),
      desc: tr(
        lang,
        'وجّه كاميرا الهاتف نحو الباركود الخطي المطبوع على علبة الدواء لفتح السعر والجرعات والبدائل فوراً.',
        'Point your phone camera at any Egyptian medicine box barcode to open clinical details instantly.',
        'Pointez la caméra de votre téléphone vers le code-barres d’une boîte de médicament pour ouvrir sa fiche clinique.',
        'Apunta la cámara de tu teléfono al código de barras de la caja del medicamento para abrir su ficha clínica al instante.'
      ),
      color: '#0d9488',
    },
    {
      to: '/allergy-checker',
      icon: '🛡️',
      badge: tr(lang, 'أمان المريض', 'Patient Safety', 'Sécurité Patient', 'Seguridad del Paciente'),
      title: tr(
        lang,
        'فاحص الحساسية والتفاعلات المتصالبة',
        'Drug Allergy & Cross-Reactivity Checker',
        'Vérificateur d’Allergies & Réactivité Croisée',
        'Verificador de Alergias y Reactividad Cruzada'
      ),
      desc: tr(
        lang,
        'تحقق من أمان المضاد الحيوي واكتشف الحساسية المتقاطعة بين البنسلينات والسيفالوسبورينات.',
        'Screen antibiotics against your allergy history and detect beta-lactam cross-reactivity.',
        'Vérifiez la sécurité d’un antibiotique selon vos antécédents d’allergie et détectez les réactions croisées aux bêta-lactamines.',
        'Verifica la seguridad del antibiótico según tu historial de alergias y detecta la reactividad cruzada entre betalactámicos.'
      ),
      color: '#dc2626',
    },
    {
      to: '/pediatric-helper',
      icon: '👶',
      badge: tr(lang, 'حاسبة أطفال', 'Pediatrics', 'Pédiatrie', 'Pediatría'),
      title: tr(
        lang,
        'حاسبة جرعات الأطفال ومحاكي السرنجة',
        'Pediatric Dosage & Syringe Simulator',
        'Calculateur Pédiatrique & Simulateur de Seringue',
        'Calculadora Pediátrica y Simulador de Jeringa'
      ),
      desc: tr(
        lang,
        'حساب دقيق لجرعات شراب الأطفال بالملي حسب الوزن مع رسم توضيحي للسرنجة وتتبع صلاحية الشراب.',
        'Weight-based suspension dosing calculator with visual syringe level and 14-day expiry tracker.',
        'Calculateur de dose en mL selon le poids de l’enfant avec visualisation sur seringue graduée et suivi de conservation.',
        'Calculadora de dosis en mL según el peso del niño con visualización de jeringa oral y seguimiento de caducidad.'
      ),
      color: '#7c3aed',
    },
    {
      to: '/interactions',
      icon: '⚡',
      badge: tr(lang, 'تداخلات', 'Interactions', 'Interactions', 'Interacciones'),
      title: tr(
        lang,
        'فاحص التداخلات الدوائية والغذائية',
        'Drug & Food Interaction Checker',
        'Vérificateur d’Interactions Médicamenteuses & Alimentaires',
        'Verificador de Interacciones con Fármacos y Alimentos'
      ),
      desc: tr(
        lang,
        'افحص تعارض المضاد الحيوي مع منتجات الألبان، مكملات الحديد والكالسيوم، وأدوية السيولة والقلب.',
        'Check interactions between antibiotics and dairy, iron, calcium antacids, warfarin, and statins.',
        'Vérifiez les interactions entre les antibiotiques et les produits laitiers, le fer, le calcium, les anticoagulants et les statines.',
        'Comprueba las interacciones entre antibióticos y lácteos, hierro, calcio, antiácidos, anticoagulantes y estatinas.'
      ),
      color: '#d97706',
    },
    {
      to: '/health-profile',
      icon: '👤',
      badge: tr(lang, 'ملف شخصي', 'Health Profile', 'Profil Santé', 'Perfil de Salud'),
      title: tr(
        lang,
        'ملف صحتي وحساسيتي الدوائية',
        'My Health & Allergy Profile',
        'Mon Profil Santé & Allergies Médicamenteuses',
        'Mi Perfil de Salud y Alergias Medicamentosas'
      ),
      desc: tr(
        lang,
        'احفظ سجل حساسيتك الدوائية ووظائف الكلى والكبد محلياً على جهازك لفحص أي دواء تلقائياً.',
        'Store your personal drug allergies and clinical conditions locally for personalized alerts.',
        'Enregistrez vos allergies et antécédents rénaux/hépatiques sur votre appareil pour un contrôle personnalisé automatique.',
        'Guarda tus alergias medicamentosas y condiciones clínicas en tu dispositivo para recibir alertas personalizadas.'
      ),
      color: '#2563eb',
    },
    {
      to: '/tracker',
      icon: '⏱️',
      badge: tr(lang, 'التزام علاجي', 'Adherence', 'Observance', 'Adherencia'),
      title: tr(
        lang,
        'متابع كورس العلاج وجدول الجرعات',
        'Treatment Course & Dose Tracker',
        'Suivi du Traitement & Calendrier des Doses',
        'Seguimiento del Tratamiento y Registro de Dosis'
      ),
      desc: tr(
        lang,
        'جدول تفاعلي لتسجيل مواعيد جرعاتك اليومية ومنع التوقف المبكر المسبب لمقاومة البكتيريا.',
        'Track daily antibiotic doses and complete your prescribed course to prevent resistance.',
        'Suivez vos prises quotidiennes d’antibiotiques et terminez votre traitement prescrit pour prévenir l’antibiorésistance.',
        'Registra tus dosis diarias de antibióticos y completa el tratamiento prescrito para prevenir la resistencia bacteriana.'
      ),
      color: '#059669',
    },
    {
      to: '/awareness-week',
      icon: '🌍',
      badge: tr(lang, 'حملة نوفمبر', '18–24 Nov', '18–24 Nov', '18–24 Nov'),
      title: tr(
        lang,
        'الأسبوع العالمي للوعي بالمضادات الحيوية',
        'World AMR Awareness Week Hub',
        'Semaine Mondiale de Sensibilisation à l’AMR (OMS)',
        'Semana Mundial de Concienciación sobre la RAM (OMS)'
      ),
      desc: tr(
        lang,
        'بوسترات إنفوجرافيك، فيديوهات قصيرة وريلز مع تعليق صوتي، وحملات جاهزة للنشر والتداول بضغطة واحدة.',
        'Ready-to-share infographic posters, 60s video reels with voiceover, and social media campaign kits.',
        'Affiches infographiques, vidéos éducatives de 60s avec voix off et kits de campagne prêts à partager.',
        'Pósters infográficos, videos educativos de 60s con locución y kits de campaña listos para compartir.'
      ),
      color: '#1d4ed8',
    },
    {
      to: '/safe-disposal',
      icon: '♻️',
      badge: tr(lang, 'تمريض أخضر', 'Eco-Health', 'Éco-Santé', 'Eco-Salud'),
      title: tr(
        lang,
        'دليل التخلص الآمن وحماية البيئة',
        'Safe Antibiotic Disposal Guide',
        'Guide d’Élimination Sûre & Protection de l’Environnement',
        'Guía de Eliminación Segura y Protección Ambiental'
      ),
      desc: tr(
        lang,
        'البروتوكول السريري لإعدام بواقي الشراب والأقراص والسرنجات بأمان وحماية مياه النيل من التلوث.',
        'Step-by-step clinical guide for disposing of leftover syrups, tablets, and sharps safely.',
        'Protocole étape par étape pour éliminer en toute sécurité les restes de sirops, comprimés et aiguilles sans polluer l’eau.',
        'Protocolo paso a paso para desechar de forma segura restos de jarabes, comprimidos y agujas sin contaminar el agua.'
      ),
      color: '#15803d',
    },
  ];

  const featuredMeds = [
    {
      id: 'amoxicillin-clavulanic-acid',
      ar: 'أوجمنتين / هاي بيوتك',
      en: 'Augmentin / Hibiotic',
      cls: {
        ar: 'بنسلين واسع المجال',
        en: 'Broad-Spectrum Penicillin',
        fr: 'Pénicilline à large spectre',
        es: 'Penicilina de amplio espectro',
      },
      bc: '6221127005436',
    },
    {
      id: 'metronidazole',
      ar: 'فلاجيل / أمريزول',
      en: 'Flagyl / Amrizole',
      cls: {
        ar: 'مضاد لاهوائيات وطفيليات',
        en: 'Nitroimidazole',
        fr: 'Nitro-imidazolé (antiparasitaire / anaérobies)',
        es: 'Nitroimidazol (anaerobios y antiparasitario)',
      },
      bc: '6223003990602',
    },
    {
      id: 'azithromycin',
      ar: 'زيثروماكس / زيثرون',
      en: 'Zithromax / Xithrone',
      cls: {
        ar: 'ماكروليد',
        en: 'Macrolide',
        fr: 'Macrolide (Azithromycine)',
        es: 'Macrólido (Azitromicina)',
      },
      bc: '6221054003411',
    },
    {
      id: 'ceftriaxone',
      ar: 'روسيفين / إبيسفين / سيفاكسون',
      en: 'Rocephin / Epicephin',
      cls: {
        ar: 'سيفالوسبورين جيل ثالث',
        en: '3rd Gen Cephalosporin',
        fr: 'Céphalosporine de 3e génération',
        es: 'Cefalosporina de 3.ª generación',
      },
      bc: '6221127003412',
    },
    {
      id: 'ciprofloxacin',
      ar: 'سيبروفار / سيبروباي',
      en: 'Ciprofar / Ciprobay',
      cls: {
        ar: 'فلوروكينولون',
        en: 'Fluoroquinolone',
        fr: 'Fluoroquinolone (Ciprofloxacine)',
        es: 'Fluoroquinolona (Ciprofloxacino)',
      },
      bc: '6221008002341',
    },
    {
      id: 'cefotaxime',
      ar: 'سيفوتاكس / كلافوران',
      en: 'Cefotax / Claforan',
      cls: {
        ar: 'سيفالوسبورين حقن',
        en: 'Parenteral Cephalosporin',
        fr: 'Céphalosporine parentérale (injectable)',
        es: 'Cefalosporina parenteral (inyectable)',
      },
      bc: '6221127003463',
    },
  ];

  return (
    <main style={{ paddingTop: 0 }}>
      {/* Executive Medical Hero Section */}
      <section className="pro-hero">
        <div className="wrap pro-hero-inner">
          <div className="pro-hero-badge">
            <span>💊</span>
            <span>
              {tr(
                lang,
                'منصة الوعي بالمضادات الحيوية',
                'Antibiotic Awareness Platform',
                'Plateforme de Sensibilisation aux Antibiotiques',
                'Plataforma de Concienciación sobre Antibióticos'
              )}
            </span>
          </div>

          <h1 className="pro-hero-title">{t('heroTitle')}</h1>
          <p className="pro-hero-sub">
            {tr(
              lang,
              'المرجع السريري والتوعوي الشامل للمضادات الحيوية المسجلة في السوق المصري: ابحث بالاسم التجاري أو العلمي أو الباركود الخطي، واستكشف البدائل المتطابقة، والأسعار الرسمية، وفاحص الحساسية والجرعات.',
              'Comprehensive clinical and patient-education portal for antibiotics in Egypt: search by trade name, generic ingredient, or linear barcode, and check exact generics, prices, and allergy safety.',
              'Portail clinique et éducatif complet sur les antibiotiques : recherchez par DCI (principe actif), nom commercial ou code-barres, et vérifiez les équivalents génériques, les allergies et les interactions.',
              'Portal clínico y educativo integral sobre antibióticos: busque por principio activo (DCI), nombre comercial o código de barras, y consulte genéricos equivalentes, alergias e interacciones.'
            )}
          </p>
          <div className="pro-hero-art" aria-hidden="true">
            <div className="pro-art-orbit pro-art-orbit-one" />
            <div className="pro-art-orbit pro-art-orbit-two" />
            <div className="pro-art-cross">＋</div>
            <div className="pro-art-shield"><span>✚</span><i /></div>
            <div className="pro-art-pill"><span /><span /></div>
            <div className="pro-art-mini-card pro-art-card-top">
              <b>✓</b>
              <span>{tr(lang, 'أمان الدواء', 'Medication safety', 'Sécurité des médicaments', 'Seguridad medicamentosa')}</span>
            </div>
            <div className="pro-art-mini-card pro-art-card-bottom">
              <b>⌕</b>
              <span>{tr(lang, 'دليل الأدوية الموثق', 'Verified drug guide', 'Guide clinique vérifié', 'Guía clínica verificada')}</span>
            </div>
          </div>

          {/* Search Bar with Instant Live Autocomplete Dropdown */}
          <div className="pro-search-wrap" style={{ position: 'relative', maxWidth: '850px', marginInline: 'auto', width: '100%' }}>
            <form className="pro-search-box" onSubmit={go} role="search">
              <span className="pro-search-icon">🔍</span>
              <input
                value={q}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tr(
                  lang,
                  'ابحث باسم الدواء (أوجمنتين، فلاجيل، زيثروماكس...) أو المادة الفعالة أو الباركود (622...)...',
                  'Search by drug name (Augmentin, Flagyl...), active ingredient, or barcode (622...)...',
                  'Rechercher par médicament (Augmentin, Flagyl…), principe actif (Amoxicillin…) ou code-barres (622…)…',
                  'Buscar por medicamento (Augmentin, Flagyl…), principio activo (Amoxicillin…) o código de barras (622…)…'
                )}
                aria-label={t('search')}
              />
              <button type="submit" className="btn pro-search-btn">
                {t('search')}
              </button>
            </form>

            {focused && quickMatches.length > 0 && (
              <div className="pro-autocomplete-dropdown">
                <div className="small muted" style={{ padding: '6px 12px', borderBottom: '1px solid var(--line)' }}>
                  {tr(
                    lang,
                    'نتائج فورية من السجل الدوائي المصري:',
                    'Instant matches from Egyptian Registry:',
                    'Résultats immédiats du registre pharmaceutique :',
                    'Resultados instantáneos del registro farmacéutico:'
                  )}
                </div>
                {quickMatches.map((item) => (
                  <Link
                    key={item.productId}
                    to={`/medicine/${item.activeIngredientId}`}
                    className="pro-autocomplete-item"
                  >
                    <div>
                      <b>{isAr ? item.tradeNameAr : item.tradeNameEn}</b>{' '}
                      <span className="small muted">({item.strength} - {pick(item.dosageFormLabel, lang)})</span>
                      <div className="small muted">{item.scientificComposition} · {item.manufacturer}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      {item.priceEgp && (
                        <span className="badge approved" style={{ display: 'block', marginBottom: '2px' }}>
                          {item.priceEgp.toFixed(2)} {isAr ? 'ج.م' : 'EGP'}
                        </span>
                      )}
                      {item.barcode && <code style={{ fontSize: '0.75rem' }}>{item.barcode}</code>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Hero Quick CTA Pills */}
          <div className="pro-hero-actions">
            <Link to="/games" className="pro-cta-btn primary-cta" style={{ background: '#0e9aa7', color: '#ffffff' }}>
              🎮 {tr(lang, 'مركز الألعاب ومحاكي المستشفى 3D', 'Game Center & 3D Simulator', 'Centre de Jeux & Simulateur 3D', 'Centro de Juegos y Simulador 3D')}
            </Link>
            <Link to="/green-prescription" className="pro-cta-btn primary-cta" style={{ background: '#10b981', color: '#052e16' }}>
              🌿 {tr(lang, 'الروشتة الخضرا الذكية', 'Green Prescription', 'Ordonnance Verte', 'Receta Verde')}
            </Link>
            <Link to="/medicines" className="pro-cta-btn secondary-cta">
              💊 {tr(lang, 'تصفح الـ 206 مستحضرات والبدائل', 'Browse 206 Egyptian Packages', 'Parcourir les 206 Médicaments', 'Explorar 206 Medicamentos')}
            </Link>
            <Link to="/allergy-checker" className="pro-cta-btn secondary-cta">
              🛡️ {tr(lang, 'فاحص الحساسية الدوائية', 'Allergy Safety Checker', 'Vérificateur d’Allergies', 'Verificador de Alergias')}
            </Link>
            <Link to="/pediatric-helper" className="pro-cta-btn secondary-cta">
              👶 {tr(lang, 'حاسبة جرعات الأطفال', 'Pediatric Dosing', 'Posologie Pédiatrique', 'Dosis Pediátrica')}
            </Link>
          </div>

          {/* Live Platform Metrics Strip */}
          <div className="pro-metrics-strip">
            <div className="pro-metric-item">
              <strong>{ACTIVE_INGREDIENTS.length}</strong>
              <span>{tr(lang, 'مادة فعالة وموسوعة سريرية', 'Active Ingredients', 'Principes Actifs (DCI)', 'Principios Activos (DCI)')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{EGYPTIAN_COMMERCIAL_PRODUCTS.length}+</strong>
              <span>{tr(lang, 'عبوة ومستحضر بالسوق المصري', 'Egyptian Market Packages', 'Spécialités Répertoriées', 'Presentaciones Registradas')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{verifiedBarcodesCount}</strong>
              <span>{tr(lang, 'باركود خطي مصري موثق (622)', 'Verified 622 Barcodes', 'Codes-Barres Vérifiés (622)', 'Códigos de Barras Verificados')}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{manufacturersCount}</strong>
              <span>{tr(lang, 'شركة ومصنع دوائي معتمد', 'Pharma Manufacturers', 'Laboratoires Pharmaceutiques', 'Laboratorios Farmacéuticos')}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap stack" style={{ marginTop: '28px' }}>
        {/* Clinical Command Center: Interactive Modules */}
        <section className="pro-tools-section">
          <div className="head pro-section-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', marginBottom: '4px' }}>
                🏥 {tr(lang, 'منظومة الأدوات السريرية والتمريضية الذكية', 'Smart Clinical & Nursing Stewardship Suite', 'Suite Clinique & Outils de Bon Usage des Antibiotiques', 'Suite Clínica de Uso Prudente y Seguridad del Paciente')}
              </h2>
              <p className="muted small" style={{ margin: 0 }}>
                {tr(
                  lang,
                  'اختر الأداة المناسبة للوصول الفوري إلى خدمات التثقيف الدوائي وفحص الأمان السريري:',
                  'Select a clinical module to access medication safety, dosing, and patient education tools:',
                  'Sélectionnez un module clinique pour accéder aux outils de sécurité médicamenteuse, de posologie et d’éducation :',
                  'Seleccione un módulo clínico para acceder a las herramientas de seguridad, dosificación y educación del paciente:'
                )}
              </p>
            </div>
          </div>

          <div className="pro-tools-grid">
            {(showAllClinicalTools ? [...clinicalTools].sort((a, b) => {
              const priority = ['/medicines', '/allergy-checker', '/prescription-radar', '/scan', '/compare', '/green-prescription'];
              return (priority.indexOf(a.to) === -1 ? 999 : priority.indexOf(a.to)) - (priority.indexOf(b.to) === -1 ? 999 : priority.indexOf(b.to));
            }) : ['/cost-saver', '/cold-shot-warning', '/daily-schedule', '/medicines', '/allergy-checker', '/prescription-radar'].map((path) => clinicalTools.find((tool) => tool.to === path)).filter((tool): tool is (typeof clinicalTools)[number] => Boolean(tool))).map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="pro-tool-card"
                style={{ '--accent-color': tool.color } as CSSProperties}
              >
                <div className="pro-tool-top">
                  <span className="pro-tool-icon" style={{ background: `${tool.color}15`, color: tool.color }}>
                    {tool.icon}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: `${tool.color}15`,
                      color: tool.color,
                      borderColor: `${tool.color}35`,
                    }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <h3>{tool.title}</h3>
                <p className="small muted">{tool.desc}</p>
                <span className="pro-tool-link" style={{ color: tool.color }}>
                  {tr(lang, 'افتح الأداة الآن ←', 'Launch Tool →', 'Ouvrir l’outil →', 'Abrir herramienta →')}
                </span>
              </Link>
            ))}
          </div>
          <div className="pro-tools-more-wrap">
            <button type="button" className="btn ghost pro-tools-more-btn" onClick={() => setShowAllClinicalTools((value) => !value)} aria-expanded={showAllClinicalTools}>
              {showAllClinicalTools
                ? tr(lang, 'عرض أقل ↑', 'Show Less ↑', 'Afficher moins ↑', 'Mostrar menos ↑')
                : tr(lang, 'عرض كل الأدوات ↓', 'Show All Tools ↓', 'Afficher tous les outils ↓', 'Mostrar todas las herramientas ↓')}
            </button>
          </div>
        </section>

        {/* Interactive Egypt Antibiotic Resistance Map Infographic */}
        <EgyptResistanceMap />

        {/* Quick Access to Most Prescribed Antibiotics in Egypt */}
        <section className="card highlight-card pro-featured-section">
          <div className="head" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                🇪🇬 {tr(lang, 'أشهر المضادات الحيوية تداولاً في الصيدليات المصرية', 'Most Prescribed Antibiotics in Egyptian Pharmacies', 'Antibiotiques les Plus Prescrits (Référentiel Officiel)', 'Antibióticos Más Recetados (Referencia Oficial)')}
              </h2>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {tr(
                  lang,
                  'اضغط على أي دواء لعرض النشرة السريرية الكاملة، الأسعار الرسمية، البدائل المتطابقة، والباركود:',
                  'Click any medication to view its full clinical monograph, official EGP prices, generics, and barcode:',
                  'Cliquez sur un médicament pour consulter sa monographie clinique complète, ses équivalents génériques, prix EGP et code-barres :',
                  'Haga clic en cualquier medicamento para ver su monografía clínica completa, genéricos equivalentes, precios en EGP y código de barras:'
                )}
              </p>
            </div>
            <Link to="/medicines" className="btn ghost small">
              {tr(lang, 'عرض كل الـ 32 مادة والـ 206 عبوات ←', 'View All 32 Ingredients & 206 Packages →', 'Voir les 32 DCI & 206 Spécialités →', 'Ver los 32 Principios Activos y 206 Envases →')}
            </Link>
          </div>

          <div className="grid">
            {featuredMeds.map((fm) => (
              <Link key={fm.id} to={`/medicine/${fm.id}`} className="card link pro-med-shortcut">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{isAr ? fm.ar : fm.en}</h3>
                  <code style={{ fontSize: '0.75rem' }}>{fm.bc}</code>
                </div>
                <p className="small muted" style={{ margin: '4px 0 8px' }}>
                  {pick(fm.cls, lang)}
                </p>
                <span className="more" style={{ fontSize: '0.84rem' }}>
                  {tr(lang, 'التفاصيل والأسعار والبدائل ←', 'Details, Prices & Generics →', 'Détails, Prix & Génériques →', 'Detalles, Precios y Genéricos →')}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* WHO AWaRe Classification Banner */}
        <section className="card">
          <h2>
            🌍{' '}
            {tr(
              lang,
              'تصنيف منظمة الصحة العالمية للمضادات الحيوية (WHO AWaRe Classification)',
              'WHO AWaRe Antibiotic Stewardship Classification',
              'Classification AWaRe des Antibiotiques de l’OMS (WHO AWaRe)',
              'Clasificación AWaRe de Antibióticos de la OMS (WHO AWaRe)'
            )}
          </h2>
          <p className="small muted">
            {tr(
              lang,
              'تعتمد منصتنا معايير منظمة الصحة العالمية لتصنيف المضادات الحيوية إلى 3 فئات لحماية فعالية الأدوية المنقذة للحياة:',
              'Our portal classifies all 32 active ingredients according to the World Health Organization AWaRe framework:',
              'Notre plateforme classe les 32 principes actifs selon le référentiel AWaRe de l’Organisation Mondiale de la Santé :',
              'Nuestra plataforma clasifica los 32 principios activos según el marco AWaRe de la Organización Mundial de la Salud:'
            )}
          </p>
          <div className="grid" style={{ marginTop: '12px' }}>
            <div className="card" style={{ borderTop: '4px solid #16a34a', background: 'var(--bg-subtle, #f0fdf4)' }}>
              <h3 style={{ color: '#15803d', margin: '0 0 6px' }}>
                🟢 Access ({tr(lang, 'فئة الإتاحة الأساسية', 'First/Second Line', 'Accès prioritaire / 1re intention', 'Acceso / Primera línea')})
              </h3>
              <p className="small" style={{ margin: 0 }}>
                {tr(
                  lang,
                  'مضادات خط الدفاع الأول ذات الطيف المحدد والأمان العالي (مثل أموكسيسيلين، أوجمنتين، فلاجيل، ماكروفيوران، سيفالكسين).',
                  'First- and second-choice antibiotics with narrow spectrum and lower resistance potential (e.g. Amoxicillin, Metronidazole, Nitrofurantoin).',
                  'Antibiotiques de première ou deuxième intention à spectre ciblé et faible potentiel de résistance (ex. Amoxicilline, Métronidazole, Nitrofurantoïne).',
                  'Antibióticos de primera o segunda elección con espectro reducido y menor potencial de resistencia (ej. Amoxicilina, Metronidazol, Nitrofurantoína).'
                )}
              </p>
            </div>
            <div className="card" style={{ borderTop: '4px solid #d97706', background: 'var(--bg-subtle, #fffbeb)' }}>
              <h3 style={{ color: '#b45309', margin: '0 0 6px' }}>
                🟡 Watch ({tr(lang, 'فئة المراقبة والحذر', 'Stewardship Watch', 'Surveillance / Vigilance', 'Vigilancia / Uso controlado')})
              </h3>
              <p className="small" style={{ margin: 0 }}>
                {tr(
                  lang,
                  'مضادات واسعة المجال ذات قابلية أعلى لتكوين سلالات مقاومة وتُصرف لدواعٍ محددة (مثل زيثروماكس، سيبروفار، تافانيك، سيفترياكسون، ميرونيم).',
                  'Broad-spectrum agents with higher resistance risk requiring strict indication (e.g. Azithromycin, Ciprofloxacin, Ceftriaxone, Meropenem).',
                  'Antibiotiques à large spectre présentant un risque plus élevé de résistance, réservés à des indications précises (ex. Azithromycine, Ciprofloxacine, Ceftriaxone, Méropénem).',
                  'Agentes de amplio espectro con mayor riesgo de resistencia que requieren indicación estricta (ej. Azitromicina, Ciprofloxacino, Ceftriaxona, Meropenem).'
                )}
              </p>
            </div>
            <div className="card" style={{ borderTop: '4px solid #dc2626', background: 'var(--bg-subtle, #fef2f2)' }}>
              <h3 style={{ color: '#b91c1c', margin: '0 0 6px' }}>
                🔴 Reserve ({tr(lang, 'فئة الملاذ الأخير المقيدة', 'Last-Resort Reserve', 'Réserve / Dernier recours', 'Reserva / Último recurso')})
              </h3>
              <p className="small" style={{ margin: 0 }}>
                {tr(
                  lang,
                  'أدوية الخط الدفاعي الأخير المخصصة للعدوى المستشفوية الشرسة متعددة المقاومة MRSA و VRE (مثل لينيزوليد / أفيروزوليد / زيفوكس).',
                  'Last-resort antibiotics reserved strictly for life-threatening multidrug-resistant infections (e.g. Linezolid / Zyvox).',
                  'Antibiotiques de dernier recours strictement réservés aux infections graves multirésistantes engageant le pronostic vital (ex. Linézolide / Zyvox).',
                  'Antibióticos de último recurso reservados estrictamente para infecciones multirresistentes graves que amenazan la vida (ej. Linezolid / Zyvox).'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Did you know? — random fact each visit */}
        <DidYouKnow />

        {/* Resistance counter — animated stats */}
        <ResistanceCounter />

        {/* Articles Section */}
        <section>
          <div className="head">
            <h2>📰 {t('articlesTitle')}</h2>
            <Link to="/articles" className="btn ghost small">{t('seeAll')} {isAr ? '←' : '→'}</Link>
          </div>
          <div className="grid">
            {ARTICLES.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/articles/${a.id}`} className="card link">
                <h3>{pick(a.title, lang)}</h3>
                <p className="small muted">{pick(a.summary, lang)}</p>
                <span className="more">{t('read')} {isAr ? '←' : '→'}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Interactive Quiz & Audio Learning CTA */}
        <div className="grid">
          <section className="card quizcta">
            <div>
              <h2>📝 {t('quizTitle')}</h2>
              <p className="small muted">{t('quizIntro')}</p>
            </div>
            <Link to="/quiz" className="btn">
              {t('startQuiz')}
            </Link>
          </section>

          <section className="card quizcta">
            <div>
              <h2>
                🎧{' '}
                {tr(
                  lang,
                  'استمع وتعلّم (التثقيف الصوتي)',
                  'Listen & Learn (Audio Guides)',
                  'Écouter & Apprendre (Guides Audio)',
                  'Escuchar y Aprender (Guías de Audio)'
                )}
              </h2>
              <p className="small muted">
                {tr(
                  lang,
                  'مقاطع صوتية مبسطة باللهجة المصرية والفصحى لكبار السن والمرضى لشرح قواعد المضادات الحيوية.',
                  'Accessible audio lessons for patients and caregivers on safe antibiotic use.',
                  'Leçons audio accessibles pour les patients et les aidants sur l’utilisation sûre des antibiotiques.',
                  'Lecciones de audio accesibles para pacientes y cuidadores sobre el uso seguro de los antibióticos.'
                )}
              </p>
            </div>
            <Link to="/listen" className="btn">
              {tr(lang, 'استمع الآن', 'Listen Now', 'Écouter maintenant', 'Escuchar ahora')}
            </Link>
          </section>
        </div>

        <Disclaimer />
      </div>
    </main>
  );
}
