import express from 'express';
import {
  getStoreItems,
  getStoreItemById,
  createStoreItem,
  updateStoreItem,
  deleteStoreItem,
  purchaseStoreItem
} from '../controllers/storeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getStoreItems)
  .post(protect, admin, createStoreItem);

router.route('/:id')
  .get(getStoreItemById)
  .put(protect, admin, updateStoreItem)
  .delete(protect, admin, deleteStoreItem);

router.post('/:id/purchase', protect, purchaseStoreItem);

export default router;

