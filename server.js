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

// **FIX CORS - Tanpa app.options('*')**
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://uts-popl-tudung-saji.vercel.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    body: req.method !== 'GET' ? req.body : undefined
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
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString()
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
      serverSelectionTimeoutMS: 10000,  // 10 detik lokal
      socketTimeoutMS: 20000,
      bufferCommands: false,
      family: 4
    });
    logger.info('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB failed:', err.message);
    // Server tetep jalan
  }
};

// Start server DULU
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
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message 
  });
});

module.exports = { app, server };
