import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Standard Firebase Web Client configuration (Public Web SDK credentials, NO server secrets)
const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || '';
const projectId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || '';

export const configured: boolean = Boolean(apiKey.trim() && projectId.trim());

const firebaseConfig = {
  apiKey,
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || '',
  projectId,
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || '',
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || '',
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || '',
};

// Initialize Firebase only when valid configuration is present.
export const app: FirebaseApp | null = configured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

/**
 * Initializes Firestore with IndexedDB Persistent Local Cache + Multi-Tab synchronization
 * so all cloud documents (medicines, schedules, partners, game progress) load in 0ms from device cache.
 */
function createPersistentFirestore(firebaseApp: FirebaseApp): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Fallback if already initialized in hot-reload or restricted private browsing
    return getFirestore(firebaseApp);
  }
}

export const db: Firestore = (app ? createPersistentFirestore(app) : null) as unknown as Firestore;
export const auth: Auth = (app ? getAuth(app) : null) as unknown as Auth;
export const storage: FirebaseStorage | null = app && firebaseConfig.storageBucket.trim() ? getStorage(app) : null;