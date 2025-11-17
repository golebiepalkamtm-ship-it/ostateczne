import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig, isFirebaseConfigValid } from './firebase-config';

// Initialize Firebase only if config is valid
// During build on Vercel, env vars might not be available
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigValid()) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    // Silently fail during build if Firebase can't be initialized
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
      console.error('Firebase initialization error:', error);
    }
  }
}

// Export with fallback to prevent runtime errors
export { app, auth, db, storage };
