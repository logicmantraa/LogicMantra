import express from 'express';
import {
  submitRating,
  getCourseRatings,
  getMyRating,
  updateRating,
  deleteRating
} from '../controllers/ratingController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { 
  checkEnrollmentAccess 
} from '../middleware/checkOwnership.js';
import { 
  checkRatingOwnership 
} from '../middleware/checkOwnership.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateMiddleware.js';
import { sanitizeRatingInput } from '../middleware/sanitizeInput.js';
import {
  submitRatingSchema,
  updateRatingSchema,
  ratingFilterSchema,
  ratingIdParamSchema,
  courseIdParamSchema
} from '../validators/ratingValidator.js';

const router = express.Router();

// Rating operations with authentication and validation
router.route('/')
  .post(
    requireAuth(),
    sanitizeRatingInput,
    validateBody(submitRatingSchema),
    submitRating
  );

// Course rating routes with validation
router.get('/course/:courseId', 
  validateParams(courseIdParamSchema),
  validateQuery(ratingFilterSchema),
  getCourseRatings
);

router.get('/course/:courseId/my-rating', 
  requireAuth(),
  validateParams(courseIdParamSchema),
  getMyRating
);

// Individual rating operations with ownership checks
router.route('/:id')
  .put(
    requireAuth(),
    validateParams(ratingIdParamSchema),
    sanitizeRatingInput,
    validateBody(updateRatingSchema),
    checkRatingOwnership(),
    updateRating
  )
  .delete(
    requireAuth(),
    validateParams(ratingIdParamSchema),
    checkRatingOwnership(),
    deleteRating
  );

export default router;
