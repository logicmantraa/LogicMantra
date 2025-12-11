import mongoose from 'mongoose';

const storeItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  fileUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'bundle', 'other'],
    default: 'other'
  },
  thumbnail: {
    type: String,
    default: ''
  },
  // Analytics fields (optional)
  purchaseCount: {
    type: Number,
    default: 0
  },
  lastPurchasedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Index for search
storeItemSchema.index({ name: 'text', description: 'text' });

const StoreItem = mongoose.model('StoreItem', storeItemSchema);

export default StoreItem;

