const DeviceToken = require("../models/DeviceTokenModel");
const BaseRepository = require("./base.repository");
class DeviceTokenRepository extends BaseRepository {
  constructor(){
    super(DeviceToken)
  }
  async deleteByUserId(userId) {
    return await this.model.deleteMany({ user: userId });
  }
  async findDeviceTokensByUserId(receiverId) {
    return this.model
      .find({
        user: receiverId,
      })
      .select("token -_id");
  }
  async updateDeviceTokenByUserId(userId, data) {
    return this.model.findOneAndUpdate({ user: userId }, data, {
      new: true,
      runValidators: true,
    });
  }
  async deleteByUserIdAndToken(userId, token) {
    return this.model.findOneAndDelete({ user: userId, token });
  }
}

module.exports = new DeviceTokenRepository();
