import { useState } from 'react';
import { useLang } from './i18n';
import {
  PEDIATRIC_SUSPENSIONS,
  RECONSTITUTION_STEPS,
  PediatricSuspension,
} from './pediatricData';

export default function PediatricHelper() {
  const { lang } = useLang();

  // Selected suspension
  const [selectedId, setSelectedId] = useState('augmentin_457');
  const selectedMed: PediatricSuspension =
    PEDIATRIC_SUSPENSIONS.find((m) => m.id === selectedId) || PEDIATRIC_SUSPENSIONS[0];

  // Weight calculator states (stored as string so user can freely backspace all digits)
  const [weightInput, setWeightInput] = useState<string>('12');
  const weightKg = Math.max(0, parseFloat(weightInput) || 0);
  const [useHighDose, setUseHighDose] = useState<boolean>(false);

  // Shelf-life countdown states
  const [reconstitutedDate, setReconstitutedDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0],
  );

  // Calculate doses
  const doseMgPerKg =
    useHighDose && selectedMed.highDoseMgPerKgPerDay
      ? selectedMed.highDoseMgPerKgPerDay
      : selectedMed.standardDoseMgPerKgPerDay;

  const totalMgPerDay = Math.round(weightKg * doseMgPerKg);
  const singleDoseMg = Math.round(totalMgPerDay / selectedMed.dosesPerDay);
  // Volume in ml per single dose
  const singleDoseMl = Math.round((singleDoseMg / selectedMed.mgPerMl) * 10) / 10;

  // Calculate expiration date
  const [reYear, reMonth, reDay] = reconstitutedDate.split('-').map(Number);
  const reDateObj = new Date(reYear, reMonth - 1, reDay);
  const expDateObj = new Date(reDateObj.getTime() + selectedMed.shelfLifeDays * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expDateObj.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>👶 {lang === 'ar' ? 'دليل ومساعد تمريض الأطفال للمضادات الحيوية' : 'Pediatric Antibiotic Reconstitution & Dosing Helper'}</h1>
        <p className="muted">
          {lang === 'ar'
            ? 'أداة سريرية وتوعوية مخصصة للأمهات والتمريض لحساب الجرعات بدقة السيرنجة (مل)، إرشادات حل البودرة بالماء المقطر، ومتتبع صلاحية الزجاجة في الثلاجة.'
            : 'Clinical pediatric tool for mothers and nurses: weight-based oral syringe dosing, reconstitution steps, and refrigerator shelf-life countdown.'}
        </p>
      </header>

      {/* Drug Selection Card */}
      <section className="card stack">
        <h2>💊 {lang === 'ar' ? 'اختر المضاد الحيوي الشراب المعلق:' : 'Select Pediatric Antibiotic Suspension:'}</h2>
        <div className="field-group">
          <select
            className="select-input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label="Select Pediatric Suspension"
          >
            {PEDIATRIC_SUSPENSIONS.map((med) => (
              <option key={med.id} value={med.id}>
                {med.tradeName[lang]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* SECTION 1: Weight-Based Syringe Volume Calculator */}
      <section className="card stack highlight-card">
        <div className="card-head-row">
          <div>
            <h2>⚖️ {lang === 'ar' ? 'حاسبة جرعة الطفل بالسيرنجة بالملليلتر (ml):' : 'Weight-Based Syringe Dosing Calculator:'}</h2>
            <p className="small muted">
              {lang === 'ar'
                ? 'تحسب الجرعة الدقيقة لكل مرة بناءً على وزن الطفل بالكيلوجرام وتركيز الدواء المختار.'
                : 'Calculates exact single-dose volume in milliliters based on body weight.'}
            </p>
          </div>
          <span className="cat-pill safe">
            {selectedMed.dosesPerDay} {lang === 'ar' ? `مرات يومياً (كل ${selectedMed.frequencyHours} ساعة)` : `times daily (every ${selectedMed.frequencyHours}h)`}
          </span>
        </div>

        <div className="calc-inputs-row">
          <div className="field-group">
            <label><b>{lang === 'ar' ? 'وزن الطفل بالكيلوجرام (كجم):' : 'Child Weight (kg):'}</b></label>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              max={60}
              step={0.5}
              placeholder={lang === 'ar' ? 'أدخل وزن الطفل بالكيلوجرام (مثلاً: 12)' : 'Enter child weight in kg (e.g. 12)'}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="number-input"
            />
            <div className="row wrapRow" style={{ gap: '6px', marginTop: '8px' }}>
              <span className="small muted">{lang === 'ar' ? 'اختيار سريع:' : 'Quick pick:'}</span>
              {[5, 8, 10, 12, 15, 20, 25].map((w) => (
                <button
                  key={w}
                  type="button"
                  className={'chip ' + (weightInput === String(w) ? 'on' : '')}
                  style={{ padding: '2px 10px', fontSize: '0.8rem' }}
                  onClick={() => setWeightInput(String(w))}
                >
                  {w} {lang === 'ar' ? 'كجم' : 'kg'}
                </button>
              ))}
            </div>
          </div>

          {selectedMed.highDoseMgPerKgPerDay && (
            <div className="field-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useHighDose}
                  onChange={(e) => setUseHighDose(e.target.checked)}
                />
                <span>
                  {lang === 'ar'
                    ? 'جرعة عالية (لالتهاب الأذن الوسطى الحاد أو العدوى الشديدة حسب أمر الطبيب)'
                    : 'High Dose Regimen (e.g. for acute otitis media under medical direction)'}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Calculation Result Box */}
        <div className="dose-result-box">
          <div className="result-kpi-row">
            <div className="kpi-block highlight">
              <span className="kpi-sub">{lang === 'ar' ? 'الجرعة في المرة الواحدة بالسيرنجة' : 'Single Dose Volume'}</span>
              <span className="kpi-main">{singleDoseMl} <small>{lang === 'ar' ? 'مل (ml)' : 'ml'}</small></span>
              <span className="kpi-freq">
                {lang === 'ar' ? `كل ${selectedMed.frequencyHours} ساعة بدقة` : `Every ${selectedMed.frequencyHours} hours`}
              </span>
            </div>

            <div className="kpi-block">
              <span className="kpi-sub">{lang === 'ar' ? 'إجمالي المادة الفعالة باليوم' : 'Total Daily Dose'}</span>
              <span className="kpi-val">{totalMgPerDay} <small>مجم/يوم</small></span>
              <span className="kpi-sub">{singleDoseMg} مجم في كل جرعة</span>
            </div>
          </div>

          {/* Interactive Syringe Visualizer */}
          <div className="syringe-visualizer stack">
            <h4>💉 {lang === 'ar' ? 'محاكي سرنجة القياس المعيارية (اسحبي حتى هذه العلامة):' : 'Oral Syringe Visualizer:'}</h4>
            <div className="syringe-graphic">
              <div className="syringe-barrel">
                <div
                  className="syringe-fluid"
                  style={{ width: `${Math.min(100, (singleDoseMl / 10) * 100)}%` }}
                >
                  <span className="fluid-label">{singleDoseMl} ml</span>
                </div>
                <div className="syringe-scale">
                  <span>0</span>
                  <span>2.5 ml</span>
                  <span>5 ml</span>
                  <span>7.5 ml</span>
                  <span>10 ml</span>
                </div>
              </div>
            </div>
            <p className="small muted text-center">
              {lang === 'ar'
                ? `اسحبي الدواء بالسرنجة حتى علامة ${singleDoseMl} ملليلتر بالضبط.`
                : `Draw the liquid medicine up to the ${singleDoseMl} ml mark on your oral syringe.`}
            </p>
          </div>

          {/* Crucial Spoon Warning */}
          <div className="spoon-warning-alert alert urgent">
            <strong>🚫 {lang === 'ar' ? 'تحذير تمريضي صارم للأمهات:' : 'Strict Nursing Warning:'} </strong>
            {lang === 'ar'
              ? 'ممنوع منعاً باتاً إعطاء المضاد الحيوي بملاعق الطعام أو الشاي المنزلية! سعة الملاعق تتفاوت عشوائياً بين 2.5 إلى 7 مل، مما يسبب جرعة ناقصة لا تشفي الطفل أو جرعة زائدة سامة. استخدمي دائماً سرنجة القياس المدرجة بالملليلتر.'
              : 'Never use household kitchen spoons or teaspoons! Household spoons vary widely from 2.5ml to 7ml, risking therapeutic failure or overdose. Always use a calibrated oral dosing syringe.'}
          </div>
        </div>
      </section>

      {/* SECTION 2: Shelf-Life Tracker & Expiration Countdown */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>🧊 {lang === 'ar' ? 'متتبع ومؤقت صلاحية الزجاجة بعد الحل:' : 'Suspension Reconstitution & Shelf-Life Tracker:'}</h2>
            <p className="small muted">
              {lang === 'ar'
                ? 'المضادات الحيوية المعلقة تفسد بسرعة بعد حلها بالماء؛ تابعي تاريخ الانتهاء لضمان سلامة طفلك.'
                : 'Reconstituted suspensions degrade quickly. Track expiration to protect your child.'}
            </p>
          </div>
          <span className={`status-pill ${isExpired ? 'severe' : 'taken'}`}>
            {isExpired
              ? (lang === 'ar' ? 'منتهية الصلاحية ⛔' : 'Expired ⛔')
              : (lang === 'ar' ? `صالحة (${daysRemaining} أيام متبقية ✅)` : `Safe (${daysRemaining} days left ✅)`)}
          </span>
        </div>

        <div className="shelf-controls-grid">
          <div className="field-group">
            <label><b>{lang === 'ar' ? 'تاريخ حل الزجاجة بالماء المقطر:' : 'Date Reconstituted with Water:'}</b></label>
            <input
              type="date"
              value={reconstitutedDate}
              onChange={(e) => setReconstitutedDate(e.target.value)}
              className="select-input"
            />
          </div>

          <div className="field-group">
            <label><b>{lang === 'ar' ? 'مكان الحفظ المعتمد لهذا الدواء:' : 'Approved Storage:'}</b></label>
            <div className="storage-badge-box">
              {selectedMed.storageCondition === 'fridge' ? (
                <span className="storage-badge fridge">
                  🧊 {lang === 'ar' ? 'يجب حفظه في باب الثلاجة (2 - 8 درجات مئوية)' : 'Refrigerate (2-8°C)'}
                </span>
              ) : (
                <span className="storage-badge room">
                  🏠 {lang === 'ar' ? 'يحفظ في درجة حرارة الغرفة (لا يوضع في الثلاجة)' : 'Room Temperature (Do not refrigerate)'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expiration Details Card */}
        <div className={`countdown-box ${isExpired ? 'expired-box' : 'active-box'}`}>
          <div className="countdown-header">
            <div>
              <h3>
                {isExpired
                  ? (lang === 'ar' ? '⛔ انتهت صلاحية هذه الزجاجة!' : '⛔ This Bottle Has Expired!')
                  : (lang === 'ar' ? `⏳ متبقي ${daysRemaining} يوم على انتهاء الصلاحية` : `⏳ ${daysRemaining} Days Remaining`)}
              </h3>
              <p className="small">
                {lang === 'ar'
                  ? `أقصى مدة صلاحية لهذا الدواء: ${selectedMed.shelfLifeDays} أيام من تاريخ الحل (تاريخ الانتهاء: ${expDateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}).`
                  : `Maximum stability: ${selectedMed.shelfLifeDays} days (Expires on ${expDateObj.toLocaleDateString('en-GB')}).`}
              </p>
            </div>
          </div>

          {isExpired ? (
            <div className="alert danger-alert" style={{ marginTop: '10px' }}>
              <strong>⚠️ تخلصي من الزجاجة فوراً: </strong>
              {lang === 'ar'
                ? 'لا تعطي الطفل من هذه الزجاجة نهائياً؛ فالمادة الفعالة تفككت وفقدت قدرتها على قتل البكتيريا، وتناولها قد يسبب اضطراباً معوياً وتسمماً وتكون بكتيريا مقاومة!'
                : 'Discard this bottle immediately! The active antibiotic molecule has degraded and is ineffective and unsafe.'}
            </div>
          ) : (
            <p className="storage-instruction-text">
              💡 <b>{lang === 'ar' ? 'إرشاد التخزين:' : 'Storage Instruction:'}</b> {selectedMed.storageNote[lang]}
            </p>
          )}
        </div>
      </section>

      {/* SECTION 3: Step-by-Step Reconstitution Protocol */}
      <section className="card stack">
        <h2>💧 {lang === 'ar' ? 'بروتوكول التمريض لحل البودرة بالماء المقطر (خطوة بخطوة):' : 'Step-by-Step Reconstitution Protocol:'}</h2>
        <div className="steps-cards-grid">
          {RECONSTITUTION_STEPS.map((step) => (
            <div key={step.stepNumber} className="step-card">
              <div className="step-badge-row">
                <span className="step-icon">{step.icon}</span>
                <span className="step-num-pill">{lang === 'ar' ? `الخطوة ${step.stepNumber}` : `Step ${step.stepNumber}`}</span>
              </div>
              <h3>{step.title[lang]}</h3>
              <p className="step-inst">{step.instruction[lang]}</p>
              <div className="step-warning">
                <small>⚠️ <b>{step.nursingWarning[lang]}</b></small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Golden Pediatric Nursing Rules */}
      <section className="card stack allergy-module">
        <h2>🛡️ {lang === 'ar' ? 'القواعد الذهبية لتمريض الأطفال وإرشادات الأمهات:' : 'Golden Pediatric Nursing Rules for Mothers:'}</h2>
        <div className="allergy-grid">
          <div className="allergy-col">
            <h3>{lang === 'ar' ? 'ماذا تفعلين إذا تقيأ الطفل الجرعة؟' : 'What if the Child Vomits the Dose?'}</h3>
            <ul>
              <li>
                <b>{lang === 'ar' ? 'إذا تقيأ خلال أقل من 15 دقيقة من أخذ الدواء:' : 'Within 15 minutes of taking dose:'}</b>{' '}
                {lang === 'ar'
                  ? 'انتظري حتى يهدأ الطفل قليلاً، ثم أعيدي إعطاء نفس الجرعة كاملة مرة أخرى؛ لأن الدواء لم يُمتص بعد وطُرد كاملاً.'
                  : 'Wait until the child settles, then repeat the full dose; the drug was not yet absorbed.'}
              </li>
              <li>
                <b>{lang === 'ar' ? 'إذا تقيأ بعد أكثر من 30 دقيقة:' : 'After 30 minutes or more:'}</b>{' '}
                {lang === 'ar'
                  ? 'لا تعيدي الجرعة أبداً! فالجسم امتص معظم الدواء، وتكرار الجرعة قد يسبب تسمماً دوائياً. انتظري موعد الجرعة التالية.'
                  : 'Do NOT repeat the dose; the majority has already been absorbed into the bloodstream. Wait for the next scheduled dose.'}
              </li>
            </ul>
          </div>

          <div className="allergy-col notice-col">
            <div className="notice-box">
              <h4>🍼 {lang === 'ar' ? 'إذا كان الطفل يرفض طعم الدواء المر:' : 'If the Child Refuses the Bitter Taste:'}</h4>
              <p>
                {lang === 'ar'
                  ? 'يمكنك خلط الجرعة المقاسة بالسيرنجة مع ملعقة واحدة فقط من الزبادي أو عصير الفاكهة مباشرة قبل إعطائها له، مع التأكد من تناولها كاملة. ممنوع خلط الدواء في زجاجة الحليب أو الببرونة كاملة حتى لا يرفض شربها وتضيع الجرعة.'
                  : 'Mix the measured dose into a single spoonful of yogurt or fruit puree immediately before giving. Never mix into a full baby bottle.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
