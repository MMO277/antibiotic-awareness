import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';

export type AuthMode = 'login' | 'register' | 'forgot';
export type Role = 'editor' | 'reviewer' | 'admin';
export const ROLES: Role[] = ['editor', 'reviewer', 'admin'];

export const GUEST_MODE_KEY = 'aa_guest_mode';

export function isGuestModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(GUEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setGuestModeActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      sessionStorage.setItem(GUEST_MODE_KEY, '1');
    } else {
      sessionStorage.removeItem(GUEST_MODE_KEY);
    }
  } catch {}
}

export interface AuthContextType {
  user: User | null;
  role: Role | null;
  roleStatus: string;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, displayName?: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  modalOpen: boolean;
  modalMode: AuthMode;
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  logoutModalOpen: boolean;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  isGuest: boolean;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  roleStatus: '',
  loading: false,
  error: null,
  clearError: () => {},
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  modalOpen: false,
  modalMode: 'login',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  logoutModalOpen: false,
  openLogoutModal: () => {},
  closeLogoutModal: () => {},
  isGuest: false,
  continueAsGuest: () => {},
  exitGuestMode: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function translateAuthError(errCode: string, isAr = true): string {
  switch (errCode) {
    case 'auth/unconfigured':
      return isAr
        ? 'خدمة الحسابات السحابية غير مفعّلة في هذه النسخة (إعدادات Firebase غير متوفرة). يمكنك الاستمرار في استخدام كافة أدوات الموقع كزائر بكل أمان.'
        : 'Cloud accounts are not configured in this build. You can safely continue using all platform features as a guest.';
    case 'auth/invalid-email':
      return isAr ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email address format.';
    case 'auth/user-not-found':
      return isAr ? 'لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني.' : 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return isAr ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.' : 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return isAr ? 'كلمة المرور ضعيفة. يُرجى استخدام 6 أحرف أو أرقام على الأقل.' : 'Password is too weak. Please use at least 6 characters.';
    case 'auth/too-many-requests':
      return isAr ? 'تم حظر المحاولات مؤقتاً لتكرار المحاولات الخاطئة. انتظر دقيقة ثم أعد المحاولة.' : 'Too many unsuccessful attempts. Please wait a minute and try again.';
    case 'auth/network-request-failed':
      return isAr ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.' : 'Network connection failed. Please check your internet connection.';
    case 'auth/requires-recent-login':
      return isAr ? 'يجب إعادة تسجيل الدخول لتنفيذ هذا الإجراء الأمني.' : 'Please log in again to confirm this sensitive action.';
    case 'auth/popup-closed-by-user':
      return isAr ? 'تم إغلاق نافذة تسجيل الدخول. حاول مرة أخرى.' : 'Sign-in popup was closed. Please try again.';
    case 'auth/popup-blocked':
      return isAr ? 'المتصفح منع النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة.' : 'Popup was blocked by the browser. Please allow popups.';
    default:
      return isAr ? 'حدث خطأ في المصادقة. يُرجى إعادة المحاولة.' : 'Authentication error occurred. Please try again.';
  }
}

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [roleStatus, setRoleStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => isGuestModeActive());
  const [modalOpen, setModalOpen] = useState<boolean>(() => !isGuestModeActive());
  const [modalMode, setModalMode] = useState<AuthMode>('login');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (!configured || !auth) {
      setUser(null);
      setRole(null);
      setRoleStatus('');
      setLoading(false);
      if (!isGuestModeActive()) {
        setModalOpen(true);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;
      setUser(currentUser);
      if (currentUser) {
        setGuestModeActive(false);
        setIsGuest(false);
        setModalOpen(false);
        if (db) {
          try {
            const snap = await getDoc(doc(db, 'roles', currentUser.uid));
            if (cancelled) return;
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
            if (cancelled) return;
            setRole(null);
            setRoleStatus(`error:${(e as { code?: string }).code ?? 'unknown'}`);
          }
        } else {
          setRole(null);
          setRoleStatus('');
        }
      } else {
        setRole(null);
        setRoleStatus('');
        if (!isGuestModeActive()) {
          setModalOpen(true);
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const clearError = () => setError(null);

  const openAuthModal = (mode: AuthMode = 'login') => {
    setModalMode(mode);
    setError(null);
    setModalOpen(true);
  };

  const continueAsGuest = () => {
    setGuestModeActive(true);
    setIsGuest(true);
    setModalOpen(false);
    setError(null);
  };

  const exitGuestMode = () => {
    // Return to lamp entry screen without calling Firebase sign-out
    setGuestModeActive(false);
    setIsGuest(false);
    try {
      sessionStorage.removeItem('aa_lamp_seen');
    } catch {}
    openAuthModal('login');
  };

  const closeAuthModal = () => {
    setModalOpen(false);
    setError(null);
    if (!user) {
      setGuestModeActive(true);
      setIsGuest(true);
    }
  };

  const openLogoutModal = () => {
    setError(null);
    setLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setLogoutModalOpen(false);
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  const register = async (email: string, password: string, displayName = '', rememberMe = false) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
        setUser({ ...cred.user, displayName: displayName.trim() } as User);
      }
      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await signInWithPopup(auth, googleProvider);
      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    setGuestModeActive(false);
    setIsGuest(false);
    if (!configured || !auth) {
      setUser(null);
      setRole(null);
      setRoleStatus('');
      return;
    }
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Logout error:', err);
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(code);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        roleStatus,
        loading,
        error,
        clearError,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        modalOpen,
        modalMode,
        openAuthModal,
        closeAuthModal,
        logoutModalOpen,
        openLogoutModal,
        closeLogoutModal,
        isGuest,
        continueAsGuest,
        exitGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
