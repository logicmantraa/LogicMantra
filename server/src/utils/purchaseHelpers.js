import UserPurchase from '../models/UserPurchase.js';

/**
 * Check if user owns a specific item
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID (course or storeItem)
 * @param {string} itemType - Item type ('course' or 'storeItem')
 * @returns {Promise<boolean>} - True if user owns the item
 */
export const checkUserOwnership = async (userId, itemId, itemType) => {
  try {
    const purchase = await UserPurchase.findOne({
      userId,
      itemId,
      itemType,
      isActive: true
    });
    return !!purchase;
  } catch (error) {
    console.error('Error checking user ownership:', error);
    return false;
  }
};

/**
 * Check if user owns any of the provided items
 * @param {string} userId - User ID
 * @param {Array<{itemId: string, itemType: string}>} items - Array of items to check
 * @returns {Promise<Object>} - Object with itemId as key and boolean as value
 */
export const checkMultipleOwnership = async (userId, items) => {
  try {
    const purchases = await UserPurchase.find({
      userId,
      isActive: true,
      $or: items.map(item => ({
        itemId: item.itemId,
        itemType: item.itemType
      }))
    }).select('itemId itemType');

    const ownedItems = new Set(
      purchases.map(p => `${p.itemId}_${p.itemType}`)
    );

    const result = {};
    items.forEach(item => {
      result[item.itemId] = ownedItems.has(`${item.itemId}_${item.itemType}`);
    });

    return result;
  } catch (error) {
    console.error('Error checking multiple ownership:', error);
    return {};
  }
};

/**
 * Get all items owned by a user
 * @param {string} userId - User ID
 * @param {string} itemType - Optional filter by item type ('course' or 'storeItem')
 * @returns {Promise<Array>} - Array of UserPurchase documents
 */
export const getUserPurchases = async (userId, itemType = null) => {
  try {
    const query = { userId, isActive: true };
    if (itemType) {
      query.itemType = itemType;
    }
    return await UserPurchase.find(query)
      .populate('itemId')
      .populate('orderId')
      .sort({ purchasedAt: -1 });
  } catch (error) {
    console.error('Error getting user purchases:', error);
    return [];
  }
};

/**
 * Prevent duplicate purchases by checking if user already owns the item
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID
 * @param {string} itemType - Item type ('course' or 'storeItem')
 * @throws {Error} - If user already owns the item
 */
export const preventDuplicatePurchase = async (userId, itemId, itemType) => {
  const ownsItem = await checkUserOwnership(userId, itemId, itemType);
  if (ownsItem) {
    const itemTypeName = itemType === 'course' ? 'course' : 'item';
    throw new Error(`You have already purchased this ${itemTypeName}`);
  }
};

