/**
 * Custom error response handler
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} error - Error object (optional)
 */
exports.errorResponse = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message || error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response handler
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Data to send in response (optional)
 */
exports.successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Async handler to avoid try-catch blocks in controllers
 * @param {Function} fn - Async function to execute
 * @returns {Function} - Express middleware function
 */
exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next); 