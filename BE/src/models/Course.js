const mongoose = require('mongoose');

/**
 * Course — a subject/module created by a Teacher that Students can access.
 *
 * Relationships:
 *  - teacherId → User (role: TEACHER)
 *  - Referenced by: Quiz, QaHistory
 */
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
      // e.g. "PRF192", "DBI201"
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────
// Fast filter on active courses + uniqueness guard on code
courseSchema.index({ status: 1 });
courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ teacherId: 1, status: 1 });

module.exports = mongoose.model('Course', courseSchema);
