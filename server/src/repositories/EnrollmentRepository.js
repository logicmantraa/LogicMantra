import Enrollment from '../models/Enrollment.js';

/**
 * EnrollmentRepository - Handles all Enrollment database operations
 * Separates data access logic from business logic
 */

class EnrollmentRepository {
  /**
   * Find enrollment by ID
   * @param {string} enrollmentId - Enrollment ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Enrollment document
   */
  static async findById(enrollmentId, options = {}) {
    const { select = '', populate = [] } = options;
    
    let query = Enrollment.findById(enrollmentId);
    
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
   * Find enrollment by user and course
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Enrollment document
   */
  static async findByUserAndCourse(userId, courseId, options = {}) {
    const { select = '', populate = [] } = options;
    
    let query = Enrollment.findOne({ userId, courseId });
    
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
   * Find enrollments by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of enrollment documents
   */
  static async findByUser(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      sort = { enrolledAt: -1 },
      select = '',
      populate = ['courseId']
    } = options;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = Enrollment.find({ userId });
    
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
   * Find enrollments by course
   * @param {string} courseId - Course ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of enrollment documents
   */
  static async findByCourse(courseId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      sort = { enrolledAt: -1 },
      select = '',
      populate = ['userId']
    } = options;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = Enrollment.find({ courseId });
    
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
   * Create new enrollment
   * @param {Object} enrollmentData - Enrollment data
   * @returns {Promise<Object>} Created enrollment document
   */
  static async create(enrollmentData) {
    return await Enrollment.create(enrollmentData);
  }

  /**
   * Update enrollment by ID
   * @param {string} enrollmentId - Enrollment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated enrollment document
   */
  static async updateById(enrollmentId, updateData) {
    return await Enrollment.findByIdAndUpdate(
      enrollmentId, 
      updateData, 
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete enrollment by ID
   * @param {string} enrollmentId - Enrollment ID
   * @returns {Promise<Object|null>} Deleted enrollment document
   */
  static async deleteById(enrollmentId) {
    return await Enrollment.findByIdAndDelete(enrollmentId);
  }

  /**
   * Delete enrollments by filter
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteMany(filter) {
    return await Enrollment.deleteMany(filter);
  }

  /**
   * Count enrollments with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count of enrollments
   */
  static async count(filters = {}) {
    return await Enrollment.countDocuments(filters);
  }

  /**
   * Check if enrollment exists
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Promise<boolean>} Enrollment exists status
   */
  static async exists(userId, courseId) {
    const enrollment = await Enrollment.findOne({ userId, courseId }).select('_id');
    return !!enrollment;
  }

  /**
   * Get enrollment statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Enrollment statistics
   */
  static async getStats(filters = {}) {
    const pipeline = [
      { $match: filters },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          averageProgress: { $avg: '$progress' },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ['$progress', 100] }, 1, 0] }
          },
          totalCompletedLectures: { $sum: { $size: '$completedLectures' } }
        }
      }
    ];
    
    const result = await Enrollment.aggregate(pipeline);
    return result[0] || {
      totalEnrollments: 0,
      averageProgress: 0,
      completedEnrollments: 0,
      totalCompletedLectures: 0
    };
  }

  /**
   * Get enrollment progress distribution
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Progress distribution data
   */
  static async getProgressDistribution(filters = {}) {
    const pipeline = [
      { $match: filters },
      {
        $bucket: {
          groupBy: '$progress',
          boundaries: [0, 25, 50, 75, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            enrollments: { $push: '$$ROOT' }
          }
        }
      }
    ];
    
    return await Enrollment.aggregate(pipeline);
  }

  /**
   * Get enrollment timeline
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
          enrolledAt: {
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
              date: '$enrolledAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
    
    return await Enrollment.aggregate(pipeline);
  }

  /**
   * Get course enrollment statistics
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course enrollment statistics
   */
  static async getCourseStats(courseId) {
    const pipeline = [
      { $match: { courseId } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          averageProgress: { $avg: '$progress' },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ['$progress', 100] }, 1, 0] }
          },
          completionRate: {
            $avg: { $cond: [{ $eq: ['$progress', 100] }, 1, 0] }
          }
        }
      }
    ];
    
    const result = await Enrollment.aggregate(pipeline);
    return result[0] || {
      totalEnrollments: 0,
      averageProgress: 0,
      completedEnrollments: 0,
      completionRate: 0
    };
  }

  /**
   * Get user enrollment statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User enrollment statistics
   */
  static async getUserStats(userId) {
    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          averageProgress: { $avg: '$progress' },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ['$progress', 100] }, 1, 0] }
          },
          totalCompletedLectures: { $sum: { $size: '$completedLectures' } }
        }
      }
    ];
    
    const result = await Enrollment.aggregate(pipeline);
    return result[0] || {
      totalEnrollments: 0,
      averageProgress: 0,
      completedEnrollments: 0,
      totalCompletedLectures: 0
    };
  }

  /**
   * Update multiple enrollments
   * @param {Object} filter - Filter criteria
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  static async updateMany(filter, updateData) {
    return await Enrollment.updateMany(filter, updateData);
  }

  /**
   * Find enrollments with complex criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of enrollment documents
   */
  static async findWithCriteria(criteria, options = {}) {
    const { page = 1, limit = 20, sort = { enrolledAt: -1 }, select = '' } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await Enrollment.find(criteria)
      .select(select)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }
}

export default EnrollmentRepository;
