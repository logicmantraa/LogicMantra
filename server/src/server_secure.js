import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import security middleware
import { 
  helmetConfig, 
  securityMiddleware,
  authRateLimit,
  otpRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  apiRateLimit
} from './middleware/security.js';
import { getCorsConfig, customCorsMiddleware } from './middleware/cors.js';
import { securityMiddleware as inputSecurityMiddleware } from './middleware/inputSanitizer.js';

// Import routes
import authRoutes from './routes/auth_secure.js';
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
import { errorHandler, notFound } from './middleware/errorHandler_refactored.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware stack
app.use(helmetConfig);
app.use(customCorsMiddleware);
app.use(getCorsConfig());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply comprehensive security middleware
app.use(securityMiddleware);

// Apply input sanitization to all routes
app.use(inputSecurityMiddleware);

// Apply API rate limiting to all routes
app.use(apiRateLimit);

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'LogicMantra API is running securely',
    security: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// API routes with specific rate limiting
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

// Security endpoints
app.get('/api/security/headers', (req, res) => {
  res.json({
    security: {
      helmet: 'enabled',
      cors: 'enabled',
      rateLimit: 'enabled',
      inputSanitization: 'enabled',
      xssProtection: 'enabled',
      mongoSanitization: 'enabled'
    },
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connection
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Connect to MongoDB with proper error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('MongoDB connection error:', error.message);
  
  // In production, exit if database connection fails
  if (process.env.NODE_ENV === 'production') {
    console.error('Production mode: Exiting due to database connection failure');
    process.exit(1);
  } else {
    console.log('Development mode: Continuing without database connection...');
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security features enabled`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
