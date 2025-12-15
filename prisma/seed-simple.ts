// Simple seed script with explicit engine type configuration
import 'dotenv/config';

// Set engine type explicitly as early as possible
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';

import { PrismaClient } from '@prisma/client';

console.log('🚀 Starting simple seed script...');
console.log('Engine type:', process.env.PRISMA_CLIENT_ENGINE_TYPE);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  try {
    console.log('✅ Database connection successful');
    
    // Check if we can query the database
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    console.log('✅ Seed script completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
