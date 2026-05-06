import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

/**
 * Winston Logger Configuration
 * Structured logging system with file rotation and multiple transports
 */

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += '\n' + JSON.stringify(meta, null, 2);
    }
    
    return msg;
  })
);

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label']
  })
);

// Create the main logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'logicmantraa-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Combined log file with daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
      level: 'info'
    }),
    
    // Error log file with daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
      level: 'error'
    }),
    
    // Debug log file (only in development)
    ...(process.env.NODE_ENV === 'development' ? [
      new DailyRotateFile({
        filename: path.join(logsDir, 'debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: logFormat,
        level: 'debug'
      })
    ] : [])
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Enhanced logging methods with structured data
 */
class Logger {
  constructor(winstonLogger) {
    this.logger = winstonLogger;
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log error message with stack trace
   */
  error(message, error = null, meta = {}) {
    const errorData = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };
    
    this.logger.error(message, errorData);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log HTTP request
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?._id || 'anonymous',
      requestId: req.requestId || 'unknown',
      contentLength: res.get('Content-Length') || 0,
      ...(req.query && Object.keys(req.query).length > 0 && { query: req.query }),
      ...(req.params && Object.keys(req.params).length > 0 && { params: req.params })
    };

    // Log based on status code
    if (res.statusCode >= 400) {
      this.warn(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
    } else {
      this.info(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
    }
  }

  /**
   * Log authentication events
   */
  logAuth(event, userId, details = {}) {
    this.info(`Auth: ${event}`, {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log security events
   */
  logSecurity(event, details = {}) {
    this.warn(`Security: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      severity: 'high',
      ...details
    });
  }

  /**
   * Log business events (purchases, enrollments, etc.)
   */
  logBusiness(event, details = {}) {
    this.info(`Business: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log database operations
   */
  logDatabase(operation, collection, details = {}) {
    this.debug(`Database: ${operation}`, {
      operation,
      collection,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log cache operations
   */
  logCache(operation, key, details = {}) {
    this.debug(`Cache: ${operation}`, {
      operation,
      key,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation, duration, details = {}) {
    this.info(`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log API errors with context
   */
  logApiError(error, req, additionalContext = {}) {
    this.error('API Error', error, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?._id || 'anonymous',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query,
      params: req.params,
      ...additionalContext
    });
  }

  /**
   * Create child logger with additional context
   */
  child(context) {
    return {
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      error: (message, error = null, meta = {}) => this.error(message, error, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...context, ...meta })
    };
  }

  /**
   * Get logger statistics
   */
  getStats() {
    return {
      level: this.logger.level,
      transports: this.logger.transports.length,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Change log level at runtime
   */
  setLevel(level) {
    this.logger.level = level;
    this.info(`Log level changed to: ${level}`);
  }
}

// Create and export logger instance
const structuredLogger = new Logger(logger);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  structuredLogger.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  structuredLogger.error('Unhandled Rejection', new Error(reason), {
    promise: promise.toString()
  });
});

export default structuredLogger;
