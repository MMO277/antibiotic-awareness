import { createPortal } from 'react-dom';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import {
  UserHealthProfile,
  AllergyRecord,
  MedicationRecord,
  ALLERGEN_CATEGORIES,
  loadProfile,
  saveProfile,
  AllergySeverity,
  EvidenceStatus,
} from './allergyData';

export default function HealthProfile() {
  const { lang } = useLang();
  const [profile, setProfile] = useState<UserHealthProfile>(() => loadProfile());

  // Personal info edit state
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [ageInput, setAgeInput] = useState(profile.age);
  const [bloodInput, setBloodInput] = useState(profile.bloodType);
  const [contactInput, setContactInput] = useState(profile.emergencyContact);

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
  const [medActive, setMedActive] = useState('');
  const [medDose, setMedDose] = useState('');
  const medRoute = 'oral';
  const medFreq = 'twice_daily';
  const [medStatus, setMedStatus] = useState<'active' | 'completed' | 'discontinued'>('active');

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const savePersonalInfo = (e: FormEvent) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      displayName: nameInput.trim(),
      age: ageInput.trim(),
      bloodType: bloodInput.trim(),
      emergencyContact: contactInput.trim(),
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
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this allergy record?')) {
      setProfile((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a.id !== id) }));
    }
  };

  const addMedication = (e: FormEvent) => {
    e.preventDefault();
    if (!medDrugName.trim()) return;
    const newMed: MedicationRecord = {
      id: `med-${Date.now()}`,
      drugName: medDrugName.trim(),
      activeIngredients: medActive.trim(),
      prescribedDose: medDose.trim(),
      route: medRoute,
      frequency: medFreq,
      startDate: new Date().toISOString().split('T')[0],
      status: medStatus,
    };
    setProfile((prev) => ({ ...prev, medications: [newMed, ...prev.medications] }));
    setShowMedModal(false);
    setMedDrugName('');
    setMedActive('');
    setMedDose('');
  };

  const deleteMedication = (id: string) => {
    if (window.confirm(lang === 'ar' ? 'هل تريد حذف هذا الدواء من سجلك؟' : 'Delete this medication record?')) {
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
    if (window.confirm(lang === 'ar' ? 'تحذير: سيتم مسح جميع بيانات الحساسية والأدوية المسجلة على هذا الجهاز. هل توافق؟' : 'Warning: All locally stored health data will be deleted. Proceed?')) {
      setProfile({ displayName: '', age: '', gender: '', bloodType: '', emergencyContact: '', notes: '', allergies: [], medications: [] });
    }
  };

  const renderSeverityBadge = (s: AllergySeverity) => {
    switch (s) {
      case 'life_threatening':
        return <span className="sev-badge severe">🚨 {lang === 'ar' ? 'مهددة للحياة (صدمة تحسسية)' : 'Life Threatening'}</span>;
      case 'severe':
        return <span className="sev-badge severe">🔴 {lang === 'ar' ? 'شديدة (تورم/ضيق تنفس)' : 'Severe'}</span>;
      case 'moderate':
        return <span className="sev-badge moderate">🟡 {lang === 'ar' ? 'متوسطة (طفح جلدي واسع)' : 'Moderate'}</span>;
      case 'mild':
        return <span className="sev-badge safe">🟢 {lang === 'ar' ? 'خفيفة (حكة موضعية)' : 'Mild'}</span>;
    }
  };

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>👤 {lang === 'ar' ? 'ملف صحتي وحساسيتي الدوائية' : 'My Health Profile & Allergy Passport'}</h1>
        <p className="muted">
          {lang === 'ar'
            ? 'سجل شخصي متكامل لتوثيق حساسيتك الدوائية وأدويتك الحالية، لحمايتك من الأخطاء العلاجية وفحص أمان أي دواء قبل تناوله.'
            : 'Personal health dashboard documenting your drug allergies and medication history to prevent adverse drug events.'}
        </p>
      </header>

      {/* Action / Quick Safety Check Banner */}
      <section className="card highlight-card profile-banner">
        <div className="banner-content">
          <div>
            <h2>🛡️ {lang === 'ar' ? 'فاحص الحساسية والأمان الدوائي' : 'Smart Allergy Safety Check'}</h2>
            <p className="small">
              {lang === 'ar'
                ? 'تحقق فوراً مما إذا كان أي مضاد حيوي يحتوي على مواد فعالة تطابق حساسيتك المسجلة أو يسبب حساسية متصالبة (Cross-Reactivity).'
                : 'Instantly check whether any antibiotic matches your recorded allergies or shares cross-reactive ingredients.'}
            </p>
          </div>
          <Link to="/allergy-checker" className="btn btn-listen-all">
            ⚡ {lang === 'ar' ? 'افحص أمان دواء الآن' : 'Check a Medicine'}
          </Link>
        </div>
      </section>

      {/* KPI Overview */}
      <div className="kpi-grid">
        <div className="kpi-item unconfirmed">
          <span className="kpi-num">{profile.allergies.length}</span>
          <span className="kpi-label">{lang === 'ar' ? 'أدوية تسبب حساسية ⚠️' : 'Documented Allergies'}</span>
        </div>
        <div className="kpi-item taken">
          <span className="kpi-num">{profile.medications.filter((m) => m.status === 'active').length}</span>
          <span className="kpi-label">{lang === 'ar' ? 'أدوية أتناولها حالياً 💊' : 'Active Medications'}</span>
        </div>
        <div className="kpi-item upcoming">
          <span className="kpi-num">{profile.medications.filter((m) => m.status === 'completed').length}</span>
          <span className="kpi-label">{lang === 'ar' ? 'أدوية مكتملة سابقة' : 'Past Courses'}</span>
        </div>
      </div>

      {/* Personal Identity Card */}
      <section className="card stack">
        <div className="card-head-row">
          <h2>📋 {lang === 'ar' ? 'البيانات الشخصية للمريض:' : 'Patient Details:'}</h2>
          <button type="button" className="btn-secondary" onClick={() => setEditingPersonal(!editingPersonal)}>
            {editingPersonal ? (lang === 'ar' ? 'إلغاء' : 'Cancel') : (lang === 'ar' ? '✏️ تعديل البيانات' : '✏️ Edit')}
          </button>
        </div>

        {editingPersonal ? (
          <form onSubmit={savePersonalInfo} className="stack modal-form">
            <div className="form-row">
              <div className="form-group">
                <label><b>{lang === 'ar' ? 'اسم المريض:' : 'Patient Name:'}</b></label>
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'} />
              </div>
              <div className="form-group">
                <label><b>{lang === 'ar' ? 'العمر:' : 'Age:'}</b></label>
                <input value={ageInput} onChange={(e) => setAgeInput(e.target.value)} placeholder={lang === 'ar' ? 'مثال: 45 سنة' : 'e.g. 45'} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label><b>{lang === 'ar' ? 'فصيلة الدم:' : 'Blood Type:'}</b></label>
                <input value={bloodInput} onChange={(e) => setBloodInput(e.target.value)} placeholder="A+, O+, B-..." />
              </div>
              <div className="form-group">
                <label><b>{lang === 'ar' ? 'رقم هاتف الطوارئ:' : 'Emergency Contact:'}</b></label>
                <input value={contactInput} onChange={(e) => setContactInput(e.target.value)} placeholder="01xxxxxxxxx" />
              </div>
            </div>
            <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
              💾 {lang === 'ar' ? 'حفظ البيانات' : 'Save'}
            </button>
          </form>
        ) : (
          <div className="profile-details-grid">
            <div><b>{lang === 'ar' ? 'الاسم:' : 'Name:'}</b> {profile.displayName || (lang === 'ar' ? 'غير مسجل' : 'Not set')}</div>
            <div><b>{lang === 'ar' ? 'العمر:' : 'Age:'}</b> {profile.age || '—'}</div>
            <div><b>{lang === 'ar' ? 'فصيلة الدم:' : 'Blood Type:'}</b> {profile.bloodType || '—'}</div>
            <div><b>{lang === 'ar' ? 'هاتف الطوارئ:' : 'Emergency Phone:'}</b> {profile.emergencyContact || '—'}</div>
          </div>
        )}
      </section>

      {/* Section 1: My Allergies */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>🚨 {lang === 'ar' ? 'سجل الحساسية الدوائية (My Allergies):' : 'Documented Drug Allergies:'}</h2>
            <p className="small muted">
              {lang === 'ar'
                ? 'الأدوية التي تعرضت منها سابقاً لأي تفاعل تحسسي أو طفح جلدي أو ضيق تنفس.'
                : 'Medications or active ingredient families that have caused past allergic responses.'}
            </p>
          </div>
          <button type="button" className="btn" onClick={() => setShowAllergyModal(true)}>
            ➕ {lang === 'ar' ? 'تسجيل دواء يسبب حساسية' : 'Add Allergy Record'}
          </button>
        </div>

        {profile.allergies.length === 0 ? (
          <div className="empty-state-box">
            <span>🛡️</span>
            <p>{lang === 'ar' ? 'لا توجد أدوية مسببة للحساسية مسجلة حالياً في ملفك.' : 'No drug allergies documented yet.'}</p>
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
                        <b>{lang === 'ar' ? 'العائلة الدوائية:' : 'Family:'}</b> {cat ? cat.name[lang] : all.allergenKey}
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
                        <b>{lang === 'ar' ? 'الأعراض التي حدثت:' : 'Symptoms:'}</b> {all.reportedSymptoms}
                      </p>
                    )}
                    {all.notes && <p className="notes-line">📝 {all.notes}</p>}
                    <small className="muted evidence-tag">
                      {lang === 'ar' ? 'حالة التوثيق:' : 'Evidence:'}{' '}
                      {all.evidenceStatus === 'clinically_verified'
                        ? (lang === 'ar' ? 'مؤكدة طبياً بفحص الحساسية ✅' : 'Clinically Verified')
                        : (lang === 'ar' ? 'أبلغ عنها المريض' : 'Patient-Reported')}
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
            <h2>💊 {lang === 'ar' ? 'قائمة أدويتي الحالية والسابقة:' : 'My Medications:'}</h2>
            <p className="small muted">
              {lang === 'ar'
                ? 'سجل للأدوية التي تتناولها حالياً للرجوع إليها وفحص تداخلاتها.'
                : 'List of your active and past prescriptions for medication reconciliation.'}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setShowMedModal(true)}>
            ➕ {lang === 'ar' ? 'إضافة دواء' : 'Add Medication'}
          </button>
        </div>

        {profile.medications.length === 0 ? (
          <div className="empty-state-box">
            <span>💊</span>
            <p>{lang === 'ar' ? 'لا توجد أدوية مسجلة حالياً.' : 'No medications recorded.'}</p>
          </div>
        ) : (
          <div className="med-cards-stack">
            {profile.medications.map((m) => (
              <div key={m.id} className="med-record-card">
                <div className="med-record-head">
                  <div>
                    <h4>{m.drugName}</h4>
                    <span className="small muted">{m.prescribedDose} · {m.frequency}</span>
                  </div>
                  <div className="med-record-actions">
                    <span className={`status-pill ${m.status === 'active' ? 'taken' : 'upcoming'}`}>
                      {m.status === 'active' ? (lang === 'ar' ? 'حالي' : 'Active') : (lang === 'ar' ? 'مكتمل' : 'Past')}
                    </span>
                    <button type="button" className="undo-btn" onClick={() => deleteMedication(m.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Management Controls */}
      <div className="profile-footer-actions">
        <button type="button" className="btn-secondary" onClick={exportProfileData}>
          📥 {lang === 'ar' ? 'تصدير وحفظ الملف (JSON)' : 'Export Profile (JSON)'}
        </button>
        <button type="button" className="btn-secondary danger" onClick={clearAllData}>
          🗑️ {lang === 'ar' ? 'مسح بيانات الملف من هذا الجهاز' : 'Reset Local Profile'}
        </button>
      </div>

      {/* Add Allergy Modal */}
      {showAllergyModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowAllergyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{lang === 'ar' ? 'تسجيل دواء يسبب حساسية للمريض' : 'Record Drug Allergy'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowAllergyModal(false)}>✕</button>
            </div>

            <form onSubmit={addAllergy} className="stack modal-form">
              <div className="form-group">
                <label><b>{lang === 'ar' ? 'اسم الدواء المسبب للحساسية:' : 'Allergenic Medication Name:'} *</b></label>
                <input
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: أوجمنتين، بنسلين، سبتازول...' : 'e.g. Amoxicillin, Penicillin, Augmentin'}
                  required
                />
              </div>

              <div className="form-group">
                <label><b>{lang === 'ar' ? 'العائلة الدوائية المسببة:' : 'Allergen Family:'}</b></label>
                <select value={allergenKey} onChange={(e) => setAllergenKey(e.target.value)}>
                  {ALLERGEN_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[lang]} ({c.examples[lang]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label><b>{lang === 'ar' ? 'الأعراض التي ظهرت عليك:' : 'Reported Symptoms:'} *</b></label>
                <input
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: طفح جلدي حاك، تورم في الشفتين أو الوجه، صعوبة تنفس' : 'e.g. Hives, lip swelling, wheezing'}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><b>{lang === 'ar' ? 'درجة الخطورة:' : 'Severity:'}</b></label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value as AllergySeverity)}>
                    <option value="life_threatening">{lang === 'ar' ? 'مهددة للحياة (صدمة تحسسية وإغماء)' : 'Life Threatening'}</option>
                    <option value="severe">{lang === 'ar' ? 'شديدة (تورم وضيق تنفس)' : 'Severe'}</option>
                    <option value="moderate">{lang === 'ar' ? 'متوسطة (طفح جلدي واسع)' : 'Moderate'}</option>
                    <option value="mild">{lang === 'ar' ? 'خفيفة (حكة خفيفة)' : 'Mild'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label><b>{lang === 'ar' ? 'حالة التوثيق:' : 'Evidence Status:'}</b></label>
                  <select value={evidence} onChange={(e) => setEvidence(e.target.value as EvidenceStatus)}>
                    <option value="patient_reported">{lang === 'ar' ? 'أبلغ عنها المريض' : 'Patient-Reported'}</option>
                    <option value="clinically_verified">{lang === 'ar' ? 'مؤكدة سريرياً باختبار جلد' : 'Clinically Verified'}</option>
                    <option value="suspected">{lang === 'ar' ? 'مشتبه بها فقط' : 'Suspected'}</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn">
                  💾 {lang === 'ar' ? 'حفظ الحساسية' : 'Save Record'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAllergyModal(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
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
              <h3>{lang === 'ar' ? 'إضافة دواء إلى السجل' : 'Add Medication'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowMedModal(false)}>✕</button>
            </div>

            <form onSubmit={addMedication} className="stack modal-form">
              <div className="form-group">
                <label><b>{lang === 'ar' ? 'اسم الدواء:' : 'Medication Name:'} *</b></label>
                <input value={medDrugName} onChange={(e) => setMedDrugName(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><b>{lang === 'ar' ? 'الجرعة:' : 'Dose:'}</b></label>
                  <input value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder="e.g. 500mg" />
                </div>
                <div className="form-group">
                  <label><b>{lang === 'ar' ? 'الحالة:' : 'Status:'}</b></label>
                  <select value={medStatus} onChange={(e) => setMedStatus(e.target.value as 'active' | 'completed' | 'discontinued')}>
                    <option value="active">{lang === 'ar' ? 'حالي' : 'Active'}</option>
                    <option value="completed">{lang === 'ar' ? 'مكتمل' : 'Completed'}</option>
                    <option value="discontinued">{lang === 'ar' ? 'متوقف' : 'Discontinued'}</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn">💾 {lang === 'ar' ? 'حفظ الدواء' : 'Save'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowMedModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
