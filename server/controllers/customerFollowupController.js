const followupService = require("../services/customerFollowupService");
const customerService = require("../services/customerService");

const getFollowups = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { customerId } = req.params;
    await customerService.getCustomerById(customerId, organizationId, userId);
    const followups = await followupService.getCustomerFollowups(customerId, organizationId);
    res.json({ success: true, data: followups });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to fetch follow-ups" });
  }
};

const createFollowup = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { customerId } = req.params;
    await customerService.getCustomerById(customerId, organizationId, userId);
    const followup = await followupService.createFollowup(organizationId, userId, customerId, req.body);
    res.status(201).json({ success: true, data: followup, message: "Follow-up added" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to create follow-up" });
  }
};

const updateFollowup = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const followup = await followupService.updateFollowup(req.params.id, organizationId, userId, req.body);
    res.json({ success: true, data: followup, message: "Follow-up updated" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to update follow-up" });
  }
};

const deleteFollowup = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    await followupService.deleteFollowup(req.params.id, organizationId, userId);
    res.json({ success: true, message: "Follow-up deleted" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to delete follow-up" });
  }
};

module.exports = { getFollowups, createFollowup, updateFollowup, deleteFollowup };
