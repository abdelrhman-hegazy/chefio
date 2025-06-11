const admin = require("../config/firebase/firebase");
const Notification = require("../models/NotificationModel");
const DeviceToken = require("../models/DeviceTokenModel");
const User = require("../models/UserModel");
const Follow = require("../models/FollowModel");
const sendPushNotification = async ({
  receiver,
  sender,
  type,
  recipeId = null,
  recipePicture = null,
  chefImage,
  isFollowed = false,
}) => {
  const senderUser = await User.findById(sender).select(
    "username profilePicture"
  );

  const titleMap = {
    like: `${senderUser.username} liked your recipe`,
    follow: `${senderUser.username} started following you`,
    new_recipe: `${senderUser.username} sent you a new recipe`,
  };

  // 👇 دعم إرسال إشعارات لمستخدم واحد أو عدة متابعين
  const receiverList = Array.isArray(receiver) ? receiver : [receiver];

  const notifications = await Promise.all(
    receiverList.map(async (receiverId) => {
      // حفظ الإشعار في قاعدة البيانات
      const notification = await Notification.create({
        receiver: receiverId,
        sender,
        type,
        recipeId,
        recipePicture,
        chefImage: chefImage,
        isFollowed,
      });

      // الحصول على التوكنات الخاصة بهذا المستلم
      const receiverTokens = await DeviceToken.find({
        user: receiverId,
      }).select("token -_id");
      if (receiverTokens.length === 0) return null;

      const fcmTokens = receiverTokens.map((tk) => tk.token);

      // إرسال الإشعار
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
  const notifications = await Notification.find({ receiver: userId })
    .populate("sender", "username profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalNotifications = await Notification.countDocuments({
    receiver: userId,
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
