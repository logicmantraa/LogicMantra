import express from 'express';
import {
  getCart,
  addItemToCart,
  removeItemFromCart,
  clearCart,
  getCartTotal
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.post('/add-item', addItemToCart);
router.delete('/remove-item/:cartItemId', removeItemFromCart);
router.get('/total', getCartTotal);

export default router;

