const DeviceToken = require("../models/DeviceTokenModel");

const saveDeviceToken = async (userId, token, device = "unknown") => {
  const existingToken = await DeviceToken.findOne({ user: userId, token });
  if (!existingToken) {
    const newDeviceToken = new DeviceToken({ user: userId, token, device });
    await newDeviceToken.save();
  }
};

const removeDeviceToken = async (userId, token) => {
  await DeviceToken.findOneAndDelete({ user: userId, token });
};

module.exports = {
  saveDeviceToken,
  removeDeviceToken,
};
