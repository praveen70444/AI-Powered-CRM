const productService = require('../services/productService');

const getProducts = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { page = 1, limit = 50, search = '', category = '', isActive = '' } = req.query;
    const result = await productService.getProducts(organizationId, { page: parseInt(page), limit: Math.min(parseInt(limit), 200), search, category, isActive });
    res.json({ success: true, message: 'Products fetched', ...result });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Failed to load products' }); }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id, req.user.organizationId);
    res.json({ success: true, data: product });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const createProduct = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const product = await productService.createProduct(organizationId, userId, req.body);
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id, req.user.organizationId);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts(req.user.organizationId);
    res.json({ success: true, data: products });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to load products' }); }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getAllProducts };
