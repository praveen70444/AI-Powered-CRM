const followupService = require("../services/leadFollowupService");
const leadService = require("../services/leadService");

const getFollowups = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { leadId } = req.params;
    // Verify lead belongs to this org/user
    await leadService.getLeadById(leadId, organizationId, userId);
    const followups = await followupService.getFollowups(leadId, organizationId);
    res.json({ success: true, data: followups });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Failed to fetch follow-ups" });
  }
};

const createFollowup = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { leadId } = req.params;
    await leadService.getLeadById(leadId, organizationId, userId);
    const followup = await followupService.createFollowup(organizationId, userId, leadId, req.body);
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
