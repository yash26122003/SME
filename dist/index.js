"use strict";
/**
 * Express Server Setup
 * Main server file for the AI-powered Business Intelligence Platform
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_js_1 = require("./config/logger.js");
const queryRoutes_js_1 = __importDefault(require("./routes/queryRoutes.js"));
const realAnalytics_1 = __importDefault(require("./routes/realAnalytics"));
const rateLimit_js_1 = require("./middleware/rateLimit.js");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
// General middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Apply general rate limiting
app.use(rateLimit_js_1.generalRateLimit);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Business AI Platform API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// API routes
app.use('/api/queries', queryRoutes_js_1.default);
app.use('/api/v1/real-analytics', realAnalytics_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `${req.method} ${req.originalUrl} not found`
    });
});
// Global error handler
app.use((error, req, res, next) => {
    logger_js_1.logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
    });
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// Start server
const server = app.listen(PORT, () => {
    logger_js_1.logger.info(`🚀 Business AI Platform server running on port ${PORT}`);
    logger_js_1.logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_js_1.logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_js_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_js_1.logger.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_js_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_js_1.logger.info('Process terminated');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map