const pool = require("../config/db");
const { createNotification } = require("./notificationService");
const DEAL_STAGES = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const mapDeal = (row) => ({
  id: row.id,
  title: row.title,
  company: row.company,
  stage: row.stage,
  value: Number(row.value),
  closeDate: row.close_date,
  customerId: row.customer_id,
  owner: row.owner_name,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const ensureCustomerBelongsToOwner = async (customerId, organizationId, ownerId) => {
  if (!customerId) return null;
  const result = await pool.query(
    `
    SELECT id FROM customers
    WHERE id = $1
      AND organization_id = $2
      AND owner_id = $3
    `,
    [customerId, organizationId, ownerId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Related customer not found");
    error.statusCode = 400;
    throw error;
  }
  return customerId;
};
const getDeals = async (organizationId, ownerId, { page = 1, limit = 200, search = '', stage = '' } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = ['d.organization_id = $1', 'd.owner_id = $2'];
  const params = [organizationId, ownerId];
  let idx = 3;
  if (search) {
    conditions.push(`(d.search_vector @@ plainto_tsquery('english', $${idx}) OR d.title ILIKE $${idx + 1} OR d.company ILIKE $${idx + 1})`);
    params.push(search, `%${search}%`); idx += 2;
  }
  if (stage) { conditions.push(`d.stage = $${idx}`); params.push(stage); idx++; }
  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    pool.query(`SELECT d.*, u.name AS owner_name FROM deals d JOIN users u ON u.id = d.owner_id WHERE ${where} ORDER BY d.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
    pool.query(`SELECT COUNT(*) FROM deals d WHERE ${where}`, params),
  ]);
  return {
    data: dataRes.rows.map(mapDeal),
    pagination: { page, limit, total: parseInt(countRes.rows[0].count), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) },
  };
};
const getDealById = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT d.*, u.name AS owner_name
    FROM deals d
    JOIN users u ON u.id = d.owner_id
    WHERE d.id = $1
      AND d.organization_id = $2
      AND d.owner_id = $3
    `,
    [id, organizationId, ownerId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Deal not found");
    error.statusCode = 404;
    throw error;
  }
  return mapDeal(result.rows[0]);
};
const createDeal = async (organizationId, ownerId, payload) => {
  const { title, company, stage, value, closeDate, customerId } = payload;
  if (!title) {
    const error = new Error("Deal title is required");
    error.statusCode = 400;
    throw error;
  }
  const finalStage = stage || "New";
  if (!DEAL_STAGES.includes(finalStage)) {
    const error = new Error("Invalid deal stage");
    error.statusCode = 400;
    throw error;
  }
  const validatedCustomerId = await ensureCustomerBelongsToOwner(customerId, organizationId, ownerId);
  const result = await pool.query(
    `
    INSERT INTO deals (
      organization_id, owner_id, customer_id, title, company, stage, value, close_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [
      organizationId,
      ownerId,
      validatedCustomerId,
      title,
      company || null,
      finalStage,
      Number(value) || 0,
      closeDate || null,
    ]
  );
  return getDealById(result.rows[0].id, organizationId, ownerId);
};
const updateDeal = async (id, organizationId, ownerId, payload) => {
  const { title, company, stage, value, closeDate, customerId } = payload;
  if (stage && !DEAL_STAGES.includes(stage)) {
    const error = new Error("Invalid deal stage");
    error.statusCode = 400;
    throw error;
  }
  const validatedCustomerId =
    customerId === undefined ? undefined : await ensureCustomerBelongsToOwner(customerId, organizationId, ownerId);
  const existingDeal = await getDealById(id, organizationId, ownerId);
  const result = await pool.query(
    `
    UPDATE deals
    SET
      title = COALESCE($1, title),
      company = COALESCE($2, company),
      stage = COALESCE($3, stage),
      value = COALESCE($4, value),
      close_date = COALESCE($5, close_date),
      customer_id = COALESCE($6, customer_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
      AND organization_id = $8
      AND owner_id = $9
    RETURNING id
    `,
    [
      title || null,
      company || null,
      stage || null,
      value === undefined ? null : Number(value),
      closeDate || null,
      validatedCustomerId === undefined ? null : validatedCustomerId,
      id,
      organizationId,
      ownerId,
    ]
  );
  if (result.rows.length === 0) {
    const error = new Error("Deal not found");
    error.statusCode = 404;
    throw error;
  }
  const updatedDeal = await getDealById(id, organizationId, ownerId);
  if (stage && stage !== existingDeal.stage && stage === "Won") {
    await createNotification(organizationId, ownerId, {
      type: "deal",
      title: "Deal won",
      description: `${updatedDeal.title} was marked as Won for ₹${updatedDeal.value.toLocaleString("en-IN")}`,
    });
  }
  return updatedDeal;
};
const deleteDeal = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    DELETE FROM deals
    WHERE id = $1
      AND organization_id = $2
      AND owner_id = $3
    RETURNING id
    `,
    [id, organizationId, ownerId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Deal not found");
    error.statusCode = 404;
    throw error;
  }
  return { id };
};

const getAllDeals = async (organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT d.*, u.name AS owner_name
    FROM deals d
    JOIN users u ON u.id = d.owner_id
    WHERE d.organization_id = $1
      AND d.owner_id = $2
    ORDER BY d.created_at DESC
    `,
    [organizationId, ownerId]
  );
  return result.rows.map(mapDeal);
};

module.exports = {
  DEAL_STAGES,
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  getAllDeals,
};
