const Follow = require("../models/FollowModel");
const User = require("../models/ProfileModel");
const { sendErrorResponse } = require("../utils/errorHandler");

// Follow a chef
const followChef = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetUserId } = req.params;

    if (targetUserId === userId) {
      return sendErrorResponse(
        res,
        400,
        "you can't follow yourself",
        "invalid_request"
      );
    }
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(userId);
    if (!targetUser || !currentUser) {
      return sendErrorResponse(res, 404, "user not found", "not_found");
    }
    const existingFollow = await Follow.findOne({
      follower: userId,
      following: targetUserId,
    });
    if (existingFollow) {
      await Follow.findByIdAndDelete(existingFollow._id);
      targetUser.followersCount -= 1;
      currentUser.followingCount -= 1;
      await targetUser.save();
      await currentUser.save();
      // await User.findByIdAndUpdate(userId,{$inc:{}})
      return res.status(200).json({
        success: true,
        message: "Unfollowed chef successfully",
      });
    }
    const follow = new Follow({
      follower: userId,
      following: targetUserId,
    });
    await follow.save();
    targetUser.followersCount += 1;
    currentUser.followingCount += 1;
    await targetUser.save();
    await currentUser.save();
    res.status(200).json({
      success: true,
      message: "Followed chef successfully",
    });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};
// get followers
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userId: currentUserId } = req.user;
    let isFollowed = false;
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendErrorResponse(res, 404, "user not found", "not_found");
    }
    const isFollowing = await Follow.findOne({
      follower: currentUserId,
      following: userId,
    });
    isFollowed = !!isFollowing;

    const followers = await Follow.find({ following: userId })
      .populate("follower", "username profilePicture")
      .exec();
    const updateFollowers = followers.map((f) => {
      const follower = {
        ...f.follower._doc,
        isFollowed: isFollowed,
      };
      return follower;
    });
    res.status(200).json({
      success: true,
      followers: updateFollowers,
    });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};
// get following
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userId: targetUserId } = req.params;
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return sendErrorResponse(res, 404, "user not found", "not_found");
    }
    const isFollowing = await Follow.findOne({
      follower: userId,
      following: targetUserId,
    });

    let isFollowed = !!isFollowing;
    const following = await Follow.find({ follower: userId })
      .populate("following", "username profilePicture")
      .exec();

    const updateFollowing = following.map((f) => {
      const following = {
        ...f.following._doc,
        isFollowed: isFollowed,
      };
      return following;
    });

    res.status(200).json({
      success: true,
      following: updateFollowing,
    });
  } catch (error) {
    sendErrorResponse(res, 500, error.message, "server_error");
    console.log(error);
  }
};

module.exports = { followChef, getFollowers, getFollowing };
