const mongoose = require('mongoose');
const Course = require('../models/Course');
const QaRecord = require('../models/QaRecord');
const QaFeedback = require('../models/QaFeedback');
const QuizSession = require('../models/QuizSession');

const LOW_RATED_THRESHOLD = 50;
const LOW_RATED_MIN_FEEDBACK = 3;

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

function parseDateRange(from, to, options = {}) {
  const { defaultLast7Days = false } = options;

  if (!from && !to && defaultLast7Days) {
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);

    return {
      range: {
        $gte: start,
        $lte: end,
      },
      derivedDefault: true,
    };
  }

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

  return {
    range: Object.keys(range).length > 0 ? range : null,
    derivedDefault: false,
  };
}

async function authorizeTeacherForCourse(courseId, userId) {
  if (!courseId) {
    return { error: { statusCode: 400, message: 'courseId is required' } };
  }

  if (!isValidObjectId(courseId)) {
    return { error: { statusCode: 400, message: 'Invalid courseId' } };
  }

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

function buildQaMatch(courseId, range) {
  const match = {
    courseId: new mongoose.Types.ObjectId(courseId),
  };

  if (range) {
    match.createdAt = range;
  }

  return match;
}

function buildFeedbackMatch(courseId, range) {
  const match = {
    courseId: new mongoose.Types.ObjectId(courseId),
  };

  if (range) {
    match.createdAt = range;
  }

  return match;
}

function buildQuizSessionMatch(courseId, range) {
  const match = {
    courseId: new mongoose.Types.ObjectId(courseId),
  };

  if (range) {
    match.startedAt = range;
  }

  return match;
}

async function getHelpfulFeedbackSummary(req, res) {
  const { courseId, from, to } = req.query;

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const parsedRange = parseDateRange(from, to);

  if (parsedRange.error) {
    return res.status(400).json({ message: parsedRange.error });
  }

  const feedbackMatch = buildFeedbackMatch(courseId, parsedRange.range);
  const ratingStats = await QaFeedback.aggregate([
    { $match: feedbackMatch },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const helpfulCount = ratingStats.find((item) => item._id === 'HELPFUL')?.count || 0;
  const notHelpfulCount = ratingStats.find((item) => item._id === 'NOT_HELPFUL')?.count || 0;
  const totalFeedback = helpfulCount + notHelpfulCount;
  const helpfulRate = totalFeedback === 0 ? 0 : Number(((helpfulCount / totalFeedback) * 100).toFixed(2));

  return res.json({
    filters: {
      courseId,
      from: from || null,
      to: to || null,
    },
    summary: {
      usefulFeedback: helpfulCount,
      totalFeedback,
      helpfulCount,
      notHelpfulCount,
      helpfulRate,
      notHelpfulRate: totalFeedback === 0 ? 0 : Number(((notHelpfulCount / totalFeedback) * 100).toFixed(2)),
    },
  });
}

async function getHelpfulFeedbackTrends(req, res) {
  const { courseId, from, to } = req.query;
  const groupBy = req.query.groupBy === 'day' ? 'day' : 'week';

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const parsedRange = parseDateRange(from, to, { defaultLast7Days: true });

  if (parsedRange.error) {
    return res.status(400).json({ message: parsedRange.error });
  }

  const feedbackMatch = buildFeedbackMatch(courseId, parsedRange.range);
  const format = groupBy === 'day' ? '%Y-%m-%d' : '%G-W%V';

  const items = await QaFeedback.aggregate([
    { $match: feedbackMatch },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: '$createdAt',
            timezone: 'UTC',
          },
        },
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
        _id: 0,
        period: '$_id',
        totalFeedback: 1,
        helpfulCount: 1,
        notHelpfulCount: 1,
        helpfulRate: {
          $cond: [
            { $eq: ['$totalFeedback', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [{ $divide: ['$helpfulCount', '$totalFeedback'] }, 100],
                },
                2,
              ],
            },
          ],
        },
        notHelpfulRate: {
          $cond: [
            { $eq: ['$totalFeedback', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [{ $divide: ['$notHelpfulCount', '$totalFeedback'] }, 100],
                },
                2,
              ],
            },
          ],
        },
      },
    },
    { $sort: { period: 1 } },
  ]);

  return res.json({
    filters: {
      courseId,
      from: from || parsedRange.range?.$gte || null,
      to: to || parsedRange.range?.$lte || null,
      groupBy,
      defaultRangeApplied: parsedRange.derivedDefault,
    },
    items,
  });
}

async function getAiUsageSummary(req, res) {
  const { courseId, from, to } = req.query;

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const parsedRange = parseDateRange(from, to);

  if (parsedRange.error) {
    return res.status(400).json({ message: parsedRange.error });
  }

  const qaMatch = buildQaMatch(courseId, parsedRange.range);
  const quizSessionMatch = buildQuizSessionMatch(courseId, parsedRange.range);

  const [questionCount, studentsAskedRows, quizSessionCount, quizSessionStudentsRows] = await Promise.all([
    QaRecord.countDocuments(qaMatch),
    QaRecord.aggregate([
      { $match: qaMatch },
      { $group: { _id: '$studentId' } },
    ]),
    QuizSession.countDocuments(quizSessionMatch),
    QuizSession.aggregate([
      { $match: quizSessionMatch },
      { $group: { _id: '$studentId' } },
    ]),
  ]);

  const askedStudentIds = new Set(studentsAskedRows.map((row) => row._id.toString()));
  const sessionStudentIds = new Set(quizSessionStudentsRows.map((row) => row._id.toString()));
  const aiUserIds = new Set([...askedStudentIds, ...sessionStudentIds]);

  return res.json({
    filters: {
      courseId,
      from: from || null,
      to: to || null,
    },
    summary: {
      totalAiUsers: aiUserIds.size,
      studentsAsked: askedStudentIds.size,
      questionCount,
      quizSessionCount,
    },
  });
}

async function getAiUsageTrends(req, res) {
  const { courseId, from, to } = req.query;
  const groupBy = req.query.groupBy === 'day' ? 'day' : 'week';

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const parsedRange = parseDateRange(from, to, { defaultLast7Days: true });

  if (parsedRange.error) {
    return res.status(400).json({ message: parsedRange.error });
  }

  const qaMatch = buildQaMatch(courseId, parsedRange.range);
  const quizSessionMatch = buildQuizSessionMatch(courseId, parsedRange.range);
  const format = groupBy === 'day' ? '%Y-%m-%d' : '%G-W%V';

  const [qaBuckets, quizSessionBuckets] = await Promise.all([
    QaRecord.aggregate([
      { $match: qaMatch },
      {
        $group: {
          _id: {
            $dateToString: {
              format,
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
          questionCount: { $sum: 1 },
          askedStudents: { $addToSet: '$studentId' },
        },
      },
      {
        $project: {
          _id: 1,
          questionCount: 1,
          studentsAsked: { $size: '$askedStudents' },
          askedStudentIds: '$askedStudents',
        },
      },
    ]),
    QuizSession.aggregate([
      { $match: quizSessionMatch },
      {
        $group: {
          _id: {
            $dateToString: {
              format,
              date: '$startedAt',
              timezone: 'UTC',
            },
          },
          quizSessionCount: { $sum: 1 },
          quizStudents: { $addToSet: '$studentId' },
        },
      },
      {
        $project: {
          _id: 1,
          quizSessionCount: 1,
          quizStudentsCount: { $size: '$quizStudents' },
          quizStudentIds: '$quizStudents',
        },
      },
    ]),
  ]);

  const bucketMap = new Map();

  qaBuckets.forEach((row) => {
    bucketMap.set(row._id, {
      period: row._id,
      studentsAsked: row.studentsAsked,
      questionCount: row.questionCount,
      quizSessionCount: 0,
      quizStudentsCount: 0,
      totalAiUsers: row.studentsAsked,
      askedStudentIds: row.askedStudentIds.map((id) => id.toString()),
      quizStudentIds: [],
    });
  });

  quizSessionBuckets.forEach((row) => {
    const current = bucketMap.get(row._id) || {
      period: row._id,
      studentsAsked: 0,
      questionCount: 0,
      quizSessionCount: 0,
      quizStudentsCount: 0,
      totalAiUsers: 0,
      askedStudentIds: [],
      quizStudentIds: [],
    };

    current.quizSessionCount = row.quizSessionCount;
    current.quizStudentsCount = row.quizStudentsCount;
    current.quizStudentIds = row.quizStudentIds.map((id) => id.toString());
    current.totalAiUsers = new Set([...current.askedStudentIds, ...current.quizStudentIds]).size;

    bucketMap.set(row._id, current);
  });

  const items = Array.from(bucketMap.values())
    .map(({ askedStudentIds, quizStudentIds, ...item }) => item)
    .sort((a, b) => a.period.localeCompare(b.period));

  return res.json({
    filters: {
      courseId,
      from: from || parsedRange.range?.$gte || null,
      to: to || parsedRange.range?.$lte || null,
      groupBy,
      defaultRangeApplied: parsedRange.derivedDefault,
    },
    items,
  });
}

async function getDashboardOverview(req, res) {
  const { courseId, from, to } = req.query;

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const parsedRange = parseDateRange(from, to);

  if (parsedRange.error) {
    return res.status(400).json({ message: parsedRange.error });
  }

  const qaMatch = buildQaMatch(courseId, parsedRange.range);
  const feedbackMatch = buildFeedbackMatch(courseId, parsedRange.range);

  const [totalQuestions, totalStudentsRows, ratingStats, lowRatedRows, nonResolvedIds] = await Promise.all([
    QaRecord.countDocuments(qaMatch),
    QaRecord.aggregate([
      { $match: qaMatch },
      { $group: { _id: '$studentId' } },
      { $count: 'count' },
    ]),
    QaFeedback.aggregate([
      { $match: feedbackMatch },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
    QaFeedback.aggregate([
      { $match: feedbackMatch },
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
      {
        $match: {
          totalFeedback: { $gte: LOW_RATED_MIN_FEEDBACK },
          helpfulRate: { $lt: LOW_RATED_THRESHOLD },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]),
    QaRecord.find({
      ...qaMatch,
      reviewStatus: { $ne: 'RESOLVED' },
    })
      .select('_id')
      .lean(),
  ]);

  const helpfulCount = ratingStats.find((item) => item._id === 'HELPFUL')?.count || 0;
  const notHelpfulCount = ratingStats.find((item) => item._id === 'NOT_HELPFUL')?.count || 0;
  const totalFeedback = helpfulCount + notHelpfulCount;
  const helpfulRate = totalFeedback === 0 ? 0 : Number(((helpfulCount / totalFeedback) * 100).toFixed(2));
  const totalStudents = totalStudentsRows[0]?.count || 0;

  const needsReviewSet = new Set([
    ...lowRatedRows.map((row) => row._id.toString()),
    ...nonResolvedIds.map((row) => row._id.toString()),
  ]);

  return res.json({
    filters: {
      courseId,
      from: from || null,
      to: to || null,
    },
    overview: {
      totalQuestions,
      totalStudents,
      totalFeedback,
      helpfulCount,
      notHelpfulCount,
      helpfulRate,
      answersNeedReviewCount: needsReviewSet.size,
      lowRatedRule: {
        helpfulRateLt: LOW_RATED_THRESHOLD,
        minFeedback: LOW_RATED_MIN_FEEDBACK,
      },
    },
  });
}

async function getPopularQuestions(req, res) {
  const { courseId, from, to } = req.query;
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const parsedRange = parseDateRange(from, to);

  if (parsedRange.error) {
    return res.status(400).json({ message: parsedRange.error });
  }

  const qaMatch = buildQaMatch(courseId, parsedRange.range);

  if (req.query.keyword) {
    qaMatch.question = {
      $regex: req.query.keyword,
      $options: 'i',
    };
  }

  const feedbackCollectionName = QaFeedback.collection.name;
  const rows = await QaRecord.aggregate([
    { $match: qaMatch },
    {
      $group: {
        _id: '$question',
        askedCount: { $sum: 1 },
        qaRecordIds: { $push: '$_id' },
        firstAskedAt: { $min: '$createdAt' },
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
        firstAskedAt: 1,
        latestAskedAt: 1,
      },
    },
    {
      $sort: {
        askedCount: -1,
        latestAskedAt: -1,
      },
    },
    { $limit: limit },
  ]);

  return res.json({
    filters: {
      courseId,
      keyword: req.query.keyword || null,
      from: from || null,
      to: to || null,
      limit,
    },
    grouping: {
      mode: 'ORIGINAL_QUESTION',
    },
    course: {
      id: auth.course._id,
      code: auth.course.code,
      name: auth.course.name,
      status: auth.course.status,
    },
    items: rows.map((row) => ({
      ...row,
      courseId: auth.course._id,
      courseCode: auth.course.code,
      courseName: auth.course.name,
      timeRange: {
        firstAskedAt: row.firstAskedAt,
        latestAskedAt: row.latestAskedAt,
      },
    })),
  });
}

async function getLearningTrends(req, res) {
  const { courseId, from, to } = req.query;
  const groupBy = req.query.groupBy === 'day' ? 'day' : 'week';

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const parsedRange = parseDateRange(from, to, { defaultLast7Days: true });

  if (parsedRange.error) {
    return res.status(400).json({ message: parsedRange.error });
  }

  const qaMatch = buildQaMatch(courseId, parsedRange.range);
  const feedbackMatch = buildFeedbackMatch(courseId, parsedRange.range);

  const format = groupBy === 'day' ? '%Y-%m-%d' : '%G-W%V';

  const [qaBuckets, feedbackBuckets] = await Promise.all([
    QaRecord.aggregate([
      { $match: qaMatch },
      {
        $group: {
          _id: {
            $dateToString: {
              format,
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
          totalQuestions: { $sum: 1 },
          students: { $addToSet: '$studentId' },
        },
      },
      {
        $project: {
          _id: 1,
          totalQuestions: 1,
          totalStudents: { $size: '$students' },
        },
      },
    ]),
    QaFeedback.aggregate([
      { $match: feedbackMatch },
      {
        $group: {
          _id: {
            $dateToString: {
              format,
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
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
          _id: 1,
          totalFeedback: 1,
          helpfulCount: 1,
        },
      },
    ]),
  ]);

  const bucketMap = new Map();

  qaBuckets.forEach((row) => {
    bucketMap.set(row._id, {
      period: row._id,
      totalQuestions: row.totalQuestions,
      totalStudents: row.totalStudents,
      totalFeedback: 0,
      helpfulCount: 0,
      helpfulRate: 0,
    });
  });

  feedbackBuckets.forEach((row) => {
    const current = bucketMap.get(row._id) || {
      period: row._id,
      totalQuestions: 0,
      totalStudents: 0,
      totalFeedback: 0,
      helpfulCount: 0,
      helpfulRate: 0,
    };

    current.totalFeedback = row.totalFeedback;
    current.helpfulCount = row.helpfulCount;
    current.helpfulRate =
      row.totalFeedback === 0 ? 0 : Number(((row.helpfulCount / row.totalFeedback) * 100).toFixed(2));

    bucketMap.set(row._id, current);
  });

  const items = Array.from(bucketMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  return res.json({
    filters: {
      courseId,
      from: from || parsedRange.range?.$gte || null,
      to: to || parsedRange.range?.$lte || null,
      groupBy,
      defaultRangeApplied: parsedRange.derivedDefault,
    },
    items,
  });
}

async function getAnswersNeedReview(req, res) {
  const { courseId, from, to } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));

  const auth = await authorizeTeacherForCourse(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const parsedRange = parseDateRange(from, to);

  if (parsedRange.error) {
    return res.status(400).json({ message: parsedRange.error });
  }

  const qaMatch = buildQaMatch(courseId, parsedRange.range);
  const feedbackCollectionName = QaFeedback.collection.name;

  const pipeline = [
    { $match: qaMatch },
    {
      $lookup: {
        from: feedbackCollectionName,
        localField: '_id',
        foreignField: 'qaRecordId',
        as: 'feedbacks',
      },
    },
    {
      $addFields: {
        totalFeedback: { $size: '$feedbacks' },
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
        helpfulRate: {
          $cond: [
            { $eq: ['$totalFeedback', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [{ $divide: ['$helpfulCount', '$totalFeedback'] }, 100],
                },
                2,
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        isLowRated: {
          $and: [
            { $gte: ['$totalFeedback', LOW_RATED_MIN_FEEDBACK] },
            { $lt: ['$helpfulRate', LOW_RATED_THRESHOLD] },
          ],
        },
      },
    },
    {
      $match: {
        $or: [{ reviewStatus: { $ne: 'RESOLVED' } }, { isLowRated: true }],
      },
    },
  ];

  const [countRows, rows] = await Promise.all([
    QaRecord.aggregate([...pipeline, { $count: 'count' }]),
    QaRecord.aggregate([
      ...pipeline,
      {
        $sort: {
          isLowRated: -1,
          helpfulRate: 1,
          updatedAt: -1,
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          courseId: 1,
          studentId: 1,
          question: 1,
          answer: 1,
          reviewStatus: 1,
          teacherReviewNote: 1,
          reviewedBy: 1,
          reviewedAt: 1,
          confidenceStatus: 1,
          aiStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          isLowRated: 1,
          totalFeedback: 1,
          helpfulCount: 1,
          notHelpfulCount: 1,
          helpfulRate: 1,
        },
      },
    ]),
  ]);

  const total = countRows[0]?.count || 0;

  return res.json({
    filters: {
      courseId,
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
    lowRatedRule: {
      helpfulRateLt: LOW_RATED_THRESHOLD,
      minFeedback: LOW_RATED_MIN_FEEDBACK,
    },
    items: rows.map((item) => ({
      id: item._id,
      courseId: item.courseId,
      studentId: item.studentId,
      question: item.question,
      answerPreview: buildAnswerPreview(item.answer),
      confidenceStatus: item.confidenceStatus,
      aiStatus: item.aiStatus,
      reviewStatus: item.reviewStatus,
      reviewStatusAlias: item.reviewStatus === 'NEEDS_REVIEW' ? 'REVIEW_REQUIRED' : item.reviewStatus,
      teacherReviewNote: item.teacherReviewNote,
      reviewedBy: item.reviewedBy,
      reviewedAt: item.reviewedAt,
      isLowRated: item.isLowRated,
      needsReviewReason:
        item.reviewStatus !== 'RESOLVED'
          ? 'MANUAL_REVIEW_STATUS'
          : item.isLowRated
            ? 'LOW_HELPFUL_RATE'
            : 'NONE',
      feedbackSummary: {
        total: item.totalFeedback,
        helpfulCount: item.helpfulCount,
        notHelpfulCount: item.notHelpfulCount,
        helpfulRate: item.helpfulRate,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  });
}

module.exports = {
  getAiUsageSummary,
  getAiUsageTrends,
  getHelpfulFeedbackSummary,
  getHelpfulFeedbackTrends,
  getDashboardOverview,
  getPopularQuestions,
  getLearningTrends,
  getAnswersNeedReview,
};
