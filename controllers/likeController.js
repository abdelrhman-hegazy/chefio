const catchAsync = require("../utils/catchAsync");
const {
  toggleLikeServices,
  getLikesServices,
} = require("../services/likeService");

const like = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { recipeId } = req.params;
  const result = await toggleLikeServices(userId, recipeId);
  return res.status(200).json({
    success: true,
    message: result.message,
    likesCount: result.likesCount,
  });
});

// @desc    Get all likes for a recipe
const getLikes = catchAsync(async (req, res, next) => {
  const { recipeId } = req.params;

  const likes = await getLikesServices(recipeId);
  return res.status(200).json({
    success: true,
    message: "Likes retrieved successfully",
    likes,
  });
});
module.exports = { like, getLikes };
