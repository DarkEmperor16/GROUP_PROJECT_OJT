const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  getHistoryList,
  getHistoryDetail,
  getPopularQuestions,
} = require('../controllers/teacherHistory.controller');

const router = express.Router();

router.get('/history/qa', authenticateToken, authorizeRoles('TEACHER'), getHistoryList);
router.get('/history/qa/popular', authenticateToken, authorizeRoles('TEACHER'), getPopularQuestions);
router.get('/history/qa/:qaRecordId', authenticateToken, authorizeRoles('TEACHER'), getHistoryDetail);

module.exports = router;
