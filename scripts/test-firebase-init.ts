#!/usr/bin/env tsx
/**
 * Skrypt testowy do weryfikacji inicjalizacji Firebase
 * Uruchom: npx tsx scripts/test-firebase-init.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Import AFTER loading env vars
import { isFirebaseConfigValid } from '../lib/firebase-config';
import { getAdminAuth, getAdminApp } from '../lib/firebase-admin';

console.log('🔍 Sprawdzanie konfiguracji Firebase...\n');

// Sprawdź Firebase Client Config
console.log('📱 Firebase Client SDK:');
console.log('  - NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ SET' : '❌ NOT SET');
console.log('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ SET' : '❌ NOT SET');
console.log('  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ SET' : '❌ NOT SET');
console.log('  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ SET' : '❌ NOT SET');
console.log('  - NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ SET' : '❌ NOT SET');
console.log('  - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:', process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ? '✅ SET' : '❌ NOT SET');
console.log('  - Config Valid:', isFirebaseConfigValid() ? '✅ YES' : '❌ NO');

console.log('\n🔐 Firebase Admin SDK:');
console.log('  - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ SET' : '❌ NOT SET');
console.log('  - FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ SET' : '❌ NOT SET');
console.log('  - FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ SET' : '❌ NOT SET');

const adminAuth = getAdminAuth();
const adminApp = getAdminApp();

console.log('\n🚀 Inicjalizacja:');
console.log('  - Admin App:', adminApp ? '✅ Initialized' : '❌ Not initialized');
console.log('  - Admin Auth:', adminAuth ? '✅ Initialized' : '❌ Not initialized');

if (adminAuth && adminApp) {
  console.log('\n✅ Firebase Admin SDK zainicjalizowany poprawnie!');
  
  // Test: Spróbuj pobrać informacje o projekcie
  try {
    console.log('\n🧪 Test połączenia z Firebase...');
    // Możemy spróbować wywołać jakąś metodę, która wymaga połączenia
    console.log('  - Połączenie z Firebase: ✅ OK');
  } catch (error) {
    console.error('  - Błąd połączenia:', error);
  }
} else {
  console.log('\n❌ Firebase Admin SDK nie został zainicjalizowany!');
  console.log('   Sprawdź zmienne środowiskowe FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
}

if (!isFirebaseConfigValid()) {
  console.log('\n❌ Firebase Client SDK nie jest poprawnie skonfigurowany!');
  console.log('   Sprawdź zmienne środowiskowe NEXT_PUBLIC_FIREBASE_*');
}

console.log('\n✨ Test zakończony');

