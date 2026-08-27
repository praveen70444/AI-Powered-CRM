const pool = require("../config/db");

// GET /api/employee/analytics/overview
const getAnalyticsOverview = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const period = parseInt(req.query.period) || 30;

    const [
      leadStats, dealStats, customerStats, taskStats,
      conversionRate, pipelineValue, wonDealsThisPeriod,
      leadsBySource, dealsByStage, revenueByMonth,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'New') as new_leads,
                COUNT(*) FILTER (WHERE status = 'Converted') as converted,
                COUNT(*) FILTER (WHERE created_at > NOW() - ($3 || ' days')::INTERVAL) as new_this_period
         FROM leads WHERE organization_id = $1 AND owner_id = $2`,
        [organizationId, userId, period]
      ),
      pool.query(
        `SELECT COUNT(*) as total,
                SUM(value) as pipeline_value,
                COUNT(*) FILTER (WHERE stage = 'Won') as won,
                COUNT(*) FILTER (WHERE stage = 'Lost') as lost,
                SUM(value) FILTER (WHERE stage = 'Won') as won_value
         FROM deals WHERE organization_id = $1 AND owner_id = $2`,
        [organizationId, userId]
      ),
      pool.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'Active') as active,
                COUNT(*) FILTER (WHERE status = 'At Risk') as at_risk,
                SUM(total_spend) as total_revenue
         FROM customers WHERE organization_id = $1 AND owner_id = $2`,
        [organizationId, userId]
      ),
      pool.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'Completed') as completed,
                COUNT(*) FILTER (WHERE status = 'Pending' AND due_date < CURRENT_DATE) as overdue
         FROM tasks WHERE organization_id = $1 AND owner_id = $2`,
        [organizationId, userId]
      ),
      pool.query(
        `SELECT ROUND(COUNT(*) FILTER (WHERE status = 'Converted') * 100.0 / NULLIF(COUNT(*), 0), 1) as rate
         FROM leads WHERE organization_id = $1 AND owner_id = $2`,
        [organizationId, userId]
      ),
      pool.query(
        `SELECT SUM(value) as value FROM deals
         WHERE organization_id = $1 AND owner_id = $2 AND stage NOT IN ('Won', 'Lost')`,
        [organizationId, userId]
      ),
      pool.query(
        `SELECT COUNT(*) as count, SUM(value) as value FROM deals
         WHERE organization_id = $1 AND owner_id = $2 AND stage = 'Won'
           AND updated_at > NOW() - ($3 || ' days')::INTERVAL`,
        [organizationId, userId, period]
      ),
      pool.query(
        `SELECT source, COUNT(*) as count FROM leads
         WHERE organization_id = $1 AND owner_id = $2 AND source IS NOT NULL
         GROUP BY source ORDER BY count DESC`,
        [organizationId, userId]
      ),
      pool.query(
        `SELECT stage, COUNT(*) as count, SUM(value) as value FROM deals
         WHERE organization_id = $1 AND owner_id = $2
         GROUP BY stage ORDER BY count DESC`,
        [organizationId, userId]
      ),
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', customer_since), 'Mon YY') as month,
                COUNT(*) as new_customers, SUM(total_spend) as revenue
         FROM customers WHERE organization_id = $1 AND owner_id = $2
           AND customer_since >= CURRENT_DATE - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', customer_since)
         ORDER BY DATE_TRUNC('month', customer_since)`,
        [organizationId, userId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        leads: leadStats.rows[0],
        deals: dealStats.rows[0],
        customers: customerStats.rows[0],
        tasks: taskStats.rows[0],
        conversionRate: parseFloat(conversionRate.rows[0].rate) || 0,
        activePipelineValue: Number(pipelineValue.rows[0].value) || 0,
        wonDealsThisPeriod: wonDealsThisPeriod.rows[0],
        charts: {
          leadsBySource: leadsBySource.rows,
          dealsByStage: dealsByStage.rows,
          revenueByMonth: revenueByMonth.rows,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch analytics overview" });
  }
};

// GET /api/employee/analytics/forecast
const getSalesForecast = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const STAGE_PROBABILITY = { New: 0.1, Qualified: 0.25, Proposal: 0.5, Negotiation: 0.75, Won: 1.0, Lost: 0 };

    const [pipelineResult, closingResult] = await Promise.all([
      pool.query(
        `SELECT stage, SUM(value) as total_value, COUNT(*) as count FROM deals
         WHERE organization_id = $1 AND owner_id = $2 AND stage NOT IN ('Won', 'Lost')
         GROUP BY stage`,
        [organizationId, userId]
      ),
      pool.query(
        `SELECT COUNT(*) as count, SUM(value) as value FROM deals
         WHERE organization_id = $1 AND owner_id = $2 AND stage NOT IN ('Won', 'Lost')
           AND close_date >= DATE_TRUNC('month', CURRENT_DATE)
           AND close_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
        [organizationId, userId]
      ),
    ]);

    let weightedForecast = 0;
    const stageBreakdown = pipelineResult.rows.map((row) => {
      const probability = STAGE_PROBABILITY[row.stage] || 0;
      const weighted = Number(row.total_value) * probability;
      weightedForecast += weighted;
      return {
        stage: row.stage,
        totalValue: Number(row.total_value),
        count: parseInt(row.count),
        probability: probability * 100,
        weightedValue: weighted,
      };
    });

    res.json({
      success: true,
      data: {
        weightedForecast,
        stageBreakdown,
        closingThisMonth: closingResult.rows[0],
        confidence: weightedForecast > 0 ? "medium" : "low",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch sales forecast" });
  }
};

// GET /api/employee/analytics/win-loss
const getWinLossAnalysis = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const period = parseInt(req.query.period) || 90;

    const [winLoss, winRate, avgDealSize, avgSalesCycle] = await Promise.all([
      pool.query(
        `SELECT stage, COUNT(*) as count, SUM(value) as value FROM deals
         WHERE organization_id = $1 AND owner_id = $2 AND stage IN ('Won', 'Lost')
           AND updated_at > NOW() - ($3 || ' days')::INTERVAL
         GROUP BY stage`,
        [organizationId, userId, period]
      ),
      pool.query(
        `SELECT ROUND(COUNT(*) FILTER (WHERE stage = 'Won') * 100.0 / NULLIF(COUNT(*), 0), 1) as rate
         FROM deals WHERE organization_id = $1 AND owner_id = $2 AND stage IN ('Won', 'Lost')
           AND updated_at > NOW() - ($3 || ' days')::INTERVAL`,
        [organizationId, userId, period]
      ),
      pool.query(
        `SELECT ROUND(AVG(value), 2) as avg FROM deals
         WHERE organization_id = $1 AND owner_id = $2 AND stage = 'Won'
           AND updated_at > NOW() - ($3 || ' days')::INTERVAL`,
        [organizationId, userId, period]
      ),
      pool.query(
        `SELECT ROUND(AVG(EXTRACT(DAY FROM (updated_at - created_at))), 0) as avg_days FROM deals
         WHERE organization_id = $1 AND owner_id = $2 AND stage = 'Won'`,
        [organizationId, userId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        winLoss: winLoss.rows,
        winRate: parseFloat(winRate.rows[0].rate) || 0,
        avgDealSize: Number(avgDealSize.rows[0].avg) || 0,
        avgSalesCycleDays: parseInt(avgSalesCycle.rows[0].avg_days) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch win/loss analysis" });
  }
};

module.exports = { getAnalyticsOverview, getSalesForecast, getWinLossAnalysis };
