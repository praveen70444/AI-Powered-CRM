const webhookService = require("../services/webhookService");

const getWebhooks = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const webhooks = await webhookService.getWebhooks(organizationId);
    res.json({ success: true, data: webhooks });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch webhooks" });
  }
};

const createWebhook = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const webhook = await webhookService.createWebhook(organizationId, userId, req.body);
    res.status(201).json({ success: true, data: webhook, message: "Webhook created successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to create webhook" });
  }
};

const updateWebhook = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const webhook = await webhookService.updateWebhook(req.params.id, organizationId, req.body);
    res.json({ success: true, data: webhook, message: "Webhook updated successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to update webhook" });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const { organizationId } = req.user;
    await webhookService.deleteWebhook(req.params.id, organizationId);
    res.json({ success: true, message: "Webhook deleted successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to delete webhook" });
  }
};

const getApiKeys = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const keys = await webhookService.getApiKeys(organizationId);
    res.json({ success: true, data: keys });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch API keys" });
  }
};

const createApiKey = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const key = await webhookService.createApiKey(organizationId, userId, req.body);
    res.status(201).json({ success: true, data: key, message: "API key created. Save the raw key — it won't be shown again." });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to create API key" });
  }
};

const revokeApiKey = async (req, res) => {
  try {
    const { organizationId } = req.user;
    await webhookService.revokeApiKey(req.params.id, organizationId);
    res.json({ success: true, message: "API key revoked successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to revoke API key" });
  }
};

module.exports = { getWebhooks, createWebhook, updateWebhook, deleteWebhook, getApiKeys, createApiKey, revokeApiKey };
