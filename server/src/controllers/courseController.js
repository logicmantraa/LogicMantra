import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Resource from '../models/Resource.js';
import Enrollment from '../models/Enrollment.js';

// @desc    Get all courses with search and filters
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req, res) => {
  try {
    const { search, category, level, minRating, maxPrice, isFree } = req.query;
    
    const query = {};
    
    // Search by name/id
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: regex },
        { description: regex },
        { instructor: regex }
      ];
      // If search is a valid ObjectId, also search by ID
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: search });
      }
    }
    
    // Filters
    if (category) query.category = category;
    if (level) query.level = level;
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (maxPrice !== undefined) {
      query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }
    if (isFree !== undefined) query.isFree = isFree === 'true';
    
    const courses = await Course.find(query).sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single course with lectures and resources
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    
    const lectures = await Lecture.find({ courseId: course._id }).sort({ order: 1 });
    const resources = await Resource.find({ courseId: course._id });
    
    res.json({
      course,
      lectures,
      resources
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    
    Object.assign(course, req.body);
    const updatedCourse = await course.save();
    
    res.json(updatedCourse);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    
    // Delete associated lectures and resources
    await Lecture.deleteMany({ courseId: course._id });
    await Resource.deleteMany({ courseId: course._id });
    await Enrollment.deleteMany({ courseId: course._id });
    
    await course.deleteOne();
    
    res.json({ message: 'Course removed' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

