const ErrorResponse = require('../utils/errorResponse');

// Wrapper function to handle async/await errors in route handlers
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((err) => {
    // Log error for debugging
    console.error('Async Handler Error:', err);
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages,
      });
    }

    // Handle duplicate field errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: `${field} already exists`,
      });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token failed',
      });
    }

    // Handle JWT expired error
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired, please login again',
      });
    }

    // Handle custom ErrorResponse
    if (err instanceof ErrorResponse) {
      return res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error',
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      error: 'Server Error',
      // Only show stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });
};

module.exports = asyncHandler;
