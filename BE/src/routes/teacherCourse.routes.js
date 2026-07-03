const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { listMyCourses, getMyCourseDetail } = require('../controllers/teacherCourse.controller');

const router = express.Router();

router.get('/courses', authenticateToken, authorizeRoles('TEACHER'), listMyCourses);
router.get('/courses/:id', authenticateToken, authorizeRoles('TEACHER'), getMyCourseDetail);

module.exports = router;
