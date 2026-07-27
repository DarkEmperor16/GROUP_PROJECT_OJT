const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
	listQuizzes,
	createQuiz,
	getQuizDetail,
	updateQuiz,
	deleteQuiz,
} = require('../controllers/teacherQuiz.controller');

const router = express.Router();

router.get('/quizzes', authenticateToken, authorizeRoles('TEACHER'), listQuizzes);
router.post('/quizzes', authenticateToken, authorizeRoles('TEACHER'), createQuiz);
router.get('/quizzes/:quizId', authenticateToken, authorizeRoles('TEACHER'), getQuizDetail);
router.patch('/quizzes/:quizId', authenticateToken, authorizeRoles('TEACHER'), updateQuiz);
router.delete('/quizzes/:quizId', authenticateToken, authorizeRoles('TEACHER'), deleteQuiz);

module.exports = router;
