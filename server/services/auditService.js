const pool = require('../config/db');

/**
 * Log an action to audit trail
 */
async function logAudit({
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  ipAddress,
  userAgent,
}) {
  const query = `
    INSERT INTO audit_logs (
      organization_id, user_id, action, entity_type, entity_id,
      old_values, new_values, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `;
  
  const values = [
    organizationId || null,
    userId || null,
    action,
    entityType || null,
    entityId || null,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    ipAddress || null,
    userAgent || null,
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Log login attempt
 */
async function logLogin({
  userId,
  success,
  failureReason,
  ipAddress,
  userAgent,
}) {
  const query = `
    INSERT INTO login_history (
      user_id, success, failure_reason, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  
  const values = [
    userId || null,
    success,
    failureReason || null,
    ipAddress || null,
    userAgent || null,
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get audit logs for an entity
 */
async function getEntityAuditLogs(entityType, entityId, organizationId, limit = 50) {
  const query = `
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.entity_type = $1 AND al.entity_id = $2 AND al.organization_id = $3
    ORDER BY al.created_at DESC
    LIMIT $4
  `;
  
  const result = await pool.query(query, [entityType, entityId, organizationId, limit]);
  return result.rows;
}

/**
 * Get user audit logs
 */
async function getUserAuditLogs(userId, limit = 100) {
  const query = `
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.user_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2
  `;
  
  const result = await pool.query(query, [userId, limit]);
  return result.rows;
}

/**
 * Get organization audit logs
 */
async function getOrganizationAuditLogs(organizationId, limit = 100, offset = 0) {
  const query = `
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.organization_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const result = await pool.query(query, [organizationId, limit, offset]);
  return result.rows;
}

/**
 * Get login history for a user
 */
async function getUserLoginHistory(userId, limit = 50) {
  const query = `
    SELECT *
    FROM login_history
    WHERE user_id = $1
    ORDER BY logged_in_at DESC
    LIMIT $2
  `;
  
  const result = await pool.query(query, [userId, limit]);
  return result.rows;
}

/**
 * Audit middleware - extract IP and User-Agent
 */
function auditMiddleware(req, res, next) {
  req.auditInfo = {
    ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
  next();
}

module.exports = {
  logAudit,
  logLogin,
  getEntityAuditLogs,
  getUserAuditLogs,
  getOrganizationAuditLogs,
  getUserLoginHistory,
  auditMiddleware,
};
