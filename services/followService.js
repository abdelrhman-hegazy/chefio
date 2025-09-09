// const FollowRepository = require("../repositories/follow.repository");
const UserRepository = require("../repositories/user.repository");
const NotificationRepository = require("../repositories/notification.repository");
const { sendPushNotification } = require("./notificationService");
const AppError = require("../utils/appError");

const toggleFollow = async (senderId, reciverId) => {
  const [senderUser, reciverUser] = await Promise.all([
    UserRepository.findFollowingById(senderId),
    UserRepository.findFollowersById(reciverId),
  ]);
  if (!senderUser || !reciverUser) {
    throw new AppError("User not found", 404, "not_found");
  }

  const isAlreadyFollowing = senderUser.following.some(
    (following) => following.user.toString() === reciverId
  );

  if (isAlreadyFollowing) {
    await Promise.all([
      await UserRepository.updateById(senderId, {
        $pull: { following: { user: reciverId } },
        $inc: { followingCount: -1 },
      }),
      await UserRepository.updateById(reciverId, {
        $pull: { followers: { user: senderId } },
        $inc: { followersCount: -1 },
      }),
      NotificationRepository.deleteMany({
        receiver: reciverId,
        sender: senderId,
        type: "follow",
      }),
    ]);
    return { followed: false };
  }
  await Promise.all([
    UserRepository.updateById(senderId, {
      $addToSet: {
        following: {
          user: reciverId,
          followedAt: new Date(),
        },
      },
      $inc: { followingCount: 1 },
    }),
    UserRepository.updateById(reciverId, {
      $addToSet: {
        followers: {
          user: senderId,
          followedAt: new Date(),
        },
      },
      $inc: { followersCount: 1 },
    }),
    NotificationRepository.create({
      receiver: reciverId,
      sender: senderId,
      type: "follow",
    }),
  ]);

  await sendPushNotification({
    receiver: reciverId,
    sender: senderId,
    type: "follow",
    chefImage: senderUser.profilePicture,
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

const getFollowersService = async (targetUserId, userId) => {
  const targetUser = await UserRepository.findFollowersById(targetUserId);
  const currentUser = await UserRepository.findFollowingById(userId);
  const processedFollowers = await Promise.all(
    targetUser.followers.map(async (f) => {
      const followersData = await UserRepository.findUsernameProfileById(
        f.user
      );
      let isFollowed;
      if (currentUser === targetUser) {
        return {
          ...followersData._doc,
          isFollowed: "true",
        };
      } else if (userId === f.user.toString()) {
        isFollowed = "me";
      } else {
        isFollowed = currentUser.following.some(
          (following) => following.user.toString() === f.user.toString()
        );
        isFollowed = isFollowed ? "true" : "false";
      }
      return {
        ...followersData._doc,
        isFollowed: isFollowed,
      };
    })
  );

  return processedFollowers;
};

const getFollowingService = async (targetUserId, currentUserId) => {
  const targetUser = await UserRepository.findFollowingById(targetUserId);
  const currentUser = await UserRepository.findFollowingById(currentUserId);
  const processedFollowing = await Promise.all(
    targetUser.following.map(async (f) => {
      const followingData = await UserRepository.findUsernameProfileById(
        f.user
      );
      let isFollowed;
      if (currentUserId === f.user.toString()) {
        isFollowed = "me";
      } else {
        isFollowed = currentUser.following.some(
          (following) => following.user.toString() === f.user.toString()
        );
        isFollowed = isFollowed ? "true" : "false";
      }
      return {
        ...followingData._doc,
        isFollowed: isFollowed,
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
