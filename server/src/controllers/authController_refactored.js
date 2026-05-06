import AuthService from '../services/AuthService.js';
import { errorHandler } from '../middleware/errorHandler.js';

/**
 * AuthController - Handles HTTP requests for authentication
 * Refactored to use service layer for clean architecture
 * Controller only handles HTTP concerns, business logic is in AuthService
 */

// @desc    Register a new user (Stage 1: Send OTP)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Controller only extracts data and calls service
    const result = await AuthService.registerUser({ name, email, password, phoneNumber });
    
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// @desc    Verify OTP & Complete Registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Controller only extracts data and calls service
    const result = await AuthService.verifyOTP({ email, otp });
    
    res.status(201).json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// @desc    Resend OTP for registration
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Controller only extracts data and calls service
    const result = await AuthService.resendOTP(email);
    
    res.json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Controller only extracts data and calls service
    const result = await AuthService.loginUser({ email, password });
    
    res.json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// @desc    Forgot Password (Stage 1: Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Controller only extracts data and calls service
    const result = await AuthService.forgotPassword(email);
    
    res.json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// @desc    Reset Password (Stage 2: Verify OTP & Update)
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Controller only extracts data and calls service
    const result = await AuthService.resetPassword({ email, otp, newPassword });
    
    res.json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    // User ID comes from middleware (req.user._id)
    const userId = req.user._id;

    // Controller only passes user ID to service
    const result = await AuthService.getUserProfile(userId);
    
    res.json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // Controller only extracts data and calls service
    const result = await AuthService.updateUserProfile(userId, updateData);
    
    res.json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const passwordData = req.body;

    // Controller only extracts data and calls service
    const result = await AuthService.updatePassword(userId, passwordData);
    
    res.json(result);
  } catch (error) {
    errorHandler(error, req, res);
  }
};
