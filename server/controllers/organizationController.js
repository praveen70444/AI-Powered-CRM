const organizationService = require("../services/organizationService");
const pool = require("../config/db");
const getOrganizationDashboard = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const dashboard =
      await organizationService.getOrganizationDashboard(
        organizationId
      );
    res.status(200).json({
      success: true,
      message: "Organization dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    console.error("Organization dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load organization dashboard",
    });
  }
};
const getOrganizationEmployees = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const employees =
      await organizationService.getOrganizationEmployees(
        organizationId
      );
    res.status(200).json({
      success: true,
      message: "Organization employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Organization employees error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load organization employees",
    });
  }
};
const createInvitation = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const invitedBy = req.user.userId;
    const {
      email,
      role = "SALES_EXECUTIVE",
    } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Employee email is required",
      });
    }
    const invitation =
      await organizationService.createInvitation({
        organizationId,
        invitedBy,
        email,
        role,
      });
    res.status(201).json({
      success: true,
      message: "Employee invitation created successfully",
      data: invitation,
    });
  } catch (error) {
    console.error("Create invitation error:", error);
    if (
      error.message === "Employee already exists" ||
      error.message === "A pending invitation already exists" ||
      error.message === "Invalid employee role"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create invitation",
    });
  }
};
const getOrganizationInvitations = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const invitations =
      await organizationService.getOrganizationInvitations(
        organizationId
      );
    res.status(200).json({
      success: true,
      message: "Organization invitations fetched successfully",
      data: invitations,
    });
  } catch (error) {
    console.error("Get invitations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load invitations",
    });
  }
};
const getOrganizationSettings = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const result = await pool.query(
      `SELECT id, name, status, industry, website, phone, address,
              city, state, country, postal_code, timezone, currency,
              logo_url, created_at, updated_at
       FROM organizations WHERE id = $1`,
      [organizationId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }
    res.status(200).json({
      success: true,
      message: "Organization settings fetched successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get organization settings error:", error);
    res.status(500).json({ success: false, message: "Failed to load organization settings" });
  }
};
const updateOrganizationSettings = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name, industry, website, phone, address,
      city, state, country, postalCode, timezone, currency
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required",
      });
    }

    const result = await pool.query(
      `UPDATE organizations
       SET name = $1, industry = $2, website = $3, phone = $4,
           address = $5, city = $6, state = $7, country = $8,
           postal_code = $9, timezone = $10, currency = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        name.trim(), industry || null, website || null, phone || null,
        address || null, city || null, state || null, country || null,
        postalCode || null, timezone || 'UTC', currency || 'USD',
        organizationId,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Organization settings updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update organization settings error:", error);
    res.status(500).json({ success: false, message: "Failed to update organization settings" });
  }
};
const getOrganizationProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile =
      await organizationService.getOrganizationProfile(
        userId
      );
    res.status(200).json({
      success: true,
      message: "Organization profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    console.error(
      "Get organization profile error:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};


const updateOrganizationProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, department, location } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1, phone = $2, department = $3, location = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, organization_id, name, email, role, status, phone, department, location, avatar_url, created_at, last_login_at`,
      [name.trim(), phone || null, department || null, location || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update organization profile error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// ── ORG ADMIN NOTIFICATIONS ──────────────────────────────────────

const getOrgNotifications = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE organization_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 50`,
      [organizationId, userId]
    );
    const unreadCount = result.rows.filter(n => !n.is_read).length;
    res.json({
      success: true,
      data: result.rows,
      unreadCount,
    });
  } catch (error) {
    console.error("Get org notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
};

const markOrgNotificationRead = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
      [id, organizationId, userId]
    );
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark org notification read error:", error);
    res.status(500).json({ success: false, message: "Failed to update notification" });
  }
};

const markAllOrgNotificationsRead = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    await pool.query(
      `UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE organization_id = $1 AND user_id = $2 AND is_read = FALSE`,
      [organizationId, userId]
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all org notifications read error:", error);
    res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};

// ── EMPLOYEE MANAGEMENT ──────────────────────────────────────────

const updateEmployeeStatus = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const result = await pool.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND organization_id = $3 AND role != 'ORG_ADMIN'
       RETURNING id, name, email, role, status`,
      [status, id, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({
      success: true,
      message: "Employee status updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update employee status error:", error);
    res.status(500).json({ success: false, message: "Failed to update employee status" });
  }
};

const cancelInvitation = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE invitations SET status = 'CANCELLED'
       WHERE id = $1 AND organization_id = $2 AND status = 'PENDING'
       RETURNING id`,
      [id, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invitation not found or already processed" });
    }

    res.json({ success: true, message: "Invitation cancelled successfully" });
  } catch (error) {
    console.error("Cancel invitation error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel invitation" });
  }
};

// ── AUDIT LOGS ───────────────────────────────────────────────────

const getAuditLogs = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.organization_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs WHERE organization_id = $1`,
      [organizationId]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ success: false, message: "Failed to load audit logs" });
  }
};

module.exports = {
  getOrganizationDashboard,
  getOrganizationEmployees,
  createInvitation,
  getOrganizationInvitations,
  getOrganizationSettings,
  updateOrganizationSettings,
  getOrganizationProfile,
  updateOrganizationProfile,
  getOrgNotifications,
  markOrgNotificationRead,
  markAllOrgNotificationsRead,
  updateEmployeeStatus,
  cancelInvitation,
  getAuditLogs,
};