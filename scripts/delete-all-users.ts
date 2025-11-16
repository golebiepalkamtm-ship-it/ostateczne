/**
 * SKRYPT USUWANIA WSZYSTKICH UŻYTKOWNIKÓW FIREBASE
 * ⚠️ UWAGA: Operacja nieodwracalna!
 *
 * Użycie: npx tsx scripts/delete-all-users.ts
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

async function deleteAllUsers() {
  console.log('🔥 Rozpoczynam usuwanie wszystkich użytkowników Firebase...\n');

  try {
    let deletedCount = 0;
    let pageToken: string | undefined;

    do {
      // Pobierz maksymalnie 1000 użytkowników na raz
      const listUsersResult = await auth.listUsers(1000, pageToken);

      const uids = listUsersResult.users.map(user => user.uid);

      if (uids.length === 0) {
        break;
      }

      console.log(`📋 Znaleziono ${uids.length} użytkowników do usunięcia...`);

      // Usuń użytkowników wsadowo (maksymalnie 1000 na raz)
      const deleteResult = await auth.deleteUsers(uids);

      deletedCount += deleteResult.successCount;

      console.log(`✅ Usunięto: ${deleteResult.successCount}`);

      if (deleteResult.failureCount > 0) {
        console.log(`❌ Błędy: ${deleteResult.failureCount}`);
        deleteResult.errors.forEach(err => {
          console.error(`   - UID ${err.index}: ${err.error.message}`);
        });
      }

      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    console.log(`\n✅ ZAKOŃCZONO! Usunięto łącznie ${deletedCount} użytkowników.`);
  } catch (error) {
    console.error('❌ Błąd podczas usuwania użytkowników:', error);
    process.exit(1);
  }
}

// Wykonaj
deleteAllUsers()
  .then(() => {
    console.log('\n🎉 Operacja zakończona pomyślnie.');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('\n❌ Krytyczny błąd:', error);
    process.exit(1);
  });
