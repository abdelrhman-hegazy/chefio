const express = require("express");
const {
  uploadProfilePicture,
  getProfile,
  getRecipesProfile,
  getLikedRecipesProfile,
  editProfile,
} = require("../controllers/profileController");
const identifier = require("../middlewares/identification");
// const upload = require('../middlewares/upload');
const { uploadMulter } = require("../middlewares/upload");
const router = express.Router();

router.patch(
  "/upload-profile-picture",
  identifier,
  uploadMulter("profilePicture"),
  uploadProfilePicture
);
router.patch(
  "/edit-profile",
  identifier,
  uploadMulter("profilePicture"),
  editProfile
);
router.get("/get-profile/:targetUserId", identifier, getProfile);
router.get("/get-recipes-profile/:targetUserId", identifier, getRecipesProfile);
router.get(
  "/get-liked-recipes-profile/:userId",
  identifier,
  getLikedRecipesProfile
);

module.exports = router;
