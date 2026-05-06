import Rating from '../models/Rating.js';
import Product from '../models/Product.js';

// @desc    Submit rating/feedback
// @route   POST /api/ratings
// @access  Private
export const submitRating = async (req, res) => {
  try {
    const { productId, rating, feedback } = req.body;
    const userId = req.user._id;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    
    // Check if rating already exists
    let existingRating = await Rating.findOne({ userId, productId });
    
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.feedback = feedback || '';
      await existingRating.save();
    } else {
      // Create new rating
      existingRating = await Rating.create({
        userId,
        productId,
        rating,
        feedback: feedback || ''
      });
    }
    
    // Update product average rating
    const ratings = await Rating.find({ productId });
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    product.rating = avgRating;
    product.totalRatings = ratings.length;
    await product.save();
    
    res.status(201).json(existingRating);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get ratings for a product
// @route   GET /api/ratings/product/:productId
// @access  Public
export const getProductRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ productId: req.params.productId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's rating for a product
// @route   GET /api/ratings/product/:productId/my-rating
// @access  Private
export const getMyRating = async (req, res) => {
  try {
    const rating = await Rating.findOne({
      userId: req.user._id,
      productId: req.params.productId
    });
    
    res.json(rating || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update rating
// @route   PUT /api/ratings/:id
// @access  Private
export const updateRating = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    
    if (!rating) {
      res.status(404);
      throw new Error('Rating not found');
    }
    
    // Check if user owns this rating
    if (rating.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    
    rating.rating = req.body.rating || rating.rating;
    rating.feedback = req.body.feedback !== undefined ? req.body.feedback : rating.feedback;
    
    await rating.save();
    
    // Update product average rating
    const ratings = await Rating.find({ productId: rating.productId });
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    const product = await Product.findById(rating.productId);
    product.rating = avgRating;
    await product.save();
    
    res.json(rating);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Delete rating
// @route   DELETE /api/ratings/:id
// @access  Private
export const deleteRating = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    
    if (!rating) {
      res.status(404);
      throw new Error('Rating not found');
    }
    
    // Check if user owns this rating
    if (rating.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    
    const productId = rating.productId;
    await rating.deleteOne();
    
    // Update product average rating
    const ratings = await Rating.find({ productId });
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    const product = await Product.findById(productId);
    product.rating = avgRating;
    product.totalRatings = ratings.length;
    await product.save();
    
    res.json({ message: 'Rating removed' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

