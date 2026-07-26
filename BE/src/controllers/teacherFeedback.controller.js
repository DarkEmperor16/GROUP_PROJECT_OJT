const mongoose = require('mongoose');
const Course = require('../models/Course');
const QaRecord = require('../models/QaRecord');
const QaFeedback = require('../models/QaFeedback');

const LOW_RATED_THRESHOLD = 50;
const LOW_RATED_MIN_FEEDBACK = 3;
const REVIEW_STATUSES = new Set(['NEEDS_REVIEW', 'IN_PROGRESS', 'RESOLVED']);

function normalizeReviewStatus(value) {
  if (!value) {
    return value;
  }

  const normalized = value.toString().trim().toUpperCase();

  if (normalized === 'REVIEW_REQUIRED') {
    return 'NEEDS_REVIEW';
  }

  if (normalized === 'RESOLVED') {
    return 'RESOLVED';
  }

  return normalized;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function parseDateRange(from, to) {
  const range = {};

  if (from) {
    const fromDate = new Date(from);

    if (Number.isNaN(fromDate.getTime())) {
      return { error: 'Invalid from date' };
    }

    range.$gte = fromDate;
  }

  if (to) {
    const toDate = new Date(to);

    if (Number.isNaN(toDate.getTime())) {
      return { error: 'Invalid to date' };
    }

    range.$lte = toDate;
  }

  return Object.keys(range).length > 0 ? { range } : { range: null };
}

async function findCourseAndAuthorizeTeacher(courseId, userId) {
  const course = await Course.findById(courseId);

  if (!course) {
    return { error: { statusCode: 404, message: 'Course not found' } };
  }

  if (course.status !== 'ACTIVE') {
    return { error: { statusCode: 409, message: 'Course is inactive' } };
  }

  const isAssignedTeacher = course.teacherIds.some((teacherId) => teacherId.toString() === userId.toString());

  if (!isAssignedTeacher) {
    return { error: { statusCode: 403, message: 'You are not assigned to this course' } };
  }

  return { course };
}

async function getFeedbackSummary(req, res) {
  const { courseId } = req.params;
  const { from, to } = req.query;

  if (!isValidObjectId(courseId)) {
    return res.status(400).json({
      message: 'Invalid courseId',
    });
  }

  const dateFilter = parseDateRange(from, to);

  if (dateFilter.error) {
    return res.status(400).json({
      message: dateFilter.error,
    });
  }

  const auth = await findCourseAndAuthorizeTeacher(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const match = {
    courseId: new mongoose.Types.ObjectId(courseId),
  };

  if (dateFilter.range) {
    match.createdAt = dateFilter.range;
  }

  const ratingStats = await QaFeedback.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ]);

  const answerStats = await QaFeedback.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$qaRecordId',
        totalFeedback: { $sum: 1 },
        helpfulCount: {
          $sum: {
            $cond: [{ $eq: ['$rating', 'HELPFUL'] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        totalFeedback: 1,
        helpfulRate: {
          $cond: [
            { $eq: ['$totalFeedback', 0] },
            0,
            {
              $multiply: [{ $divide: ['$helpfulCount', '$totalFeedback'] }, 100],
            },
          ],
        },
      },
    },
  ]);

  const helpfulCount = ratingStats.find((item) => item._id === 'HELPFUL')?.count || 0;
  const notHelpfulCount = ratingStats.find((item) => item._id === 'NOT_HELPFUL')?.count || 0;
  const totalFeedback = helpfulCount + notHelpfulCount;
  const helpfulRate = totalFeedback === 0 ? 0 : Number(((helpfulCount / totalFeedback) * 100).toFixed(2));

  const lowRatedAnswers = answerStats.filter(
    (item) => item.totalFeedback >= LOW_RATED_MIN_FEEDBACK && item.helpfulRate < LOW_RATED_THRESHOLD,
  ).length;

  return res.json({
    courseId,
    filters: {
      from: from || null,
      to: to || null,
    },
    summary: {
      totalFeedback,
      helpfulCount,
      notHelpfulCount,
      helpfulRate,
      answersWithFeedback: answerStats.length,
      lowRatedAnswers,
      lowRatedRule: {
        helpfulRateLt: LOW_RATED_THRESHOLD,
        minFeedback: LOW_RATED_MIN_FEEDBACK,
      },
    },
  });
}

async function getLowRatedAnswers(req, res) {
  const { courseId } = req.params;
  const { from, to } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));

  if (!isValidObjectId(courseId)) {
    return res.status(400).json({
      message: 'Invalid courseId',
    });
  }

  const dateFilter = parseDateRange(from, to);

  if (dateFilter.error) {
    return res.status(400).json({
      message: dateFilter.error,
    });
  }

  const auth = await findCourseAndAuthorizeTeacher(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const match = {
    courseId: new mongoose.Types.ObjectId(courseId),
  };

  if (dateFilter.range) {
    match.createdAt = dateFilter.range;
  }

  const qaCollectionName = QaRecord.collection.name;

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$qaRecordId',
        totalFeedback: { $sum: 1 },
        helpfulCount: {
          $sum: {
            $cond: [{ $eq: ['$rating', 'HELPFUL'] }, 1, 0],
          },
        },
        notHelpfulCount: {
          $sum: {
            $cond: [{ $eq: ['$rating', 'NOT_HELPFUL'] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        totalFeedback: 1,
        helpfulCount: 1,
        notHelpfulCount: 1,
        helpfulRate: {
          $cond: [
            { $eq: ['$totalFeedback', 0] },
            0,
            {
              $multiply: [{ $divide: ['$helpfulCount', '$totalFeedback'] }, 100],
            },
          ],
        },
      },
    },
    {
      $match: {
        totalFeedback: { $gte: LOW_RATED_MIN_FEEDBACK },
        helpfulRate: { $lt: LOW_RATED_THRESHOLD },
      },
    },
    {
      $lookup: {
        from: qaCollectionName,
        localField: '_id',
        foreignField: '_id',
        as: 'qa',
      },
    },
    {
      $unwind: '$qa',
    },
    {
      $sort: {
        helpfulRate: 1,
        totalFeedback: -1,
        'qa.createdAt': -1,
      },
    },
  ];

  const [totalRows, rows] = await Promise.all([
    QaFeedback.aggregate([...pipeline, { $count: 'count' }]),
    QaFeedback.aggregate([
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          answerId: '$qa._id',
          studentId: '$qa.studentId',
          question: '$qa.question',
          answer: '$qa.answer',
          citations: '$qa.citations',
          confidenceStatus: '$qa.confidenceStatus',
          reviewStatus: '$qa.reviewStatus',
          teacherReviewNote: '$qa.teacherReviewNote',
          reviewedBy: '$qa.reviewedBy',
          reviewedAt: '$qa.reviewedAt',
          createdAt: '$qa.createdAt',
          helpfulCount: 1,
          notHelpfulCount: 1,
          totalFeedback: 1,
          helpfulRate: {
            $round: ['$helpfulRate', 2],
          },
        },
      },
    ]),
  ]);

  const total = totalRows[0]?.count || 0;

  return res.json({
    courseId,
    filters: {
      from: from || null,
      to: to || null,
      page,
      limit,
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    items: rows.map((row) => ({
      ...row,
      reviewStatusAlias: row.reviewStatus === 'NEEDS_REVIEW' ? 'REVIEW_REQUIRED' : row.reviewStatus,
    })),
    lowRatedRule: {
      helpfulRateLt: LOW_RATED_THRESHOLD,
      minFeedback: LOW_RATED_MIN_FEEDBACK,
    },
  });
}

async function updateAnswerReviewStatus(req, res) {
  const { answerId } = req.params;
  const { teacherReviewNote = '' } = req.body;
  const reviewStatus = normalizeReviewStatus(req.body.reviewStatus);

  if (!isValidObjectId(answerId)) {
    return res.status(400).json({
      message: 'Invalid answerId',
    });
  }

  if (!REVIEW_STATUSES.has(reviewStatus)) {
    return res.status(400).json({
      message: 'Invalid reviewStatus',
    });
  }

  const answer = await QaRecord.findById(answerId);

  if (!answer) {
    return res.status(404).json({
      message: 'Answer not found',
    });
  }

  const auth = await findCourseAndAuthorizeTeacher(answer.courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  answer.reviewStatus = reviewStatus;
  answer.teacherReviewNote = teacherReviewNote;
  answer.reviewedBy = req.user._id;
  answer.reviewedAt = new Date();

  await answer.save();

  return res.json({
    message: 'Review status updated',
    answer: {
      id: answer._id,
      courseId: answer.courseId,
      reviewStatus: answer.reviewStatus,
      reviewStatusAlias: answer.reviewStatus === 'NEEDS_REVIEW' ? 'REVIEW_REQUIRED' : answer.reviewStatus,
      teacherReviewNote: answer.teacherReviewNote,
      reviewedBy: answer.reviewedBy,
      reviewedAt: answer.reviewedAt,
      updatedAt: answer.updatedAt,
    },
  });
}

module.exports = {
  getFeedbackSummary,
  getLowRatedAnswers,
  updateAnswerReviewStatus,
  normalizeReviewStatus,
};
