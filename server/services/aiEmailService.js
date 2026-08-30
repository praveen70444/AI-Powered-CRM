const pool = require("../config/db");
const { chatCompletion, parseJSONResponse } = require("./openaiClient");

/**
 * Generate an email for a lead, customer, or deal.
 * 
 * @param {number} organizationId
 * @param {number} userId
 * @param {string} entityType - "lead", "customer", or "deal"
 * @param {number} entityId
 * @param {string} purpose - e.g., "follow_up", "introduction", "proposal", "check_in"
 * @param {string} tone - e.g., "professional", "casual", "formal", "friendly"
 * @returns {Promise<object>} - { subject, body, model, tokensUsed }
 */
const composeEmail = async (organizationId, userId, entityType, entityId, purpose, tone) => {
  // Fetch entity data
  const entityData = await fetchEntityData(organizationId, userId, entityType, entityId);
  
  if (!entityData) {
    const error = new Error(`${entityType} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Build context for the AI
  const context = buildEmailContext(entityType, entityData, purpose);

  // Build prompt
  const systemPrompt = `You are a professional sales assistant. Generate personalized emails for CRM users.
Always respond with valid JSON in this exact format:
{
  "subject": "Email subject line",
  "body": "Email body text"
}

Guidelines:
- Keep emails concise (under 150 words)
- Use the specified tone
- Be specific and personalized based on the context
- Include a clear call-to-action
- Sign off professionally`;

  const userPrompt = `Generate an email for the following:

Recipient: ${entityData.name}
${entityData.company ? `Company: ${entityData.company}` : ""}
Purpose: ${purpose}
Tone: ${tone}
Context: ${context}

Output the email as JSON with "subject" and "body" fields.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // Call OpenAI
  const response = await chatCompletion(organizationId, messages, {
    temperature: 0.7,
    max_tokens: 600,
  });

  // Parse JSON response
  let emailData;
  try {
    emailData = parseJSONResponse(response.content);
  } catch (error) {
    throw new Error(`AI generated invalid response: ${error.message}`);
  }

  // Log the generated email
  await logGeneratedEmail(
    organizationId,
    userId,
    entityType,
    entityId,
    purpose,
    emailData.subject,
    emailData.body,
    response.model,
    response.tokensUsed
  );

  return {
    subject: emailData.subject,
    body: emailData.body,
    model: response.model,
    tokensUsed: response.tokensUsed,
  };
};

/**
 * Improve an existing email draft.
 */
const improveEmail = async (organizationId, userId, originalSubject, originalBody, improvements) => {
  const systemPrompt = `You are a professional email editor. Improve emails while maintaining their core message.
Always respond with valid JSON in this exact format:
{
  "subject": "Improved subject line",
  "body": "Improved body text"
}`;

  const userPrompt = `Improve this email:

Subject: ${originalSubject}
Body: ${originalBody}

Requested improvements: ${improvements || "Make it more professional and concise"}

Output the improved email as JSON with "subject" and "body" fields.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await chatCompletion(organizationId, messages, {
    temperature: 0.7,
    max_tokens: 600,
  });

  const emailData = parseJSONResponse(response.content);

  return {
    subject: emailData.subject,
    body: emailData.body,
    model: response.model,
    tokensUsed: response.tokensUsed,
  };
};

/**
 * Fetch entity data from database.
 */
const fetchEntityData = async (organizationId, userId, entityType, entityId) => {
  let query, params;

  switch (entityType) {
    case "lead":
      query = `SELECT id, name, company, email, phone, status, source, value, created_at 
               FROM leads 
               WHERE id = $1 AND organization_id = $2 AND owner_id = $3`;
      params = [entityId, organizationId, userId];
      break;

    case "customer":
      query = `SELECT id, name, company, email, phone, status, total_spent, created_at 
               FROM customers 
               WHERE id = $1 AND organization_id = $2 AND owner_id = $3`;
      params = [entityId, organizationId, userId];
      break;

    case "deal":
      query = `SELECT d.id, d.name, d.value, d.stage, d.close_date, d.probability, 
                      c.name AS customer_name, c.company AS customer_company, c.email AS customer_email
               FROM deals d
               LEFT JOIN customers c ON d.customer_id = c.id
               WHERE d.id = $1 AND d.organization_id = $2 AND d.owner_id = $3`;
      params = [entityId, organizationId, userId];
      break;

    default:
      const error = new Error("Invalid entity type");
      error.statusCode = 400;
      throw error;
  }

  const result = await pool.query(query, params);
  return result.rows[0] || null;
};

/**
 * Build context string for email generation.
 */
const buildEmailContext = (entityType, entityData, purpose) => {
  const parts = [];

  switch (entityType) {
    case "lead":
      parts.push(`Lead status: ${entityData.status}`);
      if (entityData.source) parts.push(`Source: ${entityData.source}`);
      if (entityData.value) parts.push(`Potential value: $${entityData.value}`);
      break;

    case "customer":
      parts.push(`Customer status: ${entityData.status}`);
      if (entityData.total_spent > 0) parts.push(`Total spent: $${entityData.total_spent}`);
      break;

    case "deal":
      parts.push(`Deal stage: ${entityData.stage}`);
      parts.push(`Deal value: $${entityData.value}`);
      if (entityData.close_date) parts.push(`Expected close: ${entityData.close_date}`);
      if (entityData.customer_name) parts.push(`Customer: ${entityData.customer_name}`);
      break;
  }

  // Add purpose-specific context
  switch (purpose) {
    case "follow_up":
      parts.push("This is a follow-up email");
      break;
    case "introduction":
      parts.push("This is an initial introduction email");
      break;
    case "proposal":
      parts.push("This email includes a proposal or offer");
      break;
    case "check_in":
      parts.push("This is a check-in to maintain the relationship");
      break;
  }

  return parts.join(". ");
};

/**
 * Log generated email to database.
 */
const logGeneratedEmail = async (
  organizationId,
  userId,
  entityType,
  entityId,
  purpose,
  subject,
  body,
  model,
  tokensUsed
) => {
  await pool.query(
    `INSERT INTO ai_generated_emails 
     (organization_id, user_id, entity_type, entity_id, purpose, subject, body, model_used, tokens_used)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [organizationId, userId, entityType, entityId, purpose, subject, body, model, tokensUsed]
  );
};

module.exports = {
  composeEmail,
  improveEmail,
};
