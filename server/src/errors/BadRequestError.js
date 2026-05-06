import AppError from './AppError.js';

/**
 * BadRequestError - Error for invalid request data (400)
 * Used when client sends malformed or invalid request data
 */

class BadRequestError extends AppError {
  /**
   * Create a new bad request error
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details = null) {
    super(message, 400, true, code);
    
    this.details = details;
    this.category = 'client_error';
    this.recoverable = true;
  }

  /**
   * Create bad request error for validation failures
   * @param {Array} validationErrors - Array of validation error objects
   * @returns {BadRequestError} Validation error instance
   */
  static validation(validationErrors) {
    const details = validationErrors.map(error => ({
      field: error.field || 'unknown',
      message: error.message,
      value: error.value,
      code: error.code || 'VALIDATION_ERROR'
    }));

    return new BadRequestError(
      'Request validation failed',
      'VALIDATION_ERROR',
      details
    );
  }

  /**
   * Create bad request error for missing required fields
   * @param {Array} missingFields - Array of missing field names
   * @returns {BadRequestError} Missing fields error instance
   */
  static missingFields(missingFields) {
    const details = {
      required: missingFields,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };

    return new BadRequestError(
      'Required fields are missing',
      'MISSING_FIELDS',
      details
    );
  }

  /**
   * Create bad request error for invalid data format
   * @param {string} field - Field name
   * @param {string} expectedFormat - Expected format description
   * @param {any} receivedValue - Received value
   * @returns {BadRequestError} Invalid format error instance
   */
  static invalidFormat(field, expectedFormat, receivedValue) {
    const details = {
      field,
      expectedFormat,
      receivedValue,
      message: `Invalid format for ${field}. Expected: ${expectedFormat}`
    };

    return new BadRequestError(
      `Invalid data format for ${field}`,
      'INVALID_FORMAT',
      details
    );
  }

  /**
   * Create bad request error for duplicate resource
   * @param {string} resourceType - Type of resource
   * @param {string} identifier - Resource identifier
   * @returns {BadRequestError} Duplicate error instance
   */
  static duplicate(resourceType, identifier) {
    const details = {
      resourceType,
      identifier,
      message: `${resourceType} with identifier '${identifier}' already exists`
    };

    return new BadRequestError(
      `${resourceType} already exists`,
      'DUPLICATE_RESOURCE',
      details
    );
  }

  /**
   * Create bad request error for invalid operation
   * @param {string} operation - Operation description
   * @param {string} reason - Reason for invalidity
   * @returns {BadRequestError} Invalid operation error instance
   */
  static invalidOperation(operation, reason) {
    const details = {
      operation,
      reason,
      message: `Invalid operation: ${operation}. Reason: ${reason}`
    };

    return new BadRequestError(
      'Invalid operation',
      'INVALID_OPERATION',
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

export default BadRequestError;
