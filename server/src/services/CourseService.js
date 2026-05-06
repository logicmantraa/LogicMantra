import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Resource from '../models/Resource.js';

/**
 * CourseService - Handles all course-related business logic
 * Separated from controller to maintain clean architecture
 */

class CourseService {
  /**
   * Build search query from filters
   * @param {Object} filters - Search and filter parameters
   * @returns {Object} MongoDB query object
   */
  static buildSearchQuery(filters) {
    const { search, category, level, minRating, maxPrice, isFree } = filters;
    const query = {};
    
    // Search by name/id
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: regex },
        { description: regex },
        { instructor: regex }
      ];
      // If search is a valid ObjectId, also search by ID
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: search });
      }
    }
    
    // Filters
    if (category) query.category = category;
    if (level) query.level = level;
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (maxPrice !== undefined) {
      query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }
    if (isFree !== undefined) query.isFree = isFree === 'true';
    
    return query;
  }

  /**
   * Get courses with search and filters
   * @param {Object} filters - Search and filter parameters
   * @returns {Array} List of courses
   */
  static async getCourses(filters = {}) {
    const query = this.buildSearchQuery(filters);
    const courses = await Course.find(query).sort({ createdAt: -1 });
    return courses;
  }

  /**
   * Get single course with lectures and resources
   * @param {string} courseId - Course ID
   * @returns {Object} Course with lectures and resources
   */
  static async getCourseById(courseId) {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    const lectures = await Lecture.find({ courseId: course._id }).sort({ order: 1 });
    const resources = await Resource.find({ courseId: course._id });
    
    return {
      course,
      lectures,
      resources
    };
  }

  /**
   * Create new course
   * @param {Object} courseData - Course data
   * @returns {Object} Created course
   */
  static async createCourse(courseData) {
    const course = await Course.create(courseData);
    return course;
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
   * Check if course exists
   * @param {string} courseId - Course ID
   * @returns {boolean} Course exists status
   */
  static async courseExists(courseId) {
    const course = await Course.findById(courseId);
    return !!course;
  }

  /**
   * Update course enrollment count
   * @param {string} courseId - Course ID
   * @param {number} increment - Number to increment by (default: 1)
   * @returns {Object} Updated course
   */
  static async updateEnrollmentCount(courseId, increment = 1) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    course.enrolledCount += increment;
    await course.save();
    
    return course;
  }

  /**
   * Update course rating statistics
   * @param {string} courseId - Course ID
   * @param {number} newRating - New rating value
   * @param {number} totalRatings - Total number of ratings
   * @returns {Object} Updated course
   */
  static async updateCourseRating(courseId, newRating, totalRatings) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    course.rating = newRating;
    course.totalRatings = totalRatings;
    await course.save();
    
    return course;
  }

  /**
   * Get popular courses by enrollment count
   * @param {number} limit - Number of courses to return
   * @returns {Array} List of popular courses
   */
  static async getPopularCourses(limit = 5) {
    const courses = await Course.find()
      .sort({ enrolledCount: -1 })
      .limit(limit)
      .select('title enrolledCount rating');
    
    return courses;
  }

  /**
   * Get top rated courses
   * @param {number} limit - Number of courses to return
   * @returns {Array} List of top rated courses
   */
  static async getTopRatedCourses(limit = 5) {
    const courses = await Course.find()
      .sort({ rating: -1 })
      .limit(limit)
      .select('title rating totalRatings');
    
    return courses;
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
