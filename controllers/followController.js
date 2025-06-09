const Follow = require("../models/FollowModel");
const User = require("../models/UserModel");
const { sendErrorResponse } = require("../utils/errorHandler");
const Notification = require("../models/NotificationModel");
const DeviceToken = require("../models/DeviceTokenModel");
const { sendPushNotification } = require("../services/notificationService");
// endpoint to follow or unfollow a chef
const followChef = async (req, res) => {
  try {
    const { userId: sender } = req.user;
    const { targetUserId: receiver } = req.params;
    if (!receiver) {
      return sendErrorResponse(
        res,
        400,
        "receiver is missing",
        "invalid_request"
      );
    }
    console.log("Sender:", sender);
    console.log("Receiver:", receiver);

    if (receiver === sender) {
      return sendErrorResponse(
        res,
        400,
        "you can't follow yourself",
        "invalid_request"
      );
    }

    const targetUser = await User.findById(receiver);
    const currentUser = await User.findById(sender);
    if (!targetUser || !currentUser) {
      return sendErrorResponse(res, 404, "user not found", "not_found");
    }
    const existingFollow = await Follow.findOne({
      following: sender,
      follower: receiver,
    });
    if (existingFollow) {
      await Follow.findByIdAndDelete(existingFollow._id);
      if (targetUser.followersCount <= 0 && currentUser.followingCount <= 0) {
        return sendErrorResponse(
          res,
          400,
          "you can't unfollow this chef",
          "invalid_request"
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
    // send notification
    await sendPushNotification({ sender, receiver, type: "follow" });
    res.status(200).json({
      success: true,
      message: "Followed chef successfully",
    });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};
// endpoint to get the followers of a chef
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userId: currentUserId } = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendErrorResponse(res, 404, "user not found", "not_found");
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
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};
// endpoint to get the following of a chef
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userId: targetUserId } = req.params;
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return sendErrorResponse(res, 404, "user not found", "not_found");
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
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};

module.exports = { followChef, getFollowers, getFollowing };
