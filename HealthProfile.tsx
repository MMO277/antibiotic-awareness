import { createPortal } from 'react-dom';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import {
  AllergyRecord,
  MedicationRecord,
  ALLERGEN_CATEGORIES,
  useSyncedHealthProfile,
  AllergySeverity,
  EvidenceStatus,
  PregnancyLactationStatus,
  OrganFunctionStatus,
} from './allergyData';
import { formatFrequencyLabel } from './trackerData';
import {
  evaluateMedicationSafety,
  resolveMedicationIdentity,
} from './medicationSafetyEngine';

export default function HealthProfile() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { profile, setProfile, syncing } = useSyncedHealthProfile();

  // Personal info edit state
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [ageInput, setAgeInput] = useState(profile.age);
  const [bloodInput, setBloodInput] = useState(profile.bloodType);
  const [contactInput, setContactInput] = useState(profile.emergencyContact);
  const [pregnancyInput, setPregnancyInput] = useState<PregnancyLactationStatus>(
    profile.pregnancyStatus || 'unknown'
  );
  const [renalInput, setRenalInput] = useState<OrganFunctionStatus>(
    profile.renalStatus || 'unknown'
  );
  const [hepaticInput, setHepaticInput] = useState<OrganFunctionStatus>(
    profile.hepaticStatus || 'unknown'
  );
  const [notesInput, setNotesInput] = useState(profile.notes);

  // Modal states
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);

  // New Allergy Form states
  const [drugName, setDrugName] = useState('');
  const [allergenKey, setAllergenKey] = useState('penicillin');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState<AllergySeverity>('severe');
  const [evidence, setEvidence] = useState<EvidenceStatus>('patient_reported');
  const [allergyNotes, setAllergyNotes] = useState('');

  // New Medication Form states
  const [medDrugName, setMedDrugName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('twice_daily');
  const [medRoute, setMedRoute] = useState('oral');
  const [medStatus, setMedStatus] = useState<'active' | 'completed' | 'discontinued'>('active');

  // Keep form inputs in sync when cloud profile finishes hydrating or updates from another device
  useEffect(() => {
    if (!editingPersonal) {
      setNameInput(profile.displayName);
      setAgeInput(profile.age);
      setBloodInput(profile.bloodType);
      setContactInput(profile.emergencyContact);
      setPregnancyInput(profile.pregnancyStatus || 'unknown');
      setRenalInput(profile.renalStatus || 'unknown');
      setHepaticInput(profile.hepaticStatus || 'unknown');
      setNotesInput(profile.notes);
    }
  }, [
    profile.displayName,
    profile.age,
    profile.bloodType,
    profile.emergencyContact,
    profile.pregnancyStatus,
    profile.renalStatus,
    profile.hepaticStatus,
    profile.notes,
    editingPersonal,
  ]);

  // Run the centralized Medication Safety Engine on the user's active profile medications & allergies
  const profileSafetyAssessment = useMemo(() => {
    const activeMeds = profile.medications.filter((m) => m.status === 'active');
    return evaluateMedicationSafety({
      medications: activeMeds.map((m) => ({
        id: m.id,
        rawName: m.drugName,
        activeIngredientId: m.activeIngredients || undefined,
        prescribedDose: m.prescribedDose,
        route: m.route,
        sourceType: 'profile_active',
      })),
      healthProfile: profile,
      includeProfileActiveMedications: false, // already supplied explicitly above
    });
  }, [profile]);

  const savePersonalInfo = (e: FormEvent) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      displayName: nameInput.trim(),
      age: ageInput.trim(),
      bloodType: bloodInput.trim(),
      emergencyContact: contactInput.trim(),
      pregnancyStatus: pregnancyInput,
      renalStatus: renalInput,
      hepaticStatus: hepaticInput,
      notes: notesInput.trim(),
    }));
    setEditingPersonal(false);
  };

  const addAllergy = (e: FormEvent) => {
    e.preventDefault();
    if (!drugName.trim()) return;
    const newRecord: AllergyRecord = {
      id: `all-${Date.now()}`,
      drugName: drugName.trim(),
      allergenKey,
      reportedSymptoms: symptoms.trim(),
      severity,
      evidenceStatus: evidence,
      notes: allergyNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    setProfile((prev) => ({ ...prev, allergies: [newRecord, ...prev.allergies] }));
    setShowAllergyModal(false);
    setDrugName('');
    setSymptoms('');
    setAllergyNotes('');
  };

  const deleteAllergy = (id: string) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this allergy record?')) {
      setProfile((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a.id !== id) }));
    }
  };

  const addMedication = (e: FormEvent) => {
    e.preventDefault();
    if (!medDrugName.trim()) return;
    const resolved = resolveMedicationIdentity({
      rawName: medDrugName.trim(),
      route: medRoute,
    });
    const newMed: MedicationRecord = {
      id: `med-${Date.now()}`,
      drugName: medDrugName.trim(),
      activeIngredients: resolved.activeIngredientId || '',
      prescribedDose: medDose.trim(),
      route: medRoute,
      frequency: medFreq,
      startDate: new Date().toISOString().split('T')[0],
      status: medStatus,
    };
    setProfile((prev) => ({ ...prev, medications: [newMed, ...prev.medications] }));
    setShowMedModal(false);
    setMedDrugName('');
    setMedDose('');
    setMedFreq('twice_daily');
    setMedRoute('oral');
  };

  const deleteMedication = (id: string) => {
    if (window.confirm(isAr ? 'هل تريد حذف هذا الدواء من سجلك؟' : 'Delete this medication record?')) {
      setProfile((prev) => ({ ...prev, medications: prev.medications.filter((m) => m.id !== id) }));
    }
  };

  const exportProfileData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `health_profile_${profile.displayName || 'patient'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const clearAllData = () => {
    if (window.confirm(isAr ? 'تحذير: سيتم مسح جميع بيانات الحساسية والأدوية المسجلة. هل توافق؟' : 'Warning: All stored health data will be deleted. Proceed?')) {
      setProfile({
        displayName: '',
        age: '',
        gender: '',
        bloodType: '',
        emergencyContact: '',
        notes: '',
        allergies: [],
        medications: [],
        pregnancyStatus: 'unknown',
        renalStatus: 'unknown',
        hepaticStatus: 'unknown',
      });
    }
  };

  const renderSeverityBadge = (s: AllergySeverity) => {
    switch (s) {
      case 'life_threatening':
        return <span className="sev-badge severe">🚨 {isAr ? 'مهددة للحياة (صدمة تحسسية)' : 'Life Threatening'}</span>;
      case 'severe':
        return <span className="sev-badge severe">🔴 {isAr ? 'شديدة (تورم/ضيق تنفس)' : 'Severe'}</span>;
      case 'moderate':
        return <span className="sev-badge moderate">🟡 {isAr ? 'متوسطة (طفح جلدي واسع)' : 'Moderate'}</span>;
      case 'mild':
        return <span className="sev-badge safe">🟢 {isAr ? 'خفيفة (حكة موضعية)' : 'Mild'}</span>;
    }
  };

  const activeMedsCount = profile.medications.filter((m) => m.status === 'active').length;

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>👤 {isAr ? 'ملف صحتي وحساسيتي الدوائية' : 'My Health Profile & Allergy Passport'}</h1>
        <p className="muted">
          {isAr
            ? 'سجل شخصي متكامل لتوثيق حساسيتك الدوائية وأدويتك الحالية وحالتك الصحية، متصل بمحرك السلامة الدوائية المركزي لحمايتك من تكرار المواد الفعالة والتداخلات الخطيرة.'
            : 'Personal health dashboard documenting your drug allergies, active medications, and clinical factors, connected to the centralized Medication Safety Engine.'}
          {syncing && (
            <span style={{ marginInlineStart: '8px', fontSize: '0.85em' }}>
              ({isAr ? 'جارٍ مزامنة بياناتك السحابية...' : 'Syncing cloud data...'})
            </span>
          )}
        </p>
      </header>

      {/* Action / Quick Safety Check Banner */}
      <section className="card highlight-card profile-banner">
        <div className="banner-content">
          <div>
            <h2>🛡️ {isAr ? 'فاحص الحساسية ورادار السلامة الدوائية' : 'Smart Allergy & Prescription Safety Check'}</h2>
            <p className="small">
              {isAr
                ? 'تحقق فوراً مما إذا كان أي مضاد حيوي يحتوي على مواد فعالة تطابق حساسيتك المسجلة أو يتكرر مع أدويتك الحالية.'
                : 'Instantly check whether any antibiotic matches your recorded allergies or duplicates your active medications.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/allergy-checker" className="btn btn-listen-all">
              ⚡ {isAr ? 'افحص حساسية دواء' : 'Allergy Checker'}
            </Link>
            <Link to="/prescription-radar" className="btn-secondary">
              📡 {isAr ? 'رادار الروشتة الكاملة' : 'Prescription Radar'}
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Overview */}
      <div className="kpi-grid">
        <div className="kpi-item unconfirmed">
          <span className="kpi-num">{profile.allergies.length}</span>
          <span className="kpi-label">{isAr ? 'أدوية تسبب حساسية ⚠️' : 'Documented Allergies'}</span>
        </div>
        <div className="kpi-item taken">
          <span className="kpi-num">{activeMedsCount}</span>
          <span className="kpi-label">{isAr ? 'أدوية أتناولها حالياً 💊' : 'Active Medications'}</span>
        </div>
        <div className="kpi-item upcoming">
          <span className="kpi-num">{profile.medications.filter((m) => m.status === 'completed').length}</span>
          <span className="kpi-label">{isAr ? 'أدوية مكتملة سابقة' : 'Past Courses'}</span>
        </div>
      </div>

      {/* Live Centralized Medication Safety Engine Assessment for Active Profile Medications */}
      {activeMedsCount > 0 && (
        <section
          className={`card result-card ${
            profileSafetyAssessment.overallStatus === 'urgent_review'
              ? 'severe'
              : profileSafetyAssessment.overallStatus === 'warning_review' ||
                  profileSafetyAssessment.overallStatus === 'caution_verify' ||
                  profileSafetyAssessment.overallStatus === 'incomplete_check'
                ? 'moderate'
                : 'safe'
          }`}
        >
          <div className="card-head-row">
            <div>
              <h2>
                🔬{' '}
                {isAr
                  ? 'نتيجة فحص محرك السلامة الدوائية لأدويتك الحالية:'
                  : 'Medication Safety Engine Assessment of Your Active Medications:'}
              </h2>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {profileSafetyAssessment.completeness.summaryBanner[lang]}
              </p>
            </div>
          </div>

          {profileSafetyAssessment.findings.length > 0 && (
            <div className="stack" style={{ gap: '10px', marginTop: '12px' }}>
              {profileSafetyAssessment.findings.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--line)',
                  }}
                >
                  <div className="row wrapRow" style={{ justifyContent: 'space-between', gap: '8px' }}>
                    <strong>{f.title[lang]}</strong>
                    <span
                      className={`sev-badge ${
                        f.severity === 'urgent'
                          ? 'severe'
                          : f.severity === 'warning' || f.severity === 'caution'
                            ? 'moderate'
                            : 'safe'
                      }`}
                      style={{ marginBottom: 0, fontSize: '0.76rem' }}
                    >
                      {f.severity === 'urgent'
                        ? isAr
                          ? 'عاجل / خطير'
                          : 'Urgent'
                        : f.severity === 'warning'
                          ? isAr
                            ? 'تحذير سريري'
                            : 'Warning'
                          : f.severity === 'caution'
                            ? isAr
                              ? 'يتطلب التحقق'
                              : 'Caution / Verify'
                            : isAr
                              ? 'إرشاد'
                              : 'Info'}
                    </span>
                  </div>
                  <p className="small" style={{ margin: '6px 0' }}>
                    {f.reason[lang]}
                  </p>
                  <p className="small" style={{ margin: '0 0 4px' }}>
                    <b>{isAr ? 'الخطوة الموصى بها:' : 'Recommended Next Step:'}</b> {f.nextStep[lang]}
                  </p>
                  <small className="muted">
                    {isAr ? 'المصدر:' : 'Source:'} {f.source.title[lang]}
                    {f.source.updatedDate ? ` · ${f.source.updatedDate}` : ''} ·{' '}
                    {f.dataCompleteness.uncertaintyNote[lang]}
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Personal Identity & Clinical Factors Card */}
      <section className="card stack">
        <div className="card-head-row">
          <h2>📋 {isAr ? 'البيانات الشخصية والعوامل الصحية للمريض:' : 'Patient Details & Clinical Factors:'}</h2>
          <button type="button" className="btn-secondary" onClick={() => setEditingPersonal(!editingPersonal)}>
            {editingPersonal ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? '✏️ تعديل البيانات' : '✏️ Edit')}
          </button>
        </div>

        {editingPersonal ? (
          <form onSubmit={savePersonalInfo} className="stack modal-form">
            <div className="form-row">
              <div className="form-group">
                <label><b>{isAr ? 'اسم المريض:' : 'Patient Name:'}</b></label>
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={isAr ? 'الاسم بالكامل' : 'Full Name'} />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'العمر:' : 'Age:'}</b></label>
                <input value={ageInput} onChange={(e) => setAgeInput(e.target.value)} placeholder={isAr ? 'مثال: 45 سنة أو 5 سنوات' : 'e.g. 45 or 5 years'} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label><b>{isAr ? 'فصيلة الدم:' : 'Blood Type:'}</b></label>
                <input value={bloodInput} onChange={(e) => setBloodInput(e.target.value)} placeholder="A+, O+, B-..." />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'رقم هاتف الطوارئ:' : 'Emergency Contact:'}</b></label>
                <input value={contactInput} onChange={(e) => setContactInput(e.target.value)} placeholder="01xxxxxxxxx" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label><b>{isAr ? 'حالة الحمل / الرضاعة (اختياري):' : 'Pregnancy / Lactation Status:'}</b></label>
                <select
                  value={pregnancyInput}
                  onChange={(e) => setPregnancyInput(e.target.value as PregnancyLactationStatus)}
                >
                  <option value="unknown">{isAr ? 'غير محدد' : 'Unspecified'}</option>
                  <option value="none">{isAr ? 'لا يوجد' : 'None'}</option>
                  <option value="pregnant">{isAr ? 'حامل 🤰' : 'Pregnant 🤰'}</option>
                  <option value="breastfeeding">{isAr ? 'مرضع 🤱' : 'Breastfeeding 🤱'}</option>
                </select>
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكلى (اختياري):' : 'Renal Function:'}</b></label>
                <select
                  value={renalInput}
                  onChange={(e) => setRenalInput(e.target.value as OrganFunctionStatus)}
                >
                  <option value="unknown">{isAr ? 'غير محدد' : 'Unspecified'}</option>
                  <option value="normal">{isAr ? 'طبيعية' : 'Normal'}</option>
                  <option value="impaired">{isAr ? 'قصور كلوي (يتطلب مراجعة الجرعات)' : 'Renal Impairment'}</option>
                </select>
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'وظائف الكبد (اختياري):' : 'Hepatic Function:'}</b></label>
                <select
                  value={hepaticInput}
                  onChange={(e) => setHepaticInput(e.target.value as OrganFunctionStatus)}
                >
                  <option value="unknown">{isAr ? 'غير محدد' : 'Unspecified'}</option>
                  <option value="normal">{isAr ? 'طبيعية' : 'Normal'}</option>
                  <option value="impaired">{isAr ? 'قصور كبدي (يتطلب مراجعة الجرعات)' : 'Hepatic Impairment'}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label><b>{isAr ? 'ملاحظات صحية إضافية:' : 'Additional Health Notes:'}</b></label>
              <input
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder={isAr ? 'مثال: أنيميا الفول، سكري، ضغط...' : 'e.g. G6PD deficiency, diabetes...'}
              />
            </div>
            <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
              💾 {isAr ? 'حفظ البيانات' : 'Save'}
            </button>
          </form>
        ) : (
          <div className="profile-details-grid">
            <div><b>{isAr ? 'الاسم:' : 'Name:'}</b> {profile.displayName || (isAr ? 'غير مسجل' : 'Not set')}</div>
            <div><b>{isAr ? 'العمر:' : 'Age:'}</b> {profile.age || '—'}</div>
            <div><b>{isAr ? 'فصيلة الدم:' : 'Blood Type:'}</b> {profile.bloodType || '—'}</div>
            <div><b>{isAr ? 'هاتف الطوارئ:' : 'Emergency Phone:'}</b> {profile.emergencyContact || '—'}</div>
            <div>
              <b>{isAr ? 'الحمل/الرضاعة:' : 'Pregnancy/Lactation:'}</b>{' '}
              {profile.pregnancyStatus === 'pregnant'
                ? isAr
                  ? 'حامل 🤰'
                  : 'Pregnant'
                : profile.pregnancyStatus === 'breastfeeding'
                  ? isAr
                    ? 'مرضع 🤱'
                    : 'Breastfeeding'
                  : profile.pregnancyStatus === 'none'
                    ? isAr
                      ? 'لا يوجد'
                      : 'None'
                    : '—'}
            </div>
            <div>
              <b>{isAr ? 'الكلى / الكبد:' : 'Renal / Hepatic:'}</b>{' '}
              {profile.renalStatus === 'impaired'
                ? isAr
                  ? 'قصور كلوي ⚠️'
                  : 'Renal Impairment ⚠️'
                : profile.hepaticStatus === 'impaired'
                  ? isAr
                    ? 'قصور كبدي ⚠️'
                    : 'Hepatic Impairment ⚠️'
                  : profile.renalStatus === 'normal' || profile.hepaticStatus === 'normal'
                    ? isAr
                      ? 'طبيعي'
                      : 'Normal'
                    : '—'}
            </div>
            {profile.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <b>{isAr ? 'ملاحظات صحية:' : 'Health Notes:'}</b> {profile.notes}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 1: My Allergies */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>🚨 {isAr ? 'سجل الحساسية الدوائية (My Allergies):' : 'Documented Drug Allergies:'}</h2>
            <p className="small muted">
              {isAr
                ? 'الأدوية التي تعرضت منها سابقاً لأي تفاعل تحسسي أو طفح جلدي أو ضيق تنفس.'
                : 'Medications or active ingredient families that have caused past allergic responses.'}
            </p>
          </div>
          <button type="button" className="btn" onClick={() => setShowAllergyModal(true)}>
            ➕ {isAr ? 'تسجيل دواء يسبب حساسية' : 'Add Allergy Record'}
          </button>
        </div>

        {profile.allergies.length === 0 ? (
          <div className="empty-state-box">
            <span>🛡️</span>
            <p>{isAr ? 'لا توجد أدوية مسببة للحساسية مسجلة حالياً في ملفك.' : 'No drug allergies documented yet.'}</p>
          </div>
        ) : (
          <div className="allergy-cards-stack">
            {profile.allergies.map((all) => {
              const cat = ALLERGEN_CATEGORIES.find((c) => c.id === all.allergenKey);
              return (
                <div key={all.id} className="allergy-item-card">
                  <div className="allergy-item-head">
                    <div>
                      <h3 className="allergy-drug-name">⚠️ {all.drugName}</h3>
                      <span className="small muted">
                        <b>{isAr ? 'العائلة الدوائية:' : 'Family:'}</b> {cat ? cat.name[lang] : all.allergenKey}
                      </span>
                    </div>
                    <div className="allergy-badges">
                      {renderSeverityBadge(all.severity)}
                      <button type="button" className="btn-secondary danger" onClick={() => deleteAllergy(all.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="allergy-item-body">
                    {all.reportedSymptoms && (
                      <p className="symptom-line">
                        <b>{isAr ? 'الأعراض التي حدثت:' : 'Symptoms:'}</b> {all.reportedSymptoms}
                      </p>
                    )}
                    {all.notes && <p className="notes-line">📝 {all.notes}</p>}
                    <small className="muted evidence-tag">
                      {isAr ? 'حالة التوثيق:' : 'Evidence:'}{' '}
                      {all.evidenceStatus === 'clinically_verified'
                        ? (isAr ? 'مؤكدة طبياً بفحص الحساسية ✅' : 'Clinically Verified')
                        : all.evidenceStatus === 'suspected'
                          ? (isAr ? 'مشتبه بها' : 'Suspected')
                          : (isAr ? 'أبلغ عنها المريض' : 'Patient-Reported')}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: My Medications */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>💊 {isAr ? 'قائمة أدويتي الحالية والسابقة:' : 'My Medications:'}</h2>
            <p className="small muted">
              {isAr
                ? 'سجل للأدوية التي تتناولها حالياً للرجوع إليها وفحص تداخلاتها وتكرار موادها الفعالة تلقائياً.'
                : 'List of your active and past prescriptions for automated medication reconciliation.'}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setShowMedModal(true)}>
            ➕ {isAr ? 'إضافة دواء' : 'Add Medication'}
          </button>
        </div>

        {profile.medications.length === 0 ? (
          <div className="empty-state-box">
            <span>💊</span>
            <p>{isAr ? 'لا توجد أدوية مسجلة حالياً.' : 'No medications recorded.'}</p>
          </div>
        ) : (
          <div className="med-cards-stack">
            {profile.medications.map((m) => {
              const resolved = resolveMedicationIdentity({
                rawName: m.drugName,
                activeIngredientId: m.activeIngredients || undefined,
                route: m.route,
              });
              return (
                <div key={m.id} className="med-record-card">
                  <div className="med-record-head">
                    <div>
                      <h4>{m.drugName}</h4>
                      <span className="small muted">
                        {[m.prescribedDose, formatFrequencyLabel(m.frequency, isAr)].filter(Boolean).join(' · ')}
                      </span>
                      {resolved.activeIngredient && (
                        <div className="small" style={{ color: 'var(--teal-dark)', marginTop: '2px' }}>
                          🧬 {isAr ? resolved.activeIngredient.nameAr : resolved.activeIngredient.nameEn}
                        </div>
                      )}
                      {resolved.resolutionStatus === 'unresolved' && (
                        <div className="small muted" style={{ marginTop: '2px' }}>
                          ⚠️ {isAr ? 'مادة فعالة غير متحققة بالسجل المحلي' : 'Unverified active ingredient'}
                        </div>
                      )}
                    </div>
                    <div className="med-record-actions">
                      <span className={`status-pill ${m.status === 'active' ? 'taken' : 'upcoming'}`}>
                        {m.status === 'active'
                          ? isAr
                            ? 'حالي'
                            : 'Active'
                          : m.status === 'discontinued'
                            ? isAr
                              ? 'متوقف'
                              : 'Discontinued'
                            : isAr
                              ? 'مكتمل'
                              : 'Past'}
                      </span>
                      <button type="button" className="undo-btn" onClick={() => deleteMedication(m.id)}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer Management Controls */}
      <div className="profile-footer-actions">
        <button type="button" className="btn-secondary" onClick={exportProfileData}>
          📥 {isAr ? 'تصدير وحفظ الملف (JSON)' : 'Export Profile (JSON)'}
        </button>
        <button type="button" className="btn-secondary danger" onClick={clearAllData}>
          🗑️ {isAr ? 'مسح بيانات الملف' : 'Reset Profile'}
        </button>
      </div>

      {/* Add Allergy Modal */}
      {showAllergyModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowAllergyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{isAr ? 'تسجيل دواء يسبب حساسية للمريض' : 'Record Drug Allergy'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowAllergyModal(false)}>✕</button>
            </div>

            <form onSubmit={addAllergy} className="stack modal-form">
              <div className="form-group">
                <label><b>{isAr ? 'اسم الدواء المسبب للحساسية:' : 'Allergenic Medication Name:'} *</b></label>
                <input
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder={isAr ? 'مثال: أوجمنتين، بنسلين، سبتازول...' : 'e.g. Amoxicillin, Penicillin, Augmentin'}
                  required
                />
              </div>

              <div className="form-group">
                <label><b>{isAr ? 'العائلة الدوائية المسببة:' : 'Allergen Family:'}</b></label>
                <select value={allergenKey} onChange={(e) => setAllergenKey(e.target.value)}>
                  {ALLERGEN_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[lang]} ({c.examples[lang]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label><b>{isAr ? 'الأعراض التي ظهرت عليك:' : 'Reported Symptoms:'} *</b></label>
                <input
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={isAr ? 'مثال: طفح جلدي حاك، تورم في الشفتين أو الوجه، صعوبة تنفس' : 'e.g. Hives, lip swelling, wheezing'}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'درجة الخطورة:' : 'Severity:'}</b></label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value as AllergySeverity)}>
                    <option value="life_threatening">{isAr ? 'مهددة للحياة (صدمة تحسسية وإغماء)' : 'Life Threatening'}</option>
                    <option value="severe">{isAr ? 'شديدة (تورم وضيق تنفس)' : 'Severe'}</option>
                    <option value="moderate">{isAr ? 'متوسطة (طفح جلدي واسع)' : 'Moderate'}</option>
                    <option value="mild">{isAr ? 'خفيفة (حكة خفيفة)' : 'Mild'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label><b>{isAr ? 'حالة التوثيق:' : 'Evidence Status:'}</b></label>
                  <select value={evidence} onChange={(e) => setEvidence(e.target.value as EvidenceStatus)}>
                    <option value="patient_reported">{isAr ? 'أبلغ عنها المريض' : 'Patient-Reported'}</option>
                    <option value="clinically_verified">{isAr ? 'مؤكدة سريرياً باختبار جلد' : 'Clinically Verified'}</option>
                    <option value="suspected">{isAr ? 'مشتبه بها فقط' : 'Suspected'}</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn">
                  💾 {isAr ? 'حفظ الحساسية' : 'Save Record'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAllergyModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Medication Modal */}
      {showMedModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowMedModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{isAr ? 'إضافة دواء إلى السجل' : 'Add Medication'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowMedModal(false)}>✕</button>
            </div>

            <form onSubmit={addMedication} className="stack modal-form">
              <div className="form-group">
                <label><b>{isAr ? 'اسم الدواء (تجاري أو علمي):' : 'Medication Name (Brand or Generic):'} *</b></label>
                <input
                  list="profile-med-suggestions"
                  value={medDrugName}
                  onChange={(e) => setMedDrugName(e.target.value)}
                  placeholder={isAr ? 'مثال: أوجمنتين 1 جم، هاي بيوتك، ماريفان...' : 'e.g. Augmentin 1g, Hibiotic, Marevan...'}
                  required
                />
                <datalist id="profile-med-suggestions">
                  {EGYPTIAN_COMMERCIAL_PRODUCTS.map((p) => (
                    <option key={p.productId} value={isAr ? p.tradeNameAr : p.tradeNameEn} />
                  ))}
                </datalist>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'الجرعة:' : 'Dose:'}</b></label>
                  <input value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder="e.g. 500mg" />
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'عدد المرات يومياً:' : 'Frequency:'}</b></label>
                  <select value={medFreq} onChange={(e) => setMedFreq(e.target.value)}>
                    <option value="once_daily">{formatFrequencyLabel('once_daily', isAr)}</option>
                    <option value="twice_daily">{formatFrequencyLabel('twice_daily', isAr)}</option>
                    <option value="thrice_daily">{formatFrequencyLabel('thrice_daily', isAr)}</option>
                    <option value="four_times_daily">{formatFrequencyLabel('four_times_daily', isAr)}</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><b>{isAr ? 'طريق الإعطاء:' : 'Route:'}</b></label>
                  <select value={medRoute} onChange={(e) => setMedRoute(e.target.value)}>
                    <option value="oral">{isAr ? 'عن طريق الفم (Oral)' : 'Oral'}</option>
                    <option value="parenteral_iv_im">{isAr ? 'حقن وريدي/عضلي (IV/IM)' : 'Parenteral (IV/IM)'}</option>
                    <option value="topical">{isAr ? 'موضعي جلدي (Topical)' : 'Topical'}</option>
                    <option value="ophthalmic_otic">{isAr ? 'قطرة عين/أذن' : 'Ophthalmic / Otic'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><b>{isAr ? 'الحالة:' : 'Status:'}</b></label>
                  <select value={medStatus} onChange={(e) => setMedStatus(e.target.value as 'active' | 'completed' | 'discontinued')}>
                    <option value="active">{isAr ? 'حالي' : 'Active'}</option>
                    <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                    <option value="discontinued">{isAr ? 'متوقف' : 'Discontinued'}</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn">💾 {isAr ? 'حفظ الدواء' : 'Save'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowMedModal(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
