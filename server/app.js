const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const logger = require("./services/loggerService");
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const fileRoutes = require("./routes/fileRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authenticate = require("./middleware/authMiddleware");
const {
  helmetConfig,
  generalLimiter,
  sanitizeInput,
  corsOptions,
} = require("./middleware/securityMiddleware");

const app = express();

// CORS — must be first, before all other middleware
app.use(cors(corsOptions));
app.options("/(.*)", cors(corsOptions)); // handle preflight for all routes

// Security middleware
app.use(helmetConfig);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeInput);

// Serve uploaded files statically
app.use("/api/files", express.static(path.join(__dirname, "uploads")));

// Rate limiting on all API routes
app.use("/api", generalLimiter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI-Powered CRM API is running"
  });
});




// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CRM API is running",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use("/api/auth", authRoutes);
app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});




// Password management (public endpoints)
app.use("/api/password", passwordRoutes);

// File upload / serve routes
app.use("/api/files", fileRoutes);

// Organization admin routes
app.use("/api/organization", organizationRoutes);

// Employee CRM routes
app.use("/api/employee", employeeRoutes);

// AI routes (employee-scoped)
app.use("/api/ai", aiRoutes);

// Global error handler
app.use((err, req, res, next) => {
  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size exceeds the 10MB limit.",
    });
  }
  if (err.message && err.message.startsWith("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode ? err.message : "Internal server error",
  });
});

module.exports = app;
