require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");
const initializeDatabase = require("./database/initDb");
const { startReminderScheduler } = require("./services/reminderService");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");
     await initializeDatabase();
    console.log("Database connection successful");
    app.listen(PORT, () => {
      console.log(`CRM server running on port ${PORT}`);
      startReminderScheduler();
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};
startServer();