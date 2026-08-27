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
  value: Number(row.value),
  owner: row.owner_name,
  ownerId: row.owner_id,
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
  const { name, company, email, phone, status, source, value } = payload;
  if (!name || !company || !email) {
    const error = new Error("Name, company and email are required");
    error.statusCode = 400;
    throw error;
  }
  const finalStatus = status || "New";
  if (!LEAD_STATUSES.includes(finalStatus)) {
    const error = new Error("Invalid lead status");
    error.statusCode = 400;
    throw error;
  }
  if (source && !LEAD_SOURCES.includes(source)) {
    const error = new Error("Invalid lead source");
    error.statusCode = 400;
    throw error;
  }
  const result = await pool.query(
    `
    INSERT INTO leads (
      organization_id, owner_id, name, company, email, phone, status, source, value
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
  const { name, company, email, phone, status, source, value } = payload;
  if (status && !LEAD_STATUSES.includes(status)) {
    const error = new Error("Invalid lead status");
    error.statusCode = 400;
    throw error;
  }
  if (source && !LEAD_SOURCES.includes(source)) {
    const error = new Error("Invalid lead source");
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
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $8
      AND organization_id = $9
      AND owner_id = $10
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
