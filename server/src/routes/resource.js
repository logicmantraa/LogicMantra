import express from 'express';
import {
  getResources,
  getResourcesByCourse,
  getResourcesByLecture,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} from '../controllers/resourceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getResources);
router.get('/course/:courseId', getResourcesByCourse);
router.get('/lecture/:lectureId', getResourcesByLecture);

router.route('/')
  .post(protect, admin, createResource);

router.route('/:id')
  .get(getResourceById)
  .put(protect, admin, updateResource)
  .delete(protect, admin, deleteResource);

export default router;

