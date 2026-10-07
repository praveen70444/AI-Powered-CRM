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

async function run() {
  const hash = await bcrypt.hash('superadmin123', 10);
  await pool.query('INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING', ['Super Admin', 'super@admin.com', hash, 'SUPER_ADMIN', 'ACTIVE']);
  console.log('Super admin created');
  process.exit(0);
}
run();
