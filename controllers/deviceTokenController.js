const {
  saveDeviceToken,
  removeDeviceToken,
} = require("../services/deviceTokenService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const registerDeviceTokenController = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { token, device } = req.body;
  if (!token) {
    return next(new AppError("FCM Token is required", 400, "token_required"));
  }
  await saveDeviceToken(userId, token, device);
  return res.status(200).json({
    success: true,
    message: "Device token saved successfully",
  });
});

const removeDeviceTokenController = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { token } = req.body;
  if (!token) {
    return next(new AppError("FCM Token is required", 400, "token_required"));
  }
  await removeDeviceToken(userId, token);
  return res.status(200).json({
    success: true,
    message: "Device token removed successfully",
  });
});
module.exports = { registerDeviceTokenController, removeDeviceTokenController };
