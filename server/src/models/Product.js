import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Core product information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  isFree: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  thumbnail: {
    type: String,
    default: ''
  },
  
  // Product type classification
  productType: {
    type: String,
    enum: ['course', 'test_series', 'practice_quiz', 'pdf', 'ebook'],
    required: true
  },
  
  // Creator tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Type-specific flexible data
  typeData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status management
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// Pre-validation middleware for isFree consistency
productSchema.pre('validate', function(next) {
  if (this.price === 0 && this.isFree === false) {
    return next(new Error('Free product must have isFree=true'));
  }

  if (this.price > 0 && this.isFree === true) {
    return next(new Error('Paid product cannot be marked as free'));
  }

  next();
});

// Optimized indexes for performance
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ productType: 1, category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ rating: -1 });


const Product = mongoose.model('Product', productSchema);

export default Product;
