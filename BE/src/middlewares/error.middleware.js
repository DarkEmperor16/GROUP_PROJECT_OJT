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

  // JSON body parse errors (from express.json) — respond with a safe generic message
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ' });
  }
  // Some parsers set a type for parse failures
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Dữ liệu đầu vào không hợp lệ' });
  }

  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // File-type validation errors thrown by multer fileFilter
  if (err.message && err.message.includes('Định dạng file không hợp lệ')) {
    return res.status(400).json({ success: false, message: 'Định dạng file không hợp lệ' });
  }

  // Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res
      .status(400)
      .json({ success: false, message: `Invalid format for field '${err.path}'` });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    return res
      .status(409)
      .json({ success: false, message: `Duplicate entry for field(s): ${keys.join(', ')}` });
  }

  // JWT Authentication Errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Custom status code attached to error object
  const statusCode = err.status || err.statusCode || 500;
  // For 500 Internal Errors, return generic message to prevent leaking internal stack trace or DB details
  const message = statusCode >= 500 ? 'Internal server error' : err.message || 'An error occurred';

  return res.status(statusCode).json({ success: false, message });
}

module.exports = {
  errorHandler,
};
