const jwt = require("jsonwebtoken");
const { sendErrorResponse } = require("../utils/errorHandler");

const identifier = (req, res, next) => {
  let token;
  
  if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  } else {
    return sendErrorResponse(
      res,
      401,
      "Unauthorized: No token provided",
      "unauthorized"
    );
  }
  try {
    const userToken = token;
    jwt.verify(userToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return sendErrorResponse(
            res,
            401,
            "Token expired",
            "TokenExpiredError"
          );
        } else if (err.name === "JsonWebTokenError") {
          return sendErrorResponse(
            res,
            403,
            "Invalid token",
            "JsonWebTokenError"
          );
        } else {
          return sendErrorResponse(
            res,
            403,
            "Unauthorized",
            "Token_verification_failed"
          );
        }
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, 500, "Internal Server Error", "ServerErroru");
  }
};

module.exports = identifier;
