const Like = require("../models/LikeModel");
const Resipe = require("../models/RecipeModel");
const User = require("../models/UserModel");
const { sendErrorResponse } = require("../utils/errorHandler");

// @desc    Like or unlike a recipe
// @route   POST /api/v1/recipe/likes/:recipeId
// @access  Private
// @method  POST
// @param   {string} recipeId - The ID of the recipe to like or unlike
// @returns {object} - A success message and the updated likes count
// @throws  {object} - An error message if the recipe or user is not found, or if there is a server error
// @throws  {object} - A success message and the updated likes count if the recipe is liked or unliked successfully
const like = async (req, res) => {
  try {
    const { userId } = req.user;
    const { recipeId } = req.params;
    const recipe = await Resipe.findById(recipeId);
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
    const recipe = await Resipe.findById(recipeId);
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
