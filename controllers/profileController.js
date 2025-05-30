const User = require("../models/UserModel");
const Follow = require("../models/FollowModel");
const Recipe = require("../models/RecipeModel");
const Like = require("../models/LikeModel");
const { sendErrorResponse } = require("../utils/errorHandler");
const cookieParser = require("cookie-parser");

//endpoint to upload a profile picture
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
// endpoint to get the profile of a user
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userId: targetUserId } = req.params;

    // pagination setup
    const pageRecipes = parseInt(req.query.pageRecipes) || 1;
    const limitRecipes = parseInt(req.query.limitRecipes) || 10;
    const skipRecipes = (pageRecipes - 1) * limitRecipes;

    const [
      targetUser,
      currentUser,
      currentUserLikes,
      totalUserRecipes,
      userRecipes,
      followDoc,
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
      Follow.findOne({ follower: targetUserId, following: userId }).lean(),
    ]);

    if (!targetUser) {
      return sendErrorResponse(res, 404, "Target user not found", "not_found");
    }

    if (!currentUser) {
      return sendErrorResponse(res, 404, "Current user not found", "not_found");
    }

    let isFollowing = "not_following";
    if (userId === targetUserId) {
      isFollowing = "my_Profile";
    } else if (followDoc) {
      isFollowing = "following";
    }

    const likedRecipeIds = new Set(
      currentUserLikes.map((like) => like.recipe.toString())
    );

    const formattedRecipes = userRecipes.map((recipe) => ({
      _id: recipe._id,
      recipePicture: recipe.recipePicture,
      foodName: recipe.foodName,
      cookingDuration: recipe.cookingDuration,
      category: recipe.category,
      isLiked: likedRecipeIds.has(recipe._id.toString()),
    }));

    const profileData = {
      _id: targetUser._id,
      username: targetUser.username,
      email: targetUser.email,
      profilePicture: targetUser.profilePicture,
      followersCount: targetUser.followersCount,
      followingCount: targetUser.followingCount,
      isFollowing,
      recipes: {
        totalRecipes: totalUserRecipes,
        currentPage: pageRecipes,
        totalPages: Math.ceil(totalUserRecipes / limitRecipes),
        data: formattedRecipes,
      },
    };

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully!",
      profile: profileData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

// endpoint to get the liked recipes of a user
const getRecipesProfile = async (req, res) => {
  const { userId } = req.user;
  const { userId: targetUserId } = req.params;

  const page = parseInt(req.query.pageRecipes) || 1;
  const limit = parseInt(req.query.limitRecipes) || 10;
  const skip = (page - 1) * limit;

  try {
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return sendErrorResponse(res, 404, "Target user not found", "not_found");
    }

    const totalRecipes = await Recipe.countDocuments({
      createdBy: targetUserId,
    });

    const recipes = await Recipe.find({ createdBy: targetUserId })
      .select("recipePicture foodName cookingDuration category createdBy")
      .populate([
        { path: "category", select: "name" },
        { path: "createdBy", select: "_id username profilePicture" },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userLikes = await Like.find({ user: userId }).select("recipe").lean();
    const likedIds = new Set(userLikes.map((like) => like.recipe.toString()));

    const formatted = recipes.map((recipe) => ({
      _id: recipe._id,
      recipePicture: recipe.recipePicture,
      foodName: recipe.foodName,
      cookingDuration: recipe.cookingDuration,
      category: recipe.category,
      createdBy: recipe.createdBy
        ? {
            _id: recipe.createdBy._id,
            username: recipe.createdBy.username,
            profilePicture: recipe.createdBy.profilePicture,
          }
        : null,
      isLiked: likedIds.has(recipe._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      message: "User recipes fetched successfully!",
      recipes: {
        totalRecipes,
        currentPage: page,
        totalPages: Math.ceil(totalRecipes / limit),
        data: formatted,
      },
    });
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

//endpoint to get the liked recipes of a user
const getLikedRecipesProfile = async (req, res) => {
  const { userId } = req.user;
  const { userId: targetUserId } = req.params;

  const page = parseInt(req.query.pageLikedRecipes) || 1;
  const limit = parseInt(req.query.limitLikedRecipes) || 10;
  const skip = (page - 1) * limit;

  try {
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return sendErrorResponse(res, 404, "Target user not found", "not_found");
    }

    const totalLiked = await Like.countDocuments({ user: targetUserId });

    const likedRecipes = await Like.find({ user: targetUserId })
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

    const currentUserLikes = await Like.find({ user: userId })
      .select("recipe")
      .lean();
    const likedRecipeIds = new Set(
      currentUserLikes.map((like) => like.recipe.toString())
    );

    const formattedRecipes = likedRecipes
      .map((like) => like.recipe)
      .filter((recipe) => recipe)
      .map((recipe) => ({
        ...recipe,
        category: recipe.category,
        createdBy: recipe.createdBy
          ? {
              _id: recipe.createdBy._id,
              username: recipe.createdBy.username,
              profilePicture: recipe.createdBy.profilePicture,
            }
          : null,
        isLiked: likedRecipeIds.has(recipe._id.toString()),
      }));

    return res.status(200).json({
      success: true,
      message: "User liked recipes fetched successfully!",
      recipes: {
        totalLikedRecipes: totalLiked,
        currentPage: page,
        totalPages: Math.ceil(totalLiked / limit),
        data: formattedRecipes,
      },
    });
  } catch (error) {
    console.error("Error fetching user liked recipes:", error);
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};

// endpoint edit profile
const editProfile = async (req, res) => {
  const { userId } = req.user;
  const { username } = req.body;
  try {
    const user = await User.findById(userId).select("username profilePicture");
    if (!user) {
      return sendErrorResponse(res, 404, "User not found", "not_found");
    }
    let profilePicture;
    if (!req.file || !req.file.path) {
      profilePicture = user.profilePicture; // No new profile picture provided
    } else {
      profilePicture = req.file.path; // Check if a new profile picture is provided
    }
    let updatedUser; // Default to the current user
    if (username || req.file) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { username, profilePicture },
        { new: true }
      ).select("username profilePicture");
    } else {
      updatedUser = user;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      profile: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return sendErrorResponse(res, 500, error.message, "server_error");
  }
};
module.exports = {
  uploadProfilePicture,
  getProfile,
  getRecipesProfile,
  getLikedRecipesProfile,
  editProfile,
};
