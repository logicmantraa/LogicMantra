import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import AccessService from './AccessService.js';
import ProductService from './ProductService.js';
import { AppError, NotFoundError } from '../errors/customErrors.js';
import logger from '../utils/logger.js';

/**
 * EnrollmentService - Handles all enrollment-related business logic
 * Separated from controller to maintain clean architecture
 */

class EnrollmentService {
  /**
   * Calculate progress percentage for an enrollment
   * @param {string} courseId - Course ID
   * @param {Array} completedLectures - Array of completed lecture IDs
   * @returns {number} Progress percentage (0-100)
   */
  static calculateProgress(courseId, completedLectures) {
    // This would ideally use a repository pattern, but keeping it simple for now
    return Lecture.countDocuments({ courseId })
      .then(totalLectures => {
        const completedCount = completedLectures.length;
        let progress = 0;
        if (totalLectures > 0) {
          progress = Math.round((completedCount / totalLectures) * 100);
        }
        return Math.min(100, Math.max(0, progress));
      });
  }

  /**
   * Enroll user in a course (Compatibility layer)
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Object} Enrollment result
   */
  static async enrollInCourse(userId, courseId) {
    logger.info(`EnrollmentService.enrollInCourse called for user ${userId}, course ${courseId} - using AccessService`);
    
    try {
      // Try new system first
      const access = await AccessService.grantAccess(userId, courseId, 'free');
      
      // Transform to enrollment format for backward compatibility
      return {
        _id: access._id,
        userId: access.userId,
        courseId: access.productId,
        progress: access.progress,
        completedLectures: access.progressData?.completedLectures || [],
        enrolledAt: access.addedToLibraryAt,
        createdAt: access.createdAt,
        updatedAt: access.updatedAt
      };
    } catch (error) {
      // Fallback to legacy system if AccessService fails
      logger.warn(`AccessService failed, falling back to legacy Enrollment: ${error.message}`);
      
      const course = await Course.findById(courseId);
      if (!course) {
        throw new NotFoundError('Course not found');
      }
      
      const existingEnrollment = await Enrollment.findOne({ userId, courseId });
      if (existingEnrollment) {
        throw new AppError('Already enrolled in this course', 409);
      }
      
      const enrollment = await Enrollment.create({
        userId,
        courseId
      });
      
      course.enrolledCount += 1;
      await course.save();
      
      return enrollment;
    }
  }

  /**
   * Get user enrollments with calculated progress (Compatibility layer)
   * @param {string} userId - User ID
   * @returns {Array} User enrollments with progress
   */
  static async getMyEnrollments(userId) {
    logger.info(`EnrollmentService.getMyEnrollments called for user ${userId} - using AccessService`);
    
    try {
      // Use new AccessService
      const library = await AccessService.getUserLibrary(userId);
      
      // Transform library items to enrollment format
      const enrollments = library.library.map(item => ({
        _id: item._id,
        userId: item.userId,
        courseId: item.productId,
        progress: item.progress,
        completedLectures: item.progressData?.completedLectures || [],
        enrolledAt: item.addedToLibraryAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        courseId_populated: item.productId // For backward compatibility
      }));
      
      return enrollments;
    } catch (error) {
      // Fallback to legacy system
      logger.warn(`AccessService failed, falling back to legacy Enrollment: ${error.message}`);
      
      const enrollments = await Enrollment.find({ userId })
        .populate('courseId')
        .sort({ enrolledAt: -1 });
      
      const enrollmentsWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const progress = await this.calculateProgress(
            enrollment.courseId._id, 
            enrollment.completedLectures
          );
          
          if (enrollment.progress !== progress) {
            enrollment.progress = progress;
            await enrollment.save();
          }
          
          return enrollment;
        })
      );
      
      return enrollmentsWithProgress;
    }
  }

  /**
   * Update enrollment progress
   * @param {string} enrollmentId - Enrollment ID
   * @param {string} userId - User ID (for ownership check)
   * @param {string} lectureId - Lecture ID to mark as completed
   * @returns {Object} Updated enrollment
   */
  static async updateProgress(enrollmentId, userId, lectureId) {
    const enrollment = await Enrollment.findById(enrollmentId).populate('courseId');
    
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }
    
    // Check if user owns this enrollment
    if (enrollment.userId.toString() !== userId.toString()) {
      throw new Error('Not authorized');
    }
    
    // Add lecture to completed lectures if not already completed
    if (lectureId && !enrollment.completedLectures.includes(lectureId)) {
      enrollment.completedLectures.push(lectureId);
    }
    
    // Calculate progress dynamically
    const progress = await this.calculateProgress(
      enrollment.courseId._id, 
      enrollment.completedLectures
    );
    
    enrollment.progress = progress;
    await enrollment.save();
    
    return enrollment;
  }

  /**
   * Check enrollment status and progress (Compatibility layer)
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Object} Enrollment status
   */
  static async checkEnrollment(userId, courseId) {
    logger.info(`EnrollmentService.checkEnrollment called for user ${userId}, course ${courseId} - using AccessService`);
    
    try {
      // Use new AccessService
      const accessInfo = await AccessService.checkAccess(userId, courseId);
      
      if (accessInfo.hasAccess) {
        // Get full access record for progress info
        const library = await AccessService.getUserLibrary(userId);
        const accessRecord = library.library.find(item => 
          item.productId.toString() === courseId.toString()
        );
        
        const enrollment = {
          _id: accessRecord._id,
          userId: accessRecord.userId,
          courseId: accessRecord.productId,
          progress: accessRecord.progress,
          completedLectures: accessRecord.progressData?.completedLectures || [],
          enrolledAt: accessRecord.addedToLibraryAt,
          createdAt: accessRecord.createdAt,
          updatedAt: accessRecord.updatedAt
        };
        
        return { enrolled: true, enrollment };
      } else {
        return { enrolled: false, enrollment: null };
      }
    } catch (error) {
      // Fallback to legacy system
      logger.warn(`AccessService failed, falling back to legacy Enrollment: ${error.message}`);
      
      const enrollment = await Enrollment.findOne({ userId, courseId });
      
      if (enrollment) {
        const progress = await this.calculateProgress(
          courseId, 
          enrollment.completedLectures
        );
        
        if (enrollment.progress !== progress) {
          enrollment.progress = progress;
          await enrollment.save();
        }
      }
      
      return { enrolled: !!enrollment, enrollment };
    }
  }

  /**
   * Validate enrollment data
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Object} Validation result
   */
  static validateEnrollmentData(userId, courseId) {
    const errors = [];
    
    if (!userId) {
      errors.push('User ID is required');
    }
    
    if (!courseId) {
      errors.push('Course ID is required');
    }
    
    // Validate ObjectId format
    if (userId && !userId.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push('Invalid User ID format');
    }
    
    if (courseId && !courseId.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push('Invalid Course ID format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user owns enrollment (Compatibility layer)
   * @param {string} enrollmentId - Enrollment ID
   * @param {string} userId - User ID
   * @returns {boolean} Ownership status
   */
  static async checkEnrollmentOwnership(enrollmentId, userId) {
    logger.info(`EnrollmentService.checkEnrollmentOwnership called - using AccessService`);
    
    try {
      // Try new system first
      return await AccessService.checkOwnership(userId, enrollmentId);
    } catch (error) {
      // Fallback to legacy system
      logger.warn(`AccessService failed, falling back to legacy Enrollment: ${error.message}`);
      
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        return false;
      }
      
      return enrollment.userId.toString() === userId.toString();
    }
  }

  /**
   * Get enrollment statistics for a course (Compatibility layer)
   * @param {string} courseId - Course ID
   * @returns {Object} Enrollment statistics
   */
  static async getEnrollmentStats(courseId) {
    logger.info(`EnrollmentService.getEnrollmentStats called for course ${courseId} - using AccessService`);
    
    try {
      // Use new AccessService
      const stats = await AccessService.getAccessStats(courseId);
      
      // Transform to enrollment format
      return {
        totalEnrollments: stats.totalAccess,
        averageProgress: Math.round(stats.averageProgress),
        completedEnrollments: stats.completedAccess,
        completionRate: stats.completionRate
      };
    } catch (error) {
      // Fallback to legacy system
      logger.warn(`AccessService failed, falling back to legacy Enrollment: ${error.message}`);
      
      const totalEnrollments = await Enrollment.countDocuments({ courseId });
      const enrollments = await Enrollment.find({ courseId });
      
      const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
      const averageProgress = totalEnrollments > 0 ? Math.round(totalProgress / totalEnrollments) : 0;
      
      const completedEnrollments = enrollments.filter(enrollment => enrollment.progress === 100).length;
      
      return {
        totalEnrollments,
        averageProgress,
        completedEnrollments,
        completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0
      };
    }
  }
}

export default EnrollmentService;
