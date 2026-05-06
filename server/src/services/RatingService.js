import Rating from '../models/Rating.js';
import Course from '../models/Course.js';

/**
 * RatingService - Handles all rating-related business logic
 * Separated from controller to maintain clean architecture
 */

class RatingService {
  /**
   * Calculate average rating for a course
   * @param {string} courseId - Course ID
   * @returns {Object} Rating statistics
   */
  static async calculateAverageRating(courseId) {
    const ratings = await Rating.find({ courseId });
    
    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0
      };
    }
    
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    return {
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      totalRatings: ratings.length
    };
  }

  /**
   * Update course rating statistics
   * @param {string} courseId - Course ID
   * @returns {Object} Updated course
   */
  static async updateCourseRating(courseId) {
    const ratingStats = await this.calculateAverageRating(courseId);
    
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    course.rating = ratingStats.averageRating;
    course.totalRatings = ratingStats.totalRatings;
    await course.save();
    
    return course;
  }

  /**
   * Submit or update rating for a course
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {number} rating - Rating value (1-5)
   * @param {string} feedback - User feedback (optional)
   * @returns {Object} Created/updated rating
   */
  static async submitRating(userId, courseId, rating, feedback) {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if rating already exists
    let existingRating = await Rating.findOne({ userId, courseId });
    
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.feedback = feedback || '';
      await existingRating.save();
    } else {
      // Create new rating
      existingRating = await Rating.create({
        userId,
        courseId,
        rating,
        feedback: feedback || ''
      });
    }
    
    // Update course average rating
    await this.updateCourseRating(courseId);
    
    return existingRating;
  }

  /**
   * Get all ratings for a course
   * @param {string} courseId - Course ID
   * @returns {Array} List of ratings with user data
   */
  static async getCourseRatings(courseId) {
    const ratings = await Rating.find({ courseId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    return ratings;
  }

  /**
   * Get user's rating for a specific course
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Object|null} User's rating or null
   */
  static async getMyRating(userId, courseId) {
    const rating = await Rating.findOne({
      userId,
      courseId
    });
    
    return rating || null;
  }

  /**
   * Update existing rating
   * @param {string} ratingId - Rating ID
   * @param {string} userId - User ID (for ownership check)
   * @param {Object} updateData - Update data
   * @returns {Object} Updated rating
   */
  static async updateRating(ratingId, userId, updateData) {
    const rating = await Rating.findById(ratingId);
    
    if (!rating) {
      throw new Error('Rating not found');
    }
    
    // Check if user owns this rating
    if (rating.userId.toString() !== userId.toString()) {
      throw new Error('Not authorized');
    }
    
    rating.rating = updateData.rating || rating.rating;
    rating.feedback = updateData.feedback !== undefined ? updateData.feedback : rating.feedback;
    
    await rating.save();
    
    // Update course average rating
    await this.updateCourseRating(rating.courseId);
    
    return rating;
  }

  /**
   * Delete rating
   * @param {string} ratingId - Rating ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {Object} Deletion result
   */
  static async deleteRating(ratingId, userId) {
    const rating = await Rating.findById(ratingId);
    
    if (!rating) {
      throw new Error('Rating not found');
    }
    
    // Check if user owns this rating
    if (rating.userId.toString() !== userId.toString()) {
      throw new Error('Not authorized');
    }
    
    const courseId = rating.courseId;
    await rating.deleteOne();
    
    // Update course average rating
    await this.updateCourseRating(courseId);
    
    return { message: 'Rating removed' };
  }

  /**
   * Validate rating data
   * @param {number} rating - Rating value
   * @param {string} feedback - Feedback text
   * @returns {Object} Validation result
   */
  static validateRatingData(rating, feedback) {
    const errors = [];
    
    if (rating === undefined || rating === null) {
      errors.push('Rating is required');
    } else if (typeof rating !== 'number') {
      errors.push('Rating must be a number');
    } else if (rating < 1 || rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }
    
    if (feedback && typeof feedback !== 'string') {
      errors.push('Feedback must be a string');
    }
    
    if (feedback && feedback.length > 1000) {
      errors.push('Feedback must be less than 1000 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user owns rating
   * @param {string} ratingId - Rating ID
   * @param {string} userId - User ID
   * @returns {boolean} Ownership status
   */
  static async checkRatingOwnership(ratingId, userId) {
    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return false;
    }
    
    return rating.userId.toString() === userId.toString();
  }

  /**
   * Get rating statistics for a course
   * @param {string} courseId - Course ID
   * @returns {Object} Detailed rating statistics
   */
  static async getRatingStats(courseId) {
    const ratings = await Rating.find({ courseId });
    
    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      };
    }
    
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      ratingDistribution[rating.rating] = (ratingDistribution[rating.rating] || 0) + 1;
    });
    
    return {
      totalRatings: ratings.length,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution
    };
  }
}

export default RatingService;
