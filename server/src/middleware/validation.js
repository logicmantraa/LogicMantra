import { ValidationError } from '../errors/customErrors.js';

/**
 * Validation Middleware - Simple validation utilities
 * Provides basic validation for common use cases
 */

/**
 * Validates MongoDB ObjectId format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateObjectId = (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID parameter is required',
        error: 'MISSING_ID'
      });
    }
    
    // Check if valid ObjectId format (24 character hex string)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: 'INVALID_ID_FORMAT'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Validates pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validatePagination = (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Page must be a positive integer',
          error: 'INVALID_PAGE'
        });
      }
    }
    
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100',
          error: 'INVALID_LIMIT'
        });
      }
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Validates price range parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validatePriceRange = (req, res, next) => {
  try {
    const { minPrice, maxPrice } = req.query;
    
    if (minPrice !== undefined) {
      const min = parseFloat(minPrice);
      if (isNaN(min) || min < 0) {
        return res.status(400).json({
          success: false,
          message: 'Minimum price must be a non-negative number',
          error: 'INVALID_MIN_PRICE'
        });
      }
    }
    
    if (maxPrice !== undefined) {
      const max = parseFloat(maxPrice);
      if (isNaN(max) || max < 0) {
        return res.status(400).json({
          success: false,
          message: 'Maximum price must be a non-negative number',
          error: 'INVALID_MAX_PRICE'
        });
      }
    }
    
    // Check if minPrice <= maxPrice when both are provided
    if (minPrice !== undefined && maxPrice !== undefined) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (min > max) {
        return res.status(400).json({
          success: false,
          message: 'Minimum price cannot be greater than maximum price',
          error: 'INVALID_PRICE_RANGE'
        });
      }
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Validates rating parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateRating = (req, res, next) => {
  try {
    const { rating, minRating } = req.query;
    
    if (rating !== undefined) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 0 and 5',
          error: 'INVALID_RATING'
        });
      }
    }
    
    if (minRating !== undefined) {
      const minRatingNum = parseFloat(minRating);
      if (isNaN(minRatingNum) || minRatingNum < 0 || minRatingNum > 5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum rating must be between 0 and 5',
          error: 'INVALID_MIN_RATING'
        });
      }
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Validates progress parameter (0-100)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateProgress = (req, res, next) => {
  try {
    const { progress } = req.body;
    
    if (progress !== undefined) {
      const progressNum = parseFloat(progress);
      if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Progress must be between 0 and 100',
          error: 'INVALID_PROGRESS'
        });
      }
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Combines multiple validation middleware
 * @param {...Function} validators - Array of validation middleware functions
 * @returns {Function} Combined middleware function
 */
export const validateMultiple = (...validators) => {
  return (req, res, next) => {
    let index = 0;
    
    const runNext = () => {
      if (index >= validators.length) {
        return next();
      }
      
      const validator = validators[index];
      index++;
      
      // Override next to continue with next validator instead of route handler
      const originalNext = next;
      next = (error) => {
        if (error) {
          return originalNext(error);
        }
        runNext();
      };
      
      validator(req, res, next);
    };
    
    runNext();
  };
};

export default {
  validateObjectId,
  validatePagination,
  validatePriceRange,
  validateRating,
  validateProgress,
  validateMultiple
};
