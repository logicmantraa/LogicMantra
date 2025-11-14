import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

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
import { verifyEmailConfig } from './config/email.js';

// Load environment variables
dotenv.config();

// Verify email configuration on startup
verifyEmailConfig();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'https://logicmantraa.netlify.app',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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

// Base route
app.get('/', (req, res) => {
  res.send('LogicMantra API is running...');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB or start server anyway
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    console.log('Starting server without database connection...');
  });

// Start server regardless of database connection
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;