const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { uploadCourseDocument } = require('../middlewares/upload.middleware');
const {
  uploadDocument,
  listCourseDocuments,
  getDocumentDetail,
  reindexDocument,
} = require('../controllers/teacherKnowledge.controller');

const router = express.Router();

router.post(
  '/courses/:courseId/documents',
  authenticateToken,
  authorizeRoles('TEACHER'),
  uploadCourseDocument.single('file'),
  uploadDocument,
);

router.get('/courses/:courseId/documents', authenticateToken, authorizeRoles('TEACHER'), listCourseDocuments);
router.get('/documents/:documentId', authenticateToken, authorizeRoles('TEACHER'), getDocumentDetail);
router.post('/documents/:documentId/reindex', authenticateToken, authorizeRoles('TEACHER'), reindexDocument);

module.exports = router;
