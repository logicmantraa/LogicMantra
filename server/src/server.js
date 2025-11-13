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

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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