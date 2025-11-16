import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    // Sprawdź czy istnieje konto admina
    const admin = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
      },
    });

    if (admin) {
      console.log('✅ Konto admina już istnieje:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   IsActive: ${admin.isActive}`);
      console.log(`   ID: ${admin.id}`);
      return;
    }

    // Utwórz konto admina
    console.log('⚠️  Konto admina nie istnieje. Tworzenie...');
    
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@palka-mtm.pl',
        firstName: 'Admin',
        lastName: 'System',
        role: Role.ADMIN,
        isActive: true,
        emailVerified: new Date(),
        isProfileVerified: true,
      },
    });

    console.log('✅ Konto admina utworzone:');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   ID: ${newAdmin.id}`);
    console.log('\n⚠️  UWAGA: To konto wymaga Firebase UID do pełnej funkcjonalności.');
    console.log('   Po zalogowaniu przez Firebase, konto zostanie zsynchronizowane.');
  } catch (error) {
    console.error('❌ Błąd:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdmin();

