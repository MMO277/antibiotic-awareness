/**
 * PassportView.tsx
 * الصفحة اللي بتظهر لما حد يصور QR المريض
 * - بتطلب PIN
 * - بتتحقق من الصلاحية والمدة
 * - لو صح بتعرض كل الملف الصحي
 */

import { useState } from 'react';
import { useLang } from './i18n';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  getPassportShare,
  isPassportValid,
  logPassportAccess,
  PassportShare,
} from './passportService';
import { normalizeProfile, UserHealthProfile } from './allergyData';

// ─── عرض باج الحساسية ────────────────────────────────────────────────────────
function SeverityBadge({ s }: { s: string }) {
  const colors: Record<string, { bg: string; color: string; icon: string }> = {
    life_threatening: { bg: '#fee2e2', color: '#991b1b', icon: '🚨' },
    severe: { bg: '#ffedd5', color: '#9a3412', icon: '⚠️' },
    moderate: { bg: '#fef9c3', color: '#713f12', icon: '⚡' },
    mild: { bg: '#d1fae5', color: '#065f46', icon: '✅' },
  };
  const c = colors[s] || colors.mild;
  return (
    <span style={{
      background: c.bg, color: c.color,
      borderRadius: 12, padding: '2px 10px',
      fontSize: '0.75rem', fontWeight: 600,
    }}>
      {c.icon} {s}
    </span>
  );
}

// ─── عرض الملف الصحي الكامل ──────────────────────────────────────────────────
function HealthView({ profile, uid, isAr }: { profile: UserHealthProfile; uid: string; isAr: boolean }) {
  const chronicList: string[] = (() => {
    try {
      const n = profile.notes || '';
      const idx = n.indexOf('CHRONIC:');
      if (idx === -1) return [];
      return JSON.parse(n.slice(idx + 8).split('|')[0]);
    } catch { return []; }
  })();

  const photoUrl = profile.notes?.includes('PHOTO:')
    ? profile.notes.slice(profile.notes.indexOf('PHOTO:') + 6).split('|')[0]
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* هيدر البطاقة */}
      <div style={{
        background: 'linear-gradient(135deg, #0b3c5d, #1a6b9a)',
        borderRadius: 16, padding: '20px 16px',
        color: '#fff', textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 12px',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {photoUrl
            ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2.2rem' }}>👤</span>
          }
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          {profile.displayName || (isAr ? 'المريض' : 'Patient')}
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 4 }}>
          {isAr ? 'العمر:' : 'Age:'} {profile.age || '—'} &nbsp;|&nbsp;
          <span style={{ background: '#e74c3c', borderRadius: 6, padding: '1px 8px', fontWeight: 700 }}>
            🩸 {profile.bloodType || '—'}
          </span>
        </div>
        {profile.emergencyContact && (
          <div style={{ fontSize: '0.8rem', marginTop: 8, opacity: 0.85 }}>
            📞 {isAr ? 'طوارئ:' : 'Emergency:'} {profile.emergencyContact}
          </div>
        )}
        <div style={{ fontSize: '0.68rem', opacity: 0.5, marginTop: 8, fontFamily: 'monospace' }}>
          ID: {uid.slice(0, 16).toUpperCase()}
        </div>
      </div>

      {/* تحذير الحساسية */}
      {profile.allergies.length > 0 && (
        <div style={{ background: '#fee2e2', borderRadius: 12, padding: '14px 16px', border: '2px solid #fca5a5' }}>
          <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 10 }}>
            ⛔ {isAr ? 'تحذير: حساسية دوائية' : 'WARNING: Drug Allergies'}
          </div>
          {profile.allergies.map((a) => (
            <div key={a.id} style={{
              background: '#fff', borderRadius: 8, padding: '8px 12px',
              marginBottom: 6, border: '1px solid #fca5a5',
            }}>
              <div style={{ fontWeight: 700, color: '#7f1d1d' }}>{a.drugName}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <SeverityBadge s={a.severity} />
                {a.reportedSymptoms && (
                  <span className="small" style={{ color: '#6b7280' }}>{a.reportedSymptoms}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* الأمراض المزمنة */}
      {chronicList.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0b3c5d', marginBottom: 8 }}>
            🏥 {isAr ? 'الأمراض المزمنة' : 'Chronic Conditions'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {chronicList.map((c, i) => (
              <span key={i} style={{
                background: '#fef3c7', color: '#92400e',
                borderRadius: 20, padding: '4px 14px', fontSize: '0.85rem',
              }}>
                🔸 {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* الأدوية الحالية */}
      {profile.medications.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0b3c5d', marginBottom: 8 }}>
            💊 {isAr ? 'الأدوية الحالية' : 'Current Medications'}
          </div>
          {profile.medications.filter((m) => m.status === 'active').map((m) => (
            <div key={m.id} style={{
              background: '#f0fdf4', borderRadius: 8, padding: '8px 12px',
              marginBottom: 6, border: '1px solid #bbf7d0',
            }}>
              <strong>{m.drugName}</strong>
              <span className="small muted" style={{ marginInlineStart: 8 }}>
                {m.prescribedDose} — {m.frequency}
              </span>
            </div>
          ))}
          {profile.medications.filter((m) => m.status === 'active').length === 0 && (
            <p className="small muted">{isAr ? 'لا توجد أدوية نشطة' : 'No active medications'}</p>
          )}
        </div>
      )}

      {/* بيانات إضافية */}
      {(profile.pregnancyStatus !== 'unknown' || profile.renalStatus !== 'unknown' || profile.hepaticStatus !== 'unknown') && (
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0b3c5d', marginBottom: 8 }}>
            📊 {isAr ? 'بيانات طبية إضافية' : 'Additional Medical Info'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {profile.pregnancyStatus !== 'unknown' && (
              <div className="small">
                🤰 {isAr ? 'الحمل/الرضاعة:' : 'Pregnancy/Lactation:'} <strong>{profile.pregnancyStatus}</strong>
              </div>
            )}
            {profile.renalStatus !== 'unknown' && (
              <div className="small">
                🫘 {isAr ? 'وظائف الكلى:' : 'Renal Function:'} <strong>{profile.renalStatus}</strong>
              </div>
            )}
            {profile.hepaticStatus !== 'unknown' && (
              <div className="small">
                🫁 {isAr ? 'وظائف الكبد:' : 'Hepatic Function:'} <strong>{profile.hepaticStatus}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        background: '#f1f5f9', borderRadius: 10, padding: '10px 14px',
        fontSize: '0.75rem', color: '#64748b', textAlign: 'center',
      }}>
        ⚕️ {isAr
          ? 'هذه البيانات للاطلاع الطبي فقط — لا تستخدمها بديلاً عن الفحص السريري'
          : 'This data is for medical reference only — not a substitute for clinical examination'}
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function PassportView() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { uid } = useParams<{ uid: string }>();

  const [step, setStep] = useState<'pin' | 'loading' | 'view' | 'error' | 'expired'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [profile, setProfile] = useState<UserHealthProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!uid || pinInput.length < 4) return;
    setStep('loading');

    try {
      // 1. تجيب حالة المشاركة
      const share: PassportShare | null = await getPassportShare(uid);

      // 2. تتحقق من الصلاحية
      if (!share || share.expiresAt === 0) {
        setErrorMsg(isAr ? 'البطاقة غير مفعّلة من قِبل المريض.' : 'Passport is not activated by the patient.');
        setStep('error');
        return;
      }
      if (Date.now() > share.expiresAt) {
        setStep('expired');
        return;
      }
      if (!isPassportValid(share, pinInput)) {
        setErrorMsg(isAr ? 'PIN غير صحيح. حاول مرة أخرى.' : 'Incorrect PIN. Please try again.');
        setStep('pin');
        setPinInput('');
        return;
      }

      // 3. جيب الملف الصحي
      const userDoc = await getDoc(doc(db, 'users', uid));
      const raw = userDoc.exists() ? userDoc.data()?.healthProfile : null;
      const p = normalizeProfile(raw);
      setProfile(p);

      // 4. سجّل الوصول
      await logPassportAccess(uid);

      setStep('view');
    } catch {
      setErrorMsg(isAr ? 'حدث خطأ. تحقق من الاتصال.' : 'An error occurred. Check your connection.');
      setStep('error');
    }
  };

  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingBottom: 60 }}>

      {/* شاشة إدخال PIN */}
      {step === 'pin' && (
        <div className="card center" style={{ padding: '40px 24px', maxWidth: 380, margin: '40px auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🪪</div>
          <h2 style={{ color: '#0b3c5d', marginBottom: 8 }}>
            {isAr ? 'البطاقة الصحية الذكية' : 'Smart Patient Passport'}
          </h2>
          <p className="small muted" style={{ marginBottom: 20 }}>
            {isAr ? 'أدخل الـ PIN للوصول إلى الملف الصحي' : 'Enter the PIN to view the health profile'}
          </p>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="● ● ● ●"
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: 8, marginBottom: 16, width: '100%' }}
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
            {isAr ? '🔓 دخول' : '🔓 Access'}
          </button>
        </div>
      )}

      {/* شاشة التحميل */}
      {step === 'loading' && (
        <div className="card center" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
          <p>{isAr ? 'جارٍ التحقق…' : 'Verifying…'}</p>
        </div>
      )}

      {/* شاشة خطأ */}
      {step === 'error' && (
        <div className="card center" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
          <h3 style={{ color: '#ef4444' }}>{isAr ? 'لا يمكن الوصول' : 'Access Denied'}</h3>
          <p className="muted">{errorMsg}</p>
        </div>
      )}

      {/* شاشة انتهاء المدة */}
      {step === 'expired' && (
        <div className="card center" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⏰</div>
          <h3 style={{ color: '#f59e0b' }}>
            {isAr ? 'انتهت صلاحية البطاقة' : 'Passport Expired'}
          </h3>
          <p className="muted">
            {isAr
              ? 'انتهت مدة المشاركة. اطلب من المريض تفعيل البطاقة مرة أخرى.'
              : 'The sharing period has ended. Ask the patient to reactivate the passport.'}
          </p>
        </div>
      )}

      {/* عرض الملف الصحي */}
      {step === 'view' && profile && uid && (
        <>
          <div style={{
            background: '#d1fae5', borderRadius: 10, padding: '10px 16px',
            marginBottom: 20, border: '1px solid #6ee7b7', textAlign: 'center',
          }}>
            <span style={{ color: '#065f46', fontWeight: 700 }}>
              ✅ {isAr ? 'تم التحقق بنجاح' : 'Access Verified'}
            </span>
          </div>
          <HealthView profile={profile} uid={uid} isAr={isAr} />
        </>
      )}
    </main>
  );
}
