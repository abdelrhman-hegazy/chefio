const BaseRepository = require("../repositories/base.repository");
const Like = require("../models/LikeModel");

class LikeRepository extends BaseRepository {
  constructor() {
    super(Like);
  }
  isLiked(userId, recipes) {
    return this.model.exists({
      user: userId,
      recipe: { $in: recipes.map((recipe) => recipe._id) },
    });
  }
  findLikesRecipe(userId, recipes) {
    return this.model.find({
      user: userId,
      recipe: { $in: recipes.map((recipe) => recipe._id) },
    });
  }
  async findUserByRecipeId(recipe) {
    return this.model.find(recipe).populate("user", "username profilePicture");
  }
  async findRecipeByUserId(userId) {
    return this.model.find({ user: userId }).select("recipe").lean();
  }
  async findLikedRecipesByUserId(targetUserId, skip, limit) {
    return this.model.find({ user: targetUserId })
    .select("recipe")
    .populate({
      path: "recipe",
      select: "recipePicture foodName cookingDuration category createdBy",
      populate: [
        { path: "category", select: "name" },
        { path: "createdBy", select: "_id username profilePicture" },
      ],
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  }
}

module.exports = new LikeRepository();
