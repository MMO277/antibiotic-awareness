import './lamp-login.css';
import {
  FormEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useAuth,
  translateAuthError,
  getSavedDeviceGoogleAccounts,
  fetchCloudSyncedGoogleAccounts,
  removeSavedDeviceGoogleAccount,
  resolveGoogleAvatarUrl,
  formatDisplayNameFromEmail,
  SavedGoogleAccount,
} from './authContext';
import { useLang } from './i18n';
import { configured } from './firebase';

/* ── Lamp intro helpers (UPDATE 49) ─────────────────────────────────────── */
const LAMP_SEEN_KEY = 'aa_lamp_seen';
type Stage = 'dark' | 'lighting' | 'lit';

const lampSeen = (): boolean => {
  try {
    return sessionStorage.getItem(LAMP_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};
const markLampSeen = () => {
  try {
    sessionStorage.setItem(LAMP_SEEN_KEY, '1');
  } catch {
    /* storage unavailable — intro simply plays again next time */
  }
};
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Exact logo mark copied unchanged from the header in Layout.tsx. */
function BrandMark({ size }: { size: number }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}favicon-192.png`}
      alt=""
      aria-hidden="true"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith('favicon.svg')) {
          img.src = `${import.meta.env.BASE_URL}favicon.svg`;
        }
      }}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.24)}px`,
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}

/**
 * Renders the user's real Google Account Profile Photo with automatic fallback
 * to a Google-styled initial avatar + official Google "G" corner badge.
 */
function GoogleAccountAvatar({
  email,
  photoURL,
  displayName,
  size = 42,
}: {
  email: string;
  photoURL?: string | null;
  displayName?: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = resolveGoogleAvatarUrl(email, photoURL);
  const initial = ((displayName || email || 'G').trim()[0] || 'G').toUpperCase();

  useEffect(() => {
    setImgError(false);
  }, [email, photoURL]);

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
      }}
    >
      {resolvedSrc && !imgError ? (
        <img
          src={resolvedSrc}
          alt={displayName || email}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(45, 212, 191, 0.7)',
            background: '#0f172a',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0284c7 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: `${Math.round(size * 0.44)}px`,
            border: '2px solid rgba(45, 212, 191, 0.7)',
          }}
        >
          {initial}
        </div>
      )}

      <span
        style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        }}
        aria-hidden="true"
      >
        <svg width="11" height="11" viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
          />
          <path
            fill="#FF3D00"
            d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
          />
        </svg>
      </span>
    </div>
  );
}

const CHAIN_BASE = 92; // px, resting rope length
const CHAIN_MAX = 72; // px, max drag distance
const CHAIN_TRIGGER = 34; // px drag that lights the lamp

function Lamp({
  isAr,
  interactive,
  onPull,
  handleRef,
}: {
  isAr: boolean;
  interactive: boolean;
  onPull: () => void;
  handleRef: RefObject<HTMLButtonElement>;
}) {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const dyRef = useRef(0);

  const move = (v: number) => {
    dyRef.current = v;
    setDy(v);
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!interactive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    setDragging(true);
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    move(Math.max(0, Math.min(CHAIN_MAX, e.clientY - startY.current)));
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    const moved = dyRef.current;
    if (moved >= CHAIN_TRIGGER || moved < 6) {
      move(CHAIN_MAX * 0.8);
      window.setTimeout(() => move(0), 140);
      onPull();
    } else {
      move(0);
    }
  };
  const onCancel = () => {
    setDragging(false);
    move(0);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      move(CHAIN_MAX * 0.8);
      window.setTimeout(() => move(0), 140);
      onPull();
    }
  };

  return (
    <div className="lamp-fig" aria-hidden={interactive ? undefined : true}>
      <div className="lamp-glow" />
      <div className="lamp-cone" />
      <svg className="lamp-svg" viewBox="0 0 300 260" aria-hidden="true" focusable="false">
        <rect x="148" y="-600" width="4" height="668" fill="#2a3338" />
        <rect x="138" y="62" width="24" height="16" rx="3" fill="#161d21" />
        <path d="M52 142 Q52 80 150 80 Q248 80 248 142 Z" fill="#10171b" stroke="#222c31" strokeWidth="2" />
        <path d="M70 128 Q90 92 150 90" fill="none" stroke="#2c373d" strokeWidth="3" strokeLinecap="round" />
        <ellipse className="lamp-rim" cx="150" cy="142" rx="98" ry="7" fill="#1a2328" />
        <circle className="lamp-bulb" cx="150" cy="150" r="16" />
      </svg>
      <div className={'lamp-chain' + (interactive && !dragging && dy === 0 ? ' hint' : '')}>
        <div
          className="lamp-rope"
          style={{ height: CHAIN_BASE + dy, transition: dragging ? 'none' : undefined }}
        />
        <button
          type="button"
          ref={handleRef}
          className="lamp-pull"
          tabIndex={interactive ? 0 : -1}
          disabled={!interactive}
          aria-label={isAr ? 'اسحب السلسلة لإضاءة الشاشة' : 'Pull the chain to turn on the light'}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
          onKeyDown={onKey}
          style={{ transition: dragging ? 'none' : undefined }}
        />
      </div>
    </div>
  );
}

export default function AuthModal() {
  const {
    user,
    modalOpen,
    modalMode,
    openAuthModal,
    closeAuthModal,
    continueAsGuest,
    login,
    register,
    loginWithGoogle,
    loginWithNativeGoogleAccount,
    activateAppBridgeNow,
    needsAppBridgeActivation,
    hasNativeGoogleAccountPicker,
    triggerNativeGoogleAccountPicker,
    resetPassword,
    error,
    clearError,
  } = useAuth();
  const { lang, t } = useLang();
  const isAr = lang === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localValidationMsg, setLocalValidationMsg] = useState('');
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState<SavedGoogleAccount[]>([]);
  const [pendingBridgeEmail, setPendingBridgeEmail] = useState<string | null>(null);
  const [urlBridgeTargetEmail, setUrlBridgeTargetEmail] = useState<string | null>(null);
  const [bridgeSuccessDone, setBridgeSuccessDone] = useState(false);

  // Lamp intro state (UPDATE 49): purely visual — never touches auth logic.
  const [stage, setStage] = useState<Stage>('lit');
  const [instant, setInstant] = useState(true);
  const pullRef = useRef<HTMLButtonElement>(null);

  // Detect if opened in Chrome with ?auto_bridge_email=... from the Android App
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetEmail = params.get('auto_bridge_email');
    if (targetEmail && targetEmail.includes('@')) {
      setUrlBridgeTargetEmail(targetEmail.trim().toLowerCase());
      markLampSeen();
      setInstant(true);
      setStage('lit');
    }
  }, []);

  useEffect(() => {
    if (!modalOpen && !urlBridgeTargetEmail) return;
    markLampSeen();
    setInstant(true);
    setStage('lit');
    setSavedGoogleAccounts(getSavedDeviceGoogleAccounts());
    setPendingBridgeEmail(null);
    void fetchCloudSyncedGoogleAccounts().then((cloudList) => {
      setSavedGoogleAccounts(cloudList);
    });
  }, [modalOpen, urlBridgeTargetEmail]);

  // Background auto-polling in the App when waiting for 1-time Website-to-App account bridge
  useEffect(() => {
    if (!pendingBridgeEmail || !modalOpen) return;
    const timer = window.setInterval(() => {
      loginWithNativeGoogleAccount({ email: pendingBridgeEmail }).catch(() => {
        /* still waiting for 1-time link */
      });
    }, 2200);
    return () => window.clearInterval(timer);
  }, [pendingBridgeEmail, modalOpen, loginWithNativeGoogleAccount]);

  useEffect(() => {
    if (stage !== 'lighting') return;
    const id = window.setTimeout(() => setStage('lit'), 800);
    return () => window.clearTimeout(id);
  }, [stage]);

  useEffect(() => {
    if (modalOpen && stage === 'dark') pullRef.current?.focus({ preventScroll: true });
  }, [modalOpen, stage]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, closeAuthModal]);

  const lightUp = () => {
    markLampSeen();
    setInstant(false);
    setStage((s) => (s === 'dark' ? 'lighting' : 'dark'));
  };
  const skipIntro = () => {
    markLampSeen();
    setInstant(true);
    setStage('lit');
  };

  /**
   * Special Overlay when Chrome opens with `?auto_bridge_email=...` OR when the user is already
   * logged in on the Website and needs 1-tap activation to sync their session with the Android App!
   * Works EVEN WHEN `modalOpen` is false (because `user` is already logged in on Chrome!).
   */
  if (urlBridgeTargetEmail || (user && needsAppBridgeActivation && !hasNativeGoogleAccountPicker())) {
    const targetEmail = urlBridgeTargetEmail || user?.email || '';
    const targetName = user?.displayName || formatDisplayNameFromEmail(targetEmail);
    const targetPhoto = user?.photoURL || resolveGoogleAvatarUrl(targetEmail);

    const handleConfirmOneTapSync = async () => {
      setGoogleSubmitting(true);
      const ok = await activateAppBridgeNow(targetEmail);
      setGoogleSubmitting(false);
      if (ok) {
        setBridgeSuccessDone(true);
        // Clean URL parameter
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        if (urlBridgeTargetEmail) {
          setTimeout(() => {
            setUrlBridgeTargetEmail(null);
          }, 2500);
        }
      }
    };

    if (urlBridgeTargetEmail) {
      return (
        <div
          role="dialog"
          aria-modal="true"
          dir={isAr ? 'rtl' : 'ltr'}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000020,
            background: 'rgba(6, 15, 28, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#0f172a',
              border: '2px solid #14b8a6',
              borderRadius: '24px',
              padding: '24px 20px',
              textAlign: 'center',
              color: '#fff',
              boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <GoogleAccountAvatar
                email={targetEmail}
                photoURL={targetPhoto}
                displayName={targetName}
                size={64}
              />
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: '#fff' }}>
              {bridgeSuccessDone
                ? isAr
                  ? '✅ تم ربط حسابك بالتطبيق بنجاح!'
                  : '✅ Account Linked to App!'
                : isAr
                  ? 'تأكيد تشغيل حسابك على التطبيق'
                  : 'Confirm Account for Mobile App'}
            </h2>
            <p style={{ margin: '0 0 16px', color: '#5eead4', fontWeight: 800, direction: 'ltr' }}>
              {targetEmail}
            </p>
            {bridgeSuccessDone ? (
              <p style={{ fontSize: '0.9rem', color: '#d1fae5', lineHeight: 1.6 }}>
                {isAr
                  ? 'ارجع الآن لتطبيق الموبايل المفتوح عندك — ستجده دخل تلقائياً بنفس حسابك وصلاحياتك!'
                  : 'Return to your mobile app now — it is automatically signing you into your exact account!'}
              </p>
            ) : (
              <>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.6 }}>
                  {isAr
                    ? 'اضغط الزر بالأسفل لتأكيد حسابك في Google لمرة واحدة فقط، وسيتم فتح نفس حسابك بكل بياناته وصلاحياته داخل التطبيق فوراً بدون أي باسورد:'
                    : 'Tap the button below once to authorize your Google account, and your mobile app will sign into this exact account immediately:'}
                </p>
                <button
                  type="button"
                  onClick={handleConfirmOneTapSync}
                  disabled={googleSubmitting}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #059669 0%, #0d9488 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px',
                    fontWeight: 900,
                    fontSize: '0.96rem',
                    cursor: 'pointer',
                    marginBottom: '10px',
                  }}
                >
                  {googleSubmitting
                    ? isAr
                      ? 'جاري تأكيد الحساب...'
                      : 'Confirming Account...'
                    : isAr
                      ? '✅ تأكيد وتشغيل الحساب في التطبيق الآن'
                      : '✅ Confirm & Activate in App Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setUrlBridgeTargetEmail(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    // Floating 1-Tap Banner on the Website when user is logged in from an old session
    if (!modalOpen) {
      return (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          style={{
            position: 'fixed',
            bottom: '16px',
            insetInline: '16px',
            maxWidth: '520px',
            marginInline: 'auto',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '2px solid #14b8a6',
            borderRadius: '16px',
            padding: '12px 16px',
            color: '#fff',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <GoogleAccountAvatar
              email={targetEmail}
              photoURL={targetPhoto}
              displayName={targetName}
              size={38}
            />
            <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
              <strong style={{ display: 'block', color: '#5eead4' }}>
                📱 {isAr ? 'مزامنة حسابك مع تطبيق الأندرويد' : 'Sync Account with Android App'}
              </strong>
              <span style={{ color: '#cbd5e1' }}>
                {isAr
                  ? 'اضغط لتفعيل الدخول المباشر بنفس حسابك في التطبيق بدون باسورد'
                  : 'Tap once to enable 1-tap passwordless sign-in on the mobile app'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfirmOneTapSync}
            disabled={googleSubmitting}
            style={{
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {googleSubmitting
              ? isAr
                ? 'جاري الربط...'
                : 'Syncing...'
              : isAr
                ? 'تفعيل للتطبيق ✓'
                : 'Enable for App ✓'}
          </button>
        </div>
      );
    }
  }

  if (!modalOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalValidationMsg('');

    if (!configured) {
      setLocalValidationMsg(
        isAr
          ? 'خدمة الحسابات السحابية غير مفعّلة في هذه النسخة (إعدادات Firebase غير متوفرة). يمكنك متابعة التصفح كزائر.'
          : 'Cloud accounts are not configured in this build. You can continue as a guest.'
      );
      return;
    }

    if (modalMode === 'register') {
      if (password.length < 6) {
        setLocalValidationMsg(
          isAr
            ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.'
            : 'Password must be at least 6 characters long.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setLocalValidationMsg(
          isAr ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      if (modalMode === 'login') {
        await login(email, password, rememberMe);
      } else if (modalMode === 'register') {
        await register(email, password, displayName, rememberMe);
      } else if (modalMode === 'forgot') {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch {
      /* error is handled in authContext */
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async (hintEmail?: string) => {
    clearError();
    setLocalValidationMsg('');
    setPendingBridgeEmail(null);
    setGoogleSubmitting(true);
    try {
      let targetHint = hintEmail;
      if (!targetHint && hasNativeGoogleAccountPicker()) {
        const picked = await triggerNativeGoogleAccountPicker();
        if (!picked) {
          setGoogleSubmitting(false);
          return;
        }
        targetHint = picked;
      }
      await loginWithGoogle(targetHint);
    } catch (err: any) {
      if (err?.code === 'auth/needs-one-time-web-bridge' && err?.email) {
        setPendingBridgeEmail(err.email);
        return;
      }
      const msg = err?.message || String(err);
      if (
        msg.includes('missing initial state') ||
        msg.includes('storage-partitioned') ||
        err?.code === 'auth/popup-blocked'
      ) {
        setLocalValidationMsg(
          isAr
            ? '⚠️ تعذر فتح نافذة Google المنبثقة. يرجى السماح بالنوافذ المنبثقة أو اختيار حسابك مباشرة.'
            : '⚠️ Could not open Google popup. Please allow popups or select your account directly.'
        );
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleOpenChromeOneTimeBridge = (targetEmail: string) => {
    const webUrl = `https://mmo277.github.io/antibiotic-awareness/?auto_bridge_email=${encodeURIComponent(targetEmail)}`;
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
      const intentUri = `intent://mmo277.github.io/antibiotic-awareness/?auto_bridge_email=${encodeURIComponent(targetEmail)}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
      const a = document.createElement('a');
      a.href = intentUri;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRemoveSavedAccount = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedDeviceGoogleAccount(emailToRemove);
    setSavedGoogleAccounts(getSavedDeviceGoogleAccounts());
  };

  const errorMessage =
    localValidationMsg || (error ? translateAuthError(error, isAr) : '');

  const isLit = stage === 'lit';
  const isOn = stage !== 'dark';

  return (
    <div
      className={'auth-scene' + (isOn ? ' is-on' : '') + (isLit ? ' is-lit' : '') + (instant ? ' is-instant' : '')}
      onClick={(e) => {
        if (isLit && e.target === e.currentTarget) closeAuthModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'تسجيل الدخول' : 'Sign in'}
    >
      <div className="auth-stage">
        <div className="auth-lamp">
          <Lamp isAr={isAr} interactive={true} onPull={lightUp} handleRef={pullRef} />
        </div>

        {/* Stage A — dark screen prompt */}
        {stage !== 'lit' && (
          <div className="auth-dark-ui">
            <div className="auth-badge">
              <BrandMark size={44} />
            </div>
            <div className="auth-dark-name">{t('appName')}</div>
            <div className="auth-dark-hint">{isAr ? 'اسحب لإضاءة الشاشة' : 'Pull the chain to light the screen'}</div>
            <div className="auth-dark-actions">
              <button type="button" className="auth-skip" onClick={skipIntro}>
                {isAr ? 'تخطي الحركة' : 'Skip Animation'}
              </button>
              <button type="button" className="auth-guest-btn" onClick={continueAsGuest}>
                👀 {isAr ? 'متابعة كزائر' : 'Continue as Guest'}
              </button>
            </div>
          </div>
        )}

        {stage === 'dark' && (
          <button
            type="button"
            className="auth-close"
            onClick={closeAuthModal}
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            ✕
          </button>
        )}

        {/* Stage B — glass login panel */}
        {isLit && (
          <div className="auth-glass">
            {/* Close button */}
            <button
              type="button"
              className="auth-close"
              onClick={closeAuthModal}
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="auth-head">
              <div className="auth-badge small">
                <BrandMark size={30} />
              </div>
              <div className="auth-brandname">{t('appName')}</div>
              <h2>
                {modalMode === 'login'
                  ? isAr ? 'مرحبًا بعودتك' : 'Welcome Back'
                  : modalMode === 'register'
                  ? isAr ? 'إنشاء حساب مريض جديد' : 'Create Patient Account'
                  : isAr ? 'استعادة كلمة المرور' : 'Reset Password'}
              </h2>
              <p>
                {modalMode === 'login'
                  ? isAr ? 'اختر حساب Google الخاص بك للدخول الفوري بنفس حساب الموقع بدون باسورد' : 'Select your Google account for instant 1-tap sign-in with your website account'
                  : modalMode === 'register'
                  ? isAr ? 'احفظ بياناتك الصحية وجداول جرعاتك بمزامنة سحابية آمنة' : 'Securely sync your health profile and doses'
                  : isAr ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط استعادة الحساب' : 'Enter your email to receive a password reset link'}
              </p>
            </div>

            {/* Guest Mode Notice when Firebase is not configured */}
            {!configured && (
              <div className="auth-guest">
                <strong>{isAr ? '⚠️ تنبيه وضع الزائر:' : '⚠️ Guest Mode Notice:'}</strong>{' '}
                {isAr
                  ? 'خدمة الحسابات السحابية غير مفعّلة في هذه النسخة لعدم توفر إعدادات Firebase. يمكنك متابعة استخدام وتصفح جميع أقسام وأدوات الموقع كضيف بشكل كامل وآمن محلياً.'
                  : 'Cloud accounts are not configured in this build. You can continue safely using all platform tools offline as a guest.'}
                <div>
                  <button type="button" onClick={closeAuthModal}>
                    {isAr ? 'متابعة التصفح كزائر' : 'Continue as Guest'}
                  </button>
                </div>
              </div>
            )}

            {/* Mode switcher tabs (Login vs Register) */}
            {modalMode !== 'forgot' && (
              <div className="auth-tabs">
                <button
                  type="button"
                  className={modalMode === 'login' ? 'on' : ''}
                  onClick={() => {
                    openAuthModal('login');
                    setResetSent(false);
                  }}
                >
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </button>
                <button
                  type="button"
                  className={modalMode === 'register' ? 'on' : ''}
                  onClick={() => {
                    openAuthModal('register');
                    setResetSent(false);
                  }}
                >
                  {isAr ? 'حساب جديد' : 'New Account'}
                </button>
              </div>
            )}

            {/* Real Google Account Chooser (with Profile Photos, Full Name, Email & 1-Tap Sign-In) */}
            {modalMode !== 'forgot' && configured && (
              <>
                {savedGoogleAccounts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#5eead4', fontWeight: 800 }}>
                      ✨ {isAr ? 'اختر حساب Google للدخول الفوري (نفس حساب الموقع بالصورة والبيانات):' : 'Select your Google account (Unified Website & App Account):'}
                    </div>
                    {savedGoogleAccounts.map((acc) => (
                      <div
                        key={acc.email}
                        onClick={() => !googleSubmitting && handleGoogleLogin(acc.email)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!googleSubmitting) handleGoogleLogin(acc.email);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.94)',
                          border: '1.5px solid rgba(20, 184, 166, 0.5)',
                          borderRadius: '14px',
                          padding: '10px 12px',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: isAr ? 'right' : 'left',
                        }}
                      >
                        <GoogleAccountAvatar
                          email={acc.email}
                          photoURL={acc.photoURL}
                          displayName={acc.displayName}
                          size={44}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>
                            {acc.displayName}
                          </div>
                          <div
                            style={{
                              fontSize: '0.76rem',
                              color: '#94a3b8',
                              direction: 'ltr',
                              textAlign: isAr ? 'right' : 'left',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {acc.email}
                          </div>
                        </div>
                        <span
                          style={{
                            background: 'rgba(20, 184, 166, 0.2)',
                            color: '#2dd4bf',
                            padding: '5px 10px',
                            borderRadius: '99px',
                            fontSize: '0.76rem',
                            fontWeight: 900,
                          }}
                        >
                          {isAr ? 'دخول فوري ←' : 'Sign In →'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedAccount(acc.email, e)}
                          title={isAr ? 'إزالة من القائمة' : 'Remove'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '0.8rem',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* One-Time Website-to-App Account Sync Card */}
                {pendingBridgeEmail && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.96)',
                      border: '2px solid #10b981',
                      borderRadius: '16px',
                      padding: '14px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <GoogleAccountAvatar
                        email={pendingBridgeEmail}
                        displayName={formatDisplayNameFromEmail(pendingBridgeEmail)}
                        size={44}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>
                          {formatDisplayNameFromEmail(pendingBridgeEmail)}
                        </strong>
                        <span style={{ color: '#6ee7b7', fontSize: '0.77rem', direction: 'ltr', display: 'block' }}>
                          {pendingBridgeEmail}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 10px', lineHeight: 1.55 }}>
                      {isAr
                        ? 'لتشغيل نفس حسابك المسجل على الموقع داخل التطبيق بكامل صلاحياته وبياناته بدون كتابة باسورد، اضغط الزر الأخضر بالأسفل لتأكيده بضغطة واحدة فقط:'
                        : 'To activate your exact website account & admin permissions inside the app without a password, tap the green button below once:'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenChromeOneTimeBridge(pendingBridgeEmail)}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(90deg, #059669 0%, #0d9488 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                      }}
                    >
                      ✅ {isAr ? 'تأكيد وتشغيل حساب الموقع بضغطة واحدة' : '1-Tap Confirm Website Account'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="auth-google"
                  onClick={() => handleGoogleLogin()}
                  disabled={googleSubmitting}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  {googleSubmitting
                    ? isAr ? 'جاري تسجيل الدخول بحسابك في Google...' : 'Signing in with Google...'
                    : isAr ? 'المتابعة بحساب Google الرسمي (نفس حساب الموقع)' : 'Continue with Google (Unified Account)'}
                </button>
                <div className="auth-or" aria-hidden="true">
                  <span>{isAr ? 'أو بالبريد الإلكتروني' : 'or with email'}</span>
                </div>
              </>
            )}

            {/* Error Alert */}
            {errorMessage && !pendingBridgeEmail && (
              <div className="auth-error" role="alert">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Success Alert for Password Reset */}
            {modalMode === 'forgot' && resetSent && (
              <div className="auth-success" role="status">
                ✅ {isAr ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' : 'Password reset link sent to your email.'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {modalMode === 'register' && (
                <div>
                  <label htmlFor="auth-name">
                    {isAr ? 'الاسم بالكامل / اسم المريض:' : 'Full Name / Patient Name:'}
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    disabled={submitting || !configured}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email">{isAr ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={submitting || !configured}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  required
                  style={{ direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}
                />
              </div>

              {modalMode !== 'forgot' && (
                <div>
                  <div className="auth-label-row">
                    <label htmlFor="auth-password">{isAr ? 'كلمة المرور:' : 'Password:'}</label>
                    {modalMode === 'login' && (
                      <button
                        type="button"
                        className="auth-link"
                        disabled={!configured}
                        onClick={() => {
                          openAuthModal('forgot');
                          setResetSent(false);
                        }}
                      >
                        {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                      </button>
                    )}
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={modalMode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    disabled={submitting || !configured}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ direction: 'ltr' }}
                  />
                </div>
              )}

              {modalMode === 'register' && (
                <div>
                  <label htmlFor="auth-confirm">{isAr ? 'تأكيد كلمة المرور:' : 'Confirm Password:'}</label>
                  <input
                    id="auth-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    disabled={submitting || !configured}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ direction: 'ltr' }}
                  />
                </div>
              )}

              {modalMode !== 'forgot' && (
                <div className="auth-remember">
                  <label>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      disabled={submitting || !configured}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>{isAr ? 'تذكرني على هذا الجهاز' : 'Remember me on this device'}</span>
                  </label>
                </div>
              )}

              <button type="submit" className="btn auth-submit" disabled={submitting || !configured}>
                {!configured
                  ? isAr ? 'المصادقة غير متوفرة (وضع الزائر نشط)' : 'Auth unavailable (Guest mode active)'
                  : submitting
                  ? isAr ? 'جاري التحقق...' : 'Verifying...'
                  : modalMode === 'login'
                  ? isAr ? 'تسجيل الدخول' : 'Sign In'
                  : modalMode === 'register'
                  ? isAr ? 'إنشاء الحساب' : 'Create Account'
                  : isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
              </button>
            </form>

            {modalMode === 'forgot' && (
              <div className="auth-back">
                <button type="button" className="auth-link" onClick={() => openAuthModal('login')}>
                  ← {isAr ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                </button>
              </div>
            )}
            {/* Continue as Guest option for all visitors */}
            <div className="auth-guest-prompt">
              <button type="button" className="auth-guest-link" onClick={continueAsGuest}>
                👀 {isAr ? 'متابعة التصفح كزائر بدون حساب' : 'Continue browsing as guest'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
