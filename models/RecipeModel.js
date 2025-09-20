const mongoose = require("mongoose");

const steps = new mongoose.Schema(
  {
    step: {
      type: String,
      required: true,
      trim: true,
    },
    stepImage: {
      type: String,
      default: "null",
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    recipePicture: {
      type: String,
      required: [true, "Photo is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    cookingDuration: {
      type: Number,
      required: [true, "Cooking duration is required"],
      trim: true,
    },
    ingredients: {
      type: [String],
      required: [true, "Ingredients are required"],
    },
    steps: [steps],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);
