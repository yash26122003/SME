/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and ensures fair usage
 */
import { Request, Response } from 'express';
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
export declare const rateLimitMiddleware: (options?: RateLimitOptions) => import("express-rate-limit").RateLimitRequestHandler;
/**
 * Predefined rate limiters for different use cases
 */
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const strictRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const aiQueryRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export {};
//# sourceMappingURL=rateLimit.d.ts.map