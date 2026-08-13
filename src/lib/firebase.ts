import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0179187692",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:636682579535:web:c3f35ca579c6c898b0c43a",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCsny4h0xNd0osEbJRTL1vpfszQCleFH1s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0179187692.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-cloudsnappro-db3e9328-0ce0-429f-b04b-59ca421a7874",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0179187692.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "636682579535",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || "636682579535-jr3g6gpo1o7u16qt5dg1mh184oockk79.apps.googleusercontent.com",
  recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const databaseId = firebaseConfig.firestoreDatabaseId;
export const db = (databaseId && databaseId !== '(default)')
  ? getFirestore(app, databaseId)
  : getFirestore(app);

export default app;
