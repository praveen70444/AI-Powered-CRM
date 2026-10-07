const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');
const superAdminController = require('../controllers/superAdminController');

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/organizations', superAdminController.getOrganizations);
router.post('/organizations', superAdminController.createOrganization);

module.exports = router;
