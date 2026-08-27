const dealService = require("../services/dealService");
const getDeals = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { page = 1, limit = 200, search = '', stage = '' } = req.query;
    const result = await dealService.getDeals(organizationId, userId, {
      page: parseInt(page), limit: Math.min(parseInt(limit), 500), search, stage,
    });
    res.status(200).json({ success: true, message: "Deals fetched successfully", ...result });
  } catch (error) {
    console.error("Get deals error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to load deals" });
  }
};
const getDeal = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const deal = await dealService.getDealById(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Deal fetched successfully",
      data: deal,
    });
  } catch (error) {
    console.error("Get deal error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to load deal",
    });
  }
};
const createDeal = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const deal = await dealService.createDeal(organizationId, userId, req.body);
    res.status(201).json({
      success: true,
      message: "Deal created successfully",
      data: deal,
    });
  } catch (error) {
    console.error("Create deal error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to create deal",
    });
  }
};
const updateDeal = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const deal = await dealService.updateDeal(req.params.id, organizationId, userId, req.body);
    res.status(200).json({
      success: true,
      message: "Deal updated successfully",
      data: deal,
    });
  } catch (error) {
    console.error("Update deal error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to update deal",
    });
  }
};
const deleteDeal = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await dealService.deleteDeal(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Deal deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete deal error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to delete deal",
    });
  }
};
module.exports = {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
};
