import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Rating from '../models/Rating.js';
import PendingRegistration from '../models/PendingRegistration.js';
import PasswordReset from '../models/PasswordReset.js';
import Contact from '../models/Contact.js';
import { cacheService, CACHE_TTL } from '../config/cache.js';
import { CACHE_KEYS } from '../config/cache.js';

/**
 * Admin Controller with caching support
 * Handles admin dashboard statistics with performance optimization
 */

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Generate cache key based on user and time window
    const cacheKey = `${CACHE_KEYS.DASHBOARD_STATS}:${req.user._id}:${new Date().getHours()}`;
    
    // Try to get from cache first
    const cachedStats = await cacheService.get(cacheKey);
    
    if (cachedStats) {
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey);
      return res.json(cachedStats);
    }

    // If not in cache, fetch from database
    const [
      totalUsers,
      activeUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalRatings,
      averageRating,
      pendingRegistrations,
      passwordResets,
      contacts,
      recentEnrollments,
      topCourses,
      revenueStats
    ] = await Promise.all([
      // User statistics
      User.countDocuments(),
      User.countDocuments({ emailVerified: true }),
      
      // Course statistics
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      
      // Enrollment statistics
      Enrollment.countDocuments(),
      
      // Rating statistics
      Rating.countDocuments(),
      Rating.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).then(result => result[0]?.avgRating || 0),
      
      // Pending items
      PendingRegistration.countDocuments(),
      PasswordReset.countDocuments(),
      Contact.countDocuments(),
      
      // Recent activity
      Enrollment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .populate('courseId', 'title'),
      
      // Top courses by enrollments
      Course.aggregate([
        { $match: { isPublished: true } },
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'courseId',
            as: 'enrollments'
          }
        },
        {
          $addFields: {
            enrollmentCount: { $size: '$enrollments' }
          }
        },
        { $sort: { enrollmentCount: -1 } },
        { $limit: 5 },
        { $project: { title: 1, enrollmentCount: 1, instructor: 1, price: 1 } }
      ]),
      
      // Revenue statistics (if applicable)
      Enrollment.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amountPaid' },
            avgRevenue: { $avg: '$amountPaid' },
            enrollmentsWithPayment: {
              $sum: { $cond: [{ $gt: ['$amountPaid', 0] }, 1, 0] }
            }
          }
        }
      ]).then(result => result[0] || { totalRevenue: 0, avgRevenue: 0, enrollmentsWithPayment: 0 })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        verificationRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        publishRate: totalCourses > 0 ? ((publishedCourses / totalCourses) * 100).toFixed(1) : 0
      },
      enrollments: {
        total: totalEnrollments,
        recent: recentEnrollments
      },
      ratings: {
        total: totalRatings,
        average: parseFloat(averageRating.toFixed(1))
      },
      pending: {
        registrations: pendingRegistrations,
        passwordResets: passwordResets,
        contacts: contacts
      },
      topCourses,
      revenue: revenueStats,
      timestamp: new Date().toISOString()
    };

    // Cache the results for 1 hour
    await cacheService.set(cacheKey, stats, CACHE_TTL.LONG);
    
    res.set('X-Cache', 'MISS');
    res.set('X-Cache-Key', cacheKey);
    res.set('X-Cache-TTL', CACHE_TTL.LONG.toString());
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      message: error.message 
    });
  }
};

/**
 * Get user statistics with caching
 */
export const getUserStats = async (req, res) => {
  try {
    const cacheKey = `${CACHE_KEYS.USER_PROFILE}:stats:${new Date().getHours()}`;
    
    const cachedStats = await cacheService.get(cacheKey);
    if (cachedStats) {
      return res.json(cachedStats);
    }

    const [
      totalUsers,
      usersByMonth,
      usersByRole,
      recentUsers,
      userGrowthRate
    ] = await Promise.all([
      User.countDocuments(),
      
      // Users registered in last 6 months
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Users by role
      User.aggregate([
        {
          $group: {
            _id: { $cond: ['$isAdmin', 'admin', 'user'] },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent users
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email isAdmin emailVerified createdAt'),
      
      // User growth rate (last 30 days vs previous 30 days)
      Promise.all([
        User.countDocuments({ 
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        User.countDocuments({ 
          createdAt: { 
            $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        })
      ]).then(([current, previous]) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous * 100).toFixed(1);
      })
    ]);

    const stats = {
      total: totalUsers,
      byMonth: usersByMonth,
      byRole: usersByRole,
      recent: recentUsers,
      growthRate: parseFloat(userGrowthRate),
      timestamp: new Date().toISOString()
    };

    await cacheService.set(cacheKey, stats, CACHE_TTL.MEDIUM);
    res.json(stats);
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user statistics',
      message: error.message 
    });
  }
};

/**
 * Get course statistics with caching
 */
export const getCourseStats = async (req, res) => {
  try {
    const cacheKey = `${CACHE_KEYS.COURSE_STATS}:${new Date().getHours()}`;
    
    const cachedStats = await cacheService.get(cacheKey);
    if (cachedStats) {
      return res.json(cachedStats);
    }

    const [
      totalCourses,
      coursesByCategory,
      coursesByLevel,
      coursesByStatus,
      averagePrice,
      recentCourses,
      topRatedCourses
    ] = await Promise.all([
      Course.countDocuments(),
      
      // Courses by category
      Course.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Courses by level
      Course.aggregate([
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Courses by status
      Course.aggregate([
        { $group: { _id: { $cond: ['$isPublished', 'published', 'draft'] }, count: { $sum: 1 } } }
      ]),
      
      // Average price
      Course.aggregate([
        { $group: { _id: null, avgPrice: { $avg: '$price' } } }
      ]).then(result => result[0]?.avgPrice || 0),
      
      // Recent courses
      Course.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title instructor category level price isPublished createdAt'),
      
      // Top rated courses
      Course.aggregate([
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'courseId',
            as: 'ratings'
          }
        },
        {
          $addFields: {
            avgRating: { $avg: '$ratings.rating' },
            ratingCount: { $size: '$ratings' }
          }
        },
        { $match: { ratingCount: { $gte: 1 } } },
        { $sort: { avgRating: -1, ratingCount: -1 } },
        { $limit: 5 },
        { $project: { title: 1, instructor: 1, avgRating: 1, ratingCount: 1 } }
      ])
    ]);

    const stats = {
      total: totalCourses,
      byCategory: coursesByCategory,
      byLevel: coursesByLevel,
      byStatus: coursesByStatus,
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      recent: recentCourses,
      topRated: topRatedCourses,
      timestamp: new Date().toISOString()
    };

    await cacheService.set(cacheKey, stats, CACHE_TTL.MEDIUM);
    res.json(stats);
  } catch (error) {
    console.error('Course stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch course statistics',
      message: error.message 
    });
  }
};

/**
 * Get enrollment statistics with caching
 */
export const getEnrollmentStats = async (req, res) => {
  try {
    const cacheKey = `${CACHE_KEYS.ENROLLMENTS}:stats:${new Date().getHours()}`;
    
    const cachedStats = await cacheService.get(cacheKey);
    if (cachedStats) {
      return res.json(cachedStats);
    }

    const [
      totalEnrollments,
      enrollmentsByMonth,
      enrollmentsByCourse,
      recentEnrollments,
      completionStats
    ] = await Promise.all([
      Enrollment.countDocuments(),
      
      // Enrollments by month (last 6 months)
      Enrollment.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top courses by enrollments
      Enrollment.aggregate([
        {
          $group: {
            _id: '$courseId',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        {
          $project: {
            title: '$course.title',
            instructor: '$course.instructor',
            enrollmentCount: '$count'
          }
        }
      ]),
      
      // Recent enrollments
      Enrollment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .populate('courseId', 'title'),
      
      // Completion statistics
      Enrollment.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
            },
            averageProgress: { $avg: '$progress' }
          }
        }
      ]).then(result => result[0] || { total: 0, completed: 0, inProgress: 0, averageProgress: 0 })
    ]);

    const stats = {
      total: totalEnrollments,
      byMonth: enrollmentsByMonth,
      topCourses: enrollmentsByCourse,
      recent: recentEnrollments,
      completion: {
        ...completionStats,
        completionRate: completionStats.total > 0 ? 
          ((completionStats.completed / completionStats.total) * 100).toFixed(1) : 0,
        averageProgress: parseFloat(completionStats.averageProgress.toFixed(1))
      },
      timestamp: new Date().toISOString()
    };

    await cacheService.set(cacheKey, stats, CACHE_TTL.MEDIUM);
    res.json(stats);
  } catch (error) {
    console.error('Enrollment stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch enrollment statistics',
      message: error.message 
    });
  }
};

export default {
  getDashboardStats,
  getUserStats,
  getCourseStats,
  getEnrollmentStats
};
