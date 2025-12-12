import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        email: true,
        role: true,
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    console.log('📋 Lista Administratorów w Bazie Danych:');
    if (admins.length === 0) {
      console.log('❌ Brak administratorów w systemie.');
    } else {
      admins.forEach(admin => {
        console.log(`- ${admin.email} (ID: ${admin.id}) [Aktywny: ${admin.isActive}]`);
      });
    }

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmins();

