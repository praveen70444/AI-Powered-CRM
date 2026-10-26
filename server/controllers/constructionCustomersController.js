const pool = require("../config/db");

// GET /api/employee/construction-customers
const getConstructionCustomers = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { search, property_type } = req.query;

    let query = `SELECT * FROM construction_customers WHERE organization_id = $1`;
    const params = [organizationId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR whatsapp_number ILIKE $${params.length} OR service_project_name ILIKE $${params.length} OR city_pincode ILIKE $${params.length})`;
    }
    if (property_type) { params.push(property_type); query += ` AND property_type = $${params.length}`; }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);

    // Compute amount_pending in app layer
    const rows = result.rows.map(r => ({
      ...r,
      amount_pending: parseFloat(r.deal_value || 0) - parseFloat(r.amount_received || 0),
    }));

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get construction customers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/employee/construction-customers
const createConstructionCustomer = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const {
      name, whatsapp_number, service_project_name, property_type,
      city_pincode, deal_value, amount_received, date_started, date_ended, warranty,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name is required" });

    const dv = parseFloat(deal_value) || 0;
    const ar = parseFloat(amount_received) || 0;

    // Validation
    if (ar > dv) return res.status(400).json({ success: false, message: "Amount Received cannot exceed Deal Value" });
    if (date_started && date_ended && new Date(date_ended) < new Date(date_started)) {
      return res.status(400).json({ success: false, message: "Date Ended cannot be before Date Started" });
    }

    const result = await pool.query(
      `INSERT INTO construction_customers
         (organization_id, owner_id, name, whatsapp_number, service_project_name, property_type,
          city_pincode, deal_value, amount_received, date_started, date_ended, warranty)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        organizationId, userId, name.trim(), whatsapp_number||null,
        service_project_name||null, property_type||null, city_pincode||null,
        dv, ar, date_started||null, date_ended||null, warranty||null,
      ]
    );

    const row = result.rows[0];
    row.amount_pending = parseFloat(row.deal_value) - parseFloat(row.amount_received);

    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error("Create construction customer error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/employee/construction-customers/:id
const updateConstructionCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    const {
      name, whatsapp_number, service_project_name, property_type,
      city_pincode, deal_value, amount_received, date_started, date_ended, warranty,
    } = req.body;

    const dv = parseFloat(deal_value) || 0;
    const ar = parseFloat(amount_received) || 0;

    if (ar > dv) return res.status(400).json({ success: false, message: "Amount Received cannot exceed Deal Value" });
    if (date_started && date_ended && new Date(date_ended) < new Date(date_started)) {
      return res.status(400).json({ success: false, message: "Date Ended cannot be before Date Started" });
    }

    const result = await pool.query(
      `UPDATE construction_customers SET
         name=$1, whatsapp_number=$2, service_project_name=$3, property_type=$4,
         city_pincode=$5, deal_value=$6, amount_received=$7,
         date_started=$8, date_ended=$9, warranty=$10,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 AND organization_id=$12
       RETURNING *`,
      [
        name, whatsapp_number||null, service_project_name||null, property_type||null,
        city_pincode||null, dv, ar, date_started||null, date_ended||null,
        warranty||null, id, organizationId,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });

    const row = result.rows[0];
    row.amount_pending = parseFloat(row.deal_value) - parseFloat(row.amount_received);

    res.json({ success: true, data: row });
  } catch (error) {
    console.error("Update construction customer error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/employee/construction-customers/:id
const deleteConstructionCustomer = async (req, res) => {
  try {
    if (req.user.role !== "ORG_ADMIN") {
      return res.status(403).json({ success: false, message: "Delete permission is restricted to Org Admin" });
    }
    const { id } = req.params;
    const { organizationId } = req.user;

    const result = await pool.query(
      `DELETE FROM construction_customers WHERE id=$1 AND organization_id=$2 RETURNING id`,
      [id, organizationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Delete construction customer error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getConstructionCustomers,
  createConstructionCustomer,
  updateConstructionCustomer,
  deleteConstructionCustomer,
};
