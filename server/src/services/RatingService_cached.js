import Rating from '../models/Rating.js';
import Course from '../models/Course.js';
import { cacheService, CACHE_TTL } from '../config/cache.js';
import { CACHE_KEYS } from '../config/cache.js';
import NotFoundError from '../errors/NotFoundError.js';
import BadRequestError from '../errors/BadRequestError.js';

/**
 * Rating Service with caching support
 * Handles rating business logic with performance optimization
 */

class RatingService {
  /**
   * Submit rating with cache invalidation
   * @param {Object} ratingData - Rating data
   * @returns {Object} Created rating
   */
  static async submitRating(ratingData) {
    try {
      // Check if user already rated this course
      const existingRating = await Rating.findOne({
        userId: ratingData.userId,
        courseId: ratingData.courseId
      });

      if (existingRating) {
        throw BadRequestError.duplicate('Rating', `${ratingData.userId}-${ratingData.courseId}`);
      }

      // Create rating
      const rating = await Rating.create(ratingData);
      
      // Update course average rating
      await this.updateCourseAverageRating(ratingData.courseId);
      
      // Invalidate related caches
      await this.invalidateRatingCaches(ratingData.courseId);
      
      return rating;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      console.error('Submit rating error:', error);
      throw new BadRequestError('Failed to submit rating', 'RATING_SUBMIT_ERROR');
    }
  }

  /**
   * Update rating with cache invalidation
   * @param {string} ratingId - Rating ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated rating
   */
  static async updateRating(ratingId, updateData) {
    try {
      const rating = await Rating.findByIdAndUpdate(
        ratingId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!rating) {
        throw NotFoundError.rating(ratingId);
      }
      
      // Update course average rating
      await this.updateCourseAverageRating(rating.courseId);
      
      // Invalidate related caches
      await this.invalidateRatingCaches(rating.courseId);
      
      return rating;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Update rating error:', error);
      throw new BadRequestError('Failed to update rating', 'RATING_UPDATE_ERROR');
    }
  }

  /**
   * Delete rating with cache invalidation
   * @param {string} ratingId - Rating ID
   * @returns {Object} Deleted rating
   */
  static async deleteRating(ratingId) {
    try {
      const rating = await Rating.findByIdAndDelete(ratingId);
      
      if (!rating) {
        throw NotFoundError.rating(ratingId);
      }
      
      // Update course average rating
      await this.updateCourseAverageRating(rating.courseId);
      
      // Invalidate related caches
      await this.invalidateRatingCaches(rating.courseId);
      
      return rating;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Delete rating error:', error);
      throw new BadRequestError('Failed to delete rating', 'RATING_DELETE_ERROR');
    }
  }

  /**
   * Get course ratings with caching
   * @param {string} courseId - Course ID
   * @param {Object} filters - Query filters
   * @returns {Object} Ratings data with pagination
   */
  static async getCourseRatings(courseId, filters = {}) {
    try {
      // Generate cache key
      const cacheKey = this.generateRatingsCacheKey(courseId, filters);
      
      // Try to get from cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Build query
      const query = { courseId };
      
      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [ratings, total, ratingStats] = await Promise.all([
        Rating.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'name email')
          .select('-__v'),
        Rating.countDocuments(query),
        this.getRatingStatistics(courseId)
      ]);

      const result = {
        ratings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        statistics: ratingStats,
        filters: { courseId, ...filters }
      };

      // Cache the result for 15 minutes
      await cacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
      
      return result;
    } catch (error) {
      console.error('Get course ratings error:', error);
      throw new BadRequestError('Failed to fetch course ratings', 'RATINGS_FETCH_ERROR');
    }
  }

  /**
   * Get user's rating for a course with caching
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Object} User rating
   */
  static async getUserRating(userId, courseId) {
    try {
      // Generate cache key
      const cacheKey = `${CACHE_KEYS.RATINGS}:user:${userId}:course:${courseId}`;
      
      // Try to get from cache first
      const cachedRating = await cacheService.get(cacheKey);
      if (cachedRating) {
        return cachedRating;
      }

      const rating = await Rating.findOne({ userId, courseId })
        .populate('userId', 'name email')
        .select('-__v');

      // Cache the result for 30 minutes
      await cacheService.set(cacheKey, rating, CACHE_TTL.LONG);
      
      return rating;
    } catch (error) {
      console.error('Get user rating error:', error);
      throw new BadRequestError('Failed to fetch user rating', 'USER_RATING_FETCH_ERROR');
    }
  }

  /**
   * Get rating statistics with caching
   * @param {string} courseId - Course ID
   * @returns {Object} Rating statistics
   */
  static async getRatingStatistics(courseId) {
    try {
      // Generate cache key
      const cacheKey = `${CACHE_KEYS.RATINGS}:stats:${courseId}`;
      
      // Try to get from cache first
      const cachedStats = await cacheService.get(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const [ratingData, distribution] = await Promise.all([
        // Basic statistics
        Rating.aggregate([
          { $match: { courseId } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalRatings: { $sum: 1 },
              sumRatings: { $sum: '$rating' }
            }
          }
        ]).then(results => results[0] || { averageRating: 0, totalRatings: 0, sumRatings: 0 }),
        
        // Rating distribution
        Rating.aggregate([
          { $match: { courseId } },
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      // Create distribution object
      const distributionObj = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution.forEach(item => {
        distributionObj[item._id] = item.count;
      });

      const stats = {
        averageRating: parseFloat(ratingData.averageRating.toFixed(1)),
        totalRatings: ratingData.totalRatings,
        sumRatings: ratingData.sumRatings,
        distribution: distributionObj,
        percentages: this.calculateRatingPercentages(distributionObj, ratingData.totalRatings),
        timestamp: new Date().toISOString()
      };

      // Cache the result for 30 minutes
      await cacheService.set(cacheKey, stats, CACHE_TTL.LONG);
      
      return stats;
    } catch (error) {
      console.error('Get rating statistics error:', error);
      throw new BadRequestError('Failed to fetch rating statistics', 'RATING_STATS_ERROR');
    }
  }

  /**
   * Update course average rating
   * @param {string} courseId - Course ID
   */
  static async updateCourseAverageRating(courseId) {
    try {
      const stats = await this.getRatingStatistics(courseId);
      
      await Course.findByIdAndUpdate(courseId, {
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings
      });
    } catch (error) {
      console.error('Update course average rating error:', error);
    }
  }

  /**
   * Calculate rating percentages
   * @param {Object} distribution - Rating distribution
   * @param {number} total - Total number of ratings
   * @returns {Object} Rating percentages
   */
  static calculateRatingPercentages(distribution, total) {
    const percentages = {};
    
    for (const [rating, count] of Object.entries(distribution)) {
      percentages[rating] = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    }
    
    return percentages;
  }

  /**
   * Generate cache key for ratings
   * @param {string} courseId - Course ID
   * @param {Object} filters - Query filters
   * @returns {string} Cache key
   */
  static generateRatingsCacheKey(courseId, filters) {
    const keyParts = [
      CACHE_KEYS.RATINGS,
      'course',
      courseId,
      filters.page || '1',
      filters.limit || '10',
      filters.sort || 'createdAt'
    ];
    
    return keyParts.join(':');
  }

  /**
   * Invalidate rating-related caches
   * @param {string} courseId - Course ID
   */
  static async invalidateRatingCaches(courseId) {
    try {
      const patterns = [
        `${CACHE_KEYS.RATINGS}:*`,
        `${CACHE_KEYS.COURSE_DETAIL}:${courseId}:*`,
        `${CACHE_KEYS.COURSE_STATS}:*`,
        `${CACHE_KEYS.DASHBOARD_STATS}:*`,
        'search:results:*'
      ];

      // Delete all matching patterns
      for (const pattern of patterns) {
        await cacheService.deletePattern(pattern);
      }

      console.log(`Invalidated rating caches for course: ${courseId}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Get top rated courses with caching
   * @param {number} limit - Number of courses to return
   * @returns {Array} Top rated courses
   */
  static async getTopRatedCourses(limit = 10) {
    try {
      const cacheKey = `${CACHE_KEYS.RATINGS}:top:${limit}`;
      
      // Try to get from cache first
      const cachedCourses = await cacheService.get(cacheKey);
      if (cachedCourses) {
        return cachedCourses;
      }

      const topCourses = await Course.aggregate([
        { $match: { isPublished: true, totalRatings: { $gte: 1 } } },
        { $sort: { averageRating: -1, totalRatings: -1 } },
        { $limit: limit },
        {
          $project: {
            title: 1,
            instructor: 1,
            category: 1,
            level: 1,
            price: 1,
            averageRating: 1,
            totalRatings: 1,
            thumbnail: 1
          }
        }
      ]);

      // Cache the result for 1 hour
      await cacheService.set(cacheKey, topCourses, CACHE_TTL.LONG);
      
      return topCourses;
    } catch (error) {
      console.error('Get top rated courses error:', error);
      throw new BadRequestError('Failed to fetch top rated courses', 'TOP_RATED_COURSES_ERROR');
    }
  }

  /**
   * Warm up rating cache for popular courses
   */
  static async warmRatingCache() {
    try {
      // Get courses with most ratings
      const popularCourses = await Course.find({ totalRatings: { $gte: 1 } })
        .sort({ totalRatings: -1 })
        .limit(10)
        .select('_id');

      // Warm cache for each course
      for (const course of popularCourses) {
        await this.getRatingStatistics(course._id);
      }

      // Warm top rated courses cache
      await this.getTopRatedCourses(10);
      
      console.log('Rating cache warmed up successfully');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }
}

export default RatingService;
