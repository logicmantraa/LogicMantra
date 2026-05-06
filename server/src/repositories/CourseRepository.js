import Course from '../models/Course.js';

/**
 * CourseRepository - Handles all Course database operations
 * Separates data access logic from business logic
 */

class CourseRepository {
  /**
   * Find course by ID
   * @param {string} courseId - Course ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Course document
   */
  static async findById(courseId, options = {}) {
    const { select = '', populate = [] } = options;
    
    let query = Course.findById(courseId);
    
    if (select) {
      query = query.select(select);
    }
    
    if (populate.length > 0) {
      populate.forEach(populateOption => {
        query = query.populate(populateOption);
      });
    }
    
    return await query;
  }

  /**
   * Find courses with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of course documents
   */
  static async findWithFilters(filters = {}, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      sort = { createdAt: -1 },
      select = ''
    } = options;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = Course.find(filters);
    
    if (select) {
      query = query.select(select);
    }
    
    query = query
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    return await query;
  }

  /**
   * Search courses by text
   * @param {string} searchText - Text to search
   * @param {Object} filters - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of course documents
   */
  static async search(searchText, filters = {}, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { ...filters };
    
    if (searchText) {
      const regex = { $regex: searchText, $options: 'i' };
      query.$or = [
        { title: regex },
        { description: regex },
        { instructor: regex }
      ];
      
      // If search is a valid ObjectId, also search by ID
      if (searchText.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: searchText });
      }
    }
    
    return await Course.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Create new course
   * @param {Object} courseData - Course data
   * @returns {Promise<Object>} Created course document
   */
  static async create(courseData) {
    return await Course.create(courseData);
  }

  /**
   * Update course by ID
   * @param {string} courseId - Course ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated course document
   */
  static async updateById(courseId, updateData) {
    return await Course.findByIdAndUpdate(
      courseId, 
      updateData, 
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete course by ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object|null>} Deleted course document
   */
  static async deleteById(courseId) {
    return await Course.findByIdAndDelete(courseId);
  }

  /**
   * Count courses with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count of courses
   */
  static async count(filters = {}) {
    return await Course.countDocuments(filters);
  }

  /**
   * Check if course exists
   * @param {string} courseId - Course ID
   * @returns {Promise<boolean>} Course exists status
   */
  static async exists(courseId) {
    const course = await Course.findById(courseId).select('_id');
    return !!course;
  }

  /**
   * Get popular courses by enrollment count
   * @param {number} limit - Number of courses to return
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of popular courses
   */
  static async getPopularCourses(limit = 5, options = {}) {
    const { select = 'title enrolledCount rating thumbnail' } = options;
    
    return await Course.find()
      .sort({ enrolledCount: -1 })
      .limit(limit)
      .select(select);
  }

  /**
   * Get top rated courses
   * @param {number} limit - Number of courses to return
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of top rated courses
   */
  static async getTopRatedCourses(limit = 5, options = {}) {
    const { select = 'title rating totalRatings thumbnail' } = options;
    
    return await Course.find()
      .sort({ rating: -1 })
      .limit(limit)
      .select(select);
  }

  /**
   * Get courses by category
   * @param {string} category - Course category
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of courses in category
   */
  static async getByCategory(category, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await Course.find({ category })
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Get courses by instructor
   * @param {string} instructor - Instructor name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of courses by instructor
   */
  static async getByInstructor(instructor, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await Course.find({ instructor })
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Get courses by level
   * @param {string} level - Course level (Beginner, Intermediate, Advanced)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of courses by level
   */
  static async getByLevel(level, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await Course.find({ level })
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Get free courses
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of free courses
   */
  static async getFreeCourses(options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await Course.find({ isFree: true })
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Get paid courses
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of paid courses
   */
  static async getPaidCourses(options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await Course.find({ isFree: false })
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Get course statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Course statistics
   */
  static async getStats(filters = {}) {
    const pipeline = [
      { $match: filters },
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          freeCourses: {
            $sum: { $cond: [{ $eq: ['$isFree', true] }, 1, 0] }
          },
          paidCourses: {
            $sum: { $cond: [{ $eq: ['$isFree', false] }, 1, 0] }
          },
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: '$totalRatings' },
          totalEnrollments: { $sum: '$enrolledCount' },
          avgPrice: { $avg: '$price' }
        }
      }
    ];
    
    const result = await Course.aggregate(pipeline);
    return result[0] || {
      totalCourses: 0,
      freeCourses: 0,
      paidCourses: 0,
      avgRating: 0,
      totalRatings: 0,
      totalEnrollments: 0,
      avgPrice: 0
    };
  }

  /**
   * Get courses by rating range
   * @param {number} minRating - Minimum rating
   * @param {number} maxRating - Maximum rating
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of courses in rating range
   */
  static async getByRatingRange(minRating, maxRating, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    return await Course.find({ 
      rating: { $gte: minRating, $lte: maxRating } 
    })
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Get courses by price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of courses in price range
   */
  static async getByPriceRange(minPrice, maxPrice, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const priceFilter = {};
    if (minPrice !== undefined) priceFilter.$gte = minPrice;
    if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
    
    return await Course.find({ price: priceFilter })
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
  }

  /**
   * Update multiple courses
   * @param {Object} filter - Filter criteria
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  static async updateMany(filter, updateData) {
    return await Course.updateMany(filter, updateData);
  }
}

export default CourseRepository;
