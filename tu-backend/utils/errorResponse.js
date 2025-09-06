class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  // Static method to create a 404 error
  static notFound(resource = 'Resource') {
    return new ErrorResponse(`${resource} not found`, 404);
  }

  // Static method to create a 400 error
  static badRequest(message = 'Bad Request') {
    return new ErrorResponse(message, 400);
  }

  // Static method to create a 401 error
  static unauthorized(message = 'Not authorized') {
    return new ErrorResponse(message, 401);
  }

  // Static method to create a 403 error
  static forbidden(message = 'Forbidden') {
    return new ErrorResponse(message, 403);
  }

  // Static method to create a 500 error
  static serverError(message = 'Internal Server Error') {
    return new ErrorResponse(message, 500);
  }

  // Send error response
  send(res) {
    res.status(this.statusCode).json({
      success: false,
      error: this.message || 'Server Error',
    });
  }
}

module.exports = ErrorResponse;
