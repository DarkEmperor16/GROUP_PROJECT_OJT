const express = require('express');
const { proxyToAi } = require('../controllers/ai.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Sử dụng middleware authenticateToken để đảm bảo chỉ user đã đăng nhập mới được gọi AI
// Trong Express 5, router.use không cần path sẽ bắt tất cả các sub-path và method
router.use(authenticateToken, proxyToAi);

module.exports = router;
