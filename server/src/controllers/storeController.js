import ProductService from '../services/ProductService.js';
import AccessService from '../services/AccessService.js';
import { AppError, NotFoundError, ValidationError } from '../errors/customErrors.js';
import logger from '../config/logger.js';

/**
 * StoreController - Handles store-related API endpoints
 * Manages product browsing, details, and library additions
 */
class StoreController {
  /**
   * Get store products with filtering and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getStoreProducts(req, res, next) {
    try {
      // Extract and validate query parameters
      const {
        productType,
        category,
        minPrice,
        maxPrice,
        minRating,
        rating,
        page = 1,
        limit = 20,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filters object
      const filters = {};
      
      if (productType) filters.productType = productType;
      if (category) filters.category = category;
      if (minPrice) filters.minPrice = minPrice;
      if (maxPrice) filters.maxPrice = maxPrice;
      if (minRating || rating) filters.minRating = minRating || rating;
      if (search) filters.search = search;

      // Validate pagination
      const pagination = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100), // Cap at 100 for performance
        sortBy,
        sortOrder
      };

      // Get products from service
      const result = await ProductService.getProducts(filters, pagination);

      // Standardized success response
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in StoreController.getStoreProducts:', error);
      next(error);
    }
  }

  /**
   * Get product details with optional access info
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getProductDetails(req, res, next) {
    try {
      const { id } = req.params;

      // Validate product ID
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ValidationError('Invalid product ID format');
      }

      // Get product details
      const userId = req.user?.id; // Optional user ID from auth middleware
      const product = await ProductService.getProductById(id, userId);

      // Standardized success response
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Error in StoreController.getProductDetails:', error);
      next(error);
    }
  }

  /**
   * Add free product to user's library
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async addFreeProductToLibrary(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Required from auth middleware

      // Validate product ID
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ValidationError('Invalid product ID format');
      }

      // Add to library via service
      const access = await AccessService.addToLibrary(userId, id);

      // Standardized success response
      res.status(201).json({
        success: true,
        data: {
          message: 'Product added to library successfully',
          access
        }
      });
    } catch (error) {
      logger.error('Error in StoreController.addFreeProductToLibrary:', error);
      next(error);
    }
  }

  /**
   * Purchase product (placeholder for future payment integration)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async purchaseProduct(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Required from auth middleware

      // Validate product ID
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ValidationError('Invalid product ID format');
      }

      // Check if product exists and is not free
      const product = await ProductService.getProductById(id);
      
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (product.isFree) {
        throw new AppError('Cannot purchase free product. Use add to library instead.', 400);
      }

      // Placeholder response for future payment integration
      res.json({
        success: true,
        data: {
          message: 'Payment integration coming soon',
          productId: id,
          userId,
          price: product.price
        }
      });
    } catch (error) {
      logger.error('Error in StoreController.purchaseProduct:', error);
      next(error);
    }
  }

  /**
   * Get product categories (helper endpoint)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getProductCategories(req, res, next) {
    try {
      // Get unique categories from products
      const categories = await ProductService.getProducts({}, { limit: 1000 })
        .then(result => {
          const uniqueCategories = [...new Set(result.products.map(p => p.category))];
          return uniqueCategories.filter(Boolean).sort();
        });

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Error in StoreController.getProductCategories:', error);
      next(error);
    }
  }

  /**
   * Get product types (helper endpoint)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getProductTypes(req, res, next) {
    try {
      const productTypes = ['course', 'test_series', 'practice_quiz', 'pdf', 'ebook'];

      res.json({
        success: true,
        data: { productTypes }
      });
    } catch (error) {
      logger.error('Error in StoreController.getProductTypes:', error);
      next(error);
    }
  }
}

// Export individual functions for Express route compatibility
export const getStoreProducts = StoreController.getStoreProducts;
export const getProductDetails = StoreController.getProductDetails;
export const addFreeProductToLibrary = StoreController.addFreeProductToLibrary;
export const purchaseProduct = StoreController.purchaseProduct;
export const getProductCategories = StoreController.getProductCategories;
export const getProductTypes = StoreController.getProductTypes;

export default StoreController;
