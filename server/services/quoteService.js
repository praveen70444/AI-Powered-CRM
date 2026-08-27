const pool = require('../config/db');

async function generateQuoteNumber(organizationId, client) {
  const year = new Date().getFullYear();
  const result = await client.query(
    `SELECT COUNT(*) as count FROM quotes WHERE organization_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
    [organizationId, year]
  );
  const num = parseInt(result.rows[0].count) + 1;
  return `QUO-${year}-${String(num).padStart(4, '0')}`;
}

async function recalculateTotals(quoteId, client) {
  const itemsResult = await client.query(
    `SELECT SUM(line_total) as subtotal FROM quote_line_items WHERE quote_id = $1`, [quoteId]
  );
  const subtotal = Number(itemsResult.rows[0].subtotal) || 0;
  const quote = await client.query(`SELECT discount_amount, tax_amount FROM quotes WHERE id = $1`, [quoteId]);
  const discount = Number(quote.rows[0]?.discount_amount) || 0;
  const tax = Number(quote.rows[0]?.tax_amount) || 0;
  const total = subtotal - discount + tax;
  await client.query(`UPDATE quotes SET total_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [total, quoteId]);
  return total;
}

const mapQuote = (row) => ({
  id: row.id,
  quoteNumber: row.quote_number,
  dealId: row.deal_id,
  customerId: row.customer_id,
  ownerId: row.owner_id,
  ownerName: row.owner_name,
  customerName: row.customer_name,
  status: row.status,
  totalAmount: Number(row.total_amount),
  discountAmount: Number(row.discount_amount),
  taxAmount: Number(row.tax_amount),
  validUntil: row.valid_until,
  notes: row.notes,
  lineItems: row.line_items || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getQuotes = async (organizationId, ownerId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [dataRes, countRes] = await Promise.all([
    pool.query(`SELECT q.*, u.name as owner_name, c.name as customer_name
     FROM quotes q LEFT JOIN users u ON q.owner_id=u.id LEFT JOIN customers c ON q.customer_id=c.id
     WHERE q.organization_id=$1 AND q.owner_id=$2
     ORDER BY q.created_at DESC LIMIT $3 OFFSET $4`, [organizationId, ownerId, limit, offset]),
    pool.query(`SELECT COUNT(*) FROM quotes WHERE organization_id=$1 AND owner_id=$2`, [organizationId, ownerId]),
  ]);
  return {
    data: dataRes.rows.map(mapQuote),
    pagination: { page, limit, total: parseInt(countRes.rows[0].count), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) },
  };
};

const getQuoteById = async (id, organizationId) => {
  const quoteRes = await pool.query(
    `SELECT q.*, u.name as owner_name, c.name as customer_name
     FROM quotes q LEFT JOIN users u ON q.owner_id=u.id LEFT JOIN customers c ON q.customer_id=c.id
     WHERE q.id=$1 AND q.organization_id=$2`, [id, organizationId]
  );
  if (!quoteRes.rows[0]) { const e = new Error('Quote not found'); e.statusCode = 404; throw e; }
  const itemsRes = await pool.query(
    `SELECT qli.*, p.name as product_name FROM quote_line_items qli LEFT JOIN products p ON qli.product_id=p.id WHERE qli.quote_id=$1 ORDER BY qli.id`, [id]
  );
  return mapQuote({ ...quoteRes.rows[0], line_items: itemsRes.rows });
};

const createQuote = async (organizationId, ownerId, payload) => {
  const { deal_id, customer_id, valid_until, notes, discount_amount = 0, tax_amount = 0, line_items = [] } = payload;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const quoteNumber = await generateQuoteNumber(organizationId, client);
    const result = await client.query(
      `INSERT INTO quotes (organization_id, owner_id, deal_id, customer_id, quote_number, status, discount_amount, tax_amount, valid_until, notes)
       VALUES ($1,$2,$3,$4,$5,'Draft',$6,$7,$8,$9) RETURNING id`,
      [organizationId, ownerId, deal_id||null, customer_id||null, quoteNumber, Number(discount_amount), Number(tax_amount), valid_until||null, notes||null]
    );
    const quoteId = result.rows[0].id;
    for (const item of line_items) {
      const lineTotal = Number(item.quantity) * Number(item.unit_price) * (1 - (Number(item.discount_percent)||0)/100);
      await client.query(
        `INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit_price, discount_percent, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [quoteId, item.product_id||null, item.description||null, item.quantity||1, item.unit_price||0, item.discount_percent||0, lineTotal]
      );
    }
    await recalculateTotals(quoteId, client);
    await client.query('COMMIT');
    return getQuoteById(quoteId, organizationId);
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
};

const updateQuote = async (id, organizationId, payload) => {
  const { status, valid_until, notes, discount_amount, tax_amount } = payload;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE quotes SET status=COALESCE($1,status), valid_until=COALESCE($2,valid_until), notes=COALESCE($3,notes),
       discount_amount=COALESCE($4,discount_amount), tax_amount=COALESCE($5,tax_amount), updated_at=CURRENT_TIMESTAMP
       WHERE id=$6 AND organization_id=$7`,
      [status||null, valid_until||null, notes||null, discount_amount!=null?Number(discount_amount):null, tax_amount!=null?Number(tax_amount):null, id, organizationId]
    );
    await recalculateTotals(id, client);
    await client.query('COMMIT');
    return getQuoteById(id, organizationId);
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
};

const deleteQuote = async (id, organizationId) => {
  const result = await pool.query(`DELETE FROM quotes WHERE id=$1 AND organization_id=$2 RETURNING id`, [id, organizationId]);
  if (!result.rows[0]) { const e = new Error('Quote not found'); e.statusCode = 404; throw e; }
  return { id };
};

const addLineItem = async (quoteId, organizationId, item) => {
  // Verify quote belongs to org
  const quoteCheck = await pool.query(`SELECT id FROM quotes WHERE id=$1 AND organization_id=$2`, [quoteId, organizationId]);
  if (!quoteCheck.rows[0]) { const e = new Error('Quote not found'); e.statusCode = 404; throw e; }
  const lineTotal = Number(item.quantity||1) * Number(item.unit_price||0) * (1 - (Number(item.discount_percent)||0)/100);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit_price, discount_percent, line_total)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [quoteId, item.product_id||null, item.description||null, item.quantity||1, item.unit_price||0, item.discount_percent||0, lineTotal]
    );
    await recalculateTotals(quoteId, client);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
};

const removeLineItem = async (lineItemId, quoteId, organizationId) => {
  const quoteCheck = await pool.query(`SELECT id FROM quotes WHERE id=$1 AND organization_id=$2`, [quoteId, organizationId]);
  if (!quoteCheck.rows[0]) { const e = new Error('Quote not found'); e.statusCode = 404; throw e; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM quote_line_items WHERE id=$1 AND quote_id=$2`, [lineItemId, quoteId]);
    await recalculateTotals(quoteId, client);
    await client.query('COMMIT');
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
};

module.exports = { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote, addLineItem, removeLineItem };
