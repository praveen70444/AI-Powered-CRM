const pool = require("../config/db");

/**
 * Returns the single best next action for a lead.
 */
const getLeadNextAction = (lead, activityCount, noteCount, hasLinkedDeal) => {
  if (lead.status === "Converted") {
    return { action: "Review customer account", priority: "low", reason: "Lead has been converted to a customer" };
  }
  if (lead.status === "Unqualified") {
    return { action: "Re-evaluate qualification criteria", priority: "low", reason: "Lead is marked unqualified" };
  }

  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(lead.updated_at || lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (lead.status === "New" && activityCount === 0) {
    return { action: "Make first contact via call or email", priority: "high", reason: "New lead with no contact attempt yet" };
  }
  if (lead.status === "Contacted" && daysSinceUpdate >= 3) {
    return { action: `Follow up — last contact ${daysSinceUpdate} days ago`, priority: "high", reason: "Lead needs a follow-up to stay engaged" };
  }
  if (lead.status === "Qualified" && !hasLinkedDeal && Number(lead.value) > 0) {
    return { action: "Create a deal to track this opportunity", priority: "high", reason: "Qualified lead with value but no deal in pipeline" };
  }
  if (lead.status === "Qualified" && activityCount === 0) {
    return { action: "Schedule a discovery call or demo", priority: "medium", reason: "Qualified lead with no engagement activities" };
  }
  if (noteCount === 0) {
    return { action: "Log a note about this lead's context", priority: "low", reason: "No notes recorded — document what you know" };
  }

  return { action: "Review lead and plan next touchpoint", priority: "low", reason: "Lead is progressing normally" };
};

/**
 * Returns the single best next action for a deal.
 */
const getDealNextAction = (deal, activityCount, hasQuote) => {
  if (["Won", "Lost"].includes(deal.stage)) {
    return { action: deal.stage === "Won" ? "Initiate customer onboarding" : "Document loss reason for learning", priority: "low", reason: `Deal is ${deal.stage}` };
  }

  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(deal.updated_at || deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  let daysToClose = null;
  if (deal.close_date) {
    daysToClose = Math.floor(
      (new Date(deal.close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  if (daysToClose !== null && daysToClose < 0) {
    return { action: "Update close date or mark Won/Lost — close date has passed", priority: "high", reason: `Close date was ${Math.abs(daysToClose)} days ago` };
  }
  if (daysToClose !== null && daysToClose <= 3) {
    return { action: "Final push — follow up to close before deadline", priority: "high", reason: `Close date in ${daysToClose} day${daysToClose === 1 ? "" : "s"}` };
  }
  if (deal.stage === "Proposal" && !hasQuote) {
    return { action: "Create and send a quote", priority: "high", reason: "Deal is in Proposal stage but no quote exists" };
  }
  if (deal.stage === "Negotiation" && daysSinceUpdate >= 5) {
    return { action: "Follow up on proposal terms", priority: "high", reason: `No activity in ${daysSinceUpdate} days during negotiation` };
  }
  if (daysSinceUpdate >= 7) {
    return { action: `Log a touchpoint — no activity in ${daysSinceUpdate} days`, priority: "medium", reason: "Deal is going stale without engagement" };
  }
  if (activityCount === 0) {
    return { action: "Log first activity for this deal", priority: "medium", reason: "No activities recorded" };
  }

  return { action: "Continue building rapport and gathering requirements", priority: "low", reason: "Deal is progressing well" };
};

/**
 * Returns the single best next action for a customer.
 */
const getCustomerNextAction = (customer, daysSinceActivity) => {
  if (customer.status === "At Risk") {
    return { action: "Schedule urgent check-in to prevent churn", priority: "high", reason: "Customer is marked At Risk" };
  }
  if (daysSinceActivity === null || daysSinceActivity > 45) {
    return { action: "Schedule a relationship check-in call", priority: "high", reason: `Last contact was ${daysSinceActivity ?? "unknown"} days ago` };
  }
  if (daysSinceActivity > 30) {
    return { action: "Send a value-add update or case study", priority: "medium", reason: `No contact in ${daysSinceActivity} days` };
  }
  if (Number(customer.total_spend) > 0 && daysSinceActivity < 14) {
    return { action: "Explore upsell or renewal opportunities", priority: "medium", reason: "Active customer with spend history — good time for upsell" };
  }

  return { action: "Maintain regular cadence — all looks healthy", priority: "low", reason: "Customer relationship is active" };
};

/**
 * Get top 10 next actions across all modules for the employee.
 */
const getTopNextActions = async (organizationId, ownerId) => {
  const [leadsRes, dealsRes, customersRes] = await Promise.all([
    pool.query(
      `SELECT l.*, u.name AS owner_name
       FROM leads l JOIN users u ON u.id = l.owner_id
       WHERE l.organization_id = $1 AND l.owner_id = $2 AND l.status != 'Converted'
       ORDER BY l.updated_at ASC LIMIT 20`,
      [organizationId, ownerId]
    ),
    pool.query(
      `SELECT d.*, u.name AS owner_name
       FROM deals d JOIN users u ON u.id = d.owner_id
       WHERE d.organization_id = $1 AND d.owner_id = $2 AND d.stage NOT IN ('Won','Lost')
       ORDER BY d.updated_at ASC LIMIT 20`,
      [organizationId, ownerId]
    ),
    pool.query(
      `SELECT c.*, u.name AS owner_name
       FROM customers c JOIN users u ON u.id = c.owner_id
       WHERE c.organization_id = $1 AND c.owner_id = $2
       ORDER BY c.updated_at ASC LIMIT 10`,
      [organizationId, ownerId]
    ),
  ]);

  const recommendations = [];

  // Process leads
  for (const lead of leadsRes.rows) {
    const [actRes, noteRes, dealRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS cnt FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`, [organizationId, ownerId, `%${lead.name}%`]),
      pool.query(`SELECT COUNT(*) AS cnt FROM notes WHERE organization_id = $1 AND author_id = $2 AND related_to ILIKE $3`, [organizationId, ownerId, `%${lead.name}%`]),
      pool.query(`SELECT COUNT(*) AS cnt FROM deals WHERE organization_id = $1 AND owner_id = $2 AND company ILIKE $3`, [organizationId, ownerId, `%${lead.company}%`]),
    ]);
    const nextAction = getLeadNextAction(lead, parseInt(actRes.rows[0].cnt), parseInt(noteRes.rows[0].cnt), parseInt(dealRes.rows[0].cnt) > 0);
    recommendations.push({ entityType: "lead", entityId: lead.id, entityName: lead.name, entityLabel: lead.company, ...nextAction });
  }

  // Process deals
  for (const deal of dealsRes.rows) {
    const [actRes, quoteRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS cnt FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`, [organizationId, ownerId, `%${deal.title}%`]),
      pool.query(`SELECT COUNT(*) AS cnt FROM quotes WHERE organization_id = $1 AND deal_id = $2`, [organizationId, deal.id]).catch(() => ({ rows: [{ cnt: 0 }] })),
    ]);
    const nextAction = getDealNextAction(deal, parseInt(actRes.rows[0].cnt), parseInt(quoteRes.rows[0].cnt) > 0);
    recommendations.push({ entityType: "deal", entityId: deal.id, entityName: deal.title, entityLabel: deal.company, ...nextAction });
  }

  // Process customers
  for (const customer of customersRes.rows) {
    const lastActRes = await pool.query(
      `SELECT MAX(occurred_at) AS last FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`,
      [organizationId, ownerId, `%${customer.name}%`]
    );
    const lastActivity = lastActRes.rows[0].last;
    const daysSince = lastActivity ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) : null;
    const nextAction = getCustomerNextAction(customer, daysSince);
    recommendations.push({ entityType: "customer", entityId: customer.id, entityName: customer.name, entityLabel: customer.company, ...nextAction });
  }

  // Sort by priority: high → medium → low, then by last updated (stalest first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));

  return recommendations.slice(0, 10);
};

/**
 * Get next action for a specific lead.
 */
const getLeadNextActionById = async (leadId, organizationId, ownerId) => {
  const leadRes = await pool.query(
    `SELECT * FROM leads WHERE id = $1 AND organization_id = $2 AND owner_id = $3`,
    [leadId, organizationId, ownerId]
  );
  if (leadRes.rows.length === 0) {
    const err = new Error("Lead not found"); err.statusCode = 404; throw err;
  }
  const lead = leadRes.rows[0];
  const [actRes, noteRes, dealRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS cnt FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`, [organizationId, ownerId, `%${lead.name}%`]),
    pool.query(`SELECT COUNT(*) AS cnt FROM notes WHERE organization_id = $1 AND author_id = $2 AND related_to ILIKE $3`, [organizationId, ownerId, `%${lead.name}%`]),
    pool.query(`SELECT COUNT(*) AS cnt FROM deals WHERE organization_id = $1 AND owner_id = $2 AND company ILIKE $3`, [organizationId, ownerId, `%${lead.company}%`]),
  ]);
  return getLeadNextAction(lead, parseInt(actRes.rows[0].cnt), parseInt(noteRes.rows[0].cnt), parseInt(dealRes.rows[0].cnt) > 0);
};

/**
 * Get next action for a specific deal.
 */
const getDealNextActionById = async (dealId, organizationId, ownerId) => {
  const dealRes = await pool.query(
    `SELECT * FROM deals WHERE id = $1 AND organization_id = $2 AND owner_id = $3`,
    [dealId, organizationId, ownerId]
  );
  if (dealRes.rows.length === 0) {
    const err = new Error("Deal not found"); err.statusCode = 404; throw err;
  }
  const deal = dealRes.rows[0];
  const [actRes, quoteRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS cnt FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`, [organizationId, ownerId, `%${deal.title}%`]),
    pool.query(`SELECT COUNT(*) AS cnt FROM quotes WHERE organization_id = $1 AND deal_id = $2`, [organizationId, deal.id]).catch(() => ({ rows: [{ cnt: 0 }] })),
  ]);
  return getDealNextAction(deal, parseInt(actRes.rows[0].cnt), parseInt(quoteRes.rows[0].cnt) > 0);
};

/**
 * Get next action for a specific customer.
 */
const getCustomerNextActionById = async (customerId, organizationId, ownerId) => {
  const custRes = await pool.query(
    `SELECT * FROM customers WHERE id = $1 AND organization_id = $2 AND owner_id = $3`,
    [customerId, organizationId, ownerId]
  );
  if (custRes.rows.length === 0) {
    const err = new Error("Customer not found"); err.statusCode = 404; throw err;
  }
  const customer = custRes.rows[0];
  const lastActRes = await pool.query(
    `SELECT MAX(occurred_at) AS last FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`,
    [organizationId, ownerId, `%${customer.name}%`]
  );
  const lastActivity = lastActRes.rows[0].last;
  const daysSince = lastActivity ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) : null;
  return getCustomerNextAction(customer, daysSince);
};

module.exports = {
  getTopNextActions,
  getLeadNextActionById,
  getDealNextActionById,
  getCustomerNextActionById,
};
