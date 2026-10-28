import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Role, useAuth } from './auth';
import { useLang } from './i18n';
import { fetchAll, removeMedicine, seedStarter, setStatus, validateForApproval } from './medicinesApi';
import { Medicine, pick, Status, STATUSES, tr } from './types';
import StatusBadge from './StatusBadge';
import UsersTab from './UsersTab';
import ResearchTab from './ResearchTab';
import { LearningImpactDashboard } from './LearningImpactDashboard';
import QuizResultsTab from './QuizResultsTab';
import CommercialCatalogTab from './CommercialCatalogEditor';

function diagText(status: string, t: (k: string) => string): string {
  if (status === 'missing') return t('diagMissing');
  if (status.startsWith('invalid:')) return t('diagInvalid');
  if (status === 'error:permission-denied') return t('diagRules');
  if (status.startsWith('error:')) return t('diagOther');
  return '';
}

function Login() {
  const { t } = useLang();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(email.trim(), pw);
    } catch {
      setErr(t('signInFail'));
    }
    setBusy(false);
  }
  return (
    <main className="wrap narrow">
      <form className="card form" onSubmit={submit}>
        <h1>{t('adminTitle')}</h1>
        <label htmlFor="em">{t('email')}</label>
        <input id="em" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="pw">{t('password')}</label>
        <input id="pw" type="password" dir="ltr" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="alert">{err}</p>}
        <button className="btn" disabled={busy}>{t('signIn')}</button>
      </form>
    </main>
  );
}

function MedsTab({ role, uid }: { role: Role; uid: string }) {
  const { t, lang } = useLang();
  const [items, setItems] = useState<Medicine[] | null>(null);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [err, setErr] = useState('');
  const reviewer = role === 'reviewer' || role === 'admin' || role === 'editor';
  const [showUn, setShowUn] = useState(true);
  useEffect(() => {
    getDoc(doc(db, 'settings', 'public'))
      .then((s) => {
        if (s.exists()) setShowUn(s.data().showUnreviewed !== false);
      })
      .catch(() => {});
  }, []);
  async function saveShowUn(v: boolean) {
    setShowUn(v);
    try {
      await setDoc(doc(db, 'settings', 'public'), { showUnreviewed: v });
    } catch {
      setShowUn(!v);
      alert(t('actionFailed'));
    }
  }

  const load = () =>
    fetchAll().then(setItems).catch(() => setErr(t('loadError')));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(m: Medicine, status: Status) {
    if (status === 'approved') {
      const problems = validateForApproval(m);
      if (problems.length) {
        alert(`${t('cannotApprove')}\n- ${problems.join('\n- ')}`);
        return;
      }
    }
    try {
      await setStatus(m, status, uid);
      await load();
    } catch {
      alert(t('actionFailed'));
    }
  }
  async function remove(m: Medicine) {
    if (!confirm(`${t('confirmDel')} ${m.id}`)) return;
    try {
      await removeMedicine(m.id);
      await load();
    } catch {
      alert(t('actionFailed'));
    }
  }
  async function starter() {
    try {
      const n = await seedStarter(uid);
      alert(`${t('starterDone')} ${n}`);
      await load();
    } catch {
      alert(t('actionFailed'));
    }
  }

  const shown = (items ?? []).filter((m) => filter === 'all' || m.status === filter);

  return (
    <div className="stack">
      {role === 'admin' && (
        <div className="card form">
          <label className="check">
            <input type="checkbox" checked={showUn} onChange={(e) => saveShowUn(e.target.checked)} />
            {t('previewToggle')}
          </label>
          <p className="small muted">{t('previewToggleHelp')}</p>
        </div>
      )}
      <div className="row wrapRow">
        <Link to="/admin/new" className="btn">{t('newMed')}</Link>
        <button className="btn ghost" onClick={starter}>{t('starter')}</button>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Status | 'all')} aria-label={t('status')}>
          <option value="all">{t('all')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`st_${s}`)}</option>)}
        </select>
      </div>
      {err && <p className="alert">{err}</p>}
      {items === null && !err && <p>{t('loading')}</p>}
      {shown.map((m) => (
        <div key={m.id} className="card rowcard">
          <div>
            <b>{pick(m.genericName, lang) || m.id}</b> <StatusBadge status={m.status} />
            <div className="small muted" dir="ltr">{m.id}</div>
          </div>
          <div className="row wrapRow">
            <Link className="btn small" to={`/admin/medicine/${m.id}`}>{t('edit')}</Link>
            <Link className="btn small ghost" to={`/medicine/${m.id}`}>👁️</Link>
            {m.status === 'draft' && <button className="btn small ghost" onClick={() => act(m, 'pending_review')}>{t('submitReview')}</button>}
            {reviewer && m.status === 'pending_review' && <button className="btn small" onClick={() => act(m, 'approved')}>{t('approve')}</button>}
            {reviewer && m.status !== 'archived' && <button className="btn small ghost" onClick={() => act(m, 'archived')}>{t('archive')}</button>}
            {reviewer && m.status === 'archived' && <button className="btn small ghost" onClick={() => act(m, 'draft')}>{t('restore')}</button>}
            {role === 'admin' && <button className="btn small danger" onClick={() => remove(m)}>{t('del')}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { t, lang } = useLang();
  const { user, role, roleStatus, loading, logout } = useAuth();
  const [tab, setTab] = useState<'catalog' | 'meds' | 'research' | 'users' | 'impact' | 'quiz'>('catalog');

  if (loading) return <main className="wrap"><p>{t('loading')}</p></main>;
  if (!user) return <Login />;
  if (!role)
    return (
      <main className="wrap narrow stack">
        <p className="alert">{t('noRole')}</p>
        <div className="card">
          <p className="small">{t('yourUid')}</p>
          <p dir="ltr" className="uidbox">{user.uid}</p>
          <p className="small muted" dir="ltr">{user.email}</p>
          <p className="small"><b>{t('diagTitle')}</b> <span dir="ltr">{roleStatus}</span></p>
          <p className="small">{diagText(roleStatus, t)}</p>
        </div>
        <button className="btn ghost" onClick={logout}>{t('signOut')}</button>
      </main>
    );

  return (
    <main className="wrap stack">
      <div className="head">
        <h1>{t('adminTitle')}</h1>
        <div className="row">
          <span className="badge approved">{role}</span>
          <button className="btn small ghost" onClick={logout}>{t('signOut')}</button>
        </div>
      </div>
      <div className="tabs" role="tablist">
        <button className={tab === 'catalog' ? 'on' : ''} onClick={() => setTab('catalog')}>
          💊 {tr(lang, 'الأدوية التجارية والأسعار والباركود (206+)', 'Commercial Drugs, Prices & Barcodes')}
        </button>
        <button className={tab === 'meds' ? 'on' : ''} onClick={() => setTab('meds')}>
          📚 {tr(lang, 'الموسوعة السريرية للمواد الفعالة (32)', 'Clinical Active Ingredients (32)')}
        </button>
        {role === 'admin' && <button className={tab === 'research' ? 'on' : ''} onClick={() => setTab('research')}>{t('tabResearch')}</button>}
        {role === 'admin' && <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>{t('tabUsers')}</button>}
        {role === 'admin' && (
          <button className={tab === 'impact' ? 'on' : ''} onClick={() => setTab('impact')}>
            {lang === 'ar' ? '📊 قياس الأثر والتعلم' : '📊 Learning Impact'}
          </button>
        )}
        {role === 'admin' && (
          <button className={tab === 'quiz' ? 'on' : ''} onClick={() => setTab('quiz')}>
            {lang === 'ar' ? '📝 نتائج الكويز' : '📝 Quiz Results'}
          </button>
        )}
      </div>
      {tab === 'catalog' && <CommercialCatalogTab uid={user.uid} />}
      {tab === 'meds' && <MedsTab role={role} uid={user.uid} />}
      {tab === 'research' && role === 'admin' && <ResearchTab />}
      {tab === 'users' && role === 'admin' && <UsersTab myUid={user.uid} />}
      {tab === 'impact' && role === 'admin' && <LearningImpactDashboard />}
      {tab === 'quiz' && role === 'admin' && <QuizResultsTab />}
    </main>
  );
}
