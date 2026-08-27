const pool = require('../config/db');

/**
 * Convert lead to customer
 */
async function convertLeadToCustomer(leadId, organizationId, userId, options = {}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get lead data
    const leadQuery = `
      SELECT * FROM leads
      WHERE id = $1 AND organization_id = $2
    `;
    const leadResult = await client.query(leadQuery, [leadId, organizationId]);
    
    if (leadResult.rows.length === 0) {
      throw new Error('Lead not found');
    }
    
    const lead = leadResult.rows[0];
    
    if (lead.status === 'Converted') {
      throw new Error('Lead has already been converted');
    }
    
    // Check if customer with same email already exists
    const existingCustomerQuery = `
      SELECT id FROM customers
      WHERE LOWER(email) = LOWER($1) AND organization_id = $2
    `;
    const existingCustomer = await client.query(existingCustomerQuery, [lead.email, organizationId]);
    
    if (existingCustomer.rows.length > 0) {
      throw new Error('A customer with this email already exists');
    }
    
    // Create customer from lead data
    const customerQuery = `
      INSERT INTO customers (
        organization_id, owner_id, name, company, email, phone,
        status, industry, total_spend, customer_since
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
      RETURNING *
    `;
    
    const customerValues = [
      organizationId,
      lead.owner_id,
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      'Active',
      options.industry || null,
      0, // Initial total_spend
    ];
    
    const customerResult = await client.query(customerQuery, customerValues);
    const customer = customerResult.rows[0];
    
    // Update lead status and link to customer
    const updateLeadQuery = `
      UPDATE leads
      SET status = 'Converted',
          converted_to_customer_id = $1,
          converted_at = CURRENT_TIMESTAMP,
          conversion_notes = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const updatedLeadResult = await client.query(updateLeadQuery, [
      customer.id,
      options.notes || null,
      leadId,
    ]);
    
    const updatedLead = updatedLeadResult.rows[0];
    
    // Optionally create a deal if requested
    let deal = null;
    if (options.createDeal) {
      const dealQuery = `
        INSERT INTO deals (
          organization_id, owner_id, customer_id, title, company,
          stage, value, close_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const dealValues = [
        organizationId,
        lead.owner_id,
        customer.id,
        options.dealTitle || `Deal with ${lead.company}`,
        lead.company,
        options.dealStage || 'New',
        options.dealValue || lead.value || 0,
        options.dealCloseDate || null,
      ];
      
      const dealResult = await client.query(dealQuery, dealValues);
      deal = dealResult.rows[0];
    }
    
    // Transfer notes from lead to customer
    const transferNotesQuery = `
      UPDATE notes
      SET related_type = 'Customer',
          related_to = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE related_type = 'Lead' AND related_to = $2 AND organization_id = $3
    `;
    
    await client.query(transferNotesQuery, [
      customer.company,
      lead.company,
      organizationId,
    ]);
    
    // Create activity record for conversion
    const activityQuery = `
      INSERT INTO activities (
        organization_id, owner_id, title, related_to, type
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(activityQuery, [
      organizationId,
      userId,
      `Converted lead "${lead.name}" to customer`,
      customer.company,
      'Lead Update',
    ]);
    
    // Create notification
    const notificationQuery = `
      INSERT INTO notifications (
        organization_id, user_id, type, title, description
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(notificationQuery, [
      organizationId,
      lead.owner_id,
      'customer',
      'Lead Converted to Customer',
      `Lead "${lead.name}" from ${lead.company} has been converted to a customer.`,
    ]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      customer,
      lead: updatedLead,
      deal,
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get conversion history for a lead
 */
async function getLeadConversionHistory(leadId, organizationId) {
  const query = `
    SELECT 
      l.id as lead_id,
      l.name as lead_name,
      l.status,
      l.converted_at,
      l.conversion_notes,
      c.id as customer_id,
      c.name as customer_name,
      c.company as customer_company,
      u.name as converted_by
    FROM leads l
    LEFT JOIN customers c ON l.converted_to_customer_id = c.id
    LEFT JOIN users u ON l.owner_id = u.id
    WHERE l.id = $1 AND l.organization_id = $2
  `;
  
  const result = await pool.query(query, [leadId, organizationId]);
  return result.rows[0];
}

/**
 * Get all converted leads
 */
async function getConvertedLeads(organizationId, limit = 50, offset = 0) {
  const query = `
    SELECT 
      l.*,
      c.id as customer_id,
      c.name as customer_name,
      c.company as customer_company,
      u.name as owner_name
    FROM leads l
    INNER JOIN customers c ON l.converted_to_customer_id = c.id
    LEFT JOIN users u ON l.owner_id = u.id
    WHERE l.organization_id = $1 AND l.status = 'Converted'
    ORDER BY l.converted_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const result = await pool.query(query, [organizationId, limit, offset]);
  return result.rows;
}

module.exports = {
  convertLeadToCustomer,
  getLeadConversionHistory,
  getConvertedLeads,
};
