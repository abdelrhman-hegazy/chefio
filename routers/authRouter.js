const express = require("express");
const {
  signup,
  signin,
  signout,
  sendverificationCode,
  verifyVerificationCode,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
} = require("../controllers/auth");
const identifier = require("../middlewares/identification");
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", identifier, signout);

router.patch("/send-verification-code", identifier, sendverificationCode);
router.patch("/verify-verification-code", identifier, verifyVerificationCode);

router.patch("/change-password", identifier, changePassword);
router.patch("/send-forgot-password-code", sendForgotPasswordCode);
router.patch("/verify-forgot-password-code", verifyForgotPasswordCode);

module.exports = router;
