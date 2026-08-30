const aiSettingsService = require("../services/aiSettingsService");

const getAISettings = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const data = await aiSettingsService.getAISettings(organizationId);
    res.json({ success: true, message: "AI settings fetched", data });
  } catch (error) {
    console.error("Get AI settings error:", error);
    res.status(500).json({ success: false, message: "Failed to load AI settings" });
  }
};

const updateAISettings = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const data = await aiSettingsService.upsertAISettings(organizationId, req.body);
    res.json({ success: true, message: "AI settings saved", data });
  } catch (error) {
    console.error("Update AI settings error:", error);
    res.status(500).json({ success: false, message: "Failed to save AI settings" });
  }
};

module.exports = { getAISettings, updateAISettings };
