import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from './i18n';
import { tr } from './types';
import {
  ActivePhoneAlarmPayload,
  AlarmPreferences,
  AlarmRingtoneId,
  confirmDoseTakenFromAlarm,
  loadAlarmPreferences,
  onAlarmDoseConfirmed,
  openNativeSystemClockAlarm,
  previewAlarmRingtone,
  saveAlarmPreferences,
  scheduleSingleNativeDoseAlarm,
  snoozeActivePhoneAlarm,
  startGlobalPhoneAlarmWatcher,
  stopContinuousPhoneAlarm,
  subscribeToActivePhoneAlarm,
  triggerTestAlarm,
} from './nativeAlarmService';

interface SmartDoseAlarmCardProps {
  medicineName?: string;
  doseInstruction?: string;
  nextDoseTime?: string;
  totalDays?: number;
}

const ALARM_STORAGE_KEY = 'aa_smart_dose_alarm_v1';

interface StoredAlarmState {
  medicineName: string;
  doseInstruction: string;
  nextDoseTime: string;
  completedDays: boolean[];
  notificationsEnabled: boolean;
}

const RINGTONE_OPTIONS: { id: AlarmRingtoneId; labelAr: string; labelEn: string }[] = [
  {
    id: 'classic_phone',
    labelAr: '🚨 منبه الموبايل الكلاسيكي العالي (Classic Phone Alarm)',
    labelEn: '🚨 Classic Loud Smartphone Alarm',
  },
  {
    id: 'medical_intensive',
    labelAr: '🏥 جرس الطوارئ الطبي المكثف (Medical ICU Beep)',
    labelEn: '🏥 Intensive Medical ICU Alarm',
  },
  {
    id: 'bell_chime',
    labelAr: '🔔 رنين جرس الساعة الرنان (Twin-Bell Clock)',
    labelEn: '🔔 Resonant Twin-Bell Alarm Clock',
  },
  {
    id: 'crescendo_melody',
    labelAr: '🎵 نغمة تصاعدية ذكية (Crescendo Melody)',
    labelEn: '🎵 Escalating Crescendo Melody',
  },
];

/**
 * Global Full-Screen Incoming Phone Alarm Clock Overlay.
 * Mounted globally in Layout.tsx so it pops up over ANY screen in the app when an alarm time arrives.
 */
export function GlobalPhoneAlarmOverlay() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [activeAlarm, setActiveAlarm] = useState<ActivePhoneAlarmPayload | null>(null);
  const [nowClock, setNowClock] = useState<Date>(() => new Date());
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    startGlobalPhoneAlarmWatcher(() => lang === 'ar');
  }, [lang]);

  useEffect(() => {
    const unsub = subscribeToActivePhoneAlarm((alarm) => {
      setActiveAlarm(alarm);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!activeAlarm) return;
    const id = window.setInterval(() => {
      setNowClock(new Date());
      setPulseTick((t) => (t + 1) % 24);
    }, 350);
    return () => window.clearInterval(id);
  }, [activeAlarm]);

  if (!activeAlarm || typeof document === 'undefined') return null;

  const h24 = nowClock.getHours();
  const mStr = String(nowClock.getMinutes()).padStart(2, '0');
  const sStr = String(nowClock.getSeconds()).padStart(2, '0');
  const h12 = String(h24 % 12 === 0 ? 12 : h24 % 12).padStart(2, '0');
  const periodLabel = isAr ? (h24 < 12 ? 'صباحاً' : 'مساءً') : h24 < 12 ? 'AM' : 'PM';

  const handleConfirmDoseAndStop = () => {
    // Also mark scheduled dose as taken in localStorage if linked to a schedule
    if (activeAlarm.scheduleId && activeAlarm.doseId) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith('antibiotic_treatment_tracker_schedules')) continue;
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const list = JSON.parse(raw);
          if (!Array.isArray(list)) continue;
          let changed = false;
          const nowIso = new Date().toISOString();
          const updated = list.map((sch) => {
            if (sch.id !== activeAlarm.scheduleId || !Array.isArray(sch.doses)) return sch;
            return {
              ...sch,
              updatedAt: nowIso,
              doses: sch.doses.map((d: { id: string; status: string }) => {
                if (d.id !== activeAlarm.doseId) return d;
                changed = true;
                return {
                  ...d,
                  status: 'taken',
                  takenAt: nowIso,
                  statusUpdatedAt: nowIso,
                  documentedOutcome: 'taken_on_time',
                };
              }),
            };
          });
          if (changed) {
            localStorage.setItem(k, JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch {
        /* ignore */
      }
    }
    confirmDoseTakenFromAlarm();
  };

  const handleSnooze = async (mins: number) => {
    const newTime = await snoozeActivePhoneAlarm(mins);
    try {
      const raw = localStorage.getItem(ALARM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.nextDoseTime = newTime;
        parsed.notificationsEnabled = true;
        localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      /* ignore */
    }
  };

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={activeAlarm.title}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background:
          'radial-gradient(circle at 50% 22%, rgba(20, 184, 166, 0.35) 0%, rgba(15, 23, 42, 0.97) 55%, #020617 100%)',
        backdropFilter: 'blur(16px)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 20px 32px',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Status Pill */}
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '480px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.22)',
            border: '1.5px solid #f87171',
            color: '#fecaca',
            padding: '6px 16px',
            borderRadius: '999px',
            fontWeight: 900,
            fontSize: '0.86rem',
            letterSpacing: '0.4px',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.4)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 10px #ef4444',
            }}
          />
          {tr(lang, 'منبه الدواء يرن الآن • رنين متواصل', 'PHONE DOSE ALARM RINGING')}
        </div>
      </div>

      {/* Center Clock + Shaking Bell + Medication Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '480px',
          gap: '18px',
          margin: '12px 0',
        }}
      >
        {/* Pulsing Phone Alarm Bell Circle */}
        <div
          style={{
            width: '116px',
            height: '116px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.35) 0%, rgba(15, 23, 42, 0.9) 75%)',
            border: '3px solid #2dd4bf',
            boxShadow:
              pulseTick % 2 === 0
                ? '0 0 0 14px rgba(45, 212, 191, 0.18), 0 0 45px rgba(20, 184, 166, 0.7)'
                : '0 0 0 4px rgba(45, 212, 191, 0.08), 0 0 20px rgba(20, 184, 166, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3.4rem',
            transform: pulseTick % 2 === 0 ? 'rotate(-10deg) scale(1.06)' : 'rotate(10deg) scale(0.98)',
            transition: 'all 0.28s ease-in-out',
          }}
        >
          ⏰
        </div>

        {/* Big Phone Clock Display */}
        <div style={{ textAlign: 'center', direction: 'ltr' }}>
          <div
            style={{
              fontSize: 'clamp(3.2rem, 11vw, 4.6rem)',
              fontWeight: 900,
              lineHeight: 1,
              color: '#ffffff',
              textShadow: '0 4px 28px rgba(45, 212, 191, 0.45)',
              letterSpacing: '2px',
            }}
          >
            {h12}:{mStr}
            <span style={{ fontSize: '1.35rem', color: '#5eead4', marginLeft: '6px', fontWeight: 800 }}>
              :{sStr}
            </span>
          </div>
          <div style={{ fontSize: '1.05rem', color: '#94a3b8', fontWeight: 700, marginTop: '6px' }}>
            {periodLabel} • {tr(lang, `موعد الجرعة المجدول: ${activeAlarm.timeHHMM}`, `Scheduled Dose: ${activeAlarm.timeHHMM}`)}
          </div>
        </div>

        {/* Medication Details Box */}
        <div
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.88)',
            border: '2px solid rgba(45, 212, 191, 0.5)',
            borderRadius: '22px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#5eead4', fontWeight: 800, marginBottom: '6px' }}>
            💊 {tr(lang, 'حان الآن موعد جرعة المضاد الحيوي:', 'TIME FOR YOUR ANTIBIOTIC DOSE:')}
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.55rem', color: '#ffffff', fontWeight: 900 }}>
            {activeAlarm.medicineName}
          </h2>
          <p
            style={{
              margin: '0 0 14px',
              fontSize: '1rem',
              color: '#cbd5e1',
              lineHeight: 1.5,
              background: 'rgba(30, 41, 59, 0.7)',
              padding: '10px 14px',
              borderRadius: '12px',
            }}
          >
            {activeAlarm.doseInstruction}
          </p>

          {/* Animated Sound Wave Visualizer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              height: '28px',
            }}
          >
            {[10, 22, 14, 26, 18, 28, 12, 24, 20, 14, 26, 16, 22, 12, 24, 18, 10, 20].map((baseH, idx) => {
              const dynamicH = ((baseH + ((pulseTick * 5 + idx * 7) % 16)) % 26) + 6;
              return (
                <div
                  key={idx}
                  style={{
                    width: '5px',
                    height: `${dynamicH}px`,
                    background: idx % 2 === 0 ? '#2dd4bf' : '#f59e0b',
                    borderRadius: '99px',
                    transition: 'height 0.2s ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Phone Alarm Action Controls */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Big Green "Dose Taken & Stop Alarm" Button */}
        <button
          type="button"
          onClick={handleConfirmDoseAndStop}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #0d9488 100%)',
            color: '#ffffff',
            border: '2px solid #6ee7b7',
            borderRadius: '999px',
            padding: '16px 22px',
            fontSize: '1.12rem',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <span>✅</span>
          <span>
            {tr(
              lang,
              'تم أخذ الجرعة — إيقاف المنبه الآن',
              'Dose Taken — Stop Alarm Now'
            )}
          </span>
        </button>

        {/* Snooze Options Row (5m / 10m / 15m) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[5, 10, 15].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleSnooze(mins)}
              style={{
                background: 'rgba(30, 41, 59, 0.9)',
                color: '#fde68a',
                border: '1.5px solid rgba(245, 158, 11, 0.55)',
                borderRadius: '14px',
                padding: '11px 8px',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              💤 {tr(lang, `غفوة ${mins} د`, `Snooze ${mins}m`)}
            </button>
          ))}
        </div>

        {/* Dismiss Ringing Without Logging Dose */}
        <button
          type="button"
          onClick={() => stopContinuousPhoneAlarm()}
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.16)',
            color: '#fca5a5',
            border: '1px solid rgba(248, 113, 113, 0.45)',
            borderRadius: '14px',
            padding: '10px',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          🔕 {tr(lang, 'إيقاف صوت المنبه فقط', 'Stop Ringing Only (Dismiss)')}
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function SmartDoseAlarmCard({
  medicineName: propMedName,
  doseInstruction: propInstruction,
  nextDoseTime: propNextTime,
  totalDays = 7,
}: SmartDoseAlarmCardProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [state, setState] = useState<StoredAlarmState>(() => {
    try {
      const raw = localStorage.getItem(ALARM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.completedDays)) return parsed;
      }
    } catch {
      /* ignore */
    }
    return {
      medicineName: propMedName || (isAr ? 'أوجمنتين 1 جم (Augmentin 1g)' : 'Augmentin 1g (Amoxiclav)'),
      doseInstruction:
        propInstruction ||
        (isAr
          ? 'تؤخذ الجرعة بعد وجبة الطعام مع كوب ماء كامل'
          : 'Take after a meal with a full glass of water'),
      nextDoseTime: propNextTime || '08:00',
      completedDays: [true, true, true, true, true, false, false],
      notificationsEnabled: true,
    };
  });

  const [prefs, setPrefs] = useState<AlarmPreferences>(() => loadAlarmPreferences());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [countdownText, setCountdownText] = useState('02:14:35');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    if (propMedName) {
      setState((prev) => ({ ...prev, medicineName: propMedName }));
    }
  }, [propMedName]);

  useEffect(() => {
    try {
      localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Listen for dose confirmation from the Full-Screen Phone Alarm Modal
  useEffect(() => {
    return onAlarmDoseConfirmed(() => {
      setState((prev) => {
        const nextDays = [...prev.completedDays];
        const firstUnchecked = nextDays.findIndex((d) => !d);
        if (firstUnchecked !== -1) {
          nextDays[firstUnchecked] = true;
        }
        return { ...prev, completedDays: nextDays };
      });
      setStatusBanner(
        tr(
          lang,
          '✅ تم إيقاف المنبه وتسجيل أخذ الجرعة بنجاح في شريط الالتزام!',
          '✅ Alarm stopped and dose logged in your completion streak!'
        )
      );
    });
  }, [lang]);

  // Live countdown clock to nextDoseTime + launches Full-Screen Phone Alarm at 00:00:00
  useEffect(() => {
    let lastTriggeredMin = '';
    const updateTimer = () => {
      const now = new Date();
      const [hh, mm] = (state.nextDoseTime || '08:00').split(':').map((n) => parseInt(n, 10) || 0);
      const target = new Date();
      target.setHours(hh, mm, 0, 0);

      // Launch full-screen continuous phone alarm if current minute matches target HH:MM:00
      const nowKey = `${now.getHours()}:${now.getMinutes()}`;
      if (now.getHours() === hh && now.getMinutes() === mm && now.getSeconds() <= 2 && lastTriggeredMin !== nowKey) {
        lastTriggeredMin = nowKey;
        void triggerTestAlarm(isAr, {
          immediate: true,
          medicineName: state.medicineName,
          doseInstruction: state.doseInstruction,
          timeHHMM: state.nextDoseTime,
        });
      }

      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const diffSec = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const s = String(diffSec % 60).padStart(2, '0');
      setCountdownText(`${h}:${m}:${s}`);
    };
    updateTimer();
    const id = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nextDoseTime, state.medicineName, state.doseInstruction, isAr]);

  const playChimeAndSpeak = () => {
    previewAlarmRingtone(prefs.ringtoneId);

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(
          isAr
            ? `تنبيه من منصة الوعي بالمضادات الحيوية: حان الآن موعد جرعة ${state.medicineName}. ${state.doseInstruction}. إكمال الكورس يحميك من البكتيريا المقاومة.`
            : `Antibiotic Awareness Reminder: It is time for your ${state.medicineName} dose. ${state.doseInstruction}. Completing your full course prevents bacterial resistance.`
        );
        msg.lang = isAr ? 'ar-EG' : 'en-US';
        msg.rate = 0.95;
        msg.onstart = () => setIsSpeaking(true);
        msg.onend = () => setIsSpeaking(false);
        msg.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(msg);
      } catch {
        setIsSpeaking(false);
      }
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  const enablePhoneAlarmNow = async () => {
    const res = await scheduleSingleNativeDoseAlarm(
      state.medicineName,
      state.doseInstruction,
      state.nextDoseTime,
      isAr
    );
    setState((prev) => ({ ...prev, notificationsEnabled: true }));
    setStatusBanner(res.message);
  };

  const handleTimeChange = async (newTime: string) => {
    setState((prev) => ({ ...prev, nextDoseTime: newTime, notificationsEnabled: true }));
    const res = await scheduleSingleNativeDoseAlarm(
      state.medicineName,
      state.doseInstruction,
      newTime,
      isAr
    );
    setStatusBanner(res.message);
  };

  const handleRingtoneChange = (newTone: AlarmRingtoneId) => {
    const updated = saveAlarmPreferences({ ringtoneId: newTone });
    setPrefs(updated);
    previewAlarmRingtone(newTone);
  };

  const handleTogglePref = (key: 'voiceReadoutEnabled' | 'vibrationEnabled') => {
    const updated = saveAlarmPreferences({ [key]: !prefs[key] });
    setPrefs(updated);
  };

  const handleLaunchImmediatePhoneAlarm = async () => {
    const res = await triggerTestAlarm(isAr, {
      immediate: true,
      medicineName: state.medicineName,
      doseInstruction: state.doseInstruction,
      timeHHMM: state.nextDoseTime,
    });
    setState((prev) => ({ ...prev, notificationsEnabled: true }));
    setStatusBanner(res.message);
  };

  const handleTestClosedAppAlarm = async () => {
    const res = await triggerTestAlarm(isAr, {
      immediate: false,
      medicineName: state.medicineName,
      doseInstruction: state.doseInstruction,
      timeHHMM: state.nextDoseTime,
    });
    setState((prev) => ({ ...prev, notificationsEnabled: true }));
    setStatusBanner(res.message);
  };

  const handleOpenSystemClockApp = () => {
    const res = openNativeSystemClockAlarm(
      state.medicineName,
      state.doseInstruction,
      state.nextDoseTime,
      isAr
    );
    setState((prev) => ({ ...prev, notificationsEnabled: true }));
    setStatusBanner(res.message);
  };

  const handleDoseTaken = () => {
    stopContinuousPhoneAlarm();
    setState((prev) => {
      const nextDays = [...prev.completedDays];
      const firstUnchecked = nextDays.findIndex((d) => !d);
      if (firstUnchecked !== -1) {
        nextDays[firstUnchecked] = true;
      }
      return { ...prev, completedDays: nextDays };
    });
    setStatusBanner(
      tr(
        lang,
        '✅ أحسنت! تم تسجيل الجرعة وتحديث شريط الالتزام بالكورس العلاجي.',
        '✅ Great job! Dose logged and your 7-day completion streak is updated.'
      )
    );
  };

  const handleSnooze15 = async () => {
    stopContinuousPhoneAlarm();
    const [hh, mm] = (state.nextDoseTime || '08:00').split(':').map((n) => parseInt(n, 10) || 0);
    const totalMin = (hh * 60 + mm + 15) % (24 * 60);
    const nh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const nm = String(totalMin % 60).padStart(2, '0');
    const newTime = `${nh}:${nm}`;
    setState((prev) => ({ ...prev, nextDoseTime: newTime, notificationsEnabled: true }));
    await scheduleSingleNativeDoseAlarm(state.medicineName, state.doseInstruction, newTime, isAr);
    setStatusBanner(
      tr(
        lang,
        `⏰ تم تأجيل المنبه (غفوة 15 دقيقة) وضبطه ليرن في تمام ${newTime} حتى لو الشاشة مقفولة`,
        `⏰ Alarm snoozed by 15 minutes and scheduled to ring at ${newTime}`
      )
    );
  };

  const toggleDay = (idx: number) => {
    setState((prev) => {
      const nextDays = [...prev.completedDays];
      nextDays[idx] = !nextDays[idx];
      return { ...prev, completedDays: nextDays };
    });
  };

  const completedCount = state.completedDays.filter(Boolean).length;
  const pct = Math.round((completedCount / Math.max(1, totalDays)) * 100);

  const dayLabelsAr = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
  const dayLabelsEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <section
      className="card"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: 'linear-gradient(135deg, #0b192c 0%, #0f293a 55%, #0f172a 100%)',
        color: '#f8fafc',
        borderRadius: '22px',
        padding: '24px',
        border: '1.5px solid rgba(20, 184, 166, 0.45)',
        boxShadow: '0 20px 45px rgba(15, 23, 42, 0.3)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        {/* Left Card: Mobile Phone-Style Dose Alarm Clock */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1.5px solid rgba(45, 212, 191, 0.35)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span
                style={{
                  background: 'rgba(20, 184, 166, 0.2)',
                  color: '#5eead4',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                }}
              >
                ⏰ {tr(lang, 'منبه موبايل حقيقي بشاشة رنين كاملة وغفوة', 'FULL-SCREEN PHONE ALARM CLOCK')}
              </span>
              <h3 style={{ margin: '6px 0 0', color: '#fff', fontSize: '1.25rem' }}>
                {tr(lang, 'منبه الجرعة القادم (مثل منبه الهاتف)', 'Next Dose Phone Alarm')}
              </h3>
            </div>
            <button
              type="button"
              onClick={enablePhoneAlarmNow}
              title={tr(lang, 'تفعيل منبه الموبايل المستمر', 'Arm Continuous Phone Alarm')}
              style={{
                background: state.notificationsEnabled ? '#0d9488' : '#1e293b',
                color: '#fff',
                border: '1px solid #2dd4bf',
                borderRadius: '12px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.8rem',
              }}
            >
              {state.notificationsEnabled
                ? tr(lang, '⏰ المنبه مفعّل', '⏰ Phone Alarm ON')
                : tr(lang, '🔕 تفعيل المنبه الآن', '🔕 Arm Alarm')}
            </button>
          </div>

          {/* Glowing Circular Ring + Drug Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              background: 'rgba(30, 41, 59, 0.65)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '108px',
                height: '108px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(20,184,166,0.28) 0%, rgba(15,23,42,0.95) 75%)',
                border: '4px solid #14b8a6',
                boxShadow: '0 0 24px rgba(20, 184, 166, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', direction: 'ltr' }}>
                {state.nextDoseTime}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#5eead4', fontWeight: 800, direction: 'ltr' }}>
                -{countdownText}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '160px' }}>
              <label className="small" style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {tr(lang, 'الدواء وموعد رنين المنبه:', 'Medication & Alarm Time:')}
              </label>
              <input
                type="text"
                value={state.medicineName}
                onChange={(e) => setState((prev) => ({ ...prev, medicineName: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  marginBottom: '6px',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="small" style={{ color: '#cbd5e1' }}>
                  {tr(lang, 'ضبط الساعة:', 'Alarm Time:')}
                </span>
                <input
                  type="time"
                  value={state.nextDoseTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  style={{
                    background: '#0f172a',
                    color: '#5eead4',
                    border: '1px solid #14b8a6',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontWeight: 800,
                  }}
                />
                <button
                  type="button"
                  onClick={handleOpenSystemClockApp}
                  style={{
                    background: 'rgba(56, 189, 248, 0.16)',
                    color: '#7dd3fc',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    borderRadius: '8px',
                    padding: '4px 9px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                  title={tr(
                    lang,
                    'إضافة الموعد مباشرة في تطبيق الساعة/المنبه الأصلي للهاتف',
                    'Set directly in your phone native Clock app'
                  )}
                >
                  📱 {tr(lang, 'ضبط في ساعة الهاتف', 'Set in Phone Clock')}
                </button>
              </div>
            </div>
          </div>

          {/* Phone Ringtone Selector + Voice & Vibration Settings */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.75)',
              borderRadius: '14px',
              padding: '12px 14px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#e2e8f0' }}>
                🎵 {tr(lang, 'نغمة رنين المنبه وإعدادات الصوت:', 'Phone Alarm Ringtone & Sound:')}
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.76rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#cbd5e1' }}>
                  <input
                    type="checkbox"
                    checked={prefs.voiceReadoutEnabled}
                    onChange={() => handleTogglePref('voiceReadoutEnabled')}
                  />
                  {tr(lang, 'نطق اسم الدواء', 'Voice Readout')}
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#cbd5e1' }}>
                  <input
                    type="checkbox"
                    checked={prefs.vibrationEnabled}
                    onChange={() => handleTogglePref('vibrationEnabled')}
                  />
                  {tr(lang, 'اهتزاز متواصل', 'Vibration')}
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={prefs.ringtoneId}
                onChange={(e) => handleRingtoneChange(e.target.value as AlarmRingtoneId)}
                style={{
                  flex: 1,
                  minWidth: '180px',
                  background: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                {RINGTONE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isAr ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={playChimeAndSpeak}
                style={{
                  background: isSpeaking ? '#f59e0b' : '#14b8a6',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {isSpeaking
                  ? tr(lang, '🔊 يتحدث...', '🔊 Speaking...')
                  : tr(lang, '▶ سماع النغمة والصوت', '▶ Preview Tone')}
              </button>
            </div>

            {/* Test Full-Screen Phone Alarm Now vs In 5 Seconds */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <button
                type="button"
                onClick={handleLaunchImmediatePhoneAlarm}
                style={{
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(239, 68, 68, 0.3)',
                }}
              >
                🚨 {tr(lang, 'تجربة شاشة منبه الموبايل الآن', 'Launch Phone Alarm Screen Now')}
              </button>
              <button
                type="button"
                onClick={handleTestClosedAppAlarm}
                style={{
                  background: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                🔒 {tr(lang, 'تجربة الرنين والشاشة مقفولة (5 ث)', 'Test Locked-Screen Alarm (5s)')}
              </button>
            </div>

            <div className="small" style={{ color: '#94a3b8' }}>
              “{state.doseInstruction}”
            </div>
          </div>

          {/* Action Buttons: Dose Taken & Snooze 15 min */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDoseTaken}
              style={{
                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              ✓ {tr(lang, 'تم أخذ الجرعة (Dose Taken)', 'Dose Taken')}
            </button>
            <button
              type="button"
              onClick={handleSnooze15}
              style={{
                background: 'transparent',
                color: '#e2e8f0',
                border: '1.5px solid #475569',
                borderRadius: '14px',
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              💤 {tr(lang, 'غفوة 15 د', 'Snooze 15m')}
            </button>
          </div>
        </div>

        {/* Right Card: 7-Day Antibiotic Course Completion Streak */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1.5px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.16)',
                  color: '#38bdf8',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                }}
              >
                🛡️ {tr(lang, 'حماية من انتكاس العدوى', '7-DAY COURSE STREAK')}
              </span>
              <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.85rem' }}>
                ● {tr(lang, 'كورس نشط', 'Active Course')}
              </span>
            </div>
            <h3 style={{ margin: '8px 0 4px', color: '#fff', fontSize: '1.3rem' }}>
              {tr(lang, 'مؤشر إتمام كورس المضاد الحيوي (7 أيام)', '7-Day Antibiotic Course Progress')}
            </h3>
            <p className="small" style={{ margin: 0, color: '#94a3b8' }}>
              {tr(
                lang,
                'اضغط على أيام الكورس لتسجيل تقدمك؛ التوقف عند اليوم الثالث يترك البكتيريا الأقوى حية لتتحور!',
                'Tap any day to toggle completion. Stopping early leaves resistant bacterial subpopulations alive.'
              )}
            </p>
          </div>

          {/* Big Glowing Percentage Progress Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1.5px solid rgba(20, 184, 166, 0.45)',
              borderRadius: '16px',
              padding: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#e2e8f0' }}>
                {tr(lang, 'نسبة الالتزام بالكورس العلاجي', 'Antibiotic Course Completion Streak')}
              </span>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2dd4bf' }}>{pct}%</span>
            </div>
            <div
              style={{
                height: '20px',
                background: '#0f172a',
                borderRadius: '99px',
                padding: '3px',
                border: '1px solid #334155',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0d9488 0%, #2dd4bf 100%)',
                  borderRadius: '99px',
                  boxShadow: '0 0 16px rgba(45, 212, 191, 0.6)',
                  transition: 'width 0.35s ease',
                }}
              />
            </div>
          </div>

          {/* 7-Day Checkboxes Grid */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '16px',
              padding: '14px',
              border: '1px solid rgba(148, 163, 184, 0.16)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.82rem' }}>
              <b style={{ color: '#e2e8f0' }}>
                ☑ {tr(lang, `الأيام المكتملة (${completedCount} من 7 أيام)`, `Completed (${completedCount} of 7 days)`)}
              </b>
              <span style={{ color: '#94a3b8' }}>
                {tr(lang, `متبقي ${7 - completedCount} أيام`, `${7 - completedCount} days remaining`)}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
              {state.completedDays.slice(0, 7).map((done, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  style={{
                    background: done ? '#0d9488' : '#1e293b',
                    color: done ? '#fff' : '#64748b',
                    border: done ? '1.5px solid #5eead4' : '1px solid #334155',
                    borderRadius: '12px',
                    padding: '10px 4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: done ? '#ccfbf1' : '#94a3b8' }}>
                    {isAr ? dayLabelsAr[idx] : dayLabelsEn[idx]}
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>{done ? '✓' : '○'}</span>
                </button>
              ))}
            </div>
          </div>

          {statusBanner && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid #34d399',
                color: '#d1fae5',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              {statusBanner}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
