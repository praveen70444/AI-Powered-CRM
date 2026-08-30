const OpenAI = require("openai");
const { getOpenAIKey, addTokenUsage } = require("./aiSettingsService");

/**
 * Get an OpenAI client instance for the given organization.
 * Loads the API key from the organization's AI settings (or falls back to env variable).
 */
const getOpenAIClient = async (organizationId) => {
  const apiKey = await getOpenAIKey(organizationId);
  
  if (!apiKey) {
    const error = new Error("OpenAI API key not configured for this organization");
    error.statusCode = 400;
    throw error;
  }

  return new OpenAI({ apiKey });
};

/**
 * Make a chat completion request and track token usage.
 * 
 * @param {number} organizationId - Organization ID for settings/tracking
 * @param {Array} messages - OpenAI chat messages array
 * @param {object} options - Additional options (temperature, max_tokens, etc.)
 * @returns {Promise<object>} - { content: string, tokensUsed: number, model: string }
 */
const chatCompletion = async (organizationId, messages, options = {}) => {
  const client = await getOpenAIClient(organizationId);
  
  const defaultOptions = {
    model: options.model || process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 500,
  };

  try {
    const response = await client.chat.completions.create({
      ...defaultOptions,
      messages,
    });

    const content = response.choices[0]?.message?.content || "";
    const tokensUsed = response.usage?.total_tokens || 0;

    // Track token usage
    if (tokensUsed > 0) {
      await addTokenUsage(organizationId, tokensUsed);
    }

    return {
      content,
      tokensUsed,
      model: response.model,
    };
  } catch (error) {
    // Handle OpenAI API errors
    if (error.status === 401) {
      const err = new Error("Invalid OpenAI API key");
      err.statusCode = 401;
      throw err;
    }
    if (error.status === 429) {
      const err = new Error("OpenAI rate limit exceeded. Please try again later.");
      err.statusCode = 429;
      throw err;
    }
    throw error;
  }
};

/**
 * Parse a JSON response from OpenAI (handles markdown code blocks).
 */
const parseJSONResponse = (content) => {
  try {
    // Remove markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI JSON response: ${error.message}`);
  }
};

module.exports = {
  getOpenAIClient,
  chatCompletion,
  parseJSONResponse,
};
