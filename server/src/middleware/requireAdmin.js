import ForbiddenError from '../errors/ForbiddenError.js';
import UnauthorizedError from '../errors/UnauthorizedError.js';

/**
 * requireAdmin - Admin authorization middleware
 * Handles admin-specific authorization and permission checks
 */

/**
 * Basic admin authorization middleware
 * @param {Object} options - Admin options
 * @returns {Function} Express middleware function
 */
export const requireAdmin = (options = {}) => {
  const { 
    allowSuperAdmin = true,
    checkPermissions = null 
  } = options;

  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(UnauthorizedError.missingToken());
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return next(ForbiddenError.adminOnly());
    }

    // Additional permission checks if specified
    if (checkPermissions && typeof checkPermissions === 'function') {
      const hasPermission = checkPermissions(req.user, req);
      
      if (!hasPermission) {
        return next(ForbiddenError.insufficientPermissions(
          'perform this admin action',
          'admin with specific permissions',
          'insufficient admin permissions'
        ));
      }
    }

    // Attach admin context to request
    req.isAdminContext = true;
    req.adminPermissions = {
      canManageUsers: true,
      canManageCourses: true,
      canManageEnrollments: true,
      canManageRatings: true,
      canViewAnalytics: true,
      canManageSystem: allowSuperAdmin
    };

    next();
  };
};

/**
 * Super admin authorization middleware
 * Only allows super admin users (highest privilege level)
 * @returns {Function} Express middleware function
 */
export const requireSuperAdmin = () => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(UnauthorizedError.missingToken());
    }

    // Check if user is super admin
    if (!req.user.isSuperAdmin) {
      return next(ForbiddenError.insufficientPermissions(
        'access super admin features',
        'super admin',
        req.user.isAdmin ? 'admin' : 'user'
      ));
    }

    // Attach super admin context
    req.isSuperAdminContext = true;
    req.adminPermissions = {
      canManageUsers: true,
      canManageCourses: true,
      canManageEnrollments: true,
      canManageRatings: true,
      canViewAnalytics: true,
      canManageSystem: true,
      canManageAdmins: true,
      canAccessSystemLogs: true,
      canManageSettings: true
    };

    next();
  };
};

/**
 * Admin with specific permissions middleware
 * @param {Array} requiredPermissions - Array of required permissions
 * @returns {Function} Express middleware function
 */
export const requireAdminPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    // First check if user is admin
    requireAdmin()(req, res, (err) => {
      if (err) return next(err);

      // Check if user has required permissions
      const userPermissions = req.user.adminPermissions || [];
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return next(ForbiddenError.insufficientPermissions(
          'perform this admin action',
          `admin with permissions: ${requiredPermissions.join(', ')}`,
          `admin with permissions: ${userPermissions.join(', ')}`
        ));
      }

      next();
    });
  };
};

/**
 * Admin action logging middleware
 * Logs all admin actions for audit trail
 * @param {string} action - Action description
 * @returns {Function} Express middleware function
 */
export const logAdminAction = (action) => {
  return (req, res, next) => {
    // Ensure user is admin
    requireAdmin()(req, res, (err) => {
      if (err) return next(err);

      // Log admin action
      const logData = {
        action,
        adminId: req.user._id,
        adminEmail: req.user.email,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query
      };

      console.log('Admin Action:', JSON.stringify(logData, null, 2));

      // Attach log data to request for potential use
      req.adminActionLog = logData;

      next();
    });
  };
};

/**
 * Admin resource access middleware
 * Checks if admin can access specific resource type
 * @param {string} resourceType - Type of resource
 * @returns {Function} Express middleware function
 */
export const requireAdminResourceAccess = (resourceType) => {
  return (req, res, next) => {
    // First check if user is admin
    requireAdmin()(req, res, (err) => {
      if (err) return next(err);

      // Check admin permissions for resource type
      const resourcePermissions = {
        'users': ['canManageUsers'],
        'courses': ['canManageCourses'],
        'enrollments': ['canManageEnrollments'],
        'ratings': ['canManageRatings'],
        'analytics': ['canViewAnalytics'],
        'system': ['canManageSystem']
      };

      const requiredPermissions = resourcePermissions[resourceType];
      
      if (!requiredPermissions) {
        return next(ForbiddenError.insufficientPermissions(
          `access ${resourceType} resources`,
          'valid resource type',
          'invalid resource type'
        ));
      }

      // Check if user has required permissions
      const userPermissions = req.user.adminPermissions || [];
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return next(ForbiddenError.insufficientPermissions(
          `access ${resourceType} resources`,
          `admin with ${requiredPermissions.join(' or ')} permission`,
          'admin with insufficient permissions'
        ));
      }

      // Attach resource context
      req.adminResourceContext = {
        resourceType,
        permissions: requiredPermissions.filter(p => userPermissions.includes(p))
      };

      next();
    });
  };
};

/**
 * Admin rate limiting middleware
 * More restrictive rate limiting for admin actions
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
export const adminRateLimit = (options = {}) => {
  const { 
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many admin requests, please try again later'
  } = options;

  // Simple in-memory rate limiter for demonstration
  // In production, use Redis or other distributed store
  const requests = new Map();

  return (req, res, next) => {
    // First check if user is admin
    requireAdmin()(req, res, (err) => {
      if (err) return next(err);

      const key = `admin:${req.user._id}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing requests for this admin
      const userRequests = requests.get(key) || [];
      
      // Remove expired requests
      const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
      
      // Check rate limit
      if (validRequests.length >= max) {
        return next(ForbiddenError.rateLimited('admin action', Math.ceil(windowMs / 1000)));
      }

      // Add current request
      validRequests.push(now);
      requests.set(key, validRequests);

      // Clean up old entries periodically
      if (Math.random() < 0.01) { // 1% chance to clean up
        for (const [k, v] of requests.entries()) {
          if (v.length === 0 || v[0] < windowStart) {
            requests.delete(k);
          }
        }
      }

      next();
    });
  };
};

/**
 * Admin session validation middleware
 * Ensures admin session is still valid and secure
 * @returns {Function} Express middleware function
 */
export const validateAdminSession = () => {
  return (req, res, next) => {
    // First check if user is admin
    requireAdmin()(req, res, (err) => {
      if (err) return next(err);

      // Check session age (if using session-based admin access)
      if (req.session && req.session.adminLoginAt) {
        const sessionAge = Date.now() - new Date(req.session.adminLoginAt).getTime();
        const maxSessionAge = 2 * 60 * 60 * 1000; // 2 hours

        if (sessionAge > maxSessionAge) {
          return next(UnauthorizedError.sessionExpired());
        }
      }

      // Check for suspicious activity
      if (req.user.lastLoginIP && req.user.lastLoginIP !== req.ip) {
        // Log suspicious activity but allow for now
        console.warn('Admin IP change detected:', {
          adminId: req.user._id,
          oldIP: req.user.lastLoginIP,
          newIP: req.ip,
          timestamp: new Date().toISOString()
        });
      }

      next();
    });
  };
};

// Default export
export default requireAdmin;
