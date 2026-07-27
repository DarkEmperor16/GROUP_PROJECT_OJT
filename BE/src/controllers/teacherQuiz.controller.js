const mongoose = require('mongoose');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function mapQuizSummary(quiz) {
  return {
    id: quiz._id,
    title: quiz.title,
    courseId: quiz.courseId?._id || quiz.courseId,
    courseCode: quiz.courseId?.code,
    courseName: quiz.courseId?.name || quiz.courseId?.title,
    status: quiz.status,
    timeLimit: quiz.timeLimit,
    questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}

function mapQuizDetail(quiz) {
  return {
    id: quiz._id,
    title: quiz.title,
    courseId: quiz.courseId?._id || quiz.courseId,
    courseCode: quiz.courseId?.code,
    courseName: quiz.courseId?.name || quiz.courseId?.title,
    status: quiz.status,
    timeLimit: quiz.timeLimit,
    questions: Array.isArray(quiz.questions)
      ? quiz.questions.map((question) => ({
          id: question._id,
          text: question.text,
          options: Array.isArray(question.options) ? [...question.options] : [],
          correctAnswer: question.correctAnswer,
          explanation: question.explanation || '',
        }))
      : [],
    questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}

async function authorizeTeacherForCourse(courseId, teacherId) {
  if (!courseId) {
    return { error: { statusCode: 400, message: 'courseId is required' } };
  }

  if (!isValidObjectId(courseId)) {
    return { error: { statusCode: 400, message: 'Invalid courseId' } };
  }

  const course = await Course.findOne({
    _id: courseId,
    teacherIds: teacherId,
  });

  if (!course) {
    return { error: { statusCode: 404, message: 'Course not found or you are not assigned to this course' } };
  }

  return { course };
}

async function authorizeTeacherForQuiz(quizId, teacherId) {
  if (!isValidObjectId(quizId)) {
    return { error: { statusCode: 400, message: 'Invalid quizId' } };
  }

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    return { error: { statusCode: 404, message: 'Quiz not found' } };
  }

  const auth = await authorizeTeacherForCourse(quiz.courseId.toString(), teacherId);

  if (auth.error) {
    return { error: auth.error };
  }

  return { quiz, course: auth.course };
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'questions must be a non-empty array';
  }

  for (const question of questions) {
    const text = normalizeText(question?.text);

    if (!text) {
      return 'Each question must have text';
    }

    if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6) {
      return 'Each question must have 2 to 6 options';
    }

    const optionValues = question.options.map((option) => normalizeText(option));

    if (optionValues.some((option) => !option)) {
      return 'Question options cannot be empty';
    }

    if (!Number.isInteger(question.correctAnswer) || question.correctAnswer < 0 || question.correctAnswer >= optionValues.length) {
      return 'Each question must have a valid correctAnswer index';
    }
  }

  return null;
}

async function createQuiz(req, res) {
  const { courseId, title, timeLimit = 0, status = 'DRAFT', questions } = req.body;

  const normalizedTitle = normalizeText(title);

  if (!normalizedTitle) {
    return res.status(400).json({
      message: 'title is required',
    });
  }

  if (!['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
    return res.status(400).json({
      message: 'Invalid quiz status',
    });
  }

  if (!Number.isFinite(Number(timeLimit)) || Number(timeLimit) < 0) {
    return res.status(400).json({
      message: 'timeLimit must be a non-negative number',
    });
  }

  const questionsError = validateQuestions(questions);

  if (questionsError) {
    return res.status(400).json({
      message: questionsError,
    });
  }

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const normalizedQuestions = questions.map((question) => ({
    text: normalizeText(question.text),
    options: question.options.map((option) => normalizeText(option)),
    correctAnswer: question.correctAnswer,
    explanation: normalizeText(question.explanation),
  }));

  const quiz = await Quiz.create({
    title: normalizedTitle,
    courseId: auth.course._id,
    timeLimit: Number(timeLimit),
    status,
    questions: normalizedQuestions,
  });

  return res.status(201).json({
    message: 'Quiz created successfully',
    quiz: mapQuizSummary(quiz),
  });
}

async function listQuizzes(req, res) {
  const { courseId, status, keyword } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));

  const teacherCourses = await Course.find({ teacherIds: req.user._id }).select('_id').lean();
  const teacherCourseIds = teacherCourses.map((course) => course._id);

  if (teacherCourseIds.length === 0) {
    return res.json({
      filters: {
        courseId: courseId || null,
        status: status || null,
        keyword: keyword || null,
        page,
        limit,
      },
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 1,
      },
      quizzes: [],
    });
  }

  const filter = {
    courseId: { $in: teacherCourseIds },
  };

  if (courseId) {
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        message: 'Invalid courseId',
      });
    }

    const isOwnedCourse = teacherCourseIds.some((id) => id.toString() === courseId.toString());

    if (!isOwnedCourse) {
      return res.status(404).json({
        message: 'Course not found or you are not assigned to this course',
      });
    }

    filter.courseId = courseId;
  }

  if (status) {
    if (!['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid quiz status filter',
      });
    }

    filter.status = status;
  }

  if (keyword) {
    filter.title = { $regex: normalizeText(keyword), $options: 'i' };
  }

  const [total, quizzes] = await Promise.all([
    Quiz.countDocuments(filter),
    Quiz.find(filter)
      .populate('courseId', 'code name title')
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return res.json({
    filters: {
      courseId: courseId || null,
      status: status || null,
      keyword: keyword || null,
      page,
      limit,
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    quizzes: quizzes.map(mapQuizSummary),
  });
}

async function updateQuiz(req, res) {
  const { quizId } = req.params;
  const { title, timeLimit, status, questions } = req.body;

  const auth = await authorizeTeacherForQuiz(quizId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const quiz = auth.quiz;

  if (title !== undefined) {
    const normalizedTitle = normalizeText(title);

    if (!normalizedTitle) {
      return res.status(400).json({
        message: 'title cannot be empty',
      });
    }

    quiz.title = normalizedTitle;
  }

  if (timeLimit !== undefined) {
    if (!Number.isFinite(Number(timeLimit)) || Number(timeLimit) < 0) {
      return res.status(400).json({
        message: 'timeLimit must be a non-negative number',
      });
    }

    quiz.timeLimit = Number(timeLimit);
  }

  if (status !== undefined) {
    if (!['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid quiz status',
      });
    }

    quiz.status = status;
  }

  if (questions !== undefined) {
    const questionsError = validateQuestions(questions);

    if (questionsError) {
      return res.status(400).json({
        message: questionsError,
      });
    }

    quiz.questions = questions.map((question) => ({
      text: normalizeText(question.text),
      options: question.options.map((option) => normalizeText(option)),
      correctAnswer: question.correctAnswer,
      explanation: normalizeText(question.explanation),
    }));
  }

  await quiz.save();

  return res.json({
    message: 'Quiz updated successfully',
    quiz: mapQuizSummary(quiz),
  });
}

async function getQuizDetail(req, res) {
  const { quizId } = req.params;

  const auth = await authorizeTeacherForQuiz(quizId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const quiz = await Quiz.findById(auth.quiz._id).populate('courseId', 'code name title').lean();

  return res.json({
    quiz: mapQuizDetail(quiz),
  });
}

async function deleteQuiz(req, res) {
  const { quizId } = req.params;

  const auth = await authorizeTeacherForQuiz(quizId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  await Quiz.deleteOne({ _id: auth.quiz._id });

  return res.json({
    message: 'Quiz deleted successfully',
    deletedQuizId: quizId,
  });
}

module.exports = {
  listQuizzes,
  createQuiz,
  getQuizDetail,
  updateQuiz,
  deleteQuiz,
};
