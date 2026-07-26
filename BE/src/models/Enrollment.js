const mongoose = require('mongoose');

/**
 * Enrollment — records a student's enrolment in a course.
 *
 * Relationships:
 *  - studentId → User (role: STUDENT)
 *  - courseId  → Course
 *
 * Used by:
 *  - GET /api/student/questions  (scope questions to enrolled courses only)
 *  - Future: enrolment management endpoints
 */
const enrollmentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['ACTIVE', 'DROPPED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────
// Prevent duplicate enrolments for the same student + course pair
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Fast lookup: all active courses a student is enrolled in
enrollmentSchema.index({ studentId: 1, status: 1 });

// Fast lookup: all students enrolled in a specific course
enrollmentSchema.index({ courseId: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
