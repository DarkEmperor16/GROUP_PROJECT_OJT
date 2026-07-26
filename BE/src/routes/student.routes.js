const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  getCourses,
  getQuizzes,
  getQuizById,
  submitQuiz,
  getHistory,
  askAi,
  getQuestions,
} = require('../controllers/student.controller');

const router = express.Router();

// All student routes require a valid JWT and the STUDENT role.
router.use(authenticateToken);
router.use(authorizeRoles('STUDENT'));

// ── Courses ───────────────────────────────────────────────────
// GET /api/student/courses?page=1&limit=10
router.get('/courses', getCourses);

// ── Quizzes ───────────────────────────────────────────────────
// GET /api/student/quizzes?page=1&limit=10&courseId=<id>
router.get('/quizzes', getQuizzes);

// GET /api/student/quizzes/:quizId
router.get('/quizzes/:quizId', getQuizById);

// POST /api/student/quizzes/:quizId/submit
// Body: { "answers": [0, 2, 1, ...] }
router.post('/quizzes/:quizId/submit', submitQuiz);

// ── Questions ─────────────────────────────────────────────────
// GET /api/student/questions?page=1&limit=10&courseId=<id>&keyword=<text>
// Only returns questions from courses the student is enrolled in.
router.get('/questions', getQuestions);

// ── Q&A History ───────────────────────────────────────────────
// GET /api/student/history?page=1&limit=10&courseId=<id>
router.get('/history', getHistory);

// ── AI Chat Proxy ─────────────────────────────────────────────
// POST /api/student/ask-ai
// Body: { "courseId": "<id>", "question": "..." }
router.post('/ask-ai', askAi);

module.exports = router;
