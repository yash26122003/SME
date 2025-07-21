/**
 * Authentication Middleware
 * Validates JWT tokens and sets user context for protected routes
 */
import { Request, Response, NextFunction } from 'express';
interface AuthenticatedUser {
    id: string;
    email: string;
    tenantId: string;
    role: string;
    tenant?: {
        industry: string;
        name: string;
    };
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=auth.d.ts.map