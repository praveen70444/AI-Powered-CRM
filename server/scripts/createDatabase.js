require("dotenv").config();
const { Client } = require("pg");

const createDatabase = async () => {
  // Connect to PostgreSQL without specifying a database (connect to 'postgres' default DB)
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres", // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL server");

    // Check if database exists
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const result = await client.query(checkDbQuery, [process.env.DB_NAME]);

    if (result.rows.length > 0) {
      console.log(`Database "${process.env.DB_NAME}" already exists`);
    } else {
      // Create the database
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database "${process.env.DB_NAME}" created successfully`);
    }

    await client.end();
    console.log("\nDatabase setup completed!");
    console.log(`\nNext steps:`);
    console.log(`1. Run: npm run migrate`);
    console.log(`   This will create all the tables and schema`);
    console.log(`\n2. Run: npm run dev`);
    console.log(`   This will start the server`);
  } catch (error) {
    console.error("Error creating database:", error.message);
    
    if (error.code === "ECONNREFUSED") {
      console.error("\n❌ Could not connect to PostgreSQL server.");
      console.error("Make sure PostgreSQL is running on your system.");
      console.error(`   Host: ${process.env.DB_HOST}`);
      console.error(`   Port: ${process.env.DB_PORT}`);
      console.error(`   User: ${process.env.DB_USER}`);
    } else if (error.code === "28P01") {
      console.error("\n❌ Authentication failed.");
      console.error("Check your DB_USER and DB_PASSWORD in the .env file.");
    }
    
    process.exit(1);
  }
};

createDatabase();
