import AppError from '../errors/AppError.js';
import NotFoundError from '../errors/NotFoundError.js';
import { ZodError } from 'zod';

/**
 * Error handling middleware - Handles all application errors
 * Provides consistent error responses and proper error categorization
 */

export const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(validationErr => ({
      field: validationErr.path.join('.'),
      message: validationErr.message,
      code: validationErr.code,
      received: validationErr.received
    }));

    error = new AppError(
      'Request validation failed',
      400,
      true,
      'VALIDATION_ERROR'
    );
    error.details = validationErrors;
  }
  
  // Handle custom application errors
  if (err instanceof AppError) {
    error = err;
  } else {
    // Handle generic errors
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    error = new AppError(
      err.message || 'Internal Server Error',
      statusCode,
      false,
      'INTERNAL_ERROR'
    );
  }
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    error.log({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  // Send error response
  const includeStack = process.env.NODE_ENV === 'development';
  const response = error.toJSON(includeStack);
  
  res.status(error.statusCode);
  res.json(response);
};

/**
 * Not found middleware - Handles 404 errors
 * Creates consistent 404 responses for undefined routes
 */
export const notFound = (req, res, next) => {
  const error = NotFoundError.endpoint(req.method, req.originalUrl);
  next(error);
};

/**
 * Async error wrapper - Catches async function errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Development error handler - Provides detailed error information
 * Only used in development environment
 */
export const developmentErrorHandler = (err, req, res, next) => {
  const error = err instanceof AppError ? err : new AppError(err.message, 500);
  
  error.log({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    stack: err.stack
  });

  res.status(error.statusCode);
  res.json({
    success: false,
    error: error.constructor.name,
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    timestamp: error.timestamp,
    stack: error.stack,
    details: error.details || null,
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    }
  });
};

/**
 * Production error handler - Provides safe error information
 * Only used in production environment
 */
export const productionErrorHandler = (err, req, res, next) => {
  const error = err instanceof AppError ? err : new AppError('Internal Server Error', 500);
  
  // Log operational errors
  if (error.isOperational) {
    error.log({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    // Log programming errors with full details
    console.error('Programming Error:', {
      error: error.name,
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  res.status(error.statusCode);
  res.json({
    success: false,
    error: error.constructor.name,
    message: error.isOperational ? error.message : 'Something went wrong',
    statusCode: error.statusCode,
    code: error.code,
    timestamp: error.timestamp,
    // Only include details for operational errors
    details: error.isOperational ? error.details : null
  });
};

/**
 * Error handler selector - Chooses appropriate error handler based on environment
 */
export const selectErrorHandler = () => {
  return process.env.NODE_ENV === 'production' ? productionErrorHandler : developmentErrorHandler;
};

/**
 * Global error handler for unhandled promise rejections
 */
export const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', {
      error: err.message,
      stack: err.stack,
      promise: promise
    });
    
    // Close server gracefully in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Shutting down due to unhandled promise rejection...');
      process.exit(1);
    }
  });
};

/**
 * Global error handler for uncaught exceptions
 */
export const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', {
      error: err.message,
      stack: err.stack
    });
    
    // Close server gracefully
    console.log('Shutting down due to uncaught exception...');
    process.exit(1);
  });
};
