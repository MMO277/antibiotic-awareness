import { ReactNode, useRef, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import Disclaimer from './Disclaimer';
import ChatWidget from './ChatWidget';
import LogoutModal from './LogoutModal';

function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

interface NavItem {
  to: string;
  key: string;
  icon: string;
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useLang();
  const isAr = lang === 'ar';
  const { pathname } = useLocation();
  const { dark, toggle } = useDarkMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const authCtx = useAuth() as any;
  const user = authCtx?.user;
  const openAuthModal = authCtx?.openAuthModal || (() => {});

  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    { to: '/', key: 'navHome', icon: '🏠' },
    { to: '/medicines', key: 'navMedicines', icon: '💊' },
    { to: '/green-prescription', key: 'navGreenRx', icon: '🌿' },
    { to: '/awareness-week', key: 'navWAAW', icon: '🌍' },
    { to: '/compare', key: 'navCompare', icon: '⚖️' },
    { to: '/prescription-radar', key: 'navRadar', icon: '📡' },
    { to: '/scan', key: 'navScan', icon: '📷' },
    { to: '/allergy-checker', key: 'navAllergyChecker', icon: '🛡️' },
    { to: '/health-profile', key: 'navHealthProfile', icon: '👤' },
    { to: '/pediatric-helper', key: 'navPediatric', icon: '👶' },
    { to: '/interactions', key: 'navInteractions', icon: '⚡' },
    { to: '/tracker', key: 'navTracker', icon: '⏱️' },
    { to: '/side-effects', key: 'navSideEffects', icon: '🚨' },
    { to: '/safe-disposal', key: 'navSafeDisposal', icon: '♻️' },
    { to: '/listen', key: 'navListen', icon: '🎧' },
    { to: '/assistant', key: 'navAssistant', icon: '🤖' },
    { to: '/learn', key: 'navLearn', icon: '📚' },
    { to: '/myth', key: 'navMyth', icon: '💡' },
    { to: '/quiz', key: 'navQuiz', icon: '📝' },
    { to: '/articles', key: 'navArticles', icon: '📰' },
    { to: '/research', key: 'navResearch', icon: '📊' },
    { to: '/methodology', key: 'navMethod', icon: '🔬' },
  ];

  const quickBarItems = [
    { to: '/', label: isAr ? 'الرئيسية' : 'Home', icon: '🏠' },
    { to: '/medicines', label: isAr ? 'السجل الدوائي (206)' : 'Registry (206)', icon: '💊' },
    { to: '/green-prescription', label: isAr ? 'الروشتة الخضرا' : 'Green Rx', icon: '🌿' },
    { to: '/awareness-week', label: isAr ? 'حملة نوفمبر العالمية' : 'WAAW Campaign', icon: '🌍' },
    { to: '/compare', label: isAr ? 'مقارنة دواءين' : 'Compare Drugs', icon: '⚖️' },
    { to: '/prescription-radar', label: isAr ? 'رادار الروشتة 24س' : 'Rx Radar 24h', icon: '📡' },
    { to: '/scan', label: isAr ? 'مسح الباركود' : 'Scan Barcode', icon: '📷' },
    { to: '/allergy-checker', label: isAr ? 'فاحص الحساسية' : 'Allergy Check', icon: '🛡️' },
    { to: '/pediatric-helper', label: isAr ? 'حاسبة الأطفال' : 'Pediatrics', icon: '👶' },
    { to: '/interactions', label: isAr ? 'التداخلات' : 'Interactions', icon: '⚡' },
    { to: '/tracker', label: isAr ? 'متابع الجرعات' : 'Dose Tracker', icon: '⏱️' },
    { to: '/safe-disposal', label: isAr ? 'التخلص الآمن' : 'Safe Disposal', icon: '♻️' },
  ];

  return (
    <div className="app">
      <header className="top">
        <div className="wrap bar">
          <div className="brand-group">
            <Link to="/" className="brand">
              <div className="brand-logo-circle">
                <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
                  <g transform="rotate(-40 16 16)">
                    <rect x="3" y="10" width="26" height="12" rx="6" fill="#fff" />
                    <path d="M16 10h7a6 6 0 0 1 0 12h-7z" fill="#17B8C4" />
                  </g>
                </svg>
              </div>
              <span>
                <b>{t('appName')}</b>
              </span>
            </Link>
          </div>

          <div className="header-actions">
            {/* User Account / Auth button */}
            {!user ? (
              <button
                type="button"
                className="btn small ghost"
                onClick={() => openAuthModal('login')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.86rem',
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: '#ffffff',
                }}
              >
                👤 {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            ) : (
              <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                <Link
                  to="/health-profile"
                  className="chip"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.3)',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                  title={user.email || ''}
                >
                  👤 {user.displayName || user.email?.split('@')[0]}
                </Link>
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() => setShowLogoutModal(true)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.8rem',
                    borderColor: 'rgba(255,255,255,0.25)',
                    color: '#fca5a5',
                    cursor: 'pointer',
                  }}
                  title={isAr ? 'تسجيل الخروج' : 'Log out'}
                  aria-label={isAr ? 'تسجيل الخروج' : 'Log out'}
                >
                  🚪 {isAr ? 'خروج' : 'Logout'}
                </button>
              </div>
            )}

            {/* Dark mode toggle */}
            <button
              className="dark-toggle"
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? (isAr ? 'الوضع الفاتح' : 'Light mode') : (isAr ? 'الوضع الداكن' : 'Dark mode')}
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {/* Language toggle */}
            <button className="lang" onClick={() => setLang(isAr ? 'en' : 'ar')} aria-label="Language">
              {isAr ? 'EN' : 'عربي'}
            </button>

            {/* 3-Lines Hamburger Menu Button */}
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label={isAr ? 'فتح القائمة' : 'Open menu'}
              title={isAr ? 'أقسام الموقع الكاملة' : 'All Site Sections'}
            >
              <span className="hamburger-icon">☰</span>
              <span className="hamburger-text">{isAr ? 'كل الأقسام' : 'Menu'}</span>
            </button>
          </div>
        </div>

        {/* Sleek Secondary Quick-Access Clinical Ribbon */}
        <div className="quick-ribbon-wrap">
          <div className="wrap quick-ribbon">
            {quickBarItems.map((qItem) => (
              <NavLink
                key={qItem.to}
                to={qItem.to}
                end={qItem.to === '/'}
                className={({ isActive }) => `quick-ribbon-link ${isActive ? 'active' : ''}`}
              >
                <span>{qItem.icon}</span>
                <span>{qItem.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <nav
            className="drawer-panel"
            onClick={(e) => e.stopPropagation()}
            aria-label="Side menu"
          >
            <div className="drawer-header">
              <div className="drawer-brand">
                <span className="drawer-logo">💊</span>
                <div>
                  <b>{isAr ? 'أقسام المنصة السريرية' : 'Clinical Portal Menu'}</b>
                </div>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="drawer-links">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `drawer-item ${isActive ? 'active' : ''}`}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-title">{t(item.key)}</span>
                  <span className="item-arrow">{isAr ? '←' : '→'}</span>
                </NavLink>
              ))}

              <div className="drawer-divider"></div>

              <NavLink
                to="/admin"
                className={({ isActive }) => `drawer-item admin ${isActive ? 'active' : ''}`}
              >
                <span className="item-icon">⚙️</span>
                <span className="item-title">{t('navAdmin')}</span>
                <span className="item-arrow">{isAr ? '←' : '→'}</span>
              </NavLink>

              {user && (
                <>
                  <div className="drawer-divider"></div>
                  <button
                    type="button"
                    className="drawer-item"
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowLogoutModal(true);
                    }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#fca5a5',
                      cursor: 'pointer',
                      textAlign: 'inherit',
                    }}
                  >
                    <span className="item-icon">🚪</span>
                    <span className="item-title">{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
                    <span className="item-arrow">{isAr ? '←' : '→'}</span>
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Page Content */}
      <div ref={pageRef} className="page-enter">
        {children}
      </div>

      {/* Always-on Floating AI Assistant Bubble */}
      <ChatWidget />

      {/* Self-contained Logout Modal mounted directly in Layout */}
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />

      {/* Professional Academic & Medical Footer on All Pages */}
      <footer className="pro-footer">
        <div className="wrap pro-footer-grid">
          <div>
            <div className="row" style={{ gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.6rem' }}>💊</span>
              <div>
                <b style={{ fontSize: '1.05rem', color: '#fff' }}>{t('appName')}</b>
              </div>
            </div>
            <p className="small" style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
              {isAr
                ? 'المنصة الرقمية الوطنية للتوعية بالاستخدام الرشيد للمضادات الحيوية ومكافحة مقاومة الميكروبات (AMR) وفق أحدث دلائل هيئة الدواء المصرية ومنظمة الصحة العالمية.'
                : 'National digital health portal for rational antibiotic stewardship and antimicrobial resistance (AMR) education aligned with EDA and WHO guidelines.'}
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', margin: '0 0 10px' }}>
              {isAr ? 'الأدوات السريرية السريعة' : 'Quick Clinical Tools'}
            </h4>
            <ul className="pro-footer-links">
              <li><Link to="/medicines">{isAr ? 'السجل الدوائي المصري (206 عبوات)' : 'Egyptian Drug Registry (206)'}</Link></li>
              <li><Link to="/scan">{isAr ? 'ماسح الباركود الخطي ورموز QR' : 'Barcode & QR Scanner'}</Link></li>
              <li><Link to="/allergy-checker">{isAr ? 'فاحص الحساسية الدوائية المتقاطعة' : 'Drug Allergy Safety Checker'}</Link></li>
              <li><Link to="/pediatric-helper">{isAr ? 'حاسبة جرعات شراب الأطفال' : 'Pediatric Dosage Calculator'}</Link></li>
              <li><Link to="/safe-disposal">{isAr ? 'دليل التخلص الآمن وحماية البيئة' : 'Safe Antibiotic Disposal'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', margin: '0 0 10px' }}>
              {isAr ? 'المصادر الطبية الرسمية والطوارئ' : 'Official Sources & Emergency'}
            </h4>
            <ul className="pro-footer-links">
              <li>
                <a href="https://edaegypt.gov.eg" target="_blank" rel="noopener noreferrer">
                  {isAr ? 'هيئة الدواء المصرية (EDA)' : 'Egyptian Drug Authority (EDA)'} ↗
                </a>
              </li>
              <li>
                <a href="https://www.who.int/health-topics/antimicrobial-resistance" target="_blank" rel="noopener noreferrer">
                  {isAr ? 'منظمة الصحة العالمية (WHO AMR)' : 'World Health Organization (WHO)'} ↗
                </a>
              </li>
              <li>
                <a href="https://medlineplus.gov/antibiotics.html" target="_blank" rel="noopener noreferrer">
                  {isAr ? 'المكتبة الوطنية للطب (MedlinePlus)' : 'NIH MedlinePlus Drug Info'} ↗
                </a>
              </li>
              <li style={{ marginTop: '8px' }}>
                <span style={{ color: '#fca5a5', fontWeight: 700 }}>
                  🚑 {isAr ? 'طوارئ الإسعاف المصري: 123' : 'Egypt Emergency Ambulance: 123'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="wrap" style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <Disclaimer compact />
          <div className="small" style={{ textAlign: 'center', color: '#94a3b8', marginTop: '8px' }}>
            © {new Date().getFullYear()} {t('appName')}
          </div>
        </div>
      </footer>
    </div>
  );
}
