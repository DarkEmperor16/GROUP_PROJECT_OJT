const mongoose = require('mongoose');
const Course = require('../models/Course');
const QuizQuestion = require('../models/QuizQuestion');
const QuizQuestionFeedback = require('../models/QuizQuestionFeedback');

const REVIEW_STATUSES = new Set(['GOOD', 'NEEDS_REVIEW']);
const QUESTION_TYPES = new Set(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'TRUE_FALSE']);

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function buildQuestionPreview(content, maxLength = 120) {
  if (!content) {
    return '';
  }

  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength).trim()}...`;
}

async function authorizeTeacherForCourse(courseId, userId) {
  if (!courseId) {
    return { error: { statusCode: 400, message: 'courseId is required' } };
  }

  if (!isValidObjectId(courseId)) {
    return { error: { statusCode: 400, message: 'Invalid courseId' } };
  }

  const course = await Course.findOne({
    _id: courseId,
    teacherIds: userId,
  });

  if (!course) {
    return { error: { statusCode: 404, message: 'Course not found or you are not assigned to this course' } };
  }

  return { course };
}

async function listQuizQuestions(req, res) {
  const { courseId, reviewStatus, questionType, keyword } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const filter = {
    courseId: auth.course._id,
  };

  if (reviewStatus) {
    if (!REVIEW_STATUSES.has(reviewStatus)) {
      return res.status(400).json({
        message: 'Invalid reviewStatus filter',
      });
    }

    filter.reviewStatus = reviewStatus;
  }

  if (questionType) {
    if (!QUESTION_TYPES.has(questionType)) {
      return res.status(400).json({
        message: 'Invalid questionType filter',
      });
    }

    filter.questionType = questionType;
  }

  if (keyword) {
    filter.$or = [
      { questionContent: { $regex: keyword, $options: 'i' } },
      { explanation: { $regex: keyword, $options: 'i' } },
    ];
  }

  const feedbackCollectionName = QuizQuestionFeedback.collection.name;
  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: feedbackCollectionName,
        localField: '_id',
        foreignField: 'quizQuestionId',
        as: 'feedbacks',
      },
    },
    {
      $addFields: {
        feedbackCount: { $size: '$feedbacks' },
        helpfulCount: {
          $size: {
            $filter: {
              input: '$feedbacks',
              as: 'feedback',
              cond: { $eq: ['$$feedback.rating', 'HELPFUL'] },
            },
          },
        },
        notHelpfulCount: {
          $size: {
            $filter: {
              input: '$feedbacks',
              as: 'feedback',
              cond: { $eq: ['$$feedback.rating', 'NOT_HELPFUL'] },
            },
          },
        },
      },
    },
  ];

  const [countRows, rows] = await Promise.all([
    QuizQuestion.aggregate([...pipeline, { $count: 'count' }]),
    QuizQuestion.aggregate([
      ...pipeline,
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          courseId: 1,
          questionContent: 1,
          questionType: 1,
          reviewStatus: 1,
          teacherReviewNote: 1,
          createdAt: 1,
          updatedAt: 1,
          feedbackSummary: {
            total: '$feedbackCount',
            helpfulCount: '$helpfulCount',
            notHelpfulCount: '$notHelpfulCount',
            helpfulRate: {
              $cond: [
                { $eq: ['$feedbackCount', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [{ $divide: ['$helpfulCount', '$feedbackCount'] }, 100],
                    },
                    2,
                  ],
                },
              ],
            },
          },
        },
      },
    ]),
  ]);

  const total = countRows[0]?.count || 0;

  return res.json({
    filters: {
      courseId,
      reviewStatus: reviewStatus || null,
      questionType: questionType || null,
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
    items: rows.map((item) => ({
      id: item._id,
      courseId: item.courseId,
      questionType: item.questionType,
      questionContent: item.questionContent,
      questionPreview: buildQuestionPreview(item.questionContent),
      reviewStatus: item.reviewStatus,
      teacherReviewNote: item.teacherReviewNote,
      feedbackSummary: item.feedbackSummary,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  });
}

async function getQuizQuestionDetail(req, res) {
  const { questionId } = req.params;

  if (!isValidObjectId(questionId)) {
    return res.status(400).json({
      message: 'Invalid questionId',
    });
  }

  const question = await QuizQuestion.findById(questionId).lean();

  if (!question) {
    return res.status(404).json({
      message: 'Quiz question not found',
    });
  }

  const auth = await authorizeTeacherForCourse(question.courseId.toString(), req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const feedbacks = await QuizQuestionFeedback.find({ quizQuestionId: question._id }).sort({ createdAt: -1 }).lean();
  const helpfulCount = feedbacks.filter((item) => item.rating === 'HELPFUL').length;
  const notHelpfulCount = feedbacks.filter((item) => item.rating === 'NOT_HELPFUL').length;
  const total = feedbacks.length;

  return res.json({
    quizQuestion: {
      id: question._id,
      courseId: question.courseId,
      questionContent: question.questionContent,
      questionType: question.questionType,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      reviewStatus: question.reviewStatus,
      teacherReviewNote: question.teacherReviewNote,
      reviewedBy: question.reviewedBy,
      reviewedAt: question.reviewedAt,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    },
    feedbackSummary: {
      total,
      helpfulCount,
      notHelpfulCount,
      helpfulRate: total === 0 ? 0 : Number(((helpfulCount / total) * 100).toFixed(2)),
    },
    feedbacks,
  });
}

async function reviewQuizQuestion(req, res) {
  const { questionId } = req.params;
  const { reviewStatus, teacherReviewNote = '' } = req.body;

  if (!isValidObjectId(questionId)) {
    return res.status(400).json({
      message: 'Invalid questionId',
    });
  }

  if (!REVIEW_STATUSES.has(reviewStatus)) {
    return res.status(400).json({
      message: 'Invalid reviewStatus',
    });
  }

  const question = await QuizQuestion.findById(questionId);

  if (!question) {
    return res.status(404).json({
      message: 'Quiz question not found',
    });
  }

  const auth = await authorizeTeacherForCourse(question.courseId.toString(), req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  question.reviewStatus = reviewStatus;
  question.teacherReviewNote = teacherReviewNote;
  question.reviewedBy = req.user._id;
  question.reviewedAt = new Date();

  await question.save();

  return res.json({
    message: 'Quiz question review updated',
    quizQuestion: {
      id: question._id,
      courseId: question.courseId,
      reviewStatus: question.reviewStatus,
      teacherReviewNote: question.teacherReviewNote,
      reviewedBy: question.reviewedBy,
      reviewedAt: question.reviewedAt,
      updatedAt: question.updatedAt,
    },
  });
}

module.exports = {
  listQuizQuestions,
  getQuizQuestionDetail,
  reviewQuizQuestion,
};