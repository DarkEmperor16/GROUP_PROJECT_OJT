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
} = require('../controllers/admin.controller');

const {
  authenticateToken,
  authorizeRoles,
} = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);

// Course

router.get('/courses', listCourses);
router.post('/courses', createCourse);
router.patch('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

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

