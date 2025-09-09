const catchAsync = require("../utils/catchAsync");
const ensureUserExists = require("../helpers/ensureUserExists");
const AppError = require("../utils/appError");
const UserRepository = require("../repositories/user.repository");
const LikeRepository = require("../repositories/like.repository");
const RecipeRepository = require("../repositories/recipe.repository");
//endpoint to upload a profile picture
const uploadProfilePicture = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  await ensureUserExists(userId);
  if (!req.file || !req.file.path) {
    return next(new AppError("No image file provided", 400, "bad_request"));
  }
  const updatedUser = await UserRepository.updateById(userId, {
    profilePicture: req.file.path,
  });
  if (!updatedUser) {
    return next(new AppError("User not found", 404, "not_found"));
  }

  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully!",
    profilePicture: updatedUser.profilePicture,
  });
});
// endpoint to get the profile of a user
const getProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { targetUserId } = req.params;

  await Promise.all([ensureUserExists(userId), ensureUserExists(targetUserId)]);
  // pagination setup
  const pageRecipes = parseInt(req.query.pageRecipes) || 1;
  const limitRecipes = parseInt(req.query.limitRecipes) || 10;
  const skipRecipes = (pageRecipes - 1) * limitRecipes;

  const [
    targetUser,
    currentUserLikes,
    totalUserRecipes,
    userRecipes,
    followings,
  ] = await Promise.all([
    UserRepository.findById(targetUserId),
    LikeRepository.findRecipeByUserId(userId),
    RecipeRepository.countDocuments({ createdBy: targetUserId }),
    RecipeRepository.findRecipebyUserId(
      targetUserId,
      skipRecipes,
      limitRecipes
    ),
    UserRepository.findFollowingById(userId),
  ]);

  let isFollowed;
  if (userId === targetUserId) {
    isFollowed = "me";
  } else {
    isFollowed = await followings.following.some(
      (follow) => follow.user.toString() === targetUserId
    );
    isFollowed = isFollowed ? "true" : "false";
  }

  const likedRecipeIds = new Set(
    currentUserLikes.map((like) => like.recipe.toString())
  );

  const formattedRecipes = userRecipes.map((recipe) => ({
    _id: recipe._id,
    recipePicture: recipe.recipePicture,
    foodName: recipe.foodName,
    cookingDuration: recipe.cookingDuration,
    category: recipe.category,
    isLiked: likedRecipeIds.has(recipe._id.toString()),
  }));

  const profileData = {
    _id: targetUser._id,
    username: targetUser.username,
    email: targetUser.email,
    profilePicture: targetUser.profilePicture,
    followersCount: targetUser.followersCount,
    followingCount: targetUser.followingCount,
    isFollowing: isFollowed,
    recipes: {
      totalRecipes: totalUserRecipes,
      currentPage: pageRecipes,
      totalPages: Math.ceil(totalUserRecipes / limitRecipes),
      data: formattedRecipes,
    },
  };

  return res.status(200).json({
    success: true,
    message: "User profile fetched successfully!",
    profile: profileData,
  });
});

// endpoint to get the liked recipes of a user
const getRecipesProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { targetUserId } = req.params;

  const page = parseInt(req.query.pageRecipes) || 1;
  const limit = parseInt(req.query.limitRecipes) || 10;
  const skip = (page - 1) * limit;

  const targetUser = await UserRepository.findById(targetUserId);
  if (!targetUser) {
    return next(new AppError("Target user not found", 404, "not_found"));
  }

  const totalRecipes = await RecipeRepository.countDocuments({
    createdBy: targetUserId,
  });

  const recipes = await RecipeRepository.getRecipesProfile(
    targetUser,
    skip,
    limit
  );
  const userLikes = await LikeRepository.findRecipeByUserId(userId);
  const likedIds = new Set(userLikes.map((like) => like.recipe.toString()));

  const formatted = recipes.map((recipe) => ({
    _id: recipe._id,
    recipePicture: recipe.recipePicture,
    foodName: recipe.foodName,
    cookingDuration: recipe.cookingDuration,
    category: recipe.category,
    createdBy: recipe.createdBy
      ? {
          _id: recipe.createdBy._id,
          username: recipe.createdBy.username,
          profilePicture: recipe.createdBy.profilePicture,
        }
      : null,
    isLiked: likedIds.has(recipe._id.toString()),
  }));

  return res.status(200).json({
    success: true,
    message: "User recipes fetched successfully!",
    recipes: {
      totalRecipes,
      currentPage: page,
      totalPages: Math.ceil(totalRecipes / limit),
      data: formatted,
    },
  });
});

//endpoint to get the liked recipes of a user
const getLikedRecipesProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { userId: targetUserId } = req.params;

  const page = parseInt(req.query.pageLikedRecipes) || 1;
  const limit = parseInt(req.query.limitLikedRecipes) || 10;
  const skip = (page - 1) * limit;

  const targetUser = await UserRepository.findById(targetUserId);
  if (!targetUser) {
    return next(new AppError("Target user not found", 404, "not_found"));
  }

  const totalLiked = await LikeRepository.countDocuments({
    user: targetUserId,
  });

  const likedRecipes = await LikeRepository.findLikedRecipesByUserId(
    targetUser,
    skip,
    limit
  );

  const currentUserLikes = await LikeRepository.findRecipeByUserId(userId);
  const likedRecipeIds = new Set(
    currentUserLikes.map((like) => like.recipe.toString())
  );

  const formattedRecipes = likedRecipes
    .map((like) => like.recipe)
    .filter((recipe) => recipe)
    .map((recipe) => ({
      ...recipe,
      category: recipe.category,
      createdBy: recipe.createdBy
        ? {
            _id: recipe.createdBy._id,
            username: recipe.createdBy.username,
            profilePicture: recipe.createdBy.profilePicture,
          }
        : null,
      isLiked: likedRecipeIds.has(recipe._id.toString()),
    }));

  return res.status(200).json({
    success: true,
    message: "User liked recipes fetched successfully!",
    recipes: {
      totalLikedRecipes: totalLiked,
      currentPage: page,
      totalPages: Math.ceil(totalLiked / limit),
      data: formattedRecipes,
    },
  });
});

// endpoint edit profile
const editProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { username } = req.body;
  const user = await UserRepository.findUsernameProfileById(userId);
  if (!user) {
    return next(new AppError("User not found", 404, "not_found"));
  }
  let profilePicture;
  if (!req.file || !req.file.path) {
    profilePicture = user.profilePicture; // No new profile picture provided
  } else {
    profilePicture = req.file.path; // Check if a new profile picture is provided
  }
  console.log(username);
  console.log(req.file.path);
  console.log(req.body);

  let updatedUser; // Default to the current user
  if (username || req.file) {
    updatedUser = await UserRepository.updateById(userId, {
      username,
      profilePicture,
    });
  } else {
    updatedUser = user;
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    profile: updatedUser,
  });
});
module.exports = {
  uploadProfilePicture,
  getProfile,
  getRecipesProfile,
  getLikedRecipesProfile,
  editProfile,
};
