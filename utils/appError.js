class AppError extends Error {
  constructor(message, statusCode, errorType = "server_error") {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
