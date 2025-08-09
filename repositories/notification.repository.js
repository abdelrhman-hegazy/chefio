const BaseRepository = require("./base.repository");
const Notification = require("../models/NotificationModel")
class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findSenderByReceiverId(userId, skip, limit) {
    return this.model
      .find({ receiver: userId })
      .populate("sender", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  async countDocumentsByReceiverId(userId) {
    return this.model.countDocuments({ receiver: userId });
  }
  async updateManyNotify(filter, update) {
    return this.model.updateMany(filter, update, {
      new: true,
      runValidators: true,
    });
  }
}

module.exports = new NotificationRepository();
