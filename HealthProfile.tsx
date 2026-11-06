import { pick } from './types';
import { createPortal } from 'react-dom';
import { FormEvent, useEffect, useState, useRef, useCallback } from 'react';
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
  syncNotesWithChronicConditions,
} from './allergyData';
import {
  getPassportShare,
  sharePassport,
  revokePassport,
  uploadPassportPhoto,
  savePassportPhotoUrl,
  getPassportPhotoUrl,
  PassportShare,
} from './passportService';
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

  // ── Passport states ──────────────────────────────────────────────────────────
  const [passportPhoto, setPassportPhoto] = useState('');
  const [passportPhotoLoading, setPassportPhotoLoading] = useState(false);
  const [passportShare, setPassportShare] = useState<PassportShare | null>(null);
  const [passportLoading, setPassportLoading] = useState(true);
  // PIN محفوظ مرة واحدة
  const [savedPin, setSavedPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);
  // مشاركة
  const [passportHours, setPassportHours] = useState(24);
  const [passportSharing, setPassportSharing] = useState(false);
  // مشاركة الصورة/الرابط
  const [shareSuccess, setShareSuccess] = useState('');
  const [chronicInput, setChronicInput] = useState('');
  const photoFileRef = useRef<HTMLInputElement>(null);

  // تحميل بيانات البطاقة
  useEffect(() => {
    if (!user) { setPassportLoading(false); return; }
    Promise.all([
      getPassportShare(user.uid),
      getPassportPhotoUrl(user.uid),
    ]).then(([s, photo]) => {
      setPassportShare(s);
      if (s?.pin) setSavedPin(s.pin);
      setPassportPhoto(photo);
      setPassportLoading(false);
    });
  }, [user]);

  const handlePassportPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPassportPhotoLoading(true);
    try {
      const url = await uploadPassportPhoto(user.uid, file);
      await savePassportPhotoUrl(user.uid, url);
      setPassportPhoto(url);
    } catch {
      alert(isAr ? 'فشل رفع الصورة. حاول مرة أخرى.' : 'Photo upload failed. Please try again.');
    } finally {
      setPassportPhotoLoading(false);
    }
  }, [user, isAr]);

  const passportChronicList: string[] = (() => {
    if (profile.chronicConditions && profile.chronicConditions.length > 0) {
      return profile.chronicConditions.map((c) => c.conditionName);
    }
    try {
      const n = profile.notes || '';
      const idx = n.indexOf('CHRONIC:');
      if (idx === -1) return [];
      return JSON.parse(n.slice(idx + 8).split('||')[0]);
    } catch { return []; }
  })();

  const addChronic = () => {
    const cleanName = chronicInput.trim();
    if (!cleanName) return;
    setProfile((p) => {
      const existing = p.chronicConditions || [];
      if (existing.some((c) => c.conditionName.toLowerCase() === cleanName.toLowerCase())) {
        return p;
      }
      const nextChronics = [
        {
          id: `cond-${Date.now()}`,
          conditionName: cleanName,
          evidenceStatus: 'patient_reported' as const,
          source: 'manual_entry' as const,
          createdAt: new Date().toISOString(),
        },
        ...existing,
      ];
      return {
        ...p,
        chronicConditions: nextChronics,
        notes: syncNotesWithChronicConditions(p.notes || '', nextChronics),
      };
    });
    setChronicInput('');
  };

  const removeChronic = (idx: number) => {
    setProfile((p) => {
      const targetName = passportChronicList[idx];
      const nextChronics = (p.chronicConditions || []).filter(
        (c, i) => (targetName ? c.conditionName !== targetName : i !== idx)
      );
      return {
        ...p,
        chronicConditions: nextChronics,
        notes: syncNotesWithChronicConditions(p.notes || '', nextChronics),
      };
    });
  };

  // حفظ PIN جديد
  const handleSavePin = async () => {
    if (!user || pinInput.length < 4) return;
    setPinSaving(true);
    await sharePassport(user.uid, pinInput, 0, profile);
    setSavedPin(pinInput);
    setPinInput('');
    setShowPinSetup(false);
    setPinSaving(false);
  };

  // تفعيل المشاركة بالـ PIN المحفوظ
  const handlePassportShare = async () => {
    if (!user || !savedPin) return;
    setPassportSharing(true);
    await sharePassport(user.uid, savedPin, passportHours, profile);
    const s = await getPassportShare(user.uid);
    setPassportShare(s);
    setPassportSharing(false);
  };

  const handlePassportRevoke = async () => {
    if (!user) return;
    await revokePassport(user.uid);
    setPassportShare(null);
  };

  // مشاركة الرابط
  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: isAr ? 'بطاقتي الصحية' : 'My Health Passport',
        text: isAr ? 'بطاقتي الصحية الذكية — الـ PIN مطلوب للوصول' : 'My Smart Health Passport — PIN required',
        url: passportUrl,
      });
    } else {
      navigator.clipboard.writeText(passportUrl);
      setShareSuccess(isAr ? '✅ تم نسخ الرابط!' : '✅ Link copied!');
      setTimeout(() => setShareSuccess(''), 3000);
    }
  };

  // بناء صورة البطاقة بـ Canvas مباشرة بدون html2canvas
  const handleShareImage = async () => {
    if (!user) return;
    try {
      const canvas = document.createElement('canvas');
      const W = 800; const H = 450;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');

      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0b3c5d');
      grad.addColorStop(0.55, '#1565a8');
      grad.addColorStop(1, '#0ea5e9');
      ctx.fillStyle = grad;
      ctx.roundRect(0, 0, W, H, 28);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.arc(W + 60, -60, 200, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-50, H + 50, 160, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.roundRect(32, 28, W - 64, 54, 12); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px system-ui';
      ctx.fillText('🏥  Antibiotic Awareness — SMART PATIENT PASSPORT', 52, 62);

      ctx.font = 'bold 32px system-ui';
      ctx.fillStyle = '#fff';
      ctx.fillText(profile.displayName || 'Patient', 200, 140);

      ctx.font = '18px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(`${isAr ? 'العمر' : 'Age'}: ${profile.age || '—'}`, 200, 172);
      ctx.fillText(`${isAr ? 'النوع' : 'Gender'}: ${profile.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : profile.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : '—'}`, 200, 198);

      ctx.fillStyle = '#e74c3c';
      ctx.roundRect(200, 212, 120, 36, 8); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px system-ui';
      ctx.fillText(`🩸 ${profile.bloodType || '?'}`, 216, 235);

      if (profile.allergies.length > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.roundRect(332, 212, 160, 36, 8); ctx.fill();
        ctx.fillStyle = '#1c1917';
        ctx.font = 'bold 16px system-ui';
        ctx.fillText(`⚠️ ${profile.allergies.length} ${isAr ? 'حساسية' : 'Allergies'}`, 348, 235);
      }

      if (passportPhoto) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej();
            img.src = passportPhoto;
          });
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(36, 100, 140, 168, 12);
          ctx.clip();
          ctx.drawImage(img, 36, 100, 140, 168);
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 2;
          ctx.roundRect(36, 100, 140, 168, 12);
          ctx.stroke();
        } catch { /* صورة مش متاحة */ }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.roundRect(36, 100, 140, 168, 12); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '56px system-ui';
        ctx.fillText('👤', 62, 200);
      }

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(passportUrl)}&margin=6&color=0b3c5d`;
      try {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => {
          qrImg.onload = () => res();
          qrImg.onerror = () => rej();
          qrImg.src = qrUrl;
        });
        ctx.fillStyle = '#fff';
        ctx.roundRect(W - 188, 100, 152, 152, 10); ctx.fill();
        ctx.drawImage(qrImg, W - 184, 104, 144, 144);
      } catch { /* QR مش اتحمل */ }

      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.roundRect(32, H - 56, W - 64, 34, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '13px monospace';
      ctx.fillText(`ID: ${user.uid.slice(0,8).toUpperCase()} ${user.uid.slice(8,16).toUpperCase()}`, 48, H - 33);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '13px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(`💊 ${profile.medications.filter(m => m.status === 'active').length} ${isAr ? 'دواء نشط' : 'Active Meds'}`, W - 48, H - 33);
      ctx.textAlign = 'left';

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'health-passport.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: isAr ? 'بطاقتي الصحية الذكية' : 'My Smart Health Passport',
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'health-passport.png'; a.click();
          URL.revokeObjectURL(url);
          setShareSuccess(isAr ? '✅ تم تنزيل البطاقة!' : '✅ Passport downloaded!');
          setTimeout(() => setShareSuccess(''), 3000);
        }
      }, 'image/png');

    } catch {
      setShareSuccess(isAr ? '⚠️ التقط screenshot للبطاقة' : '⚠️ Take a screenshot instead');
      setTimeout(() => setShareSuccess(''), 4000);
    }
  };

  const passportUrl = user
    ? `${window.location.origin}${window.location.pathname}#/passport/${user.uid}`
    : '';
  const passportQrSrc = user
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(passportUrl)}&margin=8&color=0b3c5d`
    : '';
  const passportIsActive = Boolean(passportShare && passportShare.pin && passportShare.expiresAt > 0 && Date.now() < passportShare.expiresAt);
  const passportRemaining = passportShare ? Math.max(0, Math.round((passportShare.expiresAt - Date.now()) / 60000)) : 0;

  // Personal info edit state
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [ageInput, setAgeInput] = useState(profile.age);
  const [weightInput, setWeightInput] = useState(profile.weightKg || '');
  const [bloodInput, setBloodInput] = useState(profile.bloodType);
  const [contactInput, setContactInput] = useState(profile.emergencyContact);
  const [genderInput, setGenderInput] = useState(profile.gender);

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

  useEffect(() => {
    if (!editingPersonal) {
      setNameInput(profile.displayName);
      setAgeInput(profile.age);
      setWeightInput(profile.weightKg || '');
      setBloodInput(profile.bloodType);
      setContactInput(profile.emergencyContact);
      setGenderInput(profile.gender);
    }
  }, [profile.displayName, profile.age, profile.weightKg, profile.bloodType, profile.emergencyContact, profile.gender, editingPersonal]);

  const savePersonalInfo = (e: FormEvent) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      displayName: nameInput.trim(),
      age: ageInput.trim(),
      weightKg: weightInput.trim(),
      bloodType: bloodInput.trim(),
      emergencyContact: contactInput.trim(),
      gender: genderInput.trim(),
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

  const deleteMedicalDocument = (docId: string) => {
    if (window.confirm(isAr ? 'هل تريد حذف هذا المستند الطبي من حسابك؟' : 'Delete this medical document from your account?')) {
      setProfile((prev) => ({
        ...prev,
        medicalDocuments: (prev.medicalDocuments || []).filter((d) => d.id !== docId),
      }));
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
      setProfile({ displayName: '', age: '', weightKg: '', gender: '', bloodType: '', emergencyContact: '', notes: '', allergies: [], medications: [], chronicConditions: [], medicalDocuments: [] });
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
            <h2>🛡️ {isAr ? 'فاحص الحساسية والأمان الدوائي والمساعد الذكي' : 'Smart Allergy Safety Check & AI Health Assistant'}</h2>
            <p className="small">
              {isAr
                ? 'تحقق فوراً مما إذا كان أي مضاد حيوي يحتوي على مواد فعالة تطابق حساسيتك المسجلة، أو استخدم المساعد الذكي لإدارة سجلك الصحي بالأوامر المباشرة.'
                : 'Instantly check whether any antibiotic matches your recorded allergies, or use the AI Assistant to manage your records.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/allergy-checker" className="btn btn-listen-all">
              ⚡ {isAr ? 'افحص أمان دواء الآن' : 'Check a Medicine'}
            </Link>
            <Link to="/prescription-radar" className="btn-secondary">
              📡 {isAr ? 'رادار الروشتة ورحلة العلاج' : 'Prescription Radar & Journey'}
            </Link>
            <Link to="/assistant" className="btn-secondary">
              🤖 {isAr ? 'المساعد الصحي الذكي' : 'AI Health Assistant'}
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
          <h2>📋 {isAr ? 'البيانات الشخصية والحيوية للمريض:' : 'Patient Details & Vitals:'}</h2>
          <button type="button" className="btn-secondary" onClick={() => setEditingPersonal(!editingPersonal)}>
            {editingPersonal ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? '✏️ تعديل البيانات' : '✏️ Edit')}
          </button>
        </div>

        {editingPersonal ? (
          <form onSubmit={savePersonalInfo} className="stack modal-form">
            <div className="form-row">
              <div className="form-group form-group-full">
                <label><b>{isAr ? 'اسم المريض:' : 'Patient Name:'}</b></label>
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={isAr ? 'الاسم بالكامل' : 'Full Name'} />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'العمر:' : 'Age:'}</b></label>
                <input value={ageInput} onChange={(e) => setAgeInput(e.target.value)} placeholder={isAr ? 'مثال: 45 سنة' : 'e.g. 45'} />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'الوزن (كجم):' : 'Weight (kg):'}</b></label>
                <input value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder={isAr ? 'مثال: 75' : 'e.g. 75'} />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'فصيلة الدم:' : 'Blood Type:'}</b></label>
                <input value={bloodInput} onChange={(e) => setBloodInput(e.target.value)} placeholder="A+, O+, B-..." />
              </div>
              <div className="form-group">
                <label><b>{isAr ? 'النوع:' : 'Gender:'}</b></label>
                <select value={genderInput} onChange={(e) => setGenderInput(e.target.value)}>
                  <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
                  <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                </select>
              </div>
              <div className="form-group form-group-full">
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
            <div className="profile-detail-full"><b>{isAr ? 'الاسم:' : 'Name:'}</b> {profile.displayName || (isAr ? 'غير مسجل' : 'Not set')}</div>
            <div><b>{isAr ? 'العمر:' : 'Age:'}</b> {profile.age || '—'}</div>
            <div><b>{isAr ? 'الوزن:' : 'Weight:'}</b> {profile.weightKg ? `${profile.weightKg} ${isAr ? 'كجم' : 'kg'}` : '—'}</div>
            <div><b>{isAr ? 'فصيلة الدم:' : 'Blood Type:'}</b> {profile.bloodType || '—'}</div>
            <div><b>{isAr ? 'النوع:' : 'Gender:'}</b> {profile.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : profile.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : '—'}</div>
            <div className="profile-detail-full"><b>{isAr ? 'هاتف الطوارئ:' : 'Emergency Phone:'}</b> {profile.emergencyContact || '—'}</div>
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
                ? 'لا توجد روشتات أو جداول علاجية محفوظة بعد. يمكنك تصوير الروشتة أو إدخالها في رادار الروشتة أو عبر المساعد الذكي لبدء رحلة العلاج.'
                : 'No saved prescriptions or active treatment schedules yet. Capture or enter a prescription in Prescription Radar or via the AI Assistant to begin.'}
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
                        <b>{isAr ? 'العائلة الدوائية:' : 'Family:'}</b> {cat ? pick(cat.name, lang) : all.allergenKey}
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

      {/* Section 3: Uploaded Medical Documents & Lab Reports */}
      <section className="card stack">
        <div className="card-head-row">
          <div>
            <h2>📂 {isAr ? 'التقارير والتحاليل والمستندات الطبية المرفوعة:' : 'Uploaded Medical Documents & Lab Reports:'}</h2>
            <p className="small muted">
              {isAr
                ? 'المستندات وصور الروشتات والتحاليل المحفوظة عبر المساعد الصحي الذكي.'
                : 'Medical documents, lab results, and prescription images saved via the AI Health Assistant.'}
            </p>
          </div>
          <Link to="/assistant" className="btn-secondary small">
            📎 {isAr ? 'رفع مستند جديد عبر المساعد' : 'Upload via Assistant'}
          </Link>
        </div>

        {(!profile.medicalDocuments || profile.medicalDocuments.length === 0) ? (
          <div className="empty-state-box">
            <span>📂</span>
            <p>
              {isAr
                ? 'لا توجد تقارير أو تحاليل مرفوعة بعد. يمكنك إرفاق أي صورة روشتة أو تحليل عبر زر 📎 في المساعد الذكي.'
                : 'No medical documents uploaded yet. Attach a prescription or lab report using 📎 in the AI Assistant.'}
            </p>
          </div>
        ) : (
          <div className="med-cards-stack">
            {profile.medicalDocuments.map((docItem) => (
              <div key={docItem.id} className="med-record-card" style={{ padding: '12px' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {docItem.previewDataUrl && (
                      <img
                        src={docItem.previewDataUrl}
                        alt={docItem.title}
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
                      />
                    )}
                    <div>
                      <h4 style={{ margin: 0 }}>{docItem.title}</h4>
                      <p className="small muted" style={{ margin: '4px 0' }}>{docItem.extractedSummary}</p>
                      <small className="muted">
                        {docItem.createdAt.slice(0, 10)} ·{' '}
                        {docItem.verificationStatus === 'patient_confirmed'
                          ? (isAr ? 'مؤكد من المريض ✅' : 'Patient Confirmed ✅')
                          : (isAr ? 'يحتاج مراجعة ⚠️' : 'Needs Review ⚠️')}
                      </small>
                    </div>
                  </div>
                  <button type="button" className="undo-btn" onClick={() => deleteMedicalDocument(docItem.id)}>✕</button>
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
                      {pick(c.name, lang)} ({pick(c.examples, lang)})
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

      {/* ══════════════ البطاقة الصحية الذكية ══════════════ */}
      {user && (
        <section className="card stack" style={{ borderTop: '4px solid #0b3c5d', marginTop: 8 }}>
          <div className="card-head-row">
            <h2 className="section-title">🪪 {isAr ? 'البطاقة الصحية الذكية' : 'Smart Patient Passport'}</h2>
          </div>

          {/* البطاقة المرئية */}
          <div style={{
            background: 'linear-gradient(135deg, #0b3c5d 0%, #1565a8 55%, #0ea5e9 100%)',
            borderRadius: 16, padding: '18px 16px',
            color: '#fff', position: 'relative', overflow: 'hidden',
            direction: 'ltr',
          }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
            <div style={{ position:'absolute', bottom:-30, left:-30, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <span style={{ fontSize:'1.4rem' }}>🏥</span>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.85rem' }}>Antibiotic Awareness</div>
                <div style={{ fontSize:'0.6rem', opacity:0.7, letterSpacing:1 }}>SMART PATIENT PASSPORT</div>
              </div>
              <div style={{ marginInlineStart:'auto', fontSize:'0.6rem', opacity:0.6 }}>🇪🇬 Egypt</div>
            </div>

            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <div
                onClick={() => photoFileRef.current?.click()}
                style={{
                  width:70, height:84, borderRadius:8,
                  background:'rgba(255,255,255,0.12)',
                  border:'2px solid rgba(255,255,255,0.5)',
                  overflow:'hidden', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', position:'relative',
                }}
              >
                {passportPhotoLoading
                  ? <span style={{ fontSize:'1.5rem' }}>⏳</span>
                  : passportPhoto
                    ? <img src={passportPhoto} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'1.8rem' }}>👤</div>
                        <div style={{ fontSize:'0.5rem', opacity:0.7, marginTop:2 }}>
                          {isAr ? 'اضغط لإضافة صورة' : 'tap to add'}
                        </div>
                      </div>
                }
              </div>
              <input ref={photoFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePassportPhoto} />

              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:4 }}>
                  {profile.displayName || (isAr ? 'الاسم غير مدخل' : 'Name not set')}
                </div>
                <div style={{ fontSize:'0.72rem', opacity:0.85, marginBottom:2 }}>
                  {isAr ? 'العمر:' : 'Age:'} <b>{profile.age || '—'}</b>
                </div>
                <div style={{ fontSize:'0.72rem', opacity:0.85, marginBottom:2 }}>
                  {isAr ? 'النوع:' : 'Gender:'} <b>{profile.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : profile.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : '—'}</b>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                  <span style={{ background:'#e74c3c', borderRadius:6, padding:'2px 8px', fontSize:'0.72rem', fontWeight:700 }}>
                    🩸 {profile.bloodType || '?'}
                  </span>
                  {profile.allergies.length > 0 && (
                    <span style={{ background:'#f59e0b', color:'#1c1917', borderRadius:6, padding:'2px 8px', fontSize:'0.7rem', fontWeight:700 }}>
                      ⚠️ {profile.allergies.length} {isAr ? 'حساسية' : 'Allerg.'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ background:'#fff', borderRadius:8, padding:3, width:64, height:64, flexShrink:0 }}>
                <img src={passportQrSrc} alt="QR" style={{ width:58, height:58 }} />
              </div>
            </div>

            <div style={{ borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:8, marginTop:12, display:'flex', justifyContent:'space-between', fontSize:'0.6rem', opacity:0.55, fontFamily:'monospace' }}>
              <span>{user.uid.slice(0,8).toUpperCase()} {user.uid.slice(8,16).toUpperCase()}</span>
              <span>💊 {profile.medications.filter(m => m.status === 'active').length} {isAr ? 'دواء' : 'Meds'}</span>
            </div>
          </div>

          {passportLoading ? (
            <p className="small muted">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc', borderRadius:10, padding:'10px 14px' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#0b3c5d', fontSize:'0.85rem' }}>
                    🔑 {isAr ? 'كود البطاقة (PIN)' : 'Passport PIN'}
                  </div>
                  <div className="small muted" style={{ marginTop:2 }}>
                    {savedPin ? '● ● ● ●' : (isAr ? 'لم يتم تعيين PIN بعد' : 'No PIN set yet')}
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  style={{ fontSize:'0.78rem' }}
                  onClick={() => { setShowPinSetup(true); setPinInput(''); }}
                >
                  {savedPin ? (isAr ? '✏️ تغيير' : '✏️ Change') : (isAr ? '+ تعيين PIN' : '+ Set PIN')}
                </button>
              </div>

              {showPinSetup && (
                <div style={{ background:'#eff6ff', borderRadius:10, padding:'12px 14px', border:'1px solid #bfdbfe' }}>
                  <div style={{ fontWeight:600, color:'#1e40af', marginBottom:8, fontSize:'0.85rem' }}>
                    {savedPin ? (isAr ? 'تغيير الـ PIN' : 'Change PIN') : (isAr ? 'تعيين PIN جديد' : 'Set New PIN')}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      className="input"
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="● ● ● ●"
                      style={{ flex:1, textAlign:'center', fontSize:'1.2rem', letterSpacing:6 }}
                    />
                    <button
                      className="btn"
                      disabled={pinInput.length < 4 || pinSaving}
                      onClick={handleSavePin}
                      style={{ background:'#0b3c5d', color:'#fff' }}
                    >
                      {pinSaving ? '⏳' : (isAr ? 'حفظ' : 'Save')}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowPinSetup(false)}
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                  <p className="small muted" style={{ marginTop:6 }}>
                    {isAr ? '4 أرقام على الأقل' : 'At least 4 digits'}
                  </p>
                </div>
              )}

              {passportIsActive ? (
                <div style={{ background:'#d1fae5', borderRadius:10, padding:'12px 14px', border:'1.5px solid #6ee7b7' }}>
                  <div style={{ fontWeight:700, color:'#065f46', marginBottom:4 }}>
                    ✅ {isAr ? 'البطاقة مفعّلة الآن' : 'Passport is Active'}
                  </div>
                  <div className="small" style={{ color:'#047857', marginBottom:10 }}>
                    ⏰ {isAr ? `تنتهي بعد ${passportRemaining} دقيقة` : `Expires in ${passportRemaining} min`}
                  </div>
                  <button
                    className="btn"
                    style={{ background:'#ef4444', color:'#fff', border:'none', width:'100%' }}
                    onClick={handlePassportRevoke}
                  >
                    🚫 {isAr ? 'إيقاف المشاركة' : 'Stop Sharing'}
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ background:'#fef3c7', borderRadius:8, padding:'8px 12px', border:'1px solid #fcd34d' }}>
                    <span className="small" style={{ color:'#92400e' }}>
                      🔒 {isAr ? 'غير مفعّلة — اختر المدة واضغط شارك' : 'Inactive — choose duration and share'}
                    </span>
                  </div>
                  <select
                    className="input"
                    value={passportHours}
                    onChange={(e) => setPassportHours(Number(e.target.value))}
                    style={{ width:'100%' }}
                  >
                    <option value={1}>{isAr ? 'ساعة واحدة' : '1 Hour'}</option>
                    <option value={6}>{isAr ? '6 ساعات' : '6 Hours'}</option>
                    <option value={12}>{isAr ? '12 ساعة' : '12 Hours'}</option>
                    <option value={24}>{isAr ? '24 ساعة' : '24 Hours'}</option>
                    <option value={48}>{isAr ? '48 ساعة' : '48 Hours'}</option>
                  </select>
                </div>
              )}

              {shareSuccess && (
                <div style={{ background:'#d1fae5', borderRadius:8, padding:'8px 12px', textAlign:'center', fontWeight:600, color:'#065f46', fontSize:'0.85rem' }}>
                  {shareSuccess}
                </div>
              )}

              {savedPin && (
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    className="btn"
                    style={{ flex:1, background:'#0b3c5d', color:'#fff', fontSize:'0.82rem' }}
                    disabled={passportSharing}
                    onClick={async () => { await handlePassportShare(); handleShareImage(); }}
                  >
                    {passportSharing ? '⏳' : (isAr ? '🖼️ شارك صورة' : '🖼️ Share Image')}
                  </button>
                  <button
                    className="btn"
                    style={{ flex:1, background:'#1a6b9a', color:'#fff', fontSize:'0.82rem' }}
                    disabled={passportSharing}
                    onClick={async () => { await handlePassportShare(); handleShareLink(); }}
                  >
                    {isAr ? '🔗 شارك رابط' : '🔗 Share Link'}
                  </button>
                </div>
              )}

              {!savedPin && (
                <p className="small muted" style={{ textAlign:'center' }}>
                  {isAr ? '⬆️ عيّن PIN أولاً لتفعيل المشاركة' : '⬆️ Set a PIN first to enable sharing'}
                </p>
              )}
            </div>
          )}

          {/* الأمراض المزمنة */}
          <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:14 }}>
            <div style={{ fontWeight:700, color:'#0b3c5d', marginBottom:8 }}>
              🏥 {isAr ? 'الأمراض المزمنة والحالات الصحية' : 'Chronic Conditions'}
            </div>
            <p className="small muted" style={{ marginBottom:10 }}>
              {isAr ? 'مهمة لتحديد تعارض الأدوية (يمكن إضافتها من هنا أو بأمر مباشر للمساعد الذكي)' : 'Important for drug interaction checks (can be added here or via the AI Assistant)'}
            </p>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input
                className="input"
                value={chronicInput}
                onChange={(e) => setChronicInput(e.target.value)}
                placeholder={isAr ? 'مثال: سكري النوع 2' : 'e.g. Type 2 Diabetes'}
                onKeyDown={(e) => e.key === 'Enter' && addChronic()}
                style={{ flex:1 }}
              />
              <button className="btn" onClick={addChronic}>{isAr ? 'إضافة' : 'Add'}</button>
            </div>
            {passportChronicList.length === 0
              ? <p className="small muted">{isAr ? 'لا توجد أمراض مزمنة مسجلة' : 'None added yet'}</p>
              : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {passportChronicList.map((c, i) => (
                    <span key={i} style={{
                      background:'#fef3c7', color:'#92400e',
                      borderRadius:20, padding:'4px 12px', fontSize:'0.82rem',
                      display:'flex', alignItems:'center', gap:6,
                    }}>
                      🔸 {c}
                      <button onClick={() => removeChronic(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#b45309', fontWeight:700, padding:0 }}>×</button>
                    </span>
                  ))}
                </div>
              )
            }
          </div>
        </section>
      )}

    </main>
  );
}
