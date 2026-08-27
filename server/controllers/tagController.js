const tagService = require("../services/tagService");

const getTags = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const tags = await tagService.getTags(organizationId);
    res.json({ success: true, data: tags });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch tags" });
  }
};

const createTag = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const tag = await tagService.createTag(organizationId, userId, req.body);
    res.status(201).json({ success: true, data: tag, message: "Tag created successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to create tag" });
  }
};

const deleteTag = async (req, res) => {
  try {
    const { organizationId } = req.user;
    await tagService.deleteTag(req.params.id, organizationId);
    res.json({ success: true, message: "Tag deleted successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to delete tag" });
  }
};

const getEntityTags = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { entityType, entityId } = req.params;
    const tags = await tagService.getEntityTags(entityType, entityId, organizationId);
    res.json({ success: true, data: tags });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch entity tags" });
  }
};

const addTagToEntity = async (req, res) => {
  try {
    const { entityType, entityId, tagId } = req.params;
    await tagService.addTagToEntity(tagId, entityType, entityId);
    res.json({ success: true, message: "Tag added to entity" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add tag" });
  }
};

const removeTagFromEntity = async (req, res) => {
  try {
    const { entityType, entityId, tagId } = req.params;
    await tagService.removeTagFromEntity(tagId, entityType, entityId);
    res.json({ success: true, message: "Tag removed from entity" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove tag" });
  }
};

module.exports = { getTags, createTag, deleteTag, getEntityTags, addTagToEntity, removeTagFromEntity };
