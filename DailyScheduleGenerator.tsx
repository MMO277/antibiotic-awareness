import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import Disclaimer from './Disclaimer';

interface ScheduleRow {
  id: string;
  name: string;
  dose: string;
  intervalHours: 6 | 8 | 12 | 24;
  mealRule: 'before_meal' | 'with_meal' | 'after_meal' | 'anytime';
  days: number;
}

function addHoursToTime(baseHHMM: string, addH: number): { hhmm: string; label12: string; periodIcon: string; periodAr: string; periodEn: string } {
  const [hStr, mStr] = (baseHHMM || '08:00').split(':');
  const baseH = parseInt(hStr, 10) || 8;
  const baseM = parseInt(mStr, 10) || 0;
  const totalH = (baseH + addH) % 24;
  const hh = String(totalH).padStart(2, '0');
  const mm = String(baseM).padStart(2, '0');
  const h12 = totalH % 12 === 0 ? 12 : totalH % 12;
  const ampmEn = totalH < 12 ? 'AM' : 'PM';
  const periodIcon = totalH >= 5 && totalH < 12 ? '🌅' : totalH >= 12 && totalH < 17 ? '☀️' : totalH >= 17 && totalH < 21 ? '🌇' : '🌙';
  const periodAr = totalH < 12 ? 'صباحاً' : 'مساءً';
  return {
    hhmm: `${hh}:${mm}`,
    label12: `${h12}:${mm} ${ampmEn}`,
    periodIcon,
    periodAr,
    periodEn: ampmEn,
  };
}

export default function DailyScheduleGenerator() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [sp] = useSearchParams();
  const initialMed = sp.get('med') || '';

  const [patientName, setPatientName] = useState('');
  const [wakeTime, setWakeTime] = useState('08:00');
  const [rows, setRows] = useState<ScheduleRow[]>(() => [
    {
      id: 'row-1',
      name: initialMed || (isAr ? 'أوجمنتين 1 جم (أقراص)' : 'Augmentin 1g Tablets'),
      dose: isAr ? 'قرص واحد' : '1 Tablet',
      intervalHours: 12,
      mealRule: 'with_meal',
      days: 7,
    },
  ]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        name: '',
        dose: isAr ? 'قرص واحد' : '1 Tablet',
        intervalHours: 8,
        mealRule: 'after_meal',
        days: 5,
      },
    ]);
  };

  const updateRow = (id: string, patch: Partial<ScheduleRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const mealLabel = (rule: ScheduleRow['mealRule']) => {
    if (rule === 'before_meal') return tr(lang, 'قبل الأكل بساعة (على معدة فارغة)', '1 hour before meals (empty stomach)');
    if (rule === 'with_meal') return tr(lang, 'في بداية الوجبة (مع الأكل)', 'At the start of a meal (with food)');
    if (rule === 'after_meal') return tr(lang, 'بعد الأكل مع كوب ماء كامل', 'After meals with a full glass of water');
    return tr(lang, 'في الموعد المحدد (مع أو بدون طعام)', 'At scheduled time (with or without food)');
  };

  const computedRows = useMemo(() => {
    return rows.map((r) => {
      const count = Math.floor(24 / r.intervalHours);
      const slots = Array.from({ length: count }, (_, i) => addHoursToTime(wakeTime, i * r.intervalHours));
      return { ...r, slots };
    });
  }, [rows, wakeTime]);

  const shareWhatsApp = () => {
    const lines: string[] = [
      `📅 *${tr(lang, 'جدول مواعيد الجرعات اليومي', 'Daily Medication Schedule')}*${patientName.trim() ? ` (${patientName.trim()})` : ''}`,
      '',
    ];
    computedRows.forEach((r, idx) => {
      const medTitle = r.name.trim() || tr(lang, `الدواء ${idx + 1}`, `Medicine ${idx + 1}`);
      const timesStr = r.slots.map((s) => s.label12).join(' | ');
      lines.push(
        `💊 *${medTitle}* (${r.dose}) — ${tr(lang, `كل ${r.intervalHours} ساعات`, `Every ${r.intervalHours}h`)} (${r.days} ${tr(lang, 'أيام', 'days')})`
      );
      lines.push(`⏰ ${timesStr}`);
      lines.push(`🍽️ ${mealLabel(r.mealRule)}`);
      lines.push('');
    });
    lines.push(`✅ ${tr(lang, 'أكمل كورس المضاد الحيوي للنهاية كما وصفه الطبيب.', 'Complete the full prescribed antibiotic course.')}`);
    const url = `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadPngPoster = () => {
    const canvas = document.createElement('canvas');
    const W = 1080;
    const H = Math.max(640, 280 + computedRows.length * 175);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#082032';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#0e9aa7';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(
      tr(lang, '📅 جدول مواعيد جرعات المضاد الحيوي اليومي', '📅 Daily Antibiotic Dose Schedule'),
      54,
      82
    );

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(
      patientName.trim()
        ? `${tr(lang, 'المريض:', 'Patient:')} ${patientName.trim()}`
        : tr(lang, 'التزم بالمواعيد بالساعة وأكمل الكورس للنهاية', 'Follow exact hourly times and complete the full course'),
      54,
      120
    );

    let y = 160;
    computedRows.forEach((r, idx) => {
      ctx.fillStyle = '#0f3148';
      ctx.fillRect(48, y, W - 96, 145);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(48, y, W - 96, 145);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px system-ui, sans-serif';
      const title = r.name.trim() || `Medicine ${idx + 1}`;
      ctx.fillText(`💊 ${title} — ${r.dose} (q${r.intervalHours}h · ${r.days}d)`, 70, y + 42);

      ctx.fillStyle = '#67e8f9';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(`⏰ ${r.slots.map((s) => s.label12).join('   •   ')}`, 70, y + 84);

      ctx.fillStyle = '#fde68a';
      ctx.font = '20px system-ui, sans-serif';
      ctx.fillText(`🍽️ ${mealLabel(r.mealRule)}`, 70, y + 122);

      y += 165;
    });

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `dose-schedule-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <main className="wrap stack">
      <section className="card">
        <span className="badge approved" style={{ marginBottom: '8px' }}>
          📅 {tr(lang, 'منظم الجرعات اليومي الذكي • طباعة وصورة وواتساب', 'Smart Daily Dose Organizer • PNG, WhatsApp & Print')}
        </span>
        <h1 style={{ margin: '0 0 6px' }}>
          {tr(lang, 'مولّد جدول الجرعات اليومي للمريض والأسرة', 'Daily Dose Schedule Generator (PNG, WhatsApp & Print)')}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr(
            lang,
            'أدخل موعد استيقاظك وأدويتك ليحسب الموقع مواعيد الجرعات المتباعدة بالساعة مع تعليمات الطعام وعدد الأيام.',
            'Set your wake-up time and prescribed medicines to generate an evenly spaced 24-hour schedule ready to print, save as PNG, or share via WhatsApp.'
          )}
        </p>

        <div className="schedule-routine-bar">
          <div style={{ flex: '1 1 220px' }}>
            <label htmlFor="sched-patient-name">{tr(lang, 'اسم المريض (اختياري):', 'Patient Name (optional):')}</label>
            <input
              id="sched-patient-name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={tr(lang, 'مثال: أحمد محمد', 'e.g. Ahmed Mohamed')}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label htmlFor="sched-wake-time">🌅 {tr(lang, 'موعد أول جرعة صباحية:', 'First Morning Dose Time:')}</label>
            <input
              id="sched-wake-time"
              type="time"
              dir="ltr"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>
        </div>

        <div className="stack" style={{ marginTop: '14px' }}>
          {rows.map((r, idx) => (
            <div key={r.id} className="schedule-edit-row">
              <div className="schedule-row-field name-col">
                <label>{tr(lang, `اسم الدواء #${idx + 1}`, `Medicine #${idx + 1}`)}</label>
                <input
                  value={r.name}
                  onChange={(e) => updateRow(r.id, { name: e.target.value })}
                  placeholder={tr(lang, 'اسم المضاد الحيوي والتركيز', 'Antibiotic name & strength')}
                />
              </div>
              <div className="schedule-row-field dose-col">
                <label>{tr(lang, 'الجرعة', 'Dose')}</label>
                <input
                  value={r.dose}
                  onChange={(e) => updateRow(r.id, { dose: e.target.value })}
                  placeholder={tr(lang, 'قرص / 5 مل', '1 tab / 5 mL')}
                />
              </div>
              <div className="schedule-row-field interval-col">
                <label>{tr(lang, 'تكرار الجرعة', 'Interval')}</label>
                <select
                  value={r.intervalHours}
                  onChange={(e) => updateRow(r.id, { intervalHours: Number(e.target.value) as 6 | 8 | 12 | 24 })}
                >
                  <option value={24}>{tr(lang, 'كل 24 ساعة (مرة يومياً)', 'Every 24 hours (Once daily)')}</option>
                  <option value={12}>{tr(lang, 'كل 12 ساعة (مرتين يومياً)', 'Every 12 hours (Twice daily)')}</option>
                  <option value={8}>{tr(lang, 'كل 8 ساعات (3 مرات يومياً)', 'Every 8 hours (3 times daily)')}</option>
                  <option value={6}>{tr(lang, 'كل 6 ساعات (4 مرات يومياً)', 'Every 6 hours (4 times daily)')}</option>
                </select>
              </div>
              <div className="schedule-row-field meal-col">
                <label>{tr(lang, 'علاقة الدواء بالطعام', 'Meal Instruction')}</label>
                <select
                  value={r.mealRule}
                  onChange={(e) => updateRow(r.id, { mealRule: e.target.value as ScheduleRow['mealRule'] })}
                >
                  <option value="with_meal">{tr(lang, 'مع بداية الأكل', 'With meal')}</option>
                  <option value="after_meal">{tr(lang, 'بعد الأكل', 'After meal')}</option>
                  <option value="before_meal">{tr(lang, 'قبل الأكل بساعة', '1h before meal')}</option>
                  <option value="anytime">{tr(lang, 'مع أو بدون طعام', 'With or without food')}</option>
                </select>
              </div>
              <div className="schedule-row-field days-col">
                <label>{tr(lang, 'الأيام', 'Days')}</label>
                <input
                  type="number"
                  min={1}
                  max={21}
                  dir="ltr"
                  value={r.days}
                  onChange={(e) => updateRow(r.id, { days: Math.max(1, Math.min(21, Number(e.target.value) || 5)) })}
                />
              </div>
              {rows.length > 1 && (
                <button type="button" className="btn small danger" onClick={() => removeRow(r.id)}>
                  🗑️
                </button>
              )}
            </div>
          ))}

          <div>
            <button type="button" className="btn ghost small" onClick={addRow}>
              ➕ {tr(lang, 'إضافة دواء آخر للجدول', 'Add Another Medicine')}
            </button>
          </div>
        </div>
      </section>

      {/* Visual Schedule Poster */}
      <section className="card stack">
        <div className="schedule-poster-header">
          <div>
            <h2 style={{ margin: 0 }}>
              🗓️ {tr(lang, 'بطاقة مواعيد الجرعات اليومية الجاهزة', 'Printable Daily Dose Schedule Card')}
              {patientName.trim() ? ` — ${patientName.trim()}` : ''}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {tr(
                lang,
                'ضع علامة صح أمام كل يوم بعد إتمام جرعاته بالكامل دون انقطاع.',
                'Check off each day as you complete all scheduled doses on time.'
              )}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn" onClick={downloadPngPoster}>
              📥 {tr(lang, 'حفظ كصورة PNG', 'Download PNG')}
            </button>
            <button type="button" className="btn" style={{ background: '#16a34a' }} onClick={shareWhatsApp}>
              💬 {tr(lang, 'إرسال عبر واتساب', 'Share on WhatsApp')}
            </button>
            <button type="button" className="btn ghost" onClick={() => window.print()}>
              🖨️ {tr(lang, 'طباعة', 'Print')}
            </button>
          </div>
        </div>

        <div className="stack">
          {computedRows.map((r, idx) => (
            <div key={r.id} className="schedule-poster-card">
              <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    💊 {r.name.trim() || tr(lang, `الدواء رقم ${idx + 1}`, `Medication #${idx + 1}`)}
                  </h3>
                  <span className="small muted">
                    {tr(lang, 'الجرعة:', 'Dose:')} <b>{r.dose}</b> · {tr(lang, `كل ${r.intervalHours} ساعات`, `Every ${r.intervalHours} hours`)} · 🍽️ {mealLabel(r.mealRule)}
                  </span>
                </div>
                <span className="badge approved">
                  {r.days} {tr(lang, 'أيام', 'Days')}
                </span>
              </div>

              <div className="schedule-clock-slots">
                {r.slots.map((s, sIdx) => (
                  <div key={sIdx} className="schedule-clock-pill">
                    <span className="clock-period-icon" aria-hidden="true">{s.periodIcon}</span>
                    <div>
                      <span className="clock-period-lbl">
                        {tr(lang, `الجرعة ${sIdx + 1}`, `Dose ${sIdx + 1}`)}
                      </span>
                      <span className="clock-time-val" dir="ltr">{s.label12}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="schedule-days-checkstrip">
                <span className="small muted">{tr(lang, 'متابعة الأيام:', 'Daily Checkboxes:')}</span>
                {Array.from({ length: r.days }, (_, dIdx) => (
                  <span key={dIdx} className="schedule-day-box">
                    ☐ {tr(lang, `يوم ${dIdx + 1}`, `Day ${dIdx + 1}`)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
