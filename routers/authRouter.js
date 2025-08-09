const express = require("express");
const router = express.Router();

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
  googleSignin,
} = require("../controllers/auth");

const identifier = require("../middlewares/identification");
const validate = require("../middlewares/validate");
const authLimiter = require("../middlewares/rateLimiter");
const {
  signupSchema,
  signinSchema,
  changePasswordSchema,
  acceptEmailSchema,
  accesptCodeSchema,
  acceptResetPasswordSchema,
  googleSigninSchema,
} = require("../middlewares/schemas");

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/signin", authLimiter, validate(signinSchema), signin);
router.post(
  "/google-signin",
  authLimiter,
  validate(googleSigninSchema),
  googleSignin
);

router.post("/signout", identifier, signout);

router.patch(
  "/send-verification-code",
  authLimiter,
  validate(acceptEmailSchema),
  sendVerificationCode
);
router.patch(
  "/verify-verification-code",
  authLimiter,
  validate(accesptCodeSchema),
  verifyVerificationCode
);

router.patch(
  "/change-password",
  identifier,
  validate(changePasswordSchema),
  changePassword
);

router.post(
  "/send-forgot-password-code",
  validate(acceptEmailSchema),
  sendForgotPasswordCode
);
router.post(
  "/verify-forgot-password-code",
  validate(accesptCodeSchema),
  verifyForgotPasswordCode
);
router.patch(
  "/reset-password",
  identifier,
  validate(acceptResetPasswordSchema),
  resetPassword
);

router.post("/refresh-token", refreshAccessToken);

module.exports = router;
