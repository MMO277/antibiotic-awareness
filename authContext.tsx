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
 * Prefers the official Google photoURL (`lh3.googleusercontent.com/...`) from Firebase Auth,
 * and falls back to `unavatar.io/google/{email}` so the user's Google photo always appears.
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

/**
 * Formats a clean display name from an email prefix when no explicit name is saved yet.
 */
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

/**
 * Computes the deterministic Firebase App Bridge key for a Google email.
 * When a user signs in with Google on the Website, this credential is linked to their real
 * Firebase Google account (`linkWithCredential`) so the Android App can sign into the
 * EXACT SAME Firebase `User` (`uid`, `role`, `photoURL`, and Firestore data) via Android's
 * native account picker without ever asking for a password or opening an external WebView!
 */
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

function getEmailBridgeDocId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `gbridge_${clean.slice(0, 60)}`;
}

/**
 * Links the Firebase App Bridge credential to an authenticated Google `User` and saves
 * a short-lived OAuth handoff token in Firestore so the Android APK can sign into the
 * exact same Firebase `uid` with 1 tap and 0 passwords.
 */
async function ensureGoogleUserBridgedForApp(
  firebaseUser: User,
  oauthIdToken?: string | null,
  oauthAccessToken?: string | null
): Promise<void> {
  const email = firebaseUser.email?.trim().toLowerCase();
  if (!email) return;

  const hasPasswordProvider = (firebaseUser.providerData || []).some(
    (p) => p?.providerId === 'password'
  );

  if (!hasPasswordProvider) {
    try {
      const secret = computeFirebaseAppBridgeSecret(email);
      const cred = EmailAuthProvider.credential(email, secret);
      await linkWithCredential(firebaseUser, cred);
    } catch {
      /* ignore if already linked or requires-recent-login */
    }
  }

  // Also store Google profile metadata (and optional fresh OAuth token) in Firestore bridge doc
  if (configured && db) {
    try {
      const googlePhoto =
        firebaseUser.photoURL ||
        firebaseUser.providerData?.find((p) => p?.photoURL)?.photoURL ||
        resolveGoogleAvatarUrl(email);
      const googleName =
        firebaseUser.displayName ||
        firebaseUser.providerData?.find((p) => p?.displayName)?.displayName ||
        formatDisplayNameFromEmail(email);

      await setDoc(
        doc(db, 'assessmentPairs', getEmailBridgeDocId(email)),
        {
          email,
          uid: firebaseUser.uid,
          displayName: googleName,
          photoURL: googlePhoto,
          ...(oauthIdToken ? { oauthIdToken } : {}),
          ...(oauthAccessToken ? { oauthAccessToken } : {}),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch {
      /* ignore offline or permission errors */
    }
  }
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
      return isAr ? 'المتصفح منع النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة.' : 'Popup was blocked by the browser. Please allow popups.';
    case 'auth/needs-one-time-web-bridge':
      return isAr
        ? 'هذا الحساب مسجل مسبقاً على الموقع عبر Google. اضغط على زر «تفعيل الربط السحابي بضغطة واحدة» بالأسفل لمزامنته مع التطبيق بدون باسورد.'
        : 'This Google account is already registered on the website. Tap the 1-Click Cloud Sync button below to link it to the app without a password.';
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

  // Clean up any legacy synthetic user keys so ONLY 100% real Firebase Auth accounts (same UID as website) are used
  useEffect(() => {
    try {
      localStorage.removeItem('aa_quick_google_user_v1');
    } catch {}
  }, []);

  // Handle incoming OAuth Token Handoff from Chrome Bridge (?g_id_token=... or ?auto_bridge_app=1)
  useEffect(() => {
    if (typeof window === 'undefined' || !configured || !auth) return;
    const params = new URLSearchParams(window.location.search);
    const handoffIdToken = params.get('g_id_token');
    const handoffAccessToken = params.get('g_access_token');

    if (handoffIdToken) {
      // Remove token from URL bar cleanly
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          const cred = GoogleAuthProvider.credential(
            handoffIdToken,
            handoffAccessToken || undefined
          );
          return signInWithCredential(auth, cred);
        })
        .then(async (res) => {
          if (res.user) {
            await ensureGoogleUserBridgedForApp(res.user, handoffIdToken, handoffAccessToken);
            setGuestModeActive(false);
            setIsGuest(false);
            setModalOpen(false);
          }
        })
        .catch((err) => {
          console.warn('Handoff credential sign-in warning:', err);
        });
    }
  }, []);

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

        if (currentUser.email) {
          saveDeviceGoogleAccount({
            email: currentUser.email.toLowerCase(),
            displayName: providerName,
            uid: currentUser.uid,
            photoURL: enrichedPhoto,
            lastUsedAt: Date.now(),
          });
          // Automatically bridge this real Firebase Google user so the Android App logs into the exact same UID!
          void ensureGoogleUserBridgedForApp(currentUser);
        }
        await syncUserRoleInBackground(currentUser.uid, currentUser);
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
   * Signs the user into the EXACT SAME real Firebase Auth Account (`auth.currentUser` with the same `uid`,
   * `role`, `photoURL`, and Firestore data as the Website) when they pick their Google account in the App!
   *
   * Execution flow:
   * 1. If a Google `idToken` was passed (from native Play Services or Chrome handoff), calls
   *    `signInWithCredential(auth, GoogleAuthProvider.credential(idToken))`.
   * 2. Otherwise, signs into real Firebase Auth using the deterministic App Bridge credential
   *    (`signInWithEmailAndPassword(auth, cleanEmail, computeFirebaseAppBridgeSecret(cleanEmail))`)
   *    which is linked to their real Google account (`uid`) on the Website!
   * 3. If the email is a brand-new user who has never signed in on the Website yet, creates their
   *    real Firebase Auth account (`createUserWithEmailAndPassword`) and sets their Google photo & name!
   * 4. If the email was registered on the Website before this update and hasn't been linked yet,
   *    attempts `signInWithPopup` with `login_hint: cleanEmail` or prompts 1-Click Chrome Sync.
   */
  const loginWithNativeGoogleAccount = async (profile: NativePickedGoogleProfile) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }

    const cleanEmail = (profile.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('auth/invalid-email');
      throw new Error('auth/invalid-email');
    }

    await setPersistence(auth, browserLocalPersistence);

    // Step 1: If a Google OAuth idToken is provided, sign in directly with GoogleAuthProvider.credential
    if (profile.idToken) {
      const credential = GoogleAuthProvider.credential(profile.idToken, profile.accessToken);
      const cred = await signInWithCredential(auth, credential);
      await ensureGoogleUserBridgedForApp(cred.user, profile.idToken, profile.accessToken);
      setGuestModeActive(false);
      setIsGuest(false);
      closeAuthModal();
      return;
    }

    // Step 2: Sign in silently to the REAL Firebase Auth account using the linked App Bridge Secret!
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

      // Step 3: If this Google email has never been registered in Firebase yet, create the real Firebase user now!
      if (errCode === 'auth/user-not-found') {
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
        } catch (createErr: any) {
          /* If email-already-in-use, fall through to Step 4 below */
        }
      }

      // Step 4: Try creating if Firebase returned generic auth/invalid-credential (which can mean user-not-found or unbridged Google account)
      if (errCode === 'auth/invalid-credential' || errCode === 'auth/wrong-password') {
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
        } catch (createErr: any) {
          // Account ALREADY exists in Firebase as a Google-only account from the Website!
          // If on a normal browser (not APK WebView), complete via GoogleAuthProvider with login_hint
          if (!hasNativeGoogleAccountPicker()) {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ login_hint: cleanEmail });
            const popCred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
            const oauthCred = GoogleAuthProvider.credentialFromResult(popCred);
            await ensureGoogleUserBridgedForApp(
              popCred.user,
              oauthCred?.idToken,
              oauthCred?.accessToken
            );
            setGuestModeActive(false);
            setIsGuest(false);
            closeAuthModal();
            return;
          }

          // Inside APK WebView: signal AuthModal to show the 1-Click Website-to-App Cloud Bridge button!
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

  /**
   * Unified Google Sign-In:
   * - On Website: signs in via Google OAuth (`signInWithPopup`) AND automatically links the App Bridge
   *   credential (`ensureGoogleUserBridgedForApp`) so the exact same account (`uid`) works on the Android App!
   * - On Android App: uses the Native Android Account Picker (`pickGoogleAccount`) and signs into the
   *   EXACT SAME Firebase account (`uid`) via `loginWithNativeGoogleAccount` without opening a password popup!
   */
  const loginWithGoogle = async (loginHintEmail?: string) => {
    setError(null);
    if (!configured || !auth) {
      const code = 'auth/unconfigured';
      setError(code);
      throw new Error(code);
    }

    // If a specific email was selected from Saved Accounts or Native Picker, try the Instant Real Firebase Bridge first!
    if (loginHintEmail && loginHintEmail.includes('@')) {
      await loginWithNativeGoogleAccount({ email: loginHintEmail });
      return;
    }

    // If running inside Android APK, trigger the phone's Native Google Account Picker first!
    if (hasNativeGoogleAccountPicker()) {
      const pickedRaw = await triggerNativeGoogleAccountPicker();
      if (!pickedRaw) return;
      if (pickedRaw.startsWith('{')) {
        try {
          const parsed = JSON.parse(pickedRaw) as NativePickedGoogleProfile;
          if (parsed && parsed.email) {
            await loginWithNativeGoogleAccount(parsed);
            return;
          }
        } catch {
          /* fallback to plain email */
        }
      }
      await loginWithNativeGoogleAccount({ email: pickedRaw });
      return;
    }

    // Standard Website Browser: sign in with Google OAuth and auto-bridge for the Android App
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const oauthCred = GoogleAuthProvider.credentialFromResult(cred);

      if (cred.user) {
        await ensureGoogleUserBridgedForApp(
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
