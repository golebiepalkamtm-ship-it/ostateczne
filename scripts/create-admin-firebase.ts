import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('❌ Brakujące zmienne środowiskowe:');
    console.error('   FIREBASE_PROJECT_ID:', serviceAccount.projectId ? '✅' : '❌');
    console.error('   FIREBASE_CLIENT_EMAIL:', serviceAccount.clientEmail ? '✅' : '❌');
    console.error('   FIREBASE_PRIVATE_KEY:', serviceAccount.privateKey ? '✅' : '❌');
    throw new Error('Missing Firebase Admin credentials in environment variables');
  }

  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const auth = getAuth();

async function createAdminAccount() {
  const email = 'admin@palka-mtm.pl';
  const password = 'Admin123!@#'; // Zmień to hasło na bezpieczne
  const displayName = 'Administrator Systemu';

  try {
    // Sprawdź czy użytkownik już istnieje
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log('✅ Użytkownik już istnieje w Firebase:', user.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Utwórz nowego użytkownika
        user = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true, // Automatyczna weryfikacja dla admina
        });
        console.log('✅ Utworzono konto admina w Firebase:', user.uid);
      } else {
        throw error;
      }
    }

    // Ustaw hasło (jeśli użytkownik już istniał)
    if (user) {
      await auth.updateUser(user.uid, {
        password,
        emailVerified: true,
      });
      console.log('✅ Hasło zaktualizowane');
    }

    console.log('\n📋 DANE LOGOWANIA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${email}`);
    console.log(`Hasło:    ${password}`);
    console.log(`Firebase UID: ${user.uid}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  UWAGA: Zapisz te dane w bezpiecznym miejscu!');
    console.log('   Po pierwszym zalogowaniu konto zostanie zsynchronizowane z bazą danych.');
    console.log('\n🔗 URL logowania: http://localhost:3000/auth/login');
  } catch (error) {
    console.error('❌ Błąd:', error);
    throw error;
  }
}

createAdminAccount()
  .then(() => {
    console.log('\n✅ Gotowe!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Błąd podczas tworzenia konta:', error);
    process.exit(1);
  });

