import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

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
// When unconfigured, app, auth, and db are null without connecting to any dummy/fake project.
export const app: FirebaseApp | null = configured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const db: Firestore = (app ? getFirestore(app) : null) as unknown as Firestore;
export const auth: Auth = (app ? getAuth(app) : null) as unknown as Auth;