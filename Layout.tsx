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
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '';
  const { dark, toggle } = useDarkMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [pathname]);

  // Close drawer on page change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    { to: '/', key: 'navHome', icon: '🏠' },
    { to: '/medicines', key: 'navMedicines', icon: '💊' },
    { to: '/interactions', key: 'navInteractions', icon: '⚡' },
    { to: '/safe-disposal', key: 'navSafeDisposal', icon: '♻️' },
    { to: '/tracker', key: 'navTracker', icon: '⏱️' },
    { to: '/side-effects', key: 'navSideEffects', icon: '🚨' },
    { to: '/listen', key: 'navListen', icon: '🎧' },
    { to: '/health-profile', key: 'navHealthProfile', icon: '👤' },
    { to: '/allergy-checker', key: 'navAllergyChecker', icon: '🛡️' },
    { to: '/pediatric-helper', key: 'navPediatric', icon: '👶' },
    { to: '/assistant', key: 'navAssistant', icon: '🤖' },
    { to: '/learn', key: 'navLearn', icon: '📚' },
    { to: '/myth', key: 'navMyth', icon: '💡' },
    { to: '/quiz', key: 'navQuiz', icon: '📝' },
    { to: '/articles', key: 'navArticles', icon: '📰' },
    { to: '/scan', key: 'navScan', icon: '📷' },
    { to: '/research', key: 'navResearch', icon: '📊' },
    { to: '/methodology', key: 'navMethod', icon: '🔬' },
  ];

  return (
    <div className="app">
      <header className="top">
        <div className="wrap bar">
          <div className="brand-group">
            <Link to="/" className="brand">
              <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                <g transform="rotate(-40 16 16)">
                  <rect x="3" y="10" width="26" height="12" rx="6" fill="#fff" />
                  <path d="M16 10h7a6 6 0 0 1 0 12h-7z" fill="#17B8C4" />
                </g>
              </svg>
              <span>
                <b>{t('appName')}</b>
                <small>{t('tagline')}</small>
              </span>
            </Link>
          </div>

          <div className="header-actions">
            {/* Dark mode toggle */}
            <button
              className="dark-toggle"
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {/* Language toggle */}
            <button className="lang" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label="Language">
              {lang === 'ar' ? 'En' : 'عربي'}
            </button>

            {/* 3-Lines Hamburger Menu Button */}
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label={lang === 'ar' ? 'فتح القائمة' : 'Open menu'}
              title={lang === 'ar' ? 'أقسام الموقع' : 'Site Menu'}
            >
              <span className="hamburger-icon">☰</span>
              <span className="hamburger-text">{lang === 'ar' ? 'القائمة' : 'Menu'}</span>
            </button>
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
                <b>{lang === 'ar' ? 'أقسام الموقع' : 'Navigation Menu'}</b>
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
                  <span className="item-arrow">←</span>
                </NavLink>
              ))}

              <div className="drawer-divider"></div>

              <NavLink
                to="/admin"
                className={({ isActive }) => `drawer-item admin ${isActive ? 'active' : ''}`}
              >
                <span className="item-icon">⚙️</span>
                <span className="item-title">{t('navAdmin')}</span>
                <span className="item-arrow">←</span>
              </NavLink>
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

      {/* Home disclaimer */}
      {isHome && (
        <footer className="foot">
          <div className="wrap">
            <Disclaimer compact />
          </div>
        </footer>
      )}
    </div>
  );
}
