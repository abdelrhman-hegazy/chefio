const mongoose = require("mongoose");
const deviceTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  device: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

deviceTokenSchema.index({ user: 1, token: 1 }, { unique: true });

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);
