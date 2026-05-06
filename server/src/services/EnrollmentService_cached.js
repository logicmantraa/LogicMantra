import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { cacheService, CACHE_TTL } from '../config/cache.js';
import { CACHE_KEYS } from '../config/cache.js';
import NotFoundError from '../errors/NotFoundError.js';
import BadRequestError from '../errors/BadRequestError.js';

/**
 * Enrollment Service with caching support
 * Handles enrollment business logic with performance optimization
 */

class EnrollmentService {
  /**
   * Enroll user in course with cache invalidation
   * @param {Object} enrollmentData - Enrollment data
   * @returns {Object} Created enrollment
   */
  static async enrollInCourse(enrollmentData) {
    try {
      // Check if user is already enrolled
      const existingEnrollment = await Enrollment.findOne({
        userId: enrollmentData.userId,
        courseId: enrollmentData.courseId
      });

      if (existingEnrollment) {
        throw BadRequestError.duplicate('Enrollment', `${enrollmentData.userId}-${enrollmentData.courseId}`);
      }

      // Check if course exists and is published
      const course = await Course.findById(enrollmentData.courseId);
      if (!course) {
        throw NotFoundError.course(enrollmentData.courseId);
      }

      if (!course.isPublished) {
        throw BadRequestError.invalidOperation('enroll in unpublished course', 'Course not available');
      }

      // Create enrollment
      const enrollment = await Enrollment.create(enrollmentData);
      
      // Update course enrollment count
      await Course.findByIdAndUpdate(enrollmentData.courseId, {
        $inc: { enrollmentCount: 1 }
      });
      
      // Invalidate related caches
      await this.invalidateEnrollmentCaches(enrollmentData.userId, enrollmentData.courseId);
      
      return enrollment;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error('Enroll in course error:', error);
      throw new BadRequestError('Failed to enroll in course', 'ENROLLMENT_CREATE_ERROR');
    }
  }

  /**
   * Update enrollment progress with cache invalidation
   * @param {string} enrollmentId - Enrollment ID
   * @param {Object} progressData - Progress data
   * @returns {Object} Updated enrollment
   */
  static async updateProgress(enrollmentId, progressData) {
    try {
      const enrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        { ...progressData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('courseId', 'title');
      
      if (!enrollment) {
        throw NotFoundError.enrollment(enrollmentId);
      }
      
      // Check if course is completed
      if (progressData.progress >= 100) {
        await Enrollment.findByIdAndUpdate(enrollmentId, {
          status: 'completed',
          completedAt: new Date()
        });
      }
      
      // Invalidate related caches
      await this.invalidateEnrollmentCaches(enrollment.userId, enrollment.courseId._id);
      
      return enrollment;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Update progress error:', error);
      throw new BadRequestError('Failed to update progress', 'PROGRESS_UPDATE_ERROR');
    }
  }

  /**
   * Get user enrollments with caching
   * @param {string} userId - User ID
   * @param {Object} filters - Query filters
   * @returns {Object} Enrollments data with pagination
   */
  static async getUserEnrollments(userId, filters = {}) {
    try {
      // Generate cache key
      const cacheKey = this.generateEnrollmentsCacheKey(userId, filters);
      
      // Try to get from cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Build query
      const query = { userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.courseId) {
        query.courseId = filters.courseId;
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [enrollments, total] = await Promise.all([
        Enrollment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('courseId', 'title instructor thumbnail price')
          .select('-__v'),
        Enrollment.countDocuments(query)
      ]);

      const result = {
        enrollments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: { userId, ...filters }
      };

      // Cache the result for 15 minutes
      await cacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
      
      return result;
    } catch (error) {
      console.error('Get user enrollments error:', error);
      throw new BadRequestError('Failed to fetch user enrollments', 'ENROLLMENTS_FETCH_ERROR');
    }
  }

  /**
   * Check if user is enrolled in course with caching
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Object} Enrollment status
   */
  static async checkEnrollment(userId, courseId) {
    try {
      // Generate cache key
      const cacheKey = `${CACHE_KEYS.ENROLLMENTS}:check:${userId}:${courseId}`;
      
      // Try to get from cache first
      const cachedStatus = await cacheService.get(cacheKey);
      if (cachedStatus) {
        return cachedStatus;
      }

      const enrollment = await Enrollment.findOne({ userId, courseId })
        .populate('courseId', 'title instructor thumbnail')
        .select('-__v');

      const status = {
        isEnrolled: !!enrollment,
        enrollment: enrollment,
        timestamp: new Date().toISOString()
      };

      // Cache the result for 30 minutes
      await cacheService.set(cacheKey, status, CACHE_TTL.LONG);
      
      return status;
    } catch (error) {
      console.error('Check enrollment error:', error);
      throw new BadRequestError('Failed to check enrollment status', 'ENROLLMENT_CHECK_ERROR');
    }
  }

  /**
   * Get enrollment statistics with caching
   * @param {string} userId - User ID (optional)
   * @returns {Object} Enrollment statistics
   */
  static async getEnrollmentStats(userId = null) {
    try {
      // Generate cache key
      const cacheKey = `${CACHE_KEYS.ENROLLMENTS}:stats:${userId || 'global'}:${new Date().getHours()}`;
      
      // Try to get from cache first
      const cachedStats = await cacheService.get(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const baseQuery = userId ? { userId } : {};
      
      const [
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        enrollmentsByMonth,
        recentEnrollments,
        completionStats
      ] = await Promise.all([
        // Total enrollments
        Enrollment.countDocuments(baseQuery),
        
        // Completed enrollments
        Enrollment.countDocuments({ ...baseQuery, status: 'completed' }),
        
        // In progress enrollments
        Enrollment.countDocuments({ ...baseQuery, status: 'in_progress' }),
        
        // Enrollments by month (last 6 months)
        Enrollment.aggregate([
          { $match: { 
            ...baseQuery,
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }},
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        
        // Recent enrollments
        Enrollment.find(baseQuery)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('courseId', 'title instructor')
          .populate('userId', 'name email'),
        
        // Completion statistics
        Enrollment.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              inProgress: {
                $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
              },
              averageProgress: { $avg: '$progress' }
            }
          }
        ]).then(result => result[0] || { total: 0, completed: 0, inProgress: 0, averageProgress: 0 })
      ]);

      const stats = {
        total: totalEnrollments,
        completed: completedEnrollments,
        inProgress: inProgressEnrollments,
        byMonth: enrollmentsByMonth,
        recent: recentEnrollments,
        completion: {
          ...completionStats,
          completionRate: completionStats.total > 0 ? 
            ((completionStats.completed / completionStats.total) * 100).toFixed(1) : 0,
          averageProgress: parseFloat(completionStats.averageProgress.toFixed(1))
        },
        timestamp: new Date().toISOString()
      };

      // Cache the result for 1 hour
      await cacheService.set(cacheKey, stats, CACHE_TTL.LONG);
      
      return stats;
    } catch (error) {
      console.error('Get enrollment stats error:', error);
      throw new BadRequestError('Failed to fetch enrollment statistics', 'ENROLLMENT_STATS_ERROR');
    }
  }

  /**
   * Generate cache key for enrollments
   * @param {string} userId - User ID
   * @param {Object} filters - Query filters
   * @returns {string} Cache key
   */
  static generateEnrollmentsCacheKey(userId, filters) {
    const keyParts = [
      CACHE_KEYS.ENROLLMENTS,
      'user',
      userId,
      filters.status || 'all',
      filters.courseId || 'all',
      filters.page || '1',
      filters.limit || '10'
    ];
    
    return keyParts.join(':');
  }

  /**
   * Invalidate enrollment-related caches
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   */
  static async invalidateEnrollmentCaches(userId, courseId) {
    try {
      const patterns = [
        `${CACHE_KEYS.ENROLLMENTS}:*`,
        `${CACHE_KEYS.COURSE_DETAIL}:${courseId}:*`,
        `${CACHE_KEYS.COURSE_STATS}:*`,
        `${CACHE_KEYS.DASHBOARD_STATS}:*`,
        `${CACHE_KEYS.USER_PROFILE}:${userId}:*`,
        'search:results:*'
      ];

      // Delete all matching patterns
      for (const pattern of patterns) {
        await cacheService.deletePattern(pattern);
      }

      console.log(`Invalidated enrollment caches for user: ${userId}, course: ${courseId}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Get popular courses by enrollments with caching
   * @param {number} limit - Number of courses to return
   * @returns {Array} Popular courses
   */
  static async getPopularCourses(limit = 10) {
    try {
      const cacheKey = `${CACHE_KEYS.ENROLLMENTS}:popular:${limit}`;
      
      // Try to get from cache first
      const cachedCourses = await cacheService.get(cacheKey);
      if (cachedCourses) {
        return cachedCourses;
      }

      const popularCourses = await Course.aggregate([
        { $match: { isPublished: true, enrollmentCount: { $gte: 1 } } },
        { $sort: { enrollmentCount: -1, averageRating: -1 } },
        { $limit: limit },
        {
          $project: {
            title: 1,
            instructor: 1,
            category: 1,
            level: 1,
            price: 1,
            enrollmentCount: 1,
            averageRating: 1,
            thumbnail: 1
          }
        }
      ]);

      // Cache the result for 1 hour
      await cacheService.set(cacheKey, popularCourses, CACHE_TTL.LONG);
      
      return popularCourses;
    } catch (error) {
      console.error('Get popular courses error:', error);
      throw new BadRequestError('Failed to fetch popular courses', 'POPULAR_COURSES_ERROR');
    }
  }

  /**
   * Warm up enrollment cache for active users
   */
  static async warmEnrollmentCache() {
    try {
      // Get recent enrollments to identify active users
      const recentEnrollments = await Enrollment.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select('userId courseId');

      // Warm cache for each user's enrollments
      const userIds = [...new Set(recentEnrollments.map(e => e.userId.toString()))];
      
      for (const userId of userIds) {
        await this.getUserEnrollments(userId, { page: 1, limit: 10 });
      }

      // Warm popular courses cache
      await this.getPopularCourses(10);
      
      console.log('Enrollment cache warmed up successfully');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }
}

export default EnrollmentService;
