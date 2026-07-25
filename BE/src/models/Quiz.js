const mongoose = require('mongoose');

/**
 * Question — embedded sub-document inside a Quiz.
 *
 * SECURITY: `correctAnswer` is stored in DB but MUST be stripped
 * from any response sent to the student before submission.
 * Only reveal it inside the submit result.
 */
const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 6,
        message: 'A question must have between 2 and 6 options',
      },
      required: [true, 'Options are required'],
    },
    // 0-based index into options[] — NEVER sent to client before submit
    correctAnswer: {
      type: Number,
      required: [true, 'Correct answer index is required'],
      min: 0,
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
      // Shown to student after they submit
    },
  },
  { _id: true }, // keep sub-doc IDs so we can reference per-question results
);

/**
 * Quiz — a set of questions assigned to a Course.
 *
 * Relationships:
 *  - courseId → Course
 *  - Referenced by: QaHistory (quiz attempts)
 */
const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    // Time limit in minutes; 0 = no limit
    timeLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'A quiz must have at least one question',
      },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
      default: 'DRAFT',
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────
// Student list page: list ACTIVE quizzes by course
quizSchema.index({ courseId: 1, status: 1 });
quizSchema.index({ status: 1 });

// ── Instance helpers ───────────────────────────────────────────

/**
 * Returns the quiz as a plain object safe to send to the student.
 * Strips `correctAnswer` and `explanation` from all questions.
 * Call this for GET /quizzes/:id (before submission).
 */
quizSchema.methods.toStudentView = function () {
  const obj = this.toObject();
  obj.questions = obj.questions.map(({ correctAnswer, explanation, ...rest }) => rest);
  return obj;
};

module.exports = mongoose.model('Quiz', quizSchema);
