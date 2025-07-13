const express = require("express");
const router = express.Router();
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
const {uploadMulter,upload} = require("../middlewares/upload");
const validate = require("../middlewares/validate");

const { recipeSchema, recipeUpdateSchema } = require("../middlewares/schemas");

// routs
router.get("/get-categories", identifier, getCategories);
router.post(
  "/create-recipe",
  identifier,
  upload.fields([
    { name: "recipePicture", maxCount: 1 },
    { name: "stepImage", maxCount: 20 },
  ]),
  validate(recipeSchema),
  createRecipe
);
router.get("/get-recipes", identifier, getRecipe);
router.get("/get-recipe/:id", identifier, getRecipeById);
router.patch(
  "/update-recipe/:id",
  identifier,
  upload.fields([
    { name: "recipePicture", maxCount: 1 },
    { name: "stepImage", maxCount: 20 },
  ]),
  validate(recipeUpdateSchema),
  updateRecipe
);
router.delete("/delete-recipe/:id", identifier, deleteRecipe);
router.patch("/like-recipe/:id", identifier, likeRecipe);

// Export the router
module.exports = router;
