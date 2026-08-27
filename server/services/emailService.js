const nodemailer = require('nodemailer');
const pool = require('../config/db');

// Create reusable transporter
const createTransporter = () => {
  // For development, use ethereal email or configure your SMTP
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  
  // Fallback: console logging for development
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 Email would be sent:');
      console.log('  To:', mailOptions.to);
      console.log('  Subject:', mailOptions.subject);
      console.log('  Body:', mailOptions.html || mailOptions.text);
      return { messageId: 'dev-' + Date.now() };
    },
  };
};

/**
 * Send email and log it
 */
async function sendEmail({ to, subject, html, text, organizationId, userId, relatedType, relatedId, templateId }) {
  const transporter = createTransporter();
  
  const fromEmail = process.env.EMAIL_FROM || 'noreply@crm.com';
  
  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
      text,
    });
    
    // Log email
    await logEmail({
      organizationId,
      userId,
      toEmail: to,
      fromEmail,
      subject,
      body: html || text,
      templateId,
      relatedType,
      relatedId,
      status: 'sent',
      sentAt: new Date(),
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log failed email
    await logEmail({
      organizationId,
      userId,
      toEmail: to,
      fromEmail,
      subject,
      body: html || text,
      templateId,
      relatedType,
      relatedId,
      status: 'failed',
      errorMessage: error.message,
    });
    
    throw error;
  }
}

/**
 * Log email to database
 */
async function logEmail(emailData) {
  const query = `
    INSERT INTO email_logs (
      organization_id, user_id, to_email, from_email, subject, body,
      template_id, related_type, related_id, status, sent_at, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `;
  
  const values = [
    emailData.organizationId || null,
    emailData.userId || null,
    emailData.toEmail,
    emailData.fromEmail,
    emailData.subject,
    emailData.body,
    emailData.templateId || null,
    emailData.relatedType || null,
    emailData.relatedId || null,
    emailData.status,
    emailData.sentAt || null,
    emailData.errorMessage || null,
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Send invitation email
 */
async function sendInvitationEmail({ email, invitationUrl, organizationName, role, organizationId, invitedBy }) {
  const subject = `Invitation to join ${organizationName} on CRM Portal`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You've been invited to join <strong>${organizationName}</strong> as a <strong>${role}</strong> on our CRM Portal.</p>
          <p>Click the button below to accept your invitation and create your account:</p>
          <p style="text-align: center;">
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3B82F6;">${invitationUrl}</p>
          <p><strong>Note:</strong> This invitation link will expire in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 CRM Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
    organizationId,
    userId: invitedBy,
    relatedType: 'invitation',
    relatedId: null,
  });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail({ email, resetUrl, userName, organizationId, userId }) {
  const subject = 'Reset Your Password - CRM Portal';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password for your CRM Portal account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3B82F6;">${resetUrl}</p>
          <div class="warning">
            <strong>Security Note:</strong> This link will expire in 1 hour for your security.
          </div>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 CRM Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
    organizationId,
    userId,
    relatedType: 'password_reset',
  });
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail({ email, userName, organizationName, organizationId, userId }) {
  const subject = `Welcome to ${organizationName} - CRM Portal`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome!</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>Welcome to <strong>${organizationName}</strong>! Your account has been successfully created.</p>
          <p>You can now log in to the CRM Portal and start managing leads, customers, and deals.</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Go to Login</a>
          </p>
          <p>If you have any questions, feel free to reach out to your team administrator.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 CRM Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
    organizationId,
    userId,
    relatedType: 'welcome',
  });
}

/**
 * Send notification email
 */
async function sendNotificationEmail({ email, subject, message, actionUrl, organizationId, userId }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 Notification</h1>
        </div>
        <div class="content">
          <p>${message}</p>
          ${actionUrl ? `
          <p style="text-align: center;">
            <a href="${actionUrl}" class="button">View Details</a>
          </p>
          ` : ''}
        </div>
        <div class="footer">
          <p>&copy; 2024 CRM Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
    organizationId,
    userId,
    relatedType: 'notification',
  });
}

module.exports = {
  sendEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  logEmail,
};
