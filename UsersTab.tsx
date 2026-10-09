import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ROLES, Role } from './auth';
import { useLang } from './i18n';

export default function UsersTab({ myUid }: { myUid: string }) {
  const { t } = useLang();
  const [rows, setRows] = useState<{ uid: string; role: string }[]>([]);
  const [uid, setUid] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [err, setErr] = useState('');

  const load = () =>
    getDocs(collection(db, 'roles'))
      .then((s) => setRows(s.docs.map((d) => ({ uid: d.id, role: String(d.data().role) }))))
      .catch(() => setErr(t('loadError')));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function grant() {
    if (!uid.trim()) return;
    try {
      await setDoc(doc(db, 'roles', uid.trim()), { role });
      setUid('');
      await load();
    } catch {
      setErr(t('actionFailed'));
    }
  }
  async function remove(id: string) {
    if (id === myUid) return; // never remove your own admin role by accident
    try {
      await deleteDoc(doc(db, 'roles', id));
      await load();
    } catch {
      setErr(t('actionFailed'));
    }
  }

  return (
    <div className="stack">
      <p className="muted">{t('usersHelp')}</p>
      <div className="card form">
        <label htmlFor="uid">{t('uid')}</label>
        <input id="uid" dir="ltr" value={uid} onChange={(e) => setUid(e.target.value)} />
        <label htmlFor="role">{t('role')}</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn" onClick={grant}>{t('grant')}</button>
      </div>
      {err && <p className="alert">{err}</p>}
      {rows.map((r) => (
        <div key={r.uid} className="card rowcard">
          <span dir="ltr" className="small">{r.uid}</span>
          <span className="badge approved">{r.role}</span>
          {r.uid !== myUid && <button className="btn small danger" onClick={() => remove(r.uid)}>{t('remove')}</button>}
        </div>
      ))}
    </div>
  );
}
