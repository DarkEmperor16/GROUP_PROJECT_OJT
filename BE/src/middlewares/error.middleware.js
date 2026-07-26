/**
 * Centralized Global Error Handler Middleware
 *
 * Catches unhandled errors from routes/controllers and formats consistent error responses.
 */

function errorHandler(err, req, res, next) {
  if (!err) {
    return next();
  }

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: err.message,
    });
  }

  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(400).json({
      message: err.message,
    });
  }

  // Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid format for field '${err.path}'`,
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: messages,
    });
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    return res.status(409).json({
      message: `Duplicate entry for field(s): ${keys.join(', ')}`,
    });
  }

  // JWT Authentication Errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Custom status code attached to error object
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json({ message });
}

module.exports = {
  errorHandler,
};
