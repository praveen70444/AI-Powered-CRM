const pool = require("../config/db");

// Stage weighted probabilities for pipeline forecasting
const STAGE_PROBABILITY = {
  New: 0.10,
  Qualified: 0.25,
  Proposal: 0.50,
  Negotiation: 0.75,
  Won: 1.00,
  Lost: 0.00,
};

/**
 * Generate revenue forecast for the next N months.
 */
const getRevenueForecast = async (organizationId, ownerId, months = 3) => {
  // Historical actual revenue (last 6 months won deals)
  const historyRes = await pool.query(
    `WITH months AS (
       SELECT
         date_trunc('month', CURRENT_DATE) - (n || ' months')::interval AS month_start,
         to_char(date_trunc('month', CURRENT_DATE) - (n || ' months')::interval, 'Mon YYYY') AS label
       FROM generate_series(5, 1, -1) AS n
     )
     SELECT m.label, COALESCE(SUM(d.value), 0) AS revenue
     FROM months m
     LEFT JOIN deals d
       ON d.organization_id = $1 AND d.owner_id = $2 AND d.stage = 'Won'
       AND date_trunc('month', COALESCE(d.close_date, d.updated_at::date)) = m.month_start
     GROUP BY m.month_start, m.label
     ORDER BY m.month_start ASC`,
    [organizationId, ownerId]
  );

  const historicalRevenue = historyRes.rows.map((r) => ({
    month: r.label,
    actual: Number(r.revenue),
    type: "actual",
  }));

  // Open pipeline deals
  const pipelineRes = await pool.query(
    `SELECT id, title, stage, value, close_date
     FROM deals
     WHERE organization_id = $1 AND owner_id = $2 AND stage NOT IN ('Won','Lost')`,
    [organizationId, ownerId]
  );
  const pipeline = pipelineRes.rows;

  // Build forecast months
  const forecast = [];
  for (let i = 1; i <= months; i++) {
    const targetDate = new Date();
    targetDate.setDate(1);
    targetDate.setMonth(targetDate.getMonth() + i);
    const monthStart = new Date(targetDate);
    const monthEnd = new Date(targetDate);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthLabel = targetDate.toLocaleString("en-IN", { month: "short", year: "numeric" });

    // Deals closing this month (by close_date)
    const closingThisMonth = pipeline.filter((d) => {
      if (!d.close_date) return false;
      const cd = new Date(d.close_date);
      return cd >= monthStart && cd < monthEnd;
    });

    // Also include all open deals for weighted projection (no close date)
    const noDateDeals = pipeline.filter((d) => !d.close_date);

    let weightedRevenue = 0;
    let dealCount = 0;

    for (const d of closingThisMonth) {
      weightedRevenue += Number(d.value) * (STAGE_PROBABILITY[d.stage] ?? 0.1);
      dealCount++;
    }

    // Distribute no-date deals evenly across forecast months
    for (const d of noDateDeals) {
      weightedRevenue += (Number(d.value) * (STAGE_PROBABILITY[d.stage] ?? 0.1)) / months;
    }

    const predicted = Math.round(weightedRevenue);
    const variance = 0.20; // 20% confidence range
    forecast.push({
      month: monthLabel,
      predicted,
      low: Math.round(predicted * (1 - variance)),
      high: Math.round(predicted * (1 + variance)),
      dealsClosing: dealCount,
      type: "forecast",
    });
  }

  // Pipeline metrics
  const totalPipeline = pipeline.reduce((s, d) => s + Number(d.value), 0);
  const weightedPipeline = pipeline.reduce(
    (s, d) => s + Number(d.value) * (STAGE_PROBABILITY[d.stage] ?? 0.1),
    0
  );

  const byStage = {};
  for (const d of pipeline) {
    byStage[d.stage] = (byStage[d.stage] || 0) + Number(d.value);
  }

  return {
    historical: historicalRevenue,
    forecast,
    pipelineSummary: {
      totalPipelineValue: Math.round(totalPipeline),
      weightedPipelineValue: Math.round(weightedPipeline),
      openDealCount: pipeline.length,
      byStage,
    },
    methodology: "weighted_stage_probability",
  };
};

module.exports = { getRevenueForecast };
