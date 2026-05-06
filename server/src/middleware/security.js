import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'mongo-sanitize';
import xss from 'xss';
import hpp from 'hpp';

/**
 * Security middleware configuration
 * Implements comprehensive security best practices
 */

/**
 * Helmet configuration for security headers
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Expect-CT
  expectCt: {
    maxAge: 86400,
    enforce: true
  },
  
  // Feature Policy
  permittedCrossDomainPolicies: false,
  
  // Hide Powered-By Header
  hidePoweredBy: true,
  
  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // IE Compatibility
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Origin Isolation
  originIsolation: true,
  
  // Permission Policy
  permissionsPolicy: {
    features: {
      geolocation: ['none'],
      microphone: ['none'],
      camera: ['none'],
      payment: ['none'],
      usb: ['none'],
      magnetometer: ['none'],
      gyroscope: ['none'],
      accelerometer: ['none'],
      ambientLightSensor: ['none'],
      autoplay: ['none'],
      encryptedMedia: ['none'],
      fullscreen: ['none'],
      pictureInPicture: ['none'],
      speaker: ['none']
    }
  },
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // X-Content-Type-Options
  xContentTypeOptions: true,
  
  // X-DNS-Prefetch-Control
  xDnsPrefetchControl: { allow: false },
  
  // X-Download-Options
  xDownloadOptions: { noOpen: true },
  
  // X-Frame-Options
  xFrameOptions: { action: 'deny' },
  
  // X-Permitted-Cross-Domain-Policies
  xPermittedCrossDomainPolicies: false,
  
  // X-XSS-Protection
  xXssProtection: '1; mode=block'
});

/**
 * Rate limiting configuration
 */
export const createRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again after 15 minutes',
      retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ...options
  });
};

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Rate limiting for OTP endpoints
 */
export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: {
    error: 'Too many OTP requests, please try again after 10 minutes',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Rate limiting for password reset
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again after 1 hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Rate limiting for registration
 */
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    error: 'Too many registration attempts, please try again after 1 hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * Rate limiting for general API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many API requests, please try again after 15 minutes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * XSS protection middleware
 */
export const xssProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * MongoDB injection protection
 */
export const mongoSanitizeProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = mongoSanitize(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = mongoSanitize(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = mongoSanitize(req.params);
  }
  
  next();
};

/**
 * HTTP Parameter Pollution protection
 */
export const hppProtection = hpp({
  // Check body and query parameters
  checkBody: true,
  checkQuery: true,
  
  // Whitelist parameters that can have multiple values
  whitelist: ['tags', 'categories', 'permissions'],
  
  // Remove duplicates
  removeDuplicates: true
});

/**
 * Custom XSS sanitizer
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value, {
        whiteList: {
          // Allow basic HTML tags for rich text content
          p: [],
          br: [],
          strong: [],
          em: [],
          u: [],
          ol: [],
          ul: [],
          li: [],
          a: ['href', 'title', 'target'],
          img: ['src', 'alt', 'width', 'height']
        },
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
      });
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? xss(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Input validation and sanitization middleware
 */
export const validateAndSanitizeInput = (req, res, next) => {
  try {
    // Apply all security middleware
    mongoSanitizeProtection(req, res, (err) => {
      if (err) return next(err);
      
      hppProtection(req, res, (err) => {
        if (err) return next(err);
        
        xssProtection(req, res, next);
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Additional custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'IP address not allowed'
      });
    }
    
    next();
  };
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
      return res.status(413).json({
        error: 'Request entity too large',
        message: `Maximum request size is ${maxSize}`
      });
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
  helmetConfig,
  securityHeaders,
  requestSizeLimit('10mb'),
  mongoSanitizeProtection,
  hppProtection,
  xssProtection,
  apiRateLimit
];

export default {
  helmetConfig,
  createRateLimit,
  authRateLimit,
  otpRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  apiRateLimit,
  xssProtection,
  mongoSanitizeProtection,
  hppProtection,
  validateAndSanitizeInput,
  securityHeaders,
  ipWhitelist,
  requestSizeLimit,
  securityMiddleware
};
