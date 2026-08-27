const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sendPasswordResetEmail } = require('./emailService');

/**
 * Generate password reset token
 */
async function createPasswordResetToken(userId) {
  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Set expiration (1 hour from now)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  // Save to database
  const query = `
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  
  await pool.query(query, [userId, tokenHash, expiresAt]);
  
  return token; // Return unhashed token to send in email
}

/**
 * Request password reset
 */
async function requestPasswordReset(email) {
  // Find user by email
  const userQuery = 'SELECT id, name, email, organization_id FROM users WHERE LOWER(email) = LOWER($1)';
  const userResult = await pool.query(userQuery, [email]);
  
  if (userResult.rows.length === 0) {
    // Don't reveal if email exists or not for security
    return { success: true, message: 'If an account exists, a reset email has been sent.' };
  }
  
  const user = userResult.rows[0];
  
  // Generate reset token
  const token = await createPasswordResetToken(user.id);
  
  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
  
  // Send email
  try {
    await sendPasswordResetEmail({
      email: user.email,
      resetUrl,
      userName: user.name,
      organizationId: user.organization_id,
      userId: user.id,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Continue anyway - don't reveal email sending failure
  }
  
  return { success: true, message: 'If an account exists, a reset email has been sent.' };
}

/**
 * Verify password reset token
 */
async function verifyPasswordResetToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const query = `
    SELECT prt.*, u.id as user_id, u.email, u.name
    FROM password_reset_tokens prt
    JOIN users u ON prt.user_id = u.id
    WHERE prt.token_hash = $1
      AND prt.expires_at > CURRENT_TIMESTAMP
      AND prt.used_at IS NULL
  `;
  
  const result = await pool.query(query, [tokenHash]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

/**
 * Reset password with token
 */
async function resetPasswordWithToken(token, newPassword) {
  // Verify token
  const tokenData = await verifyPasswordResetToken(token);
  
  if (!tokenData) {
    throw new Error('Invalid or expired reset token');
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Update user password
  const updateQuery = `
    UPDATE users
    SET password_hash = $1,
        password_changed_at = CURRENT_TIMESTAMP,
        failed_login_attempts = 0,
        account_locked_until = NULL
    WHERE id = $2
  `;
  
  await pool.query(updateQuery, [passwordHash, tokenData.user_id]);
  
  // Mark token as used
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const markUsedQuery = `
    UPDATE password_reset_tokens
    SET used_at = CURRENT_TIMESTAMP
    WHERE token_hash = $1
  `;
  
  await pool.query(markUsedQuery, [tokenHash]);
  
  return { success: true, message: 'Password has been reset successfully' };
}

/**
 * Change password (authenticated user)
 */
async function changePassword(userId, currentPassword, newPassword) {
  // Get current password hash
  const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
  const userResult = await pool.query(userQuery, [userId]);
  
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = userResult.rows[0];
  
  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Update password
  const updateQuery = `
    UPDATE users
    SET password_hash = $1,
        password_changed_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;
  
  await pool.query(updateQuery, [passwordHash, userId]);
  
  return { success: true, message: 'Password changed successfully' };
}

/**
 * Record failed login attempt
 */
async function recordFailedLogin(email) {
  const query = `
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1,
        account_locked_until = CASE
          WHEN failed_login_attempts + 1 >= 5
          THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
          ELSE NULL
        END
    WHERE LOWER(email) = LOWER($1)
  `;
  
  await pool.query(query, [email]);
}

/**
 * Reset failed login attempts
 */
async function resetFailedLoginAttempts(userId) {
  const query = `
    UPDATE users
    SET failed_login_attempts = 0,
        account_locked_until = NULL
    WHERE id = $1
  `;
  
  await pool.query(query, [userId]);
}

/**
 * Check if account is locked
 */
async function isAccountLocked(email) {
  const query = `
    SELECT account_locked_until, failed_login_attempts
    FROM users
    WHERE LOWER(email) = LOWER($1)
  `;
  
  const result = await pool.query(query, [email]);
  
  if (result.rows.length === 0) {
    return false;
  }
  
  const user = result.rows[0];
  
  if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
    return true;
  }
  
  return false;
}

module.exports = {
  createPasswordResetToken,
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPasswordWithToken,
  changePassword,
  recordFailedLogin,
  resetFailedLoginAttempts,
  isAccountLocked,
};
