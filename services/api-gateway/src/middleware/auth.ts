import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const TokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'analyst', 'viewer']),
  organizationId: z.string(),
  iat: z.number(),
  exp: z.number()
});

export interface AuthenticatedRequest extends Request {
  user?: z.infer<typeof TokenPayloadSchema>;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const validatedPayload = TokenPayloadSchema.parse(decoded);
    req.user = validatedPayload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    if (error instanceof z.ZodError) {
      res.status(403).json({ error: 'Invalid token payload', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Token verification failed' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireOrganization = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const organizationId = req.params.organizationId || req.headers['x-organization-id'];
  
  if (organizationId && organizationId !== req.user.organizationId) {
    res.status(403).json({ error: 'Organization access denied' });
    return;
  }

  next();
};
