import { ReactNode, useRef, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang, SUPPORTED_LANGS } from './i18n';
import { Lang, localizeFallbackText, tr } from './types';
import { useAuth } from './authContext';
import Disclaimer from './Disclaimer';
import ChatWidget from './ChatWidget';
import LogoutModal from './LogoutModal';
import { useEmergencyLocation } from './emergencyLocation';

// ── Safe, Zero-DOM-Mutation Universal Page TextNode & Attribute Localizer (FR / ES) ──
const textNodeState = new WeakMap<Text, { baseEn: string; lastOut: string }>();
const attrState = new WeakMap<Element, Record<string, { baseEn: string; lastOut: string }>>();
const translationMemoryCache = new Map<string, string>();

function getCachedTranslation(lang: Lang, text: string): string | null {
  const key = `${lang}::${text}`;
  if (translationMemoryCache.has(key)) return translationMemoryCache.get(key)!;
  try {
    const saved = sessionStorage.getItem(`aa_tr_${key}`);
    if (saved) {
      translationMemoryCache.set(key, saved);
      return saved;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedTranslation(lang: Lang, text: string, translated: string): void {
  const key = `${lang}::${text}`;
  translationMemoryCache.set(key, translated);
  try {
    sessionStorage.setItem(`aa_tr_${key}`, translated);
  } catch {
    /* ignore */
  }
}

async function fetchNeuralTranslation(text: string, targetLang: 'fr' | 'es'): Promise<string | null> {
  const cached = getCachedTranslation(targetLang, text);
  if (cached) return cached;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const joined = data[0].map((part: unknown) => (Array.isArray(part) ? String(part[0] || '') : '')).join('');
      if (joined.trim()) {
        setCachedTranslation(targetLang, text, joined);
        return joined;
      }
    }
  } catch {
    /* offline or blocked — fallback stays active */
  }
  return null;
}

function shouldTranslateString(s: string): boolean {
  const trimmed = s.trim();
  if (trimmed.length < 2) return false;
  // Skip if it contains Arabic characters
  if (/[\u0600-\u06FF]/.test(trimmed)) return false;
  // Must contain at least one 2+ letter Latin word
  if (!/[A-Za-z]{2,}/.test(trimmed)) return false;
  // Skip pure URLs or codes
  if (/^(https?:\/\/|www\.|[0-9.\-/:+%]+$)/i.test(trimmed)) return false;
  return true;
}

function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {
      /* ignore */
    }
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
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
  const { emergency, countryName } = useEmergencyLocation();
  const isAr = lang === 'ar';
  const pageDir: 'rtl' | 'ltr' = isAr ? 'rtl' : 'ltr';
  const { pathname } = useLocation();
  const { dark, toggle } = useDarkMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const authCtx = useAuth();
  const user = authCtx.user;
  const openAuthModal = authCtx.openAuthModal;

  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const currentLangMeta = SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0];

  const openDrawer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDrawerClosing(false);
    setDrawerOpen(true);
  };

  const closeDrawer = (restoreFocus = false) => {
    if (!drawerOpen || drawerClosing) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setDrawerOpen(false);
      setDrawerClosing(false);
      if (restoreFocus) {
        window.setTimeout(() => hamburgerBtnRef.current?.focus({ preventScroll: true }), 0);
      }
      return;
    }

    setDrawerClosing(true);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
      closeTimerRef.current = null;
      if (restoreFocus) {
        hamburgerBtnRef.current?.focus({ preventScroll: true });
      }
    }, 220);
  };

  const handleExitGuestMode = () => {
    try {
      sessionStorage.removeItem('aa_lamp_seen');
      sessionStorage.removeItem('aa_guest_mode');
    } catch {}
    if (typeof authCtx.exitGuestMode === 'function') {
      authCtx.exitGuestMode();
    } else {
      openAuthModal('login');
    }
  };

  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  // ── Automatic Full-Page TextNode & Attribute Localizer for ALL sub-pages when lang is FR or ES ──
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let cancelled = false;

    const processSubtree = () => {
      const root = document.body;
      if (!root) return;

      const pendingNodes: { node: Text; baseEn: string; leading: string; trailing: string }[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('script, style, code, pre, svg, header.top, nav.drawer-panel, footer.pro-footer, .lang-switcher-wrap, .drawer-lang-bar')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      let current: Node | null = walker.nextNode();
      while (current) {
        const textNode = current as Text;
        const raw = textNode.nodeValue || '';
        const prev = textNodeState.get(textNode);

        if (lang === 'ar' || lang === 'en') {
          if (prev && raw === prev.lastOut && prev.baseEn !== raw) {
            textNode.nodeValue = prev.baseEn;
          }
          current = walker.nextNode();
          continue;
        }

        // lang is 'fr' or 'es'
        let baseEn = raw;
        if (prev) {
          if (raw === prev.lastOut) {
            baseEn = prev.baseEn;
          } else {
            // React updated this text node with new content
            baseEn = raw;
          }
        }

        if (shouldTranslateString(baseEn)) {
          const leadingMatch = baseEn.match(/^\s*/);
          const trailingMatch = baseEn.match(/\s*$/);
          const leading = leadingMatch ? leadingMatch[0] : '';
          const trailing = trailingMatch ? trailingMatch[0] : '';
          const core = baseEn.trim();

          const cached = getCachedTranslation(lang, core);
          if (cached) {
            const finalStr = `${leading}${cached}${trailing}`;
            textNodeState.set(textNode, { baseEn, lastOut: finalStr });
            if (textNode.nodeValue !== finalStr) {
              textNode.nodeValue = finalStr;
            }
          } else {
            // Apply instant offline fallback first
            const offlineOut = localizeFallbackText(baseEn, lang);
            textNodeState.set(textNode, { baseEn, lastOut: offlineOut });
            if (textNode.nodeValue !== offlineOut) {
              textNode.nodeValue = offlineOut;
            }
            pendingNodes.push({ node: textNode, baseEn, leading, trailing });
          }
        }

        current = walker.nextNode();
      }

      // Also localize input placeholders and button titles
      const attrElements = root.querySelectorAll('input[placeholder], textarea[placeholder], [title]');
      attrElements.forEach((el) => {
        if (el.closest('header.top, nav.drawer-panel, footer.pro-footer, .lang-switcher-wrap, .drawer-lang-bar')) return;
        const record = attrState.get(el) || {};
        (['placeholder', 'title'] as const).forEach((attrName) => {
          const val = el.getAttribute(attrName);
          if (!val) return;
          const prevAttr = record[attrName];
          if (lang === 'ar' || lang === 'en') {
            if (prevAttr && val === prevAttr.lastOut && prevAttr.baseEn !== val) {
              el.setAttribute(attrName, prevAttr.baseEn);
            }
            return;
          }
          const baseEn = prevAttr && val === prevAttr.lastOut ? prevAttr.baseEn : val;
          if (!shouldTranslateString(baseEn)) return;
          const cached = getCachedTranslation(lang, baseEn.trim());
          if (cached) {
            record[attrName] = { baseEn, lastOut: cached };
            attrState.set(el, record);
            if (val !== cached) el.setAttribute(attrName, cached);
          } else {
            const offlineOut = localizeFallbackText(baseEn, lang);
            record[attrName] = { baseEn, lastOut: offlineOut };
            attrState.set(el, record);
            if (val !== offlineOut) el.setAttribute(attrName, offlineOut);
            void fetchNeuralTranslation(baseEn.trim(), lang).then((trVal) => {
              if (cancelled || !trVal) return;
              record[attrName] = { baseEn, lastOut: trVal };
              attrState.set(el, record);
              if (el.getAttribute(attrName) === offlineOut) {
                el.setAttribute(attrName, trVal);
              }
            });
          }
        });
      });

      // Batch-translate pending text nodes in chunks so every page translates completely
      if ((lang === 'fr' || lang === 'es') && pendingNodes.length > 0) {
        const uniqueCores = Array.from(new Set(pendingNodes.map((p) => p.baseEn.trim())));
        const CHUNK_SIZE = 18;
        for (let i = 0; i < uniqueCores.length; i += CHUNK_SIZE) {
          const slice = uniqueCores.slice(i, i + CHUNK_SIZE);
          const joinedPayload = slice.join('\n ||| \n');
          void fetchNeuralTranslation(joinedPayload, lang).then((resText) => {
            if (cancelled || !resText) return;
            const parts = resText.split(/\s*\|\|\|\s*/);
            if (parts.length === slice.length) {
              slice.forEach((origCore, idx) => {
                const trCore = parts[idx].trim();
                if (trCore) setCachedTranslation(lang, origCore, trCore);
              });
              pendingNodes.forEach(({ node, baseEn, leading, trailing }) => {
                const trCore = getCachedTranslation(lang, baseEn.trim());
                if (trCore && node.isConnected) {
                  const finalStr = `${leading}${trCore}${trailing}`;
                  textNodeState.set(node, { baseEn, lastOut: finalStr });
                  if (node.nodeValue !== finalStr) {
                    node.nodeValue = finalStr;
                  }
                }
              });
            } else {
              // Fallback: translate individual items in this chunk
              slice.forEach((origCore) => {
                void fetchNeuralTranslation(origCore, lang).then((singleTr) => {
                  if (cancelled || !singleTr) return;
                  pendingNodes
                    .filter((p) => p.baseEn.trim() === origCore)
                    .forEach(({ node, baseEn, leading, trailing }) => {
                      if (node.isConnected) {
                        const finalStr = `${leading}${singleTr.trim()}${trailing}`;
                        textNodeState.set(node, { baseEn, lastOut: finalStr });
                        if (node.nodeValue !== finalStr) {
                          node.nodeValue = finalStr;
                        }
                      }
                    });
                });
              });
            }
          });
        }
      }
    };

    processSubtree();

    let debounceTimer: number | null = null;
    const observer = new MutationObserver(() => {
      if (lang !== 'fr' && lang !== 'es') return;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        if (!cancelled) processSubtree();
      }, 60);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      cancelled = true;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [lang, pathname]);

  useEffect(() => {
    if (drawerOpen) {
      closeDrawer(false);
    }
    setLangMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen || drawerClosing) return;
    const focusTimer = window.setTimeout(() => {
      drawerCloseBtnRef.current?.focus({ preventScroll: true });
    }, 30);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, drawerClosing]);

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
    { to: '/games', key: 'navGames', icon: '🎮' },
  ];

  const quickBarItems = [
    { to: '/', label: tr(lang, 'الرئيسية', 'Home', 'Accueil', 'Inicio'), icon: '🏠' },
    { to: '/medicines', label: tr(lang, 'السجل الدوائي (206)', 'Registry (206)', 'Registre (206)', 'Registro (206)'), icon: '💊' },
    { to: '/games', label: tr(lang, 'الألعاب والمحاكاة 3D', 'Games & 3D Sim', 'Jeux & Sim 3D', 'Juegos y Sim 3D'), icon: '🎮' },
    { to: '/green-prescription', label: tr(lang, 'الروشتة الخضرا', 'Green Rx', 'Ordonnance Verte', 'Receta Verde'), icon: '🌿' },
    { to: '/awareness-week', label: tr(lang, 'حملة نوفمبر العالمية', 'WAAW Campaign', 'Campagne WAAW', 'Campaña WAAW'), icon: '🌍' },
    { to: '/compare', label: tr(lang, 'مقارنة دواءين', 'Compare Drugs', 'Comparer', 'Comparar'), icon: '⚖️' },
    { to: '/prescription-radar', label: tr(lang, 'رادار الروشتة 24س', 'Rx Radar 24h', 'Radar Rx 24h', 'Radar Rx 24h'), icon: '📡' },
    { to: '/scan', label: tr(lang, 'مسح الباركود', 'Scan Barcode', 'Scanner Code', 'Escanear Código'), icon: '📷' },
    { to: '/allergy-checker', label: tr(lang, 'فاحص الحساسية', 'Allergy Check', 'Allergies', 'Alergias'), icon: '🛡️' },
    { to: '/pediatric-helper', label: tr(lang, 'حاسبة الأطفال', 'Pediatrics', 'Pédiatrie', 'Pediatría'), icon: '👶' },
    { to: '/interactions', label: tr(lang, 'التداخلات', 'Interactions', 'Interactions', 'Interacciones'), icon: '⚡' },
    { to: '/tracker', label: tr(lang, 'متابع الجرعات', 'Dose Tracker', 'Suivi Doses', 'Seguimiento'), icon: '⏱️' },
    { to: '/safe-disposal', label: tr(lang, 'التخلص الآمن', 'Safe Disposal', 'Élimination', 'Eliminación'), icon: '♻️' },
  ];

  return (
    <div className="app" dir={pageDir}>
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
              <span className="brand-title-wrap">
                <b>{t('appName')}</b>
              </span>
            </Link>
          </div>

          <div className="header-actions">
            {/* User Account / Auth controls */}
            {!user ? (
              <div className="header-auth-group">
                <span
                  className="chip guest-indicator"
                  title={tr(
                    lang,
                    'أنت تتصفح الموقع حالياً كزائر',
                    'You are currently browsing as a guest',
                    'Vous naviguez actuellement en tant qu’invité',
                    'Actualmente navegas como invitado'
                  )}
                >
                  <span aria-hidden="true">👀</span>
                  <span>{tr(lang, 'وضع الزائر', 'Guest', 'Invité', 'Invitado')}</span>
                </span>
                <button
                  type="button"
                  className="btn small ghost header-signin-btn"
                  onClick={handleExitGuestMode}
                  title={tr(
                    lang,
                    'الخروج من وضع الزائر والعودة لشاشة الدخول',
                    'Exit Guest Mode and return to sign in screen',
                    'Quitter le mode invité et se connecter',
                    'Salir del modo invitado e iniciar sesión'
                  )}
                >
                  <span aria-hidden="true">👤</span>
                  <span>{tr(lang, 'تسجيل الدخول', 'Sign In', 'Connexion', 'Acceder')}</span>
                </button>
              </div>
            ) : (
              <div className="header-auth-group">
                <Link
                  to="/health-profile"
                  className="chip header-user-chip"
                  title={user.email || ''}
                >
                  <span aria-hidden="true">👤</span>
                  <span className="header-username">{user.displayName || user.email?.split('@')[0]}</span>
                </Link>
              </div>
            )}

            {user && (
              <button
                type="button"
                className="btn small ghost header-logout-btn"
                onClick={() => setShowLogoutModal(true)}
                title={tr(lang, 'تسجيل الخروج', 'Log out', 'Déconnexion', 'Cerrar sesión')}
                aria-label={tr(lang, 'تسجيل الخروج', 'Log out', 'Déconnexion', 'Cerrar sesión')}
              >
                <span aria-hidden="true">🚪</span>
                <span className="header-logout-text">{tr(lang, 'خروج', 'Logout', 'Sortir', 'Salir')}</span>
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              type="button"
              className="dark-toggle"
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={
                dark
                  ? tr(lang, 'الوضع الفاتح', 'Light mode', 'Mode clair', 'Modo claro')
                  : tr(lang, 'الوضع الداكن', 'Dark mode', 'Mode sombre', 'Modo oscuro')
              }
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {/* 4-Language Switcher Dropdown (keeps .lang class on direct child of .header-actions) */}
            <div ref={langMenuRef} className="lang lang-switcher-wrap" style={{ position: 'relative', padding: 0 }}>
              <button
                type="button"
                className="lang-trigger-btn"
                onClick={() => setLangMenuOpen((o) => !o)}
                aria-expanded={langMenuOpen}
                aria-haspopup="listbox"
                aria-label={tr(lang, 'تغيير اللغة', 'Change language', 'Changer de langue', 'Cambiar idioma')}
                title={tr(lang, 'اختر لغة المنصة (4 لغات)', 'Select platform language (4 languages)', 'Choisir la langue (4 langues)', 'Seleccionar idioma (4 idiomas)')}
              >
                <span aria-hidden="true">{currentLangMeta.flag}</span>
                <span>{currentLangMeta.shortLabel}</span>
                <span aria-hidden="true" style={{ fontSize: '0.68rem', opacity: 0.85 }}>▾</span>
              </button>

              {langMenuOpen && (
                <div
                  className="lang-dropdown-menu"
                  role="listbox"
                  aria-label={tr(lang, 'قائمة اللغات', 'Languages', 'Langues', 'Idiomas')}
                >
                  {SUPPORTED_LANGS.map((item) => {
                    const active = item.code === lang;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`lang-dropdown-item${active ? ' active' : ''}`}
                        onClick={() => {
                          setLang(item.code);
                          setLangMenuOpen(false);
                        }}
                      >
                        <span className="lang-item-flag" aria-hidden="true">{item.flag}</span>
                        <span className="lang-item-name">{item.nativeLabel}</span>
                        <span className="lang-item-code">{item.code.toUpperCase()}</span>
                        {active && <span className="lang-item-check" aria-hidden="true">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3-Lines Hamburger Menu Button ("All Sections" Trigger) */}
            <button
              type="button"
              ref={hamburgerBtnRef}
              className="hamburger-btn"
              onClick={openDrawer}
              aria-expanded={drawerOpen && !drawerClosing}
              aria-controls="site-sections-drawer"
              aria-label={tr(lang, 'فتح القائمة', 'Open menu', 'Ouvrir le menu', 'Abrir menú')}
              title={tr(lang, 'أقسام الموقع الكاملة', 'All Site Sections', 'Toutes les rubriques', 'Todas las secciones')}
            >
              <span className="hamburger-icon" aria-hidden="true">☰</span>
              <span className="hamburger-text">{tr(lang, 'كل الأقسام', 'Menu', 'Menu', 'Menú')}</span>
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
                <span aria-hidden="true">{qItem.icon}</span>
                <span>{qItem.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Edge-Attached Dark Teal Glassmorphism Navigation Sidebar */}
      {drawerOpen && (
        <div
          className={`drawer-backdrop${drawerClosing ? ' is-closing' : ''}`}
          dir={pageDir}
          onClick={() => closeDrawer(true)}
          role="presentation"
        >
          <nav
            id="site-sections-drawer"
            key={pageDir}
            dir={pageDir}
            className={`drawer-panel${drawerClosing ? ' is-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={tr(lang, 'القائمة الجانبية لجميع الأقسام', 'Side menu', 'Menu latéral', 'Menú lateral')}
          >
            <div className="drawer-header">
              <div className="drawer-brand">
                <span className="drawer-logo" aria-hidden="true">💊</span>
                <div className="drawer-brand-text">
                  <b>{tr(lang, 'أقسام المنصة السريرية', 'Clinical Portal Menu', 'Menu du Portail Clinique', 'Menú del Portal Clínico')}</b>
                  <small className="drawer-subtitle">
                    {tr(lang, 'جميع الأدوات والأدلة التوعوية', 'All Clinical Tools & Guides', 'Tous les outils et guides cliniques', 'Todas las herramientas y guías clínicas')}
                  </small>
                </div>
              </div>
              <button
                type="button"
                ref={drawerCloseBtnRef}
                className="drawer-close-btn"
                onClick={() => closeDrawer(true)}
                aria-label={tr(lang, 'إغلاق القائمة', 'Close menu', 'Fermer le menu', 'Cerrar menú')}
                title={tr(lang, 'إغلاق (Esc)', 'Close (Esc)', 'Fermer (Esc)', 'Cerrar (Esc)')}
              >
                ✕
              </button>
            </div>

            {/* Quick Language Selector inside Drawer */}
            <div className="drawer-lang-bar" aria-label={tr(lang, 'اختيار اللغة', 'Language selection', 'Choix de la langue', 'Selección de idioma')}>
              {SUPPORTED_LANGS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`drawer-lang-pill${item.code === lang ? ' active' : ''}`}
                  onClick={() => setLang(item.code)}
                >
                  <span aria-hidden="true">{item.flag}</span>
                  <span>{item.nativeLabel}</span>
                </button>
              ))}
            </div>

            <div className="drawer-links">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => closeDrawer(false)}
                  className={({ isActive }) => `drawer-item ${isActive ? 'active' : ''}`}
                >
                  <span className="item-icon" aria-hidden="true">{item.icon}</span>
                  <span className="item-title">{t(item.key)}</span>
                  <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
                </NavLink>
              ))}

              <div className="drawer-divider"></div>

              <NavLink
                to="/admin"
                onClick={() => closeDrawer(false)}
                className={({ isActive }) => `drawer-item admin ${isActive ? 'active' : ''}`}
              >
                <span className="item-icon" aria-hidden="true">⚙️</span>
                <span className="item-title">{t('navAdmin')}</span>
                <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
              </NavLink>

              {!user && (
                <>
                  <div className="drawer-divider"></div>
                  <button
                    type="button"
                    className="drawer-item drawer-auth-btn"
                    onClick={() => {
                      closeDrawer(false);
                      handleExitGuestMode();
                    }}
                  >
                    <span className="item-icon" aria-hidden="true">👤</span>
                    <span className="item-title">
                      {tr(lang, 'تسجيل الدخول (الخروج من وضع الزائر)', 'Sign In (Exit Guest Mode)', 'Connexion (Quitter le mode invité)', 'Iniciar sesión (Salir de invitado)')}
                    </span>
                    <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
                  </button>
                </>
              )}

              {user && (
                <>
                  <div className="drawer-divider"></div>
                  <button
                    type="button"
                    className="drawer-item drawer-logout-btn"
                    onClick={() => {
                      closeDrawer(false);
                      setShowLogoutModal(true);
                    }}
                  >
                    <span className="item-icon" aria-hidden="true">🚪</span>
                    <span className="item-title">{tr(lang, 'تسجيل الخروج', 'Logout', 'Déconnexion', 'Cerrar sesión')}</span>
                    <span className="item-arrow" aria-hidden="true">{pageDir === 'rtl' ? '←' : '→'}</span>
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

      {/* Single Logout Modal instance connected to both Layout and AuthContext */}
      <LogoutModal
        isOpen={showLogoutModal || authCtx.logoutModalOpen}
        onClose={() => {
          setShowLogoutModal(false);
          authCtx.closeLogoutModal();
        }}
      />

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
              {tr(
                lang,
                'المنصة الرقمية الوطنية للتوعية بالاستخدام الرشيد للمضادات الحيوية ومكافحة مقاومة الميكروبات (AMR) وفق أحدث دلائل هيئة الدواء المصرية ومنظمة الصحة العالمية.',
                'Digital health portal for rational antibiotic stewardship and antimicrobial resistance (AMR) education aligned with EDA and WHO guidelines.',
                'Portail numérique de santé pour le bon usage des antibiotiques et la lutte contre l’antibiorésistance (AMR), aligné sur les directives de l’OMS et de l’EDA.',
                'Portal digital de salud para el uso racional de antibióticos y la educación sobre resistencia antimicrobiana (RAM), alineado con las guías de la OMS y la EDA.'
              )}
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', margin: '0 0 10px' }}>
              {tr(lang, 'الأدوات السريرية السريعة', 'Quick Clinical Tools', 'Outils Cliniques Rapides', 'Herramientas Clínicas Rápidas')}
            </h4>
            <ul className="pro-footer-links">
              <li><Link to="/medicines">{tr(lang, 'السجل الدوائي المصري (206 عبوات)', 'Egyptian Drug Registry (206)', 'Registre des Médicaments (206)', 'Registro de Medicamentos (206)')}</Link></li>
              <li><Link to="/games">{tr(lang, 'مركز الألعاب والمحاكاة الطبية 3D', 'Game Center & 3D Medical Simulator', 'Centre de Jeux & Simulateur 3D', 'Centro de Juegos y Simulador 3D')}</Link></li>
              <li><Link to="/scan">{tr(lang, 'ماسح الباركود الخطي ورموز QR', 'Barcode & QR Scanner', 'Scanner Code-Barres & QR', 'Escáner de Código de Barras y QR')}</Link></li>
              <li><Link to="/allergy-checker">{tr(lang, 'فاحص الحساسية الدوائية المتقاطعة', 'Drug Allergy Safety Checker', 'Vérificateur d’Allergies Croisées', 'Verificador de Alergias Medicamentosas')}</Link></li>
              <li><Link to="/pediatric-helper">{tr(lang, 'حاسبة جرعات شراب الأطفال', 'Pediatric Dosage Calculator', 'Calculateur Posologique Pédiatrique', 'Calculadora de Dosis Pediátrica')}</Link></li>
              <li><Link to="/safe-disposal">{tr(lang, 'دليل التخلص الآمن وحماية البيئة', 'Safe Antibiotic Disposal', 'Guide d’Élimination Sûre', 'Guía de Eliminación Segura')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', margin: '0 0 10px' }}>
              {tr(lang, 'المصادر الطبية الرسمية والطوارئ', 'Official Sources & Emergency', 'Sources Officielles & Urgences', 'Fuentes Oficiales y Emergencias')}
            </h4>
            <ul className="pro-footer-links">
              <li>
                <a href="https://edaegypt.gov.eg" target="_blank" rel="noopener noreferrer">
                  {tr(lang, 'هيئة الدواء المصرية (EDA)', 'Egyptian Drug Authority (EDA)', 'Autorité Égyptienne des Médicaments (EDA)', 'Autoridad Egipcia de Medicamentos (EDA)')} ↗
                </a>
              </li>
              <li>
                <a href="https://www.who.int/health-topics/antimicrobial-resistance" target="_blank" rel="noopener noreferrer">
                  {tr(lang, 'منظمة الصحة العالمية (WHO AMR)', 'World Health Organization (WHO)', 'Organisation Mondiale de la Santé (OMS)', 'Organización Mundial de la Salud (OMS)')} ↗
                </a>
              </li>
              <li>
                <a href="https://medlineplus.gov/antibiotics.html" target="_blank" rel="noopener noreferrer">
                  {tr(lang, 'المكتبة الوطنية للطب (MedlinePlus)', 'NIH MedlinePlus Drug Info', 'Bibliothèque Nationale de Médecine (MedlinePlus)', 'Biblioteca Nacional de Medicina (MedlinePlus)')} ↗
                </a>
              </li>
              <li style={{ marginTop: '8px' }}>
                <a
                  href={`tel:${emergency.number}`}
                  style={{ color: '#fca5a5', fontWeight: 700, textDecoration: 'none' }}
                >
                  🚑{' '}
                  {tr(
                    lang,
                    `طوارئ الإسعاف (${emergency.flag} ${countryName}): ${emergency.number}`,
                    `Emergency Services (${emergency.flag} ${countryName}): ${emergency.number}`,
                    `Urgences Médicales (${emergency.flag} ${countryName}) : ${emergency.number}`,
                    `Emergencias Médicas (${emergency.flag} ${countryName}): ${emergency.number}`
                  )}
                </a>
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
