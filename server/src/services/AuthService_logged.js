import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import PasswordReset from '../models/PasswordReset.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../config/logger.js';
import { BadRequestError } from '../errors/BadRequestError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';

/**
 * Auth Service with comprehensive logging
 * Handles authentication business logic with detailed logging
 */

class AuthService {
  /**
   * Register new user with logging
   */
  static async registerUser(userData) {
    try {
      logger.info('User registration attempt', {
        email: userData.email,
        name: userData.name,
        timestamp: new Date().toISOString()
      });

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        logger.warn('Registration attempt with existing email', {
          email: userData.email,
          existingUserId: existingUser._id,
          timestamp: new Date().toISOString()
        });
        
        throw BadRequestError.duplicate('User', 'email');
      }

      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create pending registration
      const pendingRegistration = await PendingRegistration.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        otp,
        otpExpiry
      });

      // Log successful OTP generation
      logger.info('OTP generated for registration', {
        email: userData.email,
        registrationId: pendingRegistration._id,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, send OTP via email/SMS
      logger.info('OTP would be sent via email', {
        email: userData.email,
        otp: otp, // Only in development
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('user_registration_initiated', {
        email: userData.email,
        name: userData.name,
        registrationId: pendingRegistration._id
      });

      return {
        message: 'Registration initiated. Please verify your email with the OTP sent.',
        registrationId: pendingRegistration._id
      };
    } catch (error) {
      logger.error('User registration failed', error, {
        email: userData.email,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Verify OTP and complete registration
   */
  static async verifyOTP(registrationId, otp) {
    try {
      logger.info('OTP verification attempt', {
        registrationId,
        timestamp: new Date().toISOString()
      });

      const pendingRegistration = await PendingRegistration.findById(registrationId);
      
      if (!pendingRegistration) {
        logger.warn('OTP verification with invalid registration ID', {
          registrationId,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError('pending registration', registrationId);
      }

      if (pendingRegistration.otp !== otp) {
        logger.warn('Invalid OTP provided', {
          registrationId,
          email: pendingRegistration.email,
          timestamp: new Date().toISOString()
        });
        
        throw UnauthorizedError.invalidOTP();
      }

      if (pendingRegistration.otpExpiry < new Date()) {
        logger.warn('OTP verification attempt with expired OTP', {
          registrationId,
          email: pendingRegistration.email,
          otpExpiry: pendingRegistration.otpExpiry,
          timestamp: new Date().toISOString()
        });
        
        throw UnauthorizedError.expiredOTP();
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(pendingRegistration.password, salt);

      // Create user
      const user = await User.create({
        name: pendingRegistration.name,
        email: pendingRegistration.email,
        password: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: new Date()
      });

      // Delete pending registration
      await PendingRegistration.findByIdAndDelete(registrationId);

      // Generate token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
      );

      // Log successful registration
      logger.logAuth('registration_completed', user._id, {
        email: user.email,
        name: user.name,
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('user_registration_completed', {
        userId: user._id,
        email: user.email,
        name: user.name
      });

      return {
        message: 'Registration completed successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          isAdmin: user.isAdmin
        }
      };
    } catch (error) {
      logger.error('OTP verification failed', error, {
        registrationId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Resend OTP
   */
  static async resendOTP(registrationId) {
    try {
      logger.info('OTP resend request', {
        registrationId,
        timestamp: new Date().toISOString()
      });

      const pendingRegistration = await PendingRegistration.findById(registrationId);
      
      if (!pendingRegistration) {
        logger.warn('OTP resend with invalid registration ID', {
          registrationId,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError('pending registration', registrationId);
      }

      // Generate new OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      // Update pending registration
      await PendingRegistration.findByIdAndUpdate(registrationId, {
        otp,
        otpExpiry,
        resendCount: pendingRegistration.resendCount + 1
      });

      // Log OTP resend
      logger.info('OTP resent', {
        registrationId,
        email: pendingRegistration.email,
        resendCount: pendingRegistration.resendCount + 1,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, send OTP via email/SMS
      logger.info('OTP would be resent via email', {
        email: pendingRegistration.email,
        otp: otp, // Only in development
        timestamp: new Date().toISOString()
      });

      return { message: 'OTP resent successfully' };
    } catch (error) {
      logger.error('OTP resend failed', error, {
        registrationId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Login user with logging
   */
  static async loginUser(email, password) {
    try {
      logger.logAuth('login_attempt', null, {
        email,
        timestamp: new Date().toISOString()
      });

      const user = await User.findOne({ email });
      
      if (!user) {
        logger.warn('Login attempt with non-existent email', {
          email,
          timestamp: new Date().toISOString()
        });
        
        throw UnauthorizedError.invalidCredentials();
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        logger.warn('Login attempt with incorrect password', {
          userId: user._id,
          email,
          timestamp: new Date().toISOString()
        });
        
        throw UnauthorizedError.invalidCredentials();
      }

      // Check if email is verified
      if (!user.emailVerified) {
        logger.warn('Login attempt with unverified email', {
          userId: user._id,
          email,
          timestamp: new Date().toISOString()
        });
        
        throw UnauthorizedError.accountNotVerified(email);
      }

      // Check if account is active
      if (user.status === 'inactive') {
        logger.warn('Login attempt with inactive account', {
          userId: user._id,
          email,
          timestamp: new Date().toISOString()
        });
        
        throw UnauthorizedError.accountDisabled();
      }

      // Generate token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
      );

      // Log successful login
      logger.logAuth('login_successful', user._id, {
        email,
        name: user.name,
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('user_login', {
        userId: user._id,
        email,
        name: user.name
      });

      return {
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          isAdmin: user.isAdmin
        }
      };
    } catch (error) {
      logger.error('Login failed', error, {
        email,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Forgot password with logging
   */
  static async forgotPassword(email) {
    try {
      logger.info('Password reset request', {
        email,
        timestamp: new Date().toISOString()
      });

      const user = await User.findOne({ email });
      
      if (!user) {
        logger.warn('Password reset request for non-existent email', {
          email,
          timestamp: new Date().toISOString()
        });
        
        // Don't reveal if email exists or not
        return { message: 'If the email exists, a reset link has been sent' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save password reset
      await PasswordReset.create({
        userId: user._id,
        resetToken,
        resetTokenExpiry
      });

      // Log password reset request
      logger.info('Password reset token generated', {
        userId: user._id,
        email,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, send reset link via email
      logger.info('Password reset link would be sent via email', {
        email,
        resetToken, // Only in development
        timestamp: new Date().toISOString()
      });

      // Log security event
      logger.logSecurity('password_reset_requested', {
        userId: user._id,
        email,
        timestamp: new Date().toISOString()
      });

      return { message: 'If the email exists, a reset link has been sent' };
    } catch (error) {
      logger.error('Password reset request failed', error, {
        email,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Reset password with logging
   */
  static async resetPassword(resetToken, newPassword) {
    try {
      logger.info('Password reset attempt', {
        resetToken: resetToken.substring(0, 8) + '...', // Partial token for logging
        timestamp: new Date().toISOString()
      });

      const passwordReset = await PasswordReset.findOne({
        resetToken,
        resetTokenExpiry: { $gt: new Date() }
      });
      
      if (!passwordReset) {
        logger.warn('Password reset attempt with invalid or expired token', {
          resetToken: resetToken.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        });
        
        throw UnauthorizedError.invalidToken('Password reset token');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user password
      const user = await User.findByIdAndUpdate(
        passwordReset.userId,
        { password: hashedPassword },
        { new: true }
      );

      // Delete password reset record
      await PasswordReset.findByIdAndDelete(passwordReset._id);

      // Log successful password reset
      logger.logAuth('password_reset_successful', user._id, {
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // Log security event
      logger.logSecurity('password_reset_completed', {
        userId: user._id,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('password_reset', {
        userId: user._id,
        email: user.email
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Password reset failed', error, {
        resetToken: resetToken.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Update password with logging
   */
  static async updatePassword(userId, currentPassword, newPassword) {
    try {
      logger.info('Password update attempt', {
        userId,
        timestamp: new Date().toISOString()
      });

      const user = await User.findById(userId);
      
      if (!user) {
        logger.warn('Password update attempt for non-existent user', {
          userId,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError.user(userId);
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        logger.warn('Password update attempt with incorrect current password', {
          userId,
          email: user.email,
          timestamp: new Date().toISOString()
        });
        
        throw UnauthorizedError.invalidCredentials();
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        passwordUpdatedAt: new Date()
      });

      // Log successful password update
      logger.logAuth('password_update_successful', userId, {
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // Log security event
      logger.logSecurity('password_updated', {
        userId,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      return { message: 'Password updated successfully' };
    } catch (error) {
      logger.error('Password update failed', error, {
        userId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Update profile with logging
   */
  static async updateProfile(userId, updateData) {
    try {
      logger.info('Profile update attempt', {
        userId,
        updateData,
        timestamp: new Date().toISOString()
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        logger.warn('Profile update attempt for non-existent user', {
          userId,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError.user(userId);
      }

      // Log successful profile update
      logger.logAuth('profile_updated', userId, {
        email: user.email,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });

      // Log business event
      logger.logBusiness('profile_updated', {
        userId,
        email: user.email,
        updatedFields: Object.keys(updateData)
      });

      return user;
    } catch (error) {
      logger.error('Profile update failed', error, {
        userId,
        updateData,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Get user profile with logging
   */
  static async getUserProfile(userId) {
    try {
      logger.debug('Profile fetch attempt', {
        userId,
        timestamp: new Date().toISOString()
      });

      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        logger.warn('Profile fetch attempt for non-existent user', {
          userId,
          timestamp: new Date().toISOString()
        });
        
        throw NotFoundError.user(userId);
      }

      logger.debug('Profile fetched successfully', {
        userId,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      return user;
    } catch (error) {
      logger.error('Profile fetch failed', error, {
        userId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

export default AuthService;
