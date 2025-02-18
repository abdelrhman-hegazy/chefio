const jwt = require("jsonwebtoken");

const {
  signinSchema,
  signupSchema,
  accesptCodeSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} = require("../middlewares/validator");
const User = require("../models/user");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");
const { json } = require("express");
const errorMessages = require("../utils/errorMessages");
const { sendErrorResponse } = require("../utils/errorHandler");

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
        errorMessages.validation_error
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return sendErrorResponse(
        res,
        409,
        "user already exists!",
        errorMessages.conflict
      );
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
      errorMessages.internal_server_error
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
        errorMessages.validation_error
      );
      // res
      //   .status(401)
      //   .json({ success: false, message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return sendErrorResponse(
        res,
        404,
        "User does not exist!",
        errorMessages.not_found
      );
      // res
      //   .status(404)
      //   .json({ success: false, message: "user does not exists!" });
    }

    const result = await doHashValidation(password, existingUser.password);
    if (!result) {
      return sendErrorResponse(
        res,
        401,
        "Invalid credentials",
        errorMessages.invalid_credentials
      );
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "8h",
      }
    );
    // is verify
    if (!existingUser.verified) {
      return sendErrorResponse(
        res,
        403,
        "Your email is not verified. Please verify your account.",
        errorMessages.forbidden
      );
    }
    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        token,
        message: "logged in successfully",
      });
  } catch (error) {
    console.log("Error in signin", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      errorMessages.internal_server_error
    );
  }
};
// signout
const signout = async (req, res) => {
  res
    .clearCookie("Authorization")
    .status(200)
    .json({ success: true, message: "logged out successfully" });
};

// send-verification-code
const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return sendErrorResponse(
        res,
        404,
        "User does not exist!",
        errorMessages.not_found
      );
    }

    if (existingUser.verified) {
      return sendErrorResponse(
        res,
        409,
        "You are already verified!",
        errorMessages.conflict
      );
    }

    const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

    if (!transport) {
      return sendErrorResponse(
        res,
        503,
        "Mail service is unavailable.",
        errorMessages.service_unavailable
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

    return sendErrorResponse(
      res,
      400,
      "Code sending failed!",
      errorMessages.bad_request
    );
  } catch (error) {
    console.error("Error sending verification email:", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error",
      errorMessages.internal_server_error
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
        errorMessages.validation_error
      );
      // res
      //   .status(401)
      //   .json({ success: false, message: error.details[0].message });
    }
    const codeValue = providedCode.toString();

    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );

    if (!existingUser) {
      return sendErrorResponse(
        res,
        404,
        "User does not exist!",
        errorMessages.not_found
      );
    }
    if (existingUser.verified) {
      return sendErrorResponse(
        res,
        401,
        "You are already verified!",
        errorMessages.conflict
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
        errorMessages.bad_request
      );

    
    }

    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
      return sendErrorResponse(
        res,
        401,
        "Code has been expired!",
        errorMessages.expired_code
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
      errorMessages.internal_server_error
    );
  }
};

// change password
const changePassword = async (req, res) => {
  const { userId, verified, email } = req.user;
  const { oldPassword, newPassword } = req.body;
  console.log(userId, verified, email);

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

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: "You are not verifed user!",
      });
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
    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
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
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "user does not exist" });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();
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
    console.log(error);
  }
};

//verify-forgot-password-code
const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error, value } = acceptFPCodeSchema.validate({
      email,
      newPassword,
    });

    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    const codeValue = providedCode.toString();

    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "user does not exists!",
      });
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res.status(401).json({
        success: false,
        message: "somthing is wrong with the code!",
      });
    }

    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res.status(401).json({
        success: false,
        message: "code has been expired!",
      });
    }

    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedPassword = await doHash(newPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "password updated!",
      });
    }
    return res
      .status(401)
      .json({ success: false, message: "unexpected occured!" });
  } catch (error) {
    console.log(error);
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
};
