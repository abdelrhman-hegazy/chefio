const mongoose = require("mongoose");

const following = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    followedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
const follower = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    followedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = { follower, following };