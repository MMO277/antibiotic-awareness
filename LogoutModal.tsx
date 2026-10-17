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

interface LogoutModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps = {}) {
  const authCtx = useAuth() as any;
  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(authCtx?.logoutModalOpen);
  const closeModal = onClose || authCtx?.closeLogoutModal || (() => {});
  const logout = authCtx?.logout || (async () => {});

  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [stage, setStage] = useState<'animating' | 'success' | 'error'>('animating');
  const [sceneIndex, setSceneIndex] = useState<1 | 2 | 3 | 4>(1);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const timersRef = useRef<number[]>([]);
  const isLoggingOutRef = useRef<boolean>(false);
  const hasTriggeredAudio = useRef<boolean>(false);

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const addTimer = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const finishAndNavigateToLogin = () => {
    stopCartoonAudio();
    clearAllTimers();
    isLoggingOutRef.current = false;
    setFadingOut(false);
    closeModal();
    try {
      sessionStorage.removeItem('aa_lamp_seen');
      sessionStorage.removeItem('aa_guest_mode');
    } catch {
      /* ignore */
    }
    if (typeof authCtx?.openAuthModal === 'function') {
      authCtx.openAuthModal('login');
    }
  };

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!isModalOpen) return;

    const focusId = window.setTimeout(() => {
      skipBtnRef.current?.focus({ preventScroll: true });
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (stage === 'error') {
          handleCancel();
        } else {
          handleSkip();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusId);
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, stage]);

  // Main 4-scene logout orchestration when modal opens
  useEffect(() => {
    if (!isModalOpen) {
      stopCartoonAudio();
      clearAllTimers();
      hasTriggeredAudio.current = false;
      isLoggingOutRef.current = false;
      setFadingOut(false);
      return;
    }

    // Prevent duplicate logout executions
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    const reduced = prefersReducedMotion();
    setStage('animating');
    setSceneIndex(1);
    setFadingOut(false);
    setErrorMessage('');
    setBusy(true);

    if (!reduced && soundOn && !hasTriggeredAudio.current) {
      hasTriggeredAudio.current = true;
      try {
        playCartoonFallSound(true);
      } catch {
        /* ignore audio error */
      }
    }

    let isSignOutDone = false;
    let isAnimationDone = reduced;
    let signOutFailedError: string | null = null;

    // 1. Trigger actual Firebase sign-out immediately
    logout()
      .then(() => {
        isSignOutDone = true;
        try {
          sessionStorage.removeItem('aa_lamp_seen');
          sessionStorage.removeItem('aa_guest_mode');
        } catch {
          /* ignore */
        }
        checkCompletion();
      })
      .catch((err: any) => {
        console.error('Firebase sign-out failed:', err);
        const code = err?.code || 'auth/network-request-failed';
        signOutFailedError =
          typeof translateAuthError === 'function'
            ? translateAuthError(code, isAr)
            : isAr
            ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.'
            : 'Network connection failed. Please check your internet connection.';
        setErrorMessage(signOutFailedError);
        setStage('error');
        setBusy(false);
        isLoggingOutRef.current = false;
        stopCartoonAudio();
        clearAllTimers();
      });

    // 2. Schedule 4-Scene Storyboard Progression (0-0.6s, 0.6-1.2s, 1.2-2.2s, 2.2-3.0s)
    if (!reduced) {
      addTimer(() => setSceneIndex(2), 600);
      addTimer(() => setSceneIndex(3), 1200);
      addTimer(() => {
        setSceneIndex(4);
        setStage('success');
      }, 2200);
      addTimer(() => {
        isAnimationDone = true;
        checkCompletion();
      }, 3000);
    } else {
      setSceneIndex(4);
      addTimer(() => {
        isAnimationDone = true;
        checkCompletion();
      }, 450);
    }

    // 3. Safety fallback timer (4.8s max) so UI can never get stuck
    addTimer(() => {
      if (!signOutFailedError && isLoggingOutRef.current) {
        isSignOutDone = true;
        isAnimationDone = true;
        checkCompletion();
      }
    }, 4800);

    function checkCompletion() {
      // Ignore late callbacks after the user skipped/cancelled (prevents a second navigation)
      if (!isLoggingOutRef.current) return;
      if (isSignOutDone && isAnimationDone && !signOutFailedError) {
        setStage('success');
        setBusy(false);
        setFadingOut(true);
        addTimer(() => {
          finishAndNavigateToLogin();
        }, 360);
      }
    }

    return () => {
      stopCartoonAudio();
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (!next) {
      stopCartoonAudio();
    }
  };

  const handleSkip = () => {
    finishAndNavigateToLogin();
  };

  const handleRetry = async () => {
    if (busy) return;
    setErrorMessage('');
    setStage('animating');
    setSceneIndex(4);
    setBusy(true);
    try {
      await logout();
      setStage('success');
      setBusy(false);
      setFadingOut(true);
      addTimer(() => {
        finishAndNavigateToLogin();
      }, 350);
    } catch (err: any) {
      const code = err?.code || 'auth/network-request-failed';
      setErrorMessage(
        typeof translateAuthError === 'function'
          ? translateAuthError(code, isAr)
          : isAr
          ? 'فشل تسجيل الخروج. يرجى المحاولة لاحقاً.'
          : 'Logout failed. Please try again.'
      );
      setStage('error');
      setBusy(false);
    }
  };

  const handleCancel = () => {
    stopCartoonAudio();
    clearAllTimers();
    isLoggingOutRef.current = false;
    closeModal();
  };

  const isReduced = prefersReducedMotion();

  const statusText =
    stage === 'error'
      ? errorMessage || (isAr ? 'تعذر تسجيل الخروج' : 'Logout Failed')
      : sceneIndex === 4 || stage === 'success'
      ? isAr
        ? 'تم تسجيل الخروج بنجاح! نراك قريباً'
        : 'Logged out successfully. See you soon!'
      : isAr
      ? 'جارٍ تسجيل الخروج...'
      : 'Logging out...';

  const dialogLabelProps =
    stage === 'error'
      ? { 'aria-labelledby': 'logout-title' }
      : { 'aria-label': isAr ? 'تسجيل الخروج' : 'Logging out' };

  return (
    <div
      className={`logout-backdrop${fadingOut ? ' is-fading-out' : ''}`}
      role="dialog"
      aria-modal="true"
      {...dialogLabelProps}
      ref={modalRef}
    >
      {/* Screen-reader-only status (nothing visible around the scene) */}
      <p className="logout-sr-only" role="status" aria-live="polite">
        {stage === 'error' ? '' : statusText}
      </p>

      {/* Icon-only, unobtrusive controls (keyboard: Esc also skips) */}
      <div className="logout-corner-controls">
        <button
          type="button"
          className="logout-icon-btn"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={
            soundOn
              ? isAr
                ? 'كتم صوت الرسوم المتحركة'
                : 'Mute cartoon sound'
              : isAr
              ? 'تشغيل صوت الرسوم المتحركة'
              : 'Enable cartoon sound'
          }
        >
          <span aria-hidden="true">{soundOn ? '🔊' : '🔇'}</span>
        </button>
        <button
          type="button"
          ref={skipBtnRef}
          className="logout-icon-btn"
          onClick={handleSkip}
          aria-label={isAr ? 'تخطي الرسوم المتحركة' : 'Skip animation'}
        >
          <span aria-hidden="true">⏩</span>
        </button>
      </div>

      <div className="logout-scene">
        {/* 2D Cartoon Stage: Two Characters, Door & Glowing Cyan Abyss */}
        <div className={`logout-stage${!isReduced ? ' logout-animated' : ''}`}>
          <svg
            className="logout-stage-svg"
            viewBox="0 0 380 225"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              {/* Deep Abyss Vortex Gradient */}
              <radialGradient id="abyssGrad" cx="50%" cy="55%" r="60%">
                <stop offset="0%" stopColor="#010508" />
                <stop offset="55%" stopColor="#041c28" />
                <stop offset="85%" stopColor="#0a4f63" />
                <stop offset="100%" stopColor="#17b8c4" stopOpacity="0.65" />
              </radialGradient>

              {/* Door Leaf Gradient */}
              <linearGradient id="doorLeafGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f4c64" />
                <stop offset="100%" stopColor="#082838" />
              </linearGradient>

              {/* Light spilling from the open doorway onto the floor */}
              <linearGradient id="spillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>

              {/* Clip path for inside the open doorway (x=216..298, y=36..188) */}
              <clipPath id="doorwayClip">
                <rect x="216" y="36" width="82" height="152" rx="4" />
              </clipPath>
            </defs>

            {/* Background Corridor Wall & Floor Perspective */}
            <rect x="0" y="0" width="380" height="188" fill="rgba(6, 26, 38, 0.55)" />
            <path d="M0 188 H380 V225 H0 Z" fill="rgba(4, 17, 26, 0.85)" />
            <line x1="0" y1="188" x2="380" y2="188" stroke="#17b8c4" strokeWidth="2" strokeOpacity="0.45" />

            {/* Subtle perspective floor tiles */}
            <line x1="45" y1="188" x2="15" y2="225" stroke="#17b8c4" strokeWidth="1" strokeOpacity="0.18" />
            <line x1="125" y1="188" x2="110" y2="225" stroke="#17b8c4" strokeWidth="1" strokeOpacity="0.18" />
            <line x1="210" y1="188" x2="210" y2="225" stroke="#17b8c4" strokeWidth="1" strokeOpacity="0.22" />
            <line x1="305" y1="188" x2="325" y2="225" stroke="#17b8c4" strokeWidth="1" strokeOpacity="0.18" />

            <path className="doorway-light-spill" d="M216 188 H298 L336 225 H182 Z" fill="url(#spillGrad)" />

            {/* ── THE DOORWAY & DEEP CYAN ABYSS (x=212..302, y=32..188) ── */}
            {/* Outer Doorframe with subtle cyan glow */}
            <rect
              x="211"
              y="31"
              width="92"
              height="158"
              rx="6"
              fill="#051620"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeOpacity="0.65"
            />

            {/* Inside the Doorway: Deep Abyss & Concentric Cyan Depth Rings */}
            <g clipPath="url(#doorwayClip)">
              <rect x="216" y="36" width="82" height="152" fill="url(#abyssGrad)" />

              <g className="abyss-portal-glow">
                {/* Concentric depth rings pulling into the abyss */}
                <ellipse
                  className="abyss-ring-1"
                  cx="257"
                  cy="126"
                  rx="36"
                  ry="58"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeDasharray="6 5"
                  fill="none"
                />
                <ellipse
                  className="abyss-ring-2"
                  cx="257"
                  cy="128"
                  rx="26"
                  ry="42"
                  stroke="#17b8c4"
                  strokeWidth="1.5"
                  fill="none"
                />
                <ellipse
                  className="abyss-ring-3"
                  cx="257"
                  cy="132"
                  rx="14"
                  ry="22"
                  stroke="#5eead4"
                  strokeWidth="1.2"
                  fill="none"
                />
                {/* Deep dark abyss core */}
                <ellipse cx="257" cy="136" rx="18" ry="26" fill="#010407" />
              </g>

              {/* Falling Cyan Particles & Speed Lines inside the Abyss */}
              <g className="abyss-particles">
                <circle cx="232" cy="72" r="2.2" fill="#5eead4" />
                <circle cx="278" cy="86" r="1.8" fill="#22d3ee" />
                <circle cx="246" cy="112" r="2.5" fill="#99f6e4" />
                <circle cx="268" cy="138" r="2" fill="#22d3ee" />
                <circle cx="238" cy="154" r="1.6" fill="#5eead4" />
                <line x1="236" y1="54" x2="236" y2="82" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.65" />
                <line x1="274" y1="66" x2="274" y2="98" stroke="#5eead4" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.65" />
                <line x1="254" y1="48" x2="254" y2="76" stroke="#99f6e4" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
              </g>

              {/* Distant Twinkle Star when Character 1 disappears into the abyss */}
              <g className="abyss-vanish-sparkle">
                <path
                  d="M258 134 L261 143 L270 146 L261 149 L258 158 L255 149 L246 146 L255 143 Z"
                  fill="#5eead4"
                />
                <circle cx="258" cy="146" r="3" fill="#ffffff" />
              </g>
            </g>

            {/* Ground shadows live outside the character groups so they stay on the floor
                (they don't rotate or fall with the characters) */}
            <ellipse className="char1-shadow" cx="165" cy="187" rx="22" ry="5" fill="rgba(0,0,0,0.38)" />
            <ellipse className="char2-shadow" cx="95" cy="187" rx="22" ry="5" fill="rgba(0,0,0,0.38)" />

            {/* ── CHARACTER 1: THE HERO CAPSULE PILL (Approaches, gets pushed & falls into abyss) ── */}
            <g className="char1-group">
              {/* Left Arm (back arm) */}
              <path
                d="M145 140 C134 142 128 150 131 156"
                stroke="#e2e8f0"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="131" cy="156" r="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Capsule Body: White lower half + Cyan upper half */}
              <path
                d="M143 142 H187 V164 C187 175 177 184 165 184 C153 184 143 175 143 164 V142 Z"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="2.2"
              />
              <path
                d="M143 142 H187 V118 C187 107 177 98 165 98 C153 98 143 107 143 118 V142 Z"
                fill="#17b8c4"
                stroke="#0e7490"
                strokeWidth="2.2"
              />
              <line x1="143" y1="142" x2="187" y2="142" stroke="#0e7490" strokeWidth="2" opacity="0.45" />
              {/* Gloss highlight */}
              <path
                d="M150 108 C150 108 154 103 164 103"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.65"
              />

              {/* Calm Face (Scene 1) */}
              <g className="char1-face-calm">
                <ellipse cx="158" cy="124" rx="3.8" ry="5" fill="#0f172a" />
                <ellipse cx="173" cy="124" rx="3.8" ry="5" fill="#0f172a" />
                <circle cx="159.2" cy="122.2" r="1.5" fill="#ffffff" />
                <circle cx="174.2" cy="122.2" r="1.5" fill="#ffffff" />
                <path d="M159 133 C162 137 169 137 172 133" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Exaggerated Surprised Face (Scene 2 & 3) */}
              <g className="char1-face-shock">
                <ellipse cx="157" cy="122" rx="6" ry="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                <ellipse cx="174" cy="122" rx="6" ry="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                <circle cx="158" cy="122" r="2.2" fill="#0f172a" />
                <circle cx="175" cy="122" r="2.2" fill="#0f172a" />
                {/* Raised shocked eyebrows */}
                <path d="M150 111 Q157 106 163 111" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <path d="M168 111 Q174 106 181 111" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                {/* Big surprised O mouth */}
                <ellipse cx="166" cy="135" rx="4.8" ry="6.2" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
              </g>

              {/* Exclamation Shock Badge Above Character 1 */}
              <g className="char1-shock-badge">
                <rect x="151" y="68" width="28" height="22" rx="7" fill="#ef4444" />
                <text x="165" y="84" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="900">
                  !!
                </text>
              </g>

              {/* Right Arm (reaches for handle in Scene 1, grabs doorframe in Scene 3) */}
              <g className="char1-right-arm">
                <path
                  d="M185 142 C196 142 206 136 212 130"
                  stroke="#e2e8f0"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="212" cy="130" r="5.2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
              </g>

              {/* Cartoon Red Sneakers */}
              <ellipse cx="156" cy="185" rx="7.5" ry="4.5" fill="#ef4444" />
              <ellipse cx="174" cy="185" rx="7.5" ry="4.5" fill="#ef4444" />
            </g>

            {/* ── PLAYFUL PUSH IMPACT BURST ("BOOP!") ── */}
            <g className="push-impact-burst">
              <circle cx="142" cy="145" r="14" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="4 4" fill="rgba(251, 191, 36, 0.2)" />
              <path d="M126 135 L118 128 M126 155 L116 162 M135 126 L132 116" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* ── CHARACTER 2: CHEEKY GOLDEN TABLET BUDDY (Sneaks up, pushes, peers into abyss & closes door) ── */}
            <g className="char2-group">
              {/* Round Golden Tablet Body */}
              <circle
                cx="95"
                cy="152"
                r="26"
                fill="#fbbf24"
                stroke="#d97706"
                strokeWidth="2.5"
              />
              {/* Inner tablet score line & shine */}
              <path d="M77 138 Q95 130 113 138" stroke="#fef3c7" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75" />

              {/* Cute Teal Pharmacist/Doctor Cap on Character 2 */}
              <path
                d="M75 131 C75 120 115 120 115 131 Z"
                fill="#17b8c4"
                stroke="#0e7490"
                strokeWidth="2"
              />
              <rect x="82" y="127" width="32" height="5" rx="2.5" fill="#22d3ee" />

              {/* Mischievous Expressive Eyes & Playful Grin */}
              <ellipse cx="88" cy="147" rx="3.6" ry="4.8" fill="#0f172a" />
              <ellipse cx="104" cy="147" rx="3.6" ry="4.8" fill="#0f172a" />
              <circle cx="89.2" cy="145.5" r="1.4" fill="#ffffff" />
              <circle cx="105.2" cy="145.5" r="1.4" fill="#ffffff" />
              {/* Cheeky angled eyebrows */}
              <path d="M82 139 L93 142" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M110 139 L99 142" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
              {/* Playful cat-like grin */}
              <path
                d="M87 157 Q96 165 105 157"
                stroke="#0f172a"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Pushing / Peering Arms */}
              <g className="char2-arms">
                <path
                  d="M114 150 C124 148 132 146 138 144"
                  stroke="#fbbf24"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="139" cy="144" r="5.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              </g>

              {/* Character 2 Navy Sneakers */}
              <ellipse cx="86" cy="184" rx="7.5" ry="4.5" fill="#0ea5e9" />
              <ellipse cx="104" cy="184" rx="7.5" ry="4.5" fill="#0ea5e9" />
            </g>

            {/* ── ANIMATED DOOR LEAF (Swings open in Scene 1, swings closed in Scene 4) ── */}
            <g className="door-leaf-group">
              <rect
                x="216"
                y="36"
                width="82"
                height="152"
                rx="3"
                fill="url(#doorLeafGrad)"
                stroke="#22d3ee"
                strokeWidth="2"
              />
              {/* Door Inset Panels */}
              <rect
                x="226"
                y="48"
                width="62"
                height="54"
                rx="4"
                fill="rgba(23, 184, 196, 0.08)"
                stroke="#17b8c4"
                strokeWidth="1.4"
                strokeOpacity="0.55"
              />
              <rect
                x="226"
                y="114"
                width="62"
                height="60"
                rx="4"
                fill="rgba(23, 184, 196, 0.08)"
                stroke="#17b8c4"
                strokeWidth="1.4"
                strokeOpacity="0.55"
              />
              {/* Glowing Door Handle (on left side of door leaf x=226, y=110) */}
              <circle
                cx="228"
                cy="110"
                r="5.5"
                fill="#fbbf24"
                stroke="#fef3c7"
                strokeWidth="1.5"
              />
            </g>
          </svg>
        </div>

        {/* Error recovery: kept as authentication feedback; only shown on failure */}
        {stage === 'error' && (
          <div className="logout-card logout-error-panel">
            <h3 id="logout-title" className="logout-title">
              {isAr ? 'تعذر تسجيل الخروج' : 'Logout Failed'}
            </h3>
            <p className="logout-subtitle" role="alert">
              {errorMessage ||
                (isAr
                  ? 'حدث خطأ غير متوقع أثناء تسجيل الخروج. يُرجى التحقق من اتصالك بالإنترنت.'
                  : 'An unexpected error occurred while logging out. Please check your internet connection.')}
            </p>
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
          </div>
        )}
      </div>
    </div>
  );
}
