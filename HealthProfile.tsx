import { createPortal } from 'react-dom';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import {
  AllergyRecord,
  MedicationRecord,
  ALLERGEN_CATEGORIES,
  useSyncedHealthProfile,
  AllergySeverity,
  EvidenceStatus,
} from './allergyData';
import {
  useSyncedSchedules,
  calculateScheduleProgress,
  formatFrequencyLabel,
  formatRouteLabel,
  formatVerificationStatusLabel,
  formatCaptureMethodLabel,
  formatTimestampReadable,
  downloadScheduleIcs,
  downloadTreatmentReportJson,
} from './trackerData';

export default function HealthProfile() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile, setProfile, syncing } = useSyncedHealthProfile();
  const {
    schedules,
    prescriptions,
    treatmentEvents,
    syncStatus: journeySyncStatus,
  } = useSyncedSchedules();

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
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('twice_daily');
  const medRoute = 'oral';
  const [medStatus, setMedStatus] = useState<'active' | 'completed' | 'discontinued'>('active');

  // Keep form inputs in sync when cloud profile finishes hydrating or updates from another device
  useEffect(() => {
    if (!editingPersonal) {
      setNameInput(profile.displayName);
      setAgeInput(profile.age);
      setBloodInput(profile.bloodType);
      setContactInput(profile.emergencyContact);
    }
  }, [profile.displayName, profile.age, profile.bloodType, profile.emergencyContact, editingPersonal]);

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
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this allergy record?')) {
      setProfile((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a.id !== id) }));
    }
  };

  const addMedication = (e: FormEvent) => {
    e.preventDefault();
    if (!medDrugName.trim()) return;
    const newMed: MedicationRecord = {
      id: `med-${Date.now()}`,
      drugName: medDrugName.trim(),
      activeIngredients: '',
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

  const exportFullTreatmentJourney = () => {
    downloadTreatmentReportJson({
      patientName: profile.displayName || user?.displayName || undefined,
      userEmail: user?.email,
      syncStatus: journeySyncStatus,
      prescriptions,
      schedules,
      treatmentEvents,
    });
  };

  const clearAllData = () => {
    if (window.confirm(isAr ? 'تحذير: سيتم مسح جميع بيانات الحساسية والأدوية المسجلة. هل توافق؟' : 'Warning: All stored health data will be deleted. Proceed?')) {
      setProfile({ displayName: '', age: '', gender: '', bloodType: '', emergencyContact: '', notes: '', allergies: [], medications: [] });
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

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>👤 {isAr ? 'ملف صحتي وحساسيتي ورحلة علاجي' : 'My Health Profile, Allergy Passport & Treatment Journey'}</h1>
        <p className="muted">
          {isAr
            ? 'سجل شخصي متكامل لتوثيق حساسيتك الدوائية، روشتاتك الموثّقة، وجداول جرعاتك المحفوظة في حسابك عبر جميع أجهزتك.'
            : 'Personal health dashboard documenting your drug allergies, verified prescriptions, and treatment schedules synced across your devices.'}
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
            <h2>🛡️ {isAr ? 'فاحص الحساسية والأمان الدوائي' : 'Smart Allergy Safety Check'}</h2>
            <p className="small">
              {isAr
                ? 'تحقق فوراً مما إذا كان أي مضاد حيوي يحتوي على مواد فعالة تطابق حساسيتك المسجلة أو يسبب حساسية متصالبة (Cross-Reactivity).'
                : 'Instantly check whether any antibiotic matches your recorded allergies or shares cross-reactive ingredients.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/allergy-checker" className="btn btn-listen-all">
              ⚡ {isAr ? 'افحص أمان دواء الآن' : 'Check a Medicine'}
            </Link>
            <Link to="/prescription-radar" className="btn-secondary">
              📡 {isAr ? 'رادار الروشتة ورحلة العلاج' : 'Prescription Radar & Journey'}
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
          <span className="kpi-num">{schedules.length}</span>
          <span className="kpi-label">{isAr ? 'جداول علاجية مفعّلة 🗓️' : 'Active Treatment Schedules'}</span>
        </div>
        <div className="kpi-item upcoming">
          <span className="kpi-num">{prescriptions.length}</span>
          <span className="kpi-label">{isAr ? 'روشتات محفوظة بالحساب 📋' : 'Saved Prescriptions'}</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-num">{profile.medications.filter((m) => m.status === 'active').length}</span>
          <span className="kpi-label">{isAr ? 'أدوية بسجل الملف 💊' : 'Profile Medications'}</span>
        </div>
      </div>

      {/* Personal Identity Card */}
      <section className="card stack">
        <div className="card-head-row">
          <h2>📋 {isAr ? 'البيانات الشخصية للمريض:' : 'Patient Details:'}</h2>
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
                <input value={ageInput} onChange={(e) => setAgeInput(e.target.value)} placeholder={isAr ? 'مثال: 45 سنة' : 'e.g. 45'} />
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
          </div>
        )}
      </section>

      {/* Integrated Complete Patient Treatment Journey Card */}
      <section className="card stack" style={{ borderTop: '4px solid #0284c7' }}>
        <div className="card-head-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>
              🗓️{' '}
              {isAr
                ? 'رحلتي العلاجية وروشتاتي المحفوظة بحسابي (Complete Treatment Journey):'
                : 'My Saved Treatment Journey & Verified Prescriptions:'}
            </h2>
            <p className="small muted">
              {isAr
                ? 'الروشتات الملتقطة، حالة التوثيق الطبي، وجداول الجرعات اليومية المتزامنة مع حسابك عبر الأجهزة.'
                : 'Captured prescriptions, verification status, and active dose schedules synchronized with your account.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/prescription-radar" className="btn small">
              📡 {isAr ? 'التقاط/فحص روشتة في الرادار' : 'Open Prescription Radar'}
            </Link>
            <Link to="/tracker" className="btn-secondary small">
              ⏱️ {isAr ? 'متابع الجرعات والتقرير' : 'Open Dose Tracker'}
            </Link>
            {(schedules.length > 0 || prescriptions.length > 0) && (
              <button type="button" className="btn-secondary small" onClick={exportFullTreatmentJourney}>
                📥 {isAr ? 'تصدير تقرير الرحلة العلاجية (JSON)' : 'Export Journey Report (JSON)'}
              </button>
            )}
          </div>
        </div>

        {schedules.length === 0 && prescriptions.length === 0 ? (
          <div className="empty-state-box">
            <span>📡</span>
            <p>
              {isAr
                ? 'لا توجد روشتات أو جداول علاجية محفوظة بعد. يمكنك تصوير الروشتة أو إدخالها في رادار الروشتة لبدء رحلة العلاج.'
                : 'No saved prescriptions or active treatment schedules yet. Capture or enter a prescription in Prescription Radar to begin.'}
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: '12px' }}>
            {schedules.map((sch) => {
              const stats = calculateScheduleProgress(sch);
              return (
                <div key={sch.id} className="med-record-card" style={{ padding: '14px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>💊 {sch.medicineName}</h4>
                        <span className="verification-badge verified">
                          {formatVerificationStatusLabel(sch.verificationStatus, isAr)}
                        </span>
                        {sch.captureMethod && (
                          <span className="badge">{formatCaptureMethodLabel(sch.captureMethod, isAr)}</span>
                        )}
                      </div>
                      <p className="small muted" style={{ margin: '4px 0' }}>
                        {[
                          sch.prescribedDose,
                          formatRouteLabel(sch.route, isAr),
                          formatFrequencyLabel(sch.frequency, isAr),
                          `${sch.durationDays} ${isAr ? 'أيام' : 'days'} (${sch.startDate} → ${sch.endDate})`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="small" style={{ margin: '4px 0 0' }}>
                        <b>{isAr ? 'الالتزام المسجل:' : 'Recorded Adherence:'}</b> {stats.progressPercent}% (
                        {isAr ? 'تم أخذها:' : 'Taken:'} {stats.takenCount}/{stats.totalDoses} ·{' '}
                        {isAr ? 'فائتة مؤكدة:' : 'Confirmed Missed:'} {stats.missedCount} ·{' '}
                        {isAr ? 'غير مسجلة:' : 'Missing Record:'} {stats.unconfirmedCount})
                      </p>
                    </div>
                    <div className="row wrapRow" style={{ gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary small"
                        onClick={() => downloadScheduleIcs(sch, isAr)}
                      >
                        📅 {isAr ? 'منبهات (.ics)' : 'Alarms (.ics)'}
                      </button>
                      <Link to="/tracker" className="btn small">
                        ⏱️ {isAr ? 'تسجيل الجرعات' : 'Log Doses'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {prescriptions
              .filter((rx) => !rx.linkedScheduleId || rx.verificationStatus !== 'verified_by_patient')
              .map((rx) => (
                <div key={rx.id} className="rx-queue-card">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                        <strong>📋 {rx.medicineName}</strong>
                        <span
                          className={`verification-badge ${
                            rx.verificationStatus === 'needs_clarification' ? 'clarify' : 'unverified'
                          }`}
                        >
                          {formatVerificationStatusLabel(rx.verificationStatus, isAr)}
                        </span>
                      </div>
                      <small className="muted">
                        {isAr ? 'تاريخ الحفظ:' : 'Saved:'} {formatTimestampReadable(rx.updatedAt, isAr)}
                      </small>
                    </div>
                    <Link to="/prescription-radar" className="btn-secondary small">
                      🔍 {isAr ? 'مراجعة وتوثيق في الرادار' : 'Review & Verify in Radar'}
                    </Link>
                  </div>
                </div>
              ))}
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
                ? 'سجل للأدوية التي تتناولها حالياً للرجوع إليها وفحص تداخلاتها.'
                : 'List of your active and past prescriptions for medication reconciliation.'}
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
            {profile.medications.map((m) => (
              <div key={m.id} className="med-record-card">
                <div className="med-record-head">
                  <div>
                    <h4>{m.drugName}</h4>
                    <span className="small muted">
                      {[m.prescribedDose, formatFrequencyLabel(m.frequency, isAr)].filter(Boolean).join(' · ')}
                    </span>
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
            ))}
          </div>
        )}
      </section>

      {/* Footer Management Controls */}
      <div className="profile-footer-actions">
        <button type="button" className="btn-secondary" onClick={exportProfileData}>
          📥 {isAr ? 'تصدير وحفظ الملف الصحي (JSON)' : 'Export Health Profile (JSON)'}
        </button>
        <button type="button" className="btn-secondary" onClick={exportFullTreatmentJourney}>
          📄 {isAr ? 'تصدير تقرير رحلة العلاج الكامل (JSON)' : 'Export Complete Treatment Journey (JSON)'}
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
                <label><b>{isAr ? 'اسم الدواء:' : 'Medication Name:'} *</b></label>
                <input value={medDrugName} onChange={(e) => setMedDrugName(e.target.value)} required />
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
              <div className="form-group">
                <label><b>{isAr ? 'الحالة:' : 'Status:'}</b></label>
                <select value={medStatus} onChange={(e) => setMedStatus(e.target.value as 'active' | 'completed' | 'discontinued')}>
                  <option value="active">{isAr ? 'حالي' : 'Active'}</option>
                  <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                  <option value="discontinued">{isAr ? 'متوقف' : 'Discontinued'}</option>
                </select>
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
