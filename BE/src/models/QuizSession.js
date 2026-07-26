const mongoose = require('mongoose');

const quizSessionSchema = new mongoose.Schema(
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
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
      },
    ],
    status: {
      type: String,
      enum: ['STARTED', 'COMPLETED', 'ABANDONED'],
      default: 'STARTED',
      index: true,
    },
    score: {
      type: Number,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

quizSessionSchema.index({ courseId: 1, startedAt: -1 });
quizSessionSchema.index({ courseId: 1, studentId: 1, startedAt: -1 });

module.exports = mongoose.model('QuizSession', quizSessionSchema);