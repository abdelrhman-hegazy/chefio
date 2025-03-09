const express = require("express");
const Recipe = require("../models/RecipeModel");
const { sendErrorResponse } = require("../utils/errorHandler");
const { recipeSchema } = require("../middlewares/validator");
const User = require("../models/User");
const Category = require("../models/Category");

//get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error });
  }
};

//create recipe
const createRecipe = async (req, res) => {
  try {
    const { userId } = req.user;
    // Check if file exists before accessing `req.file.path`
    if (!req.file || !req.file.path) {
      return sendErrorResponse(
        res,
        400,
        "No image file provided",
        "bad_request"
      );
    }
    const { path } = req.file;

    let {
      foodName,
      description,
      cookingDuration,
      ingredients,
      steps,
      categoryId,
    } = req.body;
    if (!ingredients || !steps) {
      return sendErrorResponse(
        res,
        400,
        "ingredients and steps are required",
        "bad_request"
      );
    }
    ingredients = JSON.parse(ingredients);
    steps = JSON.parse(steps);

    if (!categoryId) {
      const defaultCategory = await Category.findOne({
        name: "General Dishes",
      });
      if (!defaultCategory) {
        return sendErrorResponse(
          res,
          500,
          "Default category not found",
          "server_error"
        );
      }
      categoryId = defaultCategory._id;
    }
    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User not found", "conflict");
    }

    // Validate request body
    const { error, value } = recipeSchema.validate({
      foodName,
      description,
      cookingDuration,
      ingredients,
      steps,
    });

    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "bad_request"
      );
    }

    // Create and save the recipe
    const newRecipe = new Recipe({
      createdBy: userId,
      category: categoryId,
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
const getRecipe = async (req, res) => {
  try {
    const { search, category, cookingDuration, sortBy, order, page, limit } =
      req.query;
    let filter = {};
    // search
    if (search) filter.foodName = { $regex: search, $options: "i" };
    //filter
    if (category) {
      const categorId = await Category.find({ name: category });
      if (!categorId) {
        return sendErrorResponse(res, 404, "Category not found", "conflict");
      }
      filter.category = categorId[0]._id;
    }

    if (cookingDuration) {
      const duration = cookingDuration.split("-").map(Number);
      if (duration.length === 2) {
        filter.cookingDuration = { $gte: duration[0], $lte: duration[1] };
      } else if (!isNaN(duration[0])) {
        filter.cookingDuration = { $lte: duration[0] };
      }
    }
    // sort
    const sort = {};
    const validSortFields = [
      "foodName",
      "cookingDuration",
      "createdAt",
      "likes",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sort[sortField] = order === "asc" ? 1 : -1; // 1 for ascending A-Z, -1 for descending

    // pagination
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const recipes = await Recipe.find(filter)
      .populate({ path: "createdBy", select: "username profilePicture" })
      .populate({ path: "category", select: "name" })
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    const totalRecipes = await Recipe.countDocuments(filter);
    return res.status(200).json({
      success: true,
      totalRecipes,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecipes / limitNumber),
      recipes,
    });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
  }
};

module.exports = { createRecipe, getCategories, getRecipe };
