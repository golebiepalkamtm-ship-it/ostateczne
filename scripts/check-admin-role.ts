import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function checkAdminRole() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@palka-mtm.pl' },
      select: {
        email: true,
        role: true,
        firebaseUid: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!admin) {
      console.log('❌ Konto admina nie istnieje w bazie danych');
      return;
    }

    console.log('📋 Status konta admina:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:        ${admin.email}`);
    console.log(`Role:         ${admin.role}`);
    console.log(`Firebase UID: ${admin.firebaseUid || 'BRAK'}`);
    console.log(`IsActive:     ${admin.isActive}`);
    console.log(`EmailVerified: ${admin.emailVerified ? 'TAK' : 'NIE'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (admin.role !== 'ADMIN') {
      console.log('\n⚠️  UWAGA: Rola nie jest ADMIN! Aktualizuję...');
      await prisma.user.update({
        where: { email: 'admin@palka-mtm.pl' },
        data: { role: 'ADMIN' },
      });
      console.log('✅ Rola zaktualizowana na ADMIN');
    } else {
      console.log('\n✅ Rola jest poprawnie ustawiona na ADMIN');
    }
  } catch (error) {
    console.error('❌ Błąd:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminRole()
  .then(() => {
    console.log('\n✅ Gotowe!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Błąd:', error);
    process.exit(1);
  });

