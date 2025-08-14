const notificationServices = require("../services/notificationService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const getNotifications = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const { userId } = req.user;
  const notifications = await notificationServices.getUserNotification(
    userId,
    page,
    limit
  );
  if (!notifications) {
    return next(new AppError("No notifications found", 404, "not_found"));
  }
  return res.status(200).json({
    success: true,
    notifications,
  });
});
const markAsReadById = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const success = await notificationServices.markAsReadById(notificationId);
  if (!success) {
    return next(new AppError("Notification not found", 404, "not_found"));
  }
  return res.status(200).json({
    success: true,
    message: "Notification marked as read",
  });
});

const markAsReadAll = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const success = await notificationServices.markAsReadAll(userId);
  if (!success) {
    return next(new AppError("No notifications found", 404, "not_found"));
  }
  return res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

module.exports = {
  getNotifications,
  markAsReadById,
  markAsReadAll,
};
