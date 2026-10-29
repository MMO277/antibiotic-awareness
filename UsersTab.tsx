import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import { Role, ROLES } from './auth';
import { useLang } from './i18n';
import { tr } from './types';

interface UserRole {
  uid: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, { ar: string; en: string; de: string; fr: string; es: string }> = {
  admin: {
    ar: 'admin — مدير كامل (كافة الصلاحيات)',
    en: 'admin — Full Administrator',
    de: 'admin — Vollständiger Administrator',
    fr: 'admin — Administrateur complet',
    es: 'admin — Administrador completo',
  },
  reviewer: {
    ar: 'reviewer — مراجع علمي (اعتماد الأدوية والتعديل)',
    en: 'reviewer — Clinical Reviewer',
    de: 'reviewer — Klinischer Prüfer',
    fr: 'reviewer — Réviseur clinique',
    es: 'reviewer — Revisor clínico',
  },
  editor: {
    ar: 'editor — محرر (إضافة وتعديل المسودات والكتالوج)',
    en: 'editor — Catalog & Content Editor',
    de: 'editor — Katalog- & Inhalts-Editor',
    fr: 'editor — Éditeur de contenu',
    es: 'editor — Editor de contenido',
  },
};

export default function UsersTab({ myUid }: { myUid: string }) {
  const { t, lang } = useLang();
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
    if (!uid.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      await setDoc(doc(db, 'roles', uid.trim()), { role });
      setMsg(t('saved') || tr(lang, 'تم حفظ الصلاحية بنجاح ✓', 'Role saved successfully ✓'));
      await loadRoles();
      setNewUid('');
    } catch (e: unknown) {
      const errObj = e as { message?: string };
      setMsg(errObj?.message || t('actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRole(uid: string) {
    if (uid === myUid) {
      alert(tr(lang, 'لا يمكنك حذف صلاحية الأدمن الخاصة بحسابك الحالي.', 'Cannot delete your own admin role.'));
      return;
    }
    if (!confirm(t('confirmDel') || tr(lang, 'هل أنت متأكد من إزالة هذه الصلاحية؟', 'Remove this role?'))) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'roles', uid));
      await loadRoles();
    } catch (e: unknown) {
      const errObj = e as { message?: string };
      alert(errObj?.message || t('actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  const getRoleLabel = (r: Role) => {
    const info = ROLE_LABELS[r];
    if (!info) return r;
    if (lang === 'ar') return info.ar;
    if (lang === 'de') return info.de;
    if (lang === 'fr') return info.fr;
    if (lang === 'es') return info.es;
    return info.en;
  };

  return (
    <div className="card stack" style={{ marginTop: '0.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 4px' }}>
          👥 {tr(lang, 'إدارة المستخدمين والصلاحيات (Admin / Reviewer / Editor)', 'Team Roles & Permissions (Admin / Reviewer / Editor)', 'Gestion des Rôles & Permissions', 'Gestión de Usuarios y Permisos', 'Benutzerrollen & Berechtigungen')}
        </h2>
        <p className="small muted" style={{ margin: 0 }}>
          {t('usersHelp')}
        </p>
      </div>

      <div className="subcard" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div className="small">
          <b>🔑 {tr(lang, 'معرّف حسابك الحالي (Your UID):', 'Your Account UID:')} </b>
          <code dir="ltr" style={{ userSelect: 'all', padding: '2px 6px', borderRadius: 4, background: 'var(--card-bg)' }}>
            {myUid}
          </code>
        </div>
        <button
          type="button"
          className="btn small ghost"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(myUid).catch(() => {});
            }
          }}
        >
          📋 {tr(lang, 'نسخ الـ UID', 'Copy UID')}
        </button>
      </div>

      {msg && (
        <div style={{ padding: '0.6rem 1rem', background: 'var(--tint)', color: 'var(--navy)', fontWeight: 600, borderRadius: 8 }}>
          {msg}
        </div>
      )}

      <div className="subcard stack">
        <b>➕ {tr(lang, 'إضافة أو تعديل صلاحية مستخدم (Admin / Reviewer / Editor):', 'Grant or Update User Role:')}</b>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            dir="ltr"
            placeholder={t('uid') || 'User UID'}
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
            style={{ flex: '1 1 240px', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--line)' }}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
            aria-label={t('role')}
            style={{ flex: '1 1 200px', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--line)' }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {getRoleLabel(r)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn"
            disabled={!newUid.trim() || busy}
            onClick={() => handleSaveRole(newUid, newRole)}
          >
            ✅ {t('grant')}
          </button>
        </div>
      </div>

      {loading ? (
        <p>{t('loading')}</p>
      ) : users.length === 0 ? (
        <p className="muted">
          {tr(lang, 'لا توجد صلاحيات مسجلة في Firestore حتى الآن.', 'No role documents found in Firestore yet.')}
        </p>
      ) : (
        <div className="tablewrap">
          <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>{t('uid')}</th>
                <th>{t('role')}</th>
                <th>{tr(lang, 'إجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td dir="ltr" style={{ fontFamily: 'monospace' }}>
                    {u.uid}{' '}
                    {u.uid === myUid && (
                      <span className="badge approved" style={{ marginInlineStart: 6 }}>
                        {tr(lang, 'أنت (You)', 'You')}
                      </span>
                    )}
                  </td>
                  <td>
                    <select
                      value={u.role}
                      disabled={busy || u.uid === myUid}
                      onChange={(e) => handleSaveRole(u.uid, e.target.value as Role)}
                      style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid var(--line)' }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {getRoleLabel(r)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {u.uid !== myUid && (
                      <button
                        type="button"
                        className="btn small danger"
                        disabled={busy}
                        onClick={() => handleDeleteRole(u.uid)}
                      >
                        🗑️ {t('remove')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
