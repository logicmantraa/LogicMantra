import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  // Razorpay fields
  razorpayOrderId: {
    type: String,
    unique: true,
    sparse: true
  },
  razorpayPaymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  razorpaySignature: {
    type: String
  },
  paymentMethod: {
    type: String,
    default: 'razorpay',
    enum: ['razorpay', 'free']
  },
  // Payment gateway response data (for debugging and audit)
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // For tracking payment attempts (retries)
  attemptNumber: {
    type: Number,
    default: 1
  },
  failureReason: {
    type: String,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Indexes for efficient queries
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

