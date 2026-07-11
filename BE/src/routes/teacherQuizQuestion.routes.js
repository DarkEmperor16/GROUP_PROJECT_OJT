const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  listQuizQuestions,
  getQuizQuestionDetail,
  reviewQuizQuestion,
} = require('../controllers/teacherQuizQuestion.controller');

const router = express.Router();

router.get('/quiz-questions', authenticateToken, authorizeRoles('TEACHER'), listQuizQuestions);
router.get('/quiz-questions/:questionId', authenticateToken, authorizeRoles('TEACHER'), getQuizQuestionDetail);
router.patch('/quiz-questions/:questionId/review', authenticateToken, authorizeRoles('TEACHER'), reviewQuizQuestion);

module.exports = router;