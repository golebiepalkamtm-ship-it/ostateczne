
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PrismaClient } from '@prisma/client';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Załaduj klucz z pliku
const serviceAccountPath = join(__dirname, '../firebase-key.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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

async function cleanAll() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     🧹 CZYSZCZENIE WSZYSTKICH UŻYTKOWNIKÓW                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const firebaseCount = await deleteAllFirebaseUsers();
  const prismaCount = await deleteAllPrismaUsers();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    ✅ PODSUMOWANIE                         ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Firebase Authentication: ${firebaseCount} użytkowników           ║`);
  console.log(`║  Baza danych (Prisma):    ${prismaCount} użytkowników           ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  🎉 Wszystkie użytkownicy zostali usunięci!               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await prisma.$disconnect();
  process.exit(0);
}

cleanAll();
