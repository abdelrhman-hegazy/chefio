const Like = require("../models/LikeModel");
const Resipe = require("../models/RecipeModel");
const User = require("../models/UserModel");
const sendErrorResponse = require("../utils/errorHandler");

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

module.exports = {like};
