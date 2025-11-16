import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllPrismaUsers() {
  console.log('🗑️  Rozpoczynam usuwanie wszystkich użytkowników z bazy Prisma...\n');

  try {
    // Najpierw sprawdź ilu jest użytkowników
    const count = await prisma.user.count();
    console.log(`📊 Znaleziono ${count} użytkowników w bazie danych\n`);

    if (count === 0) {
      console.log('✅ Baza danych jest już pusta');
      return;
    }

    // Usuń wszystkich użytkowników
    const result = await prisma.user.deleteMany({});

    console.log(`\n✅ ZAKOŃCZONO! Usunięto ${result.count} użytkowników z bazy Prisma.`);
    console.log('\n🎉 Baza danych została wyczyszczona.');
  } catch (error) {
    console.error('❌ Błąd podczas usuwania użytkowników:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllPrismaUsers();
