import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';

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
    
    // Calculate dynamic progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLectures = await Lecture.countDocuments({ courseId: enrollment.courseId._id });
        const completedCount = enrollment.completedLectures.length;
        
        let progress = 0;
        if (totalLectures > 0) {
          progress = Math.round((completedCount / totalLectures) * 100);
        }
        
        // Update stored progress if it differs
        if (enrollment.progress !== progress) {
          enrollment.progress = progress;
          await enrollment.save();
        }
        
        return enrollment;
      })
    );
    
    res.json(enrollmentsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
export const updateProgress = async (req, res) => {
  try {
    const { lectureId } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id).populate('courseId');
    
    if (!enrollment) {
      res.status(404);
      throw new Error('Enrollment not found');
    }
    
    // Check if user owns this enrollment
    if (enrollment.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    
    // Add lecture to completed lectures if not already completed
    if (lectureId && !enrollment.completedLectures.includes(lectureId)) {
      enrollment.completedLectures.push(lectureId);
    }
    
    // Calculate progress dynamically: (completed lectures / total lectures) * 100
    const totalLectures = await Lecture.countDocuments({ courseId: enrollment.courseId._id });
    const completedCount = enrollment.completedLectures.length;
    
    if (totalLectures > 0) {
      enrollment.progress = Math.round((completedCount / totalLectures) * 100);
    } else {
      enrollment.progress = 0;
    }
    
    // Ensure progress is between 0 and 100
    enrollment.progress = Math.min(100, Math.max(0, enrollment.progress));
    
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
    
    if (enrollment) {
      // Calculate dynamic progress: (completed lectures / total lectures) * 100
      const totalLectures = await Lecture.countDocuments({ courseId: req.params.courseId });
      const completedCount = enrollment.completedLectures.length;
      
      let progress = 0;
      if (totalLectures > 0) {
        progress = Math.round((completedCount / totalLectures) * 100);
      }
      
      // Update stored progress if it differs
      if (enrollment.progress !== progress) {
        enrollment.progress = progress;
        await enrollment.save();
      }
    }
    
    res.json({ enrolled: !!enrollment, enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



