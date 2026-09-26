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
    console.log('🚀 Running migration 009: customer and product fields...');
    const sql = fs.readFileSync(path.join(__dirname, '../database/migrations/009_customer_product_fields.sql'), 'utf16le'); // echo might use utf16le in powershell
    
    // Actually, to avoid encoding issues with echo, I'll just write the query directly here and execute it.
    const query = `
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS phase_no VARCHAR(255);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS flat_no VARCHAR(255);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_sq_yd NUMERIC(15,2);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS rate_purchased NUMERIC(15,2);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(255);
      
      ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS price_per_sq_yard NUMERIC(15,2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS total_acres NUMERIC(15,2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS booking_advance NUMERIC(15,2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS r_c VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS month_launched VARCHAR(255);
    `;
    await client.query('BEGIN');
    await client.query(query);
    await client.query('COMMIT');
    console.log('✅ Migration 009 done!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 009 failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}
run().then(() => process.exit(0)).catch(() => process.exit(1));
