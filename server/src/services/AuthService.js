import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import PasswordReset from '../models/PasswordReset.js';
import generateToken from '../utils/generateToken.js';
import generateOTP from '../utils/generateOTP.js';
import { sendEmail } from '../config/email.js';
import { getOTPEmailTemplate } from '../utils/emailTemplates.js';
import BadRequestError from '../errors/BadRequestError.js';
import NotFoundError from '../errors/NotFoundError.js';
import UnauthorizedError from '../errors/UnauthorizedError.js';

/**
 * AuthService - Handles all authentication business logic
 * Separated from controller to maintain clean architecture
 */

class AuthService {
  /**
   * Register user with OTP verification
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.phoneNumber - User phone number
   * @returns {Object} Registration result
   */
  static async registerUser(userData) {
    const { name, email, password, phoneNumber } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw BadRequestError.duplicate('User', email);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in PendingRegistration (upsert if email exists)
    await PendingRegistration.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        name,
        email: email.toLowerCase(),
        password,
        phoneNumber: phoneNumber || '',
        otp,
        otpExpires,
      },
      { upsert: true, new: true }
    );

    // Send Email
    const emailContent = getOTPEmailTemplate(otp, name, 'registration');
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return {
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: email.toLowerCase(),
    };
  }

  /**
   * Verify OTP and complete registration
   * @param {Object} otpData - OTP verification data
   * @param {string} otpData.email - User email
   * @param {string} otpData.otp - OTP code
   * @returns {Object} User data with token
   */
  static async verifyOTP(otpData) {
    const { email, otp } = otpData;

    if (!email || !otp) {
      throw BadRequestError.missingFields(['email', 'otp']);
    }

    const pendingUser = await PendingRegistration.findOne({ 
      email: email.toLowerCase(),
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!pendingUser) {
      throw UnauthorizedError.otpVerificationFailed();
    }

    // Create user in main collection
    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed in PendingRegistration pre-save
      phoneNumber: pendingUser.phoneNumber,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Delete pending registration
    await PendingRegistration.deleteOne({ _id: pendingUser._id });

    if (!user) {
      throw new BadRequestError('Failed to create user account', 'USER_CREATION_FAILED');
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
      message: 'Email verified and registration completed successfully!',
    };
  }

  /**
   * Resend OTP for registration
   * @param {string} email - User email
   * @returns {Object} Resend result
   */
  static async resendOTP(email) {
    const pendingUser = await PendingRegistration.findOne({ email: email.toLowerCase() });

    if (!pendingUser) {
      throw NotFoundError.pendingRegistration(email);
    }

    const otp = generateOTP();
    pendingUser.otp = otp;
    pendingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pendingUser.save();

    const emailContent = getOTPEmailTemplate(otp, pendingUser.name, 'registration');
    await sendEmail({
      to: pendingUser.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return { message: 'New OTP sent to your email' };
  }

  /**
   * Authenticate user and generate token
   * @param {Object} loginData - Login credentials
   * @param {string} loginData.email - User email
   * @param {string} loginData.password - User password
   * @returns {Object} User data with token
   */
  static async loginUser(loginData) {
    const { email, password } = loginData;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      };
    } else {
      throw UnauthorizedError.invalidCredentials();
    }
  }

  /**
   * Initiate password reset with OTP
   * @param {string} email - User email
   * @returns {Object} Password reset result
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw NotFoundError.user(email);
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordReset.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, otpExpires },
      { upsert: true, new: true }
    );

    const emailContent = getOTPEmailTemplate(otp, user.name, 'password_reset');
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return { message: 'Password reset OTP sent to your email' };
  }

  /**
   * Reset password with OTP verification
   * @param {Object} resetData - Password reset data
   * @param {string} resetData.email - User email
   * @param {string} resetData.otp - OTP code
   * @param {string} resetData.newPassword - New password
   * @returns {Object} Reset result
   */
  static async resetPassword(resetData) {
    const { email, otp, newPassword } = resetData;

    if (!email || !otp || !newPassword) {
      throw BadRequestError.missingFields(['email', 'otp', 'newPassword']);
    }

    const resetRequest = await PasswordReset.findOne({
      email: email.toLowerCase(),
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!resetRequest) {
      throw UnauthorizedError.otpVerificationFailed();
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw NotFoundError.user(email);
    }

    user.password = newPassword;
    await user.save();

    // Delete reset request
    await PasswordReset.deleteOne({ _id: resetRequest._id });

    return { message: 'Password reset successfully. You can now login with your new password.' };
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Object} User profile data
   */
  static async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw NotFoundError.user(userId);
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
    };
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated user data with token
   */
  static async updateUserProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw NotFoundError.user(userId);
    }

    user.name = updateData.name || user.name;
    if (updateData.email) {
      user.email = updateData.email.toLowerCase();
    }
    if (updateData.phoneNumber !== undefined) {
      user.phoneNumber = updateData.phoneNumber || '';
    }
    
    const updatedUser = await user.save();
    
    return {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    };
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {Object} passwordData - Password update data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Object} Update result with token
   */
  static async updatePassword(userId, passwordData) {
    const user = await User.findById(userId);
    if (!user) {
      throw NotFoundError.user(userId);
    }

    const { currentPassword, newPassword } = passwordData;
    if (!currentPassword || !newPassword) {
      throw BadRequestError.missingFields(['currentPassword', 'newPassword']);
    }

    if (!(await user.matchPassword(currentPassword))) {
      throw UnauthorizedError.invalidCredentials('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return {
      message: 'Password updated successfully',
      token: generateToken(user._id),
    };
  }
}

export default AuthService;
