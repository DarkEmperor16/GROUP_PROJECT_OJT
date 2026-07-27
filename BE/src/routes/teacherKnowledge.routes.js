const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { uploadCourseDocument } = require('../middlewares/upload.middleware');
const {
  uploadDocument,
  listCourseDocuments,
  getDocumentDetail,
  reindexDocument,
  updateDocumentActiveStatus,
  updateDocumentMetadata,
  deleteDocument,
} = require('../controllers/teacherKnowledge.controller');

const router = express.Router();

router.post(
  '/courses/:courseId/documents',
  authenticateToken,
  authorizeRoles('TEACHER'),
  uploadCourseDocument.fields([
    { name: 'file', maxCount: 1 },
    { name: 'document', maxCount: 1 },
    { name: 'documentFile', maxCount: 1 },
  ]),
  uploadDocument,
);

router.get('/courses/:courseId/documents', authenticateToken, authorizeRoles('TEACHER'), listCourseDocuments);
router.get('/documents/:documentId', authenticateToken, authorizeRoles('TEACHER'), getDocumentDetail);
router.post('/documents/:documentId/reindex', authenticateToken, authorizeRoles('TEACHER'), reindexDocument);
router.patch('/documents/:documentId', authenticateToken, authorizeRoles('TEACHER'), updateDocumentMetadata);
router.patch('/documents/:documentId/status', authenticateToken, authorizeRoles('TEACHER'), updateDocumentActiveStatus);
router.delete('/documents/:documentId', authenticateToken, authorizeRoles('TEACHER'), deleteDocument);

module.exports = router;
