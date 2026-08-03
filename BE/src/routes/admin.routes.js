const express = require('express');

const {
  listUsers,
  createUser,
  updateUser,
  updateUserStatus,
  listDocuments,
  createDocument,
  updateDocumentStatus,
  deleteDocument,
  listQaLogs,
  exportQaLogs,
  listDashboardLogs,
  listAuditLogs,
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getUserDetail,
  lockUser,
  unlockUser,
  deleteUser,
  restoreUser,
  resetUserPassword,
  listRoles,
  createRole,
  getRoleDetail,
  updateRole,
  deleteRole,
  listPermissions,
  assignPermissionsToRole,
  assignRoleToUser,
  getCourseEnrollments,
  saveCourseEnrollments,
  getStudentEnrollments,
  updateCourseStatus,
} = require('../controllers/admin.controller');

const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

// Allow ADMIN roles to access the admin routes
router.use(authenticateToken, authorizeRoles('ADMIN'));

// User Management
router.get('/users', listUsers);
router.get('/users/:id', getUserDetail);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/lock', lockUser);
router.patch('/users/:id/unlock', unlockUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/restore', restoreUser);
router.patch('/users/:id/reset-password', resetUserPassword);
router.patch('/users/:id/role', assignRoleToUser);

// Role & Permission Management
router.get('/roles', listRoles);
router.post('/roles', createRole);
router.get('/roles/:id', getRoleDetail);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);
router.get('/permissions', listPermissions);
router.put('/roles/:id/permissions', assignPermissionsToRole);

// Course
router.get('/courses', listCourses);
router.post('/courses', createCourse);
router.patch('/courses/:id', updateCourse);
router.patch('/courses/:id/status', updateCourseStatus);
router.delete('/courses/:id', deleteCourse);
router.get('/courses/student/enrollments', getStudentEnrollments);
router.get('/courses/:id/enrollments', getCourseEnrollments);
router.post('/courses/:id/enrollments', saveCourseEnrollments);

// Document
router.get('/documents', listDocuments);
router.post('/documents', createDocument);
router.patch('/documents/:id/status', updateDocumentStatus);
router.delete('/documents/:id', deleteDocument);

// QA
router.get('/qa', listQaLogs);
router.get('/qa/export', exportQaLogs);

// Logs
router.get('/dashboard/logs', listDashboardLogs);
router.get('/audit-logs', listAuditLogs);

module.exports = router;
