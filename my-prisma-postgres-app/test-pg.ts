import 'dotenv/config';
import { Pool } from 'pg';

console.log('Testing direct PostgreSQL connection...');

const connectionString = process.env.DATABASE_URL!;
console.log('Connection string:', connectionString);

const pool = new Pool({ 
  connectionString,
  // Add connection settings for Supabase
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDirectConnection() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to PostgreSQL successfully!');
    
    // Test simple query
    const result = await client.query('SELECT version();');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test if we can create tables
    console.log('Testing table creation...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table creation successful!');
    
    // Insert and retrieve data
    await client.query('INSERT INTO test_connection DEFAULT VALUES;');
    const insertResult = await client.query('SELECT * FROM test_connection ORDER BY id DESC LIMIT 1;');
    console.log('✅ Insert/select successful:', insertResult.rows[0]);
    
    // Clean up
    await client.query('DROP TABLE test_connection;');
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ PostgreSQL error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDirectConnection();
