const employeeService = require("../services/employeeService");
const getProfile = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const profile = await employeeService.getEmployeeProfile(
      userId,
      organizationId
    );
    res.status(200).json({
      success: true,
      message: "Employee profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Get employee profile error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to load profile",
    });
  }
};
const updateProfile = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { name, phone, department, location } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }
    const profile = await employeeService.updateEmployeeProfile(
      userId,
      organizationId,
      {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        department: department ? department.trim() : null,
        location: location ? location.trim() : null,
      }
    );
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Update employee profile error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to update profile",
    });
  }
};
const getDashboard = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const dashboard = await employeeService.getEmployeeDashboard(
      userId,
      organizationId
    );
    res.status(200).json({
      success: true,
      message: "Employee dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    console.error("Get employee dashboard error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to load dashboard",
    });
  }
};
const getNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.user;
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );
    const prefs = result.rows[0] || {
      email_on_lead: true,
      email_on_task_due: true,
      email_on_deal_won: true,
      email_on_deal_close_soon: true,
      email_daily_digest: false,
      in_app_lead: true,
      in_app_task: true,
      in_app_deal: true,
      in_app_customer: true,
    };
    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error("Get notification preferences error:", err);
    res.status(500).json({ success: false, message: "Failed to load notification preferences" });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.user;
    const pool = require("../config/db");
    const {
      email_on_lead, email_on_task_due, email_on_deal_won, email_on_deal_close_soon,
      email_daily_digest, in_app_lead, in_app_task, in_app_deal, in_app_customer,
    } = req.body;

    await pool.query(
      `INSERT INTO notification_preferences
         (user_id, email_on_lead, email_on_task_due, email_on_deal_won, email_on_deal_close_soon,
          email_daily_digest, in_app_lead, in_app_task, in_app_deal, in_app_customer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (user_id) DO UPDATE SET
         email_on_lead = $2, email_on_task_due = $3, email_on_deal_won = $4,
         email_on_deal_close_soon = $5, email_daily_digest = $6, in_app_lead = $7,
         in_app_task = $8, in_app_deal = $9, in_app_customer = $10,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, email_on_lead, email_on_task_due, email_on_deal_won, email_on_deal_close_soon,
       email_daily_digest, in_app_lead, in_app_task, in_app_deal, in_app_customer]
    );

    res.json({ success: true, message: "Preferences updated" });
  } catch (err) {
    console.error("Update notification preferences error:", err);
    res.status(500).json({ success: false, message: "Failed to update notification preferences" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getNotificationPreferences,
  updateNotificationPreferences,
};
