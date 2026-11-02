import { useEffect, useState } from 'react';
import { useLang } from './i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

export default function InstallPrompt() {
  const { lang } = useLang();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const ios = isIos();
  // Show only when there is something that actually works: a real install event (Android/Chrome) or iOS instructions.
  if (installed || hidden || (!deferred && !ios)) return null;

  const ar = lang === 'ar';
  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div
      role="dialog"
      aria-label={ar ? 'تثبيت التطبيق' : 'Install app'}
      style={{
        position: 'fixed', insetInline: 12, bottom: 'calc(12px + env(safe-area-inset-bottom))', zIndex: 9999,
        background: '#0B3C5D', color: '#fff', borderRadius: 14, padding: '12px 14px',
        boxShadow: '0 6px 24px rgba(0,0,0,.3)', display: 'flex', gap: 10, alignItems: 'center',
        maxWidth: 480, marginInline: 'auto', fontSize: '.92rem', lineHeight: 1.6,
      }}
    >
      <div style={{ flex: 1 }}>
        {deferred
          ? (ar ? 'ثبّت التطبيق على هاتفك لفتحه بسرعة من الشاشة الرئيسية.' : 'Install the app to open it quickly from your home screen.')
          : (ar ? 'على iPhone/iPad: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».' : 'On iPhone/iPad: tap Share, then “Add to Home Screen”.')}
      </div>
      {deferred && (
        <button onClick={install} style={{ background: '#2EC4B6', color: '#0B3C5D', border: 0, borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>
          {ar ? 'تثبيت' : 'Install'}
        </button>
      )}
      <button onClick={dismiss} aria-label={ar ? 'إغلاق' : 'Close'} style={{ background: 'transparent', color: '#fff', border: 0, fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
    </div>
  );
}
