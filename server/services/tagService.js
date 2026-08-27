const pool = require('../config/db');

const getTags = async (organizationId) => {
  const result = await pool.query(`SELECT * FROM tags WHERE organization_id=$1 ORDER BY name ASC`, [organizationId]);
  return result.rows;
};

const createTag = async (organizationId, userId, { name, color = '#3B82F6' }) => {
  if (!name) { const e = new Error('Tag name is required'); e.statusCode = 400; throw e; }
  const result = await pool.query(
    `INSERT INTO tags (organization_id, name, color) VALUES ($1,$2,$3) ON CONFLICT (organization_id, name) DO UPDATE SET color=$3 RETURNING *`,
    [organizationId, name.trim(), color]
  );
  return result.rows[0];
};

const deleteTag = async (id, organizationId) => {
  const result = await pool.query(`DELETE FROM tags WHERE id=$1 AND organization_id=$2 RETURNING id`, [id, organizationId]);
  if (!result.rows[0]) { const e = new Error('Tag not found'); e.statusCode = 404; throw e; }
  return { id };
};

const getEntityTags = async (entityType, entityId, organizationId) => {
  const result = await pool.query(
    `SELECT t.* FROM tags t JOIN entity_tags et ON t.id=et.tag_id
     WHERE et.entity_type=$1 AND et.entity_id=$2 AND t.organization_id=$3 ORDER BY t.name ASC`,
    [entityType, entityId, organizationId]
  );
  return result.rows;
};

const addTagToEntity = async (tagId, entityType, entityId, organizationId) => {
  // Verify tag belongs to org
  const tagCheck = await pool.query(`SELECT id FROM tags WHERE id=$1 AND organization_id=$2`, [tagId, organizationId]);
  if (!tagCheck.rows[0]) { const e = new Error('Tag not found'); e.statusCode = 404; throw e; }
  await pool.query(
    `INSERT INTO entity_tags (tag_id, entity_type, entity_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [tagId, entityType, entityId]
  );
  return { success: true };
};

const removeTagFromEntity = async (tagId, entityType, entityId) => {
  await pool.query(`DELETE FROM entity_tags WHERE tag_id=$1 AND entity_type=$2 AND entity_id=$3`, [tagId, entityType, entityId]);
  return { success: true };
};

module.exports = { getTags, createTag, deleteTag, getEntityTags, addTagToEntity, removeTagFromEntity };
