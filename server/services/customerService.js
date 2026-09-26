const pool = require("../config/db");
const { createNotification } = require("./notificationService");
const CUSTOMER_STATUSES = ["Active", "Inactive", "At Risk"];
const mapCustomer = (row) => ({
  id: row.id,
  name: row.name,
  company: row.company,
  email: row.email,
  phone: row.phone,
  status: row.status,
  industry: row.industry,
  totalSpend: Number(row.total_spend),
  since: row.customer_since,
  photoUrl: row.photo_url,
  mappedProductId: row.mapped_product_id,
  phaseNo: row.phase_no,
  flatNo: row.flat_no,
  totalSqYd: row.total_sq_yd ? Number(row.total_sq_yd) : null,
  ratePurchased: row.rate_purchased ? Number(row.rate_purchased) : null,
  paymentMode: row.payment_mode,
  owner: row.owner_name,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const getCustomers = async (organizationId, ownerId, { page = 1, limit = 50, search = '', status = '' } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = ['c.organization_id = $1', 'c.owner_id = $2'];
  const params = [organizationId, ownerId];
  let idx = 3;

  if (search) {
    conditions.push(`(c.search_vector @@ plainto_tsquery('english', $${idx}) OR c.name ILIKE $${idx + 1} OR c.company ILIKE $${idx + 1} OR c.email ILIKE $${idx + 1})`);
    params.push(search, `%${search}%`);
    idx += 2;
  }
  if (status) { conditions.push(`c.status = $${idx}`); params.push(status); idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    pool.query(`SELECT c.*, u.name AS owner_name FROM customers c JOIN users u ON u.id = c.owner_id WHERE ${where} ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
    pool.query(`SELECT COUNT(*) FROM customers c WHERE ${where}`, params),
  ]);
  return {
    data: dataRes.rows.map(mapCustomer),
    pagination: { page, limit, total: parseInt(countRes.rows[0].count), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) },
  };
};
const getCustomerById = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT c.*, u.name AS owner_name
    FROM customers c
    JOIN users u ON u.id = c.owner_id
    WHERE c.id = $1
      AND c.organization_id = $2
      AND c.owner_id = $3
    `,
    [id, organizationId, ownerId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  return mapCustomer(result.rows[0]);
};
const createCustomer = async (organizationId, ownerId, payload) => {
  const { name, company, email, phone, status, industry, totalSpend, since, photo_url, mapped_product_id,
          phase_no, flat_no, total_sq_yd, rate_purchased, payment_mode } = payload;
  if (!name || !company || !email) {
    const error = new Error("Name, company and email are required");
    error.statusCode = 400;
    throw error;
  }
  const finalStatus = status || "Active";
  if (!CUSTOMER_STATUSES.includes(finalStatus)) {
    const error = new Error("Invalid customer status");
    error.statusCode = 400;
    throw error;
  }
  const result = await pool.query(
    `
    INSERT INTO customers (
      organization_id, owner_id, name, company, email, phone, status, industry, total_spend, customer_since, photo_url, mapped_product_id,
      phase_no, flat_no, total_sq_yd, rate_purchased, payment_mode
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, CURRENT_DATE), $11, $12, $13, $14, $15, $16, $17)
    RETURNING id
    `,
    [
      organizationId,
      ownerId,
      name,
      company,
      email,
      phone || null,
      finalStatus,
      industry || null,
      Number(totalSpend) || 0,
      since || null,
      photo_url || null,
      mapped_product_id || null,
      phase_no || null,
      flat_no || null,
      total_sq_yd ? Number(total_sq_yd) : null,
      rate_purchased ? Number(rate_purchased) : null,
      payment_mode || null,
    ]
  );
  const customer = await getCustomerById(result.rows[0].id, organizationId, ownerId);
  await createNotification(organizationId, ownerId, {
    type: "customer",
    title: "New customer added",
    description: `${customer.name} from ${customer.company} was added to your customers`,
  });
  return customer;
};
const updateCustomer = async (id, organizationId, ownerId, payload) => {
  const { name, company, email, phone, status, industry, totalSpend, since, photo_url, mapped_product_id,
          phase_no, flat_no, total_sq_yd, rate_purchased, payment_mode } = payload;
  if (status && !CUSTOMER_STATUSES.includes(status)) {
    const error = new Error("Invalid customer status");
    error.statusCode = 400;
    throw error;
  }
  const result = await pool.query(
    `
    UPDATE customers
    SET
      name = COALESCE($1, name),
      company = COALESCE($2, company),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      status = COALESCE($5, status),
      industry = COALESCE($6, industry),
      total_spend = COALESCE($7, total_spend),
      customer_since = COALESCE($8, customer_since),
      photo_url = COALESCE($9, photo_url),
      mapped_product_id = COALESCE($10, mapped_product_id),
      phase_no = COALESCE($11, phase_no),
      flat_no = COALESCE($12, flat_no),
      total_sq_yd = COALESCE($13, total_sq_yd),
      rate_purchased = COALESCE($14, rate_purchased),
      payment_mode = COALESCE($15, payment_mode),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $16
      AND organization_id = $17
      AND owner_id = $18
    RETURNING id
    `,
    [
      name || null,
      company || null,
      email || null,
      phone || null,
      status || null,
      industry || null,
      totalSpend === undefined ? null : Number(totalSpend),
      since || null,
      photo_url || null,
      mapped_product_id || null,
      phase_no || null,
      flat_no || null,
      total_sq_yd !== undefined ? Number(total_sq_yd) : null,
      rate_purchased !== undefined ? Number(rate_purchased) : null,
      payment_mode || null,
      id,
      organizationId,
      ownerId,
    ]
  );
  if (result.rows.length === 0) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  return getCustomerById(id, organizationId, ownerId);
};
const deleteCustomer = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    DELETE FROM customers
    WHERE id = $1
      AND organization_id = $2
      AND owner_id = $3
    RETURNING id
    `,
    [id, organizationId, ownerId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  return { id };
};

const getAllCustomers = async (organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT c.*, u.name AS owner_name
    FROM customers c
    JOIN users u ON u.id = c.owner_id
    WHERE c.organization_id = $1
      AND c.owner_id = $2
    ORDER BY c.created_at DESC
    `,
    [organizationId, ownerId]
  );
  return result.rows.map(mapCustomer);
};

module.exports = {
  CUSTOMER_STATUSES,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getAllCustomers,
};
