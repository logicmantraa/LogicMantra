import express from 'express';
import {
  submitRating,
  getCourseRatings,
  getMyRating,
  updateRating,
  deleteRating
} from '../controllers/ratingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, submitRating);

router.get('/course/:courseId', getCourseRatings);
router.get('/course/:courseId/my-rating', protect, getMyRating);

router.route('/:id')
  .put(protect, updateRating)
  .delete(protect, deleteRating);

export default router;

