import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    res.json(user);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Check if user is subscribed (has paid course enrollments or active subscription)
// @route   GET /api/users/check-subscription
// @access  Private
export const checkSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user has active subscription
    const user = await User.findById(userId);
    if (user.hasSubscription && user.subscriptionExpiresAt && new Date() < user.subscriptionExpiresAt) {
      return res.json({ isSubscribed: true, reason: 'active_subscription' });
    }
    
    // Check if user has enrolled in any paid courses
    const enrollments = await Enrollment.find({ userId }).populate('courseId');
    const hasPaidEnrollment = enrollments.some(
      enrollment => enrollment.courseId && !enrollment.courseId.isFree && enrollment.courseId.price > 0
    );
    
    if (hasPaidEnrollment) {
      return res.json({ isSubscribed: true, reason: 'paid_course_enrollment' });
    }
    
    res.json({ isSubscribed: false, reason: 'no_paid_content' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};
