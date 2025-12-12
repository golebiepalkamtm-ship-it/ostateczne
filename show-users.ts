import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

// Override for Cloud SQL
process.env.DATABASE_URL = 'postgresql://MTM:Milosz1205@34.6.153.213:5432/palka_core_prod?connect_timeout=5&pool_timeout=30&statement_timeout=60000';

const prisma = new PrismaClient();

async function showAllUsers() {
  try {
    console.log('=== WSZYSCY UŻYTKOWNICY W BAZIE DANYCH ===');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} - ${user.isActive ? 'AKTYWNY' : 'NIEAKTYWNY'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Firebase UID: ${user.firebaseUid}`);
      console.log(`   Utworzony: ${user.createdAt}`);
      console.log('---');
    });

    console.log(`Razem użytkowników: ${users.length}`);

  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showAllUsers();