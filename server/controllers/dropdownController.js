const pool = require("../config/db");

// Default seeds per category
const DEFAULT_OPTIONS = {
  real_estate: {
    lead_language: ["Hindi", "English", "Telugu"],
    lead_location: [
      "Anandapuram", "Bhogapuram", "Thagarapuvalasa", "Madhurwada",
      "Bheemili", "Anakapalle", "Kothavalsa", "Vizianagaram",
    ],
    lead_bhk: ["1 BHK", "2 BHK", "3 BHK", "4 BHK"],
    lead_purpose_flat: ["Self-use", "Investment", "Rental"],
    lead_purpose_plot: ["Residential", "Investment", "Commercial"],
    lead_purpose_land: ["Residential", "Investment", "Commercial", "Agricultural"],
    lead_property_status: ["Ready-to-move", "Under construction", "New launch"],
    lead_purchase_timeline: ["Immediately", "1 Month", "3 Months", "Just Exploring"],
    lead_land_size_unit: ["Acres", "Sq Yd."],
    owner_person: ["Mediator", "Owner"],
    owner_property_type: ["Land", "Flat"],
    owner_purpose: ["Residential", "Investment", "Commercial", "Rental", "Joint Development"],
  },
  construction: {
    service_type: [
      "Civil Construction", "Civil Repair & Maintenance", "Painting",
      "Waterproofing", "Plumbing", "Electrical", "Tile & Marble Work",
      "Flooring", "False Ceiling", "Interior Design", "Carpentry",
      "Aluminium & Glass", "Fabrication & Steel Work", "HVAC / AC",
      "POP & Gypsum Work", "Roofing", "Landscaping", "Other",
    ],
    material_category: [
      "Cement", "Steel / TMT", "Sand & Aggregates", "Bricks & Blocks",
      "RMC / Concrete", "Paints", "Tiles & Marble", "Plumbing Materials",
      "Electrical Materials", "Wires & Cables", "Sanitary Ware",
      "Plywood / MDF", "Hardware", "Aluminium & Glass", "Doors & Windows",
      "Waterproofing Materials", "Construction Chemicals",
      "False Ceiling / Gypsum Materials", "Flooring Materials", "Other",
    ],
    supplier_type: [
      "Manufacturer", "Distributor", "Wholesaler", "Stockist", "Dealer", "Direct Supplier",
    ],
    construction_property_type: [
      "Residential Apartment", "Independent House", "Villa", "Duplex",
      "Rental Property", "Commercial", "Other",
    ],
  },
};

// GET /api/dropdowns?vertical=real_estate&category=lead_language
const getDropdownOptions = async (req, res) => {
  try {
    const { vertical, category } = req.query;
    const { organizationId } = req.user;

    let query = `
      SELECT id, vertical, category, value, is_active, sort_order, created_at
      FROM dropdown_options
      WHERE organization_id = $1 AND is_active = TRUE
    `;
    const params = [organizationId];

    if (vertical) { params.push(vertical); query += ` AND vertical = $${params.length}`; }
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }

    query += " ORDER BY sort_order ASC, value ASC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get dropdown options error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/dropdowns/seed — seeds defaults for org if not already present
const seedDropdownOptions = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const toInsert = [];
    for (const [vertical, categories] of Object.entries(DEFAULT_OPTIONS)) {
      for (const [category, values] of Object.entries(categories)) {
        values.forEach((value, idx) => {
          toInsert.push({ vertical, category, value, sort_order: idx });
        });
      }
    }

    // Upsert — skip if already exists (idempotent)
    for (const opt of toInsert) {
      await pool.query(
        `INSERT INTO dropdown_options (organization_id, vertical, category, value, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (organization_id, vertical, category, value) DO NOTHING`,
        [organizationId, opt.vertical, opt.category, opt.value, opt.sort_order]
      );
    }

    res.json({ success: true, message: "Defaults seeded" });
  } catch (error) {
    console.error("Seed dropdown error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// POST /api/dropdowns
const createDropdownOption = async (req, res) => {
  try {
    const { vertical, category, value } = req.body;
    const { organizationId, userId } = req.user;

    if (!vertical || !category || !value?.trim()) {
      return res.status(400).json({ success: false, message: "vertical, category and value are required" });
    }

    // Get current max sort_order for this category
    const maxRes = await pool.query(
      `SELECT COALESCE(MAX(sort_order), -1) as max_order FROM dropdown_options
       WHERE organization_id = $1 AND vertical = $2 AND category = $3`,
      [organizationId, vertical, category]
    );
    const nextOrder = (maxRes.rows[0]?.max_order ?? -1) + 1;

    const result = await pool.query(
      `INSERT INTO dropdown_options (organization_id, vertical, category, value, sort_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, vertical, category, value.trim(), nextOrder, userId || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "This option already exists" });
    }
    console.error("Create dropdown option error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// PUT /api/dropdowns/:id
const updateDropdownOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, is_active, sort_order } = req.body;
    const { organizationId } = req.user;

    const fields = [];
    const values = [];

    if (value !== undefined) { fields.push(`value = $${values.length + 1}`); values.push(value.trim()); }
    if (is_active !== undefined) { fields.push(`is_active = $${values.length + 1}`); values.push(is_active); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${values.length + 1}`); values.push(sort_order); }

    if (fields.length === 0) return res.status(400).json({ success: false, message: "Nothing to update" });

    // updated_at is a SQL literal — NOT a bound param, so push id/orgId after fields
    values.push(id);             // $(fields.length + 1)
    values.push(organizationId); // $(fields.length + 2)

    const result = await pool.query(
      `UPDATE dropdown_options
       SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length - 1} AND organization_id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Option not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update dropdown option error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// DELETE /api/dropdowns/:id  (soft-delete: sets is_active = false)
const deleteDropdownOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const result = await pool.query(
      `UPDATE dropdown_options SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [id, organizationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Option not found" });
    res.json({ success: true, message: "Option deactivated" });
  } catch (error) {
    console.error("Delete dropdown option error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getDropdownOptions,
  seedDropdownOptions,
  createDropdownOption,
  updateDropdownOption,
  deleteDropdownOption,
};
