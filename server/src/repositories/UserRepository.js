import User from '../models/User.js';

/**
 * UserRepository - Handles all User database operations
 * Separates data access logic from business logic
 */

class UserRepository {
  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} User document
   */
  static async findById(userId, options = {}) {
    const { select = '', populate = [] } = options;
    
    let query = User.findById(userId);
    
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
   * Find user by email
   * @param {string} email - User email
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} User document
   */
  static async findByEmail(email, options = {}) {
    const { select = '', populate = [] } = options;
    
    let query = User.findOne({ email: email.toLowerCase() });
    
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
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user document
   */
  static async create(userData) {
    return await User.create(userData);
  }

  /**
   * Update user by ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user document
   */
  static async updateById(userId, updateData) {
    return await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteById(userId) {
    return await User.findByIdAndDelete(userId);
  }

  /**
   * Get all users with pagination and filtering
   * @param {Object} filters - Filter options
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of user documents
   */
  static async findAll(filters = {}, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      sort = { createdAt: -1 },
      select = '-password'
    } = options;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = User.find(filters);
    
    query = query
      .select(select)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    return await query;
  }

  /**
   * Count users with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Count of users
   */
  static async count(filters = {}) {
    return await User.countDocuments(filters);
  }

  /**
   * Search users by text
   * @param {string} searchText - Text to search
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of user documents
   */
  static async search(searchText, options = {}) {
    const { page = 1, limit = 20, select = '-password' } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const regex = { $regex: searchText, $options: 'i' };
    const query = {
      $or: [
        { name: regex },
        { email: regex }
      ]
    };
    
    return await User.find(query)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Check if user exists by email
   * @param {string} email - User email
   * @returns {Promise<boolean>} User exists status
   */
  static async existsByEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('_id');
    return !!user;
  }

  /**
   * Check if user exists by ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} User exists status
   */
  static async existsById(userId) {
    const user = await User.findById(userId).select('_id');
    return !!user;
  }

  /**
   * Get user statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} User statistics
   */
  static async getStats(filters = {}) {
    const pipeline = [
      { $match: filters },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ['$emailVerified', true] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$isAdmin', true] }, 1, 0] }
          },
          usersWithSubscription: {
            $sum: { $cond: [{ $eq: ['$hasSubscription', true] }, 1, 0] }
          }
        }
      }
    ];
    
    const result = await User.aggregate(pipeline);
    return result[0] || {
      totalUsers: 0,
      verifiedUsers: 0,
      adminUsers: 0,
      usersWithSubscription: 0
    };
  }

  /**
   * Get user growth over time
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} groupBy - Group by period (day, week, month)
   * @returns {Promise<Array>} User growth data
   */
  static async getGrowthStats(startDate, endDate, groupBy = 'day') {
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
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
    
    return await User.aggregate(pipeline);
  }

  /**
   * Update multiple users
   * @param {Object} filter - Filter criteria
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  static async updateMany(filter, updateData) {
    return await User.updateMany(filter, updateData);
  }

  /**
   * Find users with complex criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of user documents
   */
  static async findWithCriteria(criteria, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 }, select = '-password' } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await User.find(criteria)
      .select(select)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }
}

export default UserRepository;
