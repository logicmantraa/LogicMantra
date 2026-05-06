import Redis from 'ioredis';

/**
 * Redis Cache Configuration
 * Provides Redis connection and caching utilities
 */

// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  keyPrefix: 'logicmantraa:',
  // Connection timeout
  connectTimeout: 10000,
  // Command timeout
  commandTimeout: 5000,
  // Enable compression
  enableOfflineQueue: false,
  // Auto-reconnect
  autoResendUnfulfilledCommands: false,
  // Retry strategy
  retryStrategy: (times) => {
    if (times > 3) {
      return null; // Stop retrying after 3 attempts
    }
    return Math.min(times * 50, 2000); // Exponential backoff
  }
};

// Create Redis client
let redisClient;

/**
 * Initialize Redis connection
 */
export const initializeRedis = async () => {
  try {
    redisClient = new Redis(redisOptions);
    
    // Event handlers
    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
    
    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });
    
    redisClient.on('close', () => {
      console.log('🔌 Redis connection closed');
    });
    
    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
    
    // Test connection
    await redisClient.ping();
    console.log('🎯 Redis connection verified');
    
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    // Fallback to in-memory cache
    console.log('🔄 Falling back to in-memory cache');
    return null;
  }
};

/**
 * Get Redis client
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * In-memory fallback cache
 */
class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }
  
  set(key, value, ttl = 3600) {
    // Clear existing timer for this key
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    // Set value
    this.cache.set(key, value);
    
    // Set expiration timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);
      this.timers.set(key, timer);
    }
  }
  
  get(key) {
    return this.cache.get(key);
  }
  
  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }
  
  exists(key) {
    return this.cache.has(key);
  }
  
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }
  
  keys(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }
  
  async flush() {
    this.clear();
  }
}

// Fallback in-memory cache
const fallbackCache = new InMemoryCache();

/**
 * Cache Service
 * Provides unified caching interface with Redis fallback
 */
export class CacheService {
  constructor() {
    this.client = null;
    this.isRedisAvailable = false;
  }
  
  async initialize() {
    this.client = await initializeRedis();
    this.isRedisAvailable = !!this.client;
  }
  
  /**
   * Set cache value
   */
  async set(key, value, ttl = 3600) {
    try {
      if (this.isRedisAvailable && this.client) {
        const serializedValue = JSON.stringify(value);
        await this.client.setex(key, ttl, serializedValue);
        return true;
      } else {
        fallbackCache.set(key, value, ttl);
        return true;
      }
    } catch (error) {
      console.error('Cache set error:', error.message);
      fallbackCache.set(key, value, ttl);
      return false;
    }
  }
  
  /**
   * Get cache value
   */
  async get(key) {
    try {
      if (this.isRedisAvailable && this.client) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return fallbackCache.get(key) || null;
      }
    } catch (error) {
      console.error('Cache get error:', error.message);
      return fallbackCache.get(key) || null;
    }
  }
  
  /**
   * Delete cache value
   */
  async delete(key) {
    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.del(key);
        return true;
      } else {
        fallbackCache.delete(key);
        return true;
      }
    } catch (error) {
      console.error('Cache delete error:', error.message);
      fallbackCache.delete(key);
      return false;
    }
  }
  
  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      if (this.isRedisAvailable && this.client) {
        const result = await this.client.exists(key);
        return result === 1;
      } else {
        return fallbackCache.exists(key);
      }
    } catch (error) {
      console.error('Cache exists error:', error.message);
      return fallbackCache.exists(key);
    }
  }
  
  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.flushdb();
        return true;
      } else {
        fallbackCache.clear();
        return true;
      }
    } catch (error) {
      console.error('Cache clear error:', error.message);
      fallbackCache.clear();
      return false;
    }
  }
  
  /**
   * Get keys by pattern
   */
  async keys(pattern) {
    try {
      if (this.isRedisAvailable && this.client) {
        const keys = await this.client.keys(pattern);
        return keys;
      } else {
        return fallbackCache.keys(pattern);
      }
    } catch (error) {
      console.error('Cache keys error:', error.message);
      return fallbackCache.keys(pattern);
    }
  }
  
  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern) {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      
      if (this.isRedisAvailable && this.client) {
        await this.client.del(...keys);
        return keys.length;
      } else {
        keys.forEach(key => fallbackCache.delete(key));
        return keys.length;
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error.message);
      return 0;
    }
  }
  
  /**
   * Increment value
   */
  async increment(key, amount = 1) {
    try {
      if (this.isRedisAvailable && this.client) {
        return await this.client.incrby(key, amount);
      } else {
        const current = fallbackCache.get(key) || 0;
        const newValue = current + amount;
        fallbackCache.set(key, newValue);
        return newValue;
      }
    } catch (error) {
      console.error('Cache increment error:', error.message);
      return 0;
    }
  }
  
  /**
   * Set with expiration only if key doesn't exist
   */
  async setnx(key, value, ttl = 3600) {
    try {
      if (this.isRedisAvailable && this.client) {
        const serializedValue = JSON.stringify(value);
        const result = await this.client.set(key, serializedValue, 'EX', ttl, 'NX');
        return result === 'OK';
      } else {
        if (!fallbackCache.exists(key)) {
          fallbackCache.set(key, value, ttl);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Cache setnx error:', error.message);
      return false;
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (this.isRedisAvailable && this.client) {
        const info = await this.client.info('memory');
        const keyspace = await this.client.info('keyspace');
        
        return {
          type: 'redis',
          connected: true,
          memory: info,
          keyspace: keyspace
        };
      } else {
        return {
          type: 'in-memory',
          connected: true,
          keys: fallbackCache.cache.size,
          timers: fallbackCache.timers.size
        };
      }
    } catch (error) {
      return {
        type: 'error',
        connected: false,
        error: error.message
      };
    }
  }
}

// Create cache service instance
export const cacheService = new CacheService();

/**
 * Cache configuration constants
 */
export const CACHE_KEYS = {
  COURSES_LIST: 'courses:list',
  COURSE_DETAIL: 'course:detail',
  COURSE_STATS: 'course:stats',
  DASHBOARD_STATS: 'dashboard:stats',
  USER_PROFILE: 'user:profile',
  ENROLLMENTS: 'enrollments',
  RATINGS: 'ratings',
  SEARCH_RESULTS: 'search:results'
};

export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
};

/**
 * Initialize cache on module load
 */
cacheService.initialize().catch(console.error);

export default cacheService;
