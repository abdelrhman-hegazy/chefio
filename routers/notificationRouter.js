const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsReadAll,
  markAsReadById,
} = require("../controllers/notificationController");
const identifier = require("../middlewares/identification");

router.get("/:userId", identifier, getNotifications);
router.patch("/mark-as-read/:notificationId", identifier, markAsReadById);
router.patch("/mark-all-as-read/:userId", identifier, markAsReadAll);

module.exports = router;
