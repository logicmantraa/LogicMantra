import express from 'express';
import LibraryController from '../controllers/LibraryController.js';
import { protect } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

/**
 * Library Routes - User library management endpoints
 * Base path: /api/library
 * All routes require authentication
 */

// GET /api/library - Get user's library with products and statistics
router.get('/', 
  protect, 
  LibraryController.getMyLibrary
);

// GET /api/library/recent - Get recently accessed products
router.get('/recent', 
  protect, 
  LibraryController.getRecentlyAccessed
);

// GET /api/library/stats - Get library statistics
router.get('/stats', 
  protect, 
  LibraryController.getLibraryStats
);

// GET /api/library/:id - Get library product details with access verification
router.get('/:id', 
  protect, 
  validateObjectId, 
  LibraryController.getLibraryProductDetails
);

// PATCH /api/library/:id/remove - Remove product from library (soft remove)
router.patch('/:id/remove', 
  protect, 
  validateObjectId, 
  LibraryController.removeFromLibrary
);

// PUT /api/library/:id/progress - Update progress for a library product
router.put('/:id/progress', 
  protect, 
  validateObjectId, 
  LibraryController.updateProgress
);

export default router;
