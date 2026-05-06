import BadRequestError from './BadRequestError.js';

/**
 * ValidationError - Error for validation failures (400)
 * Extends BadRequestError for specific validation use cases
 */

class ValidationError extends BadRequestError {
  /**
   * Create a new validation error
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Validation Error', code = 'VALIDATION_ERROR', details = null) {
    super(message, code, details);
    this.name = 'ValidationError';
  }

  /**
   * Create validation error for specific field
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @param {any} value - Invalid value
   * @returns {ValidationError} Field validation error instance
   */
  static field(field, message, value = null) {
    const details = {
      field,
      message,
      value,
      timestamp: new Date().toISOString()
    };

    return new ValidationError(
      `Validation failed for field: ${field}`,
      'FIELD_VALIDATION_ERROR',
      details
    );
  }

  /**
   * Create validation error for multiple fields
   * @param {Array} validationErrors - Array of field validation errors
   * @returns {ValidationError} Multiple field validation error instance
   */
  static multiple(validationErrors) {
    const details = {
      validationErrors,
      totalErrors: validationErrors.length,
      timestamp: new Date().toISOString()
    };

    return new ValidationError(
      'Multiple validation errors occurred',
      'MULTIPLE_VALIDATION_ERRORS',
      details
    );
  }

  /**
   * Create validation error for required field
   * @param {string} field - Required field name
   * @returns {ValidationError} Required field error instance
   */
  static required(field) {
    return ValidationError.field(field, `${field} is required`);
  }

  /**
   * Create validation error for invalid format
   * @param {string} field - Field name
   * @param {string} format - Expected format
   * @returns {ValidationError} Invalid format error instance
   */
  static format(field, format) {
    return ValidationError.field(field, `Invalid format, expected ${format}`);
  }

  /**
   * Create validation error for invalid range
   * @param {string} field - Field name
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {ValidationError} Invalid range error instance
   */
  static range(field, min, max) {
    return ValidationError.field(field, `Value must be between ${min} and ${max}`);
  }

  /**
   * Create validation error for invalid ObjectId
   * @param {string} field - Field name
   * @returns {ValidationError} Invalid ObjectId error instance
   */
  static objectId(field) {
    return ValidationError.format(field, 'valid ObjectId (24-character hex string)');
  }

  /**
   * Create validation error for invalid email
   * @param {string} field - Field name
   * @returns {ValidationError} Invalid email error instance
   */
  static email(field) {
    return ValidationError.format(field, 'valid email address');
  }

  /**
   * Create validation error for invalid password
   * @param {string} field - Field name
   * @returns {ValidationError} Invalid password error instance
   */
  static password(field) {
    return ValidationError.field(field, 'Password must be at least 8 characters with uppercase, lowercase, and numbers');
  }

  /**
   * Create validation error for invalid enum value
   * @param {string} field - Field name
   * @param {Array} allowedValues - Array of allowed values
   * @returns {ValidationError} Invalid enum error instance
   */
  static enum(field, allowedValues) {
    return ValidationError.field(
      field, 
      `Value must be one of: ${allowedValues.join(', ')}`
    );
  }
}

export default ValidationError;
