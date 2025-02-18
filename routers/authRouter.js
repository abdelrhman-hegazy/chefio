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
} = require("../controllers/auth");
const identifier = require("../middlewares/identification");
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", identifier, signout);

router.patch("/send-verification-code", sendVerificationCode);
router.patch("/verify-verification-code", verifyVerificationCode);

router.patch("/change-password", identifier, changePassword);
router.patch("/send-forgot-password-code", sendForgotPasswordCode);
router.patch("/verify-forgot-password-code", verifyForgotPasswordCode);



module.exports = router;
