import express from 'express';
import {
  submitRating,
  getCourseRatings,
  getMyRating,
  updateRating,
  deleteRating
} from '../controllers/ratingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateMiddleware.js';
import {
  submitRatingSchema,
  updateRatingSchema,
  ratingFilterSchema,
  ratingIdParamSchema,
  courseIdParamSchema
} from '../validators/ratingValidator.js';

const router = express.Router();

// Rating operations with validation
router.route('/')
  .post(protect, validateBody(submitRatingSchema), submitRating);

// Course rating routes with validation
router.get('/course/:courseId', validateParams(courseIdParamSchema), validateQuery(ratingFilterSchema), getCourseRatings);
router.get('/course/:courseId/my-rating', protect, validateParams(courseIdParamSchema), getMyRating);

// Individual rating operations with validation
router.route('/:id')
  .put(protect, validateParams(ratingIdParamSchema), validateBody(updateRatingSchema), updateRating)
  .delete(protect, validateParams(ratingIdParamSchema), deleteRating);

export default router;
