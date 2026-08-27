const express = require("express");
const {
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
} = require("../controllers/organizationController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireOrgAdmin } = require("../middleware/roleMiddleware");
const { upload } = require("../services/fileUploadService");
const { uploadLimiter } = require("../middleware/securityMiddleware");
const fileController = require("../controllers/fileController");
const {
  getWebhooks, createWebhook, updateWebhook, deleteWebhook,
  getApiKeys, createApiKey, revokeApiKey,
} = require("../controllers/webhookController");
const {
  getCustomFields, createCustomField, updateCustomField, deleteCustomField,
} = require("../controllers/customFieldController");

const router = express.Router();

// Apply auth + org admin guard to all org routes
router.use(authMiddleware, requireOrgAdmin);

// Dashboard
router.get("/dashboard", getOrganizationDashboard);

// Employees
router.get("/employees", getOrganizationEmployees);
router.patch("/employees/:id/status", updateEmployeeStatus);

// Invitations
router.get("/invitations", getOrganizationInvitations);
router.post("/invitations", createInvitation);
router.patch("/invitations/:id/cancel", cancelInvitation);

// Settings
router.get("/settings", getOrganizationSettings);
router.put("/settings", updateOrganizationSettings);

// Profile
router.get("/profile", getOrganizationProfile);
router.put("/profile", updateOrganizationProfile);

// Logo upload
router.post(
  "/logo",
  uploadLimiter,
  (req, res, next) => { req.uploadType = "logos"; next(); },
  upload.single("logo"),
  fileController.uploadLogo
);

// Notifications (org admin)
router.get("/notifications", getOrgNotifications);
router.put("/notifications/read-all", markAllOrgNotificationsRead);
router.put("/notifications/:id/read", markOrgNotificationRead);

// Audit logs
router.get("/audit-logs", getAuditLogs);

// Custom Fields (org admin manages field definitions)
router.get("/custom-fields", getCustomFields);
router.post("/custom-fields", createCustomField);
router.put("/custom-fields/:id", updateCustomField);
router.delete("/custom-fields/:id", deleteCustomField);

// Webhooks
router.get("/webhooks", getWebhooks);
router.post("/webhooks", createWebhook);
router.put("/webhooks/:id", updateWebhook);
router.delete("/webhooks/:id", deleteWebhook);

// API Keys
router.get("/api-keys", getApiKeys);
router.post("/api-keys", createApiKey);
router.delete("/api-keys/:id", revokeApiKey);

module.exports = router;
