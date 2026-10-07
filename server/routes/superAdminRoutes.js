const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');
const superAdminController = require('../controllers/superAdminController');

router.use(authenticate);
router.use(authorizeRole(['SUPER_ADMIN']));

router.get('/organizations', superAdminController.getOrganizations);
router.post('/organizations', superAdminController.createOrganization);

module.exports = router;
