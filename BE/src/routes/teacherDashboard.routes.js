const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  getAiUsageSummary,
  getAiUsageTrends,
  getHelpfulFeedbackSummary,
  getHelpfulFeedbackTrends,
  getDashboardOverview,
  getPopularQuestions,
  getLearningTrends,
  getAnswersNeedReview,
} = require('../controllers/teacherDashboard.controller');

const router = express.Router();

router.get('/dashboard/ai-usage-summary', authenticateToken, authorizeRoles('TEACHER'), getAiUsageSummary);
router.get('/dashboard/ai-usage-trends', authenticateToken, authorizeRoles('TEACHER'), getAiUsageTrends);
router.get('/dashboard/helpful-feedback-summary', authenticateToken, authorizeRoles('TEACHER'), getHelpfulFeedbackSummary);
router.get('/dashboard/helpful-feedback-trends', authenticateToken, authorizeRoles('TEACHER'), getHelpfulFeedbackTrends);
router.get('/dashboard/overview', authenticateToken, authorizeRoles('TEACHER'), getDashboardOverview);
router.get('/dashboard/popular-questions', authenticateToken, authorizeRoles('TEACHER'), getPopularQuestions);
router.get('/dashboard/learning-trends', authenticateToken, authorizeRoles('TEACHER'), getLearningTrends);
router.get('/dashboard/answers-need-review', authenticateToken, authorizeRoles('TEACHER'), getAnswersNeedReview);

module.exports = router;
