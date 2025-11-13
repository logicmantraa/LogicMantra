import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Ensure one rating per user per course
ratingSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;

