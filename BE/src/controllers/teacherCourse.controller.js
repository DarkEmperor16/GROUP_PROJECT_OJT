const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseDocument = require('../models/CourseDocument');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizSession = require('../models/QuizSession');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function mapCourse(course) {
  return {
    id: course._id,
    name: course.name,
    title: course.title,
    code: course.code,
    description: course.description || '',
    status: course.status,
    teacherIds: course.teacherIds,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeCode(value) {
  return normalizeText(value).toUpperCase();
}

async function createCourse(req, res) {
  const name = normalizeText(req.body.name || req.body.title);
  const code = normalizeCode(req.body.code);
  const description = normalizeText(req.body.description);

  if (!name) {
    return res.status(400).json({
      message: 'name is required',
    });
  }

  if (!code) {
    return res.status(400).json({
      message: 'code is required',
    });
  }

  const existingCourse = await Course.findOne({ code });

  if (existingCourse) {
    return res.status(409).json({
      message: 'Course code already exists',
    });
  }

  const course = await Course.create({
    name,
    title: name,
    code,
    description,
    teacherId: req.user._id,
    teacherIds: [req.user._id],
    status: 'ACTIVE',
  });

  return res.status(201).json({
    message: 'Course created successfully',
    course: mapCourse(course),
  });
}

async function listMyCourses(req, res) {
  const status = req.query.status;
  const keyword = normalizeText(req.query.keyword);
  const page = Number.parseInt(req.query.page || '', 10);
  const limit = Number.parseInt(req.query.limit || '', 10);
  const sortBy = normalizeText(req.query.sortBy);
  const sortOrder = normalizeText(req.query.sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  const query = {
    teacherIds: req.user._id,
  };

  if (status) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status filter',
      });
    }

    query.status = status;
  }

  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { title: { $regex: keyword, $options: 'i' } },
      { code: { $regex: keyword, $options: 'i' } },
    ];
  }

  const sortField = ['name', 'code', 'createdAt', 'updatedAt'].includes(sortBy) ? sortBy : 'updatedAt';
  const sort = {
    [sortField]: sortOrder,
    _id: -1,
  };

  const hasPagination = Number.isInteger(page) && Number.isInteger(limit);

  if (hasPagination) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(10, Math.max(1, limit));

    const [total, courses] = await Promise.all([
      Course.countDocuments(query),
      Course.find(query)
        .sort(sort)
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
    ]);

    return res.json({
      courses: courses.map(mapCourse),
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    });
  }

  const courses = await Course.find(query).sort(sort).lean();

  return res.json({
    courses: courses.map(mapCourse),
  });
}

async function getMyCourseDetail(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid course id',
    });
  }

  const course = await Course.findOne({
    _id: id,
    teacherIds: req.user._id,
  }).lean();

  if (!course) {
    return res.status(404).json({
      message: 'Course not found or you are not assigned to this course',
    });
  }

  return res.json({
    course: mapCourse(course),
  });
}

async function getMyCourseInsights(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid course id',
    });
  }

  const course = await Course.findOne({
    _id: id,
    teacherIds: req.user._id,
  }).lean();

  if (!course) {
    return res.status(404).json({
      message: 'Course not found or you are not assigned to this course',
    });
  }

  const [enrollments, quizzes, documents, quizSessions] = await Promise.all([
    Enrollment.find({ courseId: id, status: 'ACTIVE' }).sort({ createdAt: -1 }).lean(),
    Quiz.find({ courseId: id }).sort({ updatedAt: -1, _id: -1 }).lean(),
    CourseDocument.find({ courseId: id }).sort({ createdAt: -1 }).lean(),
    QuizSession.find({ courseId: id }).sort({ startedAt: -1, _id: -1 }).limit(100).lean(),
  ]);

  const studentIds = [...new Set(enrollments.map((item) => item.studentId.toString()))];
  const students = studentIds.length
    ? await User.find({ _id: { $in: studentIds } }).select('_id fullName email status').lean()
    : [];
  const studentsById = new Map(students.map((student) => [student._id.toString(), student]));
  const quizzesById = new Map(quizzes.map((quiz) => [quiz._id.toString(), quiz]));

  return res.json({
    course: mapCourse(course),
    summary: {
      studentCount: studentIds.length,
      quizCount: quizzes.length,
      documentCount: documents.length,
      quizSessionCount: quizSessions.length,
    },
    students: enrollments
      .map((enrollment) => {
        const student = studentsById.get(enrollment.studentId.toString());

        if (!student) {
          return null;
        }

        return {
          id: student._id,
          fullName: student.fullName,
          email: student.email,
          status: student.status,
          enrolledAt: enrollment.createdAt,
        };
      })
      .filter(Boolean),
    quizzes: quizzes.map((quiz) => ({
      id: quiz._id,
      title: quiz.title,
      status: quiz.status,
      timeLimit: quiz.timeLimit,
      questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
      updatedAt: quiz.updatedAt,
      createdAt: quiz.createdAt,
    })),
    documents: documents.map((document) => ({
      id: document._id,
      title: document.title,
      version: document.version,
      fileName: document.fileName,
      status: document.status,
      size: document.size,
      aiErrorMessage: document.aiErrorMessage,
      indexedAt: document.indexedAt,
      updatedAt: document.updatedAt,
      createdAt: document.createdAt,
    })),
    quizSessions: quizSessions.map((session) => {
      const student = studentsById.get(session.studentId.toString());
      const quiz = session.quizId ? quizzesById.get(session.quizId.toString()) : null;

      return {
        id: session._id,
        courseId: session.courseId,
        quizId: session.quizId || null,
        quizTitle: quiz?.title || null,
        studentId: session.studentId,
        studentName: student?.fullName || 'Unknown student',
        studentEmail: student?.email || '',
        status: session.status,
        score: session.score,
        totalQuestions: session.totalQuestions ?? null,
        percentage: session.percentage ?? null,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        gradedAt: session.gradedAt || null,
      };
    }),
  });
}

async function updateQuizSessionScore(req, res) {
  const { id, sessionId } = req.params;
  const { score } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid course id',
    });
  }

  if (!isValidObjectId(sessionId)) {
    return res.status(400).json({
      message: 'Invalid session id',
    });
  }

  if (!Number.isFinite(Number(score)) || Number(score) < 0) {
    return res.status(400).json({
      message: 'score must be a non-negative number',
    });
  }

  const course = await Course.findOne({
    _id: id,
    teacherIds: req.user._id,
  }).lean();

  if (!course) {
    return res.status(404).json({
      message: 'Course not found or you are not assigned to this course',
    });
  }

  const session = await QuizSession.findOne({ _id: sessionId, courseId: id });

  if (!session) {
    return res.status(404).json({
      message: 'Quiz session not found in this course',
    });
  }

  session.score = Number(score);
  session.gradedBy = req.user._id;
  session.gradedAt = new Date();

  if (Number.isFinite(session.totalQuestions) && session.totalQuestions > 0) {
    session.percentage = Number(((session.score / session.totalQuestions) * 100).toFixed(2));
  }

  await session.save();

  return res.json({
    message: 'Quiz session score updated successfully',
    quizSession: {
      id: session._id,
      courseId: session.courseId,
      quizId: session.quizId || null,
      studentId: session.studentId,
      status: session.status,
      score: session.score,
      totalQuestions: session.totalQuestions ?? null,
      percentage: session.percentage ?? null,
      gradedAt: session.gradedAt || null,
      updatedAt: session.updatedAt,
    },
  });
}

async function updateMyCourse(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid course id',
    });
  }

  const course = await Course.findOne({
    _id: id,
    teacherIds: req.user._id,
  });

  if (!course) {
    return res.status(404).json({
      message: 'Course not found or you are not assigned to this course',
    });
  }

  const nextName = req.body.name !== undefined || req.body.title !== undefined
    ? normalizeText(req.body.name || req.body.title)
    : undefined;
  const nextCode = req.body.code !== undefined ? normalizeCode(req.body.code) : undefined;
  const nextDescription = req.body.description !== undefined ? normalizeText(req.body.description) : undefined;
  const nextStatus = req.body.status;

  if (nextName !== undefined && !nextName) {
    return res.status(400).json({
      message: 'name cannot be empty',
    });
  }

  if (nextCode !== undefined) {
    if (!nextCode) {
      return res.status(400).json({
        message: 'code cannot be empty',
      });
    }

    const duplicatedCode = await Course.findOne({
      code: nextCode,
      _id: { $ne: course._id },
    });

    if (duplicatedCode) {
      return res.status(409).json({
        message: 'Course code already exists',
      });
    }
  }

  if (nextStatus !== undefined && !['ACTIVE', 'INACTIVE'].includes(nextStatus)) {
    return res.status(400).json({
      message: 'Invalid course status',
    });
  }

  if (nextName !== undefined) {
    course.name = nextName;
    course.title = nextName;
  }

  if (nextCode !== undefined) {
    course.code = nextCode;
  }

  if (nextDescription !== undefined) {
    course.description = nextDescription;
  }

  if (nextStatus !== undefined) {
    course.status = nextStatus;
  }

  await course.save();

  return res.json({
    message: 'Course updated successfully',
    course: mapCourse(course),
  });
}

async function deleteMyCourse(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid course id',
    });
  }

  const course = await Course.findOne({
    _id: id,
    teacherIds: req.user._id,
  });

  if (!course) {
    return res.status(404).json({
      message: 'Course not found or you are not assigned to this course',
    });
  }

  await CourseDocument.deleteMany({ courseId: course._id });
  await Course.deleteOne({ _id: course._id });

  return res.json({
    message: 'Course deleted successfully',
    deletedCourseId: id,
  });
}

module.exports = {
  createCourse,
  listMyCourses,
  getMyCourseDetail,
  getMyCourseInsights,
  updateQuizSessionScore,
  updateMyCourse,
  deleteMyCourse,
};
