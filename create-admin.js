#!/usr/bin/env node

/**
 * Skrypt do tworzenia użytkownika administratora w bazie danych
 * Użycie: node create-admin.js <email> <imię> <nazwisko> [firebaseUid]
 */

// Załaduj zmienne środowiskowe
require('dotenv').config();

// Ustaw typ silnika na binary (wymagane dla PostgreSQL bez adaptera)
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';

const { PrismaClient } = require('@prisma/client');

async function createAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
Użycie: node create-admin.js <email> <imię> <nazwisko> [firebaseUid]

Przykład:
node create-admin.js admin@palkamtm.pl "Jan" "Kowalski"
node create-admin.js admin@palkamtm.pl "Jan" "Kowalski" "firebase-uid-here"

Jeśli nie podasz firebaseUid, zostanie wygenerowany automatycznie.
    `);
    process.exit(1);
  }

  const [email, firstName, lastName, firebaseUid] = args;
  const generatedFirebaseUid = firebaseUid || `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Inicjalizuj klienta Prisma
  const prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'pretty',
  });

  try {
    console.log('🔧 Tworzenie użytkownika administratora...');

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  Użytkownik już istnieje. Aktualizowanie do roli ADMIN...');

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'ADMIN',
          isActive: true,
          emailVerified: existingUser.emailVerified || new Date(),
          firstName: firstName,
          lastName: lastName,
          firebaseUid: firebaseUid || existingUser.firebaseUid,
        },
      });

      console.log('✅ Użytkownik został zaktualizowany do roli ADMIN:');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Imię: ${updatedUser.firstName}`);
      console.log(`   Nazwisko: ${updatedUser.lastName}`);
      console.log(`   Rola: ${updatedUser.role}`);
      console.log(`   Aktywny: ${updatedUser.isActive}`);
      console.log(`   Firebase UID: ${updatedUser.firebaseUid}`);

    } else {
      // Utwórz nowego użytkownika administratora
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          firebaseUid: generatedFirebaseUid,
          role: 'ADMIN',
          isActive: true,
          emailVerified: new Date(),
          isPhoneVerified: true, // Admin nie musi weryfikować telefonu
          isProfileVerified: true, // Admin ma zweryfikowany profil
        },
      });

      console.log('✅ Użytkownik administrator został utworzony:');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Imię: ${newUser.firstName}`);
      console.log(`   Nazwisko: ${newUser.lastName}`);
      console.log(`   Rola: ${newUser.role}`);
      console.log(`   Aktywny: ${newUser.isActive}`);
      console.log(`   Firebase UID: ${newUser.firebaseUid}`);
    }

    console.log('\n🎉 Operacja zakończona pomyślnie!');

  } catch (error) {
    console.error('❌ Błąd podczas tworzenia administratora:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
createAdmin();
