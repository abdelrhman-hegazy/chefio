const mongoose = require("mongoose");

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
      required: [true, "password required"],
      trim: true,
      select: false,
      minlength: [6, "Too short password"],
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

module.exports = mongoose.model("User", userSchema);
