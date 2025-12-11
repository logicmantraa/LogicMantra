import express from 'express';
import {
  getStoreItems,
  getStoreItemById,
  createStoreItem,
  updateStoreItem,
  deleteStoreItem,
  getMyPurchases
} from '../controllers/storeController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getStoreItems) // Optional auth for ownership check
  .post(protect, admin, createStoreItem);

router.route('/:id')
  .get(optionalAuth, getStoreItemById) // Optional auth for ownership check
  .put(protect, admin, updateStoreItem)
  .delete(protect, admin, deleteStoreItem);

router.get('/my-purchases', protect, getMyPurchases);

export default router;

