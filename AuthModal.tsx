import { FormEvent, KeyboardEvent, PointerEvent as ReactPointerEvent, RefObject, useEffect, useRef, useState } from 'react';
import { useAuth, translateAuthError, AuthMode } from './authContext';
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
    // A drag past the threshold, or a plain tap, lights the lamp.
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
    login,
    register,
    loginWithGoogle,
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
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localValidationMsg, setLocalValidationMsg] = useState('');

  // Lamp intro state (UPDATE 49): purely visual — never touches auth logic.
  const [stage, setStage] = useState<Stage>('dark');
  const [instant, setInstant] = useState(false);
  const pullRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!modalOpen) return;
    const skip = lampSeen() || prefersReducedMotion();
    setInstant(skip);
    setStage(skip ? 'lit' : 'dark');
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
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, closeAuthModal]);

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

  const handleGoogleLogin = async () => {
    clearError();
    setLocalValidationMsg('');
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch {
      /* error is handled in authContext */
    } finally {
      setGoogleSubmitting(false);
    }
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
            <button type="button" className="auth-skip" onClick={skipIntro}>
              {isAr ? 'تخطي الحركة' : 'Skip Animation'}
            </button>
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

        {/* Stage B — glass login panel (all original behaviour preserved) */}
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
                  ? isAr ? 'أدخل بريدك للوصول إلى ملفك الصحي ومتابعة علاجك' : 'Sign in to access your health profile and treatment'
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
                  ? 'خدمة الحسابات السحابية غير مفعّلة في هذه النسخة لعدم توفر إعدادات Firebase. يمكنك متابعة استخدام وتصفح جميع أقسام وأدوات الموقع (الملف الصحي، حاسبة الجرعات، التداخلات، والتنبيهات) كضيف بشكل كامل وآمن محلياً.'
                  : 'Cloud accounts are not configured in this build. You can continue safely using all platform tools (Health Profile, Dosage Calculator, Interactions, Tracker) offline as a guest.'}
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

            {/* زرار Google — يظهر في login و register بس */}
            {modalMode !== 'forgot' && configured && (
              <>
                <button
                  type="button"
                  className="auth-google"
                  onClick={handleGoogleLogin}
                  disabled={googleSubmitting}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  {googleSubmitting
                    ? isAr ? 'جاري التحقق...' : 'Verifying...'
                    : isAr ? 'المتابعة بحساب Google' : 'Continue with Google'}
                </button>
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
                  <p>
                    {isAr
                      ? '🔒 تنبيه أمان: إذا كنت تستخدم جهازاً مشتركاً أو عاماً (في عيادة أو مقهى إنترنت)، اترك هذا الخيار مغلقاً ليتم إنهاء جلستك فور إغلاق المتصفح لحماية بياناتك الصحية.'
                      : '🔒 Security note: If using a shared or public device, leave unchecked to auto-logout when browser closes.'}
                  </p>
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
          </div>
        )}
      </div>
    </div>
  );
}
