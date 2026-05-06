import ForbiddenError from '../errors/ForbiddenError.js';
import NotFoundError from '../errors/NotFoundError.js';
import UnauthorizedError from '../errors/UnauthorizedError.js';

/**
 * checkOwnership - Generic ownership checking middleware
 * Handles resource ownership validation across different resource types
 */

/**
 * Generic ownership checking middleware
 * @param {Object} options - Ownership check options
 * @returns {Function} Express middleware function
 */
export const checkOwnership = (options = {}) => {
  const {
    resourceType,
    resourceIdParam = 'id',
    ownerField = 'userId',
    allowAdmin = true,
    customOwnershipCheck = null
  } = options;

  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(UnauthorizedError.missingToken());
      }

      // Get resource ID from request parameters
      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return next(NotFoundError.resource(resourceType, 'missing ID'));
      }

      // Allow admin access if specified
      if (allowAdmin && req.user.isAdmin) {
        req.ownershipContext = {
          isOwner: true,
          accessBy: 'admin',
          resourceType,
          resourceId
        };
        return next();
      }

      // Get the appropriate model based on resource type
      const Model = getModelForResourceType(resourceType);
      if (!Model) {
        return next(NotFoundError.resource(resourceType, resourceId));
      }

      // Find the resource
      const resource = await Model.findById(resourceId);
      if (!resource) {
        return next(NotFoundError.resource(resourceType, resourceId));
      }

      // Check ownership
      let isOwner = false;
      
      if (customOwnershipCheck && typeof customOwnershipCheck === 'function') {
        // Use custom ownership check
        isOwner = await customOwnershipCheck(resource, req.user, req);
      } else {
        // Default ownership check
        isOwner = checkDefaultOwnership(resource, req.user, ownerField);
      }

      if (!isOwner) {
        return next(ForbiddenError.resourceOwnership(
          resourceType,
          resource[ownerField] || 'unknown',
          req.user._id
        ));
      }

      // Attach ownership context to request
      req.ownershipContext = {
        isOwner: true,
        accessBy: 'owner',
        resourceType,
        resourceId,
        resource
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check ownership for enrollment resources
 * @param {Object} options - Enrollment ownership options
 * @returns {Function} Express middleware function
 */
export const checkEnrollmentOwnership = (options = {}) => {
  const { resourceIdParam = 'id' } = options;

  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(UnauthorizedError.missingToken());
      }

      const enrollmentId = req.params[resourceIdParam];
      if (!enrollmentId) {
        return next(NotFoundError.enrollment('missing ID'));
      }

      // Import Enrollment model dynamically to avoid circular dependencies
      const { default: Enrollment } = await import('../models/Enrollment.js');
      
      // Find enrollment with course data
      const enrollment = await Enrollment.findById(enrollmentId).populate('courseId');
      if (!enrollment) {
        return next(NotFoundError.enrollment(enrollmentId));
      }

      // Check ownership (user must own the enrollment)
      const isOwner = enrollment.userId.toString() === req.user._id.toString();
      
      // Allow admin access
      const isAdmin = req.user.isAdmin;

      if (!isOwner && !isAdmin) {
        return next(ForbiddenError.enrollmentAccess(
          enrollmentId,
          'not owner'
        ));
      }

      // Attach ownership context
      req.ownershipContext = {
        isOwner: true,
        accessBy: isAdmin ? 'admin' : 'owner',
        resourceType: 'enrollment',
        resourceId: enrollmentId,
        resource: enrollment
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check ownership for rating resources
 * @param {Object} options - Rating ownership options
 * @returns {Function} Express middleware function
 */
export const checkRatingOwnership = (options = {}) => {
  const { resourceIdParam = 'id' } = options;

  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(UnauthorizedError.missingToken());
      }

      const ratingId = req.params[resourceIdParam];
      if (!ratingId) {
        return next(NotFoundError.rating('missing ID'));
      }

      // Import Rating model dynamically
      const { default: Rating } = await import('../models/Rating.js');
      
      // Find rating
      const rating = await Rating.findById(ratingId);
      if (!rating) {
        return next(NotFoundError.rating(ratingId));
      }

      // Check ownership
      const isOwner = rating.userId.toString() === req.user._id.toString();
      const isAdmin = req.user.isAdmin;

      if (!isOwner && !isAdmin) {
        return next(ForbiddenError.ratingAccess(
          ratingId,
          'not owner'
        ));
      }

      // Attach ownership context
      req.ownershipContext = {
        isOwner: true,
        accessBy: isAdmin ? 'admin' : 'owner',
        resourceType: 'rating',
        resourceId: ratingId,
        resource: rating
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check ownership for course resources (instructor or admin)
 * @param {Object} options - Course ownership options
 * @returns {Function} Express middleware function
 */
export const checkCourseOwnership = (options = {}) => {
  const { 
    resourceIdParam = 'id',
    allowInstructor = true,
    allowAdmin = true 
  } = options;

  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(UnauthorizedError.missingToken());
      }

      const courseId = req.params[resourceIdParam];
      if (!courseId) {
        return next(NotFoundError.course('missing ID'));
      }

      // Import Course model dynamically
      const { default: Course } = await import('../models/Course.js');
      
      // Find course
      const course = await Course.findById(courseId);
      if (!course) {
        return next(NotFoundError.course(courseId));
      }

      // Check ownership
      let isOwner = false;
      let accessBy = null;

      // Admin access
      if (allowAdmin && req.user.isAdmin) {
        isOwner = true;
        accessBy = 'admin';
      }
      // Instructor access
      else if (allowInstructor && course.instructor === req.user.name) {
        isOwner = true;
        accessBy = 'instructor';
      }
      // Owner access (if course has owner field)
      else if (course.userId && course.userId.toString() === req.user._id.toString()) {
        isOwner = true;
        accessBy = 'owner';
      }

      if (!isOwner) {
        return next(ForbiddenError.resourceOwnership(
          'Course',
          course.instructor || 'unknown',
          req.user._id
        ));
      }

      // Attach ownership context
      req.ownershipContext = {
        isOwner: true,
        accessBy,
        resourceType: 'course',
        resourceId: courseId,
        resource: course
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check user ownership (user can only access their own resources)
 * @param {Object} options - User ownership options
 * @returns {Function} Express middleware function
 */
export const checkUserOwnership = (options = {}) => {
  const { resourceIdParam = 'id' } = options;

  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(UnauthorizedError.missingToken());
      }

      const targetUserId = req.params[resourceIdParam];
      if (!targetUserId) {
        return next(NotFoundError.user('missing ID'));
      }

      // Check if user is accessing their own resource or is admin
      const isOwner = targetUserId === req.user._id.toString() || req.user.isAdmin;

      if (!isOwner) {
        return next(ForbiddenError.resourceOwnership(
          'User',
          targetUserId,
          req.user._id
        ));
      }

      // Attach ownership context
      req.ownershipContext = {
        isOwner: true,
        accessBy: req.user.isAdmin ? 'admin' : 'owner',
        resourceType: 'user',
        resourceId: targetUserId
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check enrollment access (user must be enrolled in course)
 * @param {Object} options - Enrollment access options
 * @returns {Function} Express middleware function
 */
export const checkEnrollmentAccess = (options = {}) => {
  const { courseIdParam = 'courseId' } = options;

  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(UnauthorizedError.missingToken());
      }

      const courseId = req.params[courseIdParam];
      if (!courseId) {
        return next(NotFoundError.course('missing ID'));
      }

      // Allow admin access
      if (req.user.isAdmin) {
        req.ownershipContext = {
          isOwner: true,
          accessBy: 'admin',
          resourceType: 'course',
          resourceId: courseId
        };
        return next();
      }

      // Import Enrollment model dynamically
      const { default: Enrollment } = await import('../models/Enrollment.js');
      
      // Check if user is enrolled in the course
      const enrollment = await Enrollment.findOne({
        userId: req.user._id,
        courseId: courseId
      });

      if (!enrollment) {
        return next(ForbiddenError.courseAccess(
          courseId,
          'not enrolled'
        ));
      }

      // Attach ownership context
      req.ownershipContext = {
        isOwner: true,
        accessBy: 'enrollment',
        resourceType: 'course',
        resourceId: courseId,
        enrollment
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to get model for resource type
 * @param {string} resourceType - Type of resource
 * @returns {Object|null} Mongoose model or null
 */
function getModelForResourceType(resourceType) {
  const models = {
    'user': null, // Handle separately
    'course': null, // Handle separately
    'enrollment': null, // Handle separately
    'rating': null, // Handle separately
    'lecture': null, // Handle separately
    'resource': null, // Handle separately
    'contact': null, // Handle separately
    'storeItem': null // Handle separately
  };

  return models[resourceType] || null;
}

/**
 * Helper function for default ownership check
 * @param {Object} resource - Resource object
 * @param {Object} user - User object
 * @param {string} ownerField - Field name for owner
 * @returns {boolean} Whether user owns the resource
 */
function checkDefaultOwnership(resource, user, ownerField) {
  if (!resource[ownerField]) {
    return false;
  }

  // Handle different owner field types
  const ownerId = resource[ownerField].toString ? 
    resource[ownerField].toString() : 
    resource[ownerField];

  return ownerId === user._id.toString();
}

// Default export
export default checkOwnership;
