const pool = require('../config/db');

const mapProduct = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  sku: row.sku,
  category: row.category,
  unitPrice: Number(row.unit_price),
  costPrice: row.cost_price ? Number(row.cost_price) : null,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getProducts = async (organizationId, { page = 1, limit = 50, search = '', category = '', isActive = '' } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = ['organization_id = $1'];
  const params = [organizationId];
  let idx = 2;

  if (search) { conditions.push(`(name ILIKE $${idx} OR sku ILIKE $${idx} OR category ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
  if (category) { conditions.push(`category = $${idx}`); params.push(category); idx++; }
  if (isActive !== '') { conditions.push(`is_active = $${idx}`); params.push(isActive === 'true'); idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    pool.query(`SELECT * FROM products WHERE ${where} ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
    pool.query(`SELECT COUNT(*) FROM products WHERE ${where}`, params),
  ]);
  return {
    data: dataRes.rows.map(mapProduct),
    pagination: { page, limit, total: parseInt(countRes.rows[0].count), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) },
  };
};

const getAllProducts = async (organizationId) => {
  const result = await pool.query(`SELECT * FROM products WHERE organization_id = $1 AND is_active = TRUE ORDER BY name ASC`, [organizationId]);
  return result.rows.map(mapProduct);
};

const getProductById = async (id, organizationId) => {
  const result = await pool.query(`SELECT * FROM products WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
  if (!result.rows[0]) { const e = new Error('Product not found'); e.statusCode = 404; throw e; }
  return mapProduct(result.rows[0]);
};

const createProduct = async (organizationId, userId, payload) => {
  const { name, description, sku, category, unit_price, cost_price, is_active = true } = payload;
  if (!name) { const e = new Error('Product name is required'); e.statusCode = 400; throw e; }
  const result = await pool.query(
    `INSERT INTO products (organization_id, name, description, sku, category, unit_price, cost_price, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [organizationId, name, description || null, sku || null, category || null, Number(unit_price) || 0, cost_price ? Number(cost_price) : null, is_active, userId]
  );
  return mapProduct(result.rows[0]);
};

const updateProduct = async (id, organizationId, payload) => {
  const { name, description, sku, category, unit_price, cost_price, is_active } = payload;
  const result = await pool.query(
    `UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description), sku=COALESCE($3,sku),
     category=COALESCE($4,category), unit_price=COALESCE($5,unit_price), cost_price=COALESCE($6,cost_price),
     is_active=COALESCE($7,is_active), updated_at=CURRENT_TIMESTAMP
     WHERE id=$8 AND organization_id=$9 RETURNING *`,
    [name||null, description||null, sku||null, category||null, unit_price!=null?Number(unit_price):null, cost_price!=null?Number(cost_price):null, is_active!=null?is_active:null, id, organizationId]
  );
  if (!result.rows[0]) { const e = new Error('Product not found'); e.statusCode = 404; throw e; }
  return mapProduct(result.rows[0]);
};

const deleteProduct = async (id, organizationId) => {
  const result = await pool.query(`DELETE FROM products WHERE id=$1 AND organization_id=$2 RETURNING id`, [id, organizationId]);
  if (!result.rows[0]) { const e = new Error('Product not found'); e.statusCode = 404; throw e; }
  return { id };
};

module.exports = { getProducts, getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
