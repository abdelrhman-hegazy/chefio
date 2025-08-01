const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const identifier = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError("Unauthorized: No token provided", 401, "unauthorized")
    );
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Token expired", 401, "token_expired"));
      }
      if (err.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token", 401, "invalid_token"));
      }

      return next(
        new AppError(
          "Token verification failed",
          403,
          "token_verification_failed"
        )
      );
    }

    req.user = decoded;
    next();
  });
});

module.exports = identifier;
