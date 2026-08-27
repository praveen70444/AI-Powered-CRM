require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const setupDatabase = async () => {
  console.log("🚀 Starting CRM Database Setup\n");

  // Step 1: Create database
  const postgresClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres",
  });

  try {
    await postgresClient.connect();
    console.log("✅ Connected to PostgreSQL server");

    // Check if database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const result = await postgresClient.query(checkDbQuery, [
      process.env.DB_NAME,
    ]);

    if (result.rows.length > 0) {
      console.log(`✅ Database "${process.env.DB_NAME}" already exists`);
    } else {
      await postgresClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✅ Database "${process.env.DB_NAME}" created`);
    }

    await postgresClient.end();

    // Step 2: Run migrations
    const dbClient = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await dbClient.connect();
    console.log(`✅ Connected to database: ${process.env.DB_NAME}`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("⚙️  Running migrations...");
    await dbClient.query(schema);

    console.log("✅ Schema created successfully\n");

    // Verify tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const tables = await dbClient.query(tablesQuery);

    console.log("📊 Database tables created:");
    tables.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    await dbClient.end();

    console.log("\n🎉 Database setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. cd server");
    console.log("   2. npm run dev");
    console.log("\n   The server will start on http://localhost:5000");
  } catch (error) {
    console.error("\n❌ Database setup failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("\n🔴 PostgreSQL Connection Error");
      console.error("   Make sure PostgreSQL is running");
      console.error(`   Host: ${process.env.DB_HOST}`);
      console.error(`   Port: ${process.env.DB_PORT}`);
      console.error(`   User: ${process.env.DB_USER}`);
    } else if (error.code === "28P01") {
      console.error("\n🔴 Authentication Failed");
      console.error("   Check DB_USER and DB_PASSWORD in .env file");
    } else if (error.code === "42P07") {
      console.log("\n⚠️  Tables already exist (this is okay)");
      console.log("   Database is already set up");
    }

    process.exit(1);
  }
};

setupDatabase();
