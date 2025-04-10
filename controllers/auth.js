const jwt = require("jsonwebtoken");

const {
  signinSchema,
  signupSchema,
  accesptCodeSchema,
  changePasswordSchema,
  acceptEmailSchema,
  acceptResetPasswordSchema,
} = require("../middlewares/validator");
const User = require("../models/UserModel");
const RefreshToken = require("../models/RefreshTokens");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");
const { json } = require("express");
const { sendErrorResponse } = require("../utils/errorHandler");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { verifyGoogleToken } = require("../config/googleAuth");
//signup
const signup = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    const { error, value } = signupSchema.validate({
      email,
      password,
      username,
    });

    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "validation_error"
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return sendErrorResponse(res, 409, "user already exists!", "conflict");
    }

    const hashedPassword = await doHash(password, 12);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    const result = await newUser.save();
    result.password = undefined;
    res.status(201).json({
      success: true,
      message: "Your account has been created successfully",
      result,
    });
  } catch (error) {
    console.log("Error in signup:", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      "internal_server_error"
    );
  }
};

//signin
const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signinSchema.validate({ email, password });

    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "validation_error"
      );
    }
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User does not exist!", "not_found");
    }

    const result = await doHashValidation(password, existingUser.password);
    if (!result) {
      return sendErrorResponse(
        res,
        401,
        "Invalid credentials",
        "invalid_credentials"
      );
    }

    // is verify
    if (!existingUser.verified) {
      return sendErrorResponse(
        res,
        403,
        "Your email is not verified. Please verify your account.",
        "forbidden"
      );
    }

    const accessToken = generateAccessToken(existingUser);
    const refreshToken = await generateRefreshToken(existingUser);

    const isMobileClient = req.headers.client === "not-browser";
    if (isMobileClient) {
      return res.status(200).json({
        success: true,
        accessToken: "Bearer " + accessToken,
        refreshToken: "Bearer " + refreshToken,
        message: "logged in successfully",
      });
    } else {
      return res
        .cookie("Authorization", "Bearer " + refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30days
        })
        .json({
          success: true,
          accessToken: "Bearer " + accessToken,
          message: "logged in successfully",
        });
    }
  } catch (error) {
    console.log("Error in signin", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      "internal_server_error"
    );
  }
};
// signout
const signout = async (req, res) => {
  try {
    // const { refreshToken } = req.body;
    const isMobileClient = req.headers.client === "not-browser";
    const refreshToken = isMobileClient
      ? req.body.refreshToken
      : req.cookies.Authorization.split(" ")[1];

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required!" });
    }

    const tokenExists = await RefreshToken.findOne({ token: refreshToken });

    if (!tokenExists) {
      return res.status(404).json({
        success: false,
        message: "Token not found or already logged out!",
      });
    }

    await RefreshToken.deleteOne({ token: refreshToken });

    return res
      .clearCookie("Authorization")
      .status(200)
      .json({ success: true, message: "logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// send-verification-code
const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const { error, value } = acceptEmailSchema.validate({ email });
    const existingUser = await User.findOne({ email });
    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "validation_error"
      );
    }
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User does not exist!", "not_found");
    }

    if (existingUser.verified) {
      return sendErrorResponse(
        res,
        409,
        "You are already verified!",
        "conflict"
      );
    }

    const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

    if (!transport) {
      return sendErrorResponse(
        res,
        503,
        "Mail service is unavailable.",
        "service_unavailable"
      );
    }

    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Verification Code",
      html: `<h1>${codeValue}</h1>`,
    });

    if (
      info.accepted &&
      info.accepted.length > 0 &&
      info.accepted[0] === existingUser.email
    ) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );

      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();

      return res.status(200).json({ success: true, message: "Code sent!" });
    }

    return sendErrorResponse(res, 400, "Code sending failed!", "bad_request");
  } catch (error) {
    console.error("Error sending verification email:", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      "internal_server_error"
    );
  }
};
//verify-verification-code
const verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error, value } = accesptCodeSchema.validate({
      email,
      providedCode,
    });

    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "validation_error"
      );
    }
    const codeValue = providedCode.toString();

    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );

    if (!existingUser) {
      return sendErrorResponse(res, 404, "User does not exist!", "not_found");
    }
    if (existingUser.verified) {
      return sendErrorResponse(
        res,
        401,
        "You are already verified!",
        "conflict"
      );
    }

    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return sendErrorResponse(
        res,
        400,
        "Something is wrong with the code!",
        "bad_request"
      );
    }

    if (Date.now() - existingUser.verificationCodeValidation > 3 * 60 * 1000) {
      return sendErrorResponse(
        res,
        401,
        "Code has been expired!",
        "expired_code"
      );
    }

    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "your account has been verified!",
      });
    }
    return res
      .status(401)
      .json({ success: false, message: "unexpected occured!" });
  } catch (error) {
    console.log("Error in verifyVerificationCode:", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      "internal_server_error"
    );
  }
};

// change password
const changePassword = async (req, res) => {
  const { userId } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res
        .status(500)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "user does not exists!",
      });
    }
    if (!existingUser.verified) {
      return res.status(401).json({
        success: false,
        message: "You are not verifed user!",
      });
    }
    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return sendErrorResponse(
        res,
        401,
        "Invalid credentials!",
        "invalid_credentials"
      );
    }
    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();
    return res.status(200).json({
      success: true,
      message: "password updated!",
    });
  } catch (error) {
    console.log(error);
  }
};

// send-forgot-password-code
const sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;

  try {
    const { error, value } = acceptEmailSchema.validate({ email });

    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "validation_error"
      );
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User does not exist!", "not_found");
    }
    const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "forgot passwod code",
      html: "<h1>" + codeValue + "</h1>",
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({ success: true, message: "Code sent!" });
    }
    res.status(400).json({ success: false, message: "Code sent failed!" });
  } catch (error) {
    console.log("Error in signin", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      "internal_server_error"
    );
  }
};

// verify-forgot-password-code
const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error, value } = accesptCodeSchema.validate({
      email,
      providedCode,
    });
    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "validation_error"
      );
    }

    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return sendErrorResponse(res, 404, "User does not exist!", "not_found");
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return sendErrorResponse(
        res,
        401,
        "Reset code is missing or invalid. Please request a new one.",
        "invalid_code"
      );
    }

    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000 // 5 minutes
    ) {
      return sendErrorResponse(res, 401, "Code has expired!", "expired_code");
    }

    const hashedCodeValue = hmacProcess(
      providedCode.toString(),
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      return res.status(200).json({
        success: true,
        message: "code is valid, you can reset password now!",
      });
    }
    return sendErrorResponse(res, 401, "Invalid code!", "invalid_code");
  } catch (error) {
    console.log("Error in signin", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      "internal_server_error"
    );
  }
};

// reset-password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const { error, value } = acceptResetPasswordSchema.validate({
      email,
      newPassword,
    });
    if (error) {
      return sendErrorResponse(
        res,
        400,
        error.details[0].message,
        "validation_error"
      );
    }
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return sendErrorResponse(res, 404, "User does not exist!", "not_found");
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return sendErrorResponse(
        res,
        401,
        "Reset code is missing or invalid. Please request a new one.",
        "invalid_code"
      );
    }

    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    existingUser.forgotPasswordCode = undefined;
    existingUser.forgotPasswordCodeValidation = undefined;

    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: "Password has been updated successfully!",
    });
  } catch (error) {
    console.log("Error in signin", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      "internal_server_error"
    );
  }
};

// Refresh access Token
const refreshAccessToken = async (req, res) => {
  try {
    const isMobileClient = req.headers.client === "not-browser";
    const refreshToken = isMobileClient
      ? req.body.refreshToken.split(" ")[1]
      : req.cookies.Authorization.split(" ")[1];
          
    if (!refreshToken) {
      return sendErrorResponse(
        res,
        401,
        "Unauthorized access!",
        "unauthorized"
      );
    }

    const existingToken = await RefreshToken.findOne({ token: refreshToken });

    if (!existingToken) {
      return sendErrorResponse(
        res,
        403,
        "invalid refresh token",
        "invalid_token"
      );
    }
    // if(){

    // }
    const existingUser = await User.findOne({ _id: existingToken.userId });
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User does not exist!", "not_found");
    }
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decode) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            return sendErrorResponse(
              res,
              401,
              "refresh token expired",
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
        const newAccessToken = generateAccessToken(existingUser);

        return res.status(200).json({
          success: true,
          newAccessToken: "Bearer " + newAccessToken,
          message: "refresh access token successfully",
        });
      }
    );
  } catch (error) {
    console.log("Error in refreshToken", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      "internal_server_error"
    );
  }
};
// google signin
const googleSignin = async (req, res) => {
  try {
    const { IdToken } = req.body;
    if (!IdToken) {
      return sendErrorResponse(
        res,
        401,
        "IdToken is required",
        "invalid_token"
      );
    }
    const payload = await verifyGoogleToken(IdToken);
    if (!payload) {
      return sendErrorResponse(
        res,
        401,
        "Invalid Google token",
        "invalid_token"
      );
    }
    const platform =
      payload.aud === process.env.GOOGLE_CLIENT_ID_ANDROID ? "android" : "web";
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        username: payload.name,
        avatar: payload.picture,
        verified: true,
      });
      await user.save();
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    if (platform === "android") {
      return res.status(200).json({
        success: true,
        accessToken,
        refreshToken,
        message: "logged in successfully",
      });
    } else {
      return res
        .cookie("Authorization", "Bearer " + refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30days
        })
        .json({
          success: true,
          accessToken,
          message: "logged in successfully",
        });
    }
  } catch (error) {
    console.log("Error in googleSignin", error);
    return sendErrorResponse(res, 500, error.message, "internal_server_error");
  }
};
module.exports = {
  signup,
  signin,
  signout,
  sendVerificationCode,
  verifyVerificationCode,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  resetPassword,
  refreshAccessToken,
  googleSignin,
};
