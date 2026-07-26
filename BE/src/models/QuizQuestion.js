const mongoose = require('mongoose');

const quizOptionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const quizQuestionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    questionContent: {
      type: String,
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      enum: ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'TRUE_FALSE'],
      default: 'MULTIPLE_CHOICE',
      index: true,
    },
    options: [quizOptionSchema],
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    source: {
      type: String,
      enum: ['AI_GENERATED'],
      default: 'AI_GENERATED',
    },
    reviewStatus: {
      type: String,
      enum: ['GOOD', 'NEEDS_REVIEW'],
      default: 'GOOD',
      index: true,
    },
    teacherReviewNote: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

quizQuestionSchema.index({ courseId: 1, createdAt: -1 });
quizQuestionSchema.index({ courseId: 1, reviewStatus: 1, questionType: 1 });

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);