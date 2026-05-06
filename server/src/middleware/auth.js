import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware - JWT-based authentication
 * Provides protect, optionalAuth, and admin middleware
 */

/**
 * Protect route - requires authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_should_be_changed');

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: 'INVALID_TOKEN'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
      error: 'NO_TOKEN'
    });
  }
};

/**
 * Optional authentication - sets req.user if token is valid, but doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_should_be_changed');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Silently fail - user is not authenticated but can still proceed
      req.user = null;
    }
  }
  
  next();
};

/**
 * Admin middleware - requires authentication and admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as an admin',
      error: 'ADMIN_REQUIRED'
    });
  }
};

/**
 * Check if user owns the resource
 * @param {string} resourceField - Field name containing the owner ID
 * @returns {Function} Middleware function
 */
export const checkOwnership = (resourceField) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }

    const resourceOwnerId = req.body[resourceField] || req.params[resourceField];
    
    if (resourceOwnerId && req.user.id.toString() !== resourceOwnerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
        error: 'OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};

export default {
  protect,
  optionalAuth,
  admin,
  checkOwnership
};
