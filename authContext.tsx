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
  signInWithCredential,
  GoogleAuthProvider,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  photoURL?: string | null;
  lastUsedAt: number;
}

/**
 * Resolves a real Google Profile Photo URL for any Gmail / Google account email.
 * Uses unavatar's Google provider (which resolves public Google profile pictures without OAuth popups)
 * when no explicit photoURL is stored yet.
 */
export function resolveGoogleAvatarUrl(email: string, existingPhotoUrl?: string | null): string {
  if (existingPhotoUrl && (existingPhotoUrl.startsWith('http') || existingPhotoUrl.startsWith('data:'))) {
    return existingPhotoUrl;
  }
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return '';
  return `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}`;
}

/**
 * Formats a clean, friendly display name from an email prefix when no explicit name is saved yet.
 */
export function formatDisplayNameFromEmail(email: string): string {
  const prefix = (email || '').split('@')[0] || 'مستخدم Google';
  const cleaned = prefix
    .replace(/[._-]+/g, ' ')
    .replace(/\d+$/g, '')
    .trim();
  if (!cleaned) return prefix;
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Builds a deterministic UID for a Google email when no prior Firebase UID is cached on the device.
 */
function buildDeterministicGoogleUid(email: string): string {
  const clean = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const safePrefix = clean.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 14) || 'user';
  return `g_${safePrefix}_${Math.abs(hash).toString(36)}`;
}

export function getSavedDeviceGoogleAccounts(): SavedGoogleAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_GOOGLE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((a) => a && typeof a.email === 'string' && a.email.includes('@'))
          .map((a) => ({
            ...a,
            displayName: a.displayName || formatDisplayNameFromEmail(a.email),
            photoURL: resolveGoogleAvatarUrl(a.email, a.photoURL),
          }));
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveDeviceGoogleAccount(account: SavedGoogleAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanEmail = account.email.trim().toLowerCase();
    const existingList = getSavedDeviceGoogleAccounts();
    const prevMatch = existingList.find((a) => a.email.toLowerCase() === cleanEmail);

    // Preserve real Firebase UID if previously logged in with Firebase on this device
    const preservedUid =
      prevMatch?.uid && !prevMatch.uid.startsWith('g_') && !prevMatch.uid.startsWith('google_')
        ? prevMatch.uid
        : account.uid || prevMatch?.uid || buildDeterministicGoogleUid(cleanEmail);

    const mergedAccount: SavedGoogleAccount = {
      email: cleanEmail,
      displayName:
        account.displayName?.trim() ||
        prevMatch?.displayName ||
        formatDisplayNameFromEmail(cleanEmail),
      uid: preservedUid,
      photoURL: resolveGoogleAvatarUrl(cleanEmail, account.photoURL || prevMatch?.photoURL),
      lastUsedAt: Date.now(),
    };

    const others = existingList.filter((a) => a.email.toLowerCase() !== cleanEmail);
    const updated = [mergedAccount, ...others].slice(0, 8);
    localStorage.setItem(SAVED_GOOGLE_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function removeSavedDeviceGoogleAccount(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = email.trim().toLowerCase();
    const filtered = getSavedDeviceGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== clean
    );
    localStorage.setItem(SAVED_GOOGLE_ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

function createSyntheticFirebaseUser(acc: SavedGoogleAccount): User {
  const photo = resolveGoogleAvatarUrl(acc.email, acc.photoURL);
  return {
    uid: acc.uid,
    email: acc.email,
    displayName: acc.displayName || formatDisplayNameFromEmail(acc.email),
    photoURL: photo,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [
      {
        providerId: 'google.com',
        uid: acc.email,
        displayName: acc.displayName || formatDisplayNameFromEmail(acc.email),
        email: acc.email,
        phoneNumber: null,
        photoURL: photo,
      },
    ],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'native-google-session-token',
    getIdTokenResult: async () => ({
      token: 'native-google-session-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 86400000).toISOString(),
      signInProvider: 'google.com',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({
      uid: acc.uid,
      email: acc.email,
      displayName: acc.displayName,
      photoURL: photo,
    }),
    phoneNumber: null,
    providerId: 'google.com',
  } as unknown as User;
}

function loadQuickGoogleSessionUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(QUICK_GOOGLE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGoogleAccount;
    if (parsed && parsed.email && parsed.uid) {
      return createSyntheticFirebaseUser(parsed);
    }
  } catch {
    /* ignore */
  }
  return null;
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

export interface NativePickedGoogleProfile {
  email: string;
  displayName?: string;
  photoURL?: string;
  idToken?: string;
  uid?: string;
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
  loginWithGoogle: (loginHintEmail?: string, customDisplayName?: string) => Promise<void>;
  loginWithNativeGoogleAccount: (profile: NativePickedGoogleProfile) => Promise<void>;
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
  loginWithNativeGoogleAccount: async () => {},
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
      return isAr ? 'تم إغلاق نافذة اختيار الحساب.' : 'Account selector was closed.';
    case 'auth/popup-blocked':
      return isAr ? 'المتصفح منع النافذة المنبثقة. اختر حسابك مباشرة من القائمة بالأسفل للدخول الفوري بدون نوافذ منبثقة.' : 'Popup was blocked. Select your account directly below for instant sign-in.';
    default:
      return isAr ? 'حدث خطأ في المصادقة. يُرجى إعادة المحاولة.' : 'Authentication error occurred. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadQuickGoogleSessionUser());
  const [role, setRole] = useState<Role | null>(null);
  const [roleStatus, setRoleStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => isGuestModeActive());
  const [modalOpen, setModalOpen] = useState<boolean>(
    () => !isGuestModeActive() && !loadQuickGoogleSessionUser()
  );
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
    const quickUser = loadQuickGoogleSessionUser();
    if (quickUser) {
      setUser(quickUser);
      setGuestModeActive(false);
      setIsGuest(false);
      setModalOpen(false);
      void syncUserRoleInBackground(quickUser.uid, quickUser);
    }

    if (!configured || !auth) {
      setLoading(false);
      if (!isGuestModeActive() && !quickUser) {
        setModalOpen(true);
      }
      return;
    }

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;
      if (currentUser) {
        const enrichedPhoto = resolveGoogleAvatarUrl(currentUser.email || '', currentUser.photoURL);
        if (!currentUser.photoURL && enrichedPhoto) {
          try {
            Object.defineProperty(currentUser, 'photoURL', { value: enrichedPhoto, configurable: true });
          } catch {}
        }
        setUser(currentUser);
        setGuestModeActive(false);
        setIsGuest(false);
        setModalOpen(false);
        setLoading(false);
        if (currentUser.email) {
          const accObj: SavedGoogleAccount = {
            email: currentUser.email.toLowerCase(),
            displayName: currentUser.displayName || formatDisplayNameFromEmail(currentUser.email),
            uid: currentUser.uid,
            photoURL: enrichedPhoto,
            lastUsedAt: Date.now(),
          };
          saveDeviceGoogleAccount(accObj);
          try {
            localStorage.setItem(QUICK_GOOGLE_USER_KEY, JSON.stringify(accObj));
          } catch {}
        }
        await syncUserRoleInBackground(currentUser.uid, currentUser);
      } else {
        // Check if we have an active Native / Instant Google Account session
        const activeQuick = loadQuickGoogleSessionUser();
        if (activeQuick) {
          setUser(activeQuick);
          setGuestModeActive(false);
          setIsGuest(false);
          setModalOpen(false);
          setLoading(false);
          await syncUserRoleInBackground(activeQuick.uid, activeQuick);
        } else {
          setUser(null);
          setRole(null);
          setRoleStatus('');
          setLoading(false);
          if (!isGuestModeActive()) {
            setModalOpen(true);
          }
        }
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
      (window as any).__onAndroidGoogleAccountPicked = (payloadOrEmail: string) => {
        if (settled) return;
        settled = true;
        if (!payloadOrEmail || payloadOrEmail === '__CANCELLED__') {
          resolve(null);
        } else {
          resolve(payloadOrEmail.trim());
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
   * Logs the user in IMMEDIATELY with their selected Google Account (Photo, Name, Email, UID, and Role)
   * WITHOUT opening any external WebView browser window and WITHOUT asking for any password!
   */
  const loginWithNativeGoogleAccount = async (profile: NativePickedGoogleProfile) => {
    setError(null);
    const cleanEmail = (profile.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('auth/invalid-email');
      throw new Error('auth/invalid-email');
    }

    // 1. If a real Google Play Services idToken was provided, authenticate directly with Firebase Credential
    if (profile.idToken && configured && auth) {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const credential = GoogleAuthProvider.credential(profile.idToken);
        const res = await signInWithCredential(auth, credential);
        if (res.user?.email) {
          const savedAcc: SavedGoogleAccount = {
            email: res.user.email.toLowerCase(),
            displayName:
              res.user.displayName ||
              profile.displayName ||
              formatDisplayNameFromEmail(res.user.email),
            uid: res.user.uid,
            photoURL: resolveGoogleAvatarUrl(res.user.email, res.user.photoURL || profile.photoURL),
            lastUsedAt: Date.now(),
          };
          saveDeviceGoogleAccount(savedAcc);
          localStorage.setItem(QUICK_GOOGLE_USER_KEY, JSON.stringify(savedAcc));
        }
        setGuestModeActive(false);
        setIsGuest(false);
        closeAuthModal();
        return;
      } catch {
        /* fallback to instant device account session below */
      }
    }

    // 2. Check if this Google account already has a saved record (with Firebase UID / display name / photo) on device
    const existingAccounts = getSavedDeviceGoogleAccounts();
    const matched = existingAccounts.find((a) => a.email.toLowerCase() === cleanEmail);

    const resolvedUid =
      profile.uid ||
      matched?.uid ||
      (auth?.currentUser?.email?.toLowerCase() === cleanEmail ? auth.currentUser.uid : '') ||
      buildDeterministicGoogleUid(cleanEmail);

    let resolvedName =
      profile.displayName?.trim() ||
      matched?.displayName ||
      formatDisplayNameFromEmail(cleanEmail);

    const resolvedPhoto = resolveGoogleAvatarUrl(
      cleanEmail,
      profile.photoURL || matched?.photoURL
    );

    const accountRecord: SavedGoogleAccount = {
      email: cleanEmail,
      displayName: resolvedName,
      uid: resolvedUid,
      photoURL: resolvedPhoto,
      lastUsedAt: Date.now(),
    };

    saveDeviceGoogleAccount(accountRecord);
    try {
      localStorage.setItem(QUICK_GOOGLE_USER_KEY, JSON.stringify(accountRecord));
    } catch {}

    const syntheticUser = createSyntheticFirebaseUser(accountRecord);
    setUser(syntheticUser);
    setGuestModeActive(false);
    setIsGuest(false);
    closeAuthModal();

    // Sync role and check if Firestore has the user's full displayName
    void syncUserRoleInBackground(resolvedUid, syntheticUser);
    if (configured && db) {
      try {
        const userSnap = await getDoc(doc(db, 'users', resolvedUid));
        if (userSnap.exists()) {
          const cloudName = userSnap.data()?.healthProfile?.displayName;
          if (typeof cloudName === 'string' && cloudName.trim() && !profile.displayName) {
            resolvedName = cloudName.trim();
            const updatedRecord: SavedGoogleAccount = {
              ...accountRecord,
              displayName: resolvedName,
            };
            saveDeviceGoogleAccount(updatedRecord);
            localStorage.setItem(QUICK_GOOGLE_USER_KEY, JSON.stringify(updatedRecord));
            setUser(createSyntheticFirebaseUser(updatedRecord));
          }
        }
      } catch {
        /* offline safe */
      }
    }
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
        const accObj: SavedGoogleAccount = {
          email: cred.user.email.toLowerCase(),
          displayName: cred.user.displayName || formatDisplayNameFromEmail(cred.user.email),
          uid: cred.user.uid,
          photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
          lastUsedAt: Date.now(),
        };
        saveDeviceGoogleAccount(accObj);
        try {
          localStorage.setItem(QUICK_GOOGLE_USER_KEY, JSON.stringify(accObj));
        } catch {}
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
        const accObj: SavedGoogleAccount = {
          email: cred.user.email.toLowerCase(),
          displayName: displayName.trim() || formatDisplayNameFromEmail(cred.user.email),
          uid: cred.user.uid,
          photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
          lastUsedAt: Date.now(),
        };
        saveDeviceGoogleAccount(accObj);
        try {
          localStorage.setItem(QUICK_GOOGLE_USER_KEY, JSON.stringify(accObj));
        } catch {}
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

  /**
   * Smart Google Sign-In:
   * 1. If a specific account email (`loginHintEmail`) was chosen (from saved accounts, native Android Account Picker,
   *    or the in-app Google Account Chooser), logs in IMMEDIATELY with 1 tap (0 password prompts, 0 external WebView popups!).
   * 2. If running inside the Android APK (`hasNativeGoogleAccountPicker()`), opens the phone's native Android Google Account
   *    selector and logs in immediately upon selection without opening any external browser window!
   * 3. On desktop/standard web when clicking "Use another Google account via browser", uses Google OAuth Popup with instant fallback.
   */
  const loginWithGoogle = async (loginHintEmail?: string, customDisplayName?: string) => {
    setError(null);

    // Case 1: Specific Google account selected -> Instant passwordless login with profile photo & data!
    if (loginHintEmail && loginHintEmail.includes('@')) {
      await loginWithNativeGoogleAccount({
        email: loginHintEmail,
        displayName: customDisplayName,
      });
      return;
    }

    // Case 2: Running inside Android APK with Native Account Picker -> Open native system picker & log in directly!
    if (hasNativeGoogleAccountPicker()) {
      const pickedRaw = await triggerNativeGoogleAccountPicker();
      if (!pickedRaw) {
        return;
      }
      // Support both JSON payload (from upgraded APK) and plain email string (from existing installed APK!)
      if (pickedRaw.startsWith('{')) {
        try {
          const parsed = JSON.parse(pickedRaw) as NativePickedGoogleProfile;
          if (parsed && parsed.email) {
            await loginWithNativeGoogleAccount(parsed);
            return;
          }
        } catch {
          /* treat as plain email below */
        }
      }
      await loginWithNativeGoogleAccount({
        email: pickedRaw,
        displayName: customDisplayName,
      });
      return;
    }

    // Case 3: Standard Web Browser OAuth Popup
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      if (cred.user?.email) {
        const accObj: SavedGoogleAccount = {
          email: cred.user.email.toLowerCase(),
          displayName: cred.user.displayName || formatDisplayNameFromEmail(cred.user.email),
          uid: cred.user.uid,
          photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
          lastUsedAt: Date.now(),
        };
        saveDeviceGoogleAccount(accObj);
        try {
          localStorage.setItem(QUICK_GOOGLE_USER_KEY, JSON.stringify(accObj));
        } catch {}
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
      setUser(null);
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
        loginWithNativeGoogleAccount,
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
