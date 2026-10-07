const express = require("express");
const {
  getProfile,
  updateProfile,
  getDashboard,
  getNotificationPreferences,
  updateNotificationPreferences,
} = require("../controllers/employeeController");
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  getConversionHistory,
} = require("../controllers/leadController");
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
} = require("../controllers/dealController");
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} = require("../controllers/activityController");
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");
const {
  exportLeads,
  exportCustomers,
  exportDeals,
  exportTasks,
} = require("../controllers/exportController");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} = require("../controllers/productController");
const {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  addLineItem,
  removeLineItem,
} = require("../controllers/quoteController");
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/calendarController");
const {
  getTags,
  createTag,
  deleteTag,
  getEntityTags,
  addTagToEntity,
  removeTagFromEntity,
} = require("../controllers/tagController");
const { globalSearch } = require("../controllers/searchController");
const { checkLeadDuplicate, checkCustomerDuplicate } = require("../controllers/duplicateController");
const { getAnalyticsOverview, getSalesForecast, getWinLossAnalysis } = require("../controllers/analyticsController");
const { getCustomFieldValues, upsertCustomFieldValues, getCustomFields } = require("../controllers/customFieldController");
const { getFollowups, createFollowup, updateFollowup, deleteFollowup } = require("../controllers/leadFollowupController");
const { bulkUploadLeads } = require("../controllers/leadBulkController");
const {
  getFollowups: getCustFollowups,
  createFollowup: createCustFollowup,
  updateFollowup: updateCustFollowup,
  deleteFollowup: deleteCustFollowup,
} = require("../controllers/customerFollowupController");
const industryLeadsController = require("../controllers/industryLeadsController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireEmployee } = require("../middleware/roleMiddleware");
const router = express.Router();
router.use(authMiddleware, requireEmployee);

router.get("/dashboard", getDashboard);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Notification preferences
router.get("/notification-preferences", getNotificationPreferences);
router.put("/notification-preferences", updateNotificationPreferences);

// Global search
router.get("/search", globalSearch);

// Analytics
router.get("/analytics/overview", getAnalyticsOverview);
router.get("/analytics/forecast", getSalesForecast);
router.get("/analytics/win-loss", getWinLossAnalysis);

// Duplicate detection (BEFORE /:id routes)
router.get("/leads/check-duplicate", checkLeadDuplicate);
router.get("/customers/check-duplicate", checkCustomerDuplicate);

// Leads
router.get("/leads", getLeads);
router.post("/leads", createLead);
router.post("/leads/bulk-upload", bulkUploadLeads);
router.get("/leads/:id", getLead);
router.put("/leads/:id", updateLead);
router.delete("/leads/:id", deleteLead);
router.post("/leads/:id/convert", convertLead);
router.get("/leads/:id/conversion-history", getConversionHistory);

// Industry specific leads (Construction, Redevelopment, Maintenance)
router.get("/industry-leads/:type", industryLeadsController.getLeads);
router.post("/industry-leads/:type", industryLeadsController.createLead);
router.put("/industry-leads/:type/:id", industryLeadsController.updateLead);
router.delete("/industry-leads/:type/:id", industryLeadsController.deleteLead);

// Lead follow-ups
router.get("/leads/:leadId/followups", getFollowups);
router.post("/leads/:leadId/followups", createFollowup);
router.put("/leads/followups/:id", updateFollowup);
router.delete("/leads/followups/:id", deleteFollowup);

// Customers
router.get("/customers", getCustomers);
router.post("/customers", createCustomer);
router.get("/customers/:id", getCustomer);
router.put("/customers/:id", updateCustomer);
router.delete("/customers/:id", deleteCustomer);

// Customer follow-ups
router.get("/customers/:customerId/followups", getCustFollowups);
router.post("/customers/:customerId/followups", createCustFollowup);
router.put("/customers/followups/:id", updateCustFollowup);
router.delete("/customers/followups/:id", deleteCustFollowup);

// Deals
router.get("/deals", getDeals);
router.post("/deals", createDeal);
router.get("/deals/:id", getDeal);
router.put("/deals/:id", updateDeal);
router.delete("/deals/:id", deleteDeal);

// Tasks
router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.get("/tasks/:id", getTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

// Activities
router.get("/activities", getActivities);
router.post("/activities", createActivity);
router.put("/activities/:id", updateActivity);
router.delete("/activities/:id", deleteActivity);

// Notes
router.get("/notes", getNotes);
router.post("/notes", createNote);
router.put("/notes/:id", updateNote);
router.delete("/notes/:id", deleteNote);

// Notifications
router.get("/notifications", getNotifications);
router.put("/notifications/read-all", markAllNotificationsRead);
router.put("/notifications/:id/read", markNotificationRead);

// Export routes
router.get("/export/leads", exportLeads);
router.get("/export/customers", exportCustomers);
router.get("/export/deals", exportDeals);
router.get("/export/tasks", exportTasks);

// Products
router.get("/products/all", getAllProducts);
router.get("/products", getProducts);
router.post("/products", createProduct);
router.get("/products/:id", getProductById);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Quotes
router.get("/quotes", getQuotes);
router.post("/quotes", createQuote);
router.get("/quotes/:id", getQuoteById);
router.put("/quotes/:id", updateQuote);
router.delete("/quotes/:id", deleteQuote);
router.post("/quotes/:id/line-items", addLineItem);
router.delete("/quotes/:quoteId/line-items/:itemId", removeLineItem);

// Calendar
router.get("/calendar", getEvents);
router.post("/calendar", createEvent);
router.put("/calendar/:id", updateEvent);
router.delete("/calendar/:id", deleteEvent);

// Tags
router.get("/tags", getTags);
router.post("/tags", createTag);
router.delete("/tags/:id", deleteTag);
router.get("/tags/:entityType/:entityId", getEntityTags);
router.post("/tags/:entityType/:entityId/:tagId", addTagToEntity);
router.delete("/tags/:entityType/:entityId/:tagId", removeTagFromEntity);

// Custom field values (employees read/write values per entity)
router.get("/custom-fields", getCustomFields);
router.get("/custom-field-values/:entityType/:entityId", getCustomFieldValues);
router.post("/custom-field-values/:entityType/:entityId", upsertCustomFieldValues);

module.exports = router;
