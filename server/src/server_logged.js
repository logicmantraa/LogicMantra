import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from './config/logger.js';
import { requestLogger, errorLogger } from './middleware/requestLogger.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import courseRoutes from './routes/course.js';
import lectureRoutes from './routes/lecture.js';
import resourceRoutes from './routes/resource.js';
import enrollmentRoutes from './routes/enrollment.js';
import ratingRoutes from './routes/rating.js';
import storeRoutes from './routes/store.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', null, {
    missing: missingEnvVars,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware (first)
app.use(requestLogger);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware (simplified for this example)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check accessed', {
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    logging: 'enabled'
  });
});

// Base route
app.get('/', (req, res) => {
  logger.info('Base route accessed', {
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    message: 'LogicMantra API is running with logging',
    logging: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Logging status endpoint
app.get('/api/logging/status', (req, res) => {
  const stats = logger.getStats();
  
  logger.info('Logging status accessed', {
    requestId: req.requestId,
    stats,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    logging: 'enabled',
    ...stats,
    timestamp: new Date().toISOString()
  });
});

// Error logging middleware (before other error handlers)
app.use(errorLogger);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Connect to MongoDB with logging
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  logger.info('Connected to MongoDB successfully', {
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port
  });
})
.catch((error) => {
  logger.error('MongoDB connection error', error, {
    uri: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
    timestamp: new Date().toISOString()
  });
  
  // In production, exit if database connection fails
  if (process.env.NODE_ENV === 'production') {
    logger.error('Production mode: Exiting due to database connection failure');
    process.exit(1);
  } else {
    logger.warn('Development mode: Continuing without database connection');
  }
});

// Start server
const server = app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error, {
    timestamp: new Date().toISOString()
  });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', new Error(reason), {
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  });
  gracefulShutdown('unhandledRejection');
});

export default app;
