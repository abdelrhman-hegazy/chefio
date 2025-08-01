const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const enviroment = process.env.NODE_ENV || "development";

 
  if (enviroment !== "production") {
    console.error(`[${new Date().toISOString()}]`, err);
  }
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: err.errorType || "server_error",
  });
};
module.exports = errorHandler;
