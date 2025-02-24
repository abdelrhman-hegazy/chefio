const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipePicture: {
      type: String,
      required: [true, "Photo is required"],
      trim: true,
    },
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    cookingDuration: {
      type: String,
      required: [true, "Cooking duration is required"],
      trim: true,
    },
    ingredients: {
      type: [String],
      required: [true, "Ingredients are required"],
    },
    steps: {
      type: [String],
      required: [true, "Steps are required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);
