const express = require("express");
const {
  scoreLeadById,
  scoreAllLeads,
  scoreDealById,
  getDealHealthSummary,
  getTopNextActions,
  getLeadNextAction,
  getDealNextAction,
  getCustomerNextAction,
  getRevenueForecast,
  getDailyBriefing,
  getChurnRisk,
  composeEmail,
  improveEmail,
  naturalLanguageSearch,
  summarizeNotes,
} = require("../controllers/aiController");

const authMiddleware = require("../middleware/authMiddleware");
const { requireEmployee } = require("../middleware/roleMiddleware");

const router = express.Router();
router.use(authMiddleware, requireEmployee);

// Daily briefing
router.get("/daily-briefing", getDailyBriefing);

// Lead scoring
router.post("/leads/score-all", scoreAllLeads);
router.get("/leads/:id/score", scoreLeadById);
router.get("/leads/:id/next-action", getLeadNextAction);

// Deal health
router.get("/deals/health-summary", getDealHealthSummary);
router.get("/deals/:id/health", scoreDealById);
router.get("/deals/:id/next-action", getDealNextAction);

// Customer
router.get("/customers/:id/next-action", getCustomerNextAction);
router.get("/churn-risk", getChurnRisk);

// Next actions (cross-module)
router.get("/next-actions", getTopNextActions);

// Revenue forecast
router.get("/forecast", getRevenueForecast);

// ── OpenAI-Powered Features ──────────────────────────────────────────────────

// Email composer
router.post("/compose-email", composeEmail);
router.post("/improve-email", improveEmail);

// Natural language search
router.post("/search", naturalLanguageSearch);

// Note summarization
router.post("/summarize-notes", summarizeNotes);

module.exports = router;
