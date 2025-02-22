const { OAuth2Client } = require("google-auth-library");
const { sendErrorResponse } = require("../utils/errorHandler");

const client = new OAuth2Client([
  process.env.GOOGLE_CLIENT_ID_WEB,
  process.env.GOOGLE_CLIENT_ID_ANDROID,
]);

const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID_WEB,
        process.env.GOOGLE_CLIENT_ID_ANDROID,
      ],
    });

    return ticket.getPayload();
  } catch (error) {
    console.log("Error verifying google token: ", error);
    if (error.message.includes("Token used too early")) {
      throw new Error("Token used too early. Please try again.");
    } else if (error.message.includes("Token used too late")) {
      throw new Error("Token expired. Please try again.");
    } else if (error.message.includes("Invalid token")) {
      throw new Error("Invalid Google token. Please login again.");
    } else {
      throw new Error("Authentication failed. Try again later.");
    }
  }
};

module.exports = { verifyGoogleToken };
