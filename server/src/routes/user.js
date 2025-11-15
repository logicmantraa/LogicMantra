import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser, checkSubscription } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getUsers);

router.get('/check-subscription', protect, checkSubscription);

router.route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

export default router;