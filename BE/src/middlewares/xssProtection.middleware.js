/**
 * XSS Protection Middleware
 *
 * Scans all string values in the request body for common XSS attack patterns.
 * If a dangerous pattern is detected, the request is rejected with 400 Bad Request
 * before it reaches any controller or database layer.
 *
 * Strategy: detect-and-reject (NOT sanitize-and-store).
 * Storing even "safe" copies of XSS payloads pollutes the DB and may leak in
 * contexts where the sanitizer is absent (exports, logs, internal tools, etc.).
 */

/**
 * Patterns that indicate an XSS attempt.
 * Covers the most common injection vectors:
 *   - <script> tags (inline JS execution)
 *   - javascript: URI scheme (href / src injection)
 *   - on* event handler attributes (onerror, onload, onclick, …)
 *   - <iframe>, <embed>, <object> (external content injection)
 *   - <svg> with event handlers (SVG-based XSS)
 *   - data: URI with script content
 */
const XSS_PATTERNS = [
  /<script[\s\S]*?>/i,           // <script>, <script type="text/javascript">, etc.
  /<\/script>/i,                  // closing </script>
  /javascript\s*:/i,              // javascript: URI scheme
  /on\w+\s*=\s*["']?[^"'>\s]/i, // onerror=, onload=, onclick=, etc.
  /<iframe[\s\S]*?>/i,            // <iframe src="...">
  /<embed[\s\S]*?>/i,             // <embed src="...">
  /<object[\s\S]*?>/i,            // <object data="...">
  /<svg[\s\S]*?on\w+\s*=/i,      // <svg onload="...">
  /data\s*:\s*text\/html/i,       // data:text/html URI
  /vbscript\s*:/i,                // vbscript: URI scheme (IE legacy)
  /expression\s*\(/i,             // CSS expression() injection
];

/**
 * Recursively checks all string values in an object for XSS patterns.
 *
 * @param {*} value   - The value to inspect (any type).
 * @returns {boolean} - true if a dangerous pattern is found.
 */
function containsXss(value) {
  if (typeof value === 'string') {
    return XSS_PATTERNS.some((pattern) => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsXss(item));
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).some((v) => containsXss(v));
  }

  return false;
}

/**
 * Express middleware that rejects requests whose body contains XSS payloads.
 * Only inspects `req.body` (parsed JSON / form data); query params and headers
 * are intentionally excluded because they are never persisted to the database
 * by this application.
 *
 * Usage in server.js (apply globally after express.json()):
 *   const { xssProtection } = require('./src/middlewares/xssProtection.middleware');
 *   app.use(xssProtection);
 */
function xssProtection(req, res, next) {
  if (req.body && typeof req.body === 'object' && containsXss(req.body)) {
    console.warn(
      `[XSS Blocked] ${req.method} ${req.originalUrl} — userId: ${req.user?.id ?? 'unauthenticated'} — IP: ${req.ip}`,
    );

    return res.status(400).json({
      message: 'Request contains invalid characters or script content.',
      code: 'XSS_DETECTED',
    });
  }

  return next();
}

module.exports = { xssProtection, containsXss };
