const passwordService = require('../services/passwordService');

/**
 * Request password reset
 */
async function requestReset(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }
    
    const result = await passwordService.requestPasswordReset(email);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
}

/**
 * Verify reset token
 */
async function verifyToken(req, res) {
  try {
    const { token } = req.params;
    
    const tokenData = await passwordService.verifyPasswordResetToken(token);
    
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }
    
    res.json({
      success: true,
      data: {
        email: tokenData.email,
        name: tokenData.name,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify reset token',
    });
  }
}

/**
 * Reset password with token
 */
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }
    
    const result = await passwordService.resetPasswordWithToken(token, password);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
}

/**
 * Change password (authenticated user)
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }
    
    const result = await passwordService.changePassword(userId, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to change password',
    });
  }
}

module.exports = {
  requestReset,
  verifyToken,
  resetPassword,
  changePassword,
};
