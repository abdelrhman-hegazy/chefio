// middlewares/validateObjectId.js
const mongoose = require("mongoose");
const AppError = require("../utils/appError");

module.exports = (paramName = "id") => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError(`Invalid ${paramName} format`, 400, "bad_request"));
  }
  next();
}