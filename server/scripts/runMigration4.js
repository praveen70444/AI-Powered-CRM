const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running migration 004: lead extra fields + follow-up notes...');
    const migrationPath = path.join(__dirname, '../database/migrations/004_lead_extra_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    console.log('✅ Migration 004 completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 004 failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
