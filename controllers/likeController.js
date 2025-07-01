const Like = require("../models/LikeModel");
const Recipe = require("../models/RecipeModel");
const User = require("../models/UserModel");
const Follow = require("../models/FollowModel");
const { sendErrorResponse } = require("../utils/errorResponse");
const { sendPushNotification } = require("../services/notificationService");
const Notification = require("../models/NotificationModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const like = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { recipeId } = req.params;
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    return next(new AppError("Recipe not found", 404, "not_found"));
  }
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404, "not_found"));
  }
  const existingLike = await Like.findOne({ user: userId, recipe: recipeId });
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike.id });
    recipe.likesCount -= 1;
    await recipe.save();
    //delete like in notification
    await Notification.deleteMany({
      receiver: recipe.createdBy,
      sender: userId,
      type: "like",
      recipeId: recipeId,
    });
    return res.status(200).json({
      success: true,
      message: "Recipe unliked successfully",
      likesCount: recipe.likesCount,
    });
  } else {
    const newLike = new Like({ user: userId, recipe: recipeId });
    await newLike.save();
    recipe.likesCount += 1;
    await recipe.save();
    // is followed
    const isFollowed = await Follow.findOne({
      follower: userId,
      following: recipe.createdBy,
    });
    //send notification
    await sendPushNotification({
      receiver: recipe.createdBy,
      sender: userId,
      type: "like",
      recipeId: recipeId,
      recipePicture: recipe.recipePicture,
      chefImage: user.profilePicture,
      isFollowed: !!isFollowed,
    });
    return res.status(200).json({
      success: true,
      message: "Recipe liked successfully",
      likesCount: recipe.likesCount,
    });
  }
});

// @desc    Get all likes for a recipe
const getLikes = catchAsync(async (req, res, next) => {
  const { recipeId } = req.params;
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    return next(new AppError("Recipe not found", 404, "not_found"));
  }
  const likes = await Like.find({ recipe: recipeId }).populate(
    "user",
    "username profilePicture"
  );
  if (!likes || likes.length === 0) {
    return next(
      new AppError("No likes found for this recipe", 404, "not_found")
    );
  }
  return res.status(200).json({
    success: true,
    message: "Likes retrieved successfully",
    likes,
  });
});
module.exports = { like, getLikes };
