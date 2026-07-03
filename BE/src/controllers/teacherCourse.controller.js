const mongoose = require('mongoose');
const Course = require('../models/Course');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function mapCourse(course) {
  return {
    id: course._id,
    name: course.name,
    code: course.code,
    status: course.status,
    teacherIds: course.teacherIds,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

async function listMyCourses(req, res) {
  const status = req.query.status;
  const query = {
    teacherIds: req.user._id,
  };

  if (status) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status filter',
      });
    }

    query.status = status;
  }

  const courses = await Course.find(query).sort({ updatedAt: -1 }).lean();

  return res.json({
    courses: courses.map(mapCourse),
  });
}

async function getMyCourseDetail(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid course id',
    });
  }

  const course = await Course.findOne({
    _id: id,
    teacherIds: req.user._id,
  }).lean();

  if (!course) {
    return res.status(404).json({
      message: 'Course not found or you are not assigned to this course',
    });
  }

  return res.json({
    course: mapCourse(course),
  });
}

module.exports = {
  listMyCourses,
  getMyCourseDetail,
};
