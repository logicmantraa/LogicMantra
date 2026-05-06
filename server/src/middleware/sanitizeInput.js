import BadRequestError from '../errors/BadRequestError.js';

/**
 * sanitizeInput - Input sanitization middleware
 * Provides comprehensive input sanitization and security checks
 */

/**
 * XSS sanitization function
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeXSS(str) {
  if (typeof str !== 'string') return str;
  
  return str
    // Remove potentially dangerous characters
    .replace(/[<>]/g, '')
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: URLs
    .replace(/data:\s*text\/html/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove file: protocol
    .replace(/file:/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * SQL injection prevention (for MongoDB)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeSQL(str) {
  if (typeof str !== 'string') return str;
  
  return str
    // Remove MongoDB operators
    .replace(/\$where/gi, '')
    .replace(/\$regex/gi, '')
    .replace(/\$expr/gi, '')
    // Remove dangerous characters
    .replace(/[;'"`]/g, '')
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .trim();
}

/**
 * Email sanitization
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') return email;
  
  return email
    .toLowerCase()
    .trim()
    // Remove potentially dangerous characters
    .replace(/[<>]/g, '')
    // Basic email format validation
    .replace(/^[^\w@.-]/, '')
    .replace(/[^\w@.-]$/, '');
}

/**
 * Phone number sanitization
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') return phone;
  
  return phone
    // Keep only digits, +, -, (, ), and spaces
    .replace(/[^\d+\-\(\)\s]/g, '')
    .trim();
}

/**
 * Name sanitization
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizeName(name) {
  if (typeof name !== 'string') return name;
  
  return name
    // Remove potentially dangerous characters
    .replace(/[<>]/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Description/text sanitization
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  
  return sanitizeXSS(text)
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Object sanitization
 * @param {Object} obj - Object to sanitize
 * @param {Object} schema - Sanitization schema
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj, schema = {}) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (schema[key]) {
      const rules = schema[key];
      
      if (rules.type === 'string' && typeof value === 'string') {
        sanitized[key] = applyStringSanitization(value, rules);
      } else if (rules.type === 'email' && typeof value === 'string') {
        sanitized[key] = sanitizeEmail(value);
      } else if (rules.type === 'phone' && typeof value === 'string') {
        sanitized[key] = sanitizePhone(value);
      } else if (rules.type === 'name' && typeof value === 'string') {
        sanitized[key] = sanitizeName(value);
      } else if (rules.type === 'text' && typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      } else if (rules.type === 'number' && typeof value === 'string') {
        sanitized[key] = sanitizeNumber(value);
      } else if (rules.type === 'boolean' && typeof value === 'string') {
        sanitized[key] = sanitizeBoolean(value);
      } else if (rules.type === 'array' && Array.isArray(value)) {
        sanitized[key] = sanitizeArray(value, rules.itemSchema || {});
      } else if (rules.type === 'object' && typeof value === 'object') {
        sanitized[key] = sanitizeObject(value, rules.properties || {});
      } else {
        sanitized[key] = value;
      }
    } else {
      // Default sanitization for unknown fields
      sanitized[key] = typeof value === 'string' ? sanitizeXSS(value) : value;
    }
  }
  
  return sanitized;
}

/**
 * Apply string sanitization based on rules
 * @param {string} value - String value
 * @param {Object} rules - Sanitization rules
 * @returns {string} Sanitized string
 */
function applyStringSanitization(value, rules) {
  let sanitized = value;
  
  if (rules.xss !== false) {
    sanitized = sanitizeXSS(sanitized);
  }
  
  if (rules.sql !== false) {
    sanitized = sanitizeSQL(sanitized);
  }
  
  if (rules.maxLength) {
    sanitized = sanitized.substring(0, rules.maxLength);
  }
  
  if (rules.minLength) {
    // Don't truncate, validation will handle length check
  }
  
  if (rules.trim !== false) {
    sanitized = sanitized.trim();
  }
  
  return sanitized;
}

/**
 * Number sanitization
 * @param {string} value - String to convert to number
 * @returns {number|null} Sanitized number or null
 */
function sanitizeNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Boolean sanitization
 * @param {string} value - String to convert to boolean
 * @returns {boolean} Sanitized boolean
 */
function sanitizeBoolean(value) {
  return value === 'true' || value === '1';
}

/**
 * Array sanitization
 * @param {Array} arr - Array to sanitize
 * @param {Object} itemSchema - Schema for array items
 * @returns {Array} Sanitized array
 */
function sanitizeArray(arr, itemSchema = {}) {
  return arr.map(item => {
    if (typeof item === 'string') {
      return applyStringSanitization(item, itemSchema);
    } else if (typeof item === 'object') {
      return sanitizeObject(item, itemSchema);
    }
    return item;
  });
}

/**
 * Generic input sanitization middleware
 * @param {Object} schema - Sanitization schema
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware function
 */
export const sanitizeInput = (schema = {}, options = {}) => {
  const {
    source = 'body', // body, query, params
    strict = false, // Remove fields not in schema
    throwOnInvalid = false
  } = options;

  return (req, res, next) => {
    try {
      let data;
      
      // Get data from specified source
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

      if (!data || typeof data !== 'object') {
        return next();
      }

      // Sanitize the data
      const sanitized = sanitizeObject(data, schema);

      // If strict mode, remove fields not in schema
      if (strict) {
        const strictSanitized = {};
        for (const key of Object.keys(schema)) {
          if (sanitized.hasOwnProperty(key)) {
            strictSanitized[key] = sanitized[key];
          }
        }
        Object.assign(data, strictSanitized);
      } else {
        Object.assign(data, sanitized);
      }

      next();
    } catch (error) {
      if (throwOnInvalid) {
        return next(BadRequestError.invalidFormat('input', 'valid format', error.message));
      }
      next();
    }
  };
};

/**
 * Predefined sanitization schemas
 */
export const sanitizationSchemas = {
  user: {
    name: { type: 'name', maxLength: 50, trim: true },
    email: { type: 'email' },
    password: { type: 'string', maxLength: 128, xss: false, sql: false },
    phoneNumber: { type: 'phone' }
  },
  
  course: {
    title: { type: 'name', maxLength: 100 },
    description: { type: 'text', maxLength: 2000 },
    instructor: { type: 'name', maxLength: 50 },
    category: { type: 'name', maxLength: 50 },
    level: { type: 'string', maxLength: 20 },
    price: { type: 'number' },
    duration: { type: 'number' },
    thumbnail: { type: 'string', xss: false }
  },
  
  rating: {
    rating: { type: 'number' },
    feedback: { type: 'text', maxLength: 1000 }
  },
  
  contact: {
    name: { type: 'name', maxLength: 50 },
    email: { type: 'email' },
    intent: { type: 'string', maxLength: 100 },
    message: { type: 'text', maxLength: 1000 }
  },
  
  search: {
    search: { type: 'string', maxLength: 100, xss: false },
    category: { type: 'string', maxLength: 50 },
    level: { type: 'string', maxLength: 20 },
    page: { type: 'number' },
    limit: { type: 'number' }
  }
};

/**
 * Quick sanitization middleware for common use cases
 */
export const sanitizeUserInput = sanitizeInput(sanitizationSchemas.user);
export const sanitizeCourseInput = sanitizeInput(sanitizationSchemas.course);
export const sanitizeRatingInput = sanitizeInput(sanitizationSchemas.rating);
export const sanitizeContactInput = sanitizeInput(sanitizationSchemas.contact);
export const sanitizeSearchQuery = sanitizeInput(sanitizationSchemas.search, { source: 'query' });

/**
 * XSS protection middleware
 * Applies XSS sanitization to all string inputs
 */
export const xssProtection = (options = {}) => {
  const { source = 'body' } = options;
  
  return (req, res, next) => {
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
        default:
          data = req.body;
      }

      if (!data || typeof data !== 'object') {
        return next();
      }

      // Apply XSS sanitization recursively
      const sanitizeRecursive = (obj) => {
        if (typeof obj === 'string') {
          return sanitizeXSS(obj);
        } else if (Array.isArray(obj)) {
          return obj.map(sanitizeRecursive);
        } else if (typeof obj === 'object' && obj !== null) {
          const sanitized = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeRecursive(value);
          }
          return sanitized;
        }
        return obj;
      };

      const sanitized = sanitizeRecursive(data);
      Object.assign(data, sanitized);

      next();
    } catch (error) {
      next();
    }
  };
};

/**
 * Input validation middleware
 * Combines sanitization with basic validation
 * @param {Object} schema - Validation and sanitization schema
 * @returns {Function} Express middleware function
 */
export const validateAndSanitize = (schema = {}) => {
  return (req, res, next) => {
    try {
      const data = req.body;
      
      if (!data || typeof data !== 'object') {
        return next();
      }

      const errors = [];
      const sanitized = {};

      for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        // Check required fields
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }

        // Skip validation if field is not provided and not required
        if (value === undefined || value === null) {
          continue;
        }

        // Type validation
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }

        // Length validation
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }

        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters`);
        }

        // Sanitize the value
        if (typeof value === 'string') {
          sanitized[field] = applyStringSanitization(value, rules);
        } else {
          sanitized[field] = value;
        }
      }

      if (errors.length > 0) {
        return next(BadRequestError.validation(errors.map(error => ({
          field: error.split(' ')[0],
          message: error
        }))));
      }

      // Update request body with sanitized data
      Object.assign(req.body, sanitized);

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Default export
export default sanitizeInput;
