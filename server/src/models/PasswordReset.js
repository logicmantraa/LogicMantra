import mongoose from 'mongoose';

const passwordResetSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otpExpires: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Document expires after 10 minutes
  },
});

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
