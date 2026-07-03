const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  getDashboardOverview,
  getPopularQuestions,
  getLearningTrends,
  getAnswersNeedReview,
} = require('../controllers/teacherDashboard.controller');

const router = express.Router();

router.get('/dashboard/overview', authenticateToken, authorizeRoles('TEACHER'), getDashboardOverview);
router.get('/dashboard/popular-questions', authenticateToken, authorizeRoles('TEACHER'), getPopularQuestions);
router.get('/dashboard/learning-trends', authenticateToken, authorizeRoles('TEACHER'), getLearningTrends);
router.get('/dashboard/answers-need-review', authenticateToken, authorizeRoles('TEACHER'), getAnswersNeedReview);

module.exports = router;
