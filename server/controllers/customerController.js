const customerService = require("../services/customerService");
const getCustomers = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    const result = await customerService.getCustomers(organizationId, userId, {
      page: parseInt(page), limit: Math.min(parseInt(limit), 200), search, status,
    });
    res.status(200).json({ success: true, message: "Customers fetched successfully", ...result });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to load customers" });
  }
};
const getCustomer = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const customer = await customerService.getCustomerById(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to load customer",
    });
  }
};
const createCustomer = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const customer = await customerService.createCustomer(organizationId, userId, req.body);
    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to create customer",
    });
  }
};
const updateCustomer = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const customer = await customerService.updateCustomer(req.params.id, organizationId, userId, req.body);
    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to update customer",
    });
  }
};
const deleteCustomer = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await customerService.deleteCustomer(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to delete customer",
    });
  }
};
module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
