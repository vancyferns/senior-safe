#!/usr/bin/env node
import fs from 'fs';
import { Client } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

async function runMigration() {
  const client = new Client(databaseUrl);
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    console.log('📊 Reading migration file...');
    const migrationSql = fs.readFileSync('./neon_migrations/001_initial_schema.sql', 'utf8');
    
    console.log('⏳ Running migration...');
    await client.query(migrationSql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tableCheckResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('📋 Tables created:');
    tableCheckResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
