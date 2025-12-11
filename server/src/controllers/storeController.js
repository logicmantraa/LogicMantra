import StoreItem from '../models/StoreItem.js';
import User from '../models/User.js';
import { checkMultipleOwnership, getUserPurchases, checkUserOwnership } from '../utils/purchaseHelpers.js';

// @desc    Get all store items
// @route   GET /api/store
// @access  Public
export const getStoreItems = async (req, res) => {
  try {
    const { search, category, type } = req.query;
    const userId = req.user?._id; // Optional: user might not be authenticated
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) query.category = category;
    if (type) query.type = type;
    
    const items = await StoreItem.find(query).sort({ createdAt: -1 });
    
    // Add ownership status if user is authenticated
    if (userId) {
      const itemIds = items.map(item => item._id.toString());
      const ownershipMap = await checkMultipleOwnership(
        userId,
        itemIds.map(id => ({ itemId: id, itemType: 'storeItem' }))
      );
      
      const itemsWithOwnership = items.map(item => ({
        ...item.toObject(),
        isOwned: ownershipMap[item._id.toString()] || false
      }));
      
      return res.json(itemsWithOwnership);
    }
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single store item
// @route   GET /api/store/:id
// @access  Public
export const getStoreItemById = async (req, res) => {
  try {
    const userId = req.user?._id;
    const item = await StoreItem.findById(req.params.id);
    
    if (!item) {
      res.status(404);
      throw new Error('Store item not found');
    }
    
    const itemData = item.toObject();
    
    // Add ownership status if user is authenticated
    if (userId) {
      itemData.isOwned = await checkUserOwnership(userId, item._id.toString(), 'storeItem');
    }
    
    res.json(itemData);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Create store item
// @route   POST /api/store
// @access  Private/Admin
export const createStoreItem = async (req, res) => {
  try {
    const item = await StoreItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update store item
// @route   PUT /api/store/:id
// @access  Private/Admin
export const updateStoreItem = async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);
    
    if (!item) {
      res.status(404);
      throw new Error('Store item not found');
    }
    
    Object.assign(item, req.body);
    const updatedItem = await item.save();
    
    res.json(updatedItem);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Delete store item
// @route   DELETE /api/store/:id
// @access  Private/Admin
export const deleteStoreItem = async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);
    
    if (!item) {
      res.status(404);
      throw new Error('Store item not found');
    }
    
    await item.deleteOne();
    res.json({ message: 'Store item removed' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get user's purchased store items
// @route   GET /api/store/my-purchases
// @access  Private
export const getMyPurchases = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const purchases = await getUserPurchases(userId, 'storeItem');
    
    // Populate item details
    const itemsWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const item = await StoreItem.findById(purchase.itemId);
        return {
          purchase: {
            purchasedAt: purchase.purchasedAt,
            orderId: purchase.orderId
          },
          item: item
        };
      })
    );
    
    res.json(itemsWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

