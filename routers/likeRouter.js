const express = require("express");
const { like, getLikes } = require("../controllers/likeController");
const identifier = require("../middlewares/identification");

const router = express.Router();

router.post("/:recipeId", identifier, like);
router.get("/get-recipe-likes/:recipeId", identifier, getLikes);
module.exports = router;
