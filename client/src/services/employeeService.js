import api from "./api";

// ── PROFILE ─────────────────────────────────────────────────────
export const getEmployeeProfile = async () => {
  const response = await api.get("/employee/profile");
  return response.data;
};
export const updateEmployeeProfile = async (payload) => {
  const response = await api.put("/employee/profile", payload);
  return response.data;
};
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post("/files/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ── DASHBOARD ────────────────────────────────────────────────────
export const getEmployeeDashboard = async () => {
  const response = await api.get("/employee/dashboard");
  return response.data;
};

// ── LEADS ────────────────────────────────────────────────────────
export const getLeads = async () => {
  const response = await api.get("/employee/leads");
  return response.data;
};
export const createLead = async (payload) => {
  const response = await api.post("/employee/leads", payload);
  return response.data;
};
export const updateLead = async (id, payload) => {
  const response = await api.put(`/employee/leads/${id}`, payload);
  return response.data;
};
export const deleteLead = async (id) => {
  const response = await api.delete(`/employee/leads/${id}`);
  return response.data;
};
export const convertLead = async (id, options = {}) => {
  const response = await api.post(`/employee/leads/${id}/convert`, options);
  return response.data;
};
export const exportLeads = (format = "csv") => {
  // Use exportService.exportLeads() instead — authenticated blob download
  console.warn("Use exportService.exportLeads() for authenticated downloads");
};

// Lead follow-ups
export const getLeadFollowups = async (leadId) => {
  const response = await api.get(`/employee/leads/${leadId}/followups`);
  return response.data;
};
export const createLeadFollowup = async (leadId, payload) => {
  const response = await api.post(`/employee/leads/${leadId}/followups`, payload);
  return response.data;
};
export const updateLeadFollowup = async (id, payload) => {
  const response = await api.put(`/employee/leads/followups/${id}`, payload);
  return response.data;
};
export const deleteLeadFollowup = async (id) => {
  const response = await api.delete(`/employee/leads/followups/${id}`);
  return response.data;
};

// Lead bulk upload
export const bulkUploadLeads = async (leads) => {
  const response = await api.post("/employee/leads/bulk-upload", { leads });
  return response.data;
};

// ── CUSTOMERS ────────────────────────────────────────────────────
export const getCustomers = async () => {
  const response = await api.get("/employee/customers");
  return response.data;
};
export const createCustomer = async (payload) => {
  const response = await api.post("/employee/customers", payload);
  return response.data;
};
export const updateCustomer = async (id, payload) => {
  const response = await api.put(`/employee/customers/${id}`, payload);
  return response.data;
};
export const deleteCustomer = async (id) => {
  const response = await api.delete(`/employee/customers/${id}`);
  return response.data;
};
export const exportCustomers = (format = "csv") => {
  console.warn("Use exportService.exportCustomers() for authenticated downloads");
};

// Customer follow-ups
export const getCustomerFollowups = async (customerId) => {
  const response = await api.get(`/employee/customers/${customerId}/followups`);
  return response.data;
};
export const createCustomerFollowup = async (customerId, payload) => {
  const response = await api.post(`/employee/customers/${customerId}/followups`, payload);
  return response.data;
};
export const updateCustomerFollowup = async (id, payload) => {
  const response = await api.put(`/employee/customers/followups/${id}`, payload);
  return response.data;
};
export const deleteCustomerFollowup = async (id) => {
  const response = await api.delete(`/employee/customers/followups/${id}`);
  return response.data;
};

// ── DEALS ────────────────────────────────────────────────────────
export const getDeals = async () => {
  const response = await api.get("/employee/deals");
  return response.data;
};
export const createDeal = async (payload) => {
  const response = await api.post("/employee/deals", payload);
  return response.data;
};
export const updateDeal = async (id, payload) => {
  const response = await api.put(`/employee/deals/${id}`, payload);
  return response.data;
};
export const deleteDeal = async (id) => {
  const response = await api.delete(`/employee/deals/${id}`);
  return response.data;
};
export const exportDeals = (format = "csv") => {
  console.warn("Use exportService.exportDeals() for authenticated downloads");
};

// ── TASKS ────────────────────────────────────────────────────────
export const getTasks = async () => {
  const response = await api.get("/employee/tasks");
  return response.data;
};
export const createTask = async (payload) => {
  const response = await api.post("/employee/tasks", payload);
  return response.data;
};
export const updateTask = async (id, payload) => {
  const response = await api.put(`/employee/tasks/${id}`, payload);
  return response.data;
};
export const deleteTask = async (id) => {
  const response = await api.delete(`/employee/tasks/${id}`);
  return response.data;
};
export const exportTasks = (format = "csv") => {
  console.warn("Use exportService.exportTasks() for authenticated downloads");
};

// ── ACTIVITIES ───────────────────────────────────────────────────
export const getActivities = async () => {
  const response = await api.get("/employee/activities");
  return response.data;
};
export const createActivity = async (payload) => {
  const response = await api.post("/employee/activities", payload);
  return response.data;
};

// ── NOTES ────────────────────────────────────────────────────────
export const getNotes = async () => {
  const response = await api.get("/employee/notes");
  return response.data;
};
export const createNote = async (payload) => {
  const response = await api.post("/employee/notes", payload);
  return response.data;
};
export const deleteNote = async (id) => {
  const response = await api.delete(`/employee/notes/${id}`);
  return response.data;
};

// ── NOTIFICATIONS ────────────────────────────────────────────────
export const getNotifications = async () => {
  const response = await api.get("/employee/notifications");
  return response.data;
};
export const markNotificationRead = async (id) => {
  const response = await api.put(`/employee/notifications/${id}/read`);
  return response.data;
};
export const markAllNotificationsRead = async () => {
  const response = await api.put("/employee/notifications/read-all");
  return response.data;
};

// ── FILE ATTACHMENTS ─────────────────────────────────────────────
export const uploadAttachment = async (file, relatedType, relatedId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("relatedType", relatedType);
  if (relatedId) formData.append("relatedId", relatedId);
  const response = await api.post("/files/attachments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
export const getAttachments = async (relatedType, relatedId) => {
  const response = await api.get(`/files/attachments/${relatedType}/${relatedId}`);
  return response.data;
};
export const deleteAttachment = async (id) => {
  const response = await api.delete(`/files/attachments/${id}`);
  return response.data;
};
