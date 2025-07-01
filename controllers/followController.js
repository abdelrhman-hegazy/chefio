const Follow = require("../models/FollowModel");
const User = require("../models/UserModel");
const { sendErrorResponse } = require("../utils/errorResponse");
const Notification = require("../models/NotificationModel");
const { sendPushNotification } = require("../services/notificationService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// endpoint to follow or unfollow a chef
const followChef = catchAsync(async (req, res, next) => {
  const { userId: sender } = req.user;
  const { targetUserId: receiver } = req.params;
  if (!receiver) {
    return next(
      new AppError("targetUserId is required", 400, "invalid_request")
    );
  }
  if (receiver === sender) {
    return next(
      new AppError("You can't follow yourself", 400, "invalid_request")
    );
  }

  const targetUser = await User.findById(receiver);
  const currentUser = await User.findById(sender);
  if (!targetUser || !currentUser) {
    return next(new AppError("User not found", 404, "not_found"));
  }
  const existingFollow = await Follow.findOne({
    following: sender,
    follower: receiver,
  });
  if (existingFollow) {
    await Follow.findByIdAndDelete(existingFollow._id);
    if (targetUser.followersCount <= 0 && currentUser.followingCount <= 0) {
      return next(
        new AppError(
          "You cannot unfollow a user with no followers",
          400,
          "invalid_request"
        )
      );
    }

    // Decrement the followers and following counts
    targetUser.followersCount -= 1;
    currentUser.followingCount -= 1;
    await targetUser.save();
    await currentUser.save();
    // remove notification
    await Notification.deleteMany({
      receiver,
      sender,
      type: "follow",
    });
    // await User.findByIdAndUpdate(userId,{$inc:{}})
    return res.status(200).json({
      success: true,
      message: "Unfollowed chef successfully",
    });
  }
  const follow = new Follow({
    following: sender,
    follower: receiver,
  });
  await follow.save();
  targetUser.followersCount += 1;
  currentUser.followingCount += 1;
  await targetUser.save();
  await currentUser.save();
  // is followed
  const isFollowed = await Follow.findOne({
    follower: receiver,
    following: sender,
  });
  // send notification
  await sendPushNotification({
    receiver,
    sender,
    type: "follow",
    chefImage: currentUser.profilePicture,
    isFollowed: !!isFollowed,
  });
  res.status(200).json({
    success: true,
    message: "Followed chef successfully",
  });
});
// endpoint to get the followers of a chef
const getFollowers = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { userId: currentUserId } = req.user;

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return next(new AppError("User not found", 404, "not_found"));
  }

  // Find users who follow the target user
  const followers = await Follow.find({ follower: userId })
    .select("following")
    .populate("following", "username profilePicture")
    .exec();

  // Process follower data with isFollowed flag
  const processedFollowers = await Promise.all(
    followers.map(async (f) => {
      let isFollowing;
      if (f.following._id.toString() === currentUserId) {
        isFollowing = false;
      } else {
        isFollowing = await Follow.findOne({
          follower: f.following._id,
          following: currentUserId,
        });
        isFollowing = !!isFollowing;
      }
      // Return follower with isFollowed flag
      return {
        ...f.following._doc,
        isFollowed: isFollowing,
      };
    })
  );
  res.status(200).json({
    success: true,
    followers: processedFollowers,
  });
});
// endpoint to get the following of a chef
const getFollowing = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { userId: targetUserId } = req.params;
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return next(new AppError("User not found", 404, "not_found"));
  }
  const following = await Follow.find({ following: targetUserId })
    .select("follower")
    .populate("follower", "username profilePicture")
    .exec();
  const processedFollowing = await Promise.all(
    following.map(async (f) => {
      let isFollowing = await Follow.findOne({
        follower: f.follower._id,
        following: userId,
      });
      return {
        ...f.follower._doc,
        isFollowed: !!isFollowing,
      };
    })
  );
  res.status(200).json({
    success: true,
    following: processedFollowing,
  });
});

module.exports = { followChef, getFollowers, getFollowing };
