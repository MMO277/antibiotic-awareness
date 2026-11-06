/**
 * PassportView.tsx
 * صفحة البطاقة الصحية الذكية التي تظهر للطبيب أو الممرض أو المستشفى عند مسح QR المريض
 * - تطلب الـ PIN الخاص بالمريض
 * - تتحقق من الصلاحية والمدة
 * - تجمع وتدمج كل بيانات المريض الصحية من السحابة والنسخة المشاركة (الحساسية، العمر، فصيلة الدم،
 *   الوزن، هاتف الطوارئ، الأمراض المزمنة، وظائف الكلى والكبد، الأدوية الحالية، وكورسات المضادات الحيوية)
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useLang } from './i18n';
import { pick } from './types';
import {
  getPassportShare,
  isPassportValid,
  logPassportAccess,
  PassportShare,
} from './passportService';
import {
  ALLERGEN_CATEGORIES,
  emptyHealthProfile,
  loadProfile,
  mergeProfiles,
  normalizeProfile,
  UserHealthProfile,
} from './allergyData';
import {
  calculateScheduleProgress,
  formatFrequencyLabel,
  formatRouteLabel,
  loadPrescriptions,
  loadSchedules,
   normalizePrescriptions,
  normalizeSchedules,
  SavedPrescription,
  TreatmentSchedule,
} from './trackerData';

function SeverityBadge({ s, isAr }: { s: string; isAr: boolean }) {
  const map: Record<string, { bg: string; color: string; icon: string; ar: string; en: string }> = {
    life_threatening: {
      bg: '#fee2e2',
      color: '#991b1b',
      icon: '🚨',
      ar: 'مهددة للحياة (صدمة تحسسية)',
      en: 'Life-Threatening (Anaphylaxis)',
    },
    severe: {
      bg: '#ffedd5',
      color: '#9a3412',
      icon: '⚠️',
      ar: 'شديدة (تورم / ضيق تنفس)',
      en: 'Severe Reaction',
    },
    moderate: {
      bg: '#fef9c3',
      color: '#713f12',
      icon: '⚡',
      ar: 'متوسطة (طفح جلدي)',
      en: 'Moderate Reaction',
    },
    mild: {
      bg: '#d1fae5',
      color: '#065f46',
      icon: 'ℹ️',
      ar: 'خفيفة (حكة موضعية)',
      en: 'Mild Reaction',
    },
  };
  const c = map[s] || map.severe;
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: '0.76rem',
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {c.icon} {isAr ? c.ar : c.en}
    </span>
  );
}

function HealthView({
  profile,
  schedules,
  prescriptions,
  uid,
  isAr,
  lang,
  sharePhotoUrl,
  authDisplayName,
}: {
  profile: UserHealthProfile;
  schedules: TreatmentSchedule[];
  prescriptions: SavedPrescription[];
  uid: string;
  isAr: boolean;
  lang: 'ar' | 'en' | 'de' | 'fr' | 'es';
  sharePhotoUrl?: string;
  authDisplayName?: string;
}) {
  const chronicList: string[] = (() => {
    const set = new Set<string>();
    if (Array.isArray(profile.chronicConditions)) {
      for (const c of profile.chronicConditions) {
        if (c?.conditionName?.trim()) set.add(c.conditionName.trim());
      }
    }
    try {
      const n = profile.notes || '';
      const idx = n.indexOf('CHRONIC:');
      if (idx !== -1) {
        const rawJson = n.slice(idx + 8).split('||')[0].split('|')[0];
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (typeof item === 'string' && item.trim()) set.add(item.trim());
          });
        }
      }
    } catch {
      /* ignore */
    }
    return Array.from(set);
  })();

  const photoUrl =
    sharePhotoUrl ||
    (profile.notes?.includes('PHOTO:')
      ? profile.notes.slice(profile.notes.indexOf('PHOTO:') + 6).split('|')[0]
      : '');

  const patientName =
    profile.displayName?.trim() ||
    authDisplayName?.trim() ||
    (isAr ? 'مريض مسجل بالمنصة' : 'Registered Patient');

  const genderLabel =
    profile.gender === 'male'
      ? isAr
        ? 'ذكر'
        : 'Male'
      : profile.gender === 'female'
        ? isAr
          ? 'أنثى'
          : 'Female'
        : isAr
          ? 'غير مسجل'
          : 'Not set';

  const renalLabel =
    profile.renalStatus === 'impaired'
      ? isAr
        ? '⚠️ قصور كلوي (يلزم تعديل جرعات الأدوية الكلوية)'
        : '⚠️ Impaired Renal Function (Dose adjustment required)'
      : profile.renalStatus === 'normal'
        ? isAr
          ? 'طبيعية (Normal)'
          : 'Normal'
        : isAr
          ? 'غير مسجلة'
          : 'Not recorded';

  const hepaticLabel =
    profile.hepaticStatus === 'impaired'
      ? isAr
        ? '⚠️ قصور كبدي'
        : '⚠️ Impaired Hepatic Function'
      : profile.hepaticStatus === 'normal'
        ? isAr
          ? 'طبيعية (Normal)'
          : 'Normal'
        : isAr
          ? 'غير مسجلة'
          : 'Not recorded';

  const pregnancyLabel =
    profile.pregnancyStatus === 'pregnant'
      ? isAr
        ? '🤰 حامل (يُحذر إعطاء التتراسيكلين والفلوروكينولون)'
        : '🤰 Pregnant'
      : profile.pregnancyStatus === 'breastfeeding'
        ? isAr
          ? '🤱 مرضعة'
          : '🤱 Breastfeeding'
        : profile.pregnancyStatus === 'none'
          ? isAr
            ? 'لا يوجد'
            : 'None'
          : null;

  const activeMeds = profile.medications.filter((m) => m.status === 'active');
  const pastMeds = profile.medications.filter((m) => m.status !== 'active');
  const docs = profile.medicalDocuments || [];

  const isMissingBasicVitals =
    !profile.age?.trim() &&
    !profile.bloodType?.trim() &&
    !profile.weightKg?.trim() &&
    profile.allergies.length === 0 &&
    chronicList.length === 0 &&
    activeMeds.length === 0 &&
    schedules.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. هيدر البطاقة والبيانات الحيوية الأساسية */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0b3c5d 0%, #1565a8 60%, #0ea5e9 100%)',
          borderRadius: 18,
          padding: '22px 18px',
          color: '#fff',
          boxShadow: '0 14px 34px rgba(11, 60, 93, 0.35)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              border: '3px solid rgba(255,255,255,0.75)',
              marginBottom: 12,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2.5rem' }}>👤</span>
            )}
          </div>

          <div style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: 0.2 }}>{patientName}</div>
          <div
            style={{
              fontSize: '0.72rem',
              opacity: 0.75,
              marginTop: 4,
              fontFamily: 'monospace',
              background: 'rgba(0,0,0,0.22)',
              padding: '2px 10px',
              borderRadius: 999,
            }}
          >
            ID: {uid.slice(0, 16).toUpperCase()}
          </div>
        </div>

        {/* شبكة المؤشرات الحيوية للطبيب والممرض */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          >
            <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>🎂 {isAr ? 'العمر' : 'Age'}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 2 }}>
              {profile.age?.trim() ? profile.age : isAr ? 'غير مسجل' : 'Not set'}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(231, 76, 60, 0.88)',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            <div style={{ fontSize: '0.74rem', opacity: 0.95 }}>🩸 {isAr ? 'فصيلة الدم' : 'Blood Type'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, marginTop: 2, direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}>
              {profile.bloodType?.trim() ? profile.bloodType : isAr ? 'غير مسجلة' : 'Not set'}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          >
            <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>⚖️ {isAr ? 'الوزن' : 'Weight'}</div>
            <div style={{ fontSize: '1.02rem', fontWeight: 800, marginTop: 2 }}>
              {profile.weightKg?.trim()
                ? `${profile.weightKg} ${isAr ? 'كجم' : 'kg'}`
                : isAr
                  ? 'غير مسجل'
                  : 'Not set'}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          >
            <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>👤 {isAr ? 'النوع' : 'Gender'}</div>
            <div style={{ fontSize: '1.02rem', fontWeight: 800, marginTop: 2 }}>{genderLabel}</div>
          </div>
        </div>

        {/* رقم هاتف الطوارئ */}
        <div
          style={{
            marginTop: 10,
            background: 'rgba(15, 23, 42, 0.38)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
            📞 {isAr ? 'رقم الطوارئ للمريض:' : 'Emergency Contact:'}{' '}
            <strong dir="ltr">{profile.emergencyContact?.trim() || (isAr ? 'غير مسجل' : 'Not set')}</strong>
          </span>
          {profile.emergencyContact?.trim() && (
            <a
              href={`tel:${profile.emergencyContact.trim()}`}
              style={{
                background: '#10b981',
                color: '#fff',
                textDecoration: 'none',
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              📲 {isAr ? 'اتصال فوري' : 'Call Now'}
            </a>
          )}
        </div>
      </div>

      {/* تنبيه استكمال البيانات إذا كان المريض لم يدخل بياناته بعد */}
      {isMissingBasicVitals && (
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: 14,
            padding: '14px 16px',
            color: '#92400e',
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            ℹ️ {isAr ? 'لم يقم المريض بتعبئة تفاصيل العمر وفصيلة الدم والحساسية بعد' : 'Patient has not filled in Age, Blood Type, or Allergies yet'}
          </div>
          <p className="small" style={{ margin: '0 0 10px', color: '#78350f', lineHeight: 1.55 }}>
            {isAr
              ? 'إذا كنت أنت صاحب هذه البطاقة، اضغط الزر بالأسفل لإدخال عمرك وفصيلة دمك وحساسيتك الدوائية وأمراضك المزمنة ليراها الطبيب والممرض فوراً عند مسح الـ QR.'
              : 'If you are the patient, tap below to enter your age, blood type, drug allergies, and chronic conditions so clinicians can view them immediately.'}
          </p>
          <Link
            to="/health-profile"
            className="btn small"
            style={{ background: '#d97706', color: '#fff', textDecoration: 'none', display: 'inline-block' }}
          >
            ✏️ {isAr ? 'استكمال وتعديل بياناتي الصحية الآن' : 'Complete My Health Profile Now'}
          </Link>
        </div>
      )}

      {/* 2. قسم تحذيرات الحساسية الدوائية (يظهر دائماً بوضوح للطبيب والممرض) */}
      <div
        style={{
          background: profile.allergies.length > 0 ? '#fee2e2' : '#f0fdf4',
          borderRadius: 14,
          padding: '16px',
          border: profile.allergies.length > 0 ? '2px solid #ef4444' : '1.5px solid #86efac',
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: '1.02rem',
            color: profile.allergies.length > 0 ? '#991b1b' : '#065f46',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span>
            {profile.allergies.length > 0
              ? `⛔ ${isAr ? `تحذير حرج: حساسية دوائية مسجلة (${profile.allergies.length})` : `CRITICAL WARNING: Drug Allergies (${profile.allergies.length})`}`
              : `🛡️ ${isAr ? 'سجل الحساسية الدوائية (Drug Allergies)' : 'Drug Allergies Record'}`}
          </span>
        </div>

        {profile.allergies.length === 0 ? (
          <p className="small" style={{ margin: 0, color: '#047857', fontWeight: 600 }}>
            {isAr
              ? 'لا توجد حساسية دوائية مسجلة في ملف المريض حتى الآن (يُنصح دائماً بسؤال المريض سريرياً وإجراء اختبار الحساسية قبل الحقن).'
              : 'No drug allergies currently recorded in the patient profile (always confirm clinically before parenteral administration).'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile.allergies.map((a) => {
              const cat = ALLERGEN_CATEGORIES.find((c) => c.id === a.allergenKey);
              return (
                <div
                  key={a.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '12px 14px',
                    border: '1.5px solid #fca5a5',
                    boxShadow: '0 4px 12px rgba(185, 28, 28, 0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.02rem', color: '#7f1d1d' }}>
                        🚫 {a.drugName}
                      </div>
                      <div className="small" style={{ color: '#991b1b', fontWeight: 700, marginTop: 2 }}>
                        {isAr ? 'العائلة الدوائية:' : 'Allergen Family:'}{' '}
                        {cat ? pick(cat.name, lang) : a.allergenKey}
                      </div>
                    </div>
                    <SeverityBadge s={a.severity} isAr={isAr} />
                  </div>

                  {a.reportedSymptoms && (
                    <div
                      className="small"
                      style={{
                        marginTop: 8,
                        background: '#fef2f2',
                        padding: '6px 10px',
                        borderRadius: 8,
                        color: '#7f1d1d',
                      }}
                    >
                      <strong>{isAr ? 'الأعراض المسجلة:' : 'Reported Reaction:'}</strong> {a.reportedSymptoms}
                    </div>
                  )}

                  {a.notes && (
                    <div className="small muted" style={{ marginTop: 4 }}>
                      📝 {a.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. الأمراض المزمنة ووظائف الأعضاء (الكلى / الكبد / الحمل) */}
      <div className="card" style={{ margin: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0b3c5d', marginBottom: 10 }}>
          🏥 {isAr ? 'الأمراض المزمنة والحالة الفسيولوجية (الكلى / الكبد)' : 'Chronic Conditions & Organ Function'}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="small muted" style={{ fontWeight: 700, marginBottom: 6 }}>
            {isAr ? 'الأمراض المزمنة المسجلة:' : 'Recorded Chronic Conditions:'}
          </div>
          {chronicList.length === 0 ? (
            <span className="small muted">
              {isAr ? 'لا توجد أمراض مزمنة مسجلة.' : 'No chronic conditions recorded.'}
            </span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {chronicList.map((c, i) => (
                <span
                  key={i}
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fcd34d',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                  }}
                >
                  🔸 {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 8,
            paddingTop: 10,
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              background: profile.renalStatus === 'impaired' ? '#fef2f2' : '#f8fafc',
              border: profile.renalStatus === 'impaired' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: '0.83rem',
            }}
          >
            🫘 <strong>{isAr ? 'وظائف الكلى:' : 'Renal Status:'}</strong> {renalLabel}
          </div>
          <div
            style={{
              background: profile.hepaticStatus === 'impaired' ? '#fef2f2' : '#f8fafc',
              border: profile.hepaticStatus === 'impaired' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: '0.83rem',
            }}
          >
            🫁 <strong>{isAr ? 'وظائف الكبد:' : 'Hepatic Status:'}</strong> {hepaticLabel}
          </div>
          {pregnancyLabel && (
            <div
              style={{
                background: '#fdf2f8',
                border: '1px solid #fbcfe8',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: '0.83rem',
                color: '#9d174d',
              }}
            >
              <strong>{isAr ? 'الحمل / الرضاعة:' : 'Pregnancy / Lactation:'}</strong> {pregnancyLabel}
            </div>
          )}
        </div>
      </div>

      {/* 4. الأدوية الحالية وكورسات المضادات الحيوية النشطة */}
      <div className="card" style={{ margin: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0b3c5d', marginBottom: 10 }}>
          💊 {isAr ? 'الأدوية الحالية وكورسات المضادات الحيوية النشطة' : 'Current Medications & Active Antibiotic Courses'}
        </div>

        {activeMeds.length === 0 && schedules.length === 0 && prescriptions.length === 0 ? (
          <p className="small muted" style={{ margin: 0 }}>
            {isAr ? 'لا توجد أدوية نشطة مسجلة حالياً.' : 'No active medications or antibiotic courses recorded.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* الجداول العلاجية النشطة في متابع الجرعات */}
            {schedules.map((sch) => {
              const stats = calculateScheduleProgress(sch);
              return (
                <div
                  key={sch.id}
                  style={{
                    background: '#f0fdfa',
                    borderRadius: 12,
                    padding: '12px 14px',
                    border: '1.5px solid #5eead4',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <strong style={{ color: '#0f766e', fontSize: '0.96rem' }}>
                      ⏱️ {sch.medicineName} ({sch.prescribedDose})
                    </strong>
                    <span
                      style={{
                        background: '#ccfbf1',
                        color: '#115e59',
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: '0.74rem',
                        fontWeight: 800,
                      }}
                    >
                      {isAr ? `الالتزام: ${stats.progressPercent}% (${stats.takenCount}/${stats.totalDoses})` : `Adherence: ${stats.progressPercent}% (${stats.takenCount}/${stats.totalDoses})`}
                    </span>
                  </div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {formatRouteLabel(sch.route, isAr)} · {formatFrequencyLabel(sch.frequency, isAr)} ·{' '}
                    {isAr ? `من ${sch.startDate} إلى ${sch.endDate}` : `${sch.startDate} to ${sch.endDate}`}
                  </div>
                  {sch.notes && (
                    <div className="small" style={{ marginTop: 4, color: '#134e4a' }}>
                      📌 {sch.notes}
                    </div>
                  )}
                </div>
              );
            })}

            {/* الأدوية المسجلة في الملف الصحي */}
            {activeMeds.map((m) => (
              <div
                key={m.id}
                style={{
                  background: '#f0fdf4',
                  borderRadius: 10,
                  padding: '10px 14px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <strong style={{ color: '#14532d' }}>💊 {m.drugName}</strong>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '0.73rem',
                      fontWeight: 800,
                    }}
                  >
                    {isAr ? 'دواء حالي نشط' : 'Active'}
                  </span>
                </div>
                <div className="small muted" style={{ marginTop: 3 }}>
                  {[m.prescribedDose, formatFrequencyLabel(m.frequency, isAr), m.startDate ? `${isAr ? 'منذ' : 'Since'} ${m.startDate}` : '']
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
            ))}

            {/* الروشتات المحفوظة */}
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                }}
              >
                <strong style={{ color: '#0f172a' }}>📋 {rx.medicineName}</strong>
                <div className="small muted" style={{ marginTop: 3 }}>
                  {[rx.prescribedDose, formatFrequencyLabel(rx.frequency, isAr), rx.durationDays ? `${rx.durationDays} ${isAr ? 'أيام' : 'days'}` : '']
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {pastMeds.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
            <div className="small muted" style={{ fontWeight: 700, marginBottom: 6 }}>
              {isAr ? 'أدوية سابقة / متوقفة:' : 'Past / Discontinued Medications:'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pastMeds.map((pm) => (
                <span
                  key={pm.id}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                  }}
                >
                  {pm.drugName} {pm.prescribedDose ? `(${pm.prescribedDose})` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. التحاليل والتقارير الطبية المرفوعة */}
      {docs.length > 0 && (
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0b3c5d', marginBottom: 10 }}>
            📂 {isAr ? 'التقارير والتحاليل والمستندات الطبية المرفقة' : 'Attached Lab Reports & Medical Documents'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map((d) => (
              <div
                key={d.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                {d.previewDataUrl && (
                  <img
                    src={d.previewDataUrl}
                    alt={d.title}
                    style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{d.title}</strong>
                  <p className="small muted" style={{ margin: '3px 0 0' }}>
                    {d.extractedSummary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          background: '#f1f5f9',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: '0.76rem',
          color: '#475569',
          textAlign: 'center',
        }}
      >
        ⚕️{' '}
        {isAr
          ? 'هذه البيانات مسجلة بواسطة المريض للاطلاع الطبي السريع في الطوارئ والعيادات — لا تغني عن الفحص السريري المباشر.'
          : 'Patient-maintained health passport for rapid clinical reference — does not replace direct clinical examination.'}
      </div>
    </div>
  );
}

export default function PassportView() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { uid } = useParams<{ uid: string }>();

  const [step, setStep] = useState<'pin' | 'loading' | 'view' | 'error' | 'expired'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [profile, setProfile] = useState<UserHealthProfile | null>(null);
  const [schedules, setSchedules] = useState<TreatmentSchedule[]>([]);
  const [prescriptions, setPrescriptions] = useState<SavedPrescription[]>([]);
  const [sharePhotoUrl, setSharePhotoUrl] = useState<string>('');
  const [authDisplayName, setAuthDisplayName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!uid || pinInput.length < 4) return;
    setStep('loading');

    try {
      // 1. جلب بيانات المشاركة من passportShares/{uid}
      const share: PassportShare | null = await getPassportShare(uid);

      // 2. التحقق من التفعيل والمدة والـ PIN
      if (!share || !share.pin || share.expiresAt === 0) {
        setErrorMsg(
          isAr
            ? 'البطاقة غير مفعّلة للمشاركة حالياً. اطلب من المريض فتح «ملف صحتي» وتعيين PIN وتفعيل المشاركة.'
            : 'Passport sharing is not currently active. Ask the patient to activate sharing in Health Profile.'
        );
        setStep('error');
        return;
      }
      if (Date.now() > share.expiresAt) {
        setStep('expired');
        return;
      }
      if (!isPassportValid(share, pinInput)) {
        setErrorMsg(isAr ? 'رمز الـ PIN غير صحيح. حاول مرة أخرى.' : 'Incorrect PIN. Please try again.');
        setStep('pin');
        setPinInput('');
        return;
      }

      // 3. تجميع ودمج بيانات المريض من كافة المصادر المتاحة (passportShares + users/{uid} + localStorage)
      let mergedProfile: UserHealthProfile = share.sharedProfile
        ? normalizeProfile(share.sharedProfile)
        : emptyHealthProfile();
      let mergedSchedules: TreatmentSchedule[] = Array.isArray(share.sharedSchedules)
        ? normalizeSchedules(share.sharedSchedules)
        : [];
      let mergedPrescriptions: SavedPrescription[] = Array.isArray(share.sharedPrescriptions)
        ? normalizePrescriptions(share.sharedPrescriptions)
        : [];

      // محاولة جلب أحدث نسخة مباشرة من مستند المريض users/{uid} في Firestore ودمجها
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const d = userDoc.data();
            if (d?.healthProfile) {
              mergedProfile = mergeProfiles(normalizeProfile(d.healthProfile), mergedProfile);
            }
            if (Array.isArray(d?.schedules) && d.schedules.length > 0) {
              mergedSchedules = normalizeSchedules(d.schedules);
            }
            if (Array.isArray(d?.prescriptions) && d.prescriptions.length > 0) {
              mergedPrescriptions = normalizePrescriptions(d.prescriptions);
            }
          }
        } catch {
          /* إذا كان الطبيب زائراً ولم تُنشر قاعدة isPassportActivelyShared بعد، نعتمد على sharedProfile */
        }
      }

      // دمج أي بيانات محلية إذا كان الفحص يتم على نفس جهاز المريض
      try {
        const localScoped = loadProfile(uid);
        mergedProfile = mergeProfiles(mergedProfile, localScoped);
        if (mergedSchedules.length === 0) {
          const localSch = loadSchedules(uid);
          if (localSch.length > 0) mergedSchedules = localSch;
        }
        if (mergedPrescriptions.length === 0) {
          const localRx = loadPrescriptions(uid);
          if (localRx.length > 0) mergedPrescriptions = localRx;
        }
      } catch {
        /* ignore */
      }

      setProfile(mergedProfile);
      setSchedules(mergedSchedules);
      setPrescriptions(mergedPrescriptions);
      setSharePhotoUrl(share.photoUrl || '');
      setAuthDisplayName(share.authDisplayName || '');

      // 4. تسجيل عملية الاطلاع في سجل الوصول
      await logPassportAccess(uid);

      setStep('view');
    } catch {
      setErrorMsg(isAr ? 'حدث خطأ أثناء تحميل البطاقة. تحقق من الاتصال بالإنترنت.' : 'An error occurred. Check your connection.');
      setStep('error');
    }
  };

  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingBottom: 60 }}>
      {/* شاشة إدخال PIN */}
      {step === 'pin' && (
        <div className="card center" style={{ padding: '40px 24px', maxWidth: 400, margin: '40px auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🪪</div>
          <h2 style={{ color: '#0b3c5d', marginBottom: 8 }}>
            {isAr ? 'البطاقة الصحية الذكية للمريض' : 'Smart Patient Passport'}
          </h2>
          <p className="small muted" style={{ marginBottom: 20 }}>
            {isAr
              ? 'أدخل رمز الـ PIN الخاص بالمريض لعرض ملفه الصحي الكامل (الحساسية، العمر، فصيلة الدم، والأدوية)'
              : 'Enter the patient PIN to view the full medical passport (allergies, age, blood type, and medications)'}
          </p>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="● ● ● ●"
            style={{
              textAlign: 'center',
              fontSize: '1.5rem',
              letterSpacing: 8,
              marginBottom: 16,
              width: '100%',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {errorMsg && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 12 }}>⚠️ {errorMsg}</p>
          )}
          <button
            className="btn"
            style={{ background: '#0b3c5d', color: '#fff', width: '100%' }}
            disabled={pinInput.length < 4}
            onClick={handleSubmit}
          >
            {isAr ? '🔓 عرض الملف الصحي للمريض' : '🔓 View Patient Medical Record'}
          </button>
        </div>
      )}

      {/* شاشة التحميل */}
      {step === 'loading' && (
        <div className="card center" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
          <p>{isAr ? 'جارٍ التحقق وتحميل البيانات الطبية للمريض…' : 'Verifying & loading patient medical records…'}</p>
        </div>
      )}

      {/* شاشة خطأ */}
      {step === 'error' && (
        <div className="card center" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
          <h3 style={{ color: '#ef4444' }}>{isAr ? 'لا يمكن الوصول للبطاقة' : 'Access Denied'}</h3>
          <p className="muted">{errorMsg}</p>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 12 }}
            onClick={() => {
              setErrorMsg('');
              setStep('pin');
            }}
          >
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      )}

      {/* شاشة انتهاء المدة */}
      {step === 'expired' && (
        <div className="card center" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⏰</div>
          <h3 style={{ color: '#f59e0b' }}>
            {isAr ? 'انتهت صلاحية المشاركة المؤقتة' : 'Passport Share Expired'}
          </h3>
          <p className="muted">
            {isAr
              ? 'انتهت مدة المشاركة المحددة. اطلب من المريض فتح «ملف صحتي» والضغط على «تحديث بيانات الـ QR».'
              : 'The sharing period has ended. Ask the patient to refresh the QR share in Health Profile.'}
          </p>
        </div>
      )}

      {/* عرض الملف الصحي الكامل */}
      {step === 'view' && profile && uid && (
        <>
          <div
            style={{
              background: '#d1fae5',
              borderRadius: 12,
              padding: '10px 16px',
              marginBottom: 16,
              border: '1.5px solid #6ee7b7',
              textAlign: 'center',
            }}
          >
            <span style={{ color: '#065f46', fontWeight: 800 }}>
              ✅ {isAr ? 'تم التحقق من الـ PIN — سجل المريض الطبي المعتمد للطوارئ والعيادات' : 'PIN Verified — Patient Clinical Passport'}
            </span>
          </div>
          <HealthView
            profile={profile}
            schedules={schedules}
            prescriptions={prescriptions}
            uid={uid}
            isAr={isAr}
            lang={lang}
            sharePhotoUrl={sharePhotoUrl}
            authDisplayName={authDisplayName}
          />
        </>
      )}
    </main>
  );
}
