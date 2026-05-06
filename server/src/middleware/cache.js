import { cacheService, CACHE_TTL } from '../config/cache.js';
import crypto from 'crypto';

/**
 * Cache middleware for performance optimization
 * Provides response caching with intelligent invalidation
 */

/**
 * Generate cache key from request
 */
const generateCacheKey = (req, keyPrefix = '') => {
  const keyParts = [
    keyPrefix,
    req.method,
    req.originalUrl,
    JSON.stringify(req.query || {}),
    JSON.stringify(req.params || {}),
    req.user ? `user:${req.user._id}` : 'anonymous'
  ];
  
  const keyString = keyParts.join(':');
  const hash = crypto.createHash('md5').update(keyString).digest('hex');
  
  return `${keyPrefix}:${hash}`;
};

/**
 * Cache response middleware
 * @param {string} keyPrefix - Cache key prefix
 * @param {number} ttl - Time to live in seconds
 * @param {Object} options - Additional options
 */
export const cacheResponse = (keyPrefix = '', ttl = CACHE_TTL.MEDIUM, options = {}) => {
  const {
    skipCache = false,
    condition = null,
    keyGenerator = null,
    serialize = true,
    compress = false
  } = options;

  return async (req, res, next) => {
    // Skip caching if conditions not met
    if (skipCache || (condition && !condition(req))) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? keyGenerator(req) : generateCacheKey(req, keyPrefix);

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        res.set('X-Cache-TTL', ttl.toString());
        
        // Return cached response
        return res.json(cachedData);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache the response
          cacheService.set(cacheKey, data, ttl).catch(error => {
            console.error('Cache set error:', error.message);
          });
          
          // Set cache headers
          res.set('X-Cache', 'MISS');
          res.set('X-Cache-Key', cacheKey);
          res.set('X-Cache-TTL', ttl.toString());
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Cache middleware for GET requests only
 */
export const cacheGetResponse = (keyPrefix, ttl = CACHE_TTL.MEDIUM, options = {}) => {
  return cacheResponse(keyPrefix, ttl, {
    ...options,
    condition: (req) => req.method === 'GET'
  });
};

/**
 * Cache middleware for authenticated requests
 */
export const cacheAuthenticatedResponse = (keyPrefix, ttl = CACHE_TTL.MEDIUM, options = {}) => {
  return cacheResponse(keyPrefix, ttl, {
    ...options,
    condition: (req) => !!req.user
  });
};

/**
 * Cache middleware with user-specific keys
 */
export const cacheUserSpecificResponse = (keyPrefix, ttl = CACHE_TTL.MEDIUM, options = {}) => {
  return cacheResponse(keyPrefix, ttl, {
    ...options,
    keyGenerator: (req) => {
      if (!req.user) {
        return null; // Skip caching for unauthenticated requests
      }
      
      const keyParts = [
        keyPrefix,
        req.user._id,
        req.method,
        req.originalUrl,
        JSON.stringify(req.query || {}),
        JSON.stringify(req.params || {})
      ];
      
      const keyString = keyParts.join(':');
      const hash = crypto.createHash('md5').update(keyString).digest('hex');
      
      return `user:${req.user._id}:${keyPrefix}:${hash}`;
    }
  });
};

/**
 * Cache invalidation middleware
 */
export const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    try {
      const invalidatedCount = [];
      
      for (const pattern of patterns) {
        const count = await cacheService.deletePattern(pattern);
        invalidatedCount.push({ pattern, count });
      }
      
      // Set cache invalidation headers
      res.set('X-Cache-Invalidated', JSON.stringify(invalidatedCount));
      
      next();
    } catch (error) {
      console.error('Cache invalidation error:', error.message);
      next();
    }
  };
};

/**
 * Cache invalidation for course-related data
 */
export const invalidateCourseCache = (courseId) => {
  return invalidateCache([
    `courses:*`,
    `course:detail:*${courseId}*`,
    `course:stats:*${courseId}*`,
    `dashboard:stats:*`,
    `search:results:*`
  ]);
};

/**
 * Cache invalidation for rating-related data
 */
export const invalidateRatingCache = (courseId) => {
  return invalidateCache([
    `course:detail:*${courseId}*`,
    `course:stats:*${courseId}*`,
    `ratings:*`,
    `dashboard:stats:*`
  ]);
};

/**
 * Cache invalidation for enrollment-related data
 */
export const invalidateEnrollmentCache = (userId, courseId) => {
  return invalidateCache([
    `enrollments:*${userId}*`,
    `course:stats:*${courseId}*`,
    `dashboard:stats:*${userId}*`,
    `user:profile:*${userId}*`
  ]);
};

/**
 * Cache invalidation for user-related data
 */
export const invalidateUserCache = (userId) => {
  return invalidateCache([
    `user:profile:*${userId}*`,
    `enrollments:*${userId}*`,
    `dashboard:stats:*${userId}*`
  ]);
};

/**
 * Cache warming middleware
 */
export const warmCache = (key, data, ttl = CACHE_TTL.MEDIUM) => {
  return async (req, res, next) => {
    try {
      await cacheService.set(key, data, ttl);
      res.set('X-Cache-Warmed', key);
      next();
    } catch (error) {
      console.error('Cache warming error:', error.message);
      next();
    }
  };
};

/**
 * Cache statistics middleware
 */
export const cacheStats = (req, res, next) => {
  cacheService.getStats().then(stats => {
    res.set('X-Cache-Stats', JSON.stringify(stats));
    next();
  }).catch(error => {
    console.error('Cache stats error:', error.message);
    next();
  });
};

/**
 * Conditional cache middleware
 */
export const conditionalCache = (keyPrefix, ttl, conditionFn) => {
  return cacheResponse(keyPrefix, ttl, {
    condition: conditionFn
  });
};

/**
 * Cache middleware with compression
 */
export const compressedCacheResponse = (keyPrefix, ttl = CACHE_TTL.MEDIUM) => {
  return cacheResponse(keyPrefix, ttl, {
    compress: true
  });
};

/**
 * Cache middleware for API responses
 */
export const cacheApiResponse = (endpoint, ttl = CACHE_TTL.MEDIUM) => {
  return cacheGetResponse(`api:${endpoint}`, ttl, {
    keyGenerator: (req) => {
      const keyParts = [
        'api',
        endpoint,
        req.method,
        JSON.stringify(req.query || {}),
        JSON.stringify(req.params || {}),
        req.user ? `user:${req.user._id}` : 'anonymous'
      ];
      
      return keyParts.join(':');
    }
  });
};

/**
 * Cache middleware for static data
 */
export const cacheStaticData = (keyPrefix, ttl = CACHE_TTL.VERY_LONG) => {
  return cacheResponse(keyPrefix, ttl, {
    condition: (req) => req.method === 'GET'
  });
};

/**
 * Cache middleware for search results
 */
export const cacheSearchResults = (ttl = CACHE_TTL.SHORT) => {
  return cacheResponse('search:results', ttl, {
    condition: (req) => req.method === 'GET' && req.query.search,
    keyGenerator: (req) => {
      const keyParts = [
        'search:results',
        req.query.search || '',
        req.query.category || '',
        req.query.level || '',
        req.query.page || '1',
        req.query.limit || '10'
      ];
      
      return keyParts.join(':');
    }
  });
};

/**
 * Cache middleware for dashboard data
 */
export const cacheDashboardData = (ttl = CACHE_TTL.SHORT) => {
  return cacheUserSpecificResponse('dashboard:stats', ttl, {
    condition: (req) => req.user && req.method === 'GET'
  });
};

/**
 * Cache middleware for course listings
 */
export const cacheCourseList = (ttl = CACHE_TTL.MEDIUM) => {
  return cacheGetResponse('courses:list', ttl, {
    keyGenerator: (req) => {
      const keyParts = [
        'courses:list',
        JSON.stringify(req.query || {}),
        req.query.page || '1',
        req.query.limit || '10',
        req.query.category || '',
        req.query.level || ''
      ];
      
      return keyParts.join(':');
    }
  });
};

/**
 * Cache middleware for course details
 */
export const cacheCourseDetail = (ttl = CACHE_TTL.MEDIUM) => {
  return cacheGetResponse('course:detail', ttl, {
    keyGenerator: (req) => {
      const courseId = req.params.id || req.params.courseId;
      return `course:detail:${courseId}`;
    }
  });
};

/**
 * Cache middleware for user profiles
 */
export const cacheUserProfile = (ttl = CACHE_TTL.SHORT) => {
  return cacheUserSpecificResponse('user:profile', ttl, {
    condition: (req) => req.user && req.method === 'GET'
  });
};

export default {
  cacheResponse,
  cacheGetResponse,
  cacheAuthenticatedResponse,
  cacheUserSpecificResponse,
  invalidateCache,
  invalidateCourseCache,
  invalidateRatingCache,
  invalidateEnrollmentCache,
  invalidateUserCache,
  warmCache,
  cacheStats,
  conditionalCache,
  compressedCacheResponse,
  cacheApiResponse,
  cacheStaticData,
  cacheSearchResults,
  cacheDashboardData,
  cacheCourseList,
  cacheCourseDetail,
  cacheUserProfile
};
