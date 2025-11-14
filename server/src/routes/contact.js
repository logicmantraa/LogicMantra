import express from 'express';
import {
  submitContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact
} from '../controllers/contactController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - anyone can submit contact form (optional auth to capture userId if logged in)
router.post('/', optionalAuth, submitContact);

// Admin routes - require authentication and admin role
router.get('/', protect, admin, getContacts);
router.get('/:id', protect, admin, getContactById);
router.put('/:id', protect, admin, updateContactStatus);
router.delete('/:id', protect, admin, deleteContact);

export default router;

