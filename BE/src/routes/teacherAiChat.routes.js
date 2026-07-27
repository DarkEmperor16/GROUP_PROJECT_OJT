const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { askTeacherAi } = require('../controllers/teacherAiChat.controller');

const router = express.Router();

router.post('/ai-chat', authenticateToken, authorizeRoles('TEACHER'), askTeacherAi);

module.exports = router;
