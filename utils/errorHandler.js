const sendErrorResponse = (res, statusCode, message, errorType) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorType,
  });
};

module.exports = { sendErrorResponse };
