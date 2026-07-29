const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { askTeacherAi } = require('../controllers/teacherAiChat.controller');
const { aiRateLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

router.post('/ai-chat', authenticateToken, authorizeRoles('TEACHER'), aiRateLimiter, askTeacherAi);

module.exports = router;
