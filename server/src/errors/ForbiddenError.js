import AppError from './AppError.js';

/**
 * ForbiddenError - Error for authorization failures (403)
 * Used when user is authenticated but lacks permission for the action
 */

class ForbiddenError extends AppError {
  /**
   * Create a new forbidden error
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Forbidden', code = 'FORBIDDEN', details = null) {
    super(message, 403, true, code);
    
    this.details = details;
    this.category = 'client_error';
    this.recoverable = true;
  }

  /**
   * Create forbidden error for insufficient permissions
   * @param {string} action - Action that requires permission
   * @param {string} requiredRole - Required role
   * @param {string} userRole - User's current role
   * @returns {ForbiddenError} Insufficient permissions error instance
   */
  static insufficientPermissions(action, requiredRole, userRole) {
    const details = {
      action,
      requiredRole,
      userRole,
      message: `Insufficient permissions for action: ${action}`,
      solution: `Requires ${requiredRole} role, but user has ${userRole} role`
    };

    return new ForbiddenError(
      'Insufficient permissions',
      'INSUFFICIENT_PERMISSIONS',
      details
    );
  }

  /**
   * Create forbidden error for admin-only access
   * @param {string} action - Action that requires admin access
   * @returns {ForbiddenError} Admin-only error instance
   */
  static adminOnly(action = 'perform this action') {
    const details = {
      action,
      message: `Admin access required to ${action}`,
      solution: 'This action is restricted to administrators only'
    };

    return new ForbiddenError(
      'Admin access required',
      'ADMIN_ONLY',
      details
    );
  }

  /**
   * Create forbidden error for resource ownership
   * @param {string} resourceType - Type of resource
   * @param {string} resourceOwner - Resource owner identifier
   * @param {string} currentUser - Current user identifier
   * @returns {ForbiddenError} Resource ownership error instance
   */
  static resourceOwnership(resourceType, resourceOwner, currentUser) {
    const details = {
      resourceType,
      resourceOwner,
      currentUser,
      message: `Cannot access ${resourceType} owned by ${resourceOwner}`,
      solution: 'You can only access resources that you own'
    };

    return new ForbiddenError(
      'Resource access denied',
      'RESOURCE_OWNERSHIP',
      details
    );
  }

  /**
   * Create forbidden error for course access
   * @param {string} courseId - Course ID
   * @param {string} reason - Reason for access denial
   * @returns {ForbiddenError} Course access error instance
   */
  static courseAccess(courseId, reason = 'not enrolled') {
    const details = {
      courseId,
      reason,
      message: `Cannot access course: ${reason}`,
      solution: 'Please enroll in the course to access its content'
    };

    return new ForbiddenError(
      'Course access denied',
      'COURSE_ACCESS_DENIED',
      details
    );
  }

  /**
   * Create forbidden error for enrollment access
   * @param {string} enrollmentId - Enrollment ID
   * @param {string} reason - Reason for access denial
   * @returns {ForbiddenError} Enrollment access error instance
   */
  static enrollmentAccess(enrollmentId, reason = 'not owner') {
    const details = {
      enrollmentId,
      reason,
      message: `Cannot access enrollment: ${reason}`,
      solution: 'You can only access your own enrollments'
    };

    return new ForbiddenError(
      'Enrollment access denied',
      'ENROLLMENT_ACCESS_DENIED',
      details
    );
  }

  /**
   * Create forbidden error for rating access
   * @param {string} ratingId - Rating ID
   * @param {string} reason - Reason for access denial
   * @returns {ForbiddenError} Rating access error instance
   */
  static ratingAccess(ratingId, reason = 'not owner') {
    const details = {
      ratingId,
      reason,
      message: `Cannot access rating: ${reason}`,
      solution: 'You can only access your own ratings'
    };

    return new ForbiddenError(
      'Rating access denied',
      'RATING_ACCESS_DENIED',
      details
    );
  }

  /**
   * Create forbidden error for subscription required
   * @param {string} action - Action requiring subscription
   * @param {string} subscriptionType - Required subscription type
   * @returns {ForbiddenError} Subscription required error instance
   */
  static subscriptionRequired(action, subscriptionType = 'premium') {
    const details = {
      action,
      subscriptionType,
      message: `${action} requires ${subscriptionType} subscription`,
      solution: 'Please upgrade your subscription to access this feature'
    };

    return new ForbiddenError(
      'Subscription required',
      'SUBSCRIPTION_REQUIRED',
      details
    );
  }

  /**
   * Create forbidden error for account suspended
   * @param {string} reason - Reason for suspension
   * @returns {ForbiddenError} Account suspended error instance
   */
  static accountSuspended(reason = 'Account has been suspended') {
    const details = {
      reason,
      message: 'Account access suspended',
      solution: 'Please contact support for account reactivation'
    };

    return new ForbiddenError(
      'Account suspended',
      'ACCOUNT_SUSPENDED',
      details
    );
  }

  /**
   * Create forbidden error for rate limiting
   * @param {string} action - Action being rate limited
   * @param {number} retryAfter - Seconds to wait before retry
   * @returns {ForbiddenError} Rate limited error instance
   */
  static rateLimited(action, retryAfter = 60) {
    const details = {
      action,
      retryAfter,
      message: `Rate limit exceeded for action: ${action}`,
      solution: `Please wait ${retryAfter} seconds before trying again`
    };

    return new ForbiddenError(
      'Rate limit exceeded',
      'RATE_LIMITED',
      details
    );
  }

  /**
   * Create forbidden error for feature not enabled
   * @param {string} feature - Feature name
   * @returns {ForbiddenError} Feature not enabled error instance
   */
  static featureNotEnabled(feature) {
    const details = {
      feature,
      message: `Feature '${feature}' is not enabled`,
      solution: 'Please contact support to enable this feature'
    };

    return new ForbiddenError(
      'Feature not enabled',
      'FEATURE_NOT_ENABLED',
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

export default ForbiddenError;
