const express = require("express");
const Recipe = require("../models/RecipeModel");
const { sendErrorResponse } = require("../utils/errorHandler");
const {recipeSchema} = require("../middlewares/validator");
const User = require("../models/User");

const createRecipe = async (req, res) => {
  try {
    const { userId } = req.user;

    // Check if file exists before accessing `req.file.path`
    const { path } = req.file;
    if (!req.file || !req.file.path) {
      return sendErrorResponse(res, 400, "No image file provided", "bad_request");
    }

    let { foodName, description, cookingDuration, ingredients, steps } = req.body;
    if(!ingredients || !steps){
        return sendErrorResponse(res, 400, "ingredients and steps are required", "bad_request");
    }
    ingredients = JSON.parse(ingredients);
    steps = JSON.parse(steps);
    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User not found", "conflict");
    }

    // Validate request body
    const { error,value } = recipeSchema.validate({
      foodName,
      description,
      cookingDuration,
      ingredients,
      steps,
    });

    if (error) {
      return sendErrorResponse(res, 400, error.details[0].message, "bad_request");
    }

    // Create and save the recipe
    const newRecipe = new Recipe({
      createdBy: userId,
      recipePicture: path,
      foodName,
      description,
      cookingDuration,
      ingredients,
      steps,
    });

    const savedRecipe = await newRecipe.save();
    return res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      recipe: savedRecipe,
    });

  } catch (error) {
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

module.exports = { createRecipe };
