const express = require('express');
const { login, me, logout } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticateToken, me);
router.post('/logout', authenticateToken, logout);

module.exports = router;

/*
File này tạo 3 API:
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
Trong đó:
/login không cần token vì user chưa đăng nhập
/me cần token vì phải biết user là ai
/logout cần token vì phải biết ai đang logout
*/