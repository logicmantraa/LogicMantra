import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Resource from '../models/Resource.js';
import ProductService from './ProductService.js';
import { AppError, NotFoundError } from '../errors/customErrors.js';
import logger from '../utils/logger.js';

/**
 * CourseService - Handles all course-related business logic
 * Separated from controller to maintain clean architecture
 */

class CourseService {
  /**
   * Build course-specific search query from filters
   * @param {Object} filters - Search and filter parameters
   * @returns {Object} Filter object for ProductService
   */
  static buildCourseFilters(filters) {
    const { level, instructor, ...productFilters } = filters;
    
    // Add course-specific filters to typeData
    if (level) {
      productFilters.typeData = {
        ...productFilters.typeData,
        level
      };
    }
    
    if (instructor) {
      productFilters.typeData = {
        ...productFilters.typeData,
        instructor
      };
    }
    
    // Force product type to course
    productFilters.productType = 'course';
    
    return productFilters;
  }

  /**
   * Get courses with search and filters (Product-aware)
   * @param {Object} filters - Search and filter parameters
   * @param {Object} pagination - Pagination parameters
   * @returns {Object} Courses and pagination info
   */
  static async getCourses(filters = {}, pagination = {}) {
    try {
      const courseFilters = this.buildCourseFilters(filters);
      const result = await ProductService.getProducts(courseFilters, pagination);
      
      // Transform products to course format for backward compatibility
      const courses = result.products.map(product => ({
        ...product,
        // Map typeData fields to top-level for course consumers
        level: product.typeData?.level,
        instructor: product.typeData?.instructor,
        duration: product.typeData?.duration
      }));
      
      return {
        courses,
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('Error in CourseService.getCourses:', error);
      throw new AppError('Failed to fetch courses', 500);
    }
  }

  /**
   * Get single course with lectures and resources (Product-aware)
   * @param {string} courseId - Course ID
   * @param {string} userId - Optional user ID for access info
   * @returns {Object} Course with lectures and resources
   */
  static async getCourseById(courseId, userId = null) {
    try {
      // Try to get from Product model first (new system)
      let course;
      try {
        const product = await ProductService.getProductById(courseId, userId);
        if (product.productType === 'course') {
          course = {
            ...product,
            // Map typeData fields to top-level for course consumers
            level: product.typeData?.level,
            instructor: product.typeData?.instructor,
            duration: product.typeData?.duration
          };
        }
      } catch (error) {
        // Fallback to legacy Course model if Product not found
        if (error instanceof NotFoundError) {
          course = await Course.findById(courseId);
          if (!course) {
            throw new NotFoundError('Course not found');
          }
        } else {
          throw error;
        }
      }
      
      // Get lectures and resources (these are still separate models)
      const lectures = await Lecture.find({ courseId }).sort({ order: 1 });
      const resources = await Resource.find({ courseId });
      
      return {
        course,
        lectures,
        resources
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in CourseService.getCourseById:', error);
      throw new AppError('Failed to fetch course', 500);
    }
  }

  /**
   * Create new course (Product-aware)
   * @param {Object} courseData - Course data
   * @param {string} userId - Creator user ID
   * @returns {Object} Created course
   */
  static async createCourse(courseData, userId) {
    try {
      // Prepare product data for course
      const productData = {
        title: courseData.title,
        description: courseData.description,
        price: courseData.price || 0,
        isFree: courseData.isFree !== false,
        category: courseData.category,
        thumbnail: courseData.thumbnail || '',
        productType: 'course',
        typeData: {
          level: courseData.level,
          instructor: courseData.instructor,
          duration: courseData.duration
        },
        status: courseData.status || 'draft'
      };
      
      // Create as Product
      const product = await ProductService.createProduct(productData, userId);
      
      // Map back to course format
      const course = {
        ...product,
        level: product.typeData.level,
        instructor: product.typeData.instructor,
        duration: product.typeData.duration
      };
      
      logger.info(`Course created via ProductService: ${product._id}`);
      return course;
    } catch (error) {
      logger.error('Error in CourseService.createCourse:', error);
      throw new AppError('Failed to create course', 500);
    }
  }

  /**
   * Update existing course
   * @param {string} courseId - Course ID
   * @param {Object} updateData - Course update data
   * @returns {Object} Updated course
   */
  static async updateCourse(courseId, updateData) {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    Object.assign(course, updateData);
    const updatedCourse = await course.save();
    
    return updatedCourse;
  }

  /**
   * Delete course and related data
   * @param {string} courseId - Course ID
   * @returns {Object} Deletion result
   */
  static async deleteCourse(courseId) {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Delete associated lectures and resources
    await Lecture.deleteMany({ courseId: course._id });
    await Resource.deleteMany({ courseId: course._id });
    
    await course.deleteOne();
    
    return { message: 'Course removed' };
  }

  /**
   * Check if course exists (Product-aware)
   * @param {string} courseId - Course ID
   * @returns {boolean} Course exists status
   */
  static async courseExists(courseId) {
    try {
      // Check Product model first
      const product = await ProductService.productExists(courseId);
      if (product) {
        // Verify it's a course
        const productDetail = await ProductService.getProductById(courseId);
        return productDetail.productType === 'course';
      }
      
      // Fallback to legacy Course model
      const course = await Course.findById(courseId);
      return !!course;
    } catch (error) {
      logger.error('Error in CourseService.courseExists:', error);
      return false;
    }
  }

  /**
   * Update course enrollment count (Legacy support)
   * @param {string} courseId - Course ID
   * @param {number} increment - Number to increment by (default: 1)
   * @returns {Object} Updated course
   */
  static async updateEnrollmentCount(courseId, increment = 1) {
    // This method is deprecated - enrollment count is now handled via AccessService stats
    logger.warn(`updateEnrollmentCount called for course ${courseId} - this is deprecated`);
    
    try {
      // For legacy Course model
      const course = await Course.findById(courseId);
      if (course) {
        course.enrolledCount += increment;
        await course.save();
        return course;
      }
      
      // For Product model - no direct equivalent, use AccessService.getAccessStats
      return null;
    } catch (error) {
      logger.error('Error in CourseService.updateEnrollmentCount:', error);
      throw new AppError('Failed to update enrollment count', 500);
    }
  }

  /**
   * Update course rating statistics (Product-aware)
   * @param {string} courseId - Course ID
   * @param {number} newRating - New rating value
   * @param {number} totalRatings - Total number of ratings
   * @returns {Object} Updated course
   */
  static async updateCourseRating(courseId, newRating, totalRatings) {
    try {
      // Try Product model first
      const product = await ProductService.getProductById(courseId);
      if (product.productType === 'course') {
        const updateData = {
          rating: newRating,
          totalRatings: totalRatings
        };
        return await ProductService.updateProduct(courseId, updateData, product.createdBy);
      }
      
      // Fallback to legacy Course model
      const course = await Course.findById(courseId);
      if (!course) {
        throw new NotFoundError('Course not found');
      }
      
      course.rating = newRating;
      course.totalRatings = totalRatings;
      await course.save();
      
      return course;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in CourseService.updateCourseRating:', error);
      throw new AppError('Failed to update course rating', 500);
    }
  }

  /**
   * Get popular courses (Product-aware)
   * @param {number} limit - Number of courses to return
   * @returns {Array} List of popular courses
   */
  static async getPopularCourses(limit = 5) {
    try {
      // Get popular products filtered by course type
      const products = await ProductService.getPopularProducts(limit, { productType: 'course' });
      
      // Transform to course format
      return products.map(product => ({
        ...product,
        level: product.typeData?.level,
        instructor: product.typeData?.instructor,
        duration: product.typeData?.duration
      }));
    } catch (error) {
      logger.error('Error in CourseService.getPopularCourses:', error);
      throw new AppError('Failed to fetch popular courses', 500);
    }
  }

  /**
   * Get top rated courses (Product-aware)
   * @param {number} limit - Number of courses to return
   * @returns {Array} List of top rated courses
   */
  static async getTopRatedCourses(limit = 5) {
    try {
      // Get top rated products filtered by course type
      const products = await ProductService.getPopularProducts(limit, { productType: 'course' });
      
      // Transform to course format
      return products.map(product => ({
        ...product,
        level: product.typeData?.level,
        instructor: product.typeData?.instructor,
        duration: product.typeData?.duration
      }));
    } catch (error) {
      logger.error('Error in CourseService.getTopRatedCourses:', error);
      throw new AppError('Failed to fetch top rated courses', 500);
    }
  }

  /**
   * Validate course data
   * @param {Object} courseData - Course data to validate
   * @returns {Object} Validation result
   */
  static validateCourseData(courseData) {
    const errors = [];
    
    if (!courseData.title || courseData.title.trim().length === 0) {
      errors.push('Course title is required');
    }
    
    if (!courseData.description || courseData.description.trim().length === 0) {
      errors.push('Course description is required');
    }
    
    if (!courseData.instructor || courseData.instructor.trim().length === 0) {
      errors.push('Course instructor is required');
    }
    
    if (!courseData.category || courseData.category.trim().length === 0) {
      errors.push('Course category is required');
    }
    
    if (courseData.price !== undefined && (isNaN(courseData.price) || courseData.price < 0)) {
      errors.push('Course price must be a positive number');
    }
    
    if (courseData.level && !['Beginner', 'Intermediate', 'Advanced'].includes(courseData.level)) {
      errors.push('Course level must be Beginner, Intermediate, or Advanced');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default CourseService;
