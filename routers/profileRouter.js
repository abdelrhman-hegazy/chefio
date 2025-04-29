const express = require("express");
const {
  uploadProfilePicture,
  getProfile,
} = require("../controllers/profileController");
const identifier = require("../middlewares/identification");
// const upload = require('../middlewares/upload');
const uploadMulter = require("../middlewares/upload");
const router = express.Router();

router.patch(
  "/upload-profile-picture",
  identifier,
  uploadMulter("profilePicture"),
  uploadProfilePicture
);
router.get("/get-profile/:userId", identifier, getProfile);

module.exports = router;
