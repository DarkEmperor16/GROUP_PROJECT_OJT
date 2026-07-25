const mongoose = require('mongoose');

/**
 * QaHistory — records every AI query a student makes within a course.
 *
 * Relationships:
 *  - studentId → User (role: STUDENT)
 *  - courseId  → Course
 *
 * Used by:
 *  - GET  /api/student/history      (list with pagination)
 *  - POST /api/student/ask-ai       (creates a record after AI responds)
 */
const qaHistorySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'AI answer is required'],
      trim: true,
    },
  },
  {
    // createdAt used for sort/display; updatedAt retained for audit
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────
// Primary access pattern: a student's history, newest first (paginated)
qaHistorySchema.index({ studentId: 1, createdAt: -1 });

// Secondary: filter by course within a student's history
qaHistorySchema.index({ studentId: 1, courseId: 1, createdAt: -1 });

module.exports = mongoose.model('QaHistory', qaHistorySchema);
