import admin from 'firebase-admin';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const serviceAccount = JSON.parse(fs.readFileSync('firebase-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Podaj swój email
const USER_EMAIL = 'borysbory69@gmail.com';

async function main() {
  console.log('--- DIAGNOSTYKA ISTNIEJĄCEGO UŻYTKOWNIKA ---');

  // 1. Pobierz użytkownika z Firebase
  let firebaseUser;
  try {
    firebaseUser = await admin.auth().getUserByEmail(USER_EMAIL);
    console.log('✅ Firebase user:', {
      uid: firebaseUser.uid,
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber,
    });
  } catch (err) {
    console.error('❌ Nie znaleziono użytkownika w Firebase:', err);
    process.exit(1);
  }

  // 2. Pobierz użytkownika z Prisma
  const dbUser = await prisma.user.findFirst({
    where: { firebaseUid: firebaseUser.uid },
  });
  if (!dbUser) {
    console.error('❌ Nie znaleziono użytkownika w Prisma');
  } else {
    console.log('✅ Prisma user:', {
      id: dbUser.id,
      role: dbUser.role,
      isPhoneVerified: dbUser.isPhoneVerified,
      isProfileVerified: dbUser.isProfileVerified,
      isActive: dbUser.isActive,
    });
  }

  // 3. Wygeneruj custom token i przetestuj synchronizację
  try {
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);
    const response = await fetch('http://localhost:3000/api/auth/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const syncResult = await response.json();
    console.log('🔄 Wynik synchronizacji:', syncResult);
  } catch (err) {
    console.error('❌ Błąd synchronizacji:', err);
  }

  await prisma.$disconnect();
}

main();
