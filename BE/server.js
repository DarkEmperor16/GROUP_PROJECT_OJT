require('dotenv').config({ path: __dirname + '/.env', override: true });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authenticateToken, authorizeRoles } = require('./src/middlewares/auth.middleware');
const authRoutes = require('./src/routes/auth.routes');
const studentRoutes = require('./src/routes/student.routes');
const teacherCourseRoutes = require('./src/routes/teacherCourse.routes');
const teacherKnowledgeRoutes = require('./src/routes/teacherKnowledge.routes');
const teacherFeedbackRoutes = require('./src/routes/teacherFeedback.routes');
const teacherHistoryRoutes = require('./src/routes/teacherHistory.routes');
const teacherDashboardRoutes = require('./src/routes/teacherDashboard.routes');
const teacherQuizQuestionRoutes = require('./src/routes/teacherQuizQuestion.routes');
const teacherQuizRoutes = require('./src/routes/teacherQuiz.routes');
const teacherProfileRoutes = require('./src/routes/teacherProfile.routes');
const teacherAiChatRoutes = require('./src/routes/teacherAiChat.routes');
const internalAiRoutes = require('./src/routes/internalAi.routes');
const aiRoutes = require('./src/routes/ai.routes');
const adminRoutes = require('./src/routes/admin.routes');
const { downloadCourseDocument } = require('./src/controllers/teacherKnowledge.controller');
const { errorHandler } = require('./src/middlewares/error.middleware');
const { xssProtection } = require('./src/middlewares/xssProtection.middleware');
const { connectDB } = require('./src/config/db');
const app = express();

app.use(cors());

app.use(express.json({ limit: '20kb' }));

// Immediate JSON parse error handler (placed right after express.json())
// This prevents raw parser errors from bubbling up as HTML/text responses.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ' });
  }
  return next(err);
});

app.use(cookieParser()); // Parse cookies (cần cho refresh token)
app.use(xssProtection); // Reject requests containing XSS payloads before they reach any controller

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Server is running successfully!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherCourseRoutes);
app.use('/api/teacher', teacherKnowledgeRoutes);
app.use('/api/teacher', teacherFeedbackRoutes);
app.use('/api/teacher', teacherHistoryRoutes);
app.use('/api/teacher', teacherDashboardRoutes);
app.use('/api/teacher', teacherQuizQuestionRoutes);
app.use('/api/teacher', teacherQuizRoutes);
app.use('/api/teacher', teacherProfileRoutes);
app.use('/api/teacher', teacherAiChatRoutes);
app.use('/api/internal/ai', internalAiRoutes);

app.get(
  '/api/course-documents/:documentId/download',
  authenticateToken,
  authorizeRoles('TEACHER'),
  downloadCourseDocument,
);

app.use('/api/ai', aiRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/api/admin/test', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
  res.json({
    message: 'Admin access granted',
    user: {
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// API-only 404: return JSON for unmatched /api routes, let non-API routes fallthrough
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
  }
  return next();
});

// Centralized error handler — MUST be registered after routes
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
