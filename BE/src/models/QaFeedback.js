const mongoose = require('mongoose');

const qaFeedbackSchema = new mongoose.Schema(
  {
    qaRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QaRecord',
      required: true,
      index: true,
    },
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
    rating: {
      type: String,
      enum: ['HELPFUL', 'NOT_HELPFUL'],
      required: true,
      index: true,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

qaFeedbackSchema.index({ qaRecordId: 1, studentId: 1 }, { unique: true });
qaFeedbackSchema.index({ courseId: 1, createdAt: -1 });
qaFeedbackSchema.index({ qaRecordId: 1, rating: 1 });

module.exports = mongoose.model('QaFeedback', qaFeedbackSchema);
