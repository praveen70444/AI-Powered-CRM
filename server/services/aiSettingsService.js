const pool = require("../config/db");
const crypto = require("crypto");

/**
 * Encrypt an API key for storage.
 * Uses a simple AES-256-CBC approach with the JWT_SECRET as the key material.
 * Not bank-grade, but far better than plaintext.
 */
const deriveKey = () => {
  const secret = process.env.JWT_SECRET || "fallback_secret_change_me";
  return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
};

const encryptKey = (plaintext) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decryptKey = (ciphertext) => {
  const [ivHex, encHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", deriveKey(), iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
};

const mapSettings = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  leadScoringEnabled: row.lead_scoring_enabled,
  dealHealthEnabled: row.deal_health_enabled,
  nextActionsEnabled: row.next_actions_enabled,
  emailComposerEnabled: row.email_composer_enabled,
  nlSearchEnabled: row.nl_search_enabled,
  dailyBriefingEnabled: row.daily_briefing_enabled,
  noteSummarizationEnabled: row.note_summarization_enabled,
  openaiApiKeySet: row.openai_api_key_set,
  openaiModel: row.openai_model,
  monthlyTokenLimit: row.monthly_token_limit,
  tokensUsedThisMonth: row.tokens_used_this_month,
  // expose raw DB column names too so the frontend toggle form can read them
  lead_scoring_enabled: row.lead_scoring_enabled,
  deal_health_enabled: row.deal_health_enabled,
  next_actions_enabled: row.next_actions_enabled,
  email_composer_enabled: row.email_composer_enabled,
  nl_search_enabled: row.nl_search_enabled,
  daily_briefing_enabled: row.daily_briefing_enabled,
  note_summarization_enabled: row.note_summarization_enabled,
  openai_api_key_set: row.openai_api_key_set,
  openai_model: row.openai_model,
  monthly_token_limit: row.monthly_token_limit,
  tokens_used_this_month: row.tokens_used_this_month,
  updatedAt: row.updated_at,
});

const getAISettings = async (organizationId) => {
  const result = await pool.query(
    `SELECT * FROM ai_settings WHERE organization_id = $1`,
    [organizationId]
  );
  if (result.rows.length === 0) {
    // Return defaults — row not yet created
    return {
      lead_scoring_enabled: true,
      deal_health_enabled: true,
      next_actions_enabled: true,
      email_composer_enabled: false,
      nl_search_enabled: false,
      daily_briefing_enabled: true,
      note_summarization_enabled: false,
      openai_api_key_set: false,
      openai_model: "gpt-4o-mini",
      monthly_token_limit: 100000,
      tokens_used_this_month: 0,
    };
  }
  return mapSettings(result.rows[0]);
};

const upsertAISettings = async (organizationId, payload) => {
  const {
    lead_scoring_enabled,
    deal_health_enabled,
    next_actions_enabled,
    email_composer_enabled,
    nl_search_enabled,
    daily_briefing_enabled,
    note_summarization_enabled,
    openai_api_key,       // raw key — only present if user is setting/replacing
    openai_model,
    monthly_token_limit,
  } = payload;

  // Build encrypted key + flag
  let encryptedKey = null;
  let keySet = false;

  if (openai_api_key && openai_api_key.trim()) {
    encryptedKey = encryptKey(openai_api_key.trim());
    keySet = true;
  }

  // Check if row exists
  const existing = await pool.query(
    `SELECT id, openai_api_key_encrypted, openai_api_key_set FROM ai_settings WHERE organization_id = $1`,
    [organizationId]
  );

  let result;
  if (existing.rows.length === 0) {
    // INSERT
    result = await pool.query(
      `INSERT INTO ai_settings (
         organization_id,
         lead_scoring_enabled, deal_health_enabled, next_actions_enabled,
         email_composer_enabled, nl_search_enabled, daily_briefing_enabled,
         note_summarization_enabled,
         openai_api_key_encrypted, openai_api_key_set,
         openai_model, monthly_token_limit
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        organizationId,
        lead_scoring_enabled ?? true,
        deal_health_enabled ?? true,
        next_actions_enabled ?? true,
        email_composer_enabled ?? false,
        nl_search_enabled ?? false,
        daily_briefing_enabled ?? true,
        note_summarization_enabled ?? false,
        encryptedKey,
        keySet,
        openai_model || "gpt-4o-mini",
        monthly_token_limit || 100000,
      ]
    );
  } else {
    // UPDATE — only update key if a new one was provided
    const keepExistingKey = !keySet;
    result = await pool.query(
      `UPDATE ai_settings SET
         lead_scoring_enabled = $1,
         deal_health_enabled = $2,
         next_actions_enabled = $3,
         email_composer_enabled = $4,
         nl_search_enabled = $5,
         daily_briefing_enabled = $6,
         note_summarization_enabled = $7,
         openai_api_key_encrypted = CASE WHEN $8 THEN $9 ELSE openai_api_key_encrypted END,
         openai_api_key_set = CASE WHEN $8 THEN $10 ELSE openai_api_key_set END,
         openai_model = $11,
         monthly_token_limit = $12,
         updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $13
       RETURNING *`,
      [
        lead_scoring_enabled ?? true,
        deal_health_enabled ?? true,
        next_actions_enabled ?? true,
        email_composer_enabled ?? false,
        nl_search_enabled ?? false,
        daily_briefing_enabled ?? true,
        note_summarization_enabled ?? false,
        keySet,           // $8 — whether to update the key columns
        encryptedKey,     // $9
        keySet,           // $10
        openai_model || "gpt-4o-mini",
        monthly_token_limit || 100000,
        organizationId,
      ]
    );
  }

  return mapSettings(result.rows[0]);
};

/**
 * Retrieve the decrypted OpenAI key for server-side AI calls.
 * Never returned to the frontend.
 */
const getOpenAIKey = async (organizationId) => {
  const result = await pool.query(
    `SELECT openai_api_key_encrypted, openai_api_key_set FROM ai_settings WHERE organization_id = $1`,
    [organizationId]
  );
  if (result.rows.length === 0 || !result.rows[0].openai_api_key_set) {
    return process.env.OPENAI_API_KEY || null;
  }
  try {
    return decryptKey(result.rows[0].openai_api_key_encrypted);
  } catch {
    return process.env.OPENAI_API_KEY || null;
  }
};

/**
 * Increment token usage counter.
 */
const addTokenUsage = async (organizationId, tokensUsed) => {
  await pool.query(
    `UPDATE ai_settings
     SET tokens_used_this_month = tokens_used_this_month + $1
     WHERE organization_id = $2`,
    [tokensUsed, organizationId]
  );
};

module.exports = { getAISettings, upsertAISettings, getOpenAIKey, addTokenUsage };
