const pool = require("../config/db");

// Stage probability weights for health scoring
const STAGE_WEIGHTS = {
  New: 10,
  Qualified: 25,
  Proposal: 45,
  Negotiation: 65,
  Won: 100,
  Lost: 0,
};

/**
 * Compute health score (0-100) and risk flags for a single deal row.
 */
const computeDealHealth = (deal, activityCount, noteCount) => {
  const stageBase = STAGE_WEIGHTS[deal.stage] ?? 10;

  // Days since last update
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Days to close date
  let daysToClose = null;
  if (deal.close_date) {
    daysToClose = Math.floor(
      (new Date(deal.close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  // Engagement bonus/penalty
  const engagementBonus = Math.min(15, (activityCount + noteCount) * 3);

  // Staleness penalty
  let stalenessPenalty = 0;
  if (daysSinceUpdate > 14) stalenessPenalty = 20;
  else if (daysSinceUpdate > 7) stalenessPenalty = 10;

  // Urgency adjustment
  let urgencyAdjustment = 0;
  if (daysToClose !== null) {
    if (daysToClose < 0) urgencyAdjustment = -15; // overdue
    else if (daysToClose <= 3) urgencyAdjustment = 5; // close soon — small bonus
  }

  const raw = stageBase + engagementBonus - stalenessPenalty + urgencyAdjustment;
  const healthScore = Math.min(100, Math.max(0, Math.round(raw)));
  const healthLabel = healthScore >= 70 ? "Healthy" : healthScore >= 40 ? "At Risk" : "Critical";

  // Risk flags
  const riskFlags = [];
  if (daysSinceUpdate > 7 && !["Won", "Lost"].includes(deal.stage)) {
    riskFlags.push({ type: "stale", message: `No activity in ${daysSinceUpdate} days` });
  }
  if (daysToClose !== null && daysToClose < 0 && !["Won", "Lost"].includes(deal.stage)) {
    riskFlags.push({ type: "overdue", message: `Close date passed ${Math.abs(daysToClose)} days ago` });
  }
  if (activityCount === 0 && noteCount === 0 && !["Won", "Lost"].includes(deal.stage)) {
    riskFlags.push({ type: "no_contact", message: "No activities or notes logged" });
  }
  if (daysToClose !== null && daysToClose <= 7 && daysToClose >= 0 && !["Won", "Lost"].includes(deal.stage)) {
    riskFlags.push({ type: "closing_soon", message: `Closes in ${daysToClose} day${daysToClose === 1 ? "" : "s"}` });
  }

  return { healthScore, healthLabel, riskFlags };
};

/**
 * Score a single deal by ID and persist.
 */
const scoreDealById = async (dealId, organizationId, ownerId) => {
  const dealRes = await pool.query(
    `SELECT * FROM deals WHERE id = $1 AND organization_id = $2 AND owner_id = $3`,
    [dealId, organizationId, ownerId]
  );
  if (dealRes.rows.length === 0) {
    const err = new Error("Deal not found");
    err.statusCode = 404;
    throw err;
  }
  const deal = dealRes.rows[0];

  const actRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`,
    [organizationId, ownerId, `%${deal.title}%`]
  );
  const noteRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM notes WHERE organization_id = $1 AND author_id = $2 AND related_to ILIKE $3`,
    [organizationId, ownerId, `%${deal.title}%`]
  );

  const { healthScore, healthLabel, riskFlags } = computeDealHealth(
    deal,
    parseInt(actRes.rows[0].cnt),
    parseInt(noteRes.rows[0].cnt)
  );

  await pool.query(
    `UPDATE deals
     SET ai_health_score = $1, ai_health_label = $2, ai_risk_flags = $3, ai_health_updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [healthScore, healthLabel, JSON.stringify(riskFlags), dealId]
  );

  return {
    dealId: parseInt(dealId),
    dealTitle: deal.title,
    healthScore,
    healthLabel,
    riskFlags,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Score ALL deals for an employee and return summary.
 */
const scoreDealsSummary = async (organizationId, ownerId) => {
  const dealsRes = await pool.query(
    `SELECT * FROM deals WHERE organization_id = $1 AND owner_id = $2 AND stage NOT IN ('Won','Lost')`,
    [organizationId, ownerId]
  );
  const deals = dealsRes.rows;
  if (deals.length === 0) return { scored: 0, atRisk: [], summary: {} };

  const results = [];
  for (const deal of deals) {
    const actRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM activities WHERE organization_id = $1 AND owner_id = $2 AND related_to ILIKE $3`,
      [organizationId, ownerId, `%${deal.title}%`]
    );
    const noteRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM notes WHERE organization_id = $1 AND author_id = $2 AND related_to ILIKE $3`,
      [organizationId, ownerId, `%${deal.title}%`]
    );

    const { healthScore, healthLabel, riskFlags } = computeDealHealth(
      deal,
      parseInt(actRes.rows[0].cnt),
      parseInt(noteRes.rows[0].cnt)
    );

    await pool.query(
      `UPDATE deals
       SET ai_health_score = $1, ai_health_label = $2, ai_risk_flags = $3, ai_health_updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [healthScore, healthLabel, JSON.stringify(riskFlags), deal.id]
    );

    results.push({
      dealId: deal.id,
      dealTitle: deal.title,
      stage: deal.stage,
      value: Number(deal.value),
      healthScore,
      healthLabel,
      riskFlags,
    });
  }

  const atRisk = results
    .filter((r) => r.healthLabel !== "Healthy")
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5);

  return {
    scored: results.length,
    atRisk,
    summary: {
      healthy: results.filter((r) => r.healthLabel === "Healthy").length,
      atRisk: results.filter((r) => r.healthLabel === "At Risk").length,
      critical: results.filter((r) => r.healthLabel === "Critical").length,
    },
  };
};

module.exports = { scoreDealById, scoreDealsSummary };
