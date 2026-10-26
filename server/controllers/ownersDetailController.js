const pool = require("../config/db");

// GET /api/employee/owners-detail
const getOwnersDetail = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { search, person, property_type, purpose } = req.query;

    let query = `
      SELECT od.*, u.name as created_by_name
      FROM owners_detail od
      LEFT JOIN users u ON od.owner_id = u.id
      WHERE od.organization_id = $1
    `;
    const params = [organizationId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (od.name ILIKE $${params.length} OR od.contact_number ILIKE $${params.length} OR od.village ILIKE $${params.length})`;
    }
    if (person) { params.push(person); query += ` AND od.person = $${params.length}`; }
    if (property_type) { params.push(property_type); query += ` AND od.property_type = $${params.length}`; }
    if (purpose) { params.push(purpose); query += ` AND od.purpose = $${params.length}`; }

    query += " ORDER BY od.created_at DESC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get owners detail error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/employee/owners-detail
const createOwnerDetail = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { name, contact_number, person, property_type, size, purpose, price_or_jd, village, features } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name is required" });

    const result = await pool.query(
      `INSERT INTO owners_detail (organization_id, owner_id, name, contact_number, person, property_type, size, purpose, price_or_jd, village, features)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [organizationId, userId, name.trim(), contact_number||null, person||null, property_type||null, size||null, purpose||null, price_or_jd||null, village||null, features||null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Create owner detail error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/employee/owners-detail/:id
const updateOwnerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    const { name, contact_number, person, property_type, size, purpose, price_or_jd, village, features } = req.body;

    const result = await pool.query(
      `UPDATE owners_detail SET
         name=$1, contact_number=$2, person=$3, property_type=$4, size=$5,
         purpose=$6, price_or_jd=$7, village=$8, features=$9,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$10 AND organization_id=$11
       RETURNING *`,
      [name, contact_number||null, person||null, property_type||null, size||null, purpose||null, price_or_jd||null, village||null, features||null, id, organizationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update owner detail error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/employee/owners-detail/:id
const deleteOwnerDetail = async (req, res) => {
  try {
    if (req.user.role !== "ORG_ADMIN") {
      return res.status(403).json({ success: false, message: "Delete permission is restricted to Org Admin" });
    }
    const { id } = req.params;
    const { organizationId } = req.user;

    const result = await pool.query(
      `DELETE FROM owners_detail WHERE id=$1 AND organization_id=$2 RETURNING id`,
      [id, organizationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Delete owner detail error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getOwnersDetail, createOwnerDetail, updateOwnerDetail, deleteOwnerDetail };
