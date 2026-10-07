const pool = require('../config/db');
const authService = require('../services/authService');

const getOrganizations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, o.name, o.status, o.industry, o.created_at,
             COUNT(u.id) as employee_count
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createOrganization = async (req, res) => {
  try {
    const { organizationName, industry, adminName, email, password } = req.body;
    
    if (!organizationName || !adminName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Register organization using authService (it creates org + org_admin)
    const result = await authService.registerOrganization({
      organizationName,
      adminName,
      email,
      password
    });
    
    // Update industry if provided
    if (industry) {
      await pool.query('UPDATE organizations SET industry = $1 WHERE id = $2', [industry, result.organization.id]);
      result.organization.industry = industry;
    }

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getOrganizations,
  createOrganization
};
