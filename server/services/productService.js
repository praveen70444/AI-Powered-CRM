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
  photoUrl: row.photo_url,
  features: row.features,
  pricePerSqYard: row.price_per_sq_yard ? Number(row.price_per_sq_yard) : null,
  totalAcres: row.total_acres ? Number(row.total_acres) : null,
  bookingAdvance: row.booking_advance ? Number(row.booking_advance) : null,
  rC: row.r_c,
  monthLaunched: row.month_launched,
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
  const { name, description, sku, category, unit_price, cost_price, is_active = true, photo_url,
          features, price_per_sq_yard, total_acres, booking_advance, r_c, month_launched } = payload;
  if (!name) { const e = new Error('Product name is required'); e.statusCode = 400; throw e; }
  const result = await pool.query(
    `INSERT INTO products (organization_id, name, description, sku, category, unit_price, cost_price, is_active, photo_url, created_by,
      features, price_per_sq_yard, total_acres, booking_advance, r_c, month_launched)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [organizationId, name, description || null, sku || null, category || null, Number(unit_price) || 0, cost_price ? Number(cost_price) : null, is_active, photo_url || null, userId,
     features || null, price_per_sq_yard ? Number(price_per_sq_yard) : null, total_acres ? Number(total_acres) : null, booking_advance ? Number(booking_advance) : null, r_c || null, month_launched || null]
  );
  return mapProduct(result.rows[0]);
};

const updateProduct = async (id, organizationId, payload) => {
  const { name, description, sku, category, unit_price, cost_price, is_active, photo_url,
          features, price_per_sq_yard, total_acres, booking_advance, r_c, month_launched } = payload;
  const result = await pool.query(
    `UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description), sku=COALESCE($3,sku),
     category=COALESCE($4,category), unit_price=COALESCE($5,unit_price), cost_price=COALESCE($6,cost_price),
     is_active=COALESCE($7,is_active), photo_url=COALESCE($8,photo_url),
     features=COALESCE($9,features), price_per_sq_yard=COALESCE($10,price_per_sq_yard), total_acres=COALESCE($11,total_acres),
     booking_advance=COALESCE($12,booking_advance), r_c=COALESCE($13,r_c), month_launched=COALESCE($14,month_launched),
     updated_at=CURRENT_TIMESTAMP
     WHERE id=$15 AND organization_id=$16 RETURNING *`,
    [name||null, description||null, sku||null, category||null, unit_price!=null?Number(unit_price):null, cost_price!=null?Number(cost_price):null, is_active!=null?is_active:null, photo_url||null,
     features||null, price_per_sq_yard!=null?Number(price_per_sq_yard):null, total_acres!=null?Number(total_acres):null, booking_advance!=null?Number(booking_advance):null, r_c||null, month_launched||null,
     id, organizationId]
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
