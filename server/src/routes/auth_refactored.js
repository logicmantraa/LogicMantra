import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  updatePassword,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword
} from '../controllers/authController_refactored.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  registerSchema,
  verifyOTPSchema,
  resendOTPSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  updatePasswordSchema
} from '../validators/authValidator.js';

const router = express.Router();

// Public routes with validation
router.post('/register', validateBody(registerSchema), registerUser);
router.post('/verify-otp', validateBody(verifyOTPSchema), verifyOTP);
router.post('/resend-otp', validateBody(resendOTPSchema), resendOTP);
router.post('/login', validateBody(loginSchema), loginUser);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

// Protected routes with validation
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, validateBody(updateProfileSchema), updateUserProfile);
router.put('/update-password', protect, validateBody(updatePasswordSchema), updatePassword);

export default router;
