import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import PasswordReset from '../models/PasswordReset.js';
import generateToken from '../utils/generateToken.js';
import generateOTP from '../utils/generateOTP.js';
import { sendEmail } from '../config/email.js';
import { getOTPEmailTemplate } from '../utils/emailTemplates.js';
import bcrypt from 'bcryptjs';

// @desc    Register a new user (Stage 1: Send OTP)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Check if user already exists in main User collection
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
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

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: email.toLowerCase(),
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Verify OTP & Complete Registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide email and OTP');
    }

    const pendingUser = await PendingRegistration.findOne({ 
      email: email.toLowerCase(),
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!pendingUser) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
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

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
        message: 'Email verified and registration completed successfully!',
      });
    } else {
      res.status(400);
      throw new Error('Failed to create user');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Resend OTP for registration
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const pendingUser = await PendingRegistration.findOne({ email: email.toLowerCase() });

    if (!pendingUser) {
      res.status(404);
      throw new Error('No pending registration found for this email');
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

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Forgot Password (Stage 1: Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(404);
      throw new Error('User with this email does not exist');
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

    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Reset Password (Stage 2: Verify OTP & Update)
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Please provide email, OTP and new password');
    }

    const resetRequest = await PasswordReset.findOne({
      email: email.toLowerCase(),
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!resetRequest) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    // Delete reset request
    await PasswordReset.deleteOne({ _id: resetRequest._id });

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.email) {
        user.email = req.body.email.toLowerCase();
      }
      if (req.body.phoneNumber !== undefined) {
        user.phoneNumber = req.body.phoneNumber || '';
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Please provide current password and new password');
    }
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }
    user.password = newPassword;
    await user.save();
    res.json({
      message: 'Password updated successfully',
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};
