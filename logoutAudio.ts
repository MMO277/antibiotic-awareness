// Web Audio API 4-Scene Cartoon Sound Generator (Update 56)
// Synchronized with the 3.0s Two-Character Door Push & Abyss Fall storyboard:
// - Scene 1 (0.18s): Door handle click & creak open
// - Scene 2 (0.82s): Playful cartoon push "boop" & surprise squeak
// - Scene 3 (1.45s - 2.18s): Descending abyss slide whistle + distant twinkle chime
// - Scene 4 (2.50s): Gentle cartoon door shut click/thud
// Fallback to locally bundled public/cartoon-fall.wav if Web Audio API is unavailable.

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
let cleanupTimerId: number | null = null;

export function stopCartoonAudio(): void {
  if (cleanupTimerId !== null && typeof window !== 'undefined') {
    window.clearTimeout(cleanupTimerId);
    cleanupTimerId = null;
  }
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

  // Clean up any ongoing playback to prevent duplicate audio instances
  stopCartoonAudio();

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    try {
      const audio = new Audio('./cartoon-fall.wav');
      audio.volume = 0.26;
      activeAudioElement = audio;
      audio.play().catch(() => {});
    } catch {
      /* ignore */
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
    masterGain.gain.setValueAtTime(0.26, now);
    masterGain.connect(ctx.destination);

    // ──────────────────────────────────────────────────────────
    // Scene 1 (0.18s - 0.48s): Door Handle Click & Creak Open
    // ──────────────────────────────────────────────────────────
    const doorOpenOsc = ctx.createOscillator();
    const doorOpenGain = ctx.createGain();
    doorOpenOsc.type = 'triangle';
    doorOpenOsc.frequency.setValueAtTime(190, now + 0.18);
    doorOpenOsc.frequency.linearRampToValueAtTime(310, now + 0.42);

    doorOpenGain.gain.setValueAtTime(0.001, now + 0.18);
    doorOpenGain.gain.linearRampToValueAtTime(0.14, now + 0.23);
    doorOpenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

    doorOpenOsc.connect(doorOpenGain);
    doorOpenGain.connect(masterGain);
    doorOpenOsc.start(now + 0.18);
    doorOpenOsc.stop(now + 0.48);

    // ──────────────────────────────────────────────────────────
    // Scene 2 (0.82s - 1.15s): Playful Push "Boop" & Surprise Pop
    // ──────────────────────────────────────────────────────────
    const pushOsc = ctx.createOscillator();
    const pushGain = ctx.createGain();
    pushOsc.type = 'sine';
    pushOsc.frequency.setValueAtTime(280, now + 0.82);
    pushOsc.frequency.exponentialRampToValueAtTime(680, now + 0.98);
    pushOsc.frequency.exponentialRampToValueAtTime(520, now + 1.12);

    pushGain.gain.setValueAtTime(0.001, now + 0.82);
    pushGain.gain.linearRampToValueAtTime(0.24, now + 0.86);
    pushGain.gain.exponentialRampToValueAtTime(0.001, now + 1.14);

    pushOsc.connect(pushGain);
    pushGain.connect(masterGain);
    pushOsc.start(now + 0.82);
    pushOsc.stop(now + 1.15);

    // ──────────────────────────────────────────────────────────
    // Scene 3 (1.42s - 2.18s): Abyss Fall Slide Whistle + Twinkle
    // ──────────────────────────────────────────────────────────
    const whistleOsc = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();

    whistleOsc.type = 'sine';
    whistleOsc.frequency.setValueAtTime(960, now + 1.42);
    whistleOsc.frequency.exponentialRampToValueAtTime(155, now + 2.16);

    vibrato.frequency.setValueAtTime(13, now + 1.42);
    vibratoGain.gain.setValueAtTime(16, now + 1.42);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(whistleOsc.frequency);

    whistleGain.gain.setValueAtTime(0.001, now + 1.42);
    whistleGain.gain.linearRampToValueAtTime(0.24, now + 1.50);
    whistleGain.gain.setValueAtTime(0.22, now + 2.02);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.18);

    whistleOsc.connect(whistleGain);
    whistleGain.connect(masterGain);

    vibrato.start(now + 1.42);
    whistleOsc.start(now + 1.42);
    vibrato.stop(now + 2.20);
    whistleOsc.stop(now + 2.20);

    // Distant abyss twinkle chime (2.20s - 2.40s)
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(1320, now + 2.20);
    chimeOsc.frequency.exponentialRampToValueAtTime(1760, now + 2.34);

    chimeGain.gain.setValueAtTime(0.001, now + 2.20);
    chimeGain.gain.linearRampToValueAtTime(0.11, now + 2.23);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.38);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(masterGain);
    chimeOsc.start(now + 2.20);
    chimeOsc.stop(now + 2.40);

    // ──────────────────────────────────────────────────────────
    // Scene 4 (2.50s - 2.82s): Door Close Soft Latch Thud
    // ──────────────────────────────────────────────────────────
    const shutOsc = ctx.createOscillator();
    const shutGain = ctx.createGain();
    shutOsc.type = 'triangle';
    shutOsc.frequency.setValueAtTime(135, now + 2.50);
    shutOsc.frequency.exponentialRampToValueAtTime(48, now + 2.74);

    shutGain.gain.setValueAtTime(0.28, now + 2.50);
    shutGain.gain.exponentialRampToValueAtTime(0.001, now + 2.78);

    shutOsc.connect(shutGain);
    shutGain.connect(masterGain);
    shutOsc.start(now + 2.50);
    shutOsc.stop(now + 2.80);

    cleanupTimerId = window.setTimeout(() => {
      if (activeAudioContext === ctx) {
        try {
          ctx.close();
        } catch {
          /* ignore */
        }
        activeAudioContext = null;
      }
      cleanupTimerId = null;
    }, 3100);
  } catch {
    try {
      const audio = new Audio('./cartoon-fall.wav');
      audio.volume = 0.26;
      activeAudioElement = audio;
      audio.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }
}
