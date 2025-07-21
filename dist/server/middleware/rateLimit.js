"use strict";
/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and ensures fair usage
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRateLimit = exports.aiQueryRateLimit = exports.authRateLimit = exports.strictRateLimit = exports.generalRateLimit = exports.rateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_js_1 = require("../config/logger.js");
/**
 * Create rate limit middleware with custom options
 */
const rateLimitMiddleware = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        skipSuccessfulRequests: false,
        skipFailedRequests: false
    };
    const config = { ...defaultOptions, ...options };
    return (0, express_rate_limit_1.default)({
        ...config,
        keyGenerator: (req) => {
            // Use user ID if authenticated, otherwise fall back to IP
            if (req.user?.id) {
                return `user:${req.user.id}`;
            }
            return req.ip || 'anonymous';
        },
        handler: (req, res) => {
            const identifier = req.user?.id ? `user:${req.user.id}` : req.ip;
            logger_js_1.logger.warn(`Rate limit exceeded for ${identifier}`, {
                ip: req.ip,
                userId: req.user?.id,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method
            });
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: config.message,
                retryAfter: Math.round(config.windowMs / 1000)
            });
        }
    });
};
exports.rateLimitMiddleware = rateLimitMiddleware;
/**
 * Predefined rate limiters for different use cases
 */
// General API rate limiter
exports.generalRateLimit = (0, exports.rateLimitMiddleware)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many API requests, please try again later.'
});
// Strict rate limiter for expensive operations
exports.strictRateLimit = (0, exports.rateLimitMiddleware)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 requests per 5 minutes
    message: 'Too many expensive operations, please try again later.'
});
// Authentication rate limiter
exports.authRateLimit = (0, exports.rateLimitMiddleware)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true // Don't count successful logins
});
// AI query rate limiter
exports.aiQueryRateLimit = (0, exports.rateLimitMiddleware)({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 AI queries per minute
    message: 'Too many AI query requests, please try again later.'
});
// File upload rate limiter
exports.uploadRateLimit = (0, exports.rateLimitMiddleware)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: 'Too many file uploads, please try again later.'
});
//# sourceMappingURL=rateLimit.js.map