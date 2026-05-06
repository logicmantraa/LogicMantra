import { ZodError } from 'zod';

/**
 * Validation Middleware - Reusable Zod validation middleware
 * Centralizes request validation using Zod schemas
 */

/**
 * Creates a validation middleware function
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // Get the data to validate from the specified source
      let data;
      switch (source) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        default:
          data = req.body;
      }

      // Validate the data against the schema
      const validatedData = schema.parse(data);

      // Replace the request property with validated data
      switch (source) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
      }

      // Continue to next middleware
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }

      // Handle other errors
      return res.status(500).json({
        success: false,
        error: 'Validation Error',
        message: 'An error occurred during validation',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Validates request body
 * @param {ZodSchema} schema - Zod schema for body validation
 * @returns {Function} Express middleware function
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validates request query parameters
 * @param {ZodSchema} schema - Zod schema for query validation
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validates request parameters
 * @param {ZodSchema} schema - Zod schema for params validation
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Validates multiple sources at once
 * @param {Object} schemas - Object with body, query, and/or params schemas
 * @returns {Function} Express middleware function
 */
export const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];
    const validatedData = {};

    // Validate each specified source
    const sources = ['body', 'query', 'params'];
    
    for (const source of sources) {
      if (schemas[source]) {
        try {
          let data;
          switch (source) {
            case 'body':
              data = req.body;
              break;
            case 'query':
              data = req.query;
              break;
            case 'params':
              data = req.params;
              break;
          }

          const validated = schemas[source].parse(data);
          validatedData[source] = validated;
        } catch (error) {
          if (error instanceof ZodError) {
            const validationErrors = error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
              source
            }));
            errors.push(...validationErrors);
          }
        }
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors,
        timestamp: new Date().toISOString()
      });
    }

    // Update request with validated data
    if (validatedData.body) req.body = validatedData.body;
    if (validatedData.query) req.query = validatedData.query;
    if (validatedData.params) req.params = validatedData.params;

    next();
  };
};

/**
 * Async validation middleware for complex validation logic
 * @param {Function} validator - Async validation function
 * @returns {Function} Express middleware function
 */
export const validateAsync = (validator) => {
  return async (req, res, next) => {
    try {
      await validator(req);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message || 'Validation failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Conditional validation middleware
 * @param {Function} condition - Function that returns true if validation should be applied
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Request property to validate
 * @returns {Function} Express middleware function
 */
export const validateIf = (condition, schema, source = 'body') => {
  return (req, res, next) => {
    if (condition(req)) {
      return validate(schema, source)(req, res, next);
    }
    next();
  };
};

/**
 * Sanitizes and validates input data
 * @param {ZodSchema} schema - Zod schema with transformations
 * @param {string} source - Request property to validate
 * @returns {Function} Express middleware function
 */
export const sanitizeAndValidate = (schema, source = 'body') => {
  return validate(schema, source);
};

// Default export for backward compatibility
export default validate;
