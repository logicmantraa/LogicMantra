import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Course from '../models/Course.js';
import StoreItem from '../models/StoreItem.js';
import { checkUserOwnership, preventDuplicatePurchase } from '../utils/purchaseHelpers.js';
import {
  grantAccessToItems,
  validateCartItems,
  calculateCartTotal,
  clearUserCart,
  getOrCreateCart
} from '../utils/orderHelpers.js';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  generateOrderId
} from '../config/razorpay.js';

// @desc    Create order from cart (for cart-based checkout)
// @route   POST /api/payments/create-order
// @access  Private
export const createOrderFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

    // Get user's cart
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    // Get cart items
    const cartItems = await CartItem.find({ cartId: cart._id }).session(session);
    if (cartItems.length === 0) {
      res.status(400);
      throw new Error('Cart is empty');
    }

    // Validate cart items
    const validation = await validateCartItems(cartItems);
    if (!validation.valid) {
      res.status(400);
      throw new Error(`Invalid items in cart: ${validation.errors.join(', ')}`);
    }

    // Check for duplicate purchases
    for (const item of cartItems) {
      const ownsItem = await checkUserOwnership(userId, item.itemId, item.itemType);
      if (ownsItem) {
        res.status(400);
        const itemTypeName = item.itemType === 'course' ? 'course' : 'item';
        throw new Error(`You already own one of the ${itemTypeName}s in your cart`);
      }
    }

    // Calculate total
    const totalAmount = calculateCartTotal(cartItems);

    // Generate order ID
    const orderId = generateOrderId();

    // Prepare order items
    const orderItems = validation.items.map(item => ({
      itemType: item.itemType,
      itemId: item.itemId,
      name: item.itemDetails.name,
      price: item.price, // Use cart price snapshot
      quantity: item.quantity,
      thumbnail: item.itemDetails.thumbnail || ''
    }));

    // Determine if order is free
    const isFreeOrder = totalAmount === 0 || orderItems.every(item => item.price === 0);

    // Create order document
    const orderData = {
      orderId: orderId,
      userId: userId,
      items: orderItems,
      totalAmount: totalAmount,
      currency: 'INR',
      paymentStatus: isFreeOrder ? 'completed' : 'pending',
      paymentMethod: isFreeOrder ? 'free' : 'razorpay'
    };

    const order = await Order.create([orderData], { session });

    // If free order, grant access immediately
    if (isFreeOrder) {
      await grantAccessToItems(order[0], session);
      await clearUserCart(userId, session);
      await session.commitTransaction();
      
      return res.status(201).json({
        message: 'Order completed successfully (free items)',
        order: order[0],
        isFree: true
      });
    }

    // For paid orders, create Razorpay order
    try {
      const razorpayOrder = await createRazorpayOrder(
        totalAmount,
        'INR',
        orderId,
        {
          userId: userId.toString(),
          orderId: orderId
        }
      );

      // Update order with Razorpay order ID
      order[0].razorpayOrderId = razorpayOrder.id;
      await order[0].save({ session });

      await session.commitTransaction();

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          _id: order[0]._id,
          orderId: order[0].orderId,
          totalAmount: order[0].totalAmount,
          currency: order[0].currency,
          items: order[0].items
        },
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        isFree: false
      });
    } catch (razorpayError) {
      await session.abortTransaction();
      throw new Error(`Failed to create Razorpay order: ${razorpayError.message}`);
    }
  } catch (error) {
    await session.abortTransaction();
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Create direct order (bypass cart, for single item purchase)
// @route   POST /api/payments/create-direct-order
// @access  Private
export const createDirectOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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
      item = await Course.findById(itemId).session(session);
      if (!item) {
        res.status(404);
        throw new Error('Course not found');
      }
      itemName = item.title;
      itemThumbnail = item.thumbnail;
      itemPrice = item.price;
    } else if (itemType === 'storeItem') {
      item = await StoreItem.findById(itemId).session(session);
      if (!item) {
        res.status(404);
        throw new Error('Store item not found');
      }
      itemName = item.name;
      itemThumbnail = item.thumbnail;
      itemPrice = item.price;
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Prepare order item
    const orderItem = {
      itemType: itemType,
      itemId: itemId,
      name: itemName,
      price: itemPrice,
      quantity: 1,
      thumbnail: itemThumbnail || ''
    };

    // Determine if order is free
    const isFreeOrder = itemPrice === 0;

    // Create order document
    const orderData = {
      orderId: orderId,
      userId: userId,
      items: [orderItem],
      totalAmount: itemPrice,
      currency: 'INR',
      paymentStatus: isFreeOrder ? 'completed' : 'pending',
      paymentMethod: isFreeOrder ? 'free' : 'razorpay'
    };

    const order = await Order.create([orderData], { session });

    // If free order, grant access immediately
    if (isFreeOrder) {
      await grantAccessToItems(order[0], session);
      await session.commitTransaction();
      
      return res.status(201).json({
        message: 'Order completed successfully (free item)',
        order: order[0],
        isFree: true
      });
    }

    // For paid orders, create Razorpay order
    try {
      const razorpayOrder = await createRazorpayOrder(
        itemPrice,
        'INR',
        orderId,
        {
          userId: userId.toString(),
          orderId: orderId,
          itemType: itemType,
          itemId: itemId.toString()
        }
      );

      // Update order with Razorpay order ID
      order[0].razorpayOrderId = razorpayOrder.id;
      await order[0].save({ session });

      await session.commitTransaction();

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          _id: order[0]._id,
          orderId: order[0].orderId,
          totalAmount: order[0].totalAmount,
          currency: order[0].currency,
          items: order[0].items
        },
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        isFree: false
      });
    } catch (razorpayError) {
      await session.abortTransaction();
      throw new Error(`Failed to create Razorpay order: ${razorpayError.message}`);
    }
  } catch (error) {
    await session.abortTransaction();
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Verify payment after Razorpay completes
// @route   POST /api/payments/verify-payment
// @access  Private
export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400);
      throw new Error('Missing required payment details');
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      await session.abortTransaction();
      res.status(400);
      throw new Error('Invalid payment signature');
    }

    // Find order
    const order = await Order.findOne({
      orderId: orderId,
      userId: userId
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      res.status(404);
      throw new Error('Order not found');
    }

    // Check if order is already completed
    if (order.paymentStatus === 'completed') {
      await session.commitTransaction();
      return res.json({
        message: 'Payment already verified',
        order: order
      });
    }

    // Check if order status is pending
    if (order.paymentStatus !== 'pending') {
      await session.abortTransaction();
      res.status(400);
      throw new Error(`Order status is ${order.paymentStatus}, cannot verify payment`);
    }

    // Verify Razorpay order ID matches
    if (order.razorpayOrderId !== razorpayOrderId) {
      await session.abortTransaction();
      res.status(400);
      throw new Error('Razorpay order ID mismatch');
    }

    // Update order with payment details
    order.paymentStatus = 'completed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;

    // Create payment record
    const payment = await Payment.create([{
      orderId: order._id,
      userId: userId,
      amount: order.totalAmount,
      currency: order.currency,
      status: 'completed',
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      razorpaySignature: razorpaySignature,
      paymentMethod: 'razorpay',
      completedAt: new Date(),
      attemptNumber: 1
    }], { session });

    // Link payment to order
    order.paymentId = payment[0]._id;
    await order.save({ session });

    // Grant access to items
    await grantAccessToItems(order, session);

    // Clear cart (if order was from cart)
    await clearUserCart(userId, session);

    await session.commitTransaction();

    res.json({
      message: 'Payment verified successfully',
      order: order,
      payment: payment[0]
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get user's orders
// @route   GET /api/payments/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate('paymentId')
      .limit(50); // Limit to last 50 orders

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific order details
// @route   GET /api/payments/order/:orderId
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [
        { orderId: orderId },
        { _id: orderId }
      ],
      userId: userId
    })
      .populate('paymentId')
      .populate('items.itemId');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    res.json(order);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

