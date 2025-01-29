const express = require("express");
const {
  signup,
  signin,
  signout,
  sendverificationCode,
  verifyVerificationCode,
} = require("../controllers/auth");
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);

router.patch("/send-verification-code", sendverificationCode);
router.patch("/verify-verification-code", verifyVerificationCode);

module.exports = router;
