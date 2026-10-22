import { pick } from './types';
import { useState } from 'react';
import { useLang } from './i18n';
import { SYMPTOMS_LIST, EMERGENCY_WARNINGS, SymptomDetail, SymptomSeverity } from './sideEffectsData';

export default function SideEffectsGuide() {
  const { lang } = useLang();
  const [selectedSymptomId, setSelectedSymptomId] = useState<string>('anaphylaxis_breathing');

  const selectedSymptom: SymptomDetail | undefined = SYMPTOMS_LIST.find((s) => s.id === selectedSymptomId);

  const renderBadge = (sev: SymptomSeverity) => {
    switch (sev) {
      case 'emergency':
        return <span className="sev-badge severe">🚨 {lang === 'ar' ? 'طوارئ فورية (إسعاف)' : 'Immediate Emergency (ER)'}</span>;
      case 'prompt':
        return <span className="sev-badge moderate">⚠️ {lang === 'ar' ? 'استشارة طبية عاجلة خلال ساعات' : 'Prompt Medical Attention'}</span>;
      case 'mild':
        return <span className="sev-badge safe">🟢 {lang === 'ar' ? 'عرض خفيف — رعاية منزلية' : 'Common / Mild — Home Care'}</span>;
    }
  };

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>{lang === 'ar' ? 'الآثار الجانبية للمضادات الحيوية: ماذا أفعل؟' : 'Antibiotic Side Effects: What Should I Do?'}</h1>
        <p className="muted">
          {lang === 'ar'
            ? 'دليل تثقيفي وتوعوي سريري لمساعدتك على فهم الأعراض الجانبية المحتملة، والتمييز بين الأعراض الخفيفة وعلامات الطوارئ التي تتطلب رعاية عاجلة.'
            : 'A medically responsible clinical guide helping patients recognize potential side effects, mild symptoms, and emergency warning signs.'}
        </p>
      </header>

      {/* Immediate Emergency Action Box - Category 3 (ALWAYS VISIBLE AT TOP) */}
      <section className="alert urgent emergency-top-box" role="alert">
        <div className="emerg-header">
          <span className="emerg-icon">🚨</span>
          <div>
            <h2>{lang === 'ar' ? 'علامات الطوارئ الخطيرة (طلب الإسعاف فوراً):' : 'Emergency Warning Signs (Seek Help Immediately):'}</h2>
            <p className="emerg-text">{pick(EMERGENCY_WARNINGS, lang)}</p>
          </div>
        </div>
        <div className="emerg-action-row">
          <span className="emerg-call">
            📞 <b>{lang === 'ar' ? 'رقم الإسعاف في مصر: 123' : 'Emergency Ambulance: 123 (Egypt)'}</b>
          </span>
          <small className="emerg-sub">
            {lang === 'ar'
              ? 'لا تنتظر ولا تكمل أي استبيان في حالات الطوارئ؛ توجه فوراً لأقرب مستشفى!'
              : 'Do not wait or fill forms during emergencies; proceed directly to the emergency department!'}
          </small>
        </div>
      </section>

      {/* The 3 Core Categories Overview */}
      <section className="card stack">
        <h2>📑 {lang === 'ar' ? 'فئات الأعراض الثلاث وكيفية التصرف:' : 'The 3 Side Effect Categories & What To Do:'}</h2>
        <div className="categories-grid">
          {/* Category 1 */}
          <div className="cat-card mild-card">
            <div className="cat-header">
              <span className="cat-pill safe">🟢 {lang === 'ar' ? 'الفئة 1: شائعة وخفيفة عادة' : 'Category 1: Common / Mild'}</span>
            </div>
            <h3>{lang === 'ar' ? 'أعراض هضمية خفيفة' : 'Mild Digestive Symptoms'}</h3>
            <p className="small">
              {lang === 'ar'
                ? 'مثل: الغثيان الخفيف، ليونة البراز المؤقتة، اضطراب المعدة، أو الطعم المعدني. تزول عادة بتناول الدواء مع الطعام أو استخدام البروبيوتيك.'
                : 'e.g. Mild nausea, slight loose stools, stomach upset, or metallic taste. Usually managed with food and hydration.'}
            </p>
            <div className="cat-action">
              <b>{lang === 'ar' ? 'التصرف:' : 'Action:'}</b> {lang === 'ar' ? 'رعاية منزلية وسوائل؛ استشر الصيدلي إذا اشتدت.' : 'Home care and fluids; consult pharmacist if worsening.'}
            </div>
          </div>

          {/* Category 2 */}
          <div className="cat-card prompt-card">
            <div className="cat-header">
              <span className="cat-pill moderate">🟡 {lang === 'ar' ? 'الفئة 2: تستدعي استشارة عاجلة' : 'Category 2: Prompt Medical Advice'}</span>
            </div>
            <h3>{lang === 'ar' ? 'أعراض حادة تتطلب التقييم' : 'Symptoms Needing Prompt Assessment'}</h3>
            <p className="small">
              {lang === 'ar'
                ? 'مثل: الإسهال المائي المتكرر أو الدموي (خطر C. diff)، ألم مفاجئ بالأوتار، اصفرار العينين (يرقان)، أو طفح جلدي متسع.'
                : 'e.g. Severe watery diarrhea (C. difficile risk), tendon pain, jaundice, or spreading rash.'}
            </p>
            <div className="cat-action">
              <b>{lang === 'ar' ? 'التصرف:' : 'Action:'}</b> {lang === 'ar' ? 'اتصل بالطبيب أو الصيدلي فوراً لتقييم واستبدال الدواء.' : 'Contact doctor promptly to evaluate and modify therapy.'}
            </div>
          </div>

          {/* Category 3 */}
          <div className="cat-card severe-card">
            <div className="cat-header">
              <span className="cat-pill severe">🔴 {lang === 'ar' ? 'الفئة 3: علامات طوارئ قاتلة' : 'Category 3: Emergency Signs'}</span>
            </div>
            <h3>{lang === 'ar' ? 'صدمة تحسسية وانسداد تنفس' : 'Severe Anaphylaxis & Airway'}</h3>
            <p className="small">
              {lang === 'ar'
                ? 'مثل: تورم اللسان والحلق، صفير الصدر، ضيق التنفس الشديد، الدوار الشديد والإغماء، أو فقاعات وتقشر الجلد.'
                : 'e.g. Swollen throat/tongue, wheezing, severe breathing distress, collapse, or blistering skin rash.'}
            </p>
            <div className="cat-action">
              <b>{lang === 'ar' ? 'التصرف:' : 'Action:'}</b> {lang === 'ar' ? 'اتصل بالإسعاف (123) وتوجه لأقرب طوارئ فوراً دون تأخير.' : 'Call ambulance (123) and seek immediate emergency care.'}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Symptom Explorer */}
      <section className="card stack">
        <h2>🔍 {lang === 'ar' ? 'المستكشف التفاعلي للأعراض الجانبية:' : 'Interactive Symptom Explorer:'}</h2>
        <p className="muted small">
          {lang === 'ar'
            ? 'اختر العرض الذي تشعر به للاطلاع على التقييم السريري والتصرف الفوري ونصيحة التمريض المعتمدة.'
            : 'Select the symptom you are experiencing to view clinical evaluation and nursing guidance.'}
        </p>

        <div className="symptom-picker-row">
          <label><b>{lang === 'ar' ? 'اختر العرض:' : 'Select Symptom:'}</b></label>
          <select
            className="select-input"
            value={selectedSymptomId}
            onChange={(e) => setSelectedSymptomId(e.target.value)}
            aria-label="Select Symptom"
          >
            {SYMPTOMS_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.severity === 'emergency' ? '🔴' : s.severity === 'prompt' ? '🟡' : '🟢'} {pick(s.name, lang)}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Symptom Detailed Card */}
        {selectedSymptom && (
          <div className={`card symptom-detail-card ${selectedSymptom.severity}`}>
            <div className="sym-head">
              {renderBadge(selectedSymptom.severity)}
              <h3>{pick(selectedSymptom.name, lang)}</h3>
            </div>

            <div className="sym-content stack">
              <div className="sym-section">
                <h4>🔬 {lang === 'ar' ? 'التفسير السريري للعرض:' : 'Clinical Explanation:'}</h4>
                <p>{pick(selectedSymptom.description, lang)}</p>
              </div>

              <div className="sym-section action-highlight">
                <h4>⚡ {lang === 'ar' ? 'ما يجب عليك فعله الآن (الإجراء الفوري):' : 'What You Should Do Now:'}</h4>
                <p><b>{pick(selectedSymptom.immediateAction, lang)}</b></p>
              </div>

              <div className="sym-section offending-drugs">
                <h4>💊 {lang === 'ar' ? 'أشهر الأدوية المرتبطة بهذا العرض:' : 'Common Culprit Medications:'}</h4>
                <p><i>{pick(selectedSymptom.commonOffenders, lang)}</i></p>
              </div>

              <div className="nursing-box">
                <h4>🩺 {lang === 'ar' ? 'توجيه وتمريض سريري (Nursing Assessment & Care):' : 'Nursing Clinical Guidance:'}</h4>
                <p>{pick(selectedSymptom.nursingAdvice, lang)}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Allergy Awareness Module */}
      <section className="card stack allergy-module">
        <h2>🛡️ {lang === 'ar' ? 'التوعية بالحساسية الدوائية (Allergy Awareness):' : 'Allergy Awareness Guide:'}</h2>
        <div className="allergy-grid">
          <div className="allergy-col">
            <h3>{lang === 'ar' ? 'الفرق بين الحساسية والأثر الجانبي العادي:' : 'Allergy vs Typical Side Effect:'}</h3>
            <ul>
              <li>
                <b>{lang === 'ar' ? 'الحساسية الدوائية الحقيقية (Allergy):' : 'True Drug Allergy:'}</b>{' '}
                {lang === 'ar'
                  ? 'تفاعل مناعي يحدث للأشخاص المتحسسين فقط، ويظهر في صورة طفح جلدي حاك، تورم بالوجه أو الشفتين، أو صعوبة تنفس. قد تتكرر وتشتد في المرات القادمة.'
                  : 'Immune-mediated response presenting as hives, angioedema, or bronchospasm. Can be life-threatening upon re-exposure.'}
              </li>
              <li>
                <b>{lang === 'ar' ? 'الآثار الجانبية العادية (Common Side Effects):' : 'Common Side Effects:'}</b>{' '}
                {lang === 'ar'
                  ? 'تأثيرات دوائية مباشرة على الجهاز الهضمي كالاضطراب الخفيف والغثيان أو الإسهال البسيط دون تدخل مناعي.'
                  : 'Direct pharmacological effects on mucosal tissues such as mild nausea or stomach ache without immune involvement.'}
              </li>
            </ul>
          </div>
          <div className="allergy-col notice-col">
            <div className="notice-box">
              <h4>⚠️ {lang === 'ar' ? 'قاعدة السلامة الذهبية للتمريض:' : 'Golden Nursing Safety Rule:'}</h4>
              <p>
                {lang === 'ar'
                  ? 'أبلغ الطبيب والممرض دائماً وقبل أخذ أي دواء إذا كنت قد تعرضت سابقاً لأي حساسية أو طفح جلدي من أي مضاد حيوي. اسأل دائماً عن اختبار حساسية البنسلين قبل أخذ الحقن الوريدية أو العضلية.'
                  : 'Always inform your healthcare team of any past antibiotic allergies. Penicillin skin testing is required before parenteral administration.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* References & Documented Sources */}
      <section className="card">
        <h3>📚 {lang === 'ar' ? 'المراجع والمصادر السريرية المعتمدة:' : 'Clinical Sources & Guidelines:'}</h3>
        <ul className="srclist">
          <li>
            <a href="https://www.cdc.gov/antibiotic-use/safety/side-effects.html" target="_blank" rel="noopener noreferrer">
              CDC — Antibiotic Side Effects and Adverse Reactions
            </a>
            <span className="small muted"> · Centers for Disease Control and Prevention · 2024-2026</span>
          </li>
          <li>
            <a href="https://medlineplus.gov/druginformation.html" target="_blank" rel="noopener noreferrer">
              MedlinePlus Drug Information Monographs
            </a>
            <span className="small muted"> · National Library of Medicine (NIH)</span>
          </li>
          <li>
            <a href="https://www.nhs.uk/conditions/antibiotics/side-effects/" target="_blank" rel="noopener noreferrer">
              NHS — Antibiotics Side Effects & Allergic Reactions
            </a>
            <span className="small muted"> · National Health Service</span>
          </li>
        </ul>
        <p className="small muted" style={{ marginTop: '8px' }}>
          {lang === 'ar' ? 'آخر مراجعة سريرية: 13 أكتوبر 2026 بواسطة لجنة التمريض والترشيد السريري.' : 'Last clinically reviewed: October 13, 2026 by Nursing Stewardship Committee.'}
        </p>
      </section>
    </main>
  );
}
