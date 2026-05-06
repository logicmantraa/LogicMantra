import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';

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
   * Enroll user in a course
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Object} Enrollment result
   */
  static async enrollInCourse(userId, courseId) {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ userId, courseId });
    if (existingEnrollment) {
      throw new Error('Already enrolled in this course');
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({
      userId,
      courseId
    });
    
    // Update course enrollment count
    course.enrolledCount += 1;
    await course.save();
    
    return enrollment;
  }

  /**
   * Get user enrollments with calculated progress
   * @param {string} userId - User ID
   * @returns {Array} User enrollments with progress
   */
  static async getMyEnrollments(userId) {
    const enrollments = await Enrollment.find({ userId })
      .populate('courseId')
      .sort({ enrolledAt: -1 });
    
    // Calculate dynamic progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await this.calculateProgress(
          enrollment.courseId._id, 
          enrollment.completedLectures
        );
        
        // Update stored progress if it differs
        if (enrollment.progress !== progress) {
          enrollment.progress = progress;
          await enrollment.save();
        }
        
        return enrollment;
      })
    );
    
    return enrollmentsWithProgress;
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
   * Check enrollment status and progress
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Object} Enrollment status
   */
  static async checkEnrollment(userId, courseId) {
    const enrollment = await Enrollment.findOne({
      userId,
      courseId
    });
    
    if (enrollment) {
      // Calculate dynamic progress
      const progress = await this.calculateProgress(
        courseId, 
        enrollment.completedLectures
      );
      
      // Update stored progress if it differs
      if (enrollment.progress !== progress) {
        enrollment.progress = progress;
        await enrollment.save();
      }
    }
    
    return { enrolled: !!enrollment, enrollment };
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
   * Check if user owns enrollment
   * @param {string} enrollmentId - Enrollment ID
   * @param {string} userId - User ID
   * @returns {boolean} Ownership status
   */
  static async checkEnrollmentOwnership(enrollmentId, userId) {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return false;
    }
    
    return enrollment.userId.toString() === userId.toString();
  }

  /**
   * Get enrollment statistics for a course
   * @param {string} courseId - Course ID
   * @returns {Object} Enrollment statistics
   */
  static async getEnrollmentStats(courseId) {
    const totalEnrollments = await Enrollment.countDocuments({ courseId });
    const enrollments = await Enrollment.find({ courseId });
    
    // Calculate average progress
    const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
    const averageProgress = totalEnrollments > 0 ? Math.round(totalProgress / totalEnrollments) : 0;
    
    // Count completed enrollments (100% progress)
    const completedEnrollments = enrollments.filter(enrollment => enrollment.progress === 100).length;
    
    return {
      totalEnrollments,
      averageProgress,
      completedEnrollments,
      completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0
    };
  }
}

export default EnrollmentService;
