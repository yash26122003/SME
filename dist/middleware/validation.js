"use strict";
/**
 * Validation Middleware
 * Validates request payloads using Zod schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentType = exports.sanitizeInput = exports.validateQueryParams = exports.validateFeedbackRequest = exports.validateQueryRequest = exports.validateRequest = void 0;
const zod_1 = require("zod");
const logger_js_1 = require("../config/logger.js");
// Query request validation schema
const queryRequestSchema = zod_1.z.object({
    query: zod_1.z.string()
        .min(1, 'Query cannot be empty')
        .max(1000, 'Query is too long (maximum 1000 characters)')
        .trim(),
    context: zod_1.z.object({
        conversationId: zod_1.z.string().optional(),
        includeInsights: zod_1.z.boolean().optional().default(true),
        includeRecommendations: zod_1.z.boolean().optional().default(true),
        industry: zod_1.z.string().optional(),
        availableMetrics: zod_1.z.array(zod_1.z.any()).optional().default([]),
        previousQueries: zod_1.z.array(zod_1.z.any()).optional().default([]),
        userPreferences: zod_1.z.object({
            defaultTimeframe: zod_1.z.string().optional(),
            preferredVisualization: zod_1.z.string().optional(),
            detailLevel: zod_1.z.string().optional(),
            includeInsights: zod_1.z.boolean().optional(),
            includeRecommendations: zod_1.z.boolean().optional(),
            language: zod_1.z.string().optional()
        }).optional()
    }).optional().default({})
});
// Feedback validation schema
const feedbackSchema = zod_1.z.object({
    helpful: zod_1.z.boolean(),
    accurate: zod_1.z.boolean(),
    comment: zod_1.z.string().max(500, 'Comment is too long (maximum 500 characters)').optional()
});
// Generic validation middleware factory
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const errors = result.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code
                }));
                logger_js_1.logger.warn('Request validation failed', {
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
        }
        catch (error) {
            logger_js_1.logger.error('Validation middleware error:', error);
            return res.status(500).json({
                success: false,
                error: 'Validation error',
                message: 'An error occurred during request validation'
            });
        }
    };
};
exports.validateRequest = validateRequest;
// Specific validation middleware
exports.validateQueryRequest = (0, exports.validateRequest)(queryRequestSchema);
exports.validateFeedbackRequest = (0, exports.validateRequest)(feedbackSchema);
// Query parameters validation
const validateQueryParams = (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder } = req.query;
        // Validate pagination parameters
        if (page !== undefined) {
            const pageNum = parseInt(page);
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
            const limitNum = parseInt(limit);
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
        if (sortOrder !== undefined && !['asc', 'desc'].includes(sortOrder)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid sortOrder parameter',
                message: 'Sort order must be either "asc" or "desc"'
            });
        }
        next();
    }
    catch (error) {
        logger_js_1.logger.error('Query params validation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Validation error',
            message: 'An error occurred during parameter validation'
        });
    }
};
exports.validateQueryParams = validateQueryParams;
// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    try {
        // Recursively sanitize object properties
        const sanitizeObject = (obj) => {
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
                const sanitized = {};
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
    }
    catch (error) {
        logger_js_1.logger.error('Input sanitization error:', error);
        return res.status(500).json({
            success: false,
            error: 'Sanitization error',
            message: 'An error occurred during input sanitization'
        });
    }
};
exports.sanitizeInput = sanitizeInput;
// Content-Type validation
const validateContentType = (req, res, next) => {
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
exports.validateContentType = validateContentType;
//# sourceMappingURL=validation.js.map