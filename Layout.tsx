import { ReactNode, useRef, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang } from './i18n';
import Disclaimer from './Disclaimer';

// ── Dark mode helper ──
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

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useLang();
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '';
  const { dark, toggle } = useDarkMode();

  // ── Page transition animation ──
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [pathname]);

  const links: [string, string][] = [
    ['/', 'navHome'],
    ['/medicines', 'navMedicines'],
    ['/interactions', 'navInteractions'],
    ['/assistant', 'navAssistant'],
    ['/learn', 'navLearn'],
    ['/myth', 'navMyth'],
    ['/quiz', 'navQuiz'],
    ['/articles', 'navArticles'],
    ['/scan', 'navScan'],
    ['/research', 'navResearch'],
    ['/methodology', 'navMethod'],
  ];

  return (
    <div className="app">
      <header className="top">
        <div className="wrap bar">
          <Link to="/" className="brand">
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
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

          <div className="row" style={{ gap: '8px' }}>
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
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>

        <nav className="wrap nav" aria-label="main">
          {links.map(([to, key]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}>
              {t(key)}
            </NavLink>
          ))}
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'on admin-link' : 'admin-link')}>
            {t('navAdmin')}
          </NavLink>
        </nav>
      </header>

      {/* Animated page wrapper */}
      <div ref={pageRef} className="page-enter">
        {children}
      </div>

      {/* Educational disclaimer on home page only */}
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
