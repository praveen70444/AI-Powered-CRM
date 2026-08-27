require("dotenv").config();
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const seedTestUsers = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Create organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name, status) 
       VALUES ($1, $2) 
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ["Test Organization", "ACTIVE"]
    );

    let orgId;
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].id;
      console.log(`✅ Created organization with ID: ${orgId}`);
    } else {
      // Organization already exists, get it
      const existingOrg = await client.query(
        `SELECT id FROM organizations WHERE name = $1`,
        ["Test Organization"]
      );
      orgId = existingOrg.rows[0].id;
      console.log(`ℹ️  Organization already exists with ID: ${orgId}`);
    }

    // Create Organization Admin
    const adminPassword = "admin123";
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const adminCheck = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      ["admin@test.com"]
    );

    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (organization_id, name, email, password_hash, role, status) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orgId,
          "Admin User",
          "admin@test.com",
          adminHash,
          "ORG_ADMIN",
          "ACTIVE",
        ]
      );
      console.log("✅ Created Organization Admin account");
    } else {
      console.log("ℹ️  Organization Admin already exists");
    }

    // Create Employee (Sales Executive)
    const employeePassword = "employee123";
    const employeeHash = await bcrypt.hash(employeePassword, 10);

    const empCheck = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      ["employee@test.com"]
    );

    if (empCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (organization_id, name, email, password_hash, role, status, phone, department, location) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          orgId,
          "Employee User",
          "employee@test.com",
          employeeHash,
          "SALES_EXECUTIVE",
          "ACTIVE",
          "+1234567890",
          "Sales",
          "New York",
        ]
      );
      console.log("✅ Created Employee account");
    } else {
      console.log("ℹ️  Employee account already exists");
    }

    console.log("\n📋 Test Accounts Created:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔑 ORGANIZATION ADMIN:");
    console.log("   Email:    admin@test.com");
    console.log("   Password: admin123");
    console.log("   Role:     ORG_ADMIN");
    console.log("\n👤 EMPLOYEE (Sales Executive):");
    console.log("   Email:    employee@test.com");
    console.log("   Password: employee123");
    console.log("   Role:     SALES_EXECUTIVE");
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nYou can now login with these credentials!");

    await client.end();
  } catch (error) {
    console.error("❌ Error seeding users:", error.message);
    process.exit(1);
  }
};

seedTestUsers();
