const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ensureUserExists = require("../helpers/ensureUserExists");
const FollowRepository = require("../repositories/follow.repository");
const {
  toggleFollow,
  getFollowersService,
  getFollowingService,
} = require("../services/followService");

// endpoint to follow or unfollow a chef
const followChef = catchAsync(async (req, res, next) => {
  const { userId: senderId } = req.user;
  const { targetUserId: reciverId } = req.params;

  await Promise.all([ensureUserExists(senderId), ensureUserExists(reciverId)]);
  if (!senderId || !reciverId) {
    return next(new AppError("User not found", 404, "not_found"));
  }
  if (senderId === reciverId) {
    return next(
      new AppError("You can't follow yourself", 400, "invalid_request")
    );
  }
  const { followed } = await toggleFollow(senderId, reciverId);
  // Create a new follow relationship

  res.status(200).json({
    success: true,
    message: followed
      ? "Followed chef successfully"
      : "Unfollowed chef successfully",
  });
});
const getFollowers = catchAsync(async (req, res, next) => {
  const { targetUserId} = req.params;
  const { userId } = req.user;
  ensureUserExists(targetUserId);

  const followers = await getFollowersService(targetUserId, userId);
  
  res.status(200).json({
    success: true,
    followers,
  });
});

const getFollowing = catchAsync(async (req, res, next) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user.userId;

  const following = await getFollowingService(targetUserId, currentUserId);

  res.status(200).json({
    success: true,
    following,
  });
});

module.exports = { followChef, getFollowers, getFollowing };
