const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const RefreshToken = require("../models/RefreshTokens");
const DeviceToken = require("../models/DeviceTokenModel");
const crypto = require("crypto");
const { verificationCodeTemplate } = require("../utils/emailTemplates");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");
const { sendErrorResponse } = require("../utils/errorResponse");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { verifyGoogleToken } = require("../config/googleAuth");
const { checkUserByEmail, checkUserById } = require("../utils/userChecks");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
//signup
const signup = catchAsync(async (req, res, next) => {
  const { email, password, username } = req.body;

  if (await checkUserByEmail(email)) {
    return next(new AppError("user already exists!", 409, "conflict"));
  }
  const hashedPassword = await doHash(password, 12);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  const result = await newUser.save();
  result.password = undefined;
  return res.status(201).json({
    success: true,
    message: "Your account has been created successfully",
    result,
  });
});

//signin
const signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email }).select(
    "+password +verified"
  );
  if (!existingUser) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }
  // check password
  if (!password) {
    return next(new AppError("Password is required!", 400, "bad_request"));
  }
  const result = await doHashValidation(password, existingUser.password);
  if (!result) {
    return next(
      new AppError("Invalid credentials!", 401, "invalid_credentials")
    );
  }

  // is verify
  if (!existingUser.verified) {
    return next(
      new AppError("You are not verified user!", 401, "email_not_verified")
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
});

const signout = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  console.log("signout userId", userId);

  if (!userId) {
    return next(new AppError("User ID is required!", 400, "bad_request"));
  }
  if (!(await checkUserById(userId))) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }

  // Clear the refresh token from the database
  await RefreshToken.deleteMany({ userId });
  // Clear the device token from the database
  await DeviceToken.deleteMany({ user: userId });
  // Clear the cookie if it's a web client
  const isMobileClient = req.headers.client === "not-browser";
  if (!isMobileClient) {
    return res
      .clearCookie("Authorization")
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  }
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
// send-verification-code
const sendVerificationCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const existingUser = await checkUserByEmail(email);
  if (!existingUser)
    return next(new AppError("User does not exist!", 404, "not_found"));

  if (existingUser.verified)
    return next(new AppError("You are already verified!", 401, "conflict"));

  const codeValue = crypto.randomInt(100000, 999999).toString();

  if (!transport) {
    return next(
      new AppError(
        "Email transport is not available!",
        500,
        "internal_server_error"
      )
    );
  }

  let info = await transport.sendMail({
    from: `"Chefio Support" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
    to: existingUser.email,
    subject: "Verification Code",
    html: verificationCodeTemplate(codeValue),
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

  return next(
    new AppError("Failed to send verification code!", 400, "bad_request")
  );
});
//verify-verification-code
const verifyVerificationCode = catchAsync(async (req, res, next) => {
  const { email, providedCode } = req.body;
  const codeValue = providedCode.toString();

  const existingUser = await User.findOne({ email }).select(
    "+verificationCode +verificationCodeValidation"
  );

  if (!existingUser) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }
  if (existingUser.verified) {
    return next(new AppError("You are already verified!", 401, "conflict"));
  }

  if (
    !existingUser.verificationCode ||
    !existingUser.verificationCodeValidation
  ) {
    return next(
      new AppError("Something is wrong with the code!", 400, "bad_request")
    );
  }
  let timeDifference = Date.now() - existingUser.verificationCodeValidation;
  if (timeDifference > 3 * 60 * 1000) {
    return next(new AppError("Code has expired!", 401, "expired_code"));
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
  } else if (hashedCodeValue !== existingUser.verificationCode) {
    return next(new AppError("Invalid code!", 401, "invalid_code"));
  }
  return next(
    new AppError("Unexpected error occurred!", 401, "unexpected_error")
  );
});

// change password
const changePassword = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { oldPassword, newPassword } = req.body;

  const existingUser = await User.findOne({ _id: userId }).select("+password");

  if (!existingUser) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }

  if (!existingUser.verified) {
    return next(
      new AppError("You are not verified user!", 401, "email_not_verified")
    );
  }
  const result = await doHashValidation(oldPassword, existingUser.password);
  if (!result) {
    return next(
      new AppError("Invalid credentials!", 401, "invalid_credentials")
    );
  }
  const hashedPassword = await doHash(newPassword, 12);
  existingUser.password = hashedPassword;
  await existingUser.save();
  return res.status(200).json({
    success: true,
    message: "password updated!",
  });
});

// send-forgot-password-code
const sendForgotPasswordCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const existingUser = await checkUserByEmail(email);
  if (!existingUser)
    return next(new AppError("User does not exist!", 404, "not_found"));

  const codeValue = crypto.randomInt(100000, 999999).toString();
  const info = await transport.sendMail({
    from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
    to: existingUser.email,
    subject: "forgot password code",
    html: verificationCodeTemplate(codeValue),
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

  return next(
    new AppError("Failed to send forgot password code!", 400, "bad_request")
  );
});

// verify-forgot-password-code
const verifyForgotPasswordCode = catchAsync(async (req, res, next) => {
  const { email, providedCode } = req.body;
  const existingUser = await User.findOne({ email }).select(
    "+forgotPasswordCode +forgotPasswordCodeValidation"
  );

  if (!existingUser) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }

  if (
    !existingUser.forgotPasswordCode ||
    !existingUser.forgotPasswordCodeValidation
  ) {
    return next(
      new AppError(
        "Reset code is missing or invalid. Please request a new one.",
        401,
        "invalid_code"
      )
    );
  }
  let timeDifference = Date.now() - existingUser.forgotPasswordCodeValidation;
  if (timeDifference > 5 * 60 * 1000) {
    return next(new AppError("Code has expired!", 401, "expired_code"));
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
  return next(new AppError("Invalid code!", 401, "invalid_code"));
});

// reset-password
const resetPassword = catchAsync(async (req, res, next) => {
  const { email, newPassword } = req.body;

  const existingUser = await User.findOne({ email }).select(
    "+forgotPasswordCode +forgotPasswordCodeValidation"
  );

  if (!existingUser) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }

  if (
    !existingUser.forgotPasswordCode ||
    !existingUser.forgotPasswordCodeValidation
  ) {
    return next(
      new AppError(
        "Reset code is missing or invalid. Please request a new one.",
        401,
        "invalid_code"
      )
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
});

// Refresh access Token
const refreshAccessToken = catchAsync(async (req, res, next) => {
  const isMobileClient = req.headers.client === "not-browser";
  if (!isMobileClient && !req.cookies.Authorization) {
    return next(
      new AppError("Authorization cookie is missing!", 401, "unauthorized")
    );
  }
  const refreshToken = isMobileClient
    ? req.body.refreshToken.split(" ")[1]
    : req.cookies.Authorization.split(" ")[1];

  if (!refreshToken) {
  }

  const existingToken = await RefreshToken.findOne({ token: refreshToken });

  if (!existingToken) {
    return next(new AppError("Refresh token not found!", 404, "not_found"));
  }

  const existingUser = await checkUserById(existingToken.userId);
  if (!existingUser)
    return next(new AppError("User not found!", 404, "not_found"));
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err) => {
    if (err) {
      const errorMessage =
        err.name === "TokenExpiredError"
          ? "Refresh token expired"
          : err.name === "JsonWebTokenError"
          ? "Invalid refresh token"
          : "Token verification failed";

      const statusCode = err.name === "TokenExpiredError" ? 401 : 403;

      return next(new AppError(errorMessage, statusCode, "token_error"));
    }
  });
  const newAccessToken = generateAccessToken(existingUser);

  return res.status(200).json({
    success: true,
    newAccessToken: "Bearer " + newAccessToken,
    message: "refresh access token successfully",
  });
});

// google signin
const googleSignin = catchAsync(async (req, res, next) => {
  const { IdToken } = req.body;
  if (!IdToken) {
    return next(
      new AppError("Google ID token is required!", 400, "bad_request")
    );
  }
  const payload = await verifyGoogleToken(IdToken);
  if (!payload) {
    return next(new AppError("Invalid Google ID token!", 401, "unauthorized"));
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
});
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
