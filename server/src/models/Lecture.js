import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    required: true // YouTube URL
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  duration: {
    type: Number,
    default: 0 // in minutes
  },
  isPreview: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for course lookup
lectureSchema.index({ courseId: 1, order: 1 });

const Lecture = mongoose.model('Lecture', lectureSchema);

export default Lecture;

