// Import mongoose ODM
const mongoose = require('mongoose');

// Define schema for recipe collection
const recipeSchema = new mongoose.Schema({
  // Recipe title
  title: {
    type: String,
    required: true
  },
  // Short description of the recipe
  description: {
    type: String,
    required: true
  },
  // List of ingredients used in the recipe
  ingredients: [{
    type: String,
    required: true
  }],
  // Step-by-step cooking instructions
  steps: [{
    type: String,
    required: true
  }],
  // Number of servings
  servings: {
    type: Number,
    required: true
  },
  // Cooking time in minutes
  cookingTime: {
    type: Number,
    required: true
  },
  // Recipe image (URL or base64 encoded string)
  image: {
    type: String // URL or base64
  },
  // Reference to the user who created the recipe
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Creation timestamp (legacy, overridden by timestamps option)
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Automatically manage createdAt and updatedAt fields
  timestamps: true
});

// Export Recipe model
module.exports = mongoose.model('Recipe', recipeSchema);
