const DeviceToken = require("../models/DeviceTokenModel");

const saveDeviceToken = async (userId, token, device = "unknown") => {
  const existingDeviceToken = await DeviceToken.findOne({ user: userId ,token});
  if (existingDeviceToken) {
    return;
  }
  const existingToken = await DeviceToken.findOne({ user: userId , device});
  if (!existingToken) {
    //create new deviceToken
    const newDeviceToken = new DeviceToken({ user: userId, token, device });
    await newDeviceToken.save();
  } else {
    //update deviceToken
    await DeviceToken.updateOne({ user: userId }, { token, device });
  }
};

const removeDeviceToken = async (userId, token) => {
  await DeviceToken.findOneAndDelete({ user: userId, token });
};

module.exports = {
  saveDeviceToken,
  removeDeviceToken,
};
