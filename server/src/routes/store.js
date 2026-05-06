import express from 'express';
import {
  getStoreProducts,
  getProductDetails,
  addFreeProductToLibrary,
  purchaseProduct,
  getProductCategories,
  getProductTypes
} from '../controllers/storeController.js';
import { protect } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

/**
 * Store Routes - Product browsing and management endpoints
 * Base path: /api/store
 */

// GET /api/store/products - Get all products with filtering and pagination
router.get('/products', getStoreProducts);

// GET /api/store/products/categories - Get available product categories
router.get('/products/categories', getProductCategories);

// GET /api/store/products/types - Get available product types
router.get('/products/types', getProductTypes);

// GET /api/store/products/:id - Get product details
router.get('/products/:id', validateObjectId, getProductDetails);

// POST /api/store/products/:id/add-to-library - Add free product to library (auth required)
router.post('/products/:id/add-to-library', 
  protect, 
  validateObjectId, 
  addFreeProductToLibrary
);

// POST /api/store/products/:id/purchase - Purchase product (auth required, placeholder)
router.post('/products/:id/purchase', 
  protect, 
  validateObjectId, 
  purchaseProduct
);

export default router;
