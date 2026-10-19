const rateLimit = require('express-rate-limit');

// Strict rate limit on auth endpoints (login, register, forgot-password, reset-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 25 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errors: ['Rate limit exceeded']
  },
  skip: (req) => process.env.NODE_ENV === 'test' // Skip during tests
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: ['Rate limit exceeded']
  },
  skip: (req) => process.env.NODE_ENV === 'test'
});

module.exports = { authLimiter, apiLimiter };
