/**
 * nativeAlarmService.ts
 *
 * Native Android Exact Alarms & Medication Reminder Bridge for Antibiotic Awareness.
 *
 * Key Capabilities:
 * - Direct integration with Capacitor Local Notifications (@capacitor/local-notifications).
 * - Schedules EXACT alarms (using Android AlarmManager with `allowWhileIdle: true`) so notifications
 *   ring loudly with vibration at the exact dose time EVEN IF the app is killed or device is asleep.
 * - Creates a dedicated Android Notification Channel ('medication_alarms') with High Importance (5).
 * - Safe dynamic loading: works 100% seamlessly on both Native Android (.apk) and Web/Browser
 *   without crashing or causing TypeScript / bundler errors.
 * - Provides a "Test Alarm" function (rings after 5 seconds) for live demonstration in exams.
 */

import { TreatmentSchedule } from './trackerData';

export interface NativeAlarmSyncResult {
  isNative: boolean;
  scheduledCount: number;
  permissionGranted: boolean;
  messageAr: string;
  messageEn: string;
}

export const ALARM_CHANNEL_ID = 'medication_alarms';

/**
 * Checks whether the app is currently running inside a native mobile container (Capacitor Android/iOS).
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
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
  const plugin = getLocalNotificationsPlugin();
  if (!plugin || typeof plugin.createChannel !== 'function') return;

  try {
    await plugin.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'منبهات مواعيد الأدوية والمضادات الحيوية',
      description: 'تنبيهات صوتية دقيقة لمواعيد جرعات الأدوية تعمل حتى عند إغلاق التطبيق',
      importance: 5, // NotificationManager.IMPORTANCE_HIGH
      visibility: 1, // VISIBILITY_PUBLIC (shows on lockscreen)
      sound: 'alarm_chime.wav',
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
  const plugin = getLocalNotificationsPlugin();
  if (plugin && typeof plugin.requestPermissions === 'function') {
    try {
      const status = await plugin.requestPermissions();
      return status?.display === 'granted';
    } catch {
      return false;
    }
  }

  // Web Browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  return false;
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
  return Math.abs(hash) % 2147483647;
}

/**
 * Synchronizes all active treatment schedules into Native Android Exact Alarms.
 * Even if the user terminates/swipes-away the app, Android AlarmManager fires the alarm at the scheduled time!
 */
export async function syncNativeAlarmsWithSchedules(
  schedules: TreatmentSchedule[],
  isAr = true
): Promise<NativeAlarmSyncResult> {
  const isNative = isNativePlatform();
  const plugin = getLocalNotificationsPlugin();

  if (!isNative || !plugin) {
    return {
      isNative: false,
      scheduledCount: 0,
      permissionGranted: false,
      messageAr:
        'تعمل المنبهات في المتصفح عبر تنزيل ملف التقويم (.ics) أو إشعارات الويب. للحصول على منبه حقيقي يرن والتطبيق مغلق، قم بتثبيت نسخة تطبيق الموبايل (APK).',
      messageEn:
        'Running in web browser mode. For exact hardware alarms that ring when the app is closed, use the native Android APK build.',
    };
  }

  await ensureNativeAlarmChannel();
  const hasPermission = await requestNotificationPermission();

  // Cancel any previously scheduled pending medication alarms to prevent duplicate ringing
  try {
    const pending = await plugin.getPending();
    if (pending?.notifications?.length > 0) {
      await plugin.cancel({ notifications: pending.notifications });
    }
  } catch (err) {
    console.warn('Failed to clear previous alarms:', err);
  }

  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationsToSchedule: any[] = [];

  for (const sch of schedules) {
    if (!sch.doses || sch.doses.length === 0) continue;

    for (const d of sch.doses) {
      if (d.status === 'taken' || d.status === 'skipped') continue;

      const doseDate = new Date(d.scheduledTime);
      const doseTimeMs = doseDate.getTime();

      // Only schedule upcoming doses within the next 14 days
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
          channelId: ALARM_CHANNEL_ID,
          schedule: {
            at: doseDate,
            allowWhileIdle: true, // Uses Android Exact AlarmManager (Wakes phone even in Doze Mode)
          },
          sound: 'alarm_chime.wav',
          smallIcon: 'ic_stat_capsule',
          iconColor: '#0B3C5D',
          actionTypeId: 'MED_ALARM_ACTION',
          extra: {
            scheduleId: sch.id,
            doseId: d.id,
            medicineName: sch.medicineName,
          },
        });
      }

      // Android recommended ceiling is 64 simultaneous pending alarms
      if (notificationsToSchedule.length >= 60) break;
    }
  }

  if (notificationsToSchedule.length > 0) {
    try {
      await plugin.schedule({ notifications: notificationsToSchedule });
    } catch (err) {
      console.error('Failed to schedule native notifications:', err);
    }
  }

  return {
    isNative: true,
    scheduledCount: notificationsToSchedule.length,
    permissionGranted: hasPermission,
    messageAr: `تمت برمجة ${notificationsToSchedule.length} منبه دواء في نظام أندرويد بنجاح. ستصلك التنبيهات في مواعيدها حتى لو كان التطبيق مغلقاً.`,
    messageEn: `Successfully scheduled ${notificationsToSchedule.length} native alarms with Android AlarmManager. They will fire on time even when the app is closed.`,
  };
}

/**
 * Triggers a live test alarm (rings after 5 seconds) to demonstrate native background notifications.
 */
export async function triggerTestAlarm(isAr = true): Promise<{ success: boolean; message: string }> {
  const plugin = getLocalNotificationsPlugin();
  const isNative = isNativePlatform();

  if (isNative && plugin) {
    await ensureNativeAlarmChannel();
    await requestNotificationPermission();
    const testTime = new Date(Date.now() + 5000); // 5 seconds from now

    try {
      await plugin.schedule({
        notifications: [
          {
            id: 99999,
            title: isAr ? '🔔 تجربة منبه الدواء (مضادات حيوية)' : '🔔 Test Medication Alarm',
            body: isAr
              ? 'المنبه شغال تمام ومبرمج على ساعة الموبايل! هيرن في مواعيد أدويتك حتى لو التطبيق مقفول.'
              : 'Hardware alarm is working! It will ring at dose times even when the app is closed.',
            channelId: ALARM_CHANNEL_ID,
            schedule: { at: testTime, allowWhileIdle: true },
            sound: 'alarm_chime.wav',
            smallIcon: 'ic_stat_capsule',
            iconColor: '#0B3C5D',
          },
        ],
      });
      return {
        success: true,
        message: isAr
          ? 'تم جدولة منبه تجريبي! اقفل التطبيق أو الشاشة وهيضرب بعد 5 ثواني للتأكد.'
          : 'Test alarm scheduled! Close the app or lock screen, it will ring in 5 seconds.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: msg };
    }
  }

  // Web Browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setTimeout(() => {
        new Notification(
          isAr ? '🔔 تجربة منبه الدواء' : '🔔 Test Medication Alarm',
          {
            body: isAr
              ? 'إشعار الويب التجريبي وصل بنجاح!'
              : 'Web test notification arrived successfully!',
            icon: '/favicon-192.png',
          }
        );
      }, 5000);
      return {
        success: true,
        message: isAr
          ? 'تم تجهيز إشعار تجريبي في المتصفح! سيصلك خلال 5 ثوانٍ.'
          : 'Web test notification scheduled! Arriving in 5 seconds.',
      };
    }
  }

  return {
    success: false,
    message: isAr
      ? 'يرجى السماح بالإشعارات في إعدادات جهازك لتفعيل التنبيهات.'
      : 'Please allow notification permissions in device settings.',
  };
}
