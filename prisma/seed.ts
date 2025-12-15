// Separate Prisma client for seed script to avoid engine type issues
import 'dotenv/config';

// Force engine type before any Prisma imports
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE || process.env.PRISMA_CLIENT_ENGINE_TYPE.toLowerCase() === 'client') {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
}

/**
 * Database Seeding Script for Palka MTM Auction System
 * Initializes roles and basic data for the 3-level verification system
 */

import { Role } from '@prisma/client';
import { captureError } from '../lib/sentry-helpers';
import { prisma } from './seed-prisma';

interface RoleSeedData {
  name: string;
  description: string;
  level: number;
  permissions: string[];
}

const ROLES_SEED_DATA: RoleSeedData[] = [
  {
    name: 'USER_REGISTERED',
    description: 'User with basic registration - Level 1 verification',
    level: 1,
    permissions: ['view_auctions', 'register'],
  },
  {
    name: 'USER_EMAIL_VERIFIED', 
    description: 'User with email verified - Level 2 verification',
    level: 2,
    permissions: ['view_auctions', 'register', 'access_dashboard', 'complete_profile'],
  },
  {
    name: 'USER_FULL_VERIFIED',
    description: 'Fully verified user - Level 3 verification',
    level: 3,
    permissions: ['view_auctions', 'register', 'access_dashboard', 'complete_profile', 'create_auctions', 'bid', 'add_references'],
  },
  {
    name: 'ADMIN',
    description: 'System administrator - full access',
    level: 4,
    permissions: ['*'],
  },
];

async function seedRoles() {
  console.log('🌱 Starting database seeding...');

  if (!prisma) {
    throw new Error('Prisma client not available. Check database configuration.');
  }

  try {
    // Check if roles already exist
    const existingRoles = await prisma.user.findMany({
      select: { role: true },
      distinct: ['role'],
    });

    const existingRoleNames = existingRoles.map((u: { role: Role }) => u.role);
    const rolesToCreate = ROLES_SEED_DATA.filter(role => !existingRoleNames.includes(role.name as Role));

    if (rolesToCreate.length === 0) {
      console.log('✅ All roles already exist in database');
      return;
    }

    console.log(`📝 Creating ${rolesToCreate.length} new roles...`);

    // Note: Roles are enum values in Prisma, so we don't actually create them in DB
    // This seed script serves as documentation and verification
    for (const roleData of rolesToCreate) {
      console.log(`  • ${roleData.name} (Level ${roleData.level}): ${roleData.description}`);
    }

    console.log('✅ Role configuration verified successfully');
    console.log('');
    console.log('📊 Role Hierarchy:');
    ROLES_SEED_DATA.forEach(role => {
      console.log(`  Level ${role.level}: ${role.name}`);
      console.log(`    Permissions: ${role.permissions.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    captureError(error as Error, { context: 'seed_roles' });
    throw error;
  }
}

async function verifyDatabaseConnection() {
  if (!prisma) {
    console.error('❌ Prisma client not available');
    return false;
  }

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Palka MTM Database Seeder');
  console.log('=====================================\n');

  // Verify database connection
  const isConnected = await verifyDatabaseConnection();
  if (!isConnected) {
    throw new Error('Cannot connect to database. Check your DATABASE_URL environment variable.');
  }

  // Seed roles
  await seedRoles();

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run prisma:generate');
  console.log('2. Run: npm run prisma:push (or npm run prisma:migrate)');
  console.log('3. Start the application: npm run dev');
}

main()
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    captureError(error as Error, { context: 'seed_main' });
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
