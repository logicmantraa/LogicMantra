import express from 'express';
import {
  createOrderFromCart,
  createDirectOrder,
  verifyPayment,
  getMyOrders,
  getOrderById
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All payment routes require authentication
router.use(protect);

router.post('/create-order', createOrderFromCart);
router.post('/create-direct-order', createDirectOrder);
router.post('/verify-payment', verifyPayment);
router.get('/my-orders', getMyOrders);
router.get('/order/:orderId', getOrderById);

export default router;

