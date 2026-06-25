const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authenticateToken, authorizeRoles } = require('./src/middlewares/auth.middleware');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
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
