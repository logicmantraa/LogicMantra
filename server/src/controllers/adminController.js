import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Rating from '../models/Rating.js';

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Total courses
    const totalCourses = await Course.countDocuments();
    
    // Total enrollments
    const totalEnrollments = await Enrollment.countDocuments();
    
    // User growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Course popularity (top 5 by enrollments)
    const popularCourses = await Course.find()
      .sort({ enrolledCount: -1 })
      .limit(5)
      .select('title enrolledCount rating');
    
    // Top rated courses
    const topRatedCourses = await Course.find()
      .sort({ rating: -1 })
      .limit(5)
      .select('title rating totalRatings');
    
    // Recent enrollments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: sevenDaysAgo }
    });
    
    // Total revenue (for future - currently 0)
    const totalRevenue = 0;
    
    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      newUsers,
      recentEnrollments,
      totalRevenue,
      popularCourses,
      topRatedCourses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

