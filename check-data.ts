import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

// Override for Cloud SQL
process.env.DATABASE_URL = 'postgresql://MTM:Milosz1205@34.6.153.213:5432/palka_core_prod?connect_timeout=5&pool_timeout=30&statement_timeout=60000';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Sprawdzam tabele...');

    const userCount = await prisma.user.count();
    console.log(`Liczba użytkowników: ${userCount}`);

    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@palka-mtm.pl' },
      select: { id: true, email: true, role: true, firebaseUid: true },
    });
    console.log('Admin user:', adminUser);

    const auctionCount = await prisma.auction.count();
    console.log(`Liczba aukcji: ${auctionCount}`);

    const bidCount = await prisma.bid.count();
    console.log(`Liczba ofert: ${bidCount}`);

  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();