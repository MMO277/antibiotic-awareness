import { ReactNode, useRef, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang } from './i18n';
import Disclaimer from './Disclaimer';
import ChatWidget from './ChatWidget';

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
    { to: '/scan', key: 'navScan', icon: '📷' },
    { to: '/prescription-radar', key: 'navRadar', icon: '📡' },
    { to: '/green-prescription', key: 'navGreenRx', icon: '🌿' },
    { to: '/pediatric-helper', key: 'navPediatric', icon: '👶' },
    { to: '/allergy-checker', key: 'navAllergyChecker', icon: '🛡️' },
    { to: '/compare', key: 'navCompare', icon: '⚖️' },
    { to: '/assistant', key: 'navAssistant', icon: '🎙️' },
    { to: '/awareness-week', key: 'navWAAW', icon: '🌍' },
    { to: '/health-profile', key: 'navHealthProfile', icon: '👤' },
    { to: '/interactions', key: 'navInteractions', icon: '⚡' },
    { to: '/tracker', key: 'navTracker', icon: '⏱️' },
    { to: '/side-effects', key: 'navSideEffects', icon: '🚨' },
    { to: '/safe-disposal', key: 'navSafeDisposal', icon: '♻️' },
    { to: '/listen', key: 'navListen', icon: '🎧' },
    { to: '/learn', key: 'navLearn', icon: '📚' },
    { to: '/myth', key: 'navMyth', icon: '💡' },
    { to: '/quiz', key: 'navQuiz', icon: '📝' },
    { to: '/articles', key: 'navArticles', icon: '📰' },
    { to: '/research', key: 'navResearch', icon: '📊' },
    { to: '/methodology', key: 'navMethod', icon: '🔬' },
  ];

  // Clean 7-item Quick Ribbon in the top bar (no crowding)
  const quickBarItems = [
    { to: '/', label: isAr ? 'الرئيسية' : 'Home', icon: '🏠' },
    { to: '/medicines', label: isAr ? 'الأدوية والبدائل' : 'Medicines', icon: '💊' },
    { to: '/scan', label: isAr ? 'الماسح الذكي' : 'Smart Scan', icon: '📷' },
    { to: '/prescription-radar', label: isAr ? 'رادار الروشتة' : 'Rx Radar', icon: '📡' },
    { to: '/green-prescription', label: isAr ? 'الروشتة الخضرا' : 'Green Rx', icon: '🌿' },
    { to: '/pediatric-helper', label: isAr ? 'حاسبة الأطفال' : 'Pediatrics', icon: '👶' },
    { to: '/awareness-week', label: isAr ? 'حملة نوفمبر' : 'WAAW', icon: '🌍' },
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
            <button
              className="dark-toggle"
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? (isAr ? 'الوضع الفاتح' : 'Light mode') : (isAr ? 'الوضع الداكن' : 'Dark mode')}
            >
              {dark ? '☀️' : '🌙'}
            </button>

            <button className="lang" onClick={() => setLang(isAr ? 'en' : 'ar')} aria-label="Language">
              {isAr ? 'EN' : 'عربي'}
            </button>

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
                  <b>{isAr ? 'أقسام المنصة' : 'Portal Menu'}</b>
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
            </div>
          </nav>
        </div>
      )}

      <div ref={pageRef} className="page-enter">
        {children}
      </div>

      <ChatWidget />

      <footer className="pro-footer" style={{ padding: '24px 0 18px' }}>
        <div className="wrap">
          <Disclaimer compact />
          <div className="small" style={{ textAlign: 'center', color: '#94a3b8', marginTop: '10px' }}>
            © {new Date().getFullYear()} {t('appName')} · 🚑 {isAr ? 'طوارئ الإسعاف المصري: 123' : 'Egypt Ambulance: 123'}
          </div>
        </div>
      </footer>
    </div>
  );
}
