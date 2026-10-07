const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/crm_db",
});

async function run() {
  try {
    const userRes = await pool.query(`SELECT id, organization_id FROM users WHERE email = 'rohit@construction.com'`);
    if (userRes.rows.length === 0) {
      console.log("User rohit@construction.com not found!");
      return;
    }
    const { id: userId, organization_id: orgId } = userRes.rows[0];

    // Create Tasks
    await pool.query(`
      INSERT INTO tasks (organization_id, owner_id, title, related_to, type, priority, status, due_date)
      VALUES 
      ($1, $2, 'Follow up on concrete order', 'Praveen Kumar', 'Call', 'High', 'Pending', CURRENT_DATE),
      ($1, $2, 'Site visit for redevelopment', 'Rohit Sharma', 'Meeting', 'Medium', 'Pending', CURRENT_DATE + INTERVAL '1 day'),
      ($1, $2, 'Submit maintenance quote', 'Vijay Singh', 'Email', 'High', 'Pending', CURRENT_DATE + INTERVAL '2 days')
    `, [orgId, userId]);

    // Create Calendar Events
    await pool.query(`
      INSERT INTO calendar_events (organization_id, owner_id, title, description, event_type, start_time, end_time, location, status)
      VALUES 
      ($1, $2, 'Client Meeting - Foundation Planning', 'Discuss the foundation layout with the structural engineer', 'Meeting', CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '3 hours', 'Site A', 'Scheduled'),
      ($1, $2, 'Review Maintenance Contract', 'Go over the annual maintenance contract details', 'Call', CURRENT_TIMESTAMP + INTERVAL '4 hours', CURRENT_TIMESTAMP + INTERVAL '4.5 hours', 'Phone', 'Scheduled')
    `, [orgId, userId]);

    // Create Activities
    await pool.query(`
      INSERT INTO activities (organization_id, owner_id, title, related_to, type)
      VALUES 
      ($1, $2, 'Created new redevelopment lead', 'Praveen Kumar', 'Lead'),
      ($1, $2, 'Called client regarding budget', 'Rohit Sharma', 'Call')
    `, [orgId, userId]);

    console.log("Successfully seeded tasks, events, and activities for rohit@construction.com!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

run();
