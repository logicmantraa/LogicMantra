import express from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  updateProgress,
  checkEnrollment
} from '../controllers/enrollmentController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { 
  checkEnrollmentAccess,
  checkEnrollmentOwnership 
} from '../middleware/checkOwnership.js';
import { validateBody, validateParams } from '../middleware/validateMiddleware.js';
import { 
  enrollInCourseSchema,
  updateProgressSchema,
  checkEnrollmentSchema,
  enrollmentIdParamSchema,
  courseIdParamSchema
} from '../validators/enrollmentValidator.js';

const router = express.Router();

// Enrollment operations with authentication and validation
router.route('/')
  .post(
    requireAuth(),
    validateBody(enrollInCourseSchema),
    enrollInCourse
  );

// Protected enrollment routes
router.get('/my-courses', 
  requireAuth(),
  getMyEnrollments
);

router.get('/check/:courseId', 
  requireAuth(),
  validateParams(courseIdParamSchema),
  validateBody(checkEnrollmentSchema),
  checkEnrollment
);

router.put('/:id/progress', 
  requireAuth(),
  validateParams(enrollmentIdParamSchema),
  validateBody(updateProgressSchema),
  checkEnrollmentOwnership(),
  updateProgress
);

export default router;
