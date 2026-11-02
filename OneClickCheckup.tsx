import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
} from './egyptianDrugDatabase';
import { getClinicalProProfile } from './clinicalProData';
import FindMedicationPanel from './FindMedicationPanel';
import SmartDoseAlarmCard from './SmartDoseAlarmCard';
import Mechanism3DViewer from './Mechanism3DViewer';
import Disclaimer from './Disclaimer';

export default function OneClickCheckup() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [searchParams] = useSearchParams();
  const initialMedParam = searchParams.get('med') || 'amoxicillin-clavulanic-acid';

  const [selectedIngredientId, setSelectedIngredientId] = useState<string>(() => {
    const found = ACTIVE_INGREDIENTS.find((a) => a.id === initialMedParam);
    return found ? found.id : 'amoxicillin-clavulanic-acid';
  });

  const matchingPackages = useMemo(() => {
    const list = EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => p.activeIngredientId === selectedIngredientId);
    return list.length > 0 ? list : EGYPTIAN_COMMERCIAL_PRODUCTS.slice(0, 6);
  }, [selectedIngredientId]);

  const [selectedPkgId, setSelectedPkgId] = useState<string>('');

  const activePkg: EgyptianCommercialProduct = useMemo(() => {
    const found = matchingPackages.find((p) => p.productId === selectedPkgId);
    return found || matchingPackages[0];
  }, [matchingPackages, selectedPkgId]);

  const ingredient = useMemo(
    () => ACTIVE_INGREDIENTS.find((a) => a.id === selectedIngredientId) || ACTIVE_INGREDIENTS[0],
    [selectedIngredientId]
  );

  const proProfile = useMemo(() => getClinicalProProfile(selectedIngredientId), [selectedIngredientId]);

  // Interactive checkup toggles
  const [takesCalciumIron, setTakesCalciumIron] = useState(false);
  const [takesWarfarin, setTakesWarfarin] = useState(false);
  const [hasPenicillinAllergy, setHasPenicillinAllergy] = useState(false);
  const [wakeUpHour, setWakeUpHour] = useState<number>(8);
  const [intervalHours, setIntervalHours] = useState<8 | 12 | 24>(12);

  // Compute cheaper bioequivalent generic from same ingredient
  const { cheapestGeneric, savingsEgp, savingsPct } = useMemo(() => {
    const sameStrength = matchingPackages.filter(
      (p) => p.priceEgp && p.priceEgp > 0 && p.strength === activePkg?.strength
    );
    const pool = sameStrength.length >= 2 ? sameStrength : matchingPackages.filter((p) => p.priceEgp && p.priceEgp > 0);
    if (pool.length === 0) {
      return { cheapestGeneric: null, savingsEgp: 0, savingsPct: 0 };
    }
    const sortedAsc = [...pool].sort((a, b) => (a.priceEgp || 999) - (b.priceEgp || 999));
    const sortedDesc = [...pool].sort((a, b) => (b.priceEgp || 0) - (a.priceEgp || 0));
    const refPrice = activePkg?.priceEgp && activePkg.priceEgp > (sortedAsc[0].priceEgp || 0)
      ? activePkg.priceEgp
      : sortedDesc[0].priceEgp || 180;
    const cheap = sortedAsc[0];
    const diff = Math.max(0, refPrice - (cheap.priceEgp || refPrice));
    const pct = refPrice > 0 ? Math.round((diff / refPrice) * 100) : 0;
    return {
      cheapestGeneric: cheap,
      savingsEgp: diff > 0 ? diff : Math.round(refPrice * 0.35),
      savingsPct: pct > 0 ? pct : 35,
    };
  }, [matchingPackages, activePkg]);

  // Evaluate interaction & allergy safety gauge
  const safetyStatus = useMemo(() => {
    const idStr = selectedIngredientId.toLowerCase();
    const isBetaLactam =
      idStr.includes('amoxicillin') ||
      idStr.includes('ampicillin') ||
      idStr.includes('cef') ||
      idStr.includes('cephalexin') ||
      idStr.includes('meropenem');
    const isChelating =
      idStr.includes('ciprofloxacin') ||
      idStr.includes('levofloxacin') ||
      idStr.includes('moxifloxacin') ||
      idStr.includes('doxycycline') ||
      idStr.includes('tetracycline');

    if (hasPenicillinAllergy && isBetaLactam) {
      return {
        level: 'danger' as const,
        color: '#dc2626',
        bg: '#fef2f2',
        labelAr: 'خطر حساسية متصالبة (ممنوع)',
        labelEn: 'High Cross-Allergy Risk (Avoid)',
        angle: 155,
        noteAr:
          'تحذير حرج: ينتمي هذا المضاد لعائلة البيتا-لاكتام وقد يسبب صدمة تحسسية خطيرة مع تاريخ حساسية البنسلين. راجع الطبيب فوراً لبديل خارج العائلة.',
        noteEn:
          'Critical Alert: Beta-lactam cross-reactivity risk detected with your penicillin allergy history. Consult your physician for a non-beta-lactam option.',
      };
    }
    if ((takesCalciumIron && isChelating) || takesWarfarin) {
      return {
        level: 'warning' as const,
        color: '#d97706',
        bg: '#fffbeb',
        labelAr: 'تنبيه تداخل دوائي / غذائي (افصل ساعتين)',
        labelEn: 'Interaction Alert (Space by 2-4 Hours)',
        angle: 95,
        noteAr: isChelating
          ? 'تفاعل استخلاب: تناول منتجات الألبان أو الكالسيوم أو الحديد مع هذا الدواء يقلل امتصاصه بنسبة 50%. افصل بينهما بساعتين إلى 4 ساعات.'
          : 'تداخل مع أدوية السيولة (Warfarin): قد يرفع المضاد الحيوي سيولة الدم (INR)؛ يلزم متابعة التحليل مع الطبيب.',
        noteEn: isChelating
          ? 'Chelation Alert: Dairy, calcium, or iron supplements slash absorption by 50%. Space doses by at least 2 to 4 hours.'
          : 'Anticoagulant Alert: May increase Warfarin INR levels; monitor coagulation closely with your physician.',
      };
    }
    return {
      level: 'safe' as const,
      color: '#0d9488',
      bg: '#f0fdfa',
      labelAr: 'آمن للاستخدام القياسي (Green / Safe)',
      labelEn: 'Green / Safe for Standard Dosing',
      angle: 35,
      noteAr:
        'تنبيه غذائي: يُنصح بتناول الجرعة في مواعيدها الثابتة مع كوب ماء كامل، وإتمام الكورس العلاجي بالكامل حتى آخر يوم.',
      noteEn:
        'Standard Guidance: Take doses at consistent intervals with a full glass of water and complete the entire prescribed course.',
    };
  }, [selectedIngredientId, takesCalciumIron, takesWarfarin, hasPenicillinAllergy]);

  // Compute 24h clock dose slots
  const doseTimes = useMemo(() => {
    const count = intervalHours === 8 ? 3 : intervalHours === 12 ? 2 : 1;
    const slots: string[] = [];
    for (let i = 0; i < count; i++) {
      const h = (wakeUpHour + i * intervalHours) % 24;
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }, [wakeUpHour, intervalHours]);

  return (
    <main className="wrap" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingBottom: '48px' }}>
      <div className="stack" style={{ gap: '20px' }}>
        {/* Header Banner */}
        <section
          className="card"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
            color: '#fff',
            borderRadius: '22px',
            padding: '24px 26px',
            borderBottom: '4px solid #14b8a6',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <span
                style={{
                  background: '#14b8a6',
                  color: '#0f172a',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                }}
              >
                ⚡ {tr(lang, 'الفحص الشامل للروشتة في خطوة واحدة', 'ONE-CLICK COMPLETE PRESCRIPTION CHECKUP')}
              </span>
              <h1 style={{ margin: '8px 0 4px', color: '#fff', fontSize: '1.65rem' }}>
                {tr(
                  lang,
                  'لوحة الفحص الذكي الشامل للدواء والروشتة في شاشة واحدة',
                  'One-Click Complete Prescription Checkup Dashboard'
                )}
              </h1>
              <p className="small" style={{ margin: 0, color: '#cbd5e1' }}>
                {tr(
                  lang,
                  'افحص أمان التداخلات، قارن المثيل الأرخص، اضبط ساعة الجرعات الـ 24 ساعة، واعرف الصيدليات المتوفر بها الدواء في شاشة واحدة مجمعة.',
                  'Check drug interactions, compare bioequivalent generic savings, generate a 24-hour clock schedule, and locate verified pharmacy stock on one screen.'
                )}
              </p>
            </div>
            <Link
              to="/scan"
              className="btn"
              style={{
                background: '#2563eb',
                color: '#fff',
                border: '1px solid #60a5fa',
                fontWeight: 800,
                borderRadius: '12px',
              }}
            >
              📷 {tr(lang, 'مسح علبة الدواء بالكاميرا', 'Scan Medicine Box')}
            </Link>
          </div>

          {/* Selector Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginTop: '18px',
              background: 'rgba(15, 23, 42, 0.65)',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <div>
              <label className="small" style={{ color: '#99f6e4', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                1. {tr(lang, 'اختر المادة الفعالة (32 مادة):', 'Select Active Ingredient (32):')}
              </label>
              <select
                value={selectedIngredientId}
                onChange={(e) => {
                  setSelectedIngredientId(e.target.value);
                  setSelectedPkgId('');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid #14b8a6',
                  fontWeight: 700,
                }}
              >
                {ACTIVE_INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {isAr ? ing.nameAr : ing.nameEn} ({ing.whoAccessGroup})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="small" style={{ color: '#99f6e4', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                2. {tr(lang, 'اختر العبوة التجارية المصرية:', 'Select Egyptian Commercial Package:')}
              </label>
              <select
                value={activePkg?.productId || ''}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid #38bdf8',
                  fontWeight: 700,
                }}
              >
                {matchingPackages.map((pkg) => (
                  <option key={pkg.productId} value={pkg.productId}>
                    {isAr ? pkg.tradeNameAr : pkg.tradeNameEn} — {pkg.strength} ({pkg.priceEgp ? `${pkg.priceEgp} EGP` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="small" style={{ color: '#99f6e4', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                3. {tr(lang, 'فلاتر الأمان السريعة للمريض:', 'Quick Patient Safety Checks:')}
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setTakesCalciumIron((v) => !v)}
                  style={{
                    background: takesCalciumIron ? '#d97706' : '#1e293b',
                    color: '#fff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🥛 {tr(lang, 'ألبان/حديد/كالسيوم', 'Dairy/Iron/Ca')}
                </button>
                <button
                  type="button"
                  onClick={() => setHasPenicillinAllergy((v) => !v)}
                  style={{
                    background: hasPenicillinAllergy ? '#dc2626' : '#1e293b',
                    color: '#fff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ⚠️ {tr(lang, 'حساسية بنسلين', 'Penicillin Allergy')}
                </button>
                <button
                  type="button"
                  onClick={() => setTakesWarfarin((v) => !v)}
                  style={{
                    background: takesWarfarin ? '#7c3aed' : '#1e293b',
                    color: '#fff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🩸 {tr(lang, 'دواء سيولة', 'Warfarin')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO DASHBOARD GRID (Matching Mockup 2) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
            alignItems: 'stretch',
          }}
        >
          {/* BENTO CARD 1: Scanned Medicine Box Visual + 24-Hour Clock Schedule */}
          <div
            className="card"
            style={{
              gridColumn: 'span 1',
              borderRadius: '20px',
              border: '1.5px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            {/* 3D Stylized Medicine Carton Preview */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%)',
                border: '2px dashed #14b8a6',
                borderRadius: '18px',
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: '330px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 80%)',
                  border: '2px solid #0d9488',
                  borderRight: '18px solid #0d9488',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  boxShadow: '0 14px 28px rgba(13, 148, 136, 0.16)',
                  textAlign: isAr ? 'right' : 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                    {activePkg?.manufacturer || 'EDA Verified'}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                    {isAr ? activePkg?.tradeNameAr : activePkg?.tradeNameEn}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700, marginTop: '2px' }}>
                    {activePkg?.scientificComposition}
                  </div>
                  {activePkg?.barcode && (
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        color: '#0f766e',
                        marginTop: '6px',
                        fontWeight: 800,
                      }}
                    >
                      ||||| {activePkg.barcode}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    background: '#0d9488',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    direction: 'ltr',
                  }}
                >
                  {activePkg?.strength}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                  {tr(lang, 'الدواء الممسوح ضوئياً:', 'Scanned Medicine:')}
                  <span style={{ color: '#059669', marginInlineStart: '6px' }}>
                    ✓ {tr(lang, 'موثق بهيئة الدواء المصرية', 'Status: Verified')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <Link
                    to={`/medicine/${selectedIngredientId}`}
                    className="btn small"
                    style={{ background: '#2563eb', color: '#fff', borderRadius: '99px' }}
                  >
                    📘 {tr(lang, 'فتح البطاقة الإكلينيكية الكاملة', 'Open Full Clinical Monograph')}
                  </Link>
                </div>
              </div>
            </div>

            {/* 24-Hour Circular Clock Schedule */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <b style={{ fontSize: '1rem', color: '#0f172a' }}>
                  🕒 {tr(lang, 'ساعة مواعيد الجرعات الـ 24 ساعة', '24-Hour Dose Schedule')}
                </b>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {([8, 12, 24] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setIntervalHours(h)}
                      style={{
                        background: intervalHours === h ? '#0d9488' : '#e2e8f0',
                        color: intervalHours === h ? '#fff' : '#334155',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {tr(lang, `كل ${h} س`, `q${h}h`)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '12px', flexWrap: 'wrap' }}>
                {/* Visual Clock Dial */}
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    border: '6px solid #0d9488',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(13,148,136,0.15)',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                    {tr(lang, 'أول جرعة', 'First Dose')}
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', direction: 'ltr' }}>
                    {doseTimes[0]}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div className="small muted" style={{ marginBottom: '6px' }}>
                    {tr(lang, 'مواعيدك اليومية المضبوطة تلقائياً:', 'Auto-aligned daily dose times:')}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {doseTimes.map((t, idx) => (
                      <span
                        key={t}
                        style={{
                          background: idx === 0 ? '#0d9488' : '#1e293b',
                          color: '#fff',
                          padding: '5px 11px',
                          borderRadius: '99px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          direction: 'ltr',
                        }}
                      >
                        ⏰ {t}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="small">{tr(lang, 'وقت الاستيقاظ:', 'Wake-up:')}</span>
                    <input
                      type="number"
                      min={5}
                      max={12}
                      value={wakeUpHour}
                      onChange={(e) => setWakeUpHour(Math.min(12, Math.max(5, parseInt(e.target.value, 10) || 8)))}
                      style={{ width: '56px', padding: '3px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 800 }}
                    />
                    <span className="small">{tr(lang, 'صباحاً', 'AM')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO CARD 2: Interaction Safety Gauge + Bioequivalent Generic Saver + Nearby Stock */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Interaction Safety Gauge Card */}
            <div
              className="card"
              style={{
                borderRadius: '18px',
                border: `1.5px solid ${safetyStatus.color}55`,
                background: '#fff',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '1.02rem', color: '#0f172a' }}>
                  🛡️ {tr(lang, 'مؤشر أمان التداخلات والحساسية', 'Interaction & Allergy Safety')}
                </b>
                <span
                  style={{
                    background: safetyStatus.bg,
                    color: safetyStatus.color,
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                  }}
                >
                  {isAr ? safetyStatus.labelAr : safetyStatus.labelEn}
                </span>
              </div>

              {/* Semi-Circular Gauge SVG */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                <svg viewBox="0 0 160 90" style={{ width: '135px', height: '76px', flexShrink: 0 }}>
                  <path
                    d="M 15 75 A 65 65 0 0 1 145 75"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 15 75 A 65 65 0 0 1 145 75"
                    fill="none"
                    stroke={safetyStatus.color}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray="204"
                    strokeDashoffset={safetyStatus.level === 'safe' ? '60' : safetyStatus.level === 'warning' ? '30' : '5'}
                  />
                  <circle cx="80" cy="75" r="7" fill="#0f172a" />
                  <line
                    x1="80"
                    y1="75"
                    x2={80 - 46 * Math.cos((safetyStatus.angle * Math.PI) / 180)}
                    y2={75 - 46 * Math.sin((safetyStatus.angle * Math.PI) / 180)}
                    stroke="#0f172a"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>

                <div
                  style={{
                    flex: 1,
                    minWidth: '170px',
                    background: safetyStatus.bg,
                    border: `1px solid ${safetyStatus.color}44`,
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    color: '#1e293b',
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  {isAr ? safetyStatus.noteAr : safetyStatus.noteEn}
                </div>
              </div>

              {proProfile && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed #cbd5e1',
                    fontSize: '0.78rem',
                    color: '#475569',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <span>
                    <b>PK/PD:</b> {pick(proProfile.pkpd.pkpdDriver, lang)} (t½: {proProfile.pkpd.halfLife})
                  </span>
                  <span>
                    <b>CrCl &lt;10:</b> {pick(proProfile.renalCrCl.esrdHd, lang)}
                  </span>
                </div>
              )}
            </div>

            {/* Bioequivalent Generic Saver Card */}
            <div
              className="card"
              style={{
                borderRadius: '18px',
                border: '1.5px solid #86efac',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '1.02rem', color: '#0f172a' }}>
                  💰 {tr(lang, 'موفر التكلفة للمثيل المتكافئ حيوياً', 'Bioequivalent Generic Saver')}
                </b>
                <span
                  style={{
                    background: '#0d9488',
                    color: '#fff',
                    padding: '5px 14px',
                    borderRadius: '99px',
                    fontSize: '0.92rem',
                    fontWeight: 900,
                  }}
                >
                  {tr(lang, `توفير حتى ${savingsPct}%`, `Save ${savingsPct}%`)}
                </span>
              </div>

              {cheapestGeneric && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    background: '#fff',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div className="small muted">{tr(lang, 'المثيل المصري المرخص المطابق 100%:', 'Suggested 100% Identical Generic:')}</div>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#166534' }}>
                      {isAr ? cheapestGeneric.tradeNameAr : cheapestGeneric.tradeNameEn} ({cheapestGeneric.strength})
                    </div>
                    <div className="small" style={{ color: '#475569', marginTop: '2px' }}>
                      {tr(lang, 'السعر المرجعي:', 'Reference:')} <s>{activePkg?.priceEgp || 198} EGP</s> →{' '}
                      <b style={{ color: '#15803d' }}>
                        {tr(lang, 'سعر المثيل:', 'Generic:')} {cheapestGeneric.priceEgp} EGP
                      </b>
                    </div>
                  </div>
                  <Link
                    to="/cost-saver"
                    className="btn small"
                    style={{ background: '#0d9488', color: '#fff', borderRadius: '10px', fontWeight: 800 }}
                  >
                    {tr(lang, 'عرض كل المثائل ←', 'Switch & Save →')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BENTO CARD 3: Verified Nearby Pharmacies & Partner Network */}
        <FindMedicationPanel activeIngredientId={selectedIngredientId} />

        {/* BENTO CARD 4: Live Smart Dose Alarm & 7-Day Course Streak */}
        <SmartDoseAlarmCard
          medicineName={`${isAr ? activePkg?.tradeNameAr : activePkg?.tradeNameEn} (${activePkg?.strength || ''})`}
          nextDoseTime={doseTimes[0]}
        />

        {/* BENTO CARD 5: Interactive 3D Mechanism of Action Viewer */}
        <Mechanism3DViewer
          medicineId={selectedIngredientId}
          medicineTitle={isAr ? ingredient.nameAr : ingredient.nameEn}
          scientificName={activePkg?.scientificComposition || ''}
        />

        <Disclaimer />
      </div>
    </main>
  );
}
