const express = require("express");
const router = express.Router();
const identifier = require("../middlewares/identification");
const {
  registerDeviceTokenController,
  removeDeviceTokenController,
} = require("../controllers/deviceTokenController");

router.post("/register", identifier, registerDeviceTokenController);
router.delete("/device-tokens", identifier, removeDeviceTokenController);

module.exports = router;
