const { sendErrorResponse } = require("../utils/errorResponse");

const validate = (schema) => {
  return (req, res, next) => {
    if (req.body.ingredients && typeof req.body.ingredients === "string") {
      req.body.ingredients = JSON.parse(req.body.ingredients);
    }

    if (req.body.steps && typeof req.body.steps === "string") {
      req.body.steps = JSON.parse(req.body.steps);
    }
    const { error } = schema.validate(req.body);
    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "validation_error"
      );
    }
    next();
  };
};
module.exports = validate;
