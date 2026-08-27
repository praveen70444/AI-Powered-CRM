const pool = require("../config/db");

const checkLeadDuplicate = async (req, res) => {
  try {
    const { email, phone, excludeId } = req.query;
    const { organizationId, userId } = req.user;

    const conditions = [];
    const params = [organizationId, userId];
    let idx = 3;

    if (email) {
      conditions.push(`LOWER(email) = LOWER($${idx})`);
      params.push(email);
      idx++;
    }
    if (phone) {
      conditions.push(`phone = $${idx}`);
      params.push(phone);
      idx++;
    }

    if (!conditions.length) {
      return res.json({ success: true, data: { duplicates: [] } });
    }

    let query = `SELECT id, name, company, email, phone FROM leads
                 WHERE organization_id = $1 AND owner_id = $2
                   AND (${conditions.join(" OR ")})`;

    if (excludeId) {
      query += ` AND id != $${idx}`;
      params.push(excludeId);
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: { duplicates: result.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Duplicate check failed" });
  }
};

const checkCustomerDuplicate = async (req, res) => {
  try {
    const { email, phone, excludeId } = req.query;
    const { organizationId, userId } = req.user;

    const conditions = [];
    const params = [organizationId, userId];
    let idx = 3;

    if (email) {
      conditions.push(`LOWER(email) = LOWER($${idx})`);
      params.push(email);
      idx++;
    }
    if (phone) {
      conditions.push(`phone = $${idx}`);
      params.push(phone);
      idx++;
    }

    if (!conditions.length) {
      return res.json({ success: true, data: { duplicates: [] } });
    }

    let query = `SELECT id, name, company, email, phone FROM customers
                 WHERE organization_id = $1 AND owner_id = $2
                   AND (${conditions.join(" OR ")})`;

    if (excludeId) {
      query += ` AND id != $${idx}`;
      params.push(excludeId);
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: { duplicates: result.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Duplicate check failed" });
  }
};

module.exports = { checkLeadDuplicate, checkCustomerDuplicate };
