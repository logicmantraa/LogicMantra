import xss from 'xss';
import mongoSanitize from 'mongo-sanitize';
import { BadRequestError } from '../errors/BadRequestError.js';

/**
 * Comprehensive input sanitization middleware
 * Applies to all incoming requests for maximum security
 */

/**
 * XSS protection with custom whitelist
 */
const xssOptions = {
  whiteList: {
    // Allow basic formatting for rich text content
    p: ['style'],
    br: [],
    strong: ['style'],
    em: ['style'],
    u: ['style'],
    ol: ['start', 'type'],
    ul: [],
    li: [],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'style'],
    div: ['style', 'class'],
    span: ['style', 'class'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    h5: ['style'],
    h6: ['style'],
    blockquote: ['style'],
    code: ['style'],
    pre: ['style'],
    hr: []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'noscript'],
  onTag: function(tag, html, options) {
    // Custom tag processing
    if (tag === 'a') {
      // Add security attributes to links
      return html.replace(/<a([^>]*)>/gi, '<a$1 rel="noopener noreferrer" target="_blank">');
    }
  },
  onIgnoreTag: function(tag, html, options) {
    // Handle ignored tags
    return '';
  },
  onIgnoreTagAttr: function(tag, name, value) {
    // Ignore dangerous attributes
    if (name.startsWith('on') || name === 'style') {
      return;
    }
    return name;
  }
};

/**
 * Sanitize a string value
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Apply XSS protection
  const sanitized = xss(str, xssOptions);
  
  // Apply MongoDB sanitization
  return mongoSanitize(sanitized);
};

/**
 * Sanitize an object recursively
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous keys
      if (isDangerousKey(key)) {
        continue;
      }
      
      sanitized[key] = sanitizeObject(value);
    }
    
    return sanitized;
  }
  
  return obj;
};

/**
 * Check if a key is potentially dangerous
 */
const isDangerousKey = (key) => {
  const dangerousKeys = [
    // MongoDB operators
    '$where', '$regex', '$expr', '$text', '$jsonSchema',
    '$elemMatch', '$gt', '$gte', '$lt', '$lte', '$ne', '$in',
    '$nin', '$and', '$or', '$not', '$nor', '$exists',
    '$type', '$mod', '$all', '$size', '$slice', '$elemMatch',
    '$push', '$pull', '$each', '$position', '$slice',
    '$sort', '$addToSet', '$pop', '$rename', '$unset',
    '$inc', '$mul', '$min', '$max', '$currentDate',
    
    // JavaScript keywords
    'constructor', 'prototype', '__proto__', '__defineGetter__',
    '__defineSetter__', '__lookupGetter__', '__lookupSetter__',
    
    // HTML/Script related
    'script', 'iframe', 'object', 'embed', 'form', 'input',
    'textarea', 'select', 'option', 'button', 'link'
  ];
  
  return dangerousKeys.some(dangerous => 
    key.toLowerCase().includes(dangerous.toLowerCase())
  );
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL format
 */
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Input validation middleware
 */
export const validateInput = (req, res, next) => {
  try {
    const errors = [];
    
    // Validate email fields
    if (req.body.email && !validateEmail(req.body.email)) {
      errors.push('Invalid email format');
    }
    
    // Validate phone fields
    if (req.body.phoneNumber && !validatePhone(req.body.phoneNumber)) {
      errors.push('Invalid phone number format');
    }
    
    // Validate URL fields
    if (req.body.thumbnail && !validateUrl(req.body.thumbnail)) {
      errors.push('Invalid thumbnail URL format');
    }
    
    if (errors.length > 0) {
      throw BadRequestError.validation(errors.map(error => ({
        field: 'general',
        message: error
      })));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Comprehensive input sanitization middleware
 */
export const sanitizeAllInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    // Sanitize headers (only specific ones)
    if (req.headers) {
      const safeHeaders = {};
      const allowedHeaders = ['authorization', 'content-type', 'accept', 'user-agent'];
      
      for (const header of allowedHeaders) {
        if (req.headers[header]) {
          safeHeaders[header] = sanitizeString(req.headers[header]);
        }
      }
      
      // Only update safe headers
      Object.assign(req.headers, safeHeaders);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * File upload sanitization
 */
export const sanitizeFileUpload = (req, res, next) => {
  if (req.file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return next(BadRequestError.invalidFormat('file', 'image file', req.file.mimetype));
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return next(BadRequestError.invalidFormat('file', 'file under 5MB', `${req.file.size} bytes`));
    }
    
    // Sanitize filename
    const originalName = req.file.originalname;
    const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    req.file.originalname = sanitized;
  }
  
  next();
};

/**
 * JSON payload validation
 */
export const validateJSONPayload = (req, res, next) => {
  try {
    // Check if content-type is JSON
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      const contentType = req.get('Content-Type');
      
      if (contentType && contentType.includes('application/json')) {
        // Validate JSON structure
        if (req.body && typeof req.body === 'object') {
          // Check for circular references
          const seen = new WeakSet();
          
          const checkCircular = (obj) => {
            if (typeof obj === 'object' && obj !== null) {
              if (seen.has(obj)) {
                throw new Error('Circular reference detected in JSON payload');
              }
              seen.add(obj);
              
              for (const value of Object.values(obj)) {
                checkCircular(value);
              }
            }
          };
          
          checkCircular(req.body);
        }
      }
    }
    
    next();
  } catch (error) {
    next(BadRequestError.invalidFormat('JSON payload', 'valid JSON', error.message));
  }
};

/**
 * Request size validation
 */
export const validateRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return next(BadRequestError.invalidFormat('request', `request under ${maxSize}`, `${sizeInBytes} bytes`));
      }
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 */
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  
  if (!match) return 0;
  
  return parseFloat(match[1]) * (units[match[2]] || 1);
};

/**
 * Comprehensive security middleware stack
 */
export const securityMiddleware = [
  validateRequestSize('10mb'),
  validateJSONPayload,
  validateInput,
  sanitizeAllInput
];

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeAllInput,
  validateInput,
  sanitizeFileUpload,
  validateJSONPayload,
  validateRequestSize,
  securityMiddleware
};
