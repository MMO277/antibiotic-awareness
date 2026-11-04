import React, { useEffect, useState } from 'react';
import { useLang } from './i18n';
import { tr } from './types';
import { scheduleSingleNativeDoseAlarm, triggerTestAlarm } from './nativeAlarmService';

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
      notificationsEnabled: false,
    };
  });

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

  // Live countdown clock to nextDoseTime + auto-chime if app is open at 00:00:00
  useEffect(() => {
    let lastTriggeredMin = '';
    const updateTimer = () => {
      const now = new Date();
      const [hh, mm] = (state.nextDoseTime || '08:00').split(':').map((n) => parseInt(n, 10) || 0);
      const target = new Date();
      target.setHours(hh, mm, 0, 0);

      // Check if current minute matches target HH:MM:00 while app is open
      const nowKey = `${now.getHours()}:${now.getMinutes()}`;
      if (now.getHours() === hh && now.getMinutes() === mm && now.getSeconds() <= 2 && lastTriggeredMin !== nowKey) {
        lastTriggeredMin = nowKey;
        playChimeAndSpeak();
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
  }, [state.nextDoseTime, state.medicineName]);

  const playChimeAndSpeak = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
          gain.gain.setValueAtTime(0.16, ctx.currentTime + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.14);
          osc.stop(ctx.currentTime + idx * 0.14 + 0.36);
        });
      }
    } catch {
      /* ignore audio restriction */
    }

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

  const enableBrowserNotifications = async () => {
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

  const handleTestBackgroundAlarm = async () => {
    const res = await triggerTestAlarm(isAr);
    setState((prev) => ({ ...prev, notificationsEnabled: true }));
    setStatusBanner(res.message);
  };

  const handleDoseTaken = () => {
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
        `⏰ تم تأجيل المنبه 15 دقيقة وضبطه ليرن في تمام ${newTime} حتى لو التطبيق مقفول`,
        `⏰ Alarm snoozed by 15 minutes and scheduled for ${newTime}`
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
        {/* Left Card: Mobile Smart Dose Alarm & Voice Player */}
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
                🔔 {tr(lang, 'منبه الجرعات الذكي (يعمل والتطبيق مقفول)', 'LIVE SMART DOSE ALARM')}
              </span>
              <h3 style={{ margin: '6px 0 0', color: '#fff', fontSize: '1.25rem' }}>
                {tr(lang, 'العد التنازلي للجرعة القادمة', 'Next Dose Countdown')}
              </h3>
            </div>
            <button
              type="button"
              onClick={enableBrowserNotifications}
              title={tr(lang, 'ضبط وتفعيل منبه الموبايل', 'Enable Hardware Alarm')}
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
                ? tr(lang, '🔔 المنبه مفعّل', '🔔 Alarm ON')
                : tr(lang, '🔕 تفعيل المنبه الآن', '🔕 Enable Alarm')}
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
                {tr(lang, 'الدواء وموعد الجرعة:', 'Medication & Alarm Time:')}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="small" style={{ color: '#cbd5e1' }}>
                  {tr(lang, 'تغيير الساعة:', 'Set Time:')}
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
              </div>
            </div>
          </div>

          {/* Voice Reminder Waveform Player + Background Alarm Test */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.75)',
              borderRadius: '14px',
              padding: '12px 14px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e2e8f0' }}>
                🎙️ {tr(lang, 'التذكير الصوتي ومنبه الخلفية', 'Voice & Background Alarm')}
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={playChimeAndSpeak}
                  style={{
                    background: isSpeaking ? '#f59e0b' : '#14b8a6',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '99px',
                    padding: '5px 12px',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {isSpeaking
                    ? tr(lang, '🔊 يتحدث الآن...', '🔊 Speaking...')
                    : tr(lang, '▶ سماع الصوت الآن', '▶ Play Voice')}
                </button>
                <button
                  type="button"
                  onClick={handleTestBackgroundAlarm}
                  style={{
                    background: '#f59e0b',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '99px',
                    padding: '5px 12px',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {tr(lang, '🔔 تجربة رنين والتطبيق مقفول (5 ث)', '🔔 Test Closed-App Alarm (5s)')}
                </button>
              </div>
            </div>

            {/* Animated Waveform Bars */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                height: '26px',
                padding: '4px 8px',
                background: '#0f172a',
                borderRadius: '8px',
              }}
            >
              {[8, 14, 20, 12, 24, 18, 10, 22, 26, 16, 12, 20, 14, 22, 18, 10, 16, 24, 14, 8, 18, 12, 16, 10].map(
                (h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: isSpeaking ? `${Math.max(6, (h + (i * 7) % 14))}px` : `${Math.round(h * 0.6)}px`,
                      background: i < 14 ? '#14b8a6' : '#475569',
                      borderRadius: '99px',
                      transition: 'height 0.15s ease',
                    }}
                  />
                )
              )}
            </div>
            <div className="small" style={{ color: '#94a3b8', marginTop: '6px' }}>
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
              🕓 {tr(lang, 'تأجيل 15 د', 'Snooze 15m')}
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
