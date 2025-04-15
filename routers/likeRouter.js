const express = require("express");
const { like } = require("../controllers/likeController");
const identifier = require("../middlewares/identification");
const router = express.Router();

router.post("/:recipeId", identifier, like);

module.exports = router;
