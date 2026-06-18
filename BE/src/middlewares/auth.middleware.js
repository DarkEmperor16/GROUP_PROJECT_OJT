const jwt = require('jsonwebtoken');
const users = require('../data/users');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Authentication token is required',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = users.find((item) => item.id === payload.userId);

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