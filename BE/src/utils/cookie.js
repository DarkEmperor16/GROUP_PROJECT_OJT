// ── Cookie config cho Refresh Token ──────────────────────────
// httpOnly: true  → JavaScript không đọc được → chống XSS
// secure: true    → chỉ gửi qua HTTPS (chỉ bật ở production)
// sameSite: strict → chống CSRF
// path: '/api/auth' → cookie chỉ gửi đến auth endpoints
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (khớp với REFRESH_EXPIRES)
    path: '/api/auth',
};

function setRefreshCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res) {
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
}

function clearAccessTokenCookie(res) {
    res.clearCookie('accessToken', REFRESH_COOKIE_OPTIONS);
}

module.exports = {
    setRefreshCookie,
    clearRefreshCookie,
    clearAccessTokenCookie,
};
