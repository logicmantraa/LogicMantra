import mongoose from 'mongoose';

const userPurchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemType: {
    type: String,
    enum: ['course', 'storeItem'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  // Optional: For time-limited access (if needed in future)
  expiresAt: {
    type: Date,
    default: null
  },
  // Optional: Track if purchase is active (for potential refunds/revocations)
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Prevent duplicate purchases (unique compound index)
userPurchaseSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

// Indexes for efficient queries
userPurchaseSchema.index({ userId: 1, itemType: 1 }); // Get all courses or all storeItems for a user
userPurchaseSchema.index({ itemId: 1, itemType: 1 }); // Analytics: who bought this item
userPurchaseSchema.index({ orderId: 1 }); // Get all purchases for an order
userPurchaseSchema.index({ userId: 1, purchasedAt: -1 }); // Get user purchases sorted by date

const UserPurchase = mongoose.model('UserPurchase', userPurchaseSchema);

export default UserPurchase;

