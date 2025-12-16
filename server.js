console.log('DEBUG: Starting...'); const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
console.log('DEBUG: Before logger'); const logger = require('./utils/logger'); console.log('DEBUG: After logger');

// Import routes
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');

// Load environment variables
if (process.env.NODE_ENV !== 'production') { dotenv.config(); }

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tudungsaji')
.then(() => {
  logger.info('Database Connected', {
    database: 'MongoDB',
    uri: process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB'
  });
})
.catch((err) => {
  logger.logError(err, {
    context: 'MongoDB Connection',
    uri: process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB'
  });
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Health check endpoints
app.get('/', (req, res) => {
  logger.info('Health Check', {
    endpoint: '/',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
  res.json({
    message: 'Tudungsaji API Server is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  logger.info('API Health Check', {
    endpoint: '/api/health',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });

  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  logger.warn('Route Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handling middleware (must be last)
app.use((err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

// Uncaught exception handling
process.on('uncaughtException', (error) => {
  logger.logError(error, { context: 'Uncaught Exception' });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info('Server Started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

module.exports = { app, server };
