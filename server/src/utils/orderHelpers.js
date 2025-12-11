import mongoose from 'mongoose';
import UserPurchase from '../models/UserPurchase.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import StoreItem from '../models/StoreItem.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Course from '../models/Course.js';

/**
 * Grant access to items after successful payment or free order
 * This function creates UserPurchase records and enrollments for courses
 * @param {Object} order - Order document
 * @param {mongoose.ClientSession} session - Optional MongoDB session for transactions
 */
export const grantAccessToItems = async (order, session = null) => {
  const userId = order.userId;
  const orderId = order._id;
  const purchasedAt = order.paymentStatus === 'completed' ? new Date() : order.createdAt;

  // Use transaction if session provided
  const operations = [];

  for (const item of order.items) {
    // Create UserPurchase record
    const userPurchase = {
      userId: userId,
      itemType: item.itemType,
      itemId: item.itemId,
      orderId: orderId,
      purchasedAt: purchasedAt,
      isActive: true
    };

    operations.push(
      UserPurchase.create([userPurchase], { session })
    );

    // If item is a course, create/update enrollment
    if (item.itemType === 'course') {
      operations.push(
        (async () => {
          const existingEnrollment = await Enrollment.findOne(
            { userId: userId, courseId: item.itemId },
            null,
            { session }
          );
          
          const isNewEnrollment = !existingEnrollment;
          
          const enrollment = await Enrollment.findOneAndUpdate(
            { userId: userId, courseId: item.itemId },
            {
              userId: userId,
              courseId: item.itemId,
              orderId: orderId,
              isPaid: true,
              purchasedAt: purchasedAt,
              enrolledAt: purchasedAt
            },
            { upsert: true, new: true, session }
          );
          
          // Update course enrollment count only if it's a new enrollment
          if (isNewEnrollment) {
            await Course.findByIdAndUpdate(
              item.itemId,
              { $inc: { enrolledCount: 1 } },
              { session }
            );
          }
          
          return enrollment;
        })()
      );
    }

    // Update StoreItem analytics if it's a store item
    if (item.itemType === 'storeItem') {
      operations.push(
        StoreItem.findByIdAndUpdate(
          item.itemId,
          {
            $inc: { purchaseCount: 1 },
            lastPurchasedAt: purchasedAt
          },
          { session }
        )
      );
    }
  }

  // Update User statistics
  operations.push(
    User.findByIdAndUpdate(
      userId,
      {
        $inc: { purchaseCount: 1 },
        lastPurchaseAt: purchasedAt
      },
      { session }
    )
  );

  await Promise.all(operations);
};

/**
 * Validate cart items before creating order
 * Checks if items exist, are purchasable, and validates prices
 * @param {Array} cartItems - Array of CartItem documents
 * @returns {Promise<{valid: boolean, items: Array, errors: Array}>}
 */
export const validateCartItems = async (cartItems) => {
  const errors = [];
  const validItems = [];

  for (const cartItem of cartItems) {
    try {
      let item;
      
      if (cartItem.itemType === 'course') {
        item = await Course.findById(cartItem.itemId);
        if (!item) {
          errors.push(`Course with ID ${cartItem.itemId} not found`);
          continue;
        }
      } else if (cartItem.itemType === 'storeItem') {
        item = await StoreItem.findById(cartItem.itemId);
        if (!item) {
          errors.push(`Store item with ID ${cartItem.itemId} not found`);
          continue;
        }
      } else {
        errors.push(`Invalid item type: ${cartItem.itemType}`);
        continue;
      }

      // Check if price has changed significantly (allow small differences for rounding)
      const priceDifference = Math.abs(item.price - cartItem.price);
      if (priceDifference > 0.01) {
        // Price changed - update cart item price
        cartItem.price = item.price;
        await cartItem.save();
      }

      validItems.push({
        ...cartItem.toObject(),
        currentPrice: item.price,
        itemDetails: {
          name: item.name || item.title,
          thumbnail: item.thumbnail || '',
          description: item.description || ''
        }
      });
    } catch (error) {
      errors.push(`Error validating item ${cartItem.itemId}: ${error.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    items: validItems,
    errors: errors
  };
};

/**
 * Calculate total amount from cart items
 * @param {Array} cartItems - Array of CartItem documents
 * @returns {number} - Total amount
 */
export const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

/**
 * Clear user's cart after successful order
 * @param {string} userId - User ID
 * @param {mongoose.ClientSession} session - Optional MongoDB session
 */
export const clearUserCart = async (userId, session = null) => {
  try {
    const cart = await Cart.findOne({ userId });
    if (cart) {
      // Delete all cart items
      await CartItem.deleteMany({ cartId: cart._id }, { session });
      // Optionally delete cart itself (or keep it for future use)
      // await Cart.findByIdAndDelete(cart._id, { session });
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    // Don't throw - cart clearing is not critical
  }
};

/**
 * Get or create user's cart
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Cart document
 */
export const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  
  if (!cart) {
    cart = await Cart.create({ userId });
  }
  
  return cart;
};

