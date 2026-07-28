const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherMfa,
  changeTeacherPassword,
  getTeacherAiStatus,
} = require('../controllers/teacherProfile.controller');

const router = express.Router();

router.get('/profile', authenticateToken, authorizeRoles('TEACHER'), getTeacherProfile);
router.put('/profile', authenticateToken, authorizeRoles('TEACHER'), updateTeacherProfile);
router.patch('/mfa', authenticateToken, authorizeRoles('TEACHER'), updateTeacherMfa);
router.post('/change-password', authenticateToken, authorizeRoles('TEACHER'), changeTeacherPassword);
router.get('/ai-status', authenticateToken, authorizeRoles('TEACHER'), getTeacherAiStatus);

module.exports = router;
