import { pick } from './types';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import {
  evaluateGreenPrescriptionTriage,
  GREEN_CARE_PLANS,
  HIGH_RISK_GROUP_ITEMS,
  RED_FLAG_ITEMS,
  SymptomPathwayId,
  TriageInputState,
} from './greenPrescriptionData';

type ActiveSection = 'wizard' | 'qr_share' | 'privacy_governance';

export default function GreenPrescription() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [section, setSection] = useState<ActiveSection>('wizard');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Zero-PII ephemeral state (kept strictly in memory, never saved to localStorage or sent anywhere)
  const [pathway, setPathway] = useState<SymptomPathwayId | null>(null);
  const [redFlagsNone, setRedFlagsNone] = useState<boolean>(false);
  const [selectedRedFlags, setSelectedRedFlags] = useState<string[]>([]);
  const [highRiskNone, setHighRiskNone] = useState<boolean>(false);
  const [selectedHighRisks, setSelectedHighRisks] = useState<string[]>([]);
  const [progression, setProgression] = useState<'mild_stable' | 'worsening_persistent' | 'unsure' | null>(null);
  const [validationMsg, setValidationMsg] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const triageState: TriageInputState = useMemo(
    () => ({
      pathway,
      redFlagsAnswered: redFlagsNone || selectedRedFlags.length > 0,
      selectedRedFlags,
      highRiskAnswered: highRiskNone || selectedHighRisks.length > 0,
      selectedHighRisks,
      progression,
    }),
    [pathway, redFlagsNone, selectedRedFlags, highRiskNone, selectedHighRisks, progression]
  );

  const triageLevel = useMemo(
    () => evaluateGreenPrescriptionTriage(triageState),
    [triageState]
  );

  const currentPlan = pathway ? GREEN_CARE_PLANS[pathway] : null;
  const todayStr = useMemo(
    () => new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
    [isAr]
  );

  const publicFeatureUrl = `${window.location.origin}${window.location.pathname}#/green-prescription`;

  function toggleRedFlag(id: string) {
    setValidationMsg('');
    setRedFlagsNone(false);
    setSelectedRedFlags((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSelectNoRedFlags() {
    setValidationMsg('');
    setSelectedRedFlags([]);
    setRedFlagsNone((prev) => !prev);
  }

  function toggleHighRisk(id: string) {
    setValidationMsg('');
    setHighRiskNone(false);
    setSelectedHighRisks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSelectNoHighRisks() {
    setValidationMsg('');
    setSelectedHighRisks([]);
    setHighRiskNone((prev) => !prev);
  }

  function proceedToStep2(selected: SymptomPathwayId) {
    setPathway(selected);
    setValidationMsg('');
    setStep(2);
  }

  function proceedToResult() {
    if (!triageState.redFlagsAnswered || !triageState.highRiskAnswered || !triageState.progression) {
      setValidationMsg(
        isAr
          ? '⚠️ لضمان سلامتك، يرجى الإجابة عن جميع أسئلة الفرز الثلاثة قبل عرض التوجيه الصحي (لا يفترض النظام الأمان عند نقص الإجابات).'
          : '⚠️ For your safety, please complete all 3 safety screening questions before viewing guidance.'
      );
      return;
    }
    setValidationMsg('');
    setStep(3);
  }

  function resetAll() {
    setPathway(null);
    setRedFlagsNone(false);
    setSelectedRedFlags([]);
    setHighRiskNone(false);
    setSelectedHighRisks([]);
    setProgression(null);
    setValidationMsg('');
    setStep(1);
  }

  function copyPublicUrl() {
    navigator.clipboard?.writeText(publicFeatureUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  return (
    <main className="wrap stack green-rx-page">
      {/* Top Navigation & Non-Print Controls */}
      <div className="row wrapRow no-print" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/">← {isAr ? 'الرئيسية' : 'Home'}</Link>
        <div className="row wrapRow" style={{ gap: '8px' }}>
          <button
            type="button"
            className={`btn small ${section === 'wizard' ? '' : 'ghost'}`}
            style={section === 'wizard' ? { background: '#15803d', borderColor: '#15803d' } : {}}
            onClick={() => setSection('wizard')}
          >
            🌿 {isAr ? 'الروشتة الخضرا (التقييم الذاتي)' : 'Green Prescription Tool'}
          </button>
          <button
            type="button"
            className={`btn small ${section === 'qr_share' ? '' : 'ghost'}`}
            style={section === 'qr_share' ? { background: '#15803d', borderColor: '#15803d' } : {}}
            onClick={() => setSection('qr_share')}
          >
            📱 {isAr ? 'رمز QR العام للمنصة' : 'Public QR Code'}
          </button>
          <button
            type="button"
            className={`btn small ${section === 'privacy_governance' ? '' : 'ghost'}`}
            style={section === 'privacy_governance' ? { background: '#15803d', borderColor: '#15803d' } : {}}
            onClick={() => setSection('privacy_governance')}
          >
            🔒 {isAr ? 'الخصوصية والمصادر' : 'Privacy & Sources'}
          </button>
        </div>
      </div>

      {/* Calm Green Hero Header */}
      <header
        className="card no-print"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)',
          color: '#fff',
          padding: '24px',
          border: 'none',
        }}
      >
        <div className="row wrapRow" style={{ gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '2.4rem' }}>🌿</span>
          <div>
            <h1 style={{ color: '#fff', margin: 0, fontSize: '1.65rem' }}>
              {isAr ? 'الروشتة الخضرا الذكية | Green Prescription' : 'Green Prescription | Digital Self-Care Guide'}
            </h1>
            <p style={{ color: '#d1fae5', margin: '4px 0 0', fontSize: '0.98rem' }}>
              {isAr
                ? 'دليل التوجيه التمريضي للرعاية الذاتية للأعراض البسيطة وترشيد استخدام المضادات الحيوية'
                : 'Nurse-led digital self-care guidance for mild symptoms and responsible antibiotic stewardship'}
            </p>
          </div>
        </div>

        {/* Service Definition & Boundaries Box */}
        <div
          style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            fontSize: '0.9rem',
            lineHeight: 1.65,
          }}
        >
          <strong>ℹ️ {isAr ? 'تعريف وحدود الخدمة:' : 'Service Scope & Boundaries:'} </strong>
          {isAr
            ? '«الروشتة الخضرا» هي خطة إرشادية عامة للرعاية الذاتية غير الدوائية وليست وصفة طبية أو أداة تشخيص. لا تصف هذه الأداة أي أدوية، ولا تحدد ما إذا كانت العدوى بكتيرية أو فيروسية، ولا تغني عن استشارة الطبيب أو الصيدلي. لا يتم طلب أو حفظ أي بيانات شخصية أو صحية.'
            : 'The Green Prescription is a general non-pharmacological self-care guide, NOT a medical prescription or diagnostic tool. It does not prescribe medicines or replace a doctor or pharmacist. No personal data is collected or stored.'}
        </div>
      </header>

      {/* SECTION 1: INTERACTIVE GREEN PRESCRIPTION WIZARD */}
      {section === 'wizard' && (
        <div className="stack">
          {/* Step Progress Indicator (Hidden in Print) */}
          <div className="row wrapRow no-print" style={{ gap: '8px', justifyContent: 'center' }}>
            <span
              className="badge"
              style={{
                padding: '6px 14px',
                background: step === 1 ? '#15803d' : '#dcfce7',
                color: step === 1 ? '#fff' : '#166534',
                fontSize: '0.88rem',
              }}
            >
              1. {isAr ? 'اختيار الشكوى' : '1. Select Symptom'}
            </span>
            <span>→</span>
            <span
              className="badge"
              style={{
                padding: '6px 14px',
                background: step === 2 ? '#15803d' : '#dcfce7',
                color: step === 2 ? '#fff' : '#166534',
                fontSize: '0.88rem',
              }}
            >
              2. {isAr ? 'أسئلة فرز الأمان' : '2. Safety Triage'}
            </span>
            <span>→</span>
            <span
              className="badge"
              style={{
                padding: '6px 14px',
                background: step === 3 ? '#15803d' : '#dcfce7',
                color: step === 3 ? '#fff' : '#166534',
                fontSize: '0.88rem',
              }}
            >
              3. {isAr ? 'التوجيه والخطة' : '3. Guidance & Plan'}
            </span>
          </div>

          {/* STEP 1: CHOOSE SYMPTOM PATHWAY */}
          {step === 1 && (
            <section className="card stack" aria-labelledby="step1-heading">
              <h2 id="step1-heading" style={{ color: '#166534' }}>
                1️⃣ {isAr ? 'اختر نوع الشكوى أو العرض الحالي:' : 'Step 1: Select the Current Symptom:'}
              </h2>
              <p className="muted small">
                {isAr
                  ? 'اضغط على البطاقة التي تمثل الشكوى الحالية للانتقال إلى أسئلة فحص الأمان السريعة:'
                  : 'Tap the card that matches the current complaint to proceed to safety screening:'}
              </p>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '14px' }}>
                {(Object.keys(GREEN_CARE_PLANS) as SymptomPathwayId[]).map((key) => {
                  const p = GREEN_CARE_PLANS[key];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => proceedToStep2(p.id)}
                      className="card"
                      style={{
                        textAlign: 'start',
                        cursor: 'pointer',
                        border: pathway === p.id ? '2px solid #15803d' : '1px solid var(--line)',
                        borderTop: '4px solid #15803d',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ fontSize: '2rem' }}>{p.icon}</div>
                      <h3 style={{ margin: 0, color: '#14532d', fontSize: '1.1rem' }}>
                        {pick(p.title, lang)}
                      </h3>
                      <p className="small muted" style={{ margin: 0 }}>
                        {pick(p.subtitle, lang)}
                      </p>
                      <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.88rem', marginTop: '4px' }}>
                        {isAr ? 'اختيار ومتابعة فحص الأمان ←' : 'Select & Continue →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 2: CONSERVATIVE SAFETY TRIAGE QUESTIONS */}
          {step === 2 && currentPlan && (
            <section className="card stack" aria-labelledby="step2-heading">
              <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge approved" style={{ marginBottom: '4px' }}>
                    {currentPlan.icon} {pick(currentPlan.title, lang)}
                  </span>
                  <h2 id="step2-heading" style={{ margin: 0, color: '#166534' }}>
                    2️⃣ {isAr ? 'أسئلة فرز السلامة وعلامات الخطر (إلزامية قبل عرض الخطة)' : 'Step 2: Mandatory Safety & Red-Flag Screening'}
                  </h2>
                </div>
                <button type="button" className="btn ghost small" onClick={() => setStep(1)}>
                  {isAr ? '← تغيير الشكوى' : '← Change Symptom'}
                </button>
              </div>

              {/* Question Block A: Red Flags */}
              <fieldset className="card" style={{ border: '2px solid #fecaca', background: 'var(--bg-subtle, #fff)' }}>
                <legend style={{ color: '#b91c1c', fontWeight: 700 }}>
                  🚨 {isAr ? 'أولاً: هل توجد أي علامة من علامات الخطر التالية؟' : 'A. Are any of the following danger signs (Red Flags) present?'}
                </legend>
                <div className="stack" style={{ gap: '10px', marginTop: '8px' }}>
                  {RED_FLAG_ITEMS.map((rf) => (
                    <label
                      key={rf.id}
                      className="check"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: selectedRedFlags.includes(rf.id) ? '2px solid #dc2626' : '1px solid var(--line)',
                        background: selectedRedFlags.includes(rf.id) ? '#fef2f2' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRedFlags.includes(rf.id)}
                        onChange={() => toggleRedFlag(rf.id)}
                      />
                      <span>{pick(rf.text, lang)}</span>
                    </label>
                  ))}

                  <label
                    className="check"
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: redFlagsNone ? '2px solid #16a34a' : '1px solid var(--line)',
                      background: redFlagsNone ? '#f0fdf4' : 'transparent',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={redFlagsNone}
                      onChange={handleSelectNoRedFlags}
                    />
                    <span style={{ color: '#15803d' }}>
                      ✅ {isAr ? 'لا، لا توجد أي علامة من علامات الخطر السابقة' : 'No, none of the above danger signs are present'}
                    </span>
                  </label>
                </div>
              </fieldset>

              {/* Question Block B: High-Risk / Special Groups */}
              <fieldset className="card" style={{ border: '1px solid var(--line)' }}>
                <legend style={{ fontWeight: 700, color: '#0f172a' }}>
                  👶🤰 {isAr ? 'ثانياً: هل ينتمي المريض لأي من الفئات التي تتطلب حذراً طبياً خاصاً؟' : 'B. Does the patient belong to any high-risk or special care group?'}
                </legend>
                <div className="stack" style={{ gap: '10px', marginTop: '8px' }}>
                  {HIGH_RISK_GROUP_ITEMS.map((hr) => (
                    <label
                      key={hr.id}
                      className="check"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: selectedHighRisks.includes(hr.id) ? '2px solid #d97706' : '1px solid var(--line)',
                        background: selectedHighRisks.includes(hr.id) ? '#fffbeb' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedHighRisks.includes(hr.id)}
                        onChange={() => toggleHighRisk(hr.id)}
                      />
                      <span>{pick(hr.text, lang)}</span>
                    </label>
                  ))}

                  <label
                    className="check"
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: highRiskNone ? '2px solid #16a34a' : '1px solid var(--line)',
                      background: highRiskNone ? '#f0fdf4' : 'transparent',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={highRiskNone}
                      onChange={handleSelectNoHighRisks}
                    />
                    <span style={{ color: '#15803d' }}>
                      ✅ {isAr ? 'لا، المريض بالغ سليم ولا ينتمي لأي من الفئات السابقة' : 'No, the user is a healthy adult not in any of the above groups'}
                    </span>
                  </label>
                </div>
              </fieldset>

              {/* Question Block C: Symptom Progression */}
              <fieldset className="card" style={{ border: '1px solid var(--line)' }}>
                <legend style={{ fontWeight: 700 }}>
                  📈 {isAr ? 'ثالثاً: كيف تصف شدة ومسار الأعراض حالياً؟' : 'C. How would you describe the severity and progression of symptoms?'}
                </legend>
                <div className="options">
                  <button
                    type="button"
                    className={`opt ${progression === 'mild_stable' ? 'right' : ''}`}
                    onClick={() => {
                      setProgression('mild_stable');
                      setValidationMsg('');
                    }}
                  >
                    🟢 {isAr ? 'أعراض بسيطة ومستقرة وفي بدايتها' : 'Mild and stable symptoms'}
                  </button>
                  <button
                    type="button"
                    className={`opt ${progression === 'worsening_persistent' ? 'bad' : ''}`}
                    onClick={() => {
                      setProgression('worsening_persistent');
                      setValidationMsg('');
                    }}
                  >
                    🟡 {isAr ? 'أعراض شديدة، أو تزداد سوءاً، أو مستمرة منذ عدة أيام دون تحسن' : 'Worsening symptoms or persistent without improvement'}
                  </button>
                  <button
                    type="button"
                    className={`opt ${progression === 'unsure' ? 'bad' : ''}`}
                    onClick={() => {
                      setProgression('unsure');
                      setValidationMsg('');
                    }}
                  >
                    ❓ {isAr ? 'لست متأكداً من شدة الحالة' : 'Not sure about symptom severity'}
                  </button>
                </div>
              </fieldset>

              {validationMsg && (
                <div className="alert" role="alert">
                  {validationMsg}
                </div>
              )}

              <div className="row wrapRow" style={{ justifyContent: 'space-between', marginTop: '8px' }}>
                <button type="button" className="btn ghost" onClick={resetAll}>
                  🔄 {isAr ? 'إلغاء والبدء من جديد' : 'Start Over'}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#15803d', borderColor: '#15803d', padding: '12px 24px', fontSize: '1.05rem' }}
                  onClick={proceedToResult}
                >
                  {isAr ? 'عرض نتيجة التقييم والتوجيه الصحي ←' : 'View Guidance Result →'}
                </button>
              </div>
            </section>
          )}

          {/* STEP 3: TRIAGE RESULT (RED FLAG / AMBER ALERT / GREEN CARE) */}
          {step === 3 && currentPlan && (
            <section className="stack">
              {/* Action Toolbar (Hidden in Print) */}
              <div className="row wrapRow no-print" style={{ justifyContent: 'space-between' }}>
                <div className="row wrapRow" style={{ gap: '8px' }}>
                  <button type="button" className="btn ghost small" onClick={() => setStep(2)}>
                    ✏️ {isAr ? 'العودة وتعديل الإجابات' : 'Edit Answers'}
                  </button>
                  <button type="button" className="btn ghost small" onClick={resetAll}>
                    🔄 {isAr ? 'ابدأ تقييماً جديداً' : 'Start New Assessment'}
                  </button>
                </div>
                {triageLevel === 'green_care' && (
                  <button
                    type="button"
                    className="btn"
                    style={{ background: '#15803d', borderColor: '#15803d' }}
                    onClick={() => window.print()}
                  >
                    🖨️ {isAr ? 'طباعة / حفظ كملف PDF' : 'Print / Save as PDF'}
                  </button>
                )}
              </div>

              {/* LEVEL 1: RED FLAG (URGENT MEDICAL EVALUATION) */}
              {triageLevel === 'red_flag' && (
                <div
                  className="card stack"
                  role="alert"
                  style={{
                    border: '3px solid #dc2626',
                    background: '#fef2f2',
                    padding: '24px',
                  }}
                >
                  <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>🚨</span>
                    <div>
                      <span className="badge" style={{ background: '#dc2626', color: '#fff', fontWeight: 700 }}>
                        Red Flag — {isAr ? 'توجيه عاجل وطارئ' : 'Urgent Medical Alert'}
                      </span>
                      <h2 style={{ color: '#991b1b', margin: '4px 0 0' }}>
                        {isAr
                          ? 'هذه الحالة تتطلب تقييماً طبياً عاجلاً — الرعاية المنزلية غير كافية'
                          : 'Urgent Medical Evaluation Required — Home Self-Care is Not Sufficient'}
                      </h2>
                    </div>
                  </div>

                  <p style={{ color: '#7f1d1d', fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
                    {isAr
                      ? 'بناءً على وجود علامة أو أكثر من علامات الخطر التي اخترتها، لا يجب الاكتفاء بإرشادات الرعاية المنزلية أو الانتظار. يرجى التوجه فوراً إلى أقرب قسم طوارئ مستشفى أو التواصل مع خدمات الطوارئ والإسعاف المحلية.'
                      : 'Based on the danger signs reported, home self-care is not safe or sufficient. Please seek immediate urgent medical care at the nearest emergency department or contact local emergency services.'}
                  </p>

                  <div className="card" style={{ background: '#fff', border: '1px solid #fca5a5' }}>
                    <h3 style={{ color: '#991b1b', margin: '0 0 8px' }}>
                      {isAr ? 'ما يجب فعله الآن فوراً:' : 'Immediate Action Steps:'}
                    </h3>
                    <ul style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.8 }}>
                      <li>
                        {isAr
                          ? 'اطلب المساعدة الطبية الطارئة فوراً (في مصر: اتصل بالإسعاف على رقم 123، أو اتصل بخدمات الطوارئ المحلية في بلدك).'
                          : 'Contact local emergency services immediately (in Egypt: dial 123 for ambulance).'}
                      </li>
                      <li>
                        {isAr
                          ? 'لا تتناول أي مضاد حيوي أو دواء غير موصوف قبل فحص الطبيب حتى لا يخفي الأعراض أو يسبب تفاعلاً خطيراً.'
                          : 'Do not take unprescribed antibiotics or medications prior to medical evaluation.'}
                      </li>
                      <li>
                        {isAr
                          ? 'اطلب من شخص مرافق البقاء مع المريض ومرافقته إلى المستشفى.'
                          : 'Have someone stay with the patient and accompany them to urgent care.'}
                      </li>
                    </ul>
                  </div>

                  <div className="row wrapRow no-print" style={{ gap: '10px' }}>
                    <a href="tel:123" className="btn danger" style={{ fontSize: '1.05rem', padding: '12px 24px' }}>
                      📞 {isAr ? 'اتصال بخدمات الإسعاف (123)' : 'Call Emergency Ambulance (123)'}
                    </a>
                    <button type="button" className="btn ghost" onClick={resetAll}>
                      🔄 {isAr ? 'ابدأ من جديد' : 'Start Over'}
                    </button>
                  </div>
                </div>
              )}

              {/* LEVEL 2: AMBER ALERT (PROFESSIONAL MEDICAL / PHARMACIST EVALUATION) */}
              {triageLevel === 'amber_alert' && (
                <div
                  className="card stack"
                  role="region"
                  aria-label="Amber Alert Guidance"
                  style={{
                    border: '2px solid #d97706',
                    background: '#fffbeb',
                    padding: '24px',
                  }}
                >
                  <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '2.4rem' }}>⚠️</span>
                    <div>
                      <span className="badge" style={{ background: '#d97706', color: '#fff', fontWeight: 700 }}>
                        Amber Alert — {isAr ? 'توصية بتقييم طبي أو صيدلي' : 'Professional Evaluation Recommended'}
                      </span>
                      <h2 style={{ color: '#92400e', margin: '4px 0 0' }}>
                        {isAr
                          ? 'نوصي بمراجعة الطبيب أو الصيدلي لتقييم الحالة بدقة'
                          : 'We Recommend Consulting a Doctor or Pharmacist'}
                      </h2>
                    </div>
                  </div>

                  <p style={{ color: '#78350f', fontSize: '1.02rem', lineHeight: 1.7, margin: 0 }}>
                    {isAr
                      ? 'نظراً لأن الحالة تتضمن فئة تحتاج إلى عناية خاصة (مثل الأطفال الصغار، الحوامل، كبار السن، أو أصحاب الأمراض المزمنة)، أو لأن الأعراض مستمرة/متفاقمة أو غير محددة؛ فإن خطة الرعاية الذاتية العامة وحدها لا تكفي، ويلزم تقييم مهني مختص.'
                      : 'Because this case involves a higher-risk group (infants/children, pregnancy, older adults, or chronic illness), worsening/persistent symptoms, or an unclear complaint, general self-care guidance alone is not sufficient.'}
                  </p>

                  <div className="card" style={{ background: '#fff', border: '1px solid #fde68a' }}>
                    <h3 style={{ color: '#92400e', margin: '0 0 8px' }}>
                      {isAr ? 'إرشادات السلامة لحين مراجعة المختص:' : 'Safety Guidance Until Professional Review:'}
                    </h3>
                    <ul style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.8 }}>
                      <li>
                        {isAr
                          ? 'راجع الطبيب لتحديد التشخيص الدقيق وما إذا كانت هناك حاجة لأي فحوصات أو علاج موصوف.'
                          : 'Consult a physician for accurate examination and tailored management.'}
                      </li>
                      <li>
                        {isAr
                          ? 'لا تبدأ بتناول أي مضاد حيوي من تلقاء نفسك أو بناءً على نصيحة غير المختصين.'
                          : 'Do not start an antibiotic without a formal medical prescription.'}
                      </li>
                      <li>
                        {isAr
                          ? 'إذا ظهرت أي علامة خطر طارئة (مثل ضيق التنفس، الخمول الشديد، أو الجفاف)، اطلب الرعاية الطارئة فوراً.'
                          : 'If any red-flag danger signs develop, seek urgent emergency care immediately.'}
                      </li>
                    </ul>
                  </div>

                  <div className="row wrapRow no-print" style={{ gap: '10px' }}>
                    <button type="button" className="btn ghost" onClick={() => setStep(2)}>
                      ✏️ {isAr ? 'مراجعة الإجابات' : 'Review Answers'}
                    </button>
                    <button type="button" className="btn" onClick={resetAll}>
                      🔄 {isAr ? 'ابدأ من جديد' : 'Start Over'}
                    </button>
                  </div>
                </div>
              )}

              {/* LEVEL 3: GREEN CARE (PRINTABLE SELF-CARE PLAN CARD) */}
              {triageLevel === 'green_care' && (
                <article
                  className="card stack green-rx-printable-card"
                  style={{
                    border: '2px solid #15803d',
                    borderRadius: '16px',
                    padding: '28px',
                    background: 'var(--card-bg, #fff)',
                  }}
                >
                  {/* Card Header */}
                  <div
                    className="row wrapRow"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '2px solid #bbf7d0',
                      paddingBottom: '16px',
                    }}
                  >
                    <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '2.5rem' }}>🌿</span>
                      <div>
                        <span
                          className="badge"
                          style={{
                            background: '#dcfce7',
                            color: '#166534',
                            borderColor: '#86efac',
                            fontWeight: 700,
                          }}
                        >
                          Green Care — {isAr ? 'إرشادات رعاية ذاتية عامة' : 'General Self-Care Guidance'}
                        </span>
                        <h2 style={{ color: '#14532d', margin: '4px 0 0', fontSize: '1.45rem' }}>
                          {isAr
                            ? 'خطة الرعاية الذاتية — Green Prescription'
                            : 'Self-Care Guidance Plan — Green Prescription'}
                        </h2>
                        <div className="small muted">
                          {isAr ? 'الشكوى المختارة:' : 'Selected Pathway:'}{' '}
                          <b>{pick(currentPlan.title, lang)}</b>
                        </div>
                      </div>
                    </div>

                    <div className="small muted" style={{ textAlign: 'end' }}>
                      <div>{isAr ? 'تاريخ الإنشاء:' : 'Created on:'} <b>{todayStr}</b></div>
                      <div>{isAr ? 'وثيقة تثقيفية بدون بيانات شخصية' : 'Anonymous Educational Guide'}</div>
                    </div>
                  </div>

                  {/* Notice: Not a diagnostic or medical prescription */}
                  <div
                    className="notice"
                    style={{
                      background: '#f0fdf4',
                      borderColor: '#86efac',
                      borderInlineStart: '5px solid #15803d',
                    }}
                  >
                    <strong>💡 {isAr ? 'لماذا لا تتضمن هذه الخطة مضاداً حيوياً؟' : 'Why Does This Plan Not Include an Antibiotic?'} </strong>
                    {isAr
                      ? 'الأعراض البسيطة كالرشح ونزلات البرد واحتقان الحلق البسيط غالباً ما تتحسن بالرعاية الذاتية الداعمة، وتناول المضادات الحيوية دون وصفة طبية لا يفيد فيها بل يعرضك لآثار جانبية ويزيد من مقاومة البكتيريا للمضادات الحيوية.'
                      : 'Mild symptoms often improve with supportive self-care. Taking unprescribed antibiotics does not help viral illnesses and increases antimicrobial resistance and side effects.'}
                  </div>

                  {/* Grid for Do's and Avoid's */}
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
                    {/* 1. What you can do now */}
                    <div className="card" style={{ borderTop: '4px solid #16a34a', background: '#f8fafc' }}>
                      <h3 style={{ color: '#15803d', margin: '0 0 10px' }}>
                        ✅ {isAr ? 'ما الذي يمكنك فعله الآن؟ (رعاية ذاتية آمنة)' : 'What You Can Do Now (Safe Self-Care)'}
                      </h3>
                      <ul style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.8 }}>
                        {currentPlan.whatToDoNow.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{pick(item, lang)}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 2. What to avoid */}
                    <div className="card" style={{ borderTop: '4px solid #dc2626', background: '#f8fafc' }}>
                      <h3 style={{ color: '#b91c1c', margin: '0 0 10px' }}>
                        🚫 {isAr ? 'ما الذي ينبغي تجنبه؟' : 'What You Should Avoid'}
                      </h3>
                      <ul style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.8 }}>
                        {currentPlan.whatToAvoid.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{pick(item, lang)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 3. When to seek medical help */}
                  <div className="card" style={{ borderLeft: '4px solid #d97706', background: '#fffbeb' }}>
                    <h3 style={{ color: '#92400e', margin: '0 0 8px' }}>
                      🏥 {isAr ? 'متى يجب عليك طلب المساعدة الطبية فوراً؟' : 'When to Seek Medical Attention'}
                    </h3>
                    <ul style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.8, color: '#78350f' }}>
                      {currentPlan.whenToSeekHelp.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{pick(item, lang)}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 4. If symptoms worsen */}
                  <div className="card" style={{ background: '#f1f5f9' }}>
                    <h4 style={{ margin: '0 0 4px' }}>
                      🔄 {isAr ? 'إذا ساءت الأعراض أو لم تتحسن:' : 'If Symptoms Worsen or Do Not Improve:'}
                    </h4>
                    <p style={{ margin: 0 }}>{pick(currentPlan.ifSymptomsWorsen, lang)}</p>
                  </div>

                  {/* Mandatory Disclaimer & Review Metadata */}
                  <div
                    className="small muted"
                    style={{
                      borderTop: '1px solid var(--line)',
                      paddingTop: '12px',
                      lineHeight: 1.6,
                    }}
                  >
                    <div>
                      <b>⚠️ {isAr ? 'إخلاء مسؤولية طبي:' : 'Medical Disclaimer:'} </b>
                      {isAr
                        ? 'هذه المعلومات إرشادية وتثقيفية عامة فقط، ولا تمثل تشخيصاً طبياً أو وصفة علاجية، ولا تغني عن تقييم الطبيب أو الصيدلي.'
                        : 'This information is for general educational purposes only and does not constitute a medical diagnosis or prescription.'}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <b>{isAr ? 'المصدر وحالة المراجعة:' : 'Source & Review Status:'} </b>
                      {pick(currentPlan.reviewMeta.sourceTitle, lang)} ·{' '}
                      {isAr ? 'تاريخ المراجعة:' : 'Last Reviewed:'} {currentPlan.reviewMeta.lastReviewed} ·{' '}
                      {pick(currentPlan.reviewMeta.approvalStatus, lang)}
                    </div>
                  </div>
                </article>
              )}
            </section>
          )}
        </div>
      )}

      {/* SECTION 2: STATIC PUBLIC QR CODE & SHARING */}
      {section === 'qr_share' && (
        <section className="card stack">
          <h2>📱 {isAr ? 'رمز QR العام والثابت لميزة «الروشتة الخضرا الذكية»' : 'Static Public QR Code for Green Prescription'}</h2>
          <p className="muted small">
            {isAr
              ? 'يشير رمز QR التالي إلى الرابط العام الثابت للميزة ولا يتضمن أي بيانات مريض أو أعراض شخصية على الإطلاق. يمكن طباعته في العيادات أو الصيدليات ليمسحه المستخدم بهاتفه.'
              : 'This static QR code points strictly to the public feature URL and contains zero personal or symptom data.'}
          </p>

          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px',
              background: '#f0fdf4',
              border: '2px dashed #15803d',
              textAlign: 'center',
            }}
          >
            {/* Self-contained crisp SVG QR representation + direct link */}
            <div
              style={{
                background: '#fff',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                marginBottom: '12px',
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicFeatureUrl)}`}
                alt="Green Prescription Public QR Code"
                width={180}
                height={180}
                style={{ display: 'block' }}
              />
            </div>

            <b style={{ color: '#14532d', fontSize: '1.05rem' }}>
              {isAr ? 'امسح الرمز لفتح «الروشتة الخضرا الذكية»' : 'Scan to Open Green Prescription'}
            </b>
            <code
              dir="ltr"
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                wordBreak: 'break-all',
              }}
            >
              {publicFeatureUrl}
            </code>

            <div className="row wrapRow" style={{ gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                className="btn"
                style={{ background: '#15803d', borderColor: '#15803d' }}
                onClick={copyPublicUrl}
              >
                {copiedLink
                  ? isAr
                    ? '✅ تم نسخ الرابط بنجاح!'
                    : '✅ Link Copied!'
                  : isAr
                  ? '📋 نسخ رابط الميزة'
                  : '📋 Copy Feature Link'}
              </button>
              <button type="button" className="btn ghost" onClick={() => window.print()}>
                🖨️ {isAr ? 'طباعة ملصق QR' : 'Print QR Poster'}
              </button>
            </div>
          </div>

          <div className="notice">
            <strong>📌 {isAr ? 'ملاحظة تقنية هامة:' : 'Technical Note:'} </strong>
            {isAr
              ? 'يعمل رمز QR على الهواتف والأجهزة الأخرى فور نشر الموقع على الرابط العام (GitHub Pages: https://mmo277.github.io/antibiotic-awareness/#/green-prescription). إذا كنت تشغل الموقع محلياً على جهازك فقط (localhost)، فلن يفتح الرمز على أجهزة خارجية إلا بعد رفعه على الرابط العام.'
              : 'The QR code works across external mobile devices once deployed to your public GitHub Pages URL.'}
          </div>
        </section>
      )}

      {/* SECTION 3: PRIVACY & CLINICAL GOVERNANCE */}
      {section === 'privacy_governance' && (
        <section className="card stack">
          <h2>🔒 {isAr ? 'سياسة الخصوصية وحوكمة المراجعة الطبية' : 'Privacy Policy & Clinical Content Governance'}</h2>

          <div className="card" style={{ borderLeft: '4px solid #15803d' }}>
            <h3 style={{ margin: '0 0 6px' }}>
              1. {isAr ? 'خصوصية كاملة بدون حساب أو جمع بيانات (Zero-PII):' : '1. Zero-PII & Account-Free Privacy:'}
            </h3>
            <p className="small" style={{ margin: 0, lineHeight: 1.7 }}>
              {isAr
                ? 'تعمل ميزة «الروشتة الخضرا الذكية» بالكامل داخل متصفحك دون الحاجة لإنشاء حساب، ولا تطلب الاسم أو رقم الهاتف أو العنوان أو الرقم القومي. لا يتم حفظ الأعراض المختارة أو إجابات أسئلة السلامة في التخزين المحلي (localStorage) أو في أي قاعدة بيانات، وتُمسح تلقائياً بمجرد إغلاق الصفحة أو الضغط على «ابدأ من جديد». قد تسجل خدمة الاستضافة الثابتة (GitHub Pages) بيانات تقنية قياسية للزيارة (مثل عنوان IP العام) لأغراض تشغيل الخادم فقط.'
                : 'Green Prescription operates entirely in-memory in your browser without accounts. It never requests names, phone numbers, or identifiers, and never saves symptom selections to localStorage or external servers.'}
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
            <h3 style={{ margin: '0 0 6px' }}>
              2. {isAr ? 'المصادر المرجعية وحالة الاعتماد الطبي:' : '2. Evidence Sources & Clinical Governance:'}
            </h3>
            <p className="small" style={{ margin: '0 0 8px', lineHeight: 1.7 }}>
              {isAr
                ? 'صُممت مسارات الرعاية الذاتية وقواعد الفرز المحافظة استناداً إلى أدلة التثقيف الصحي وترشيد المضادات الحيوية القياسية التالية (ويجب مراجعتها واعتمادها من المشرف الطبي المختص قبل الاستخدام السريري الميداني):'
                : 'Self-care pathways and conservative triage rules are structured around international stewardship guidelines:'}
            </p>
            <ul className="small" style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.8 }}>
              <li>
                <a href="https://www.cdc.gov/antibiotic-use/" target="_blank" rel="noopener noreferrer">
                  CDC — Be Antibiotics Aware: Smart Use, Best Care (Symptom Relief & Viral vs Bacterial Education)
                </a>
              </li>
              <li>
                <a href="https://www.rcgp.org.uk/clinical-and-research/resources/toolkits/amr/target-antibiotics-toolkit" target="_blank" rel="noopener noreferrer">
                  RCGP / UKHSA — TARGET Antibiotics Toolkit (Self-Care Leaflets & Non-Antibiotic Prescriptions)
                </a>
              </li>
              <li>
                <a href="https://www.who.int/health-topics/antimicrobial-resistance" target="_blank" rel="noopener noreferrer">
                  World Health Organization (WHO) — Antimicrobial Stewardship & Acute Diarrhea Rehydration Guides
                </a>
              </li>
              <li>
                <a href="https://edaegypt.gov.eg" target="_blank" rel="noopener noreferrer">
                  {isAr ? 'هيئة الدواء المصرية (EDA) — التوعية بالاستخدام الرشيد للمضادات الحيوية' : 'Egyptian Drug Authority (EDA) — Rational Antibiotic Use'}
                </a>
              </li>
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
