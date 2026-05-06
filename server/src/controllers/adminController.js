import User from '../models/User.js';
import Product from '../models/Product.js';
import UserProductAccess from '../models/UserProductAccess.js';
import Rating from '../models/Rating.js';

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Total products
    const totalProducts = await Product.countDocuments();
    
    // Total access
    const totalAccess = await UserProductAccess.countDocuments();
    
    // User growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Product popularity (top 5 by access)
    const popularProducts = await Product.find()
      .sort({ accessCount: -1 })
      .limit(5)
      .select('title accessCount rating');
    
    // Top rated products
    const topRatedProducts = await Product.find()
      .sort({ rating: -1 })
      .limit(5)
      .select('title rating totalRatings');
    
    // Recent access (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAccess = await UserProductAccess.countDocuments({
      addedToLibraryAt: { $gte: sevenDaysAgo }
    });
    
    // Total revenue (for future - currently 0)
    const totalRevenue = 0;
    
    res.json({
      totalUsers,
      totalProducts,
      totalAccess,
      newUsers,
      recentAccess,
      totalRevenue,
      popularProducts,
      topRatedProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

