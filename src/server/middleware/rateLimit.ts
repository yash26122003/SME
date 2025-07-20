/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and ensures fair usage
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../config/logger.js';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
}

/**
 * Create rate limit middleware with custom options
 */
export const rateLimitMiddleware = (options: RateLimitOptions = {}) => {
  const defaultOptions: RateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  };

  const config = { ...defaultOptions, ...options };

  return rateLimit({
    ...config,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      if (req.user?.id) {
        return `user:${req.user.id}`;
      }
      return req.ip;
    },
    handler: (req: Request, res: Response) => {
      const identifier = req.user?.id ? `user:${req.user.id}` : req.ip;
      
      logger.warn(`Rate limit exceeded for ${identifier}`, {
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
        retryAfter: Math.round(config.windowMs! / 1000)
      });
    }
  });
};

/**
 * Predefined rate limiters for different use cases
 */

// General API rate limiter
export const generalRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: 'Too many API requests, please try again later.'
});

// Strict rate limiter for expensive operations
export const strictRateLimit = rateLimitMiddleware({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  message: 'Too many expensive operations, please try again later.'
});

// Authentication rate limiter
export const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true // Don't count successful logins
});

// AI query rate limiter
export const aiQueryRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 AI queries per minute
  message: 'Too many AI query requests, please try again later.'
});

// File upload rate limiter
export const uploadRateLimit = rateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: 'Too many file uploads, please try again later.'
});
