const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');
const { upload } = require('../services/fileUploadService');
const { uploadLimiter } = require('../middleware/securityMiddleware');

// Set upload type middleware
const setUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

// Upload avatar (employee or admin)
router.post(
  '/avatar',
  authMiddleware,
  uploadLimiter,
  setUploadType('avatars'),
  upload.single('avatar'),
  fileController.uploadAvatar
);

// Upload organization logo (org admin only)
router.post(
  '/logo',
  authMiddleware,
  uploadLimiter,
  setUploadType('logos'),
  upload.single('logo'),
  fileController.uploadLogo
);

// Upload attachment to entity (lead, customer, deal, task)
router.post(
  '/attachments',
  authMiddleware,
  uploadLimiter,
  setUploadType('attachments'),
  upload.single('file'),
  fileController.uploadAttachment
);

// Get attachments for an entity
router.get(
  '/attachments/:relatedType/:relatedId',
  authMiddleware,
  fileController.getAttachments
);

// Delete attachment
router.delete(
  '/attachments/:attachmentId',
  authMiddleware,
  fileController.deleteAttachment
);

// Serve file (public route - but will check permissions if needed)
router.get(
  '/:type/:filename',
  fileController.serveFile
);

module.exports = router;
