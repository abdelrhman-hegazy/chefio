const express = require("express");
const passport = require("passport");
const {
  signup,
  signin,
  signout,
  sendVerificationCode,
  verifyVerificationCode,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  resetPassword,
  refreshAccessToken,
} = require("../controllers/auth");
const identifier = require("../middlewares/identification");
const { ref } = require("joi");
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", identifier, signout);

router.patch("/send-verification-code", sendVerificationCode);
router.patch("/verify-verification-code", verifyVerificationCode);

router.patch("/change-password", identifier, changePassword);

router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/verify-forgot-password-code", verifyForgotPasswordCode);
router.patch("/reset-password", identifier, resetPassword);

router.post("/refresh-token",  refreshAccessToken);
module.exports = router;
