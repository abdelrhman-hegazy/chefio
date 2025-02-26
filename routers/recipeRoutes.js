const express = require('express');
const {createRecipe, getCategories} = require('../controllers/recipeController');
const identifier = require('../middlewares/identification');
const upload = require('../middlewares/upload');
const uploadMulter = require('../middlewares/upload');
const router = express.Router();

router.get('/get-categories', identifier ,getCategories);
router.post('/create-recipe', identifier, uploadMulter('recipePicture'), createRecipe);

module.exports = router;