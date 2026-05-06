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
import { 
  requireAuth, 
  requireVerifiedAuth
} from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { sanitizeUserInput } from '../middleware/sanitizeInput.js';
import { 
  registrationRateLimit,
  authRateLimit,
  otpRateLimit,
  passwordResetRateLimit
} from '../middleware/security.js';
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

// Public routes with strict rate limiting, validation, and sanitization
router.post('/register', 
  registrationRateLimit,
  sanitizeUserInput,
  validateBody(registerSchema),
  registerUser
);

router.post('/verify-otp', 
  otpRateLimit,
  sanitizeUserInput,
  validateBody(verifyOTPSchema),
  verifyOTP
);

router.post('/resend-otp', 
  otpRateLimit,
  sanitizeUserInput,
  validateBody(resendOTPSchema),
  resendOTP
);

router.post('/login', 
  authRateLimit,
  sanitizeUserInput,
  validateBody(loginSchema),
  loginUser
);

router.post('/forgot-password', 
  passwordResetRateLimit,
  sanitizeUserInput,
  validateBody(forgotPasswordSchema),
  forgotPassword
);

router.post('/reset-password', 
  passwordResetRateLimit,
  sanitizeUserInput,
  validateBody(resetPasswordSchema),
  resetPassword
);

// Protected routes with authentication
router.get('/profile', 
  requireAuth({ requireEmailVerification: true }), 
  getUserProfile
);

router.put('/profile', 
  requireAuth({ requireEmailVerification: true }),
  sanitizeUserInput,
  validateBody(updateProfileSchema),
  updateUserProfile
);

router.put('/update-password', 
  requireAuth({ requireEmailVerification: true }),
  sanitizeUserInput,
  validateBody(updatePasswordSchema),
  updatePassword
);

export default router;
