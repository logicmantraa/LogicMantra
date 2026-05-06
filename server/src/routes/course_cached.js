import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { 
  requireAuth,
  requireAdminAuth
} from '../middleware/requireAuth.js';
import { 
  requireAdminResourceAccess 
} from '../middleware/requireAdmin.js';
import { 
  checkCourseOwnership 
} from '../middleware/checkOwnership.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validateMiddleware.js';
import { sanitizeCourseInput } from '../middleware/sanitizeInput.js';
import { adminRateLimit } from '../middleware/security.js';
import {
  cacheCourseList,
  cacheCourseDetail,
  invalidateCourseCache
} from '../middleware/cache.js';
import {
  createCourseSchema,
  updateCourseSchema,
  courseFilterSchema,
  courseIdParamSchema
} from '../validators/courseValidator.js';

const router = express.Router();

// Public course listing with caching and query validation
router.route('/')
  .get(
    cacheCourseList(1800), // Cache for 30 minutes
    validateQuery(courseFilterSchema),
    getCourses
  )
  .post(
    requireAdminAuth(),
    adminRateLimit(),
    invalidateCourseCache(), // Invalidate cache when creating course
    sanitizeCourseInput,
    validateBody(createCourseSchema),
    createCourse
  );

// Course operations with parameter validation, caching, and ownership checks
router.route('/:id')
  .get(
    cacheCourseDetail(1800), // Cache for 30 minutes
    validateParams(courseIdParamSchema),
    getCourseById
  )
  .put(
    requireAuth(),
    checkCourseOwnership({ allowInstructor: true, allowAdmin: true }),
    invalidateCourseCache(), // Invalidate cache when updating course
    sanitizeCourseInput,
    validateParams(courseIdParamSchema),
    validateBody(updateCourseSchema),
    updateCourse
  )
  .delete(
    requireAuth(),
    checkCourseOwnership({ allowInstructor: false, allowAdmin: true }),
    invalidateCourseCache(), // Invalidate cache when deleting course
    validateParams(courseIdParamSchema),
    deleteCourse
  );

export default router;
