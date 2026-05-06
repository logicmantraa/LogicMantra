/**
 * AppError - Base error class for custom application errors
 * Provides consistent error structure and handling across the application
 */

class AppError extends Error {
  /**
   * Create a new application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether this is an operational error
   * @param {string} code - Error code for programmatic handling
   */
  constructor(message, statusCode = 500, isOperational = true, code = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.code = code;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor);
    
    // Ensure name matches class name
    this.name = this.constructor.name;
  }

  /**
   * Convert error to JSON response format
   * @param {boolean} includeStack - Whether to include stack trace
   * @returns {Object} Formatted error response
   */
  toJSON(includeStack = false) {
    const response = {
      success: false,
      error: this.constructor.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };

    if (this.code) {
      response.code = this.code;
    }

    if (includeStack) {
      response.stack = this.stack;
    }

    return response;
  }

  /**
   * Check if error is of specific type
   * @param {Function} ErrorClass - Error class to check against
   * @returns {boolean} Whether error is of specified type
   */
  isType(ErrorClass) {
    return this instanceof ErrorClass;
  }

  /**
   * Get error category based on status code
   * @returns {string} Error category
   */
  getCategory() {
    if (this.statusCode >= 400 && this.statusCode < 500) {
      return 'client_error';
    } else if (this.statusCode >= 500) {
      return 'server_error';
    }
    return 'unknown';
  }

  /**
   * Check if error is recoverable
   * @returns {boolean} Whether error is recoverable
   */
  isRecoverable() {
    // 4xx errors are typically recoverable (client can fix)
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Log error with context
   * @param {Object} context - Additional context for logging
   */
  log(context = {}) {
    const logData = {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      category: this.getCategory(),
      recoverable: this.isRecoverable(),
      timestamp: this.timestamp,
      ...context
    };

    console.error('Application Error:', JSON.stringify(logData, null, 2));
  }
}

export default AppError;
