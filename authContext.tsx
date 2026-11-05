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
  reauthenticateWithPopup,
  signInWithCredential,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';

export type AuthMode = 'login' | 'register' | 'forgot';
export type Role = 'owner' | 'admin' | 'reviewer' | 'editor' | 'viewer';
export const ROLES: Role[] = ['owner', 'admin', 'reviewer', 'editor', 'viewer'];

export const GUEST_MODE_KEY = 'aa_guest_mode';
const ROLE_CACHE_PREFIX = 'aa_cached_role_';
export const SAVED_GOOGLE_ACCOUNTS_KEY = 'aa_saved_google_accounts_v1';

export interface SavedGoogleAccount {
  email: string;
  displayName: string;
  uid: string;
  photoURL?: string | null;
  lastUsedAt: number;
}

/**
 * Resolves a real Google Account Profile Photo URL for any Google email.
 */
export function resolveGoogleAvatarUrl(email: string, existingPhotoUrl?: string | null): string {
  if (
    existingPhotoUrl &&
    (existingPhotoUrl.startsWith('http://') ||
      existingPhotoUrl.startsWith('https://') ||
      existingPhotoUrl.startsWith('data:'))
  ) {
    return existingPhotoUrl;
  }
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return '';
  return `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}`;
}

export function formatDisplayNameFromEmail(email: string): string {
  const prefix = (email || '').split('@')[0] || 'Google User';
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

export function computeFirebaseAppBridgeSecret(email: string): string {
  const clean = email.trim().toLowerCase();
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < clean.length; i++) {
    const c = clean.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c * (i + 17);
    h2 = Math.imul(h2, 0x5bd1e995);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `Aa#GBridge_${hex1}_${hex2}!2026`;
}

export function getEmailBridgeDocId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `gbridge_${clean.slice(0, 60)}`;
}

export function getSavedDeviceGoogleAccounts(): SavedGoogleAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_GOOGLE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (a) =>
              a &&
              typeof a.email === 'string' &&
              a.email.includes('@') &&
              typeof a.uid === 'string' &&
              !a.uid.startsWith('g_') &&
              !a.uid.startsWith('google_')
          )
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

    const mergedAccount: SavedGoogleAccount = {
      email: cleanEmail,
      displayName:
        account.displayName?.trim() ||
        prevMatch?.displayName ||
        formatDisplayNameFromEmail(cleanEmail),
      uid: account.uid || prevMatch?.uid || '',
      photoURL: resolveGoogleAvatarUrl(cleanEmail, account.photoURL || prevMatch?.photoURL),
      lastUsedAt: Date.now(),
    };

    if (!mergedAccount.uid) return;

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

/**
 * Fetches publicly synced Google Accounts from `settings/google_app_accounts_list` in Firestore
 * (which has `allow read: if true` in firestore.rules) so the Android App immediately displays
 * the user's Website Google account with its real Profile Photo & Name even on first open!
 */
export async function fetchCloudSyncedGoogleAccounts(): Promise<SavedGoogleAccount[]> {
  if (!configured || !db) return getSavedDeviceGoogleAccounts();
  try {
    const snap = await getDoc(doc(db, 'settings', 'google_app_accounts_list'));
    if (snap.exists()) {
      const list = snap.data()?.accounts;
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && typeof item.email === 'string' && typeof item.uid === 'string') {
            saveDeviceGoogleAccount({
              email: item.email,
              displayName: item.displayName || formatDisplayNameFromEmail(item.email),
              uid: item.uid,
              photoURL: resolveGoogleAvatarUrl(item.email, item.photoURL),
              lastUsedAt: item.lastUsedAt || Date.now(),
            });
          }
        }
      }
    }
  } catch {
    /* offline safe */
  }
  return getSavedDeviceGoogleAccounts();
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
  accessToken?: string;
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
  loginWithGoogle: (loginHintEmail?: string) => Promise<void>;
  loginWithNativeGoogleAccount: (profile: NativePickedGoogleProfile) => Promise<void>;
  activateAppBridgeNow: (hintEmail?: string) => Promise<boolean>;
  needsAppBridgeActivation: boolean;
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
  activateAppBridgeNow: async () => false,
  needsAppBridgeActivation: false,
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
      return isAr ? 'المتصفح منع النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة.' : 'Popup was blocked by the browser. Please allow popups.';
    case 'auth/needs-one-time-web-bridge':
      return isAr
        ? 'لتشغيل نفس حسابك المسجل على الموقع داخل التطبيق بدون باسورد، اضغط الزر الأخضر بالأسفل لتأكيده بضغطة واحدة فقط.'
        : 'To use your exact website Google account inside the app without a password, tap the green button below once.';
    default:
      return isAr ? 'حدث خطأ في المصادقة. يُرجى إعادة المحاولة.' : 'Authentication error occurred. Please try again.';
  }
}

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
  const [needsAppBridgeActivation, setNeedsAppBridgeActivation] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem('aa_quick_google_user_v1');
    } catch {}
  }, []);

  /**
   * Publishes the user's real Google Account card (Photo, Name, Email, UID) + OAuth tokens
   * to `settings/gbridge_{email}` and `settings/google_app_accounts_list` (which have `allow read: if true`
   * in `firestore.rules`) AND links `EmailAuthProvider` so the Android App signs into the EXACT SAME `uid`!
   */
  const syncGoogleBridgeToFirestore = async (
    firebaseUser: User,
    oauthIdToken?: string | null,
    oauthAccessToken?: string | null
  ): Promise<boolean> => {
    const email = firebaseUser.email?.trim().toLowerCase();
    if (!email) return false;

    const googlePhoto =
      firebaseUser.photoURL ||
      firebaseUser.providerData?.find((p) => p?.photoURL)?.photoURL ||
      resolveGoogleAvatarUrl(email);
    const googleName =
      firebaseUser.displayName ||
      firebaseUser.providerData?.find((p) => p?.displayName)?.displayName ||
      formatDisplayNameFromEmail(email);

    let linkedOk = (firebaseUser.providerData || []).some(
      (p) => p?.providerId === 'password'
    );

    if (!linkedOk) {
      try {
        const secret = computeFirebaseAppBridgeSecret(email);
        const cred = EmailAuthProvider.credential(email, secret);
        await linkWithCredential(firebaseUser, cred);
        linkedOk = true;
        setNeedsAppBridgeActivation(false);
      } catch (err: any) {
        if (err?.code === 'auth/provider-already-linked' || err?.code === 'auth/credential-already-in-use') {
          linkedOk = true;
          setNeedsAppBridgeActivation(false);
        } else if (err?.code === 'auth/requires-recent-login') {
          // Session on website is >5 mins old; flag so user can 1-click refresh it
          setNeedsAppBridgeActivation(true);
        }
      }
    } else {
      setNeedsAppBridgeActivation(false);
    }

    if (configured && db) {
      const bridgePayload = {
        email,
        uid: firebaseUser.uid,
        displayName: googleName,
        photoURL: googlePhoto,
        linkedPasswordBridge: linkedOk,
        ...(oauthIdToken ? { oauthIdToken } : {}),
        ...(oauthAccessToken ? { oauthAccessToken } : {}),
        updatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      // 1. Write to passportShares/{uid} (allowed for any owner in firestore.rules, readable by anyone with expiresAt > 0)
      try {
        await setDoc(doc(db, 'passportShares', firebaseUser.uid), bridgePayload, { merge: true });
      } catch {}

      // 2. Write to settings/{docId} (allowed for Admin/Owner, readable by `allow read: if true`)
      try {
        await setDoc(doc(db, 'settings', getEmailBridgeDocId(email)), bridgePayload, { merge: true });

        const listRef = doc(db, 'settings', 'google_app_accounts_list');
        const listSnap = await getDoc(listRef).catch(() => null);
        const existingAccounts: SavedGoogleAccount[] = Array.isArray(listSnap?.data()?.accounts)
          ? listSnap!.data()!.accounts
          : [];
        const filtered = existingAccounts.filter(
          (a) => a && typeof a.email === 'string' && a.email.toLowerCase() !== email
        );
        const nextAccounts = [
          {
            email,
            displayName: googleName,
            uid: firebaseUser.uid,
            photoURL: googlePhoto,
            lastUsedAt: Date.now(),
          },
          ...filtered,
        ].slice(0, 10);

        await setDoc(listRef, { accounts: nextAccounts, updatedAt: Date.now() }, { merge: true });
      } catch {}
    }

    return linkedOk || Boolean(oauthIdToken || oauthAccessToken);
  };

  /**
   * 1-Tap activation from the Website/Chrome that refreshes the Google OAuth token
   * and links the account so the Android App immediately logs into the exact same `uid`.
   */
  const activateAppBridgeNow = async (hintEmail?: string): Promise<boolean> => {
    if (!configured || !auth) return false;
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      const targetEmail = hintEmail || auth.currentUser?.email || '';
      if (targetEmail) {
        provider.setCustomParameters({ login_hint: targetEmail.trim().toLowerCase() });
      } else {
        provider.setCustomParameters({ prompt: 'select_account' });
      }

      let cred;
      if (auth.currentUser && (!hintEmail || auth.currentUser.email?.toLowerCase() === hintEmail.toLowerCase())) {
        try {
          cred = await reauthenticateWithPopup(auth.currentUser, provider, browserPopupRedirectResolver);
        } catch {
          cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        }
      } else {
        cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      }

      const oauthCred = GoogleAuthProvider.credentialFromResult(cred);
      if (cred.user) {
        await syncGoogleBridgeToFirestore(cred.user, oauthCred?.idToken, oauthCred?.accessToken);
        setNeedsAppBridgeActivation(false);
        return true;
      }
    } catch (err) {
      console.warn('Could not activate app bridge:', err);
    }
    return false;
  };

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
    void fetchCloudSyncedGoogleAccounts();

    if (!configured || !auth) {
      setLoading(false);
      if (!isGuestModeActive()) {
        setModalOpen(true);
      }
      return;
    }

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;
      if (currentUser) {
        const providerPhoto =
          currentUser.photoURL ||
          currentUser.providerData?.find((p) => p?.photoURL)?.photoURL;
        const providerName =
          currentUser.displayName ||
          currentUser.providerData?.find((p) => p?.displayName)?.displayName ||
          formatDisplayNameFromEmail(currentUser.email || '');
        const enrichedPhoto = resolveGoogleAvatarUrl(currentUser.email || '', providerPhoto);

        if (!currentUser.photoURL && enrichedPhoto) {
          try {
            Object.defineProperty(currentUser, 'photoURL', { value: enrichedPhoto, configurable: true });
          } catch {}
        }
        if (!currentUser.displayName && providerName) {
          try {
            Object.defineProperty(currentUser, 'displayName', { value: providerName, configurable: true });
          } catch {}
        }

        setUser(currentUser);
        setGuestModeActive(false);
        setIsGuest(false);
        setModalOpen(false);
        setLoading(false);

        await syncUserRoleInBackground(currentUser.uid, currentUser);

        if (currentUser.email) {
          saveDeviceGoogleAccount({
            email: currentUser.email.toLowerCase(),
            displayName: providerName,
            uid: currentUser.uid,
            photoURL: enrichedPhoto,
            lastUsedAt: Date.now(),
          });
          // Sync after role is loaded so Admin/Owner permissions in Firestore `settings` are active
          void syncGoogleBridgeToFirestore(currentUser);
        }
      } else {
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
   * Attempts to fetch a fresh native OAuth2 accessToken directly from Android's AccountManager
   * if the upgraded APK provides `getGoogleTokenForEmail(email)`.
   */
  const tryGetNativeTokenForEmail = (email: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bridge = (window as any).AndroidAlarmBridge;
      if (!bridge || typeof bridge.getGoogleTokenForEmail !== 'function') {
        resolve(null);
        return;
      }
      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, 6000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__onAndroidGoogleAccountPicked = (resStr: string) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (resStr && resStr.includes('|')) {
          resolve(resStr.split('|')[1] || null);
        } else {
          resolve(null);
        }
      };
      try {
        const ok = bridge.getGoogleTokenForEmail(email);
        if (!ok) {
          settled = true;
          window.clearTimeout(timer);
          resolve(null);
        }
      } catch {
        settled = true;
        window.clearTimeout(timer);
        resolve(null);
      }
    });
  };

  /**
   * Signs the user into the EXACT SAME real Firebase Auth Account (`auth.currentUser` with identical `uid`,
   * `role`, `photoURL`, and Firestore data as the Website)!
   */
  const loginWithNativeGoogleAccount = async (profile: NativePickedGoogleProfile) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }

    let rawEmail = (profile.email || '').trim();
    let nativeAccessToken = profile.accessToken;

    // Support "email|accessToken" format returned by upgraded MainActivity.java
    if (rawEmail.includes('|')) {
      const parts = rawEmail.split('|');
      rawEmail = parts[0].trim();
      if (parts[1] && !nativeAccessToken) {
        nativeAccessToken = parts[1].trim();
      }
    }

    const cleanEmail = rawEmail.toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('auth/invalid-email');
      throw new Error('auth/invalid-email');
    }

    await setPersistence(auth, browserLocalPersistence);

    // Step 1: If we didn't get a native accessToken yet, check if upgraded APK can fetch one for this email
    if (!profile.idToken && !nativeAccessToken) {
      const tokenFromBridge = await tryGetNativeTokenForEmail(cleanEmail);
      if (tokenFromBridge) {
        nativeAccessToken = tokenFromBridge;
      }
    }

    // Step 2: If we have a Google idToken or accessToken (from Android AccountManager or Chrome Bridge), sign in directly!
    if (profile.idToken || nativeAccessToken) {
      try {
        const credential = GoogleAuthProvider.credential(
          profile.idToken || null,
          nativeAccessToken || undefined
        );
        const cred = await signInWithCredential(auth, credential);
        await syncGoogleBridgeToFirestore(cred.user, profile.idToken, nativeAccessToken);
        setGuestModeActive(false);
        setIsGuest(false);
        closeAuthModal();
        return;
      } catch (credErr) {
        console.warn('Direct OAuth credential sign-in fallback:', credErr);
      }
    }

    // Step 3: Check Firestore `settings/gbridge_{email}` (readable by `allow read: if true`) for a fresh synced OAuth token from the Website!
    if (db) {
      try {
        const bridgeSnap = await getDoc(doc(db, 'settings', getEmailBridgeDocId(cleanEmail)));
        if (bridgeSnap.exists()) {
          const bData = bridgeSnap.data();
          if (bData?.oauthIdToken || bData?.oauthAccessToken) {
            try {
              const cloudCred = GoogleAuthProvider.credential(
                bData.oauthIdToken || null,
                bData.oauthAccessToken || undefined
              );
              const cred = await signInWithCredential(auth, cloudCred);
              await syncGoogleBridgeToFirestore(cred.user, bData.oauthIdToken, bData.oauthAccessToken);
              setGuestModeActive(false);
              setIsGuest(false);
              closeAuthModal();
              return;
            } catch {
              /* Token may have expired after 1 hour; proceed to Step 4 password bridge */
            }
          }
        }
      } catch {
        /* ignore offline */
      }
    }

    // Step 4: Sign in silently to the REAL Firebase Auth account using the linked App Bridge Secret!
    const bridgeSecret = computeFirebaseAppBridgeSecret(cleanEmail);
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, bridgeSecret);
      const googlePhoto =
        cred.user.photoURL ||
        cred.user.providerData?.find((p) => p?.photoURL)?.photoURL ||
        profile.photoURL ||
        resolveGoogleAvatarUrl(cleanEmail);
      const googleName =
        cred.user.displayName ||
        cred.user.providerData?.find((p) => p?.displayName)?.displayName ||
        profile.displayName ||
        formatDisplayNameFromEmail(cleanEmail);

      if (!cred.user.displayName || !cred.user.photoURL) {
        await updateProfile(cred.user, {
          displayName: googleName,
          photoURL: googlePhoto,
        }).catch(() => {});
      }

      saveDeviceGoogleAccount({
        email: cleanEmail,
        displayName: googleName,
        uid: cred.user.uid,
        photoURL: googlePhoto,
        lastUsedAt: Date.now(),
      });

      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
      return;
    } catch (signInErr: any) {
      const errCode = signInErr?.code || '';

      // Step 5: Try creating if this Google email has never been registered on the Website yet
      if (
        errCode === 'auth/user-not-found' ||
        errCode === 'auth/invalid-credential' ||
        errCode === 'auth/wrong-password'
      ) {
        try {
          const created = await createUserWithEmailAndPassword(auth, cleanEmail, bridgeSecret);
          const googlePhoto = profile.photoURL || resolveGoogleAvatarUrl(cleanEmail);
          const googleName = profile.displayName || formatDisplayNameFromEmail(cleanEmail);
          await updateProfile(created.user, {
            displayName: googleName,
            photoURL: googlePhoto,
          }).catch(() => {});

          saveDeviceGoogleAccount({
            email: cleanEmail,
            displayName: googleName,
            uid: created.user.uid,
            photoURL: googlePhoto,
            lastUsedAt: Date.now(),
          });

          setGuestModeActive(false);
          setIsGuest(false);
          closeAuthModal();
          return;
        } catch {
          // Account ALREADY exists in Firebase from the Website!
          if (!hasNativeGoogleAccountPicker()) {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ login_hint: cleanEmail });
            const popCred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
            const oauthCred = GoogleAuthProvider.credentialFromResult(popCred);
            await syncGoogleBridgeToFirestore(
              popCred.user,
              oauthCred?.idToken,
              oauthCred?.accessToken
            );
            setGuestModeActive(false);
            setIsGuest(false);
            closeAuthModal();
            return;
          }

          const bridgeNeededErr = new Error('auth/needs-one-time-web-bridge') as any;
          bridgeNeededErr.code = 'auth/needs-one-time-web-bridge';
          bridgeNeededErr.email = cleanEmail;
          setError('auth/needs-one-time-web-bridge');
          throw bridgeNeededErr;
        }
      }

      setError(errCode || 'auth/unknown');
      throw signInErr;
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
        saveDeviceGoogleAccount({
          email: cred.user.email.toLowerCase(),
          displayName: cred.user.displayName || formatDisplayNameFromEmail(cred.user.email),
          uid: cred.user.uid,
          photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
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
          email: cred.user.email.toLowerCase(),
          displayName: displayName.trim() || formatDisplayNameFromEmail(cred.user.email),
          uid: cred.user.uid,
          photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
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

  const loginWithGoogle = async (loginHintEmail?: string) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }

    if (loginHintEmail && loginHintEmail.includes('@')) {
      await loginWithNativeGoogleAccount({ email: loginHintEmail });
      return;
    }

    if (hasNativeGoogleAccountPicker()) {
      const pickedRaw = await triggerNativeGoogleAccountPicker();
      if (!pickedRaw) return;
      await loginWithNativeGoogleAccount({ email: pickedRaw });
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const oauthCred = GoogleAuthProvider.credentialFromResult(cred);

      if (cred.user) {
        await syncGoogleBridgeToFirestore(
          cred.user,
          oauthCred?.idToken,
          oauthCred?.accessToken
        );
        if (cred.user.email) {
          saveDeviceGoogleAccount({
            email: cred.user.email.toLowerCase(),
            displayName: cred.user.displayName || formatDisplayNameFromEmail(cred.user.email),
            uid: cred.user.uid,
            photoURL: resolveGoogleAvatarUrl(cred.user.email, cred.user.photoURL),
            lastUsedAt: Date.now(),
          });
        }
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
        loginWithNativeGoogleAccount,
        activateAppBridgeNow,
        needsAppBridgeActivation,
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
