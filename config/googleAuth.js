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
    return sendErrorResponse(res, 401, "Invalid google token", "invalid_token");
  }
};

module.exports = { verifyGoogleToken };
