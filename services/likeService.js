const AppError = require("../utils/appError");
const LikeRepository = require("../repositories/like.repository");
const UserRepository = require("../repositories/user.repository");
const RecipeRepository = require("../repositories/recipe.repository");
const NotificationRepository = require("../repositories/notification.repository");
const { sendPushNotification } = require("../services/notificationService");
const ensureUserExists = require("../helpers/ensureUserExists");

const toggleLikeServices = async (userId, recipeId) => {
  const recipe = await RecipeRepository.findById(recipeId);
  if (!recipe) {
    throw new AppError("Recipe not found", 404, "not_found");
  }
  const user = await ensureUserExists(userId);
  const existingLike = await LikeRepository.findOne({
    user: userId,
    recipe: recipeId,
  });
  if (existingLike) {
    await LikeRepository.deleteById(existingLike._id);
    await LikeRepository.updateById(recipeId, {
      likesCount: recipe.likesCount - 1,
    });
    recipe.likesCount -= 1;
    // delete like in notification
    await NotificationRepository.deleteMany({
      receiver: recipe.createdBy,
      sender: userId,
      type: "like",
      recipeId: recipeId,
    });
    return {
      success: true,
      message: "Recipe unliked successfully",
      likesCount: recipe.likesCount,
    };
  } else {
     await LikeRepository.create({
      user: userId,
      recipe: recipeId,
    });
    await RecipeRepository.updateById(recipeId, {
      likesCount: recipe.likesCount + 1,
    });
    recipe.likesCount += 1;
    // Check if the user is followed
    const isFollowed = await UserRepository.isUserFollowed({
      userId: recipe.createdBy,
      followerId: userId,
    });
    
    // Send notification
    await sendPushNotification({
      receiver: recipe.createdBy,
      sender: userId,
      type: "like",
      recipeId: recipeId,
      recipePicture: recipe.recipePicture,
      chefImage: user.profilePicture,
      isFollowed: !!isFollowed,
    });

    return {
      message: "Recipe liked successfully",
      likesCount: recipe.likesCount,
    };
  }
};

const getLikesServices = async (recipeId) => {
  const recipe = await RecipeRepository.findById(recipeId);
  if (!recipe) {
    throw new AppError("Recipe not found", 404, "not_found");
  }
  const likes = await LikeRepository.findUserByRecipeId({ recipe: recipeId });
  if (!likes || likes.length === 0) {
    throw new AppError("No likes found for this recipe", 404, "not_found");
  }
  return likes;
};

module.exports = {
  toggleLikeServices,
  getLikesServices,
};
