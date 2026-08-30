const pool = require("../config/db");

/**
 * Assess churn risk for a single customer.
 */
const assessCustomerChurn = (customer, daysSinceActivity, recentLostDeals) => {
  const factors = [];
  let riskScore = 0;

  // Factor 1: CRM status
  if (customer.status === "At Risk") {
    riskScore += 40;
    factors.push("Customer is marked 'At Risk' in CRM");
  } else if (customer.status === "Inactive") {
    riskScore += 25;
    factors.push("Customer is marked 'Inactive'");
  }

  // Factor 2: Days since last activity
  if (daysSinceActivity === null) {
    riskScore += 20;
    factors.push("No activity ever logged");
  } else if (daysSinceActivity > 60) {
    riskScore += 30;
    factors.push(`No contact in ${daysSinceActivity} days`);
  } else if (daysSinceActivity > 30) {
    riskScore += 15;
    factors.push(`Last contact was ${daysSinceActivity} days ago`);
  }

  // Factor 3: Recent lost deals
  if (recentLostDeals > 0) {
    riskScore += 20;
    factors.push(`${recentLostDeals} deal(s) recently marked as Lost`);
  }

  riskScore = Math.min(100, riskScore);

  let churnRisk;
  if (riskScore >= 50) churnRisk = "HIGH";
  else if (riskScore >= 25) churnRisk = "MEDIUM";
  else churnRisk = "LOW";

  return { churnRisk, riskScore, factors };
};

/**
 * Get churn risk for all customers of an employee.
 */
const getChurnRisk = async (organizationId, ownerId) => {
  const customersRes = await pool.query(
    `SELECT c.*, u.name AS owner_name
     FROM customers c JOIN users u ON u.id = c.owner_id
     WHERE c.organization_id = $1 AND c.owner_id = $2
     ORDER BY c.updated_at ASC`,
    [organizationId, ownerId]
  );
  const customers = customersRes.rows;
  if (customers.length === 0) return { assessed: 0, highRisk: [], summary: { HIGH: 0, MEDIUM: 0, LOW: 0 } };

  const results = [];
  const summary = { HIGH: 0, MEDIUM: 0, LOW: 0 };

  for (const customer of customers) {
    // Last activity
    const lastActRes = await pool.query(
      `SELECT MAX(occurred_at) AS last FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`,
      [organizationId, ownerId, `%${customer.name}%`]
    );
    const lastActivity = lastActRes.rows[0].last;
    const daysSince = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Recent lost deals (last 90 days)
    const lostRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM deals
       WHERE organization_id = $1 AND owner_id = $2 AND customer_id = $3
       AND stage = 'Lost' AND updated_at > NOW() - INTERVAL '90 days'`,
      [organizationId, ownerId, customer.id]
    );
    const lostDeals = parseInt(lostRes.rows[0].cnt);

    const { churnRisk, riskScore, factors } = assessCustomerChurn(customer, daysSince, lostDeals);
    summary[churnRisk]++;

    // Persist
    await pool.query(
      `UPDATE customers
       SET ai_churn_risk = $1, ai_churn_factors = $2, ai_churn_updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [churnRisk, JSON.stringify({ riskScore, factors }), customer.id]
    );

    results.push({
      customerId: customer.id,
      customerName: customer.name,
      company: customer.company,
      status: customer.status,
      churnRisk,
      riskScore,
      factors,
      daysSinceActivity: daysSince,
    });
  }

  const highRisk = results
    .filter((r) => r.churnRisk !== "LOW")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  return { assessed: results.length, highRisk, summary, all: results };
};

module.exports = { getChurnRisk };
