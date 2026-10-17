import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import { Role, ROLES } from './auth';
import { useLang } from './i18n';

interface UserRole {
  uid: string;
  role: Role;
}

export default function UsersTab({ myUid }: { myUid: string }) {
  const { t } = useLang();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUid, setNewUid] = useState('');
  const [newRole, setNewRole] = useState<Role>('editor');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadRoles() {
    if (!configured || !db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'roles'));
      const list: UserRole[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.role) {
          list.push({ uid: d.id, role: data.role as Role });
        }
      });
      setUsers(list);
    } catch {
      // Roles collection may be empty or unconfigured
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  async function handleSaveRole(uid: string, role: Role) {
    setBusy(true);
    setMsg('');
    try {
      await setDoc(doc(db, 'roles', uid.trim()), { role });
      setMsg(t('saved') || 'Saved');
      await loadRoles();
      setNewUid('');
    } catch (e: any) {
      setMsg(e?.message || 'Error saving role');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRole(uid: string) {
    if (uid === myUid) {
      alert('Cannot delete your own admin role');
      return;
    }
    if (!confirm('Remove this role?')) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'roles', uid));
      await loadRoles();
    } catch (e: any) {
      alert(e?.message || 'Error deleting role');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h2>{t('tabUsers') || 'Team Roles & Permissions'}</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        Manage editor, reviewer, and admin access roles for catalog management.
      </p>

      {msg && <div style={{ padding: '0.6rem 1rem', background: 'var(--card-bg)', borderRadius: 8, margin: '1rem 0' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="User UID"
          value={newUid}
          onChange={(e) => setNewUid(e.target.value)}
          style={{ flex: '1 1 240px', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border)' }}
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as Role)}
          style={{ padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border)' }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          className="btn"
          disabled={!newUid.trim() || busy}
          onClick={() => handleSaveRole(newUid, newRole)}
        >
          Add / Update Role
        </button>
      </div>

      {loading ? (
        <p>Loading roles...</p>
      ) : users.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No role documents found in Firestore yet.</p>
      ) : (
        <div className="tablewrap"><table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>UID</th>
              <th style={{ padding: '0.5rem' }}>Role</th>
              <th style={{ padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>
                  {u.uid} {u.uid === myUid && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>(You)</span>}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <select
                    value={u.role}
                    disabled={busy || u.uid === myUid}
                    onChange={(e) => handleSaveRole(u.uid, e.target.value as Role)}
                    style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)' }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {u.uid !== myUid && (
                    <button
                      className="btn"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.85rem', background: '#e53e3e', color: '#fff' }}
                      disabled={busy}
                      onClick={() => handleDeleteRole(u.uid)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
