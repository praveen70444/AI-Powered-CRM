const pool = require("../config/db");
const { chatCompletion, parseJSONResponse } = require("./openaiClient");

/**
 * Natural language search across CRM entities.
 * 
 * @param {number} organizationId
 * @param {number} userId
 * @param {string} query - Natural language query (e.g., "leads from tech companies worth over 10k")
 * @returns {Promise<object>} - { entity, filters, results, interpretation, count }
 */
const naturalLanguageSearch = async (organizationId, userId, query) => {
  // Parse the query using OpenAI
  const filterSpec = await parseSearchQuery(organizationId, query);

  // Execute the search
  const results = await executeSearch(organizationId, userId, filterSpec);

  return {
    entity: filterSpec.entity,
    filters: filterSpec.filters,
    results: results.rows,
    interpretation: filterSpec.interpretation,
    count: results.rows.length,
  };
};

/**
 * Parse natural language query into structured filters using OpenAI.
 */
const parseSearchQuery = async (organizationId, query) => {
  const systemPrompt = `You are a CRM query parser. Convert natural language queries into structured database filters.

Available entities: leads, customers, deals, tasks

Available filters for each entity:

LEADS:
- status: (New, Contacted, Qualified, Unqualified, Converted)
- source: (Website, Referral, Social Media, Advertisement, Event, Cold Call)
- value_gt: number (value greater than)
- value_lt: number (value less than)
- company_contains: string
- name_contains: string
- email_contains: string

CUSTOMERS:
- status: (Active, Inactive, At Risk, VIP)
- total_spent_gt: number
- total_spent_lt: number
- company_contains: string
- name_contains: string

DEALS:
- stage: (New, Qualified, Proposal, Negotiation, Won, Lost)
- value_gt: number
- value_lt: number
- probability_gt: number (0-100)
- close_date_before: date (YYYY-MM-DD)
- close_date_after: date (YYYY-MM-DD)

TASKS:
- status: (Pending, Completed, Overdue)
- priority: (Low, Medium, High)
- due_date_before: date (YYYY-MM-DD)
- due_date_after: date (YYYY-MM-DD)

Respond ONLY with valid JSON in this format:
{
  "entity": "leads|customers|deals|tasks",
  "filters": {
    "filter_name": "value"
  },
  "interpretation": "Human-readable description of the filters"
}`;

  const userPrompt = `Parse this query: "${query}"`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await chatCompletion(organizationId, messages, {
    temperature: 0.3, // Lower temperature for more consistent parsing
    max_tokens: 400,
  });

  try {
    return parseJSONResponse(response.content);
  } catch (error) {
    throw new Error(`Failed to parse search query: ${error.message}`);
  }
};

/**
 * Execute the search based on parsed filter specification.
 */
const executeSearch = async (organizationId, userId, filterSpec) => {
  const { entity, filters } = filterSpec;

  let baseQuery;
  let whereClauses = ["organization_id = $1", "owner_id = $2"];
  let params = [organizationId, userId];
  let paramIndex = 3;

  // Select base query based on entity
  switch (entity) {
    case "leads":
      baseQuery = "SELECT * FROM leads";
      break;
    case "customers":
      baseQuery = "SELECT * FROM customers";
      break;
    case "deals":
      baseQuery = "SELECT * FROM deals";
      break;
    case "tasks":
      baseQuery = "SELECT * FROM tasks";
      break;
    default:
      const error = new Error("Invalid entity type");
      error.statusCode = 400;
      throw error;
  }

  // Build WHERE clauses from filters
  for (const [key, value] of Object.entries(filters)) {
    const clause = buildWhereClause(key, value, paramIndex);
    if (clause) {
      whereClauses.push(clause.condition);
      params.push(...clause.params);
      paramIndex += clause.params.length;
    }
  }

  const query = `${baseQuery} WHERE ${whereClauses.join(" AND ")} ORDER BY created_at DESC LIMIT 100`;

  return await pool.query(query, params);
};

/**
 * Build WHERE clause for a specific filter.
 */
const buildWhereClause = (filterKey, filterValue, paramIndex) => {
  const mappings = {
    // Exact matches
    status: { condition: `status = $${paramIndex}`, params: [filterValue] },
    source: { condition: `source = $${paramIndex}`, params: [filterValue] },
    stage: { condition: `stage = $${paramIndex}`, params: [filterValue] },
    priority: { condition: `priority = $${paramIndex}`, params: [filterValue] },

    // Comparisons
    value_gt: { condition: `value > $${paramIndex}`, params: [filterValue] },
    value_lt: { condition: `value < $${paramIndex}`, params: [filterValue] },
    total_spent_gt: { condition: `total_spent > $${paramIndex}`, params: [filterValue] },
    total_spent_lt: { condition: `total_spent < $${paramIndex}`, params: [filterValue] },
    probability_gt: { condition: `probability > $${paramIndex}`, params: [filterValue] },

    // Partial matches
    company_contains: { condition: `company ILIKE $${paramIndex}`, params: [`%${filterValue}%`] },
    name_contains: { condition: `name ILIKE $${paramIndex}`, params: [`%${filterValue}%`] },
    email_contains: { condition: `email ILIKE $${paramIndex}`, params: [`%${filterValue}%`] },

    // Date filters
    close_date_before: { condition: `close_date <= $${paramIndex}`, params: [filterValue] },
    close_date_after: { condition: `close_date >= $${paramIndex}`, params: [filterValue] },
    due_date_before: { condition: `due_date <= $${paramIndex}`, params: [filterValue] },
    due_date_after: { condition: `due_date >= $${paramIndex}`, params: [filterValue] },
  };

  return mappings[filterKey] || null;
};

module.exports = {
  naturalLanguageSearch,
};
