const taskService = require("../services/taskService");
const getTasks = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { page = 1, limit = 200, search = '', status = '', priority = '' } = req.query;
    const result = await taskService.getTasks(organizationId, userId, {
      page: parseInt(page), limit: Math.min(parseInt(limit), 500), search, status, priority,
    });
    res.status(200).json({ success: true, message: "Tasks fetched successfully", ...result });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to load tasks" });
  }
};
const getTask = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const task = await taskService.getTaskById(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to load task",
    });
  }
};
const createTask = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const task = await taskService.createTask(organizationId, userId, req.body);
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to create task",
    });
  }
};
const updateTask = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const task = await taskService.updateTask(req.params.id, organizationId, userId, req.body);
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to update task",
    });
  }
};
const deleteTask = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await taskService.deleteTask(req.params.id, organizationId, userId);
    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to delete task",
    });
  }
};
module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
