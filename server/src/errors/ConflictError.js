import AppError from './AppError.js';

/**
 * ConflictError - Error for resource conflicts (409)
 * Used when request conflicts with current state of resource
 */

class ConflictError extends AppError {
  /**
   * Create a new conflict error
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Conflict', code = 'CONFLICT', details = null) {
    super(message, 409, true, code);
    
    this.details = details;
    this.category = 'client_error';
    this.recoverable = true;
  }

  /**
   * Create conflict error for duplicate resource
   * @param {string} resourceType - Type of resource
   * @param {string} identifier - Resource identifier
   * @returns {ConflictError} Duplicate resource conflict error instance
   */
  static duplicate(resourceType, identifier) {
    const details = {
      resourceType,
      identifier,
      message: `${resourceType} with identifier '${identifier}' already exists`
    };

    return new ConflictError(
      `${resourceType} already exists`,
      'DUPLICATE_RESOURCE',
      details
    );
  }

  /**
   * Create conflict error for resource state
   * @param {string} resourceType - Type of resource
   * @param {string} state - Current state
   * @param {string} expectedState - Expected state
   * @returns {ConflictError} State conflict error instance
   */
  static state(resourceType, state, expectedState) {
    const details = {
      resourceType,
      currentState: state,
      expectedState,
      message: `${resourceType} is in '${state}' state, expected '${expectedState}'`
    };

    return new ConflictError(
      `Resource state conflict`,
      'STATE_CONFLICT',
      details
    );
  }

  /**
   * Create conflict error for version mismatch
   * @param {string} resourceType - Type of resource
   * @param {number} currentVersion - Current version
   * @param {number} expectedVersion - Expected version
   * @returns {ConflictError} Version conflict error instance
   */
  static version(resourceType, currentVersion, expectedVersion) {
    const details = {
      resourceType,
      currentVersion,
      expectedVersion,
      message: `${resourceType} version ${currentVersion} conflicts with expected version ${expectedVersion}`
    };

    return new ConflictError(
      'Version conflict',
      'VERSION_CONFLICT',
      details
    );
  }

  /**
   * Create conflict error for concurrent modification
   * @param {string} resourceType - Type of resource
   * @param {string} identifier - Resource identifier
   * @returns {ConflictError} Concurrent modification conflict error instance
   */
  static concurrentModification(resourceType, identifier) {
    const details = {
      resourceType,
      identifier,
      message: `${resourceType} '${identifier}' was modified by another process`
    };

    return new ConflictError(
      'Concurrent modification detected',
      'CONCURRENT_MODIFICATION',
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

export default ConflictError;
