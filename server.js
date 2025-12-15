const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use(logger.logRequest);

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

// Error handling middleware
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tudungsaji', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Database Connected', {
    database: 'MongoDB',
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tudungsaji'
  });
})
.catch((err) => {
  logger.logError(err, {
    context: 'MongoDB Connection',
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tudungsaji'
  });
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Health check endpoint
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

// API health endpoint
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

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
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