const admin = require("../config/firebase/firebase");
const UserRepository = require("../repositories/user.repository");
const NotificationRepository = require("../repositories/notification.repository");
const DeviceTokenRepository = require("../repositories/deviceToken.repository");
const AppError = require("../utils/appError");
const notificationRepository = require("../repositories/notification.repository");
const sendPushNotification = async ({
  receiver,
  sender,
  type,
  recipeId = null,
  recipePicture = null,
  chefImage,
  isFollowed = false,
}) => {
  const senderUser = await UserRepository.findById(sender);

  if (!senderUser) {
    throw new AppError("Sender user not found", 404, "not_found");
  }
  const titleMap = {
    like: `${senderUser.username} liked your recipe`,
    follow: `${senderUser.username} started following you`,
    new_recipe: `${senderUser.username} sent you a new recipe`,
  };

  const receiverList = Array.isArray(receiver) ? receiver : [receiver];

  const notifications = await Promise.all(
    receiverList.map(async (receiverId) => {
      const notification = await NotificationRepository.create({
        receiver: receiverId,
        sender: senderUser._id,
        type,
        recipeId,
        recipePicture,
        chefImage: chefImage,
        isFollowed,
      });

      const receiverTokens =
        await DeviceTokenRepository.findDeviceTokensByUserId(receiverId);

      if (receiverTokens.length === 0) return null;

      const fcmTokens = receiverTokens.map((tk) => tk.token);

      const response = await admin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title: titleMap[type] || "New Notification",
          body: titleMap[type] || "You have a new notification",
          image: chefImage || "",
        },
        data: {
          type,
          recipeId: recipeId || "",
          senderId: senderUser._id.toString(),
          senderName: senderUser.username,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      });

      return {
        receiver: receiverId,
        success: response.successCount,
        failed: response.failureCount,
        notificationId: notification._id,
      };
    })
  );

  return {
    success: true,
    results: notifications.filter(Boolean),
  };
};

const getUserNotification = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const notifications = await NotificationRepository.findSenderByReceiverId(
    userId,
    skip,
    limit
  );

  const totalNotifications =
    await NotificationRepository.countDocumentsByReceiverId(userId);
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
  const result = await NotificationRepository.updateById(filter, update);
  return !!result;
};
const markAsReadAll = async (userId) => {
  const filter = { receiver: userId };
  const update = { isRead: true };
  const result = await NotificationRepository.updateManyNotify(filter, update);

  return !!result;
};

module.exports = {
  sendPushNotification,
  getUserNotification,
  markAsReadById,
  markAsReadAll,
};
