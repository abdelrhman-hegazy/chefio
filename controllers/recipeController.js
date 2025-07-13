const Recipe = require("../models/RecipeModel");
const { sendErrorResponse } = require("../utils/errorResponse");
const User = require("../models/UserModel");
const Category = require("../models/CategoryModel");
const Like = require("../models/LikeModel");
const { sendPushNotification } = require("../services/notificationService");
const Follow = require("../models/FollowModel");
const { default: mongoose } = require("mongoose");
const { checkUserById } = require("../utils/userChecks");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
//get all categories
const getCategories = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  if (!(await checkUserById(userId))) {
    return next(new AppError("User not found", 404, "not_found"));
  }
  const categories = await Category.find();
  return res.status(200).json({ success: true, categories });
});

//create recipe
const createRecipe = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  // Check if file exists before accessing `req.file.path`
  if (!req.files?.recipePicture?.[0]?.path) {
    return next(new AppError("Recipe picture is required", 400, "bad_request"));
  }
  const { path } = req.files["recipePicture"][0];

  let {
    foodName,
    description,
    cookingDuration,
    ingredients,
    steps,
    categoryId,
  } = req.body;

  if (!ingredients || !steps) {
    return next(
      new AppError("Ingredients and steps are required", 400, "bad_request")
    );
  }

  const stepImages = req.files["stepImage"];

  steps = steps.map((step, index) => ({
    step: step.step || step,
    stepImage: stepImages[index] ? stepImages[index].path : null,
  }));
  if (!categoryId) {
    const defaultCategory = await Category.findOne({
      name: "General Dishes",
    });

    if (!defaultCategory) {
      return next(new AppError("Default category not found", 404, "not_found"));
    }
    categoryId = defaultCategory._id;
  }
  // Check if user exists
  if (!(await checkUserById(userId))) {
    return next(new AppError("User not found", 404, "not_found"));
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
  // Send push notification to followers
  const followers = await Follow.find({ following: userId }).select("follower");
  const followerIds = followers.map((f) => f.follower.toString());

  if (followerIds.length > 0) {
    for (const followerId of followerIds) {
      await sendPushNotification({
        receiver: followerId,
        sender: userId,
        type: "new_recipe",
        recipeId: savedRecipe._id.toString(),
        recipePicture: savedRecipe.recipePicture,
        isFollowed: true,
      });
    }
  }
  return res.status(201).json({
    success: true,
    message: "Recipe created successfully",
    recipe: savedRecipe,
  });
});
// get recipe (pagination)
const getRecipe = catchAsync(async (req, res, next) => {
  const { search, category, cookingDuration, sortBy, order, page, limit } =
    req.query;
  const { userId } = req.user;
  const existingUser = await checkUserById(userId);
  if (!existingUser)
    return next(new AppError("User not found", 404, "not_found"));

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

  const recipes = await Recipe.find(filter)
    .populate({ path: "createdBy", select: "username profilePicture" })
    .populate({ path: "category", select: "name" })
    .sort(sort)
    .skip(skip)
    .limit(limitNumber)
    .select("recipePicture likesCount foodName cookingDuration createdAt")
    .lean();

  let likedRecipes = await Like.find({
    user: userId,
    recipe: { $in: recipes.map((recipe) => recipe._id) },
  });
  let likedRecipeIds = new Set(
    likedRecipes.map((like) => like.recipe.toString())
  );

  const updateRecipes = recipes.map((recipe) => {
    return {
      ...recipe,
      isLiked: likedRecipeIds.has(recipe._id.toString()),
    };
  });
  // console.log(recipes);
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
  const existingUser = await checkUserById(userId);
  if (!existingUser)
    return next(new AppError("User not found", 404, "not_found"));

  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return next(new AppError("Invalid recipe id", 400, "bad_request"));
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
    return next(new AppError("Recipe not found", 404, "not_found"));
  }
  let likedRecipe = await Like.find({
    user: userId,
    recipe: recipeId,
  });

  let isLiked = likedRecipe.length > 0 ? true : false;

  const updatRecipe = {
    ...recipe._doc,
    isLiked: isLiked,
  };
  return res.status(200).json({ success: true, recipe: updatRecipe });
});

// update recipe
const updateRecipe = catchAsync(async (req, res, next) => {
  const recipeId = req.params.id;
  const { userId } = req.user;
  const exisitingRecipe = await Recipe.findById(recipeId);
  if (!exisitingRecipe) {
    return next(new AppError("Recipe not found", 404, "not_found"));
  }
  if (exisitingRecipe.createdBy.toString() !== userId) {
    return next(
      new AppError(
        "You are not authorized to update this recipe",
        403,
        "forbidden"
      )
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
  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return next(new AppError("Invalid recipe id", 400, "bad_request"));
  }

  if (!categoryId) {
    categoryId = exisitingRecipe.category;
  }

  let recipePicture = exisitingRecipe.recipePicture;
  if (req.files && req.files["recipePicture"]) {
    recipePicture = req.files["recipePicture"][0].path;
  }

  const stepImages = req.files["stepImage"];
  console.log("stepImages", stepImages);

  steps = steps.map((step, index) => ({
    step: step.step || step,
    stepImage: stepImages[index] ? stepImages[index].path : "null",
  }));

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
});

// delete recipe
const deleteRecipe = catchAsync(async (req, res, next) => {
  const recipeId = req.params.id;
  const { userId } = req.user;
  const existingUser = await checkUserById(userId);
  if (!existingUser)
    return next(new AppError("User not found", 404, "not_found"));

  const existingRecipe = await Recipe.findById(recipeId);
  if (!existingRecipe) {
    return next(new AppError("Recipe not found", 404, "not_found"));
  }

  if (existingRecipe.createdBy.toString() !== userId) {
    return next(
      new AppError(
        "You are not authorized to delete this recipe",
        403,
        "forbidden"
      )
    );
  }
  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return next(new AppError("Invalid recipe id", 400, "bad_request"));
  }

  // Delete the recipe
  await Recipe.findByIdAndDelete(recipeId);
  return res
    .status(200)
    .json({ success: true, message: "Recipe deleted successfully" });
});

// like recipe
const likeRecipe = catchAsync(async (req, res, next) => {
  const recipeId = req.params.id;
  const { userId } = req.user;
  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return next(new AppError("Invalid recipe id", 400, "bad_request"));
  }
  const existingUser = await checkUserById(userId);
  if (!existingUser)
    return next(new AppError("User not found", 404, "not_found"));

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
  existingRecipe.likesCount = existingRecipe.likes.length;
  await existingRecipe.save();

  return res.status(200).json({ success: true, message: msg });
});
module.exports = {
  createRecipe,
  getCategories,
  getRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
};
