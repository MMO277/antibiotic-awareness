import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { pick } from './types';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import {
  useSyncedHealthProfile,
  checkDrugAllergySafety,
  DRUG_ALLERGEN_MAP,
  AllergyRecord,
  DrugProfileCheckResult,
} from './allergyData';
import { evaluateMedicationSafety } from './medicationSafetyEngine';

export default function AllergyChecker() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { items } = useApproved();
  const meds = items ?? [];

  const { profile } = useSyncedHealthProfile();
  const [selectedDrugId, setSelectedDrugId] = useState('amoxicillin-clavulanic-acid');
  const [customDrugQuery, setCustomDrugQuery] = useState('');
  const [simulatedAllergy, setSimulatedAllergy] = useState<string | null>(null);

  // Determine active allergies list (either real profile or quick simulation)
  const activeAllergies = useMemo<AllergyRecord[]>(() => {
    if (simulatedAllergy === 'penicillin') {
      return [
        {
          id: 'sim-pen',
          drugName: 'بنسلين / أموكسيسيلين',
          allergenKey: 'penicillin',
          reportedSymptoms: 'طفح جلدي شديد وتورم في الشفتين',
          severity: 'severe',
          evidenceStatus: 'patient_reported',
          createdAt: '2026-10-14T00:00:00.000Z',
        },
      ];
    }
    if (simulatedAllergy === 'sulfa') {
      return [
        {
          id: 'sim-sulfa',
          drugName: 'مركبات السلفا (سبتازول)',
          allergenKey: 'sulfa',
          reportedSymptoms: 'حساسية جلدية شديدة وضيق تنفس',
          severity: 'life_threatening',
          evidenceStatus: 'clinically_verified',
          createdAt: '2026-10-14T00:00:00.000Z',
        },
      ];
    }
    return profile.allergies;
  }, [simulatedAllergy, profile.allergies]);

  const effectiveInput = customDrugQuery.trim() || selectedDrugId;

  const result: DrugProfileCheckResult = useMemo(
    () => checkDrugAllergySafety(effectiveInput, activeAllergies),
    [effectiveInput, activeAllergies]
  );

  // Run the centralized Medication Safety Engine to surface unified ingredient resolution,
  // duplicate/overlap checks with active profile meds, and profile contraindications
  const safetyAssessment = useMemo(
    () =>
      evaluateMedicationSafety({
        medications: [effectiveInput],
        healthProfile: {
          ...profile,
          allergies: activeAllergies,
        },
        includeProfileActiveMedications: true,
      }),
    [effectiveInput, profile, activeAllergies]
  );

  const primaryResolved = safetyAssessment.resolvedMedications[0];
  const resolvedMedId = result.resolvedDrugId || primaryResolved?.activeIngredientId || selectedDrugId;
  const currentMedObj = meds.find((m) => m.id === resolvedMedId);

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>🛡️ {isAr ? 'فاحص الحساسية والأمان الدوائي الذكي' : 'Smart Allergy & Medication Safety Checker'}</h1>
        <p className="muted">
          {isAr
            ? 'نظام أمان سريري يفحص المادة الفعالة للدواء (سواء بالاسم العلمي أو التجاري المصري أو المستحضرات المركبة) ويقارنها مع سجل حساسيتك الدوائية وأدويتك الحالية، ويكشف احتمالات الحساسية المتصالبة (Cross-Reactivity).'
            : 'Clinical safety system matching active drug ingredients and commercial brands against your documented allergies, cross-reactivity rules, and active health profile.'}
        </p>
      </header>

      {/* Patient Profile Context Header */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>👤 {isAr ? 'سجل الحساسية النشط للفحص:' : 'Active Patient Allergy Record:'}</h2>
            <p className="small muted">
              {activeAllergies.length > 0
                ? isAr
                  ? `يوجد ${activeAllergies.length} أدوية مسجلة تسبب حساسية: ${activeAllergies.map((a) => a.drugName).join(' ، ')}`
                  : `${activeAllergies.length} documented allergies: ${activeAllergies.map((a) => a.drugName).join(', ')}`
                : isAr
                  ? 'لم تسجل أي حساسية دوائية في ملفك الشخصي حتى الآن.'
                  : 'No documented drug allergies in your profile yet.'}
            </p>
          </div>
          <Link to="/health-profile" className="btn-secondary">
            📋 {isAr ? 'فتح ملف صحتي وتعديل الحساسية' : 'Open My Health Profile'}
          </Link>
        </div>

        {/* Quick Simulation Chips */}
        <div className="sim-chips-bar">
          <small className="muted">
            <b>{isAr ? 'أو جرب سيناريو سريري سريع:' : 'Or Try a Clinical Scenario:'}</b>
          </small>
          <div className="chips">
            <button
              type="button"
              className={`chip ${simulatedAllergy === 'penicillin' ? 'active-chip' : ''}`}
              onClick={() => setSimulatedAllergy('penicillin')}
            >
              🧪 {isAr ? 'سيناريو: مريض لديه حساسية بنسلين' : 'Scenario: Penicillin Allergic Patient'}
            </button>
            <button
              type="button"
              className={`chip ${simulatedAllergy === 'sulfa' ? 'active-chip' : ''}`}
              onClick={() => setSimulatedAllergy('sulfa')}
            >
              🧪 {isAr ? 'سيناريو: مريض لديه حساسية مركبات السلفا' : 'Scenario: Sulfa Allergic Patient'}
            </button>
            {simulatedAllergy && (
              <button
                type="button"
                className="chip"
                onClick={() => setSimulatedAllergy(null)}
              >
                ↩ {isAr ? 'الرجوع لسجلي الحقيقي' : 'Reset to My Profile'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Drug Selection Input (Active Ingredient OR Brand/Free-Text) */}
      <section className="card stack">
        <h2>💊 {isAr ? 'اختر المضاد الحيوي أو اكتب الاسم التجاري المراد فحص أمانه:' : 'Select Antibiotic or Type Commercial Brand Name to Test:'}</h2>
        <div className="check-grid">
          <div className="field-group">
            <label>
              <b>1. {isAr ? 'اختر من المواد الفعالة المعتمدة (32 مادة):' : '1. Select Verified Active Ingredient (32):'}</b>
            </label>
            <select
              className="select-input"
              value={selectedDrugId}
              onChange={(e) => {
                setSelectedDrugId(e.target.value);
                setCustomDrugQuery('');
              }}
              aria-label="Select Antibiotic to Test"
            >
              {Object.entries(DRUG_ALLERGEN_MAP).map(([id, info]) => (
                <option key={id} value={id}>
                  {isAr ? info.nameAr : info.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>
              <b>
                2.{' '}
                {isAr
                  ? 'أو اكتب/اختر اسماً تجارياً مصرياً (مثل: هاي بيوتك، يوناسين، سبتازول):'
                  : '2. Or Enter Egyptian Brand / Trade Name (e.g. Hibiotic, Unasyn, Septazole):'}
              </b>
            </label>
            <div className="row" style={{ gap: '8px' }}>
              <input
                list="allergy-brand-suggestions"
                value={customDrugQuery}
                onChange={(e) => setCustomDrugQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب اسم الدواء بالعربية أو الإنجليزية لفحص مادته الفعالة...'
                    : 'Type brand or generic name in English or Arabic...'
                }
              />
              {customDrugQuery && (
                <button
                  type="button"
                  className="btn-secondary small"
                  onClick={() => setCustomDrugQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
            <datalist id="allergy-brand-suggestions">
              {EGYPTIAN_COMMERCIAL_PRODUCTS.map((p) => (
                <option
                  key={p.productId}
                  value={isAr ? p.tradeNameAr : p.tradeNameEn}
                />
              ))}
            </datalist>
          </div>
        </div>

        {/* Resolved Identity & Active Components Strip */}
        {primaryResolved && (
          <div className="notice compact" style={{ marginTop: '4px' }}>
            {primaryResolved.resolutionStatus === 'resolved_exact_product' ||
            primaryResolved.resolutionStatus === 'resolved_ingredient_only' ? (
              <div>
                <strong>
                  🧬 {isAr ? 'تحليل الهوية الدوائية والمواد الفعالة:' : 'Resolved Medication Identity & Components:'}{' '}
                </strong>
                <span>
                  {primaryResolved.displayName[lang]} —{' '}
                  <b>{isAr ? 'المكونات الكيميائية الفعالة:' : 'Active Components:'}</b>{' '}
                  {primaryResolved.componentsDisplay.map((c) => c[lang]).join(' + ')}
                  {primaryResolved.isCombination
                    ? isAr
                      ? ' (مستحضر مركب من أكثر من مادة فعالة)'
                      : ' (Combination product)'
                    : ''}
                </span>
              </div>
            ) : (
              <div>
                <strong>
                  ⚠️ {isAr ? 'حالة التحقق من الهوية الدوائية:' : 'Medication Identity Status:'}{' '}
                </strong>
                <span>
                  {primaryResolved.uncertaintyReasons[0]?.[lang] ||
                    (isAr
                      ? 'تعذر التحقق من المادة الفعالة لهذا الاسم في قاعدة البيانات؛ لا يفترض النظام الأمان تلقائياً.'
                      : 'Could not resolve active ingredient in the verified database; safety is never assumed.')}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Safety Evaluation Result Card */}
      <section
        className={`card result-card ${
          result.matchLevel === 'exact_match'
            ? 'severe'
            : result.matchLevel === 'cross_reactivity' || result.matchLevel === 'unverified'
              ? 'moderate'
              : 'safe'
        }`}
      >
        <div className="result-header">
          {result.matchLevel === 'exact_match' && (
            <span className="sev-badge severe">
              🚨 {isAr ? 'خطر حاد! تطابق تام في مادة الحساسية' : 'Severe Warning: Exact Active Ingredient Match'}
            </span>
          )}
          {result.matchLevel === 'cross_reactivity' && (
            <span className="sev-badge moderate">
              🟠 {isAr ? 'تحذير سريري: احتمالية حساسية متصالبة (Cross-Reactivity)' : 'Clinical Concern: Cross-Reactivity Risk'}
            </span>
          )}
          {result.matchLevel === 'no_match' && (
            <span className="sev-badge safe">
              🟢 {isAr ? 'لم يُعثر على تطابق مع الحساسيات المسجلة حالياً' : 'No Match Found with Documented Allergies'}
            </span>
          )}
          {result.matchLevel === 'unverified' && (
            <span className="sev-badge moderate">
              🟡 {isAr ? 'غير متحقق منه — لا يمكن تأكيد الأمان آلياً' : 'Unverified — Cannot Confirm Safety Automatically'}
            </span>
          )}

          <h3>{result.title[lang]}</h3>
        </div>

        <div className="result-body stack">
          <div className="result-section">
            <h4>🔬 {isAr ? 'التحليل السريري للمطابقة:' : 'Clinical Matching Analysis:'}</h4>
            <p>{result.explanation[lang]}</p>
          </div>

          <div className="result-section action-highlight">
            <h4>⚡ {isAr ? 'التصرف الطبي الموصى به:' : 'Recommended Clinical Action:'}</h4>
            <p>
              <b>{result.clinicalAction[lang]}</b>
            </p>
          </div>

          <div className="nursing-box">
            <h4>🩺 {isAr ? 'توجيه وتمريض سريري (Nursing Safety Protocol):' : 'Nursing Safety Protocol:'}</h4>
            <p>{result.nursingWarning[lang]}</p>
          </div>

          {/* Consolidated Engine Alerts (if this drug also duplicates an active profile medication or triggers a profile contraindication) */}
          {(safetyAssessment.groupedFindings.duplicates.length > 0 ||
            safetyAssessment.groupedFindings.profileContraindications.length > 0 ||
            safetyAssessment.groupedFindings.interactions.length > 0) && (
            <div className="notice" style={{ marginTop: '8px' }}>
              <h4 style={{ margin: '0 0 8px' }}>
                🛡️{' '}
                {isAr
                  ? 'تنبيهات إضافية من محرك السلامة الدوائية (بناءً على أدويتك وملفك الصحي):'
                  : 'Additional Medication Safety Engine Findings (From Your Active Profile):'}
              </h4>
              <div className="stack" style={{ gap: '8px' }}>
                {[
                  ...safetyAssessment.groupedFindings.duplicates,
                  ...safetyAssessment.groupedFindings.profileContraindications,
                  ...safetyAssessment.groupedFindings.interactions,
                ].map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <strong>{f.title[lang]}</strong>
                    <p className="small" style={{ margin: '4px 0' }}>
                      {f.reason[lang]}
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      <b>{isAr ? 'الخطوة التالية:' : 'Next Step:'}</b> {f.nextStep[lang]}
                    </p>
                    <small className="muted">
                      {isAr ? 'المصدر:' : 'Source:'} {f.source.title[lang]}
                      {f.source.updatedDate ? ` (${f.source.updatedDate})` : ''}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Source & Completeness Meta */}
          <div className="small muted" style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
            <div>
              <b>{isAr ? 'المصدر المرجعي:' : 'Supporting Source:'}</b>{' '}
              {currentMedObj?.sources?.[0] ? (
                <>
                  <a href={currentMedObj.sources[0].url} target="_blank" rel="noopener noreferrer">
                    {currentMedObj.sources[0].title}
                  </a>{' '}
                  · {isAr ? 'آخر مراجعة:' : 'Last reviewed:'} {currentMedObj.lastReviewed || '2026-10-14'}
                </>
              ) : (
                <span>
                  {isAr
                    ? 'هيئة الدواء المصرية (EDA) وموسوعة MedlinePlus السريرية (مراجعة: 2026-10-14)'
                    : 'Egyptian Drug Authority (EDA) & NIH MedlinePlus (Reviewed: 2026-10-14)'}
                </span>
              )}
            </div>
            <div style={{ marginTop: '4px' }}>
              <b>{isAr ? 'اكتمال البيانات:' : 'Data Completeness:'}</b>{' '}
              {activeAllergies.length === 0
                ? isAr
                  ? 'لم يتم تسجيل حساسيات سابقة في ملفك الشخصي بعد — الفحص يعتمد على البيانات المسجلة فقط.'
                  : 'No prior allergies recorded in your profile yet — screening relies on recorded history.'
                : result.matchLevel === 'unverified'
                  ? isAr
                    ? 'بيانات غير مكتملة — يلزم التحقق اليدوي مع الصيدلي.'
                    : 'Incomplete mapping — manual pharmacist verification required.'
                  : isAr
                    ? 'تمت المقارنة مع سجل الحساسية المسجل بنجاح.'
                    : 'Successfully compared against your recorded allergy profile.'}
            </div>
          </div>

          <div className="med-link-row row wrapRow" style={{ gap: '8px' }}>
            {currentMedObj && (
              <Link to={`/medicine/${currentMedObj.id}`} className="btn-secondary">
                📖{' '}
                {isAr
                  ? `فتح صفحة دواء ${pick(currentMedObj.genericName, lang)} وسعره وبدائله`
                  : `View ${pick(currentMedObj.genericName, lang)} Details`}
              </Link>
            )}
            <Link to="/prescription-radar" className="btn ghost">
              📡 {isAr ? 'فحص الروشتة الكاملة في الرادار' : 'Check Full Prescription in Radar'}
            </Link>
          </div>
        </div>
      </section>

      {/* Clinical Disclaimer */}
      <section className="notice alert">
        <strong>⚠️ {isAr ? 'إخلاء مسؤولية سريري:' : 'Clinical Disclaimer:'} </strong>
        {safetyAssessment.safetyDisclaimer[lang]}
      </section>
    </main>
  );
}
