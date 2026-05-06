import User from '../models/User.js';
import UserProductAccess from '../models/UserProductAccess.js';
import Product from '../models/Product.js';

/**
 * UserService - Handles all user-related business logic
 * Separated from controller to maintain clean architecture
 */

class UserService {
  /**
   * Check if user has active subscription or paid content
   * @param {string} userId - User ID
   * @returns {Object} Subscription status
   */
  static async checkSubscription(userId) {
    // Check if user has active subscription
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.hasSubscription && user.subscriptionExpiresAt && new Date() < user.subscriptionExpiresAt) {
      return { isSubscribed: true, reason: 'active_subscription' };
    }
    
    // Check if user has purchased any paid products
    const accesses = await UserProductAccess.find({ userId }).populate('productId');
    const hasPaidAccess = accesses.some(
      access => access.productId && !access.productId.isFree && access.productId.price > 0
    );
    
    if (hasPaidAccess) {
      return { isSubscribed: true, reason: 'paid_product_access' };
    }
    
    return { isSubscribed: false, reason: 'no_paid_content' };
  }

  /**
   * Get user by ID (admin function)
   * @param {string} userId - User ID
   * @returns {Object} User data
   */
  static async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  /**
   * Get all users (admin function)
   * @returns {Array} List of users
   */
  static async getAllUsers() {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return users;
  }

  /**
   * Update user (admin function)
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated user
   */
  static async updateUser(userId, updateData) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.name = updateData.name || user.name;
    user.email = updateData.email || user.email;
    user.isAdmin = updateData.isAdmin !== undefined ? updateData.isAdmin : user.isAdmin;
    
    const updatedUser = await user.save();
    
    return {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    };
  }

  /**
   * Delete user (admin function)
   * @param {string} userId - User ID
   * @returns {Object} Deletion result
   */
  static async deleteUser(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    await user.deleteOne();
    return { message: 'User removed' };
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Profile update data
   * @returns {Object} Updated user data
   */
  static async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.name = updateData.name || user.name;
    if (updateData.email) {
      user.email = updateData.email.toLowerCase();
    }
    if (updateData.phoneNumber !== undefined) {
      user.phoneNumber = updateData.phoneNumber || '';
    }
    
    const updatedUser = await user.save();
    
    return {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      isAdmin: updatedUser.isAdmin,
    };
  }

  /**
   * Validate user update data
   * @param {Object} updateData - User update data
   * @returns {Object} Validation result
   */
  static validateUserUpdateData(updateData) {
    const errors = [];
    
    if (updateData.name && typeof updateData.name !== 'string') {
      errors.push('Name must be a string');
    }
    
    if (updateData.name && updateData.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    }
    
    if (updateData.email && typeof updateData.email !== 'string') {
      errors.push('Email must be a string');
    }
    
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        errors.push('Please provide a valid email address');
      }
    }
    
    if (updateData.phoneNumber !== undefined && typeof updateData.phoneNumber !== 'string') {
      errors.push('Phone number must be a string');
    }
    
    if (updateData.isAdmin !== undefined && typeof updateData.isAdmin !== 'boolean') {
      errors.push('Admin status must be a boolean');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user exists by email
   * @param {string} email - User email
   * @returns {boolean} User exists status
   */
  static async userExistsByEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  /**
   * Check if user exists by ID
   * @param {string} userId - User ID
   * @returns {boolean} User exists status
   */
  static async userExistsById(userId) {
    const user = await User.findById(userId);
    return !!user;
  }

  /**
   * Get user statistics (admin function)
   * @returns {Object} User statistics
   */
  static async getUserStats() {
    const totalUsers = await User.countDocuments();
    
    // User growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Admin users count
    const adminUsers = await User.countDocuments({ isAdmin: true });
    
    // Verified users count
    const verifiedUsers = await User.countDocuments({ emailVerified: true });
    
    return {
      totalUsers,
      newUsers,
      adminUsers,
      verifiedUsers,
      verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0
    };
  }

  /**
   * Search users (admin function)
   * @param {Object} searchParams - Search parameters
   * @returns {Array} List of users
   */
  static async searchUsers(searchParams) {
    const { search, isAdmin, emailVerified } = searchParams;
    const query = {};
    
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: regex },
        { email: regex }
      ];
    }
    
    if (isAdmin !== undefined) {
      query.isAdmin = isAdmin;
    }
    
    if (emailVerified !== undefined) {
      query.emailVerified = emailVerified;
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    return users;
  }
}

export default UserService;
