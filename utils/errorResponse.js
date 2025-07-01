const sendErrorResponse = (
  res,
  statusCode,
  message,
  errorType = "server_error"
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorType,
  });
};

module.exports = { sendErrorResponse };
