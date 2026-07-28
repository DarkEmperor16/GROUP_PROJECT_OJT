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
<<<<<<< HEAD
const aiRoutes = require('./src/routes/ai.routes');
=======
const adminRoutes = require('./src/routes/admin.routes');
>>>>>>> feature/admin-backend-api

const { errorHandler } = require('./src/middlewares/error.middleware');
const { connectDB } = require('./src/config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser()); // Parse cookies (cần cho refresh token)

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
<<<<<<< HEAD
app.use('/api/ai', aiRoutes);
=======
app.use('/api/admin', adminRoutes);
>>>>>>> feature/admin-backend-api

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
