const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authenticateToken, authorizeRoles } = require('./src/middlewares/auth.middleware');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
const teacherCourseRoutes = require('./src/routes/teacherCourse.routes');
const teacherKnowledgeRoutes = require('./src/routes/teacherKnowledge.routes');
const teacherFeedbackRoutes = require('./src/routes/teacherFeedback.routes');
const teacherHistoryRoutes = require('./src/routes/teacherHistory.routes');
const teacherDashboardRoutes = require('./src/routes/teacherDashboard.routes');
const teacherQuizQuestionRoutes = require('./src/routes/teacherQuizQuestion.routes');
const internalAiRoutes = require('./src/routes/internalAi.routes');
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
app.use('/api/teacher', teacherCourseRoutes);
app.use('/api/teacher', teacherKnowledgeRoutes);
app.use('/api/teacher', teacherFeedbackRoutes);
app.use('/api/teacher', teacherHistoryRoutes);
app.use('/api/teacher', teacherDashboardRoutes);
app.use('/api/teacher', teacherQuizQuestionRoutes);
app.use('/api/internal/ai', internalAiRoutes);
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

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: err.message,
    });
  }

  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(400).json({
      message: err.message,
    });
  }

  return res.status(500).json({
    message: 'Internal server error',
  });
});

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
