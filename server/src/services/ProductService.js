import Product from '../models/Product.js';
import { AppError, NotFoundError, ValidationError } from '../errors/customErrors.js';
import logger from '../utils/logger.js';

/**
 * ProductService - Universal product operations
 * Handles all product types with consistent interface
 */
class ProductService {
  /**
   * Build search query from filters
   * @param {Object} filters - Search and filter parameters
   * @returns {Object} MongoDB query object
   */
  static buildSearchQuery(filters) {
    const { 
      search, 
      productType, 
      category, 
      minRating, 
      maxPrice, 
      minPrice,
      isFree, 
      status,
      createdBy 
    } = filters;
    
    const query = {};
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Product type filter
    if (productType) {
      query.productType = productType;
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }
    
    // Free/paid filter
    if (isFree !== undefined) {
      query.isFree = isFree === 'true' || isFree === true;
    }
    
    // Status filter (default to published for public queries)
    if (status) {
      query.status = status;
    } else {
      query.status = 'published';
    }
    
    // Creator filter
    if (createdBy) {
      query.createdBy = createdBy;
    }
    
    return query;
  }

  /**
   * Get products with search, filters, and pagination
   * @param {Object} filters - Search and filter parameters
   * @param {Object} pagination - Pagination parameters
   * @returns {Object} Products and pagination info
   */
  static async getProducts(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      
      const query = this.buildSearchQuery(filters);
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Calculate skip for pagination
      const skip = (page - 1) * limit;
      
      // Execute query with lean for performance
      const products = await Product
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Get total count for pagination
      const total = await Product.countDocuments(query);
      
      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error in ProductService.getProducts:', error);
      throw new AppError('Failed to fetch products', 500);
    }
  }

  /**
   * Get single product by ID with optional access info
   * @param {string} productId - Product ID
   * @param {string} userId - Optional user ID for access info
   * @returns {Object} Product details with access info
   */
  static async getProductById(productId, userId = null) {
    try {
      const product = await Product.findById(productId).lean();
      
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      
      // Add access info if user ID provided
      let accessInfo = null;
      if (userId) {
        const { AccessService } = await import('./AccessService.js');
        accessInfo = await AccessService.checkAccess(userId, productId);
      }
      
      return {
        ...product,
        accessInfo
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in ProductService.getProductById:', error);
      throw new AppError('Failed to fetch product', 500);
    }
  }

  /**
   * Create new product
   * @param {Object} productData - Product data
   * @param {string} userId - Creator user ID
   * @returns {Object} Created product
   */
  static async createProduct(productData, userId) {
    try {
      // Validate required fields
      const validation = this.validateProductData(productData);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors);
      }
      
      // Set creator and default status
      const product = new Product({
        ...productData,
        createdBy: userId,
        status: productData.status || 'draft'
      });
      
      await product.save();
      
      logger.info(`Product created: ${product._id} by user: ${userId}`);
      
      return product.toObject();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error in ProductService.createProduct:', error);
      throw new AppError('Failed to create product', 500);
    }
  }

  /**
   * Update existing product
   * @param {string} productId - Product ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User making the update
   * @returns {Object} Updated product
   */
  static async updateProduct(productId, updateData, userId) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      
      // Check ownership (can be extended for admin role)
      if (product.createdBy.toString() !== userId.toString()) {
        throw new AppError('Not authorized to update this product', 403);
      }
      
      // Validate update data
      const validation = this.validateProductData(updateData, true);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors);
      }
      
      // Update product
      Object.assign(product, updateData);
      await product.save();
      
      logger.info(`Product updated: ${productId} by user: ${userId}`);
      
      return product.toObject();
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error in ProductService.updateProduct:', error);
      throw new AppError('Failed to update product', 500);
    }
  }

  /**
   * Soft delete product (archive)
   * @param {string} productId - Product ID
   * @param {string} userId - User making the deletion
   * @returns {Object} Deletion result
   */
  static async deleteProduct(productId, userId) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      
      // Check ownership
      if (product.createdBy.toString() !== userId.toString()) {
        throw new AppError('Not authorized to delete this product', 403);
      }
      
      // Soft delete by archiving
      product.status = 'archived';
      await product.save();
      
      logger.info(`Product archived: ${productId} by user: ${userId}`);
      
      return { 
        message: 'Product archived successfully',
        productId 
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in ProductService.deleteProduct:', error);
      throw new AppError('Failed to delete product', 500);
    }
  }

  /**
   * Validate product data
   * @param {Object} productData - Product data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  static validateProductData(productData, isUpdate = false) {
    const errors = [];
    
    // Required fields for creation
    if (!isUpdate) {
      if (!productData.title || productData.title.trim().length === 0) {
        errors.push('Product title is required');
      }
      
      if (!productData.description || productData.description.trim().length === 0) {
        errors.push('Product description is required');
      }
      
      if (!productData.productType) {
        errors.push('Product type is required');
      }
      
      if (!productData.category || productData.category.trim().length === 0) {
        errors.push('Product category is required');
      }
    }
    
    // Field validation
    if (productData.title && productData.title.length > 200) {
      errors.push('Product title must be less than 200 characters');
    }
    
    if (productData.description && productData.description.length > 2000) {
      errors.push('Product description must be less than 2000 characters');
    }
    
    if (productData.price !== undefined && (isNaN(productData.price) || productData.price < 0)) {
      errors.push('Product price must be a positive number');
    }
    
    if (productData.productType && !['course', 'test_series', 'practice_quiz', 'pdf', 'ebook'].includes(productData.productType)) {
      errors.push('Invalid product type');
    }
    
    if (productData.status && !['draft', 'published', 'archived'].includes(productData.status)) {
      errors.push('Invalid product status');
    }
    
    if (productData.rating !== undefined && (productData.rating < 0 || productData.rating > 5)) {
      errors.push('Product rating must be between 0 and 5');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if product exists
   * @param {string} productId - Product ID
   * @returns {boolean} Product exists status
   */
  static async productExists(productId) {
    try {
      const product = await Product.findById(productId).select('_id').lean();
      return !!product;
    } catch (error) {
      logger.error('Error in ProductService.productExists:', error);
      return false;
    }
  }

  /**
   * Get popular products by rating
   * @param {number} limit - Number of products to return
   * @param {Object} filters - Additional filters
   * @returns {Array} List of popular products
   */
  static async getPopularProducts(limit = 10, filters = {}) {
    try {
      const query = this.buildSearchQuery({ ...filters, status: 'published' });
      
      const products = await Product
        .find(query)
        .sort({ rating: -1 })
        .limit(limit)
        .select('title productType category rating thumbnail price isFree')
        .lean();
      
      return products;
    } catch (error) {
      logger.error('Error in ProductService.getPopularProducts:', error);
      throw new AppError('Failed to fetch popular products', 500);
    }
  }

  /**
   * Get products by creator
   * @param {string} userId - Creator user ID
   * @param {Object} pagination - Pagination parameters
   * @returns {Object} Products and pagination info
   */
  static async getProductsByCreator(userId, pagination = {}) {
    return this.getProducts({ createdBy: userId }, pagination);
  }
}

export default ProductService;
