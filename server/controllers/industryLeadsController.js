const pool = require("../config/db");

const getTableName = (type) => {
  if (type === 'construction') return 'construction_leads';
  if (type === 'redevelopment') return 'redevelopment_leads';
  if (type === 'maintenance') return 'maintenance_leads';
  return null;
};

const getLeads = async (req, res) => {
  try {
    const { type } = req.params;
    const tableName = getTableName(type);
    if (!tableName) return res.status(400).json({ success: false, message: "Invalid lead type" });

    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE organization_id = $1 ORDER BY created_at DESC`,
      [req.user.organizationId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(`Error fetching ${req.params.type} leads:`, error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createLead = async (req, res) => {
  try {
    const { type } = req.params;
    const tableName = getTableName(type);
    if (!tableName) return res.status(400).json({ success: false, message: "Invalid lead type" });

    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    
    // Add org and owner
    fields.push('organization_id', 'owner_id');
    values.push(req.user.organizationId, req.user.id);

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(`Error creating ${req.params.type} lead:`, error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateLead = async (req, res) => {
  try {
    const { type, id } = req.params;
    const tableName = getTableName(type);
    if (!tableName) return res.status(400).json({ success: false, message: "Invalid lead type" });

    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(id, req.user.organizationId);

    const query = `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length - 1} AND organization_id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(`Error updating ${req.params.type} lead:`, error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { type, id } = req.params;
    const tableName = getTableName(type);
    if (!tableName) return res.status(400).json({ success: false, message: "Invalid lead type" });

    const result = await pool.query(
      `DELETE FROM ${tableName} WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    console.error(`Error deleting ${req.params.type} lead:`, error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getLeads,
  createLead,
  updateLead,
  deleteLead
};
