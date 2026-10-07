require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

async function seed() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    
    // 1. Create Organization
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, industry, status) VALUES ($1, $2, $3) RETURNING id`,
      ['Rohit Construction', 'Construction', 'ACTIVE']
    );
    const orgId = orgRes.rows[0].id;

    // 2. Create ORG_ADMIN
    await pool.query(
      `INSERT INTO users (organization_id, name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, 'Rohit Admin', 'rohit@construction.com', hash, 'ORG_ADMIN', 'ACTIVE']
    );

    // 3. Create SALES_EXECUTIVE
    await pool.query(
      `INSERT INTO users (organization_id, name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, 'Sales Executive', 'sales@construction.com', hash, 'SALES_EXECUTIVE', 'ACTIVE']
    );

    console.log('Successfully seeded Rohit Construction organization and users!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
