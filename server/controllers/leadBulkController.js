const pool = require("../config/db");
const leadService = require("../services/leadService");

/**
 * POST /api/employee/leads/bulk-upload
 * Body: { leads: [ {name, phone, purposeOfPurchase, plotSize, budget, planToPurchase, siteVisit, status, source, company, email, value}, ... ] }
 *
 * Supports the Facebook Lead Ads CSV format columns:
 * full_name | phone | purpose_of_purchase | plot_size | budget | plan_to_purchase | would_you_like_to_schedule_a_free_site_visit
 */
const bulkUploadLeads = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, message: "No leads provided" });
    }
    if (leads.length > 500) {
      return res.status(400).json({ success: false, message: "Maximum 500 leads per upload" });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < leads.length; i++) {
      const raw = leads[i];
      try {
        const name = (raw.full_name || raw.name || "").trim();
        const phone = (raw.phone || "").trim().replace(/^p:/, "");
        const email = (raw.email || `lead_${Date.now()}_${i}@import.local`).trim();
        const company = (raw.company || "—").trim();

        if (!name) {
          results.errors.push({ row: i + 1, reason: "Name is required" });
          results.skipped++;
          continue;
        }

        const payload = {
          name,
          company,
          email,
          phone: phone || null,
          status: mapStatus(raw.lead_status || raw.status),
          source: mapSource(raw.source || raw.platform || ""),
          value: Number(raw.value) || 0,
          purposeOfPurchase: cleanValue(raw.purpose_of_purchase),
          plotSize: cleanValue(raw.plot_size_required || raw.plot_size),
          budget: cleanValue(raw.budget),
          planToPurchase: cleanValue(raw.plan_to_purchase),
          siteVisit: cleanSiteVisit(raw.would_you_like_to_schedule_a_free_site_visit || raw.site_visit),
        };

        await leadService.createLead(organizationId, userId, payload);
        results.created++;
      } catch (err) {
        results.errors.push({ row: i + 1, reason: err.message });
        results.skipped++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk upload complete: ${results.created} created, ${results.skipped} skipped`,
      data: results,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ success: false, message: "Bulk upload failed" });
  }
};

// ── helpers ──────────────────────────────────────────────────────────────────

const cleanValue = (v) => {
  if (!v) return null;
  // Convert snake_case values like "building_dream_house" → "Building Dream House"
  return String(v)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || null;
};

const cleanSiteVisit = (v) => {
  if (!v) return null;
  const s = String(v).toLowerCase().trim();
  if (s === "yes") return "Yes";
  if (s === "no") return "No";
  if (s === "not_yet") return "Not Yet";
  if (s === "need_more_details") return "Need More Details";
  return cleanValue(v);
};

const mapStatus = (v) => {
  const s = String(v || "").toLowerCase();
  if (s === "complete" || s === "completed") return "New"; // freshly imported lead starts as New
  const map = { new: "New", contacted: "Contacted", qualified: "Qualified", unqualified: "Unqualified", converted: "Converted" };
  return map[s] || "New";
};

const mapSource = (v) => {
  const s = String(v || "").toLowerCase();
  if (s === "ig" || s === "instagram") return "Social Media";
  if (s === "fb" || s === "facebook") return "Social Media";
  if (s === "website") return "Website";
  if (s === "referral") return "Referral";
  if (s === "cold call" || s === "cold_call") return "Cold Call";
  if (s === "advertisement" || s === "ad") return "Advertisement";
  if (s === "event") return "Event";
  return "Social Media"; // default for ad leads
};

module.exports = { bulkUploadLeads };
