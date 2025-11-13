import Rating from '../models/Rating.js';
import Course from '../models/Course.js';

// @desc    Submit rating/feedback
// @route   POST /api/ratings
// @access  Private
export const submitRating = async (req, res) => {
  try {
    const { courseId, rating, feedback } = req.body;
    const userId = req.user._id;
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    
    // Check if rating already exists
    let existingRating = await Rating.findOne({ userId, courseId });
    
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.feedback = feedback || '';
      await existingRating.save();
    } else {
      // Create new rating
      existingRating = await Rating.create({
        userId,
        courseId,
        rating,
        feedback: feedback || ''
      });
    }
    
    // Update course average rating
    const ratings = await Rating.find({ courseId });
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    course.rating = avgRating;
    course.totalRatings = ratings.length;
    await course.save();
    
    res.status(201).json(existingRating);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get ratings for a course
// @route   GET /api/ratings/course/:courseId
// @access  Public
export const getCourseRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ courseId: req.params.courseId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's rating for a course
// @route   GET /api/ratings/course/:courseId/my-rating
// @access  Private
export const getMyRating = async (req, res) => {
  try {
    const rating = await Rating.findOne({
      userId: req.user._id,
      courseId: req.params.courseId
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
    
    // Update course average rating
    const ratings = await Rating.find({ courseId: rating.courseId });
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    const course = await Course.findById(rating.courseId);
    course.rating = avgRating;
    await course.save();
    
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
    
    const courseId = rating.courseId;
    await rating.deleteOne();
    
    // Update course average rating
    const ratings = await Rating.find({ courseId });
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    const course = await Course.findById(courseId);
    course.rating = avgRating;
    course.totalRatings = ratings.length;
    await course.save();
    
    res.json({ message: 'Rating removed' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

