const aiLeadScoringService = require("../services/aiLeadScoringService");
const aiDealHealthService = require("../services/aiDealHealthService");
const aiNextActionService = require("../services/aiNextActionService");
const aiForecastService = require("../services/aiForecastService");
const aiBriefingService = require("../services/aiBriefingService");
const aiChurnRiskService = require("../services/aiChurnRiskService");
const aiEmailService = require("../services/aiEmailService");
const aiSearchService = require("../services/aiSearchService");
const aiSummarizationService = require("../services/aiSummarizationService");

// ── LEAD SCORING ────────────────────────────────────────────────────────────

const scoreLeadById = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiLeadScoringService.scoreLeadById(req.params.id, organizationId, userId);
    res.json({ success: true, message: "Lead scored successfully", data: result });
  } catch (error) {
    console.error("AI score lead error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to score lead" });
  }
};

const scoreAllLeads = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiLeadScoringService.scoreAllLeads(organizationId, userId);
    res.json({ success: true, message: `${result.scored} leads scored`, data: result });
  } catch (error) {
    console.error("AI score all leads error:", error);
    res.status(500).json({ success: false, message: "Failed to score leads" });
  }
};

// ── DEAL HEALTH ──────────────────────────────────────────────────────────────

const scoreDealById = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiDealHealthService.scoreDealById(req.params.id, organizationId, userId);
    res.json({ success: true, message: "Deal health scored", data: result });
  } catch (error) {
    console.error("AI deal health error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to score deal" });
  }
};

const getDealHealthSummary = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiDealHealthService.scoreDealsSummary(organizationId, userId);
    res.json({ success: true, message: "Deal health summary generated", data: result });
  } catch (error) {
    console.error("AI deal health summary error:", error);
    res.status(500).json({ success: false, message: "Failed to get deal health summary" });
  }
};

// ── NEXT ACTIONS ─────────────────────────────────────────────────────────────

const getTopNextActions = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiNextActionService.getTopNextActions(organizationId, userId);
    res.json({ success: true, message: "Next actions generated", data: result });
  } catch (error) {
    console.error("AI next actions error:", error);
    res.status(500).json({ success: false, message: "Failed to get next actions" });
  }
};

const getLeadNextAction = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiNextActionService.getLeadNextActionById(req.params.id, organizationId, userId);
    res.json({ success: true, message: "Lead next action generated", data: result });
  } catch (error) {
    console.error("AI lead next action error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to get next action" });
  }
};

const getDealNextAction = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiNextActionService.getDealNextActionById(req.params.id, organizationId, userId);
    res.json({ success: true, message: "Deal next action generated", data: result });
  } catch (error) {
    console.error("AI deal next action error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to get next action" });
  }
};

const getCustomerNextAction = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiNextActionService.getCustomerNextActionById(req.params.id, organizationId, userId);
    res.json({ success: true, message: "Customer next action generated", data: result });
  } catch (error) {
    console.error("AI customer next action error:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to get next action" });
  }
};

// ── FORECAST ─────────────────────────────────────────────────────────────────

const getRevenueForecast = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const months = Math.min(6, Math.max(1, parseInt(req.query.months) || 3));
    const result = await aiForecastService.getRevenueForecast(organizationId, userId, months);
    res.json({ success: true, message: "Revenue forecast generated", data: result });
  } catch (error) {
    console.error("AI forecast error:", error);
    res.status(500).json({ success: false, message: "Failed to generate forecast" });
  }
};

// ── DAILY BRIEFING ────────────────────────────────────────────────────────────

const getDailyBriefing = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiBriefingService.getDailyBriefing(organizationId, userId);
    res.json({ success: true, message: "Daily briefing generated", data: result });
  } catch (error) {
    console.error("AI daily briefing error:", error);
    res.status(500).json({ success: false, message: "Failed to generate briefing" });
  }
};

// ── CHURN RISK ────────────────────────────────────────────────────────────────

const getChurnRisk = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const result = await aiChurnRiskService.getChurnRisk(organizationId, userId);
    res.json({ success: true, message: "Churn risk assessed", data: result });
  } catch (error) {
    console.error("AI churn risk error:", error);
    res.status(500).json({ success: false, message: "Failed to assess churn risk" });
  }
};

// ── EMAIL COMPOSER (OpenAI) ─────────────────────────────────────────────────

const composeEmail = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { entityType, entityId, purpose, tone } = req.body;

    if (!entityType || !entityId || !purpose) {
      return res.status(400).json({ 
        success: false, 
        message: "entityType, entityId, and purpose are required" 
      });
    }

    const result = await aiEmailService.composeEmail(
      organizationId,
      userId,
      entityType,
      entityId,
      purpose,
      tone || "professional"
    );

    res.json({ 
      success: true, 
      message: "Email generated successfully", 
      data: result 
    });
  } catch (error) {
    console.error("AI compose email error:", error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || "Failed to generate email" 
    });
  }
};

const improveEmail = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { subject, body, improvements } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ 
        success: false, 
        message: "subject and body are required" 
      });
    }

    const result = await aiEmailService.improveEmail(
      organizationId,
      userId,
      subject,
      body,
      improvements
    );

    res.json({ 
      success: true, 
      message: "Email improved successfully", 
      data: result 
    });
  } catch (error) {
    console.error("AI improve email error:", error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || "Failed to improve email" 
    });
  }
};

// ── NATURAL LANGUAGE SEARCH (OpenAI) ────────────────────────────────────────

const naturalLanguageSearch = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { query } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "query is required and must be a non-empty string" 
      });
    }

    const result = await aiSearchService.naturalLanguageSearch(
      organizationId,
      userId,
      query.trim()
    );

    res.json({ 
      success: true, 
      message: "Search completed successfully", 
      data: result 
    });
  } catch (error) {
    console.error("AI search error:", error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || "Failed to perform search" 
    });
  }
};

// ── NOTE SUMMARIZATION (OpenAI) ─────────────────────────────────────────────

const summarizeNotes = async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    const { entityType, entityId } = req.body;

    if (!entityType || !entityId) {
      return res.status(400).json({ 
        success: false, 
        message: "entityType and entityId are required" 
      });
    }

    const result = await aiSummarizationService.summarizeNotes(
      organizationId,
      userId,
      entityType,
      entityId
    );

    res.json({ 
      success: true, 
      message: "Notes summarized successfully", 
      data: result 
    });
  } catch (error) {
    console.error("AI summarize notes error:", error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || "Failed to summarize notes" 
    });
  }
};

module.exports = {
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
};
