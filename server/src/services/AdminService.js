import User from '../models/User.js';
import Product from '../models/Product.js';
import UserProductAccess from '../models/UserProductAccess.js';
import Rating from '../models/Rating.js';

/**
 * AdminService - Handles all admin-related business logic
 * Separated from controller to maintain clean architecture
 */

class AdminService {
  /**
   * Get comprehensive dashboard statistics
   * @returns {Object} Dashboard analytics data
   */
  static async getDashboardStats() {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalAccess = await UserProductAccess.countDocuments();
    
    // User growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Recent access (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAccess = await UserProductAccess.countDocuments({
      addedToLibraryAt: { $gte: sevenDaysAgo }
    });
    
    // Course analytics
    const popularCourses = await this.getPopularCourses(5);
    const topRatedCourses = await this.getTopRatedCourses(5);
    
    // User analytics
    const userStats = await this.getUserGrowthStats();
    
    // Revenue (placeholder for future payment integration)
    const totalRevenue = 0;
    
    return {
      totalUsers,
      totalProducts,
      totalAccess,
      newUsers,
      recentAccess,
      totalRevenue,
      popularCourses,
      topRatedCourses,
      userStats
    };
  }

  /**
   * Get user growth statistics
   * @returns {Object} User growth analytics
   */
  static async getUserGrowthStats() {
    const now = new Date();
    
    // Last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const usersLast7Days = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // This month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });
    
    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    
    return {
      usersLast7Days,
      usersLast30Days,
      usersThisMonth,
      usersLastMonth,
      growthRate: usersLastMonth > 0 ? 
        Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100) : 0
    };
  }

  /**
   * Get popular products by access count
   * @param {number} limit - Number of products to return
   * @returns {Array} List of popular products
   */
  static async getPopularCourses(limit = 5) {
    return await Product.find({ status: 'published' })
      .sort({ accessCount: -1 })
      .limit(limit)
      .select('title thumbnail accessCount rating category');
  }

  /**
   * Get top rated courses
   * @param {number} limit - Number of courses to return
   * @returns {Array} List of top rated courses
   */
  static async getTopRatedCourses(limit = 5) {
    const products = await Product.find({ status: 'published' })
      .sort({ rating: -1 })
      .limit(limit)
      .select('title thumbnail rating category totalRatings');
    
    return products;
  }

  /**
   * Get access statistics
   * @returns {Object} Access analytics
   */
  static async getAccessStats() {
    const totalAccess = await UserProductAccess.countDocuments();
    
    // Access growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAccess = await UserProductAccess.countDocuments({
      addedToLibraryAt: { $gte: thirtyDaysAgo }
    });
    
    // This month access
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthAccess = await UserProductAccess.countDocuments({
      addedToLibraryAt: { $gte: thisMonthStart }
    });
    
    // Product access distribution
    const productAccess = await UserProductAccess.aggregate([
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    return {
      totalAccess,
      recentAccess,
      thisMonthAccess,
      topProducts: productAccess
    };
  }


  /**
   * Get product statistics
   * @returns {Object} Product analytics
   */
  static async getProductStats() {
    const totalProducts = await Product.countDocuments();
    
    // Products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Products by type
    const productsByType = await Product.aggregate([
      {
        $group: {
          _id: '$productType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Published vs draft products
    const publishedProducts = await Product.countDocuments({ status: 'published' });
    const draftProducts = await Product.countDocuments({ status: 'draft' });
    
    return {
      totalProducts,
      publishedProducts,
      draftProducts,
      productsByCategory,
      productsByType
    };
  }

  /**
   * Get course statistics
   * @returns {Object} Course analytics
   */
  static async getCourseStats() {
    const totalCourses = await Product.countDocuments();
    
    // Courses by category
    const coursesByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Courses by level
    const coursesByLevel = await Product.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Free vs paid courses
    const freeCourses = await Product.countDocuments({ isFree: true });
    const paidCourses = totalCourses - freeCourses;
    
    // Average course rating
    const ratingStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: '$totalRatings' }
        }
      }
    ]);
    
    return {
      totalCourses,
      freeCourses,
      paidCourses,
      coursesByCategory,
      coursesByLevel,
      avgRating: ratingStats[0]?.avgRating || 0,
      totalRatings: ratingStats[0]?.totalRatings || 0
    };
  }

  /**
   * Get system health metrics
   * @returns {Object} System health data
   */
  static async getSystemHealth() {
    // Database connection health would be checked here
    // For now, return basic metrics
    
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Recent activity
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    
    const recentAccess = await UserProductAccess.countDocuments({
      addedToLibraryAt: { $gte: last24Hours }
    });
    
    const recentRatings = await Rating.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    
    return {
      status: 'healthy',
      lastChecked: now,
      recentActivity: {
        newUsers: recentUsers,
        newAccess: recentAccess,
        newRatings: recentRatings
      }
    };
  }

  /**
   * Get comprehensive analytics for reporting
   * @param {Object} filters - Time period filters
   * @returns {Object} Comprehensive analytics
   */
  static async getComprehensiveAnalytics(filters = {}) {
    const { startDate, endDate } = filters;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // User analytics
    const userAnalytics = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ['$emailVerified', true] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$isAdmin', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Access analytics
    const accessAnalytics = await UserProductAccess.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAccess: { $sum: 1 }
        }
      }
    ]);
    
    return {
      period: { startDate, endDate },
      userAnalytics: userAnalytics[0] || {},
      accessAnalytics: accessAnalytics[0] || {}
    };
  }
}

export default AdminService;
