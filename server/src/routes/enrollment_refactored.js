import express from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  updateProgress,
  checkEnrollment
} from '../controllers/enrollmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody, validateParams } from '../middleware/validateMiddleware.js';
import {
  enrollInCourseSchema,
  updateProgressSchema,
  checkEnrollmentSchema,
  enrollmentIdParamSchema,
  courseIdParamSchema
} from '../validators/enrollmentValidator.js';

const router = express.Router();

// Enrollment operations with validation
router.route('/')
  .post(protect, validateBody(enrollInCourseSchema), enrollInCourse);

// Protected enrollment routes
router.get('/my-courses', protect, getMyEnrollments);
router.get('/check/:courseId', protect, validateParams(courseIdParamSchema), checkEnrollment);
router.put('/:id/progress', protect, validateParams(enrollmentIdParamSchema), validateBody(updateProgressSchema), updateProgress);

export default router;
