const mongoose = require('mongoose');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QaHistory = require('../models/QaHistory');
const { paginate } = require('../utils/paginate');
const { sendQuestionToAI } = require('../utils/aiService');

// ── Helpers ───────────────────────────────────────────────────

/** Validates a string as a Mongoose ObjectId and returns a 400 if invalid. */
function requireValidObjectId(res, id, label = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: `Invalid ${label}` });
    return false;
  }
  return true;
}

// ── Controllers ───────────────────────────────────────────────

/**
 * GET /api/student/courses
 * Lists all ACTIVE courses available to the student.
 *
 * Query params:
 *   page  {number} default 1
 *   limit {number} default 10
 *
 * Response: { data, page, limit, total, totalPages }
 */
async function getCourses(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await paginate(
      Course,
      { status: 'ACTIVE' },
      {
        page,
        limit,
        sort: { title: 1 }, // alphabetical — easier to scan for students
        populate: { path: 'teacherId', select: 'fullName email' },
      },
    );

    return res.json(result);
  } catch (error) {
    console.error('[getCourses]', error);
    return res.status(500).json({ message: 'Failed to fetch courses' });
  }
}

/**
 * GET /api/student/quizzes
 * Lists ACTIVE quizzes. Optionally filtered by courseId.
 *
 * Query params:
 *   page     {number} default 1
 *   limit    {number} default 10
 *   courseId {string} optional — filter by course
 *
 * Response: paginated list with questionCount (full questions array is stripped).
 */
async function getQuizzes(req, res) {
  try {
    const { page = 1, limit = 10, courseId } = req.query;

    const filter = { status: 'ACTIVE' };

    if (courseId) {
      if (!requireValidObjectId(res, courseId, 'courseId')) return;
      filter.courseId = courseId;
    }

    const result = await paginate(Quiz, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'courseId', select: 'title code' },
    });

    // Strip the full questions array from list view; surface questionCount instead.
    // (paginate uses .lean(), so result.data is plain objects — safe to destructure.)
    result.data = result.data.map(({ questions, ...rest }) => ({
      ...rest,
      questionCount: Array.isArray(questions) ? questions.length : 0,
    }));

    return res.json(result);
  } catch (error) {
    console.error('[getQuizzes]', error);
    return res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
}

/**
 * GET /api/student/quizzes/:quizId
 * Returns a single ACTIVE quiz with its questions.
 *
 * SECURITY: correctAnswer + explanation are removed via Quiz.toStudentView().
 *           They are only revealed in the submit response.
 */
async function getQuizById(req, res) {
  try {
    const { quizId } = req.params;

    if (!requireValidObjectId(res, quizId, 'quiz ID')) return;

    const quiz = await Quiz.findOne({ _id: quizId, status: 'ACTIVE' }).populate(
      'courseId',
      'title code description',
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // toStudentView() strips correctAnswer + explanation from every question
    return res.json(quiz.toStudentView());
  } catch (error) {
    console.error('[getQuizById]', error);
    return res.status(500).json({ message: 'Failed to fetch quiz' });
  }
}

/**
 * POST /api/student/quizzes/:quizId/submit
 * Grades the student's answers server-side and returns detailed results.
 *
 * Request body:
 *   { answers: number[] }  — 0-based option index per question, in order
 *
 * Response:
 *   { quizId, score, total, percentage, results: [{ questionId, isCorrect,
 *     selectedAnswer, correctAnswer, explanation }] }
 */
async function submitQuiz(req, res) {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    if (!requireValidObjectId(res, quizId, 'quiz ID')) return;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: '`answers` must be an array of numbers' });
    }

    const quiz = await Quiz.findOne({ _id: quizId, status: 'ACTIVE' });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        message: `Expected ${quiz.questions.length} answer(s), received ${answers.length}`,
      });
    }

    // Validate all answers are non-negative integers
    const invalidAnswer = answers.find(
      (a) => typeof a !== 'number' || !Number.isInteger(a) || a < 0,
    );
    if (invalidAnswer !== undefined) {
      return res.status(400).json({ message: 'Each answer must be a non-negative integer' });
    }

    // ── Grade server-side ──────────────────────────────────────
    let score = 0;
    const results = quiz.questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctAnswer;
      if (isCorrect) score++;
      return {
        questionId:     q._id,
        isCorrect,
        selectedAnswer: answers[i],
        correctAnswer:  q.correctAnswer,  // now safe to reveal
        explanation:    q.explanation,
      };
    });

    return res.json({
      quizId,
      score,
      total:      quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100),
      results,
    });
  } catch (error) {
    console.error('[submitQuiz]', error);
    return res.status(500).json({ message: 'Failed to submit quiz' });
  }
}

/**
 * GET /api/student/history
 * Returns the authenticated student's paginated Q&A history, newest first.
 *
 * Query params:
 *   page     {number} default 1
 *   limit    {number} default 10
 *   courseId {string} optional — filter by course
 */
async function getHistory(req, res) {
  try {
    const { page = 1, limit = 10, courseId } = req.query;

    // Always scope to the authenticated student — never expose other students' history
    const filter = { studentId: req.user._id };

    if (courseId) {
      if (!requireValidObjectId(res, courseId, 'courseId')) return;
      filter.courseId = courseId;
    }

    const result = await paginate(QaHistory, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'courseId', select: 'title code' },
    });

    return res.json(result);
  } catch (error) {
    console.error('[getHistory]', error);
    return res.status(500).json({ message: 'Failed to fetch history' });
  }
}

/**
 * POST /api/student/ask-ai
 * Proxies a question to the AI/RAG service and saves the Q&A pair to history.
 *
 * Request body:
 *   { courseId: string, question: string }
 *
 * Response:
 *   { answer, historyId, courseId, question, createdAt }
 */
async function askAi(req, res) {
  try {
    const { courseId, question } = req.body;

    if (!courseId || !question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ message: '`courseId` and a non-empty `question` string are required' });
    }

    if (!requireValidObjectId(res, courseId, 'courseId')) return;

    const course = await Course.findOne({ _id: courseId, status: 'ACTIVE' });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or inactive' });
    }

    // 1. Get AI response from connector/pipeline
    const answer = await sendQuestionToAI({
      question: question.trim(),
      courseCode: course.code,
      courseTitle: course.title,
    });

    // 2. Persist to QaHistory
    const historyRecord = await QaHistory.create({
      studentId: req.user._id,
      courseId: course._id,
      question: question.trim(),
      answer,
    });

    return res.status(201).json({
      answer,
      historyId: historyRecord._id,
      courseId: course._id,
      question: historyRecord.question,
      createdAt: historyRecord.createdAt,
    });
  } catch (error) {
    console.error('[askAi]', error);
    return res.status(500).json({ message: 'Failed to process AI question' });
  }
}

module.exports = {
  getCourses,
  getQuizzes,
  getQuizById,
  submitQuiz,
  getHistory,
  askAi,
};
