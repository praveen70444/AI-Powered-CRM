require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
  .then(r => {
    console.log('✅ Tables in DB:');
    r.rows.forEach(x => console.log(' -', x.table_name));
    pool.end();
    process.exit(0);
  })
  .catch(e => {
    console.error('❌', e.message);
    process.exit(1);
  });
