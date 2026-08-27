const pool = require('../config/db');

const getCustomFields = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { entityType } = req.query;
    let query = `SELECT * FROM custom_fields WHERE organization_id = $1`;
    const params = [organizationId];
    if (entityType) { query += ` AND entity_type = $2`; params.push(entityType); }
    query += ` ORDER BY entity_type, display_order, created_at`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get custom fields error:', err);
    res.status(500).json({ success: false, message: 'Failed to load custom fields' });
  }
};

const createCustomField = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { entity_type, field_name, field_label, field_type, field_options, is_required, display_order } = req.body;
    if (!entity_type || !field_name || !field_label || !field_type) {
      return res.status(400).json({ success: false, message: 'entity_type, field_name, field_label, and field_type are required' });
    }
    const result = await pool.query(
      `INSERT INTO custom_fields (organization_id, entity_type, field_name, field_label, field_type, field_options, is_required, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [organizationId, entity_type, field_name.toLowerCase().replace(/\s+/g, '_'), field_label, field_type,
       field_options ? JSON.stringify(field_options) : null, is_required || false, display_order || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'A field with this name already exists for this entity type' });
    console.error('Create custom field error:', err);
    res.status(500).json({ success: false, message: 'Failed to create custom field' });
  }
};

const updateCustomField = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { field_label, field_options, is_required, display_order } = req.body;
    const result = await pool.query(
      `UPDATE custom_fields SET field_label=COALESCE($1,field_label), field_options=COALESCE($2,field_options),
       is_required=COALESCE($3,is_required), display_order=COALESCE($4,display_order)
       WHERE id=$5 AND organization_id=$6 RETURNING *`,
      [field_label||null, field_options?JSON.stringify(field_options):null, is_required!=null?is_required:null, display_order||null, id, organizationId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Custom field not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update custom field' });
  }
};

const deleteCustomField = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    await pool.query(`DELETE FROM custom_fields WHERE id=$1 AND organization_id=$2`, [id, organizationId]);
    res.json({ success: true, message: 'Custom field deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete custom field' });
  }
};

const getCustomFieldValues = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { entityType, entityId } = req.params;
    const result = await pool.query(
      `SELECT cfv.*, cf.field_name, cf.field_label, cf.field_type, cf.field_options, cf.is_required
       FROM custom_field_values cfv
       JOIN custom_fields cf ON cfv.custom_field_id = cf.id
       WHERE cf.organization_id = $1 AND cf.entity_type = $2 AND cfv.entity_id = $3`,
      [organizationId, entityType, entityId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load custom field values' });
  }
};

const upsertCustomFieldValues = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { values } = req.body; // { [custom_field_id]: value }
    for (const [fieldId, value] of Object.entries(values)) {
      await pool.query(
        `INSERT INTO custom_field_values (custom_field_id, entity_id, value)
         VALUES ($1,$2,$3)
         ON CONFLICT (custom_field_id, entity_id) DO UPDATE SET value=$3, updated_at=CURRENT_TIMESTAMP`,
        [fieldId, entityId, value != null ? String(value) : null]
      );
    }
    res.json({ success: true, message: 'Values saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save custom field values' });
  }
};

module.exports = { getCustomFields, createCustomField, updateCustomField, deleteCustomField, getCustomFieldValues, upsertCustomFieldValues };
