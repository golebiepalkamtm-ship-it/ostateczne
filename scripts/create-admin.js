(async () => {
  console.log('📝 Starting admin account creation script...');

  try {
    require('dotenv').config({ path: '.env.local' });
    console.log('✅ Environment variables loaded');

    const { PrismaClient } = require('@prisma/client');
    const admin = require('firebase-admin');

    const prisma = new PrismaClient();

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      console.log('🔧 Firebase credentials check:');
      console.log('  - PROJECT_ID:', projectId ? '✅' : '❌');
      console.log('  - CLIENT_EMAIL:', clientEmail ? '✅' : '❌');
      console.log('  - PRIVATE_KEY:', privateKey ? '✅' : '❌');

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          'Firebase Admin credentials not configured. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
        );
      }

      console.log('🔐 Initializing Firebase Admin...');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin initialized');
    }

    const adminAuth = admin.auth();
    const email = 'admin@mtm.local';
    const password = 'SuperAdmin123!';

    // Check if user already exists in Prisma
    console.log('\n🔍 Checking if admin already exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('✅ Admin already exists in database:', email);
      console.log('   Prisma ID:', existingUser.id);
      console.log('   Firebase UID:', existingUser.firebaseUid);
      await prisma.$disconnect();
      return;
    }

    console.log('✅ Admin does not exist, creating...\n');

    // Create user in Firebase
    console.log('📝 Creating admin account in Firebase...');
    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName: 'Admin MTM',
      emailVerified: true,
    });

    console.log('✅ Created user in Firebase:', firebaseUser.uid);

    // Create user in Prisma with ADMIN role
    console.log('📝 Creating admin user in Prisma database...');
    const user = await prisma.user.create({
      data: {
        email,
        firebaseUid: firebaseUser.uid,
        role: 'ADMIN',
        isActive: true,
        firstName: 'Admin',
        lastName: 'MTM',
        emailVerified: new Date(),
        isPhoneVerified: true,
        isProfileVerified: true,
      },
    });

    console.log('✅ Created admin user in Prisma');

    console.log('\n✅ ========================================');
    console.log('✅ Admin account created successfully!');
    console.log('✅ ========================================');
    console.log('Email:    ' + user.email);
    console.log('Password: ' + password);
    console.log('Role:     ADMIN');
    console.log('Status:   Active');
    console.log('Firebase UID: ' + user.firebaseUid);
    console.log('Prisma ID:    ' + user.id);
    console.log('\n⚠️  IMPORTANT: Change password after first login!');
    console.log('========================================\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error:', error.message || error);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
})();
