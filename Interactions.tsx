import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { pick } from './types';
import { TARGETS, RULES, COMMON_QUICK_CHECKS, InteractionRule, Severity } from './interactionsData';

export default function Interactions() {
  const { lang } = useLang();
  const { items } = useApproved();
  const meds = items ?? [];

  const [selectedMed, setSelectedMed] = useState('ciprofloxacin');
  const [selectedTarget, setSelectedTarget] = useState('dairy');

  // Find matching rule
  const matchedRule: InteractionRule | undefined = RULES.find(
    (r) => r.antibioticId === selectedMed && r.targetId === selectedTarget,
  );

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
            🔴 {lang === 'ar' ? 'تعارض خطير / ممنوع الجمع بينهما' : 'Severe / Contraindicated'}
          </span>
        );
      case 'moderate':
        return (
          <span className="sev-badge moderate">
            🟡 {lang === 'ar' ? 'تفاعل متوسط — يلزم الفصل الزمني' : 'Moderate — Timing Separation Required'}
          </span>
        );
      case 'safe':
        return (
          <span className="sev-badge safe">
            🟢 {lang === 'ar' ? 'آمن تماماً وموصى به' : 'Safe & Recommended'}
          </span>
        );
    }
  };

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>{lang === 'ar' ? 'فاحص التفاعلات الدوائية والغذائية' : 'Drug & Food Interaction Checker'}</h1>
        <p className="muted">
          {lang === 'ar'
            ? 'أداة سريرية تفاعلية لفحص التداخلات بين المضادات الحيوية والأطعمة (كالحليب)، المكملات (كالحديد)، والأدوية الأخرى لضمان الإعطاء الآمن وسلامة المريض.'
            : 'Interactive clinical tool to evaluate interactions between antibiotics, foods, minerals, and concurrent medications to ensure safe patient administration.'}
        </p>
      </header>

      {/* Quick check chips */}
      <section className="card stack">
        <h2>⚡ {lang === 'ar' ? 'فحص سريع لأشهر التداخلات الشائعة:' : 'Common Quick Checks:'}</h2>
        <div className="chips">
          {COMMON_QUICK_CHECKS.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`chip ${selectedMed === c.antibioticId && selectedTarget === c.targetId ? 'active-chip' : ''}`}
              onClick={() => applyQuickCheck(c.antibioticId, c.targetId)}
            >
              {c.label[lang]}
            </button>
          ))}
        </div>
      </section>

      {/* Selection card */}
      <section className="card stack">
        <h2>🔍 {lang === 'ar' ? 'اختر العناصر للفحص السريري:' : 'Select Items to Check:'}</h2>
        <div className="check-grid">
          <div className="field-group">
            <label>
              <b>1. {lang === 'ar' ? 'المضاد الحيوي:' : 'Antibiotic:'}</b>
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
              <b>2. {lang === 'ar' ? 'الطعام أو الدواء المتفاعل:' : 'Interacting Food or Medication:'}</b>
            </label>
            <select
              className="select-input"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              aria-label="Select Interacting Target"
            >
              <optgroup label={lang === 'ar' ? 'الأطعمة والمشروبات' : 'Foods & Beverages'}>
                {TARGETS.filter((t) => t.category === 'food').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name[lang]}
                  </option>
                ))}
              </optgroup>
              <optgroup label={lang === 'ar' ? 'المعادن والمكملات' : 'Minerals & Supplements'}>
                {TARGETS.filter((t) => t.category === 'supplement').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name[lang]}
                  </option>
                ))}
              </optgroup>
              <optgroup label={lang === 'ar' ? 'الأدوية الشائعة' : 'Common Medications'}>
                {TARGETS.filter((t) => t.category === 'drug').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name[lang]}
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
            <h3>{matchedRule.title[lang]}</h3>
          </div>

          <div className="result-body stack">
            <div className="result-section">
              <h4>🔬 {lang === 'ar' ? 'الآلية والتأثير العلمي:' : 'Mechanism of Interaction:'}</h4>
              <p>{matchedRule.mechanism[lang]}</p>
            </div>

            <div className="result-section">
              <h4>⏱️ {lang === 'ar' ? 'التصرف الطبي الموصى به وكيفية الفصل:' : 'Clinical Management & Spacing:'}</h4>
              <p><b>{matchedRule.management[lang]}</b></p>
            </div>

            <div className="nursing-box">
              <h4>🩺 {lang === 'ar' ? 'توجيه وتمريض سريري (Nursing Stewardship Note):' : 'Nursing Clinical Stewardship Note:'}</h4>
              <p>{matchedRule.nursingTip[lang]}</p>
            </div>

            {currentMedObj && (
              <div className="med-link-row">
                <Link to={`/medicine/${currentMedObj.id}`} className="btn-secondary">
                  📖 {lang === 'ar' ? `فتح صفحة دواء ${pick(currentMedObj.genericName, lang)} وسعره وبدائله` : `View ${pick(currentMedObj.genericName, lang)} details`}
                </Link>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="card result-card safe">
          <div className="result-header">
            {severityBadge('safe')}
            <h3>
              {lang === 'ar'
                ? `لا يوجد تداخل سريري خطير معروف بين ${currentMedObj ? pick(currentMedObj.genericName, lang) : ''} و ${currentTargetObj ? currentTargetObj.name[lang] : ''}`
                : `No severe direct interaction documented between ${currentMedObj ? pick(currentMedObj.genericName, lang) : ''} and ${currentTargetObj ? currentTargetObj.name[lang] : ''}`}
            </h3>
          </div>
          <div className="result-body stack">
            <p>
              {lang === 'ar'
                ? 'وفق المراجع الدوائية المعتمدة (MedlinePlus و FDA)، لا يوجد تعارض مباشر يمنع امتصاص أو فاعلية الدواء مع هذا العنصر. ينصح دائماً بتناول المضاد مع كوب ماء وفير.'
                : 'According to clinical reference monographs, there is no significant pharmacokinetic inhibition reported between these two items.'}
            </p>
            <div className="nursing-box">
              <h4>🩺 {lang === 'ar' ? 'توجيه تمريضي عام:' : 'General Nursing Tip:'}</h4>
              <p>
                {lang === 'ar'
                  ? 'احرص على تثقيف المريض بالالتزام بمواعيد الجرعات الدقيقة، وعدم تناول أي أدوية جديدة أو مكملات دون إبلاغ الفريق التمريضي أو الصيدلي.'
                  : 'Always emphasize strict adherence to scheduled dosing intervals and patient medication reconciliation.'}
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
