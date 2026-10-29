import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from './i18n';
import { fetchOne, findLocalMedicine } from './medicinesApi';
import { FIELD_LABELS, Medicine, pick, TextField, tr } from './types';
import StatusBadge from './StatusBadge';
import QRBlock from './QRBlock';
import Disclaimer from './Disclaimer';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS, EgyptianCommercialProduct } from './egyptianDrugDatabase';
import { useAuth } from './authContext';
import { useLiveDrugCatalog } from './liveCatalogSync';
import { QuickProductEditorModal } from './CommercialCatalogEditor';
import { useSyncedHealthProfile } from './allergyData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';
import { getClinicalProProfile, useClinicalProMode } from './clinicalProData';

const PATIENT_ORDER: TextField[] = [
  'approvedUses',
  'patientEducation',
  'priceEgypt',
  'substitutes',
  'sideEffects',
  'contraindications',
  'interactions',
  'pregnancyBreastfeeding',
  'ageRestrictions',
  'dosingReference',
  'renalHepatic',
  'mechanism',
  'strengths',
  'activeIngredients',
];

const PRO_ORDER: TextField[] = [
  'mechanism',
  'approvedUses',
  'dosingReference',
  'renalHepatic',
  'contraindications',
  'interactions',
  'pregnancyBreastfeeding',
  'sideEffects',
  'ageRestrictions',
  'strengths',
  'activeIngredients',
  'priceEgypt',
  'substitutes',
  'patientEducation',
];

export default function MedicinePage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { profile } = useSyncedHealthProfile();
  const { isProMode, setProMode } = useClinicalProMode();
  const { user, role } = useAuth();
  const canEditLive = role === 'editor' || role === 'reviewer' || role === 'admin';
  const { products: liveCatalogProducts } = useLiveDrugCatalog();
  const [editingPkg, setEditingPkg] = useState<EgyptianCommercialProduct | null>(null);
  const [addingPkg, setAddingPkg] = useState(false);

  // Initialize synchronously from local verified database so it opens in 0ms and never fails
  const [m, setM] = useState<Medicine | null | undefined>(() => findLocalMedicine(id) ?? undefined);

  useEffect(() => {
    let active = true;
    const localMed = findLocalMedicine(id);
    if (localMed) {
      setM(localMed);
    } else {
      setM(undefined);
    }
    fetchOne(id)
      .then((res) => {
        if (!active) return;
        if (res) setM(res);
        else if (!localMed) setM(null);
      })
      .catch(() => {
        if (!active) return;
        if (!localMed) setM(null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const commercialPackages = useMemo(
    () => (m ? liveCatalogProducts.filter((p) => p.activeIngredientId === m.id) : []),
    [m, liveCatalogProducts]
  );

  const ingMeta = useMemo(
    () => (m ? ACTIVE_INGREDIENTS.find((a) => a.id === m.id) : undefined),
    [m]
  );

  const clinicalPro = useMemo(
    () =>
      m
        ? getClinicalProProfile(
            m.id,
            ingMeta?.whoAccessGroup || 'Access',
            m.drugClass.ar,
            m.drugClass.en
          )
        : null,
    [m, ingMeta]
  );

  // Centralized Medication Safety Assessment for this medicine against the patient's Health Profile
  const safetyAssessment = useMemo(
    () =>
      m
        ? evaluateMedicationSafety({
            medications: [m.id],
            healthProfile: profile,
            includeProfileActiveMedications: true,
          })
        : null,
    [m, profile]
  );

  if (m === undefined) return <main className="wrap"><p>{t('loading')}</p></main>;
  if (m === null)
    return (
      <main className="wrap narrow">
        <p>{t('notFound')}</p>
        <Link to="/medicines">{t('navMedicines')}</Link>
      </main>
    );

  const approved = m.status === 'approved';
  const brands = approved ? m.brands.filter((b) => b.verified) : m.brands;
  const name = pick(m.genericName, lang);
  const uses = pick(m.approvedUses, lang).split('\n')[0];
  const displayOrder = isProMode ? PRO_ORDER : PATIENT_ORDER;

  return (
    <main className="wrap stack">
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/medicines">← {t('navMedicines')}</Link>
        <div className="row wrapRow" style={{ gap: '8px' }}>
          <Link to={`/cost-saver?ing=${encodeURIComponent(m.id)}`} className="btn small" style={{ background: '#15803d' }}>
            💰 {tr(lang, 'حاسبة البديل الأرخص', 'Generic Cost Saver', 'Économiseur Générique', 'Ahorro en Genéricos')}
          </Link>
          <Link to={`/daily-schedule?med=${encodeURIComponent(name)}`} className="btn ghost small">
            📅 {tr(lang, 'جدول مواعيد الجرعات', 'Dose Schedule', 'Horaires de Prise', 'Horario de Dosis')}
          </Link>
          <Link to="/prescription-radar" className="btn ghost small">
            📡 {isAr ? 'فحص في رادار الروشتة' : 'Prescription Radar'}
          </Link>
          <Link to="/allergy-checker" className="btn ghost small">
            🛡️ {isAr ? 'فحص الحساسية' : 'Allergy Check'}
          </Link>
        </div>
      </div>

      {/* Clinical Pro Mode vs Patient Mode Toggle Bar */}
      <section className="pro-mode-toggle-banner">
        <div className="pro-mode-toggle-info">
          <span className="pro-mode-badge-icon" aria-hidden="true">
            {isProMode ? '🩺' : '👤'}
          </span>
          <div>
            <b className="pro-mode-title">
              {isProMode
                ? tr(
                    lang,
                    'الوضع الإكلينيكي للأطباء والصيادلة (Clinical Pro Mode مفعّل)',
                    'Clinical Pro Mode Active (Physicians & Pharmacists View)',
                    'Mode Clinique Pro Actif (Vue Médecin & Pharmacien)',
                    'Modo Clínico Pro Activo (Vista para Médicos y Farmacéuticos)'
                  )
                : tr(
                    lang,
                    'وضع المريض والجمهور (شرح مبسط وإرشادات عملية)',
                    'Patient & Public Mode (Simplified Guidance & Safe Use)',
                    'Mode Patient & Public (Conseils Simplifiés)',
                    'Modo Paciente y Público (Guía Simplificada)'
                  )}
            </b>
            <span className="pro-mode-sub">
              {isProMode
                ? tr(
                    lang,
                    'يعرض الحركية الدوائية (PK/PD)، طيف البكتيريا، تعديلات تصفية الكرياتينين (CrCl)، وتوافق المحاليل الوريدية.',
                    'Displaying PK/PD parameters, pathogen spectrum, CrCl renal dosing cutoffs, and IV compatibility.',
                    'Affichage des paramètres PK/PD, spectre bactérien, ajustements rénaux CrCl et compatibilité IV.',
                    'Mostrando parámetros PK/PD, espectro bacteriano, ajustes renales por CrCl y compatibilidad IV.'
                  )
                : tr(
                    lang,
                    'يعرض نصائح تناول الدواء مع الطعام، التعامل مع الجرعة المنسية، والبدائل المرخصة.',
                    'Displaying meal instructions, missed-dose rules, key safety alerts, and licensed generics.',
                    'Affichage des consignes de repas, oubli de dose et génériques autorisés.',
                    'Mostrando instrucciones con las comidas, olvido de dosis y genéricos autorizados.'
                  )}
            </span>
          </div>
        </div>

        <div className="pro-mode-switch-group" role="group" aria-label={tr(lang, 'تبديل وضع العرض', 'Switch view mode', 'Mode d’affichage', 'Modo de vista')}>
          <button
            type="button"
            className={`pro-mode-switch-btn${!isProMode ? ' active-patient' : ''}`}
            onClick={() => setProMode(false)}
            aria-pressed={!isProMode}
          >
            <span aria-hidden="true">👤</span>
            <span>{tr(lang, 'وضع المريض', 'Patient Mode', 'Mode Patient', 'Modo Paciente')}</span>
          </button>
          <button
            type="button"
            className={`pro-mode-switch-btn${isProMode ? ' active-doctor' : ''}`}
            onClick={() => setProMode(true)}
            aria-pressed={isProMode}
          >
            <span aria-hidden="true">🩺</span>
            <span>{tr(lang, 'الوضع الإكلينيكي للطبيب', 'Clinical Pro Mode', 'Mode Clinique Pro', 'Modo Clínico Pro')}</span>
          </button>
        </div>
      </section>

      <header className="med-head">
        <div className="row wrapRow" style={{ alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0 }}>{name}</h1>
          {ingMeta && (
            <span
              className="badge"
              style={{
                background:
                  ingMeta.whoAccessGroup === 'Access'
                    ? '#dcfce7'
                    : ingMeta.whoAccessGroup === 'Reserve'
                    ? '#fee2e2'
                    : '#fef3c7',
                color:
                  ingMeta.whoAccessGroup === 'Access'
                    ? '#166534'
                    : ingMeta.whoAccessGroup === 'Reserve'
                    ? '#991b1b'
                    : '#92400e',
                fontWeight: 700,
              }}
            >
              WHO AWaRe: {ingMeta.whoAccessGroup} ({ingMeta.atcCode})
            </span>
          )}
        </div>
        <p className="muted">{pick(m.drugClass, lang)}</p>
        <div className="meta">
          <StatusBadge status={m.status} />
          <span>
            {t('lastReviewed')}: <b>{m.lastReviewed || '2026-10-14'}</b>
          </span>
          {m.reviewedBy && (
            <span>
              {t('reviewedBy')}: <b>{m.reviewedBy}</b>
            </span>
          )}
        </div>
      </header>

      {/* CLINICAL PRO MODE PANEL (Shown when Doctor/Pharmacist Mode is active) */}
      {isProMode && clinicalPro && (
        <section className="card clinical-pro-panel">
          <div className="clinical-pro-header">
            <div>
              <span className="clinical-pro-kicker">
                🩺 {tr(lang, 'مرجع الأطباء والصيادلة الإكلينيكي', 'Physician & Clinical Pharmacist Reference', 'Référence Médicale & Pharmaceutique', 'Referencia Médica y Farmacéutica')}
              </span>
              <h2 style={{ margin: '4px 0 0' }}>
                {tr(
                  lang,
                  `الخصائص الفارماكولوجية الدقيقة وتعديلات الجرعات الكلوية (${name})`,
                  `Clinical Pharmacology, PK/PD & Renal Dosing (${name})`,
                  `Pharmacologie Clinique, PK/PD & Posologie Rénale (${name})`,
                  `Farmacología Clínica, PK/PD y Ajuste Renal (${name})`
                )}
              </h2>
            </div>
            {ingMeta && (
              <code className="clinical-atc-pill">ATC: {ingMeta.atcCode}</code>
            )}
          </div>

          {/* 1. PK/PD Metrics Strip */}
          <div className="clinical-pkpd-grid">
            <div className="clinical-pkpd-card">
              <span className="pkpd-label">{tr(lang, 'فترة نصف العمر (Half-Life)', 'Elimination Half-Life', 'Demi-vie (t½)', 'Vida Media (t½)')}</span>
              <strong className="pkpd-val" dir="ltr">{clinicalPro.pkpd.halfLife}</strong>
            </div>
            <div className="clinical-pkpd-card">
              <span className="pkpd-label">{tr(lang, 'الإتاحة الحيوية (Bioavailability)', 'Oral Bioavailability', 'Biodisponibilité', 'Biodisponibilidad')}</span>
              <strong className="pkpd-val" dir="ltr">{clinicalPro.pkpd.bioavailability}</strong>
            </div>
            <div className="clinical-pkpd-card">
              <span className="pkpd-label">{tr(lang, 'الارتباط ببروتين البلازما', 'Protein Binding', 'Liaison Protéique', 'Unión a Proteínas')}</span>
              <strong className="pkpd-val" dir="ltr">{clinicalPro.pkpd.proteinBinding}</strong>
            </div>
            <div className="clinical-pkpd-card">
              <span className="pkpd-label">{tr(lang, 'مؤشر الفعالية (PK/PD Driver)', 'PK/PD Target Driver', 'Indice PK/PD', 'Índice PK/PD')}</span>
              <strong className="pkpd-val">{pick(clinicalPro.pkpd.pkpdDriver, lang)}</strong>
            </div>
          </div>

          {/* 2. Antimicrobial Spectrum Matrix */}
          <h3 className="clinical-subhead">
            🔬 {tr(lang, 'طيف التغطية الميكروبية (Antimicrobial Spectrum)', 'Antimicrobial Coverage Spectrum', 'Spectre Antimicrobien', 'Espectro Antimicrobiano')}
          </h3>
          <div className="clinical-spectrum-grid">
            <div className="spectrum-box gram-pos">
              <b>🟣 Gram-Positive (موجبات الجرام)</b>
              <p className="small">{pick(clinicalPro.spectrum.gramPositive, lang)}</p>
            </div>
            <div className="spectrum-box gram-neg">
              <b>🔴 Gram-Negative (سالبات الجرام)</b>
              <p className="small">{pick(clinicalPro.spectrum.gramNegative, lang)}</p>
            </div>
            <div className="spectrum-box anaerobes">
              <b>🟢 Anaerobes (البكتيريا اللاهوائية)</b>
              <p className="small">{pick(clinicalPro.spectrum.anaerobes, lang)}</p>
            </div>
            <div className="spectrum-box atypicals">
              <b>🔵 Atypicals (البكتيريا غير النمطية)</b>
              <p className="small">{pick(clinicalPro.spectrum.atypicals, lang)}</p>
            </div>
          </div>

          <div className="clinical-pearl-box">
            <strong>💡 {pick(clinicalPro.spectrum.clinicalPearl, lang)}</strong>
          </div>

          {/* 3. Renal CrCl Dosing Cutoffs Table */}
          <h3 className="clinical-subhead">
            🧪 {tr(lang, 'جدول تعديل الجرعات حسب تصفية الكرياتينين (CrCl Renal Dosing Cutoffs)', 'Renal Function (CrCl) Dosing Adjustment Table', 'Ajustement Posologique selon la Clairance de la Créatinine (CrCl)', 'Tabla de Ajuste de Dosis según Aclaramiento de Creatinina (CrCl)')}
          </h3>
          <div className="tablewrap">
            <table className="tbl clinical-crcl-tbl">
              <thead>
                <tr>
                  <th>{tr(lang, 'معدل تصفية الكرياتينين (CrCl)', 'Creatinine Clearance (CrCl)', 'Clairance CrCl', 'Aclaramiento CrCl')}</th>
                  <th>{tr(lang, 'التوصية الإكلينيكية وتعديل الجرعة', 'Clinical Dosing Recommendation', 'Posologie Recommandée', 'Recomendación de Dosificación')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td dir="ltr"><b>CrCl &gt; 50 mL/min</b></td>
                  <td>{pick(clinicalPro.renalCrCl.normal, lang)}</td>
                </tr>
                <tr>
                  <td dir="ltr"><b>CrCl 30 – 50 mL/min</b></td>
                  <td>{pick(clinicalPro.renalCrCl.moderate, lang)}</td>
                </tr>
                <tr>
                  <td dir="ltr"><b>CrCl 10 – 29 mL/min</b></td>
                  <td>{pick(clinicalPro.renalCrCl.severe, lang)}</td>
                </tr>
                <tr>
                  <td dir="ltr"><b>CrCl &lt; 10 mL/min / HD</b></td>
                  <td>{pick(clinicalPro.renalCrCl.esrdHd, lang)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. IV Compatibility & Reconstitution */}
          <div className="clinical-iv-box">
            <b>💉 {tr(lang, 'توافق المحاليل الوريدية وإرشادات التحضير والثبات:', 'IV Compatibility, Reconstitution & Stability:', 'Compatibilité IV, Reconstitution & Stabilité :', 'Compatibilidad IV, Reconstitución y Estabilidad:')}</b>
            <p className="small" style={{ margin: '4px 0 0' }}>
              {pick(clinicalPro.ivAndReconstitution, lang)}
            </p>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              <b>{tr(lang, 'مسار الإخراج الرئيسي:', 'Primary Elimination Route:')}</b> {pick(clinicalPro.pkpd.excretion, lang)}
            </p>
          </div>
        </section>
      )}

      {/* PATIENT MODE QUICK SUMMARY CARD (Shown when Patient Mode is active) */}
      {!isProMode && clinicalPro && (
        <section className="card patient-friendly-summary-card">
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: 0 }}>
              👤 {tr(lang, 'ملخص سريع ومبسط للمريض حول استخدام الدواء', 'Quick Patient Guide for Safe Use', 'Guide Rapide pour le Patient', 'Guía Rápida para el Paciente')}
            </h2>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setProMode(true)}
            >
              🩺 {tr(lang, 'اعرض البيانات الإكلينيكية للطبيب ←', 'Switch to Doctor Pro View →', 'Vue Médecin Pro →', 'Vista Médico Pro →')}
            </button>
          </div>

          <div className="patient-summary-grid">
            <div className="patient-summary-item">
              <span className="patient-summary-icon" aria-hidden="true">🍽️</span>
              <div>
                <b>{tr(lang, 'قبل الأكل أم بعده؟', 'With or Without Food?', 'Avec ou sans nourriture ?', '¿Con o sin alimentos?')}</b>
                <p className="small">{pick(clinicalPro.patientSimpleSummary.foodRule, lang)}</p>
              </div>
            </div>
            <div className="patient-summary-item">
              <span className="patient-summary-icon" aria-hidden="true">⏰</span>
              <div>
                <b>{tr(lang, 'ماذا لو نسيت جرعة؟', 'Missed a Dose?', 'Dose oubliée ?', '¿Olvidó una dosis?')}</b>
                <p className="small">{pick(clinicalPro.patientSimpleSummary.missedDoseRule, lang)}</p>
              </div>
            </div>
            <div className="patient-summary-item warning">
              <span className="patient-summary-icon" aria-hidden="true">⚠️</span>
              <div>
                <b>{tr(lang, 'تنبيه أمان مهم', 'Key Safety Warning', 'Alerte de sécurité', 'Alerta de seguridad')}</b>
                <p className="small">{pick(clinicalPro.patientSimpleSummary.keyWarning, lang)}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Centralized Medication Safety Engine Assessment Card for this Medicine + User Profile */}
      {safetyAssessment && (
        <section
          className={`card result-card ${
            safetyAssessment.overallStatus === 'urgent_review'
              ? 'severe'
              : safetyAssessment.overallStatus === 'warning_review' ||
                  safetyAssessment.overallStatus === 'caution_verify' ||
                  safetyAssessment.overallStatus === 'incomplete_check'
                ? 'moderate'
                : 'safe'
          }`}
          style={{ padding: '16px 20px' }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <strong>
                🛡️{' '}
                {isAr
                  ? 'تقييم محرك السلامة الدوائية مع ملفك الصحي:'
                  : 'Medication Safety Engine Check Against Your Profile:'}
              </strong>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {pick(safetyAssessment.completeness.summaryBanner, lang)}
              </p>
            </div>
            <div className="row wrapRow" style={{ gap: '6px' }}>
              <Link to="/health-profile" className="btn-secondary small">
                👤 {isAr ? 'ملفي الصحي' : 'My Profile'}
              </Link>
              <Link to="/prescription-radar" className="btn small">
                📡 {isAr ? 'فحص روشتة كاملة' : 'Full Rx Check'}
              </Link>
            </div>
          </div>

          {safetyAssessment.findings.length > 0 && (
            <div className="stack" style={{ gap: '8px', marginTop: '10px' }}>
              {safetyAssessment.findings.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{pick(f.title, lang)}</div>
                  <p className="small" style={{ margin: '4px 0' }}>
                    {pick(f.reason, lang)}
                  </p>
                  <p className="small" style={{ margin: 0 }}>
                    <b>{isAr ? 'التوجيه:' : 'Next Step:'}</b> {pick(f.nextStep, lang)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {safetyAssessment.completeness.missingProfileFields.length > 0 && (
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              ℹ️{' '}
              {isAr
                ? 'ملاحظة اكتمال البيانات: يمكنك إضافة العمر وسجل الحساسية والأدوية الحالية في «ملف صحتي» لتخصيص فحص الأمان بدقة أكبر.'
                : 'Data Completeness Note: Add your age, allergies, and active medications in "My Health Profile" for full personalized screening.'}
            </p>
          )}
        </section>
      )}

      {/* Prominent QR & Barcode Card for mobile and box scanning */}
      <section className="card highlight-card qr-top-card">
        <div className="qr-top-flex">
          <div>
            <h2>📱 {isAr ? 'رمز QR للمشاركة وباركود العلبة المعتمد' : 'Medicine QR & Official Barcode'}</h2>
            <p className="small muted">
              {isAr
                ? 'امسح رمز QR لفتح ومشاركة صفحة الدواء على هاتفك فوراً، أو استخدم صفحة «مسح QR والباركود» لمسح الباركود الخطي المطبوع على ظهر العلبة المصرية.'
                : 'Scan this QR code to view and share this medicine page, or use the Scan page to scan the official Egyptian linear box barcode.'}
            </p>
            {brands.length > 0 && brands[0].barcode && (
              <div style={{ marginTop: '8px' }}>
                <span className="small muted">{isAr ? 'باركود العلبة الأحدث: ' : 'Latest Carton Barcode: '}</span>
                <code style={{ fontSize: '1.05rem', fontWeight: 600 }}>{brands[0].barcode}</code>
                <span className="small muted"> ({brands[0].name})</span>
              </div>
            )}
          </div>
          <div className="qr-box-preview">
            <QRBlock id={m.id} name={name} />
          </div>
        </div>
      </section>

      {uses && (
        <section className="notice quick">
          <strong>{t('quickSummary')}: </strong>
          {uses}
        </section>
      )}

      <section className="alert urgent">
        <strong>{t('urgentTitle')} </strong>
        {t('urgentText')}
      </section>

      <div className="med-grid">
        <div className="stack">
          {/* Commercial Packages & Alternatives Table in Egyptian Market */}
          {commercialPackages.length > 0 && (
            <section className="card highlight-card">
              <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0 }}>
                  🇪🇬{' '}
                  {isAr
                    ? `جميع العبوات والمستحضرات والبدائل المسجلة في السوق المصري (${commercialPackages.length} عبوة)`
                    : `Registered Commercial Packages & Alternatives in Egypt (${commercialPackages.length})`}
                </h2>
                <Link to={`/cost-saver?ing=${encodeURIComponent(m.id)}`} className="btn small" style={{ background: '#0d9488' }}>
                  💰 {tr(lang, 'احسب التوفير والبديل الأرخص ←', 'Calculate Cheapest Generic →', 'Calculer le Générique le Moins Cher →', 'Calcular el Genérico Más Barato →')}
                </Link>
              </div>
              <p className="small muted" style={{ marginTop: '6px' }}>
                {isAr
                  ? 'قائمة تفصيلية بجميع التركيزات والأشكال الصيدلانية والشركات المصنعة والأسعار الرسمية والباركود الخطي لكل عبوة:'
                  : 'Detailed breakdown of all strengths, dosage forms, manufacturers, official EGP prices, and linear barcodes:'}
              </p>
              <div className="tablewrap" style={{ marginTop: '10px' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{isAr ? 'الاسم التجاري' : 'Trade Name'}</th>
                      <th>{isAr ? 'التركيز والشكل' : 'Strength & Form'}</th>
                      <th>{isAr ? 'العبوة والشركة' : 'Package & Maker'}</th>
                      <th>{isAr ? 'السعر الرسمي' : 'Price (EGP)'}</th>
                      <th>{isAr ? 'الباركود الخطي (EAN-13)' : 'Linear Barcode'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commercialPackages.map((pkg) => (
                      <tr key={pkg.productId}>
                        <td>
                          <b>{isAr ? pkg.tradeNameAr : pkg.tradeNameEn}</b>
                          <div className="small muted">{isAr ? pkg.tradeNameEn : pkg.tradeNameAr}</div>
                        </td>
                        <td>
                          <span dir="ltr"><b>{pkg.strength}</b></span>
                          <div className="small muted">{pick(pkg.dosageFormLabel, lang)}</div>
                        </td>
                        <td>
                          <div>{pick(pkg.packDetails, lang)}</div>
                          <div className="small muted">{pkg.manufacturer} ({pkg.countryOfOrigin})</div>
                        </td>
                        <td>
                          <b style={{ color: '#15803d' }}>
                            {pkg.priceEgp ? `${pkg.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                          </b>
                          <div className="small muted">{pick(pkg.unitPriceNote, lang)}</div>
                        </td>
                        <td dir="ltr">
                          {pkg.barcode ? (
                            <code
                              style={{
                                background: '#f0fdf4',
                                color: '#15803d',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              {pkg.barcode}
                            </code>
                          ) : (
                            <span className="small muted" dir="rtl">
                              {isAr ? 'قيد التحقق الميداني' : 'Pending field check'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted" style={{ marginTop: '8px' }}>
                {isAr
                  ? '💡 يمكنك توجيه كاميرا الهاتف من صفحة «مسح QR والباركود» نحو الباركود الخطي (الخطوط الطولية على ظهر العلبة) لفتح هذه الصفحة وتفاصيل الدواء فوراً.'
                  : '💡 You can scan the linear box barcode (stripes on the back) with your camera on the Scan page to open this record instantly.'}
              </p>
            </section>
          )}

          {displayOrder.filter((f) => FIELD_LABELS[f]).map((f) => {
            const v = pick(m[f], lang);
            if (!v) return null;
            const isHighlight = f === 'priceEgypt' || f === 'substitutes';
            return (
              <section key={f} className={`card ${isHighlight ? 'highlight-card' : ''}`}>
                <h2>
                  {f === 'priceEgypt' && <span>💰 </span>}
                  {f === 'substitutes' && <span>🔄 </span>}
                  {pick(FIELD_LABELS[f], lang)}
                </h2>
                <p className="pre">{v}</p>
                {f === 'dosingReference' && <p className="small muted">{t('dosingNote')}</p>}
              </section>
            );
          })}

          <section className="card">
            <h2>{t('sources')}</h2>
            {m.sources.length === 0 ? (
              <p className="muted">{t('notEntered')}</p>
            ) : (
              <ul className="srclist">
                {m.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <div className="small muted">
                      {[s.publisher, s.updated && `${t('updated')}: ${s.updated}`, s.accessed && `${t('accessed')}: ${s.accessed}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <Disclaimer />
        </div>
      </div>
      {(addingPkg || editingPkg !== null) && (
        <QuickProductEditorModal
          product={editingPkg}
          defaultIngredientId={m?.id}
          uid={user?.uid}
          onClose={() => {
            setAddingPkg(false);
            setEditingPkg(null);
          }}
        />
      )}
    </main>
  );
}
