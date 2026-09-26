/**
 * Authenticated export helper.
 * Fetches the export endpoint with the JWT token (via the api interceptor),
 * receives a binary blob, and triggers a browser download — no new tab, no auth error.
 */
import api from "./api";

async function downloadExport(url, filename) {
  const response = await api.get(url, { responseType: "blob" });
  const blob = new Blob([response.data]);
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

function ext(format) {
  if (format === "excel") return "xlsx";
  if (format === "pdf") return "pdf";
  return "csv";
}

export const exportLeads = async (format = "csv") => {
  await downloadExport(`/employee/export/leads?format=${format}`, `leads.${ext(format)}`);
};

export const exportCustomers = async (format = "csv") => {
  await downloadExport(`/employee/export/customers?format=${format}`, `customers.${ext(format)}`);
};

export const exportDeals = async (format = "csv") => {
  await downloadExport(`/employee/export/deals?format=${format}`, `deals.${ext(format)}`);
};

export const exportTasks = async (format = "csv") => {
  await downloadExport(`/employee/export/tasks?format=${format}`, `tasks.${ext(format)}`);
};
