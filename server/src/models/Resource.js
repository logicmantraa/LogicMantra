import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    default: null
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['notes', 'practice', 'pdf', 'sheet', 'link', 'other'],
    required: true,
    default: 'notes'
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: 'pdf'
  }
}, { timestamps: true });

// Index for course and lecture lookup
resourceSchema.index({ courseId: 1, lectureId: 1 });

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;

