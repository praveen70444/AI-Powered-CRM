const helmet = require('helmet');
const { rateLimit, MemoryStore } = require('express-rate-limit');

/**
 * Helmet security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Rate limiter for general API requests
 * 500 req/15min is generous enough for any normal usage including dev
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  store: new MemoryStore(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a moment and try again.',
    });
  },
});

/**
 * Rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  store: new MemoryStore(),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 15 minutes and try again.',
    });
  },
});

/**
 * Rate limiter for password reset requests
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: new MemoryStore(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests, please try again later.',
    });
  },
});

/**
 * Rate limiter for file uploads
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  store: new MemoryStore(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many upload attempts, please try again later.',
    });
  },
});

/**
 * Rate limiter for AI endpoints (expensive OpenAI calls)
 * 60 per 15 minutes — generous enough for testing
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  store: new MemoryStore(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'AI request limit reached. Please wait a moment before generating again.',
    });
  },
});

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Basic XSS protection - remove script tags
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

/**
 * CORS configuration — allow all origins
 * To restrict later, replace '*' with specific domains
 */
const corsOptions = {
  origin: true,   // reflects the request origin — works for all domains
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  aiLimiter,
  sanitizeInput,
  corsOptions,
};
