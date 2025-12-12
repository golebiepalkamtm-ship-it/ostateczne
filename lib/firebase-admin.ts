// Firebase Admin SDK - only require at runtime on server to avoid bundling into client
/* eslint-disable */
// We intentionally avoid top-level imports of 'firebase-admin' because Next.js build
// statically analyzes imports and will try to resolve node-only modules (fs, net, http2)
// which breaks the client bundle. Instead we `require()` inside the initializer below
// guarded by server-only checks.

// Wyciszone logi - nie używamy importu z ./logger
const SILENT_MODE = true;
const debug = (..._args: any[]) => { if (!SILENT_MODE) console.debug('[DEBUG]', ..._args); };
const info = (..._args: any[]) => { if (!SILENT_MODE) console.info('[INFO]', ..._args); };
const error = (..._args: any[]) => { if (!SILENT_MODE) console.error('[ERROR]', ..._args); };
const isDev = process.env.NODE_ENV !== 'production';

let adminAuth: any = null;
let app: any = null;
let initializationAttempted = false;

const isTest =
  process.env.NODE_ENV === 'test' ||
  process.env.PLAYWRIGHT_TEST === '1' ||
  process.env.SKIP_FIREBASE_ADMIN === '1';

// Check if we're in build time (Next.js build process)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Inicjalizuje Firebase Admin SDK (lazy initialization)
 */
function initializeFirebaseAdmin() {
  if (initializationAttempted) {
    return; // Already attempted, don't retry
  }
  
  initializationAttempted = true;

  // Sprawdź czy wszystkie wymagane zmienne środowiskowe są ustawione
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;

  if (isDev && !isTest && !isBuildTime) {
    debug('🔧 Firebase Admin SDK initialization check:');
    debug('- FIREBASE_PROJECT_ID:', projectId ? 'SET' : 'NOT SET');
    debug('- FIREBASE_CLIENT_EMAIL:', clientEmail ? 'SET' : 'NOT SET');
    debug('- FIREBASE_PRIVATE_KEY:', privateKey ? 'SET' : 'NOT SET');
    debug('- FIREBASE_STORAGE_BUCKET:', storageBucket ? 'SET' : 'NOT SET');
  }

  if (isTest || isBuildTime) {
    // Skip initialization and logging in test/Playwright/build to keep terminal clean
    return;
  }

  if (!projectId || !clientEmail || !privateKey) {
    error('❌ Firebase Admin SDK credentials not configured!');
    error(
      'Required environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
    error('Aplikacja nie będzie działać bez konfiguracji Firebase!');
    return;
  }

  try {
    // Normalize private key: handle various escape sequences and quotes
    const normalizedPrivateKey = privateKey
      .trim()
      // Remove surrounding quotes if present
      .replace(/^["']|["']$/g, '')
      // Handle double-escaped newlines (\\\\n -> \n)
      .replace(/\\\\n/g, '\n')
      // Handle standard escaped newlines (\\n -> \n)
      .replace(/\\n/g, '\n')
      // Handle literal newlines (already present)
      .trim();
    
    // Check if private key looks valid (should start with -----BEGIN)
    if (!normalizedPrivateKey.includes('-----BEGIN')) {
      error('❌ Firebase Admin SDK: Invalid private key format');
      error('Private key should start with "-----BEGIN PRIVATE KEY-----"');
      error('Current key starts with:', normalizedPrivateKey.substring(0, 50));
      throw new Error('Invalid Firebase private key format');
    }
    
    // Ensure proper PEM format with newlines
    if (!normalizedPrivateKey.includes('\n')) {
      error('❌ Firebase Admin SDK: Private key missing newlines');
      error('Key should contain \\n sequences that will be converted to actual newlines');
      throw new Error('Invalid PEM format: missing newlines');
    }

    const firebaseAdminConfig = {
      // credential will be created below using runtime require
      storageBucket: storageBucket,
    };

    info('🔧 Initializing Firebase Admin SDK (server-only require) ...');

    // Require server-side firebase-admin modules at runtime. Use require instead of
    // static import to prevent bundlers from including node-only modules in client bundles.
    if (typeof window !== 'undefined') {
      error('Attempt to initialize Firebase Admin SDK in browser environment - aborting');
      return;
    }

    let adminAppModules: any;
    let adminAuthModule: any;
    try {
       
      adminAppModules = require('firebase-admin/app');
       
      adminAuthModule = require('firebase-admin/auth');
    } catch (err) {
      error('❌ Could not require firebase-admin modules at runtime:', err instanceof Error ? err.message : String(err));
      return;
    }

    const { cert: runtimeCert, getApps: runtimeGetApps, initializeApp: runtimeInitializeApp } = adminAppModules;
    const { getAuth: runtimeGetAuth } = adminAuthModule;

    // Build final config with runtime certificate
    const finalConfig = Object.assign({}, firebaseAdminConfig, {
      credential: runtimeCert({ projectId, clientEmail, privateKey: normalizedPrivateKey }),
    });

    app = runtimeGetApps().length === 0 ? runtimeInitializeApp(finalConfig) : runtimeGetApps()[0];
    adminAuth = runtimeGetAuth(app);

    info('✅ Firebase Admin SDK initialized successfully');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error('❌ Firebase Admin SDK initialization error:', errorMessage);
    
    // Log more details for PEM parsing errors
    if (errorMessage.includes('PEM') || errorMessage.includes('Invalid PEM') || errorMessage.includes('parse')) {
      error('🔍 PEM Format Debug:');
      error('  - Private key length:', privateKey?.length || 0);
      error('  - Private key starts with:', privateKey?.substring(0, 50) || 'N/A');
      error('  - Contains \\n:', privateKey?.includes('\\n') ? 'YES' : 'NO');
      error('  - Contains actual newlines:', privateKey?.includes('\n') ? 'YES' : 'NO');
      error('  - First 100 chars:', privateKey?.substring(0, 100) || 'N/A');
    }
    
    // Provide specific guidance based on error
    if (errorMessage.includes('invalid_grant') || errorMessage.includes('account not found')) {
      error('');
      error('🔧 Firebase Credentials Error - Possible solutions:');
      error('1. Check if the service account key ID exists at:');
      error('   https://console.firebase.google.com/iam-admin/serviceaccounts/project');
      error('2. If the key was revoked, generate a new key at:');
      error('   https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk');
      error('3. Verify server time is synchronized (NTP)');
      error('4. Ensure FIREBASE_CLIENT_EMAIL matches the service account email');
      error('5. Ensure FIREBASE_PRIVATE_KEY is correctly formatted (with \\n for newlines)');
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
      error('');
      error('🔧 Network Error - Check internet connectivity and Firebase service availability');
    } else if (errorMessage.includes('PEM') || errorMessage.includes('parse')) {
      error('');
      error('🔧 PEM Format Error - Possible solutions:');
      error('1. Ensure FIREBASE_PRIVATE_KEY is wrapped in double quotes in .env.local');
      error('2. Ensure \\n sequences are present (not actual newlines)');
      error('3. Copy the ENTIRE private_key value from Firebase JSON file');
      error('4. Format: FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    }
    
    // Don't throw - allow app to continue but mark as uninitialized
    adminAuth = null;
    app = null;
  }
}

// Lazy initialization - inicjalizacja nastąpi przy pierwszym wywołaniu getAdminAuth() lub getAdminApp()
// Next.js ładuje zmienne przed importem modułów, więc to zadziała
// W skryptach testowych upewnij się, że dotenv jest załadowany przed importem

// Funkcje pomocnicze do bezpiecznego dostępu
export function getAdminAuth() {
  // Lazy initialization if not already attempted
  if (!initializationAttempted) {
    initializeFirebaseAdmin();
  }
  // Return null instead of throwing error - caller should check
  return adminAuth;
}

export function getAdminApp() {
  // Lazy initialization if not already attempted
  if (!initializationAttempted) {
    initializeFirebaseAdmin();
  }
  // Return null instead of throwing error - caller should check
  return app;
}

export { adminAuth, app };
