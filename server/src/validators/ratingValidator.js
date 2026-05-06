import { z } from 'zod';

/**
 * RatingValidator - Zod schemas for rating validation
 * Centralizes all rating input validation logic
 */

// Common ID validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Course ID validation
const courseIdSchema = objectIdSchema;

// User ID validation
const userIdSchema = objectIdSchema;

// Rating ID validation
const ratingIdSchema = objectIdSchema;

/**
 * Submit rating validation schema
 */
export const submitRatingSchema = z.object({
  courseId: courseIdSchema,
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .transform(rating => Math.round(rating * 10) / 10), // Round to 1 decimal place
  feedback: z
    .string()
    .trim()
    .min(1, 'Feedback must be at least 1 character long')
    .max(1000, 'Feedback must be less than 1000 characters')
    .optional()
});

/**
 * Update rating validation schema
 */
export const updateRatingSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .transform(rating => Math.round(rating * 10) / 10)
    .optional(),
  feedback: z
    .string()
    .trim()
    .min(1, 'Feedback must be at least 1 character long')
    .max(1000, 'Feedback must be less than 1000 characters')
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Rating ID parameter validation schema
 */
export const ratingIdParamSchema = z.object({
  id: ratingIdSchema
});

/**
 * Course ID parameter validation schema
 */
export const courseIdParamSchema = z.object({
  courseId: courseIdSchema
});

/**
 * Rating filter schema
 */
export const ratingFilterSchema = z.object({
  courseId: courseIdSchema.optional(),
  userId: userIdSchema.optional(),
  minRating: z
    .number()
    .min(1, 'Minimum rating must be at least 1')
    .max(5, 'Minimum rating must be at most 5')
    .optional(),
  maxRating: z
    .number()
    .min(1, 'Maximum rating must be at least 1')
    .max(5, 'Maximum rating must be at most 5')
    .optional(),
  hasFeedback: z.boolean().optional(),
  createdAfter: z
    .string()
    .datetime('Invalid created after date format')
    .optional(),
  createdBefore: z
    .string()
    .datetime('Invalid created before date format')
    .optional(),
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
}).refine(
  (data) => {
    if (data.minRating !== undefined && data.maxRating !== undefined) {
      return data.minRating <= data.maxRating;
    }
    return true;
  },
  {
    message: 'Minimum rating must be less than or equal to maximum rating',
    path: ['maxRating']
  }
).refine(
  (data) => {
    if (data.createdAfter && data.createdBefore) {
      return new Date(data.createdAfter) <= new Date(data.createdBefore);
    }
    return true;
  },
  {
    message: 'Created after date must be before created before date',
    path: ['createdBefore']
  }
);

/**
 * Rating statistics filter schema
 */
export const ratingStatsFilterSchema = z.object({
  courseId: courseIdSchema.optional(),
  userId: userIdSchema.optional(),
  startDate: z
    .string()
    .datetime('Invalid start date format')
    .optional(),
  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional(),
  groupBy: z.enum(['day', 'week', 'month'], {
    errorMap: () => ({ message: 'Group by must be day, week, or month' })
  }).optional()
    .default('day')
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
 * Rating bulk operation schema
 */
export const ratingBulkOperationSchema = z.object({
  ratingIds: z
    .array(ratingIdSchema)
    .min(1, 'At least one rating ID is required')
    .max(50, 'Cannot process more than 50 ratings at once'),
  operation: z.enum(['delete', 'approve', 'reject'], {
    errorMap: () => ({ message: 'Operation must be delete, approve, or reject' })
  })
});

/**
 * Rating moderation schema
 */
export const ratingModerationSchema = z.object({
  ratingId: ratingIdSchema,
  action: z.enum(['approve', 'reject', 'flag'], {
    errorMap: () => ({ message: 'Action must be approve, reject, or flag' })
  }),
  reason: z
    .string()
    .trim()
    .min(1, 'Reason must be at least 1 character long')
    .max(500, 'Reason must be less than 500 characters')
    .optional()
});

/**
 * Rating analytics schema
 */
export const ratingAnalyticsSchema = z.object({
  courseId: courseIdSchema.optional(),
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all'], {
    errorMap: () => ({ message: 'Time range must be 7d, 30d, 90d, 1y, or all' })
  }).optional()
    .default('30d'),
  metrics: z
    .array(z.enum(['average', 'distribution', 'trend', 'count'], {
      errorMap: () => ({ message: 'Metrics must be average, distribution, trend, or count' })
    }))
    .min(1, 'At least one metric is required')
    .max(4, 'Cannot request more than 4 metrics at once')
});

/**
 * Rating response schema
 */
export const ratingResponseSchema = z.object({
  ratingId: ratingIdSchema,
  response: z
    .string()
    .trim()
    .min(1, 'Response must be at least 1 character long')
    .max(1000, 'Response must be less than 1000 characters'),
  isPublic: z.boolean().optional().default(true)
});

/**
 * Rating export schema
 */
export const ratingExportSchema = z.object({
  courseId: courseIdSchema.optional(),
  format: z.enum(['csv', 'json', 'xlsx'], {
    errorMap: () => ({ message: 'Format must be csv, json, or xlsx' })
  }).optional()
    .default('csv'),
  includeFeedback: z.boolean().optional().default(true),
  includeUserData: z.boolean().optional().default(false)
});

/**
 * Rating notification schema
 */
export const ratingNotificationSchema = z.object({
  ratingId: ratingIdSchema,
  notificationType: z.enum(['new_rating', 'rating_update', 'rating_response'], {
    errorMap: () => ({ message: 'Notification type must be new_rating, rating_update, or rating_response' })
  }),
  message: z
    .string()
    .trim()
    .min(10, 'Notification message must be at least 10 characters long')
    .max(500, 'Notification message must be less than 500 characters')
});
