import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = import.meta.env;

// These values are read from .env.local (never hard-code them in the source).
// A Firebase web config is an identifier, not a password: real protection comes
// from the Firestore security rules in firestore.rules.
const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const configured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

const app = initializeApp({
  ...cfg,
  apiKey: cfg.apiKey || 'missing',
  projectId: cfg.projectId || 'missing',
});

export const auth = getAuth(app);
export const db = getFirestore(app);
