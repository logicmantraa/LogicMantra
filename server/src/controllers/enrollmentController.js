import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Private
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ userId, courseId });
    
    if (existingEnrollment) {
      res.status(400);
      throw new Error('Already enrolled in this course');
    }
    
    const enrollment = await Enrollment.create({
      userId,
      courseId
    });
    
    // Update course enrollment count
    course.enrolledCount += 1;
    await course.save();
    
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get user enrollments
// @route   GET /api/enrollments/my-courses
// @access  Private
export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate('courseId')
      .sort({ enrolledAt: -1 });
    
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
export const updateProgress = async (req, res) => {
  try {
    const { progress, lectureId } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      res.status(404);
      throw new Error('Enrollment not found');
    }
    
    // Check if user owns this enrollment
    if (enrollment.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    
    if (progress !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, progress));
    }
    
    if (lectureId && !enrollment.completedLectures.includes(lectureId)) {
      enrollment.completedLectures.push(lectureId);
    }
    
    await enrollment.save();
    
    res.json(enrollment);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Check enrollment status
// @route   GET /api/enrollments/check/:courseId
// @access  Private
export const checkEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: req.params.courseId
    });
    
    res.json({ enrolled: !!enrollment, enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

