const User = require('../models/User');
const { verifyAccessToken } = require('../utils/token');

// ── Extract Bearer token từ header ──
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

// ── Middleware: yêu cầu đăng nhập (verify Access Token) ──
async function authenticateToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      message: 'Authentication token is required',
    });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid authentication token',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        message: 'Account is inactive',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired authentication token',
    });
  }
}

// ── Middleware: giới hạn theo role ──
function authorizeRoles(...allowedRoles) {
  return function checkRole(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication is required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource',
      });
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
