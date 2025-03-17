const express = require("express");
const Recipe = require("../models/RecipeModel");
const { sendErrorResponse } = require("../utils/errorHandler");
const {
  recipeSchema,
  recipeUpdateSchema,
} = require("../middlewares/validator");
const User = require("../models/UserModel");
const Category = require("../models/CategoryModel");
const { default: mongoose } = require("mongoose");

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
    console.log("req.body", req.body);

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
// get recipe (pagination)
const getRecipe = async (req, res) => {
  try {
    const { search, category, cookingDuration, sortBy, order, page, limit } =
      req.query;
    const { userId } = req.user;
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User not found", "conflict");
    }
    let filter = {};
    // search
    if (search) filter.foodName = { $regex: search.trim(), $options: "i" };
    //filter
    if (category) {
      const categorDoc = await Category.findOne({ name: category }).select(
        "_id"
      );
      if (!categorDoc) {
        return sendErrorResponse(res, 404, "Category not found", "conflict");
      }
      filter.category = categorDoc._id;
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
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.max(parseInt(limit) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const recipes = await Recipe.find(filter)
      .populate({ path: "createdBy", select: "username profilePicture" })
      .populate({ path: "category", select: "name" })
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .select("recipePicture likes foodName cookingDuration createdAt")
      .lean();

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
    console.log(error);
  }
};

// get recipeById
const getRecipeById = async (req, res) => {
  const recipeId = req.params.id;
  const { userId } = req.user;
  try {
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User not found", "conflict");
    }
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return sendErrorResponse(res, 400, "Invalid recipe id", "bad_request");
    }

    const recipe = await Recipe.findById(recipeId)
      .populate({
        path: "createdBy",
        select: "username profilePicture",
      })
      .populate({
        path: "category",
        select: "name",
      });
    if (!recipe) {
      sendErrorResponse(res, 404, "Recipe not found", "not_found");
    }
    return res.status(200).json({ success: true, recipe });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};

// update recipe
const updateRecipe = async (req, res) => {
  const recipeId = req.params.id;
  const { userId } = req.user;

  const exisitingRecipe = await Recipe.findById(recipeId);
  if (!exisitingRecipe) {
    return sendErrorResponse(res, 404, "Recipe not found", "not_found");
  }
  if (exisitingRecipe.createdBy.toString() !== userId) {
    return sendErrorResponse(
      res,
      403,
      "You are not authorized to update this recipe",
      "forbidden"
    );
  }

  let {
    foodName,
    description,
    cookingDuration,
    ingredients,
    steps,
    categoryId,
  } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return sendErrorResponse(res, 400, "Invalid recipe id", "bad_request");
    }

    if (ingredients) ingredients = JSON.parse(ingredients);
    if (steps) steps = JSON.parse(steps);

    if (!categoryId) {
      categoryId = exisitingRecipe.category;
    }

    const { error } = recipeUpdateSchema.validate({
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
    let recipePicture = exisitingRecipe.recipePicture;
    if (req.file && req.file.path) {
      recipePicture = req.file.path;
    }
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      {
        foodName,
        description,
        cookingDuration,
        ingredients,
        steps,
        category: categoryId,
        recipePicture,
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Recipe updated successfully",
      recipe: updatedRecipe,
    });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};

// delete recipe
const deleteRecipe = async (req, res) => {
  const recipeId = req.params.id;
  const { userId } = req.user;
  const existingRecipe = await Recipe.findById(recipeId);
  if (!existingRecipe) {
    return sendErrorResponse(res, 404, "Recipe not found", "not_found");
  }
  if (existingRecipe.createdBy.toString() !== userId) {
    return sendErrorResponse(
      res,
      403,
      "You are not authorized to delete this recipe",
      "forbidden"
    );
  }
  try {
    await Recipe.findByIdAndDelete(recipeId);
    return res
      .status(200)
      .json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};
// like recipe
const likeRecipe = async (req, res) => {
  const recipeId = req.params.id;
  const { userId } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return sendErrorResponse(res, 400, "Invalid recipe id", "bad_request");
    }
    const existingRecipe = await Recipe.findById(recipeId);
    if (!existingRecipe) {
      return sendErrorResponse(res, 404, "Recipe not found", "not_found");
    }
    const hasLiked = existingRecipe.likes.includes(userId);
    let msg;
    if (hasLiked) {
      //unlike recipe
      existingRecipe.likes = existingRecipe.likes.filter(
        (id) => id.toString() !== userId
      );
      msg = "Recipe unliked successfully";
    } else {
      //like recipe
      existingRecipe.likes.push(userId);
      msg = "Recipe liked successfully";
    }
    existingRecipe.likesConut = existingRecipe.likes.length;
    await existingRecipe.save();

    return res.status(200).json({ success: true, message: msg });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};
module.exports = {
  createRecipe,
  getCategories,
  getRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
};
