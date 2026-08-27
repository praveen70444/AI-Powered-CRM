const leadService = require("../services/leadService");
const leadConversionService = require("../services/leadConversionService");
const getLeads = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { page = 1, limit = 50, search = '', status = '', source = '' } = req.query;
    const result = await leadService.getLeads(organizationId, userId, {
      page: parseInt(page), limit: Math.min(parseInt(limit), 200), search, status, source,
    });
    res.status(200).json({ success: true, message: "Leads fetched successfully", ...result });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to load leads" });
  }
};
const getLead = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const lead = await leadService.getLeadById(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Lead fetched successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Get lead error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to load lead",
    });
  }
};
const createLead = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const lead = await leadService.createLead(organizationId, userId, req.body);
    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to create lead",
    });
  }
};
const updateLead = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const lead = await leadService.updateLead(req.params.id, organizationId, userId, req.body);
    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Update lead error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to update lead",
    });
  }
};
const deleteLead = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await leadService.deleteLead(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to delete lead",
    });
  }
};

const convertLead = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const leadId = req.params.id;
    const options = req.body;
    
    const result = await leadConversionService.convertLeadToCustomer(
      leadId,
      organizationId,
      userId,
      options
    );
    
    res.status(200).json({
      success: true,
      message: "Lead converted to customer successfully",
      data: result,
    });
  } catch (error) {
    console.error("Convert lead error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to convert lead",
    });
  }
};

const getConversionHistory = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const leadId = req.params.id;
    
    const history = await leadConversionService.getLeadConversionHistory(leadId, organizationId);
    
    res.status(200).json({
      success: true,
      message: "Conversion history fetched successfully",
      data: history,
    });
  } catch (error) {
    console.error("Get conversion history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversion history",
    });
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  getConversionHistory,
};
