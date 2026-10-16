import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';

export type Role = 'editor' | 'reviewer' | 'admin';
export const ROLES: Role[] = ['editor', 'reviewer', 'admin'];

interface Ctx {
  user: User | null;
  role: Role | null;
  roleStatus: string; // 'ok' | 'missing' | 'invalid:<value>' | 'error:<code>' (for troubleshooting)
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>({
  user: null,
  role: null,
  roleStatus: '',
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [roleStatus, setRoleStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!configured || !auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // The role lives in Firestore (roles/{uid}); the rules protect it,
          // so a user cannot give themselves a role from the browser.
          const snap = await getDoc(doc(db, 'roles', u.uid));
          if (!snap.exists()) {
            setRole(null);
            setRoleStatus('missing');
          } else {
            const raw = snap.data().role;
            const r = typeof raw === 'string' ? (raw.trim() as Role) : null;
            if (r && ROLES.includes(r)) {
              setRole(r);
              setRoleStatus('ok');
            } else {
              setRole(null);
              setRoleStatus(`invalid:${String(raw)}`);
            }
          }
        } catch (e) {
          setRole(null);
          setRoleStatus(`error:${(e as { code?: string }).code ?? 'unknown'}`);
        }
      } else {
        setRole(null);
        setRoleStatus('');
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    if (!configured || !auth) throw new Error('Firebase is not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };
  const logout = async () => {
    if (!configured || !auth) return;
    await signOut(auth);
  };

  return <AuthCtx.Provider value={{ user, role, roleStatus, loading, login, logout }}>{children}</AuthCtx.Provider>;
}
