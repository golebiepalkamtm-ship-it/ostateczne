
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Sprawdzanie statusu użytkowników w bazie danych...\n');

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        isPhoneVerified: true,
        isProfileVerified: true,
        isActive: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
      },
    });

    if (users.length === 0) {
      console.log('❌ Nie znaleziono żadnych użytkowników w bazie.');
      return;
    }

    console.log(`Znaleziono ${users.length} użytkowników:\n`);

    users.forEach((user, index) => {
      console.log(`👤 Użytkownik #${index + 1}: ${user.email} (${user.role})`);
      console.log('--------------------------------------------------');
      
      const blockers = [];
      
      // 1. Email
      // Konwersja na boolean bo w bazie może być null lub false
      const isEmailVerified = !!user.emailVerified;
      
      if (isEmailVerified) {
        console.log('✅ Email:        ZWERYFIKOWANY');
      } else {
        console.log('❌ Email:        NIEZWERYFIKOWANY');
        blockers.push('Email');
      }

      // 2. Telefon
      if (user.isPhoneVerified) {
        console.log(`✅ Telefon:      ZWERYFIKOWANY (${user.phoneNumber || 'brak numeru'})`);
      } else {
        console.log('❌ Telefon:      NIEZWERYFIKOWANY');
        blockers.push('Telefon');
      }

      // 3. Profil
      if (user.isProfileVerified) {
        console.log('✅ Profil:       UZUPEŁNIONY');
      } else {
        console.log('⚠️ Profil:       NIEKOMPLETNY');
        if (!user.firstName || !user.lastName) blockers.push('Profil (Imię/Nazwisko)');
      }

      // 4. Aktywność
      if (user.isActive) {
        console.log('✅ Konto:        AKTYWNE');
      } else {
        console.log('❌ Konto:        ZABLOKOWANE/NIEAKTYWNE');
        blockers.push('Status Konta (Nieaktywne)');
      }

      if (blockers.length > 0) {
        console.log(`\n🚫 BLOKADY: ${blockers.join(', ')}`);
      } else {
        console.log('\n✨ STATUS: Konto w pełni gotowe.');
      }
      console.log('\n');
    });
  } catch (error) {
    console.error('Błąd podczas pobierania danych:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

