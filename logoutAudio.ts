// Web Audio API cartoon sound generator with fallback to locally bundled public/cartoon-fall.wav.
// Sound is only played on explicit user gesture (logout click). Volume is kept gentle and brief (~1.3s).

const SOUND_PREF_KEY = 'aa_logout_sound_enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(SOUND_PREF_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    /* ignore storage errors */
  }
}

let activeAudioContext: AudioContext | null = null;
let activeAudioElement: HTMLAudioElement | null = null;

export function stopCartoonAudio(): void {
  if (activeAudioContext) {
    try {
      activeAudioContext.close();
    } catch {
      /* ignore */
    }
    activeAudioContext = null;
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      /* ignore */
    }
    activeAudioElement = null;
  }
}

export function playCartoonFallSound(enabled = true): void {
  if (!enabled || typeof window === 'undefined') return;

  // Clean up any ongoing playback
  stopCartoonAudio();

  // Check Web Audio API availability
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    // Fallback to locally bundled static WAV asset
    try {
      const audio = new Audio('./cartoon-fall.wav');
      audio.volume = 0.28;
      activeAudioElement = audio;
      audio.play().catch(() => {
        /* autoplay policy or network error handled gracefully */
      });
    } catch {
      /* ignore audio failure */
    }
    return;
  }

  try {
    const ctx = new AudioCtx();
    activeAudioContext = ctx;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, now);
    masterGain.connect(ctx.destination);

    // ──────────────────────────────────────────────────────────
    // Part 1: Cartoon Slide Whistle (Wheeee-oooo!)
    // Smooth descending glide from 900 Hz down to 220 Hz with cute vibrato
    // ──────────────────────────────────────────────────────────
    const whistleOsc = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();

    whistleOsc.type = 'sine';
    whistleOsc.frequency.setValueAtTime(900, now);
    whistleOsc.frequency.exponentialRampToValueAtTime(220, now + 0.75);

    // Playful 14Hz cartoon vibrato
    vibrato.frequency.setValueAtTime(14, now);
    vibratoGain.gain.setValueAtTime(18, now);
    vibrato.connect(whistleOsc.frequency);

    // Whistle envelope
    whistleGain.gain.setValueAtTime(0.01, now);
    whistleGain.gain.linearRampToValueAtTime(0.25, now + 0.08);
    whistleGain.gain.setValueAtTime(0.25, now + 0.65);
    whistleGain.gain.linearRampToValueAtTime(0.01, now + 0.78);

    whistleOsc.connect(whistleGain);
    whistleGain.connect(masterGain);

    vibrato.start(now);
    whistleOsc.start(now);
    vibrato.stop(now + 0.8);
    whistleOsc.stop(now + 0.8);

    // ──────────────────────────────────────────────────────────
    // Part 2: Cartoon Impact Thud & Comedic Spring Boing (at 0.76s)
    // ──────────────────────────────────────────────────────────
    const impactTime = now + 0.76;

    // Body thud: low frequency drop
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(135, impactTime);
    thudOsc.frequency.exponentialRampToValueAtTime(45, impactTime + 0.25);

    thudGain.gain.setValueAtTime(0.35, impactTime);
    thudGain.gain.exponentialRampToValueAtTime(0.01, impactTime + 0.35);

    thudOsc.connect(thudGain);
    thudGain.connect(masterGain);

    thudOsc.start(impactTime);
    thudOsc.stop(impactTime + 0.38);

    // Springy boing harmonic
    const boingOsc = ctx.createOscillator();
    const boingGain = ctx.createGain();
    boingOsc.type = 'sine';
    boingOsc.frequency.setValueAtTime(260, impactTime + 0.04);
    boingOsc.frequency.exponentialRampToValueAtTime(80, impactTime + 0.45);

    boingGain.gain.setValueAtTime(0.2, impactTime + 0.04);
    boingGain.gain.exponentialRampToValueAtTime(0.01, impactTime + 0.48);

    boingOsc.connect(boingGain);
    boingGain.connect(masterGain);

    boingOsc.start(impactTime + 0.04);
    boingOsc.stop(impactTime + 0.5);

    // Cleanup context after playback ends
    window.setTimeout(() => {
      if (activeAudioContext === ctx) {
        try {
          ctx.close();
        } catch {
          /* ignore */
        }
        activeAudioContext = null;
      }
    }, 1500);
  } catch {
    // If Web Audio API fails during node setup, try fallback audio element
    try {
      const audio = new Audio('./cartoon-fall.wav');
      audio.volume = 0.28;
      activeAudioElement = audio;
      audio.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }
}
