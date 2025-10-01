const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');

// @route   POST /api/recipes
// @desc    Create a new recipe
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, ingredients, steps, servings, cookingTime, image } = req.body;

    // Validation
    if (!title || !description || !ingredients || !steps || !servings || !cookingTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create recipe
    const recipe = new Recipe({
      title,
      description,
      ingredients,
      steps,
      servings,
      cookingTime,
      image,
      author: req.user._id
    });

    const savedRecipe = await recipe.save();
    
    // Populate author info (without password)
    await savedRecipe.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: savedRecipe
    });

  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/recipes
// @desc    Get all recipes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { ingredients: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const recipes = await Recipe.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Recipe.countDocuments(query);

    res.json({
      success: true,
      data: recipes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/recipes/:id
// @desc    Get recipe by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('author', 'name email');

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/recipes/:id
// @desc    Update recipe
// @access  Private (only recipe author)
router.put('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Check if user is the author
    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this recipe'
      });
    }

    const { title, description, ingredients, steps, servings, cookingTime, image } = req.body;

    // Update recipe
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        title: title || recipe.title,
        description: description || recipe.description,
        ingredients: ingredients || recipe.ingredients,
        steps: steps || recipe.steps,
        servings: servings || recipe.servings,
        cookingTime: cookingTime || recipe.cookingTime,
        image: image || recipe.image
      },
      { new: true }
    ).populate('author', 'name email');

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: updatedRecipe
    });

  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/recipes/:id
// @desc    Delete recipe
// @access  Private (only recipe author)
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Check if user is the author
    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this recipe'
      });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });

  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/recipes/user/:userId
// @desc    Get recipes by user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const recipes = await Recipe.find({ author: req.params.userId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: recipes
    });

  } catch (error) {
    console.error('Get user recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;