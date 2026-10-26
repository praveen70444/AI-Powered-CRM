const pool = require("../config/db");

// GET /api/employee/material-suppliers
const getMaterialSuppliers = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { search, material_category, supplier_type } = req.query;

    let query = `SELECT * FROM material_suppliers WHERE organization_id = $1`;
    const params = [organizationId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (supplier_name ILIKE $${params.length} OR contact_person ILIKE $${params.length} OR location ILIKE $${params.length} OR contact_number ILIKE $${params.length} OR brands_products ILIKE $${params.length})`;
    }
    if (material_category) { params.push(material_category); query += ` AND material_category = $${params.length}`; }
    if (supplier_type) { params.push(supplier_type); query += ` AND supplier_type = $${params.length}`; }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get material suppliers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/employee/material-suppliers
const createMaterialSupplier = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const {
      supplier_name, material_category, contact_person, contact_number,
      location, supplier_type, brands_products, wholesale_price, moq, rating_notes,
    } = req.body;

    if (!supplier_name?.trim()) return res.status(400).json({ success: false, message: "Supplier name is required" });

    const result = await pool.query(
      `INSERT INTO material_suppliers
         (organization_id, owner_id, supplier_name, material_category, contact_person, contact_number,
          location, supplier_type, brands_products, wholesale_price, moq, rating_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        organizationId, userId, supplier_name.trim(), material_category||null,
        contact_person||null, contact_number||null, location||null,
        supplier_type||null, brands_products||null, wholesale_price||null,
        moq||null, rating_notes||null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Create material supplier error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/employee/material-suppliers/:id
const updateMaterialSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    const {
      supplier_name, material_category, contact_person, contact_number,
      location, supplier_type, brands_products, wholesale_price, moq, rating_notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE material_suppliers SET
         supplier_name=$1, material_category=$2, contact_person=$3, contact_number=$4,
         location=$5, supplier_type=$6, brands_products=$7, wholesale_price=$8,
         moq=$9, rating_notes=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 AND organization_id=$12
       RETURNING *`,
      [
        supplier_name, material_category||null, contact_person||null, contact_number||null,
        location||null, supplier_type||null, brands_products||null, wholesale_price||null,
        moq||null, rating_notes||null, id, organizationId,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Supplier not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update material supplier error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/employee/material-suppliers/:id
const deleteMaterialSupplier = async (req, res) => {
  try {
    if (req.user.role !== "ORG_ADMIN") {
      return res.status(403).json({ success: false, message: "Delete permission is restricted to Org Admin" });
    }
    const { id } = req.params;
    const { organizationId } = req.user;

    const result = await pool.query(
      `DELETE FROM material_suppliers WHERE id=$1 AND organization_id=$2 RETURNING id`,
      [id, organizationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Supplier not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Delete material supplier error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getMaterialSuppliers, createMaterialSupplier, updateMaterialSupplier, deleteMaterialSupplier };
