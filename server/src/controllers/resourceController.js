import Resource from '../models/Resource.js';
import Product from '../models/Product.js';
import Lecture from '../models/Lecture.js';

// @desc    Get resources with optional filtering
// @route   GET /api/resources
// @access  Private/Admin
export const getResources = async (req, res) => {
  try {
    const { productId, lectureId } = req.query;

    const query = {};
    if (productId) query.productId = productId;
    if (lectureId) query.lectureId = lectureId;

    const resources = await Resource.find(query)
      .populate('lectureId', 'title')
      .populate('productId', 'title');

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get resources by product
// @route   GET /api/resources/product/:productId
// @access  Public
export const getResourcesByProduct = async (req, res) => {
  try {
    const resources = await Resource.find({ productId: req.params.productId })
      .populate('lectureId', 'title')
      .populate('productId', 'title');
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
      .populate('productId')
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
    const product = await Product.findById(req.body.productId);
    
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
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

