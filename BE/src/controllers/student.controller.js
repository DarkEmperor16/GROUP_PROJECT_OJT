const mongoose = require('mongoose');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QaHistory = require('../models/QaHistory');
const Enrollment = require('../models/Enrollment');
const QuizSession = require('../models/QuizSession');
const { paginate } = require('../utils/paginate');
const { sendQuestionToAI } = require('../utils/aiService');
const { containsXss } = require('../middlewares/xssProtection.middleware');

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

    // Only return courses the authenticated student is actively enrolled in.
    // This prevents students from seeing all active courses that they are
    // not assigned to by an admin.
    const enrollments = await Enrollment.find(
      { studentId: req.user._id, status: 'ACTIVE' },
      { courseId: 1, _id: 0 },
    ).lean();

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    if (!enrolledCourseIds || enrolledCourseIds.length === 0) {
      return res.json({
        data: [],
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 0,
      });
    }

    const result = await paginate(
      Course,
      { _id: { $in: enrolledCourseIds }, status: 'ACTIVE' },
      {
        page,
        limit,
        sort: { title: 1 },
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
        questionId: q._id,
        isCorrect,
        selectedAnswer: answers[i],
        correctAnswer: q.correctAnswer, // now safe to reveal
        explanation: q.explanation,
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    await QuizSession.create({
      quizId: quiz._id,
      courseId: quiz.courseId,
      studentId: req.user._id,
      status: 'COMPLETED',
      score,
      totalQuestions,
      percentage,
      startedAt: new Date(),
      completedAt: new Date(),
    });

    return res.json({
      quizId,
      score,
      total: totalQuestions,
      percentage,
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

    if (
      !courseId ||
      typeof courseId !== 'string' ||
      !question ||
      typeof question !== 'string' ||
      !question.trim()
    ) {
      return res
        .status(400)
        .json({
          message: '`courseId` (or course code) and a non-empty `question` string are required',
        });
    }

    const MAX_QUESTION_LEN = 2000;
    if (question.trim().length > MAX_QUESTION_LEN) {
      return res
        .status(400)
        .json({
          message: `Question exceeds maximum allowed length of ${MAX_QUESTION_LEN} characters`,
        });
    }

    // Defense-in-depth: explicitly reject XSS payloads in the question field.
    // The global xssProtection middleware already blocks these, but this guard
    // ensures the endpoint remains safe even if middleware ordering changes.
    if (containsXss(question)) {
      return res.status(400).json({
        message: 'Question contains invalid characters or script content.',
        code: 'XSS_DETECTED',
      });
    }

    // Kiểm tra xem đầu vào là ObjectId hợp lệ hay là mã courseCode (ví dụ: prf-192)
    const isObjectId = mongoose.Types.ObjectId.isValid(courseId);
    const query = { status: 'ACTIVE' };

    if (isObjectId) {
      query._id = courseId;
    } else {
      // Strips non-alphanumeric chars to prevent Regex/ReDoS injection (e.g. prf-192 -> prf192)
      const sanitizedCode = courseId.replace(/[^a-zA-Z0-9]/g, '');
      if (!sanitizedCode) {
        return res.status(400).json({ message: 'Invalid `courseId` format' });
      }
      query.code = new RegExp(`^${sanitizedCode}$`, 'i'); // Tìm kiếm không phân biệt hoa thường
    }

    const course = await Course.findOne(query);
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

/**
 * GET /api/student/questions
 * Returns a paginated list of quiz questions scoped to courses the
 * authenticated student is actively enrolled in.
 *
 * SECURITY: Only questions from enrolled courses are returned.
 *           `correctAnswer` and `explanation` are NEVER included.
 *
 * Query params:
 *   page     {number} default 1
 *   limit    {number} default 10  (max 100)
 *   courseId {string} optional — further filter to a single enrolled course
 *   keyword  {string} optional — case-insensitive substring match on question.text
 *
 * Response:
 *   {
 *     data: [{ _id, text, options, quizId, quizTitle, courseId, courseCode, courseTitle }],
 *     page, limit, total, totalPages
 *   }
 */
async function getQuestions(req, res) {
  try {
    const { page = 1, limit = 10, courseId, keyword } = req.query;

    // ── 1. Validate optional courseId ──────────────────────────
    if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid courseId' });
    }

    // ── 2. Pagination bounds ───────────────────────────────────
    const safePage = Math.max(1, parseInt(page, 10));
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10)), 100);
    const skip = (safePage - 1) * safeLimit;

    // ── 3. Resolve enrolled course IDs for this student ───────
    //    This is the mandatory enrollment gate — students can only see
    //    questions from courses they are actively enrolled in.
    const enrollments = await Enrollment.find(
      { studentId: req.user._id, status: 'ACTIVE' },
      { courseId: 1, _id: 0 },
    ).lean();

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    if (enrolledCourseIds.length === 0) {
      // Student has no active enrollments — return an empty result immediately.
      return res.json({ data: [], page: safePage, limit: safeLimit, total: 0, totalPages: 0 });
    }

    // ── 4. Build the aggregation pipeline ─────────────────────
    const matchQuiz = {
      status: 'ACTIVE',
      courseId: { $in: enrolledCourseIds },
    };

    // If a specific courseId was requested, verify it is among the enrolled ones.
    if (courseId) {
      const requestedId = new mongoose.Types.ObjectId(courseId);
      const isEnrolled = enrolledCourseIds.some((id) => id.equals(requestedId));
      if (!isEnrolled) {
        return res.status(403).json({ message: 'You are not enrolled in this course' });
      }
      matchQuiz.courseId = requestedId;
    }

    const pipeline = [
      // Filter to ACTIVE quizzes within enrolled (or requested) courses
      { $match: matchQuiz },

      // Join Course to get code + title for the response
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },

      // Unwind embedded questions into individual pipeline documents
      { $unwind: '$questions' },
    ];

    // Optional keyword filter on question.text (case-insensitive)
    if (keyword && keyword.trim()) {
      pipeline.push({
        $match: {
          'questions.text': {
            $regex: keyword.trim(),
            $options: 'i',
          },
        },
      });
    }

    // Project safe response shape — correctAnswer and explanation are EXCLUDED
    pipeline.push({
      $project: {
        _id: '$questions._id',
        text: '$questions.text',
        options: '$questions.options',
        quizId: '$_id',
        quizTitle: '$title',
        courseId: 1,
        courseCode: { $arrayElemAt: ['$course.code', 0] },
        courseTitle: { $arrayElemAt: ['$course.title', 0] },
      },
    });

    // Single round-trip: paginated data + total count via $facet
    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: safeLimit }],
        total: [{ $count: 'count' }],
      },
    });

    // ── 5. Execute ─────────────────────────────────────────────
    const [facetResult] = await Quiz.aggregate(pipeline);

    const data = facetResult?.data ?? [];
    const total = facetResult?.total?.[0]?.count ?? 0;
    const totalPages = Math.ceil(total / safeLimit);

    return res.json({ data, page: safePage, limit: safeLimit, total, totalPages });
  } catch (error) {
    console.error('[getQuestions]', error);
    return res.status(500).json({ message: 'Failed to fetch questions' });
  }
}

module.exports = {
  getCourses,
  getQuizzes,
  getQuizById,
  submitQuiz,
  getHistory,
  askAi,
  getQuestions,
};
