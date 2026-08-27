const activityService = require("../services/activityService");
const getActivities = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { page = 1, limit = 100, search = '', type = '' } = req.query;
    const result = await activityService.getActivities(organizationId, userId, {
      page: parseInt(page), limit: Math.min(parseInt(limit), 500), search, type,
    });
    res.status(200).json({ success: true, message: "Activities fetched successfully", ...result });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to load activities" });
  }
};
const createActivity = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const activity = await activityService.createActivity(organizationId, userId, req.body);
    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Create activity error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to create activity",
    });
  }
};
const updateActivity = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const activity = await activityService.updateActivity(req.params.id, organizationId, userId, req.body);
    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Update activity error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to update activity",
    });
  }
};
const deleteActivity = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await activityService.deleteActivity(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete activity error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to delete activity",
    });
  }
};
module.exports = {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
};
