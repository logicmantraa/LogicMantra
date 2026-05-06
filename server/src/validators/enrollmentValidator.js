import { z } from 'zod';

/**
 * EnrollmentValidator - Zod schemas for enrollment validation
 * Centralizes all enrollment input validation logic
 */

// Common ID validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Course ID validation
const courseIdSchema = objectIdSchema;

// User ID validation
const userIdSchema = objectIdSchema;

// Enrollment ID validation
const enrollmentIdSchema = objectIdSchema;

// Lecture ID validation
const lectureIdSchema = objectIdSchema;

/**
 * Enroll in course validation schema
 */
export const enrollInCourseSchema = z.object({
  courseId: courseIdSchema
});

/**
 * Enrollment ID parameter validation schema
 */
export const enrollmentIdParamSchema = z.object({
  id: enrollmentIdSchema
});

/**
 * Course ID parameter validation schema
 */
export const courseIdParamSchema = z.object({
  courseId: courseIdSchema
});

/**
 * Update progress validation schema
 */
export const updateProgressSchema = z.object({
  enrollmentId: enrollmentIdSchema,
  lectureId: lectureIdSchema
});

/**
 * Bulk progress update schema
 */
export const bulkUpdateProgressSchema = z.object({
  enrollmentId: enrollmentIdSchema,
  lectureIds: z
    .array(lectureIdSchema)
    .min(1, 'At least one lecture ID is required')
    .max(50, 'Cannot update more than 50 lectures at once')
});

/**
 * Check enrollment status schema
 */
export const checkEnrollmentSchema = z.object({
  courseId: courseIdSchema
});

/**
 * Enrollment filter schema
 */
export const enrollmentFilterSchema = z.object({
  userId: userIdSchema.optional(),
  courseId: courseIdSchema.optional(),
  status: z.enum(['active', 'completed', 'dropped'], {
    errorMap: () => ({ message: 'Status must be active, completed, or dropped' })
  }).optional(),
  minProgress: z
    .number()
    .min(0, 'Minimum progress must be at least 0')
    .max(100, 'Minimum progress must be at most 100')
    .optional(),
  maxProgress: z
    .number()
    .min(0, 'Maximum progress must be at least 0')
    .max(100, 'Maximum progress must be at most 100')
    .optional(),
  enrolledAfter: z
    .string()
    .datetime('Invalid enrolled after date format')
    .optional(),
  enrolledBefore: z
    .string()
    .datetime('Invalid enrolled before date format')
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
    if (data.minProgress !== undefined && data.maxProgress !== undefined) {
      return data.minProgress <= data.maxProgress;
    }
    return true;
  },
  {
    message: 'Minimum progress must be less than or equal to maximum progress',
    path: ['maxProgress']
  }
).refine(
  (data) => {
    if (data.enrolledAfter && data.enrolledBefore) {
      return new Date(data.enrolledAfter) <= new Date(data.enrolledBefore);
    }
    return true;
  },
  {
    message: 'Enrolled after date must be before enrolled before date',
    path: ['enrolledBefore']
  }
);

/**
 * Enrollment statistics filter schema
 */
export const enrollmentStatsFilterSchema = z.object({
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
 * Enrollment bulk operation schema
 */
export const enrollmentBulkOperationSchema = z.object({
  enrollmentIds: z
    .array(enrollmentIdSchema)
    .min(1, 'At least one enrollment ID is required')
    .max(50, 'Cannot process more than 50 enrollments at once'),
  operation: z.enum(['delete', 'reset', 'complete'], {
    errorMap: () => ({ message: 'Operation must be delete, reset, or complete' })
  })
});

/**
 * Enrollment certificate schema
 */
export const enrollmentCertificateSchema = z.object({
  enrollmentId: enrollmentIdSchema,
  includeTranscript: z.boolean().optional().default(false),
  format: z.enum(['pdf', 'json'], {
    errorMap: () => ({ message: 'Format must be pdf or json' })
  }).optional()
    .default('pdf')
});

/**
 * Enrollment reminder schema
 */
export const enrollmentReminderSchema = z.object({
  enrollmentId: enrollmentIdSchema,
  reminderType: z.enum(['progress', 'deadline', 'completion'], {
    errorMap: () => ({ message: 'Reminder type must be progress, deadline, or completion' })
  }),
  message: z
    .string()
    .min(10, 'Reminder message must be at least 10 characters long')
    .max(500, 'Reminder message must be less than 500 characters')
});

/**
 * Course enrollment limit schema
 */
export const courseEnrollmentLimitSchema = z.object({
  courseId: courseIdSchema,
  maxEnrollments: z
    .number()
    .min(1, 'Maximum enrollments must be at least 1')
    .max(10000, 'Maximum enrollments must be less than 10,000')
});

/**
 * Enrollment analytics schema
 */
export const enrollmentAnalyticsSchema = z.object({
  courseId: courseIdSchema.optional(),
  userId: userIdSchema.optional(),
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all'], {
    errorMap: () => ({ message: 'Time range must be 7d, 30d, 90d, 1y, or all' })
  }).optional()
    .default('30d'),
  metrics: z
    .array(z.enum(['count', 'progress', 'completion', 'retention'], {
      errorMap: () => ({ message: 'Metrics must be count, progress, completion, or retention' })
    }))
    .min(1, 'At least one metric is required')
    .max(5, 'Cannot request more than 5 metrics at once')
});
