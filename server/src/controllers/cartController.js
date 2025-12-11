import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Course from '../models/Course.js';
import StoreItem from '../models/StoreItem.js';
import { checkUserOwnership, preventDuplicatePurchase } from '../utils/purchaseHelpers.js';
import { getOrCreateCart, calculateCartTotal } from '../utils/orderHelpers.js';

// @desc    Get user's cart with all items
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cart = await getOrCreateCart(userId);
    
    const cartItems = await CartItem.find({ cartId: cart._id })
      .sort({ createdAt: -1 });

    // Populate item details
    const itemsWithDetails = await Promise.all(
      cartItems.map(async (item) => {
        let itemDetails = null;
        
        if (item.itemType === 'course') {
          itemDetails = await Course.findById(item.itemId).select('title thumbnail description price isFree');
          return {
            ...item.toObject(),
            itemDetails: itemDetails ? {
              name: itemDetails.title,
              thumbnail: itemDetails.thumbnail,
              description: itemDetails.description,
              price: itemDetails.price,
              isFree: itemDetails.isFree
            } : null
          };
        } else if (item.itemType === 'storeItem') {
          itemDetails = await StoreItem.findById(item.itemId).select('name thumbnail description price');
          return {
            ...item.toObject(),
            itemDetails: itemDetails ? {
              name: itemDetails.name,
              thumbnail: itemDetails.thumbnail,
              description: itemDetails.description,
              price: itemDetails.price
            } : null
          };
        }
        
        return item.toObject();
      })
    );

    // Filter out items that no longer exist
    const validItems = itemsWithDetails.filter(item => item.itemDetails !== null);
    
    // Calculate total
    const total = calculateCartTotal(cartItems);

    res.json({
      cart: cart,
      items: validItems,
      total: total,
      itemCount: validItems.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add-item
// @access  Private
export const addItemToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemType, itemId } = req.body;

    // Validate item type
    if (!['course', 'storeItem'].includes(itemType)) {
      res.status(400);
      throw new Error('Invalid item type. Must be "course" or "storeItem"');
    }

    if (!itemId) {
      res.status(400);
      throw new Error('Item ID is required');
    }

    // Check if user already owns the item
    await preventDuplicatePurchase(userId, itemId, itemType);

    // Get item details
    let item;
    let itemName;
    let itemThumbnail;
    let itemPrice;

    if (itemType === 'course') {
      item = await Course.findById(itemId);
      if (!item) {
        res.status(404);
        throw new Error('Course not found');
      }
      itemName = item.title;
      itemThumbnail = item.thumbnail;
      itemPrice = item.price;
    } else if (itemType === 'storeItem') {
      item = await StoreItem.findById(itemId);
      if (!item) {
        res.status(404);
        throw new Error('Store item not found');
      }
      itemName = item.name;
      itemThumbnail = item.thumbnail;
      itemPrice = item.price;
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Check if item already in cart
    const existingCartItem = await CartItem.findOne({
      cartId: cart._id,
      itemType,
      itemId
    });

    if (existingCartItem) {
      res.status(400);
      throw new Error('Item is already in your cart');
    }

    // Create cart item with price snapshot
    const cartItem = await CartItem.create({
      cartId: cart._id,
      itemType,
      itemId,
      price: itemPrice,
      quantity: 1,
      itemSnapshot: {
        name: itemName,
        thumbnail: itemThumbnail,
        description: item.description || ''
      }
    });

    res.status(201).json({
      message: 'Item added to cart',
      cartItem: cartItem
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove-item/:cartItemId
// @access  Private
export const removeItemFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cartItemId } = req.params;

    // Get user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    // Find and delete cart item (ensure it belongs to user's cart)
    const cartItem = await CartItem.findOne({
      _id: cartItemId,
      cartId: cart._id
    });

    if (!cartItem) {
      res.status(404);
      throw new Error('Cart item not found');
    }

    await cartItem.deleteOne();

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    // Delete all cart items
    await CartItem.deleteMany({ cartId: cart._id });

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get cart total
// @route   GET /api/cart/total
// @access  Private
export const getCartTotal = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ total: 0, itemCount: 0 });
    }

    const cartItems = await CartItem.find({ cartId: cart._id });
    const total = calculateCartTotal(cartItems);

    res.json({
      total: total,
      itemCount: cartItems.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

