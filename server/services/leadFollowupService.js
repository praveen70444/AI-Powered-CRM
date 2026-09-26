const pool = require("../config/db");

const mapFollowup = (row) => ({
  id: row.id,
  leadId: row.lead_id,
  note: row.note,
  followupDate: row.followup_date,
  nextFollowupDate: row.next_followup_date,
  author: row.author_name,
  authorId: row.author_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getFollowups = async (leadId, organizationId) => {
  const result = await pool.query(
    `SELECT f.*, u.name AS author_name
     FROM lead_followups f
     JOIN users u ON u.id = f.author_id
     WHERE f.lead_id = $1 AND f.organization_id = $2
     ORDER BY f.followup_date DESC, f.created_at DESC`,
    [leadId, organizationId]
  );
  return result.rows.map(mapFollowup);
};

const createFollowup = async (organizationId, authorId, leadId, payload) => {
  const { note, followupDate, nextFollowupDate } = payload;
  if (!note || !note.trim()) {
    const err = new Error("Note is required");
    err.statusCode = 400;
    throw err;
  }
  const result = await pool.query(
    `INSERT INTO lead_followups (organization_id, lead_id, author_id, note, followup_date, next_followup_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      organizationId,
      leadId,
      authorId,
      note.trim(),
      followupDate || new Date().toISOString().split("T")[0],
      nextFollowupDate || null,
    ]
  );
  const row = await pool.query(
    `SELECT f.*, u.name AS author_name
     FROM lead_followups f JOIN users u ON u.id = f.author_id
     WHERE f.id = $1`,
    [result.rows[0].id]
  );
  return mapFollowup(row.rows[0]);
};

const updateFollowup = async (id, organizationId, authorId, payload) => {
  const { note, followupDate, nextFollowupDate } = payload;
  const result = await pool.query(
    `UPDATE lead_followups
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
     FROM lead_followups f JOIN users u ON u.id = f.author_id
     WHERE f.id = $1`,
    [id]
  );
  return mapFollowup(row.rows[0]);
};

const deleteFollowup = async (id, organizationId, authorId) => {
  const result = await pool.query(
    `DELETE FROM lead_followups WHERE id = $1 AND organization_id = $2 AND author_id = $3 RETURNING id`,
    [id, organizationId, authorId]
  );
  if (result.rows.length === 0) {
    const err = new Error("Follow-up not found");
    err.statusCode = 404;
    throw err;
  }
  return { id };
};

module.exports = { getFollowups, createFollowup, updateFollowup, deleteFollowup };
