const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
	createCourse,
	listMyCourses,
	getMyCourseDetail,
	getMyCourseInsights,
	updateQuizSessionScore,
	updateMyCourse,
	deleteMyCourse,
} = require('../controllers/teacherCourse.controller');

const router = express.Router();

router.post('/courses', authenticateToken, authorizeRoles('TEACHER'), createCourse);
router.get('/courses', authenticateToken, authorizeRoles('TEACHER'), listMyCourses);
router.get('/courses/:id', authenticateToken, authorizeRoles('TEACHER'), getMyCourseDetail);
router.get('/courses/:id/insights', authenticateToken, authorizeRoles('TEACHER'), getMyCourseInsights);
router.patch('/courses/:id/quiz-sessions/:sessionId/score', authenticateToken, authorizeRoles('TEACHER'), updateQuizSessionScore);
router.patch('/courses/:id', authenticateToken, authorizeRoles('TEACHER'), updateMyCourse);
router.delete('/courses/:id', authenticateToken, authorizeRoles('TEACHER'), deleteMyCourse);

module.exports = router;
