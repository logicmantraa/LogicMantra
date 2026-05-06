import Rating from '../models/Rating.js';

/**
 * RatingRepository - Handles all Rating database operations
 * Separates data access logic from business logic
 */

class RatingRepository {
  /**
   * Find rating by ID
   * @param {string} ratingId - Rating ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Rating document
   */
  static async findById(ratingId, options = {}) {
    const { select = '', populate = [] } = options;
    
    let query = Rating.findById(ratingId);
    
    if (select) {
      query = query.select(select);
    }
    
    if (populate.length > 0) {
      populate.forEach(populateOption => {
        query = query.populate(populateOption);
      });
    }
    
    return await query;
  }

  /**
   * Find rating by user and course
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Rating document
   */
  static async findByUserAndCourse(userId, courseId, options = {}) {
    const { select = '', populate = [] } = options;
    
    let query = Rating.findOne({ userId, courseId });
    
    if (select) {
      query = query.select(select);
    }
    
    if (populate.length > 0) {
      populate.forEach(populateOption => {
        query = query.populate(populateOption);
      });
    }
    
    return await query;
  }

  /**
   * Find ratings by course
   * @param {string} courseId - Course ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of rating documents
   */
  static async findByCourse(courseId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      sort = { createdAt: -1 },
      select = '',
      populate = ['userId']
    } = options;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = Rating.find({ courseId });
    
    if (select) {
      query = query.select(select);
    }
    
    if (populate.length > 0) {
      populate.forEach(populateOption => {
        query = query.populate(populateOption);
      });
    }
    
    query = query
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    return await query;
  }

  /**
   * Find ratings by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of rating documents
   */
  static async findByUser(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      sort = { createdAt: -1 },
      select = '',
      populate = ['courseId']
    } = options;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = Rating.find({ userId });
    
    if (select) {
      query = query.select(select);
    }
    
    if (populate.length > 0) {
      populate.forEach(populateOption => {
        query = query.populate(populateOption);
      });
    }
    
    query = query
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    return await query;
  }

  /**
   * Create new rating
   * @param {Object} ratingData - Rating data
   * @returns {Promise<Object>} Created rating document
   */
  static async create(ratingData) {
    return await Rating.create(ratingData);
  }

  /**
   * Update rating by ID
   * @param {string} ratingId - Rating ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated rating document
   */
  static async updateById(ratingId, updateData) {
    return await Rating.findByIdAndUpdate(
      ratingId, 
      updateData, 
      { new: true, runValidators: true }
    );
  }

  /**
   * Update rating by user and course
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated rating document
   */
  static async updateByUserAndCourse(userId, courseId, updateData) {
    return await Rating.findOneAndUpdate(
      { userId, courseId }, 
      updateData, 
      { new: true, runValidators: true, upsert: false }
    );
  }

  /**
   * Delete rating by ID
   * @param {string} ratingId - Rating ID
   * @returns {Promise<Object|null>} Deleted rating document
   */
  static async deleteById(ratingId) {
    return await Rating.findByIdAndDelete(ratingId);
  }

  /**
   * Delete rating by user and course
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteByUserAndCourse(userId, courseId) {
    return await Rating.deleteOne({ userId, courseId });
  }

  /**
   * Delete ratings by filter
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteMany(filter) {
    return await Rating.deleteMany(filter);
  }

  /**
   * Count ratings with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count of ratings
   */
  static async count(filters = {}) {
    return await Rating.countDocuments(filters);
  }

  /**
   * Check if rating exists
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Promise<boolean>} Rating exists status
   */
  static async exists(userId, courseId) {
    const rating = await Rating.findOne({ userId, courseId }).select('_id');
    return !!rating;
  }

  /**
   * Get rating statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Rating statistics
   */
  static async getStats(filters = {}) {
    const pipeline = [
      { $match: filters },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ];
    
    const result = await Rating.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        minRating: 0,
        maxRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    const stats = result[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });
    
    return {
      totalRatings: stats.totalRatings,
      averageRating: Math.round(stats.averageRating * 100) / 100,
      minRating: stats.minRating,
      maxRating: stats.maxRating,
      ratingDistribution: distribution
    };
  }

  /**
   * Get course rating statistics
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course rating statistics
   */
  static async getCourseStats(courseId) {
    const pipeline = [
      { $match: { courseId } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingSum: { $sum: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ];
    
    const result = await Rating.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingSum: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    const stats = result[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });
    
    return {
      totalRatings: stats.totalRatings,
      averageRating: Math.round(stats.averageRating * 100) / 100,
      ratingSum: stats.ratingSum,
      ratingDistribution: distribution
    };
  }

  /**
   * Get user rating statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User rating statistics
   */
  static async getUserStats(userId) {
    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ];
    
    const result = await Rating.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    const stats = result[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });
    
    return {
      totalRatings: stats.totalRatings,
      averageRating: Math.round(stats.averageRating * 100) / 100,
      ratingDistribution: distribution
    };
  }

  /**
   * Get rating timeline
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} groupBy - Group by period (day, week, month)
   * @returns {Promise<Array>} Timeline data
   */
  static async getTimeline(startDate, endDate, groupBy = 'day') {
    let groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-%U';
        break;
      case 'month':
        groupFormat = '%Y-%m';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
    
    return await Rating.aggregate(pipeline);
  }

  /**
   * Get top rated courses
   * @param {number} limit - Number of courses to return
   * @returns {Promise<Array>} Top rated courses with rating stats
   */
  static async getTopRatedCourses(limit = 10) {
    const pipeline = [
      {
        $group: {
          _id: '$courseId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          ratingSum: { $sum: '$rating' }
        }
      },
      {
        $match: {
          totalRatings: { $gte: 1 } // Only include courses with at least 1 rating
        }
      },
      {
        $sort: { averageRating: -1, totalRatings: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      }
    ];
    
    return await Rating.aggregate(pipeline);
  }

  /**
   * Update multiple ratings
   * @param {Object} filter - Filter criteria
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  static async updateMany(filter, updateData) {
    return await Rating.updateMany(filter, updateData);
  }

  /**
   * Find ratings with complex criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of rating documents
   */
  static async findWithCriteria(criteria, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 }, select = '' } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await Rating.find(criteria)
      .select(select)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }
}

export default RatingRepository;
