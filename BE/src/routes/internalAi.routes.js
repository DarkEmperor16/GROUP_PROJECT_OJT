const express = require('express');
const { updateDocumentStatus } = require('../controllers/teacherKnowledge.controller');

const router = express.Router();

router.post('/documents/:documentId/status', updateDocumentStatus);

// Python AI sẽ gọi endpoint này khi phát hiện Prompt Injection
router.post('/audit-log', (req, res) => {
  const { userId, ip, action, threatScore, details } = req.body;

  // TODO: BE xử lý lưu AuditLog.create(...)
  console.log('\n[SECURITY AUDIT LOG RECEIVED FROM AI]');
  console.log({ userId, ip, action, threatScore, details });

  res.status(200).json({ success: true, message: 'Audit log received' });
});

module.exports = router;
