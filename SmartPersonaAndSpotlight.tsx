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
}: SmartPersonaSwitcherProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { isProMode, setProMode } = useClinicalProMode();

  const handleChoosePersona = (p: PersonaType) => {
    onSelectPersona(p);
    if (p === 'doctor' && !isProMode) {
      setProMode(true);
    } else if ((p === 'patient' || p === 'mother') && isProMode) {
      setProMode(false);
    }
  };

  const tabs: { id: PersonaType; icon: string; ar: string; en: string; descAr: string; descEn: string }[] = [
    {
      id: 'all',
      icon: '✨',
      ar: 'كل الأدوات',
      en: 'All Tools',
      descAr: 'عرض أهم الأدوات الإكلينيكية والتمريضية والتوعوية في المنصة',
      descEn: 'Showing top clinical, nursing, and patient safety tools',
    },
    {
      id: 'patient',
      icon: '🛡️',
      ar: 'وضع المريض',
      en: 'Patient Mode',
      descAr: 'أدوات المريض: الفحص الشامل للروشتة، المثيل الأرخص، الروشتة الخضراء، ومنبه الجرعات',
      descEn: 'Patient tools: 1-Click Checkup, Generic Cost Saver, Green Prescription & Dose Tracker',
    },
    {
      id: 'mother',
      icon: '👶',
      ar: 'الأم والطفل',
      en: 'Mother & Child',
      descAr: 'أدوات الأم والطفل: حاسبة شراب الأطفال بالسرنجة، فاحص الحساسية، الروشتة الخضراء، والألعاب',
      descEn: 'Mother & Child tools: Pediatric Syringe Calculator, Allergy Checker, Green Rx & Games',
    },
    {
      id: 'doctor',
      icon: '🩺',
      ar: 'الطبيب والصيدلي (PK/PD)',
      en: 'Doctor & Pharmacist',
      descAr: 'تم تفعيل وضع الممارس الصحي (PK/PD & CrCl): السجل الدوائي، رادار الروشتة 24س، والمحاكي 3D',
      descEn: 'Clinical Pro Mode (PK/PD & CrCl) active: Drug Registry, 24h Rx Radar & 3D Hospital Simulator',
    },
  ];

  const activeTabObj = tabs.find((t) => t.id === selectedPersona) || tabs[0];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '18px',
        padding: '12px 14px',
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: '8px',
        }}
      >
        {tabs.map((tab) => {
          const active = selectedPersona === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleChoosePersona(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 10px',
                borderRadius: '12px',
                background: active
                  ? tab.id === 'doctor'
                    ? '#0f172a'
                    : '#0d9488'
                  : '#f1f5f9',
                color: active ? '#ffffff' : '#0f172a',
                border: active ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{isAr ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </div>
      <div
        className="small"
        style={{
          marginTop: '8px',
          textAlign: 'center',
          color: selectedPersona === 'doctor' ? '#0f766e' : '#475569',
          fontWeight: 700,
        }}
      >
        {isAr ? activeTabObj.descAr : activeTabObj.descEn}
      </div>
    </div>
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
