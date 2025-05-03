const {
  saveDeviceToken,
  removeDeviceToken,
} = require("../services/deviceTokenService");
const { sendErrorResponse } = require("../utils/errorHandler");
const registerDeviceTokenController = async (req, res) => {
  const { userId } = req.user;
  const { token, device } = req.body;
  if (!token) {
    return sendErrorResponse(
      res,
      400,
      "FCM Token is required",
      "token_required"
    );
  }
  try {
    await saveDeviceToken(userId, token, device);
    return res.status(200).json({
      success: true,
      message: "Device token saved successfully",
    });
  } catch (error) {
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

const removeDeviceTokenController = async (req, res) => {
  const { userId } = req.user;
  const { token } = req.body;
  if (!token) {
    return sendErrorResponse(
      res,
      400,
      "FCM Token is required",
      "token_required"
    );
  }
  try {
    await removeDeviceToken(userId, token);
    return res.status(200).json({
      success: true,
      message: "Device token removed successfully",
    });
  } catch (error) {
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};
module.exports = { registerDeviceTokenController, removeDeviceTokenController };
