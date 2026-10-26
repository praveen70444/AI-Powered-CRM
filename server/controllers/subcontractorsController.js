const pool = require("../config/db");

// GET /api/employee/subcontractors
const getSubcontractors = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { search, service_type } = req.query;

    let query = `
      SELECT * FROM subcontractors WHERE organization_id = $1
    `;
    const params = [organizationId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (contractor_name ILIKE $${params.length} OR contact_person ILIKE $${params.length} OR location ILIKE $${params.length} OR contact_number ILIKE $${params.length})`;
    }
    if (service_type) { params.push(service_type); query += ` AND service_type = $${params.length}`; }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get subcontractors error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/employee/subcontractors
const createSubcontractor = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const {
      contractor_name, service_type, contact_person, contact_number,
      location, years_experience, workforce_capacity, previous_projects,
      projects_completed, rating_notes,
    } = req.body;

    if (!contractor_name?.trim()) return res.status(400).json({ success: false, message: "Contractor name is required" });

    const result = await pool.query(
      `INSERT INTO subcontractors
         (organization_id, owner_id, contractor_name, service_type, contact_person, contact_number,
          location, years_experience, workforce_capacity, previous_projects, projects_completed, rating_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        organizationId, userId, contractor_name.trim(), service_type||null,
        contact_person||null, contact_number||null, location||null,
        years_experience||null, workforce_capacity||null, previous_projects||null,
        projects_completed ? parseInt(projects_completed) : null, rating_notes||null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Create subcontractor error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/employee/subcontractors/:id
const updateSubcontractor = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    const {
      contractor_name, service_type, contact_person, contact_number,
      location, years_experience, workforce_capacity, previous_projects,
      projects_completed, rating_notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE subcontractors SET
         contractor_name=$1, service_type=$2, contact_person=$3, contact_number=$4,
         location=$5, years_experience=$6, workforce_capacity=$7, previous_projects=$8,
         projects_completed=$9, rating_notes=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 AND organization_id=$12
       RETURNING *`,
      [
        contractor_name, service_type||null, contact_person||null, contact_number||null,
        location||null, years_experience||null, workforce_capacity||null, previous_projects||null,
        projects_completed ? parseInt(projects_completed) : null, rating_notes||null,
        id, organizationId,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Subcontractor not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update subcontractor error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/employee/subcontractors/:id
const deleteSubcontractor = async (req, res) => {
  try {
    if (req.user.role !== "ORG_ADMIN") {
      return res.status(403).json({ success: false, message: "Delete permission is restricted to Org Admin" });
    }
    const { id } = req.params;
    const { organizationId } = req.user;

    const result = await pool.query(
      `DELETE FROM subcontractors WHERE id=$1 AND organization_id=$2 RETURNING id`,
      [id, organizationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Subcontractor not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Delete subcontractor error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getSubcontractors, createSubcontractor, updateSubcontractor, deleteSubcontractor };
