import express from 'express';
import {
  submitRating,
  getProductRatings,
  getMyRating,
  updateRating,
  deleteRating
} from '../controllers/ratingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, submitRating);

router.get('/product/:productId', getProductRatings);
router.get('/product/:productId/my-rating', protect, getMyRating);

router.route('/:id')
  .put(protect, updateRating)
  .delete(protect, deleteRating);

export default router;

