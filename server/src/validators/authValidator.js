import { z } from 'zod';

/**
 * AuthValidator - Zod schemas for authentication validation
 * Centralizes all authentication input validation logic
 */

// Common email validation pattern
const emailSchema = z
  .string()
  .email('Please provide a valid email address')
  .min(1, 'Email is required')
  .max(100, 'Email must be less than 100 characters')
  .transform(email => email.toLowerCase().trim());

// Password validation
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .max(128, 'Password must be less than 128 characters');

// Name validation
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must be less than 50 characters')
  .trim();

// Phone number validation (optional)
const phoneNumberSchema = z
  .string()
  .max(20, 'Phone number must be less than 20 characters')
  .regex(/^[+]?[\d\s\-\(\)]+$/, 'Phone number can only contain digits, spaces, hyphens, and parentheses')
  .optional()
  .transform(phone => phone ? phone.trim() : '');

// OTP validation
const otpSchema = z
  .string()
  .min(6, 'OTP must be 6 digits')
  .max(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain exactly 6 digits');

/**
 * Registration validation schema
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phoneNumber: phoneNumberSchema
});

/**
 * OTP verification schema
 */
export const verifyOTPSchema = z.object({
  email: emailSchema,
  otp: otpSchema
});

/**
 * Resend OTP schema
 */
export const resendOTPSchema = z.object({
  email: emailSchema
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  newPassword: passwordSchema
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phoneNumber: phoneNumberSchema.optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Update password schema
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

/**
 * Schema exports for use in validation middleware
 */
