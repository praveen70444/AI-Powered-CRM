const pool = require("../config/db");
const NOTE_RELATED_TYPES = ["Lead", "Customer", "Deal"];
const mapNote = (row) => ({
  id: row.id,
  relatedTo: row.related_to,
  relatedType: row.related_type,
  content: row.content,
  author: row.author_name,
  authorId: row.author_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const getNotes = async (organizationId, authorId, { relatedType, relatedTo } = {}) => {
  const conditions = ['n.organization_id = $1', 'n.author_id = $2'];
  const params = [organizationId, authorId];
  let idx = 3;
  if (relatedType) { conditions.push(`n.related_type = $${idx}`); params.push(relatedType); idx++; }
  if (relatedTo)   { conditions.push(`n.related_to = $${idx}`);   params.push(relatedTo);   idx++; }
  const where = conditions.join(' AND ');
  const result = await pool.query(
    `SELECT n.*, u.name AS author_name
     FROM notes n
     JOIN users u ON u.id = n.author_id
     WHERE ${where}
     ORDER BY n.created_at DESC`,
    params
  );
  return result.rows.map(mapNote);
};
const getNoteById = async (id, organizationId, authorId) => {
  const result = await pool.query(
    `
    SELECT n.*, u.name AS author_name
    FROM notes n
    JOIN users u ON u.id = n.author_id
    WHERE n.id = $1
      AND n.organization_id = $2
      AND n.author_id = $3
    `,
    [id, organizationId, authorId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Note not found");
    error.statusCode = 404;
    throw error;
  }
  return mapNote(result.rows[0]);
};
const createNote = async (organizationId, authorId, payload) => {
  const { relatedTo, relatedType, content } = payload;
  if (!relatedTo || !content) {
    const error = new Error("Related To and content are required");
    error.statusCode = 400;
    throw error;
  }
  const finalRelatedType = relatedType || "Lead";
  if (!NOTE_RELATED_TYPES.includes(finalRelatedType)) {
    const error = new Error("Invalid related type");
    error.statusCode = 400;
    throw error;
  }
  const result = await pool.query(
    `
    INSERT INTO notes (
      organization_id, author_id, related_to, related_type, content
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [organizationId, authorId, relatedTo, finalRelatedType, content]
  );
  return getNoteById(result.rows[0].id, organizationId, authorId);
};
const updateNote = async (id, organizationId, authorId, payload) => {
  const { relatedTo, relatedType, content } = payload;
  if (relatedType && !NOTE_RELATED_TYPES.includes(relatedType)) {
    const error = new Error("Invalid related type");
    error.statusCode = 400;
    throw error;
  }
  const result = await pool.query(
    `
    UPDATE notes
    SET
      related_to = COALESCE($1, related_to),
      related_type = COALESCE($2, related_type),
      content = COALESCE($3, content),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
      AND organization_id = $5
      AND author_id = $6
    RETURNING id
    `,
    [relatedTo || null, relatedType || null, content || null, id, organizationId, authorId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Note not found");
    error.statusCode = 404;
    throw error;
  }

  return getNoteById(id, organizationId, authorId);
};
const deleteNote = async (id, organizationId, authorId) => {
  const result = await pool.query(
    `
    DELETE FROM notes
    WHERE id = $1
      AND organization_id = $2
      AND author_id = $3
    RETURNING id
    `,
    [id, organizationId, authorId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Note not found");
    error.statusCode = 404;
    throw error;
  }

  return { id };
};
module.exports = {
  NOTE_RELATED_TYPES,
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
};
