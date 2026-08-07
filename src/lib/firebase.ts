import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Persistent local cache means repeat reads (e.g. navigating back to a page
// you've already visited) come from disk instantly instead of a fresh
// network round-trip. Guarded to the browser since IndexedDB doesn't exist
// during Next.js's server-side render pass.
export const db =
  typeof window !== "undefined"
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
      })
    : getFirestore(app);

export default app;
