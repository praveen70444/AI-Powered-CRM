const pool = require("../config/db");

/**
 * Build a daily AI briefing for an employee — rule-based, no external API needed.
 */
const getDailyBriefing = async (organizationId, ownerId) => {
  const today = new Date().toISOString().split("T")[0];

  // Overdue tasks
  const overdueRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM tasks
     WHERE organization_id = $1 AND owner_id = $2 AND status != 'Completed' AND due_date < $3`,
    [organizationId, ownerId, today]
  );

  // Tasks due today
  const dueTodayRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM tasks
     WHERE organization_id = $1 AND owner_id = $2 AND status != 'Completed' AND due_date = $3`,
    [organizationId, ownerId, today]
  );

  // Deals closing this week
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const closingRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM deals
     WHERE organization_id = $1 AND owner_id = $2
     AND stage NOT IN ('Won','Lost') AND close_date BETWEEN $3 AND $4`,
    [organizationId, ownerId, today, weekEnd.toISOString().split("T")[0]]
  );

  // High-score leads (score >= 70) needing contact
  const hotLeadsRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM leads
     WHERE organization_id = $1 AND owner_id = $2
     AND ai_score >= 70 AND status NOT IN ('Converted','Unqualified')`,
    [organizationId, ownerId]
  );

  // New leads since yesterday
  const newLeadsRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM leads
     WHERE organization_id = $1 AND owner_id = $2 AND created_at >= NOW() - INTERVAL '1 day'`,
    [organizationId, ownerId]
  );

  // At-risk customers
  const atRiskCustRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM customers
     WHERE organization_id = $1 AND owner_id = $2 AND ai_churn_risk = 'HIGH'`,
    [organizationId, ownerId]
  );

  const overdueTasks = parseInt(overdueRes.rows[0].cnt);
  const dueTodayTasks = parseInt(dueTodayRes.rows[0].cnt);
  const closingDeals = parseInt(closingRes.rows[0].cnt);
  const hotLeads = parseInt(hotLeadsRes.rows[0].cnt);
  const newLeads = parseInt(newLeadsRes.rows[0].cnt);
  const atRiskCustomers = parseInt(atRiskCustRes.rows[0].cnt);

  // Build highlight list
  const highlights = [];

  if (overdueTasks > 0) {
    highlights.push({
      type: "urgent",
      icon: "alert",
      message: `${overdueTasks} overdue task${overdueTasks > 1 ? "s" : ""} — take action immediately`,
    });
  }
  if (dueTodayTasks > 0) {
    highlights.push({
      type: "urgent",
      icon: "clock",
      message: `${dueTodayTasks} task${dueTodayTasks > 1 ? "s" : ""} due today`,
    });
  }
  if (closingDeals > 0) {
    highlights.push({
      type: "opportunity",
      icon: "dollar",
      message: `${closingDeals} deal${closingDeals > 1 ? "s" : ""} closing this week`,
    });
  }
  if (hotLeads > 0) {
    highlights.push({
      type: "opportunity",
      icon: "fire",
      message: `${hotLeads} hot lead${hotLeads > 1 ? "s" : ""} ready for outreach`,
    });
  }
  if (atRiskCustomers > 0) {
    highlights.push({
      type: "risk",
      icon: "warning",
      message: `${atRiskCustomers} customer${atRiskCustomers > 1 ? "s" : ""} showing churn risk`,
    });
  }
  if (newLeads > 0) {
    highlights.push({
      type: "info",
      icon: "user",
      message: `${newLeads} new lead${newLeads > 1 ? "s" : ""} added in the last 24 hours`,
    });
  }

  // Build briefing text
  const parts = [];
  if (overdueTasks > 0 || dueTodayTasks > 0) {
    const total = overdueTasks + dueTodayTasks;
    parts.push(`You have ${total} task${total > 1 ? "s" : ""} requiring attention today.`);
  }
  if (closingDeals > 0) {
    parts.push(`${closingDeals} deal${closingDeals > 1 ? "s are" : " is"} closing this week — make sure to follow up.`);
  }
  if (hotLeads > 0) {
    parts.push(`${hotLeads} high-scoring lead${hotLeads > 1 ? "s are" : " is"} ready for outreach.`);
  }
  if (atRiskCustomers > 0) {
    parts.push(`${atRiskCustomers} customer${atRiskCustomers > 1 ? "s need" : " needs"} immediate attention to prevent churn.`);
  }
  if (parts.length === 0) {
    parts.push("Everything looks good today. Keep up the great work!");
  }

  return {
    briefing: parts.join(" "),
    highlights,
    stats: {
      overdueTasks,
      dueTodayTasks,
      closingDeals,
      hotLeads,
      newLeads,
      atRiskCustomers,
    },
    generatedAt: new Date().toISOString(),
  };
};

module.exports = { getDailyBriefing };
