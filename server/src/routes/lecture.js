import express from 'express';
import {
  getLecturesByCourse,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture
} from '../controllers/lectureController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', getLecturesByCourse);

router.route('/')
  .post(protect, admin, createLecture);

router.route('/:id')
  .get(getLectureById)
  .put(protect, admin, updateLecture)
  .delete(protect, admin, deleteLecture);

export default router;

