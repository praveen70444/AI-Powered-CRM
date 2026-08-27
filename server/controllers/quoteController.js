const quoteService = require('../services/quoteService');

const getQuotes = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { page = 1, limit = 20 } = req.query;
    const result = await quoteService.getQuotes(organizationId, userId, { page: parseInt(page), limit: parseInt(limit) });
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to load quotes' }); }
};

const getQuoteById = async (req, res) => {
  try {
    const quote = await quoteService.getQuoteById(req.params.id, req.user.organizationId);
    res.json({ success: true, data: quote });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const createQuote = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const quote = await quoteService.createQuote(organizationId, userId, req.body);
    res.status(201).json({ success: true, message: 'Quote created', data: quote });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const updateQuote = async (req, res) => {
  try {
    const quote = await quoteService.updateQuote(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, message: 'Quote updated', data: quote });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const deleteQuote = async (req, res) => {
  try {
    await quoteService.deleteQuote(req.params.id, req.user.organizationId);
    res.json({ success: true, message: 'Quote deleted' });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const addLineItem = async (req, res) => {
  try {
    const item = await quoteService.addLineItem(req.params.id, req.user.organizationId, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const removeLineItem = async (req, res) => {
  try {
    await quoteService.removeLineItem(req.params.itemId, req.params.quoteId, req.user.organizationId);
    res.json({ success: true, message: 'Line item removed' });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

module.exports = { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote, addLineItem, removeLineItem };
