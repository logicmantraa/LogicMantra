import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import PasswordReset from '../models/PasswordReset.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../config/email.js';
import { welcomeEmailTemplate, otpVerificationEmailTemplate, passwordResetEmailTemplate } from '../utils/emailTemplates.js';
import { generateOTPWithExpiry } from '../utils/generateOTP.js';
import bcrypt from 'bcryptjs';

// @desc    Register a new user (creates pending registration, user created after verification)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const { otp, expiresAt } = generateOTPWithExpiry(10); // 10 minutes expiry

    // Check if there's a pending registration - update it instead of creating new one
    let pendingRegistration = await PendingRegistration.findOne({ email: email.toLowerCase() });
    
    if (pendingRegistration) {
      // Update existing pending registration with new details and OTP
      pendingRegistration.name = name;
      pendingRegistration.password = hashedPassword;
      pendingRegistration.phoneNumber = phoneNumber || '';
      pendingRegistration.otp = otp;
      pendingRegistration.expiresAt = expiresAt;
      pendingRegistration.attempts = 0; // Reset attempts
      await pendingRegistration.save();
    } else {
      // Create new pending registration (user not created yet)
      pendingRegistration = await PendingRegistration.create({
      name,
        email: email.toLowerCase(),
        password: hashedPassword,
      phoneNumber: phoneNumber || '',
        otp,
        expiresAt,
      });
    }

    // Send OTP email (async, don't wait for it)
    sendEmail({
      to: email,
      subject: 'Verify Your Email - Logic Mantraa',
      html: otpVerificationEmailTemplate(name, otp)
    }).then(result => {
      if (result.success) {
        console.log('OTP email sent successfully to', email);
      } else {
        console.error('Failed to send OTP email to', email, ':', result.message || result.error);
      }
    }).catch(err => {
      console.error('Failed to send OTP email to', email, ':', err.message);
      console.error('Full error:', err);
    });

      res.status(201).json({
      message: 'Please check your email for verification code.',
      email: pendingRegistration.email,
      requiresVerification: true,
      });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Search with lowercase email to match registration
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      // Check if email is verified
      if (!user.emailVerified) {
        res.status(403);
        throw new Error('Please verify your email address before logging in. Check your inbox for the verification code.');
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
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
        emailVerified: user.emailVerified,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
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
      // Normalize email to lowercase
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
        emailVerified: updatedUser.emailVerified,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
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

    // Check if current password matches
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password updated successfully',
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Verify email with OTP and create user account
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide email and OTP');
    }

    // Find pending registration
    const pendingRegistration = await PendingRegistration.findOne({
      email: email.toLowerCase(),
    });

    if (!pendingRegistration) {
      res.status(404);
      throw new Error('No pending registration found. Please register again.');
    }

    // Check if OTP matches
    if (pendingRegistration.otp !== otp) {
      pendingRegistration.attempts += 1;
      await pendingRegistration.save();

      if (pendingRegistration.attempts >= 5) {
        await pendingRegistration.deleteOne();
        res.status(429);
        throw new Error('Too many verification attempts. Please register again.');
      }

      res.status(400);
      throw new Error('Invalid OTP');
    }

    // Check if OTP is expired
    if (new Date() > pendingRegistration.expiresAt) {
      await pendingRegistration.deleteOne();
      res.status(400);
      throw new Error('OTP has expired. Please register again.');
    }

    // Check if user already exists (race condition check)
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      await pendingRegistration.deleteOne();
      res.status(400);
      throw new Error('User already exists');
    }

    // Create the actual user account
    // Password is already hashed in PendingRegistration, so User model will detect it and skip hashing
    const user = await User.create({
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      password: pendingRegistration.password, // Already hashed (starts with $2b$)
      phoneNumber: pendingRegistration.phoneNumber,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Delete pending registration
    await pendingRegistration.deleteOne();

    // Send welcome email after verification
    sendEmail({
      to: user.email,
      subject: 'Welcome to Logic Mantraa! 🎉',
      html: welcomeEmailTemplate(user.name)
    }).then(result => {
      if (result.success) {
        console.log('Welcome email sent successfully to', user.email);
      } else {
        console.error('Failed to send welcome email to', user.email, ':', result.message || result.error);
      }
    }).catch(err => {
      console.error('Failed to send welcome email to', user.email, ':', err.message);
    });

    res.json({
      message: 'Email verified successfully!',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please provide email address');
    }

    // Find pending registration
    const pendingRegistration = await PendingRegistration.findOne({
      email: email.toLowerCase(),
    });

    if (!pendingRegistration) {
      res.status(404);
      throw new Error('No pending registration found. Please register again.');
    }

    // Check if user already exists (shouldn't happen, but safety check)
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      await pendingRegistration.deleteOne();
      res.status(400);
      throw new Error('User already exists');
    }

    // Generate new OTP
    const { otp, expiresAt } = generateOTPWithExpiry(10);

    // Update pending registration with new OTP
    pendingRegistration.otp = otp;
    pendingRegistration.expiresAt = expiresAt;
    pendingRegistration.attempts = 0; // Reset attempts
    await pendingRegistration.save();

    // Send OTP email
    sendEmail({
      to: email,
      subject: 'Verify Your Email - Logic Mantraa',
      html: otpVerificationEmailTemplate(pendingRegistration.name, otp)
    }).then(result => {
      if (result.success) {
        console.log('Resend OTP email sent successfully to', email);
      } else {
        console.error('Failed to resend OTP email to', email, ':', result.message || result.error);
      }
    }).catch(err => {
      console.error('Failed to resend OTP email to', email, ':', err.message);
    });

    res.json({
      message: 'OTP has been sent to your email address. Please check your inbox.',
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Request password reset (send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please provide your email address');
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security
      res.json({
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
      return;
    }

    // Check if there's an existing unverified password reset
    let passwordReset = await PasswordReset.findOne({
      email: email.toLowerCase(),
      verified: false,
    });

    // Generate OTP
    const { otp, expiresAt } = generateOTPWithExpiry(10); // 10 minutes expiry

    if (passwordReset) {
      // Update existing password reset
      passwordReset.otp = otp;
      passwordReset.expiresAt = expiresAt;
      passwordReset.attempts = 0;
      await passwordReset.save();
    } else {
      // Create new password reset
      passwordReset = await PasswordReset.create({
        email: email.toLowerCase(),
        otp,
        expiresAt,
      });
    }

    // Send password reset OTP email (async, don't wait for it)
    sendEmail({
      to: email,
      subject: 'Reset Your Password - Logic Mantraa',
      html: passwordResetEmailTemplate(user.name, otp),
    }).then(result => {
      if (result.success) {
        console.log('Password reset OTP email sent successfully to', email);
      } else {
        console.error('Failed to send password reset email to', email, ':', result.message || result.error);
      }
    }).catch(err => {
      console.error('Failed to send password reset email to', email, ':', err.message);
    });

    res.json({
      message: 'If an account exists with this email, a password reset code has been sent.',
      email: email.toLowerCase(), // Return lowercase for consistency
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Reset password with OTP verification
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Please provide email, OTP, and new password');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    // Find password reset entry
    const passwordReset = await PasswordReset.findOne({
      email: email.toLowerCase(),
      verified: false,
    });

    if (!passwordReset) {
      res.status(404);
      throw new Error('Password reset request not found. Please request a new password reset.');
    }

    // Check if OTP matches
    if (passwordReset.otp !== otp) {
      passwordReset.attempts += 1;
      await passwordReset.save();

      // Limit attempts to 5
      if (passwordReset.attempts >= 5) {
        await passwordReset.deleteOne();
        res.status(429);
        throw new Error('Too many failed attempts. Please request a new password reset.');
      }

      res.status(400);
      throw new Error('Invalid OTP. Please check and try again.');
    }

    // Check if OTP has expired
    if (new Date() > passwordReset.expiresAt) {
      await passwordReset.deleteOne();
      res.status(400);
      throw new Error('OTP has expired. Please request a new password reset.');
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark password reset as verified and delete it
    await passwordReset.deleteOne();

    res.json({
      message: 'Password has been reset successfully. You can now login with your new password.',
      token: generateToken(user._id), // Return token so user can be auto-logged in
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};