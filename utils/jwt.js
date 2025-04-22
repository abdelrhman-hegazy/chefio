const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshTokens");
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      verified: user.verified,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "30d",
    }
  );
  const existingUserToken = await RefreshToken.findOne({ userId: user._id });
  if (existingUserToken) {
    existingUserToken.token = refreshToken;
    await existingUserToken.save();
    return refreshToken;
  }
  await RefreshToken.create({ userId: user._id, token: refreshToken });
  return refreshToken;
};

module.exports = { generateAccessToken, generateRefreshToken };
