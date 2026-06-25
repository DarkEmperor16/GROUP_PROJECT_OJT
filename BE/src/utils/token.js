const jwt = require('jsonwebtoken');

// ── Secrets & Durations ──────────────────────────────────────
// Tập trung ở 1 file duy nhất, không khai báo lại ở controller/middleware.
const ACCESS_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key';
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// ── Generate ─────────────────────────────────────────────────
function generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

/**
 * Tạo cả 2 token cùng lúc.
 * @param {{ userId: number, role: string }} payload
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokenPair(payload) {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
}

// ── Verify ───────────────────────────────────────────────────
function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
};
