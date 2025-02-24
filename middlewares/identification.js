// const jwt = require("jsonwebtoken");
// const { sendErrorResponse } = require("../utils/errorHandler");

// const identifier = (req, res, next) => {
//   let token;
//   if (req.headers.client === "not-browser") {
//     token = req.headers.authorization;
//   } else {
//     token = req.cookies["Authorization"];
//   }

//   if (!token) {
//     return sendErrorResponse(res, 403, "Unauthorized", "Unauthorized");
//   }

//   try {
//     const userToken = token.split(" ")[1];

//     // jwt.verify(userToken, process.env.TOKEN_SECRET, (err, decoded) => {
//     //   if (err) {
//     //     if (err.name === "TokenExpiredError") {
//     //       return sendErrorResponse(res, 401, "Token expired", "TokenExpiredError");
//     //     } else if (err.name === "JsonWebTokenError") {
//     //       return sendErrorResponse(res, 403, "Invalid token", "JsonWebTokenError");
//     //     } else {
//     //       return sendErrorResponse(res, 403, "Unauthorized", "Token verification failed");
//     //     }
//     //   }

//     //   req.user = decoded;
//     //   next();
//     // });
//     //

//     const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
//     if (jwtVerified) {
//       req.user = jwtVerified;
//       next();
//     } else {
//       return sendErrorResponse(res, 401, "Invalid token", "Invalid_token");
//     }
//   } catch (error) {
//     console.log(error);
//     return res
//       .status(401)
//       .json({ success: false, message: "Token verification failed" }); // إرجاع استجابة خطأ في حالة حدوث استثناء
//   }
// };

// module.exports = identifier;

const jwt = require("jsonwebtoken");
const { sendErrorResponse } = require("../utils/errorHandler");

const identifier = (req, res, next) => {
  let token;
  
  if (req.headers.client === "not-browser") {
    token = req.headers.cookie.split("%20")[1];
  } else {
    token = req.cookies["Authorization"].split(" ")[1];
  }

  if (!token) {
    return sendErrorResponse(res, 401, "No_token_provided", "Unauthorized");
  }

  try {
    const userToken = token;

    jwt.verify(userToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
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
