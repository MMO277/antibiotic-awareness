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
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <g transform="rotate(-40 16 16)">
        <rect x="3" y="10" width="26" height="12" rx="6" fill="#fff" />
        <path d="M16 10h7a6 6 0 0 1 0 12h-7z" fill="#17B8C4" />
      </g>
    </svg>
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

  // Reset error state when email changes
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

      {/* Official Google "G" Mini Badge */}
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
    modalOpen,
    modalMode,
    openAuthModal,
    closeAuthModal,
    continueAsGuest,
    login,
    register,
    loginWithGoogle,
    loginWithNativeGoogleAccount,
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

  // Native-Style Google Account Chooser Sheet state
  const [showGoogleChooserSheet, setShowGoogleChooserSheet] = useState(false);
  const [addingCustomGoogleAccount, setAddingCustomGoogleAccount] = useState(false);
  const [quickGoogleEmail, setQuickGoogleEmail] = useState('');
  const [quickGoogleName, setQuickGoogleName] = useState('');

  // Lamp intro state (UPDATE 49): purely visual — never touches auth logic.
  const [stage, setStage] = useState<Stage>('dark');
  const [instant, setInstant] = useState(false);
  const pullRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!modalOpen) return;
    const skip = lampSeen() || prefersReducedMotion();
    setInstant(skip);
    setStage(skip ? 'lit' : 'dark');
    setSavedGoogleAccounts(getSavedDeviceGoogleAccounts());
    setShowGoogleChooserSheet(false);
    setAddingCustomGoogleAccount(false);
  }, [modalOpen]);

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
      if (e.key === 'Escape') {
        if (showGoogleChooserSheet) {
          setShowGoogleChooserSheet(false);
        } else {
          closeAuthModal();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, showGoogleChooserSheet, closeAuthModal]);

  const lightUp = () => {
    markLampSeen();
    setStage((s) => (s === 'dark' ? 'lighting' : s));
  };
  const skipIntro = () => {
    markLampSeen();
    setInstant(true);
    setStage('lit');
  };

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

  /**
   * Instant 1-Tap Sign-In when clicking a saved Google Account card (with photo & data)
   */
  const handleSelectSavedGoogleAccount = async (acc: SavedGoogleAccount) => {
    clearError();
    setLocalValidationMsg('');
    setGoogleSubmitting(true);
    try {
      await loginWithNativeGoogleAccount({
        email: acc.email,
        displayName: acc.displayName,
        photoURL: acc.photoURL || undefined,
        uid: acc.uid,
      });
    } catch {
      /* handled in context */
    } finally {
      setGoogleSubmitting(false);
    }
  };

  /**
   * Triggers Android's native system account picker (`AccountManager` / `GoogleSignIn`)
   * and logs the user in IMMEDIATELY with their photo & data without any password or external WebView!
   */
  const handlePickFromPhoneSystem = async () => {
    clearError();
    setLocalValidationMsg('');
    setGoogleSubmitting(true);
    try {
      if (hasNativeGoogleAccountPicker()) {
        const pickedRaw = await triggerNativeGoogleAccountPicker();
        if (pickedRaw) {
          if (pickedRaw.startsWith('{')) {
            try {
              const parsed = JSON.parse(pickedRaw);
              if (parsed && parsed.email) {
                await loginWithNativeGoogleAccount(parsed);
                return;
              }
            } catch {
              /* fallback to plain email */
            }
          }
          await loginWithNativeGoogleAccount({
            email: pickedRaw,
          });
          return;
        }
      } else {
        // Not in APK bridge -> open the in-app Google Account Chooser Sheet
        setShowGoogleChooserSheet(true);
        if (savedGoogleAccounts.length === 0) {
          setAddingCustomGoogleAccount(true);
        }
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  /**
   * Main "Continue with Google" button handler:
   * Opens the Google Account Chooser Sheet (or directly triggers Android native account picker if in APK with no saved accounts yet).
   */
  const handleMainGoogleButtonClick = async () => {
    clearError();
    setLocalValidationMsg('');
    if (savedGoogleAccounts.length > 0) {
      setShowGoogleChooserSheet(true);
      setAddingCustomGoogleAccount(false);
      return;
    }
    if (hasNativeGoogleAccountPicker()) {
      await handlePickFromPhoneSystem();
      return;
    }
    setShowGoogleChooserSheet(true);
    setAddingCustomGoogleAccount(true);
  };

  /**
   * Instant Passwordless Sign-In with a Google email entered in the Account Chooser Sheet
   * (automatically resolves their Google profile photo & name without opening any external site).
   */
  const handleQuickGoogleAccountSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalValidationMsg('');
    let cleanEmail = quickGoogleEmail.trim().toLowerCase();
    if (!cleanEmail) return;
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@gmail.com`;
    }
    setGoogleSubmitting(true);
    try {
      await loginWithNativeGoogleAccount({
        email: cleanEmail,
        displayName: quickGoogleName.trim() || formatDisplayNameFromEmail(cleanEmail),
        photoURL: resolveGoogleAvatarUrl(cleanEmail),
      });
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleRemoveSavedAccount = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedDeviceGoogleAccount(emailToRemove);
    setSavedGoogleAccounts(getSavedDeviceGoogleAccounts());
  };

  const previewEmailForQuickAdd = quickGoogleEmail.trim()
    ? quickGoogleEmail.includes('@')
      ? quickGoogleEmail.trim().toLowerCase()
      : `${quickGoogleEmail.trim().toLowerCase()}@gmail.com`
    : '';

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
          <Lamp isAr={isAr} interactive={stage === 'dark'} onPull={lightUp} handleRef={pullRef} />
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
                  ? isAr ? 'اختر حساب Google الخاص بك للدخول الفوري بضغطة واحدة بدون كلمة مرور' : 'Pick your Google account for instant 1-tap passwordless sign-in'
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

            {/* Instant Google Account Picker Cards (with Profile Photos, Name & Email — ZERO password needed!) */}
            {modalMode !== 'forgot' && (
              <>
                {savedGoogleAccounts.length > 0 && !showGoogleChooserSheet && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginBottom: '12px',
                      background: 'rgba(15, 23, 42, 0.65)',
                      padding: '12px',
                      borderRadius: '16px',
                      border: '1px solid rgba(45, 212, 191, 0.3)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.78rem',
                        color: '#99f6e4',
                        fontWeight: 800,
                      }}
                    >
                      <span>
                        ✨ {isAr ? 'حسابات Google على هذا الجهاز (دخول فوري بدون باسورد):' : 'Google accounts on this device (1-Tap Instant Sign-In):'}
                      </span>
                    </div>

                    {savedGoogleAccounts.map((acc) => (
                      <div
                        key={acc.email}
                        onClick={() => !googleSubmitting && handleSelectSavedGoogleAccount(acc)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!googleSubmitting) handleSelectSavedGoogleAccount(acc);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.95)',
                          border: '1.5px solid rgba(20, 184, 166, 0.5)',
                          borderRadius: '14px',
                          padding: '10px 12px',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: isAr ? 'right' : 'left',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                        }}
                      >
                        <GoogleAccountAvatar
                          email={acc.email}
                          photoURL={acc.photoURL}
                          displayName={acc.displayName}
                          size={44}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc' }}>
                            {acc.displayName}
                          </div>
                          <div
                            style={{
                              fontSize: '0.77rem',
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
                            color: '#5eead4',
                            padding: '5px 10px',
                            borderRadius: '99px',
                            fontSize: '0.76rem',
                            fontWeight: 900,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isAr ? 'دخول فوري ←' : '1-Tap Sign In →'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedAccount(acc.email, e)}
                          title={isAr ? 'إزالة الحساب من القائمة' : 'Remove from list'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '0.82rem',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Native-Style Google Account Chooser Sheet (Expanded inside Modal) */}
                {showGoogleChooserSheet ? (
                  <div
                    style={{
                      background: '#0f172a',
                      border: '2px solid #14b8a6',
                      borderRadius: '18px',
                      padding: '16px',
                      marginBottom: '14px',
                      boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                        </svg>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: '#fff', display: 'block' }}>
                            {isAr ? 'اختر حساب Google للمتابعة' : 'Choose a Google Account'}
                          </strong>
                          <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                            {isAr
                              ? 'دخول مباشر داخل التطبيق بالصورة والبيانات بدون كلمة مرور'
                              : 'Direct in-app sign-in with profile photo & data — no password required'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGoogleChooserSheet(false)}
                        style={{
                          background: 'rgba(148,163,184,0.15)',
                          border: 'none',
                          color: '#cbd5e1',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontWeight: 800,
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Saved Accounts inside Sheet */}
                    {savedGoogleAccounts.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                        {savedGoogleAccounts.map((acc) => (
                          <button
                            key={acc.email}
                            type="button"
                            onClick={() => handleSelectSavedGoogleAccount(acc)}
                            disabled={googleSubmitting}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              width: '100%',
                              background: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '12px',
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
                              size={42}
                            />
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>
                                {acc.displayName}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#94a3b8', direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}>
                                {acc.email}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Native Android System Account Picker Button (when in APK) */}
                    {hasNativeGoogleAccountPicker() && (
                      <button
                        type="button"
                        onClick={handlePickFromPhoneSystem}
                        disabled={googleSubmitting}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: 'linear-gradient(90deg, #0d9488 0%, #0284c7 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '11px 14px',
                          fontWeight: 900,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          marginBottom: '10px',
                        }}
                      >
                        <span>📱</span>
                        <span>
                          {isAr
                            ? 'إظهار حسابات Google المسجلة على الهاتف (دخول فوري)'
                            : 'Pick from Phone Google Accounts (Instant)'}
                        </span>
                      </button>
                    )}

                    {/* Quick Passwordless Google Account Addition with Live Avatar Preview */}
                    {!addingCustomGoogleAccount ? (
                      <button
                        type="button"
                        onClick={() => setAddingCustomGoogleAccount(true)}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.7)',
                          color: '#e2e8f0',
                          border: '1px dashed #475569',
                          borderRadius: '12px',
                          padding: '10px',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        ➕ {isAr ? 'استخدام حساب Google آخر بدون باسورد' : 'Use another Google account (Passwordless)'}
                      </button>
                    ) : (
                      <form onSubmit={handleQuickGoogleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {previewEmailForQuickAdd && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              background: 'rgba(20, 184, 166, 0.14)',
                              border: '1px solid rgba(45, 212, 191, 0.4)',
                              borderRadius: '12px',
                              padding: '8px 12px',
                            }}
                          >
                            <GoogleAccountAvatar
                              email={previewEmailForQuickAdd}
                              displayName={quickGoogleName || formatDisplayNameFromEmail(previewEmailForQuickAdd)}
                              size={40}
                            />
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#fff' }}>
                                {quickGoogleName.trim() || formatDisplayNameFromEmail(previewEmailForQuickAdd)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#5eead4', direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}>
                                {previewEmailForQuickAdd}
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                            {isAr ? 'بريد حساب Google (سيتم جلب صورتك تلقائياً بدون باسورد):' : 'Google Email (fetches your profile photo automatically):'}
                          </label>
                          <input
                            type="text"
                            value={quickGoogleEmail}
                            onChange={(e) => setQuickGoogleEmail(e.target.value)}
                            placeholder="yourname@gmail.com"
                            required
                            dir="ltr"
                            style={{
                              width: '100%',
                              background: '#1e293b',
                              color: '#fff',
                              border: '1px solid #14b8a6',
                              borderRadius: '10px',
                              padding: '9px 12px',
                              fontSize: '0.88rem',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                            {isAr ? 'الاسم الظاهر في الحساب (اختياري):' : 'Display Name (optional):'}
                          </label>
                          <input
                            type="text"
                            value={quickGoogleName}
                            onChange={(e) => setQuickGoogleName(e.target.value)}
                            placeholder={
                              previewEmailForQuickAdd
                                ? formatDisplayNameFromEmail(previewEmailForQuickAdd)
                                : isAr
                                  ? 'مثال: د. محمد أحمد'
                                  : 'e.g. Dr. Mohamed'
                            }
                            style={{
                              width: '100%',
                              background: '#1e293b',
                              color: '#fff',
                              border: '1px solid #334155',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              fontSize: '0.85rem',
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={googleSubmitting || !quickGoogleEmail.trim()}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(90deg, #059669 0%, #0d9488 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            fontWeight: 900,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✅ {isAr ? 'متابعة ودخول فوري بهذا الحساب' : 'Continue Instantly with This Account'}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="auth-google"
                    onClick={handleMainGoogleButtonClick}
                    disabled={googleSubmitting}
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                    </svg>
                    {googleSubmitting
                      ? isAr ? 'جاري فتح حسابك في Google...' : 'Signing in with Google...'
                      : savedGoogleAccounts.length > 0
                        ? isAr ? 'اختيار أو إضافة حساب Google آخر' : 'Choose or Add Another Google Account'
                        : isAr ? 'المتابعة بحساب Google (دخول فوري بدون باسورد)' : 'Continue with Google (Instant 1-Tap)'}
                  </button>
                )}

                <div className="auth-or" aria-hidden="true">
                  <span>{isAr ? 'أو بالبريد الإلكتروني' : 'or with email'}</span>
                </div>
              </>
            )}

            {/* Error Alert */}
            {errorMessage && (
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
