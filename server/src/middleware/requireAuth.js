import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import UnauthorizedError from '../errors/UnauthorizedError.js';
import ForbiddenError from '../errors/ForbiddenError.js';

/**
 * requireAuth - Enhanced authentication middleware
 * Replaces basic auth middleware with comprehensive authentication checks
 */

/**
 * Basic authentication middleware
 * @param {Object} options - Authentication options
 * @returns {Function} Express middleware function
 */
export const requireAuth = (options = {}) => {
  const { 
    requireEmailVerification = false,
    checkAccountStatus = true,
    optional = false 
  } = options;

  return async (req, res, next) => {
    try {
      let token;

      // Check for token in Authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      // Handle optional authentication
      if (optional && !token) {
        req.user = null;
        return next();
      }

      // Require token for non-optional authentication
      if (!token) {
        throw UnauthorizedError.missingToken();
      }

      // Verify token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || 'logicmantraa',
        audience: process.env.JWT_AUDIENCE || 'logicmantraa-users',
      });

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        throw UnauthorizedError.invalidToken('User not found');
      }

      // Check email verification if required
      if (requireEmailVerification && !user.emailVerified) {
        throw UnauthorizedError.accountNotVerified(user.email);
      }

      // Check account status if required
      if (checkAccountStatus) {
        // Check if account is disabled/suspended
        if (user.isDisabled) {
          throw ForbiddenError.accountDisabled('Account has been disabled');
        }

        // Check if account is suspended
        if (user.isSuspended) {
          throw ForbiddenError.accountSuspended('Account has been suspended');
        }
      }

      // Attach user to request
      req.user = user;
      req.token = token;

      next();
    } catch (error) {
      // Handle JWT errors
      if (error.name === 'JsonWebTokenError') {
        return next(UnauthorizedError.malformedToken());
      }
      
      if (error.name === 'TokenExpiredError') {
        return next(UnauthorizedError.expiredToken());
      }

      if (error.name === 'NotBeforeError') {
        return next(UnauthorizedError.invalidToken('Token not active yet'));
      }

      next(error);
    }
  };
};

/**
 * Authentication middleware with email verification required
 * @returns {Function} Express middleware function
 */
export const requireVerifiedAuth = () => {
  return requireAuth({ requireEmailVerification: true });
};

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require authentication
 * @returns {Function} Express middleware function
 */
export const optionalAuth = () => {
  return requireAuth({ optional: true });
};

/**
 * Authentication middleware for specific user roles
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    // First authenticate user
    requireAuth()(req, res, (err) => {
      if (err) return next(err);

      // Check if user has required role
      const userRole = req.user.isAdmin ? 'admin' : 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return next(ForbiddenError.insufficientPermissions(
          'access this resource',
          allowedRoles.join(' or '),
          userRole
        ));
      }

      next();
    });
  };
};

/**
 * Authentication middleware for admin users only
 * @returns {Function} Express middleware function
 */
export const requireAdminAuth = () => {
  return requireRole(['admin']);
};

/**
 * Authentication middleware with subscription check
 * @param {string} subscriptionType - Required subscription type
 * @returns {Function} Express middleware function
 */
export const requireSubscription = (subscriptionType = 'premium') => {
  return async (req, res, next) => {
    // First authenticate user
    requireAuth()(req, res, async (err) => {
      if (err) return next(err);

      try {
        // Check if user has active subscription
        const hasSubscription = req.user.hasSubscription && 
          (!req.user.subscriptionExpiresAt || new Date() < req.user.subscriptionExpiresAt);

        if (!hasSubscription) {
          return next(ForbiddenError.subscriptionRequired(
            'access this feature',
            subscriptionType
          ));
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

/**
 * Authentication middleware with custom validation
 * @param {Function} validator - Custom validation function
 * @returns {Function} Express middleware function
 */
export const requireAuthWithValidation = (validator) => {
  return async (req, res, next) => {
    // First authenticate user
    requireAuth()(req, res, async (err) => {
      if (err) return next(err);

      try {
        // Run custom validation
        const isValid = await validator(req.user, req);
        
        if (!isValid) {
          return next(ForbiddenError.insufficientPermissions(
            'access this resource',
            'custom validation',
            'validation failed'
          ));
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

/**
 * Refresh token middleware
 * Validates and refreshes user token if needed
 * @returns {Function} Express middleware function
 */
export const refreshTokenAuth = () => {
  return async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw UnauthorizedError.missingToken();
      }

      // Verify refresh token
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET environment variable is required');
      }
      
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
        issuer: process.env.JWT_ISSUER || 'logicmantraa',
        audience: process.env.JWT_AUDIENCE || 'logicmantraa-users',
      });
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        throw UnauthorizedError.invalidToken('User not found');
      }

      // Generate new access token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      
      const newToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '15m',
          issuer: process.env.JWT_ISSUER || 'logicmantraa',
          audience: process.env.JWT_AUDIENCE || 'logicmantraa-users',
        }
      );

      req.user = user;
      req.newToken = newToken;

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(UnauthorizedError.malformedToken());
      }
      
      if (error.name === 'TokenExpiredError') {
        return next(UnauthorizedError.sessionExpired());
      }

      next(error);
    }
  };
};

// Default export
export default requireAuth;
