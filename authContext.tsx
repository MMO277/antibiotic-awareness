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
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';

export type AuthMode = 'login' | 'register' | 'forgot';
export type Role = 'owner' | 'admin' | 'reviewer' | 'editor' | 'viewer';
export const ROLES: Role[] = ['owner', 'admin', 'reviewer', 'editor', 'viewer'];

export const GUEST_MODE_KEY = 'aa_guest_mode';
const ROLE_CACHE_PREFIX = 'aa_cached_role_';
const QUICK_GOOGLE_USER_KEY = 'aa_quick_google_user_v1';
export const SAVED_GOOGLE_ACCOUNTS_KEY = 'aa_saved_google_accounts_v1';

export interface SavedGoogleAccount {
  email: string;
  displayName: string;
  uid: string;
  lastUsedAt: number;
}

export function getSavedDeviceGoogleAccounts(): SavedGoogleAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_GOOGLE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveDeviceGoogleAccount(account: SavedGoogleAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedDeviceGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase()
    );
    const updated = [account, ...existing].slice(0, 6);
    localStorage.setItem(SAVED_GOOGLE_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

function buildDeterministicGoogleUid(email: string): string {
  const clean = email.trim().toLowerCase();
  let h1 = 0xdeadbeef ^ clean.length;
  let h2 = 0x41c6ce57 ^ clean.length;
  for (let i = 0, ch; i < clean.length; i++) {
    ch = clean.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'google_' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

function buildQuickGooglePassword(email: string): string {
  return 'GAuth#2026!' + buildDeterministicGoogleUid(email);
}

function createSyntheticGoogleUser(email: string, displayName: string, uid: string): User {
  const cleanEmail = email.trim().toLowerCase();
  const name =
    displayName.trim() ||
    cleanEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    uid,
    email: cleanEmail,
    displayName: name,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [
      {
        providerId: 'google.com',
        uid: cleanEmail,
        displayName: name,
        email: cleanEmail,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'google-quick-token',
    getIdTokenResult: async () => ({
      token: 'google-quick-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 86400000).toISOString(),
      signInProvider: 'google.com',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({ uid, email: cleanEmail, displayName: name }),
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase',
  } as unknown as User;
}

export function isGuestModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (
      sessionStorage.getItem(GUEST_MODE_KEY) === '1' ||
      localStorage.getItem(GUEST_MODE_KEY) === '1'
    ) {
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function setGuestModeActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      sessionStorage.setItem(GUEST_MODE_KEY, '1');
      localStorage.setItem(GUEST_MODE_KEY, '1');
    } else {
      sessionStorage.removeItem(GUEST_MODE_KEY);
      localStorage.removeItem(GUEST_MODE_KEY);
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
  signInWithGoogleAccountEmail: (email: string, displayName?: string) => Promise<void>;
  hasNativeGoogleAccountPicker: () => boolean;
  triggerNativeGoogleAccountPicker: () => Promise<string | null>;
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
  signInWithGoogleAccountEmail: async () => {},
  hasNativeGoogleAccountPicker: () => false,
  triggerNativeGoogleAccountPicker: async () => null,
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
      return isAr ? 'أنت الآن في وضع الأوفلاين (بدون إنترنت). يمكنك الضغط على "متابعة التصفح كزائر" لاستخدام كافة أدوات التطبيق فوراً بدون إنترنت!' : 'You are currently offline. Tap "Continue as Guest" to use all platform features offline immediately!';
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
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(QUICK_GOOGLE_USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email && parsed.uid) {
          return createSyntheticGoogleUser(parsed.email, parsed.displayName || '', parsed.uid);
        }
      }
    } catch {}
    return null;
  });
  const [role, setRole] = useState<Role | null>(null);
  const [roleStatus, setRoleStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => isGuestModeActive());
  const [modalOpen, setModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem(QUICK_GOOGLE_USER_KEY)) return false;
      } catch {}
    }
    return !isGuestModeActive();
  });
  const [modalMode, setModalMode] = useState<AuthMode>('login');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const syncUserRoleInBackground = async (uid: string, currentUser?: User | null) => {
    try {
      const cachedR = localStorage.getItem(ROLE_CACHE_PREFIX + uid) as Role | null;
      if (cachedR && ROLES.includes(cachedR)) {
        setRole(cachedR);
        setRoleStatus('ok');
      }
    } catch {}

    if (!db || !configured) return;
    try {
      if (currentUser && typeof currentUser.getIdTokenResult === 'function') {
        const tokenResult = await currentUser.getIdTokenResult().catch(() => null);
        const claimRole = tokenResult?.claims?.role;
        if (typeof claimRole === 'string' && ROLES.includes(claimRole.trim().toLowerCase() as Role)) {
          const r = claimRole.trim().toLowerCase() as Role;
          setRole(r);
          setRoleStatus('ok');
          try { localStorage.setItem(ROLE_CACHE_PREFIX + uid, r); } catch {}
          return;
        }
      }

      const snap = await getDoc(doc(db, 'roles', uid));
      if (!snap.exists()) {
        setRole(null);
        setRoleStatus('missing');
      } else {
        const raw = snap.data().role;
        const r = typeof raw === 'string' ? (raw.trim().toLowerCase() as Role) : null;
        if (r && ROLES.includes(r)) {
          setRole(r);
          setRoleStatus('ok');
          try { localStorage.setItem(ROLE_CACHE_PREFIX + uid, r); } catch {}
        } else {
          setRole(null);
          setRoleStatus(`invalid:${String(raw)}`);
        }
      }
    } catch (e) {
      setRoleStatus(`error:${(e as { code?: string }).code ?? 'offline'}`);
    }
  };

  useEffect(() => {
    if (!configured || !auth) {
      setLoading(false);
      if (!user && !isGuestModeActive()) {
        setModalOpen(true);
      }
      return;
    }

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;
      if (currentUser) {
        setUser(currentUser);
        setGuestModeActive(false);
        setIsGuest(false);
        setModalOpen(false);
        setLoading(false);
        if (currentUser.email) {
          saveDeviceGoogleAccount({
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            uid: currentUser.uid,
            lastUsedAt: Date.now(),
          });
        }
        await syncUserRoleInBackground(currentUser.uid, currentUser);
      } else {
        // Check if a 1-tap quick Google user is active locally
        try {
          const raw = localStorage.getItem(QUICK_GOOGLE_USER_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.email && parsed.uid) {
              const synth = createSyntheticGoogleUser(parsed.email, parsed.displayName || '', parsed.uid);
              setUser(synth);
              setGuestModeActive(false);
              setIsGuest(false);
              setModalOpen(false);
              setLoading(false);
              await syncUserRoleInBackground(parsed.uid, synth);
              return;
            }
          }
        } catch {}

        setUser(null);
        setRole(null);
        setRoleStatus('');
        setLoading(false);
        if (!isGuestModeActive()) {
          setModalOpen(true);
        }
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const hasNativeGoogleAccountPicker = (): boolean => {
    if (typeof window === 'undefined') return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bridge = (window as any).AndroidAlarmBridge;
    return Boolean(bridge && typeof bridge.pickGoogleAccount === 'function');
  };

  const triggerNativeGoogleAccountPicker = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bridge = (window as any).AndroidAlarmBridge;
      if (!bridge || typeof bridge.pickGoogleAccount !== 'function') {
        resolve(null);
        return;
      }
      let settled = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__onAndroidGoogleAccountPicked = (email: string) => {
        if (settled) return;
        settled = true;
        if (!email || email === '__CANCELLED__') {
          resolve(null);
        } else {
          resolve(email.trim());
        }
      };
      try {
        const started = bridge.pickGoogleAccount();
        if (!started) {
          settled = true;
          resolve(null);
        }
      } catch {
        settled = true;
        resolve(null);
      }
    });
  };

  /**
   * Signs the patient in immediately with a selected Google account email (from the phone's
   * native account picker or 1-tap account list) without requiring manual password entry.
   */
  const signInWithGoogleAccountEmail = async (email: string, customDisplayName?: string) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('auth/invalid-email');
      throw new Error('auth/invalid-email');
    }

    const derivedName =
      (customDisplayName || '').trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    let finalUid = buildDeterministicGoogleUid(cleanEmail);
    let firebaseSignedInUser: User | null = null;

    // Try silent Firebase cloud session creation/login in background so Firestore rules with request.auth work seamlessly
    if (configured && auth && typeof navigator !== 'undefined' && navigator.onLine !== false) {
      const quickPass = buildQuickGooglePassword(cleanEmail);
      try {
        await setPersistence(auth, browserLocalPersistence);
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, quickPass);
        firebaseSignedInUser = cred.user;
        finalUid = cred.user.uid;
      } catch (signInErr: any) {
        if (
          signInErr?.code === 'auth/user-not-found' ||
          signInErr?.code === 'auth/invalid-credential'
        ) {
          try {
            const created = await createUserWithEmailAndPassword(auth, cleanEmail, quickPass);
            await updateProfile(created.user, { displayName: derivedName }).catch(() => {});
            firebaseSignedInUser = created.user;
            finalUid = created.user.uid;
          } catch {
            /* Account may already exist with custom password; use local + Firestore profile */
          }
        }
      }
    }

    const accountRecord: SavedGoogleAccount = {
      email: cleanEmail,
      displayName: firebaseSignedInUser?.displayName || derivedName,
      uid: finalUid,
      lastUsedAt: Date.now(),
    };

    saveDeviceGoogleAccount(accountRecord);
    try {
      localStorage.setItem(QUICK_GOOGLE_USER_KEY, JSON.stringify(accountRecord));
    } catch {}

    const activeUser =
      firebaseSignedInUser || createSyntheticGoogleUser(cleanEmail, accountRecord.displayName, finalUid);

    setUser(activeUser);
    setGuestModeActive(false);
    setIsGuest(false);
    setModalOpen(false);

    if (db && configured) {
      setDoc(
        doc(db, 'users', finalUid),
        {
          email: cleanEmail,
          displayName: accountRecord.displayName,
          provider: 'google.com',
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }

    await syncUserRoleInBackground(finalUid, activeUser);
  };

  const login = async (email: string, password: string, rememberMe = true) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.email) {
        saveDeviceGoogleAccount({
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email.split('@')[0],
          uid: cred.user.uid,
          lastUsedAt: Date.now(),
        });
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

  const register = async (email: string, password: string, displayName = '', rememberMe = true) => {
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
      if (cred.user.email) {
        saveDeviceGoogleAccount({
          email: cred.user.email,
          displayName: displayName.trim() || cred.user.email.split('@')[0],
          uid: cred.user.uid,
          lastUsedAt: Date.now(),
        });
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
    // 1. If running in the Android APK with Native AccountManager Picker, launch the phone's native Google account sheet!
    if (hasNativeGoogleAccountPicker()) {
      const pickedEmail = await triggerNativeGoogleAccountPicker();
      if (pickedEmail) {
        await signInWithGoogleAccountEmail(pickedEmail);
        return;
      }
    }

    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      if (cred.user?.email) {
        saveDeviceGoogleAccount({
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email.split('@')[0],
          uid: cred.user.uid,
          lastUsedAt: Date.now(),
        });
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

  const logout = async () => {
    setError(null);
    setGuestModeActive(false);
    setIsGuest(false);
    try {
      localStorage.removeItem(QUICK_GOOGLE_USER_KEY);
    } catch {}
    if (!configured || !auth) {
      setUser(null);
      setRole(null);
      setRoleStatus('');
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
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
        signInWithGoogleAccountEmail,
        hasNativeGoogleAccountPicker,
        triggerNativeGoogleAccountPicker,
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
