import AppError from './AppError.js';

/**
 * UnauthorizedError - Error for authentication failures (401)
 * Used when user is not authenticated or token is invalid
 */

class UnauthorizedError extends AppError {
  /**
   * Create a new unauthorized error
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
    super(message, 401, true, code);
    
    this.details = details;
    this.category = 'client_error';
    this.recoverable = true;
  }

  /**
   * Create unauthorized error for missing token
   * @returns {UnauthorizedError} Missing token error instance
   */
  static missingToken() {
    const details = {
      message: 'Authentication token is required',
      solution: 'Please provide a valid JWT token in Authorization header'
    };

    return new UnauthorizedError(
      'Authentication token required',
      'MISSING_TOKEN',
      details
    );
  }

  /**
   * Create unauthorized error for invalid token
   * @param {string} reason - Reason for invalidity
   * @returns {UnauthorizedError} Invalid token error instance
   */
  static invalidToken(reason = 'Invalid token') {
    const details = {
      reason,
      message: 'Authentication token is invalid',
      solution: 'Please provide a valid JWT token'
    };

    return new UnauthorizedError(
      'Invalid authentication token',
      'INVALID_TOKEN',
      details
    );
  }

  /**
   * Create unauthorized error for expired token
   * @returns {UnauthorizedError} Expired token error instance
   */
  static expiredToken() {
    const details = {
      message: 'Authentication token has expired',
      solution: 'Please refresh your token or login again'
    };

    return new UnauthorizedError(
      'Authentication token expired',
      'TOKEN_EXPIRED',
      details
    );
  }

  /**
   * Create unauthorized error for malformed token
   * @returns {UnauthorizedError} Malformed token error instance
   */
  static malformedToken() {
    const details = {
      message: 'Authentication token is malformed',
      solution: 'Please provide a properly formatted JWT token'
    };

    return new UnauthorizedError(
      'Malformed authentication token',
      'MALFORMED_TOKEN',
      details
    );
  }

  /**
   * Create unauthorized error for invalid credentials
   * @param {string} reason - Reason for invalid credentials
   * @returns {UnauthorizedError} Invalid credentials error instance
   */
  static invalidCredentials(reason = 'Invalid email or password') {
    const details = {
      reason,
      message: 'Authentication credentials are invalid',
      solution: 'Please check your email and password and try again'
    };

    return new UnauthorizedError(
      'Invalid credentials',
      'INVALID_CREDENTIALS',
      details
    );
  }

  /**
   * Create unauthorized error for OTP verification failure
   * @param {string} reason - Reason for OTP failure
   * @returns {UnauthorizedError} OTP verification error instance
   */
  static otpVerificationFailed(reason = 'Invalid or expired OTP') {
    const details = {
      reason,
      message: 'OTP verification failed',
      solution: 'Please request a new OTP or check the existing one'
    };

    return new UnauthorizedError(
      'OTP verification failed',
      'OTP_VERIFICATION_FAILED',
      details
    );
  }

  /**
   * Create unauthorized error for account not verified
   * @param {string} email - User email
   * @returns {UnauthorizedError} Account not verified error instance
   */
  static accountNotVerified(email) {
    const details = {
      email,
      message: 'Account email not verified',
      solution: 'Please verify your email address before proceeding'
    };

    return new UnauthorizedError(
      'Account not verified',
      'ACCOUNT_NOT_VERIFIED',
      details
    );
  }

  /**
   * Create unauthorized error for account disabled
   * @param {string} reason - Reason for account being disabled
   * @returns {UnauthorizedError} Account disabled error instance
   */
  static accountDisabled(reason = 'Account has been disabled') {
    const details = {
      reason,
      message: 'Account is disabled',
      solution: 'Please contact support for assistance'
    };

    return new UnauthorizedError(
      'Account disabled',
      'ACCOUNT_DISABLED',
      details
    );
  }

  /**
   * Create unauthorized error for session expired
   * @returns {UnauthorizedError} Session expired error instance
   */
  static sessionExpired() {
    const details = {
      message: 'User session has expired',
      solution: 'Please login again to continue'
    };

    return new UnauthorizedError(
      'Session expired',
      'SESSION_EXPIRED',
      details
    );
  }

  /**
   * Create unauthorized error for invalid signature
   * @returns {UnauthorizedError} Invalid signature error instance
   */
  static invalidSignature() {
    const details = {
      message: 'Token signature is invalid',
      solution: 'Please login again to get a new token'
    };

    return new UnauthorizedError(
      'Invalid token signature',
      'INVALID_SIGNATURE',
      details
    );
  }

  /**
   * Override toJSON to include details
   * @param {boolean} includeStack - Whether to include stack trace
   * @returns {Object} Formatted error response
   */
  toJSON(includeStack = false) {
    const response = super.toJSON(includeStack);
    
    if (this.details) {
      response.details = this.details;
    }
    
    return response;
  }
}

export default UnauthorizedError;
