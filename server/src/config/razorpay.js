import Razorpay from 'razorpay';
import crypto from 'crypto';

// Helper function to strip quotes from environment variables
const stripQuotes = (value) => {
  if (!value) return value;
  return value.toString().replace(/^["']|["']$/g, '').trim();
};

// Initialize Razorpay instance
let razorpayInstance = null;

export const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const keyId = stripQuotes(process.env.RAZORPAY_KEY_ID);
    const keySecret = stripQuotes(process.env.RAZORPAY_KEY_SECRET);

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }

  return razorpayInstance;
};

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in paise (smallest currency unit, e.g., ₹100 = 10000 paise)
 * @param {string} currency - Currency code (default: 'INR')
 * @param {string} receipt - Unique receipt identifier
 * @param {Object} notes - Optional notes/metadata
 * @returns {Promise<Object>} - Razorpay order object
 */
export const createRazorpayOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  try {
    const razorpay = getRazorpayInstance();
    
    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);
    
    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt,
      notes: notes
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error(`Failed to create Razorpay order: ${error.message || error.error?.description || 'Unknown error'}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @returns {boolean} - True if signature is valid
 */
export const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const keySecret = stripQuotes(process.env.RAZORPAY_KEY_SECRET);
    
    if (!keySecret) {
      throw new Error('Razorpay key secret not configured');
    }

    // Create signature string: orderId + "|" + paymentId
    const signatureString = `${razorpayOrderId}|${razorpayPaymentId}`;
    
    // Generate HMAC SHA256 hash
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(signatureString)
      .digest('hex');

    // Compare signatures (use timing-safe comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(razorpaySignature),
      Buffer.from(generatedSignature)
    );

    return isValid;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Generate unique order ID for our system
 * Format: ORD-{timestamp}-{random}
 * @returns {string} - Unique order ID
 */
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export default {
  getRazorpayInstance,
  createRazorpayOrder,
  verifyPaymentSignature,
  generateOrderId
};

