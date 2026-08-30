const pool = require("../config/db");
const { chatCompletion } = require("./openaiClient");

/**
 * Summarize all notes for a specific entity.
 * 
 * @param {number} organizationId
 * @param {number} userId
 * @param {string} entityType - "lead", "customer", or "deal"
 * @param {number} entityId
 * @returns {Promise<object>} - { summary, noteCount, insights, model, tokensUsed }
 */
const summarizeNotes = async (organizationId, userId, entityType, entityId) => {
  // Fetch entity data
  const entityData = await fetchEntityData(organizationId, userId, entityType, entityId);
  
  if (!entityData) {
    const error = new Error(`${entityType} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Fetch all notes for this entity
  const notes = await fetchNotes(organizationId, userId, entityType, entityId, entityData.name);

  if (notes.length === 0) {
    return {
      summary: "No notes available to summarize.",
      noteCount: 0,
      insights: [],
      model: null,
      tokensUsed: 0,
    };
  }

  if (notes.length < 3) {
    return {
      summary: "Not enough notes to generate a meaningful summary (minimum 3 required).",
      noteCount: notes.length,
      insights: [],
      model: null,
      tokensUsed: 0,
    };
  }

  // Build notes text
  const notesText = notes
    .map((note, idx) => `${idx + 1}. [${note.created_at}] ${note.content}`)
    .join("\n\n");

  // Build prompt
  const systemPrompt = `You are a sales assistant that summarizes CRM notes. Provide:
1. A concise summary (2-3 sentences) of the key points
2. Important insights or patterns
3. Recommended next steps

Keep the response clear and actionable. Focus on business-critical information.`;

  const userPrompt = `Summarize these ${notes.length} notes for ${entityType} "${entityData.name}":

${notesText}

Provide:
- Summary (2-3 sentences)
- Key insights (bullet points)
- Recommended next action`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // Call OpenAI
  const response = await chatCompletion(organizationId, messages, {
    temperature: 0.5,
    max_tokens: 500,
  });

  // Parse the response
  const parsed = parseNoteSummary(response.content);

  return {
    summary: parsed.summary,
    noteCount: notes.length,
    insights: parsed.insights,
    recommendedAction: parsed.recommendedAction,
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
      query = `SELECT id, name, company, status FROM leads 
               WHERE id = $1 AND organization_id = $2 AND owner_id = $3`;
      params = [entityId, organizationId, userId];
      break;

    case "customer":
      query = `SELECT id, name, company, status FROM customers 
               WHERE id = $1 AND organization_id = $2 AND owner_id = $3`;
      params = [entityId, organizationId, userId];
      break;

    case "deal":
      query = `SELECT id, name, stage FROM deals 
               WHERE id = $1 AND organization_id = $2 AND owner_id = $3`;
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
 * Fetch notes for an entity.
 * Notes are linked via the "related_to" field which contains the entity name.
 */
const fetchNotes = async (organizationId, userId, entityType, entityId, entityName) => {
  // Fetch notes that mention this entity in the related_to field
  const query = `
    SELECT id, content, related_to, created_at 
    FROM notes 
    WHERE organization_id = $1 
      AND author_id = $2 
      AND related_to ILIKE $3
    ORDER BY created_at ASC
  `;

  const result = await pool.query(query, [
    organizationId,
    userId,
    `%${entityName}%`,
  ]);

  return result.rows;
};

/**
 * Parse the AI summary response into structured format.
 */
const parseNoteSummary = (content) => {
  const lines = content.split("\n").filter((l) => l.trim());
  
  let summary = "";
  const insights = [];
  let recommendedAction = "";
  
  let currentSection = null;
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    if (lower.includes("summary")) {
      currentSection = "summary";
      continue;
    } else if (lower.includes("insight") || lower.includes("key point")) {
      currentSection = "insights";
      continue;
    } else if (lower.includes("recommend") || lower.includes("next")) {
      currentSection = "action";
      continue;
    }
    
    const cleanLine = line.replace(/^[-•*]\s*/, "").trim();
    
    if (currentSection === "summary" && cleanLine) {
      summary += (summary ? " " : "") + cleanLine;
    } else if (currentSection === "insights" && cleanLine && cleanLine.length > 3) {
      insights.push(cleanLine);
    } else if (currentSection === "action" && cleanLine) {
      recommendedAction += (recommendedAction ? " " : "") + cleanLine;
    }
  }
  
  // Fallback: if parsing failed, use the whole content as summary
  if (!summary) {
    summary = content.split("\n\n")[0] || content.substring(0, 200);
  }
  
  return {
    summary,
    insights: insights.length > 0 ? insights : ["No specific insights extracted"],
    recommendedAction: recommendedAction || "Continue monitoring",
  };
};

module.exports = {
  summarizeNotes,
};
