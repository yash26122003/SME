import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateToken, requireRole } from '../middleware/auth';
import { CircuitBreaker } from '../utils/circuitBreaker';

const router = Router();

// Service endpoints configuration
const services = {
  userManagement: process.env.USER_MANAGEMENT_URL || 'http://localhost:3002',
  dataProcessing: process.env.DATA_PROCESSING_URL || 'http://localhost:3003',
  aiMl: process.env.AI_ML_URL || 'http://localhost:3004',
  reporting: process.env.REPORTING_URL || 'http://localhost:3005'
};

// Circuit breakers for each service
const circuitBreakers = {
  userManagement: new CircuitBreaker({ timeout: 5000, errorThreshold: 5, resetTimeout: 30000 }),
  dataProcessing: new CircuitBreaker({ timeout: 10000, errorThreshold: 3, resetTimeout: 60000 }),
  aiMl: new CircuitBreaker({ timeout: 15000, errorThreshold: 3, resetTimeout: 60000 }),
  reporting: new CircuitBreaker({ timeout: 8000, errorThreshold: 5, resetTimeout: 45000 })
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      userManagement: circuitBreakers.userManagement.getState(),
      dataProcessing: circuitBreakers.dataProcessing.getState(),
      aiMl: circuitBreakers.aiMl.getState(),
      reporting: circuitBreakers.reporting.getState()
    }
  });
});

// User Management Service routes (public endpoints)
router.use('/api/v1/auth', createProxyMiddleware({
  target: services.userManagement,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/auth': '/auth' },
  onProxyReq: (proxyReq, req) => {
    circuitBreakers.userManagement.execute(() => Promise.resolve());
  }
}));

// User Management Service routes (protected endpoints)
router.use('/api/v1/users', 
  authenticateToken,
  createProxyMiddleware({
    target: services.userManagement,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/users': '/users' },
    onProxyReq: (proxyReq, req) => {
      circuitBreakers.userManagement.execute(() => Promise.resolve());
      // Forward user info in headers
      if ((req as any).user) {
        proxyReq.setHeader('x-user-id', (req as any).user.userId);
        proxyReq.setHeader('x-user-role', (req as any).user.role);
        proxyReq.setHeader('x-organization-id', (req as any).user.organizationId);
      }
    }
  })
);

// Data Processing Service routes
router.use('/api/v1/data', 
  authenticateToken,
  requireRole(['admin', 'analyst']),
  createProxyMiddleware({
    target: services.dataProcessing,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/data': '/data' },
    onProxyReq: (proxyReq, req) => {
      circuitBreakers.dataProcessing.execute(() => Promise.resolve());
      if ((req as any).user) {
        proxyReq.setHeader('x-user-id', (req as any).user.userId);
        proxyReq.setHeader('x-user-role', (req as any).user.role);
        proxyReq.setHeader('x-organization-id', (req as any).user.organizationId);
      }
    }
  })
);

// AI/ML Service routes
router.use('/api/v1/ai', 
  authenticateToken,
  createProxyMiddleware({
    target: services.aiMl,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/ai': '/ai' },
    onProxyReq: (proxyReq, req) => {
      circuitBreakers.aiMl.execute(() => Promise.resolve());
      if ((req as any).user) {
        proxyReq.setHeader('x-user-id', (req as any).user.userId);
        proxyReq.setHeader('x-user-role', (req as any).user.role);
        proxyReq.setHeader('x-organization-id', (req as any).user.organizationId);
      }
    }
  })
);

// Reporting Service routes
router.use('/api/v1/reports', 
  authenticateToken,
  createProxyMiddleware({
    target: services.reporting,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/reports': '/reports' },
    onProxyReq: (proxyReq, req) => {
      circuitBreakers.reporting.execute(() => Promise.resolve());
      if ((req as any).user) {
        proxyReq.setHeader('x-user-id', (req as any).user.userId);
        proxyReq.setHeader('x-user-role', (req as any).user.role);
        proxyReq.setHeader('x-organization-id', (req as any).user.organizationId);
      }
    }
  })
);

export default router;
