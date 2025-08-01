const BaseRepository = require("./base.repository");
const Recipe = require("../models/RecipeModel");

class RecipeRepository extends BaseRepository {
  constructor() {
    super(Recipe);
  }

  findByFilterRecipe(filter, sort, skip, limitNumber) {
    return this.model
      .find(filter)
      .populate({ path: "createdBy", select: "username profilePicture" })
      .populate({ path: "category", select: "name" })
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .select("recipePicture likesCount foodName cookingDuration createdAt")
      .lean();
  }

  findByIdRecipe(recipeId) {
    return this.model
      .findById(recipeId)
      .populate({
        path: "createdBy",
        select: "username profilePicture",
      })
      .populate({
        path: "category",
        select: "name",
      })
      .lean();
  }
  async findRecipebyUserId(userId, skip = 0, limit = 10) {
    return this.model
      .find({ createdBy: userId })
      .select("recipePicture foodName cookingDuration category")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skipRecipes)
      .limit(limitRecipes)
      .lean();
  }
}

module.exports = new RecipeRepository();
