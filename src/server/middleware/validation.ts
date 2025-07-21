/**
 * Validation Middleware
 * Validates request payloads using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Query request validation schema
const queryRequestSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(1000, 'Query is too long (maximum 1000 characters)')
    .trim(),
  context: z.object({
    conversationId: z.string().optional(),
    includeInsights: z.boolean().optional().default(true),
    includeRecommendations: z.boolean().optional().default(true),
    industry: z.string().optional(),
    availableMetrics: z.array(z.any()).optional().default([]),
    previousQueries: z.array(z.any()).optional().default([]),
    userPreferences: z.object({
      defaultTimeframe: z.string().optional(),
      preferredVisualization: z.string().optional(),
      detailLevel: z.string().optional(),
      includeInsights: z.boolean().optional(),
      includeRecommendations: z.boolean().optional(),
      language: z.string().optional()
    }).optional()
  }).optional().default({})
});

// Feedback validation schema
const feedbackSchema = z.object({
  helpful: z.boolean(),
  accurate: z.boolean(),
  comment: z.string().max(500, 'Comment is too long (maximum 500 characters)').optional()
});

// Generic validation middleware factory
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }));

        logger.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          errors,
          body: req.body
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'The request data is invalid',
          details: errors
        });
      }

      // Replace req.body with validated and transformed data
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Validation error',
        message: 'An error occurred during request validation'
      });
    }
  };
};

// Analytics request validation schema
const analyticsRequestSchema = z.object({
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional(),
  metrics: z.array(z.string()).optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']).optional()
});

// Specific validation middleware
export const validateQueryRequest = validateRequest(queryRequestSchema);
export const validateFeedbackRequest = validateRequest(feedbackSchema);
export const validateAnalyticsRequest = validateRequest(analyticsRequestSchema);

// Query parameters validation
export const validateQueryParams = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;

    // Validate pagination parameters
    if (page !== undefined) {
      const pageNum = parseInt(page as string);
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid page parameter',
          message: 'Page must be a positive integer'
        });
      }
      req.query.page = pageNum.toString();
    }

    if (limit !== undefined) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter',
          message: 'Limit must be between 1 and 100'
        });
      }
      req.query.limit = limitNum.toString();
    }

    // Validate sort parameters
    if (sortOrder !== undefined && !['asc', 'desc'].includes(sortOrder as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sortOrder parameter',
        message: 'Sort order must be either "asc" or "desc"'
      });
    }

    next();
  } catch (error) {
    logger.error('Query params validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Validation error',
      message: 'An error occurred during parameter validation'
    });
  }
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Recursively sanitize object properties
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Basic XSS prevention
        return obj
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
      
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    logger.error('Input sanitization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sanitization error',
      message: 'An error occurred during input sanitization'
    });
  }
};

// Content-Type validation
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Content-Type',
        message: 'Content-Type must be application/json'
      });
    }
  }
  
  next();
};
