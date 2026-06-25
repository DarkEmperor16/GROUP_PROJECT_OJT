const express = require('express');
const { register, login, refreshToken, me, logout } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);    // NEW: lấy AT mới bằng RT
router.get('/me', authenticateToken, me);
router.post('/logout', authenticateToken, logout);

module.exports = router;
