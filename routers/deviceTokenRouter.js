const express = require("express");
const router = express.Router();
const identifier = require("../middlewares/identification");
const {
  registerDeviceTokenController,
  removeDeviceTokenController,
} = require("../controllers/deviceTokenController");

router.post("/register-token", identifier, registerDeviceTokenController);
router.delete("/remove-token", identifier, removeDeviceTokenController);

module.exports = router;
