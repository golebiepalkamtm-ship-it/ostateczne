// Test database connection without Prisma
require('dotenv/config');

const { Client } = require('pg');

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('📊 Database info:', {
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    
    // Test if we can query tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 5
    `);
    
    console.log('📋 Public tables:', tablesResult.rows.map(row => row.table_name));
    
    await client.end();
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
