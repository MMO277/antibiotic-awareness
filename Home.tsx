import { CSSProperties, FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES } from './articlesData';
import { pick } from './types';
import Disclaimer from './Disclaimer';
import DidYouKnow from './DidYouKnow';
import ResistanceCounter from './ResistanceCounter';
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
      to: '/games',
      icon: '🎮',
      badge: isAr ? 'جديد • 3D & 2D' : 'NEW • 3D & 2D',
      title: isAr ? 'مركز الألعاب ومحاكي الحياة الطبية ثلاثي الأبعاد (3D)' : 'Game Center & 3D Medical Life Simulator',
      desc: isAr
        ? 'تجول داخل جناح المستشفى ثلاثي الأبعاد (WebGL 3D) وتفاعل مع الطبيب والممرضة والصيدلي في 5 سيناريوهات سريرية، أو العب صائد البكتيريا.'
        : 'Explore a genuine 3D cartoon hospital ward with 5 branching clinical stewardship scenarios, or play Bacteria Hunter.',
      color: '#0e9aa7',
    },
    {
      to: '/prescription-radar',
      icon: '📡',
      badge: isAr ? 'رادار ومواعيد 24س' : 'Rx Radar 24h',
      title: isAr ? 'رادار فحص الروشتة الكاملة ومنظم مواعيد اليوم' : 'Full Prescription Radar & 24h Smart Scheduler',
      desc: isAr
        ? 'افحص تعارض المضاد الحيوي مع باقي أدوية الروشتة والمكملات واحصل على جدول زمني يومي يفصل بينها بالساعة.'
        : 'Screen your full prescription for multi-drug conflicts and get an optimized 24-hour daily schedule.',
      color: '#0284c7',
    },
    {
      to: '/green-prescription',
      icon: '🌿',
      badge: isAr ? 'رعاية ذاتية' : 'Green Rx',
      title: isAr ? 'الروشتة الخضرا الذكية (بديل المضاد الحيوي)' : 'Green Prescription (Self-Care Plan)',
      desc: isAr
        ? 'تقييم آمن للأعراض البسيطة (برد، كحة، احتقان حلق، إسهال) وإصدار بطاقة رعاية ذاتية قابلة للطباعة بدون مضاد حيوي.'
        : 'Safe symptom triage and printable non-antibiotic self-care plan for colds, cough, sore throat, and diarrhea.',
      color: '#15803d',
    },
    {
      to: '/medicines',
      icon: '💊',
      badge: isAr ? '206 مستحضرات' : '206 Packages',
      title: isAr ? 'السجل الدوائي المصري والبدائل' : 'Egyptian Drug Registry & Alternatives',
      desc: isAr
        ? 'قاعدة بيانات موسعة للمضادات الحيوية في مصر بالأسعار الرسمية والبدائل المتطابقة والباركود.'
        : 'Comprehensive directory of Egyptian antibiotics with official prices, exact generics, and barcodes.',
      color: '#0284c7',
    },
    {
      to: '/compare',
      icon: '⚖️',
      badge: isAr ? 'مقارنة فورية' : 'Side-by-Side',
      title: isAr ? 'مقارنة دواءين أو عبوتين جنباً إلى جنب' : 'Compare 2 Antibiotics Side-by-Side',
      desc: isAr
        ? 'قارن بين أي عبوتين تجاريتين في السعر والتكافؤ، أو قارن مادتين فعالتين في الطيف والجرعة والحمل والكلى.'
        : 'Compare any two packages for equivalence and savings, or two active ingredients across 12 clinical rows.',
      color: '#4f46e5',
    },
    {
      to: '/scan',
      icon: '📷',
      badge: isAr ? 'كاميرا ذكية' : 'Smart Scanner',
      title: isAr ? 'ماسح الباركود الخطي للعلبة' : 'Carton Barcode & QR Scanner',
      desc: isAr
        ? 'وجّه كاميرا الهاتف نحو الباركود الخطي المطبوع على علبة الدواء لفتح السعر والجرعات والبدائل فوراً.'
        : 'Point your phone camera at any Egyptian medicine box barcode to open clinical details instantly.',
      color: '#0d9488',
    },
    {
      to: '/allergy-checker',
      icon: '🛡️',
      badge: isAr ? 'أمان المريض' : 'Patient Safety',
      title: isAr ? 'فاحص الحساسية والتفاعلات المتصالبة' : 'Drug Allergy & Cross-Reactivity Checker',
      desc: isAr
        ? 'تحقق من أمان المضاد الحيوي واكتشف الحساسية المتقاطعة بين البنسلينات والسيفالوسبورينات.'
        : 'Screen antibiotics against your allergy history and detect beta-lactam cross-reactivity.',
      color: '#dc2626',
    },
    {
      to: '/pediatric-helper',
      icon: '👶',
      badge: isAr ? 'حاسبة أطفال' : 'Pediatrics',
      title: isAr ? 'حاسبة جرعات الأطفال ومحاكي السرنجة' : 'Pediatric Dosage & Syringe Simulator',
      desc: isAr
        ? 'حساب دقيق لجرعات شراب الأطفال بالملي حسب الوزن مع رسم توضيحي للسرنجة وتتبع صلاحية الشراب.'
        : 'Weight-based suspension dosing calculator with visual syringe level and 14-day expiry tracker.',
      color: '#7c3aed',
    },
    {
      to: '/interactions',
      icon: '⚡',
      badge: isAr ? 'تداخلات' : 'Interactions',
      title: isAr ? 'فاحص التداخلات الدوائية والغذائية' : 'Drug & Food Interaction Checker',
      desc: isAr
        ? 'افحص تعارض المضاد الحيوي مع منتجات الألبان، مكملات الحديد والكالسيوم، وأدوية السيولة والقلب.'
        : 'Check interactions between antibiotics and dairy, iron, calcium antacids, warfarin, and statins.',
      color: '#d97706',
    },
    {
      to: '/health-profile',
      icon: '👤',
      badge: isAr ? 'ملف شخصي' : 'Health Profile',
      title: isAr ? 'ملف صحتي وحساسيتي الدوائية' : 'My Health & Allergy Profile',
      desc: isAr
        ? 'احفظ سجل حساسيتك الدوائية ووظائف الكلى والكبد محلياً على جهازك لفحص أي دواء تلقائياً.'
        : 'Store your personal drug allergies and clinical conditions locally for personalized alerts.',
      color: '#2563eb',
    },
    {
      to: '/tracker',
      icon: '⏱️',
      badge: isAr ? 'التزام علاجي' : 'Adherence',
      title: isAr ? 'متابع كورس العلاج وجدول الجرعات' : 'Treatment Course & Dose Tracker',
      desc: isAr
        ? 'جدول تفاعلي لتسجيل مواعيد جرعاتك اليومية ومنع التوقف المبكر المسبب لمقاومة البكتيريا.'
        : 'Track daily antibiotic doses and complete your prescribed course to prevent resistance.',
      color: '#059669',
    },
    {
      to: '/awareness-week',
      icon: '🌍',
      badge: isAr ? 'حملة نوفمبر' : '18–24 Nov',
      title: isAr ? 'الأسبوع العالمي للوعي بالمضادات الحيوية' : 'World AMR Awareness Week Hub',
      desc: isAr
        ? 'بوسترات إنفوجرافيك، فيديوهات قصيرة وريلز مع تعليق صوتي، وحملات جاهزة للنشر والتداول بضغطة واحدة.'
        : 'Ready-to-share infographic posters, 60s video reels with voiceover, and social media campaign kits.',
      color: '#1d4ed8',
    },
    {
      to: '/safe-disposal',
      icon: '♻️',
      badge: isAr ? 'تمريض أخضر' : 'Eco-Health',
      title: isAr ? 'دليل التخلص الآمن وحماية البيئة' : 'Safe Antibiotic Disposal Guide',
      desc: isAr
        ? 'البروتوكول السريري لإعدام بواقي الشراب والأقراص والسرنجات بأمان وحماية مياه النيل من التلوث.'
        : 'Step-by-step clinical guide for disposing of leftover syrups, tablets, and sharps safely.',
      color: '#15803d',
    },
  ];

  const featuredMeds = [
    { id: 'amoxicillin-clavulanic-acid', ar: 'أوجمنتين / هاي بيوتك', en: 'Augmentin / Hibiotic', clsAr: 'بنسلين واسع المجال', clsEn: 'Broad-Spectrum Penicillin', bc: '6221127005436' },
    { id: 'metronidazole', ar: 'فلاجيل / أمريزول', en: 'Flagyl / Amrizole', clsAr: 'مضاد لاهوائيات وطفيليات', clsEn: 'Nitroimidazole', bc: '6223003990602' },
    { id: 'azithromycin', ar: 'زيثروماكس / زيثرون', en: 'Zithromax / Xithrone', clsAr: 'ماكروليد', clsEn: 'Macrolide', bc: '6221054003411' },
    { id: 'ceftriaxone', ar: 'روسيفين / إبيسفين / سيفاكسون', en: 'Rocephin / Epicephin', clsAr: 'سيفالوسبورين جيل ثالث', clsEn: '3rd Gen Cephalosporin', bc: '6221127003412' },
    { id: 'ciprofloxacin', ar: 'سيبروفار / سيبروباي', en: 'Ciprofar / Ciprobay', clsAr: 'فلوروكينولون', clsEn: 'Fluoroquinolone', bc: '6221008002341' },
    { id: 'cefotaxime', ar: 'سيفوتاكس / كلافوران', en: 'Cefotax / Claforan', clsAr: 'سيفالوسبورين حقن', clsEn: 'Parenteral Cephalosporin', bc: '6221127003463' },
  ];

  return (
    <main style={{ paddingTop: 0 }}>
      {/* Executive Medical Hero Section */}
      <section className="pro-hero">
        <div className="wrap pro-hero-inner">
          <div className="pro-hero-badge">
            <span>💊</span>
            <span>
              {isAr
                ? 'منصة الوعي بالمضادات الحيوية'
                : 'Antibiotic Awareness Platform'}
            </span>
          </div>

          <h1 className="pro-hero-title">{t('heroTitle')}</h1>
          <p className="pro-hero-sub">
            {isAr
              ? 'المرجع السريري والتوعوي الشامل للمضادات الحيوية المسجلة في السوق المصري: ابحث بالاسم التجاري أو العلمي أو الباركود الخطي، واستكشف البدائل المتطابقة، والأسعار الرسمية، وفاحص الحساسية والجرعات.'
              : 'Comprehensive clinical and patient-education portal for antibiotics in Egypt: search by trade name, generic ingredient, or linear barcode, and check exact generics, prices, and allergy safety.'}
          </p>
          <div className="pro-hero-art" aria-hidden="true">
            <div className="pro-art-orbit pro-art-orbit-one" />
            <div className="pro-art-orbit pro-art-orbit-two" />
            <div className="pro-art-cross">＋</div>
            <div className="pro-art-shield"><span>✚</span><i /></div>
            <div className="pro-art-pill"><span /><span /></div>
            <div className="pro-art-mini-card pro-art-card-top"><b>✓</b><span>{isAr ? 'أمان الدواء' : 'Medication safety'}</span></div>
            <div className="pro-art-mini-card pro-art-card-bottom"><b>⌕</b><span>{isAr ? 'دليل الأدوية المصري' : 'Egyptian drug guide'}</span></div>
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
                placeholder={
                  isAr
                    ? 'ابحث باسم الدواء (أوجمنتين، فلاجيل، زيثروماكس...) أو المادة الفعالة أو الباركود (622...)...'
                    : 'Search by drug name (Augmentin, Flagyl...), active ingredient, or barcode (622...)...'
                }
                aria-label={t('search')}
              />
              <button type="submit" className="btn pro-search-btn">
                {t('search')}
              </button>
            </form>

            {focused && quickMatches.length > 0 && (
              <div className="pro-autocomplete-dropdown">
                <div className="small muted" style={{ padding: '6px 12px', borderBottom: '1px solid var(--line)' }}>
                  {isAr ? 'نتائج فورية من السجل الدوائي المصري:' : 'Instant matches from Egyptian Registry:'}
                </div>
                {quickMatches.map((item) => (
                  <Link
                    key={item.productId}
                    to={`/medicine/${item.activeIngredientId}`}
                    className="pro-autocomplete-item"
                  >
                    <div>
                      <b>{isAr ? item.tradeNameAr : item.tradeNameEn}</b>{' '}
                      <span className="small muted">({item.strength} - {item.dosageFormLabel[lang]})</span>
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
            <Link to="/games" className="pro-cta-btn primary-cta" style={{ background: "#0e9aa7", color: "#ffffff" }}>
              🎮 {isAr ? "مركز الألعاب ومحاكي المستشفى 3D" : "Game Center & 3D Simulator"}
            </Link>
            <Link to="/green-prescription" className="pro-cta-btn primary-cta" style={{ background: "#10b981", color: "#052e16" }}>
              🌿 {isAr ? "الروشتة الخضرا الذكية" : "Green Prescription"}
            </Link>
            <Link to="/medicines" className="pro-cta-btn secondary-cta">
              💊 {isAr ? 'تصفح الـ 206 مستحضرات والبدائل' : 'Browse 206 Egyptian Packages'}
            </Link>
            <Link to="/allergy-checker" className="pro-cta-btn secondary-cta">
              🛡️ {isAr ? 'فاحص الحساسية الدوائية' : 'Allergy Safety Checker'}
            </Link>
            <Link to="/pediatric-helper" className="pro-cta-btn secondary-cta">
              👶 {isAr ? 'حاسبة جرعات الأطفال' : 'Pediatric Dosing'}
            </Link>
          </div>

          {/* Live Platform Metrics Strip */}
          <div className="pro-metrics-strip">
            <div className="pro-metric-item">
              <strong>{ACTIVE_INGREDIENTS.length}</strong>
              <span>{isAr ? 'مادة فعالة وموسوعة سريرية' : 'Active Ingredients'}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{EGYPTIAN_COMMERCIAL_PRODUCTS.length}+</strong>
              <span>{isAr ? 'عبوة ومستحضر بالسوق المصري' : 'Egyptian Market Packages'}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{verifiedBarcodesCount}</strong>
              <span>{isAr ? 'باركود خطي مصري موثق (622)' : 'Verified 622 Barcodes'}</span>
            </div>
            <div className="pro-metric-item">
              <strong>{manufacturersCount}</strong>
              <span>{isAr ? 'شركة ومصنع دوائي معتمد' : 'Pharma Manufacturers'}</span>
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
                🏥 {isAr ? 'منظومة الأدوات السريرية والتمريضية الذكية' : 'Smart Clinical & Nursing Stewardship Suite'}
              </h2>
              <p className="muted small" style={{ margin: 0 }}>
                {isAr
                  ? 'اختر الأداة المناسبة للوصول الفوري إلى خدمات التثقيف الدوائي وفحص الأمان السريري:'
                  : 'Select a clinical module to access medication safety, dosing, and patient education tools:'}
              </p>
            </div>
          </div>

          <div className="pro-tools-grid">
            {(showAllClinicalTools ? [...clinicalTools].sort((a, b) => {
              const priority = ['/medicines', '/allergy-checker', '/prescription-radar', '/scan', '/compare', '/green-prescription'];
              return (priority.indexOf(a.to) === -1 ? 999 : priority.indexOf(a.to)) - (priority.indexOf(b.to) === -1 ? 999 : priority.indexOf(b.to));
            }) : ['/medicines', '/allergy-checker', '/prescription-radar', '/scan'].map((path) => clinicalTools.find((tool) => tool.to === path)).filter((tool): tool is (typeof clinicalTools)[number] => Boolean(tool))).map((tool) => (
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
                  {isAr ? 'افتح الأداة الآن ←' : 'Launch Tool →'}
                </span>
              </Link>
            ))}
          </div>
          <div className="pro-tools-more-wrap">
            <button type="button" className="btn ghost pro-tools-more-btn" onClick={() => setShowAllClinicalTools((value) => !value)} aria-expanded={showAllClinicalTools}>
              {showAllClinicalTools ? (isAr ? 'عرض أقل ↑' : 'Show Less ↑') : (isAr ? 'عرض كل الأدوات ↓' : 'Show All Tools ↓')}
            </button>
          </div>
        </section>

        {/* Quick Access to Most Prescribed Antibiotics in Egypt */}
        <section className="card highlight-card pro-featured-section">
          <div className="head" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                🇪🇬 {isAr ? 'أشهر المضادات الحيوية تداولاً في الصيدليات المصرية' : 'Most Prescribed Antibiotics in Egyptian Pharmacies'}
              </h2>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'اضغط على أي دواء لعرض النشرة السريرية الكاملة، الأسعار الرسمية، البدائل المتطابقة، والباركود:'
                  : 'Click any medication to view its full clinical monograph, official EGP prices, generics, and barcode:'}
              </p>
            </div>
            <Link to="/medicines" className="btn ghost small">
              {isAr ? 'عرض كل الـ 32 مادة والـ 206 عبوات ←' : 'View All 32 Ingredients & 206 Packages →'}
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
                  {isAr ? fm.clsAr : fm.clsEn}
                </p>
                <span className="more" style={{ fontSize: '0.84rem' }}>
                  {isAr ? 'التفاصيل والأسعار والبدائل ←' : 'Details, Prices & Generics →'}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* WHO AWaRe Classification Banner */}
        <section className="card">
          <h2>🌍 {isAr ? 'تصنيف منظمة الصحة العالمية للمضادات الحيوية (WHO AWaRe Classification)' : 'WHO AWaRe Antibiotic Stewardship Classification'}</h2>
          <p className="small muted">
            {isAr
              ? 'تعتمد منصتنا معايير منظمة الصحة العالمية لتصنيف المضادات الحيوية إلى 3 فئات لحماية فعالية الأدوية المنقذة للحياة:'
              : 'Our portal classifies all 32 active ingredients according to the World Health Organization AWaRe framework:'}
          </p>
          <div className="grid" style={{ marginTop: '12px' }}>
            <div className="card" style={{ borderTop: '4px solid #16a34a', background: 'var(--bg-subtle, #f0fdf4)' }}>
              <h3 style={{ color: '#15803d', margin: '0 0 6px' }}>🟢 Access ({isAr ? 'فئة الإتاحة الأساسية' : 'First/Second Line'})</h3>
              <p className="small" style={{ margin: 0 }}>
                {isAr
                  ? 'مضادات خط الدفاع الأول ذات الطيف المحدد والأمان العالي (مثل أموكسيسيلين، أوجمنتين، فلاجيل، ماكروفيوران، سيفالكسين).'
                  : 'First- and second-choice antibiotics with narrow spectrum and lower resistance potential (e.g. Amoxicillin, Metronidazole, Nitrofurantoin).'}
              </p>
            </div>
            <div className="card" style={{ borderTop: '4px solid #d97706', background: 'var(--bg-subtle, #fffbeb)' }}>
              <h3 style={{ color: '#b45309', margin: '0 0 6px' }}>🟡 Watch ({isAr ? 'فئة المراقبة والحذر' : 'Stewardship Watch'})</h3>
              <p className="small" style={{ margin: 0 }}>
                {isAr
                  ? 'مضادات واسعة المجال ذات قابلية أعلى لتكوين سلالات مقاومة وتُصرف لدواعٍ محددة (مثل زيثروماكس، سيبروفار، تافانيك، سيفترياكسون، ميرونيم).'
                  : 'Broad-spectrum agents with higher resistance risk requiring strict indication (e.g. Azithromycin, Ciprofloxacin, Ceftriaxone, Meropenem).'}
              </p>
            </div>
            <div className="card" style={{ borderTop: '4px solid #dc2626', background: 'var(--bg-subtle, #fef2f2)' }}>
              <h3 style={{ color: '#b91c1c', margin: '0 0 6px' }}>🔴 Reserve ({isAr ? 'فئة الملاذ الأخير المقيدة' : 'Last-Resort Reserve'})</h3>
              <p className="small" style={{ margin: 0 }}>
                {isAr
                  ? 'أدوية الخط الدفاعي الأخير المخصصة للعدوى المستشفوية الشرسة متعددة المقاومة MRSA و VRE (مثل لينيزوليد / أفيروزوليد / زيفوكس).'
                  : 'Last-resort antibiotics reserved strictly for life-threatening multidrug-resistant infections (e.g. Linezolid / Zyvox).'}
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
            <Link to="/articles" className="btn ghost small">{t('seeAll')} ←</Link>
          </div>
          <div className="grid">
            {ARTICLES.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/articles/${a.id}`} className="card link">
                <h3>{pick(a.title, lang)}</h3>
                <p className="small muted">{pick(a.summary, lang)}</p>
                <span className="more">{t('read')} ←</span>
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
              <h2>🎧 {isAr ? 'استمع وتعلّم (التثقيف الصوتي)' : 'Listen & Learn (Audio Guides)'}</h2>
              <p className="small muted">
                {isAr
                  ? 'مقاطع صوتية مبسطة باللهجة المصرية والفصحى لكبار السن والمرضى لشرح قواعد المضادات الحيوية.'
                  : 'Accessible audio lessons for patients and caregivers on safe antibiotic use.'}
              </p>
            </div>
            <Link to="/listen" className="btn">
              {isAr ? 'استمع الآن' : 'Listen Now'}
            </Link>
          </section>
        </div>

        <Disclaimer />
      </div>
    </main>
  );
}
