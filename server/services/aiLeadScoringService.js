const pool = require("../config/db");

// Source quality weights (max 30 pts)
const SOURCE_SCORES = {
  Referral: 30,
  Website: 22,
  Event: 18,
  "Social Media": 15,
  Advertisement: 12,
  "Cold Call": 8,
};

// Status progression weights (max 25 pts)
const STATUS_SCORES = {
  Converted: 25,
  Qualified: 20,
  Contacted: 13,
  New: 8,
  Unqualified: 0,
};

/**
 * Score a single lead (0-100).
 * Factors:
 *   source_score   0-30  (lead source quality)
 *   status_score   0-25  (current pipeline stage)
 *   value_score    0-25  (deal value vs org average)
 *   activity_score 0-20  (notes + activities logged)
 */
const scoreLead = async (lead, avgValue, activityCount, noteCount) => {
  const sourceScore = SOURCE_SCORES[lead.source] ?? 5;
  const statusScore = STATUS_SCORES[lead.status] ?? 5;

  // Value relative to org average
  let valueScore = 0;
  if (avgValue > 0 && lead.value > 0) {
    const ratio = lead.value / avgValue;
    valueScore = Math.min(25, Math.round(ratio * 12.5));
  } else if (lead.value > 0) {
    valueScore = 10;
  }

  // Engagement: notes + activities (capped at 20)
  const engagementTotal = (activityCount || 0) + (noteCount || 0);
  const activityScore = Math.min(20, engagementTotal * 4);

  const total = sourceScore + statusScore + valueScore + activityScore;
  const score = Math.min(100, Math.max(0, total));

  const label = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";

  return {
    score,
    label,
    factors: {
      sourceScore,
      statusScore,
      valueScore,
      activityScore,
    },
  };
};

/**
 * Score a single lead by ID and persist result.
 */
const scoreLeadById = async (leadId, organizationId, ownerId) => {
  // Fetch lead
  const leadRes = await pool.query(
    `SELECT * FROM leads WHERE id = $1 AND organization_id = $2 AND owner_id = $3`,
    [leadId, organizationId, ownerId]
  );
  if (leadRes.rows.length === 0) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }
  const lead = leadRes.rows[0];

  // Org average lead value
  const avgRes = await pool.query(
    `SELECT COALESCE(AVG(value), 0) AS avg FROM leads WHERE organization_id = $1 AND owner_id = $2`,
    [organizationId, ownerId]
  );
  const avgValue = Number(avgRes.rows[0].avg);

  // Activity count for this lead
  const actRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`,
    [organizationId, ownerId, `%${lead.name}%`]
  );
  const activityCount = parseInt(actRes.rows[0].cnt);

  // Note count for this lead
  const noteRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM notes WHERE organization_id = $1 AND author_id = $2 AND related_to ILIKE $3`,
    [organizationId, ownerId, `%${lead.name}%`]
  );
  const noteCount = parseInt(noteRes.rows[0].cnt);

  const result = await scoreLead(lead, avgValue, activityCount, noteCount);

  // Persist score back to leads table
  await pool.query(
    `UPDATE leads
     SET ai_score = $1, ai_score_label = $2, ai_score_factors = $3, ai_score_updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [result.score, result.label, JSON.stringify(result.factors), leadId]
  );

  return {
    leadId: parseInt(leadId),
    leadName: lead.name,
    score: result.score,
    label: result.label,
    factors: result.factors,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Score ALL leads for an employee and persist results.
 */
const scoreAllLeads = async (organizationId, ownerId) => {
  const leadsRes = await pool.query(
    `SELECT * FROM leads WHERE organization_id = $1 AND owner_id = $2`,
    [organizationId, ownerId]
  );
  const leads = leadsRes.rows;
  if (leads.length === 0) return { scored: 0, results: [] };

  const avgRes = await pool.query(
    `SELECT COALESCE(AVG(value), 0) AS avg FROM leads WHERE organization_id = $1 AND owner_id = $2`,
    [organizationId, ownerId]
  );
  const avgValue = Number(avgRes.rows[0].avg);

  const results = [];
  for (const lead of leads) {
    const actRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`,
      [organizationId, ownerId, `%${lead.name}%`]
    );
    const activityCount = parseInt(actRes.rows[0].cnt);

    const noteRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM notes WHERE organization_id = $1 AND author_id = $2 AND related_to ILIKE $3`,
      [organizationId, ownerId, `%${lead.name}%`]
    );
    const noteCount = parseInt(noteRes.rows[0].cnt);

    const scored = await scoreLead(lead, avgValue, activityCount, noteCount);

    await pool.query(
      `UPDATE leads
       SET ai_score = $1, ai_score_label = $2, ai_score_factors = $3, ai_score_updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [scored.score, scored.label, JSON.stringify(scored.factors), lead.id]
    );

    results.push({
      leadId: lead.id,
      leadName: lead.name,
      score: scored.score,
      label: scored.label,
    });
  }

  return { scored: results.length, results };
};

module.exports = { scoreLeadById, scoreAllLeads };
