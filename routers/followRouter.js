const express = require("express");
const {
  followChef,
  getFollowers,
  getFollowing,
} = require("../controllers/followController");
const identifier = require("../middlewares/identification");
const router = express.Router();

router.post("/:targetUserId", identifier, followChef);
router.get("/get-followers/:userId", identifier, getFollowers);
router.get("/get-following/:userId", identifier, getFollowing);
module.exports = router;
