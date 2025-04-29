const User = require("../models/ProfileModel");
const Follow = require("../models/FollowModel");
const Recipe = require("../models/RecipeModel");
const Like = require("../models/LikeModel");
const { sendErrorResponse } = require("../utils/errorHandler");
const cookieParser = require("cookie-parser");

const uploadProfilePicture = async (req, res) => {
  const { userId } = req.user;

  if (!req.file || !req.file.path) {
    return sendErrorResponse(res, 400, "No image file provided", "bad_request");
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: req.file.path },
      { new: true }
    );
    if (!updatedUser) {
      return sendErrorResponse(res, 404, "User not found", "conflict");
    }

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully!",
      profilePicture: updatedUser.profilePicture,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userId: targetUserId } = req.params;

    // pagination for recipes
    const pageRecipes = parseInt(req.query.pageRecipes) || 1;
    const limitRecipes = parseInt(req.query.limitRecipes) || 10;
    const skipRecipes = (pageRecipes - 1) * limitRecipes;

    // pagination for likedRecipes
    const pageLikedRecipes = parseInt(req.query.pageLikedRecipes) || 1;
    const limitLikedRecipes = parseInt(req.query.limitLikedRecipes) || 10;
    const skipLikedRecipes = (pageLikedRecipes - 1) * limitLikedRecipes;

    const [
      targetUser,
      currentUser,
      currentUserLikes,
      totalUserRecipes,
      userRecipes,
      // totalUserLikedRecipes,
      // userLikedRecipes,
      // isfollowing,
    ] = await Promise.all([
      User.findById(targetUserId).select("-password -__v").lean(),
      User.findById(userId).lean(),
      Like.find({ user: userId }).select("recipe").lean(),
      Recipe.countDocuments({ createdBy: targetUserId }),
      Recipe.find({ createdBy: targetUserId })
        .select("recipePicture foodName cookingDuration category")
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skipRecipes)
        .limit(limitRecipes)
        .lean(),
      // Like.countDocuments({ user: targetUserId }),
      // Like.find({ user: targetUserId })
      //   .select("-_id -__v -user -createdAt -updatedAt")
      //   .populate({
      //     path: "recipe",
      //     select: "recipePicture foodName cookingDuration category",
      //     populate: { path: "category", select: "name" },
      //   })
      //   .sort({ createdAt: -1 })
      //   .skip(skipLikedRecipes)
      //   .limit(limitLikedRecipes)
      //   .lean(),
      // Follow.findOne({
      //   follower: userId,
      //   following: targetUserId,
      // }).lean(),
    ]);

    const follow = await Follow.findOne({
      follower: userId,
      following: targetUserId,
    });
    if (follow) {
      isfollowing = "following";
    } else {
      isfollowing = "not_following";
    }
    if (!targetUser) {
      return sendErrorResponse(res, 404, "Target user not found", "not_found");
    }

    if (!currentUser) {
      return sendErrorResponse(res, 404, "Current user not found", "not_found");
    }
    if (userId === targetUserId) {
      isfollowing = "my_Profile";
    }

    const likedRecipeIds = new Set(
      currentUserLikes.map((like) => like.recipe.toString())
    );

    const formattedRecipes = userRecipes.map((recipe) => ({
      ...recipe,
      isLiked: likedRecipeIds.has(recipe._id.toString()),
    }));

    // const formattedLikedRecipes = userLikedRecipes.map((like) => ({
    //   ...like.recipe,
    //   isLiked: likedRecipeIds.has(like.recipe._id.toString()),
    // }));

    const profileData = {
      username: targetUser.username,
      email: targetUser.email,
      profilePicture: targetUser.profilePicture,
      followersCount: targetUser.followersCount,
      followingCount: targetUser.followingCount,
      isFollowing: isfollowing,
      // likesCount: currentUserLikes.length,
      recipes: {
        totalRecipes: totalUserRecipes,
        currentPage: pageRecipes,
        totalPages: Math.ceil(totalUserRecipes / limitRecipes),
        recipes: formattedRecipes,
      },
      // likedRecipes: {
      //   totalLikedRecipes: totalUserLikedRecipes,
      //   currentPage: pageLikedRecipes,
      //   totalPages: Math.ceil(totalUserLikedRecipes / limitLikedRecipes),
      //   recipes: formattedLikedRecipes,
      // },
    };

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully!",
      profile: profileData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

const getRecipesProfile = async (req, res) => {
  const { userId } = req.user;
  const { userId: targetUserId } = req.params;

  // pagination for recipes
  const pageRecipes = parseInt(req.query.pageRecipes) || 1;
  const limitRecipes = parseInt(req.query.limitRecipes) || 10;
  const skipRecipes = (pageRecipes - 1) * limitRecipes;

  try {
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return sendErrorResponse(res, 404, "Target user not found", "not_found");
    }

    const totalUserRecipes = await Recipe.countDocuments({
      createdBy: targetUserId,
    });
    const userRecipes = await Recipe.find({ createdBy: targetUserId })
      .select("recipePicture foodName cookingDuration category")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skipRecipes)
      .limit(limitRecipes)
      .lean();

    const currentuserLikes = await Like.find({ user: userId })
      .select("recipe")
      .lean();

    const likedRecipeIds = new Set(
      currentuserLikes.map((like) => like.recipe.toString())
    );
    const formattedRecipes = userRecipes.map((recipe) => ({
      ...recipe,
      isLiked: likedRecipeIds.has(recipe._id.toString()),
    }));
    res.status(200).json({
      success: true,
      message: "User recipes fetched successfully!",
      recipes: {
        totalRecipes: totalUserRecipes,
        currentPage: pageRecipes,
        totalPages: Math.ceil(totalUserRecipes / limitRecipes),
        recipes: formattedRecipes,
      },
    });
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

const getLikedRecipesProfile = async (req, res) => {
  const { userId } = req.user;
  const { userId: targetUserId } = req.params;

  // pagination for likedRecipes
  const pageLikedRecipes = parseInt(req.query.pageLikedRecipes) || 1;
  const limitLikedRecipes = parseInt(req.query.limitLikedRecipes) || 10;
  const skipLikedRecipes = (pageLikedRecipes - 1) * limitLikedRecipes;

  try {
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return sendErrorResponse(res, 404, "Target user not found", "not_found");
    }

    const totalUserLikedRecipes = await Like.countDocuments({
      user: targetUserId,
    });
    const userLikedRecipes = await Like.find({ user: targetUserId })
      .select("-_id -__v -user -createdAt -updatedAt")
      .populate({
        path: "recipe",
        select: "recipePicture foodName cookingDuration category",
        populate: { path: "category", select: "name" },
      })
      .sort({ createdAt: -1 })
      .skip(skipLikedRecipes)
      .limit(limitLikedRecipes)
      .lean();
    const currentuserLikes = await Like.find({ user: userId })
      .select("recipe")
      .lean();
    const likedRecipeIds = new Set(
      currentuserLikes.map((like) => like.recipe.toString())
    );
    const formattedLikedRecipes = userLikedRecipes.map((like) => ({
      ...like.recipe,
      isLiked: likedRecipeIds.has(like.recipe._id.toString()),
    }));
    res.status(200).json({
      success: true,
      message: "User liked recipes fetched successfully!",
      recipes: {
        totalLikedRecipes: totalUserLikedRecipes,
        currentPage: pageLikedRecipes,
        totalPages: Math.ceil(totalUserLikedRecipes / limitLikedRecipes),
        recipes: formattedLikedRecipes,
      },
    });
  } catch (error) {
    console.error("Error fetching user liked recipes:", error);
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

module.exports = {
  uploadProfilePicture,
  getProfile,
  getRecipesProfile,
  getLikedRecipesProfile,
};
