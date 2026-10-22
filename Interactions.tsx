import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { pick } from './types';
import {
  TARGETS,
  COMMON_QUICK_CHECKS,
  InteractionRule,
  Severity,
  findInteractionRule,
  INTERACTION_SOURCES,
} from './interactionsData';

export default function Interactions() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { items } = useApproved();
  const meds = items ?? [];

  const [selectedMed, setSelectedMed] = useState('ciprofloxacin');
  const [selectedTarget, setSelectedTarget] = useState('dairy');

  // Resolve matching rule using centralized interaction lookup (exact + verified class-level rules)
  const matchedRule: InteractionRule | undefined = findInteractionRule(selectedMed, selectedTarget);

  const currentMedObj = meds.find((m) => m.id === selectedMed);
  const currentTargetObj = TARGETS.find((t) => t.id === selectedTarget);

  const applyQuickCheck = (medId: string, targetId: string) => {
    setSelectedMed(medId);
    setSelectedTarget(targetId);
  };

  const severityBadge = (s: Severity) => {
    switch (s) {
      case 'severe':
        return (
          <span className="sev-badge severe">
            🔴 {isAr ? 'تعارض خطير / يتطلب مراجعة طبية عاجلة' : 'Severe / Prompt Clinical Review Required'}
          </span>
        );
      case 'moderate':
        return (
          <span className="sev-badge moderate">
            🟡 {isAr ? 'تفاعل متوسط — يلزم الفصل الزمني أو المراقبة' : 'Moderate — Timing Separation / Monitoring Required'}
          </span>
        );
      case 'safe':
        return (
          <span className="sev-badge safe">
            🟢 {isAr ? 'إرشاد آمن وموصى به وفق المراجع' : 'Safe & Recommended per Reference'}
          </span>
        );
    }
  };

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>{isAr ? 'فاحص التفاعلات الدوائية والغذائية' : 'Drug & Food Interaction Checker'}</h1>
        <p className="muted">
          {isAr
            ? 'أداة سريرية تفاعلية لفحص التداخلات الموثقة بين المضادات الحيوية والأطعمة (كالحليب)، المكملات (كالحديد)، والأدوية المتزامنة لضمان الإعطاء الآمن وسلامة المريض.'
            : 'Interactive clinical tool evaluating documented interactions between antibiotics, foods, minerals, and concurrent medications.'}
        </p>
      </header>

      {/* Quick check chips */}
      <section className="card stack">
        <h2>⚡ {isAr ? 'فحص سريع لأشهر التداخلات الشائعة:' : 'Common Quick Checks:'}</h2>
        <div className="chips">
          {COMMON_QUICK_CHECKS.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`chip ${selectedMed === c.antibioticId && selectedTarget === c.targetId ? 'active-chip' : ''}`}
              onClick={() => applyQuickCheck(c.antibioticId, c.targetId)}
            >
              {pick(c.label, lang)}
            </button>
          ))}
        </div>
      </section>

      {/* Selection card */}
      <section className="card stack">
        <h2>🔍 {isAr ? 'اختر العناصر للفحص السريري:' : 'Select Items to Check:'}</h2>
        <div className="check-grid">
          <div className="field-group">
            <label>
              <b>1. {isAr ? 'المضاد الحيوي:' : 'Antibiotic:'}</b>
            </label>
            <select
              className="select-input"
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              aria-label="Select Antibiotic"
            >
              {meds.map((m) => (
                <option key={m.id} value={m.id}>
                  {pick(m.genericName, lang)} ({m.id})
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>
              <b>2. {isAr ? 'الطعام أو الدواء المتفاعل:' : 'Interacting Food or Medication:'}</b>
            </label>
            <select
              className="select-input"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              aria-label="Select Interacting Target"
            >
              <optgroup label={isAr ? 'الأطعمة والمشروبات' : 'Foods & Beverages'}>
                {TARGETS.filter((t) => t.category === 'food').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {pick(t.name, lang)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={isAr ? 'المعادن والمكملات' : 'Minerals & Supplements'}>
                {TARGETS.filter((t) => t.category === 'supplement').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {pick(t.name, lang)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={isAr ? 'الأدوية الشائعة' : 'Common Medications'}>
                {TARGETS.filter((t) => t.category === 'drug').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {pick(t.name, lang)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </section>

      {/* Result Card */}
      {matchedRule ? (
        <section className={`card result-card ${matchedRule.severity}`}>
          <div className="result-header">
            {severityBadge(matchedRule.severity)}
            <h3>{pick(matchedRule.title, lang)}</h3>
          </div>

          <div className="result-body stack">
            <div className="result-section">
              <h4>🔬 {isAr ? 'الآلية والتأثير العلمي:' : 'Mechanism of Interaction:'}</h4>
              <p>{pick(matchedRule.mechanism, lang)}</p>
            </div>

            <div className="result-section">
              <h4>⏱️ {isAr ? 'التصرف الطبي الموصى به وكيفية الفصل:' : 'Clinical Management & Spacing:'}</h4>
              <p>
                <b>{pick(matchedRule.management, lang)}</b>
              </p>
            </div>

            <div className="nursing-box">
              <h4>🩺 {isAr ? 'توجيه وتمريض سريري (Nursing Stewardship Note):' : 'Nursing Clinical Stewardship Note:'}</h4>
              <p>{pick(matchedRule.nursingTip, lang)}</p>
            </div>

            {matchedRule.source && (
              <div className="small muted" style={{ borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                <b>{isAr ? 'المصدر الموثق:' : 'Supporting Source:'}</b>{' '}
                <a href={matchedRule.source.url} target="_blank" rel="noopener noreferrer">
                  {matchedRule.source.title}
                </a>
                {matchedRule.source.updated ? ` · ${isAr ? 'تاريخ التحديث:' : 'Updated:'} ${matchedRule.source.updated}` : ''}
              </div>
            )}

            <div className="med-link-row row wrapRow" style={{ gap: '8px' }}>
              {currentMedObj && (
                <Link to={`/medicine/${currentMedObj.id}`} className="btn-secondary">
                  📖 {isAr ? `فتح صفحة دواء ${pick(currentMedObj.genericName, lang)} وسعره وبدائله` : `View ${pick(currentMedObj.genericName, lang)} details`}
                </Link>
              )}
              <Link to="/prescription-radar" className="btn ghost">
                📡 {isAr ? 'فحص الروشتة الكاملة في الرادار' : 'Check Full Prescription in Radar'}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="card result-card moderate">
          <div className="result-header">
            <span className="sev-badge moderate">
              ℹ️ {isAr ? 'لا يوجد تداخل مباشر مسجل في قاعدة البيانات لهذه الثنائية' : 'No Direct Interaction Rule Recorded for This Pair'}
            </span>
            <h3>
              {isAr
                ? `لم يُرصد تعارض مباشر موثق في السجل الحالي بين ${currentMedObj ? pick(currentMedObj.genericName, lang) : ''} و ${currentTargetObj ? pick(currentTargetObj.name, lang) : ''}`
                : `No direct interaction rule recorded in the current dataset between ${currentMedObj ? pick(currentMedObj.genericName, lang) : ''} and ${currentTargetObj ? pick(currentTargetObj.name, lang) : ''}`}
            </h3>
          </div>
          <div className="result-body stack">
            <p>
              {isAr
                ? 'تنبيه شفافية: عدم وجود تداخل مسجل في هذه الأداة لا يعني ضمان الأمان التام في جميع الحالات المرضية. راجع دائماً قسم «التداخلات الدوائية والغذائية» في النشرة السريرية للدواء واستشر الطبيب أو الصيدلي.'
                : 'Transparency Note: Absence of a recorded rule in this dataset does not guarantee complete safety for every patient context. Always review the full drug monograph and consult your doctor or pharmacist.'}
            </p>
            <div className="nursing-box">
              <h4>🩺 {isAr ? 'توجيه تمريضي عام:' : 'General Nursing Tip:'}</h4>
              <p>
                {isAr
                  ? 'احرص على تثقيف المريض بالالتزام بمواعيد الجرعات الدقيقة مع كوب ماء كامل، وعدم تناول أي أدوية جديدة أو مكملات دون إبلاغ الطبيب أو الصيدلي.'
                  : 'Always emphasize strict adherence to scheduled dosing intervals with a full glass of water and complete medication reconciliation.'}
              </p>
            </div>
            <div className="small muted">
              <b>{isAr ? 'المرجع:' : 'Reference:'}</b>{' '}
              <a href={INTERACTION_SOURCES.medlineplus_fda.url} target="_blank" rel="noopener noreferrer">
                {INTERACTION_SOURCES.medlineplus_fda.title}
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
