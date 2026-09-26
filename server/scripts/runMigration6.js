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

async function run() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running migration 006: widen ip_address columns...');
    const sql = fs.readFileSync(path.join(__dirname, '../database/migrations/006_widen_ip_columns.sql'), 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration 006 done!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 006 failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}
run().then(() => process.exit(0)).catch(() => process.exit(1));
