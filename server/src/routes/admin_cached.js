import express from 'express';
import { requireAdminAuth } from '../middleware/requireAuth.js';
import { logAdminAction } from '../middleware/requireAdmin.js';
import { cacheDashboardData } from '../middleware/cache.js';
import {
  getDashboardStats,
  getUserStats,
  getCourseStats,
  getEnrollmentStats
} from '../controllers/adminController_cached.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireAdminAuth());

// Dashboard statistics with caching
router.get('/dashboard/stats', 
  cacheDashboardData(1800), // Cache for 30 minutes
  logAdminAction('view dashboard stats'),
  getDashboardStats
);

// User statistics with caching
router.get('/users/stats', 
  cacheDashboardData(1800),
  logAdminAction('view user stats'),
  getUserStats
);

// Course statistics with caching
router.get('/courses/stats', 
  cacheDashboardData(1800),
  logAdminAction('view course stats'),
  getCourseStats
);

// Enrollment statistics with caching
router.get('/enrollments/stats', 
  cacheDashboardData(1800),
  logAdminAction('view enrollment stats'),
  getEnrollmentStats
);

export default router;
