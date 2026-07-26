const mongoose = require('mongoose');

const qaRecordSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    citations: [
      {
        title: {
          type: String,
          default: '',
          trim: true,
        },
        source: {
          type: String,
          default: '',
          trim: true,
        },
      },
    ],
    confidenceStatus: {
      type: String,
      enum: ['high', 'medium', 'low', 'unknown'],
      default: 'unknown',
    },
    aiStatus: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
    reviewStatus: {
      type: String,
      enum: ['NEEDS_REVIEW', 'IN_PROGRESS', 'RESOLVED'],
      default: 'RESOLVED',
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

qaRecordSchema.index({ courseId: 1, createdAt: -1 });
qaRecordSchema.index({ courseId: 1, aiStatus: 1, reviewStatus: 1, confidenceStatus: 1 });

module.exports = mongoose.model('QaRecord', qaRecordSchema);
