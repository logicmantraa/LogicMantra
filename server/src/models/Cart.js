import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cart per user
  }
}, { timestamps: true });

// Index for efficient queries
cartSchema.index({ userId: 1 });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;

