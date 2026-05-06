import AppError from './AppError.js';

/**
 * NotFoundError - Error for resource not found (404)
 * Used when requested resource does not exist
 */

class NotFoundError extends AppError {
  /**
   * Create a new not found error
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Resource Not Found', code = 'NOT_FOUND', details = null) {
    super(message, 404, true, code);
    
    this.details = details;
    this.category = 'client_error';
    this.recoverable = true;
  }

  /**
   * Create not found error for specific resource
   * @param {string} resourceType - Type of resource
   * @param {string} identifier - Resource identifier
   * @returns {NotFoundError} Resource not found error instance
   */
  static resource(resourceType, identifier) {
    const details = {
      resourceType,
      identifier,
      message: `${resourceType} with identifier '${identifier}' not found`
    };

    return new NotFoundError(
      `${resourceType} not found`,
      'RESOURCE_NOT_FOUND',
      details
    );
  }

  /**
   * Create not found error for user
   * @param {string} userId - User ID or email
   * @returns {NotFoundError} User not found error instance
   */
  static user(userId) {
    return NotFoundError.resource('User', userId);
  }

  /**
   * Create not found error for course
   * @param {string} courseId - Course ID or title
   * @returns {NotFoundError} Course not found error instance
   */
  static course(courseId) {
    return NotFoundError.resource('Course', courseId);
  }

  /**
   * Create not found error for enrollment
   * @param {string} enrollmentId - Enrollment ID
   * @returns {NotFoundError} Enrollment not found error instance
   */
  static enrollment(enrollmentId) {
    return NotFoundError.resource('Enrollment', enrollmentId);
  }

  /**
   * Create not found error for rating
   * @param {string} ratingId - Rating ID
   * @returns {NotFoundError} Rating not found error instance
   */
  static rating(ratingId) {
    return NotFoundError.resource('Rating', ratingId);
  }

  /**
   * Create not found error for lecture
   * @param {string} lectureId - Lecture ID
   * @returns {NotFoundError} Lecture not found error instance
   */
  static lecture(lectureId) {
    return NotFoundError.resource('Lecture', lectureId);
  }

  /**
   * Create not found error for resource
   * @param {string} resourceId - Resource ID
   * @returns {NotFoundError} Resource not found error instance
   */
  static resourceItem(resourceId) {
    return NotFoundError.resource('Resource', resourceId);
  }

  /**
   * Create not found error for pending registration
   * @param {string} email - Email address
   * @returns {NotFoundError} Pending registration not found error instance
   */
  static pendingRegistration(email) {
    return NotFoundError.resource('Pending Registration', email);
  }

  /**
   * Create not found error for password reset
   * @param {string} email - Email address
   * @returns {NotFoundError} Password reset not found error instance
   */
  static passwordReset(email) {
    return NotFoundError.resource('Password Reset Request', email);
  }

  /**
   * Create not found error for contact
   * @param {string} contactId - Contact ID
   * @returns {NotFoundError} Contact not found error instance
   */
  static contact(contactId) {
    return NotFoundError.resource('Contact', contactId);
  }

  /**
   * Create not found error for store item
   * @param {string} itemId - Item ID
   * @returns {NotFoundError} Store item not found error instance
   */
  static storeItem(itemId) {
    return NotFoundError.resource('Store Item', itemId);
  }

  /**
   * Create not found error for route
   * @param {string} route - Route path
   * @returns {NotFoundError} Route not found error instance
   */
  static route(route) {
    const details = {
      route,
      message: `Route '${route}' not found`
    };

    return new NotFoundError(
      'Route not found',
      'ROUTE_NOT_FOUND',
      details
    );
  }

  /**
   * Create not found error for endpoint
   * @param {string} method - HTTP method
   * @param {string} path - Endpoint path
   * @returns {NotFoundError} Endpoint not found error instance
   */
  static endpoint(method, path) {
    const details = {
      method,
      path,
      message: `${method} ${path} endpoint not found`
    };

    return new NotFoundError(
      'Endpoint not found',
      'ENDPOINT_NOT_FOUND',
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

export default NotFoundError;
