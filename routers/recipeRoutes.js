const express = require("express");
const {
  createRecipe,
  getCategories,
  getRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
} = require("../controllers/recipeController");
const identifier = require("../middlewares/identification");
const uploadMulter = require("../middlewares/upload");
const router = express.Router();
// routs
router.get("/get-categories", identifier, getCategories);
router.post(
  "/create-recipe",
  identifier,
  uploadMulter("recipePicture"),
  createRecipe
);
router.get("/get-recipes", identifier, getRecipe);
router.get("/get-recipe/:id", identifier, getRecipeById);
router.patch("/update-recipe/:id", identifier, updateRecipe);
router.delete("/delete-recipe/:id", identifier, deleteRecipe);
router.patch("/like-recipe/:id", identifier, likeRecipe);
module.exports = router;
