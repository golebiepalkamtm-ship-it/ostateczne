import 'dotenv/config';
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

// Ładuj zmienne środowiskowe z .env.local (jeśli istnieje)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (_) {
  // .env.local może nie istnieć, to OK
}

// Użyj zmiennych środowiskowych z .env
if (admin.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Brak konfiguracji Firebase Admin SDK!');
    console.error('Sprawdź czy w .env są ustawione:');
    console.error('- FIREBASE_PROJECT_ID');
    console.error('- FIREBASE_CLIENT_EMAIL');
    console.error('- FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const auth = admin.auth();
const prisma = new PrismaClient();

async function deleteAllFirebaseUsers() {
  console.log('🔥 Usuwam użytkowników z Firebase Authentication...');
  try {
    let deletedCount = 0;
    let pageToken: string | undefined;
    do {
      const listUsersResult = await auth.listUsers(1000, pageToken);
      const uids = listUsersResult.users.map(user => user.uid);
      if (uids.length === 0) break;

      const deleteResult = await auth.deleteUsers(uids);
      deletedCount += deleteResult.successCount;
      console.log(`  ✅ Usunięto: ${deleteResult.successCount} użytkowników z Firebase`);
      pageToken = listUsersResult.pageToken;
    } while (pageToken);
    console.log(`📊 Firebase: Usunięto łącznie ${deletedCount} użytkowników\n`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Błąd podczas usuwania użytkowników z Firebase:', error);
    return 0;
  }
}

async function deleteAllPrismaUsers() {
  console.log('🗑️  Usuwam użytkowników z bazy danych Prisma...');
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('  ℹ️  Baza Prisma jest już pusta\n');
      return 0;
    }

    const result = await prisma.user.deleteMany({});
    console.log(`  ✅ Usunięto: ${result.count} użytkowników z Prisma`);
    console.log(`📊 Prisma: Usunięto łącznie ${result.count} użytkowników\n`);
    return result.count;
  } catch (error) {
    console.error('❌ Błąd podczas usuwania użytkowników z Prisma:', error);
    return 0;
  }
}

function checkConfirmation(): boolean {
  // Wymagaj argumentu --yes, --force lub -y
  const hasConfirmation = 
    process.argv.includes('--yes') || 
    process.argv.includes('--force') || 
    process.argv.includes('-y');

  if (!hasConfirmation) {
    console.error('\n❌ BŁĄD: Operacja wymaga potwierdzenia!');
    console.error('\n📝 Użycie:');
    console.error('   npm run clean:users -- --yes');
    console.error('   lub');
    console.error('   tsx scripts/clean-all-users.ts --yes');
    console.error('\n⚠️  To nieodwracalna operacja - upewnij się, że chcesz usunąć wszystkich użytkowników!\n');
    return false;
  }

  return true;
}

async function getCounts() {
  const prismaCount = await prisma.user.count();
  let firebaseCount = 0;
  try {
    const listUsersResult = await auth.listUsers(1000);
    firebaseCount = listUsersResult.users.length;
    // Jeśli jest więcej niż 1000, policz wszystkie
    let pageToken = listUsersResult.pageToken;
    while (pageToken) {
      const nextPage = await auth.listUsers(1000, pageToken);
      firebaseCount += nextPage.users.length;
      pageToken = nextPage.pageToken;
    }
  } catch (error) {
    console.error('⚠️  Nie można policzyć użytkowników Firebase:', error);
  }
  return { firebaseCount, prismaCount };
}

async function cleanAll() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     🧹 CZYSZCZENIE WSZYSTKICH UŻYTKOWNIKÓW                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Pokaż statystyki przed usunięciem
  console.log('📊 Sprawdzam liczbę użytkowników...\n');
  const { firebaseCount, prismaCount } = await getCounts();
  console.log(`  Firebase Authentication: ${firebaseCount} użytkowników`);
  console.log(`  Baza danych (Prisma):    ${prismaCount} użytkowników\n`);

  if (firebaseCount === 0 && prismaCount === 0) {
    console.log('ℹ️  Brak użytkowników do usunięcia.\n');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Wymagaj potwierdzenia przez argument
  if (!checkConfirmation()) {
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('✅ Potwierdzenie otrzymane (--yes)\n');

  console.log('\n');

  const firebaseDeleted = await deleteAllFirebaseUsers();
  const prismaDeleted = await deleteAllPrismaUsers();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    ✅ PODSUMOWANIE                         ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  const firebaseLine = `║  Firebase Authentication: ${String(firebaseDeleted).padEnd(3)} użytkowników usunięto ║`;
  const prismaLine = `║  Baza danych (Prisma):    ${String(prismaDeleted).padEnd(3)} użytkowników usunięto ║`;
  console.log(firebaseLine);
  console.log(prismaLine);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  🎉 Wszystkie użytkownicy zostali usunięci!               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await prisma.$disconnect();
  process.exit(0);
}

cleanAll();
