const express = require('express');
const {createRecipe, getCategories, getRecipe, getRecipeById} = require('../controllers/recipeController');
const identifier = require('../middlewares/identification');
const uploadMulter = require('../middlewares/upload');
const router = express.Router();

router.get('/get-categories', identifier ,getCategories);
router.post('/create-recipe', identifier, uploadMulter('recipePicture'), createRecipe);
router.get('/get-recipes', identifier, getRecipe);
router.get('/get-recipe/:id', identifier, getRecipeById);
module.exports = router;