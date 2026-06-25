const bcrypt = require('bcrypt');
const User = require('../models/User');
const { addActivityLog } = require('../data/activityLogs');
const { generateTokenPair, verifyRefreshToken } = require('../utils/token');
const { setRefreshCookie, clearRefreshCookie, clearAccessTokenCookie } = require('../utils/cookie');

// ── Helpers (private) ────────────────────────────────────────

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Format user cho response — 1 chỗ duy nhất, không lặp lại */
function buildUserResponse(user) {
    return {
        id: user._id?.toString?.() || user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
    };
}

/** Tìm user theo email (case-insensitive) */
function findUserByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
}

/** Ghi activity log — gom lại để tránh lặp 5+ lần */
function logActivity(userId, action, result, ipAddress) {
    addActivityLog({ userId, action, result, ipAddress });
}

/**
 * Tạo token pair + set cookie + trả response.
 * Dùng chung cho login, register, refreshToken — xoá duplication.
 *
 * Backward compatible: vẫn trả field "token" (= accessToken)
 * để client cũ đọc data.token vẫn hoạt động.
 */
function sendTokenResponse(res, user, statusCode = 200, message = 'Success') {
    const payload = { userId: user._id?.toString?.() || user.id, role: user.role };
    const { accessToken, refreshToken } = generateTokenPair(payload);

    // Refresh token → httpOnly cookie (JS không đọc được)
    setRefreshCookie(res, refreshToken);

    return res.status(statusCode).json({
        message,
        accessToken,
        refreshToken, // vẫn trả trong body để test với Postman/Bruno
        token: accessToken, // backward compatible
        user: buildUserResponse(user),
    });
}

// ── Controllers ──────────────────────────────────────────────

async function register(req, res) {
    const { fullName, email, password } = req.body;
    const ipAddress = req.ip;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            message: 'Full name, email and password are required',
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: 'Invalid email format',
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: 'Password must be at least 6 characters',
        });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        return res.status(409).json({
            message: 'Email already exists',
        });
    }

    const newUser = await User.create({
        fullName,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'STUDENT',
        status: 'ACTIVE',
    });

    logActivity(newUser._id.toString(), 'REGISTER_SUCCESS', 'SUCCESS', ipAddress);

    return sendTokenResponse(res, newUser, 201, 'Register successful');
}

async function login(req, res) {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    // ── Validate input ──
    if (!email || !password) {
        logActivity(null, 'LOGIN_FAILED', 'FAILED', ipAddress);
        return res.status(400).json({
            message: 'Email and password are required',
        });
    }

    // ── Find user ──
    const user = await findUserByEmail(email);

    if (!user) {
        logActivity(null, 'LOGIN_FAILED', 'FAILED', ipAddress);
        return res.status(401).json({
            message: 'Invalid email or password',
        });
    }

    // ── Check account status ──
    if (user.status !== 'ACTIVE') {
        logActivity(user._id.toString(), 'LOGIN_FAILED', 'FAILED', ipAddress);
        return res.status(403).json({
            message: 'Account is inactive',
        });
    }

    // ── Verify password ──
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        logActivity(user._id.toString(), 'LOGIN_FAILED', 'FAILED', ipAddress);
        return res.status(401).json({
            message: 'Invalid email or password',
        });
    }

    // ── Success: trả Access Token + Refresh Token ──
    logActivity(user._id.toString(), 'LOGIN_SUCCESS', 'SUCCESS', ipAddress);

    return sendTokenResponse(res, user, 200, 'Login successful');
}

async function refreshToken(req, res) {
    // Refresh token đến từ httpOnly cookie (browser tự gửi)
    // HOẶC từ body (cho Postman/Bruno testing)
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
        return res.status(401).json({
            message: 'Refresh token is required',
        });
    }

    try {
        const payload = verifyRefreshToken(token);
        const user = await User.findById(payload.userId);

        if (!user) {
            return res.status(401).json({
                message: 'User not found',
            });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                message: 'Account is inactive',
            });
        }

        logActivity(user._id.toString(), 'TOKEN_REFRESH', 'SUCCESS', req.ip);

        // Token rotation: cấp cặp token mới hoàn toàn
        return sendTokenResponse(res, user, 200, 'Token refreshed');
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired refresh token',
        });
    }
}

function me(req, res) {
    return res.json({
        user: buildUserResponse(req.user),
    });
}

function logout(req, res) {
    logActivity(req.user?._id?.toString?.() || req.user?.id, 'LOGOUT', 'SUCCESS', req.ip);

    // Xoá refresh token cookie
    clearRefreshCookie(res);


    return res.json({
        message: 'Logout successful',
    });
}

module.exports = {
    register,
    login,
    refreshToken,
    me,
    logout,
};
