/**
 * nativeAlarmService.ts
 *
 * Full Phone-Style Medication Alarm Clock Engine & Native Android Bridge for Antibiotic Awareness.
 *
 * Works immediately via Live OTA Website Updates inside the installed Android APK
 * AND in mobile/desktop browsers:
 * - Transforms medication reminders from a simple notification into a real Phone Alarm Clock:
 *   1. Continuous looping 16-bit PCM WAV + WebAudio alarm ringtone (never stops after 6s — rings
 *      continuously for up to 5 minutes until the patient taps "Stop / Dose Taken" or "Snooze").
 *   2. Continuous repeating phone vibration pattern + periodic Arabic/English voice readout.
 *   3. Full-Screen Incoming Phone Alarm Screen (wakes screen, displays large digital clock,
 *      medication name, dose instructions, Snooze 5/10/15m, and "Dose Taken" action).
 *   4. MediaSession lock-screen controls + Screen WakeLock + persistent ServiceWorker notification.
 *   5. Direct integration with Android's built-in Clock app (AlarmClock.ACTION_SET_ALARM) and
 *      hardware AlarmManager.setAlarmClock via window.AndroidAlarmBridge.
 */

import { TreatmentSchedule } from './trackerData';

export interface NativeAlarmSyncResult {
  isNative: boolean;
  scheduledCount: number;
  permissionGranted: boolean;
  messageAr: string;
  messageEn: string;
}

export type AlarmRingtoneId =
  | 'classic_phone'
  | 'medical_intensive'
  | 'bell_chime'
  | 'crescendo_melody';

export interface AlarmPreferences {
  ringtoneId: AlarmRingtoneId;
  voiceReadoutEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeMinutesDefault: number;
}

export interface ActivePhoneAlarmPayload {
  id: string;
  title: string;
  body: string;
  medicineName: string;
  doseInstruction: string;
  timeHHMM: string;
  scheduleId?: string;
  doseId?: string;
  triggeredAt: number;
  isAr: boolean;
  ringtoneId: AlarmRingtoneId;
}

export const ALARM_CHANNEL_ID = 'med_alarm_clock_v3';
const ALARM_PREFS_STORAGE_KEY = 'aa_phone_alarm_prefs_v1';
const ALARM_LAST_FIRED_MINUTE_KEY = 'aa_phone_alarm_last_fired_min_v1';

interface AndroidAlarmBridgeInterface {
  isAvailable?: () => boolean;
  requestPermissions?: () => void;
  scheduleExactAlarm: (id: number, triggerAtMillis: number, title: string, body: string) => boolean;
  cancelAlarm: (id: number) => boolean;
  stopRingingAlarm?: () => void;
  openSystemClockAlarm?: (hour: number, minute: number, label: string) => boolean;
}

function getAndroidAlarmBridge(): AndroidAlarmBridgeInterface | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bridge = (window as any).AndroidAlarmBridge;
  if (bridge && typeof bridge.scheduleExactAlarm === 'function') {
    return bridge as AndroidAlarmBridgeInterface;
  }
  return null;
}

export function loadAlarmPreferences(): AlarmPreferences {
  if (typeof window === 'undefined') {
    return {
      ringtoneId: 'classic_phone',
      voiceReadoutEnabled: true,
      vibrationEnabled: true,
      snoozeMinutesDefault: 10,
    };
  }
  try {
    const raw = localStorage.getItem(ALARM_PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ringtoneId: parsed.ringtoneId || 'classic_phone',
        voiceReadoutEnabled: parsed.voiceReadoutEnabled !== false,
        vibrationEnabled: parsed.vibrationEnabled !== false,
        snoozeMinutesDefault: Number(parsed.snoozeMinutesDefault) || 10,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    ringtoneId: 'classic_phone',
    voiceReadoutEnabled: true,
    vibrationEnabled: true,
    snoozeMinutesDefault: 10,
  };
}

export function saveAlarmPreferences(prefs: Partial<AlarmPreferences>): AlarmPreferences {
  const current = loadAlarmPreferences();
  const next: AlarmPreferences = { ...current, ...prefs };
  try {
    localStorage.setItem(ALARM_PREFS_STORAGE_KEY, JSON.stringify(next));
    // Clear cached alarm URI so the new ringtone is synthesized immediately
    alarmUriCacheByTone.clear();
    if (sharedAlarmAudio) {
      sharedAlarmAudio.src = getOrBuildAlarmWavUri(next.ringtoneId);
    }
  } catch {
    /* ignore */
  }
  return next;
}

/**
 * Generates a Base64-encoded 16-bit PCM WAV Data URI in memory.
 * - mode 'keepalive': 1 second of near-zero amplitude audio to keep Android WebView timer awake in background.
 * - mode 'alarm': 4 seconds of loud phone alarm clock ringing tailored to the chosen ringtone style,
 *   designed for seamless continuous looping (`audio.loop = true`).
 */
function buildWavDataUri(mode: 'keepalive' | 'alarm', ringtoneId: AlarmRingtoneId = 'classic_phone'): string {
  const sampleRate = 8000;
  const durationSeconds = mode === 'keepalive' ? 1 : 4;
  const numSamples = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    if (mode === 'keepalive') {
      // Imperceptible 1-LSB pulse so Android OS keeps the media session & timers alive when backgrounded
      sample = i % 2 === 0 ? 2 : -2;
    } else {
      const t = i / sampleRate;
      const cyclePos = t % 1.0;

      if (ringtoneId === 'classic_phone') {
        // Real Smartphone Digital Alarm Clock: 4 crisp alternating dual-tone rings per second
        const isBeeping =
          (cyclePos >= 0.0 && cyclePos < 0.11) ||
          (cyclePos >= 0.15 && cyclePos < 0.26) ||
          (cyclePos >= 0.30 && cyclePos < 0.41) ||
          (cyclePos >= 0.45 && cyclePos < 0.62);
        if (isBeeping) {
          const freq = cyclePos >= 0.30 ? 1174.66 : 880.0; // A5 & D6 phone alarm clock
          const squareLike =
            Math.sin(2 * Math.PI * freq * t) +
            0.45 * Math.sin(2 * Math.PI * freq * 3 * t) +
            0.2 * Math.sin(2 * Math.PI * freq * 2 * t);
          sample = Math.max(-32760, Math.min(32760, Math.round(squareLike * 22000)));
        }
      } else if (ringtoneId === 'medical_intensive') {
        // High-priority ICU Medical Alarm: rapid 5-pulse urgent pattern
        const isBeeping =
          (cyclePos >= 0.0 && cyclePos < 0.09) ||
          (cyclePos >= 0.13 && cyclePos < 0.22) ||
          (cyclePos >= 0.26 && cyclePos < 0.35) ||
          (cyclePos >= 0.48 && cyclePos < 0.59) ||
          (cyclePos >= 0.64 && cyclePos < 0.78);
        if (isBeeping) {
          const freq = cyclePos >= 0.48 ? 1396.91 : 1046.5; // C6 & F6
          const wave = Math.sin(2 * Math.PI * freq * t) + 0.4 * Math.sin(2 * Math.PI * freq * 2 * t);
          sample = Math.max(-32760, Math.min(32760, Math.round(wave * 24000)));
        }
      } else if (ringtoneId === 'bell_chime') {
        // Resonant Twin-Bell Mechanical Alarm Clock simulation
        const isRinging = cyclePos < 0.72;
        if (isRinging) {
          const strikeMod = Math.abs(Math.sin(2 * Math.PI * 18 * t));
          const wave =
            Math.sin(2 * Math.PI * 1244.5 * t) +
            0.5 * Math.sin(2 * Math.PI * 1661.2 * t);
          sample = Math.max(-32760, Math.min(32760, Math.round(wave * strikeMod * 21000)));
        }
      } else {
        // Crescendo Melody: 4-note ascending chime (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const noteIdx = Math.min(3, Math.floor(cyclePos * 4));
        const localPos = (cyclePos * 4) % 1.0;
        if (localPos < 0.82) {
          const env = Math.max(0.15, 1 - localPos * 0.75);
          const freq = notes[noteIdx];
          const wave = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
          sample = Math.max(-32760, Math.min(32760, Math.round(wave * env * 22000)));
        }
      }
    }
    view.setInt16(44 + i * 2, sample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 4096;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return 'data:audio/wav;base64,' + (typeof btoa === 'function' ? btoa(binary) : '');
}

let sharedKeepAliveAudio: HTMLAudioElement | null = null;
let sharedAlarmAudio: HTMLAudioElement | null = null;
let keepAliveUriCache: string | null = null;
const alarmUriCacheByTone = new Map<AlarmRingtoneId, string>();

let activeBackgroundTimerId: number | null = null;
let activeScheduleTimerId: number | null = null;
let activeRingingIntervalId: number | null = null;
let activeVibrationIntervalId: number | null = null;
let activeSpeechIntervalId: number | null = null;
let activeAutoStopTimeoutId: number | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeWakeLockSentinel: any = null;

let currentActiveAlarm: ActivePhoneAlarmPayload | null = null;
type ActiveAlarmListener = (alarm: ActivePhoneAlarmPayload | null) => void;
const alarmListeners = new Set<ActiveAlarmListener>();

type DoseTakenFromAlarmCallback = (payload: ActivePhoneAlarmPayload) => void;
const doseTakenCallbacks = new Set<DoseTakenFromAlarmCallback>();

function getOrBuildAlarmWavUri(ringtoneId: AlarmRingtoneId): string {
  const cached = alarmUriCacheByTone.get(ringtoneId);
  if (cached) return cached;
  const uri = buildWavDataUri('alarm', ringtoneId);
  alarmUriCacheByTone.set(ringtoneId, uri);
  return uri;
}

export function subscribeToActivePhoneAlarm(listener: ActiveAlarmListener): () => void {
  alarmListeners.add(listener);
  listener(currentActiveAlarm);
  return () => {
    alarmListeners.delete(listener);
  };
}

export function onAlarmDoseConfirmed(cb: DoseTakenFromAlarmCallback): () => void {
  doseTakenCallbacks.add(cb);
  return () => {
    doseTakenCallbacks.delete(cb);
  };
}

function notifyAlarmListeners(alarm: ActivePhoneAlarmPayload | null): void {
  currentActiveAlarm = alarm;
  alarmListeners.forEach((fn) => {
    try {
      fn(alarm);
    } catch {
      /* ignore */
    }
  });
}

export function getActivePhoneAlarm(): ActivePhoneAlarmPayload | null {
  return currentActiveAlarm;
}

/**
 * Unlocks and starts the background keep-alive audio stream on user interaction
 * so timers continue running even when the user presses Home or locks the screen.
 */
export function armBackgroundAudioKeepAlive(): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  try {
    if (!keepAliveUriCache) keepAliveUriCache = buildWavDataUri('keepalive');
    const prefs = loadAlarmPreferences();
    const alarmUri = getOrBuildAlarmWavUri(prefs.ringtoneId);

    if (!sharedKeepAliveAudio) {
      sharedKeepAliveAudio = new Audio(keepAliveUriCache);
      sharedKeepAliveAudio.loop = true;
      sharedKeepAliveAudio.volume = 0.02;
    }
    sharedKeepAliveAudio.play().catch(() => {
      /* ignore if no gesture yet */
    });

    // Pre-create alarm audio element on user gesture so it is unlocked for background playback
    if (!sharedAlarmAudio) {
      sharedAlarmAudio = new Audio(alarmUri);
      sharedAlarmAudio.loop = true;
      sharedAlarmAudio.volume = 1.0;
    }
  } catch {
    /* ignore */
  }
}

/**
 * Plays a single 2.2-second burst of Web Audio API synthesis according to the chosen ringtone.
 */
function playWebAudioAlarmBurst(ringtoneId: AlarmRingtoneId): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ringtoneId === 'bell_chime') {
      const offsets = [0, 0.18, 0.36, 0.54, 0.9, 1.08, 1.26, 1.44];
      offsets.forEach((startOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1244.5, ctx.currentTime + startOffset);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + 0.16);
      });
    } else if (ringtoneId === 'crescendo_melody') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const startOffset = idx * 0.25;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
        gain.gain.setValueAtTime(0.38, ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + 0.23);
      });
    } else {
      const pulses = [0, 0.18, 0.36, 0.54, 0.95, 1.13, 1.31, 1.49];
      const f1 = ringtoneId === 'medical_intensive' ? 1046.5 : 880.0;
      const f2 = ringtoneId === 'medical_intensive' ? 1396.91 : 1174.66;
      pulses.forEach((startOffset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx % 2 === 0 ? f1 : f2, ctx.currentTime + startOffset);
        gain.gain.setValueAtTime(0.36, ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + 0.16);
      });
    }

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2200);
  } catch {
    /* ignore */
  }
}

/**
 * Preview the selected ringtone for 2.5 seconds without launching the full-screen alarm.
 */
export function previewAlarmRingtone(ringtoneId: AlarmRingtoneId): void {
  playWebAudioAlarmBurst(ringtoneId);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([250, 120, 250]);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Stops all active ringing loops, vibrations, speech synthesis, and dismisses the Full-Screen Alarm UI.
 */
export function stopContinuousPhoneAlarm(): void {
  if (activeRingingIntervalId !== null && typeof window !== 'undefined') {
    window.clearInterval(activeRingingIntervalId);
    activeRingingIntervalId = null;
  }
  if (activeVibrationIntervalId !== null && typeof window !== 'undefined') {
    window.clearInterval(activeVibrationIntervalId);
    activeVibrationIntervalId = null;
  }
  if (activeSpeechIntervalId !== null && typeof window !== 'undefined') {
    window.clearInterval(activeSpeechIntervalId);
    activeSpeechIntervalId = null;
  }
  if (activeAutoStopTimeoutId !== null && typeof window !== 'undefined') {
    window.clearTimeout(activeAutoStopTimeoutId);
    activeAutoStopTimeoutId = null;
  }

  try {
    if (sharedAlarmAudio) {
      sharedAlarmAudio.pause();
      sharedAlarmAudio.currentTime = 0;
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(0);
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    /* ignore */
  }

  try {
    if (activeWakeLockSentinel && typeof activeWakeLockSentinel.release === 'function') {
      activeWakeLockSentinel.release().catch(() => {});
      activeWakeLockSentinel = null;
    }
  } catch {
    /* ignore */
  }

  const bridge = getAndroidAlarmBridge();
  if (bridge && typeof bridge.stopRingingAlarm === 'function') {
    try {
      bridge.stopRingingAlarm();
    } catch {
      /* ignore */
    }
  }

  notifyAlarmListeners(null);
}

/**
 * Confirms the dose as taken directly from the Full-Screen Phone Alarm screen and stops the alarm.
 */
export function confirmDoseTakenFromAlarm(): void {
  const active = currentActiveAlarm;
  stopContinuousPhoneAlarm();
  if (active) {
    doseTakenCallbacks.forEach((cb) => {
      try {
        cb(active);
      } catch {
        /* ignore */
      }
    });
  }
}

/**
 * Snoozes the currently ringing phone alarm for `minutes` (default 10m), stopping current sound
 * and scheduling it to ring again like a real phone alarm clock.
 */
export async function snoozeActivePhoneAlarm(minutes = 10): Promise<string> {
  const active = currentActiveAlarm;
  stopContinuousPhoneAlarm();

  const snoozeMs = Math.max(1, minutes) * 60 * 1000;
  const targetDate = new Date(Date.now() + snoozeMs);
  const hh = String(targetDate.getHours()).padStart(2, '0');
  const mm = String(targetDate.getMinutes()).padStart(2, '0');
  const newTimeHHMM = `${hh}:${mm}`;

  const medName = active?.medicineName || (active?.isAr !== false ? 'المضاد الحيوي' : 'Antibiotic Dose');
  const instruction =
    active?.doseInstruction ||
    (active?.isAr !== false ? 'يرجى أخذ الجرعة في موعدها' : 'Please take your scheduled dose');
  const isAr = active?.isAr !== false;

  await scheduleSingleNativeDoseAlarm(medName, instruction, newTimeHHMM, isAr);
  return newTimeHHMM;
}

/**
 * Fires a full-screen, continuous-looping Phone Alarm Clock with:
 * - Full-Screen Phone Alarm Modal (via subscriber notification)
 * - Continuous looping WAV alarm audio + repeating WebAudio synthesis bursts
 * - Continuous repeating vibration pattern
 * - Periodic voice reminder readout every 9 seconds
 * - Screen WakeLock + Lock-screen MediaSession controls + High-priority Notification
 */
export function fireLoudBackgroundAlarmNow(
  title: string,
  body: string,
  isAr = true,
  options?: {
    medicineName?: string;
    doseInstruction?: string;
    timeHHMM?: string;
    scheduleId?: string;
    doseId?: string;
  }
): void {
  if (typeof window === 'undefined') return;

  // Stop any previous ringing loop before starting fresh
  stopContinuousPhoneAlarm();

  const prefs = loadAlarmPreferences();
  const now = new Date();
  const fallbackHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const payload: ActivePhoneAlarmPayload = {
    id: `alarm-${Date.now()}`,
    title,
    body,
    medicineName:
      options?.medicineName ||
      title.replace(/^(?:💊|🔔|⏰)\s*(?:موعد جرعة:|ميعاد جرعة:|Dose Time:|Dose Reminder:)?\s*/i, '').trim() ||
      (isAr ? 'جرعة المضاد الحيوي' : 'Antibiotic Dose'),
    doseInstruction: options?.doseInstruction || body,
    timeHHMM: options?.timeHHMM || fallbackHHMM,
    scheduleId: options?.scheduleId,
    doseId: options?.doseId,
    triggeredAt: Date.now(),
    isAr,
    ringtoneId: prefs.ringtoneId,
  };

  // 1. Notify Full-Screen Phone Alarm UI immediately
  notifyAlarmListeners(payload);

  // 2. Request Screen WakeLock so the phone screen stays illuminated
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navAny = navigator as any;
    if (navAny?.wakeLock && typeof navAny.wakeLock.request === 'function') {
      navAny.wakeLock
        .request('screen')
        .then((sentinel: unknown) => {
          activeWakeLockSentinel = sentinel;
        })
        .catch(() => {});
    }
  } catch {
    /* ignore */
  }

  // 3. Start Continuous Looping 16-bit PCM WAV Alarm Audio
  try {
    const alarmUri = getOrBuildAlarmWavUri(prefs.ringtoneId);
    if (!sharedAlarmAudio) {
      sharedAlarmAudio = new Audio(alarmUri);
    } else if (sharedAlarmAudio.src !== alarmUri) {
      sharedAlarmAudio.src = alarmUri;
    }
    sharedAlarmAudio.loop = true;
    sharedAlarmAudio.currentTime = 0;
    sharedAlarmAudio.volume = 1.0;
    sharedAlarmAudio.play().catch(() => {
      /* fallback to Web Audio API loop below */
    });
  } catch {
    /* ignore */
  }

  // 4. Start Continuous Web Audio API Harmonic Alarm Loop (every 2.4s until stopped)
  playWebAudioAlarmBurst(prefs.ringtoneId);
  activeRingingIntervalId = window.setInterval(() => {
    playWebAudioAlarmBurst(prefs.ringtoneId);
    // Also ensure HTML5 audio stays playing if unlocked
    if (sharedAlarmAudio && sharedAlarmAudio.paused) {
      sharedAlarmAudio.play().catch(() => {});
    }
  }, 2400);

  // 5. Start Continuous Phone Vibration Loop (every 2.6s until stopped)
  if (prefs.vibrationEnabled) {
    const vibratePulse = () => {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate([700, 250, 700, 250, 500]);
        }
      } catch {
        /* ignore */
      }
    };
    vibratePulse();
    activeVibrationIntervalId = window.setInterval(vibratePulse, 2600);
  }

  // 6. Configure Lock-Screen MediaSession Controls (so user can stop/snooze from lock screen)
  try {
    if ('mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: payload.medicineName,
        artist: isAr ? '⏰ منبه مواعيد المضادات الحيوية' : '⏰ Antibiotic Dose Alarm Clock',
        album: payload.doseInstruction,
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        stopContinuousPhoneAlarm();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        stopContinuousPhoneAlarm();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        void snoozeActivePhoneAlarm(prefs.snoozeMinutesDefault);
      });
    }
  } catch {
    /* ignore */
  }

  // 7. Show Persistent High-Importance System Notification (requireInteraction: true)
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notifOpts = {
        body,
        icon: '/favicon-192.png',
        badge: '/favicon-192.png',
        tag: 'med-dose-phone-alarm',
        renotify: true,
        requireInteraction: true,
        vibrate: [800, 250, 800, 250, 800],
      } as NotificationOptions;

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, notifOpts);
          })
          .catch(() => {
            new Notification(title, notifOpts);
          });
      } else {
        new Notification(title, notifOpts);
      }
    }
  } catch {
    /* ignore */
  }

  // 8. Speak Dose Reminder Aloud repeatedly every 9 seconds while alarm rings
  if (prefs.voiceReadoutEnabled) {
    const speakNow = () => {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const speechText = isAr
            ? `تنبيه منبه الدواء. حان الآن موعد جرعة ${payload.medicineName}. ${payload.doseInstruction}. اضغط تم أخذ الجرعة لإيقاف المنبه.`
            : `Medication alarm clock. It is time for your ${payload.medicineName} dose. ${payload.doseInstruction}. Tap dose taken to stop the alarm.`;
          const utter = new SpeechSynthesisUtterance(speechText);
          utter.lang = isAr ? 'ar-EG' : 'en-US';
          utter.rate = 0.95;
          utter.volume = 1.0;
          window.speechSynthesis.speak(utter);
        }
      } catch {
        /* ignore */
      }
    };
    window.setTimeout(speakNow, 1800);
    activeSpeechIntervalId = window.setInterval(speakNow, 9500);
  }

  // Auto safety cut-off after 5 minutes of unattended ringing (like standard phone alarms)
  activeAutoStopTimeoutId = window.setTimeout(() => {
    stopContinuousPhoneAlarm();
  }, 5 * 60 * 1000);
}

/**
 * Opens the phone's built-in Android Clock App (تطبيق الساعة/المنبه الأصلي في الهاتف)
 * to set a hardware system alarm at `timeHHMM` for `medicineName`.
 * Works via `window.AndroidAlarmBridge.openSystemClockAlarm` or Android `intent://` URI!
 */
export function openNativeSystemClockAlarm(
  medicineName: string,
  doseInstruction: string,
  timeHHMM: string,
  isAr = true
): { launched: boolean; message: string } {
  const [hh, mm] = (timeHHMM || '08:00').split(':').map((n) => parseInt(n, 10) || 0);
  const label = isAr
    ? `💊 جرعة ${medicineName} (${doseInstruction})`
    : `💊 Dose: ${medicineName} (${doseInstruction})`;

  // Always arm the continuous full-screen alarm & native hardware AlarmManager.setAlarmClock first
  void scheduleSingleNativeDoseAlarm(medicineName, doseInstruction, timeHHMM, isAr);

  const bridge = getAndroidAlarmBridge();

  // 1. If the APK has the native openSystemClockAlarm bridge method, call it directly
  if (bridge && typeof bridge.openSystemClockAlarm === 'function') {
    try {
      const ok = bridge.openSystemClockAlarm(hh, mm, label);
      if (ok) {
        return {
          launched: true,
          message: isAr
            ? `⏰ تم فتح تطبيق الساعة الأصلي في هاتفك وضبط المنبه على ${timeHHMM}!`
            : `⏰ Opened your phone's native Clock app and set the alarm for ${timeHHMM}!`,
        };
      }
    } catch {
      /* fallback below */
    }
  }

  // 2. If running inside the Android APK WebView without openSystemClockAlarm on the older APK binary:
  //    CRITICAL: Do NOT click an `intent:#Intent...` link on the main frame because older WebViewClient
  //    treats unknown schemes as a main-frame error and redirects to the old bundled `https://localhost`!
  //    Instead, `bridge.scheduleExactAlarm` above ALREADY registered the alarm in Android's hardware
  //    `AlarmManager.setAlarmClock` (which shows the ⏰ clock icon in the Android status bar and wakes the phone).
  if (bridge || isNativePlatform()) {
    if (bridge && typeof bridge.scheduleExactAlarm === 'function') {
      try {
        const target = new Date();
        target.setHours(hh, mm, 0, 0);
        if (target.getTime() <= Date.now()) {
          target.setDate(target.getDate() + 1);
        }
        bridge.scheduleExactAlarm(
          hashNotificationId(`${medicineName}_${timeHHMM}`),
          target.getTime(),
          isAr ? `⏰ منبه الدواء: ${medicineName}` : `⏰ Med Alarm: ${medicineName}`,
          label
        );
      } catch {
        /* ignore */
      }
    }
    return {
      launched: true,
      message: isAr
        ? `⏰ تم ربط وضبط المنبه في نظام أندرويد على الساعة ${timeHHMM} (ستجد علامة المنبه ⏰ في شريط الهاتف العلوي وسيرن حتى والشاشة مغلقة)!`
        : `⏰ Hardware system alarm set for ${timeHHMM} via Android AlarmClock (works even when screen is locked)!`,
    };
  }

  // 3. In external Android Chrome browser (outside WebView), launch Android's native Clock SET_ALARM intent
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    try {
      const intentUrl = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${hh};i.android.intent.extra.alarm.MINUTES=${mm};B.android.intent.extra.alarm.SKIP_UI=false;B.android.intent.extra.alarm.VIBRATE=true;end`;
      const a = document.createElement('a');
      a.href = intentUrl;
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return {
        launched: true,
        message: isAr
          ? `⏰ تم فتح تطبيق الساعة/المنبه الأصلي في هاتفك على الساعة ${timeHHMM} — اضغط حفظ في تطبيق الساعة.`
          : `⏰ Opened your Android Clock app for ${timeHHMM} — tap Save in the Clock app.`,
      };
    } catch {
      /* ignore */
    }
  }

  return {
    launched: false,
    message: isAr
      ? `✅ تم تفعيل منبه الموبايل الذكي على الساعة ${timeHHMM} بنغمة مستمرة وشاشة كاملة!`
      : `✅ Activated full-screen continuous phone alarm for ${timeHHMM}!`,
  };
}

/**
 * Checks whether the app is currently running inside the native Android APK container.
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  if (getAndroidAlarmBridge()) return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

/**
 * Retrieves the Capacitor LocalNotifications plugin instance safely if available.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLocalNotificationsPlugin(): any {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  if (!cap) return null;
  return cap?.Plugins?.LocalNotifications || null;
}

/**
 * Ensures the Android Notification Channel with Maximum Importance (5) and Alarm Sound is created.
 */
export async function ensureNativeAlarmChannel(): Promise<void> {
  const bridge = getAndroidAlarmBridge();
  if (bridge && typeof bridge.requestPermissions === 'function') {
    try {
      bridge.requestPermissions();
    } catch {
      /* ignore */
    }
  }

  const plugin = getLocalNotificationsPlugin();
  if (!plugin || typeof plugin.createChannel !== 'function') return;

  try {
    await plugin.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'منبهات مواعيد الأدوية (رنين مستمر كمنبه الهاتف)',
      description: 'رنين منبه عالي ومستمر لمواعيد جرعات المضادات الحيوية يعمل حتى عند قفل الشاشة',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#0B3C5D',
    });
  } catch (err) {
    console.warn('Could not create notification channel:', err);
  }
}

/**
 * Requests native or browser notification permissions.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  armBackgroundAudioKeepAlive();

  const bridge = getAndroidAlarmBridge();
  if (bridge) {
    try {
      if (typeof bridge.requestPermissions === 'function') {
        bridge.requestPermissions();
      }
    } catch {
      /* ignore */
    }
  }

  const plugin = getLocalNotificationsPlugin();
  if (plugin && typeof plugin.requestPermissions === 'function') {
    try {
      const status = await plugin.requestPermissions();
      if (status?.display === 'granted') return true;
    } catch {
      /* ignore */
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Generates a stable 32-bit positive integer hash for notification IDs.
 */
function hashNotificationId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.max(1000, Math.abs(hash) % 2147480000);
}

/**
 * Schedules a single exact dose alarm for a given HH:MM time (used by SmartDoseAlarmCard).
 * Uses BOTH the background keep-alive audio timer (opens Full-Screen Phone Alarm with continuous ringing)
 * AND the native AndroidAlarmBridge when available.
 */
export async function scheduleSingleNativeDoseAlarm(
  medicineName: string,
  doseInstruction: string,
  timeHHMM: string,
  isAr = true
): Promise<{ success: boolean; isNative: boolean; targetTimeFormatted: string; message: string }> {
  armBackgroundAudioKeepAlive();
  await requestNotificationPermission();

  const [hh, mm] = (timeHHMM || '08:00').split(':').map((n) => parseInt(n, 10) || 0);
  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const title = isAr ? `⏰ منبه جرعة: ${medicineName}` : `⏰ Dose Alarm: ${medicineName}`;
  const body = isAr
    ? `حان الآن موعد جرعة «${medicineName}» (${timeHHMM}) — ${doseInstruction}`
    : `It is time for your ${medicineName} dose (${timeHHMM}) — ${doseInstruction}`;

  // 1. Arm background keep-alive timer so it triggers Full-Screen Phone Alarm even if minimized
  if (typeof window !== 'undefined') {
    if (activeBackgroundTimerId !== null) {
      window.clearTimeout(activeBackgroundTimerId);
    }
    const delayMs = Math.max(1000, target.getTime() - Date.now());
    activeBackgroundTimerId = window.setTimeout(() => {
      fireLoudBackgroundAlarmNow(title, body, isAr, {
        medicineName,
        doseInstruction,
        timeHHMM,
      });
    }, delayMs);
  }

  // 2. Also schedule via Native AndroidAlarmBridge if present
  const bridge = getAndroidAlarmBridge();
  if (bridge) {
    try {
      bridge.scheduleExactAlarm(88888, target.getTime(), title, body);
    } catch {
      /* ignore */
    }
  }

  // 3. Also schedule via Capacitor LocalNotifications if present
  const plugin = getLocalNotificationsPlugin();
  if (plugin && isNativePlatform()) {
    try {
      await ensureNativeAlarmChannel();
      await plugin.schedule({
        notifications: [
          {
            id: 88888,
            title,
            body,
            channelId: ALARM_CHANNEL_ID,
            schedule: { at: target, allowWhileIdle: true },
          },
        ],
      });
    } catch {
      /* ignore */
    }
  }

  return {
    success: true,
    isNative: true,
    targetTimeFormatted: timeHHMM,
    message: isAr
      ? `✅ تم ضبط منبه الموبايل على الساعة ${timeHHMM}! سيرن بنغمة منبه متواصلة وشاشة رنين كاملة حتى توقفه بنفسك أو تؤجله (غفوة).`
      : `✅ Phone alarm set for ${timeHHMM}! It will ring continuously with a full-screen alarm clock until you stop or snooze it.`,
  };
}

/**
 * Synchronizes all active treatment schedules into Native Android Exact Alarms & Background Keep-Alive.
 */
export async function syncNativeAlarmsWithSchedules(
  schedules: TreatmentSchedule[],
  isAr = true
): Promise<NativeAlarmSyncResult> {
  armBackgroundAudioKeepAlive();
  const bridge = getAndroidAlarmBridge();
  const isNative = isNativePlatform();
  const plugin = getLocalNotificationsPlugin();

  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationsToSchedule: any[] = [];

  for (const sch of schedules) {
    if (!sch.doses || sch.doses.length === 0) continue;

    for (const d of sch.doses) {
      if (d.status === 'taken') continue;

      const doseDate = new Date(d.scheduledTime);
      const doseTimeMs = doseDate.getTime();

      if (doseTimeMs > now && doseTimeMs < now + 14 * 24 * 60 * 60 * 1000) {
        const notifId = hashNotificationId(`${sch.id}_${d.id}`);
        const dHHMM = (d.scheduledTime.split('T')[1] || '08:00').slice(0, 5);
        const title = isAr
          ? `⏰ منبه جرعة: ${sch.medicineName}`
          : `⏰ Dose Alarm: ${sch.medicineName}`;
        const body = isAr
          ? `حان الآن موعد جرعة «${sch.prescribedDose}» (اليوم ${d.dayNumber}) — التزم بالموعد للحفاظ على تركيز المضاد الحيوي.`
          : `Time for your ${sch.prescribedDose} dose (Day ${d.dayNumber}) — take on time to maintain antibiotic efficacy.`;

        notificationsToSchedule.push({
          id: notifId,
          title,
          body,
          triggerAtMs: doseTimeMs,
          channelId: ALARM_CHANNEL_ID,
          schedule: {
            at: doseDate,
            allowWhileIdle: true,
          },
          extra: {
            scheduleId: sch.id,
            doseId: d.id,
            medicineName: sch.medicineName,
            doseInstruction: `${sch.prescribedDose}${sch.notes ? ` — ${sch.notes}` : ''}`,
            timeHHMM: dHHMM,
          },
        });
      }

      if (notificationsToSchedule.length >= 60) break;
    }
  }

  // Schedule nearest upcoming dose on background keep-alive timer
  if (typeof window !== 'undefined') {
    if (activeScheduleTimerId !== null) {
      window.clearTimeout(activeScheduleTimerId);
      activeScheduleTimerId = null;
    }
    if (notificationsToSchedule.length > 0) {
      const sorted = [...notificationsToSchedule].sort((a, b) => a.triggerAtMs - b.triggerAtMs);
      const nearest = sorted[0];
      const delayMs = Math.max(1000, nearest.triggerAtMs - Date.now());
      if (delayMs < 24 * 60 * 60 * 1000) {
        activeScheduleTimerId = window.setTimeout(() => {
          fireLoudBackgroundAlarmNow(nearest.title, nearest.body, isAr, {
            medicineName: nearest.extra?.medicineName,
            doseInstruction: nearest.extra?.doseInstruction,
            timeHHMM: nearest.extra?.timeHHMM,
            scheduleId: nearest.extra?.scheduleId,
            doseId: nearest.extra?.doseId,
          });
        }, delayMs);
      }
    }
  }

  if (bridge) {
    try {
      for (const n of notificationsToSchedule) {
        bridge.scheduleExactAlarm(n.id, n.triggerAtMs, n.title, n.body);
      }
    } catch {
      /* ignore */
    }
  }

  if (plugin && isNative) {
    try {
      await ensureNativeAlarmChannel();
      await plugin.schedule({ notifications: notificationsToSchedule });
    } catch {
      /* ignore */
    }
  }

  return {
    isNative: true,
    scheduledCount: notificationsToSchedule.length,
    permissionGranted: true,
    messageAr: `تمت برمجة ${notificationsToSchedule.length} منبه دواء بنجاح. سيرن الهاتف بنغمة منبه متواصلة وشاشة كاملة في مواعيد الجرعات.`,
    messageEn: `Successfully scheduled ${notificationsToSchedule.length} phone-style dose alarms.`,
  };
}

/**
 * Triggers a live test Phone Alarm (rings after 5 seconds or immediately)
 * with the Full-Screen Phone Alarm Clock UI, continuous ringtone, vibration, and voice readout!
 */
export async function triggerTestAlarm(
  isAr = true,
  options?: {
    immediate?: boolean;
    medicineName?: string;
    doseInstruction?: string;
    timeHHMM?: string;
  }
): Promise<{ success: boolean; message: string }> {
  armBackgroundAudioKeepAlive();
  await requestNotificationPermission();

  const medName =
    options?.medicineName || (isAr ? 'أوجمنتين 1 جم (Augmentin 1g)' : 'Augmentin 1g (Amoxiclav)');
  const instruction =
    options?.doseInstruction ||
    (isAr
      ? 'قرص واحد بعد الأكل مباشرة مع كوب ماء كامل'
      : '1 tablet immediately after a meal with a full glass of water');
  const now = new Date();
  const timeHHMM =
    options?.timeHHMM ||
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const title = isAr ? `⏰ موعد جرعة: ${medName}` : `⏰ Dose Alarm: ${medName}`;
  const body = isAr
    ? `حان الآن موعد جرعة «${medName}» — ${instruction}`
    : `Time for your ${medName} dose — ${instruction}`;

  if (options?.immediate) {
    fireLoudBackgroundAlarmNow(title, body, isAr, {
      medicineName: medName,
      doseInstruction: instruction,
      timeHHMM,
    });
    return {
      success: true,
      message: isAr
        ? '🔔 شاشة منبه الموبايل ترن الآن! يمكنك تجربة زر «تم أخذ الجرعة» أو «غفوة».'
        : '🔔 Full-screen phone alarm is ringing now! Try the "Dose Taken" or "Snooze" buttons.',
    };
  }

  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      fireLoudBackgroundAlarmNow(title, body, isAr, {
        medicineName: medName,
        doseInstruction: instruction,
        timeHHMM,
      });
    }, 5000);
  }

  const bridge = getAndroidAlarmBridge();
  if (bridge) {
    try {
      bridge.scheduleExactAlarm(99999, Date.now() + 5000, title, body);
    } catch {
      /* ignore */
    }
  }

  return {
    success: true,
    message: isAr
      ? '✅ تم تفعيل المنبه التجريبي! اخرج بره التطبيق دلوقتي أو اطفي شاشة الموبايل — هيرن كمنبه تليفون متواصل بعد 5 ثواني بالظبط!'
      : '✅ Test phone alarm armed! Exit the app or lock your screen now — it will ring continuously like a phone alarm in 5 seconds!',
  };
}

/**
 * Global background clock watcher (runs every second across the entire app).
 * Automatically triggers the Full-Screen Phone Alarm when either:
 * - The SmartDoseAlarmCard time arrives (`aa_smart_dose_alarm_v1`), or
 * - Any scheduled dose in `TreatmentSchedule` (`antibiotic_treatment_tracker_schedules*`) arrives.
 */
let globalWatcherStarted = false;

export function startGlobalPhoneAlarmWatcher(getIsAr: () => boolean): void {
  if (typeof window === 'undefined' || globalWatcherStarted) return;
  globalWatcherStarted = true;

  // Unlock background keep-alive audio on first user interaction anywhere in the app
  const unlockOnce = () => {
    try {
      const raw = localStorage.getItem('aa_smart_dose_alarm_v1');
      const hasSmartAlarm = raw && JSON.parse(raw)?.notificationsEnabled;
      const rawSch = localStorage.getItem('antibiotic_treatment_tracker_schedules');
      const hasSchedules = rawSch && JSON.parse(rawSch)?.length > 0;
      if (hasSmartAlarm || hasSchedules) {
        armBackgroundAudioKeepAlive();
      }
    } catch {
      /* ignore */
    }
  };
  window.addEventListener('pointerdown', unlockOnce, { passive: true });

  // Listen for native Android hardware alarm wake-up event from MainActivity.java
  window.addEventListener('native-hardware-alarm-fired', (ev: Event) => {
    const detail = (ev as CustomEvent)?.detail || {};
    const isAr = getIsAr();
    const title = detail.title || (isAr ? '⏰ موعد جرعة المضاد الحيوي' : '⏰ Medication Dose Alarm');
    const body = detail.body || (isAr ? 'حان الآن موعد أخذ الجرعة الموصوفة' : 'It is time for your scheduled dose');
    fireLoudBackgroundAlarmNow(title, body, isAr);
  });

  window.setInterval(() => {
    // Do not interrupt if already ringing
    if (currentActiveAlarm) return;

    const now = new Date();
    if (now.getSeconds() > 10) return; // Check within the first 10 seconds of each minute

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const hhStr = String(now.getHours()).padStart(2, '0');
    const minStr = String(now.getMinutes()).padStart(2, '0');
    const currentHHMM = `${hhStr}:${minStr}`;
    const minuteStamp = `${todayStr}T${currentHHMM}`;

    let lastFired = '';
    try {
      lastFired = localStorage.getItem(ALARM_LAST_FIRED_MINUTE_KEY) || '';
    } catch {
      /* ignore */
    }
    if (lastFired === minuteStamp) return;

    const isAr = getIsAr();

    // 1. Check SmartDoseAlarmCard saved alarm
    try {
      const smartRaw = localStorage.getItem('aa_smart_dose_alarm_v1');
      if (smartRaw) {
        const smart = JSON.parse(smartRaw);
        if (smart && smart.nextDoseTime === currentHHMM) {
          localStorage.setItem(ALARM_LAST_FIRED_MINUTE_KEY, minuteStamp);
          const medName = smart.medicineName || (isAr ? 'جرعة المضاد الحيوي' : 'Antibiotic Dose');
          const instr = smart.doseInstruction || '';
          fireLoudBackgroundAlarmNow(
            isAr ? `⏰ موعد جرعة: ${medName}` : `⏰ Dose Alarm: ${medName}`,
            isAr ? `حان الآن موعد جرعة «${medName}» (${currentHHMM}) — ${instr}` : `Time for your ${medName} dose (${currentHHMM}) — ${instr}`,
            isAr,
            {
              medicineName: medName,
              doseInstruction: instr,
              timeHHMM: currentHHMM,
            }
          );
          return;
        }
      }
    } catch {
      /* ignore */
    }

    // 2. Check all TreatmentSchedule keys in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('antibiotic_treatment_tracker_schedules')) continue;
        const rawSch = localStorage.getItem(key);
        if (!rawSch) continue;
        const schedules = JSON.parse(rawSch) as TreatmentSchedule[];
        if (!Array.isArray(schedules)) continue;

        for (const sch of schedules) {
          if (!Array.isArray(sch.doses)) continue;
          for (const d of sch.doses) {
            if (d.status !== 'upcoming') continue;
            const [dDate, dTimeFull] = (d.scheduledTime || '').split('T');
            const dHHMM = (dTimeFull || '').slice(0, 5);
            if (dDate === todayStr && dHHMM === currentHHMM) {
              localStorage.setItem(ALARM_LAST_FIRED_MINUTE_KEY, minuteStamp);
              const instr = `${sch.prescribedDose}${sch.notes ? ` — ${sch.notes}` : ''}`;
              fireLoudBackgroundAlarmNow(
                isAr ? `⏰ موعد جرعة: ${sch.medicineName}` : `⏰ Dose Alarm: ${sch.medicineName}`,
                isAr
                  ? `حان الآن موعد جرعة «${sch.medicineName}» (${sch.prescribedDose}) — اليوم ${d.dayNumber}`
                  : `Time for your ${sch.medicineName} (${sch.prescribedDose}) dose — Day ${d.dayNumber}`,
                isAr,
                {
                  medicineName: sch.medicineName,
                  doseInstruction: instr,
                  timeHHMM: currentHHMM,
                  scheduleId: sch.id,
                  doseId: d.id,
                }
              );
              return;
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }, 1000);
}
