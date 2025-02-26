const User = require("../models/User");
const { sendErrorResponse } = require("../utils/errorHandler");

const uploadProfilePicture = async (req, res) => {
  const { userId } = req.user;

  if (!req.file || !req.file.path) {
    return sendErrorResponse(res, 400, "No image file provided", "bad_request");
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: req.file.path },
      { new: true }
    );
    if (!updatedUser) {
      return sendErrorResponse(res, 404, "User not found", "conflict");
    }

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully!",
      profilePicture: updatedUser.profilePicture,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
    sendErrorResponse(res, 400, error.message, "conflict");
  }
};

module.exports = { uploadProfilePicture };
