const pool = require("../config/db");
const { createNotification } = require("./notificationService");

const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Unqualified", "Converted"];
const LEAD_SOURCES = ["Website", "Referral", "Cold Call", "Social Media", "Advertisement", "Event"];

const parseLocation = (loc, prefLoc) => {
  const val = loc || prefLoc;
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    }
    return val.split(',').map(s => s.trim()).filter(Boolean);
  } catch (e) {
    return [val];
  }
};

const mapLead = (row) => {
  const locations = parseLocation(row.location, row.preferred_locations);
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    status: row.status,
    source: row.source,
    zipCode: row.zip_code,
    value: Number(row.value),
    purposeOfPurchase: row.purpose_of_purchase,
    plotSize: row.plot_size,
    budget: row.budget,
    planToPurchase: row.plan_to_purchase,
    siteVisit: row.site_visit,
    owner: row.owner_name,
    ownerId: row.owner_id,
    // AI fields
    aiScore: row.ai_score,
    aiScoreLabel: row.ai_score_label,
    ai_score: row.ai_score,
    ai_score_label: row.ai_score_label,
    // Real Estate Addon Fields
    language: row.language || "",
    location: locations,
    preferred_locations: locations,
    preferredLocations: locations,
    leadType: row.lead_type || "Flat Buyer",
    lead_type: row.lead_type || "Flat Buyer",
    bhkRequirement: row.bhk_requirement || "",
    bhk_requirement: row.bhk_requirement || "",
    propertyStatus: row.property_status || "",
    property_status: row.property_status || "",
    purchaseTimeline: row.purchase_timeline || "",
    purchase_timeline: row.purchase_timeline || "",
    leadPurpose: row.purpose || row.lead_purpose || row.purpose_of_purchase || "",
    lead_purpose: row.purpose || row.lead_purpose || row.purpose_of_purchase || "",
    purpose: row.purpose || row.lead_purpose || row.purpose_of_purchase || "",
    plotSizeSqyd: row.plot_size_sqyd,
    plot_size_sqyd: row.plot_size_sqyd,
    landSize: row.land_size || "",
    land_size: row.land_size || "",
    landSizeUnit: row.land_size_unit || "Acres",
    land_size_unit: row.land_size_unit || "Acres",
    otherRequirements: row.other_requirements || "",
    other_requirements: row.other_requirements || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const getLeads = async (organizationId, ownerId, { page = 1, limit = 50, search = '', status = '', source = '', language = '', lead_type = '' } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = ['l.organization_id = $1'];
  const params = [organizationId];
  let idx = 2;

  if (ownerId) {
    conditions.push(`l.owner_id = $${idx}`);
    params.push(ownerId);
    idx++;
  }

  if (search) {
    conditions.push(`(l.search_vector @@ plainto_tsquery('english', $${idx}) OR l.name ILIKE $${idx + 1} OR l.company ILIKE $${idx + 1} OR l.email ILIKE $${idx + 1} OR l.phone ILIKE $${idx + 1} OR array_to_string(l.location, ',') ILIKE $${idx + 1} OR array_to_string(l.preferred_locations, ',') ILIKE $${idx + 1})`);
    params.push(search, `%${search}%`);
    idx += 2;
  }
  if (status) { conditions.push(`l.status = $${idx}`); params.push(status); idx++; }
  if (source) { conditions.push(`l.source = $${idx}`); params.push(source); idx++; }
  if (language) { conditions.push(`l.language = $${idx}`); params.push(language); idx++; }
  if (lead_type) { conditions.push(`l.lead_type = $${idx}`); params.push(lead_type); idx++; }

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    pool.query(`SELECT l.*, u.name AS owner_name FROM leads l JOIN users u ON u.id = l.owner_id WHERE ${where} ORDER BY l.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
    pool.query(`SELECT COUNT(*) FROM leads l WHERE ${where}`, params),
  ]);
  return {
    data: dataRes.rows.map(mapLead),
    pagination: { page, limit, total: parseInt(countRes.rows[0].count), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) },
  };
};

const getLeadById = async (id, organizationId, ownerId) => {
  const conditions = ['l.id = $1', 'l.organization_id = $2'];
  const params = [id, organizationId];
  if (ownerId) {
    conditions.push('l.owner_id = $3');
    params.push(ownerId);
  }
  const result = await pool.query(
    `SELECT l.*, u.name AS owner_name
     FROM leads l
     JOIN users u ON u.id = l.owner_id
     WHERE ${conditions.join(' AND ')}`,
    params
  );
  if (result.rows.length === 0) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
  return mapLead(result.rows[0]);
};

const serializeLocation = (loc) => {
  if (!loc) return null;
  if (Array.isArray(loc)) return loc;
  if (typeof loc === 'string') {
    try {
      if (loc.startsWith('[') || loc.startsWith('{')) {
        const parsed = JSON.parse(loc);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return loc.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [String(loc)];
};

const createLead = async (organizationId, ownerId, payload) => {
  const {
    name, company, email, phone, status, source, value, zipCode,
    purposeOfPurchase, plotSize, budget, planToPurchase, siteVisit,
    language, location, preferredLocations, preferred_locations,
    leadType, lead_type, bhkRequirement, bhk_requirement,
    propertyStatus, property_status, purchaseTimeline, purchase_timeline,
    leadPurpose, lead_purpose, purpose, plotSizeSqyd, plot_size_sqyd,
    landSize, land_size, landSizeUnit, land_size_unit,
    otherRequirements, other_requirements,
  } = payload;

  if (!name) {
    const error = new Error("Name is required");
    error.statusCode = 400;
    throw error;
  }
  const finalStatus = status || "New";
  if (!LEAD_STATUSES.includes(finalStatus)) {
    const error = new Error("Invalid lead status");
    error.statusCode = 400;
    throw error;
  }

  const locVal = serializeLocation(location || preferredLocations || preferred_locations);
  const lType = leadType || lead_type || "Flat Buyer";
  const bhk = bhkRequirement || bhk_requirement || null;
  const propStatus = propertyStatus || property_status || null;
  const purchTime = purchaseTimeline || purchase_timeline || null;
  const lPurpose = purpose || leadPurpose || lead_purpose || purposeOfPurchase || null;
  const pSizeSqyd = plotSizeSqyd !== undefined ? plotSizeSqyd : (plot_size_sqyd !== undefined ? plot_size_sqyd : null);
  const lSize = landSize || land_size || null;
  const lSizeUnit = landSizeUnit || land_size_unit || "Acres";
  const otherReq = otherRequirements || other_requirements || null;

  const result = await pool.query(
    `
    INSERT INTO leads (
      organization_id, owner_id, name, company, email, phone, status, source, value,
      purpose_of_purchase, plot_size, budget, plan_to_purchase, site_visit, zip_code,
      language, location, preferred_locations, lead_type, bhk_requirement, property_status,
      purchase_timeline, purpose, plot_size_sqyd, land_size, land_size_unit, other_requirements
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    RETURNING *
    `,
    [
      organizationId,
      ownerId,
      name,
      company || name,
      email || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone || null,
      finalStatus,
      source || null,
      Number(value) || 0,
      purposeOfPurchase || lPurpose || null,
      plotSize || null,
      budget || null,
      planToPurchase || null,
      siteVisit || null,
      zipCode || null,
      language || null,
      locVal,
      locVal,
      lType,
      bhk,
      propStatus,
      purchTime,
      lPurpose,
      pSizeSqyd ? Number(pSizeSqyd) : null,
      lSize,
      lSizeUnit,
      otherReq,
    ]
  );
  const lead = await getLeadById(result.rows[0].id, organizationId, ownerId);
  await createNotification(organizationId, ownerId, {
    type: "lead",
    title: "New lead added",
    description: `${lead.name} was added to your leads`,
  });
  return lead;
};

const updateLead = async (id, organizationId, ownerId, payload) => {
  const {
    name, company, email, phone, status, source, value, zipCode,
    purposeOfPurchase, plotSize, budget, planToPurchase, siteVisit,
    language, location, preferredLocations, preferred_locations,
    leadType, lead_type, bhkRequirement, bhk_requirement,
    propertyStatus, property_status, purchaseTimeline, purchase_timeline,
    leadPurpose, lead_purpose, purpose, plotSizeSqyd, plot_size_sqyd,
    landSize, land_size, landSizeUnit, land_size_unit,
    otherRequirements, other_requirements,
  } = payload;

  if (status && !LEAD_STATUSES.includes(status)) {
    const error = new Error("Invalid lead status");
    error.statusCode = 400;
    throw error;
  }
  const existingLead = await getLeadById(id, organizationId, ownerId);

  const locVal = (location !== undefined || preferredLocations !== undefined || preferred_locations !== undefined)
    ? serializeLocation(location || preferredLocations || preferred_locations)
    : undefined;
  const lType = leadType !== undefined ? leadType : lead_type;
  const bhk = bhkRequirement !== undefined ? bhkRequirement : bhk_requirement;
  const propStatus = propertyStatus !== undefined ? propertyStatus : property_status;
  const purchTime = purchaseTimeline !== undefined ? purchaseTimeline : purchase_timeline;
  const lPurpose = leadPurpose !== undefined ? leadPurpose : (lead_purpose !== undefined ? lead_purpose : (purpose !== undefined ? purpose : purposeOfPurchase));
  const pSizeSqyd = plotSizeSqyd !== undefined ? plotSizeSqyd : plot_size_sqyd;
  const lSize = landSize !== undefined ? landSize : land_size;
  const lSizeUnit = landSizeUnit !== undefined ? landSizeUnit : land_size_unit;
  const otherReq = otherRequirements !== undefined ? otherRequirements : other_requirements;

  const result = await pool.query(
    `
    UPDATE leads
    SET
      name = COALESCE($1, name),
      company = COALESCE($2, company),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      status = COALESCE($5, status),
      source = COALESCE($6, source),
      value = COALESCE($7, value),
      purpose_of_purchase = CASE WHEN $8 THEN $9 ELSE purpose_of_purchase END,
      plot_size           = CASE WHEN $10 THEN $11 ELSE plot_size END,
      budget              = CASE WHEN $12 THEN $13 ELSE budget END,
      plan_to_purchase    = CASE WHEN $14 THEN $15 ELSE plan_to_purchase END,
      site_visit          = CASE WHEN $16 THEN $17 ELSE site_visit END,
      zip_code            = CASE WHEN $18 THEN $19 ELSE zip_code END,
      language            = CASE WHEN $20 THEN $21 ELSE language END,
      location            = CASE WHEN $22 THEN $23 ELSE location END,
      preferred_locations = CASE WHEN $22 THEN $23 ELSE preferred_locations END,
      lead_type           = CASE WHEN $24 THEN $25 ELSE lead_type END,
      bhk_requirement     = CASE WHEN $26 THEN $27 ELSE bhk_requirement END,
      property_status     = CASE WHEN $28 THEN $29 ELSE property_status END,
      purchase_timeline   = CASE WHEN $30 THEN $31 ELSE purchase_timeline END,
      purpose             = CASE WHEN $32 THEN $33 ELSE purpose END,
      plot_size_sqyd      = CASE WHEN $34 THEN $35 ELSE plot_size_sqyd END,
      land_size           = CASE WHEN $36 THEN $37 ELSE land_size END,
      land_size_unit      = CASE WHEN $38 THEN $39 ELSE land_size_unit END,
      other_requirements  = CASE WHEN $40 THEN $41 ELSE other_requirements END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $42
      AND organization_id = $43
      ${ownerId ? 'AND owner_id = $44' : ''}
    RETURNING id
    `,
    [
      name || null,
      company || null,
      email || null,
      phone || null,
      status || null,
      source || null,
      value === undefined ? null : Number(value),
      purposeOfPurchase !== undefined, purposeOfPurchase || null,
      plotSize !== undefined, plotSize || null,
      budget !== undefined, budget || null,
      planToPurchase !== undefined, planToPurchase || null,
      siteVisit !== undefined, siteVisit || null,
      zipCode !== undefined, zipCode || null,
      language !== undefined, language || null,
      locVal !== undefined, locVal || null,
      lType !== undefined, lType || null,
      bhk !== undefined, bhk || null,
      propStatus !== undefined, propStatus || null,
      purchTime !== undefined, purchTime || null,
      lPurpose !== undefined, lPurpose || null,
      pSizeSqyd !== undefined, pSizeSqyd ? Number(pSizeSqyd) : null,
      lSize !== undefined, lSize || null,
      lSizeUnit !== undefined, lSizeUnit || null,
      otherReq !== undefined, otherReq || null,
      id,
      organizationId,
      ...(ownerId ? [ownerId] : []),
    ]
  );
  if (result.rows.length === 0) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
  const updatedLead = await getLeadById(id, organizationId, ownerId);
  if (status && status !== existingLead.status && status === "Converted") {
    await createNotification(organizationId, ownerId, {
      type: "lead",
      title: "Lead converted",
      description: `${updatedLead.name} was converted`,
    });
  }

  return updatedLead;
};
const deleteLead = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    DELETE FROM leads
    WHERE id = $1
      AND organization_id = $2
      AND owner_id = $3
    RETURNING id
    `,
    [id, organizationId, ownerId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
  return { id };
};

const getAllLeads = async (organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT l.*, u.name AS owner_name
    FROM leads l
    JOIN users u ON u.id = l.owner_id
    WHERE l.organization_id = $1
      AND l.owner_id = $2
    ORDER BY l.created_at DESC
    `,
    [organizationId, ownerId]
  );
  return result.rows.map(mapLead);
};

module.exports = {
  LEAD_STATUSES,
  LEAD_SOURCES,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getAllLeads,
};
