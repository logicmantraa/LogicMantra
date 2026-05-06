import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Rating from '../models/Rating.js';
import { cacheService, CACHE_TTL } from '../config/cache.js';
import { CACHE_KEYS } from '../config/cache.js';
import NotFoundError from '../errors/NotFoundError.js';
import BadRequestError from '../errors/BadRequestError.js';

/**
 * Course Service with caching support
 * Handles course business logic with performance optimization
 */

class CourseService {
  /**
   * Get all courses with caching
   * @param {Object} filters - Query filters
   * @returns {Object} Courses data with pagination
   */
  static async getCourses(filters = {}) {
    try {
      // Generate cache key based on filters
      const cacheKey = this.generateCoursesCacheKey(filters);
      
      // Try to get from cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Build query
      const query = {};
      
      if (filters.category) {
        query.category = filters.category;
      }
      
      if (filters.level) {
        query.level = filters.level;
      }
      
      if (filters.instructor) {
        query.instructor = { $regex: filters.instructor, $options: 'i' };
      }
      
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
          { instructor: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      // Only show published courses for public access
      if (!filters.includeUnpublished) {
        query.isPublished = true;
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [courses, total] = await Promise.all([
        Course.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-__v'),
        Course.countDocuments(query)
      ]);

      const result = {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters
      };

      // Cache the result for 30 minutes
      await cacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
      
      return result;
    } catch (error) {
      console.error('Get courses error:', error);
      throw new BadRequestError('Failed to fetch courses', 'COURSES_FETCH_ERROR');
    }
  }

  /**
   * Get course by ID with caching
   * @param {string} courseId - Course ID
   * @param {Object} options - Additional options
   * @returns {Object} Course data
   */
  static async getCourseById(courseId, options = {}) {
    try {
      // Generate cache key
      const cacheKey = `${CACHE_KEYS.COURSE_DETAIL}:${courseId}:${options.includeStats ? 'with-stats' : 'basic'}`;
      
      // Try to get from cache first
      const cachedCourse = await cacheService.get(cacheKey);
      if (cachedCourse) {
        return cachedCourse;
      }

      // Build query
      const query = { _id: courseId };
      
      // Only show published courses for public access
      if (!options.includeUnpublished) {
        query.isPublished = true;
      }

      // Find course
      const course = await Course.findOne(query).select('-__v');
      
      if (!course) {
        throw NotFoundError.course(courseId);
      }

      let result = course.toObject();

      // Add additional stats if requested
      if (options.includeStats) {
        const [enrollmentCount, ratingStats] = await Promise.all([
          Enrollment.countDocuments({ courseId }),
          Rating.aggregate([
            { $match: { courseId } },
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
                ratingDistribution: {
                  $push: '$rating'
                }
              }
            }
          ]).then(results => results[0] || { averageRating: 0, totalRatings: 0, ratingDistribution: [] })
        ]);

        result.stats = {
          enrollmentCount,
          averageRating: parseFloat(ratingStats.averageRating.toFixed(1)),
          totalRatings: ratingStats.totalRatings,
          ratingDistribution: this.calculateRatingDistribution(ratingStats.ratingDistribution)
        };
      }

      // Cache the result for 30 minutes
      await cacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
      
      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Get course by ID error:', error);
      throw new BadRequestError('Failed to fetch course', 'COURSE_FETCH_ERROR');
    }
  }

  /**
   * Create course with cache invalidation
   * @param {Object} courseData - Course data
   * @returns {Object} Created course
   */
  static async createCourse(courseData) {
    try {
      const course = await Course.create(courseData);
      
      // Invalidate related caches
      await this.invalidateCourseCaches();
      
      return course;
    } catch (error) {
      console.error('Create course error:', error);
      throw new BadRequestError('Failed to create course', 'COURSE_CREATE_ERROR');
    }
  }

  /**
   * Update course with cache invalidation
   * @param {string} courseId - Course ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated course
   */
  static async updateCourse(courseId, updateData) {
    try {
      const course = await Course.findByIdAndUpdate(
        courseId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!course) {
        throw NotFoundError.course(courseId);
      }
      
      // Invalidate related caches
      await this.invalidateCourseCaches(courseId);
      
      return course;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Update course error:', error);
      throw new BadRequestError('Failed to update course', 'COURSE_UPDATE_ERROR');
    }
  }

  /**
   * Delete course with cache invalidation
   * @param {string} courseId - Course ID
   * @returns {Object} Deleted course
   */
  static async deleteCourse(courseId) {
    try {
      const course = await Course.findByIdAndDelete(courseId);
      
      if (!course) {
        throw NotFoundError.course(courseId);
      }
      
      // Invalidate related caches
      await this.invalidateCourseCaches(courseId);
      
      return course;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Delete course error:', error);
      throw new BadRequestError('Failed to delete course', 'COURSE_DELETE_ERROR');
    }
  }

  /**
   * Get course statistics with caching
   * @returns {Object} Course statistics
   */
  static async getCourseStats() {
    try {
      const cacheKey = `${CACHE_KEYS.COURSE_STATS}:general`;
      
      // Try to get from cache first
      const cachedStats = await cacheService.get(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const [
        totalCourses,
        publishedCourses,
        coursesByCategory,
        coursesByLevel,
        averagePrice,
        recentCourses
      ] = await Promise.all([
        Course.countDocuments(),
        Course.countDocuments({ isPublished: true }),
        
        // Courses by category
        Course.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        
        // Courses by level
        Course.aggregate([
          { $group: { _id: '$level', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        
        // Average price
        Course.aggregate([
          { $group: { _id: null, avgPrice: { $avg: '$price' } } }
        ]).then(result => result[0]?.avgPrice || 0),
        
        // Recent courses
        Course.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title instructor category level price createdAt')
      ]);

      const stats = {
        total: totalCourses,
        published: publishedCourses,
        byCategory: coursesByCategory,
        byLevel: coursesByLevel,
        averagePrice: parseFloat(averagePrice.toFixed(2)),
        recent: recentCourses,
        timestamp: new Date().toISOString()
      };

      // Cache for 1 hour
      await cacheService.set(cacheKey, stats, CACHE_TTL.LONG);
      
      return stats;
    } catch (error) {
      console.error('Get course stats error:', error);
      throw new BadRequestError('Failed to fetch course statistics', 'COURSE_STATS_ERROR');
    }
  }

  /**
   * Generate cache key for courses list
   * @param {Object} filters - Query filters
   * @returns {string} Cache key
   */
  static generateCoursesCacheKey(filters) {
    const keyParts = [
      CACHE_KEYS.COURSES_LIST,
      filters.category || 'all',
      filters.level || 'all',
      filters.search || 'none',
      filters.instructor || 'all',
      filters.page || '1',
      filters.limit || '10',
      filters.includeUnpublished ? 'unpublished' : 'published'
    ];
    
    return keyParts.join(':');
  }

  /**
   * Calculate rating distribution
   * @param {Array} ratings - Array of ratings
   * @returns {Object} Rating distribution
   */
  static calculateRatingDistribution(ratings) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    ratings.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });
    
    return distribution;
  }

  /**
   * Invalidate course-related caches
   * @param {string} courseId - Specific course ID (optional)
   */
  static async invalidateCourseCaches(courseId = null) {
    try {
      const patterns = [
        `${CACHE_KEYS.COURSES_LIST}:*`,
        `${CACHE_KEYS.COURSE_STATS}:*`,
        `${CACHE_KEYS.DASHBOARD_STATS}:*`,
        'search:results:*'
      ];

      // Add specific course pattern if courseId provided
      if (courseId) {
        patterns.push(`${CACHE_KEYS.COURSE_DETAIL}:${courseId}:*`);
      } else {
        patterns.push(`${CACHE_KEYS.COURSE_DETAIL}:*`);
      }

      // Delete all matching patterns
      for (const pattern of patterns) {
        await cacheService.deletePattern(pattern);
      }

      console.log(`Invalidated course caches for patterns:`, patterns);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Warm up cache for popular courses
   */
  static async warmCourseCache() {
    try {
      // Get popular courses
      const popularCourses = await Course.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id');

      // Warm cache for each course
      for (const course of popularCourses) {
        await this.getCourseById(course._id, { includeStats: true });
      }

      // Warm courses list cache
      await this.getCourses({ page: 1, limit: 10 });
      
      console.log('Course cache warmed up successfully');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }
}

export default CourseService;
