require("dotenv").config();
const { Client } = require("pg");

const seedSampleData = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log("🚀 Starting data population...\n");

    // Get organization and users
    const orgResult = await client.query(
      `SELECT id FROM organizations LIMIT 1`
    );
    const orgId = orgResult.rows[0].id;

    const employeeResult = await client.query(
      `SELECT id FROM users WHERE role = 'SALES_EXECUTIVE' LIMIT 1`
    );
    const employeeId = employeeResult.rows[0].id;

    // Create Leads
    console.log("📌 Creating leads...");
    const leadsData = [
      ["John Smith", "Acme Corp", "john.smith@acme.com", "+1-555-0101", "New", "Website", 50000],
      ["Sarah Johnson", "Tech Solutions", "sarah.j@techsol.com", "+1-555-0102", "Contacted", "Referral", 75000],
      ["Michael Brown", "Global Industries", "m.brown@global.com", "+1-555-0103", "Qualified", "Cold Call", 120000],
      ["Emily Davis", "Innovate Inc", "emily.d@innovate.com", "+1-555-0104", "New", "Social Media", 45000],
      ["David Wilson", "Prime Ventures", "d.wilson@prime.com", "+1-555-0105", "Contacted", "Advertisement", 90000],
      ["Lisa Anderson", "Smart Systems", "lisa@smartsys.com", "+1-555-0106", "New", "Event", 60000],
      ["James Taylor", "Digital Dynamics", "james.t@digital.com", "+1-555-0107", "Qualified", "Website", 85000],
      ["Maria Garcia", "Future Tech", "maria@futuretech.com", "+1-555-0108", "Contacted", "Referral", 70000],
      ["Robert Martinez", "Enterprise Solutions", "robert.m@enterprise.com", "+1-555-0109", "New", "Cold Call", 150000],
      ["Jennifer Lee", "CloudFirst", "jennifer@cloudfirst.com", "+1-555-0110", "Qualified", "Social Media", 95000],
    ];

    for (const lead of leadsData) {
      await client.query(
        `INSERT INTO leads (organization_id, owner_id, name, company, email, phone, status, source, value) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orgId, employeeId, ...lead]
      );
    }
    console.log(`✅ Created ${leadsData.length} leads\n`);

    // Create Customers
    console.log("👥 Creating customers...");
    const customersData = [
      ["William Thompson", "TechCorp International", "w.thompson@techcorp.com", "+1-555-0201", "Active", "Technology", 250000, "2023-01-15"],
      ["Patricia White", "Healthcare Plus", "patricia@healthplus.com", "+1-555-0202", "Active", "Healthcare", 180000, "2023-03-20"],
      ["Christopher Harris", "Finance Group", "chris.h@financegroup.com", "+1-555-0203", "Active", "Finance", 320000, "2022-11-10"],
      ["Nancy Clark", "Retail Masters", "nancy@retailmasters.com", "+1-555-0204", "At Risk", "Retail", 150000, "2023-05-05"],
      ["Daniel Lewis", "Manufacturing Pro", "daniel@mfgpro.com", "+1-555-0205", "Active", "Manufacturing", 280000, "2022-08-12"],
      ["Karen Walker", "Consulting Edge", "karen@consultedge.com", "+1-555-0206", "Active", "Consulting", 210000, "2023-02-28"],
      ["Steven Hall", "Education First", "steven@edufirst.com", "+1-555-0207", "Active", "Education", 95000, "2023-06-18"],
      ["Betty Allen", "Construction Plus", "betty@constructplus.com", "+1-555-0208", "Inactive", "Construction", 75000, "2022-04-22"],
    ];

    const customerIds = [];
    for (const customer of customersData) {
      const result = await client.query(
        `INSERT INTO customers (organization_id, owner_id, name, company, email, phone, status, industry, total_spend, customer_since) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [orgId, employeeId, ...customer]
      );
      customerIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${customersData.length} customers\n`);

    // Create Deals
    console.log("💰 Creating deals...");
    const dealsData = [
      [customerIds[0], "Enterprise Software License", "TechCorp International", "Proposal", 180000, "2024-12-15"],
      [customerIds[1], "Healthcare Management System", "Healthcare Plus", "Negotiation", 95000, "2024-11-30"],
      [customerIds[2], "Financial Analytics Platform", "Finance Group", "Qualified", 150000, "2025-01-20"],
      [customerIds[0], "Cloud Migration Services", "TechCorp International", "New", 75000, "2025-02-10"],
      [customerIds[4], "Manufacturing Automation", "Manufacturing Pro", "Proposal", 220000, "2024-12-28"],
      [customerIds[5], "Consulting Package - Annual", "Consulting Edge", "Won", 85000, "2024-10-15"],
      [customerIds[3], "Retail POS System", "Retail Masters", "Negotiation", 65000, "2024-11-25"],
      [customerIds[6], "Education Platform License", "Education First", "Qualified", 45000, "2025-01-05"],
      [null, "New Product Launch Support", "Startup Innovations", "New", 120000, "2025-03-01"],
      [customerIds[1], "Data Security Upgrade", "Healthcare Plus", "Lost", 55000, "2024-09-30"],
    ];

    for (const deal of dealsData) {
      await client.query(
        `INSERT INTO deals (organization_id, owner_id, customer_id, title, company, stage, value, close_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orgId, employeeId, ...deal]
      );
    }
    console.log(`✅ Created ${dealsData.length} deals\n`);

    // Create Tasks
    console.log("✅ Creating tasks...");
    const tasksData = [
      ["Follow up with John Smith", "John Smith - Acme Corp", "Lead", "High", "Pending", "2024-11-01"],
      ["Prepare proposal for TechCorp", "TechCorp International", "Customer", "High", "In Progress", "2024-10-30"],
      ["Schedule demo for Sarah Johnson", "Sarah Johnson - Tech Solutions", "Lead", "Medium", "Pending", "2024-11-02"],
      ["Send contract to Healthcare Plus", "Healthcare Plus", "Deal", "High", "Pending", "2024-10-29"],
      ["Quarterly review with Finance Group", "Christopher Harris - Finance Group", "Customer", "Medium", "Pending", "2024-11-05"],
      ["Research Manufacturing Pro requirements", "Manufacturing Pro", "Deal", "Low", "Completed", "2024-10-15"],
      ["Call Michael Brown for feedback", "Michael Brown - Global Industries", "Lead", "High", "Pending", "2024-10-31"],
      ["Update CRM data", "General maintenance", "Lead", "Low", "In Progress", "2024-11-03"],
      ["Prepare pricing for Retail Masters", "Retail Masters", "Deal", "Medium", "Pending", "2024-11-01"],
      ["Send follow-up email to CloudFirst", "Jennifer Lee - CloudFirst", "Lead", "Medium", "Completed", "2024-10-20"],
    ];

    for (const task of tasksData) {
      await client.query(
        `INSERT INTO tasks (organization_id, owner_id, title, related_to, type, priority, status, due_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orgId, employeeId, ...task]
      );
    }
    console.log(`✅ Created ${tasksData.length} tasks\n`);

    // Create Activities
    console.log("📞 Creating activities...");
    const activitiesData = [
      ["Initial call with John Smith", "John Smith - Acme Corp", "Call", "2024-10-28 10:30:00"],
      ["Sent proposal to TechCorp", "TechCorp International", "Email", "2024-10-27 14:15:00"],
      ["Demo meeting with Healthcare Plus", "Healthcare Plus", "Meeting", "2024-10-26 15:00:00"],
      ["Follow-up call with Sarah Johnson", "Sarah Johnson - Tech Solutions", "Call", "2024-10-25 11:00:00"],
      ["Updated lead status", "Michael Brown - Global Industries", "Lead Update", "2024-10-24 09:30:00"],
      ["Customer profile updated", "Finance Group", "Customer Update", "2024-10-23 16:45:00"],
      ["Deal stage moved to negotiation", "Healthcare Management System", "Deal Update", "2024-10-22 13:20:00"],
      ["Sent pricing information", "David Wilson - Prime Ventures", "Email", "2024-10-21 10:00:00"],
      ["Discovery call completed", "Jennifer Lee - CloudFirst", "Call", "2024-10-20 14:30:00"],
      ["Quarterly business review", "TechCorp International", "Meeting", "2024-10-19 10:00:00"],
      ["Contract signed", "Consulting Edge", "Deal Update", "2024-10-15 11:30:00"],
      ["Onboarding call scheduled", "Education First", "Call", "2024-10-14 15:00:00"],
    ];

    for (const activity of activitiesData) {
      await client.query(
        `INSERT INTO activities (organization_id, owner_id, title, related_to, type, occurred_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orgId, employeeId, ...activity]
      );
    }
    console.log(`✅ Created ${activitiesData.length} activities\n`);

    // Create Notes
    console.log("📝 Creating notes...");
    const notesData = [
      ["John Smith - Acme Corp", "Lead", "Interested in enterprise solution. Budget approved for Q4. Next step: technical demo."],
      ["TechCorp International", "Customer", "Long-term client. Very satisfied with current services. Exploring expansion opportunities."],
      ["Healthcare Management System", "Deal", "Decision maker wants to see ROI analysis. Compliance requirements are critical. Meeting scheduled for next week."],
      ["Michael Brown - Global Industries", "Lead", "Referred by existing client. Looking for complete CRM solution. Timeline: 3-6 months."],
      ["Finance Group", "Customer", "Annual contract renewal coming up in January. Discussed potential upsell opportunities."],
      ["Manufacturing Automation", "Deal", "Technical evaluation in progress. IT team reviewing security requirements. Positive initial feedback."],
      ["Sarah Johnson - Tech Solutions", "Lead", "Competitor comparison in progress. Price sensitive but values quality and support."],
      ["Retail Masters", "Customer", "Experiencing some issues with current solution. At risk of churn. Immediate attention required."],
      ["Consulting Package - Annual", "Deal", "Deal closed! Great relationship. Potential for referrals to other companies in their network."],
      ["Jennifer Lee - CloudFirst", "Lead", "Very interested. Needs approval from VP of Sales. Following up next week."],
    ];

    for (const note of notesData) {
      await client.query(
        `INSERT INTO notes (organization_id, author_id, related_to, related_type, content) 
         VALUES ($1, $2, $3, $4, $5)`,
        [orgId, employeeId, ...note]
      );
    }
    console.log(`✅ Created ${notesData.length} notes\n`);

    // Create Notifications
    console.log("🔔 Creating notifications...");
    const notificationsData = [
      ["lead", "New lead assigned", "John Smith from Acme Corp has been assigned to you", false],
      ["task", "Task due soon", "Follow up with John Smith is due tomorrow", false],
      ["deal", "Deal stage updated", "Healthcare Management System moved to Negotiation stage", false],
      ["lead", "Lead status changed", "Michael Brown - Global Industries marked as Qualified", true],
      ["task", "Task completed", "Research Manufacturing Pro requirements has been completed", true],
      ["customer", "Customer at risk", "Retail Masters marked as At Risk - immediate attention needed", false],
      ["deal", "Deal won", "Consulting Package - Annual has been closed successfully!", true],
      ["task", "New task assigned", "Prepare proposal for TechCorp has been assigned to you", false],
      ["lead", "Lead requires attention", "Jennifer Lee from CloudFirst hasn't been contacted in 5 days", false],
      ["deal", "Deal value updated", "Enterprise Software License deal value increased to $180,000", true],
    ];

    for (const notification of notificationsData) {
      await client.query(
        `INSERT INTO notifications (organization_id, user_id, type, title, description, is_read) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orgId, employeeId, ...notification]
      );
    }
    console.log(`✅ Created ${notificationsData.length} notifications\n`);

    await client.end();

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Sample Data Population Complete!\n");
    console.log("📊 Summary:");
    console.log(`   ✓ ${leadsData.length} Leads`);
    console.log(`   ✓ ${customersData.length} Customers`);
    console.log(`   ✓ ${dealsData.length} Deals`);
    console.log(`   ✓ ${tasksData.length} Tasks`);
    console.log(`   ✓ ${activitiesData.length} Activities`);
    console.log(`   ✓ ${notesData.length} Notes`);
    console.log(`   ✓ ${notificationsData.length} Notifications`);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nLogin with employee@test.com to see the data!");
  } catch (error) {
    console.error("❌ Error populating data:", error.message);
    console.error(error);
    process.exit(1);
  }
};

seedSampleData();
