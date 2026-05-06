import mongoose from 'mongoose';
import { createIndexes, getIndexUsageStats } from '../config/databaseIndexes.js';
import logger from '../config/logger.js';

/**
 * Database Optimization Script
 * Creates indexes and optimizes database performance
 */

/**
 * Main optimization function
 */
export const optimizeDatabase = async () => {
  try {
    logger.info('Starting database optimization');
    
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    
    // Step 1: Create all indexes
    await createIndexes();
    
    // Step 2: Analyze and optimize collections
    await analyzeCollections();
    
    // Step 3: Get performance statistics
    const stats = await getPerformanceStats();
    
    logger.info('Database optimization completed successfully', stats);
    
    return stats;
  } catch (error) {
    logger.error('Database optimization failed', error);
    throw error;
  }
};

/**
 * Analyze and optimize collections
 */
const analyzeCollections = async () => {
  try {
    logger.info('Analyzing collection performance');
    
    const db = mongoose.connection.db;
    const collections = ['users', 'courses', 'enrollments', 'ratings'];
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        
        // Get collection statistics
        const stats = await collection.stats();
        
        logger.info(`Collection statistics for ${collectionName}`, {
          collection: collectionName,
          documentCount: stats.count,
          sizeInBytes: stats.size,
          avgDocumentSize: stats.avgObjSize,
          indexCount: stats.nindexes,
          indexSize: stats.totalIndexSize
        });
        
        // Check for potential optimizations
        await suggestOptimizations(collectionName, stats);
        
      } catch (error) {
        logger.warn(`Failed to analyze collection ${collectionName}:`, error.message);
      }
    }
  } catch (error) {
    logger.error('Failed to analyze collections:', error);
  }
};

/**
 * Suggest optimizations based on collection stats
 */
const suggestOptimizations = async (collectionName, stats) => {
  const suggestions = [];
  
  // Check average document size
  if (stats.avgObjSize > 10000) { // 10KB
    suggestions.push('Consider reducing document size or splitting large documents');
  }
  
  // Check index efficiency
  if (stats.totalIndexSize > stats.size * 0.5) {
    suggestions.push('Index size is large compared to data size, review index necessity');
  }
  
  // Check document count
  if (stats.count > 100000) {
    suggestions.push('Large collection - consider sharding or additional indexes');
  }
  
  if (suggestions.length > 0) {
    logger.info(`Optimization suggestions for ${collectionName}`, {
      collection: collectionName,
      suggestions
    });
  }
};

/**
 * Get performance statistics
 */
const getPerformanceStats = async () => {
  try {
    logger.info('Gathering performance statistics');
    
    const db = mongoose.connection.db;
    
    // Get server status
    const serverStatus = await db.admin().serverStatus();
    
    // Get index usage statistics
    const indexStats = await getIndexUsageStats();
    
    // Get database statistics
    const dbStats = await db.stats();
    
    const performanceStats = {
      database: {
        name: dbStats.db,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        indexSize: dbStats.indexSize,
        storageSize: dbStats.storageSize
      },
      server: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections,
        memory: serverStatus.mem,
        network: serverStatus.network
      },
      indexes: indexStats,
      timestamp: new Date().toISOString()
    };
    
    logger.info('Performance statistics gathered', performanceStats);
    
    return performanceStats;
  } catch (error) {
    logger.error('Failed to get performance statistics:', error);
    return {};
  }
};

/**
 * Clean up expired documents
 */
export const cleanupExpiredDocuments = async () => {
  try {
    logger.info('Starting cleanup of expired documents');
    
    const db = mongoose.connection.db;
    const now = new Date();
    
    // Clean up expired pending registrations
    const pendingResult = await db.collection('pendingregistrations').deleteMany({
      otpExpiry: { $lt: now }
    });
    
    // Clean up expired password resets
    const resetResult = await db.collection('passwordresets').deleteMany({
      resetTokenExpiry: { $lt: now }
    });
    
    logger.info('Cleanup completed', {
      pendingRegistrationsDeleted: pendingResult.deletedCount,
      passwordResetsDeleted: resetResult.deletedCount
    });
    
    return {
      pendingRegistrationsDeleted: pendingResult.deletedCount,
      passwordResetsDeleted: resetResult.deletedCount
    };
  } catch (error) {
    logger.error('Failed to cleanup expired documents:', error);
    throw error;
  }
};

/**
 * Compact collections to reclaim disk space
 */
export const compactCollections = async () => {
  try {
    logger.info('Starting collection compaction');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const results = {};
    
    for (const collection of collections) {
      try {
        // Compact the collection
        await db.command({ compact: collection.name });
        results[collection.name] = 'success';
        logger.debug(`Compacted collection: ${collection.name}`);
      } catch (error) {
        results[collection.name] = error.message;
        logger.warn(`Failed to compact collection ${collection.name}:`, error.message);
      }
    }
    
    logger.info('Collection compaction completed', results);
    
    return results;
  } catch (error) {
    logger.error('Failed to compact collections:', error);
    throw error;
  }
};

/**
 * Validate data integrity
 */
export const validateDataIntegrity = async () => {
  try {
    logger.info('Starting data integrity validation');
    
    const db = mongoose.connection.db;
    const issues = [];
    
    // Check for orphaned enrollments
    const orphanedEnrollments = await db.collection('enrollments').aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $match: { 'course': null } }
    ]).toArray();
    
    if (orphanedEnrollments.length > 0) {
      issues.push({
        type: 'orphaned_enrollments',
        count: orphanedEnrollments.length,
        details: orphanedEnrollments.map(e => ({ enrollmentId: e._id, courseId: e.courseId }))
      });
    }
    
    // Check for orphaned ratings
    const orphanedRatings = await db.collection('ratings').aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $match: { 'course': null } }
    ]).toArray();
    
    if (orphanedRatings.length > 0) {
      issues.push({
        type: 'orphaned_ratings',
        count: orphanedRatings.length,
        details: orphanedRatings.map(r => ({ ratingId: r._id, courseId: r.courseId }))
      });
    }
    
    // Check for invalid rating values
    const invalidRatings = await db.collection('ratings').find({
      $or: [
        { rating: { $lt: 1 } },
        { rating: { $gt: 5 } }
      ]
    }).toArray();
    
    if (invalidRatings.length > 0) {
      issues.push({
        type: 'invalid_ratings',
        count: invalidRatings.length,
        details: invalidRatings.map(r => ({ ratingId: r._id, rating: r.rating }))
      });
    }
    
    logger.info('Data integrity validation completed', {
      totalIssues: issues.length,
      issues: issues.map(i => ({ type: i.type, count: i.count }))
    });
    
    return {
      totalIssues: issues.length,
      issues
    };
  } catch (error) {
    logger.error('Failed to validate data integrity:', error);
    throw error;
  }
};

/**
 * Generate performance report
 */
export const generatePerformanceReport = async () => {
  try {
    logger.info('Generating performance report');
    
    const stats = await getPerformanceStats();
    const indexStats = await getIndexUsageStats();
    const integrityIssues = await validateDataIntegrity();
    
    const report = {
      timestamp: new Date().toISOString(),
      database: stats.database,
      server: stats.server,
      indexes: indexStats,
      dataIntegrity: integrityIssues,
      recommendations: generateRecommendations(stats, indexStats, integrityIssues)
    };
    
    logger.info('Performance report generated', {
      databaseSize: stats.database.dataSize,
      indexCount: Object.values(indexStats).reduce((sum, coll) => sum + coll.indexCount, 0),
      integrityIssues: integrityIssues.totalIssues
    });
    
    return report;
  } catch (error) {
    logger.error('Failed to generate performance report:', error);
    throw error;
  }
};

/**
 * Generate optimization recommendations
 */
const generateRecommendations = (stats, indexStats, integrityIssues) => {
  const recommendations = [];
  
  // Database size recommendations
  if (stats.database.dataSize > 1000000000) { // 1GB
    recommendations.push({
      type: 'database_size',
      priority: 'medium',
      message: 'Database size is large, consider implementing data archiving'
    });
  }
  
  // Index recommendations
  const totalIndexes = Object.values(indexStats).reduce((sum, coll) => sum + coll.indexCount, 0);
  if (totalIndexes > 50) {
    recommendations.push({
      type: 'index_count',
      priority: 'low',
      message: 'High number of indexes, review for necessity'
    });
  }
  
  // Data integrity recommendations
  if (integrityIssues.totalIssues > 0) {
    recommendations.push({
      type: 'data_integrity',
      priority: 'high',
      message: `Found ${integrityIssues.totalIssues} data integrity issues`
    });
  }
  
  return recommendations;
};

/**
 * Run complete database maintenance
 */
export const runMaintenance = async () => {
  try {
    logger.info('Starting complete database maintenance');
    
    const results = {
      optimization: await optimizeDatabase(),
      cleanup: await cleanupExpiredDocuments(),
      integrity: await validateDataIntegrity(),
      report: await generatePerformanceReport()
    };
    
    logger.info('Database maintenance completed successfully');
    
    return results;
  } catch (error) {
    logger.error('Database maintenance failed:', error);
    throw error;
  }
};

// CLI execution
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      
      try {
        await runMaintenance();
        console.log('Database maintenance completed successfully');
        process.exit(0);
      } catch (error) {
        console.error('Database maintenance failed:', error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    });
}

export default {
  optimizeDatabase,
  cleanupExpiredDocuments,
  compactCollections,
  validateDataIntegrity,
  generatePerformanceReport,
  runMaintenance
};
