import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import { useClinicalProMode } from './clinicalProData';
import { norm } from './search';

export type PersonaType = 'all' | 'patient' | 'mother' | 'doctor';

interface SmartPersonaSwitcherProps {
  selectedPersona: PersonaType;
  onSelectPersona: (p: PersonaType) => void;
  onOpenSpotlight: () => void;
}

export function SmartPersonaSwitcher({
  selectedPersona,
  onSelectPersona,
  onOpenSpotlight,
}: SmartPersonaSwitcherProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const { isProMode, setProMode } = useClinicalProMode();

  const handleChoosePersona = (p: PersonaType) => {
    onSelectPersona(p);
    if (p === 'doctor' && !isProMode) {
      setProMode(true);
    } else if (p === 'patient' && isProMode) {
      setProMode(false);
    }
  };

  return (
    <section
      className="card"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)',
        border: '1.5px solid #cbd5e1',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* 3 Persona Cards Grid (Matching Mockup 1) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(265px, 1fr))',
          gap: '18px',
          alignItems: 'stretch',
        }}
      >
        {/* CARD 1: Patient Mode */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '16px',
            border: selectedPersona === 'patient' ? '3px solid #0d9488' : '1.5px solid #e2e8f0',
            boxShadow: '0 12px 26px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                borderRadius: '14px',
                height: '130px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              {/* Shield + Pill SVG */}
              <svg viewBox="0 0 120 100" style={{ width: '92px', height: '82px' }}>
                <path
                  d="M60 8 L98 22 V50 C98 74 60 92 60 92 C60 92 22 74 22 50 V22 Z"
                  fill="#14b8a6"
                  stroke="#0f172a"
                  strokeWidth="4"
                />
                <rect
                  x="42"
                  y="36"
                  width="36"
                  height="18"
                  rx="9"
                  transform="rotate(-35 60 45)"
                  fill="#fbbf24"
                  stroke="#0f172a"
                  strokeWidth="3.5"
                />
                <rect
                  x="52"
                  y="48"
                  width="36"
                  height="18"
                  rx="9"
                  transform="rotate(-35 70 57)"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="3.5"
                />
              </svg>
            </div>
            <h3 style={{ textAlign: 'center', fontSize: '1.25rem', margin: '0 0 6px', color: '#0f172a' }}>
              {tr(lang, 'وضع المريض العام (Patient Mode)', 'Patient Mode')}
            </h3>
            <p className="small muted" style={{ textAlign: 'center', margin: '0 0 14px', lineHeight: 1.55 }}>
              {tr(
                lang,
                'فحص الروشتة بضغطة واحدة، منبه الجرعات الصوتي، البديل الأرخص، والروشتة الخضراء لنزلات البرد.',
                'Track prescriptions, schedules, bioequivalent cost savings, and safe family health.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              handleChoosePersona('patient');
              nav('/complete-checkup');
            }}
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 14px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            {tr(lang, 'دخول وضع المريض وفحص الروشتة ←', 'Enter Patient Mode →')}
          </button>
        </div>

        {/* CARD 2: Mother & Child Mode */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '16px',
            border: selectedPersona === 'mother' ? '3px solid #0d9488' : '1.5px solid #e2e8f0',
            boxShadow: '0 12px 26px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                borderRadius: '14px',
                height: '130px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              {/* Graduated Oral Syringe SVG */}
              <svg viewBox="0 0 120 100" style={{ width: '96px', height: '82px' }}>
                <g transform="rotate(-38 60 50)">
                  <rect x="28" y="38" width="56" height="22" rx="4" fill="#ccfbf1" stroke="#0f172a" strokeWidth="3.5" />
                  <rect x="28" y="38" width="36" height="22" fill="#14b8a6" />
                  <line x1="40" y1="38" x2="40" y2="46" stroke="#0f172a" strokeWidth="2.5" />
                  <line x1="52" y1="38" x2="52" y2="48" stroke="#0f172a" strokeWidth="2.5" />
                  <line x1="64" y1="38" x2="64" y2="46" stroke="#0f172a" strokeWidth="2.5" />
                  <rect x="84" y="43" width="18" height="12" fill="#94a3b8" stroke="#0f172a" strokeWidth="3" />
                  <line x1="102" y1="34" x2="102" y2="64" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                  <polygon points="28,44 14,47 14,51 28,54" fill="#0f172a" />
                </g>
                <circle cx="82" cy="64" r="14" fill="#fb7185" stroke="#0f172a" strokeWidth="3.5" />
              </svg>
            </div>
            <h3 style={{ textAlign: 'center', fontSize: '1.25rem', margin: '0 0 6px', color: '#0f172a' }}>
              {tr(lang, 'وضع الأم والطفل (Mother & Child)', 'Mother & Child Mode')}
            </h3>
            <p className="small muted" style={{ textAlign: 'center', margin: '0 0 14px', lineHeight: 1.55 }}>
              {tr(
                lang,
                'حاسبة شراب الأطفال بالوزن، محاكي السرنجة المدرجة، فحص الحساسية، وصلاحية الشراب بالثلاجة.',
                'Pediatric weight-based dosing, visual oral syringe simulator, allergy safety, and expiry tracking.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              handleChoosePersona('mother');
              nav('/pediatric-helper');
            }}
            style={{
              width: '100%',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 14px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            {tr(lang, 'التبديل إلى وضع الأم والطفل ←', 'Switch to Mother & Child →')}
          </button>
        </div>

        {/* CARD 3: Doctor & Pharmacist Pro Mode */}
        <div
          style={{
            background: '#0f172a',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '16px',
            border: selectedPersona === 'doctor' || isProMode ? '3px solid #14b8a6' : '1.5px solid #1e293b',
            boxShadow: '0 14px 30px rgba(15, 23, 42, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #111c33 0%, #1e293b 100%)',
                borderRadius: '14px',
                height: '130px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                border: '1px solid rgba(20, 184, 166, 0.3)',
              }}
            >
              {/* Stethoscope + PK/PD Curve SVG */}
              <svg viewBox="0 0 130 100" style={{ width: '104px', height: '82px' }}>
                <line x1="24" y1="78" x2="108" y2="78" stroke="#e2e8f0" strokeWidth="2.5" />
                <line x1="24" y1="78" x2="24" y2="18" stroke="#e2e8f0" strokeWidth="2.5" />
                <path
                  d="M 26 74 Q 44 20, 64 50 T 104 64"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="3.5"
                />
                <circle cx="20" cy="54" r="8" fill="none" stroke="#38bdf8" strokeWidth="3.5" />
                <text x="76" y="36" fill="#5eead4" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                  PK/PD
                </text>
              </svg>
            </div>
            <h3 style={{ textAlign: 'center', fontSize: '1.22rem', margin: '0 0 6px', color: '#ffffff' }}>
              {tr(lang, 'وضع الطبيب والصيدلي (Doctor Pro Mode)', 'Doctor & Pharmacist Pro Mode')}
            </h3>
            <p className="small" style={{ textAlign: 'center', margin: '0 0 14px', color: '#cbd5e1', lineHeight: 1.55 }}>
              {tr(
                lang,
                'تفعيل معايير PK/PD، جداول تعديل جرعات القصور الكلوي (CrCl)، رادار الروشتة، وخريطة المقاومة.',
                'Clinical PK/PD workflows, CrCl renal dosing cutoffs, prescription verification, and AMR surveillance.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              handleChoosePersona('doctor');
              nav('/medicines');
            }}
            style={{
              width: '100%',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 14px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            {tr(lang, 'فتح بوابة الممارس الصحي (PK/PD) ←', 'Access Pro Portal →')}
          </button>
        </div>
      </div>
    </section>
  );
}

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSpotlightModal({ isOpen, onClose }: SpotlightModalProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const quickTools = useMemo(
    () => [
      {
        to: '/complete-checkup',
        icon: '⚡',
        titleAr: 'الفحص الشامل للروشتة في خطوة واحدة (One-Click Checkup)',
        titleEn: 'One-Click Complete Prescription Checkup',
        keywords: 'فحص روشتة شامل تداخل توفير مواعيد checkup prescription all in one',
      },
      {
        to: '/pediatric-helper',
        icon: '💉',
        titleAr: 'حاسبة جرعات شراب الأطفال ومحاكي السرنجة البصري',
        titleEn: 'Pediatric Suspension Dosage & Syringe Simulator',
        keywords: 'طفل اطفال شراب سرنجة وزن كيلو pediatric syringe child dose',
      },
      {
        to: '/prescription-radar',
        icon: '🩺',
        titleAr: 'رادار الروشتة الكامل 24 ساعة وفحص التداخلات',
        titleEn: 'Full 24-Hour Prescription Interaction Radar',
        keywords: 'تداخل كالسيوم حديد لبن سيولة وارفارين radar interaction',
      },
      {
        to: '/cost-saver',
        icon: '💰',
        titleAr: 'موفر التكلفة الذكي للمثائل المصرية المتكافئة حيوياً',
        titleEn: 'Smart Bioequivalent Generic Cost Saver',
        keywords: 'بديل مثيل ارخص سعر توفير جنيه cost saver generic price',
      },
      {
        to: '/cold-shot-warning',
        icon: '🚨',
        titleAr: 'مختبر مخاطر «حقنة البرد الثلاثية 3×1»',
        titleEn: '3-in-1 Cold Shot Cocktail Hazard Lab',
        keywords: 'حقنة البرد برد كورتيزون مسكن ثلاثية cold shot',
      },
      {
        to: '/allergy-checker',
        icon: '🛡️',
        titleAr: 'فاحص الحساسية الدوائية والتفاعلات المتصالبة (R1 Matrix)',
        titleEn: 'Beta-Lactam Allergy & Cross-Reactivity Matrix',
        keywords: 'حساسية بنسلين سيفالوسبورين طفح allergy penicillin',
      },
      {
        to: '/tracker',
        icon: '🔔',
        titleAr: 'منبه الجرعات الصوتي الحي ومتتبع إتمام الكورس (7 أيام)',
        titleEn: 'Live Smart Voice Dose Alarm & 7-Day Course Tracker',
        keywords: 'منبه جرس صوت مواعيد كورس التزام alarm voice tracker',
      },
      {
        to: '/partners',
        icon: '🏥',
        titleAr: 'دليل الصيدليات المعتمدة وشركاء الرعاية في 27 محافظة',
        titleEn: 'Verified Pharmacy Network & Healthcare Partners',
        keywords: 'صيدلية صيدليات فروع توصيل محافظة pharmacy partners',
      },
    ],
    []
  );

  const filteredTools = useMemo(() => {
    const q = norm(query);
    if (!q) return quickTools.slice(0, 5);
    return quickTools.filter((item) => norm(`${item.titleAr} ${item.titleEn} ${item.keywords}`).includes(q));
  }, [query, quickTools]);

  const filteredMeds = useMemo(() => {
    const q = norm(query);
    if (!q) return EGYPTIAN_COMMERCIAL_PRODUCTS.slice(0, 5);
    return EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) =>
      norm(`${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.barcode || ''}`).includes(q)
    ).slice(0, 6);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 16px 24px',
      }}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#ffffff',
          borderRadius: '22px',
          border: '2px solid #0d9488',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <span style={{ fontSize: '1.35rem' }}>🔍</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr(
              lang,
              'ابحث باسم الدواء، الباركود (622)، وزن الطفل، أو الأداة الإكلينيكية...',
              'Type a medication, barcode (622), child weight, or clinical tool...'
            )}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#0f172a',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '8px',
              padding: '5px 10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ESC ✕
          </button>
        </div>

        <div style={{ maxHeight: '68vh', overflowY: 'auto', padding: '16px 20px' }}>
          {/* Clinical Tools Matches */}
          <div style={{ marginBottom: '16px' }}>
            <div className="small muted" style={{ fontWeight: 800, marginBottom: '8px' }}>
              ⚡ {tr(lang, 'الأدوات الإكلينيكية والذكية السريعة:', 'Quick Clinical & Smart Tools:')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredTools.map((tool) => (
                <button
                  key={tool.to}
                  type="button"
                  onClick={() => {
                    onClose();
                    nav(tool.to);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    {tool.icon} {isAr ? tool.titleAr : tool.titleEn}
                  </span>
                  <span style={{ color: '#0d9488', fontWeight: 800 }}>{isAr ? 'فتح ←' : 'Open →'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Medications Matches */}
          <div>
            <div className="small muted" style={{ fontWeight: 800, marginBottom: '8px' }}>
              💊 {tr(lang, 'المستحضرات الدوائية المصرية المطابقة (206 عبوات):', 'Matching Egyptian Medications (206 Packages):')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredMeds.map((pkg) => (
                <div
                  key={pkg.productId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <b style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                      {isAr ? pkg.tradeNameAr : pkg.tradeNameEn} ({pkg.strength})
                    </b>
                    <div className="small muted">
                      {pkg.scientificComposition} · {pkg.priceEgp ? `${pkg.priceEgp} EGP` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        nav(`/complete-checkup?med=${encodeURIComponent(pkg.activeIngredientId)}`);
                      }}
                      style={{
                        background: '#0d9488',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ {tr(lang, 'فحص شامل', '1-Click Checkup')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        nav(`/medicine/${pkg.activeIngredientId}`);
                      }}
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      📘 {tr(lang, 'البطاقة', 'Monograph')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
