const exportService = require('../services/exportService');
const leadService = require('../services/leadService');
const customerService = require('../services/customerService');
const dealService = require('../services/dealService');
const taskService = require('../services/taskService');

/**
 * Export leads
 */
async function exportLeads(req, res) {
  try {
    const { format = 'csv' } = req.query;
    const organizationId = req.user.organizationId;
    const ownerId = req.user.userId;
    
    // Get all leads
    const leads = await leadService.getAllLeads(organizationId, ownerId);
    
    // Format data
    const formattedData = exportService.formatLeadsForExport(leads);
    
    // Generate export based on format
    if (format === 'csv') {
      const csv = await exportService.exportToCSV(formattedData, [
        'id', 'name', 'company', 'email', 'phone', 'status', 'source', 'value', 'owner', 'created'
      ]);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
      res.send(csv);
      
    } else if (format === 'excel') {
      const buffer = await exportService.exportToExcel(formattedData, 'Leads', [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Source', key: 'source', width: 20 },
        { header: 'Value', key: 'value', width: 15 },
        { header: 'Owner', key: 'owner', width: 20 },
        { header: 'Created', key: 'created', width: 15 },
      ]);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.xlsx');
      res.send(buffer);
      
    } else if (format === 'pdf') {
      const buffer = await exportService.exportToPDF(formattedData, 'Leads Report', [
        { header: 'Name', key: 'name' },
        { header: 'Company', key: 'company' },
        { header: 'Email', key: 'email' },
        { header: 'Status', key: 'status' },
        { header: 'Value', key: 'value' },
      ]);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.pdf');
      res.send(buffer);
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, excel, pdf',
      });
    }
  } catch (error) {
    console.error('Export leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export leads',
    });
  }
}

/**
 * Export customers
 */
async function exportCustomers(req, res) {
  try {
    const { format = 'csv' } = req.query;
    const organizationId = req.user.organizationId;
    const ownerId = req.user.userId;
    
    // Get all customers
    const customers = await customerService.getAllCustomers(organizationId, ownerId);
    
    // Format data
    const formattedData = exportService.formatCustomersForExport(customers);
    
    // Generate export based on format
    if (format === 'csv') {
      const csv = await exportService.exportToCSV(formattedData, [
        'id', 'name', 'company', 'email', 'phone', 'status', 'industry', 'total_spend', 'since', 'owner', 'created'
      ]);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
      res.send(csv);
      
    } else if (format === 'excel') {
      const buffer = await exportService.exportToExcel(formattedData, 'Customers', [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Industry', key: 'industry', width: 20 },
        { header: 'Total Spend', key: 'total_spend', width: 15 },
        { header: 'Since', key: 'since', width: 15 },
        { header: 'Owner', key: 'owner', width: 20 },
        { header: 'Created', key: 'created', width: 15 },
      ]);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
      res.send(buffer);
      
    } else if (format === 'pdf') {
      const buffer = await exportService.exportToPDF(formattedData, 'Customers Report', [
        { header: 'Name', key: 'name' },
        { header: 'Company', key: 'company' },
        { header: 'Email', key: 'email' },
        { header: 'Status', key: 'status' },
        { header: 'Total Spend', key: 'total_spend' },
      ]);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.pdf');
      res.send(buffer);
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, excel, pdf',
      });
    }
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export customers',
    });
  }
}

/**
 * Export deals
 */
async function exportDeals(req, res) {
  try {
    const { format = 'csv' } = req.query;
    const organizationId = req.user.organizationId;
    const ownerId = req.user.userId;
    
    // Get all deals
    const deals = await dealService.getAllDeals(organizationId, ownerId);
    
    // Format data
    const formattedData = exportService.formatDealsForExport(deals);
    
    // Generate export based on format
    if (format === 'csv') {
      const csv = await exportService.exportToCSV(formattedData, [
        'id', 'title', 'company', 'stage', 'value', 'close_date', 'owner', 'created'
      ]);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=deals.csv');
      res.send(csv);
      
    } else if (format === 'excel') {
      const buffer = await exportService.exportToExcel(formattedData, 'Deals', [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Stage', key: 'stage', width: 15 },
        { header: 'Value', key: 'value', width: 15 },
        { header: 'Close Date', key: 'close_date', width: 15 },
        { header: 'Owner', key: 'owner', width: 20 },
        { header: 'Created', key: 'created', width: 15 },
      ]);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=deals.xlsx');
      res.send(buffer);
      
    } else if (format === 'pdf') {
      const buffer = await exportService.exportToPDF(formattedData, 'Deals Report', [
        { header: 'Title', key: 'title' },
        { header: 'Company', key: 'company' },
        { header: 'Stage', key: 'stage' },
        { header: 'Value', key: 'value' },
        { header: 'Close Date', key: 'close_date' },
      ]);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=deals.pdf');
      res.send(buffer);
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, excel, pdf',
      });
    }
  } catch (error) {
    console.error('Export deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export deals',
    });
  }
}

/**
 * Export tasks
 */
async function exportTasks(req, res) {
  try {
    const { format = 'csv' } = req.query;
    const organizationId = req.user.organizationId;
    const ownerId = req.user.userId;
    
    // Get all tasks
    const tasks = await taskService.getAllTasks(organizationId, ownerId);
    
    // Format data
    const formattedData = exportService.formatTasksForExport(tasks);
    
    // Generate export based on format
    if (format === 'csv') {
      const csv = await exportService.exportToCSV(formattedData, [
        'id', 'title', 'related_to', 'type', 'priority', 'status', 'due_date', 'owner', 'created'
      ]);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
      res.send(csv);
      
    } else if (format === 'excel') {
      const buffer = await exportService.exportToExcel(formattedData, 'Tasks', [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Title', key: 'title', width: 35 },
        { header: 'Related To', key: 'related_to', width: 25 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Due Date', key: 'due_date', width: 15 },
        { header: 'Owner', key: 'owner', width: 20 },
        { header: 'Created', key: 'created', width: 15 },
      ]);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks.xlsx');
      res.send(buffer);
      
    } else if (format === 'pdf') {
      const buffer = await exportService.exportToPDF(formattedData, 'Tasks Report', [
        { header: 'Title', key: 'title' },
        { header: 'Type', key: 'type' },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' },
        { header: 'Due Date', key: 'due_date' },
      ]);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks.pdf');
      res.send(buffer);
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, excel, pdf',
      });
    }
  } catch (error) {
    console.error('Export tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tasks',
    });
  }
}

module.exports = {
  exportLeads,
  exportCustomers,
  exportDeals,
  exportTasks,
};
