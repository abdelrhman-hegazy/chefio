const admin = require("../config/firebase/firebase");
const Notification = require("../models/NotificationModel");
const DeviceToken = require("../models/DeviceTokenModel");
const User = require("../models/UserModel");
const sendPushNotification = async ({
  receiver,
  sender,
  type,
  recipeId = null,
}) => {
  const notification = await Notification.create({
    receiver,
    sender,
    type,
    recipeId,
  });

  const receiverTokens = await DeviceToken.find({ user: receiver }).select(
    "token -_id"
  );
  if (receiverTokens.length === 0) {
    return {
      succes: false,
      message: "No device tokens found for receiver",
    };
  }
  const fcmTokens = receiverTokens.map((tk) => tk.token);

  const senderUser = await User.findById(sender).select(
    "username profilePicture"
  );

  const titleMap = {
    like: `${senderUser.username} liked your recipe`,
    follow: `${senderUser.username} started following you`,
    new_recipe: `${senderUser.username} sent you a new recipe`,
  };

  const response = await admin.messaging().sendEachForMulticast({
    tokens: fcmTokens,
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
  });
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
  sendPushNotification,
  getUserNotification,
  markAsReadById,
  markAsReadAll,
};
