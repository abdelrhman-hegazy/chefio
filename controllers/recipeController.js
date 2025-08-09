const Recipe = require("../models/RecipeModel");
const Category = require("../models/CategoryModel");
const { sendPushNotification } = require("../services/notificationService");
const ensureUserExists = require("../helpers/ensureUserExists");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const CategoryRepository = require("../repositories/categories.repository");
const RecipeRepository = require("../repositories/recipe.repository");
const FollowRepository = require("../repositories/follow.repository");
const LikeRepository = require("../repositories/like.repository");

//get all categories
const getCategories = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  await ensureUserExists(userId);
  const categories = await CategoryRepository.findAll();
  return res.status(200).json({ success: true, categories });
});

//create recipe
const createRecipe = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  await ensureUserExists(userId);

  let {
    foodName,
    description,
    cookingDuration,
    ingredients,
    steps,
    categoryId,
  } = req.body;

  const files = req.files;
  const recipePicture = files.find(
    (file) => file.fieldname === "recipePicture"
  );
  if (!recipePicture) {
    return next(new AppError("Recipe picture is required", 400, "bad_request"));
  }
  const finalSteps = steps.map((stepObj) => {
    const imgFile = files.find((file) => file.fieldname === stepObj.stepImage);
    return {
      step: stepObj.step,
      stepImage: imgFile ? imgFile.path : null,
    };
  });

  if (!categoryId) {
    const defaultCategory = await CategoryRepository.findOne({
      name: "General Dishes",
    });

    if (!defaultCategory) {
      return next(new AppError("Default category not found", 404, "not_found"));
    }
    categoryId = defaultCategory._id;
  }

  const savedRecipe = await RecipeRepository.create({
    createdBy: userId,
    category: categoryId,
    recipePicture: recipePicture.path,
    foodName,
    description,
    cookingDuration,
    ingredients,
    steps: finalSteps,
  });

  // Send push notification to followers
  const followers = await FollowRepository.findFollowersRecipe({ userId });

  const followerIds = followers.map((f) => f.follower.toString());
  Promise.all(
    followerIds.map((followerId) =>
      sendPushNotification({
        receiver: followerId,
        sender: userId,
        type: "new_recipe",
        recipeId: savedRecipe._id.toString(),
        recipePicture: savedRecipe.recipePicture,
        isFollowed: true,
      })
    )
  );
  return res.status(201).json({
    success: true,
    message: "Recipe created successfully",
    recipe: savedRecipe,
  });
});
// get recipe (pagination)
const getRecipe = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  await ensureUserExists(userId);

  const { search, category, cookingDuration, sortBy, order, page, limit } =
    req.query;

  let filter = {};
  // search
  if (search) filter.foodName = { $regex: search.trim(), $options: "i" };
  //filter
  if (category) {
    const categorDoc = await Category.findOne({ name: category }).select("_id");
    if (!categorDoc) {
      return next(new AppError("Category not found", 404, "not_found"));
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
  const validSortFields = ["foodName", "cookingDuration", "createdAt", "likes"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  sort[sortField] = order === "asc" ? 1 : -1; // 1 for ascending A-Z, -1 for descending

  // pagination
  const pageNumber = Math.max(parseInt(page) || 1, 1);
  const limitNumber = Math.max(parseInt(limit) || 10, 1);
  const skip = (pageNumber - 1) * limitNumber;

  const recipes = await RecipeRepository.findByFilterRecipe(
    filter,
    sort,
    skip,
    limitNumber
  );

  let likedRecipes = await LikeRepository.findLikesRecipe(userId, recipes);
  let likedRecipeIds = new Set(
    likedRecipes.map((like) => like.recipe.toString())
  );

  const updateRecipes = recipes.map((recipe) => {
    return {
      ...recipe,
      isLiked: likedRecipeIds.has(recipe._id.toString()),
    };
  });
  const totalRecipes = await Recipe.countDocuments(filter);
  return res.status(200).json({
    success: true,
    totalRecipes,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalRecipes / limitNumber),
    recipes: updateRecipes,
  });
});

// get recipeById
const getRecipeById = catchAsync(async (req, res, next) => {
  const recipeId = req.params.id;
  const { userId } = req.user;
  await ensureUserExists(userId);

  const recipe = await RecipeRepository.findByIdRecipe(recipeId);
  if (!recipe) {
    return next(new AppError("Recipe not found", 404, "not_found"));
  }

  let likedRecipe = await LikeRepository.findOne({
    user: userId,
    recipe: recipeId,
  });
  let isLiked = false;
  if (likedRecipe) {
    isLiked = true;
  }

  const recipeWithLikeStatus = {
    ...recipe,
    isLiked: isLiked,
  };
  return res.status(200).json({ success: true, recipe: recipeWithLikeStatus });
});

// update recipe
const updateRecipe = catchAsync(async (req, res, next) => {
  const recipeId = req.params.id;
  const { userId } = req.user;

  await ensureUserExists(userId);

  const existingRecipe = await RecipeRepository.findById(recipeId);
  if (!existingRecipe) {
    return next(new AppError("Recipe not found", 404, "not_found"));
  }

  let {
    foodName,
    description,
    cookingDuration,
    ingredients,
    steps,
    categoryId,
  } = req.body;

  if (!categoryId) {
    categoryId = existingRecipe.category;
  }

  const files = req.files;
  let recipePicture = files.find((file) => file.fieldname === "recipePicture");
  if (recipePicture) {
    recipePicture = recipePicture.path;
  }

  const finalSteps = steps.map((stepObj) => {
    const imgFile = files.find((file) => file.fieldname === stepObj.stepImage);
    return {
      step: stepObj.step,
      stepImage: imgFile ? imgFile.path : null, // Use the file path if it exists
    };
  });
  const updatedRecipe = await RecipeRepository.updateById(recipeId, {
    foodName,
    description,
    cookingDuration,
    ingredients,
    steps: finalSteps,
    category: categoryId,
    recipePicture,
  });

  return res.status(200).json({
    success: true,
    message: "Recipe updated successfully",
    recipe: updatedRecipe,
  });
});

// delete recipe
const deleteRecipe = catchAsync(async (req, res, next) => {
  const recipeId = req.params.id;
  const { userId } = req.user;
  await ensureUserExists(userId);
  const existingRecipe = await RecipeRepository.findById(recipeId);
  if (!existingRecipe) {
    return next(new AppError("Recipe not found", 404, "not_found"));
  }

  // Delete the recipe
  await RecipeRepository.deleteById(recipeId);
  return res
    .status(200)
    .json({ success: true, message: "Recipe deleted successfully" });
});

module.exports = {
  createRecipe,
  getCategories,
  getRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
};
