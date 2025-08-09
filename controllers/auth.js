const jwt = require("jsonwebtoken");
const RefreshTokenRepository = require("../repositories/refreshToken.repository");
const DeviceTokenRepository = require("../repositories/deviceToken.repository");
const crypto = require("crypto");
const { verificationCodeTemplate } = require("../utils/emailTemplates");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { verifyGoogleToken } = require("../config/googleAuth");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const UserRepository = require("../repositories/user.repository");
const generateSecureCode = require("../utils/generateSecureCode");
//signup
const signup = catchAsync(async (req, res, next) => {
  const { email, password, username } = req.body;
  if (await UserRepository.findOne({ email })) {
    return next(new AppError("user already exists!", 409, "conflict"));
  }
  const hashedPassword = await doHash(password, 12);

  const newUser = await UserRepository.create({
    username,
    email,
    password: hashedPassword,
  });

  newUser.password = undefined;
  return res.status(201).json({
    success: true,
    message: "Your account has been created successfully",
    newUser,
  });
});

//signin
const signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const existingUser = await UserRepository.findByEmailWithPassword({ email });
  if (!existingUser) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }
  // check password
  if (!password) {
    return next(new AppError("Password is required!", 400, "bad_request"));
  }
  const isPasswordCorrect = await doHashValidation(
    password,
    existingUser.password
  );
  if (!isPasswordCorrect) {
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
      accessToken: accessToken,
      refreshToken: refreshToken,
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

  if (!userId) {
    return next(new AppError("User ID is required!", 400, "bad_request"));
  }
  if (!(await UserRepository.findById(userId))) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }

  await RefreshTokenRepository.deleteByUserId(userId);
  await DeviceTokenRepository.deleteByUserId(userId);
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
  const existingUser = await UserRepository.findOne({ email });
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
  if (info.accepted && info.accepted.includes(existingUser.email)) {
    const hashed = generateSecureCode(
      process.env.HMAC_VERIFICATION_CODE_SECRET,
      codeValue
    );

    await UserRepository.updateById(existingUser._id, {
      verificationCode: hashed,
      verificationCodeValidation: Date.now(),
    });
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

  const existingUser = await UserRepository.findOneVerificationCode({ email });

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
  const timeDiff = Date.now() - existingUser.verificationCodeValidation;
  const isCodeExpired = timeDiff > 3 * 60 * 1000;
  if (isCodeExpired) {
    return next(new AppError("Code has expired!", 401, "expired_code"));
  }
  const hashedCodeValue = hmacProcess(
    codeValue,
    process.env.HMAC_VERIFICATION_CODE_SECRET
  );
  if (hashedCodeValue !== existingUser.verificationCode) {
    return next(new AppError("Invalid code!", 401, "invalid_code"));
  }
  await UserRepository.updateById(existingUser._id, {
    verified: true,
    verificationCode: undefined,
    verificationCodeValidation: undefined,
  });

  return res.status(200).json({
    success: true,
    message: "Your account has been verified!",
  });
});

// change password
const changePassword = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { oldPassword, newPassword } = req.body;

  const existingUser = await UserRepository.findByIdWithPassword(userId);

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
  await UserRepository.updateById(existingUser._id, {
    password: hashedPassword,
  });
  return res.status(200).json({
    success: true,
    message: "password updated!",
  });
});

// send-forgot-password-code
const sendForgotPasswordCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const existingUser = await UserRepository.findOne({ email });
  if (!existingUser)
    return next(new AppError("User does not exist!", 404, "not_found"));

  const codeValue = crypto.randomInt(100000, 999999).toString();

  const info = await transport.sendMail({
    from: `"Chefio Support" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
    to: existingUser.email,
    subject: "forgot password code",
    html: verificationCodeTemplate(codeValue),
  });

  if (info.accepted && info.accepted.includes(existingUser.email)) {
    const hashedCodeValue = generateSecureCode(
      process.env.HMAC_VERIFICATION_CODE_SECRET,
      codeValue
    );
    await UserRepository.updateById(existingUser._id, {
      forgotPasswordCode: hashedCodeValue,
      forgotPasswordCodeValidation: Date.now(),
    });
    return res.status(200).json({ success: true, message: "Code sent!" });
  }

  return next(
    new AppError("Failed to send forgot password code!", 400, "bad_request")
  );
});

// verify-forgot-password-code
const verifyForgotPasswordCode = catchAsync(async (req, res, next) => {
  const { email, providedCode } = req.body;
  const existingUser = await UserRepository.findOneForgotPasswordCode({
    email,
  });

  if (!existingUser) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }
  const { forgotPasswordCode, forgotPasswordCodeValidation } = existingUser;
  if (!forgotPasswordCode || !forgotPasswordCodeValidation) {
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
  const { userId } = req.user;

  const existingUser = await UserRepository.findOneForgotPasswordCode(email);  
  if(userId !== existingUser._id.toString()){
    return next(new AppError("You are not authorized to reset this password!", 403, "forbidden"));
  }
  if (!existingUser) {
    return next(new AppError("User does not exist!", 404, "not_found"));
  }

  const hashedPassword = await doHash(newPassword, 12);

  await UserRepository.updateById(existingUser._id, {
    password: hashedPassword,
    forgotPasswordCode: undefined,
    forgotPasswordCodeValidation: undefined,
  });
  return res.status(200).json({
    success: true,
    message: "Password has been updated successfully!",
  });
});

// Refresh access Token
const refreshAccessToken = catchAsync(async (req, res, next) => {
  const isMobileClient = req.headers.client === "not-browser";
  if (!isMobileClient && !req.cookies.Authorization) {
    return next(new AppError("Refresh token is missing!", 401, "unauthorized"));
  }
  const refreshToken = isMobileClient
    ? req.body.refreshToken.split(" ")[1]
    : req.cookies.Authorization.split(" ")[1];

  if (!refreshToken) {
    return next(new AppError("Refresh token is missing!", 401, "unauthorized"));
  }

  const existingToken = await RefreshTokenRepository.RefreshTokenFindOne(
    refreshToken
  );

  if (!existingToken) {
    return next(new AppError("Refresh token not found!", 404, "not_found"));
  }

  const existingUser = await UserRepository.findById(existingToken.userId);
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
  let user = await UserRepository.findOne({ email: payload.email });

  if (!user) {
    user = await UserRepository.create({
      googleId: payload.sub,
      email: payload.email,
      username: payload.name,
      profilePicture: payload.picture,
      verified: true,
    });
  } else {
    await UserRepository.updateById(user._id, {
      googleId: payload.sub,
      email: payload.email,
      username: payload.name,
      profilePicture: payload.picture,
      verified: true,
    });
  }
  const accessToken = "Bearer " + generateAccessToken(user);
  const refreshToken = "Bearer " + (await generateRefreshToken(user));

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
