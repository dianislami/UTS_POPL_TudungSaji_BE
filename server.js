const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// --- Middleware Configuration ---
app.use(cors({
    origin: isProd ? 'https://uts-popl-tudung-saji.vercel.app' : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// --- Static Folder Setup ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// --- Request Logging ---
app.use((req, res, next) => {
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl
  });
  next();
});

// --- Routes Configuration ---
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const profileRoutes = require('./routes/profile');

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/profile', profileRoutes);

// --- Health Check ---
app.get('/', (req, res) => {
    res.json({ status: 'Server Running', timestamp: new Date() });
});

// --- Database Connection ---
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in environment variables.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('MongoDB Connection Failed:', err.message);
  }
};

// --- Server Initialization ---
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

// --- Error Handling ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = { app, server };