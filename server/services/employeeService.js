const pool = require("../config/db");
const getEmployeeProfile = async (userId, organizationId) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.organization_id,
      u.name,
      u.email,
      u.role,
      u.status,
      u.phone,
      u.department,
      u.location,
      u.created_at,
      u.last_login_at,
      o.name AS organization_name
    FROM users u
    JOIN organizations o
      ON o.id = u.organization_id
    WHERE u.id = $1
      AND u.organization_id = $2
    `,
    [userId, organizationId]
  );
  if (result.rows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};
const updateEmployeeProfile = async (userId, organizationId, { name, phone, department, location }) => {
  const result = await pool.query(
    `
    UPDATE users
    SET
      name = $1,
      phone = $2,
      department = $3,
      location = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
      AND organization_id = $6
    RETURNING id
    `,
    [name, phone || null, department || null, location || null, userId, organizationId]
  );
  if (result.rows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return getEmployeeProfile(userId, organizationId);
};
const getEmployeeDashboard = async (userId, organizationId) => {
  const profileResult = await pool.query(
    `
    SELECT id, name, email, role, status, created_at
    FROM users
    WHERE id = $1
      AND organization_id = $2
    `,
    [userId, organizationId]
  );
  if (profileResult.rows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const orgRes = await pool.query(`SELECT industry FROM organizations WHERE id = $1`, [organizationId]);
  const industry = orgRes.rows[0]?.industry;
  const isConstruction = industry === 'Construction';

  let summaryQuery = ``;
  if (isConstruction) {
    summaryQuery = `
    SELECT
      ((SELECT COUNT(*) FROM construction_leads WHERE organization_id = $1 AND owner_id = $2) +
       (SELECT COUNT(*) FROM redevelopment_leads WHERE organization_id = $1 AND owner_id = $2) +
       (SELECT COUNT(*) FROM maintenance_leads WHERE organization_id = $1 AND owner_id = $2)) AS total_leads,
      ((SELECT COUNT(*) FROM construction_leads WHERE organization_id = $1 AND owner_id = $2 AND status = 'New') +
       (SELECT COUNT(*) FROM redevelopment_leads WHERE organization_id = $1 AND owner_id = $2 AND status = 'New') +
       (SELECT COUNT(*) FROM maintenance_leads WHERE organization_id = $1 AND owner_id = $2 AND status = 'New')) AS new_leads,
      (SELECT COUNT(*) FROM customers WHERE organization_id = $1 AND owner_id = $2) AS total_customers,
      (SELECT COUNT(*) FROM deals WHERE organization_id = $1 AND owner_id = $2 AND stage NOT IN ('Won', 'Lost')) AS active_deals,
      (SELECT COUNT(*) FROM tasks WHERE organization_id = $1 AND owner_id = $2 AND status != 'Completed') AS pending_tasks,
      (SELECT COUNT(*) FROM deals WHERE organization_id = $1 AND owner_id = $2 AND stage = 'Won') AS won_deals,
      (SELECT COALESCE(SUM(value), 0) FROM deals WHERE organization_id = $1 AND owner_id = $2 AND stage = 'Won') AS revenue
    `;
  } else {
    summaryQuery = `
    SELECT
      (SELECT COUNT(*) FROM leads WHERE organization_id = $1 AND owner_id = $2) AS total_leads,
      (SELECT COUNT(*) FROM leads WHERE organization_id = $1 AND owner_id = $2 AND status = 'New') AS new_leads,
      (SELECT COUNT(*) FROM customers WHERE organization_id = $1 AND owner_id = $2) AS total_customers,
      (SELECT COUNT(*) FROM deals WHERE organization_id = $1 AND owner_id = $2 AND stage NOT IN ('Won', 'Lost')) AS active_deals,
      (SELECT COUNT(*) FROM tasks WHERE organization_id = $1 AND owner_id = $2 AND status != 'Completed') AS pending_tasks,
      (SELECT COUNT(*) FROM deals WHERE organization_id = $1 AND owner_id = $2 AND stage = 'Won') AS won_deals,
      (SELECT COALESCE(SUM(value), 0) FROM deals WHERE organization_id = $1 AND owner_id = $2 AND stage = 'Won') AS revenue
    `;
  }

  const summaryResult = await pool.query(summaryQuery, [organizationId, userId]);
  const summaryRow = summaryResult.rows[0];

  let leadsBySourceResult;
  if (isConstruction) {
    // Return empty for source since industry leads don't have source
    leadsBySourceResult = { rows: [] };
  } else {
    leadsBySourceResult = await pool.query(
      `
      SELECT source, COUNT(*) AS count
      FROM leads
      WHERE organization_id = $1
        AND owner_id = $2
        AND source IS NOT NULL
      GROUP BY source
      `,
      [organizationId, userId]
    );
  }
  const dealsByStageResult = await pool.query(
    `
    SELECT stage, COUNT(*) AS count
    FROM deals
    WHERE organization_id = $1
      AND owner_id = $2
    GROUP BY stage
    `,
    [organizationId, userId]
  );
  const revenueTrendResult = await pool.query(
    `
    WITH months AS (
      SELECT
        date_trunc('month', CURRENT_DATE) - (n || ' months')::interval AS month_start,
        to_char(date_trunc('month', CURRENT_DATE) - (n || ' months')::interval, 'Mon') AS label
      FROM generate_series(5, 0, -1) AS n
    )
    SELECT
      m.label,
      COALESCE(SUM(d.value), 0) AS revenue
    FROM months m
    LEFT JOIN deals d
      ON d.organization_id = $1
      AND d.owner_id = $2
      AND d.stage = 'Won'
      AND date_trunc('month', COALESCE(d.close_date, d.updated_at::date)) = m.month_start
    GROUP BY m.month_start, m.label
    ORDER BY m.month_start ASC
    `,
    [organizationId, userId]
  );
  const upcomingTasksResult = await pool.query(
    `
    SELECT id, title, related_to, type, priority, status, due_date
    FROM tasks
    WHERE organization_id = $1
      AND owner_id = $2
      AND status != 'Completed'
    ORDER BY due_date ASC NULLS LAST
    LIMIT 10
    `,
    [organizationId, userId]
  );
  const recentActivitiesResult = await pool.query(
    `
    SELECT id, title, related_to, type, occurred_at
    FROM activities
    WHERE organization_id = $1
      AND owner_id = $2
    ORDER BY occurred_at DESC
    LIMIT 5
    `,
    [organizationId, userId]
  );

  // Today's calendar events
  const todayEventsResult = await pool.query(
    `
    SELECT id, title, description, event_type, start_time, end_time, location, status
    FROM calendar_events
    WHERE organization_id = $1
      AND owner_id = $2
      AND start_time::date = CURRENT_DATE
      AND status != 'Cancelled'
    ORDER BY start_time ASC
    `,
    [organizationId, userId]
  );

  return {
    summary: {
      totalLeads: Number(summaryRow.total_leads),
      newLeads: Number(summaryRow.new_leads),
      totalCustomers: Number(summaryRow.total_customers),
      activeDeals: Number(summaryRow.active_deals),
      pendingTasks: Number(summaryRow.pending_tasks),
      wonDeals: Number(summaryRow.won_deals),
      revenue: Number(summaryRow.revenue),
    },
    leadsBySource: leadsBySourceResult.rows.map((row) => ({
      label: row.source,
      value: Number(row.count),
    })),
    dealsByStage: dealsByStageResult.rows.map((row) => ({
      label: row.stage,
      value: Number(row.count),
    })),
    revenueTrend: revenueTrendResult.rows.map((row) => ({
      label: row.label,
      value: Number(row.revenue),
    })),
    upcomingTasks: upcomingTasksResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      relatedTo: row.related_to,
      type: row.type,
      priority: row.priority,
      status: row.status,
      dueDate: row.due_date,
    })),
    recentActivities: recentActivitiesResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      relatedTo: row.related_to,
      type: row.type,
      timestamp: row.occurred_at,
    })),
    todayEvents: todayEventsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      eventType: row.event_type,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.location,
      status: row.status,
    })),
  };
};
module.exports = {
  getEmployeeProfile,
  updateEmployeeProfile,
  getEmployeeDashboard,
};
