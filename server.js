console.log('DEBUG: Starting...');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
console.log('DEBUG: Before logger');
const logger = require('./utils/logger');
console.log('DEBUG: After logger');

// Import routes
console.log('DEBUG: Before auth routes');
const authRoutes = require('./routes/auth');
console.log('DEBUG: After auth routes');
const recipeRoutes = require('./routes/recipes');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// CORS: ketat di production, bebas di development
app.use(
  cors({
    origin: isProd
      ? 'https://uts-popl-tudung-saji.vercel.app' // deploy
      : true, // lokal: allow semua origin biar ga ribet
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    body: req.method !== 'GET' ? req.body : undefined,
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Health checks
app.get('/', (req, res) => {
  res.json({
    message: 'Tudungsaji API Server is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// MongoDB Connection (NON-BLOCKING)
const connectDB = async () => {
  console.log('DEBUG: Before MongoDB connection');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

  if (!process.env.MONGODB_URI) {
    console.log('No MONGODB_URI - skipping DB connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: isProd ? 5000 : 10000,
      socketTimeoutMS: isProd ? 10000 : 20000,
      bufferCommands: false,
      family: 4,
    });

    logger.info('MongoDB Connected', {
      service: 'tudungsaji-backend',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    console.error('MongoDB failed:', err.message);
    // server tetap jalan tanpa DB
  }
};

// Start server dulu
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
  });
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
  });
});

module.exports = { app, server };
