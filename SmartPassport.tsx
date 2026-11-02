/**
 * SmartPassport.tsx
 * بطاقة المريض الذكية — الصفحة الخاصة بالمريض نفسه
 * يشوف بطاقته، يعدل بياناته، يشارك بـ QR
 */

import { useState, useEffect, useRef } from 'react';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { useSyncedHealthProfile } from './allergyData';
import {
  getPassportShare,
  sharePassport,
  revokePassport,
  getPassportAccessLogs,
  PassportShare,
  PassportAccessLog,
} from './passportService';

// ─── QR via api.qrserver.com (نفس اللي الموقع بيستخدمه) ───────────────────
function PassportQR({ uid }: { uid: string }) {
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#/passport/${uid}`
      : `https://mmo277.github.io/antibiotic-awareness/#/passport/${uid}`;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
  return (
    <img
      src={src}
      alt="QR البطاقة"
      style={{ width: 180, height: 180, borderRadius: 12, border: '2px solid #0b3c5d', background: '#fff' }}
    />
  );
}

// ─── بطاقة الكارنيه المرئية ─────────────────────────────────────────────────
function PassportCard({
  name, age, bloodType, photoUrl, uid,
}: {
  name: string; age: string; bloodType: string; photoUrl: string; uid: string;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0b3c5d 0%, #1a6b9a 60%, #22a6b3 100%)',
      borderRadius: 20,
      padding: '24px 20px',
      color: '#fff',
      maxWidth: 380,
      margin: '0 auto',
      boxShadow: '0 8px 32px rgba(11,60,93,0.35)',
      position: 'relative',
      overflow: 'hidden',
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      {/* خلفية زخرفية */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
      }} />
      <div style={{
        position: 'absolute', bottom: -30, left: -30,
        width: 120, height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />

      {/* هيدر البطاقة */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: '1.5rem' }}>🏥</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', opacity: 0.9 }}>
            {isAr ? 'الوعي بالمضادات الحيوية' : 'Antibiotic Awareness'}
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
            {isAr ? 'البطاقة الصحية الذكية' : 'Smart Patient Passport'}
          </div>
        </div>
      </div>

      {/* صورة + بيانات */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 12,
          background: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.4)',
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {photoUrl
            ? <img src={photoUrl} alt="صورة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2rem' }}>👤</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
            {name || (isAr ? 'الاسم غير مدخل' : 'Name not set')}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: 2 }}>
            {isAr ? 'العمر:' : 'Age:'} <strong>{age || '—'}</strong>
          </div>
          <div style={{
            display: 'inline-block',
            background: '#e74c3c',
            borderRadius: 6, padding: '2px 10px',
            fontSize: '0.82rem', fontWeight: 700, marginTop: 4,
          }}>
            🩸 {bloodType || (isAr ? 'غير محدد' : 'Unknown')}
          </div>
        </div>
      </div>

      {/* رقم البطاقة */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.2)',
        paddingTop: 10,
        fontSize: '0.7rem',
        opacity: 0.65,
        fontFamily: 'monospace',
        letterSpacing: 1,
      }}>
        ID: {uid.slice(0, 16).toUpperCase()}
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function SmartPassport() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile, setProfile } = useSyncedHealthProfile();

  // حالة المشاركة
  const [share, setShare] = useState<PassportShare | null>(null);
  const [loadingShare, setLoadingShare] = useState(true);

  // نموذج المشاركة
  const [pin, setPin] = useState('');
  const [hours, setHours] = useState(24);
  const [sharing, setSharing] = useState(false);

  // سجل الوصول
  const [logs, setLogs] = useState<PassportAccessLog[]>([]);

  // صورة البطاقة
  const [photoUrl, setPhotoUrl] = useState(profile.notes?.startsWith('PHOTO:') ? profile.notes.slice(6) : '');
  const fileRef = useRef<HTMLInputElement>(null);

  // الأمراض المزمنة
  const [chronicInput, setChronicInput] = useState('');

  const chronicList: string[] = (() => {
    try {
      const n = profile.notes || '';
      const idx = n.indexOf('CHRONIC:');
      if (idx === -1) return [];
      return JSON.parse(n.slice(idx + 8).split('|')[0]);
    } catch { return []; }
  })();

  useEffect(() => {
    if (!user) { setLoadingShare(false); return; }
    getPassportShare(user.uid).then((s) => { setShare(s); setLoadingShare(false); });
    getPassportAccessLogs(user.uid).then(setLogs);
  }, [user]);

  // رفع صورة (base64 محلي)
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPhotoUrl(url);
      // نخزن الصورة في notes بشكل مؤقت (base64)
      savePhoto(url);
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = (url: string) => {
    const currentNotes = profile.notes || '';
    const cleaned = currentNotes.replace(/PHOTO:[^|]+\|?/, '');
    setProfile((p) => ({ ...p, notes: `PHOTO:${url}|${cleaned}` }));
  };

  const addChronic = () => {
    if (!chronicInput.trim()) return;
    const updated = [...chronicList, chronicInput.trim()];
    saveChronic(updated);
    setChronicInput('');
  };

  const removeChronic = (idx: number) => {
    const updated = chronicList.filter((_, i) => i !== idx);
    saveChronic(updated);
  };

  const saveChronic = (list: string[]) => {
    const currentNotes = profile.notes || '';
    const cleaned = currentNotes.replace(/CHRONIC:[\s\S]*?(\||$)/, '');
    setProfile((p) => ({ ...p, notes: `CHRONIC:${JSON.stringify(list)}|${cleaned}` }));
  };

  const handleShare = async () => {
    if (!user || pin.length < 4) return;
    setSharing(true);
    await sharePassport(user.uid, pin, hours);
    const s = await getPassportShare(user.uid);
    setShare(s);
    setSharing(false);
  };

  const handleRevoke = async () => {
    if (!user) return;
    await revokePassport(user.uid);
    setShare(null);
    setPin('');
  };

  const isActive = share && Date.now() < share.expiresAt;
  const remaining = share ? Math.max(0, Math.round((share.expiresAt - Date.now()) / 60000)) : 0;

  if (!user) {
    return (
      <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card center" style={{ padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🪪</div>
          <h2>{isAr ? 'البطاقة الصحية الذكية' : 'Smart Patient Passport'}</h2>
          <p className="muted">
            {isAr ? 'سجّل دخولك لعرض بطاقتك الصحية.' : 'Please sign in to view your passport.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingBottom: 60 }}>
      <h1 style={{ textAlign: 'center', color: '#0b3c5d', marginBottom: 8 }}>
        🪪 {isAr ? 'البطاقة الصحية الذكية' : 'Smart Patient Passport'}
      </h1>
      <p className="muted small" style={{ textAlign: 'center', marginBottom: 24 }}>
        {isAr
          ? 'بطاقتك الصحية الشخصية — شاركها مع طبيبك بأمان'
          : 'Your personal health card — share safely with your doctor'}
      </p>

      {/* ── البطاقة المرئية ── */}
      <section style={{ marginBottom: 28 }}>
        <PassportCard
          name={profile.displayName}
          age={profile.age}
          bloodType={profile.bloodType}
          photoUrl={photoUrl}
          uid={user.uid}
        />
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            className="btn btn-sm"
            style={{ fontSize: '0.8rem' }}
            onClick={() => fileRef.current?.click()}
          >
            📷 {isAr ? 'تغيير الصورة' : 'Change Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>
      </section>

      {/* ── الأمراض المزمنة ── */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: '#0b3c5d', marginBottom: 12 }}>
          🏥 {isAr ? 'الأمراض المزمنة' : 'Chronic Conditions'}
        </h3>
        <p className="small muted" style={{ marginBottom: 12 }}>
          {isAr
            ? 'أضف أمراضك المزمنة مثل السكر، الضغط، أمراض الكلى — مهمة للتحقق من تعارض الأدوية'
            : 'Add conditions like diabetes, hypertension, kidney disease — critical for drug interaction checks'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="input"
            value={chronicInput}
            onChange={(e) => setChronicInput(e.target.value)}
            placeholder={isAr ? 'مثال: سكري من النوع 2' : 'e.g. Type 2 Diabetes'}
            onKeyDown={(e) => e.key === 'Enter' && addChronic()}
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={addChronic}>
            {isAr ? 'إضافة' : 'Add'}
          </button>
        </div>
        {chronicList.length === 0 ? (
          <p className="small muted">{isAr ? 'لا توجد أمراض مزمنة مسجلة' : 'No conditions added yet'}</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {chronicList.map((c, i) => (
              <span key={i} style={{
                background: '#fef3c7', color: '#92400e',
                borderRadius: 20, padding: '4px 12px',
                fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                🔸 {c}
                <button
                  onClick={() => removeChronic(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', fontWeight: 700, padding: 0 }}
                >×</button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── الحساسية ── */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: '#0b3c5d', marginBottom: 8 }}>
          ⚠️ {isAr ? 'الحساسية المسجلة' : 'Recorded Allergies'}
        </h3>
        {profile.allergies.length === 0 ? (
          <p className="small muted">{isAr ? 'لا توجد حساسية مسجلة' : 'No allergies recorded'}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {profile.allergies.map((a) => (
              <div key={a.id} style={{
                background: a.severity === 'life_threatening' ? '#fee2e2' : '#fff7ed',
                borderRadius: 8, padding: '8px 12px',
                borderRight: `4px solid ${a.severity === 'life_threatening' ? '#ef4444' : '#f97316'}`,
              }}>
                <strong>{a.drugName}</strong>
                <span className="small muted" style={{ marginInlineStart: 8 }}>
                  {a.severity === 'life_threatening' ? '🚨' : a.severity === 'severe' ? '⚠️' : '⚡'} {a.severity}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="small muted" style={{ marginTop: 8 }}>
          {isAr ? 'لإضافة حساسية جديدة اذهب إلى' : 'To add allergies go to'}{' '}
          <a href="#/health-profile" style={{ color: '#0b3c5d' }}>
            {isAr ? 'ملف صحتي' : 'Health Profile'}
          </a>
        </p>
      </section>

      {/* ── QR المشاركة ── */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: '#0b3c5d', marginBottom: 12 }}>
          📱 {isAr ? 'QR البطاقة الصحية' : 'Health Passport QR'}
        </h3>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <PassportQR uid={user.uid} />
          <p className="small muted" style={{ marginTop: 8 }}>
            {isAr ? 'هذا الـ QR ثابت ومخصص لك وحدك' : 'This QR is fixed and unique to you'}
          </p>
        </div>

        {/* حالة المشاركة */}
        {loadingShare ? (
          <p className="small muted">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
        ) : isActive ? (
          <div style={{
            background: '#d1fae5', borderRadius: 10, padding: '12px 16px',
            marginBottom: 12, border: '1px solid #6ee7b7',
          }}>
            <div style={{ fontWeight: 700, color: '#065f46', marginBottom: 4 }}>
              ✅ {isAr ? 'البطاقة مفعّلة الآن' : 'Passport is active'}
            </div>
            <div className="small" style={{ color: '#047857' }}>
              {isAr ? `تنتهي بعد: ${remaining} دقيقة` : `Expires in: ${remaining} minutes`}
            </div>
            <button
              className="btn"
              style={{ marginTop: 10, background: '#ef4444', color: '#fff', border: 'none' }}
              onClick={handleRevoke}
            >
              🚫 {isAr ? 'إيقاف المشاركة فورًا' : 'Revoke Access Now'}
            </button>
          </div>
        ) : (
          <div style={{
            background: '#fef3c7', borderRadius: 10, padding: '10px 14px',
            marginBottom: 12, border: '1px solid #fcd34d',
          }}>
            <div className="small" style={{ color: '#92400e' }}>
              🔒 {isAr ? 'البطاقة غير مفعّلة — لا أحد يمكنه رؤيتها الآن' : 'Passport is inactive — nobody can view it now'}
            </div>
          </div>
        )}

        {/* نموذج تفعيل جديد */}
        {!isActive && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="small" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                🔑 {isAr ? 'PIN (4 أرقام على الأقل)' : 'PIN (min 4 digits)'}
              </label>
              <input
                className="input"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="small" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                ⏱️ {isAr ? 'مدة الصلاحية' : 'Access Duration'}
              </label>
              <select
                className="input"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                <option value={1}>{isAr ? 'ساعة واحدة' : '1 Hour'}</option>
                <option value={6}>{isAr ? '6 ساعات' : '6 Hours'}</option>
                <option value={12}>{isAr ? '12 ساعة' : '12 Hours'}</option>
                <option value={24}>{isAr ? '24 ساعة' : '24 Hours'}</option>
                <option value={48}>{isAr ? '48 ساعة' : '48 Hours'}</option>
              </select>
            </div>
            <button
              className="btn"
              disabled={pin.length < 4 || sharing}
              onClick={handleShare}
              style={{ background: '#0b3c5d', color: '#fff' }}
            >
              {sharing
                ? (isAr ? 'جارٍ التفعيل…' : 'Activating…')
                : (isAr ? '🔓 تفعيل البطاقة للمشاركة' : '🔓 Activate for Sharing')}
            </button>
          </div>
        )}
      </section>

      {/* ── سجل الوصول ── */}
      {logs.length > 0 && (
        <section className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#0b3c5d', marginBottom: 10 }}>
            📋 {isAr ? 'سجل من فتح البطاقة' : 'Access Log'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                background: '#f8fafc', borderRadius: 8, padding: '8px 12px',
                fontSize: '0.82rem', color: '#475569',
              }}>
                👁️ {new Date(log.accessedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
