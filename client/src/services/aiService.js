import api from "./api";

// ── LEAD SCORING ─────────────────────────────────────────────────────────────
export const scoreLeadById = (id) => api.get(`/ai/leads/${id}/score`).then((r) => r.data);
export const scoreAllLeads = () => api.post("/ai/leads/score-all").then((r) => r.data);

// ── DEAL HEALTH ───────────────────────────────────────────────────────────────
export const scoreDealById = (id) => api.get(`/ai/deals/${id}/health`).then((r) => r.data);
export const getDealHealthSummary = () => api.get("/ai/deals/health-summary").then((r) => r.data);

// ── NEXT ACTIONS ──────────────────────────────────────────────────────────────
export const getTopNextActions = () => api.get("/ai/next-actions").then((r) => r.data);
export const getLeadNextAction = (id) => api.get(`/ai/leads/${id}/next-action`).then((r) => r.data);
export const getDealNextAction = (id) => api.get(`/ai/deals/${id}/next-action`).then((r) => r.data);
export const getCustomerNextAction = (id) => api.get(`/ai/customers/${id}/next-action`).then((r) => r.data);

// ── FORECAST ──────────────────────────────────────────────────────────────────
export const getRevenueForecast = (months = 3) =>
  api.get(`/ai/forecast?months=${months}`).then((r) => r.data);

// ── DAILY BRIEFING ────────────────────────────────────────────────────────────
export const getDailyBriefing = () => api.get("/ai/daily-briefing").then((r) => r.data);

// ── CHURN RISK ────────────────────────────────────────────────────────────────
export const getChurnRisk = () => api.get("/ai/churn-risk").then((r) => r.data);

// ── EMAIL COMPOSER (OpenAI) ───────────────────────────────────────────────────
export const composeEmail = (entityType, entityId, purpose, tone = "professional") =>
  api.post("/ai/compose-email", { entityType, entityId, purpose, tone }).then((r) => r.data);

export const improveEmail = (subject, body, improvements) =>
  api.post("/ai/improve-email", { subject, body, improvements }).then((r) => r.data);

// ── NATURAL LANGUAGE SEARCH (OpenAI) ──────────────────────────────────────────
export const naturalLanguageSearch = (query) =>
  api.post("/ai/search", { query }).then((r) => r.data);

// ── NOTE SUMMARIZATION (OpenAI) ───────────────────────────────────────────────
export const summarizeNotes = (entityType, entityId) =>
  api.post("/ai/summarize-notes", { entityType, entityId }).then((r) => r.data);

