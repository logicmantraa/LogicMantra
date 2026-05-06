import UserProductAccess from '../models/UserProductAccess.js';
import Product from '../models/Product.js';
import { AppError, NotFoundError, ValidationError, ConflictError } from '../errors/customErrors.js';
import logger from '../config/logger.js';

/**
 * AccessService - Manages user access to products
 * Replaces EnrollmentService with product-agnostic access management
 */
class AccessService {
  /**
   * Grant access to a product for a user
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {string} source - Access source ('free', 'purchase', 'admin_grant', 'subscription')
   * @param {Object} purchaseInfo - Purchase information if applicable
   * @returns {Object} Created access record
   */
  static async grantAccess(userId, productId, source = 'free', purchaseInfo = {}) {
    try {
      // Validate inputs
      if (!userId || !productId) {
        throw new ValidationError('User ID and Product ID are required');
      }
      
      if (!['free', 'purchase', 'admin_grant', 'subscription'].includes(source)) {
        throw new ValidationError('Invalid access source');
      }
      
      // Check if product exists
      const product = await Product.findById(productId).lean();
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      
      // Validate business rules
      if (source === 'free' && !product.isFree) {
        throw new AppError('Cannot grant free access to paid product', 400);
      }
      
      // Handle duplicate access gracefully
      let access;
      try {
        access = await UserProductAccess.create({
          userId,
          productId,
          accessSource: source,
          status: 'active',
          isInLibrary: true,
          addedToLibraryAt: new Date(),
          ...purchaseInfo
        });
      } catch (error) {
        if (error.code === 11000) { // Duplicate key error
          // Return existing access instead of failing
          access = await UserProductAccess.findOne({ userId, productId });
          logger.info(`Access already exists for user ${userId}, product ${productId}`);
        } else {
          throw error;
        }
      }
      
      logger.info(`Access granted: user ${userId}, product ${productId}, source: ${source}`);
      
      return access.toObject();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in AccessService.grantAccess:', error);
      throw new AppError('Failed to grant access', 500);
    }
  }

  /**
   * Get user's library (all accessible products)
   * @param {string} userId - User ID
   * @param {Object} pagination - Pagination parameters
   * @returns {Object} User's library with pagination
   */
  static async getUserLibrary(userId, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'addedToLibraryAt', sortOrder = 'desc' } = pagination;
      
      // Build query
      const query = {
        userId,
        isInLibrary: true,
        status: 'active'
      };
      
      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Calculate skip
      const skip = (page - 1) * limit;
      
      // Get access records with product data
      const libraryItems = await UserProductAccess
        .find(query)
        .populate('productId', 'title description thumbnail productType category price isFree rating')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Get total count
      const total = await UserProductAccess.countDocuments(query);
      
      return {
        library: libraryItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: {
          totalProducts: total,
          completedProducts: await UserProductAccess.countDocuments({ 
            userId, 
            isInLibrary: true, 
            isCompleted: true 
          }),
          inProgressProducts: await UserProductAccess.countDocuments({ 
            userId, 
            isInLibrary: true, 
            isCompleted: false 
          })
        }
      };
    } catch (error) {
      logger.error('Error in AccessService.getUserLibrary:', error);
      throw new AppError('Failed to fetch user library', 500);
    }
  }

  /**
   * Check if user has access to a product
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Object} Access information
   */
  static async checkAccess(userId, productId) {
    try {
      const access = await UserProductAccess
        .findOne({ userId, productId })
        .lean();
      
      if (!access) {
        return {
          hasAccess: false,
          accessSource: null,
          status: null,
          canPreview: false
        };
      }
      
      // Get product info for preview logic
      const product = await Product.findById(productId).select('isFree productType').lean();
      
      return {
        hasAccess: access.status === 'active',
        accessSource: access.accessSource,
        status: access.status,
        canPreview: product?.isFree || false,
        progress: access.progress,
        isCompleted: access.isCompleted,
        lastAccessedAt: access.lastAccessedAt
      };
    } catch (error) {
      logger.error('Error in AccessService.checkAccess:', error);
      throw new AppError('Failed to check access', 500);
    }
  }

  /**
   * Add free product to user's library
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Object} Access record
   */
  static async addToLibrary(userId, productId) {
    try {
      // Check if product exists and is free
      const product = await Product.findById(productId).lean();
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      
      if (!product.isFree) {
        throw new AppError('Cannot add paid product to library without purchase', 400);
      }
      
      // Grant free access
      return await this.grantAccess(userId, productId, 'free');
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof AppError) {
        throw error;
      }
      logger.error('Error in AccessService.addToLibrary:', error);
      throw new AppError('Failed to add product to library', 500);
    }
  }

  /**
   * Revoke user access to a product
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {string} reason - Reason for revocation
   * @returns {Object} Revocation result
   */
  static async revokeAccess(userId, productId, reason = 'admin_action') {
    try {
      const access = await UserProductAccess.findOne({ userId, productId });
      
      if (!access) {
        throw new NotFoundError('Access record not found');
      }
      
      // Update status to revoked
      access.status = 'revoked';
      access.isInLibrary = false;
      await access.save();
      
      logger.warn(`Access revoked: user ${userId}, product ${productId}, reason: ${reason}`);
      
      return {
        message: 'Access revoked successfully',
        userId,
        productId,
        reason
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in AccessService.revokeAccess:', error);
      throw new AppError('Failed to revoke access', 500);
    }
  }

  /**
   * Update user progress for a product
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {Object} progressData - Type-specific progress data
   * @returns {Object} Updated access record
   */
  static async updateProgress(userId, productId, progress, progressData = {}) {
    try {
      const access = await UserProductAccess.findOne({ userId, productId, status: 'active' });
      
      if (!access) {
        throw new NotFoundError('Active access record not found');
      }
      
      // Validate progress
      if (progress < 0 || progress > 100) {
        throw new ValidationError('Progress must be between 0 and 100');
      }
      
      // Update progress and data
      access.progress = progress;
      access.lastAccessedAt = new Date();
      
      // Merge progress data
      if (progressData && typeof progressData === 'object') {
        access.progressData = { ...access.progressData, ...progressData };
      }
      
      await access.save();
      
      logger.info(`Progress updated: user ${userId}, product ${productId}, progress: ${progress}%`);
      
      return access.toObject();
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error in AccessService.updateProgress:', error);
      throw new AppError('Failed to update progress', 500);
    }
  }

  /**
   * Get access statistics for a product
   * @param {string} productId - Product ID
   * @returns {Object} Access statistics
   */
  static async getAccessStats(productId) {
    try {
      const stats = await UserProductAccess.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: null,
            totalAccess: { $sum: 1 },
            activeAccess: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            revokedAccess: { $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] } },
            completedAccess: { $sum: { $cond: ['$isCompleted', 1, 0] } },
            averageProgress: { $avg: '$progress' },
            accessBySource: {
              $push: '$accessSource'
            }
          }
        }
      ]);
      
      const result = stats[0] || {
        totalAccess: 0,
        activeAccess: 0,
        revokedAccess: 0,
        completedAccess: 0,
        averageProgress: 0,
        accessBySource: []
      };
      
      // Count by source
      const sourceCounts = result.accessBySource.reduce((acc, source) => {
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...result,
        accessBySource: sourceCounts,
        completionRate: result.totalAccess > 0 ? Math.round((result.completedAccess / result.totalAccess) * 100) : 0
      };
    } catch (error) {
      logger.error('Error in AccessService.getAccessStats:', error);
      throw new AppError('Failed to fetch access statistics', 500);
    }
  }

  /**
   * Check if user owns access to a product
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {boolean} Ownership status
   */
  static async checkOwnership(userId, productId) {
    try {
      const access = await UserProductAccess.findOne({
        userId,
        productId,
        status: 'active'
      }).select('_id').lean();
      
      return !!access;
    } catch (error) {
      logger.error('Error in AccessService.checkOwnership:', error);
      return false;
    }
  }

  /**
   * Get recently accessed products for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of products to return
   * @returns {Array} Recently accessed products
   */
  static async getRecentlyAccessed(userId, limit = 10) {
    try {
      const recentItems = await UserProductAccess
        .find({ userId, status: 'active', isInLibrary: true })
        .populate('productId', 'title thumbnail productType category')
        .sort({ lastAccessedAt: -1 })
        .limit(limit)
        .lean();
      
      return recentItems;
    } catch (error) {
      logger.error('Error in AccessService.getRecentlyAccessed:', error);
      throw new AppError('Failed to fetch recently accessed products', 500);
    }
  }
}

export default AccessService;
