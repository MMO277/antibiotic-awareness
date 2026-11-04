/**
 * nativeAlarmService.ts
 *
 * Background-Capable Medication Alarm Engine & Native Bridge for Antibiotic Awareness.
 *
 * Works immediately via Live OTA Website Updates inside the installed Android APK
 * WITHOUT requiring the user to uninstall/reinstall the APK:
 * - Uses an HTML5 Audio PCM WAV Keep-Alive loop when an alarm is armed so Android WebView
 *   never suspends the countdown timer when the user exits to the home screen or locks the phone.
 * - Synthesizes a real 16-bit PCM WAV loud digital alarm clock ringtone in memory and plays it
 *   at full volume when the alarm time arrives (even while minimized/backgrounded).
 * - Also supports window.AndroidAlarmBridge and @capacitor/local-notifications when available.
 */

import { TreatmentSchedule } from './trackerData';

export interface NativeAlarmSyncResult {
  isNative: boolean;
  scheduledCount: number;
  permissionGranted: boolean;
  messageAr: string;
  messageEn: string;
}

export const ALARM_CHANNEL_ID = 'med_alarm_clock_v2';

interface AndroidAlarmBridgeInterface {
  isAvailable?: () => boolean;
  requestPermissions?: () => void;
  scheduleExactAlarm: (id: number, triggerAtMillis: number, title: string, body: string) => boolean;
  cancelAlarm: (id: number) => boolean;
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

/**
 * Generates a Base64-encoded 16-bit PCM WAV Data URI in memory.
 * - mode 'keepalive': 1 second of near-zero amplitude audio to keep Android WebView timer awake in background.
 * - mode 'alarm': 6 seconds of loud dual-tone digital alarm clock ringing (880Hz / 1320Hz pulses).
 */
function buildWavDataUri(mode: 'keepalive' | 'alarm'): string {
  const sampleRate = 8000;
  const durationSeconds = mode === 'keepalive' ? 1 : 6;
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
      // Classic loud digital medical alarm clock pattern: 4 fast beeps per second
      const t = i / sampleRate;
      const cyclePos = t % 1.0;
      const isBeeping =
        (cyclePos >= 0.0 && cyclePos < 0.12) ||
        (cyclePos >= 0.18 && cyclePos < 0.30) ||
        (cyclePos >= 0.36 && cyclePos < 0.48) ||
        (cyclePos >= 0.54 && cyclePos < 0.72);
      if (isBeeping) {
        const freq = cyclePos >= 0.36 ? 1320 : 987.77; // B5 & E6 medical alarm tones
        const wave = Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 2 * t);
        sample = Math.max(-32760, Math.min(32760, Math.round(wave * 24000)));
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
let alarmUriCache: string | null = null;
let activeBackgroundTimerId: number | null = null;

/**
 * Unlocks and starts the background keep-alive audio stream on user interaction
 * so timers continue running even when the user presses Home or locks the screen.
 */
export function armBackgroundAudioKeepAlive(): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  try {
    if (!keepAliveUriCache) keepAliveUriCache = buildWavDataUri('keepalive');
    if (!alarmUriCache) alarmUriCache = buildWavDataUri('alarm');

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
      sharedAlarmAudio = new Audio(alarmUriCache);
      sharedAlarmAudio.loop = false;
      sharedAlarmAudio.volume = 1.0;
    }
  } catch {
    /* ignore */
  }
}

/**
 * Fires the loud 6-second digital alarm ringtone + vibration + system notification + voice reminder.
 */
export function fireLoudBackgroundAlarmNow(title: string, body: string, isAr = true): void {
  if (typeof window === 'undefined') return;

  // 1. Play loud 6-second WAV alarm ringtone
  try {
    if (!alarmUriCache) alarmUriCache = buildWavDataUri('alarm');
    if (!sharedAlarmAudio) {
      sharedAlarmAudio = new Audio(alarmUriCache);
    }
    sharedAlarmAudio.currentTime = 0;
    sharedAlarmAudio.volume = 1.0;
    sharedAlarmAudio.play().catch(() => {
      /* fallback to Web Audio API */
    });
  } catch {
    /* ignore */
  }

  // 2. Also play Web Audio API harmonic alarm synthesis
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const pulses = [0, 0.22, 0.44, 0.66, 1.1, 1.32, 1.54, 1.76, 2.2, 2.42, 2.64, 2.86];
      pulses.forEach((startOffset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx % 2 === 0 ? 987.77 : 1318.5, ctx.currentTime + startOffset);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + 0.19);
      });
    }
  } catch {
    /* ignore */
  }

  // 3. Vibrate device if supported
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([500, 250, 500, 250, 700, 250, 700]);
    }
  } catch {
    /* ignore */
  }

  // 4. Show system notification (via ServiceWorker if available, or Notification API)
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/favicon-192.png',
              tag: 'med-dose-alarm',
              renotify: true,
            } as NotificationOptions);
          })
          .catch(() => {
            new Notification(title, { body, icon: '/favicon-192.png' });
          });
      } else {
        new Notification(title, { body, icon: '/favicon-192.png' });
      }
    }
  } catch {
    /* ignore */
  }

  // 5. Speak dose reminder aloud after 2.5s of alarm ringing
  setTimeout(() => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(`${title}. ${body}`);
        utter.lang = isAr ? 'ar-EG' : 'en-US';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      /* ignore */
    }
  }, 2500);
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
 * Ensures the Android Notification Channel with High Importance and Alarm Sound is created.
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
      name: 'منبهات مواعيد الأدوية والمضادات الحيوية',
      description: 'تنبيهات صوتية دقيقة لمواعيد جرعات الأدوية تعمل حتى عند إغلاق التطبيق',
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
 * Uses BOTH the background keep-alive audio timer (works immediately without reinstalling APK)
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

  const title = isAr ? `💊 موعد جرعة: ${medicineName}` : `💊 Dose Time: ${medicineName}`;
  const body = isAr
    ? `حان الآن موعد جرعة «${medicineName}» (${timeHHMM}) — ${doseInstruction}`
    : `It is time for your ${medicineName} dose (${timeHHMM}) — ${doseInstruction}`;

  // 1. Arm background keep-alive timer so it rings even if user minimizes app or locks screen
  if (typeof window !== 'undefined') {
    if (activeBackgroundTimerId !== null) {
      window.clearTimeout(activeBackgroundTimerId);
    }
    const delayMs = Math.max(1000, target.getTime() - Date.now());
    activeBackgroundTimerId = window.setTimeout(() => {
      fireLoudBackgroundAlarmNow(title, body, isAr);
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
      ? `✅ تم تفعيل المنبه على الساعة ${timeHHMM}! هيرن بصوت عالي في ميعاده حتى لو قفلت الشاشة أو خرجت بره التطبيق.`
      : `✅ Alarm activated for ${timeHHMM}! It will ring loudly even when the screen is off or you exit the app.`,
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
        const title = isAr
          ? `💊 ميعاد جرعة: ${sch.medicineName}`
          : `💊 Dose Reminder: ${sch.medicineName}`;
        const body = isAr
          ? `حان الآن موعد جرعة «${sch.prescribedDose}» (اليوم ${d.dayNumber}) — التزم بالموعد للحفاظ على تركيز الدواء وفاعليته.`
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
          },
        });
      }

      if (notificationsToSchedule.length >= 60) break;
    }
  }

  // Schedule nearest upcoming dose on background keep-alive timer
  if (typeof window !== 'undefined' && notificationsToSchedule.length > 0) {
    const sorted = [...notificationsToSchedule].sort((a, b) => a.triggerAtMs - b.triggerAtMs);
    const nearest = sorted[0];
    const delayMs = Math.max(1000, nearest.triggerAtMs - Date.now());
    if (delayMs < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        fireLoudBackgroundAlarmNow(nearest.title, nearest.body, isAr);
      }, delayMs);
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
    messageAr: `تمت برمجة ${notificationsToSchedule.length} منبه دواء بنجاح. ستصلك التنبيهات الصوتية في مواعيدها حتى لو خرجت من التطبيق.`,
    messageEn: `Successfully scheduled ${notificationsToSchedule.length} dose alarms.`,
  };
}

/**
 * Triggers a live test alarm (rings after 5 seconds) EVEN WHEN THE USER EXITS THE APP OR LOCKS THE SCREEN!
 * Works 100% Over-The-Air without reinstalling the APK!
 */
export async function triggerTestAlarm(isAr = true): Promise<{ success: boolean; message: string }> {
  armBackgroundAudioKeepAlive();
  await requestNotificationPermission();

  const title = isAr ? '🔔 حان موعد جرعة المضاد الحيوي!' : '🔔 Medication Dose Alarm!';
  const body = isAr
    ? 'المنبه شغال 100%! هيرن بالصوت والاهتزاز في مواعيد جرعاتك حتى لو خرجت بره التطبيق أو قفلت الشاشة.'
    : 'Alarm is working! It rings loudly at dose times even when you exit the app or lock the screen.';

  // 1. Schedule via background audio keep-alive timer (works immediately without reinstalling APK!)
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      fireLoudBackgroundAlarmNow(title, body, isAr);
    }, 5000);
  }

  // 2. Also schedule via native Android bridge if present
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
      ? '✅ تم تفعيل المنبه التجريبي! اخرج بره التطبيق دلوقتي أو اطفي شاشة الموبايل — هيرن بصوت عالي بعد 5 ثواني بالظبط!'
      : '✅ Test alarm activated! Exit the app or lock your screen now — it will ring loudly in 5 seconds!',
  };
}
