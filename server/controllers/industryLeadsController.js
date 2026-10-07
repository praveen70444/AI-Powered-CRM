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
    values.push(req.user.organizationId, req.user.userId);

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

// --- Follow-ups ---

const getFollowups = async (req, res) => {
  try {
    const { type, id } = req.params;
    const result = await pool.query(
      `SELECT f.*, u.name as author 
       FROM industry_lead_followups f
       LEFT JOIN users u ON f.author_id = u.id
       WHERE f.lead_id = $1 AND f.lead_type = $2
       ORDER BY f.created_at DESC`,
      [id, type]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching followups:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createFollowup = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { note, followupDate, nextFollowupDate } = req.body;
    
    const result = await pool.query(
      `INSERT INTO industry_lead_followups (lead_id, lead_type, author_id, note, followup_date, next_followup_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, type, req.user.userId, note, followupDate || null, nextFollowupDate || null]
    );

    const userRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [req.user.userId]);
    const followup = result.rows[0];
    followup.author = userRes.rows[0]?.name;

    res.status(201).json({ success: true, data: followup });
  } catch (error) {
    console.error("Error creating followup:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateFollowup = async (req, res) => {
  try {
    const { id } = req.params; // followup id
    const { note, followupDate, nextFollowupDate } = req.body;
    
    const result = await pool.query(
      `UPDATE industry_lead_followups
       SET note = $1, followup_date = $2, next_followup_date = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [note, followupDate || null, nextFollowupDate || null, id]
    );

    const userRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [result.rows[0].author_id]);
    const followup = result.rows[0];
    followup.author = userRes.rows[0]?.name;

    res.json({ success: true, data: followup });
  } catch (error) {
    console.error("Error updating followup:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteFollowup = async (req, res) => {
  try {
    const { id } = req.params; // followup id
    await pool.query(`DELETE FROM industry_lead_followups WHERE id = $1`, [id]);
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Error deleting followup:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const convertLead = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { industry, notes, createDeal, dealTitle, dealValue } = req.body;
    const tableName = getTableName(type);
    if (!tableName) return res.status(400).json({ success: false, message: "Invalid lead type" });

    // 1. Get lead
    const leadRes = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 AND organization_id = $2`, [id, req.user.organizationId]);
    const lead = leadRes.rows[0];
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    if (lead.status === 'Converted') return res.status(400).json({ success: false, message: "Already converted" });

    await pool.query("BEGIN");

    // 2. Create customer
    const custRes = await pool.query(
      `INSERT INTO customers (organization_id, owner_id, name, email, phone, company, industry, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.organizationId, req.user.userId, lead.name, null, lead.whatsapp_number, null, industry || type, 'Active', notes || null]
    );
    const customer = custRes.rows[0];

    // 3. Update lead status
    await pool.query(`UPDATE ${tableName} SET status = 'Converted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

    // 4. Optionally create deal
    let deal = null;
    if (createDeal) {
      const dealRes = await pool.query(
        `INSERT INTO deals (organization_id, owner_id, customer_id, title, value, stage)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.organizationId, req.user.userId, customer.id, dealTitle, dealValue || 0, 'Discovery']
      );
      deal = dealRes.rows[0];
    }

    await pool.query("COMMIT");
    res.json({ success: true, data: { customer, deal } });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error converting industry lead:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  getFollowups,
  createFollowup,
  updateFollowup,
  deleteFollowup,
  convertLead
};
