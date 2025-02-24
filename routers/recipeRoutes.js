const express = require('express');
const {createRecipe} = require('../controllers/recipeController');
const identifier = require('../middlewares/identification');
const upload = require('../middlewares/upload');
const uploadMulter = require('../middlewares/upload');
const router = express.Router();

router.post('/create-recipe', identifier, uploadMulter('recipePicture'), createRecipe);

module.exports = router;