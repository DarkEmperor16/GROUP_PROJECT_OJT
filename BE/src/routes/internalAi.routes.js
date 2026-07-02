const express = require('express');
const { updateDocumentStatus } = require('../controllers/teacherKnowledge.controller');

const router = express.Router();

router.post('/documents/:documentId/status', updateDocumentStatus);

module.exports = router;
