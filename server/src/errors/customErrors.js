import AppError from './AppError.js';
import NotFoundError from './NotFoundError.js';
import BadRequestError from './BadRequestError.js';
import ForbiddenError from './ForbiddenError.js';
import UnauthorizedError from './UnauthorizedError.js';
import ValidationError from './ValidationError.js';
import ConflictError from './ConflictError.js';

/**
 * Custom Errors Module
 * Centralized export for all custom error classes
 * Provides backward compatibility for existing imports
 */

// Re-export all error classes
export {
  AppError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
  ConflictError
};

// Default export for compatibility
export default {
  AppError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
  ConflictError
};
