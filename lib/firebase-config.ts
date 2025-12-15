/**
 * Wspólna konfiguracja Firebase dla client i server
 * TYMCZASOWE NADPISANIE - wymuszamy projekt pigeon-4fba2
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD4PcLWRdE61ogbkm1199rV_p-sODJvtuE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "4fba2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "4fba2", // Wymuszone nadpisanie
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "4fba2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1036150984520",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1036150984520:web:62445751bd607f2b56ad7d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CDS9QF0ZJH",
};

// Debug logging dla development
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Firebase Config Debug:', {
    projectId: firebaseConfig.projectId,
    apiKey: firebaseConfig.apiKey?.substring(0, 20) + '...',
    authDomain: firebaseConfig.authDomain,
    hasEnvVars: {
      API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      MEASUREMENT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
  });
}

/**
 * Sprawdza, czy konfiguracja Firebase jest kompletna
 */
export const isFirebaseConfigValid = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};
