import { CSSProperties, FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import Disclaimer from './Disclaimer';
import DidYouKnow from './DidYouKnow';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import { norm } from './search';

export default function Home() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const go = (e: FormEvent) => {
    e.preventDefault();
    nav(`/medicines?q=${encodeURIComponent(q)}`);
  };

  // Instant live autocomplete results
  const quickMatches = useMemo(() => {
    const clean = norm(q);
    if (clean.length < 2) return [];
    return EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => {
      const hay = norm(
        `${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.barcode || ''} ${p.manufacturer}`,
      );
      return hay.includes(clean);
    }).slice(0, 6);
  }, [q]);

  // 6 Essential Core Tools (Short, crisp, zero clutter)
  const coreTools = [
    {
      to: '/medicines',
      icon: '💊',
      title: isAr ? 'دليل الأدوية والبدائل (206)' : 'Drug Registry & Generics (206)',
      desc: isAr ? 'الأسعار الرسمية والبدائل المتطابقة بالباركود' : 'Official prices & exact generic equivalents',
      color: '#0284c7',
    },
    {
      to: '/scan',
      icon: '📷',
      title: isAr ? 'الماسح الذكي للعلبة والباركود' : 'Smart Box & Barcode Scanner',
      desc: isAr ? 'صوّر الباركود أو وش العلبة أو الشريط المقطوع' : 'Scan barcode, box front, or torn strip',
      color: '#0d9488',
    },
    {
      to: '/prescription-radar',
      icon: '📡',
      title: isAr ? 'رادار الروشتة ومواعيد الـ 24 ساعة' : 'Prescription Radar & 24h Schedule',
      desc: isAr ? 'افحص تعارض أدوية الروشتة ونظّم مواعيدها بالساعة' : 'Check multi-drug conflicts & daily schedule',
      color: '#2563eb',
    },
    {
      to: '/green-prescription',
      icon: '🌿',
      title: isAr ? 'الروشتة الخضرا (بديل المضاد)' : 'Green Prescription (Self-Care)',
      desc: isAr ? 'خطة تعافٍ آمنة للبرد والكحة بدون مضاد حيوي' : 'Safe non-antibiotic care plan for colds',
      color: '#15803d',
    },
    {
      to: '/pediatric-helper',
      icon: '👶',
      title: isAr ? 'حاسبة جرعات شراب الأطفال' : 'Pediatric Syringe Calculator',
      desc: isAr ? 'احسب الجرعة بالملي حسب وزن طفلك بدقة' : 'Weight-based suspension dosing in mL',
      color: '#7c3aed',
    },
    {
      to: '/allergy-checker',
      icon: '🛡️',
      title: isAr ? 'فاحص الحساسية الدوائية' : 'Drug Allergy Safety Checker',
      desc: isAr ? 'اكشف الحساسية المتقاطعة للبنسلين والسيفالوسبورين' : 'Check penicillin & cephalosporin cross-allergy',
      color: '#dc2626',
    },
  ];

  // Secondary Tools (Collapsed by default so the homepage stays super clean)
  const extraTools = [
    {
      to: '/compare',
      icon: '⚖️',
      title: isAr ? 'مقارنة دواءين جنباً إلى جنب' : 'Compare 2 Drugs Side-by-Side',
      desc: isAr ? 'قارن السعر والمادة الفعالة والأمان' : 'Compare price, spectrum & safety',
      color: '#4f46e5',
    },
    {
      to: '/assistant',
      icon: '🎙️',
      title: isAr ? 'المساعد الصوتي الذكي (بالمايك)' : 'Voice-to-Voice AI Assistant',
      desc: isAr ? 'اسأل بصوتك بالمايك واسمع الإجابة فوراً' : 'Speak your question & hear the reply',
      color: '#0369a1',
    },
    {
      to: '/tracker',
      icon: '⏱️',
      title: isAr ? 'متابع مواعيد الجرعات' : 'Dose Course Tracker',
      desc: isAr ? 'سجّل جرعاتك اليومية لمنع المقاومة البكتيرية' : 'Track your daily antibiotic doses',
      color: '#059669',
    },
    {
      to: '/awareness-week',
      icon: '🌍',
      title: isAr ? 'حملة الأسبوع العالمي (نوفمبر)' : 'World AMR Awareness Week',
      desc: isAr ? 'فيديوهات توعوية وبوسترات جاهزة للنشر' : 'Videos, posters & WhatsApp messages',
      color: '#1d4ed8',
    },
    {
      to: '/safe-disposal',
      icon: '♻️',
      title: isAr ? 'التخلص الآمن من بواقي الدواء' : 'Safe Antibiotic Disposal',
      desc: isAr ? 'طريقة إعدام الشراب والأقراص والسرنجات' : 'Safely dispose of leftover meds',
      color: '#15803d',
    },
    {
      to: '/quiz',
      icon: '📝',
      title: isAr ? 'اختبر معلوماتك الدوائية' : 'Quick Antibiotic Quiz',
      desc: isAr ? 'اختبار تفاعلي سريع مع تصحيح فوري' : 'Short interactive awareness quiz',
      color: '#d97706',
    },
  ];

  const popularDrugs = [
    { id: 'amoxicillin-clavulanic-acid', ar: 'أوجمنتين / هاي بيوتك', en: 'Augmentin / Hibiotic' },
    { id: 'azithromycin', ar: 'زيثروماكس / زيثرون', en: 'Zithromax / Xithrone' },
    { id: 'metronidazole', ar: 'فلاجيل / أمريزول', en: 'Flagyl / Amrizole' },
    { id: 'ciprofloxacin', ar: 'سيبروفار / سيبروباي', en: 'Ciprofar / Ciprobay' },
    { id: 'ceftriaxone', ar: 'روسيفين / سيفاكسون', en: 'Rocephin / Cefaxone' },
    { id: 'cefotaxime', ar: 'سيفوتاكس / كلافوران', en: 'Cefotax / Claforan' },
  ];

  return (
    <main style={{ paddingTop: 0 }}>
      {/* Clean, Streamlined Hero Section */}
      <section className="pro-hero" style={{ padding: '32px 0 28px' }}>
        <div className="wrap pro-hero-inner">
          <div className="pro-hero-badge">
            <span>💊</span>
            <span>{isAr ? 'منصة الوعي بالمضادات الحيوية' : 'Antibiotic Awareness Platform'}</span>
          </div>

          <h1 className="pro-hero-title" style={{ marginBottom: '8px' }}>
            {t('heroTitle')}
          </h1>
          <p className="pro-hero-sub" style={{ maxWidth: '620px', marginBottom: '18px' }}>
            {isAr
              ? 'ابحث عن أي مضاد حيوي في مصر، أو صوّر العلبة بالكاميرا لمعرفة السعر والبدائل وتنظيم مواعيد الروشتة.'
              : 'Search any antibiotic in Egypt, scan a medicine box, or check your full prescription schedule.'}
          </p>

          {/* Search Bar with Instant Live Autocomplete */}
          <div style={{ position: 'relative', maxWidth: '700px', marginInline: 'auto', width: '100%' }}>
            <form className="pro-search-box" onSubmit={go} role="search">
              <span className="pro-search-icon">🔍</span>
              <input
                value={q}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث باسم الدواء (أوجمنتين، فلاجيل...) أو المادة الفعالة أو الباركود...'
                    : 'Search by drug name (Augmentin, Flagyl...), ingredient, or barcode...'
                }
                aria-label={t('search')}
              />
              <button type="submit" className="btn pro-search-btn">
                {t('search')}
              </button>
            </form>

            {focused && quickMatches.length > 0 && (
              <div className="pro-autocomplete-dropdown">
                {quickMatches.map((item) => (
                  <Link
                    key={item.productId}
                    to={`/medicine/${item.activeIngredientId}`}
                    className="pro-autocomplete-item"
                  >
                    <div>
                      <b>{isAr ? item.tradeNameAr : item.tradeNameEn}</b>{' '}
                      <span className="small muted">({item.strength})</span>
                      <div className="small muted">{item.scientificComposition}</div>
                    </div>
                    {item.priceEgp && (
                      <span className="badge approved">
                        {item.priceEgp.toFixed(0)} {isAr ? 'ج.م' : 'EGP'}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 3 Focused Action Buttons Only */}
          <div className="pro-hero-actions" style={{ marginTop: '16px' }}>
            <Link to="/scan" className="pro-cta-btn primary-cta">
              📷 {isAr ? 'صوّر العلبة أو الباركود' : 'Scan Box or Barcode'}
            </Link>
            <Link
              to="/prescription-radar"
              className="pro-cta-btn primary-cta"
              style={{ background: '#38bdf8', color: '#082f49' }}
            >
              📡 {isAr ? 'رادار الروشتة ومواعيد اليوم' : 'Prescription Radar 24h'}
            </Link>
            <Link
              to="/green-prescription"
              className="pro-cta-btn secondary-cta"
            >
              🌿 {isAr ? 'الروشتة الخضرا (بديل المضاد)' : 'Green Prescription'}
            </Link>
          </div>
        </div>
      </section>

      <div className="wrap stack" style={{ marginTop: '22px', gap: '20px' }}>
        {/* Popular Drugs Quick Chips (1-Line Compact Bar) */}
        <section className="card" style={{ padding: '14px 18px' }}>
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              🇪🇬 {isAr ? 'الأدوية الأكثر بحثاً:' : 'Popular Antibiotics:'}
            </span>
            <div className="row wrapRow" style={{ gap: '8px', flex: 1 }}>
              {popularDrugs.map((d) => (
                <Link key={d.id} to={`/medicine/${d.id}`} className="chip" style={{ textDecoration: 'none' }}>
                  💊 {isAr ? d.ar : d.en}
                </Link>
              ))}
            </div>
            <Link to="/medicines" className="small" style={{ fontWeight: 700 }}>
              {isAr ? 'كل الـ 206 أدوية ←' : 'All 206 Drugs →'}
            </Link>
          </div>
        </section>

        {/* Core 6 Tools Grid */}
        <section>
          <div className="head" style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
              🏥 {isAr ? 'الأدوات السريعة' : 'Quick Clinical Tools'}
            </h2>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setShowMoreTools((v) => !v)}
            >
              {showMoreTools
                ? isAr
                  ? 'إخفاء الأدوات الإضافية ▲'
                  : 'Hide Extra Tools ▲'
                : isAr
                  ? 'عرض باقي الأدوات (6+) ▼'
                  : 'Show More Tools (6+) ▼'}
            </button>
          </div>

          <div className="pro-tools-grid">
            {(showMoreTools ? [...coreTools, ...extraTools] : coreTools).map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="pro-tool-card"
                style={{ '--accent-color': tool.color, padding: '16px' } as CSSProperties}
              >
                <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                  <span
                    className="pro-tool-icon"
                    style={{
                      background: `${tool.color}15`,
                      color: tool.color,
                      width: '42px',
                      height: '42px',
                      fontSize: '1.35rem',
                    }}
                  >
                    {tool.icon}
                  </span>
                  <div>
                    <h3 style={{ margin: '0 0 2px', fontSize: '1.02rem' }}>{tool.title}</h3>
                    <p className="small muted" style={{ margin: 0 }}>
                      {tool.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Single Compact Educational Tip */}
        <DidYouKnow />

        <Disclaimer compact />
      </div>
    </main>
  );
}
