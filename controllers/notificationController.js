const notificationServices = require("../services/notificationService");
const { sendErrorResponse } = require("../utils/errorHandler");

const getNotifications = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { userId } = req.user;
  try {                                                 
    const notifications = await notificationServices.getUserNotification(
      userId,
      page,
      limit
    );
    if (!notifications) {
      return sendErrorResponse(res, {
        message: "No notifications found",
        statusCode: 404,
      });
    }
    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return sendErrorResponse(res, {
      message: error.message,
      statusCode: 500,
    });
  }
};
const markAsReadById = async (req, res) => {
  const { notificationId } = req.params;
  try {
    const success = await notificationServices.markAsReadById(notificationId);
    if (!success) {
      return sendErrorResponse(
        res,
        404,
        "Notification not found or already read",
        "not_found"
      );
    }
    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

const markAsReadAll = async (req, res) => {
  const { userId } = req.user;
  try {
    const success = await notificationServices.markAsReadAll(userId);
    if (!success) {
      return sendErrorResponse(res, 404, "not found notification", "not_found");
    }
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};
module.exports = {
  getNotifications,
  markAsReadById,
  markAsReadAll,
};
