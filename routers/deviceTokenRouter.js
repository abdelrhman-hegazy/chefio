const express = require("express");
const router = express.Router();
const identifier = require("../middlewares/identification");
const {
  registerDeviceTokenController,
  removeDeviceTokenController,
} = require("../controllers/deviceTokenController");

router.post("/register", identifier, registerDeviceTokenController);
router.delete("/delete", identifier, removeDeviceTokenController);

module.exports = router;
