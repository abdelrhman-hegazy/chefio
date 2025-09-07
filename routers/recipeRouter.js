const express = require("express");
const router = express.Router();
const {
  createRecipe,
  getCategories,
  getRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  deleteRecipeById,
} = require("../controllers/recipeController");

const identifier = require("../middlewares/identification");
const { upload } = require("../middlewares/upload");
const validate = require("../middlewares/validate");
const validateObjectId = require("../middlewares/validateObjectId");
const { recipeSchema, recipeUpdateSchema } = require("../middlewares/schemas");

// routs
router.get("/get-categories", identifier, getCategories);
router.post(
  "/create-recipe",
  identifier,
  upload.any(),
  validate(recipeSchema),
  createRecipe
);
router.get("/get-recipes", identifier, getRecipe);
router.get(
  "/get-recipe/:id",
  identifier,
  validateObjectId("id"),
  getRecipeById
);
router.patch(
  "/update-recipe/:id",
  identifier,
  upload.any(),
  validate(recipeUpdateSchema),
  validateObjectId("id"),
  updateRecipe
);
router.delete(
  "/delete-recipe/:id",
  identifier,
  validateObjectId("id"),
  deleteRecipe
);
router.delete(
  "/admin/delete-recipe/:id",
  deleteRecipeById
);
// Export the router
module.exports = router;
