const mongoose = require('mongoose');
const Course = require('../models/Course');
const QaRecord = require('../models/QaRecord');
const QaFeedback = require('../models/QaFeedback');
const { normalizeReviewStatus } = require('./teacherFeedback.controller');

const HISTORY_SORT_FIELDS = new Set(['createdAt', 'question', 'confidenceStatus', 'aiStatus', 'reviewStatus']);

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function buildAnswerPreview(answer, maxLength = 120) {
  if (!answer) {
    return '';
  }

  if (answer.length <= maxLength) {
    return answer;
  }

  return `${answer.slice(0, maxLength).trim()}...`;
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

async function getAuthorizedCourseIds(userId, requestedCourseId) {
  const filter = {
    teacherIds: userId,
    status: 'ACTIVE',
  };

  if (requestedCourseId) {
    if (!isValidObjectId(requestedCourseId)) {
      return { error: { statusCode: 400, message: 'Invalid courseId' } };
    }

    filter._id = requestedCourseId;
  }

  const courses = await Course.find(filter).select('_id');

  if (requestedCourseId && courses.length === 0) {
    return { error: { statusCode: 403, message: 'You are not assigned to this course' } };
  }

  return { courseIds: courses.map((course) => course._id) };
}

function buildHistoryMatch(req, courseIds) {
  const { keyword, aiStatus, reviewStatus, confidenceStatus, hasFeedback, from, to } = req.query;
  const match = {
    courseId: { $in: courseIds },
  };

  if (keyword) {
    match.$or = [
      { question: { $regex: keyword, $options: 'i' } },
      { answer: { $regex: keyword, $options: 'i' } },
    ];
  }

  if (aiStatus) {
    match.aiStatus = aiStatus;
  }

  if (reviewStatus) {
    match.reviewStatus = normalizeReviewStatus(reviewStatus);
  }

  if (confidenceStatus) {
    match.confidenceStatus = confidenceStatus;
  }

  const dateFilter = parseDateRange(from, to);

  if (dateFilter.error) {
    return { error: { statusCode: 400, message: dateFilter.error } };
  }

  if (dateFilter.range) {
    match.createdAt = dateFilter.range;
  }

  return {
    match,
    hasFeedback,
    filters: {
      courseId: req.query.courseId || null,
      keyword: keyword || null,
      aiStatus: aiStatus || null,
      reviewStatus: reviewStatus || null,
      confidenceStatus: confidenceStatus || null,
      hasFeedback: hasFeedback || null,
      from: from || null,
      to: to || null,
    },
  };
}

function buildSort(sortBy, sortOrder) {
  const field = HISTORY_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
  const order = sortOrder === 'asc' ? 1 : -1;

  return {
    [field]: order,
    _id: -1,
  };
}

async function getHistoryList(req, res) {
  const { page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const currentPage = Math.max(1, Number.parseInt(page, 10));
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10)));

  const auth = await getAuthorizedCourseIds(req.user._id, req.query.courseId);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const historyQuery = buildHistoryMatch(req, auth.courseIds);

  if (historyQuery.error) {
    return res.status(historyQuery.error.statusCode).json({ message: historyQuery.error.message });
  }

  const sort = buildSort(sortBy, sortOrder);

  const qaCollectionName = QaFeedback.collection.name;
  const pipeline = [
    { $match: historyQuery.match },
    {
      $lookup: {
        from: qaCollectionName,
        localField: '_id',
        foreignField: 'qaRecordId',
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

  if (historyQuery.hasFeedback === 'true') {
    pipeline.push({ $match: { feedbackCount: { $gt: 0 } } });
  }

  if (historyQuery.hasFeedback === 'false') {
    pipeline.push({ $match: { feedbackCount: 0 } });
  }

  const [countRows, rows] = await Promise.all([
    QaRecord.aggregate([...pipeline, { $count: 'count' }]),
    QaRecord.aggregate([
      ...pipeline,
      { $sort: sort },
      { $skip: (currentPage - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          _id: 1,
          courseId: 1,
          studentId: 1,
          question: 1,
          answer: 1,
          citationsCount: { $size: '$citations' },
          confidenceStatus: 1,
          aiStatus: 1,
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
      ...historyQuery.filters,
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder,
    },
    pagination: {
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    items: rows.map((item) => ({
      id: item._id,
      courseId: item.courseId,
      studentId: item.studentId,
      question: item.question,
      answerPreview: buildAnswerPreview(item.answer),
      citationsCount: item.citationsCount,
      confidenceStatus: item.confidenceStatus,
      aiStatus: item.aiStatus,
      reviewStatus: item.reviewStatus,
      reviewStatusAlias: item.reviewStatus === 'NEEDS_REVIEW' ? 'REVIEW_REQUIRED' : item.reviewStatus,
      teacherReviewNote: item.teacherReviewNote,
      feedbackSummary: item.feedbackSummary,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  });
}

async function getHistoryDetail(req, res) {
  const { qaRecordId } = req.params;

  if (!isValidObjectId(qaRecordId)) {
    return res.status(400).json({
      message: 'Invalid qaRecordId',
    });
  }

  const record = await QaRecord.findById(qaRecordId).lean();

  if (!record) {
    return res.status(404).json({
      message: 'Q&A record not found',
    });
  }

  const auth = await getAuthorizedCourseIds(req.user._id, record.courseId.toString());

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const feedbacks = await QaFeedback.find({ qaRecordId: record._id }).sort({ createdAt: -1 }).lean();
  const helpfulCount = feedbacks.filter((item) => item.rating === 'HELPFUL').length;
  const notHelpfulCount = feedbacks.filter((item) => item.rating === 'NOT_HELPFUL').length;
  const totalFeedback = feedbacks.length;

  return res.json({
    qaRecord: {
      id: record._id,
      courseId: record.courseId,
      studentId: record.studentId,
      question: record.question,
      answer: record.answer,
      citations: record.citations,
      confidenceStatus: record.confidenceStatus,
      aiStatus: record.aiStatus,
      reviewStatus: record.reviewStatus,
      reviewStatusAlias: record.reviewStatus === 'NEEDS_REVIEW' ? 'REVIEW_REQUIRED' : record.reviewStatus,
      teacherReviewNote: record.teacherReviewNote,
      reviewedBy: record.reviewedBy,
      reviewedAt: record.reviewedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
    feedbackSummary: {
      total: totalFeedback,
      helpfulCount,
      notHelpfulCount,
      helpfulRate: totalFeedback === 0 ? 0 : Number(((helpfulCount / totalFeedback) * 100).toFixed(2)),
    },
    feedbacks,
  });
}

async function getPopularQuestions(req, res) {
  const requestedLimit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));
  const auth = await getAuthorizedCourseIds(req.user._id, req.query.courseId);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const historyQuery = buildHistoryMatch(req, auth.courseIds);

  if (historyQuery.error) {
    return res.status(historyQuery.error.statusCode).json({ message: historyQuery.error.message });
  }

  delete historyQuery.match.$or;

  if (req.query.keyword) {
    historyQuery.match.question = {
      $regex: req.query.keyword,
      $options: 'i',
    };
  }

  const feedbackCollectionName = QaFeedback.collection.name;
  const rows = await QaRecord.aggregate([
    { $match: historyQuery.match },
    {
      $group: {
        _id: '$question',
        askedCount: { $sum: 1 },
        qaRecordIds: { $push: '$_id' },
        latestAskedAt: { $max: '$createdAt' },
      },
    },
    {
      $lookup: {
        from: feedbackCollectionName,
        localField: 'qaRecordIds',
        foreignField: 'qaRecordId',
        as: 'feedbacks',
      },
    },
    {
      $addFields: {
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
    {
      $addFields: {
        totalFeedback: { $size: '$feedbacks' },
        helpfulRate: {
          $cond: [
            { $eq: [{ $size: '$feedbacks' }, 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $size: {
                            $filter: {
                              input: '$feedbacks',
                              as: 'feedback',
                              cond: { $eq: ['$$feedback.rating', 'HELPFUL'] },
                            },
                          },
                        },
                        { $size: '$feedbacks' },
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        question: '$_id',
        askedCount: 1,
        helpfulCount: 1,
        notHelpfulCount: 1,
        totalFeedback: 1,
        helpfulRate: 1,
        latestAskedAt: 1,
      },
    },
    {
      $sort: {
        askedCount: -1,
        latestAskedAt: -1,
      },
    },
    { $limit: requestedLimit },
  ]);

  return res.json({
    filters: {
      courseId: req.query.courseId || null,
      keyword: req.query.keyword || null,
      from: req.query.from || null,
      to: req.query.to || null,
      limit: requestedLimit,
    },
    items: rows,
  });
}

module.exports = {
  getHistoryList,
  getHistoryDetail,
  getPopularQuestions,
};
