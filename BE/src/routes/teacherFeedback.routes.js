const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  getFeedbackSummary,
  getLowRatedAnswers,
  updateAnswerReviewStatus,
} = require('../controllers/teacherFeedback.controller');

const router = express.Router();

router.get('/courses/:courseId/feedback/summary', authenticateToken, authorizeRoles('TEACHER'), getFeedbackSummary);
router.get('/courses/:courseId/answers/low-rated', authenticateToken, authorizeRoles('TEACHER'), getLowRatedAnswers);
router.patch('/answers/:answerId/review-status', authenticateToken, authorizeRoles('TEACHER'), updateAnswerReviewStatus);

module.exports = router;
