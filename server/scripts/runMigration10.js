const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("==================================================");
    console.log("🚀 Pre-Migration Safety Check: Migration 010");
    console.log("==================================================");

    // Baseline record counts to verify zero data loss
    const preLeads = await client.query("SELECT COUNT(*) FROM leads");
    const preCustomers = await client.query("SELECT COUNT(*) FROM customers");
    const preProducts = await client.query("SELECT COUNT(*) FROM products");
    const preUsers = await client.query("SELECT COUNT(*) FROM users");

    console.log(`📊 Baseline Counts before migration:`);
    console.log(` - Leads: ${preLeads.rows[0].count}`);
    console.log(` - Customers: ${preCustomers.rows[0].count}`);
    console.log(` - Products: ${preProducts.rows[0].count}`);
    console.log(` - Users: ${preUsers.rows[0].count}`);

    console.log("\n⚡ Applying Migration 010 (Real Estate & Construction Schema)...");
    const sqlPath = path.join(__dirname, '../database/migrations/010_crm_addons.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log("✅ SQL Migration applied successfully.");

    console.log("\n==================================================");
    console.log("🔍 Post-Migration Verification Check");
    console.log("==================================================");

    const postLeads = await client.query("SELECT COUNT(*) FROM leads");
    const postCustomers = await client.query("SELECT COUNT(*) FROM customers");
    const postProducts = await client.query("SELECT COUNT(*) FROM products");
    const postUsers = await client.query("SELECT COUNT(*) FROM users");

    console.log(`📊 Record Counts after migration:`);
    console.log(` - Leads: ${postLeads.rows[0].count}`);
    console.log(` - Customers: ${postCustomers.rows[0].count}`);
    console.log(` - Products: ${postProducts.rows[0].count}`);
    console.log(` - Users: ${postUsers.rows[0].count}`);

    // Assert zero record loss
    if (preLeads.rows[0].count !== postLeads.rows[0].count) {
      throw new Error(`Data mismatch: leads count changed from ${preLeads.rows[0].count} to ${postLeads.rows[0].count}`);
    }
    if (preCustomers.rows[0].count !== postCustomers.rows[0].count) {
      throw new Error(`Data mismatch: customers count changed from ${preCustomers.rows[0].count} to ${postCustomers.rows[0].count}`);
    }
    if (preProducts.rows[0].count !== postProducts.rows[0].count) {
      throw new Error(`Data mismatch: products count changed from ${preProducts.rows[0].count} to ${postProducts.rows[0].count}`);
    }
    if (preUsers.rows[0].count !== postUsers.rows[0].count) {
      throw new Error(`Data mismatch: users count changed from ${preUsers.rows[0].count} to ${postUsers.rows[0].count}`);
    }

    console.log("\n🎉 ZERO DATA LOSS CONFIRMED: All existing records intact!");
    console.log("🎉 Migration 010 completed successfully.");
  } catch (err) {
    console.error("❌ Migration 010 failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
