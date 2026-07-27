const mongoose = require('mongoose');

/**
 * Course — a subject/module created by a Teacher that Students can access.
 *
 * Relationships:
 *  - teacherId / teacherIds → User (role: TEACHER)
 *  - Referenced by: Quiz, QaHistory, CourseDocument, etc.
 */
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
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
    },
    teacherIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

// Ensure title/name and teacherId/teacherIds stay synchronized on save
courseSchema.pre('save', function (next) {
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.title) this.title = this.name;

  if (this.teacherId && (!this.teacherIds || this.teacherIds.length === 0)) {
    this.teacherIds = [this.teacherId];
  }
  if (this.teacherIds && this.teacherIds.length > 0 && !this.teacherId) {
    this.teacherId = this.teacherIds[0];
  }
  if (typeof next === 'function') next();
});

// ── Indexes ────────────────────────────────────────────────────
courseSchema.index({ status: 1 });
courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ teacherId: 1, status: 1 });
courseSchema.index({ teacherIds: 1, status: 1 });

module.exports = mongoose.model('Course', courseSchema);
