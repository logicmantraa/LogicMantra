import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validateMiddleware.js';
import {
  createCourseSchema,
  updateCourseSchema,
  courseFilterSchema,
  courseIdParamSchema
} from '../validators/courseValidator.js';

const router = express.Router();

// Public course listing with query validation
router.route('/')
  .get(validateQuery(courseFilterSchema), getCourses)
  .post(protect, admin, validateBody(createCourseSchema), createCourse);

// Course operations with parameter validation
router.route('/:id')
  .get(validateParams(courseIdParamSchema), getCourseById)
  .put(protect, admin, validateParams(courseIdParamSchema), validateBody(updateCourseSchema), updateCourse)
  .delete(protect, admin, validateParams(courseIdParamSchema), deleteCourse);

export default router;
