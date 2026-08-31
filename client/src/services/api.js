import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = axios.create({
  baseURL: BASE_URL,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      error.friendlyMessage = "Your session has expired. Please sign in again.";
    } else if (status === 429) {
      error.friendlyMessage =
        error.response?.data?.message ||
        "Too many attempts. Please wait a few minutes and try again.";
    } else if (status === 403) {
      error.friendlyMessage =
        error.response?.data?.message ||
        "You do not have permission to access this resource.";
    } else if (status === 404) {
      error.friendlyMessage =
        error.response?.data?.message ||
        "The requested resource was not found.";
    } else if (status && status >= 500) {
      error.friendlyMessage = "Something went wrong on our end. Please try again later.";
    } else if (!error.response) {
      error.friendlyMessage = "Unable to reach the server. Please check your connection.";
    } else {
      error.friendlyMessage =
        error.response?.data?.message || "Something went wrong. Please try again.";
    }
    return Promise.reject(error);
  }
);
export default api;
