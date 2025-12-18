// Import required dependencies
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Inisialisasi Express router
const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Extract user input from request body
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill in all fields' 
      });
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    // Enforce minimum password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }
    }

    // Create new user instance
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password
    });

    // Save user to database
    await user.save();

    // Generate authentication token
    const token = generateToken(user._id);

    // Send success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    // Log registration error
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: messages[0] 
      });
    }

    // Handle server errors
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // Extract login credentials
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Compare provided password with stored hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate authentication token
    const token = generateToken(user._id);

    // Send login success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    // Log login error
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Validate token existence
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    // Handle invalid token or missing user
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    // Return authenticated user data
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    // Handle token verification errors
    console.error('Get user error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
});

// Export authentication routes
module.exports = router;
