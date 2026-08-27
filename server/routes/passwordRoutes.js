const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const passwordController = require('../controllers/passwordController');
const { passwordResetLimiter } = require('../middleware/securityMiddleware');

// Request password reset (public)
router.post(
  '/request-reset',
  passwordResetLimiter,
  passwordController.requestReset
);

// Verify reset token (public)
router.get(
  '/verify-token/:token',
  passwordController.verifyToken
);

// Reset password with token (public)
router.post(
  '/reset/:token',
  passwordController.resetPassword
);

// Change password (authenticated)
router.post(
  '/change',
  authMiddleware,
  passwordController.changePassword
);

module.exports = router;
