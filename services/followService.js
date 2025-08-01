const FollowRepository = require("../repositories/follow.repository");
const UserRepository = require("../repositories/user.repository");
const NotificationRepository = require("../repositories/notification.repository");
const { sendPushNotification } = require("./notificationService");
const ensureUserExists = require("../helpers/ensureUserExists");
const AppError = require("../utils/appError");
const { th } = require("@faker-js/faker");

const toggleFollow = async (followerId, followingId) => {
  const existingFollow = await FollowRepository.findOne({
    follower: followerId,
    following: followingId,
  });
  const followingUser = await ensureUserExists(followingId);
  const followerUser = await ensureUserExists(followerId);

  if (existingFollow) {
    await FollowRepository.deleteById(existingFollow._id);
    await NotificationRepository.deleteMany({
      receiver: followingId,
      sender: followerId,
      type: "follow",
    });
    await Promise.all([
      UserRepository.updateById(followerId, {
        followersCount: followerUser.followersCount - 1,
      }),
      UserRepository.updateById(followingId, {
        followingCount: followingUser.followingCount - 1,
      }),
    ]);
    return { followed: false };
  }

  let newFollow = await FollowRepository.createFollow(followerId, followingId);
  if (!newFollow) {
    throw new AppError(
      "Failed to create follow relationship",
      500,
      "internal_server_error"
    );
  }

  await Promise.all([
    UserRepository.updateById(followerId, {
      followersCount: followerUser.followersCount + 1,
    }),
    UserRepository.updateById(followingId, {
      followingCount: followingUser.followingCount + 1,
    }),
  ]);
  await sendPushNotification({
    receiver: followingId,
    sender: followerId,
    type: "follow",
    chefImage: followerUser.profilePicture,
    isFollowed: true,
  }).catch((err) => {
    return new AppError(
      err.message || "Failed to send notification",
      500,
      "notification_error"
    );
  });

  return { followed: true };
};

const getFollowersService = async (targetUserId, currentUserId) => {
  const user = await UserRepository.findById(targetUserId);
  if (!user) {
    throw new AppError("User not found", 404, "not_found");
  }

  const followers = await FollowRepository.findFollowingByFollower({
    follower: targetUserId,
  });

  const processedFollowers = await Promise.all(
    followers.map(async (f) => {
      let isFollowing = false;
      if (f.following._id.toString() !== currentUserId) {
        isFollowing = await FollowRepository.findOne({
          follower: f.following._id,
          following: currentUserId,
        });
      }
      return {
        ...f.following._doc,
        isFollowed: !!isFollowing,
      };
    })
  );

  return processedFollowers;
};

const getFollowingService = async (targetUserId, currentUserId) => {
  const user = await UserRepository.findById(targetUserId);
  if (!user) {
    throw new AppError("User not found", 404, "not_found");
  }

  const following = await FollowRepository.findFollowersByFollowing({
    following: targetUserId,
  });

  const processedFollowing = await Promise.all(
    following.map(async (f) => {
      const isFollowing = await FollowRepository.findOne({
        follower: f.follower._id,
        following: currentUserId,
      });
      return {
        ...f.follower._doc,
        isFollowed: !!isFollowing,
      };
    })
  );

  return processedFollowing;
};

module.exports = {
  getFollowersService,
  getFollowingService,
  toggleFollow,
};
