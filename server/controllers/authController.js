const authService = require("../services/authService");
const registerOrganization = async (req, res) => {
  try {
    const {
      organizationName,
      adminName,
      email,
      password,
    } = req.body;
    if (!organizationName || !adminName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    const result = await authService.registerOrganization({
      organizationName: organizationName.trim(),
      adminName: adminName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    return res.status(201).json({
      success: true,
      message: "Organization registered successfully",
      data: result,
    });
  } catch (error) {
    console.error("Organization registration error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error",
    });
  }
};
const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const result = await authService.loginUser({
      email: email.trim().toLowerCase(),
      password,
      ipAddress,
      userAgent,
    });
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error",
    });
  }
};
const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }
    const invitation = await authService.getInvitationByToken(token);
    return res.status(200).json({
      success: true,
      message: "Invitation found",
      data: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization_name,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Get invitation error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error",
    });
  }
};
const acceptInvitation = async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required",
      });
    }
    const result = await authService.acceptInvitation({
      token,
      name,
      password,
    });
    return res.status(201).json({
      success: true,
      message: "Invitation accepted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Internal server error",
    });
  }
};
module.exports = {
  registerOrganization,
  loginUser,
  getInvitationByToken,
  acceptInvitation,
};
