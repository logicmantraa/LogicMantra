import mongoose from 'mongoose';

const userProductAccessSchema = new mongoose.Schema({
  // Core relationship
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Access source classification
  accessSource: {
    type: String,
    enum: ['free', 'purchase', 'admin_grant', 'subscription'],
    required: true
  },
  
  // Access status for revocation capability
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  
  // Purchase information (for future payment integration)
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    default: null
  },
  purchasePrice: {
    type: Number,
    default: null
  },
  purchasedAt: {
    type: Date,
    default: null
  },
  
  // Library management
  isInLibrary: {
    type: Boolean,
    default: true
  },
  addedToLibraryAt: {
    type: Date,
    default: Date.now
  },
  
  // Progress tracking (extensible foundation)
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  progressData: {
    // Course-specific progress
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture'
    }],
    currentLecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture'
    },
    
    // Test series progress
    completedTests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
    }],
    bestScores: [{
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
      },
      score: Number,
      completedAt: Date
    }],
    
    // PDF/Ebook progress
    lastPageRead: Number,
    bookmarks: [{
      pageNumber: Number,
      note: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Practice quiz progress
    completedQuestions: [Number],
    currentQuestion: Number
  },
  
  // Metadata and timestamps
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Optimized indexes for performance and queries
userProductAccessSchema.index({ userId: 1, productId: 1 }, { unique: true });
userProductAccessSchema.index({ userId: 1, isInLibrary: 1 });
userProductAccessSchema.index({ lastAccessedAt: -1 });

// Pre-save middleware to update completion status
userProductAccessSchema.pre('save', function(next) {
  if (this.progress >= 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  } else if (this.progress < 100 && this.isCompleted) {
    this.isCompleted = false;
    this.completedAt = null;
  }
  next();
});

// Pre-save middleware to update lastAccessedAt
userProductAccessSchema.pre('save', function(next) {
  if (this.isModified('progress') || this.isModified('progressData')) {
    this.lastAccessedAt = new Date();
  }
  next();
});

const UserProductAccess = mongoose.model('UserProductAccess', userProductAccessSchema);

export default UserProductAccess;
