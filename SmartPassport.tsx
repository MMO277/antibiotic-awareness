/**
 * SmartPassport.tsx
 * بطاقة المريض الذكية — صفحة المريض نفسه
 * - يشوف بطاقته كاملة مع QR جوّاها
 * - يرفع صورته لـ Firebase Storage
 * - يضيف أمراض مزمنة
 * - يشارك بـ PIN + مدة
 * - ينزل البطاقة كصورة PNG بجودة عالية
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { useSyncedHealthProfile } from './allergyData';
import {
  getPassportShare,
  sharePassport,
  revokePassport,
  getPassportAccessLogs,
  uploadPassportPhoto,
  savePassportPhotoUrl,
  getPassportPhotoUrl,
  PassportShare,
  PassportAccessLog,
} from './passportService';

// ── QR URL ────────────────────────────────────────────────────────────────────
function getPassportUrl(uid: string) {
  return typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#/passport/${uid}`
    : `https://mmo277.github.io/antibiotic-awareness/#/passport/${uid}`;
}

function qrSrc(uid: string, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(getPassportUrl(uid))}&margin=10&color=0b3c5d`;
}

// ── البطاقة المرئية (Canvas-ready) ───────────────────────────────────────────
function PassportCardUI({
  name, age, bloodType, gender, photoUrl, uid, isAr, allergiesCount, medsCount,
}: {
  name: string; age: string; bloodType: string; gender: string;
  photoUrl: string; uid: string; isAr: boolean;
  allergiesCount: number; medsCount: number;
}) {
  return (
    <div
      id="passport-card"
      style={{
        background: 'linear-gradient(135deg, #0b3c5d 0%, #1565a8 55%, #0ea5e9 100%)',
        borderRadius: 20,
        padding: '22px 20px 18px',
        color: '#fff',
        width: 360,
        margin: '0 auto',
        boxShadow: '0 10px 40px rgba(11,60,93,0.4)',
        position: 'relative',
        overflow: 'hidden',
        direction: 'ltr',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* زخارف خلفية */}
      <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
      <div style={{ position:'absolute', bottom:-40, left:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
      <div style={{ position:'absolute', top:80, left:-30, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />

      {/* هيدر */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
        <span style={{ fontSize:'1.6rem' }}>🏥</span>
        <div>
          <div style={{ fontWeight:700, fontSize:'0.9rem' }}>Antibiotic Awareness</div>
          <div style={{ fontSize:'0.65rem', opacity:0.7, letterSpacing:1 }}>SMART PATIENT PASSPORT</div>
        </div>
        <div style={{ marginInlineStart:'auto', textAlign:'right' }}>
          <div style={{ fontSize:'0.6rem', opacity:0.6 }}>🇪🇬 Egypt</div>
        </div>
      </div>

      {/* صورة + بيانات */}
      <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:16 }}>
        {/* صورة */}
        <div style={{
          width:80, height:95, borderRadius:10,
          background:'rgba(255,255,255,0.12)',
          border:'2px solid rgba(255,255,255,0.5)',
          overflow:'hidden', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {photoUrl
            ? <img src={photoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} crossOrigin="anonymous" />
            : <span style={{ fontSize:'2.5rem' }}>👤</span>
          }
        </div>

        {/* بيانات */}
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:'1.05rem', marginBottom:6, lineHeight:1.2 }}>
            {name || 'Patient Name'}
          </div>
          <div style={{ fontSize:'0.75rem', opacity:0.85, marginBottom:3 }}>
            DOB/Age: <strong>{age || '—'}</strong>
          </div>
          <div style={{ fontSize:'0.75rem', opacity:0.85, marginBottom:8 }}>
            Gender: <strong>{gender || '—'}</strong>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{
              background:'#e74c3c', borderRadius:6,
              padding:'3px 10px', fontSize:'0.78rem', fontWeight:700,
            }}>
              🩸 {bloodType || '?'}
            </span>
            {allergiesCount > 0 && (
              <span style={{
                background:'#f59e0b', color:'#1c1917', borderRadius:6,
                padding:'3px 10px', fontSize:'0.75rem', fontWeight:700,
              }}>
                ⚠️ {allergiesCount} Allerg.
              </span>
            )}
          </div>
        </div>

        {/* QR */}
        <div style={{
          background:'#fff', borderRadius:10, padding:4,
          width:70, height:70, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <img
            src={qrSrc(uid, 140)}
            alt="QR"
            style={{ width:62, height:62 }}
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {/* شريط سفلي */}
      <div style={{
        borderTop:'1px solid rgba(255,255,255,0.2)',
        paddingTop:10,
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <div style={{ fontSize:'0.62rem', opacity:0.55, fontFamily:'monospace', letterSpacing:1.5 }}>
          {uid.slice(0,8).toUpperCase()}  {uid.slice(8,16).toUpperCase()}
        </div>
        <div style={{ fontSize:'0.65rem', opacity:0.6 }}>
          💊 {medsCount} Meds
        </div>
      </div>
    </div>
  );
}

// ── دالة تنزيل البطاقة كصورة PNG ─────────────────────────────────────────────
async function downloadCardAsPng(uid: string, name: string) {
  // نستخدم html2canvas لو متاح — لو لا نعمل fallback بـ screenshot guide
  try {
    // @ts-ignore
    const html2canvas = (await import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.min.js')).default;
    const el = document.getElementById('passport-card');
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.download = `passport-${name || uid.slice(0,8)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch {
    alert('لتنزيل البطاقة: خذ screenshot للبطاقة أو جرب من متصفح Chrome');
  }
}

// ── الصفحة الرئيسية ───────────────────────────────────────────────────────────
export default function SmartPassport() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile, setProfile } = useSyncedHealthProfile();

  const [share, setShare] = useState<PassportShare | null>(null);
  const [loadingShare, setLoadingShare] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [hours, setHours] = useState(24);
  const [sharing, setSharing] = useState(false);
  const [logs, setLogs] = useState<PassportAccessLog[]>([]);
  const [chronicInput, setChronicInput] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState<'card' | 'share' | 'health'>('card');

  const fileRef = useRef<HTMLInputElement>(null);

  // استخراج الأمراض المزمنة من notes
  const chronicList: string[] = (() => {
    try {
      const n = profile.notes || '';
      const idx = n.indexOf('CHRONIC:');
      if (idx === -1) return [];
      return JSON.parse(n.slice(idx + 8).split('||')[0]);
    } catch { return []; }
  })();

  useEffect(() => {
    if (!user) { setLoadingShare(false); return; }
    Promise.all([
      getPassportShare(user.uid),
      getPassportPhotoUrl(user.uid),
      getPassportAccessLogs(user.uid),
    ]).then(([s, photo, lg]) => {
      setShare(s);
      setPhotoUrl(photo);
      setLogs(lg);
      setLoadingShare(false);
    });
  }, [user]);

  // رفع الصورة لـ Firebase Storage
  const handlePhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoLoading(true);
    try {
      const url = await uploadPassportPhoto(user.uid, file);
      await savePassportPhotoUrl(user.uid, url);
      setPhotoUrl(url);
    } catch {
      alert(isAr ? 'فشل رفع الصورة. تأكد من إعدادات Firebase Storage.' : 'Photo upload failed.');
    } finally {
      setPhotoLoading(false);
    }
  }, [user, isAr]);

  const addChronic = () => {
    if (!chronicInput.trim()) return;
    const updated = [...chronicList, chronicInput.trim()];
    saveChronic(updated);
    setChronicInput('');
  };

  const removeChronic = (idx: number) => {
    saveChronic(chronicList.filter((_, i) => i !== idx));
  };

  const saveChronic = (list: string[]) => {
    const currentNotes = (profile.notes || '').replace(/CHRONIC:[\s\S]*?(\|\||$)/, '');
    setProfile((p) => ({ ...p, notes: `CHRONIC:${JSON.stringify(list)}||${currentNotes}` }));
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

  const handleDownload = async () => {
    setDownloading(true);
    await downloadCardAsPng(user?.uid || '', profile.displayName);
    setDownloading(false);
  };

  const isActive = share && share.expiresAt > 0 && Date.now() < share.expiresAt;
  const remaining = share ? Math.max(0, Math.round((share.expiresAt - Date.now()) / 60000)) : 0;

  if (!user) {
    return (
      <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card center" style={{ padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>🪪</div>
          <h2>{isAr ? 'البطاقة الصحية الذكية' : 'Smart Patient Passport'}</h2>
          <p className="muted">{isAr ? 'سجّل دخولك أولاً.' : 'Please sign in first.'}</p>
        </div>
      </main>
    );
  }

  const tabBtn = (t: typeof tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        flex:1, padding:'10px 4px',
        background: tab === t ? '#0b3c5d' : 'transparent',
        color: tab === t ? '#fff' : '#0b3c5d',
        border: `1.5px solid #0b3c5d`,
        borderRadius: 10, fontWeight:600, fontSize:'0.82rem', cursor:'pointer',
        transition:'all .2s',
      }}
    >{label}</button>
  );

  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingBottom:60 }}>
      <h1 style={{ textAlign:'center', color:'#0b3c5d', marginBottom:4 }}>
        🪪 {isAr ? 'البطاقة الصحية الذكية' : 'Smart Patient Passport'}
      </h1>
      <p className="muted small" style={{ textAlign:'center', marginBottom:20 }}>
        {isAr ? 'بطاقتك الصحية — شاركها مع طبيبك بأمان' : 'Your health card — share safely with your doctor'}
      </p>

      {/* تابز */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {tabBtn('card', isAr ? '🪪 البطاقة' : '🪪 Card')}
        {tabBtn('health', isAr ? '🏥 بياناتي' : '🏥 Health')}
        {tabBtn('share', isAr ? '📱 مشاركة' : '📱 Share')}
      </div>

      {/* ── تاب البطاقة ── */}
      {tab === 'card' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <PassportCardUI
            name={profile.displayName}
            age={profile.age}
            bloodType={profile.bloodType}
            gender={profile.gender}
            photoUrl={photoUrl}
            uid={user.uid}
            isAr={isAr}
            allergiesCount={profile.allergies.length}
            medsCount={profile.medications.filter(m => m.status === 'active').length}
          />

          {/* أزرار الصورة والتنزيل */}
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button
              className="btn btn-sm"
              onClick={() => fileRef.current?.click()}
              disabled={photoLoading}
              style={{ fontSize:'0.82rem' }}
            >
              {photoLoading
                ? (isAr ? '⏳ جارٍ الرفع…' : '⏳ Uploading…')
                : (isAr ? '📷 تغيير الصورة' : '📷 Change Photo')}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />

            <button
              className="btn btn-sm"
              onClick={handleDownload}
              disabled={downloading}
              style={{ fontSize:'0.82rem', background:'#0b3c5d', color:'#fff' }}
            >
              {downloading
                ? (isAr ? '⏳ جارٍ…' : '⏳ Wait…')
                : (isAr ? '⬇️ تنزيل البطاقة PNG' : '⬇️ Download PNG')}
            </button>
          </div>

          {/* QR كبير منفرد */}
          <div className="card center" style={{ textAlign:'center' }}>
            <div style={{ fontWeight:700, color:'#0b3c5d', marginBottom:12 }}>
              📱 {isAr ? 'QR البطاقة الصحية' : 'Health Passport QR'}
            </div>
            <img
              src={qrSrc(user.uid, 200)}
              alt="QR"
              style={{ width:200, height:200, borderRadius:12, border:'2px solid #0b3c5d' }}
            />
            <p className="small muted" style={{ marginTop:8 }}>
              {isAr ? 'هذا الـ QR ثابت ومخصص لك وحدك' : 'This QR is fixed and unique to you'}
            </p>
            {/* حالة المشاركة */}
            <div style={{
              marginTop:10, padding:'6px 14px', borderRadius:20, display:'inline-block',
              background: isActive ? '#d1fae5' : '#fef3c7',
              color: isActive ? '#065f46' : '#92400e',
              fontSize:'0.78rem', fontWeight:600,
            }}>
              {isActive
                ? (isAr ? `✅ مفعّلة — تنتهي بعد ${remaining} دقيقة` : `✅ Active — expires in ${remaining} min`)
                : (isAr ? '🔒 غير مفعّلة' : '🔒 Inactive')}
            </div>
          </div>
        </div>
      )}

      {/* ── تاب الصحة ── */}
      {tab === 'health' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* الأمراض المزمنة */}
          <div className="card">
            <h3 style={{ color:'#0b3c5d', marginBottom:10 }}>
              🏥 {isAr ? 'الأمراض المزمنة' : 'Chronic Conditions'}
            </h3>
            <p className="small muted" style={{ marginBottom:12 }}>
              {isAr
                ? 'مهمة للتحقق من تعارض الأدوية مع حالتك الصحية'
                : 'Important for checking drug interactions with your conditions'}
            </p>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input
                className="input"
                value={chronicInput}
                onChange={(e) => setChronicInput(e.target.value)}
                placeholder={isAr ? 'مثال: سكري النوع 2' : 'e.g. Type 2 Diabetes'}
                onKeyDown={(e) => e.key === 'Enter' && addChronic()}
                style={{ flex:1 }}
              />
              <button className="btn" onClick={addChronic}>
                {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>
            {chronicList.length === 0
              ? <p className="small muted">{isAr ? 'لا توجد أمراض مزمنة' : 'None added yet'}</p>
              : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {chronicList.map((c, i) => (
                    <span key={i} style={{
                      background:'#fef3c7', color:'#92400e',
                      borderRadius:20, padding:'4px 12px', fontSize:'0.82rem',
                      display:'flex', alignItems:'center', gap:6,
                    }}>
                      🔸 {c}
                      <button
                        onClick={() => removeChronic(i)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#b45309', fontWeight:700, padding:0, fontSize:'1rem' }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )
            }
          </div>

          {/* الحساسية */}
          <div className="card">
            <h3 style={{ color:'#0b3c5d', marginBottom:10 }}>
              ⚠️ {isAr ? 'الحساسية المسجلة' : 'Recorded Allergies'}
            </h3>
            {profile.allergies.length === 0
              ? <p className="small muted">{isAr ? 'لا توجد حساسية' : 'No allergies'}</p>
              : profile.allergies.map((a) => (
                <div key={a.id} style={{
                  background: a.severity === 'life_threatening' ? '#fee2e2' : '#fff7ed',
                  borderRadius:8, padding:'8px 12px', marginBottom:6,
                  borderRight:`4px solid ${a.severity === 'life_threatening' ? '#ef4444' : '#f97316'}`,
                }}>
                  <strong>{a.drugName}</strong>
                  <span className="small muted" style={{ marginInlineStart:8 }}>
                    {a.severity === 'life_threatening' ? '🚨' : '⚠️'} {a.severity}
                  </span>
                </div>
              ))
            }
            <p className="small muted" style={{ marginTop:8 }}>
              {isAr ? 'لإضافة حساسية:' : 'To add allergies:'}{' '}
              <a href="#/health-profile" style={{ color:'#0b3c5d' }}>
                {isAr ? 'ملف صحتي' : 'Health Profile'}
              </a>
            </p>
          </div>

          {/* الأدوية */}
          <div className="card">
            <h3 style={{ color:'#0b3c5d', marginBottom:10 }}>
              💊 {isAr ? 'الأدوية الحالية' : 'Current Medications'}
            </h3>
            {profile.medications.filter(m => m.status === 'active').length === 0
              ? <p className="small muted">{isAr ? 'لا توجد أدوية نشطة' : 'No active medications'}</p>
              : profile.medications.filter(m => m.status === 'active').map((m) => (
                <div key={m.id} style={{
                  background:'#f0fdf4', borderRadius:8, padding:'8px 12px',
                  marginBottom:6, border:'1px solid #bbf7d0',
                }}>
                  <strong>{m.drugName}</strong>
                  <span className="small muted" style={{ marginInlineStart:8 }}>
                    {m.prescribedDose} — {m.frequency}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── تاب المشاركة ── */}
      {tab === 'share' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {loadingShare ? (
            <p className="small muted">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
          ) : isActive ? (
            <div style={{
              background:'#d1fae5', borderRadius:12, padding:'16px',
              border:'1.5px solid #6ee7b7',
            }}>
              <div style={{ fontWeight:700, color:'#065f46', marginBottom:6 }}>
                ✅ {isAr ? 'البطاقة مفعّلة الآن' : 'Passport is active'}
              </div>
              <div className="small" style={{ color:'#047857', marginBottom:12 }}>
                {isAr ? `تنتهي بعد: ${remaining} دقيقة` : `Expires in: ${remaining} minutes`}
              </div>
              <button
                className="btn"
                style={{ background:'#ef4444', color:'#fff', border:'none', width:'100%' }}
                onClick={handleRevoke}
              >
                🚫 {isAr ? 'إيقاف المشاركة فورًا' : 'Revoke Access Now'}
              </button>
            </div>
          ) : (
            <div style={{
              background:'#fef3c7', borderRadius:10, padding:'12px 16px',
              border:'1px solid #fcd34d',
            }}>
              <div className="small" style={{ color:'#92400e' }}>
                🔒 {isAr ? 'البطاقة غير مفعّلة — لا أحد يمكنه رؤيتها' : 'Inactive — nobody can view it now'}
              </div>
            </div>
          )}

          {!isActive && (
            <div className="card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <h3 style={{ color:'#0b3c5d', marginBottom:4 }}>
                🔓 {isAr ? 'تفعيل البطاقة للمشاركة' : 'Activate for Sharing'}
              </h3>

              <div>
                <label className="small" style={{ display:'block', marginBottom:4, fontWeight:600 }}>
                  🔑 {isAr ? 'PIN (4 أرقام على الأقل)' : 'PIN (min 4 digits)'}
                </label>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="● ● ● ●"
                  style={{ width:'100%' }}
                />
              </div>

              <div>
                <label className="small" style={{ display:'block', marginBottom:4, fontWeight:600 }}>
                  ⏱️ {isAr ? 'مدة الصلاحية' : 'Access Duration'}
                </label>
                <select
                  className="input"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  style={{ width:'100%' }}
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
                style={{ background:'#0b3c5d', color:'#fff', width:'100%' }}
              >
                {sharing
                  ? (isAr ? '⏳ جارٍ التفعيل…' : '⏳ Activating…')
                  : (isAr ? '🔓 تفعيل البطاقة' : '🔓 Activate Passport')}
              </button>
            </div>
          )}

          {/* سجل الوصول */}
          {logs.length > 0 && (
            <div className="card">
              <h3 style={{ color:'#0b3c5d', marginBottom:10 }}>
                📋 {isAr ? 'سجل من فتح البطاقة' : 'Access Log'}
              </h3>
              {logs.map((log, i) => (
                <div key={i} style={{
                  background:'#f8fafc', borderRadius:8, padding:'8px 12px',
                  marginBottom:6, fontSize:'0.82rem', color:'#475569',
                }}>
                  👁️ {new Date(log.accessedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
