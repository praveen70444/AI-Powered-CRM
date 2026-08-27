const crypto = require("crypto");
const pool = require("../config/db");
const { sendInvitationEmail } = require("./emailService");
const getOrganizationDashboard = async (organizationId) => {
  const totalEmployeesResult = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM users
    WHERE organization_id = $1
      AND role != 'ORG_ADMIN'
    `,
    [organizationId]
  );
  const activeEmployeesResult = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM users
    WHERE organization_id = $1
      AND role != 'ORG_ADMIN'
      AND status = 'ACTIVE'
    `,
    [organizationId]
  );
  const inactiveEmployeesResult = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM users
    WHERE organization_id = $1
      AND role != 'ORG_ADMIN'
      AND status = 'INACTIVE'
    `,
    [organizationId]
  );
  const pendingInvitationsResult = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM invitations
    WHERE organization_id = $1
      AND status = 'PENDING'
      AND expires_at > CURRENT_TIMESTAMP
    `,
    [organizationId]
  );
  return {
    totalEmployees: Number(
      totalEmployeesResult.rows[0].count
    ),
    activeEmployees: Number(
      activeEmployeesResult.rows[0].count
    ),
    inactiveEmployees: Number(
      inactiveEmployeesResult.rows[0].count
    ),
    pendingInvitations: Number(
      pendingInvitationsResult.rows[0].count
    ),
  };
};
const getOrganizationEmployees = async (organizationId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      role,
      status,
      created_at
    FROM users
    WHERE organization_id = $1
      AND role != 'ORG_ADMIN'
    ORDER BY created_at DESC
    `,
    [organizationId]
  );

  return result.rows;
};
const createInvitation = async ({
  organizationId,
  invitedBy,
  email,
  role,
}) => {
  const normalizedEmail = email
    .trim()
    .toLowerCase();
  const allowedRoles = [
    "SALES_MANAGER",
    "SALES_EXECUTIVE",
    "SUPPORT_AGENT",
  ];
  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid employee role");
  }
  const existingUserResult = await pool.query(
    `
    SELECT id
    FROM users
    WHERE LOWER(email) = $1
    `,
    [normalizedEmail]
  );
  if (existingUserResult.rows.length > 0) {
    throw new Error("Employee already exists");
  }
  const existingInvitationResult = await pool.query(
    `
    SELECT id
    FROM invitations
    WHERE organization_id = $1
      AND LOWER(email) = $2
      AND status = 'PENDING'
      AND expires_at > CURRENT_TIMESTAMP
    `,
    [
      organizationId,
      normalizedEmail,
    ]
  );
  if (existingInvitationResult.rows.length > 0) {
    throw new Error(
      "A pending invitation already exists"
    );
  }
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );
  const result = await pool.query(
    `
    INSERT INTO invitations (
      organization_id,
      email,
      role,
      token_hash,
      expires_at,
      status,
      invited_by
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      'PENDING',
      $6
    )
    RETURNING
      id,
      organization_id,
      email,
      role,
      expires_at,
      status,
      invited_by,
      created_at
    `,
    [
      organizationId,
      normalizedEmail,
      role,
      tokenHash,
      expiresAt,
      invitedBy,
    ]
  );
  const invitation = result.rows[0];
  
  // Get organization name for email
  const orgResult = await pool.query(
    'SELECT name FROM organizations WHERE id = $1',
    [organizationId]
  );
  const organizationName = orgResult.rows[0]?.name || 'CRM Portal';
  
  // Create invitation URL
  const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${rawToken}`;
  
  // Send invitation email
  try {
    await sendInvitationEmail({
      email: normalizedEmail,
      invitationUrl,
      organizationName,
      role,
      organizationId,
      invitedBy,
    });
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
    // Don't fail the invitation creation if email fails
  }
  
  return {
    ...invitation,
    invitationToken: rawToken,
    invitationUrl, // Return URL for display/copy
  };
};
const getOrganizationInvitations = async (organizationId) => {
  const result = await pool.query(
    `
    SELECT
      i.id,
      i.email,
      i.role,
      i.status,
      i.expires_at,
      i.accepted_at,
      i.created_at,
      u.name AS invited_by_name
    FROM invitations i
    LEFT JOIN users u
      ON u.id = i.invited_by
    WHERE i.organization_id = $1
    ORDER BY i.created_at DESC
    `,
    [organizationId]
  );
  return result.rows;
};
const getOrganizationSettings = async (organizationId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      status,
      created_at,
      updated_at
    FROM organizations
    WHERE id = $1
    `,
    [organizationId]
  );
  if (result.rows.length === 0) {
    throw new Error("Organization not found");
  }
  return result.rows[0];
};
const updateOrganizationSettings = async (
  organizationId,
  name
) => {
  const result = await pool.query(
    `
    UPDATE organizations
    SET
      name = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      name,
      status,
      created_at,
      updated_at
    `,
    [name, organizationId]
  );
  if (result.rows.length === 0) {
    throw new Error("Organization not found");
  }
  return result.rows[0];
};
const getOrganizationProfile = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      organization_id,
      name,
      email,
      role,
      status,
      created_at,
      last_login_at
    FROM users
    WHERE id = $1
    `,
    [userId]
  );
  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  return result.rows[0];
};
const updateOrganizationProfile = async (
  userId,
  name
) => {
  const result = await pool.query(
    `
    UPDATE users
    SET
      name = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      organization_id,
      name,
      email,
      role,
      status,
      created_at,
      last_login_at
    `,
    [name, userId]
  );
  if (result.rows.length === 0) {
    throw new Error("User not found");
  }
  return result.rows[0];
};
module.exports = {
  getOrganizationDashboard,
  getOrganizationEmployees,
  createInvitation,
  getOrganizationInvitations,
  getOrganizationSettings,
  updateOrganizationSettings,
  getOrganizationProfile,
  updateOrganizationProfile,
};