import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Rating from '../models/Rating.js';
import logger from '../config/logger.js';
import NotFoundError from '../errors/NotFoundError.js';
import BadRequestError from '../errors/BadRequestError.js';

/**
 * Optimized Enrollment Service
 * Uses aggregation pipelines and fixes N+1 queries
 */

class EnrollmentService {
  /**
   * Enroll user in course with optimized queries
   */
  static async enrollInCourse(enrollmentData) {
    try {
      logger.info('Course enrollment attempt', {
        userId: enrollmentData.userId,
        courseId: enrollmentData.courseId
      });

      // Use findOne with index for duplicate check
      const existingEnrollment = await Enrollment.findOne({
        userId: enrollmentData.userId,
        courseId: enrollmentData.courseId
      }).lean();

      if (existingEnrollment) {
        throw BadRequestError.duplicate('Enrollment', `${enrollmentData.userId}-${enrollmentData.courseId}`);
      }

      // Use aggregation to check course existence and get details in one query
      const courseAggregation = await Course.aggregate([
        { $match: { _id: enrollmentData.courseId } },
        {
          $project: {
            title: 1,
            isPublished: 1,
            enrollmentCount: 1
          }
        }
      ]);

      const course = courseAggregation[0];
      if (!course) {
        throw NotFoundError.course(enrollmentData.courseId);
      }

      if (!course.isPublished) {
        throw BadRequestError.invalidOperation('enroll in unpublished course', 'Course not available');
      }

      // Create enrollment
      const enrollment = await Enrollment.create(enrollmentData);
      
      // Update course enrollment count atomically
      await Course.findByIdAndUpdate(
        enrollmentData.courseId,
        { $inc: { enrollmentCount: 1 } }
      );

      logger.info('Course enrollment successful', {
        enrollmentId: enrollment._id,
        userId: enrollmentData.userId,
        courseId: enrollmentData.courseId
      });

      return enrollment;
    } catch (error) {
      logger.error('Course enrollment failed', error, {
        userId: enrollmentData.userId,
        courseId: enrollmentData.courseId
      });
      throw error;
    }
  }

  /**
   * Get user enrollments with optimized aggregation (fixes N+1)
   */
  static async getUserEnrollments(userId, filters = {}) {
    try {
      logger.debug('Fetching user enrollments', { userId, filters });

      // Build match stage
      const matchStage = { userId };
      if (filters.status) {
        matchStage.status = filters.status;
      }
      if (filters.courseId) {
        matchStage.courseId = filters.filters.courseId;
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Use aggregation pipeline to get enrollments with course details in one query
      const pipeline = [
        { $match: matchStage },
        
        // Lookup course details
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course',
            pipeline: [
              {
                $project: {
                  title: 1,
                  instructor: 1,
                  thumbnail: 1,
                  price: 1,
                  category: 1,
                  level: 1,
                  isPublished: 1
                }
              }
            ]
          }
        },
        
        // Unwind course array
        { $unwind: '$course' },
        
        // Sort by creation date
        { $sort: { createdAt: -1 } },
        
        // Facet for pagination and data
        {
          $facet: {
            enrollments: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  courseId: 1,
                  userId: 1,
                  status: 1,
                  progress: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  completedAt: 1,
                  course: 1
                }
              }
            ],
            totalCount: [
              { $count: 'total' }
            ]
          }
        }
      ];

      const [result] = await Enrollment.aggregate(pipeline);
      const total = result.totalCount[0]?.total || 0;
      const enrollments = result.enrollments;

      const response = {
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

      logger.debug('User enrollments fetched successfully', {
        userId,
        count: enrollments.length,
        total
      });

      return response;
    } catch (error) {
      logger.error('Failed to fetch user enrollments', error, { userId, filters });
      throw error;
    }
  }

  /**
   * Check enrollment status with optimized query
   */
  static async checkEnrollment(userId, courseId) {
    try {
      logger.debug('Checking enrollment status', { userId, courseId });

      // Use aggregation to get enrollment with course details in one query
      const pipeline = [
        {
          $match: {
            userId: userId,
            courseId: courseId
          }
        },
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course',
            pipeline: [
              {
                $project: {
                  title: 1,
                  instructor: 1,
                  thumbnail: 1,
                  price: 1
                }
              }
            ]
          }
        },
        { $unwind: '$course' },
        {
          $project: {
            _id: 1,
            status: 1,
            progress: 1,
            createdAt: 1,
            updatedAt: 1,
            completedAt: 1,
            course: 1
          }
        }
      ];

      const results = await Enrollment.aggregate(pipeline);
      const enrollment = results[0];

      const status = {
        isEnrolled: !!enrollment,
        enrollment: enrollment,
        timestamp: new Date().toISOString()
      };

      logger.debug('Enrollment status checked', {
        userId,
        courseId,
        isEnrolled: status.isEnrolled
      });

      return status;
    } catch (error) {
      logger.error('Failed to check enrollment status', error, { userId, courseId });
      throw error;
    }
  }

  /**
   * Update enrollment progress with optimized query
   */
  static async updateProgress(enrollmentId, progressData) {
    try {
      logger.info('Updating enrollment progress', { enrollmentId, progressData });

      // Use findOneAndUpdate with atomic operations
      const updateData = {
        ...progressData,
        updatedAt: new Date()
      };

      // Check if course should be marked as completed
      if (progressData.progress >= 100) {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      }

      const enrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        updateData,
        { new: true, runValidators: true }
      ).populate('courseId', 'title');

      if (!enrollment) {
        throw NotFoundError.enrollment(enrollmentId);
      }

      logger.info('Enrollment progress updated successfully', {
        enrollmentId,
        progress: enrollment.progress,
        status: enrollment.status
      });

      return enrollment;
    } catch (error) {
      logger.error('Failed to update enrollment progress', error, {
        enrollmentId,
        progressData
      });
      throw error;
    }
  }

  /**
   * Get enrollment statistics with optimized aggregation
   */
  static async getEnrollmentStats(userId = null) {
    try {
      logger.debug('Fetching enrollment statistics', { userId });

      // Build base match stage
      const baseMatch = userId ? { userId } : {};

      // Use aggregation pipeline for comprehensive statistics
      const pipeline = [
        { $match: baseMatch },
        
        // Multiple statistics in one aggregation
        {
          $facet: {
            totalCount: [
              { $count: 'total' }
            ],
            statusBreakdown: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            progressStats: [
              {
                $group: {
                  _id: null,
                  averageProgress: { $avg: '$progress' },
                  totalProgress: { $sum: '$progress' },
                  minProgress: { $min: '$progress' },
                  maxProgress: { $max: '$progress' }
                }
              }
            ],
            monthlyEnrollments: [
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.year': -1, '_id.month': -1 } },
              { $limit: 12 }
            ],
            completionStats: [
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
                  notStarted: {
                    $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] }
                  }
                }
              }
            ],
            recentEnrollments: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: 'courses',
                  localField: 'courseId',
                  foreignField: '_id',
                  as: 'course',
                  pipeline: [
                    { $project: { title: 1, instructor: 1 } }
                  ]
                }
              },
              { $unwind: '$course' },
              {
                $project: {
                  _id: 1,
                  status: 1,
                  progress: 1,
                  createdAt: 1,
                  course: 1
                }
              }
            ]
          }
        }
      ];

      const [result] = await Enrollment.aggregate(pipeline);
      
      // Extract and format results
      const totalCount = result.totalCount[0]?.total || 0;
      const progressStats = result.progressStats[0] || {};
      const completionStats = result.completionStats[0] || {};
      
      const stats = {
        total: totalCount,
        statusBreakdown: result.statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        progress: {
          average: parseFloat((progressStats.averageProgress || 0).toFixed(1)),
          total: progressStats.totalProgress || 0,
          min: progressStats.minProgress || 0,
          max: progressStats.maxProgress || 0
        },
        completion: {
          completed: completionStats.completed || 0,
          inProgress: completionStats.inProgress || 0,
          notStarted: completionStats.notStarted || 0,
          completionRate: totalCount > 0 ? 
            ((completionStats.completed / totalCount) * 100).toFixed(1) : 0
        },
        monthlyEnrollments: result.monthlyEnrollments,
        recent: result.recentEnrollments,
        timestamp: new Date().toISOString()
      };

      logger.debug('Enrollment statistics fetched successfully', {
        userId,
        total: stats.total,
        completionRate: stats.completion.completionRate
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch enrollment statistics', error, { userId });
      throw error;
    }
  }

  /**
   * Get course enrollment statistics with optimized aggregation
   */
  static async getCourseEnrollmentStats(courseId) {
    try {
      logger.debug('Fetching course enrollment statistics', { courseId });

      const pipeline = [
        { $match: { courseId } },
        
        {
          $facet: {
            totalEnrollments: [
              { $count: 'total' }
            ],
            statusBreakdown: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            progressDistribution: [
              {
                $bucket: {
                  groupBy: '$progress',
                  boundaries: [0, 25, 50, 75, 100],
                  default: 'other',
                  output: {
                    count: { $sum: 1 },
                    users: { $push: '$userId' }
                  }
                }
              }
            ],
            completionRate: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                  }
                }
              }
            ],
            recentEnrollments: [
              { $sort: { createdAt: -1 } },
              { $limit: 10 },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'user',
                  pipeline: [
                    { $project: { name: 1, email: 1 } }
                  ]
                }
              },
              { $unwind: '$user' },
              {
                $project: {
                  _id: 1,
                  status: 1,
                  progress: 1,
                  createdAt: 1,
                  user: 1
                }
              }
            ]
          }
        }
      ];

      const [result] = await Enrollment.aggregate(pipeline);
      
      const totalEnrollments = result.totalEnrollments[0]?.total || 0;
      const completionRate = result.completionRate[0] || {};
      
      const stats = {
        total: totalEnrollments,
        statusBreakdown: result.statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        progressDistribution: result.progressDistribution,
        completionRate: totalEnrollments > 0 ? 
          ((completionRate.completed / totalEnrollments) * 100).toFixed(1) : 0,
        recent: result.recentEnrollments,
        timestamp: new Date().toISOString()
      };

      logger.debug('Course enrollment statistics fetched successfully', {
        courseId,
        total: stats.total,
        completionRate: stats.completionRate
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch course enrollment statistics', error, { courseId });
      throw error;
    }
  }

  /**
   * Get popular courses by enrollments with optimized aggregation
   */
  static async getPopularCourses(limit = 10) {
    try {
      logger.debug('Fetching popular courses', { limit });

      const pipeline = [
        { $match: { isPublished: true } },
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'courseId',
            as: 'enrollments'
          }
        },
        {
          $addFields: {
            enrollmentCount: { $size: '$enrollments' }
          }
        },
        { $match: { enrollmentCount: { $gte: 1 } } },
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
      ];

      const popularCourses = await Course.aggregate(pipeline);

      logger.debug('Popular courses fetched successfully', {
        count: popularCourses.length,
        limit
      });

      return popularCourses;
    } catch (error) {
      logger.error('Failed to fetch popular courses', error, { limit });
      throw error;
    }
  }

  /**
   * Bulk update enrollment progress (for batch operations)
   */
  static async bulkUpdateProgress(updates) {
    try {
      logger.info('Bulk updating enrollment progress', { count: updates.length });

      const bulkOps = updates.map(update => ({
        updateOne: {
          filter: { _id: update.enrollmentId },
          update: {
            $set: {
              progress: update.progress,
              status: update.progress >= 100 ? 'completed' : 'in_progress',
              updatedAt: new Date(),
              ...(update.progress >= 100 && { completedAt: new Date() })
            }
          }
        }
      }));

      const result = await Enrollment.bulkWrite(bulkOps);

      logger.info('Bulk enrollment progress update completed', {
        matched: result.matchedCount,
        modified: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.error('Failed to bulk update enrollment progress', error, {
        count: updates.length
      });
      throw error;
    }
  }
}

export default EnrollmentService;
