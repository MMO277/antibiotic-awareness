import { useEffect, useState } from 'react';
import { useLang } from './i18n';
import { isNativePlatform } from './nativeAlarmService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
export const APK_DIRECT_DOWNLOAD_URL =
  'https://github.com/MMO277/antibiotic-awareness/releases/latest/download/Antibiotic-Awareness.apk';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
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

  // Hide inside the native Android APK or when already dismissed/installed
  if (isNativePlatform() || installed || hidden) return null;

  const ios = isIos();
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
      aria-label={ar ? 'تثبيت وتحميل التطبيق' : 'Install & Download App'}
      style={{
        position: 'fixed', insetInline: 12, bottom: 'calc(12px + env(safe-area-inset-bottom))', zIndex: 9999,
        background: '#0B3C5D', color: '#fff', borderRadius: 14, padding: '12px 14px',
        boxShadow: '0 6px 24px rgba(0,0,0,.35)', display: 'flex', gap: 10, alignItems: 'center',
        flexWrap: 'wrap', maxWidth: 540, marginInline: 'auto', fontSize: '.9rem', lineHeight: 1.5,
      }}
    >
      <div style={{ flex: '1 1 200px' }}>
        {ios
          ? (ar ? 'على iPhone/iPad: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».' : 'On iPhone/iPad: tap Share, then “Add to Home Screen”.')
          : (ar ? '📱 حمّل تطبيق الأندرويد الرسمي (APK) لتنبيهات الجرعات والوصول السريع:' : '📱 Download the official Android App (APK) for exact dose alarms & quick access:')}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!ios && (
          <a
            href={APK_DIRECT_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#2EC4B6', color: '#0B3C5D', textDecoration: 'none',
              borderRadius: 8, padding: '8px 12px', fontWeight: 800, fontSize: '.86rem', whiteSpace: 'nowrap',
            }}
          >
            {ar ? '📥 تحميل APK' : '📥 Download APK'}
          </a>
        )}
        {deferred && (
          <button
            onClick={install}
            style={{
              background: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8, padding: '7px 11px', fontWeight: 700, fontSize: '.84rem', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {ar ? 'تثبيت ويب' : 'Install Web'}
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label={ar ? 'إغلاق' : 'Close'}
          style={{ background: 'transparent', color: '#fff', border: 0, fontSize: '1.15rem', cursor: 'pointer', paddingInline: 4 }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
