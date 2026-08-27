const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Export data to CSV
 */
async function exportToCSV(data, fields) {
  try {
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    return csv;
  } catch (error) {
    throw new Error('Failed to generate CSV: ' + error.message);
  }
}

/**
 * Export data to Excel
 */
async function exportToExcel(data, sheetName = 'Data', columns) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Set columns
    worksheet.columns = columns;
    
    // Add rows
    worksheet.addRows(data);
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw new Error('Failed to generate Excel: ' + error.message);
  }
}

/**
 * Export data to PDF
 */
async function exportToPDF(data, title, columns) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add title
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Calculate column widths
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const columnWidth = pageWidth / columns.length;
      
      // Draw table header
      let yPosition = doc.y;
      doc.fontSize(10).fillColor('#3B82F6');
      
      columns.forEach((col, i) => {
        doc.text(col.header, doc.page.margins.left + (i * columnWidth), yPosition, {
          width: columnWidth,
          align: 'left',
        });
      });
      
      doc.moveTo(doc.page.margins.left, yPosition + 15)
         .lineTo(doc.page.width - doc.page.margins.right, yPosition + 15)
         .stroke('#3B82F6');
      
      doc.moveDown();
      
      // Draw table rows
      doc.fillColor('#000000');
      data.forEach((row, rowIndex) => {
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          yPosition = doc.page.margins.top;
        } else {
          yPosition = doc.y;
        }
        
        columns.forEach((col, colIndex) => {
          const value = row[col.key] || '';
          doc.text(String(value), doc.page.margins.left + (colIndex * columnWidth), yPosition, {
            width: columnWidth - 10,
            align: 'left',
          });
        });
        
        if (rowIndex < data.length - 1) {
          doc.moveTo(doc.page.margins.left, yPosition + 15)
             .lineTo(doc.page.width - doc.page.margins.right, yPosition + 15)
             .stroke('#CCCCCC');
        }
        
        doc.moveDown();
      });
      
      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(new Error('Failed to generate PDF: ' + error.message));
    }
  });
}

/**
 * Format leads data for export
 */
function formatLeadsForExport(leads) {
  return leads.map(lead => ({
    id: lead.id,
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone || '',
    status: lead.status,
    source: lead.source || '',
    value: lead.value,
    owner: lead.owner || '',
    created: new Date(lead.created_at).toLocaleDateString(),
  }));
}

/**
 * Format customers data for export
 */
function formatCustomersForExport(customers) {
  return customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    company: customer.company,
    email: customer.email,
    phone: customer.phone || '',
    status: customer.status,
    industry: customer.industry || '',
    total_spend: customer.total_spend,
    since: customer.since || new Date(customer.customer_since).toLocaleDateString(),
    owner: customer.owner || '',
    created: new Date(customer.created_at).toLocaleDateString(),
  }));
}

/**
 * Format deals data for export
 */
function formatDealsForExport(deals) {
  return deals.map(deal => ({
    id: deal.id,
    title: deal.title,
    company: deal.company || '',
    stage: deal.stage,
    value: deal.value,
    close_date: deal.close_date || '',
    owner: deal.owner || '',
    created: new Date(deal.created_at).toLocaleDateString(),
  }));
}

/**
 * Format tasks data for export
 */
function formatTasksForExport(tasks) {
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    related_to: task.related_to || '',
    type: task.type,
    priority: task.priority,
    status: task.status,
    due_date: task.due_date || '',
    owner: task.owner || '',
    created: new Date(task.created_at).toLocaleDateString(),
  }));
}

module.exports = {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  formatLeadsForExport,
  formatCustomersForExport,
  formatDealsForExport,
  formatTasksForExport,
};
