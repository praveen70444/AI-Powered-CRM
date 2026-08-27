import api from "./api";

// ── DASHBOARD ────────────────────────────────────────────────────
export const getOrganizationDashboard = async () => {
  const response = await api.get("/organization/dashboard");
  return response.data;
};

// ── EMPLOYEES ────────────────────────────────────────────────────
export const getOrganizationEmployees = async () => {
  const response = await api.get("/organization/employees");
  return response.data;
};
export const updateEmployeeStatus = async (id, status) => {
  const response = await api.patch(`/organization/employees/${id}/status`, { status });
  return response.data;
};

// ── INVITATIONS ──────────────────────────────────────────────────
export const getOrganizationInvitations = async () => {
  const response = await api.get("/organization/invitations");
  return response.data;
};
export const createOrganizationInvitation = async ({ email, role }) => {
  const response = await api.post("/organization/invitations", { email, role });
  return response.data;
};
export const cancelInvitation = async (id) => {
  const response = await api.patch(`/organization/invitations/${id}/cancel`);
  return response.data;
};

// ── SETTINGS ─────────────────────────────────────────────────────
export const getOrganizationSettings = async () => {
  const response = await api.get("/organization/settings");
  return response.data;
};
export const updateOrganizationSettings = async (payload) => {
  const response = await api.put("/organization/settings", payload);
  return response.data;
};

// ── PROFILE ─────────────────────────────────────────────────────
export const getOrganizationProfile = async () => {
  const response = await api.get("/organization/profile");
  return response.data;
};
export const updateOrganizationProfile = async (payload) => {
  const response = await api.put("/organization/profile", payload);
  return response.data;
};
export const uploadOrgLogo = async (file) => {
  const formData = new FormData();
  formData.append("logo", file);
  const response = await api.post("/organization/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ── NOTIFICATIONS ────────────────────────────────────────────────
export const getOrgNotifications = async () => {
  const response = await api.get("/organization/notifications");
  return response.data;
};
export const markOrgNotificationRead = async (id) => {
  const response = await api.put(`/organization/notifications/${id}/read`);
  return response.data;
};
export const markAllOrgNotificationsRead = async () => {
  const response = await api.put("/organization/notifications/read-all");
  return response.data;
};

// ── AUDIT LOGS ───────────────────────────────────────────────────
export const getAuditLogs = async (page = 1, limit = 50) => {
  const response = await api.get(`/organization/audit-logs?page=${page}&limit=${limit}`);
  return response.data;
};
