import { PrismaClient, Role } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function setAdmin(email: string) {
  if (!email) {
    console.error('❌ Proszę podać adres email użytkownika.');
    console.log('Użycie: npx tsx scripts/set-admin.ts <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Użytkownik o adresie email '${email}' nie został znaleziony.`);
      return;
    }

    if (user.role === Role.ADMIN) {
      console.log(`✅ Użytkownik ${email} już posiada uprawnienia ADMIN.`);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        role: Role.ADMIN,
        // Upewnij się, że konto jest aktywne i zweryfikowane
        isActive: true,
        isProfileVerified: true, 
      },
    });

    console.log('✅ Uprawnienia zaktualizowane pomyślnie:');
    console.log(`   Użytkownik: ${updatedUser.email}`);
    console.log(`   Nowa Rola: ${updatedUser.role}`);
    console.log(`   ID: ${updatedUser.id}`);

  } catch (error) {
    console.error('❌ Błąd podczas aktualizacji uprawnień:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Pobierz email z argumentów wiersza poleceń
const emailArg = process.argv[2];
setAdmin(emailArg);

