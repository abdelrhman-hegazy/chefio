const mongoose = require("mongoose");
const { follower, following } = require("./FollowModel");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username required"],
      trim: true,
      minLength: 3,
    },
    email: {
      type: String,
      required: [true, "email required"],
      trim: true,
      unique: [true, "email must be unique"],
      minLength: [5, "email must have 5 characters!"],
      lowercase: true,
    },
    password: {
      type: String,
      trim: true,
      select: false,
      minlength: [6, "Too short password"],
      required: function () {
        return !this.googleId;
      },
    },
    refreshToken: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    profilePicture: {
      type: String,
    },
    followers: [follower],
    following: [following],
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeValidation: {
      type: Number,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: {
      type: Number,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

module.exports = mongoose.model("User", userSchema);
