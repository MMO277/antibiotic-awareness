import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';
import Disclaimer from './Disclaimer';

export type IntervalHours = 24 | 12 | 8 | 6;
export type MealInstructionKey =
  | 'after_meal'
  | 'empty_stomach'
  | 'with_water_upright'
  | 'no_dairy_iron'
  | 'anytime';

export interface ScheduleMedRow {
  id: string;
  name: string;
  doseText: string;
  intervalHours: IntervalHours;
  mealRule: MealInstructionKey;
  durationDays: number;
  color: string;
}

const ROW_COLORS = ['#0e9aa7', '#15803d', '#4f46e5', '#d97706', '#be123c'];

const MEAL_RULE_LABELS: Record<MealInstructionKey, Bi> = {
  after_meal: {
    ar: '🍽️ بعد الأكل مباشرة (لتقليل اضطرابات المعدة)',
    en: '🍽️ Immediately after a meal (reduces stomach upset)',
  },
  empty_stomach: {
    ar: '⏳ على معدة فارغة (قبل الأكل بساعة أو بعده بساعتين)',
    en: '⏳ Empty stomach (1h before or 2h after food)',
  },
  with_water_upright: {
    ar: '💧 مع كوب ماء كامل وعدم الاستلقاء لمدة 30 دقيقة',
    en: '💧 With a full glass of water; stay upright 30 min',
  },
  no_dairy_iron: {
    ar: '🥛🚫 افصل ساعتين عن الحليب والجبن والحديد والكالسيوم',
    en: '🥛🚫 Separate by 2h from dairy, iron, calcium & antacids',
  },
  anytime: {
    ar: '🕒 في الموعد المحدد (مع الطعام أو بدونه)',
    en: '🕒 At scheduled time (with or without food)',
  },
};

interface PresetMedTemplate {
  labelAr: string;
  labelEn: string;
  doseAr: string;
  doseEn: string;
  intervalHours: IntervalHours;
  mealRule: MealInstructionKey;
  durationDays: number;
}

const PRESET_TEMPLATES: PresetMedTemplate[] = [
  {
    labelAr: 'أوجمنتين / هاي بيوتك 1 جم (Augmentin 1g)',
    labelEn: 'Augmentin / Hibiotic 1g',
    doseAr: 'قرص واحد (1 جم)',
    doseEn: '1 Tablet (1g)',
    intervalHours: 12,
    mealRule: 'after_meal',
    durationDays: 7,
  },
  {
    labelAr: 'زيثروماكس / زيثرون 500 مجم (Zithromax 500mg)',
    labelEn: 'Zithromax / Xithrone 500mg',
    doseAr: 'كبسولة / قرص واحد',
    doseEn: '1 Capsule / Tablet',
    intervalHours: 24,
    mealRule: 'empty_stomach',
    durationDays: 3,
  },
  {
    labelAr: 'سيبروفار / سيبروباي 500 مجم (Ciprofloxacin 500mg)',
    labelEn: 'Ciprofar / Ciprobay 500mg',
    doseAr: 'قرص واحد (500 مجم)',
    doseEn: '1 Tablet (500mg)',
    intervalHours: 12,
    mealRule: 'no_dairy_iron',
    durationDays: 7,
  },
  {
    labelAr: 'فلاجيل / أمريزول 500 مجم (Flagyl 500mg)',
    labelEn: 'Flagyl / Amrizole 500mg',
    doseAr: 'قرص واحد (500 مجم)',
    doseEn: '1 Tablet (500mg)',
    intervalHours: 8,
    mealRule: 'after_meal',
    durationDays: 7,
  },
  {
    labelAr: 'فيبراميسين / دوكسيكوست 100 مجم (Doxycycline 100mg)',
    labelEn: 'Vibramycin / Doxycost 100mg',
    doseAr: 'كبسولة واحدة (100 مجم)',
    doseEn: '1 Capsule (100mg)',
    intervalHours: 12,
    mealRule: 'with_water_upright',
    durationDays: 7,
  },
  {
    labelAr: 'دالاسين سي / كليندام 300 مجم (Clindamycin 300mg)',
    labelEn: 'Dalacin C / Clindam 300mg',
    doseAr: 'كبسولة واحدة (300 مجم)',
    doseEn: '1 Capsule (300mg)',
    intervalHours: 8,
    mealRule: 'with_water_upright',
    durationDays: 7,
  },
];

function formatHour12(hour24: number, isAr: boolean): string {
  const normalized = ((hour24 % 24) + 24) % 24;
  const periodAr = normalized < 12 ? 'صباحاً' : 'مساءً';
  const periodEn = normalized < 12 ? 'AM' : 'PM';
  const h12 = normalized % 12 === 0 ? 12 : normalized % 12;
  const padded = String(h12).padStart(2, '0') + ':00';
  return isAr ? `${padded} ${periodAr}` : `${padded} ${periodEn}`;
}

function getTimeOfDayBadge(hour24: number, isAr: boolean): { icon: string; label: string } {
  const h = ((hour24 % 24) + 24) % 24;
  if (h >= 5 && h < 12) return { icon: '🌅', label: isAr ? 'الصباح' : 'Morning' };
  if (h >= 12 && h < 17) return { icon: '☀️', label: isAr ? 'الظهيرة' : 'Afternoon' };
  if (h >= 17 && h < 21) return { icon: '🌆', label: isAr ? 'المساء' : 'Evening' };
  return { icon: '🌙', label: isAr ? 'الليل' : 'Night' };
}

function computeDoseHours(wakeHour: number, interval: IntervalHours): number[] {
  const count = 24 / interval;
  const hours: number[] = [];
  for (let i = 0; i < count; i++) {
    hours.push((wakeHour + i * interval) % 24);
  }
  return hours;
}

export default function DailyScheduleGenerator() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [sp] = useSearchParams();
  const medParam = sp.get('med') || '';

  const [patientName, setPatientName] = useState<string>('');
  const [wakeHour, setWakeHour] = useState<number>(8);
  const [copiedMsg, setCopiedMsg] = useState<string>('');

  const [rows, setRows] = useState<ScheduleMedRow[]>(() => [
    {
      id: 'row-1',
      name: medParam || (isAr ? 'أوجمنتين 1 جم أقراص' : 'Augmentin 1g Tablets'),
      doseText: isAr ? 'قرص واحد' : '1 Tablet',
      intervalHours: 12,
      mealRule: 'after_meal',
      durationDays: 7,
      color: ROW_COLORS[0],
    },
  ]);

  const addMedicationRow = (preset?: PresetMedTemplate) => {
    setRows((prev) => {
      const nextIdx = prev.length;
      const color = ROW_COLORS[nextIdx % ROW_COLORS.length];
      return [
        ...prev,
        {
          id: `row-${Date.now()}-${nextIdx}`,
          name: preset ? (isAr ? preset.labelAr : preset.labelEn) : '',
          doseText: preset ? (isAr ? preset.doseAr : preset.doseEn) : isAr ? 'قرص واحد' : '1 Tablet',
          intervalHours: preset ? preset.intervalHours : 12,
          mealRule: preset ? preset.mealRule : 'after_meal',
          durationDays: preset ? preset.durationDays : 7,
          color,
        },
      ];
    });
  };

  const updateRow = (id: string, patch: Partial<ScheduleMedRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const validRows = useMemo(
    () => rows.filter((r) => r.name.trim().length > 0),
    [rows]
  );

  // Build WhatsApp share text
  const whatsappShareText = useMemo(() => {
    const header = isAr
      ? `📅 *جدول مواعيد الجرعات اليومي*${patientName.trim() ? ` — ${patientName.trim()}` : ''}\n━━━━━━━━━━━━━━`
      : `📅 *Daily Medication Schedule*${patientName.trim() ? ` — ${patientName.trim()}` : ''}\n━━━━━━━━━━━━━━`;

    const lines = validRows.map((r, idx) => {
      const hours = computeDoseHours(wakeHour, r.intervalHours)
        .map((h) => formatHour12(h, isAr))
        .join('  |  ');
      const mealText = pick(MEAL_RULE_LABELS[r.mealRule], lang);
      return isAr
        ? `${idx + 1}. 💊 *${r.name}* (${r.doseText} — كل ${r.intervalHours} ساعة لمدة ${r.durationDays} أيام)\n   ⏰ المواعيد: ${hours}\n   📌 التعليمات: ${mealText}`
        : `${idx + 1}. 💊 *${r.name}* (${r.doseText} — q${r.intervalHours}h for ${r.durationDays} days)\n   ⏰ Times: ${hours}\n   📌 Note: ${mealText}`;
    });

    const footer = isAr
      ? `\n✅ تذكير: التزم بإكمال الكورس العلاجي بالكامل في مواعيده حتى لو اختفت الأعراض.\n🔗 منصة الوعي بالمضادات الحيوية`
      : `\n✅ Reminder: Complete your full prescribed course on time even if symptoms improve.\n🔗 Antibiotic Awareness Portal`;

    return [header, ...lines, footer].join('\n\n');
  }, [validRows, patientName, wakeHour, isAr, lang]);

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappShareText);
      setCopiedMsg(tr(lang, 'تم نسخ الجدول بنجاح! ✓', 'Schedule copied! ✓'));
      window.setTimeout(() => setCopiedMsg(''), 3000);
    } catch {
      setCopiedMsg(tr(lang, 'اضغط مشاركة واتساب للإرسال مباشرة', 'Use WhatsApp button to share'));
    }
  };

  // High-Resolution HTML5 Canvas Image Generator for Saving as PNG
  const handleDownloadPngImage = () => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const rowHeight = 148;
    const headerHeight = 165;
    const footerHeight = 95;
    const height = headerHeight + Math.max(1, validRows.length) * rowHeight + footerHeight;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Header gradient banner
    const grad = ctx.createLinearGradient(0, 0, width, headerHeight);
    grad.addColorStop(0, '#072a40');
    grad.addColorStop(1, '#0e9aa7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.direction = isAr ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    const titleStr = isAr
      ? `📅 جدول مواعيد الأدوية اليومي${patientName.trim() ? ` — ${patientName.trim()}` : ''}`
      : `📅 Daily Medication Schedule${patientName.trim() ? ` — ${patientName.trim()}` : ''}`;
    ctx.fillText(titleStr, width / 2, 68);

    ctx.fillStyle = '#cffafe';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    const subStr = isAr
      ? 'التزم بالمواعيد المحددة بالساعة وإرشادات الطعام لضمان الشفاء ومنع مقاومة البكتيريا'
      : 'Follow exact clock intervals and meal instructions to ensure full recovery';
    ctx.fillText(subStr, width / 2, 115);

    // Draw each medication card
    validRows.forEach((r, idx) => {
      const y = headerHeight + idx * rowHeight + 16;
      const cardH = rowHeight - 22;

      // White card box
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(36, y, width - 72, cardH, 16);
      ctx.fill();
      ctx.stroke();

      // Colored accent bar
      ctx.fillStyle = r.color;
      ctx.beginPath();
      if (isAr) {
        ctx.roundRect(width - 48, y, 12, cardH, [0, 16, 16, 0]);
      } else {
        ctx.roundRect(36, y, 12, cardH, [16, 0, 0, 16]);
      }
      ctx.fill();

      ctx.textAlign = isAr ? 'right' : 'left';
      const textX = isAr ? width - 70 : 68;

      // Drug name & dose
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 25px system-ui, -apple-system, sans-serif';
      const medHeading = isAr
        ? `💊 ${r.name}  (${r.doseText} — كل ${r.intervalHours} ساعة لمدة ${r.durationDays} أيام)`
        : `💊 ${r.name}  (${r.doseText} — every ${r.intervalHours}h for ${r.durationDays} days)`;
      ctx.fillText(medHeading, textX, y + 42);

      // Clock times
      const hoursStr = computeDoseHours(wakeHour, r.intervalHours)
        .map((h) => formatHour12(h, isAr))
        .join('   |   ');
      ctx.fillStyle = r.color;
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(`⏰ ${isAr ? 'المواعيد:' : 'Times:'}  ${hoursStr}`, textX, y + 80);

      // Meal rule
      ctx.fillStyle = '#475569';
      ctx.font = '19px system-ui, -apple-system, sans-serif';
      ctx.fillText(pick(MEAL_RULE_LABELS[r.mealRule], lang), textX, y + 112);
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      isAr
        ? '✅ لا توقف المضاد الحيوي عند تحسن الأعراض — أكمل الكورس الموصوف بالكامل | منصة الوعي بالمضادات الحيوية'
        : '✅ Never stop your antibiotic early when symptoms improve — complete the full course | Antibiotic Awareness',
      width / 2,
      height - 38
    );

    const link = document.createElement('a');
    link.download = 'daily-medication-schedule.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <main className="wrap stack">
      {/* Hero & Builder Controls (Hidden when printing) */}
      <section className="card no-print schedule-gen-hero">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, marginBottom: '8px' }}>
              📅 {tr(lang, 'أداة تنظيم مواعيد الأدوية للمنزل والواتساب والطباعة', 'Printable & WhatsApp Daily Schedule Generator')}
            </span>
            <h1 style={{ margin: '4px 0 8px' }}>
              {tr(
                lang,
                'مولّد جدول الجرعات اليومي (للطباعة أو الحفظ كصورة أو الإرسال عبر واتساب)',
                'Daily Dose Schedule Generator (Download Image, Share on WhatsApp & Print)',
                'Générateur de Calendrier Quotidien des Doses (Image PNG, WhatsApp & Impression)',
                'Generador de Horario Diario de Dosis (Imagen PNG, WhatsApp e Impresión)'
              )}
            </h1>
            <p className="muted" style={{ maxWidth: '74ch', margin: 0 }}>
              {tr(
                lang,
                'حدد ساعة استيقاظك وأضف أدويتك ليقوم الموقع بحساب المواعيد الدقيقة بالساعة مع تعليمات الأكل، ثم احفظ الجدول كصورة ملونة على هاتفك أو أرسله عبر واتساب أو اطبعه لتعليقه بالمنزل.',
                'Set your wake-up time and add your medications to automatically calculate exact clock intervals and food rules—then download a high-res PNG image, share via WhatsApp, or print an A4 fridge chart.',
                'Définissez votre heure de réveil et vos médicaments pour générer un planning coloré téléchargeable en PNG, partageable sur WhatsApp ou imprimable.',
                'Configura tu hora de despertar y tus medicamentos para generar un horario en imagen PNG, compartir por WhatsApp o imprimir.'
              )}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/prescription-radar" className="btn ghost small">
              📡 {tr(lang, 'رادار الروشتة 24س', 'Rx Radar 24h')}
            </Link>
            <Link to="/tracker" className="btn ghost small">
              ⏱️ {tr(lang, 'متابع الجرعات التفاعلي', 'Dose Tracker')}
            </Link>
          </div>
        </div>

        {/* Patient Name & Wake-up Time */}
        <div className="schedule-routine-bar">
          <div style={{ flex: '1 1 240px' }}>
            <label htmlFor="sched-patient-name" className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '5px' }}>
              👤 {tr(lang, 'اسم المريض (اختياري لطباعته على الجدول):', 'Patient Name (optional for header):')}
            </label>
            <input
              id="sched-patient-name"
              type="text"
              className="input"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={tr(lang, 'مثال: أ. محمد أحمد / الطفل عمر...', 'e.g., Ahmed / Omar...')}
            />
          </div>

          <div style={{ flex: '1 1 220px' }}>
            <label htmlFor="sched-wake-hour" className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '5px' }}>
              🌅 {tr(lang, 'موعد الاستيقاظ وأول جرعة صباحية:', 'Wake-up & First Morning Dose Time:')}
            </label>
            <select
              id="sched-wake-hour"
              className="input"
              value={wakeHour}
              onChange={(e) => setWakeHour(Number(e.target.value))}
            >
              {[6, 7, 8, 9, 10, 11, 12].map((h) => (
                <option key={h} value={h}>
                  {formatHour12(h, isAr)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick-Add Presets */}
        <div style={{ marginTop: '12px' }}>
          <span className="small muted" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            ⚡ {tr(lang, 'إضافة سريعة لأشهر المضادات الحيوية (مع ضبط تلقائي لتعليمات الطعام):', 'Quick-add common antibiotics (auto-fills food rules & interval):')}
          </span>
          <div className="row wrapRow" style={{ gap: '6px' }}>
            {PRESET_TEMPLATES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="chip cost-quick-chip"
                onClick={() => addMedicationRow(preset)}
              >
                <span>＋ {isAr ? preset.labelAr.split(' (')[0] : preset.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editable Medication Rows */}
        <div className="stack" style={{ gap: '10px', marginTop: '14px' }}>
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="schedule-edit-row"
              style={{ borderInlineStart: `4px solid ${row.color}` }}
            >
              <div className="schedule-row-field name-col">
                <label className="small muted">{tr(lang, `اسم الدواء #${idx + 1}`, `Medication #${idx + 1}`)}</label>
                <input
                  type="text"
                  className="input"
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  placeholder={tr(lang, 'اكتب اسم الدواء...', 'Enter drug name...')}
                />
              </div>

              <div className="schedule-row-field dose-col">
                <label className="small muted">{tr(lang, 'مقدار الجرعة', 'Dose Amount')}</label>
                <input
                  type="text"
                  className="input"
                  value={row.doseText}
                  onChange={(e) => updateRow(row.id, { doseText: e.target.value })}
                  placeholder={tr(lang, 'قرص / 5 مل...', '1 tab / 5 mL...')}
                />
              </div>

              <div className="schedule-row-field interval-col">
                <label className="small muted">{tr(lang, 'التكرار اليومي', 'Frequency')}</label>
                <select
                  className="input"
                  value={row.intervalHours}
                  onChange={(e) => updateRow(row.id, { intervalHours: Number(e.target.value) as IntervalHours })}
                >
                  <option value={24}>{tr(lang, 'كل 24 ساعة (مرة يومياً)', 'Every 24h (Once daily)')}</option>
                  <option value={12}>{tr(lang, 'كل 12 ساعة (مرتين يومياً)', 'Every 12h (Twice daily)')}</option>
                  <option value={8}>{tr(lang, 'كل 8 ساعات (3 مرات يومياً)', 'Every 8h (3x daily)')}</option>
                  <option value={6}>{tr(lang, 'كل 6 ساعات (4 مرات يومياً)', 'Every 6h (4x daily)')}</option>
                </select>
              </div>

              <div className="schedule-row-field meal-col">
                <label className="small muted">{tr(lang, 'تعليمات الأكل والامتصاص', 'Meal & Absorption Rule')}</label>
                <select
                  className="input"
                  value={row.mealRule}
                  onChange={(e) => updateRow(row.id, { mealRule: e.target.value as MealInstructionKey })}
                >
                  {(Object.keys(MEAL_RULE_LABELS) as MealInstructionKey[]).map((k) => (
                    <option key={k} value={k}>
                      {pick(MEAL_RULE_LABELS[k], lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="schedule-row-field days-col">
                <label className="small muted">{tr(lang, 'مدة الكورس', 'Duration')}</label>
                <select
                  className="input"
                  value={row.durationDays}
                  onChange={(e) => updateRow(row.id, { durationDays: Number(e.target.value) })}
                >
                  {[3, 5, 7, 10, 14].map((d) => (
                    <option key={d} value={d}>
                      {d} {tr(lang, 'أيام', 'days')}
                    </option>
                  ))}
                </select>
              </div>

              {rows.length > 1 && (
                <button
                  type="button"
                  className="btn ghost small schedule-del-btn"
                  onClick={() => removeRow(row.id)}
                  title={tr(lang, 'حذف هذا الدواء', 'Remove medication')}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '10px' }}>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => addMedicationRow()}
          >
            ➕ {tr(lang, 'إضافة دواء آخر للجدول', 'Add Another Medication')}
          </button>

          {/* 3 Export Actions */}
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn small"
              style={{ background: '#0e9aa7' }}
              onClick={handleDownloadPngImage}
            >
              📥 {tr(lang, 'تحميل الجدول كصورة (PNG)', 'Download Image (PNG)')}
            </button>
            <button
              type="button"
              className="btn small"
              style={{ background: '#16a34a' }}
              onClick={handleShareWhatsApp}
            >
              📲 {tr(lang, 'مشاركة عبر واتساب', 'Share on WhatsApp')}
            </button>
            <button
              type="button"
              className="btn ghost small"
              onClick={handleCopyText}
            >
              📋 {tr(lang, 'نسخ نص الجدول', 'Copy Text')}
            </button>
            <button
              type="button"
              className="btn small"
              style={{ background: '#1e293b' }}
              onClick={() => window.print()}
            >
              🖨️ {tr(lang, 'طباعة الجدول (A4)', 'Print Schedule')}
            </button>
          </div>
        </div>
        {copiedMsg && (
          <p className="small" style={{ color: '#15803d', fontWeight: 700, margin: '6px 0 0' }}>
            {copiedMsg}
          </p>
        )}
      </section>

      {/* Printable & Visual Daily Schedule Poster */}
      <section className="card printable-treatment-report daily-schedule-poster">
        <div className="schedule-poster-header">
          <div>
            <h2 style={{ margin: 0 }}>
              📅 {tr(lang, 'جدول مواعيد الأدوية اليومي المنسق', 'Personalized Daily Medication Schedule')}
              {patientName.trim() ? ` — ${patientName.trim()}` : ''}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {tr(
                lang,
                'علّق هذا الجدول في مكان واضح بالمنزل أو احفظه على هاتفك وضع علامة (✓) أمام كل يوم بعد إتمام الجرعات:',
                'Keep this chart visible on your phone or fridge and check off each completed day:'
              )}
            </p>
          </div>
          <span className="badge" style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700 }}>
            ⏰ {tr(lang, `يبدأ من ${formatHour12(wakeHour, isAr)}`, `Starts at ${formatHour12(wakeHour, isAr)}`)}
          </span>
        </div>

        <div className="stack" style={{ gap: '12px', marginTop: '14px' }}>
          {validRows.map((row) => {
            const hours = computeDoseHours(wakeHour, row.intervalHours);
            return (
              <div
                key={row.id}
                className="schedule-poster-card"
                style={{ borderInlineStart: `5px solid ${row.color}` }}
              >
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: row.color }}>
                      💊 {row.name}
                    </h3>
                    <span className="small muted">
                      {row.doseText} · {tr(lang, `كل ${row.intervalHours} ساعة`, `Every ${row.intervalHours} hours`)} ·{' '}
                      {tr(lang, `لمدة ${row.durationDays} أيام`, `For ${row.durationDays} days`)}
                    </span>
                  </div>
                  <span className="badge" style={{ background: `${row.color}18`, color: row.color, fontWeight: 700 }}>
                    {pick(MEAL_RULE_LABELS[row.mealRule], lang)}
                  </span>
                </div>

                {/* Clock Slots */}
                <div className="schedule-clock-slots">
                  {hours.map((h, hIdx) => {
                    const badge = getTimeOfDayBadge(h, isAr);
                    return (
                      <div key={hIdx} className="schedule-clock-pill">
                        <span className="clock-period-icon" aria-hidden="true">{badge.icon}</span>
                        <div>
                          <span className="clock-period-lbl">{badge.label}</span>
                          <strong className="clock-time-val">{formatHour12(h, isAr)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Check-off Days Strip for Print & Fridge Tracking */}
                <div className="schedule-days-checkstrip">
                  <span className="small muted" style={{ fontWeight: 700 }}>
                    ☑️ {tr(lang, 'متابعة أيام الكورس:', 'Course Day Check-off:')}
                  </span>
                  <div className="row wrapRow" style={{ gap: '6px' }}>
                    {Array.from({ length: row.durationDays }).map((_, dIdx) => (
                      <span key={dIdx} className="schedule-day-box">
                        ☐ {tr(lang, `يوم ${dIdx + 1}`, `Day ${dIdx + 1}`)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="report-disclaimer-box" style={{ marginTop: '14px' }}>
          <strong>
            ⚠️ {tr(lang, 'قاعدة ذهبية للأمان الدوائي:', 'Golden Rule of Antibiotic Stewardship:')}
          </strong>{' '}
          {tr(
            lang,
            'أكمل كورس المضاد الحيوي بالكامل حتى آخر يوم قرره الطبيب حتى لو شعرت بتحسن تام؛ إيقاف الدواء مبكراً ينشط البكتيريا المقاومة ويسبب انتكاس العدوى.',
            'Always complete the full prescribed course even if you feel completely better; stopping early selects for resistant bacteria.'
          )}
        </div>
      </section>

      <div className="no-print">
        <Disclaimer />
      </div>
    </main>
  );
}
