// Database Migration Runner
// Run with: node run-migration.js

import { neon } from '@neondatabase/serverless';
import { readFile } from 'fs/promises';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  console.log('📝 Please add your Neon database connection string to .env.local:');
  console.log('   DATABASE_URL=postgresql://user:password@host/database');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
    // Read the migration file
    const migrationSQL = await readFile('./migrations/001_initial_schema.sql', 'utf-8');
    
    // Execute the migration
    await sql(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Created tables: sites, samples, results');
    console.log('🌊 Seeded with Okel Tor and Calstock sites');
    console.log('📈 Added sample test data for development');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();