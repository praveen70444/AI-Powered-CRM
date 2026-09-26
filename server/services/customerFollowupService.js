const pool = require("../config/db");

const mapFollowup = (row) => ({
  id: row.id,
  customerId: row.customer_id,
  note: row.note,
  followupDate: row.followup_date,
  nextFollowupDate: row.next_followup_date,
  author: row.author_name,
  authorId: row.author_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getFollowups = async (customerId, organizationId) => {
  const result = await pool.query(
    `SELECT f.*, u.name AS author_name
     FROM lead_followups f
     JOIN users u ON u.id = f.author_id
     WHERE f.lead_id = $1 AND f.organization_id = $2
     ORDER BY f.followup_date DESC, f.created_at DESC`,
    [customerId, organizationId]
  );
  return result.rows.map(mapFollowup);
};

// Note: we reuse the lead_followups table with a customer_followups table below
const getCustomerFollowups = async (customerId, organizationId) => {
  const result = await pool.query(
    `SELECT f.*, u.name AS author_name
     FROM customer_followups f
     JOIN users u ON u.id = f.author_id
     WHERE f.customer_id = $1 AND f.organization_id = $2
     ORDER BY f.followup_date DESC, f.created_at DESC`,
    [customerId, organizationId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    note: row.note,
    followupDate: row.followup_date,
    nextFollowupDate: row.next_followup_date,
    author: row.author_name,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

const createFollowup = async (organizationId, authorId, customerId, payload) => {
  const { note, followupDate, nextFollowupDate } = payload;
  if (!note || !note.trim()) {
    const err = new Error("Note is required");
    err.statusCode = 400;
    throw err;
  }
  const result = await pool.query(
    `INSERT INTO customer_followups (organization_id, customer_id, author_id, note, followup_date, next_followup_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      organizationId,
      customerId,
      authorId,
      note.trim(),
      followupDate || new Date().toISOString().split("T")[0],
      nextFollowupDate || null,
    ]
  );
  const row = await pool.query(
    `SELECT f.*, u.name AS author_name
     FROM customer_followups f JOIN users u ON u.id = f.author_id
     WHERE f.id = $1`,
    [result.rows[0].id]
  );
  return {
    id: row.rows[0].id,
    customerId: row.rows[0].customer_id,
    note: row.rows[0].note,
    followupDate: row.rows[0].followup_date,
    nextFollowupDate: row.rows[0].next_followup_date,
    author: row.rows[0].author_name,
    authorId: row.rows[0].author_id,
    createdAt: row.rows[0].created_at,
    updatedAt: row.rows[0].updated_at,
  };
};

const updateFollowup = async (id, organizationId, authorId, payload) => {
  const { note, followupDate, nextFollowupDate } = payload;
  const result = await pool.query(
    `UPDATE customer_followups
     SET note = COALESCE($1, note),
         followup_date = COALESCE($2, followup_date),
         next_followup_date = $3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND organization_id = $5 AND author_id = $6
     RETURNING id`,
    [note || null, followupDate || null, nextFollowupDate || null, id, organizationId, authorId]
  );
  if (result.rows.length === 0) {
    const err = new Error("Follow-up not found");
    err.statusCode = 404;
    throw err;
  }
  const row = await pool.query(
    `SELECT f.*, u.name AS author_name
     FROM customer_followups f JOIN users u ON u.id = f.author_id WHERE f.id = $1`,
    [id]
  );
  return {
    id: row.rows[0].id,
    customerId: row.rows[0].customer_id,
    note: row.rows[0].note,
    followupDate: row.rows[0].followup_date,
    nextFollowupDate: row.rows[0].next_followup_date,
    author: row.rows[0].author_name,
    authorId: row.rows[0].author_id,
    createdAt: row.rows[0].created_at,
    updatedAt: row.rows[0].updated_at,
  };
};

const deleteFollowup = async (id, organizationId, authorId) => {
  const result = await pool.query(
    `DELETE FROM customer_followups WHERE id = $1 AND organization_id = $2 AND author_id = $3 RETURNING id`,
    [id, organizationId, authorId]
  );
  if (result.rows.length === 0) {
    const err = new Error("Follow-up not found");
    err.statusCode = 404;
    throw err;
  }
  return { id };
};

module.exports = { getCustomerFollowups, createFollowup, updateFollowup, deleteFollowup };
