import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Rating from '../models/Rating.js';
import logger from '../config/logger.js';
import NotFoundError from '../errors/NotFoundError.js';
import BadRequestError from '../errors/BadRequestError.js';

/**
 * Optimized Course Service
 * Uses aggregation pipelines and fixes N+1 queries
 */

class CourseService {
  /**
   * Get courses with optimized aggregation pipeline
   */
  static async getCourses(filters = {}) {
    try {
      logger.debug('Fetching courses with filters', { filters });

      // Build match stage
      const matchStage = {};
      
      if (filters.category) {
        matchStage.category = filters.category;
      }
      
      if (filters.level) {
        matchStage.level = filters.level;
      }
      
      if (filters.instructor) {
        matchStage.instructor = { $regex: filters.instructor, $options: 'i' };
      }
      
      if (filters.search) {
        matchStage.$text = { $search: filters.search };
      }
      
      // Only show published courses for public access
      if (!filters.includeUnpublished) {
        matchStage.isPublished = true;
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Use aggregation pipeline with faceting for efficient data retrieval
      const pipeline = [
        { $match: matchStage },
        
        // Add search score if text search is used
        ...(filters.search ? [
          { $addFields: { score: { $meta: 'textScore' } } },
          { $sort: { score: { $meta: 'textScore' }, createdAt: -1 } }
        ] : [
          { $sort: { createdAt: -1 } }
        ]),
        
        // Facet for pagination and statistics
        {
          $facet: {
            courses: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  title: 1,
                  instructor: 1,
                  category: 1,
                  level: 1,
                  price: 1,
                  thumbnail: 1,
                  isPublished: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  enrollmentCount: 1,
                  averageRating: 1,
                  totalRatings: 1,
                  ...(filters.search && { score: 1 })
                }
              }
            ],
            totalCount: [
              { $count: 'total' }
            ],
            categories: [
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            levels: [
              { $group: { _id: '$level', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ]
          }
        }
      ];

      const [result] = await Course.aggregate(pipeline);
      const total = result.totalCount[0]?.total || 0;
      const courses = result.courses;

      const response = {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters,
        aggregations: {
          categories: result.categories,
          levels: result.levels
        }
      };

      logger.debug('Courses fetched successfully', {
        count: courses.length,
        total,
        page,
        filters
      });

      return response;
    } catch (error) {
      logger.error('Failed to fetch courses', error, { filters });
      throw new BadRequestError('Failed to fetch courses', 'COURSES_FETCH_ERROR');
    }
  }

  /**
   * Get course by ID with optimized aggregation for stats
   */
  static async getCourseById(courseId, options = {}) {
    try {
      logger.debug('Fetching course by ID', { courseId, options });

      // Build match stage
      const matchStage = { _id: courseId };
      
      if (!options.includeUnpublished) {
        matchStage.isPublished = true;
      }

      // Use aggregation to get course with stats in one query
      const pipeline = [
        { $match: matchStage },
        
        // Lookup enrollment statistics
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'courseId',
            as: 'enrollments',
            pipeline: [
              {
                $group: {
                  _id: null,
                  totalEnrollments: { $sum: 1 },
                  completedEnrollments: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                  },
                  averageProgress: { $avg: '$progress' }
                }
              }
            ]
          }
        },
        
        // Lookup rating statistics
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'courseId',
            as: 'ratings',
            pipeline: [
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
            ]
          }
        },
        
        // Unwind and coalesce lookup results
        { $unwind: '$enrollments' },
        { $unwind: '$ratings' },
        
        // Project final result
        {
          $project: {
            title: 1,
            description: 1,
            instructor: 1,
            category: 1,
            level: 1,
            price: 1,
            thumbnail: 1,
            isPublished: 1,
            createdAt: 1,
            updatedAt: 1,
            enrollmentCount: 1,
            stats: {
              enrollmentCount: { $ifNull: ['$enrollments.totalEnrollments', 0] },
              completedCount: { $ifNull: ['$enrollments.completedEnrollments', 0] },
              averageProgress: { $ifNull: ['$enrollments.averageProgress', 0] },
              averageRating: { $ifNull: ['$ratings.averageRating', 0] },
              totalRatings: { $ifNull: ['$ratings.totalRatings', 0] },
              ratingDistribution: { $ifNull: ['$ratings.ratingDistribution', []] }
            }
          }
        }
      ];

      const results = await Course.aggregate(pipeline);
      
      if (results.length === 0) {
        throw NotFoundError.course(courseId);
      }

      const course = results[0];
      
      // Calculate rating distribution
      if (course.stats.ratingDistribution.length > 0) {
        course.stats.ratingDistribution = this.calculateRatingDistribution(
          course.stats.ratingDistribution
        );
      }

      logger.debug('Course fetched successfully', {
        courseId,
        title: course.title,
        hasStats: !!options.includeStats
      });

      return course;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to fetch course by ID', error, { courseId, options });
      throw new BadRequestError('Failed to fetch course', 'COURSE_FETCH_ERROR');
    }
  }

  /**
   * Create course with optimized operations
   */
  static async createCourse(courseData) {
    try {
      logger.info('Creating course', {
        title: courseData.title,
        instructor: courseData.instructor
      });

      const course = await Course.create(courseData);
      
      logger.info('Course created successfully', {
        courseId: course._id,
        title: course.title
      });

      return course;
    } catch (error) {
      logger.error('Failed to create course', error, { courseData });
      throw new BadRequestError('Failed to create course', 'COURSE_CREATE_ERROR');
    }
  }

  /**
   * Update course with optimized operations
   */
  static async updateCourse(courseId, updateData) {
    try {
      logger.info('Updating course', { courseId, updateData });

      const course = await Course.findByIdAndUpdate(
        courseId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!course) {
        throw NotFoundError.course(courseId);
      }
      
      logger.info('Course updated successfully', {
        courseId,
        title: course.title
      });

      return course;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to update course', error, { courseId, updateData });
      throw new BadRequestError('Failed to update course', 'COURSE_UPDATE_ERROR');
    }
  }

  /**
   * Delete course with optimized operations
   */
  static async deleteCourse(courseId) {
    try {
      logger.info('Deleting course', { courseId });

      const course = await Course.findByIdAndDelete(courseId);
      
      if (!course) {
        throw NotFoundError.course(courseId);
      }
      
      logger.info('Course deleted successfully', {
        courseId,
        title: course.title
      });

      return course;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to delete course', error, { courseId });
      throw new BadRequestError('Failed to delete course', 'COURSE_DELETE_ERROR');
    }
  }

  /**
   * Get course statistics with optimized aggregation
   */
  static async getCourseStats() {
    try {
      logger.debug('Fetching course statistics');

      // Use comprehensive aggregation pipeline
      const pipeline = [
        {
          $facet: {
            totalCourses: [
              { $count: 'total' }
            ],
            publishedCourses: [
              { $match: { isPublished: true } },
              { $count: 'published' }
            ],
            coursesByCategory: [
              {
                $group: {
                  _id: '$category',
                  count: { $sum: 1 },
                  averagePrice: { $avg: '$price' },
                  totalEnrollments: { $sum: '$enrollmentCount' }
                }
              },
              { $sort: { count: -1 } }
            ],
            coursesByLevel: [
              {
                $group: {
                  _id: '$level',
                  count: { $sum: 1 },
                  averagePrice: { $avg: '$price' }
                }
              },
              { $sort: { count: -1 } }
            ],
            priceStats: [
              {
                $group: {
                  _id: null,
                  averagePrice: { $avg: '$price' },
                  minPrice: { $min: '$price' },
                  maxPrice: { $max: '$price' },
                  totalRevenue: { $sum: { $multiply: ['$price', '$enrollmentCount'] } }
                }
              }
            ],
            enrollmentStats: [
              {
                $group: {
                  _id: null,
                  totalEnrollments: { $sum: '$enrollmentCount' },
                  averageEnrollments: { $avg: '$enrollmentCount' },
                  maxEnrollments: { $max: '$enrollmentCount' }
                }
              }
            ],
            ratingStats: [
              {
                $group: {
                  _id: null,
                  averageRating: { $avg: '$averageRating' },
                  totalRatings: { $sum: '$totalRatings' },
                  maxRating: { $max: '$averageRating' }
                }
              }
            ],
            recentCourses: [
              { $match: { isPublished: true } },
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  title: 1,
                  instructor: 1,
                  category: 1,
                  level: 1,
                  price: 1,
                  createdAt: 1
                }
              }
            ],
            topRatedCourses: [
              { $match: { isPublished: true, totalRatings: { $gte: 1 } } },
              { $sort: { averageRating: -1, totalRatings: -1 } },
              { $limit: 5 },
              {
                $project: {
                  title: 1,
                  instructor: 1,
                  averageRating: 1,
                  totalRatings: 1,
                  thumbnail: 1
                }
              }
            ],
            popularCourses: [
              { $match: { isPublished: true } },
              { $sort: { enrollmentCount: -1 } },
              { $limit: 5 },
              {
                $project: {
                  title: 1,
                  instructor: 1,
                  enrollmentCount: 1,
                  thumbnail: 1
                }
              }
            ]
          }
        }
      ];

      const [result] = await Course.aggregate(pipeline);
      
      // Extract and format results
      const totalCourses = result.totalCourses[0]?.total || 0;
      const publishedCourses = result.publishedCourses[0]?.published || 0;
      const priceStats = result.priceStats[0] || {};
      const enrollmentStats = result.enrollmentStats[0] || {};
      const ratingStats = result.ratingStats[0] || {};

      const stats = {
        total: totalCourses,
        published: publishedCourses,
        publishRate: totalCourses > 0 ? ((publishedCourses / totalCourses) * 100).toFixed(1) : 0,
        byCategory: result.coursesByCategory,
        byLevel: result.coursesByLevel,
        pricing: {
          average: parseFloat((priceStats.averagePrice || 0).toFixed(2)),
          min: priceStats.minPrice || 0,
          max: priceStats.maxPrice || 0,
          totalRevenue: priceStats.totalRevenue || 0
        },
        enrollments: {
          total: enrollmentStats.totalEnrollments || 0,
          average: parseFloat((enrollmentStats.averageEnrollments || 0).toFixed(1)),
          max: enrollmentStats.maxEnrollments || 0
        },
        ratings: {
          average: parseFloat((ratingStats.averageRating || 0).toFixed(1)),
          total: ratingStats.totalRatings || 0,
          max: ratingStats.maxRating || 0
        },
        recent: result.recentCourses,
        topRated: result.topRatedCourses,
        popular: result.popularCourses,
        timestamp: new Date().toISOString()
      };

      logger.debug('Course statistics fetched successfully', {
        total: stats.total,
        published: stats.published
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch course statistics', error);
      throw new BadRequestError('Failed to fetch course statistics', 'COURSE_STATS_ERROR');
    }
  }

  /**
   * Search courses with optimized text search
   */
  static async searchCourses(searchQuery, filters = {}) {
    try {
      logger.debug('Searching courses', { searchQuery, filters });

      // Build match stage with text search
      const matchStage = {
        $text: { $search: searchQuery },
        isPublished: true
      };

      if (filters.category) {
        matchStage.category = filters.category;
      }
      
      if (filters.level) {
        matchStage.level = filters.level;
      }

      const pipeline = [
        { $match: matchStage },
        { $addFields: { score: { $meta: 'textScore' } } },
        { $sort: { score: { $meta: 'textScore' }, createdAt: -1 } },
        
        // Pagination
        { $skip: ((filters.page || 1) - 1) * (filters.limit || 10) },
        { $limit: filters.limit || 10 },
        
        {
          $project: {
            title: 1,
            instructor: 1,
            category: 1,
            level: 1,
            price: 1,
            thumbnail: 1,
            description: { $substr: ['$description', 0, 200] }, // Truncate description
            score: 1,
            enrollmentCount: 1,
            averageRating: 1
          }
        }
      ];

      const courses = await Course.aggregate(pipeline);

      logger.debug('Course search completed', {
        query: searchQuery,
        count: courses.length
      });

      return courses;
    } catch (error) {
      logger.error('Failed to search courses', error, { searchQuery, filters });
      throw new BadRequestError('Failed to search courses', 'COURSE_SEARCH_ERROR');
    }
  }

  /**
   * Get instructor courses with optimized aggregation
   */
  static async getInstructorCourses(instructorId, filters = {}) {
    try {
      logger.debug('Fetching instructor courses', { instructorId, filters });

      const matchStage = {
        instructor: instructorId,
        isPublished: true
      };

      const pipeline = [
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        
        // Pagination
        { $skip: ((filters.page || 1) - 1) * (filters.limit || 10) },
        { $limit: filters.limit || 10 },
        
        // Lookup enrollment statistics
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'courseId',
            as: 'enrollments',
            pipeline: [
              {
                $group: {
                  _id: null,
                  totalEnrollments: { $sum: 1 },
                  completedEnrollments: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                  }
                }
              }
            ]
          }
        },
        
        { $unwind: { path: '$enrollments', preserveNullAndEmptyArrays: true } },
        
        {
          $project: {
            title: 1,
            description: 1,
            category: 1,
            level: 1,
            price: 1,
            thumbnail: 1,
            createdAt: 1,
            enrollmentCount: 1,
            totalEnrollments: { $ifNull: ['$enrollments.totalEnrollments', 0] },
            completedEnrollments: { $ifNull: ['$enrollments.completedEnrollments', 0] }
          }
        }
      ];

      const courses = await Course.aggregate(pipeline);

      logger.debug('Instructor courses fetched successfully', {
        instructorId,
        count: courses.length
      });

      return courses;
    } catch (error) {
      logger.error('Failed to fetch instructor courses', error, { instructorId, filters });
      throw new BadRequestError('Failed to fetch instructor courses', 'INSTRUCTOR_COURSES_ERROR');
    }
  }

  /**
   * Calculate rating distribution
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
}

export default CourseService;
