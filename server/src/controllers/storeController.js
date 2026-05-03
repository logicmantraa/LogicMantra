import StoreItem from '../models/StoreItem.js';
import User from '../models/User.js';

// @desc    Get all store items
// @route   GET /api/store
// @access  Public
export const getStoreItems = async (req, res) => {
  try {
    const { search, category, type } = req.query;
    
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
    const item = await StoreItem.findById(req.params.id);
    
    if (!item) {
      res.status(404);
      throw new Error('Store item not found');
    }
    
    res.json(item);
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

// @desc    Purchase store item (track purchase - no payment for now)
// @route   POST /api/store/:id/purchase
// @access  Private
export const purchaseStoreItem = async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);
    
    if (!item) {
      res.status(404);
      throw new Error('Store item not found');
    }
    
    // For now, just return success (payment integration in future)
    // In future, add purchases array to User model or create Purchase model
    res.json({
      message: 'Purchase successful (payment integration coming soon)',
      item
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

