import Resource from '../models/Resource.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';

// @desc    Get resources by course
// @route   GET /api/resources/course/:courseId
// @access  Public
export const getResourcesByCourse = async (req, res) => {
  try {
    const resources = await Resource.find({ courseId: req.params.courseId })
      .populate('lectureId', 'title');
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get resources by lecture
// @route   GET /api/resources/lecture/:lectureId
// @access  Public
export const getResourcesByLecture = async (req, res) => {
  try {
    const resources = await Resource.find({ lectureId: req.params.lectureId });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('courseId')
      .populate('lectureId');
    
    if (!resource) {
      res.status(404);
      throw new Error('Resource not found');
    }
    
    res.json(resource);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private/Admin
export const createResource = async (req, res) => {
  try {
    const course = await Course.findById(req.body.courseId);
    
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    
    if (req.body.lectureId) {
      const lecture = await Lecture.findById(req.body.lectureId);
      if (!lecture) {
        res.status(404);
        throw new Error('Lecture not found');
      }
    }
    
    const resource = await Resource.create(req.body);
    res.status(201).json(resource);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
export const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      res.status(404);
      throw new Error('Resource not found');
    }
    
    Object.assign(resource, req.body);
    const updatedResource = await resource.save();
    
    res.json(updatedResource);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      res.status(404);
      throw new Error('Resource not found');
    }
    
    await resource.deleteOne();
    res.json({ message: 'Resource removed' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

