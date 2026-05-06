import ForbiddenError from '../errors/ForbiddenError.js';

/**
 * rateLimiter - Rate limiting middleware for authentication and OTP endpoints
 * Provides configurable rate limiting with different strategies
 */

/**
 * In-memory rate limiter store
 * In production, replace with Redis or other distributed store
 */
class MemoryStore {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  get(key) {
    return this.requests.get(key);
  }

  set(key, value) {
    this.requests.set(key, value);
  }

  delete(key) {
    this.requests.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime <= now) {
        this.delete(key);
      }
    }
  }

  clear() {
    this.requests.clear();
  }
}

// Global store instance
const store = new MemoryStore();

/**
 * Basic rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
export const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests, please try again later',
    standardHeaders = true, // Return rate limit info in headers
    legacyHeaders = false, // Disable legacy headers
    keyGenerator = (req) => {
      // Default key generator based on IP
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    skip = (req) => false, // Skip function
    onLimitReached = (req, res, options) => {
      // Custom handler when limit is reached
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return (req, res, next) => {
    // Skip rate limiting if skip function returns true
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing request data
    let requestData = store.get(key);
    
    if (!requestData) {
      requestData = {
        requests: [],
        resetTime: now + windowMs
      };
      store.set(key, requestData);
    }

    // Remove expired requests
    requestData.requests = requestData.requests.filter(timestamp => timestamp > windowStart);

    // Check if rate limit exceeded
    if (requestData.requests.length >= max) {
      // Set rate limit headers
      if (standardHeaders) {
        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': Math.ceil(requestData.resetTime / 1000)
        });
      }

      if (legacyHeaders) {
        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': requestData.resetTime
        });
      }

      // Call custom limit handler
      if (onLimitReached) {
        onLimitReached(req, res, options);
      }

      return next(ForbiddenError.rateLimited('request', Math.ceil(windowMs / 1000)));
    }

    // Add current request
    requestData.requests.push(now);

    // Set rate limit headers
    if (standardHeaders) {
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - requestData.requests.length),
        'X-RateLimit-Reset': Math.ceil(requestData.resetTime / 1000)
      });
    }

    if (legacyHeaders) {
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - requestData.requests.length),
        'X-RateLimit-Reset': requestData.resetTime
      });
    }

    next();
  };
};

/**
 * Rate limiter for authentication endpoints
 * More restrictive for login attempts
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  keyGenerator: (req) => {
    // Use IP + email for login attempts
    const email = req.body.email || 'unknown';
    const ip = req.ip || 'unknown';
    return `auth:${ip}:${email}`;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true // Don't count successful requests
});

/**
 * Rate limiter for OTP endpoints
 * Very restrictive for OTP generation
 */
export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 OTP requests per 10 minutes
  message: 'Too many OTP requests, please try again later',
  keyGenerator: (req) => {
    // Use IP + email for OTP requests
    const email = req.body.email || 'unknown';
    const ip = req.ip || 'unknown';
    return `otp:${ip}:${email}`;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

/**
 * Rate limiter for password reset
 * Restrictive for password reset attempts
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again later',
  keyGenerator: (req) => {
    // Use IP + email for password reset
    const email = req.body.email || 'unknown';
    const ip = req.ip || 'unknown';
    return `password-reset:${ip}:${email}`;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

/**
 * Rate limiter for registration
 * Prevent spam registration
 */
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many registration attempts, please try again later',
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    return `registration:${ip}`;
  },
  skipSuccessfulRequests: true, // Don't count successful registrations
  skipFailedRequests: false
});

/**
 * Rate limiter for general API requests
 * Less restrictive for authenticated users
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: 'Too many requests, please try again later',
  keyGenerator: (req) => {
    // Use user ID for authenticated users, IP for anonymous
    if (req.user && req.user._id) {
      return `user:${req.user._id}`;
    }
    return `ip:${req.ip || 'unknown'}`;
  }
});

/**
 * Rate limiter for admin operations
 * More restrictive for admin actions
 */
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 admin requests per 15 minutes
  message: 'Too many admin requests, please try again later',
  keyGenerator: (req) => {
    if (req.user && req.user._id) {
      return `admin:${req.user._id}`;
    }
    return `admin-ip:${req.ip || 'unknown'}`;
  },
  skip: (req) => !req.user || !req.user.isAdmin // Only apply to admin users
});

/**
 * Rate limiter for file uploads
 * Restrictive for upload operations
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many upload attempts, please try again later',
  keyGenerator: (req) => {
    if (req.user && req.user._id) {
      return `upload:${req.user._id}`;
    }
    return `upload-ip:${req.ip || 'unknown'}`;
  }
});

/**
 * Rate limiter for email sending
 * Very restrictive for email operations
 */
export const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 emails per hour
  message: 'Too many email requests, please try again later',
  keyGenerator: (req) => {
    const email = req.body.email || 'unknown';
    const ip = req.ip || 'unknown';
    return `email:${ip}:${email}`;
  }
});

/**
 * Rate limiter with sliding window
 * More accurate rate limiting using sliding window algorithm
 */
export const slidingWindowRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip || 'unknown'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing request data
    let requestData = store.get(key);
    
    if (!requestData) {
      requestData = {
        requests: []
      };
      store.set(key, requestData);
    }

    // Remove expired requests
    requestData.requests = requestData.requests.filter(timestamp => timestamp > windowStart);

    // Check if rate limit exceeded
    if (requestData.requests.length >= max) {
      return next(ForbiddenError.rateLimited('request', Math.ceil(windowMs / 1000)));
    }

    // Add current request
    requestData.requests.push(now);

    next();
  };
};

/**
 * Rate limiter with progressive backoff
 * Increases penalty for repeated violations
 */
export const progressiveRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Base max requests
    penaltyMultiplier = 2, // Penalty multiplier
    maxPenalty = 10, // Maximum penalty multiplier
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip || 'unknown'
  } = options;

  return (req, res, next) => {
    const key = `${keyGenerator(req)}:progressive`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing request data
    let requestData = store.get(key);
    
    if (!requestData) {
      requestData = {
        requests: [],
        violations: 0,
        lastViolation: 0
      };
      store.set(key, requestData);
    }

    // Remove expired requests
    requestData.requests = requestData.requests.filter(timestamp => timestamp > windowStart);

    // Calculate penalty
    let effectiveMax = max;
    if (requestData.violations > 0 && now - requestData.lastViolation < windowMs * 2) {
      effectiveMax = Math.floor(max / Math.min(requestData.violations * penaltyMultiplier, maxPenalty));
    }

    // Check if rate limit exceeded
    if (requestData.requests.length >= effectiveMax) {
      requestData.violations++;
      requestData.lastViolation = now;
      
      return next(ForbiddenError.rateLimited('request', Math.ceil(windowMs * requestData.violations / 1000)));
    }

    // Add current request
    requestData.requests.push(now);

    // Reset violations if user behaves well
    if (requestData.violations > 0 && now - requestData.lastViolation > windowMs * 2) {
      requestData.violations = Math.max(0, requestData.violations - 1);
    }

    next();
  };
};

/**
 * Rate limiter cleanup function
 * Call this periodically to clean up old data
 */
export const cleanupRateLimits = () => {
  store.cleanup();
};

/**
 * Get rate limit statistics
 * @returns {Object} Rate limit statistics
 */
export const getRateLimitStats = () => {
  const stats = {
    totalKeys: store.requests.size,
    activeWindows: 0,
    oldestRequest: null,
    newestRequest: null
  };

  const now = Date.now();
  let oldestTimestamp = now;
  let newestTimestamp = 0;

  for (const [key, data] of store.requests.entries()) {
    if (data.requests.length > 0) {
      stats.activeWindows++;
      oldestTimestamp = Math.min(oldestTimestamp, Math.min(...data.requests));
      newestTimestamp = Math.max(newestTimestamp, Math.max(...data.requests));
    }
  }

  if (oldestTimestamp < now) {
    stats.oldestRequest = new Date(oldestTimestamp).toISOString();
  }
  
  if (newestTimestamp > 0) {
    stats.newestRequest = new Date(newestTimestamp).toISOString();
  }

  return stats;
};

// Default export
export default rateLimit;
