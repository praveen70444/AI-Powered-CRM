const pool = require("../config/db");
const { createNotification } = require("./notificationService");
const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Unqualified", "Converted"];
const LEAD_SOURCES = ["Website", "Referral", "Cold Call", "Social Media", "Advertisement", "Event"];
const mapLead = (row) => ({
  id: row.id,
  name: row.name,
  company: row.company,
  email: row.email,
  phone: row.phone,
  status: row.status,
  source: row.source,
  zipCode: row.zip_code,
  value: Number(row.value),
  purposeOfPurchase: row.purpose_of_purchase,
  plotSize: row.plot_size,
  budget: row.budget,
  planToPurchase: row.plan_to_purchase,
  siteVisit: row.site_visit,
  owner: row.owner_name,
  ownerId: row.owner_id,
  // AI fields — both camelCase and snake_case for compatibility
  aiScore: row.ai_score,
  aiScoreLabel: row.ai_score_label,
  ai_score: row.ai_score,
  ai_score_label: row.ai_score_label,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const getLeads = async (organizationId, ownerId, { page = 1, limit = 50, search = '', status = '', source = '' } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = ['l.organization_id = $1', 'l.owner_id = $2'];
  const params = [organizationId, ownerId];
  let idx = 3;

  if (search) {
    conditions.push(`(l.search_vector @@ plainto_tsquery('english', $${idx}) OR l.name ILIKE $${idx + 1} OR l.company ILIKE $${idx + 1} OR l.email ILIKE $${idx + 1})`);
    params.push(search, `%${search}%`);
    idx += 2;
  }
  if (status) { conditions.push(`l.status = $${idx}`); params.push(status); idx++; }
  if (source) { conditions.push(`l.source = $${idx}`); params.push(source); idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    pool.query(`SELECT l.*, u.name AS owner_name FROM leads l JOIN users u ON u.id = l.owner_id WHERE ${where} ORDER BY l.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
    pool.query(`SELECT COUNT(*) FROM leads l WHERE ${where}`, params),
  ]);
  return {
    data: dataRes.rows.map(mapLead),
    pagination: { page, limit, total: parseInt(countRes.rows[0].count), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) },
  };
};
const getLeadById = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT l.*, u.name AS owner_name
    FROM leads l
    JOIN users u ON u.id = l.owner_id
    WHERE l.id = $1
      AND l.organization_id = $2
      AND l.owner_id = $3
    `,
    [id, organizationId, ownerId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
  return mapLead(result.rows[0]);
};
const createLead = async (organizationId, ownerId, payload) => {
  const { name, company, email, phone, status, source, value, zipCode,
          purposeOfPurchase, plotSize, budget, planToPurchase, siteVisit } = payload;
  if (!name) {
    const error = new Error("Name is required");
    error.statusCode = 400;
    throw error;
  }
  const finalStatus = status || "New";
  if (!LEAD_STATUSES.includes(finalStatus)) {
    const error = new Error("Invalid lead status");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `
    INSERT INTO leads (
      organization_id, owner_id, name, company, email, phone, status, source, value,
      purpose_of_purchase, plot_size, budget, plan_to_purchase, site_visit, zip_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
    `,
    [
      organizationId,
      ownerId,
      name,
      company,
      email,
      phone || null,
      finalStatus,
      source || null,
      Number(value) || 0,
      purposeOfPurchase || null,
      plotSize || null,
      budget || null,
      planToPurchase || null,
      siteVisit || null,
      zipCode || null,
    ]
  );
  const lead = await getLeadById(result.rows[0].id, organizationId, ownerId);
  await createNotification(organizationId, ownerId, {
    type: "lead",
    title: "New lead added",
    description: `${lead.name} from ${lead.company} was added to your leads`,
  });
  return lead;
};
const updateLead = async (id, organizationId, ownerId, payload) => {
  const { name, company, email, phone, status, source, value, zipCode,
          purposeOfPurchase, plotSize, budget, planToPurchase, siteVisit } = payload;
  if (status && !LEAD_STATUSES.includes(status)) {
    const error = new Error("Invalid lead status");
    error.statusCode = 400;
    throw error;
  }
  const existingLead = await getLeadById(id, organizationId, ownerId);
  const result = await pool.query(
    `
    UPDATE leads
    SET
      name = COALESCE($1, name),
      company = COALESCE($2, company),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      status = COALESCE($5, status),
      source = COALESCE($6, source),
      value = COALESCE($7, value),
      purpose_of_purchase = CASE WHEN $8 THEN $9 ELSE purpose_of_purchase END,
      plot_size           = CASE WHEN $10 THEN $11 ELSE plot_size END,
      budget              = CASE WHEN $12 THEN $13 ELSE budget END,
      plan_to_purchase    = CASE WHEN $14 THEN $15 ELSE plan_to_purchase END,
      site_visit          = CASE WHEN $16 THEN $17 ELSE site_visit END,
      zip_code            = CASE WHEN $18 THEN $19 ELSE zip_code END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $20
      AND organization_id = $21
      AND owner_id = $22
    RETURNING id
    `,
    [
      name || null,
      company || null,
      email || null,
      phone || null,
      status || null,
      source || null,
      value === undefined ? null : Number(value),
      // purpose_of_purchase
      purposeOfPurchase !== undefined, purposeOfPurchase || null,
      // plot_size
      plotSize !== undefined, plotSize || null,
      // budget
      budget !== undefined, budget || null,
      // plan_to_purchase
      planToPurchase !== undefined, planToPurchase || null,
      // site_visit
      siteVisit !== undefined, siteVisit || null,
      // zip_code
      zipCode !== undefined, zipCode || null,
      id,
      organizationId,
      ownerId,
    ]
  );
  if (result.rows.length === 0) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
  const updatedLead = await getLeadById(id, organizationId, ownerId);
  if (status && status !== existingLead.status && status === "Converted") {
    await createNotification(organizationId, ownerId, {
      type: "lead",
      title: "Lead converted",
      description: `${updatedLead.name} from ${updatedLead.company} was converted`,
    });
  }

  return updatedLead;
};
const deleteLead = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    DELETE FROM leads
    WHERE id = $1
      AND organization_id = $2
      AND owner_id = $3
    RETURNING id
    `,
    [id, organizationId, ownerId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
  return { id };
};

const getAllLeads = async (organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT l.*, u.name AS owner_name
    FROM leads l
    JOIN users u ON u.id = l.owner_id
    WHERE l.organization_id = $1
      AND l.owner_id = $2
    ORDER BY l.created_at DESC
    `,
    [organizationId, ownerId]
  );
  return result.rows.map(mapLead);
};

module.exports = {
  LEAD_STATUSES,
  LEAD_SOURCES,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getAllLeads,
};
