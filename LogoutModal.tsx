import './logoutAnimation.css';
import { useEffect, useRef, useState } from 'react';
import { useAuth, translateAuthError } from './authContext';
import { useLang } from './i18n';
import {
  isSoundEnabled,
  setSoundEnabled,
  playCartoonFallSound,
  stopCartoonAudio,
} from './logoutAudio';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function LogoutModal() {
  const { logoutModalOpen, closeLogoutModal, logout } = useAuth();
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [stage, setStage] = useState<'animating' | 'success' | 'error'>('animating');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const hasTriggeredAudio = useRef<boolean>(false);

  // Focus trap & escape key handler
  useEffect(() => {
    if (!logoutModalOpen) return;

    // Focus skip button on open
    window.setTimeout(() => {
      skipBtnRef.current?.focus();
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stage !== 'animating') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [logoutModalOpen, stage]);

  // Main logout orchestration when modal opens
  useEffect(() => {
    if (!logoutModalOpen) {
      stopCartoonAudio();
      hasTriggeredAudio.current = false;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const reduced = prefersReducedMotion();
    setStage('animating');
    setErrorMessage('');
    setBusy(true);

    // Play cartoon audio once per modal opening (only on user action, never autoplay)
    if (!reduced && soundOn && !hasTriggeredAudio.current) {
      hasTriggeredAudio.current = true;
      playCartoonFallSound(true);
    }

    let isSignOutDone = false;
    let isAnimationDone = reduced; // if reduced motion, animation is instantly ready
    let signOutFailedError: string | null = null;

    // 1. Perform actual Firebase sign out
    logout()
      .then(() => {
        isSignOutDone = true;
        // Reset lamp seen key so lamp login intro is available on next sign in
        try {
          sessionStorage.removeItem('aa_lamp_seen');
        } catch {
          /* ignore */
        }
        checkCompletion();
      })
      .catch((err: any) => {
        console.error('Firebase sign-out failed:', err);
        const code = err?.code || 'auth/network-request-failed';
        signOutFailedError = translateAuthError(code, isAr);
        setErrorMessage(signOutFailedError);
        setStage('error');
        setBusy(false);
        stopCartoonAudio();
      });

    // 2. Schedule animation completion (1.85s matches CSS keyframe duration)
    if (!reduced) {
      timerRef.current = window.setTimeout(() => {
        isAnimationDone = true;
        checkCompletion();
      }, 1900);
    }

    function checkCompletion() {
      if (isSignOutDone && isAnimationDone && !signOutFailedError) {
        setStage('success');
        setBusy(false);
        // Brief pause to appreciate the funny landed pose, then close
        timerRef.current = window.setTimeout(() => {
          closeLogoutModal();
        }, 550);
      }
    }

    return () => {
      stopCartoonAudio();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [logoutModalOpen]);

  if (!logoutModalOpen) return null;

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (!next) {
      stopCartoonAudio();
    }
  };

  const handleSkip = () => {
    stopCartoonAudio();
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Instantly close if already signed out, or wait for sign out to complete
    if (stage === 'success') {
      closeLogoutModal();
    } else {
      setStage('success');
      closeLogoutModal();
    }
  };

  const handleRetry = async () => {
    setErrorMessage('');
    setStage('animating');
    setBusy(true);
    try {
      await logout();
      try {
        sessionStorage.removeItem('aa_lamp_seen');
      } catch {
        /* ignore */
      }
      setStage('success');
      setBusy(false);
      window.setTimeout(() => {
        closeLogoutModal();
      }, 500);
    } catch (err: any) {
      const code = err?.code || 'auth/network-request-failed';
      setErrorMessage(translateAuthError(code, isAr));
      setStage('error');
      setBusy(false);
    }
  };

  const handleCancel = () => {
    stopCartoonAudio();
    closeLogoutModal();
  };

  const isReduced = prefersReducedMotion();

  return (
    <div
      className="logout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      ref={modalRef}
    >
      <div className="logout-card">
        {/* Top utility row: Sound toggle & Skip animation */}
        <div className="logout-top-bar">
          <button
            type="button"
            className="logout-tool-btn"
            onClick={toggleSound}
            aria-label={
              soundOn
                ? isAr
                  ? 'كتم صوت الرسوم المتحركة'
                  : 'Mute cartoon sound'
                : isAr
                ? 'تشغيل صوت الرسوم المتحركة'
                : 'Enable cartoon sound'
            }
            title={soundOn ? (isAr ? 'كتم الصوت' : 'Mute') : isAr ? 'تشغيل الصوت' : 'Unmute'}
          >
            <span>{soundOn ? '🔊' : '🔇'}</span>
            <span>{soundOn ? (isAr ? 'الصوت مفعّل' : 'Sound On') : isAr ? 'صامت' : 'Muted'}</span>
          </button>

          <button
            type="button"
            ref={skipBtnRef}
            className="logout-tool-btn"
            onClick={handleSkip}
            aria-label={isAr ? 'تخطي الرسوم المتحركة' : 'Skip animation'}
          >
            <span>⏩</span>
            <span>{isAr ? 'تخطي' : 'Skip'}</span>
          </button>
        </div>

        {/* Animation Stage */}
        <div className={'logout-stage' + (!isReduced ? ' logout-animated' : '')}>
          {/* Floor */}
          <div className="logout-floor" />

          {/* Banana Peel */}
          <div className="logout-peel">
            <svg viewBox="0 0 48 32" fill="none" width="44" height="28" aria-hidden="true">
              <path
                d="M6 26C12 23 20 25 24 28C28 25 36 23 42 26C38 20 30 18 24 22C18 18 10 20 6 26Z"
                fill="#FBBF24"
              />
              <path
                d="M24 22C24 16 28 8 34 6C31 10 28 16 24 22Z"
                fill="#F59E0B"
              />
              <path
                d="M24 22C23 15 19 8 13 7C16 11 20 16 24 22Z"
                fill="#D97706"
              />
              <circle cx="24" cy="22" r="3" fill="#78350F" />
            </svg>
          </div>

          {/* Exclamation shock mark */}
          <div className="logout-exclamation" aria-hidden="true">
            !
          </div>

          {/* Impact Dust Poof */}
          <div className="logout-dust-poof" aria-hidden="true">
            <svg viewBox="0 0 80 34" fill="none" width="70" height="30">
              <path
                d="M10 28C8 22 14 16 22 18C26 12 36 12 40 18C46 14 56 16 58 22C64 22 68 26 66 30H10Z"
                fill="rgba(23, 184, 196, 0.45)"
              />
              <circle cx="20" cy="14" r="3" fill="rgba(23, 184, 196, 0.3)" />
              <circle cx="56" cy="12" r="2.5" fill="rgba(23, 184, 196, 0.3)" />
            </svg>
          </div>

          {/* Orbiting Dizzy Stars */}
          <div className="logout-dizzy-stars" aria-hidden="true">
            <svg viewBox="0 0 80 30" fill="none" width="70" height="24">
              <polygon
                points="16,6 18,11 23,11 19,14 21,19 16,16 12,19 14,14 10,11 15,11"
                fill="#FBBF24"
              />
              <polygon
                points="42,2 43.5,6 48,6 44.5,8.5 46,12.5 42,10 38,12.5 39.5,8.5 36,6 40.5,6"
                fill="#F59E0B"
              />
              <polygon
                points="66,7 67.5,11 72,11 68.5,13.5 70,17.5 66,15 62,17.5 63.5,13.5 60,11 64.5,11"
                fill="#FBBF24"
              />
            </svg>
          </div>

          {/* Cartoon Capsule Pill Character */}
          <div className="logout-character-wrap">
            <svg
              viewBox="0 0 100 140"
              width="90"
              height="120"
              fill="none"
              aria-hidden="true"
            >
              {/* Capsule Body */}
              <g id="pill-body">
                {/* White Bottom Half */}
                <path
                  d="M26 66H74V98C74 111.255 63.2548 122 50 122C36.7452 122 26 111.255 26 98V66Z"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="2.5"
                />
                {/* Cyan Top Half */}
                <path
                  d="M26 66H74V42C74 28.7452 63.2548 18 50 18C36.7452 18 26 28.7452 26 42V66Z"
                  fill="#17B8C4"
                  stroke="#0E8A94"
                  strokeWidth="2.5"
                />
                {/* Center dividing seam */}
                <line
                  x1="26"
                  y1="66"
                  x2="74"
                  y2="66"
                  stroke="#0E8A94"
                  strokeWidth="2"
                  opacity="0.4"
                />
                {/* Curved gloss highlight */}
                <path
                  d="M32 30C32 30 36 24 50 24C52 24 38 28 36 50"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </g>

              {/* Eyes Layer */}
              <g id="pill-eyes">
                {/* 1. Normal Friendly Eyes */}
                <g className="eye-normal">
                  <ellipse cx="42" cy="52" rx="4.5" ry="6" fill="#1E293B" />
                  <ellipse cx="58" cy="52" rx="4.5" ry="6" fill="#1E293B" />
                  <circle cx="43.5" cy="50" r="1.8" fill="#FFFFFF" />
                  <circle cx="59.5" cy="50" r="1.8" fill="#FFFFFF" />
                  <path
                    d="M38 44C40 42 45 42 46 44"
                    stroke="#0E8A94"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M54 44C55 42 60 42 62 44"
                    stroke="#0E8A94"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </g>

                {/* 2. Shocked / Slipping Eyes */}
                <g className="eye-shock" opacity="0">
                  <ellipse cx="41" cy="50" rx="6.5" ry="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.8" />
                  <ellipse cx="59" cy="50" rx="6.5" ry="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.8" />
                  <circle cx="41" cy="50" r="2.2" fill="#1E293B" />
                  <circle cx="59" cy="50" r="2.2" fill="#1E293B" />
                </g>

                {/* 3. Dizzy Spiral Eyes after fall */}
                <g className="eye-dizzy" opacity="0">
                  <path
                    d="M37 52C37 49 45 49 45 52C45 54 39 54 39 52"
                    stroke="#1E293B"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M55 52C55 49 63 49 63 52C63 54 57 54 57 52"
                    stroke="#1E293B"
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* Little bandage on forehead */}
                  <rect
                    x="42"
                    y="32"
                    width="16"
                    height="7"
                    rx="2"
                    fill="#FDE68A"
                    stroke="#D97706"
                    strokeWidth="1"
                    transform="rotate(12 50 35)"
                  />
                </g>
              </g>

              {/* Mouth Layer */}
              <g id="pill-mouth">
                {/* Normal Smile */}
                <path
                  className="mouth-smile"
                  d="M44 60C46 64 54 64 56 60"
                  stroke="#1E293B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Shock 'O' */}
                <ellipse
                  className="mouth-shock"
                  opacity="0"
                  cx="50"
                  cy="62"
                  rx="3.5"
                  ry="5"
                  fill="#1E293B"
                />
                {/* Dizzy Wavy Smile */}
                <path
                  className="mouth-dizzy"
                  opacity="0"
                  d="M43 62C46 60 49 64 52 61C55 64 57 61 58 62"
                  stroke="#1E293B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* Cartoon Arms / Hands */}
              <g id="pill-arms">
                {/* Left Arm: resting or flailing */}
                <path
                  d="M26 62C18 64 12 72 14 78C16 80 20 78 20 74"
                  stroke="#1E293B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="15" cy="78" r="4.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />

                {/* Right Arm: waving goodbye or flailing up */}
                <path
                  d="M74 62C82 58 88 48 86 42C84 40 80 44 80 48"
                  stroke="#1E293B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="86" cy="42" r="4.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              </g>

              {/* Cute Cartoon Shoes */}
              <g id="pill-feet">
                <ellipse cx="40" cy="124" rx="8" ry="5" fill="#EF4444" />
                <ellipse cx="60" cy="124" rx="8" ry="5" fill="#EF4444" />
                <rect x="34" y="126" width="12" height="3" rx="1.5" fill="#FFFFFF" />
                <rect x="54" y="126" width="12" height="3" rx="1.5" fill="#FFFFFF" />
              </g>
            </svg>
          </div>
        </div>

        {/* Informational Text */}
        <h3 id="logout-title" className="logout-title">
          {stage === 'error'
            ? isAr
              ? 'تعذر تسجيل الخروج'
              : 'Logout Failed'
            : stage === 'success'
            ? isAr
              ? 'تم تسجيل الخروج بنجاح!'
              : 'Logged Out Successfully!'
            : isAr
            ? 'تسجيل الخروج...'
            : 'Logging Out...'}
        </h3>

        <p className="logout-subtitle">
          {stage === 'error'
            ? errorMessage ||
              (isAr
                ? 'حدث خطأ غير متوقع أثناء تسجيل الخروج. يُرجى التحقق من اتصالك بالإنترنت.'
                : 'An unexpected error occurred while logging out. Please check your internet connection.')
            : stage === 'success'
            ? isAr
              ? 'نتمنى لكم دوام الصحة والعافية! نراكم قريباً.'
              : 'Stay safe and use antibiotics responsibly. See you soon!'
            : isAr
            ? 'لحظة واحدة... نودعك ونحفظ أمان بياناتك.'
            : 'One moment... Signing you out safely.'}
        </p>

        {/* Error Action Buttons */}
        {stage === 'error' && (
          <div className="logout-actions">
            <button
              type="button"
              className="logout-btn-primary"
              onClick={handleRetry}
              disabled={busy}
            >
              🔄 {isAr ? 'إعادة المحاولة' : 'Try Again'}
            </button>
            <button
              type="button"
              className="logout-btn-secondary"
              onClick={handleCancel}
              disabled={busy}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
