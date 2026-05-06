import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
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
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    
    // User growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Recent enrollments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: sevenDaysAgo }
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
      totalCourses,
      totalEnrollments,
      newUsers,
      recentEnrollments,
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
   * Get popular courses by enrollment count
   * @param {number} limit - Number of courses to return
   * @returns {Array} List of popular courses
   */
  static async getPopularCourses(limit = 5) {
    const courses = await Course.find()
      .sort({ enrolledCount: -1 })
      .limit(limit)
      .select('title enrolledCount rating thumbnail');
    
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
      .select('title rating totalRatings thumbnail');
    
    return courses;
  }

  /**
   * Get enrollment statistics
   * @returns {Object} Enrollment analytics
   */
  static async getEnrollmentStats() {
    const totalEnrollments = await Enrollment.countDocuments();
    
    // Enrollment growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: thirtyDaysAgo }
    });
    
    // This month enrollments
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: thisMonthStart }
    });
    
    // Course enrollment distribution
    const courseEnrollments = await Enrollment.aggregate([
      {
        $group: {
          _id: '$courseId',
          count: { $sum: 1 }
        }
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
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    return {
      totalEnrollments,
      recentEnrollments,
      thisMonthEnrollments,
      topCourses: courseEnrollments
    };
  }

  /**
   * Get course statistics
   * @returns {Object} Course analytics
   */
  static async getCourseStats() {
    const totalCourses = await Course.countDocuments();
    
    // Courses by category
    const coursesByCategory = await Course.aggregate([
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
    const coursesByLevel = await Course.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Free vs paid courses
    const freeCourses = await Course.countDocuments({ isFree: true });
    const paidCourses = totalCourses - freeCourses;
    
    // Average course rating
    const ratingStats = await Course.aggregate([
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
    
    const recentEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: last24Hours }
    });
    
    const recentRatings = await Rating.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    
    return {
      status: 'healthy',
      lastChecked: now,
      recentActivity: {
        newUsers: recentUsers,
        newEnrollments: recentEnrollments,
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
    
    // Enrollment analytics
    const enrollmentAnalytics = await Enrollment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 }
        }
      }
    ]);
    
    return {
      period: { startDate, endDate },
      userAnalytics: userAnalytics[0] || {},
      enrollmentAnalytics: enrollmentAnalytics[0] || {}
    };
  }
}

export default AdminService;
