import express from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  updateProgress,
  checkEnrollment
} from '../controllers/enrollmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, enrollInCourse);

router.get('/my-courses', protect, getMyEnrollments);
router.get('/check/:courseId', protect, checkEnrollment);
router.put('/:id/progress', protect, updateProgress);

export default router;

