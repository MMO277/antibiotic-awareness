import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type Role = 'editor' | 'reviewer' | 'admin';
export const ROLES: Role[] = ['editor', 'reviewer', 'admin'];

interface Ctx {
  user: User | null;
  role: Role | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>({
  user: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // The role lives in Firestore (roles/{uid}); the rules protect it,
          // so a user cannot give themselves a role from the browser.
          const snap = await getDoc(doc(db, 'roles', u.uid));
          const r = snap.exists() ? (snap.data().role as Role) : null;
          setRole(r && ROLES.includes(r) ? r : null);
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  const logout = async () => {
    await signOut(auth);
  };

  return <AuthCtx.Provider value={{ user, role, loading, login, logout }}>{children}</AuthCtx.Provider>;
}
