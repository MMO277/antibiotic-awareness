import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { pick } from './types';
import {
  useSyncedHealthProfile,
  checkDrugAllergySafety,
  DRUG_ALLERGEN_MAP,
  AllergyRecord,
  DrugProfileCheckResult,
} from './allergyData';

export default function AllergyChecker() {
  const { lang } = useLang();
  const { items } = useApproved();
  const meds = items ?? [];

  const { profile } = useSyncedHealthProfile();
  const [selectedDrugId, setSelectedDrugId] = useState('amoxicillin-clavulanic-acid');
  const [simulatedAllergy, setSimulatedAllergy] = useState<string | null>(null);

  // Determine active allergies list (either real profile or quick simulation)
  let activeAllergies: AllergyRecord[] = profile.allergies;
  if (simulatedAllergy === 'penicillin') {
    activeAllergies = [
      {
        id: 'sim-pen',
        drugName: 'بنسلين / أموكسيسيلين',
        allergenKey: 'penicillin',
        reportedSymptoms: 'طفح جلدي شديد وتورم في الشفتين',
        severity: 'severe',
        evidenceStatus: 'patient_reported',
        createdAt: new Date().toISOString(),
      },
    ];
  } else if (simulatedAllergy === 'sulfa') {
    activeAllergies = [
      {
        id: 'sim-sulfa',
        drugName: 'مركبات السلفا (سبتازول)',
        allergenKey: 'sulfa',
        reportedSymptoms: 'حساسية جلدية شديدة وضيق تنفس',
        severity: 'life_threatening',
        evidenceStatus: 'clinically_verified',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const result: DrugProfileCheckResult = checkDrugAllergySafety(selectedDrugId, activeAllergies);
  const currentMedObj = meds.find((m) => m.id === selectedDrugId);

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>🛡️ {lang === 'ar' ? 'فاحص الحساسية والأمان الدوائي الذكي' : 'Smart Allergy & Medication Safety Checker'}</h1>
        <p className="muted">
          {lang === 'ar'
            ? 'نظام أمان سريري يفحص المادة الفعالة للدواء ويقارنها مع سجل حساسيتك الدوائية المسبقة، ويكشف احتمالات الحساسية المتصالبة (Cross-Reactivity).'
            : 'Clinical safety system matching active drug ingredients against your documented allergies and screening for cross-reactivity.'}
        </p>
      </header>

      {/* Patient Profile Context Header */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>👤 {lang === 'ar' ? 'سجل الحساسية النشط للفحص:' : 'Active Patient Allergy Record:'}</h2>
            <p className="small muted">
              {activeAllergies.length > 0
                ? (lang === 'ar'
                    ? `يوجد ${activeAllergies.length} أدوية مسجلة تسبب حساسية: ${activeAllergies.map((a) => a.drugName).join(' ، ')}`
                    : `${activeAllergies.length} documented allergies: ${activeAllergies.map((a) => a.drugName).join(', ')}`)
                : (lang === 'ar'
                    ? 'لم تسجل أي حساسية دوائية في ملفك الشخصي حتى الآن.'
                    : 'No documented drug allergies in your profile yet.')}
            </p>
          </div>
          <Link to="/health-profile" className="btn-secondary">
            📋 {lang === 'ar' ? 'فتح ملف صحتي وتعديل الحساسية' : 'Open My Health Profile'}
          </Link>
        </div>

        {/* Quick Simulation Chips */}
        <div className="sim-chips-bar">
          <small className="muted"><b>{lang === 'ar' ? 'أو جرب سيناريو سريري سريع:' : 'Or Try a Clinical Scenario:'}</b></small>
          <div className="chips">
            <button
              type="button"
              className={`chip ${simulatedAllergy === 'penicillin' ? 'active-chip' : ''}`}
              onClick={() => setSimulatedAllergy('penicillin')}
            >
              🧪 {lang === 'ar' ? 'سيناريو: مريض لديه حساسية بنسلين' : 'Scenario: Penicillin Allergic Patient'}
            </button>
            <button
              type="button"
              className={`chip ${simulatedAllergy === 'sulfa' ? 'active-chip' : ''}`}
              onClick={() => setSimulatedAllergy('sulfa')}
            >
              🧪 {lang === 'ar' ? 'سيناريو: مريض لديه حساسية مركبات السلفا' : 'Scenario: Sulfa Allergic Patient'}
            </button>
            {simulatedAllergy && (
              <button
                type="button"
                className="chip"
                onClick={() => setSimulatedAllergy(null)}
              >
                ↩ {lang === 'ar' ? 'الرجوع لسجلي الحقيقي' : 'Reset to My Profile'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Drug Selection Input */}
      <section className="card stack">
        <h2>💊 {lang === 'ar' ? 'اختر المضاد الحيوي المراد فحص أمانه:' : 'Select Antibiotic to Test for Allergy Safety:'}</h2>
        <div className="field-group">
          <select
            className="select-input"
            value={selectedDrugId}
            onChange={(e) => setSelectedDrugId(e.target.value)}
            aria-label="Select Antibiotic to Test"
          >
            {Object.entries(DRUG_ALLERGEN_MAP).map(([id, info]) => (
              <option key={id} value={id}>
                {lang === 'ar' ? info.nameAr : info.nameEn}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Safety Evaluation Result Card */}
      <section className={`card result-card ${result.matchLevel === 'exact_match' ? 'severe' : result.matchLevel === 'cross_reactivity' ? 'moderate' : 'safe'}`}>
        <div className="result-header">
          {result.matchLevel === 'exact_match' && (
            <span className="sev-badge severe">
              🚨 {lang === 'ar' ? 'خطر حاد! تطابق تام في مادة الحساسية' : 'Severe Warning: Exact Active Ingredient Match'}
            </span>
          )}
          {result.matchLevel === 'cross_reactivity' && (
            <span className="sev-badge moderate">
              🟠 {lang === 'ar' ? 'تحذير سريري: احتمالية حساسية متصالبة (Cross-Reactivity)' : 'Clinical Concern: Cross-Reactivity Risk'}
            </span>
          )}
          {result.matchLevel === 'no_match' && (
            <span className="sev-badge safe">
              🟢 {lang === 'ar' ? 'آمن — لا يوجد تطابق مع الحساسيات المسجلة' : 'Safe — No Recorded Allergy Match'}
            </span>
          )}
          {result.matchLevel === 'unverified' && (
            <span className="sev-badge moderate">
              🟡 {lang === 'ar' ? 'غير مؤكد — يرجى فحص النشرة' : 'Inconclusive Information'}
            </span>
          )}

          <h3>{result.title[lang]}</h3>
        </div>

        <div className="result-body stack">
          <div className="result-section">
            <h4>🔬 {lang === 'ar' ? 'التحليل السريري للمطابقة:' : 'Clinical Matching Analysis:'}</h4>
            <p>{result.explanation[lang]}</p>
          </div>

          <div className="result-section action-highlight">
            <h4>⚡ {lang === 'ar' ? 'التصرف الطبي الموصى به:' : 'Recommended Clinical Action:'}</h4>
            <p><b>{result.clinicalAction[lang]}</b></p>
          </div>

          <div className="nursing-box">
            <h4>🩺 {lang === 'ar' ? 'توجيه وتمريض سريري (Nursing Safety Protocol):' : 'Nursing Safety Protocol:'}</h4>
            <p>{result.nursingWarning[lang]}</p>
          </div>

          {currentMedObj && (
            <div className="med-link-row">
              <Link to={`/medicine/${currentMedObj.id}`} className="btn-secondary">
                📖 {lang === 'ar' ? `فتح صفحة دواء ${pick(currentMedObj.genericName, lang)} وسعره وبدائله` : `View ${pick(currentMedObj.genericName, lang)} Details`}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Clinical Disclaimer */}
      <section className="notice alert">
        <strong>⚠️ {lang === 'ar' ? 'إخلاء مسؤولية سريري:' : 'Clinical Disclaimer:'} </strong>
        {lang === 'ar'
          ? 'هذا النظام للمساعدة التثقيفية والتقييم السريري المساند فقط ولا يغني عن الفحص الطبي أو اختبار الحساسية الجلدي المباشر. استشر دائماً الطبيب أو الصيدلي قبل تناول أي دواء.'
          : 'This safety system is an educational clinical decision-support tool and does not replace in-person medical evaluation or skin testing.'}
      </section>
    </main>
  );
}
