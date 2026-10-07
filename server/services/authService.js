const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");
const { logLogin, logAudit } = require("./auditService");
const { isAccountLocked, recordFailedLogin, resetFailedLoginAttempts } = require("./passwordService");
const { sendWelcomeEmail } = require("./emailService");
const registerOrganization = async ({
  organizationName,
  adminName,
  email,
  password,
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      throw error;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const organizationResult = await client.query(
      `
      INSERT INTO organizations (name)
      VALUES ($1)
      RETURNING id, name, status, created_at
      `,
      [organizationName]
    );
    const organization = organizationResult.rows[0];
    const userResult = await client.query(
      `
      INSERT INTO users (
        organization_id,
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, 'ORG_ADMIN', 'ACTIVE')
      RETURNING id, organization_id, name, email, role, status, created_at
      `,
      [
        organization.id,
        adminName,
        email,
        passwordHash,
      ]
    );
    const user = userResult.rows[0];
    await client.query("COMMIT");
    return {
      organization,
      user,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const loginUser = async ({ email, password, ipAddress, userAgent }) => {
  // Check if account is locked
  const locked = await isAccountLocked(email);
  if (locked) {
    await logLogin({
      userId: null,
      success: false,
      failureReason: 'Account locked',
      ipAddress,
      userAgent,
    });
    const error = new Error("Account is temporarily locked due to multiple failed login attempts. Please try again in 30 minutes or reset your password.");
    error.statusCode = 403;
    throw error;
  }
  
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.organization_id,
      u.name,
      u.email,
      u.password_hash,
      u.role,
      u.status,
      o.industry as organization_industry
    FROM users u
    LEFT JOIN organizations o ON o.id = u.organization_id
    WHERE u.email = $1
    
    `,
    [email]
  );
  if (result.rows.length === 0) {
    await logLogin({
      userId: null,
      success: false,
      failureReason: 'Invalid credentials',
      ipAddress,
      userAgent,
    });
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }
  const user = result.rows[0];
  if (user.status !== "ACTIVE") {
    await logLogin({
      userId: user.id,
      success: false,
      failureReason: 'Account not active',
      ipAddress,
      userAgent,
    });
    const error = new Error("User account is not active");
    error.statusCode = 403;
    throw error;
  }
  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );
  if (!passwordMatches) {
    await recordFailedLogin(email);
    await logLogin({
      userId: user.id,
      success: false,
      failureReason: 'Invalid password',
      ipAddress,
      userAgent,
    });
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }
  
  // Reset failed login attempts on successful login
  await resetFailedLoginAttempts(user.id);
  
  const token = jwt.sign(
    {
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
  await pool.query(
    `
    UPDATE users
    SET last_login_at = CURRENT_TIMESTAMP
    WHERE id = $1
    `,
    [user.id]
  );
  
  // Log successful login
  await logLogin({
    userId: user.id,
    success: true,
    ipAddress,
    userAgent,
  });
  
  await logAudit({
    organizationId: user.organization_id,
    userId: user.id,
    action: 'login',
    ipAddress,
    userAgent,
  });
  
  return {
    token,
    user: {
      id: user.id,
      organizationId: user.organization_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationIndustry: user.organization_industry,
    },
  };
};
const getInvitationByToken = async (rawToken) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const result = await pool.query(
    `
    SELECT
      i.id,
      i.organization_id,
      i.email,
      i.role,
      i.status,
      i.expires_at,
      o.name AS organization_name
    FROM invitations i
    JOIN organizations o
      ON o.id = i.organization_id
    WHERE i.token_hash = $1
    `,
    [tokenHash]
  );
  if (result.rows.length === 0) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }
  const invitation = result.rows[0];
  if (invitation.status !== "PENDING") {
    const error = new Error("Invitation is no longer valid");
    error.statusCode = 400;
    throw error;
  }
  if (new Date(invitation.expires_at) < new Date()) {
    const error = new Error("Invitation has expired");
    error.statusCode = 400;
    throw error;
  }
  return invitation;
};
const acceptInvitation = async ({ token, name, password }) => {
  if (!token || !password) {
    const error = new Error("Token and password are required");
    error.statusCode = 400;
    throw error;
  }
  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.statusCode = 400;
    throw error;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const invitationResult = await client.query(
      `
      SELECT
        id,
        organization_id,
        email,
        role,
        status,
        expires_at
      FROM invitations
      WHERE token_hash = $1
      FOR UPDATE
      `,
      [tokenHash]
    );
    if (invitationResult.rows.length === 0) {
      const error = new Error("Invitation not found");
      error.statusCode = 404;
      throw error;
    }
    const invitation = invitationResult.rows[0];
    if (invitation.status !== "PENDING") {
      const error = new Error("Invitation is no longer valid");
      error.statusCode = 400;
      throw error;
    }
    if (new Date(invitation.expires_at) < new Date()) {
      const error = new Error("Invitation has expired");
      error.statusCode = 400;
      throw error;
    }
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [invitation.email]
    );
    if (existingUser.rows.length > 0) {
      const error = new Error("An account already exists for this email");
      error.statusCode = 409;
      throw error;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `
      INSERT INTO users (
        organization_id,
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
      RETURNING id, organization_id, name, email, role, status, created_at
      `,
      [
        invitation.organization_id,
        name && name.trim() ? name.trim() : invitation.email.split("@")[0],
        invitation.email,
        passwordHash,
        invitation.role,
      ]
    );
    const user = userResult.rows[0];
    await client.query(
      `
      UPDATE invitations
      SET status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [invitation.id]
    );
    await client.query("COMMIT");
    
    // Send welcome email
    const orgResult = await pool.query(
      'SELECT name FROM organizations WHERE id = $1',
      [user.organization_id]
    );
    const organizationName = orgResult.rows[0]?.name || 'CRM Portal';
    
    try {
      await sendWelcomeEmail({
        email: user.email,
        userName: user.name,
        organizationName,
        organizationId: user.organization_id,
        userId: user.id,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail account creation if email fails
    }
    
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );
    return {
      token: jwtToken,
      user,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
module.exports = {
  registerOrganization,
  loginUser,
  getInvitationByToken,
  acceptInvitation,
};
