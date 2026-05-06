import AccessService from '../services/AccessService.js';
import ProductService from '../services/ProductService.js';
import { AppError, NotFoundError, ValidationError } from '../errors/customErrors.js';
import logger from '../utils/logger.js';

/**
 * LibraryController - Handles user library-related API endpoints
 * Manages user-owned products, progress tracking, and library management
 */
class LibraryController {
  /**
   * Get user's library with products and statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getMyLibrary(req, res, next) {
    try {
      const userId = req.user.id; // Required from auth middleware

      // Extract pagination parameters
      const {
        page = 1,
        limit = 20,
        sortBy = 'addedToLibraryAt',
        sortOrder = 'desc'
      } = req.query;

      const pagination = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        sortBy,
        sortOrder
      };

      // Get library from service
      const library = await AccessService.getUserLibrary(userId, pagination);

      // Standardized success response
      res.json({
        success: true,
        data: library
      });
    } catch (error) {
      logger.error('Error in LibraryController.getMyLibrary:', error);
      next(error);
    }
  }

  /**
   * Get library product details with access verification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getLibraryProductDetails(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Required from auth middleware

      // Validate product ID
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ValidationError('Invalid product ID format');
      }

      // Check user access
      const accessInfo = await AccessService.checkAccess(userId, id);
      
      if (!accessInfo.hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Product not in your library.',
          error: 'ACCESS_DENIED'
        });
      }

      // Get product details
      const product = await ProductService.getProductById(id, userId);

      // Get full access record for progress info
      const library = await AccessService.getUserLibrary(userId);
      const accessRecord = library.library.find(item => 
        item.productId.toString() === id.toString()
      );

      // Standardized success response
      res.json({
        success: true,
        data: {
          product,
          access: {
            progress: accessRecord?.progress || 0,
            progressData: accessRecord?.progressData || {},
            lastAccessedAt: accessRecord?.lastAccessedAt,
            isCompleted: accessRecord?.isCompleted || false,
            addedToLibraryAt: accessRecord?.addedToLibraryAt,
            accessSource: accessInfo.accessSource,
            status: accessInfo.status
          }
        }
      });
    } catch (error) {
      logger.error('Error in LibraryController.getLibraryProductDetails:', error);
      next(error);
    }
  }

  /**
   * Remove product from user's library (soft remove)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async removeFromLibrary(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Required from auth middleware

      // Validate product ID
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ValidationError('Invalid product ID format');
      }

      // Check user access first
      const accessInfo = await AccessService.checkAccess(userId, id);
      
      if (!accessInfo.hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Product not in your library.',
          error: 'ACCESS_DENIED'
        });
      }

      // Remove from library (set isInLibrary = false)
      const result = await AccessService.revokeAccess(userId, id, 'user_removed');

      // Standardized success response
      res.json({
        success: true,
        data: {
          message: 'Product removed from library successfully',
          productId: id
        }
      });
    } catch (error) {
      logger.error('Error in LibraryController.removeFromLibrary:', error);
      next(error);
    }
  }

  /**
   * Get recently accessed products from user's library
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getRecentlyAccessed(req, res, next) {
    try {
      const userId = req.user.id; // Required from auth middleware
      const { limit = 10 } = req.query;

      // Get recently accessed products
      const recentItems = await AccessService.getRecentlyAccessed(userId, parseInt(limit));

      // Standardized success response
      res.json({
        success: true,
        data: {
          products: recentItems,
          count: recentItems.length
        }
      });
    } catch (error) {
      logger.error('Error in LibraryController.getRecentlyAccessed:', error);
      next(error);
    }
  }

  /**
   * Get library statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getLibraryStats(req, res, next) {
    try {
      const userId = req.user.id; // Required from auth middleware

      // Get library with stats
      const library = await AccessService.getUserLibrary(userId, { limit: 1000 });

      // Calculate additional statistics
      const stats = {
        ...library.stats,
        recentlyAccessed: library.library
          .filter(item => item.lastAccessedAt)
          .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
          .slice(0, 5)
          .map(item => ({
            productId: item.productId,
            title: item.productId?.title || 'Unknown',
            lastAccessedAt: item.lastAccessedAt
          }))
      };

      // Standardized success response
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Error in LibraryController.getLibraryStats:', error);
      next(error);
    }
  }

  /**
   * Update progress for a library product
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async updateProgress(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Required from auth middleware
      const { progress, progressData } = req.body;

      // Validate product ID
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ValidationError('Invalid product ID format');
      }

      // Validate progress
      if (progress !== undefined && (progress < 0 || progress > 100)) {
        throw new ValidationError('Progress must be between 0 and 100');
      }

      // Check user access
      const accessInfo = await AccessService.checkAccess(userId, id);
      
      if (!accessInfo.hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Product not in your library.',
          error: 'ACCESS_DENIED'
        });
      }

      // Update progress
      const updatedAccess = await AccessService.updateProgress(userId, id, progress, progressData);

      // Standardized success response
      res.json({
        success: true,
        data: {
          message: 'Progress updated successfully',
          progress: updatedAccess.progress,
          progressData: updatedAccess.progressData
        }
      });
    } catch (error) {
      logger.error('Error in LibraryController.updateProgress:', error);
      next(error);
    }
  }
}

export default LibraryController;
