import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request Logging Middleware
 * Logs all HTTP requests with structured data and performance metrics
 */

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return uuidv4().replace(/-/g, '').substring(0, 16);
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.requestId = generateRequestId();
  
  // Record start time
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?._id || 'anonymous',
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length') || 0,
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log request completion
    logger.logRequest(req, res, responseTime);
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Request logging with Morgan format
 */
export const morganLogger = (req, res, next) => {
  // Generate unique request ID if not already present
  if (!req.requestId) {
    req.requestId = generateRequestId();
  }
  
  // Record start time
  const startTime = Date.now();
  
  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Create structured log entry
    const logEntry = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?._id || 'anonymous',
      contentLength: res.get('Content-Length') || 0,
      timestamp: new Date().toISOString(),
      ...(req.query && Object.keys(req.query).length > 0 && { query: req.query }),
      ...(req.params && Object.keys(req.params).length > 0 && { params: req.params }),
      // Include request body for non-GET requests (sanitized)
      ...(req.method !== 'GET' && req.body && {
        body: sanitizeRequestBody(req.body)
      })
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error(`Server Error: ${req.method} ${req.originalUrl}`, null, logEntry);
    } else if (res.statusCode >= 400) {
      logger.warn(`Client Error: ${req.method} ${req.originalUrl}`, logEntry);
    } else {
      logger.info(`Request: ${req.method} ${req.originalUrl}`, logEntry);
    }
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Sanitize request body for logging
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = [
    'password',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'token',
    'refreshToken',
    'secret',
    'key',
    'authorization',
    'creditCard',
    'cvv',
    'ssn',
    'apiKey'
  ];
  
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Error logging middleware
 */
export const errorLogger = (error, req, res, next) => {
  // Log error with full context
  logger.logApiError(error, req, {
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  next(error);
};

/**
 * Performance logging middleware
 */
export const performanceLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    logger.logPerformance(`${req.method} ${req.originalUrl}`, duration, {
      requestId: req.requestId,
      statusCode: res.statusCode,
      userId: req.user?._id || 'anonymous'
    });
  });
  
  next();
};

/**
 * Security event logging middleware
 */
export const securityLogger = (req, res, next) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempt
    /union.*select/i,  // SQL injection attempt
    /\$where/i,  // NoSQL injection attempt
    /eval\(/i,  // Code injection attempt
  ];
  
  const checkSuspiciousInput = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(obj)) {
          logger.logSecurity('Suspicious input detected', {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user?._id || 'anonymous',
            suspiciousContent: obj,
            path: path,
            timestamp: new Date().toISOString()
          });
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkSuspiciousInput(value, path ? `${path}.${key}` : key)) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Check request body and query parameters
  if (req.body) checkSuspiciousInput(req.body, 'body');
  if (req.query) checkSuspiciousInput(req.query, 'query');
  if (req.params) checkSuspiciousInput(req.params, 'params');
  
  next();
};

/**
 * API usage logging middleware
 */
export const apiUsageLogger = (req, res, next) => {
  // Log API usage statistics
  res.on('finish', () => {
    logger.info('API Usage', {
      requestId: req.requestId,
      endpoint: req.route?.path || req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      userId: req.user?._id || 'anonymous',
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
      // Add custom headers if present
      ...(req.get('X-Client-Version') && { clientVersion: req.get('X-Client-Version') }),
      ...(req.get('X-Platform') && { platform: req.get('X-Platform') })
    });
  });
  
  next();
};

/**
 * Database operation logging middleware
 */
export const databaseLogger = (req, res, next) => {
  // This would be used to log database operations
  // In a real implementation, you'd hook into MongoDB driver events
  next();
};

/**
 * Cache operation logging middleware
 */
export const cacheLogger = (req, res, next) => {
  // Log cache hits/misses based on response headers
  res.on('finish', () => {
    const cacheStatus = res.get('X-Cache');
    if (cacheStatus) {
      logger.logCache(cacheStatus === 'HIT' ? 'hit' : 'miss', req.originalUrl, {
        requestId: req.requestId,
        method: req.method,
        userId: req.user?._id || 'anonymous',
        cacheKey: res.get('X-Cache-Key'),
        ttl: res.get('X-Cache-TTL')
      });
    }
  });
  
  next();
};

/**
 * Combined logging middleware stack
 */
export const loggingMiddleware = [
  requestLogger,
  securityLogger,
  performanceLogger,
  apiUsageLogger,
  cacheLogger,
  errorLogger
];

export default {
  requestLogger,
  morganLogger,
  errorLogger,
  performanceLogger,
  securityLogger,
  apiUsageLogger,
  databaseLogger,
  cacheLogger,
  loggingMiddleware
};
