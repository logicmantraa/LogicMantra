import { z } from 'zod';

/**
 * CourseValidator - Zod schemas for course validation
 * Centralizes all course input validation logic
 */

// Common string validation with trimming
const stringTrim = z.string().trim();

// Title validation
const titleSchema = stringTrim
  .min(3, 'Course title must be at least 3 characters long')
  .max(100, 'Course title must be less than 100 characters');

// Description validation
const descriptionSchema = stringTrim
  .min(10, 'Course description must be at least 10 characters long')
  .max(2000, 'Course description must be less than 2000 characters');

// Instructor validation
const instructorSchema = stringTrim
  .min(2, 'Instructor name must be at least 2 characters long')
  .max(50, 'Instructor name must be less than 50 characters');

// Category validation
const categorySchema = stringTrim
  .min(2, 'Category must be at least 2 characters long')
  .max(50, 'Category must be less than 50 characters');

// Level validation
const levelSchema = z.enum(['Beginner', 'Intermediate', 'Advanced'], {
  errorMap: () => ({ message: 'Level must be Beginner, Intermediate, or Advanced' })
});

// Price validation
const priceSchema = z
  .number()
  .min(0, 'Price must be a positive number')
  .max(99999.99, 'Price must be less than 100,000')
  .transform(price => Math.round(price * 100) / 100); // Round to 2 decimal places

// Duration validation
const durationSchema = z
  .number()
  .min(1, 'Duration must be at least 1 hour')
  .max(1000, 'Duration must be less than 1000 hours');

// Thumbnail URL validation
const thumbnailSchema = z
  .string()
  .url('Thumbnail must be a valid URL')
  .optional();

// Free course flag
const isFreeSchema = z.boolean().optional();

// Course ID validation
const courseIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format');

/**
 * Create course validation schema
 */
export const createCourseSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  instructor: instructorSchema,
  category: categorySchema,
  level: levelSchema,
  price: priceSchema,
  duration: durationSchema.optional(),
  thumbnail: thumbnailSchema,
  isFree: isFreeSchema
});

/**
 * Update course validation schema
 */
export const updateCourseSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  instructor: instructorSchema.optional(),
  category: categorySchema.optional(),
  level: levelSchema.optional(),
  price: priceSchema.optional(),
  duration: durationSchema.optional(),
  thumbnail: thumbnailSchema.optional(),
  isFree: isFreeSchema.optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Course ID parameter validation schema
 */
export const courseIdParamSchema = z.object({
  id: courseIdSchema
});

/**
 * Course search/filter validation schema
 */
export const courseFilterSchema = z.object({
  search: stringTrim
    .min(1, 'Search term must be at least 1 character')
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
  category: categorySchema.optional(),
  level: levelSchema.optional(),
  minRating: z
    .number()
    .min(0, 'Minimum rating must be at least 0')
    .max(5, 'Minimum rating must be at most 5')
    .optional(),
  maxPrice: priceSchema.optional(),
  isFree: z.boolean().optional(),
  page: z
    .number()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page must be less than 1000')
    .optional(),
  limit: z
    .number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .optional()
});

/**
 * Course pagination validation schema
 */
export const coursePaginationSchema = z.object({
  page: z
    .number()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page must be less than 1000')
    .optional()
    .default(1),
  limit: z
    .number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .optional()
    .default(20)
});

/**
 * Course bulk operations validation schema
 */
export const courseBulkOperationSchema = z.object({
  courseIds: z
    .array(courseIdSchema)
    .min(1, 'At least one course ID is required')
    .max(50, 'Cannot process more than 50 courses at once'),
  operation: z.enum(['delete', 'publish', 'unpublish'], {
    errorMap: () => ({ message: 'Operation must be delete, publish, or unpublish' })
  })
});

/**
 * Course statistics filter schema
 */
export const courseStatsFilterSchema = z.object({
  startDate: z
    .string()
    .datetime('Invalid start date format')
    .optional(),
  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional(),
  category: categorySchema.optional(),
  level: levelSchema.optional(),
  isFree: z.boolean().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before end date',
    path: ['endDate']
  }
);

/**
 * Course review validation schema
 */
export const courseReviewSchema = z.object({
  courseId: courseIdSchema,
  review: stringTrim
    .min(10, 'Review must be at least 10 characters long')
    .max(1000, 'Review must be less than 1000 characters'),
  isPublic: z.boolean().optional().default(true)
});

/**
 * Course recommendation schema
 */
export const courseRecommendationSchema = z.object({
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
    .optional(),
  category: categorySchema.optional(),
  level: levelSchema.optional(),
  maxPrice: priceSchema.optional(),
  limit: z
    .number()
    .min(1, 'Limit must be at least 1')
    .max(20, 'Limit must be at most 20')
    .optional()
    .default(10)
});
