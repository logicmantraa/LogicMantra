import { paymentAPI } from './api';

/**
 * Initialize Razorpay checkout script
 * @returns {Promise<Function>} Razorpay constructor
 */
export const initializeRazorpay = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay checkout script'));
    };
    document.body.appendChild(script);
  });
};

/**
 * Handle Razorpay payment checkout
 * @param {Object} orderData - Order data from backend
 * @param {Object} orderData.order - Order object
 * @param {string} orderData.razorpayOrderId - Razorpay order ID
 * @param {string} orderData.razorpayKeyId - Razorpay key ID
 * @param {number} orderData.amount - Amount in paise
 * @param {string} orderData.currency - Currency code
 * @returns {Promise<Object>} Payment response
 */
export const handleRazorpayPayment = async (orderData) => {
  try {
    const Razorpay = await initializeRazorpay();
    
    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount, // Amount in paise
      currency: orderData.currency || 'INR',
      name: 'Logic Mantraa',
      description: `Order ${orderData.order.orderId}`,
      order_id: orderData.razorpayOrderId,
      handler: async function (response) {
        // This will be handled by the promise below
      },
      prefill: {
        // User details can be prefilled if available
      },
      theme: {
        color: '#FF7A1A', // Primary color
      },
      modal: {
        ondismiss: function() {
          throw new Error('Payment cancelled by user');
        }
      }
    };

    return new Promise((resolve, reject) => {
      const razorpayInstance = new Razorpay({
        ...options,
        handler: async function(response) {
          try {
            const verification = await paymentAPI.verifyPayment({
              orderId: orderData.order.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            
            resolve({
              success: true,
              verification,
              response
            });
          } catch (error) {
            reject(error);
          }
        }
      });
      
      razorpayInstance.on('payment.failed', function (response) {
        reject(new Error(response.error.description || 'Payment failed'));
      });

      razorpayInstance.open();
    });
  } catch (error) {
    throw error;
  }
};

