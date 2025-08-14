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
  const { userId: followerId } = req.user;
  const { targetUserId: followingId } = req.params;

  if (followerId === followingId) {
    return next(
      new AppError("You can't follow yourself", 400, "invalid_request")
    );
  }
  await Promise.all([
    ensureUserExists(followerId),
    ensureUserExists(followingId),
  ]);
  if (!followerId || !followingId) {
    return next(new AppError("User not found", 404, "not_found"));
  }
  
  const { followed } = await toggleFollow(followerId, followingId);
  // Create a new follow relationship

  res.status(200).json({
    success: true,
    message: followed
      ? "Followed chef successfully"
      : "Unfollowed chef successfully",
  });
});
const getFollowers = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const currentUserId = req.user.userId;

  const followers = await getFollowersService(userId, currentUserId);

  res.status(200).json({
    success: true,
    followers,
  });
});

const getFollowing = catchAsync(async (req, res, next) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user.userId;

  const following = await getFollowingService(targetUserId, currentUserId);

  res.status(200).json({
    success: true,
    following,
  });
});

module.exports = { followChef, getFollowers, getFollowing };
