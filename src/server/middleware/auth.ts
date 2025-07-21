/**
 * Authentication Middleware
 * Validates JWT tokens and sets user context for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip authentication for development
    if (process.env.NODE_ENV === "development") {
      req.user = {
        id: 'dev-user',
        email: 'dev@example.com',
        tenantId: 'dev-tenant',
        role: 'admin',
        tenant: {
          industry: 'General',
          name: 'Dev Tenant'
        }
      };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid access token'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: {
          select: {
            industry: true,
            name: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        message: 'Your account is not active or has been disabled'
      });
    }

    // Set user context
    req.user = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      tenant: user.tenant ? {
        industry: user.tenant.industry,
        name: user.tenant.name
      } : undefined
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }

    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Export alias for backward compatibility
export const authenticateToken = authMiddleware;
