import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0 // in minutes
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  enrolledCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for search
courseSchema.index({ title: 'text', description: 'text' });

const Course = mongoose.model('Course', courseSchema);

export default Course;

