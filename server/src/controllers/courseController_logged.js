import Course from '../models/Course.js';
import logger from '../config/logger.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { BadRequestError } from '../errors/BadRequestError.js';

/**
 * Course Controller with comprehensive logging
 * Handles course operations with detailed logging
 */

class CourseController {
  /**
   * Get all courses with logging
   */
  static async getCourses(req, res, next) {
    try {
      logger.info('Courses fetch attempt', {
        requestId: req.requestId,
        query: req.query,
        userId: req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
      });

      // Build query
      const query = {};
      
      if (req.query.category) {
        query.category = req.query.category;
      }
      
      if (req.query.level) {
        query.level = req.query.level;
      }
      
      if (req.query.search) {
        query.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { instructor: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      // Only show published courses for public access
      if (!req.query.includeUnpublished) {
        query.isPublished = true;
      }

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
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
        filters: req.query
      };

      logger.info('Courses fetched successfully', {
        requestId: req.requestId,
        count: courses.length,
        total,
        page,
        userId: req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('courses_viewed', {
        requestId: req.requestId,
        count: courses.length,
        filters: req.query,
        userId: req.user?._id || 'anonymous'
      });

      res.json(result);
    } catch (error) {
      logger.error('Courses fetch failed', error, {
        requestId: req.requestId,
        query: req.query,
        userId: req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Get course by ID with logging
   */
  static async getCourseById(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('Course fetch attempt', {
        requestId: req.requestId,
        courseId: id,
        userId: req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
      });

      // Build query
      const query = { _id: id };
      
      // Only show published courses for public access
      if (!req.query.includeUnpublished) {
        query.isPublished = true;
      }

      const course = await Course.findOne(query).select('-__v');
      
      if (!course) {
        logger.warn('Course not found', {
          requestId: req.requestId,
          courseId: id,
          userId: req.user?._id || 'anonymous',
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError.course(id);
      }

      logger.info('Course fetched successfully', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        userId: req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('course_viewed', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        userId: req.user?._id || 'anonymous'
      });

      res.json(course);
    } catch (error) {
      logger.error('Course fetch failed', error, {
        requestId: req.requestId,
        courseId: req.params.id,
        userId: req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Create course with logging
   */
  static async createCourse(req, res, next) {
    try {
      logger.info('Course creation attempt', {
        requestId: req.requestId,
        userId: req.user._id,
        courseData: {
          title: req.body.title,
          category: req.body.category,
          level: req.body.level
        },
        timestamp: new Date().toISOString()
      });

      const course = await Course.create({
        ...req.body,
        instructor: req.user.name,
        createdBy: req.user._id
      });

      logger.info('Course created successfully', {
        requestId: req.requestId,
        courseId: course._id,
        title: course.title,
        instructor: course.instructor,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('course_created', {
        requestId: req.requestId,
        courseId: course._id,
        title: course.title,
        instructor: course.instructor,
        userId: req.user._id,
        category: course.category,
        level: course.level,
        price: course.price
      });

      res.status(201).json(course);
    } catch (error) {
      logger.error('Course creation failed', error, {
        requestId: req.requestId,
        userId: req.user._id,
        courseData: req.body,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Update course with logging
   */
  static async updateCourse(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('Course update attempt', {
        requestId: req.requestId,
        courseId: id,
        userId: req.user._id,
        updateData: req.body,
        timestamp: new Date().toISOString()
      });

      const course = await Course.findByIdAndUpdate(
        id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!course) {
        logger.warn('Course update attempt for non-existent course', {
          requestId: req.requestId,
          courseId: id,
          userId: req.user._id,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError.course(id);
      }

      logger.info('Course updated successfully', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        userId: req.user._id,
        updatedFields: Object.keys(req.body),
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('course_updated', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        userId: req.user._id,
        updatedFields: Object.keys(req.body)
      });

      res.json(course);
    } catch (error) {
      logger.error('Course update failed', error, {
        requestId: req.requestId,
        courseId: req.params.id,
        userId: req.user._id,
        updateData: req.body,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Delete course with logging
   */
  static async deleteCourse(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('Course deletion attempt', {
        requestId: req.requestId,
        courseId: id,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });

      const course = await Course.findByIdAndDelete(id);
      
      if (!course) {
        logger.warn('Course deletion attempt for non-existent course', {
          requestId: req.requestId,
          courseId: id,
          userId: req.user._id,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError.course(id);
      }

      logger.info('Course deleted successfully', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        instructor: course.instructor,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('course_deleted', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        instructor: course.instructor,
        userId: req.user._id
      });

      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      logger.error('Course deletion failed', error, {
        requestId: req.requestId,
        courseId: req.params.id,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Publish course with logging
   */
  static async publishCourse(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('Course publication attempt', {
        requestId: req.requestId,
        courseId: id,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });

      const course = await Course.findByIdAndUpdate(
        id,
        { 
          isPublished: true, 
          publishedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
      
      if (!course) {
        logger.warn('Course publication attempt for non-existent course', {
          requestId: req.requestId,
          courseId: id,
          userId: req.user._id,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError.course(id);
      }

      logger.info('Course published successfully', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('course_published', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        userId: req.user._id
      });

      res.json(course);
    } catch (error) {
      logger.error('Course publication failed', error, {
        requestId: req.requestId,
        courseId: req.params.id,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Unpublish course with logging
   */
  static async unpublishCourse(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('Course unpublication attempt', {
        requestId: req.requestId,
        courseId: id,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });

      const course = await Course.findByIdAndUpdate(
        id,
        { 
          isPublished: false,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
      
      if (!course) {
        logger.warn('Course unpublication attempt for non-existent course', {
          requestId: req.requestId,
          courseId: id,
          userId: req.user._id,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError.course(id);
      }

      logger.info('Course unpublished successfully', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('course_unpublished', {
        requestId: req.requestId,
        courseId: id,
        title: course.title,
        userId: req.user._id
      });

      res.json(course);
    } catch (error) {
      logger.error('Course unpublication failed', error, {
        requestId: req.requestId,
        courseId: req.params.id,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Get course statistics with logging
   */
  static async getCourseStats(req, res, next) {
    try {
      logger.info('Course statistics fetch attempt', {
        requestId: req.requestId,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });

      const [
        totalCourses,
        publishedCourses,
        coursesByCategory,
        coursesByLevel,
        averagePrice
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
        ]).then(result => result[0]?.avgPrice || 0)
      ]);

      const stats = {
        total: totalCourses,
        published: publishedCourses,
        byCategory: coursesByCategory,
        byLevel: coursesByLevel,
        averagePrice: parseFloat(averagePrice.toFixed(2)),
        timestamp: new Date().toISOString()
      };

      logger.info('Course statistics fetched successfully', {
        requestId: req.requestId,
        userId: req.user._id,
        totalCourses,
        publishedCourses,
        timestamp: new Date().toISOString()
      });

      res.json(stats);
    } catch (error) {
      logger.error('Course statistics fetch failed', error, {
        requestId: req.requestId,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }
}

export default CourseController;
