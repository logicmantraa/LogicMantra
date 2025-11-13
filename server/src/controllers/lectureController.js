import Lecture from '../models/Lecture.js';
import Course from '../models/Course.js';

// @desc    Get all lectures for a course
// @route   GET /api/lectures/course/:courseId
// @access  Public
export const getLecturesByCourse = async (req, res) => {
  try {
    const lectures = await Lecture.find({ courseId: req.params.courseId })
      .sort({ order: 1 });
    
    res.json(lectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lecture
// @route   GET /api/lectures/:id
// @access  Public
export const getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id).populate('courseId');
    
    if (!lecture) {
      res.status(404);
      throw new Error('Lecture not found');
    }
    
    res.json(lecture);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Create new lecture
// @route   POST /api/lectures
// @access  Private/Admin
export const createLecture = async (req, res) => {
  try {
    const course = await Course.findById(req.body.courseId);
    
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    
    const lecture = await Lecture.create(req.body);
    res.status(201).json(lecture);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Update lecture
// @route   PUT /api/lectures/:id
// @access  Private/Admin
export const updateLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      res.status(404);
      throw new Error('Lecture not found');
    }
    
    Object.assign(lecture, req.body);
    const updatedLecture = await lecture.save();
    
    res.json(updatedLecture);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Delete lecture
// @route   DELETE /api/lectures/:id
// @access  Private/Admin
export const deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      res.status(404);
      throw new Error('Lecture not found');
    }
    
    await lecture.deleteOne();
    res.json({ message: 'Lecture removed' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

