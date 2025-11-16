import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function syncAdminFirebase() {
  const email = 'admin@palka-mtm.pl';
  const firebaseUid = 'pdooh1sz3kOa4AOtcwYOvhSPHTi1';

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('❌ Konto admina nie istnieje w bazie danych!');
      console.log('   Uruchom najpierw: npx tsx scripts/check-admin.ts');
      return;
    }

    if (user.firebaseUid === firebaseUid) {
      console.log('✅ Konto admina jest już zsynchronizowane z Firebase');
      console.log(`   Firebase UID: ${user.firebaseUid}`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: {
        firebaseUid,
        emailVerified: new Date(),
        isActive: true,
      },
    });

    console.log('✅ Konto admina zsynchronizowane z Firebase');
    console.log(`   Email: ${email}`);
    console.log(`   Firebase UID: ${firebaseUid}`);
    console.log(`   Role: ${user.role}`);
  } catch (error) {
    console.error('❌ Błąd:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncAdminFirebase()
  .then(() => {
    console.log('\n✅ Gotowe! Możesz się teraz zalogować.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Błąd:', error);
    process.exit(1);
  });

