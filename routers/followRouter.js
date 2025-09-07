const express = require("express");
const {
  followChef,
  getFollowers,
  getFollowing,
} = require("../controllers/followController");
const identifier = require("../middlewares/identification");
const router = express.Router();

router.post("/:targetUserId", identifier, followChef);
router.get("/get-followers/:targetUserId", identifier, getFollowers);
router.get("/get-following/:targetUserId", identifier, getFollowing);
module.exports = router;
