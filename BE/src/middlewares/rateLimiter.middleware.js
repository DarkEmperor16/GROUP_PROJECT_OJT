const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Middleware for AI endpoints to prevent spam and resource exhaustion.
 * Limits to 30 requests per 15-minute window per IP.
 */
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 AI requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable legacy `X-RateLimit-*` headers
  message: {
    message: 'Too many AI requests from this user, please try again later after 15 minutes.',
  },
});

module.exports = {
  aiRateLimiter,
};
