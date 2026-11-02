import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './auth';
import { useLang } from './i18n';
import { fetchOne, saveMedicine } from './medicinesApi';
import { Brand, emptyMedicine, FIELD_LABELS, Lang, Medicine, pick, Status, TEXT_FIELDS, TextField, tr } from './types';
import { SOURCE_HINTS } from './seedData';

export default function Editor() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const { user, role, loading } = useAuth();
  const { t, lang } = useLang();
  const [m, setM] = useState<Medicine | null | undefined>(() => {
    if (!isNew) return undefined;
    const base = emptyMedicine('');
    base.status = 'approved';
    base.lastReviewed = new Date().toISOString().slice(0, 10);
    base.reviewedBy = 'Editor / Clinical Team';
    base.sources = [{ title: 'Egyptian Drug Authority (EDA)', url: 'https://edaegypt.gov.eg', publisher: 'EDA' }];
    return base;
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || !role) return;
    fetchOne(id).then((x) => {
      setM(x);
    });
  }, [id, role]);

  if (loading) return <main className="wrap"><p>{t('loading')}</p></main>;
  if (!user || !role) return <Navigate to="/admin" replace />;
  if (m === undefined) return <main className="wrap"><p>{t('loading')}</p></main>;
  if (m === null) return <main className="wrap"><p>{t('notFound')}</p></main>;

  // Allow Editor, Reviewer, and Admin to publish directly as 'approved' so updates go live for all users
  const statuses: Status[] = ['approved', 'pending_review', 'draft', 'archived'];
  const upd = (patch: Partial<Medicine>) => setM({ ...m, ...patch });
  const setText = (f: TextField, l: Lang, v: string) => upd({ [f]: { ...m[f], [l]: v } } as Partial<Medicine>);
  const setBrand = (i: number, patch: Partial<Brand>) =>
    upd({ brands: m.brands.map((b, k) => (k === i ? { ...b, ...patch } : b)) });

  async function save() {
    if (!m || !user) return;
    const problems: string[] = [];
    if (isNew) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.id)) problems.push(t('badId'));
    }
    if (!m.genericName.ar.trim() && !m.genericName.en.trim()) {
      problems.push(tr(lang, 'يرجى إدخال الاسم العلمي للدواء (بالعربية أو الإنجليزية).', 'Please enter the generic name (Arabic or English).'));
    }
    setErrors(problems);
    if (problems.length) return;
    setSaving(true);
    try {
      const updatedMed: Medicine = {
        ...m,
        lastReviewed: m.lastReviewed || new Date().toISOString().slice(0, 10),
        reviewedBy: m.reviewedBy || user.displayName || user.email || 'Editor',
      };
      await saveMedicine(updatedMed, user.uid);
      nav('/admin');
    } catch {
      setErrors([t('actionFailed')]);
      setSaving(false);
    }
  }

  return (
    <main className="wrap stack">
      <h1>{isNew ? t('newMed') : `${pick(m.genericName, lang)} (${m.id})`}</h1>
      <p className="notice" style={{ margin: 0 }}>
        ⚡{' '}
        {tr(
          lang,
          'أي تعديل تحفظه هنا بحالة «معتمد (Approved)» يتم نشره وتحديثه فورياً لجميع زوار ومستخدمي الموقع في نفس اللحظة.',
          'Any change saved here with status "Approved" is published live to all site visitors immediately.'
        )}
      </p>

      {isNew && (
        <div className="card form">
          <label htmlFor="mid">{t('medId')}</label>
          <input
            id="mid"
            dir="ltr"
            placeholder="e.g. cefoperazone-sulbactam"
            value={m.id}
            onChange={(e) => upd({ id: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })}
          />
        </div>
      )}

      {TEXT_FIELDS.map((f) => (
        <div key={f} className="card form">
          <h3>{pick(FIELD_LABELS[f], lang)}</h3>
          <label>{t('arabic')}</label>
          <textarea dir="rtl" rows={f === 'genericName' || f === 'drugClass' ? 1 : 4} value={m[f].ar} onChange={(e) => setText(f, 'ar', e.target.value)} />
          <label>{t('english')}</label>
          <textarea dir="ltr" rows={f === 'genericName' || f === 'drugClass' ? 1 : 4} value={m[f].en} onChange={(e) => setText(f, 'en', e.target.value)} />
        </div>
      ))}

      <div className="card form">
        <h3>{t('brands')}</h3>
        {m.brands.map((b, i) => (
          <div key={i} className="subcard">
            <input placeholder={t('brandName')} value={b.name} onChange={(e) => setBrand(i, { name: e.target.value })} />
            <input placeholder={t('manufacturer')} value={b.manufacturer} onChange={(e) => setBrand(i, { manufacturer: e.target.value })} />
            <input dir="ltr" placeholder={t('barcode')} value={b.barcode} onChange={(e) => setBrand(i, { barcode: e.target.value })} />
            <input dir="ltr" placeholder={t('sourceUrl')} value={b.sourceUrl} onChange={(e) => setBrand(i, { sourceUrl: e.target.value })} />
            <label className="check">
              <input type="checkbox" checked={b.verified} onChange={(e) => setBrand(i, { verified: e.target.checked })} />
              {t('verifiedBrand')}
            </label>
            <button className="btn small danger" onClick={() => upd({ brands: m.brands.filter((_, k) => k !== i) })}>{t('remove')}</button>
          </div>
        ))}
        <button className="btn ghost" onClick={() => upd({ brands: [...m.brands, { name: '', manufacturer: '', barcode: '', verified: true, sourceUrl: 'https://edaegypt.gov.eg' }] })}>
          {t('addBrand')}
        </button>
      </div>

      <div className="card form">
        <h3>{t('sources')}</h3>
        <p className="small muted">{t('sourceHints')}</p>
        <ul className="small">
          {SOURCE_HINTS.map((s) => <li key={s.url}>{s.name} – <span dir="ltr">{s.url}</span></li>)}
        </ul>
        {m.sources.map((s, i) => (
          <div key={i} className="subcard">
            <input placeholder={t('sourceTitle')} value={s.title} onChange={(e) => upd({ sources: m.sources.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
            <input dir="ltr" placeholder={t('sourceUrl')} value={s.url} onChange={(e) => upd({ sources: m.sources.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)) })} />
            <input placeholder={t('publisher')} value={s.publisher ?? ''} onChange={(e) => upd({ sources: m.sources.map((x, k) => (k === i ? { ...x, publisher: e.target.value } : x)) })} />
            <input type="date" title={t('updated')} aria-label={t('updated')} value={s.updated ?? ''} onChange={(e) => upd({ sources: m.sources.map((x, k) => (k === i ? { ...x, updated: e.target.value } : x)) })} />
            <input type="date" title={t('accessed')} aria-label={t('accessed')} value={s.accessed ?? ''} onChange={(e) => upd({ sources: m.sources.map((x, k) => (k === i ? { ...x, accessed: e.target.value } : x)) })} />
            <button className="btn small danger" onClick={() => upd({ sources: m.sources.filter((_, k) => k !== i) })}>{t('remove')}</button>
          </div>
        ))}
        <button className="btn ghost" onClick={() => upd({ sources: [...m.sources, { title: '', url: '' }] })}>{t('addSource')}</button>
      </div>

      <div className="card form">
        <label htmlFor="lr">{t('lastReviewed')}</label>
        <input id="lr" type="date" value={m.lastReviewed} onChange={(e) => upd({ lastReviewed: e.target.value })} />
        <label htmlFor="rb">{t('reviewedBy')}</label>
        <input id="rb" value={m.reviewedBy} onChange={(e) => upd({ reviewedBy: e.target.value })} />
        <label htmlFor="st">{t('status')}</label>
        <select id="st" value={m.status} onChange={(e) => upd({ status: e.target.value as Status })}>
          {statuses.map((s) => <option key={s} value={s}>{t(`st_${s}`)}</option>)}
        </select>
        <label htmlFor="nt">{t('internalNotes')}</label>
        <textarea id="nt" rows={3} value={m.notes} onChange={(e) => upd({ notes: e.target.value })} />
      </div>

      {errors.length > 0 && (
        <div className="alert">
          <b>{t('cannotApprove')}</b>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      <div className="row stickybar">
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? tr(lang, 'جارٍ الحفظ والنشر الفوري...', 'Saving & Publishing Live...') : `💾 ${t('save')}`}
        </button>
        <button className="btn ghost" onClick={() => nav('/admin')}>{t('cancel')}</button>
      </div>
    </main>
  );
}
