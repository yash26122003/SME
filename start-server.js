const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import our analytics routes
const realAnalyticsRoutes = require('./dist/server/routes/realAnalytics.js');

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Business AI Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock authentication middleware for testing
app.use((req, res, next) => {
  // Add mock user for testing
  req.user = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'admin',
    organizationId: 'test-org-123'
  };
  next();
});

// Try to mount our real analytics routes
try {
  app.use('/api/v1/real-analytics', realAnalyticsRoutes.default || realAnalyticsRoutes);
  console.log('✅ Real analytics routes loaded');
} catch (error) {
  console.log('⚠️  Real analytics routes not available:', error.message);
  
  // Fallback test route
  app.get('/api/v1/real-analytics/health', (req, res) => {
    res.json({ 
      status: 'healthy but fallback', 
      message: 'Analytics routes not compiled yet',
      timestamp: new Date().toISOString()
    });
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Business AI Platform server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧠 Real Analytics: http://localhost:${PORT}/api/v1/real-analytics/health`);
});
