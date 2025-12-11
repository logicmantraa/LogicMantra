import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
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
    // Note: Can't use single ref due to multiple types (course or storeItem)
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  // Snapshot of item details at time of adding to cart
  itemSnapshot: {
    name: String,
    thumbnail: String,
    description: String
  }
}, { timestamps: true });

// Prevent duplicate items in cart
cartItemSchema.index({ cartId: 1, itemType: 1, itemId: 1 }, { unique: true });

// Index for efficient queries
cartItemSchema.index({ cartId: 1 });
cartItemSchema.index({ itemId: 1, itemType: 1 });

const CartItem = mongoose.model('CartItem', cartItemSchema);

export default CartItem;

