/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP string
 */
export const generateOTP = () => {
  // Generate random 6-digit number (100000 to 999999)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

/**
 * Generate OTP with expiry time
 * @param {number} expiryMinutes - Minutes until OTP expires (default: 10)
 * @returns {Object} { otp, expiresAt }
 */
export const generateOTPWithExpiry = (expiryMinutes = 10) => {
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
  
  return {
    otp,
    expiresAt
  };
};

export default generateOTP;


