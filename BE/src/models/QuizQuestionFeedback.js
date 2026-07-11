const mongoose = require('mongoose');

const quizQuestionFeedbackSchema = new mongoose.Schema(
  {
    quizQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizQuestion',
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

quizQuestionFeedbackSchema.index({ quizQuestionId: 1, studentId: 1 }, { unique: true });
quizQuestionFeedbackSchema.index({ quizQuestionId: 1, rating: 1 });

module.exports = mongoose.model('QuizQuestionFeedback', quizQuestionFeedbackSchema);