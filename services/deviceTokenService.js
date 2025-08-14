const DeviceTokenRepository = require("../repositories/deviceToken.repository");
const ensureUserExists = require("../helpers/ensureUserExists")

const saveDeviceToken = async (userId, token, device = "unknown") => {
  await ensureUserExists(userId)
  const existingToken = await DeviceTokenRepository.findOne({
    user: userId,
    device,
  });
  if (!existingToken) {
    //create new deviceToken
    await DeviceTokenRepository.create({ user: userId, token, device });
  } else {
    //update deviceToken
    await DeviceTokenRepository.updateDeviceTokenByUserId(userId, { token, device });
  }
};

const removeDeviceToken = async (userId, token) => {
  await DeviceTokenRepository.deleteByUserIdAndToken(userId, token);
};

module.exports = {
  saveDeviceToken,
  removeDeviceToken,
};
