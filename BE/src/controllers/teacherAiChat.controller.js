const mongoose = require('mongoose');
const Course = require('../models/Course');
const { sendQuestionToAI } = require('../utils/aiService');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

async function resolveTeacherCourse(courseId, teacherId) {
  const query = {
    teacherIds: teacherId,
    status: 'ACTIVE',
  };

  if (courseId) {
    if (!isValidObjectId(courseId)) {
      return { error: { statusCode: 400, message: 'Invalid courseId' } };
    }

    query._id = courseId;
  }

  const course = await Course.findOne(query);

  if (!course) {
    return { error: { statusCode: 404, message: 'Course not found or you are not assigned to this course' } };
  }

  return { course };
}

async function askTeacherAi(req, res) {
  const { question, courseId } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      message: 'question is required',
    });
  }

  const courseResult = await resolveTeacherCourse(courseId, req.user._id);

  if (courseResult.error) {
    return res.status(courseResult.error.statusCode).json({ message: courseResult.error.message });
  }

  const answer = await sendQuestionToAI({
    question: question.trim(),
    courseCode: courseResult.course.code,
    courseTitle: courseResult.course.name,
  });

  return res.json({
    question: question.trim(),
    answer,
    course: {
      id: courseResult.course._id,
      code: courseResult.course.code,
      name: courseResult.course.name,
    },
    createdAt: new Date().toISOString(),
  });
}

module.exports = {
  askTeacherAi,
};
