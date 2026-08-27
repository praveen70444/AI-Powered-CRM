const pool = require("../config/db");

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const { userId, organizationId } = req.user;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: { leads: [], customers: [], deals: [], total: 0 } });
    }

    const likeQ = `%${q}%`;

    const [leadsResult, customersResult, dealsResult] = await Promise.all([
      pool.query(
        `SELECT id, name, company, email, status, 'lead' as type FROM leads
         WHERE organization_id = $1 AND owner_id = $2
           AND (search_vector @@ plainto_tsquery('english', $3) OR name ILIKE $4 OR company ILIKE $4 OR email ILIKE $4)
         LIMIT 5`,
        [organizationId, userId, q, likeQ]
      ),
      pool.query(
        `SELECT id, name, company, email, status, 'customer' as type FROM customers
         WHERE organization_id = $1 AND owner_id = $2
           AND (search_vector @@ plainto_tsquery('english', $3) OR name ILIKE $4 OR company ILIKE $4 OR email ILIKE $4)
         LIMIT 5`,
        [organizationId, userId, q, likeQ]
      ),
      pool.query(
        `SELECT id, title as name, company, stage as status, 'deal' as type FROM deals
         WHERE organization_id = $1 AND owner_id = $2
           AND (search_vector @@ plainto_tsquery('english', $3) OR title ILIKE $4 OR company ILIKE $4)
         LIMIT 5`,
        [organizationId, userId, q, likeQ]
      ),
    ]);

    const leads = leadsResult.rows;
    const customers = customersResult.rows;
    const deals = dealsResult.rows;

    res.json({
      success: true,
      data: { leads, customers, deals, total: leads.length + customers.length + deals.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

module.exports = { globalSearch };
