import { FormEvent, useState } from 'react';
import { useAuth, translateAuthError, AuthMode } from './authContext';
import { useLang } from './i18n';
import { configured } from './firebase';

export default function AuthModal() {
  const {
    modalOpen,
    modalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    resetPassword,
    error,
    clearError,
  } = useAuth();
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localValidationMsg, setLocalValidationMsg] = useState('');

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

  const errorMessage =
    localValidationMsg || (error ? translateAuthError(error, isAr) : '');

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)',
          padding: '24px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: '16px',
            insetInlineEnd: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: '#64748b',
          }}
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '8px',
            }}
          >
            {modalMode === 'login' ? '👤' : modalMode === 'register' ? '✨' : '🔑'}
          </div>
          <h2 style={{ margin: 0, color: '#0b3c5d', fontSize: '1.3rem' }}>
            {modalMode === 'login'
              ? isAr ? 'تسجيل الدخول' : 'Sign In'
              : modalMode === 'register'
              ? isAr ? 'إنشاء حساب مريض جديد' : 'Create Patient Account'
              : isAr ? 'استعادة كلمة المرور' : 'Reset Password'}
          </h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {modalMode === 'login'
              ? isAr ? 'أدخل بريدك للوصول إلى ملفك الصحي ومتابعة علاجك' : 'Sign in to access your health profile and treatment'
              : modalMode === 'register'
              ? isAr ? 'احفظ بياناتك الصحية وجداول جرعاتك بمزامنة سحابية آمنة' : 'Securely sync your health profile and doses'
              : isAr ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط استعادة الحساب' : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Guest Mode Notice when Firebase is not configured */}
        {!configured && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
              fontSize: '0.86rem',
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            <strong>{isAr ? '⚠️ تنبيه وضع الزائر:' : '⚠️ Guest Mode Notice:'}</strong>{' '}
            {isAr
              ? 'خدمة الحسابات السحابية غير مفعّلة في هذه النسخة لعدم توفر إعدادات Firebase. يمكنك متابعة استخدام وتصفح جميع أقسام وأدوات الموقع (الملف الصحي، حاسبة الجرعات، التداخلات، والتنبيهات) كضيف بشكل كامل وآمن محلياً.'
              : 'Cloud accounts are not configured in this build. You can continue safely using all platform tools (Health Profile, Dosage Calculator, Interactions, Tracker) offline as a guest.'}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={closeAuthModal}
                style={{
                  background: '#d97706',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isAr ? 'متابعة التصفح كزائر' : 'Continue as Guest'}
              </button>
            </div>
          </div>
        )}

        {/* Mode switcher tabs (Login vs Register) */}
        {modalMode !== 'forgot' && (
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                openAuthModal('login');
                setResetSent(false);
              }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '8px',
                background: modalMode === 'login' ? '#ffffff' : 'transparent',
                fontWeight: modalMode === 'login' ? 700 : 500,
                color: modalMode === 'login' ? '#0b3c5d' : '#64748b',
                boxShadow: modalMode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
              }}
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                openAuthModal('register');
                setResetSent(false);
              }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '8px',
                background: modalMode === 'register' ? '#ffffff' : 'transparent',
                fontWeight: modalMode === 'register' ? 700 : 500,
                color: modalMode === 'register' ? '#0b3c5d' : '#64748b',
                boxShadow: modalMode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
              }}
            >
              {isAr ? 'حساب جديد' : 'New Account'}
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="alert"
            style={{
              margin: '0 0 14px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#fee2e2',
              borderColor: '#fca5a5',
              color: '#991b1b',
              fontSize: '0.88rem',
            }}
            role="alert"
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Success Alert for Password Reset */}
        {modalMode === 'forgot' && resetSent && (
          <div
            style={{
              margin: '0 0 14px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#dcfce7',
              border: '1px solid #86efac',
              color: '#166534',
              fontSize: '0.88rem',
            }}
          >
            ✅ {isAr ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' : 'Password reset link sent to your email.'}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
          {modalMode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '4px' }}>
                {isAr ? 'الاسم بالكامل / اسم المريض:' : 'Full Name / Patient Name:'}
              </label>
              <input
                type="text"
                value={displayName}
                disabled={submitting || !configured}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                required
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '4px' }}>
              {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
            </label>
            <input
              type="email"
              value={email}
              disabled={submitting || !configured}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@example.com"
              required
              style={{ width: '100%', direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}
            />
          </div>

          {modalMode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {isAr ? 'كلمة المرور:' : 'Password:'}
                </label>
                {modalMode === 'login' && (
                  <button
                    type="button"
                    disabled={!configured}
                    onClick={() => {
                      openAuthModal('forgot');
                      setResetSent(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: configured ? '#0284c7' : '#94a3b8',
                      fontSize: '0.8rem',
                      cursor: configured ? 'pointer' : 'default',
                      padding: 0,
                    }}
                  >
                    {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                disabled={submitting || !configured}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', direction: 'ltr' }}
              />
            </div>
          )}

          {modalMode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '4px' }}>
                {isAr ? 'تأكيد كلمة المرور:' : 'Confirm Password:'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                disabled={submitting || !configured}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', direction: 'ltr' }}
              />
            </div>
          )}

          {/* Remember me option with shared device security advisory */}
          {modalMode !== 'forgot' && (
            <div
              style={{
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginTop: '4px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: configured ? 'pointer' : 'default', fontSize: '0.88rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={submitting || !configured}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{isAr ? 'تذكرني على هذا الجهاز' : 'Remember me on this device'}</span>
              </label>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                {isAr
                  ? '🔒 تنبيه أمان: إذا كنت تستخدم جهازاً مشتركاً أو عاماً (في عيادة أو مقهى إنترنت)، اترك هذا الخيار مغلقاً ليتم إنهاء جلستك فور إغلاق المتصفح لحماية بياناتك الصحية.'
                  : '🔒 Security note: If using a shared or public device, leave unchecked to auto-logout when browser closes.'}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={submitting || !configured}
            style={{
              width: '100%',
              padding: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              marginTop: '6px',
              opacity: !configured ? 0.6 : 1,
              cursor: !configured ? 'not-allowed' : 'pointer',
            }}
          >
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
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ← {isAr ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}