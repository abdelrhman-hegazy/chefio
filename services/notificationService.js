const admin = require("firebase-admin");
const DeviceToken = require("../models/DeviceTokenModel");
const User = require("../models/UserModel");
const Notification = require("../models/NotificationModel");

const createNotification = async ({ receiver, sender, type, recipeId }) => {
  const notification = new Notification({ receiver, sender, type, recipeId });
  await notification.save();

  const receiverTokens = await DeviceToken.find({ user: receiver });
  if (receiverTokens.length === 0) {
    return {
      succes: false,
      message: "No device tokens found for receiver",
    };
  }

  const senderUser = await User.findById(sender).select(
    "username profilePicture"
  );
  if (!senderUser) {
    return {
      success: false,
      message: "Sender not found",
    };
  }

  const titleMap = {
    like: `${senderUser.username} liked your recipe`,
    follow: `${senderUser.username} started following you`,
    new_recipe: `${senderUser.username} sent you a new recipe`,
  };
  const tokens = receiverTokens.map((tk) => tk.token);

  const message = {
    notification: {
      title: titleMap[type] || "New Notification",
      body: titleMap[type] || "You have a new notification",
    },
    data: {
      type,
      recipeId,
      senderId: senderUser._id.toString(),
      senderName: senderUser.username,
      senderProfilePicture: senderUser.profilePicture,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
  };

  const response = await admin.messaging().sendMulticast(message);
  return {
    success: true,
    sent: response.success,
    failed: response.failure,
    notification: notification._id,
  };
};

const getUserNotification = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const notifications = await Notification.find({ receiver: userId })
    .populate("sender", "username profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalNotifications = await Notification.countDocuments({
    respient: userId,
  });

  return {
    totalNotifications,
    totalPages: Math.ceil(totalNotifications / limit),
    currentPage: page,
    notifications,
  };
};
const markAsReadById = async (notificationId) => {
  const filter = { _id: notificationId };
  const update = { isRead: true };
  const result = await Notification.updateOne(filter, update);
  return result.modifiedCount > 0;
};
const markAsReadAll = async (userId) => {
  const filter = { receiver: userId };
  const update = { isRead: true };
  const result = await Notification.updateMany(filter, update);
  return result.modifiedCount > 0;
};
module.exports = {
  createNotification,
  getUserNotification,
  markAsReadById,
  markAsReadAll,
};
