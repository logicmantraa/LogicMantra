import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Database Index Configuration
 * Optimizes query performance with strategic indexes
 */

/**
 * Create all necessary database indexes
 */
export const createIndexes = async () => {
  try {
    logger.info('Starting database index creation');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    // User collection indexes
    await createUserIndexes(db);
    
    // Rating collection indexes
    await createRatingIndexes(db);
    
    // PendingRegistration collection indexes
    await createPendingRegistrationIndexes(db);
    
    // PasswordReset collection indexes
    await createPasswordResetIndexes(db);
    
    // Contact collection indexes
    await createContactIndexes(db);
    
    // Product collection indexes
    await createProductIndexes(db);
    
    // UserProductAccess collection indexes
    await createUserProductAccessIndexes(db);
    
    logger.info('All database indexes created successfully');
    
    // Log index statistics
    await logIndexStatistics(db);
    
  } catch (error) {
    logger.error('Failed to create database indexes', error);
    throw error;
  }
};

/**
 * Create User collection indexes
 */
const createUserIndexes = async (db) => {
  const userCollection = db.collection('users');
  
  const indexes = [
    // Email index for authentication and lookups
    { key: { email: 1 }, name: 'email_index', unique: true },
    
    // Admin status index for admin queries
    { key: { isAdmin: 1 }, name: 'admin_index' },
    
    // Email verification status index
    { key: { emailVerified: 1 }, name: 'email_verified_index' },
    
    // Account status index
    { key: { status: 1 }, name: 'status_index' },
    
    // Created at index for user analytics
    { key: { createdAt: -1 }, name: 'created_at_index' },
    
    // Compound index for admin user queries
    { 
      key: { isAdmin: 1, emailVerified: 1, status: 1 }, 
      name: 'admin_user_query_index' 
    },
    
    // Text index for user search (name, email)
    { 
      key: { 
        name: 'text', 
        email: 'text' 
      }, 
      name: 'user_search_index',
      default_language: 'none'
    }
  ];
  
  for (const index of indexes) {
    try {
      await userCollection.createIndex(index.key, { 
        name: index.name, 
        unique: index.unique || false,
        background: true 
      });
      logger.debug(`Created user index: ${index.name}`);
    } catch (error) {
      logger.warn(`Failed to create user index ${index.name}:`, error.message);
    }
  }
};


/**
 * Create Rating collection indexes
 */
const createRatingIndexes = async (db) => {
  const ratingCollection = db.collection('ratings');
  
  const indexes = [
    // Product ID index for product rating lookups
    { key: { productId: 1 }, name: 'product_rating_index' },
    
    // User ID index for user rating lookups
    { key: { userId: 1 }, name: 'user_rating_index' },
    
    // Compound index for user product rating (unique constraint)
    { 
      key: { userId: 1, productId: 1 }, 
      name: 'user_product_rating_index',
      unique: true 
    },
    
    // Rating value index for statistics
    { key: { rating: 1 }, name: 'rating_value_index' },
    
    // Created at index for sorting
    { key: { createdAt: -1 }, name: 'rating_created_at_index' },
    
    // Updated at index for recent updates
    { key: { updatedAt: -1 }, name: 'rating_updated_at_index' },
    
    // Compound index for course rating statistics
    { 
      key: { courseId: 1, rating: 1, createdAt: -1 }, 
      name: 'course_rating_stats_index' 
    }
  ];
  
  for (const index of indexes) {
    try {
      await ratingCollection.createIndex(index.key, { 
        name: index.name, 
        unique: index.unique || false,
        background: true 
      });
      logger.debug(`Created rating index: ${index.name}`);
    } catch (error) {
      logger.warn(`Failed to create rating index ${index.name}:`, error.message);
    }
  }
};

/**
 * Create PendingRegistration collection indexes
 */
const createPendingRegistrationIndexes = async (db) => {
  const pendingCollection = db.collection('pendingregistrations');
  
  const indexes = [
    // Email index for lookup
    { key: { email: 1 }, name: 'pending_email_index' },
    
    // OTP index for verification
    { key: { otp: 1 }, name: 'pending_otp_index' },
    
    // OTP expiry index for cleanup
    { key: { otpExpiry: 1 }, name: 'pending_otp_expiry_index' },
    
    // Created at index for cleanup
    { key: { createdAt: -1 }, name: 'pending_created_at_index' }
  ];
  
  for (const index of indexes) {
    try {
      await pendingCollection.createIndex(index.key, { 
        name: index.name, 
        background: true 
      });
      logger.debug(`Created pending registration index: ${index.name}`);
    } catch (error) {
      logger.warn(`Failed to create pending registration index ${index.name}:`, error.message);
    }
  }
};

/**
 * Create PasswordReset collection indexes
 */
const createPasswordResetIndexes = async (db) => {
  const passwordResetCollection = db.collection('passwordresets');
  
  const indexes = [
    // User ID index for lookup
    { key: { userId: 1 }, name: 'password_reset_user_index' },
    
    // Reset token index for verification
    { key: { resetToken: 1 }, name: 'password_reset_token_index' },
    
    // Token expiry index for cleanup
    { key: { resetTokenExpiry: 1 }, name: 'password_reset_expiry_index' },
    
    // Created at index for cleanup
    { key: { createdAt: -1 }, name: 'password_reset_created_at_index' }
  ];
  
  for (const index of indexes) {
    try {
      await passwordResetCollection.createIndex(index.key, { 
        name: index.name, 
        background: true 
      });
      logger.debug(`Created password reset index: ${index.name}`);
    } catch (error) {
      logger.warn(`Failed to create password reset index ${index.name}:`, error.message);
    }
  }
};

/**
 * Create Contact collection indexes
 */
const createContactIndexes = async (db) => {
  const contactCollection = db.collection('contacts');
  
  const indexes = [
    // Email index for lookup
    { key: { email: 1 }, name: 'contact_email_index' },
    
    // Status index for filtering
    { key: { status: 1 }, name: 'contact_status_index' },
    
    // Created at index for sorting
    { key: { createdAt: -1 }, name: 'contact_created_at_index' },
    
    // Text index for search
    { 
      key: { 
        name: 'text', 
        email: 'text', 
        message: 'text' 
      }, 
      name: 'contact_search_index',
      default_language: 'none'
    }
  ];
  
  for (const index of indexes) {
    try {
      await contactCollection.createIndex(index.key, { 
        name: index.name, 
        background: true 
      });
      logger.debug(`Created contact index: ${index.name}`);
    } catch (error) {
      logger.warn(`Failed to create contact index ${index.name}:`, error.message);
    }
  }
};

/**
 * Create Product collection indexes
 */
const createProductIndexes = async (db) => {
  const productCollection = db.collection('products');
  
  const indexes = [
    // Text index for search functionality
    { 
      key: { 
        title: 'text', 
        description: 'text'
      }, 
      name: 'product_search_index',
      default_language: 'none'
    },
    
    // Product type and category compound index
    { key: { productType: 1, category: 1 }, name: 'product_type_category_index' },
    
    // Status index for filtering published products
    { key: { status: 1 }, name: 'product_status_index' },
    
    // Rating index for sorting top-rated products
    { key: { rating: -1 }, name: 'product_rating_index' },
    
    // Created by index for ownership queries
    { key: { createdBy: 1 }, name: 'product_created_by_index' },
    
    // Created at index for sorting
    { key: { createdAt: -1 }, name: 'product_created_at_index' }
  ];
  
  for (const index of indexes) {
    try {
      await productCollection.createIndex(index.key, { 
        name: index.name, 
        unique: index.unique || false,
        background: true 
      });
      logger.debug(`Created product index: ${index.name}`);
    } catch (error) {
      logger.warn(`Failed to create product index ${index.name}:`, error.message);
    }
  }
};

/**
 * Create UserProductAccess collection indexes
 */
const createUserProductAccessIndexes = async (db) => {
  const userProductAccessCollection = db.collection('userproductaccesses');
  
  const indexes = [
    // Unique compound index for user-product access
    { 
      key: { userId: 1, productId: 1 }, 
      name: 'user_product_access_index',
      unique: true 
    },
    
    // User library index for user's library queries
    { key: { userId: 1, isInLibrary: 1 }, name: 'user_library_index' },
    
    // Last accessed index for recent activity
    { key: { lastAccessedAt: -1 }, name: 'last_accessed_index' },
    
    // Status index for active/revoked filtering
    { key: { status: 1 }, name: 'access_status_index' },
    
    // Created at index for sorting
    { key: { createdAt: -1 }, name: 'access_created_at_index' }
  ];
  
  for (const index of indexes) {
    try {
      await userProductAccessCollection.createIndex(index.key, { 
        name: index.name, 
        unique: index.unique || false,
        background: true 
      });
      logger.debug(`Created userproductaccess index: ${index.name}`);
    } catch (error) {
      logger.warn(`Failed to create userproductaccess index ${index.name}:`, error.message);
    }
  }
};

/**
 * Log index statistics for monitoring
 */
const logIndexStatistics = async (db) => {
  try {
    const collections = ['users', 'courses', 'enrollments', 'ratings', 'pendingregistrations', 'passwordresets', 'contacts', 'products', 'userproductaccesses'];
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.indexInformation();
        
        logger.info(`Index statistics for ${collectionName}`, {
          collection: collectionName,
          indexCount: Object.keys(indexes).length,
          indexes: Object.keys(indexes)
        });
      } catch (error) {
        logger.warn(`Failed to get index statistics for ${collectionName}:`, error.message);
      }
    }
  } catch (error) {
    logger.error('Failed to log index statistics:', error);
  }
};

/**
 * Drop all indexes (for testing/reset)
 */
export const dropAllIndexes = async () => {
  try {
    logger.warn('Dropping all database indexes');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        await db.collection(collection.name).dropIndexes();
        logger.debug(`Dropped indexes for collection: ${collection.name}`);
      } catch (error) {
        logger.warn(`Failed to drop indexes for ${collection.name}:`, error.message);
      }
    }
    
    logger.info('All database indexes dropped successfully');
  } catch (error) {
    logger.error('Failed to drop database indexes:', error);
    throw error;
  }
};

/**
 * Get index usage statistics
 */
export const getIndexUsageStats = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = ['users', 'products', 'userproductaccesses', 'ratings'];
    const stats = {};
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.indexInformation();
        
        stats[collectionName] = {
          indexCount: Object.keys(indexes).length,
          indexes: Object.keys(indexes)
        };
      } catch (error) {
        logger.warn(`Failed to get index stats for ${collectionName}:`, error.message);
        stats[collectionName] = { error: error.message };
      }
    }
    
    return stats;
  } catch (error) {
    logger.error('Failed to get index usage statistics:', error);
    return {};
  }
};

export default {
  createIndexes,
  dropAllIndexes,
  getIndexUsageStats
};
