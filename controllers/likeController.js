const Like = require("../models/LikeModel");
const Recipe = require("../models/RecipeModel");
const User = require("../models/UserModel");
const Follow = require("../models/FollowModel");
const { sendErrorResponse } = require("../utils/errorHandler");
const { sendPushNotification } = require("../services/notificationService");
const Notification = require("../models/NotificationModel");
// @desc    Like or unlike a recipe
// @route   POST /api/v1/recipe/likes/:recipeId
// @access  Private
// @method  POST
const like = async (req, res) => {
  try {
    const { userId } = req.user;
    const { recipeId } = req.params;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return sendErrorResponse(res, 404, "Recipe not found", "not_found");
    }
    const user = await User.findById(userId);
    if (!user) {
      return sendErrorResponse(res, 404, "user not found", "not found");
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
  } catch (error) {
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

// @desc    Get all likes for a recipe
const getLikes = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return sendErrorResponse(res, 404, "Recipe not found", "not_found");
    }
    const likes = await Like.find({ recipe: recipeId }).populate(
      "user",
      "username profilePicture"
    );
    if (!likes || likes.length === 0) {
      return sendErrorResponse(
        res,
        404,
        "No likes found for this recipe",
        "not_found"
      );
    }
    return res.status(200).json({
      success: true,
      message: "Likes retrieved successfully",
      likes,
    });
  } catch (error) {
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};
module.exports = { like, getLikes };
