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
import { adminRateLimit } from '../middleware/rateLimiter.js';
import {
  createCourseSchema,
  updateCourseSchema,
  courseFilterSchema,
  courseIdParamSchema
} from '../validators/courseValidator.js';

const router = express.Router();

// Public course listing with query validation
router.route('/')
  .get(
    validateQuery(courseFilterSchema),
    getCourses
  )
  .post(
    requireAdminAuth(),
    adminRateLimit(),
    sanitizeCourseInput,
    validateBody(createCourseSchema),
    createCourse
  );

// Course operations with parameter validation and ownership checks
router.route('/:id')
  .get(
    validateParams(courseIdParamSchema),
    getCourseById
  )
  .put(
    requireAuth(),
    checkCourseOwnership({ allowInstructor: true, allowAdmin: true }),
    sanitizeCourseInput,
    validateParams(courseIdParamSchema),
    validateBody(updateCourseSchema),
    updateCourse
  )
  .delete(
    requireAuth(),
    checkCourseOwnership({ allowInstructor: false, allowAdmin: true }),
    validateParams(courseIdParamSchema),
    deleteCourse
  );

export default router;
