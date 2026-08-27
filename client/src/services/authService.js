import api from "./api";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post("/password/request-reset", { email });
  return response.data;
};

export const verifyResetToken = async (token) => {
  const response = await api.get(`/password/verify-token/${token}`);
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post(`/password/reset/${token}`, { password });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post("/password/change", { currentPassword, newPassword });
  return response.data;
};
