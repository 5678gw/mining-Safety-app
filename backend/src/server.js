const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const examRoutes = require('./routes/exam');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    app: 'Mining Safety Learning App'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exam', examRoutes);

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'Mining Safety Learning App API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      student: '/api/student',
      admin: '/api/admin',
      exam: '/api/exam'
    },
    docs: '/api/docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   🏔️  MINING SAFETY LEARNING APP                   ║
║   Backend Server Started                           ║
╠════════════════════════════════════════════════════╣
║   Port: ${PORT}                                    ║
║   Environment: ${process.env.NODE_ENV}            ║
║   Database: ${process.env.DB_NAME}                ║
║   API: http://localhost:${PORT}/api              ║
╚════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
